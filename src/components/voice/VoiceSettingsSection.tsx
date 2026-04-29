"use client"

import { useState } from "react"
import { Check, Loader2 } from "lucide-react"

type VoicePrefs = {
  voiceEnabled: boolean
  voiceAutoPlay: boolean
  voiceInputDefault: "text" | "voice" | "ask"
  voiceGender: "female" | "male"
  voiceStyle: "warm" | "neutral" | "deep" | "soft"
  voiceSpeed: number
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-all duration-200"
      style={{ background: on ? "var(--clay)" : "rgba(43,27,53,0.12)" }}
    >
      <span
        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-200"
        style={{ transform: on ? "translateX(18px)" : "translateX(3px)" }}
      />
    </button>
  )
}

function OptionGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className="text-[12px] font-medium px-3 py-1 rounded-full transition-all"
          style={
            opt.value === value
              ? { background: "var(--primary)", color: "var(--cream)" }
              : { background: "rgba(43,27,53,0.06)", color: "var(--plum-soft)" }
          }
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function SettingRow({
  label,
  description,
  control,
}: {
  label: string
  description?: string
  control: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between gap-6 py-5 border-b last:border-0"
      style={{ borderColor: "rgba(43,27,53,0.07)" }}
    >
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-[var(--primary)]">{label}</p>
        {description && (
          <p className="text-[12px] font-light text-[var(--plum-soft)] mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className="flex-shrink-0">{control}</div>
    </div>
  )
}

export function VoiceSettingsSection({ initial }: { initial: VoicePrefs }) {
  const [prefs, setPrefs] = useState<VoicePrefs>(initial)
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle")

  const update = <K extends keyof VoicePrefs>(key: K, value: VoicePrefs[K]) => {
    setPrefs((p) => ({ ...p, [key]: value }))
    setSaveState("idle")
  }

  const save = async () => {
    setSaveState("saving")
    try {
      const res = await fetch("/api/voice/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      })
      if (!res.ok) throw new Error()
      setSaveState("saved")
      setTimeout(() => setSaveState("idle"), 2500)
    } catch {
      setSaveState("error")
      setTimeout(() => setSaveState("idle"), 3000)
    }
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ background: "var(--pearl)", borderColor: "rgba(43,27,53,0.07)" }}
    >
      <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
        <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--plum-soft)]">
          Voice &amp; Audio
        </p>
      </div>

      <div className="px-6">
        <SettingRow
          label="Voice journaling"
          description="Show a microphone button so you can dictate entries."
          control={
            <Toggle on={prefs.voiceEnabled} onChange={(v) => update("voiceEnabled", v)} />
          }
        />

        {prefs.voiceEnabled && (
          <SettingRow
            label="Default input mode"
            description="How the journal opens by default."
            control={
              <OptionGroup
                options={[
                  { value: "text", label: "Text" },
                  { value: "voice", label: "Voice" },
                  { value: "ask", label: "Ask each time" },
                ]}
                value={prefs.voiceInputDefault}
                onChange={(v) => update("voiceInputDefault", v)}
              />
            }
          />
        )}

        <SettingRow
          label="Avatar voice"
          description="Play Avatar reflections as audio."
          control={<Toggle on={prefs.voiceAutoPlay === false ? false : prefs.voiceEnabled && prefs.voiceAutoPlay} onChange={(v) => { if (!prefs.voiceEnabled) update("voiceEnabled", true); update("voiceAutoPlay", v) }} />}
        />

        <SettingRow
          label="Auto-play responses"
          description="Automatically play the Avatar response after each reflection."
          control={
            <Toggle
              on={prefs.voiceAutoPlay}
              onChange={(v) => update("voiceAutoPlay", v)}
            />
          }
        />

        <SettingRow
          label="Voice"
          description="Choose the tone of your Avatar's voice."
          control={
            <div className="space-y-2">
              <OptionGroup
                options={[
                  { value: "female", label: "Feminine" },
                  { value: "male", label: "Masculine" },
                ]}
                value={prefs.voiceGender}
                onChange={(v) => update("voiceGender", v)}
              />
              <OptionGroup
                options={[
                  { value: "warm", label: "Warm" },
                  { value: "neutral", label: "Neutral" },
                  { value: "soft", label: "Soft" },
                  { value: "deep", label: "Deep" },
                ]}
                value={prefs.voiceStyle}
                onChange={(v) => update("voiceStyle", v)}
              />
            </div>
          }
        />

        <SettingRow
          label="Playback speed"
          control={
            <OptionGroup
              options={[
                { value: "0.75", label: "0.75×" },
                { value: "1", label: "1.0×" },
                { value: "1.25", label: "1.25×" },
              ]}
              value={String(prefs.voiceSpeed)}
              onChange={(v) => update("voiceSpeed", parseFloat(v))}
            />
          }
        />
      </div>

      <div className="px-6 pb-5 pt-2 flex items-center justify-between">
        <p className="text-[11px] font-light text-[var(--plum-soft)]/60">
          Voice audio is never stored. Processed once and discarded.
        </p>
        <button
          onClick={save}
          disabled={saveState === "saving"}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium px-4 py-2 rounded-full transition-all disabled:opacity-50"
          style={{ background: "var(--primary)", color: "var(--cream)" }}
        >
          {saveState === "saving" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : saveState === "saved" ? (
            <Check className="w-3.5 h-3.5" />
          ) : null}
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Save"}
        </button>
      </div>

      {saveState === "error" && (
        <div
          className="mx-6 mb-5 px-4 py-3 rounded-xl text-[12px] font-light"
          style={{
            background: "rgba(191,64,64,0.07)",
            border: "1px solid rgba(191,64,64,0.15)",
            color: "var(--destructive)",
          }}
        >
          Failed to save preferences. Please try again.
        </div>
      )}
    </div>
  )
}
