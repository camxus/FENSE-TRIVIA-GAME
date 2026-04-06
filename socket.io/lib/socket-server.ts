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
  clean_score: number
  time_bonus: number
  combo_bonus: number
  score: number
  streak: number
  is_admin: boolean
  active: boolean
}

export interface Room {
  id: string
  mode: "online" | "in-person"
  playMode: "easy" | "hard"
  language: "fr" | "en"
  players: Player[]
  selectedCategoryIds: string[]
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
  category: string
  answer: string
  timeLimit: number
  isBoolean: boolean
}

export interface QuestionRecord {
  id: string
  question: Record<"fr" | "en", string>
  answer: Record<"fr" | "en", string>
  timeLimit: number
  isBoolean: boolean
}

export interface Category {
  id: string
  categoryName: string
  questions: QuestionRecord[]
}

export interface ChatMessage {
  id: string
  roomId: string
  senderId: string | null // null = system
  senderName: string
  message: string
  timestamp: number
}

// Time bonus thresholds (seconds taken)
const TIME_BONUS_MAP = [
  { maxTime: 3, bonus: 45 },
  { maxTime: 10, bonus: 30 },
  { maxTime: 20, bonus: 15 },
  { maxTime: Infinity, bonus: 5 },
]

// Combo streak bonuses
const COMBO_BONUS_MAP = new Map<number, number>([
  [3, 50],
  [5, 100],
])

let QUESTIONS: Category[] = []

const rooms = new Map<string, Room>()

const mockCategory: Category = {
  id: "1",
  categoryName: "Musique – Récompenses",
  questions: [
    {
      id: "music-grammy-001",
      question:
      {
        "fr": "Quel est le nom des récompenses musicales internationales décernées chaque année aux États-Unis pour honorer les meilleurs artistes, albums et chansons, tous styles confondus ?",
        "en": "Quel est le nom des récompenses musicales internationales décernées chaque année aux États-Unis pour honorer les meilleurs artistes, albums et chansons, tous styles confondus ?",
      },
      answer: { "fr": "LES GRAMMY'S AWARDS", "en": "LES GRAMMY'S AWARDS" },
      timeLimit: 20000000,
      isBoolean: false,
    },
  ],
}

