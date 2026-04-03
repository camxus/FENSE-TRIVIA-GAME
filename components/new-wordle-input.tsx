'use client'

import * as React from 'react'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp'
import { useGameAudio } from '@/hooks/use-game-audio'

interface AnswerFeedback {
  letter: string | null
  index: number
}

interface SpecialCharacter {
  char: string
  index: number
}

interface WordleInputProps {
  length: number
  specials: SpecialCharacter[]
  value: string
  onChange: (val: string) => void
  feedback?: AnswerFeedback[] | null
  disabled?: boolean
  gap?: number
}

export function WordleInput({
  length,
  specials,
  value,
  onChange,
  feedback = [],
  disabled,
  gap = 8,
}: WordleInputProps) {
  const { playCorrectAnswerAudio } = useGameAudio()

  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const [slotSize, setSlotSize] = React.useState(48)
  const [needsWrap, setNeedsWrap] = React.useState(false)

  const sortedSpecials = React.useMemo(
    () => [...specials].sort((a, b) => a.index - b.index),
    [specials]
  )

  const letterSlots = length - specials.length

  const cleanValue = value.replace(/[^A-Z0-9]/gi, '').slice(0, letterSlots).toUpperCase()

  /* -------------------------
     Dynamic Resize Logic
  --------------------------*/

  React.useEffect(() => {
    if (!containerRef.current) return

    const observer = new ResizeObserver(() => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth
      const totalGapSpace = gap * (length - 1)
      const minTotalWidth = length * 30 + totalGapSpace

      setNeedsWrap(minTotalWidth > containerWidth)

      let size = Math.floor((containerWidth - totalGapSpace) / length)
      size = size > 30 ? size : 30

      setSlotSize(size)
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [length, gap])

  /* -------------------------
     Segment Logic
  --------------------------*/

  const segments = React.useMemo(() => {
    const result: {
      start: number
      length: number
      separator?: string
    }[] = []

    let previousIndex = 0

    sortedSpecials.forEach((special) => {
      const segmentLength = special.index - previousIndex

      if (segmentLength > 0) {
        result.push({
          start: previousIndex,
          length: segmentLength,
        })
      }

      result.push({
        start: special.index,
        length: 0,
        separator: special.char,
      })

      previousIndex = special.index + 1
    })

    if (previousIndex < length) {
      result.push({
        start: previousIndex,
        length: length - previousIndex,
      })
    }

    return result
  }, [sortedSpecials, length])

  /* -------------------------
     Row Splitting Logic
  --------------------------*/

  const rows = React.useMemo(() => {
    const result: typeof segments[] = []
    let current: typeof segments = []

    for (const segment of segments) {
      if (segment.separator === ' ' && needsWrap) {
        result.push(current)
        current = []
      } else {
        current.push(segment)
      }
    }
    result.push(current)
    return result
  }, [segments, needsWrap])

  const serializeInput = (val: string) => {
    const upperVal = val.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    let serialized = ''
    let letterIdx = 0

    for (let i = 0; i < length; i++) {
      const special = sortedSpecials.find(s => s.index === i)

      if (special) {
        serialized += special.char
        continue
      }

      if (letterIdx < upperVal.length) {
        serialized += upperVal[letterIdx]
        letterIdx++
      }
    }

    return serialized
  }

  const getLetterIndex = (globalIndex: number) => {
    let specialsBefore = 0
    for (const s of sortedSpecials) {
      if (s.index < globalIndex) specialsBefore++
      else break
    }
    return globalIndex - specialsBefore
  }

  /* -------------------------
     Feedback
  --------------------------*/

  React.useEffect(() => {
    if (!feedback || feedback.length === 0) return

    const allCorrect =
      feedback.length === cleanValue.length &&
      feedback.every((f, i) => f.letter === cleanValue[i])

    if (allCorrect && cleanValue.length === letterSlots) {
      playCorrectAnswerAudio()
    }
  }, [feedback, cleanValue, letterSlots])

  const getSlotColor = (letterIndex: number) => {
    if (!feedback) return ''

    const item = feedback.find(f => f.index === letterIndex)
    if (!item) return ''

    if (item.letter === serializeInput(cleanValue)[letterIndex])
      return 'bg-green-500 text-white border-green-500'

    if (item.letter === null)
      return 'bg-yellow-400 text-white border-yellow-400'

    return ''
  }

  /* -------------------------
     Render
  --------------------------*/

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center w-full"
      style={{ gap }}
    >
      {rows.map((rowSegments, rowIdx) => (
        <div key={rowIdx} className="flex justify-center items-center" style={{ gap }}>
          <InputOTP
            maxLength={letterSlots}
            value={cleanValue}
            onChange={(val) => {
              onChange(serializeInput(val))
            }}
            disabled={disabled}
            inputMode="text"
            pattern="[A-Za-z0-9]*"
          >
            {rowSegments.map((segment, idx) => {
              if (segment.separator) {
                if (segment.separator === ' ') {
                  return <div key={`sep-${idx}`} style={{ width: slotSize * 0.5 }} />
                }

                return (
                  <div
                    key={`sep-${idx}`}
                    style={{
                      height: slotSize,
                      fontSize: slotSize * 0.5,
                    }}
                    className="flex items-center justify-center font-bold px-2"
                  >
                    {segment.separator}
                  </div>
                )
              }

              const startLetterIndex = getLetterIndex(segment.start)

              return (
                <InputOTPGroup key={`grp-${idx}`} className="flex">
                  {Array.from({ length: segment.length }).map((_, i) => {
                    const globalIndex = segment.start + i
                    const letterIndex = startLetterIndex + i

                    return (
                      <InputOTPSlot
                        key={globalIndex}
                        index={letterIndex}
                        style={{
                          width: slotSize,
                          height: slotSize,
                          fontSize: slotSize * 0.45,
                        }}
                        className={`font-bold ${getSlotColor(letterIndex)}`}
                      />
                    )
                  })}
                </InputOTPGroup>
              )
            })}
          </InputOTP>
        </div>
      ))}
    </div>
  )
}
