"use client"

import * as React from "react"

interface WordleGuessProps {
  guess: string
  answer: string
  gap?: number
}

const MIN_SLOT_SIZE = 32
const IDEAL_SLOT_SIZE = 48

export function WordleGuess({ guess, answer, gap = 8 }: WordleGuessProps) {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [slotSize, setSlotSize] = React.useState(IDEAL_SLOT_SIZE)
  const [rows, setRows] = React.useState<string[][]>([])

  const normalizedGuess = guess.toString().toUpperCase()
  const normalizedAnswer = answer.toString().toUpperCase()

  const answerWords = normalizedAnswer.split(" ")

  // Precompute word start indices in the flat answer string (accounting for spaces)
  const wordStarts = answerWords.map((_, i) =>
    answerWords.slice(0, i).reduce((sum, w) => sum + w.length, 0) + i
  )

  const getLetterStatus = (
    letter: string,
    index: number
  ): "correct" | "present" | "absent" => {
    if (letter === " ") return "absent"
    if (normalizedAnswer[index] === letter) return "correct"
    if (normalizedAnswer.includes(letter)) return "present"
    return "absent"
  }

  /* -------------------------
     🔥 Dynamic Resize + Word Wrap
  --------------------------*/

  React.useLayoutEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth
      const totalLetters = normalizedAnswer.replace(/ /g, "").length
      const totalLength = normalizedAnswer.length // letters + spaces

      // Try single row
      const singleRowSize = Math.floor(
        (containerWidth - gap * (totalLength - 1)) / totalLength
      )

      if (singleRowSize >= MIN_SLOT_SIZE) {
        setSlotSize(Math.min(singleRowSize, IDEAL_SLOT_SIZE))
        setRows([answerWords])
        return
      }

      // Greedily pack words into rows
      const builtRows: string[][] = []
      let currentRow: string[] = []
      let currentRowLen = 0

      for (const word of answerWords) {
        // +1 for space between words if row is non-empty
        const lenIfAdded = currentRow.length > 0
          ? currentRowLen + 1 + word.length
          : word.length
        const sizeIfAdded = Math.floor(
          (containerWidth - gap * (lenIfAdded - 1)) / lenIfAdded
        )

        if (currentRow.length === 0 || sizeIfAdded >= MIN_SLOT_SIZE) {
          currentRow.push(word)
          currentRowLen = lenIfAdded
        } else {
          builtRows.push(currentRow)
          currentRow = [word]
          currentRowLen = word.length
        }
      }
      if (currentRow.length) builtRows.push(currentRow)

      // Slot size based on widest row
      const maxRowLen = Math.max(
        ...builtRows.map(row =>
          row.reduce((sum, w) => sum + w.length, 0) + row.length - 1
        )
      )
      const finalSize = Math.max(
        MIN_SLOT_SIZE,
        Math.floor((containerWidth - gap * (maxRowLen - 1)) / maxRowLen)
      )

      setSlotSize(Math.min(finalSize, IDEAL_SLOT_SIZE))
      setRows(builtRows)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [normalizedAnswer, gap])

  /* -------------------------
     Render
  --------------------------*/

  return (
    <div className="space-y-2">
      <p className="text-sm text-muted-foreground">Your guess:</p>

      <div ref={containerRef} className="flex flex-col items-center w-full" style={{ gap }}>
        {rows.map((rowWords, rowIdx) => (
          <div key={rowIdx} className="flex items-center justify-center" style={{ gap: gap * 3 }}>
            {rowWords.map((word) => {
              // Find which word this is in the original answerWords to get the right startIndex
              const wordIdx = answerWords.indexOf(word, rowWords.slice(0, rowWords.indexOf(word)).length)
              const startIndex = wordStarts[wordIdx]

              const guessWord = normalizedGuess
                .slice(startIndex, startIndex + word.length)
                .padEnd(word.length, " ")

              return (
                <div key={wordIdx} className="flex" style={{ gap }}>
                  {Array.from(guessWord).map((letter, i) => {
                    const absoluteIndex = startIndex + i
                    const status = getLetterStatus(letter, absoluteIndex)

                    return (
                      <div
                        key={absoluteIndex}
                        style={{ width: slotSize, height: slotSize, fontSize: slotSize * 0.45 }}
                        className={`flex items-center justify-center font-bold rounded border-2 ${
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
        ))}
      </div>
    </div>
  )
}