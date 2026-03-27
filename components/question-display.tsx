"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Timer } from "@/components/timer"
import { useAutoFontSize } from "./ui/use-auto-font-size"
import { Player } from "@/hooks/use-game-socket"
import clsx from "clsx"

interface Question {
  id: string
  question: string
  category: string
  timeLimit: number
}

interface QuestionDisplayProps {
  currentPlayer?: Player
  question: Question
  timerEndTime?: number | null
  onTimerEnd?: () => void
  large?: boolean
  showAnswer?: boolean
  answer?: string
}

export function QuestionDisplay({
  currentPlayer,
  question,
  timerEndTime,
  onTimerEnd,
  large = false,
  showAnswer = false,
  answer,
}: QuestionDisplayProps) {
  const { ref, exceeded } = useAutoFontSize<HTMLHeadingElement>(
    [question.question],
    { maxLines: 3 }
  )

  // Determine border style based on streak
  const borderClass = currentPlayer ?
    (currentPlayer.streak >= 5
      ? "border-4 border-transparent animate-rainbow"
      : currentPlayer.streak >= 3
        ? "border-4 border-yellow-400"
        : "border") : ""

  // Determine if indicator dot should show
  const showIndicator = currentPlayer?.streak && currentPlayer.streak >= 3
  const indicatorClass =
    currentPlayer?.streak && currentPlayer.streak >= 5
      ? "w-4 h-4 rounded-full bg-gradient-to-r from-red-500 via-yellow-400 to-purple-600 animate-pulse"
      : "w-4 h-4 rounded-full bg-yellow-400"

  return (
    <Card className={clsx("relative", borderClass)}>
      {showIndicator && (
        <div className={clsx("absolute top-2 right-2", indicatorClass)} />
      )}

      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className={large ? "text-primary-foreground/70" : ""}>
            {question.category}
          </CardDescription>
          {timerEndTime && onTimerEnd && <Timer endTime={timerEndTime} onEnd={onTimerEnd} />}
        </div>
        <CardTitle
          ref={ref}
          className={clsx("text-balance", large && !exceeded ? "text-5xl leading-tight" : "text-md leading-snug")}>
          {question.question}
        </CardTitle>
      </CardHeader>

      {showAnswer && answer && (
        <CardContent>
          <div className="p-6 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">Correct Answer:</p>
            <p className="text-4xl font-bold">{answer}</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}