"use client"

import { io, type Socket } from "socket.io-client"

let socket: Socket | null = null

export function getSocket(connectionId?: string) {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_IO_HOST_URL || "http://localhost:3000", {
      auth: {
        connectionId,
      },
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
