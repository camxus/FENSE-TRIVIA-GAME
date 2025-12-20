import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import LogoIntro from "@/components/logo-intro"
import { AnimatePresence } from "framer-motion"
import { GameProvider } from "@/context/game-context"
import { ModalProvider } from "@/components/layout/modal-provider"

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
        <GameProvider>
          <ModalProvider>
            <AnimatePresence mode="wait">
              {children}
            </AnimatePresence>
          </ModalProvider>
        </GameProvider>
        <LogoIntro />
        <Analytics />
      </body>
    </html>
  )
}
