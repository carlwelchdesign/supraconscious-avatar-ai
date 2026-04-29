"use client"

import { useState, useRef, useCallback } from "react"
import { Mic, Square, Loader2 } from "lucide-react"

type MicState = "idle" | "recording" | "processing" | "error"

type Props = {
  onTranscribe: (text: string) => void
  disabled?: boolean
}

export function MicButton({ onTranscribe, disabled }: Props) {
  const [state, setState] = useState<MicState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
  }, [])

  const startRecording = useCallback(async () => {
    setErrorMsg("")
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType })

        if (blob.size < 500) {
          setState("idle")
          return
        }

        setState("processing")
        try {
          const fd = new FormData()
          fd.append("audio", blob, "recording.webm")
          const res = await fetch("/api/voice/transcribe", { method: "POST", body: fd })
          const data = await res.json()
          if (!res.ok) throw new Error(data.error ?? "Transcription failed")
          onTranscribe(data.text)
          setState("idle")
        } catch (e) {
          const msg = e instanceof Error ? e.message : "Transcription failed"
          setErrorMsg(msg)
          setState("error")
          setTimeout(() => setState("idle"), 3000)
        }
      }

      mediaRecorder.start()
      setState("recording")
    } catch (e) {
      const msg =
        e instanceof Error && e.name === "NotAllowedError"
          ? "Microphone access denied"
          : "Microphone unavailable"
      setErrorMsg(msg)
      setState("error")
      setTimeout(() => setState("idle"), 3000)
    }
  }, [onTranscribe])

  const handleClick = () => {
    if (state === "recording") stopRecording()
    else if (state === "idle") startRecording()
  }

  const isRecording = state === "recording"
  const isProcessing = state === "processing"

  return (
    <div className="relative inline-flex items-center">
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        title={isRecording ? "Stop recording" : "Dictate entry"}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: isRecording ? "var(--clay)" : "rgba(43,27,53,0.06)",
          color: isRecording ? "var(--cream)" : "var(--plum-soft)",
        }}
      >
        {isRecording && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: "var(--clay)", opacity: 0.3 }}
          />
        )}
        <span className="relative z-10">
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isRecording ? (
            <Square className="w-3.5 h-3.5" fill="currentColor" />
          ) : (
            <Mic className="w-4 h-4" />
          )}
        </span>
      </button>

      {state === "error" && errorMsg && (
        <span
          className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[11px] font-light whitespace-nowrap px-3 py-1.5 rounded-xl shadow-sm"
          style={{
            background: "var(--pearl)",
            color: "var(--destructive)",
            border: "1px solid rgba(191,64,64,0.15)",
          }}
        >
          {errorMsg}
        </span>
      )}
    </div>
  )
}
