import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../firebase.config'
import { Game, Quiz } from '../types/firebase'
import { firestoreService } from './firestore'

export class GameTimer {
  private static timers: Map<string, NodeJS.Timeout> = new Map()

  /**
   * Start a server-side timer for a question
   */
  static async startQuestionTimer(gameId: string, timeLimit: number): Promise<void> {
    // Clear any existing timer for this game
    this.clearTimer(gameId)

    // Update game document with timer info
    await updateDoc(doc(db, 'games', gameId), {
      phase: 'questionLive',
      questionStartTime: serverTimestamp(),
      questionEndTime: new Date(Date.now() + timeLimit * 1000),
      timeLeft: timeLimit,
      lastTimerUpdate: serverTimestamp()
    })

    // Start server-side countdown
    this.startServerCountdown(gameId, timeLimit)
  }

  /**
   * Start server-side countdown that updates the game document every second
   */
  private static startServerCountdown(gameId: string, timeLimit: number): void {
    let timeLeft = timeLimit

    const timer = setInterval(async () => {
      timeLeft--
      
      try {
        const gameRef = doc(db, 'games', gameId)
        const gameDoc = await getDoc(gameRef)
        
        if (!gameDoc.exists()) {
          this.clearTimer(gameId)
          return
        }

        const game = gameDoc.data() as Game
        
        // Stop timer if game phase changed
        if (game.phase !== 'questionLive') {
          this.clearTimer(gameId)
          return
        }

        // Update time left
        await updateDoc(gameRef, {
          timeLeft: Math.max(0, timeLeft),
          lastTimerUpdate: serverTimestamp()
        })

        // When timer reaches 0, transition to results phase
        if (timeLeft <= 0) {
          this.clearTimer(gameId)
          await this.transitionToResults(gameId)
        }
      } catch (error) {
        console.error('Error updating timer:', error)
        this.clearTimer(gameId)
      }
    }, 1000)

    this.timers.set(gameId, timer)
  }

  /**
   * Transition game to results phase and calculate scores automatically
   */
  private static async transitionToResults(gameId: string): Promise<void> {
    try {
      console.log('[GameTimer] Timer expired, calculating scores and transitioning to results')
      
      // Get game data to calculate scores
      const gameDoc = await getDoc(doc(db, 'games', gameId))
      if (!gameDoc.exists()) {
        console.error('[GameTimer] Game not found for score calculation')
        return
      }

      const game = gameDoc.data() as Game
      
      // Calculate scores for the current question
      await this.calculateAndUpdateScores(gameId, game.currentQuestionIndex || 0)
      
      // Update game phase to results
      await updateDoc(doc(db, 'games', gameId), {
        phase: 'results',
        timeLeft: 0,
        lastTimerUpdate: serverTimestamp()
      })
      
      console.log('[GameTimer] Successfully transitioned to results with updated scores')
    } catch (error) {
      console.error('[GameTimer] Error transitioning to results:', error)
    }
  }

  /**
   * Calculate and update scores for a specific question (public method for manual triggering)
   */
  static async calculateAndUpdateScores(gameId: string, questionIndex: number): Promise<void> {
    try {
      console.log(`[GameTimer] Calculating scores for question ${questionIndex}`)
      
      // Get quiz data for the current question
      const gameDoc = await getDoc(doc(db, 'games', gameId))
      if (!gameDoc.exists()) return
      
      const game = { id: gameDoc.id, ...gameDoc.data() } as Game
      const quizDoc = await getDoc(doc(db, 'quizzes', game.quizId))
      if (!quizDoc.exists()) return
      
      const quiz = { id: quizDoc.id, ...quizDoc.data() } as Quiz
      const questions = quiz.questions || []
      const question = questions[questionIndex]
      
      if (!question) {
        console.error(`[GameTimer] Question ${questionIndex} not found`)
        return
      }

      // Get all answers for this question
      const answers = await firestoreService.getQuestionAnswers(gameId, questionIndex)
      const currentPlayers = await firestoreService.getGamePlayers(gameId)
      
      console.log(`[GameTimer] Found ${answers.length} answers and ${currentPlayers.length} players`)
      console.log(`[GameTimer] Answers:`, answers.map(a => ({ playerId: a.playerId, selectedOption: a.selectedOption })))
      console.log(`[GameTimer] Players:`, currentPlayers.map(p => ({ id: p.id, name: p.name, score: p.score })))
      
      // Get question start time
      const questionStartTime = game.questionStartTime || 
        new Date(Date.now() - (question.timeLimit || 30) * 1000)

      // Calculate and update scores for correct answers
      for (const answer of answers) {
        if (answer.selectedOption === question.correctAnswer) {
          const player = currentPlayers.find((p) => p.id === answer.playerId)
          if (player) {
            const points = this.calculatePoints(
              answer.answeredAt,
              questionStartTime,
              question.timeLimit || 30
            )
            const newScore = (player.score || 0) + points
            
            await firestoreService.updatePlayerScore(gameId, answer.playerId, newScore)
            
            console.log(
              `[GameTimer] Player ${player.name} earned ${points} points (base: 100, time bonus: ${points - 100})`
            )
          }
        }
      }

      // Update leaderboard with new scores
      const updatedPlayers = await firestoreService.getGamePlayers(gameId)
      console.log(`[GameTimer] Updated players after score calculation:`, updatedPlayers.map(p => ({ id: p.id, name: p.name, score: p.score })))
      
      const leaderboardEntries = updatedPlayers
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .map((p, i) => ({
          playerId: p.id,
          playerName: p.name,
          score: p.score || 0,
          rank: i + 1,
        }))

      console.log(`[GameTimer] Leaderboard entries to update:`, leaderboardEntries)
      await firestoreService.updateLeaderboard(gameId, leaderboardEntries)
      console.log(`[GameTimer] Updated leaderboard with ${leaderboardEntries.length} entries`)
      
    } catch (error) {
      console.error('[GameTimer] Error calculating scores:', error)
    }
  }

  /**
   * Calculate points based on answer speed (same logic as admin host)
   */
  private static calculatePoints(
    answerTime: Date | any,
    questionStartTime: Date | any,
    timeLimit: number
  ): number {
    // Convert Firestore Timestamps to Date if needed
    const answerDate = answerTime?.toDate
      ? answerTime.toDate()
      : new Date(answerTime)
    const startDate = questionStartTime?.toDate
      ? questionStartTime.toDate()
      : new Date(questionStartTime)

    const answerDuration = answerDate.getTime() - startDate.getTime()
    const maxTime = timeLimit * 1000 // Convert to milliseconds

    // Base points for correct answer
    const basePoints = 100

    // Time bonus: faster answers get more points
    const timeRatio = Math.max(0, Math.min(1, 1 - answerDuration / maxTime))
    const timeBonus = Math.round(timeRatio * 50)

    return basePoints + timeBonus
  }

  /**
   * Clear timer for a game
   */
  static clearTimer(gameId: string): void {
    const timer = this.timers.get(gameId)
    if (timer) {
      clearInterval(timer)
      this.timers.delete(gameId)
    }
  }

  /**
   * Calculate time left based on server timestamp
   */
  static calculateTimeLeft(questionEndTime?: Date): number {
    if (!questionEndTime) return 0
    
    const now = Date.now()
    const endTime = questionEndTime instanceof Date ? questionEndTime.getTime() : new Date(questionEndTime).getTime()
    const timeLeft = Math.max(0, Math.ceil((endTime - now) / 1000))
    
    return timeLeft
  }

  /**
   * Get synchronized time for all clients
   */
  static getSynchronizedTime(): number {
    return Date.now()
  }
}
