"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Volume2, Pause, Play, Loader2 } from "lucide-react"

type PlayerState = "idle" | "loading" | "playing" | "paused" | "error"

type Props = {
  text: string
  voiceGender?: string
  voiceStyle?: string
  voiceSpeed?: number
  autoPlay?: boolean
}

export function AudioPlayer({ text, voiceGender = "female", voiceStyle = "warm", voiceSpeed = 1.0, autoPlay = false }: Props) {
  const [state, setState] = useState<PlayerState>("idle")
  const [progress, setProgress] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const didAutoPlayRef = useRef(false)

  const cleanup = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
      audioRef.current = null
    }
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = null
    }
  }, [])

  useEffect(() => cleanup, [cleanup])

  const fetchAndPlay = useCallback(async () => {
    setState("loading")
    try {
      cleanup()

      const res = await fetch("/api/voice/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, gender: voiceGender, style: voiceStyle, speed: voiceSpeed }),
      })
      if (!res.ok) throw new Error("Failed to generate audio")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      blobUrlRef.current = url

      const audio = new Audio(url)
      audioRef.current = audio

      audio.ontimeupdate = () => {
        setProgress(audio.duration ? audio.currentTime / audio.duration : 0)
      }
      audio.onended = () => {
        setState("idle")
        setProgress(0)
      }
      audio.onerror = () => {
        setState("error")
        setTimeout(() => setState("idle"), 2000)
      }

      await audio.play()
      setState("playing")
    } catch {
      setState("error")
      setTimeout(() => setState("idle"), 2000)
    }
  }, [text, voiceGender, voiceStyle, voiceSpeed, cleanup])

  useEffect(() => {
    if (autoPlay && !didAutoPlayRef.current && text) {
      didAutoPlayRef.current = true
      fetchAndPlay()
    }
  }, [autoPlay, text, fetchAndPlay])

  const handleClick = () => {
    if (state === "playing") {
      audioRef.current?.pause()
      setState("paused")
    } else if (state === "paused" && audioRef.current) {
      audioRef.current.play()
      setState("playing")
    } else if (state === "idle" || state === "error") {
      fetchAndPlay()
    }
  }

  if (!text) return null

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={state === "loading"}
        className="inline-flex items-center gap-1.5 text-[12px] font-medium transition-colors disabled:opacity-50"
        style={{ color: "var(--plum-soft)" }}
      >
        {state === "loading" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : state === "playing" ? (
          <Pause className="w-3.5 h-3.5" />
        ) : state === "paused" ? (
          <Play className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
        <span>
          {state === "loading"
            ? "Preparing…"
            : state === "playing"
            ? "Pause"
            : state === "paused"
            ? "Resume"
            : state === "error"
            ? "Retry"
            : "Listen"}
        </span>
      </button>

      {(state === "playing" || state === "paused") && (
        <div
          className="flex-1 h-px rounded-full relative max-w-[72px]"
          style={{ background: "rgba(43,27,53,0.1)" }}
        >
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-100"
            style={{ width: `${progress * 100}%`, background: "var(--clay)" }}
          />
        </div>
      )}
    </div>
  )
}
