"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface Player {
  id: string
  name: string
  score: number
}

interface ScoreboardProps extends React.HTMLAttributes<HTMLDivElement> {
  players: Player[]
  cardTitle?: string
  cardDescription?: string
}

export function Scoreboard({ cardTitle = "Scoreboard", cardDescription, players, ...props }: ScoreboardProps) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score)

  // Parent variants with staggered children
  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1, when: "beforeChildren" },
    },
    exit: { opacity: 0, transition: { staggerChildren: 0.05, staggerDirection: -1 } },
  }

  // Individual item variants
  const itemVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
  }

  return (
    <Card {...props}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          {cardTitle}
        </CardTitle>
        <CardDescription className="text-center">{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          className="space-y-2"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={listVariants}
        >
          <AnimatePresence>
            {sortedPlayers.map((player, index) => (
              <motion.div
                key={player.id}
                className="flex items-center justify-between p-3 bg-secondary rounded-lg"
                variants={itemVariants}
                layout
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-muted-foreground">#{index + 1}</span>
                  <span className="font-medium">{player.name}</span>
                </div>
                <span className="font-bold text-lg">{player.score}</span>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </CardContent>
    </Card>
  )
}
