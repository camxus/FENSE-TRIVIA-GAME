"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Timer } from "@/components/timer"

interface Question {
  id: string
  question: string
  category: string
  timeLimit: number
}

interface QuestionDisplayProps {
  question: Question
  timerEndTime?: number | null
  onTimerEnd?: () => void
  large?: boolean
  showAnswer?: boolean
  answer?: string
}

export function QuestionDisplay({
  question,
  timerEndTime,
  onTimerEnd,
  large = false,
  showAnswer = false,
  answer,
}: QuestionDisplayProps) {
  return (
    <Card className={large ? "bg-primary text-primary-foreground" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className={large ? "text-primary-foreground/70" : ""}>{question.category}</CardDescription>
          {timerEndTime && onTimerEnd && <Timer endTime={timerEndTime} onEnd={onTimerEnd} />}
        </div>
        <CardTitle className={`text-balance ${large ? "text-5xl leading-tight" : "text-3xl"}`}>
          {question.question}
        </CardTitle>
      </CardHeader>
      {showAnswer && answer && (
        <CardContent>
          <div className="p-6 bg-primary/10 rounded-lg text-center">
            <p className="text-sm text-muted-foreground mb-2">Correct Answer:</p>
            <p className="text-4xl font-bold">{answer}</p>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
