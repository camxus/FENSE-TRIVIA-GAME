import { useGameAudio } from "@/hooks/use-game-audio";
import { useState, useEffect, useRef } from "react";

interface AnswerFeedback {
  letter: string | null;
  index: number;
}

interface WordleInputProps {
  length: number;
  value: string;
  onChange: (val: string) => void;
  feedback?: AnswerFeedback[] | null;
  disabled?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  gap?: number; // optional gap in px
}

export function WordleInput({
  length,
  value,
  onChange,
  feedback = [],
  disabled,
  onKeyDown,
  gap = 8, // default 8px
}: WordleInputProps) {
  const { playCorrectAnswerAudio } = useGameAudio();
  const [letters, setLetters] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [inputSize, setInputSize] = useState<number>(48);

  useEffect(() => {
    setLetters(value.split("").concat(Array(length - value.length).fill("")));
  }, [value, length]);

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
      const totalGap = gap * (length - 1);
      const size = (containerWidth - totalGap) / length;
      setInputSize(size);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [length, gap]);

  const handleChange = (idx: number, val: string) => {
    const newLetters = [...letters];
    newLetters[idx] = val.toUpperCase().slice(-1);
    setLetters(newLetters);
    onChange(newLetters.join(""));

    if (val && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    idx: number
  ) => {
    if (onKeyDown) onKeyDown(e);

    if (e.key === "Backspace") {
      if (letters[idx]) {
        const newLetters = [...letters];
        newLetters[idx] = "";
        setLetters(newLetters);
        onChange(newLetters.join(""));
      } else if (idx > 0) {
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const getBgColor = (idx: number) => {
    if (!feedback || letters.length !== length) return "bg-background";
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
    <div ref={containerRef} className="flex gap-2 flex-nowrap">
      {letters.map((letter, idx) => (
        <input
          key={idx}
          ref={(el) => { inputRefs.current[idx] = el }}
          type="text"
          maxLength={1}
          value={letter}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          style={{ width: inputSize, height: inputSize, caretColor: "transparent" }}
          className={`text-center text-2xl font-bold border ${getBgColor(
            idx
          )} border-gray-300 rounded`}
        />
      ))}
    </div>
  );
}
