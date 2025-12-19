import { useRef } from "react";

export function useGameAudio() {
  const gameStartedAudioRef = useRef<HTMLAudioElement | null>(null);
  const loserAudioRef = useRef<HTMLAudioElement | null>(null);
  const correctAnswerAudioRef = useRef<HTMLAudioElement | null>(null);
  const winnerAudioRef = useRef<HTMLAudioElement | null>(null);

  const playGameStartedAudio = (loop: boolean = true) => {
    if (!gameStartedAudioRef.current) {
      gameStartedAudioRef.current = new Audio("/question-started.wav");
      gameStartedAudioRef.current.loop = loop;
    }
    const audio = gameStartedAudioRef.current;
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
    gameStartedAudioRef,
    loserAudioRef,
    winnerAudioRef,
    playGameStartedAudio,
    playLoserAudio,
    playCorrectAnswerAudio,
    playFinalWinnerAudio,
  };
}