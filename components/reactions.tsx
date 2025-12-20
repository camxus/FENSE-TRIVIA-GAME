import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { useModal } from "@/hooks/use-modal";
import { ChatMessagesModal } from "./chat-messages-modal";
import { Position } from "./layout/modal-provider";
import { useGame } from "@/context/game-context";

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

export interface InternalBubble {
  id: string;
  message: string;
  senderName: string;
  xStart: number;
  xEnd: number;
  yEnd: number;
  duration: number;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "🎉", "🔥"];

export function Reactions() {
  const modal = useModal();
  const { chatMessages, activeMessages, activeReactions, sendReaction } = useGame();

  const [reactions, setReactions] = useState<InternalReaction[]>([]);
  const seenReactionIds = useRef(new Set<string>());

  const [chatBubbles, setChatBubbles] = useState<InternalBubble[]>([]);
  const seenBubbleIds = useRef(new Set<string>());

  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastSeenMessageId, setLastSeenMessageId] = useState<string | null>(null);

  useEffect(() => {
    setViewport({ w: window.innerWidth, h: window.innerHeight });
  }, []);

  /** Only append NEW reactions */
  useEffect(() => {
    const newOnes: InternalReaction[] = [];

    for (const r of activeReactions) {
      if (seenReactionIds.current.has(r.id)) continue;

      seenReactionIds.current.add(r.id);

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

  // Whenever chatMessages updates
  useEffect(() => {
    const newBubbles: InternalBubble[] = [];

    for (const msg of activeMessages) {
      if (seenBubbleIds.current.has(msg.id)) continue;

      seenBubbleIds.current.add(msg.id);

      const xStart = Math.random() * viewport.w;

      newBubbles.push({
        ...msg,
        xStart,
        xEnd: xStart + Math.random() * 200 - 100,
        yEnd: -viewport.h - Math.random() * 200,
        duration: Math.random() * 2 + 2,
      });
    }

    if (newBubbles.length) {
      setChatBubbles((prev) => [...prev, ...newBubbles]);
    }
  }, [activeMessages, viewport]);


  // Update unread count whenever new messages arrive
  useEffect(() => {
    if (!lastSeenMessageId && !!chatMessages.length) {
      setUnreadCount(chatMessages.length);
    } else if (lastSeenMessageId) {
      const index = chatMessages.findIndex((m) => m.id === lastSeenMessageId);
      
      if (!chatMessages[index].senderId) { return }

      setUnreadCount(chatMessages.length - (index + 1));
    }
  }, [chatMessages, lastSeenMessageId]);

  const removeReaction = (id: string) => {
    setReactions((prev) => prev.filter((r) => r.id !== id));
    seenReactionIds.current.delete(id);
  };

  const removeChatBubble = (id: string) => {
    setChatBubbles((prev) => prev.filter((b) => b.id !== id));
    seenBubbleIds.current.delete(id); // optional if you want to allow repeat bubbles
  };

  const handleShowChat = () => {
    modal.show({
      content: ChatMessagesModal,
      position: Position.RIGHT,
      width: "420px",
    });
    // Mark all messages as read
    if (chatMessages.length > 0) {
      setLastSeenMessageId(chatMessages[chatMessages.length - 1].id);
      setUnreadCount(0);
    }
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {/* Buttons */}
      <div className="absolute h-[3.4rem] bottom-6 w-full flex justify-center gap-2 pointer-events-auto">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => sendReaction(emoji)}
            className="cursor-pointer text-2xl h-14 w-14 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/40 transition"
          >
            {emoji}
          </button>
        ))}
        <button
          onClick={handleShowChat}
          className="cursor-pointer flex items-center justify-center text-2xl h-14 w-14 rounded-full bg-black/30 backdrop-blur-md hover:bg-black/40 transition"
        >
          {!!unreadCount && (
            <motion.div
              className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"
              initial={{ opacity: 0 }}
              animate={{ opacity: [1, 0.7, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "loop" }}
            />
          )}
          <MessageSquare className="text-white" />
        </button>
      </div>

      {/* Floating reactions */}
      <AnimatePresence>
        {reactions.map((r) => (
          <motion.div
            key={r.id}
            className="absolute will-change-auto"
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

        {/* Floating chat bubbles */}
        {chatBubbles.map((bubble) => (
          <motion.div
            key={bubble.id}
            className="absolute px-4 py-2 bg-white/90 text-black rounded-xl shadow-lg pointer-events-none will-change-auto"
            style={{
              left: bubble.xStart,
              bottom: 0,
            }}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{
              opacity: 1,
              y: bubble.yEnd,
              x: bubble.xEnd,
              scale: 1,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: bubble.duration, ease: "easeOut" }}
            onAnimationComplete={() => removeChatBubble(bubble.id)}
          >
            <strong>{bubble.senderName}: </strong>
            {bubble.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
