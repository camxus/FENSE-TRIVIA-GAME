"use client"

import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
import { useState, useMemo } from "react"
import { QRCodeCanvas } from "qrcode.react"

interface RoomCodeDisplayProps {
  roomCode: string
}

export function RoomCodeDisplay({ roomCode }: RoomCodeDisplayProps) {
  const [copied, setCopied] = useState(false)

  const joinUrl = useMemo(() => {
    if (typeof window === "undefined") return ""
    return `${window.location.origin}/online?room=${roomCode}`
  }, [roomCode])

  const copyToClipboard = () => {
    navigator.clipboard.writeText(joinUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/20 to-accent/20">
      <div className="flex flex-col gap-3 items-center">
        {/* Code + copy */}
        <div className="text-center md:text-left space-y-3">
          <p className="text-sm text-muted-foreground">
            Share this code with your friends
          </p>

          <div className="flex items-center justify-center md:justify-start gap-3">
            <p className="text-4xl md:text-5xl font-bold tracking-wider font-mono">
              {roomCode}
            </p>

            <Button variant="outline" size="icon" onClick={copyToClipboard}>
              {copied ? (
                <Check className="h-5 w-5" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* QR code */}
        <div className="flex flex-col items-center gap-2">
          <QRCodeCanvas
            value={joinUrl}
            bgColor="transparent"
            fgColor="#000"
            level="M"
            style={{width: "100%", height: "100%"}}
            includeMargin
          />
        </div>
      </div>
    </Card>
  )
}
