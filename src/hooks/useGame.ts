'use client'

import { useEffect, useState } from 'react'
import { doc, onSnapshot, updateDoc, arrayUnion, arrayRemove, collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase.config'
import { Game, Player, Answer, LeaderboardEntry } from '../types/firebase'

export function useGame(gameId: string) {
  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!gameId) return

    const unsubscribeGame = onSnapshot(doc(db, 'games', gameId), (doc) => {
      if (doc.exists()) {
        setGame({ id: doc.id, ...doc.data() } as Game)
      } else {
        setGame(null)
      }
      setLoading(false)
    })

    const unsubscribePlayers = onSnapshot(
      collection(db, 'games', gameId, 'players'),
      (snapshot) => {
        const playersList = snapshot.docs.map(doc => ({ ...doc.data() }) as Player)
        console.log('[useGame] Players updated:', playersList.map(p => p.name))
        setPlayers(playersList)
      }
    )

    return () => {
      unsubscribeGame()
      unsubscribePlayers()
    }
  }, [gameId])

  return { game, players, loading }
}

export function useGameAnswers(gameId: string, questionIndex: number) {
  const [answers, setAnswers] = useState<Answer[]>([])

  useEffect(() => {
    if (!gameId || questionIndex === undefined) return

    const unsubscribe = onSnapshot(
      doc(db, 'games', gameId, 'answers', `question-${questionIndex}`),
      (doc) => {
        if (doc.exists()) {
          const answersData = doc.data()
          const answersList = Object.entries(answersData).map(([playerId, answer]) => ({
            playerId,
            questionIndex,
            ...(answer as any)
          }))
          setAnswers(answersList)
        } else {
          setAnswers([])
        }
      }
    )

    return () => unsubscribe()
  }, [gameId, questionIndex])

  return answers
}

export function useLeaderboard(gameId: string) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])

  useEffect(() => {
    if (!gameId) return

    console.log('[useLeaderboard] Subscribing to leaderboard for game:', gameId)
    const unsubscribe = onSnapshot(
      doc(db, 'games', gameId, 'leaderboard', 'current'),
      (doc) => {
        if (doc.exists()) {
          const entries = doc.data().entries || []
          console.log('[useLeaderboard] Leaderboard updated:', entries.length, 'entries')
          setLeaderboard(entries)
        } else {
          console.log('[useLeaderboard] No leaderboard document found')
          setLeaderboard([])
        }
      },
      (error) => {
        console.error('[useLeaderboard] Error:', error)
      }
    )

    return () => unsubscribe()
  }, [gameId])

  return leaderboard
}

export async function joinGame(gameId: string, playerId: string, playerName: string) {
  const gameRef = doc(db, 'games', gameId)
  const playersRef = doc(db, 'games', gameId, 'players', 'list')
  
  const newPlayer: Player = {
    id: playerId,
    name: playerName,
    score: 0,
    joinedAt: new Date()
  }

  await updateDoc(playersRef, {
    players: arrayUnion(newPlayer)
  })
}

export async function submitAnswer(
  gameId: string,
  playerId: string,
  questionIndex: number,
  selectedOption: number
) {
  const answerRef = doc(db, 'games', gameId, 'answers', `question-${questionIndex}`)
  
  const answer: Answer = {
    playerId,
    questionIndex,
    selectedOption,
    answeredAt: new Date(),
    isCorrect: false // Will be calculated by admin/cloud function
  }

  await updateDoc(answerRef, {
    [playerId]: answer
  })
}

export async function updateGamePhase(gameId: string, phase: Game['phase']) {
  const gameRef = doc(db, 'games', gameId)
  await updateDoc(gameRef, { phase })
}

export async function nextQuestion(gameId: string, currentQuestionIndex: number) {
  const gameRef = doc(db, 'games', gameId)
  await updateDoc(gameRef, {
    currentQuestionIndex: currentQuestionIndex + 1,
    phase: 'questionLive'
  })
}
