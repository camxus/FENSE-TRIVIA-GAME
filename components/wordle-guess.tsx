"use client"

interface WordleGuessProps {
  guess: string
  answer: string
}

export function WordleGuess({ guess, answer }: WordleGuessProps) {
  const normalizedGuess = guess.toUpperCase()
  const normalizedAnswer = answer.toUpperCase()

  const getLetterStatus = (
    letter: string,
    index: number
  ): "correct" | "present" | "absent" => {
    if (letter === " ") return "absent"
    if (normalizedAnswer[index] === letter) return "correct"
    if (normalizedAnswer.includes(letter)) return "present"
    return "absent"
  }

  // 🔑 Split answer to define structure
  const answerWords = normalizedAnswer.split(" ")

  // Precompute word start indices (including spaces)
  const wordStarts = answerWords.map((_, i) =>
    answerWords
      .slice(0, i)
      .reduce((sum, w) => sum + w.length, 0) + i // +i = spaces before
  )

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Your guess:</p>

      <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
        {answerWords.map((answerWord, wordIdx) => {
          const startIndex = wordStarts[wordIdx]
          const wordLen = answerWord.length

          const guessWord = normalizedGuess
            .slice(startIndex, startIndex + wordLen)
            .padEnd(wordLen, " ")

          return (
            <div key={wordIdx} className="flex gap-2">
              {Array.from(guessWord).map((letter, i) => {
                const absoluteIndex = startIndex + i
                const status = getLetterStatus(letter, absoluteIndex)

                return (
                  <div
                    key={absoluteIndex}
                    className={`w-12 h-12 flex items-center justify-center text-xl font-bold rounded border-2 ${
                      status === "correct"
                        ? "bg-green-500 text-white border-green-600"
                        : status === "present"
                        ? "bg-yellow-500 text-white border-yellow-600"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {letter}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
