"use client"

import { AnimatePresence } from "framer-motion"
import { ReactNode } from "react"

export default function AnimatedLayout({ children }: { children: ReactNode }) {
    return (
        <AnimatePresence mode="wait">
            {children}
        </AnimatePresence>
    )
}