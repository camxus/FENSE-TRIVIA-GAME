"use client"

import { useState, useEffect, useCallback } from "react"
import { getSocket } from "@/lib/socket-client"
import type { Socket } from "socket.io-client"

interface AnswerFeedback {
  letter: string | null
  index: number
}

interface Player {
  id: string
  name: string
  score: number
}

interface Question {
  id: string
  question: string
  category: string
  timeLimit: number
  answerLenght: number
}

type GameState = "lobby" | "waiting" | "playing" | "question-ended" | "new-category" | "game-ended" | "setup"

export enum GameModes {
  IN_PERSON = "in-person",
  ONLINE = "online"
}

export interface Reaction { id: string; emoji: string }

interface UseGameSocketReturn {
  gameState: GameState
  players: Player[]
  currentCategory: string | null
  currentQuestion: Question | null
  timerEndTime: number | null
  guess: string
  correctAnswer: string
  currentRoomId: string
  isCreator: boolean
  feedback: AnswerFeedback[] | null
  activeReactions: Reaction[]
  setGuess: (guess: string) => void
  createRoom: (playerName: string, mode: GameModes) => void
  joinRoom: (playerName: string, roomId: string) => void
  startGame: (roomId?: string) => void
  endQuestion: () => void
  nextQuestion: () => void
  queryAnswer: (guessValue: string) => void
  addPlayer: (playerName: string, roomId?: string) => void
  removePlayer: (playerId: string, roomId?: string) => void
  stopTimer: (roomId?: string) => void
  assignPoints: (selectedPlayerId: string, pointsToAssign: string, roomId?: string) => void
  sendReaction: (emoji: string, roomId?: string) => void
}

