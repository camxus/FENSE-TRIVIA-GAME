"use client"

import { useState, useEffect } from "react"
import { Clock } from "lucide-react"

interface TimerProps {
  endTime: number
  onEnd: () => void
}

export function Timer({ endTime, onEnd }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(Math.max(0, Math.floor((endTime - Date.now()) / 1000)))

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000))
      setTimeLeft(remaining)

      if (remaining === 0) {
        clearInterval(interval)
        onEnd()
      }
    }, 100)

    return () => clearInterval(interval)
  }, [endTime, onEnd])

  const isUrgent = timeLeft <= 10

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold ${
        isUrgent ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-primary text-primary-foreground"
      }`}
    >
      <Clock className="h-5 w-5" />
      <span>{timeLeft}s</span>
    </div>
  )
}
