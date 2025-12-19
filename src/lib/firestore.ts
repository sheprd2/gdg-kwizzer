import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  setDoc,
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore'
import { db } from '../firebase.config'
import { Quiz, Game, Question, Player, Answer, LeaderboardEntry } from '../types/firebase'

function normalizeFirestoreDate(value: unknown): Date | undefined {
  if (!value) return undefined
  if (value instanceof Date) return value
  const maybeTimestamp = value as { toDate?: () => Date }
  if (typeof maybeTimestamp.toDate === 'function') return maybeTimestamp.toDate()
  return undefined
}

function normalizeQuiz(raw: Quiz): Quiz {
  return {
    ...raw,
    createdAt: normalizeFirestoreDate((raw as any).createdAt) ?? new Date(),
    updatedAt: normalizeFirestoreDate((raw as any).updatedAt) ?? new Date(),
  }
}

function normalizeGame(raw: Game): Game {
  return {
    ...raw,
    startedAt: normalizeFirestoreDate((raw as any).startedAt),
    endedAt: normalizeFirestoreDate((raw as any).endedAt),
  }
}

function normalizePlayer(raw: Player): Player {
  return {
    ...raw,
    joinedAt: normalizeFirestoreDate((raw as any).joinedAt) ?? new Date(),
    lastAnsweredAt: normalizeFirestoreDate((raw as any).lastAnsweredAt),
  }
}

