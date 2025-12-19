export function calculateScore(isCorrect: boolean, timeRemaining: number, basePoints = 100): number {
  if (!isCorrect) return 0
  const timeBonus = Math.max(0, Math.floor(timeRemaining / 1000)) * 10
  return basePoints + timeBonus
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

export function normalizeAnswer(answer: string): string {
  return answer.toUpperCase().trim()
}

export function checkAnswer(guess: string, correctAnswer: string): boolean {
  return normalizeAnswer(guess) === normalizeAnswer(correctAnswer)
}

export function getLeaderboard(players: Array<{ id: string; name: string; score: number }>) {
  return [...players].sort((a, b) => b.score - a.score)
}
