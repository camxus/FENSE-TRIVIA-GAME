import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { RoomCodeDisplay } from '../room-code-display'
import { PlayerList } from '../player-list'
import { CategorySelect } from '../category-select'
import { Button } from '../ui/button'
import { Reactions } from '../reactions'
import { useGame } from '@/context/game-context'

function Waiting() {
    const {
        availableCategories,
        currentRoomId,
        startGame,
        isCreator,
        players
    } = useGame()

    const [step, setStep] = useState<"players" | "categories" | "playMode" | "language">("players")
    const [playMode, setPlayMode] = useState<"easy" | "hard">("easy")
    const [language, setLanguage] = useState<"en" | "fr">("fr")

    const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([])

    const toggleCategory = (id: string) => {
        setSelectedCategoryIds((prev) =>
            prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
        )
    }

    return (
        <div>
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-3xl">
                        {step === "players"
                            ? "Waiting Room"
                            : step === "categories"
                                ? "Select Categories"
                                : "Select Play Mode"}
                    </CardTitle>
                    <CardDescription>
                        {step === "players"
                            ? "Share the room code with your friends"
                            : step === "categories"
                                ? "Select categories for this game"
                                : "Choose a difficulty level"}
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    <RoomCodeDisplay roomCode={currentRoomId} />

                    {/* Step 1: Players */}
                    {step === "players" && <PlayerList players={players} />}

                    {/* Step 2: Categories */}
                    {step === "categories" && (
                        <div className="space-y-4">
                            <CategorySelect
                                availableCategories={availableCategories}
                                selectedCategoryIds={selectedCategoryIds}
                                onSelect={toggleCategory}
                                onSelectAll={(ids) => setSelectedCategoryIds(ids)}
                            />
                        </div>
                    )}

                    {/* Step 3: Play Mode */}
                    {step === "playMode" && (
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
                    )}

                    {/* Step 4: Play Mode */}
                    {step === "language" && (
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
                    )}

                    {/* Navigation buttons */}
                    {isCreator && (
                        <div className="flex gap-2">
                            {(step === "categories" || step === "playMode") && (
                                <Button
                                    variant="secondary"
                                    onClick={() => setStep(step === "playMode" ? "categories" : "players")}
                                    className="flex-1"
                                >
                                    Back
                                </Button>
                            )}
                            <Button
                                onClick={() => {
                                    if (step === "players") setStep("categories")
                                    else if (step === "categories") setStep("playMode")
                                    else if (step === "playMode") setStep("language")
                                    else startGame(selectedCategoryIds, playMode, language)
                                }}
                                className="flex-1"
                                disabled={
                                    (step === "categories" && selectedCategoryIds.length === 0)
                                }
                            >
                                {step !== "language" ? "Next" : "Start Game"}
                            </Button>
                        </div>
                    )}

                    {!isCreator && step === "players" && (
                        <p className="text-center text-muted-foreground">
                            Waiting for the host to start the game...
                        </p>
                    )}
                </CardContent>
            </Card>
            <Reactions />
        </div>
    )
}

export default Waiting