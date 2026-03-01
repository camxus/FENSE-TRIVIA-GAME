import React, { useState } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Input } from "../ui/input"
import { CategorySelect } from "../category-select"
import { useGame } from "@/context/game-context"
import { Plus, Trash2, Play } from "lucide-react"

function WaitingInPerson() {
  const {
    availableCategories,
    currentRoomId,
    players,
    addPlayer,
    removePlayer,
    startGame,
    isCreator,
  } = useGame()

  const [step, setStep] = useState<"players" | "settings">("players")
  const [newPlayerName, setNewPlayerName] = useState("")
  const [language, setLanguage] = useState<"en" | "fr">("en")
  const [playMode, setPlayMode] = useState<"easy" | "hard">("easy")
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return
    addPlayer(newPlayerName.trim())
    setNewPlayerName("")
  }

  return (
    <>
      {/* STEP 1 — PLAYERS */}
      {step === "players" && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Add Players</CardTitle>
            <CardDescription>
              Add everyone who is playing in this room
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {isCreator && (
              <div className="flex gap-2">
                <Input
                  placeholder="Player name"
                  value={newPlayerName}
                  onChange={(e) => setNewPlayerName(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddPlayer()
                  }
                />
                <Button
                  size="icon"
                  onClick={handleAddPlayer}
                  disabled={!newPlayerName.trim()}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="space-y-2">
              {players.map((player) => (
                <div
                  key={player.id}
                  className="flex justify-between items-center p-3 bg-secondary rounded-lg"
                >
                  <span className="font-medium">{player.name}</span>
                  {isCreator && (
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

            {isCreator && (
              <Button
                className="w-full"
                disabled={players.length < 1}
                onClick={() => setStep("settings")}
              >
                Next
              </Button>
            )}

            {!isCreator && (
              <p className="text-center text-muted-foreground">
                Waiting for the host to continue...
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* STEP 2 — SETTINGS */}
      {step === "settings" && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Game Settings</CardTitle>
            <CardDescription>
              Choose categories, difficulty and language
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <CategorySelect
              availableCategories={availableCategories}
              selectedCategoryIds={selectedCategoryIds}
              onSelect={toggleCategory}
              onSelectAll={(ids) => setSelectedCategoryIds(ids)}
            />

            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">Difficulty</span>
              <Button
                variant={playMode === "easy" ? "default" : "outline"}
                onClick={() => setPlayMode("easy")}
              >
                Easy
              </Button>
              <Button
                variant={playMode === "hard" ? "default" : "outline"}
                onClick={() => setPlayMode("hard")}
              >
                Hard
              </Button>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-sm font-medium">Language</span>
              <Button
                variant={language === "en" ? "default" : "outline"}
                onClick={() => setLanguage("en")}
              >
                English
              </Button>
              <Button
                variant={language === "fr" ? "default" : "outline"}
                onClick={() => setLanguage("fr")}
              >
                French
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setStep("players")}
              >
                Back
              </Button>
              <Button
                className="flex-1 flex items-center justify-center gap-2"
                onClick={() =>
                  startGame(selectedCategoryIds, playMode, language)
                }
              >
                <Play className="h-4 w-4" />
                Start Game
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default WaitingInPerson