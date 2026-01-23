import { useRef } from "react";

export function useGameAudio() {
  const gameStartedAudioRef = useRef<HTMLAudioElement | null>(null);
  const questionStartedAudioRef = useRef<HTMLAudioElement | null>(null);
  const loserAudioRef = useRef<HTMLAudioElement | null>(null);
  const correctAnswerAudioRef = useRef<HTMLAudioElement | null>(null);
  const winnerAudioRef = useRef<HTMLAudioElement | null>(null);

  const playGameStartedAudio = () => {
    if (!gameStartedAudioRef.current) {
      gameStartedAudioRef.current = new Audio("/game-started.wav");
      gameStartedAudioRef.current.loop = false;
    }
    const audio = gameStartedAudioRef.current;
    audio.currentTime = 0;
    audio.play().catch((err) => console.error("Failed to play audio:", err));
  };

  const playQuestionStartedAudio = (loop: boolean = true) => {
    if (!questionStartedAudioRef.current) {
      questionStartedAudioRef.current = new Audio("/question-started.wav");
      questionStartedAudioRef.current.loop = true;
    }
    const audio = questionStartedAudioRef.current;
    audio.currentTime = 0;
    audio.play().catch((err) => console.error("Failed to play audio:", err));
  };

  const playLoserAudio = () => {
    if (!loserAudioRef.current) {
      loserAudioRef.current = new Audio("/loser.wav");
      loserAudioRef.current.loop = false;
    }
    const audio = loserAudioRef.current;
    audio.currentTime = 0;
    audio.play().catch((err) => console.error("Failed to play audio:", err));
  };

  const playCorrectAnswerAudio = () => {
    if (!correctAnswerAudioRef.current) {
      correctAnswerAudioRef.current = new Audio("/winner.wav");
      correctAnswerAudioRef.current.loop = false;
    }
    const audio = correctAnswerAudioRef.current;
    audio.currentTime = 0;
    audio.play().catch((err) => console.error("Failed to play audio:", err));
  };

  const playFinalWinnerAudio = () => {
    if (!winnerAudioRef.current) {
      winnerAudioRef.current = new Audio("/winner2.wav");
      winnerAudioRef.current.loop = false;
    }
    const audio = winnerAudioRef.current;
    audio.currentTime = 0;
    audio.play().catch((err) => console.error("Failed to play audio:", err));
  };

  return {
    questionStartedAudioRef,
    loserAudioRef,
    winnerAudioRef,
    playGameStartedAudio,
    playQuestionStartedAudio,
    playLoserAudio,
    playCorrectAnswerAudio,
    playFinalWinnerAudio,
  };
}