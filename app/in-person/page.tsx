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
import { GameModes } from "@/hooks/use-game-socket";
import { AnimatePresence, motion } from "framer-motion"
import { Scoreboard } from "@/components/scoreboard"
import { Reactions } from "@/components/reactions"
import { useGame } from "@/context/game-context"
import { useRouter } from "next/navigation"
import { CategorySelect } from "@/components/category-select"

export default function InPersonPage() {
  const router = useRouter()
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
    activeReactions,
    availableCategories,
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
  } = useGame();

  const handleAssingPoints = () => {
    assignPoints(selectedPlayerId!, pointsToAssign)
    setSelectedPlayerId(null)
    setPointsToAssign("")
  }

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
      </motion.div>
    )
  }

  if (gameState === "waiting") {
    const [step, setStep] = useState(1)
    const [newPlayerName, setNewPlayerName] = useState("")
    const [language, setLanguage] = useState<"en" | "fr">("en")
    const [playMode, setPlayMode] = useState<"easy" | "hard">("easy")
    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

    const toggleCategory = (id: string) => {
      setSelectedCategoryIds((prev) =>
        prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
      )
    }

    return (
      <motion.div
        key={step}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4"
      >
        <div className="max-w-4xl mx-auto space-y-6 py-8">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Game Setup</h1>
            <div className="text-sm text-muted-foreground">Room: {currentRoomId}</div>
          </div>

          {/* Step Content */}
          {step === 1 && isCreator && (
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
                  <Button
                    onClick={() => addPlayer(newPlayerName)}
                    disabled={!newPlayerName.trim()}
                    size="icon"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Players ({players.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {players.map((player) => (
                        <div
                          key={player.id}
                          className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                        >
                          <span className="font-medium">{player.name}</span>
                          {player.id !== players[0]?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removePlayer(player.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="mt-4"
                  onClick={() => setStep(2)}
                  disabled={players.length < 1}
                >
                  Next
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Game Settings</CardTitle>
                <CardDescription>Select language, play mode, and categories</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-4">
                  <Button
                    variant={language === "en" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setLanguage("en")}
                  >
                    English
                  </Button>
                  <Button
                    variant={language === "fr" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setLanguage("fr")}
                  >
                    French
                  </Button>
                </div>

                <div className="flex flex-col gap-4">
                  <Button
                    variant={playMode === "easy" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setPlayMode("easy")}
                  >
                    Easy
                  </Button>
                  <Button
                    variant={playMode === "hard" ? "default" : "outline"}
                    className="w-full"
                    onClick={() => setPlayMode("hard")}
                  >
                    Hard
                  </Button>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">Categories</span>
                  <div className="flex flex-wrap gap-2">
                    {availableCategories.map((cat) => (
                      <Button
                        key={cat.id}
                        variant={selectedCategoryIds.includes(cat.id) ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleCategory(cat.id)}
                      >
                        {cat.categoryName}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between mt-4">
                  <Button onClick={() => setStep(1)}>Back</Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={selectedCategoryIds.length === 0}
                  >
                    Next
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Review & Start</CardTitle>
                <CardDescription>Check all settings before starting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h2 className="font-medium">Players</h2>
                  <ul className="list-disc ml-5">
                    {players.map((p) => (
                      <li key={p.id}>{p.name}</li>
                    ))}
                  </ul>
                </div>

                <CategorySelect
                  availableCategories={availableCategories}
                  selectedCategoryIds={selectedCategoryIds}
                  onSelect={toggleCategory}
                />

                <div className="flex justify-between mt-4">
                  <Button onClick={() => setStep(2)}>Back</Button>
                  <Button onClick={() => startGame(selectedCategoryIds, playMode, language)} className="w-full flex items-center justify-center gap-2">
                    <Play className="h-4 w-4" /> Start Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!isCreator && (
            <p className="text-center text-muted-foreground">
              Waiting for the leader to start the game...
            </p>
          )}
        </div>
      </motion.div>
    )
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
            <Scoreboard players={players} />

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
      </motion.div>
    )
  }

  if (gameState === "question-ended") {
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
      </motion.div>
    )
  }

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

            <Link href="" onClick={() => router.refresh()}>
              <Button className="w-full" size="lg">
                Play Again
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Reactions />

      </motion.div>
    )
  }

  return null
}