export const firestoreService = {
  // Quiz operations
  async createQuiz(quiz: Omit<Quiz, 'id' | 'createdAt' | 'updatedAt'>) {
    console.log('[Firestore] Creating quiz:', quiz.title)
    try {
      const docRef = await addDoc(collection(db, 'quizzes'), {
        ...quiz,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      })
      console.log('[Firestore] Quiz created with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('[Firestore] Error creating quiz:', error)
      throw error
    }
  },

  async getQuiz(quizId: string): Promise<Quiz | null> {
    console.log('[Firestore] Getting quiz:', quizId)
    try {
      const docSnap = await getDoc(doc(db, 'quizzes', quizId))
      if (docSnap.exists()) {
        console.log('[Firestore] Quiz found:', quizId)
        const quiz = { id: docSnap.id, ...docSnap.data() } as Quiz
        return normalizeQuiz(quiz)
      }
      console.log('[Firestore] Quiz not found:', quizId)
      return null
    } catch (error) {
      console.error('[Firestore] Error getting quiz:', error)
      throw error
    }
  },

  async getQuizzesByCreator(creatorId: string): Promise<Quiz[]> {
    console.log('[Firestore] Getting quizzes by creator:', creatorId)
    try {
      const q = query(
        collection(db, 'quizzes'),
        where('createdBy', '==', creatorId)
      )
      const querySnapshot = await getDocs(q)
      const quizzes = querySnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }) as Quiz)
        .map(normalizeQuiz)
      console.log('[Firestore] Found', quizzes.length, 'quizzes')
      return quizzes
    } catch (error) {
      console.error('[Firestore] Error getting quizzes:', error)
      throw error
    }
  },

  async updateQuiz(quizId: string, updates: Partial<Quiz>) {
    await updateDoc(doc(db, 'quizzes', quizId), {
      ...updates,
      updatedAt: serverTimestamp()
    })
  },

  async deleteQuiz(quizId: string) {
    await deleteDoc(doc(db, 'quizzes', quizId))
  },

  // Game operations
  async createGame(game: Omit<Game, 'id' | 'startedAt' | 'endedAt'>) {
    console.log('[Firestore] Creating game for quiz:', game.quizId)
    try {
      const docRef = await addDoc(collection(db, 'games'), {
        ...game,
        startedAt: serverTimestamp()
      })
      console.log('[Firestore] Game created with ID:', docRef.id)
      return docRef.id
    } catch (error) {
      console.error('[Firestore] Error creating game:', error)
      throw error
    }
  },

  async getGame(gameId: string): Promise<Game | null> {
    console.log('[Firestore] Getting game:', gameId)
    try {
      const docSnap = await getDoc(doc(db, 'games', gameId))
      if (docSnap.exists()) {
        console.log('[Firestore] Game found:', gameId)
        const game = { id: docSnap.id, ...docSnap.data() } as Game
        return normalizeGame(game)
      }
      console.log('[Firestore] Game not found:', gameId)
      return null
    } catch (error) {
      console.error('[Firestore] Error getting game:', error)
      throw error
    }
  },

  async getGameByJoinCode(joinCode: string): Promise<Game | null> {
    console.log('[Firestore] Getting game by join code:', joinCode)
    try {
      const q = query(
        collection(db, 'games'),
        where('joinCode', '==', joinCode),
        limit(1)
      )
      const querySnapshot = await getDocs(q)
      if (querySnapshot.empty) {
        console.log('[Firestore] No game found with join code:', joinCode)
        return null
      }
      const gameDoc = querySnapshot.docs[0]
      console.log('[Firestore] Game found with join code:', joinCode)
      const game = { id: gameDoc.id, ...gameDoc.data() } as Game
      return normalizeGame(game)
    } catch (error) {
      console.error('[Firestore] Error getting game by join code:', error)
      throw error
    }
  },

  async updateGame(gameId: string, updates: Partial<Game>) {
    console.log('[Firestore] Updating game:', gameId)
    try {
      await updateDoc(doc(db, 'games', gameId), updates)
      console.log('[Firestore] Game updated:', gameId)
    } catch (error) {
      console.error('[Firestore] Error updating game:', error)
      throw error
    }
  },

  // Player operations
  async addPlayerToGame(gameId: string, player: Player) {
    console.log('[Firestore] Adding player to game:', gameId, player.name)
    try {
      const playerRef = doc(db, 'games', gameId, 'players', player.id)
      await setDoc(playerRef, player)
      console.log('[Firestore] Player added to game:', player.name)
    } catch (error) {
      console.error('[Firestore] Error adding player to game:', error)
      throw error
    }
  },

  async getGamePlayers(gameId: string): Promise<Player[]> {
    console.log('[Firestore] Getting players for game:', gameId)
    try {
      const playersRef = collection(db, 'games', gameId, 'players')
      const querySnapshot = await getDocs(playersRef)
      const players = querySnapshot.docs
        .map(doc => ({ ...doc.data() }) as Player)
        .map(normalizePlayer)
      console.log('[Firestore] Found', players.length, 'players')
      return players
    } catch (error) {
      console.error('[Firestore] Error getting players:', error)
      throw error
    }
  },

  async updatePlayerScore(gameId: string, playerId: string, score: number) {
    console.log('[Firestore] Updating player score:', playerId, 'to', score)
    try {
      const playerRef = doc(db, 'games', gameId, 'players', playerId)
      await updateDoc(playerRef, { score })
      console.log('[Firestore] Player score updated')
    } catch (error) {
      console.error('[Firestore] Error updating player score:', error)
      throw error
    }
  },

  // Answer operations
  async submitAnswer(gameId: string, questionIndex: number, answer: Answer) {
    console.log('[Firestore] Submitting answer for game:', gameId, 'question:', questionIndex)
    try {
      const answerRef = doc(db, 'games', gameId, 'answers', `question-${questionIndex}`)
      const docSnap = await getDoc(answerRef)
      
      if (docSnap.exists()) {
        await updateDoc(answerRef, {
          [answer.playerId]: answer
        })
      } else {
        await setDoc(answerRef, {
          [answer.playerId]: answer
        })
      }
      console.log('[Firestore] Answer submitted successfully')
    } catch (error) {
      console.error('[Firestore] Error submitting answer:', error)
      throw error
    }
  },

  async getQuestionAnswers(gameId: string, questionIndex: number): Promise<Answer[]> {
    const docSnap = await getDoc(doc(db, 'games', gameId, 'answers', `question-${questionIndex}`))
    if (!docSnap.exists()) return []
    
    const answersData = docSnap.data()
    return Object.entries(answersData).map(([playerId, answer]) => ({
      playerId,
      questionIndex,
      ...(answer as any)
    }))
  },

  // Leaderboard operations
  async updateLeaderboard(gameId: string, entries: LeaderboardEntry[]) {
    console.log('[Firestore] Updating leaderboard for game:', gameId)
    try {
      const leaderboardRef = doc(db, 'games', gameId, 'leaderboard', 'current')
      const docSnap = await getDoc(leaderboardRef)
      
      if (docSnap.exists()) {
        await updateDoc(leaderboardRef, {
          entries,
          updatedAt: serverTimestamp()
        })
      } else {
        await setDoc(leaderboardRef, {
          entries,
          updatedAt: serverTimestamp()
        })
      }
      console.log('[Firestore] Leaderboard updated')
    } catch (error) {
      console.error('[Firestore] Error updating leaderboard:', error)
      throw error
    }
  },

  async getLeaderboard(gameId: string): Promise<LeaderboardEntry[]> {
    console.log('[Firestore] Getting leaderboard for game:', gameId)
    try {
      const docSnap = await getDoc(doc(db, 'games', gameId, 'leaderboard', 'current'))
      const entries = docSnap.exists() ? docSnap.data().entries || [] : []
      console.log('[Firestore] Leaderboard entries:', entries.length)
      return entries
    } catch (error) {
      console.error('[Firestore] Error getting leaderboard:', error)
      return []
    }
  }
}
