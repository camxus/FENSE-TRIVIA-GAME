import type { Server as HTTPServer } from "http"
import { Server as SocketIOServer, type Socket } from "socket.io"
import { collection, getDocs, getFirestore } from "firebase/firestore";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import dotenv from 'dotenv';

dotenv.config();

export interface Player {
  id: string
  name: string
  score: number
}

export interface Room {
  id: string
  mode: "online" | "in-person"
  players: Player[]
  currentCategoryIndex: number | null
  currentQuestionIndex: number | null
  isActive: boolean
  leaderId?: string
  timerEndTime?: number
  guesses: Record<string, { value: string, endTime: number }>
  questions: Category[] | null
}

export interface Question {
  id: string
  question: string
  answer: string
  timeLimit: number
}

export interface Category {
  categoryName: string
  questions: Question[]
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string | null // null = system
  senderName: string
  message: string
  timestamp: number
}

let QUESTIONS: Category[] = []

const rooms = new Map<string, Room>()

export async function initializeSocketServer(httpServer: HTTPServer) {
  QUESTIONS = await fetchQuestionsFromFirestore()

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket: Socket) => {
    // Create or join room
    socket.on("create-room", ({ mode, playerName }: { mode: "online" | "in-person"; playerName: string }) => {
      const roomId = generateRoomCode()
      const player: Player = { id: socket.id, name: playerName, score: 0 }

      const room: Room = {
        id: roomId,
        mode,
        players: [player],
        currentCategoryIndex: null,
        currentQuestionIndex: null,
        isActive: false,
        leaderId: mode === "in-person" ? socket.id : undefined,
        guesses: {},
        questions: null
      }

      rooms.set(roomId, room)
      socket.join(roomId)

      socket.emit("room-created", { roomId, room })
    })

    socket.on("join-room", ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      const room = rooms.get(roomId)

      if (!room) {
        socket.emit("error", { message: "Room not found" })
        return
      }

      const player: Player = { id: socket.id, name: playerName, score: 0 }
      room.players.push(player)

      const category = getCategory(room.questions, room.currentCategoryIndex)
      const question = getQuestion(room.questions, room.currentCategoryIndex, room.currentQuestionIndex)

      socket.join(roomId)
      io.to(roomId).emit("player-joined", { player, room })
      socket.emit("room-joined", {
        room,
        category: category?.categoryName,
        question: { ...question, answer: undefined, answerLenght: question?.answer.length },
        timerEndTime: room.timerEndTime,
      })

      io.to(roomId).emit("chat-message", {
        id: crypto.randomUUID(),
        roomId,
        senderId: null,
        senderName: "System",
        message: `${playerName} joined the room`,
        timestamp: Date.now(),
      } satisfies ChatMessage)
    })

    // Start game
    socket.on("start-game", ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId)
      if (!room) return

      room.isActive = true
      room.currentCategoryIndex = 0
      room.currentQuestionIndex = -1
      room.guesses = {}
      room.questions = getRoomQuestions(QUESTIONS)

      const category = getCategory(room.questions, room.currentCategoryIndex)

      io.to(roomId).emit("game-started", {
        category: category?.categoryName,
      })
    })

    function endQuestion(roomId: string) {
      const room = rooms.get(roomId)
      if (!room) return

      const question = getQuestion(room.questions, room.currentCategoryIndex, room.currentQuestionIndex)
      if (!question) return

      const correctAnswer = question.answer.toUpperCase()

      if (room.mode === "online") {
        Object.entries(room.guesses).forEach(([playerId, guess]) => {
          if (guess.value === correctAnswer) {
            const player = room.players.find((p) => p.id === playerId)
            if (player) {
              const timeBonus = Math.max(
                0,
                Math.floor((guess.endTime!) / 1000)
              )
              player.score += 100 + timeBonus * 10
            }
          }
        })
      }

      io.to(roomId).emit("question-ended", {
        correctAnswer,
        guesses: room.guesses,
        players: room.players,
      })

      room.guesses = {}
    }

    socket.on("end-question", ({ roomId }) => {
      endQuestion(roomId)
    })

    // Next question
    socket.on("next-question", ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId)
      if (!room) return
      if (room.currentQuestionIndex === null || room.currentCategoryIndex === null) return

      const nextCategoryIndex = room.currentCategoryIndex + 1;
      const nextQuestionIndex = room.currentQuestionIndex + 1;

      const nextQuestion = getQuestion(room.questions, room.currentCategoryIndex, nextQuestionIndex);

      if (!!nextQuestion) {
        room.currentQuestionIndex = nextQuestionIndex;
      } else {
        const nextCategory = getCategory(room.questions, nextCategoryIndex);

        io.to(roomId).emit("category-ended", {
          players: room.players,
          nextCategory: nextCategory?.categoryName || null,
        });

        room.currentCategoryIndex = nextCategoryIndex;
        room.currentQuestionIndex = -1;

        if (!nextCategory) {
          room.currentCategoryIndex = null;
          room.currentQuestionIndex = null;
          room.isActive = false;

          io.to(roomId).emit("game-ended", { players: room.players });
          return;
        }

        return;
      }

      const category = getCategory(room.questions, room.currentCategoryIndex)
      const question = getQuestion(room.questions, room.currentCategoryIndex, room.currentQuestionIndex)

      if (!question) return

      room.timerEndTime = Date.now() + question.timeLimit * 1000

      io.to(roomId).emit("next-question", {
        category: category?.categoryName,
        question: { ...question, answer: undefined, answerLenght: question.answer.length },
        timerEndTime: room.timerEndTime,
      })
    })

    // In-person mode: manual point assignment
    socket.on("assign-points", ({ roomId, playerId, points }: { roomId: string; playerId: string; points: number }) => {
      const room = rooms.get(roomId)
      if (!room || room.mode !== "in-person" || socket.id !== room.leaderId) return

      const player = room.players.find((p) => p.id === playerId)
      if (player) {
        player.score += points
        io.to(roomId).emit("points-updated", { players: room.players })
      }
    })

    // In-person mode: add/remove players
    socket.on("add-player", ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      const room = rooms.get(roomId)
      if (!room || room.mode !== "in-person" || socket.id !== room.leaderId) return

      const player: Player = { id: generatePlayerId(), name: playerName, score: 0 }
      room.players.push(player)

      io.to(roomId).emit("player-added", { player, room })
    })

    socket.on("remove-player", ({ roomId, playerId }: { roomId: string; playerId: string }) => {
      const room = rooms.get(roomId)
      if (!room || room.mode !== "in-person" || socket.id !== room.leaderId) return

      room.players = room.players.filter((p) => p.id !== playerId)
      io.to(roomId).emit("player-removed", { playerId, room })
    })

    // Stop timer
    socket.on("stop-timer", ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId)
      if (!room) return

      io.to(roomId).emit("timer-stopped")
    })

    socket.on("disconnect", () => {
      // Remove player from rooms
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex((p) => p.id === socket.id)
        if (playerIndex !== -1) {
          io.to(roomId).emit("chat-message", {
            id: crypto.randomUUID(),
            roomId,
            senderId: null,
            senderName: "System",
            message: `${room.players[playerIndex].name} left the room`,
            timestamp: Date.now(),
          } satisfies ChatMessage)

          room.players.splice(playerIndex, 1)
          io.to(roomId).emit("player-left", { playerId: socket.id, room })

          // Delete room if empty
          if (room.players.length === 0) {
            rooms.delete(roomId)
          }
        }
      })
    })

    // Query answer - Wordle-style feedback
    socket.on(
      "query-answer",
      ({ roomId, guess }: { roomId: string; guess: string }) => {
        const room = rooms.get(roomId)
        if (!room || !room.isActive) return

        const question = getQuestion(room.questions, room.currentCategoryIndex, room.currentQuestionIndex)
        if (!question) return

        const correctAnswer = question.answer.toUpperCase()
        guess = guess.toUpperCase()

        const feedback: { letter: string | null; index: number }[] = []

        let isCorrect = guess === correctAnswer

        // Wordle-style feedback
        for (let i = 0; i < guess.length; i++) {
          if (guess[i] === correctAnswer[i]) {
            feedback.push({ letter: guess[i], index: i })
          } else if (correctAnswer.includes(guess[i])) {
            feedback.push({ letter: null, index: i })
          }
        }

        // Store guess
        if (isCorrect) room.guesses[socket.id] = { value: guess, endTime: +room.timerEndTime! - Date.now() }

        socket.emit("answer-feedback", { feedback })

        // have all players guessed correctly?
        const allCorrect = room.players.every(
          (player) => room.guesses[player.id]?.value === correctAnswer
        )

        if (allCorrect) {
          endQuestion(roomId)
        }
      }
    )
    // Player sends a reaction
    socket.on("send-reaction", ({ roomId, emoji }: { roomId: string; emoji: string }) => {
      const room = rooms.get(roomId)
      if (!room) return

      // Broadcast the reaction to everyone in the room
      io.to(roomId).emit("reaction-received", { playerId: socket.id, emoji })
    })

    socket.on(
      "send-chat-message",
      ({ roomId, message }: { roomId: string; message: string }) => {
        const room = rooms.get(roomId)
        if (!room) return

        const player = room.players.find((p) => p.id === socket.id)
        if (!player) return

        const chatMessage: ChatMessage = {
          id: crypto.randomUUID(),
          roomId,
          senderId: socket.id,
          senderName: player.name,
          message: message.trim(),
          timestamp: Date.now(),
        }

        io.to(roomId).emit("chat-message", chatMessage)
      }
    )

  })

  return io
}

