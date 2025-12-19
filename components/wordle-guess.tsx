"use client"

interface WordleGuessProps {
  guess: string
  answer: string
}

export function WordleGuess({ guess, answer }: WordleGuessProps) {
  const normalizedGuess = guess.toUpperCase().padEnd(answer.length, " ")
  const normalizedAnswer = answer.toUpperCase()

  const getLetterStatus = (letter: string, index: number): "correct" | "present" | "absent" => {
    if (letter === " ") return "absent"
    if (normalizedAnswer[index] === letter) return "correct"
    if (normalizedAnswer.includes(letter)) return "present"
    return "absent"
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Your guess:</p>
      <div className="flex gap-2 flex-wrap justify-center">
        {Array.from(normalizedGuess).map((letter, index) => {
          const status = getLetterStatus(letter, index)
          return (
            <div
              key={index}
              className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded border-2 ${
                status === "correct"
                  ? "bg-green-500 text-white border-green-600"
                  : status === "present"
                    ? "bg-yellow-500 text-white border-yellow-600"
                    : "bg-muted text-muted-foreground border-border"
              }`}
            >
              {letter !== " " ? letter : ""}
            </div>
          )
        })}
      </div>
    </div>
  )
}
