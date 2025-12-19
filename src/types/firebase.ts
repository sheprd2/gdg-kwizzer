export interface Quiz {
  id: string
  title: string
  description?: string
  questions: Question[]
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: number
  timeLimit?: number
}

export interface Game {
  id: string
  joinCode: string
  quizId: string
  hostId: string
  phase: GamePhase
  currentQuestionIndex: number
  startedAt?: Date
  endedAt?: Date
  questionStartTime?: Date
  questionEndTime?: Date
  timeLeft?: number
  lastTimerUpdate?: Date
  settings: GameSettings
}

export type GamePhase = 'lobby' | 'questionLive' | 'results' | 'ended'

export interface GameSettings {
  questionTimeLimit: number
  showLeaderboard: boolean
  autoProgress: boolean
}

export interface Player {
  id: string
  name: string
  score: number
  joinedAt: Date
  lastAnsweredAt?: Date
}

export interface Answer {
  playerId: string
  questionIndex: number
  selectedOption: number
  answeredAt: Date
  isCorrect: boolean
}

export interface LeaderboardEntry {
  playerId: string
  playerName: string
  score: number
  rank: number
}

export interface User {
  uid: string
  email?: string
  displayName?: string
  createdAt: Date
  lastLogin?: Date
}
