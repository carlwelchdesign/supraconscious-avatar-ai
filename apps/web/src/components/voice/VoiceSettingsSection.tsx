"use client"

import { useActionState } from "react"
import { Check, Loader2 } from "lucide-react"
import { updateVoicePreferences, type VoiceActionState } from "@/app/(app)/settings/actions"

type VoicePrefs = {
  voiceEnabled: boolean
  voiceAutoPlay: boolean
  voiceInputDefault: "text" | "voice" | "ask"
  voiceGender: "female" | "male"
  voiceStyle: "warm" | "neutral" | "deep" | "soft"
  voiceSpeed: number
}

function Toggle({ name, defaultChecked }: { name: string; defaultChecked: boolean }) {
  return (
    <label className="inline-flex items-center cursor-pointer select-none">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="sr-only peer" />
      <span
        className="
          relative block w-11 h-6 rounded-full cursor-pointer
          bg-[rgba(43,27,53,0.12)] peer-checked:bg-[var(--clay)]
          transition-colors duration-200
          after:content-[''] after:absolute after:top-1 after:left-1
          after:bg-white after:rounded-full after:h-4 after:w-4
          after:shadow-sm after:transition-all after:duration-200
          peer-checked:after:translate-x-5
        "
      />
    </label>
  )
}

function PillGroup({
  name,
  defaultValue,
  options,
}: {
  name: string
  defaultValue: string
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <label key={opt.value} className="cursor-pointer">
          <input
            type="radio"
            name={name}
            value={opt.value}
            defaultChecked={opt.value === defaultValue}
            className="sr-only peer"
          />
          <span
            className="
              inline-block text-[13px] font-medium px-4 py-2.5 rounded-full
              cursor-pointer transition-colors duration-150
              bg-[rgba(43,27,53,0.06)] text-[var(--plum-soft)]
              peer-checked:bg-[var(--primary)] peer-checked:text-[var(--cream)]
            "
          >
            {opt.label}
          </span>
        </label>
      ))}
    </div>
  )
}

function Row({
  label,
  description,
  children,
  inline = false,
}: {
  label: string
  description?: string
  children: React.ReactNode
  inline?: boolean
}) {
  return (
    <div
      className={`py-5 border-b last:border-0 ${inline ? "flex items-center justify-between gap-4" : "space-y-3"}`}
      style={{ borderColor: "rgba(43,27,53,0.07)" }}
    >
      <div className={inline ? "flex-1 min-w-0" : ""}>
        <p className="text-[14px] font-medium text-[var(--primary)]">{label}</p>
        {description && (
          <p className="text-[12px] font-light text-[var(--plum-soft)] mt-0.5 leading-relaxed">
            {description}
          </p>
        )}
      </div>
      <div className={inline ? "flex-shrink-0" : ""}>{children}</div>
    </div>
  )
}

export function VoiceSettingsSection({ initial }: { initial: VoicePrefs }) {
  const [state, formAction, isPending] = useActionState<VoiceActionState, FormData>(
    updateVoicePreferences,
    null,
  )

  return (
    <div
      className="rounded-2xl border"
      style={{ background: "var(--pearl)", borderColor: "rgba(43,27,53,0.07)" }}
    >
      <div className="px-6 py-4 border-b" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
        <p className="text-[11px] font-medium tracking-[0.12em] uppercase text-[var(--plum-soft)]">
          Voice &amp; Audio
        </p>
      </div>

      <form action={formAction}>
        <div className="px-6">
          <Row inline label="Voice journaling" description="Show a mic button to dictate entries.">
            <Toggle name="voiceEnabled" defaultChecked={initial.voiceEnabled} />
          </Row>

          <Row label="Default input mode" description="How the journal opens by default.">
            <PillGroup
              name="voiceInputDefault"
              defaultValue={initial.voiceInputDefault}
              options={[
                { value: "text",  label: "Text" },
                { value: "voice", label: "Voice" },
                { value: "ask",   label: "Ask each time" },
              ]}
            />
          </Row>

          <Row inline label="Auto-play responses" description="Play the Avatar response as audio after each reflection.">
            <Toggle name="voiceAutoPlay" defaultChecked={initial.voiceAutoPlay} />
          </Row>

          <Row label="Voice character" description="Choose the tone of your Avatar's voice.">
            <div className="space-y-2.5">
              <PillGroup
                name="voiceGender"
                defaultValue={initial.voiceGender}
                options={[
                  { value: "female", label: "Feminine" },
                  { value: "male",   label: "Masculine" },
                ]}
              />
              <PillGroup
                name="voiceStyle"
                defaultValue={initial.voiceStyle}
                options={[
                  { value: "warm",    label: "Warm" },
                  { value: "neutral", label: "Neutral" },
                  { value: "soft",    label: "Soft" },
                  { value: "deep",    label: "Deep" },
                ]}
              />
            </div>
          </Row>

          <Row label="Playback speed">
            <PillGroup
              name="voiceSpeed"
              defaultValue={String(initial.voiceSpeed)}
              options={[
                { value: "0.75", label: "0.75×" },
                { value: "1",    label: "1.0×" },
                { value: "1.25", label: "1.25×" },
              ]}
            />
          </Row>
        </div>

        <div
          className="px-6 pb-5 pt-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between border-t"
          style={{ borderColor: "rgba(43,27,53,0.06)" }}
        >
          <p className="text-[11px] font-light text-[var(--plum-soft)]/60 order-2 sm:order-1">
            Voice audio is never stored. Processed once and discarded.
          </p>
          <button
            type="submit"
            disabled={isPending}
            className="order-1 sm:order-2 inline-flex items-center justify-center gap-2 text-[14px] font-medium px-6 py-3 sm:py-2.5 rounded-full transition-all disabled:opacity-60"
            style={{ background: "var(--primary)", color: "var(--cream)" }}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : state?.ok ? (
              <Check className="w-4 h-4" />
            ) : null}
            {isPending ? "Saving…" : state?.ok ? "Saved" : "Save preferences"}
          </button>
        </div>

        {state?.ok === false && (
          <div
            className="mx-6 mb-5 px-4 py-3 rounded-xl text-[12px] font-light"
            style={{
              background: "rgba(191,64,64,0.07)",
              border: "1px solid rgba(191,64,64,0.15)",
              color: "var(--destructive)",
            }}
          >
            Failed to save. Please try again.
          </div>
        )}
      </form>
    </div>
  )
}
