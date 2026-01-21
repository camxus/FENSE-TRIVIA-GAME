import { useEffect, useRef, useState } from "react"

interface UseAutoFontSizeOptions {
  maxLines?: number
}

export function useAutoFontSize<T extends HTMLElement>(
  deps: any[] = [],
  { maxLines = 3 }: UseAutoFontSizeOptions = {}
) {
  const ref = useRef<T>(null)
  const [exceeded, setExceeded] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const measure = () => {
      const style = getComputedStyle(el)
      const lineHeight = parseFloat(style.lineHeight)
      const lines = Math.round(el.scrollHeight / lineHeight)

      setExceeded(lines > maxLines)
    }

    measure()

    // Re-measure on resize
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, deps)

  return { ref, exceeded }
}
