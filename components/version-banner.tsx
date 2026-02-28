"use client"

import { useEffect, useRef, useState } from "react"

const INITIAL_BUILD_ID = process.env.NEXT_PUBLIC_BUILD_ID
const POLL_INTERVAL = 30_000

export function VersionBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)

  useEffect(() => {
    async function checkVersion() {
      try {
        const res = await fetch("/api/version", { cache: "no-store" })
        if (!res.ok) return
        const { buildId } = await res.json()
        if (buildId && buildId !== INITIAL_BUILD_ID) {
          setIsVisible(true)
          if (intervalRef.current) clearInterval(intervalRef.current)
        }
      } catch {
        // network error, skip
      }
    }

    intervalRef.current = setInterval(checkVersion, POLL_INTERVAL)
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    if (countdown <= 0) {
      window.location.reload()
      return
    }

    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [isVisible, countdown])

  if (!isVisible) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-primary text-primary-foreground text-center text-sm py-2">
      New version available. Refresh in {countdown}s...
    </div>
  )
}
