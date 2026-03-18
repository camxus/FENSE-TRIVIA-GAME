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

  const sortedSpecials = React.useMemo(
    () => [...specials].sort((a, b) => a.index - b.index),
    [specials]
  )

  const letterSlots = length - specials.length

  const cleanValue = value.replace(/[^A-Z0-9]/gi, '').slice(0, letterSlots).toUpperCase()

  /* -------------------------
     🔥 Dynamic Resize Logic
  --------------------------*/

  React.useLayoutEffect(() => {
    const handleResize = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth

      const totalSlots = length
      const totalGapSpace = gap * (totalSlots - 1)

      let size = Math.floor(
        (containerWidth - totalGapSpace) / totalSlots
      )

      size = size > 20 ? size : 20 // minimum size

      setSlotSize(size)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
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

  const serializeInput = (val: string) => {
    // Clean input: only A-Z0-9
    const upperVal = val.replace(/[^A-Z0-9]/gi, '').toUpperCase()
    let serialized = ''
    let letterIdx = 0

    for (let i = 0; i < length; i++) {
      const special = sortedSpecials.find(s => s.index === i)

      // Insert special at its index
      if (special) {
        serialized += special.char
        continue // special takes this slot, don't add a letter here
      }

      // Insert next letter if available
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

    const item = feedback[letterIndex]
    if (!item) return ''

    if (item.letter === serializeInput(cleanValue)[letterIndex])
      return 'bg-green-500 text-white border-green-500'

    if (item.letter === null)
      return 'bg-yellow-400 text-white border-yellow-400'

    return 'bg-gray-200 text-white border-gray-200'
  }

  /* -------------------------
     Render
  --------------------------*/

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap justify-center items-center"
      style={{ gap }}
    >
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
        {segments.map((segment, idx) => {
          if (segment.separator) {
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
                    className={`font-bold ${getSlotColor(
                      letterIndex
                    )}`}
                  />
                )
              })}
            </InputOTPGroup>
          )
        })}
      </InputOTP>
    </div >
  )
}