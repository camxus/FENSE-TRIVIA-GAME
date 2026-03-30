import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import LogoIntro from "@/components/logo-intro"
import { AnimatePresence } from "framer-motion"
import { GameProvider } from "@/context/game-context"
import { ModalProvider } from "@/components/layout/modal-provider"
import { ToastProvider } from "@/components/ui/toast"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Fense - The Game",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans antialiased`}>
        <ToastProvider>
          <GameProvider>
            <ModalProvider>
              <AnimatePresence mode="wait">
                {children}
              </AnimatePresence>
            </ModalProvider>
          </GameProvider>
        </ToastProvider>
        <LogoIntro />
        <Analytics />
      </body>
    </html>
  )
}
