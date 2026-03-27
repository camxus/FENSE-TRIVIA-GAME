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

  if (currentPlayer) currentPlayer.streak = 5

  const streak = currentPlayer?.streak ?? 0
  const isRainbow = streak >= 5
  const isHot = streak >= 3

  return (
    <>
      <style>{`
        @keyframes rainbow-spin {
          0%   { --angle: 0deg; }
          100% { --angle: 360deg; }
        }
        @property --angle {
          syntax: '<angle>';
          initial-value: 0deg;
          inherits: false;
        }

        /* Card border */
        .rainbow-border {
          position: relative;
          border: none !important;
          background: transparent;
        }
        .rainbow-border::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: inherit;
          padding: 3px;
          background: conic-gradient(
            from var(--angle),
            #ff0000, #ff7700, #ffff00, #00ff00,
            #0077ff, #8800ff, #ff0077, #ff0000
          );
          animation: rainbow-spin 2s linear infinite;
          -webkit-mask:
            linear-gradient(#fff 0 0) content-box,
            linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 0;
        }
        .rainbow-border > * {
          position: relative;
          z-index: 1;
        }

        /*
          Badge: no visual spin. Shares the same --angle CSS variable so its
          color stays in phase with the border, but the gradient itself doesn't
          rotate visually — it just shifts hue over time as --angle changes.
          The -315deg offset aligns the displayed color to the top-right corner
          of the conic (where the badge lives on the card).
        */
        .rainbow-badge {
          background: conic-gradient(
            from calc(var(--angle) - 315deg),
            #ff0000, #ff7700, #ffff00, #00ff00,
            #0077ff, #8800ff, #ff0077, #ff0000
          );
          animation: rainbow-spin 2s linear infinite;
        }
      `}</style>

      <Card className={clsx(
        "relative",
        isRainbow
          ? "rainbow-border rounded-lg"
          : isHot
            ? "border-4 border-yellow-400"
            : "border"
      )}>
        {isHot && (
          <div
            className={clsx(
              "w-9 h-9 rounded-full flex items-center justify-center",
              "text-white text-xs font-black shadow-lg",
              isRainbow ? "bg-gray-950" : "bg-yellow-400"
            )}
            style={{ position: "absolute", top: "-0.75rem", right: "-0.75rem", zIndex: 10 }}
          >
            x{streak}
          </div>
        )}

        <CardHeader>
          <div className="flex items-center justify-between">
            <CardDescription className={large ? "text-primary-foreground/70" : ""}>
              {question.category}
            </CardDescription>
            {timerEndTime && onTimerEnd && (
              <Timer endTime={timerEndTime} onEnd={onTimerEnd} />
            )}
          </div>
          <CardTitle
            ref={ref}
            className={clsx(
              "text-balance",
              large && !exceeded ? "text-5xl leading-tight" : "text-md leading-snug"
            )}
          >
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
    </>
  )
}