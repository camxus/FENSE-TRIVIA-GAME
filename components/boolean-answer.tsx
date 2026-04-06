import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { AnswerFeedback } from "@/hooks/use-game-socket"

interface BooleanAnswerProps {
  onAnswer: (value: string) => void
  feedback: boolean | null | undefined
  setFeedback: React.Dispatch<
    React.SetStateAction<{
      feedback: AnswerFeedback[]
      isCorrect: boolean | null
    } | null>
  >
}

export function BooleanAnswer({
  onAnswer,
  feedback,
  setFeedback,
}: BooleanAnswerProps) {
  const [lastGuess, setLastGuess] = useState<string | null>(null)
  const prevFeedback = useRef<typeof feedback>(feedback)

  const trueRef = useRef<HTMLButtonElement>(null)
  const falseRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    console.log(feedback)
    if (!lastGuess || feedback === null || prevFeedback.current === feedback) return

    prevFeedback.current = feedback

    const ref = lastGuess === "true" ? trueRef : falseRef
    const el = ref.current
    if (!el) return

    const isCorrect = feedback

    const baseClasses = ["animate-pulse-once"]
    const stateClasses = isCorrect
      ? ["border-green-500", "text-green-500"]
      : ["border-destructive", "text-destructive"]

    // remove both possible states first
    el.classList.remove(
      "animate-pulse-once",
      "border-green-500",
      "text-green-500",
      "border-destructive",
      "text-destructive"
    )

    void el.offsetWidth // force reflow

    el.classList.add(...baseClasses, ...stateClasses)

    const t = setTimeout(() => {
      el.classList.remove(...baseClasses, ...stateClasses)
    }, 600)

    setFeedback({ feedback: [], isCorrect: null })

    return () => clearTimeout(t)
  }, [feedback, lastGuess])

  const handleAnswer = (value: string) => {
    setLastGuess(value)
    onAnswer(value)
  }

  return (
    <div className="flex gap-4">
      {(["true", "false"] as const).map((value) => (
        <Button
          key={value}
          ref={value === "true" ? trueRef : falseRef}
          disabled={!!lastGuess}
          size="lg"
          variant="outline"
          className="w-28 capitalize transition-all"
          onClick={() => handleAnswer(value)}
        >
          {value}
        </Button>
      ))}
    </div>
  )
}