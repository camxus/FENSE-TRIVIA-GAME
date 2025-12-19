"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Timer } from "@/components/timer"
import { ArrowLeft, Plus, Trash2, Play, StopCircle, SkipForward } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { GameModes, useGameSocket } from "@/hooks/use-game-socket";
import { AnimatePresence, motion } from "framer-motion"
import { Scoreboard } from "@/components/scoreboard"

export default function InPersonPage() {
  const [leaderName, setLeaderName] = useState("")
  const [newPlayerName, setNewPlayerName] = useState("")
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null)
  const [pointsToAssign, setPointsToAssign] = useState("")

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
    assignPoints
  } = useGameSocket();

  const handleAssingPoints = () => {
    assignPoints(selectedPlayerId!, pointsToAssign)
    setSelectedPlayerId(null)
    setPointsToAssign("")
  }

  if (gameState === "lobby") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
            <CardTitle className="text-3xl">In-Person Mode</CardTitle>
            <CardDescription>Perfect for game nights with friends in the same room</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="leaderName">Your Name (Game Leader)</Label>
              <Input
                id="leaderName"
                placeholder="Enter your name"
                value={leaderName}
                onChange={(e) => setLeaderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createRoom(leaderName, GameModes.IN_PERSON)}
              />
            </div>

            <Button onClick={() => createRoom(leaderName, GameModes.IN_PERSON)} disabled={!leaderName.trim()} className="w-full" size="lg">
              Create Game Room
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (gameState === "waiting") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="max-w-4xl mx-auto space-y-6 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Game Setup</h1>
            <div className="text-sm text-muted-foreground">Room: {currentRoomId}</div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {isCreator && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Players</CardTitle>
                  <CardDescription>Add all players who will participate</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Player name"
                      value={newPlayerName}
                      onChange={(e) => setNewPlayerName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addPlayer(newPlayerName)}
                    />
                    <Button onClick={() => addPlayer(newPlayerName)} disabled={!newPlayerName.trim()} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className={isCreator ? "" : "md:col-span-2"}>
              <CardHeader>
                <CardTitle>Players ({players.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {players.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <span className="font-medium">{player.name}</span>
                      {isCreator && player.id !== players[0]?.id && (
                        <Button variant="ghost" size="icon" onClick={() => removePlayer(player.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {isCreator && (
            <Button onClick={() => startGame()} disabled={players.length < 1} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Game
            </Button>
          )}

          {!isCreator && (
            <p className="text-center text-muted-foreground">Waiting for the leader to start the game...</p>
          )}
        </div>
      </div>
    )
  }

  if (gameState === "playing") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="max-w-6xl mx-auto space-y-6 py-8">
          <div className="flex items-center justify-between">
            <Image
              src="/fense-logo.png"
              alt="Fense Logo"
              width={150}
              height={150}
            />
            <div className="text-sm text-muted-foreground">Room: {currentRoomId}</div>
          </div>

          <Card className="bg-primary text-primary-foreground">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardDescription className="text-primary-foreground/70">{currentQuestion?.category}</CardDescription>
                {timerEndTime && <Timer endTime={timerEndTime} onEnd={() => { }} />}
              </div>
              <CardTitle className="text-5xl text-balance leading-tight">{currentQuestion?.question}</CardTitle>
            </CardHeader>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Scoreboard players={players}/>

            {isCreator && (
              <Card>
                <CardHeader>
                  <CardTitle>Leader Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Button onClick={() => stopTimer()} variant="destructive" className="flex-1">
                      <StopCircle className="h-4 w-4 mr-2" />
                      Stop Timer
                    </Button>
                    <Button onClick={endQuestion} variant="secondary" className="flex-1">
                      Reveal Answer
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (gameState === "question-ended") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <div className="max-w-6xl mx-auto space-y-6 py-8">
          <div className="flex items-center justify-between">
            <Image
              src="/fense-logo.png"
              alt="Fense Logo"
              width={150}
              height={150}
            />
            <div className="text-sm text-muted-foreground">Room: {currentRoomId}</div>
          </div>

          <Card>
            <CardHeader>
              <CardDescription>{currentQuestion?.category}</CardDescription>
              <CardTitle className="text-3xl text-balance">{currentQuestion?.question}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 bg-primary/10 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Correct Answer:</p>
                <p className="text-5xl font-bold">{correctAnswer}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Scoreboard players={players} />
            </div>

            {isCreator && (
              <Card>
                <CardHeader>
                  <CardTitle>Assign Points</CardTitle>
                  <CardDescription>Award points to players who answered correctly</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Player</Label>
                    <select
                      className="w-full p-2 rounded-md border bg-background"
                      value={selectedPlayerId || ""}
                      onChange={(e) => setSelectedPlayerId(e.target.value)}
                    >
                      <option value="">Choose a player...</option>
                      {players.map((player) => (
                        <option key={player.id} value={player.id}>
                          {player.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      placeholder="Enter points"
                      value={pointsToAssign}
                      onChange={(e) => setPointsToAssign(e.target.value)}
                    />
                  </div>

                  <Button onClick={() => handleAssingPoints()} disabled={!selectedPlayerId || !pointsToAssign} className="w-full">
                    Assign Points
                  </Button>

                  <div className="pt-4 border-t">
                    <Button onClick={nextQuestion} variant="secondary" className="w-full" size="lg">
                      <SkipForward className="h-4 w-4 mr-2" />
                      Next Question
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (gameState === "new-category") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
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
                    className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black bg-opacity-80 text-white text-5xl font-bold"
                    initial={{ opacity: 0, x: 100 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -100 }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  >
                    <span className="mb-6 text-2xl">New Category</span>
                    <span className="text-4xl">{currentCategory}</span>

                    {/* Start Button */}
                    {isCreator && (
                      <Button
                        onClick={nextQuestion}
                        className="mt-10 px-10 py-4 text-2xl"
                        size="lg"
                      >
                        Start
                      </Button>
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

            <div>
              {/* Optionally keep Scoreboard here for larger screens */}
              <Scoreboard players={players} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === "game-ended") {
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
        <Scoreboard cardTitle="Game Over!" cardDescription="Final Leaderboard" players={players} />
        <Link href="/in-person">
          <Button className="w-full" size="lg">
            Play Again
          </Button>
        </Link>
      </div>
    )
  }

  return null
}
