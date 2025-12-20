"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useGame } from "@/context/game-context";

export function ChatMessagesModal() {
  const {
    playerId,
    chatMessages,
    sendChatMessage
  } = useGame();

  const [message, setMessage] = useState("");

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {chatMessages.map((msg) => {
          const isMe = msg.senderId === playerId;

          return (
            <div
              key={msg.id}
              className={cn(
                "max-w-[80%] rounded-xl px-3 py-2 text-sm",
                isMe
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted"
              )}
            >
              {!isMe && (
                <div className="text-xs font-semibold opacity-70 mb-1">
                  {msg.senderName}
                </div>
              )}
              {msg.message}
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div className="pt-3 border-t flex gap-2">
        <Input
          value={message}
          placeholder="Type a message…"
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendChatMessage(message);
              setMessage("");
            }
          }}
        />
        <Button
          onClick={() => {
            sendChatMessage(message);
            setMessage("");
          }}
        >
          Send
        </Button>
      </div>
    </div>
  );
}
