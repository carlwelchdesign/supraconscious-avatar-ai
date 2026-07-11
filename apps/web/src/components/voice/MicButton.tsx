"use client"

import { useState, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"
import { Mic, Square, Loader2 } from "lucide-react"

type MicState = "idle" | "recording" | "processing" | "error"

type Props = {
  onTranscribe: (text: string) => void
  disabled?: boolean
}

const MIME_TYPE_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "audio/mpeg",
]

export function MicButton({ onTranscribe, disabled }: Props) {
  const t = useTranslations("voice.mic")
  const [state, setState] = useState<MicState>("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [hasRetryableRecording, setHasRetryableRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const lastRecordingRef = useRef<Blob | null>(null)

  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current
    if (!recorder || recorder.state === "inactive") return
    recorder.requestData()
    recorder.stop()
  }, [])

  const submitAudio = useCallback(async (blob: Blob) => {
    setState("processing")
    setErrorMsg("")
    try {
      const fd = new FormData()
      fd.append("audio", blob, `recording.${extensionForMimeType(blob.type)}`)
      const res = await fetch("/api/voice/transcribe", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(userFacingTranscriptionError(data.error, res.status, t))
      onTranscribe(data.text)
      lastRecordingRef.current = null
      setHasRetryableRecording(false)
      setState("idle")
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("failed")
      setErrorMsg(msg)
      setState("error")
    }
  }, [onTranscribe, t])

  const startRecording = useCallback(async () => {
    setErrorMsg("")
    try {
      if (!window.isSecureContext) {
        throw new Error(t("https"))
      }
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
        throw new Error(t("unsupported"))
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = getSupportedMimeType()
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const blobType = mediaRecorder.mimeType || chunksRef.current[0]?.type || "audio/webm"
        const blob = new Blob(chunksRef.current, { type: blobType })

        if (blob.size < 500) {
          setErrorMsg(t("noSpeech"))
          lastRecordingRef.current = null
          setHasRetryableRecording(false)
          setState("idle")
          return
        }

        lastRecordingRef.current = blob
        setHasRetryableRecording(true)
        await submitAudio(blob)
      }

      mediaRecorder.start(1000)
      setState("recording")
    } catch (e) {
      const msg = microphoneErrorMessage(e, t)
      setErrorMsg(msg)
      setState("error")
    }
  }, [submitAudio, t])

  const handleClick = () => {
    if (state === "recording") stopRecording()
    else if (state === "idle") startRecording()
    else if (state === "error" && lastRecordingRef.current) submitAudio(lastRecordingRef.current)
  }

  const isRecording = state === "recording"
  const isProcessing = state === "processing"

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || isProcessing}
        title={state === "error" && hasRetryableRecording ? t("retry") : isRecording ? t("stop") : t("dictate")}
        className="relative inline-flex items-center justify-center w-10 h-10 rounded-full transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: isRecording ? "var(--clay)" : state === "error" && hasRetryableRecording ? "rgba(166,95,74,0.1)" : "rgba(43,27,53,0.06)",
          color: isRecording ? "var(--cream)" : state === "error" && hasRetryableRecording ? "var(--clay)" : "var(--plum-soft)",
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
          {hasRetryableRecording ? t("tapToRetry", { message: errorMsg }) : errorMsg}
        </span>
      )}
    </div>
  )
}

function getSupportedMimeType() {
  return MIME_TYPE_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type))
}

function extensionForMimeType(mimeType: string) {
  if (mimeType.includes("mp4")) return "mp4"
  if (mimeType.includes("aac")) return "aac"
  if (mimeType.includes("mpeg")) return "mp3"
  if (mimeType.includes("ogg")) return "ogg"
  return "webm"
}

type VoiceTranslator = (key: string, values?: Record<string, string>) => string

function microphoneErrorMessage(error: unknown, t: VoiceTranslator) {
  if (!(error instanceof Error)) return t("unavailable")
  if (error.name === "NotAllowedError") return t("denied")
  if (error.name === "NotFoundError") return t("notFound")
  return error.message || t("unavailable")
}

function userFacingTranscriptionError(error: unknown, status: number, t: VoiceTranslator) {
  const message = typeof error === "string" ? error : ""
  if (status === 401) return t("signIn")
  if (status === 422) return t("noSpeechDetected")
  if (status === 429) return message || t("rateLimited")
  if (status === 400 && message) return message
  return t("failed")
}
