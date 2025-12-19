import { Server as SocketIOServer } from "socket.io";
// Sample questions
export const QUESTIONS = [
    { id: "1", question: "Capital of France", answer: "PARIS", category: "Geography", timeLimit: 30 },
    { id: "2", question: "Largest planet in our solar system", answer: "JUPITER", category: "Science", timeLimit: 30 },
    { id: "3", question: "Author of Romeo and Juliet", answer: "SHAKESPEARE", category: "Literature", timeLimit: 30 },
    { id: "4", question: "Chemical symbol for gold", answer: "AU", category: "Science", timeLimit: 20 },
    { id: "5", question: "Year World War II ended", answer: "1945", category: "History", timeLimit: 25 },
    { id: "6", question: "Fastest land animal", answer: "CHEETAH", category: "Nature", timeLimit: 20 },
    {
        id: "7",
        question: "Programming language named after a snake",
        answer: "PYTHON",
        category: "Technology",
        timeLimit: 25,
    },
    { id: "8", question: "Number of continents on Earth", answer: "SEVEN", category: "Geography", timeLimit: 20 },
    { id: "9", question: "Smallest prime number", answer: "TWO", category: "Math", timeLimit: 15 },
    { id: "10", question: "Main ingredient in guacamole", answer: "AVOCADO", category: "Food", timeLimit: 20 },
];
const rooms = new Map();
export function initializeSocketServer(httpServer) {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    io.on("connection", (socket) => {
        console.log("Client connected:", socket.id);
        // Create or join room
        socket.on("create-room", ({ mode, playerName }) => {
            const roomId = generateRoomCode();
            const player = { id: socket.id, name: playerName, score: 0 };
            const room = {
                id: roomId,
                mode,
                players: [player],
                currentQuestionIndex: null,
                isActive: false,
                leaderId: mode === "in-person" ? socket.id : undefined,
                guesses: {},
            };
            rooms.set(roomId, room);
            socket.join(roomId);
            socket.emit("room-created", { roomId, room });
            console.log(`Room ${roomId} created by ${playerName}`);
        });
        socket.on("join-room", ({ roomId, playerName }) => {
            const room = rooms.get(roomId);
            if (!room) {
                socket.emit("error", { message: "Room not found" });
                return;
            }
            const player = { id: socket.id, name: playerName, score: 0 };
            room.players.push(player);
            const question = room.currentQuestionIndex !== null ? QUESTIONS[room.currentQuestionIndex] : null;
            socket.join(roomId);
            io.to(roomId).emit("player-joined", { player, room });
            socket.emit("room-joined", {
                room,
                question: { ...question, answer: undefined, answerLenght: question?.answer.length },
                timerEndTime: room.timerEndTime,
            });
            console.log(`${playerName} joined room ${roomId}`);
        });
        // Start game
        socket.on("start-game", ({ roomId }) => {
            const room = rooms.get(roomId);
            console.log(room);
            if (!room)
                return;
            room.isActive = true;
            room.currentQuestionIndex = 0;
            room.guesses = {};
            const question = QUESTIONS[room.currentQuestionIndex];
            room.timerEndTime = Date.now() + question.timeLimit * 1000;
            io.to(roomId).emit("game-started", {
                question: { ...question, answer: undefined, answerLenght: question.answer.length },
                timerEndTime: room.timerEndTime,
            });
        });
        // Submit guess (online mode)
        socket.on("submit-guess", ({ roomId, guess }) => {
            const room = rooms.get(roomId);
            if (!room || !room.isActive)
                return;
            room.guesses[socket.id] = guess.toUpperCase();
            io.to(roomId).emit("guess-submitted", {
                playerId: socket.id,
                playerName: room.players.find((p) => p.id === socket.id)?.name,
            });
        });
        // End question
        socket.on("end-question", ({ roomId }) => {
            const room = rooms.get(roomId);
            if (!room)
                return;
            const question = room.currentQuestionIndex !== null ? QUESTIONS[room.currentQuestionIndex] : null;
            const correctAnswer = question?.answer.toUpperCase();
            // Calculate scores for online mode
            if (room.mode === "online") {
                Object.entries(room.guesses).forEach(([playerId, guess]) => {
                    if (guess === correctAnswer) {
                        const player = room.players.find((p) => p.id === playerId);
                        if (player) {
                            const timeBonus = Math.max(0, Math.floor((room.timerEndTime - Date.now()) / 1000));
                            player.score += 100 + timeBonus * 10;
                        }
                    }
                });
            }
            io.to(roomId).emit("question-ended", {
                correctAnswer,
                guesses: room.guesses,
                players: room.players,
            });
            room.guesses = {};
        });
        // Next question
        socket.on("next-question", ({ roomId }) => {
            const room = rooms.get(roomId);
            if (!room)
                return;
            if (room.currentQuestionIndex === null)
                return;
            room.currentQuestionIndex++;
            if (room.currentQuestionIndex >= QUESTIONS.length) {
                room.isActive = false;
                io.to(roomId).emit("game-ended", { players: room.players });
                return;
            }
            const question = QUESTIONS[room.currentQuestionIndex];
            room.timerEndTime = Date.now() + question.timeLimit * 1000;
            io.to(roomId).emit("next-question", {
                question: { ...question, answer: undefined, answerLenght: question.answer.length },
                timerEndTime: room.timerEndTime,
            });
        });
        // In-person mode: manual point assignment
        socket.on("assign-points", ({ roomId, playerId, points }) => {
            const room = rooms.get(roomId);
            if (!room || room.mode !== "in-person" || socket.id !== room.leaderId)
                return;
            const player = room.players.find((p) => p.id === playerId);
            if (player) {
                player.score += points;
                io.to(roomId).emit("points-updated", { players: room.players });
            }
        });
        // In-person mode: add/remove players
        socket.on("add-player", ({ roomId, playerName }) => {
            const room = rooms.get(roomId);
            if (!room || room.mode !== "in-person" || socket.id !== room.leaderId)
                return;
            const player = { id: generatePlayerId(), name: playerName, score: 0 };
            room.players.push(player);
            io.to(roomId).emit("player-added", { player, room });
        });
        socket.on("remove-player", ({ roomId, playerId }) => {
            const room = rooms.get(roomId);
            if (!room || room.mode !== "in-person" || socket.id !== room.leaderId)
                return;
            room.players = room.players.filter((p) => p.id !== playerId);
            io.to(roomId).emit("player-removed", { playerId, room });
        });
        // Stop timer
        socket.on("stop-timer", ({ roomId }) => {
            const room = rooms.get(roomId);
            if (!room)
                return;
            io.to(roomId).emit("timer-stopped");
        });
        socket.on("disconnect", () => {
            console.log("Client disconnected:", socket.id);
            // Remove player from rooms
            rooms.forEach((room, roomId) => {
                const playerIndex = room.players.findIndex((p) => p.id === socket.id);
                if (playerIndex !== -1) {
                    room.players.splice(playerIndex, 1);
                    io.to(roomId).emit("player-left", { playerId: socket.id, room });
                    // Delete room if empty
                    if (room.players.length === 0) {
                        rooms.delete(roomId);
                    }
                }
            });
        });
        // Query answer - Wordle-style feedback
        socket.on("query-answer", ({ roomId, guess }) => {
            const room = rooms.get(roomId);
            if (!room || !room.isActive) {
                socket.emit("error", { message: "Room not active or not found" });
                return;
            }
            const question = room.currentQuestionIndex !== null && QUESTIONS[room.currentQuestionIndex];
            if (!question)
                return;
            const correctAnswer = question.answer.toUpperCase();
            const feedback = [];
            guess = guess.toUpperCase();
            // First pass: correct letters
            for (let i = 0; i < guess.length; i++) {
                if (guess[i] === correctAnswer[i]) {
                    feedback.push({ letter: guess[i], index: i });
                    continue;
                }
                for (let j = 0; j < correctAnswer.length; j++) {
                    if (guess[i] === correctAnswer[j]) {
                        feedback.push({ letter: null, index: i });
                    }
                }
            }
            socket.emit("answer-feedback", { feedback });
        });
    });
    return io;
}
function generateRoomCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
function generatePlayerId() {
    return `player-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
