"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState } from "react"

interface RoomCodeDisplayProps {
  roomCode: string
}

export function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20">
      <div className="text-center space-y-3">
        <p className="text-sm text-muted-foreground">Share this code with your friends:</p>
        <div className="flex items-center justify-center gap-3">
          <p className="text-5xl font-bold tracking-wider font-mono">{roomCode}</p>
          <Button variant="outline" size="icon" onClick={copyToClipboard}>
            {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
          </Button>
        </div>
      </div>
    </Card>
  )
}
