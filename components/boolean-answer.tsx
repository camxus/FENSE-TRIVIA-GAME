import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface BooleanAnswerProps {
  onAnswer: (value: string) => void
  feedback?: boolean
}

export function BooleanAnswer({ onAnswer, feedback }: BooleanAnswerProps) {
  const [lastGuess, setLastGuess] = useState<string | null>(null)
  const trueRef = useRef<HTMLButtonElement>(null)
  const falseRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!feedback || feedback || !lastGuess) return

    const ref = lastGuess === "true" ? trueRef : falseRef
    const el = ref.current
    if (!el) return

    // Remove class, force reflow, re-add — so animation retriggers every wrong guess
    el.classList.remove("animate-pulse-once", "border-destructive", "text-destructive")
    void el.offsetWidth // force reflow
    el.classList.add("animate-pulse-once", "border-destructive", "text-destructive")

    const t = setTimeout(() => {
      el.classList.remove("animate-pulse-once", "border-destructive", "text-destructive")
    }, 600)

    return () => clearTimeout(t)
  }, [feedback])

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