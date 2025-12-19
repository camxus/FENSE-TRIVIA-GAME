"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useState } from "react"

export interface Reaction {
  id: string
  emoji: string
}

interface ReactionsProps {
  activeReactions: Reaction[]
  onClick: (emoji: string) => void
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"]

const getRandom = (min: number, max: number) => Math.random() * (max - min) + min;

export function Reactions({ activeReactions, onClick }: ReactionsProps) {
  const [windowWidth, setWindowWidth] = useState(0);
  const [windowHeight, setWindowHeight] = useState(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    setWindowHeight(window.innerHeight);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      <div className="absolute bottom-6 w-full flex justify-center gap-2 pointer-events-auto z-60">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onClick(emoji)}
            className="text-2xl p-2 bg-white/20 rounded-full backdrop-blur-md hover:bg-white/40 transition"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Floating reactions */}
      <AnimatePresence>
        {activeReactions.map((reaction) => {
          const size = getRandom(24, 64);
          const xStart = getRandom(0, windowWidth);
          const xEnd = xStart + getRandom(-100, 100);
          const duration = getRandom(2, 4);

          return (
            <motion.div
              key={reaction.id}
              className="absolute"
              style={{
                fontSize: size,
                left: xStart,
                bottom: 0,
              }}
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{
                opacity: 1,
                y: -windowHeight - getRandom(0, 200),
                x: xEnd,
                scale: getRandom(0.8, 1.2),
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: duration,
                ease: "easeOut",
              }}
            >
              {reaction.emoji}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
