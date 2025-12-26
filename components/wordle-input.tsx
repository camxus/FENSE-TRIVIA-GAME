import { useGameAudio } from "@/hooks/use-game-audio";
import { useState, useEffect, useRef } from "react";

interface AnswerFeedback {
  letter: string | null;
  index: number;
}

interface WordleInputProps {
  length: number[] | number;
  value: string;
  onChange: (val: string) => void;
  feedback?: AnswerFeedback[] | null;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  gap?: number;       // gap between letters
  wordGap?: number;  // gap between words
}

export function WordleInput({
  length,
  value,
  onChange,
  feedback = [],
  disabled,
  onKeyDown,
  gap = 8,
  wordGap = 24,
}: WordleInputProps) {
  const wordLengths = Array.isArray(length) ? length : [length];
  const totalLength = wordLengths.reduce((a, b) => a + b, 0);

  const { playCorrectAnswerAudio } = useGameAudio();
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inputSize, setInputSize] = useState<number>(48);

  const [letters, setLetters] = useState<string[]>(
    Array(totalLength).fill("")
  );

  useEffect(() => {
    const clean = value.replace(/\s+/g, ""); // remove spaces
    setLetters(
      clean
        .slice(0, totalLength)
        .split("") // convert to string[]
        .concat(Array(totalLength - clean.length).fill(""))
    );
  }, [value, totalLength]);


  useEffect(() => {
    if (!feedback || feedback.length === 0) return;

    const allCorrect = feedback.every(
      (f) => f.letter !== null && f.letter === letters[f.index]
    );

    if (allCorrect) {
      playCorrectAnswerAudio();
    }
  }, [letters, feedback]);

  // Dynamically calculate input width & height based on container
  useEffect(() => {

    const handleResize = () => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.clientWidth;

      // total space between letters inside words
      const letterGaps = gap * (totalLength - wordLengths.length);
      const wordGaps = wordGap * (wordLengths.length - 1);

      let size = Math.floor((containerWidth - letterGaps - wordGaps) / totalLength);

      // trigger wrap if too small
      size = size > 30 ? size : 30;

      setInputSize(size);
    };

    handleResize(); // initial sizing

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [totalLength, gap, wordGap, wordLengths.length]);

  const serializeWithSpaces = (letters: string[]) => {
    let result = "";
    let cursor = 0;

    wordLengths.forEach((len, i) => {
      result += letters.slice(cursor, cursor + len).join("");
      cursor += len;
      if (i < wordLengths.length - 1) {
        result += " ";
      }
    });

    return result;
  };

  const handleChange = (idx: number, val: string) => {
    const newLetters = [...letters];
    newLetters[idx] = val.toUpperCase().slice(-1);
    console.log(newLetters, inputRefs.current[idx + 1])
    setLetters(newLetters);

    onChange(serializeWithSpaces(newLetters));

    if (val && idx < totalLength - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (onKeyDown) onKeyDown(e);

    if (e.key === "Backspace") {
      e.preventDefault();

      const newLetters = [...letters];

      if (newLetters[idx]) {
        // clear current cell
        newLetters[idx] = "";
        setLetters(newLetters);
        onChange(serializeWithSpaces(newLetters));
      } else if (idx > 0) {
        // move left & clear previous cell
        const prevIdx = idx - 1;
        newLetters[prevIdx] = "";
        setLetters(newLetters);
        onChange(serializeWithSpaces(newLetters));
        inputRefs.current[prevIdx]?.focus();
      }
    }
  };

  const getBgColor = (idx: number) => {
    if (!feedback || letters.length !== totalLength) return "bg-background";
    const feedbackItem = feedback.find((f) => f.index === idx);
    if (!feedbackItem) return "bg-background";

    if (feedbackItem.letter === letters[idx]) {
      return "bg-green-500 text-white";
    } else if (feedbackItem.letter === null) {
      return "bg-yellow-400 text-white";
    }
    return "bg-gray-100 text-white";
  };

  return (
    <div
      ref={containerRef}
      className="flex items-center flex-wrap justify-center w-full overflow-hidden"
      style={{ gap: wordGap, rowGap: 16 }}
    >
      {wordLengths.map((wordLen, wordIdx) => {
        const wordStart =
          wordLengths.slice(0, wordIdx).reduce((a, b) => a + b, 0);

        return (
          <div
            key={wordIdx}
            className="flex"
            style={{ gap }}
          >
            {Array.from({ length: wordLen }).map((_, i) => {
              const idx = wordStart + i;

              return (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={letters[idx]}
                  disabled={disabled}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, idx)}
                  style={{
                    width: inputSize,
                    height: inputSize,
                    caretColor: "transparent",
                  }}
                  className={`text-center text-2xl font-bold border ${getBgColor(
                    idx
                  )} border-gray-300 rounded`}
                />
              );
            })}

          </div>
        );
      })}
    </div>
  );
}
