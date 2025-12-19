import { firestoreService } from './firestore'
import { Quiz, Game, Player, Answer, LeaderboardEntry } from '../types/firebase'

export class ScoringService {
  static async calculateQuestionScores(
    gameId: string,
    questionIndex: number,
    quiz: Quiz,
    players: Player[]
  ): Promise<Player[]> {
    const answers = await firestoreService.getQuestionAnswers(gameId, questionIndex)
    const question = quiz.questions[questionIndex]
    
    const updatedPlayers = [...players]
    
    answers.forEach(answer => {
      const isCorrect = answer.selectedOption === question.correctAnswer
      
      if (isCorrect) {
        const playerIndex = updatedPlayers.findIndex(p => p.id === answer.playerId)
        if (playerIndex !== -1) {
          const timeBonus = this.calculateTimeBonus(answer, question.timeLimit || 30)
          updatedPlayers[playerIndex].score += 100 + timeBonus
          updatedPlayers[playerIndex].lastAnsweredAt = answer.answeredAt
        }
      }
    })
    
    for (const player of updatedPlayers) {
      await firestoreService.updatePlayerScore(gameId, player.id, player.score)
    }
    
    return updatedPlayers
  }
  
  static calculateTimeBonus(answer: Answer, timeLimit: number): number {
    if (!answer.answeredAt) return 0
    
    const answerTime = answer.answeredAt.getTime()
    const questionStartTime = answerTime - (timeLimit * 1000)
    const timeTaken = Math.min(answerTime - questionStartTime, timeLimit * 1000)
    const timeRemaining = Math.max(0, timeLimit * 1000 - timeTaken)
    
    return Math.round((timeRemaining / (timeLimit * 1000)) * 50)
  }
  
  static async generateLeaderboard(
    gameId: string,
    players: Player[]
  ): Promise<LeaderboardEntry[]> {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)
    
    const leaderboard: LeaderboardEntry[] = sortedPlayers.map((player, index) => ({
      playerId: player.id,
      playerName: player.name,
      score: player.score,
      rank: index + 1
    }))
    
    await firestoreService.updateLeaderboard(gameId, leaderboard)
    
    return leaderboard
  }
  
  static async finalizeGameScores(
    gameId: string,
    quiz: Quiz
  ): Promise<LeaderboardEntry[]> {
    let players = await firestoreService.getGamePlayers(gameId)
    
    for (let i = 0; i < quiz.questions.length; i++) {
      players = await this.calculateQuestionScores(gameId, i, quiz, players)
    }
    
    return this.generateLeaderboard(gameId, players)
  }
  
  static getPlayerRank(leaderboard: LeaderboardEntry[], playerId: string): number {
    const entry = leaderboard.find(entry => entry.playerId === playerId)
    return entry ? entry.rank : 0
  }
  
  static getTopPlayers(leaderboard: LeaderboardEntry[], count: number = 3): LeaderboardEntry[] {
    return leaderboard.slice(0, count)
  }
  
  static calculateScoreDistribution(leaderboard: LeaderboardEntry[]): {
    ranges: string[]
    counts: number[]
  } {
    const ranges = ['0-100', '101-200', '201-300', '301-400', '400+']
    const counts = [0, 0, 0, 0, 0]
    
    leaderboard.forEach(entry => {
      const score = entry.score
      if (score <= 100) counts[0]++
      else if (score <= 200) counts[1]++
      else if (score <= 300) counts[2]++
      else if (score <= 400) counts[3]++
      else counts[4]++
    })
    
    return { ranges, counts }
  }
}
