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
}

export function WordleInput({
  length,
  value,
  onChange,
  feedback = [],
  disabled,
  onKeyDown,
}: WordleInputProps) {
  const [letters, setLetters] = useState<string[]>(Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    setLetters(value.split("").concat(Array(length - value.length).fill("")));
  }, [value, length]);

  const handleChange = (idx: number, val: string) => {
    const newLetters = [...letters];
    newLetters[idx] = val.toUpperCase().slice(-1);
    setLetters(newLetters);
    onChange(newLetters.join(""));

    // Auto focus next input
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
        // Clear current letter
        const newLetters = [...letters];
        newLetters[idx] = "";
        setLetters(newLetters);
        onChange(newLetters.join(""));
      } else if (idx > 0) {
        // Move focus back if empty
        inputRefs.current[idx - 1]?.focus();
      }
    }
  };

  const getBgColor = (idx: number) => {
    if (!feedback) return "bg-background";
    const feedbackItem = feedback.find((f) => f.index === idx);
    if (!feedbackItem) return "bg-background";

    if (feedbackItem.letter === letters[idx]) {
      return "bg-green-500 text-white"; // correct position
    } else if (feedbackItem.letter === null) {
      return "bg-yellow-400 text-white"; // exists elsewhere
    }
    return "bg-gray-100 text-white"; // not in word
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {letters.map((letter, idx) => (
        <input
          key={idx}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          type="text"
          maxLength={1}
          value={letter}
          disabled={disabled}
          onChange={(e) => handleChange(idx, e.target.value)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          style={{ caretColor: "transparent" }}
          className={`w-12 h-12 text-center text-2xl font-bold border ${getBgColor(
            idx
          )} border-gray-300 rounded`}
        />
      ))}
    </div>
  );
}
