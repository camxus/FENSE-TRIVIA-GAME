"use client";

import { useEffect, useState } from "react";
import { GameModes } from "@/hooks/use-game-socket";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WordleGuess } from "@/components/wordle-guess";
import { Timer } from "@/components/timer";
import { Scoreboard } from "@/components/scoreboard";
import { RoomCodeDisplay } from "@/components/room-code-display";
import { PlayerList } from "@/components/player-list";
import { QuestionDisplay } from "@/components/question-display";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { WordleInput } from "@/components/wordle-input";
import { AnimatePresence, motion } from "framer-motion"
import { Reactions } from "@/components/reactions";
import { useSearchParams } from "next/navigation";
import { useGame } from "@/context/game-context";

export default function OnlinePage() {
  const searchParams = useSearchParams();

  const {
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
    sendReaction,
  } = useGame();

  // Local state for form inputs
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState(searchParams.get("room") || "");

  const handleCreateRoom = () => {
    if (!playerName.trim()) return;
    createRoom(playerName, GameModes.ONLINE);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim() || !roomId.trim()) return;
    joinRoom(playerName, roomId);
  };

  useEffect(() => {
    if (!(currentQuestion?.answerLenght === guess.length)) return;
    queryAnswer(guess);
  }, [guess]);

  const renderGameState = () => {

    if (gameState === "lobby") {
      return (
        <motion.div
          key={gameState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Home
              </Link>
              <CardTitle className="text-3xl">Online Mode</CardTitle>
              <CardDescription>
                Create or join a room to play with friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="playerName">Your Name</Label>
                <Input
                  id="playerName"
                  placeholder="Enter your name"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateRoom()}
                />
              </div>

              <div className="space-y-4">
                <Button
                  onClick={handleCreateRoom}
                  variant={roomId ? "secondary" : "default"}
                  disabled={!playerName.trim()}
                  className="w-full"
                  size="lg"
                >
                  Create New Room
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">Or</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="roomId">Room Code</Label>
                  <Input
                    id="roomId"
                    placeholder="Enter room code"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === "Enter" && handleJoinRoom()}
                  />
                </div>

                <Button
                  onClick={handleJoinRoom}
                  disabled={!playerName.trim() || !roomId.trim()}
                  variant={roomId ? "default" : "secondary"}
                  className="w-full"
                  size="lg"
                >
                  Join Room
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }

    if (gameState === "waiting") {
      return (
        <motion.div
          key={gameState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4 mb-[3rem]">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-3xl">Waiting Room</CardTitle>
              <CardDescription>
                Share the room code with your friends
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <RoomCodeDisplay roomCode={currentRoomId} />

              <PlayerList players={players} />

              {isCreator && (
                <Button
                  onClick={() => startGame()}
                  disabled={players.length < 1}
                  className="w-full"
                  size="lg"
                >
                  Start Game
                </Button>
              )}

              {!isCreator && (
                <p className="text-center text-muted-foreground">
                  Waiting for the host to start the game...
                </p>
              )}
            </CardContent>
          </Card>
          <Reactions />
        </motion.div>
      );
    }

    if (gameState === "playing") {
      return (
        <motion.div
          key={gameState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
          <div className="max-w-6xl mx-auto space-y-6 py-8">
            <div className="flex items-center justify-between">
              <Image
                src="/fense-logo.png"
                alt="Fense Logo"
                width={150}
                height={150}
              />
              <div className="text-sm text-muted-foreground">
                Room: {currentRoomId}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {currentQuestion && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardDescription className="text-sm">
                          {currentQuestion.category}
                        </CardDescription>
                        {timerEndTime && (
                          <Timer endTime={timerEndTime} onEnd={endQuestion} />
                        )}
                      </div>
                      <CardTitle className="text-3xl text-balance">
                        {currentQuestion.question}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="guess">Your Answer</Label>

                        <div className="flex justify-center">
                          <WordleInput
                            length={currentQuestion.answerLenght}
                            value={guess}
                            onChange={setGuess}
                            feedback={feedback}
                          />
                        </div>
                      </div>

                      {correctAnswer && (
                        <WordleGuess guess={guess} answer={correctAnswer} />
                      )}

                    </CardContent>
                  </Card>
                )}
              </div>

              <div>
                <Scoreboard players={players} />
              </div>
            </div>
          </div>

          <Reactions />

        </motion.div>
      );
    }

    if (gameState === "question-ended") {
      return (
        <motion.div
          key={gameState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }} className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
          <div className="max-w-6xl mx-auto space-y-6 py-8">
            <div className="flex items-center justify-between">
              <Image
                src="/fense-logo.png"
                alt="Fense Logo"
                width={150}
                height={150}
              />
              <div className="text-sm text-muted-foreground">
                Room: {currentRoomId}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {currentQuestion && (
                  <QuestionDisplay
                    question={currentQuestion}
                    showAnswer={true}
                    answer={correctAnswer}
                  />
                )}

                {guess && <WordleGuess guess={guess} answer={correctAnswer} />}

                {isCreator && (
                  <Button onClick={nextQuestion} className="w-full" size="lg">
                    Next Question
                  </Button>
                )}

                {!isCreator && (
                  <p className="text-center text-muted-foreground">
                    Waiting for next question...
                  </p>
                )}
              </div>

              <div>
                <Scoreboard players={players} />
              </div>
            </div>
          </div>

          <Reactions />

        </motion.div>
      );
    }

    // Inside OnlinePage component
    if (gameState === "new-category") {
      return (
        <motion.div
          key={gameState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
          <div className="max-w-6xl mx-auto space-y-6 py-8">
            <div className="flex items-center justify-between">
              <Image
                src="/fense-logo.png"
                alt="Fense Logo"
                width={150}
                height={150}
              />
              <div className="text-sm text-muted-foreground">
                Room: {currentRoomId}
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6 relative">
                <Scoreboard players={players} />

                {/* Fullscreen Category Animation */}
                <AnimatePresence>
                  {currentCategory && (
                    <motion.div
                      key={currentCategory}
                      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white text-5xl font-bold"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                    >
                      <motion.span
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -100 }}
                        transition={{ duration: 0.8, ease: "easeInOut" }}
                        className="text-4xl"
                      >{currentCategory}</motion.span>

                      {/* Start Button */}
                      {isCreator && (
                        <motion.div
                          initial={{ opacity: 0, y: 0 }}
                          animate={{
                            opacity: 1,
                            y: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 0, 0, 0, 5], // bounce up 10px and back
                          }}
                          whileHover={{ y: 5 }}
                          transition={{
                            opacity: { delay: 0.2, duration: 0.5 }, // fade in once
                            y: {
                              delay: 0.2,
                              duration: 2.3,
                              repeat: Infinity,
                              repeatType: "loop",
                              ease: "easeInOut",
                            }, // infinite bounce
                          }}
                        >
                          <Button
                            onClick={nextQuestion}
                            size="lg"
                            className="mt-10 px-10 py-4 text-foreground bg-background hover:bg-background/40"
                          >
                            Start
                          </Button>
                        </motion.div>
                      )}
                      {!isCreator && (
                        <p className="mt-10 text-xl text-muted-foreground">
                          Waiting for host to start...
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* <div>
              <Scoreboard players={players} />
            </div> */}
            </div>
          </div>

          <Reactions />

        </motion.div>
      );
    }

    if (gameState === "game-ended") {
      const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

      return (
        <motion.div
          key={gameState}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <CardTitle className="text-4xl text-center">Game Over!</CardTitle>
              <CardDescription className="text-center">
                Final Leaderboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {sortedPlayers.map((player, index) => (
                  <div
                    key={player.id}
                    className={`p-4 rounded-lg flex items-center justify-between ${index === 0
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary"
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold">#{index + 1}</span>
                      <span className="text-lg">{player.name}</span>
                    </div>
                    <span className="text-2xl font-bold">{player.score}</span>
                  </div>
                ))}
              </div>

              <Button className="w-full" size="lg" onClick={() => startGame()}>
                Play Again
              </Button>
            </CardContent>
          </Card>

          <Reactions />

        </motion.div>
      );
    }
  }

  return (
    <motion.div
      key={"online"}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}>
      <AnimatePresence mode="wait">
        {renderGameState()}
      </AnimatePresence>
    </motion.div>
  )
}