export function useGameSocket(): UseGameSocketReturn {
  const [gameState, setGameState] = useState<GameState>("lobby")
  const [players, setPlayers] = useState<Player[]>([])
  const [currentCategory, setCurrentCategory] = useState<string | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [timerEndTime, setTimerEndTime] = useState<number | null>(null)
  const [guess, setGuess] = useState("")
  const [correctAnswer, setCorrectAnswer] = useState("")
  const [currentRoomId, setCurrentRoomId] = useState("")
  const [isCreator, setIsCreator] = useState(false)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [feedback, setFeedback] = useState<AnswerFeedback[] | null>(null)
  const [activeReactions, setActiveReactions] = useState<Reaction[]>([])

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = getSocket()
    setSocket(socketInstance)

    // Set up all socket event listeners
    socketInstance.on("room-created", ({ roomId, room }) => {
      setCurrentRoomId(roomId)
      setPlayers(room.players)
      setGameState("waiting")
      setIsCreator(true)
    })

    socketInstance.on("room-joined", ({ room, question, category, timerEndTime }) => {
      setCurrentRoomId(room.id)
      setPlayers(room.players)

      if (room.isActive && question) {
        setTimerEndTime(timerEndTime)
        setCurrentCategory(category)
        setCurrentQuestion(question)
        setGameState("playing")
      } else {
        setGameState("waiting")
      }

      setIsCreator(false)
    })

    socketInstance.on("player-joined", ({ room }) => {
      setPlayers(room.players)
    })

    socketInstance.on("player-left", ({ room }) => {
      setPlayers(room.players)
    })

    socketInstance.on("game-started", ({ category, question, timerEndTime }) => {
      setCurrentCategory(category)
      setCurrentQuestion(question)
      setTimerEndTime(timerEndTime)
      setGameState("playing")
      setGuess("")
      setCorrectAnswer("")
    })

    socketInstance.on("guess-submitted", ({ playerName }) => {
      console.log(`${playerName} submitted their guess`)
    })

    socketInstance.on("question-ended", ({ correctAnswer, players }) => {
      setCorrectAnswer(correctAnswer)
      setPlayers(players)
      setGameState("question-ended")
    })

    socketInstance.on("category-ended", ({ nextCategory, players }) => {
      setCurrentCategory(nextCategory)
      setPlayers(players)
      setGameState("new-category")
    })

    socketInstance.on("next-question", ({ category, question, timerEndTime }) => {
      setCurrentCategory(category)
      setCurrentQuestion(question)
      setTimerEndTime(timerEndTime)
      setGameState("playing")
      setGuess("")
      setCorrectAnswer("")
    })

    socketInstance.on("game-ended", ({ players }) => {
      setPlayers(players)
      setGameState("game-ended")
    })

    socketInstance.on("timer-stopped", () => {
      setTimerEndTime(null)
    })

    socketInstance.on("error", ({ message }) => {
      alert(message)
    })

    socketInstance.on("answer-feedback", ({ feedback }: { feedback: AnswerFeedback[] }) => {
      console.log(feedback)
      setFeedback(feedback)
    })

    socketInstance.on("player-added", ({ room }) => {
      console.log("added")
      setPlayers(room.players)
    })


    socketInstance.on("player-removed", ({ room }) => {
      setPlayers(room.players)
    })


    socketInstance.on("points-updated", ({ players }) => {
      setPlayers(players)
    })

    socket?.off("reaction-received").on("reaction-received", ({ emoji, playerId }) => {
      const reactionId = `${playerId}-${Date.now()}`
      setActiveReactions((prev) => [...prev, { id: reactionId, emoji }])
      // Remove reaction after 2 seconds
      setTimeout(() => {
        setActiveReactions((prev) => prev.filter((r) => r.id !== reactionId))
      }, 2000)
    })


    // Clean up all listeners on unmount
    return () => {
      socketInstance.off("room-created")
      socketInstance.off("room-joined")
      socketInstance.off("player-joined")
      socketInstance.off("player-left")
      socketInstance.off("game-started")
      socketInstance.off("guess-submitted")
      socketInstance.off("question-ended")
      socketInstance.off("category-ended")
      socketInstance.off("next-question")
      socketInstance.off("game-ended")
      socketInstance.off("timer-stopped")
      socketInstance.off("error")
      socketInstance.off("answer-feedback")
      socketInstance.off("player-added")
      socketInstance.off("player-removed")
      socketInstance.off("points-updated")
    }
  }, [])

  // Create room function
  const createRoom = useCallback(
    (playerName: string, mode: GameModes) => {
      if (!socket || !playerName.trim()) return
      socket.emit("create-room", { mode, playerName: playerName.trim() })
    },
    [socket],
  )

  // Join room function
  const joinRoom = useCallback(
    (playerName: string, roomId: string) => {
      if (!socket || !playerName.trim() || !roomId.trim()) return
      socket.emit("join-room", { roomId: roomId.trim().toUpperCase(), playerName: playerName.trim() })
    },
    [socket],
  )

  // Start game function
  const startGame = useCallback((roomId = currentRoomId) => {
    if (!socket || !currentRoomId) return
    socket.emit("start-game", { roomId: roomId })
  }, [socket, currentRoomId])


  // End question function
  const endQuestion = useCallback(() => {
    if (!socket || !currentRoomId) return
    socket.emit("end-question", { roomId: currentRoomId })
  }, [socket, currentRoomId])

  // Next question function
  const nextQuestion = useCallback(() => {
    if (!socket || !currentRoomId) return
    socket.emit("next-question", { roomId: currentRoomId })
  }, [socket, currentRoomId])

  const queryAnswer = useCallback(
    (guessValue: string) => {
      if (!socket || !currentRoomId || !guessValue.trim()) return
      socket.emit("query-answer", { roomId: currentRoomId, guess: guessValue.trim() })
    },
    [socket, currentRoomId]
  )

  const addPlayer = (playerName: string, roomId = currentRoomId) => {
    if (!socket || !playerName.trim()) return
    socket.emit("add-player", { roomId, playerName: playerName.trim() })
  }

  const removePlayer = (playerId: string, roomId = currentRoomId) => {
    const socket = getSocket()
    socket.emit("remove-player", { roomId, playerId })
  }

  const stopTimer = (roomId = currentRoomId) => {
    const socket = getSocket()
    socket.emit("stop-timer", { roomId })
  }

  const assignPoints = (selectedPlayerId: string, pointsToAssign: string, roomId = currentRoomId) => {
    if (!selectedPlayerId || !pointsToAssign) return
    const socket = getSocket()
    socket.emit("assign-points", { roomId, playerId: selectedPlayerId, points: Number.parseInt(pointsToAssign) })
  }

  const sendReaction = (emoji: string, roomId = currentRoomId) => {
    socket?.emit("send-reaction", { emoji, roomId: roomId })
  }

  return {
    gameState,
    players,
    currentCategory,
    currentQuestion,
    timerEndTime,
    guess,
    correctAnswer,
    currentRoomId,
    isCreator,
    feedback,
    activeReactions,
    setGuess,
    createRoom,
    joinRoom,
    startGame,
    endQuestion,
    nextQuestion,
    queryAnswer,
    addPlayer,
    removePlayer,
    stopTimer,
    assignPoints,
    sendReaction
  }
}