export async function initializeSocketServer(httpServer: HTTPServer) {
  QUESTIONS = await fetchQuestionsFromFirestore()

  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket: Socket) => {
    const connectionId =
      socket.handshake.auth.connectionId ?? socket.id;

    socket.data.connectionId = connectionId;

    // Create or join room
    socket.on("create-room", ({ mode, playerName }: { mode: "online" | "in-person"; playerName: string }) => {
      const roomId = generateRoomCode()
      const player: Player = {
        id: connectionId,
        name: playerName,
        clean_score: 0,
        time_bonus: 0,
        combo_bonus: 0,
        score: 0,
        streak: 0,
        is_admin: true,
        active: false
      }

      const room: Room = {
        id: roomId,
        mode,
        playMode: "easy",
        language: "fr",
        players: [player],
        currentCategoryIndex: null,
        currentQuestionIndex: null,
        isActive: false,
        leaderId: connectionId,
        guesses: {},
        questions: null,
        selectedCategoryIds: [],
      }

      rooms.set(roomId, room)
      socket.join(roomId)

      const availableCategories = QUESTIONS.map(c => ({
        id: c.id,
        categoryName: c.categoryName,
      }))


      socket.emit("room-created", { roomId, room, availableCategories })
    })

    socket.on("join-room", ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      const room = rooms.get(roomId)

      if (!room) {
        socket.emit("error", { message: "Room not found" })
        return
      }

      let player = room.players.find(p => p.id === connectionId);
      if (!player) {
        player = {
          id: connectionId,
          name: playerName,
          clean_score: 0,
          time_bonus: 0,
          combo_bonus: 0,
          score: 0,
          streak: 0,
          is_admin: false,
          active: true
        }
        room.players.push(player)
      } else {
        // Reconnected: update connectionId for this session
        player.id = connectionId;
      }

      const category = getCategory(room.questions, room.currentCategoryIndex)
      const question = getQuestion(room.questions, room.currentCategoryIndex, room.currentQuestionIndex, room.language)

      socket.join(roomId)
      io.to(roomId).emit("player-joined", { player, room })
      socket.emit("room-joined", {
        room: { ...room, questions: null },
        category: category?.categoryName,
        question: question ? {
          ...question,
          answer: undefined,
          answerLenght: question.answer.length,
          specialCharacters: extractSpecialCharacters(question?.answer),
        } : null,
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
    socket.on("start-game", ({ roomId, selectedCategoryIds, playMode, language }: { roomId: string, selectedCategoryIds: string[], playMode: "easy" | "hard", language: "fr" | "en" }) => {
      const room = rooms.get(roomId)
      if (!room || !selectedCategoryIds.length) return

      room.isActive = true
      room.currentCategoryIndex = 0
      room.currentQuestionIndex = -1
      room.guesses = {}
      room.playMode = playMode
      room.language = language
      room.questions = getRoomQuestions(
        QUESTIONS.filter((c) => selectedCategoryIds.includes(c.id)),
      )

      const category = getCategory(room.questions, room.currentCategoryIndex)

      io.to(roomId).emit("game-started", {
        category: category?.categoryName,
        selectedCategories: room.questions?.map((c) => ({
          id: c.id,
          categoryName: c.categoryName,
        })),
      })
    })

    function endQuestion(roomId: string) {
      console.log("ended")
      const room = rooms.get(roomId)
      if (!room) return

      const question = getQuestion(room.questions, room.currentCategoryIndex, room.currentQuestionIndex, room.language)
      if (!question) return

      const correctAnswer = question.answer.toString().toUpperCase()

      if (room.mode === "online") {
        Object.entries(room.guesses).forEach(([playerId, guess]) => {
          if (guess.value === correctAnswer) {
            const player = room.players.find((p) => p.id === playerId)
            if (!player) return

            // Calculate time taken (not time left)
            const timeTaken =
              question.timeLimit - guess.endTime / 1000

            // 🎯 Time bonus using map
            let timeBonus = 0
            for (const tier of TIME_BONUS_MAP) {
              if (timeTaken <= tier.maxTime) {
                timeBonus = tier.bonus
                break
              }
            }

            // Base score
            player.clean_score += 100
            player.time_bonus += timeBonus
            player.score += 100 + timeBonus

            // 🔥 Combo logic using Map
            player.streak += 1

            const comboBonus = COMBO_BONUS_MAP.get(player.streak) || 0

            if (comboBonus > 0) {
              player.combo_bonus += comboBonus
              player.score += comboBonus
            }
          }
        })

        room.players.forEach((player) => {
          const guess = room.guesses[player.id]
          if (!guess || guess.value !== correctAnswer) {
            player.streak = 0
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

    socket.on("end-question", ({ roomId }: { roomId: string }) => {
      endQuestion(roomId)
    })

    // Next question
    socket.on("next-question", ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId)
      if (!room) {
        socket.emit("error", { message: "Room not found", connectionId })
        return
      }
      if (connectionId !== room.leaderId) {
        socket.emit("error", { message: "Only the host can advance questions", connectionId })
        return
      }
      if (!room.isActive) {
        socket.emit("error", { message: "Game is not active", connectionId })
        return
      }
      if (room.currentQuestionIndex === null || room.currentCategoryIndex === null) {
        socket.emit("error", { message: "Game state invalid: indices are null", connectionId })
        return
      }

      const nextCategoryIndex = room.currentCategoryIndex + 1;
      const nextQuestionIndex = room.currentQuestionIndex + 1;

      const nextQuestion = getQuestion(room.questions, room.currentCategoryIndex, nextQuestionIndex, room.language);

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
      const question = getQuestion(room.questions, room.currentCategoryIndex, room.currentQuestionIndex, room.language)

      if (!question) {
        socket.emit("error", { message: `No question found at category=${room.currentCategoryIndex} question=${room.currentQuestionIndex}` })
        return
      }

      room.timerEndTime = Date.now() + question.timeLimit * 1000

      io.to(roomId).emit("next-question", {
        category: category?.categoryName,
        question: {
          ...question,
          answer: undefined,
          answerLenght: question.answer.length,
          specialCharacters: extractSpecialCharacters(question.answer),
        },
        timerEndTime: room.timerEndTime,
      })
    })

    socket.on("assign-points", ({ roomId, playerId, points }: { roomId: string; playerId: string; points: number }) => {
      const room = rooms.get(roomId)
      if (!room || connectionId !== room.leaderId) return

      const player = room.players.find((p) => p.id === playerId)
      if (player) {
        player.clean_score += points
        player.score = player.clean_score
        io.to(roomId).emit("points-updated", { players: room.players })
      }
    })

    // In-person mode: add/remove players
    socket.on("add-player", ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      const room = rooms.get(roomId)
      if (!room || room.mode !== "in-person" || connectionId !== room.leaderId) return

      const player: Player = {
        id: generatePlayerId(),
        name: playerName,
        clean_score: 0,
        time_bonus: 0,
        combo_bonus: 0,
        score: 0,
        streak: 0,
        is_admin: false,
        active: true
      }
      room.players.push(player)

      io.to(roomId).emit("player-added", { player, room })
    })

    socket.on("remove-player", ({ roomId, playerId }: { roomId: string; playerId: string }) => {
      const room = rooms.get(roomId)
      if (!room || room.mode !== "in-person" || connectionId !== room.leaderId) return

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
        const playerIndex = room.players.findIndex((p) => p.id === connectionId)
        if (playerIndex !== -1) {
          io.to(roomId).emit("chat-message", {
            id: crypto.randomUUID(),
            roomId,
            senderId: null,
            senderName: "System",
            message: `${room.players[playerIndex].name} left the room`,
            timestamp: Date.now(),
          } satisfies ChatMessage)

          room.players[playerIndex].active = false
          io.to(roomId).emit("player-left", { playerId: connectionId, room })

          // Delete room if empty
          if (room.players.length === 0) {
            rooms.delete(roomId)
          }
        }
      })
    })

    // Query answer - Wordle-style feedback (skipped for boolean questions)
    socket.on(
      "query-answer",
      ({ roomId, guess }: { roomId: string; guess: string }) => {
        const room = rooms.get(roomId)
        if (!room || !room.isActive) return

        const question = getQuestion(room.questions, room.currentCategoryIndex, room.currentQuestionIndex, room.language)
        if (!question) return

        const correctAnswer = question.isBoolean ? question.answer : question.answer.toUpperCase()
        if (!question.isBoolean) guess = guess.toUpperCase()

        const value = guess === "true"
        const isCorrect = value === correctAnswer as unknown as boolean

        if (question.isBoolean) {
          // Boolean questions: no Wordle feedback, no score penalty — just right or wrong
          if (isCorrect) {
            room.guesses[connectionId] = { value: guess, endTime: +room.timerEndTime! - Date.now() }
            if (room.playMode === "hard") {
              endQuestion(roomId)
            }
          }

          socket.emit("answer-feedback", { feedback: [], isCorrect })
        } else {
          // Wordle-style feedback for regular questions
          const feedback: { letter: string | null; index: number }[] = []

          for (let i = 0; i < guess.length; i++) {
            if (guess[i] === correctAnswer[i]) {
              feedback.push({ letter: guess[i], index: i })
            } else if (correctAnswer.includes(guess[i])) {
              feedback.push({ letter: null, index: i })
            }
          }

          // Store guess
          if (isCorrect) {
            room.guesses[connectionId] = { value: guess, endTime: +room.timerEndTime! - Date.now() }
            if (room.playMode === "hard") {
              endQuestion(roomId)
            }
          }

          socket.emit("answer-feedback", { feedback, isCorrect })
        }

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
      io.to(roomId).emit("reaction-received", { playerId: connectionId, emoji })
    })

    socket.on(
      "send-chat-message",
      ({ roomId, message }: { roomId: string; message: string }) => {
        const room = rooms.get(roomId)
        if (!room) return

        const player = room.players.find((p) => p.id === connectionId)
        if (!player) return

        const chatMessage: ChatMessage = {
          id: crypto.randomUUID(),
          roomId,
          senderId: connectionId,
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

function getQuestion(
  questions: Category[] | null,
  categoryIndex: number | null,
  questionIndex: number | null,
  language: "fr" | "en"
): Question | null {
  if (!questions || categoryIndex === null || questionIndex === null) return null

  const questionRecord = questions[categoryIndex]?.questions[questionIndex]
  if (!questionRecord) return null

  return {
    ...questionRecord,
    question: questionRecord.question[language],
    category: questions[categoryIndex].categoryName,
    answer: questionRecord.answer[language],
  }
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

  // Shuffle questions inside each category and limit to 15 questions
  const categoriesShuffled = QUESTIONS.map((category) => ({
    ...category,
    questions: shuffleArray(category.questions).slice(0, 15),
  }));

  // Shuffle the order of categories categories
  return shuffleArray(categoriesShuffled)
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

  // return [mockCategory]


  for (const categoryDoc of categoriesSnapshot.docs) {
    const data = categoryDoc.data()
    const questions: QuestionRecord[] = (data.questions || []).map((q: any, index: number) => ({
      id: q.id || `${categoryDoc.id}-${index}`,
      question: q.question,
      answer: q.answer,
      timeLimit: q.timeLimit,
      isBoolean: q.isBoolean ?? false,
    }))

    categories.push({
      id: categoryDoc.id,
      categoryName: data.categoryName,
      questions,
    })
  }

  return categories
}

function extractSpecialCharacters(answer: string): { char: string; index: number }[] {
  const specials: { char: string; index: number }[] = []

  for (let i = 0; i < answer.length; i++) {
    const char = answer[i]

    // Allow A–Z and 0–9
    if (!/[A-Z0-9]/.test(char)) {
      specials.push({ char, index: i })
    }
  }

  return specials
}