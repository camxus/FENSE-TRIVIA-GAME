import type { Server as HTTPServer } from "http"
import { Server as SocketIOServer, type Socket } from "socket.io"
import questions from "./questions.json" with { type: "json" };
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

export const QUESTIONS: Category[] = questions

const rooms = new Map<string, Room>()

export function initializeSocketServer(httpServer: HTTPServer) {
  const io = new SocketIOServer(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  })

  io.on("connection", (socket: Socket) => {
    console.log("Client connected:", socket.id)

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
      }

      rooms.set(roomId, room)
      socket.join(roomId)

      socket.emit("room-created", { roomId, room })
      console.log(`Room ${roomId} created by ${playerName}`)
    })

    socket.on("join-room", ({ roomId, playerName }: { roomId: string; playerName: string }) => {
      const room = rooms.get(roomId)

      if (!room) {
        socket.emit("error", { message: "Room not found" })
        return
      }

      const player: Player = { id: socket.id, name: playerName, score: 0 }
      room.players.push(player)

      const category = getCategory(room.currentCategoryIndex)
      const question = getQuestion(room.currentCategoryIndex, room.currentQuestionIndex)

      socket.join(roomId)
      io.to(roomId).emit("player-joined", { player, room })
      socket.emit("room-joined", {
        room,
        category: category?.categoryName,
        question: { ...question, answer: undefined, answerLenght: question?.answer.length },
        timerEndTime: room.timerEndTime,
      })

      console.log(`${playerName} joined room ${roomId}`)
    })

    // Start game
    socket.on("start-game", ({ roomId }: { roomId: string }) => {
      const room = rooms.get(roomId)
      if (!room) return

      room.isActive = true
      room.currentQuestionIndex = 0
      room.currentCategoryIndex = 0
      room.guesses = {}

      const category = getCategory(room.currentCategoryIndex)
      const question = getQuestion(room.currentCategoryIndex, room.currentQuestionIndex)

      if (!question) return

      room.timerEndTime = Date.now() + question.timeLimit * 1000

      io.to(roomId).emit("game-started", {
        category: category?.categoryName,
        question: { ...question, answer: undefined, answerLenght: question.answer.length },
        timerEndTime: room.timerEndTime,
      })
    })

    function endQuestion(roomId: string) {
      const room = rooms.get(roomId)
      if (!room) return

      const question = getQuestion(room.currentCategoryIndex, room.currentQuestionIndex)
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

      const nextQuestion = getQuestion(room.currentCategoryIndex, nextQuestionIndex);

      if (!nextQuestion) {
        const nextCategory = getCategory(nextCategoryIndex);

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
      } else {
        room.currentQuestionIndex = nextQuestionIndex;
      }

      const category = getCategory(room.currentCategoryIndex)
      const question = getQuestion(room.currentCategoryIndex, room.currentQuestionIndex)

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
      console.log("Client disconnected:", socket.id)

      // Remove player from rooms
      rooms.forEach((room, roomId) => {
        const playerIndex = room.players.findIndex((p) => p.id === socket.id)
        if (playerIndex !== -1) {
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

        const question = getQuestion(room.currentCategoryIndex, room.currentQuestionIndex)
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
          (player) => room.guesses[player.id].value === correctAnswer
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
  })



  return io
}

function getCategory(categoryIndex: number | null): Category | null {
  return categoryIndex !== null ? QUESTIONS[categoryIndex] || null : null
}

function getQuestion(categoryIndex: number | null, questionIndex: number | null): Question | null {
  return categoryIndex !== null && questionIndex !== null ? QUESTIONS[categoryIndex].questions[questionIndex] || null : null
}

function generateRoomCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function generatePlayerId(): string {
  return `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
}

