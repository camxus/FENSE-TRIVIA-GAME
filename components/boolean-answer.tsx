import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BooleanAnswerProps {
  onAnswer: (value: string) => void
  feedback?: boolean | null
}

export function BooleanAnswer({ onAnswer, feedback }: BooleanAnswerProps) {
  const [pulsing, setPulsing] = useState<string | null>(null)
  const [lastGuess, setLastGuess] = useState<string | null>(null)

  useEffect(() => {
    if (feedback && !feedback && lastGuess) {
      setPulsing(lastGuess)
      const t = setTimeout(() => setPulsing(null), 600)
      return () => clearTimeout(t)
    }
  }, [feedback])

  const handleAnswer = (value: string) => {
    setLastGuess(value)
    onAnswer(value)
  }

  return (
    <div className="flex gap-4">
      {["true", "false"].map((value) => (
        <Button
          key={value}
          size="lg"
          variant={pulsing === value ? "outline" : "default"}
          className={cn(
            "w-28 capitalize transition-all",
            pulsing === value && "border-destructive text-destructive animate-pulse-once"
          )}
          onClick={() => handleAnswer(value)}
        >
          {value}
        </Button>
      ))}
    </div>
  )
}