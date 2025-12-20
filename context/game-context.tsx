"use client"

import { useGameSocket } from "@/hooks/use-game-socket"
import { createContext, useContext } from "react"


const GameContext = createContext<ReturnType<typeof useGameSocket> | null>(null)

export function GameProvider({ children }: { children: React.ReactNode }) {
  const game = useGameSocket()
  return <GameContext.Provider value={game}>{children}</GameContext.Provider>
}

export function useGame() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error("useGame must be used within GameProvider")
  return ctx
}
