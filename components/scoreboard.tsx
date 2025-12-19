"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"

interface Player {
  id: string
  name: string
  score: number
}

interface ScoreboardProps {
  players: Player[]
}

export function Scoreboard({ players }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Scoreboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {sortedPlayers.map((player, index) => (
            <div key={player.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-3">
                <span className="font-bold text-muted-foreground">#{index + 1}</span>
                <span className="font-medium">{player.name}</span>
              </div>
              <span className="font-bold text-lg">{player.score}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
