"use client"

import { motion, useAnimation } from "framer-motion";
import React, { useEffect } from "react";

export default function LogoIntro() {
  const logoControls = useAnimation();
  const containerControls = useAnimation();

  useEffect(() => {
    async function sequence() {
      // Fade in + reveal logo
      await logoControls.start({
        opacity: 1,
        clipPath: "inset(0 0% 0 0)",
        transition: { delay: 0.4, duration: 0.3, ease: "easeInOut" },
      });

      // Wait 1 second
      await new Promise((res) => setTimeout(res, 1000));

      // Fade out entire container
      await containerControls.start({
        opacity: 0,
        transition: { duration: 1 },
      });
    }

    sequence();
  }, [logoControls, containerControls]);

  return (
      <motion.div
      className="w-screen h-screen fixed top-0 z-100 flex items-center justify-center bg-background pointer-events-none"
      initial={{ opacity: 1 }}
      animate={containerControls}
    >
      <motion.img
        src="/fense-logo.png"
        alt="Logo"
        className="w-60 h-60 object-contain"
        initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
        animate={logoControls}
      />
    </motion.div>
  );
}