function getCategory(questions: Category[] | null, categoryIndex: number | null): Category | null {
  return (questions && categoryIndex !== null) ? questions[categoryIndex] || null : null
}

function getQuestion(questions: Category[] | null, categoryIndex: number | null, questionIndex: number | null): Question | null {
  return (questions && categoryIndex !== null && questionIndex !== null) ? questions[categoryIndex].questions[questionIndex] || null : null
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

export function getRoomQuestions(QUESTIONS: Category[]): Category[] {
  // Helper: Fisher-Yates shuffle
  const shuffleArray = <T>(array: T[]): T[] => {
    const arr = [...array]; // copy to avoid mutating original
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Shuffle questions inside each category and limit to 5 questions
  const categoriesShuffled = QUESTIONS.map((category) => ({
    ...category,
    questions: shuffleArray(category.questions).slice(0, 5),
  }));

  // Shuffle the order of categories and limit to 5 categories
  return shuffleArray(categoriesShuffled).slice(0, 5);
}

export interface Question {
  id: string
  question: string
  answer: string
  timeLimit: number
}

export interface Category {
  id: string
  categoryName: string
  questions: Question[]
}

// Your Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

// Initialize Firebase only once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp()

// Exports
export const auth = getAuth(app)
export const db = getFirestore(app)


export async function fetchQuestionsFromFirestore(): Promise<Category[]> {
  const categoriesSnapshot = await getDocs(collection(db, "questions"))
  const categories: Category[] = []

  for (const categoryDoc of categoriesSnapshot.docs) {
    const data = categoryDoc.data()
    const questions: Question[] = (data.questions || []).map((q: any, index: number) => ({
      id: q.id || `${categoryDoc.id}-${index}`,
      question: q.question,
      answer: q.answer,
      timeLimit: q.timeLimit,
    }))

    categories.push({
      id: categoryDoc.id,
      categoryName: data.categoryName,
      questions,
    })
  }

  return categories
}