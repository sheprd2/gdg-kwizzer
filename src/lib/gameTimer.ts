import { doc, updateDoc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../firebase.config'
import { Game } from '../types/firebase'

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
   * Transition game to results phase
   */
  private static async transitionToResults(gameId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'games', gameId), {
        phase: 'results',
        timeLeft: 0,
        lastTimerUpdate: serverTimestamp()
      })
    } catch (error) {
      console.error('Error transitioning to results:', error)
    }
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
