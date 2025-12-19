"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Trash2 } from "lucide-react"

interface Player {
  id: string
  name: string
  score: number
}

interface PlayerListProps {
  players: Player[]
  onRemovePlayer?: (playerId: string) => void
  showRemove?: boolean
  leaderId?: string
}

export function PlayerList({ players, onRemovePlayer, showRemove = false, leaderId }: PlayerListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Players ({players.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {players.map((player) => (
            <div key={player.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-medium">{player.name}</span>
                {player.id === leaderId && (
                  <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">Leader</span>
                )}
              </div>
              {showRemove && onRemovePlayer && player.id !== leaderId && (
                <Button variant="ghost" size="icon" onClick={() => onRemovePlayer(player.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
