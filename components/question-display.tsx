"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Timer } from "@/components/timer"
import { useAutoFontSize } from "./ui/use-auto-font-size"

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
  const { ref, exceeded } = useAutoFontSize<HTMLHeadingElement>(
    [question.question],
    { maxLines: 3 }
  )

  return (
    <>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardDescription className={large ? "text-primary-foreground/70" : ""}>{question.category}</CardDescription>
          {timerEndTime && onTimerEnd && <Timer endTime={timerEndTime} onEnd={onTimerEnd} />}
        </div>
        <CardTitle
          ref={ref}
          className={`text-balance ${large && !exceeded
              ? "text-5xl leading-tight"
              : "text-md leading-snug"
            }`}>
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
    </>
  )
}
