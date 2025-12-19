import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Reaction {
  id: string;
  emoji: string;
}

interface InternalReaction extends Reaction {
  size: number;
  xStart: number;
  xEnd: number;
  duration: number;
  yEnd: number;
}

interface ReactionsProps {
  activeReactions: Reaction[];
  onClick: (emoji: string) => void;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];

export function Reactions({ activeReactions, onClick }: ReactionsProps) {
  const [reactions, setReactions] = useState<InternalReaction[]>([]);
  const seenIds = useRef(new Set<string>());

  const [viewport, setViewport] = useState({ w: 0, h: 0 });

  useEffect(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  /** Only append NEW reactions */
  useEffect(() => {
    const newOnes: InternalReaction[] = [];

    for (const r of activeReactions) {
      if (seenIds.current.has(r.id)) continue;

      seenIds.current.add(r.id);

      const xStart = Math.random() * viewport.w;

      newOnes.push({
        ...r,
        size: Math.random() * 40 + 24,
        xStart,
        xEnd: xStart + Math.random() * 200 - 100,
        duration: Math.random() * 2 + 2,
        yEnd: -viewport.h - Math.random() * 200,
      });
    }

    if (newOnes.length) {
      setReactions((prev) => [...prev, ...newOnes]);
    }
  }, [activeReactions, viewport]);

  const removeReaction = (id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
    seenIds.current.delete(id);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Buttons */}
      <div className="absolute bottom-6 w-full flex justify-center gap-2 pointer-events-auto">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onClick(emoji)}
            className="cursor-pointer text-2xl h-14 w-14 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/40 transition"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Floating reactions */}
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            className="absolute"
            style={{
              fontSize: r.size,
              left: r.xStart,
              bottom: 0,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              y: r.yEnd,
              x: r.xEnd,
              scale: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: r.duration, ease: "easeOut" }}
            onAnimationComplete={() => removeReaction(r.id)}
          >
            {r.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
