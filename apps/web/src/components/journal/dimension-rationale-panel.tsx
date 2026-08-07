"use client"

import { useState } from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import type { PublicDimension, PublicDimensionRationale } from "@/lib/dimension-rationale"

type CorrectionState = "idle" | "saving" | "saved" | "error"

export function DimensionRationalePanel({ rationale }: { rationale: PublicDimensionRationale }) {
  const t = useTranslations("journal")
  const [corrections, setCorrections] = useState<Partial<Record<PublicDimension, CorrectionState>>>({})

  async function saveCorrection(dimension: PublicDimension) {
    if (!rationale.reflectionSessionId || corrections[dimension] === "saving") return
    setCorrections((current) => ({ ...current, [dimension]: "saving" }))

    try {
      const response = await fetch("/api/reflections/corrections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflectionSessionId: rationale.reflectionSessionId, dimension }),
      })
      if (!response.ok) throw new Error("correction_failed")
      setCorrections((current) => ({ ...current, [dimension]: "saved" }))
    } catch {
      setCorrections((current) => ({ ...current, [dimension]: "error" }))
    }
  }

  return (
    <details
      className="group rounded-3xl border"
      style={{ background: "var(--pearl)", borderColor: "rgba(43,27,53,0.07)" }}
    >
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay)] focus-visible:ring-inset [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--clay)]">
            {t("dimensionRationaleEyebrow")}
          </span>
          <span className="mt-1 block font-display text-[20px] font-light text-[var(--primary)]">
            {t("dimensionRationaleTitle", { count: rationale.selected.length })}
          </span>
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-[var(--plum-soft)] transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>

      <div className="border-t px-6 pb-6 pt-5" style={{ borderColor: "rgba(43,27,53,0.06)" }}>
        <p className="max-w-2xl text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
          {t("dimensionRationaleHelp")}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {rationale.selected.map((item) => {
            const correction = corrections[item.dimension] ?? "idle"
            return (
              <section
                key={item.dimension}
                className="rounded-2xl border px-4 py-4"
                style={{ background: "rgba(43,27,53,0.025)", borderColor: "rgba(43,27,53,0.06)" }}
                aria-labelledby={`dimension-${item.dimension}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 id={`dimension-${item.dimension}`} className="font-display text-[17px] font-medium text-[var(--primary)]">
                      {t(`dimensionNames.${item.dimension}`)}
                    </h3>
                    <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--clay)]">
                      {t(`dimensionDepth.${item.depth}`)}
                    </p>
                  </div>
                  {rationale.reflectionSessionId && (
                    <button
                      type="button"
                      onClick={() => saveCorrection(item.dimension)}
                      disabled={correction === "saving" || correction === "saved"}
                      className="inline-flex min-h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-medium text-[var(--plum-soft)] transition hover:bg-[rgba(43,27,53,0.04)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--clay)] disabled:cursor-not-allowed disabled:opacity-60"
                      style={{ borderColor: "rgba(43,27,53,0.1)" }}
                    >
                      {correction === "saving" && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}
                      {correction === "saved" && <Check className="h-3 w-3" aria-hidden="true" />}
                      {correction === "saving"
                        ? t("dimensionCorrectionSaving")
                        : correction === "saved"
                          ? t("dimensionCorrectionSaved")
                          : t("dimensionCorrectionAction")}
                    </button>
                  )}
                </div>
                <p className="mt-3 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
                  {t(`dimensionDescriptions.${item.dimension}`)}
                </p>
                {item.signals.length > 0 && (
                  <ul className="mt-3 space-y-1.5" aria-label={t("dimensionSignalsLabel")}>
                    {item.signals.map((signal) => (
                      <li key={signal} className="flex gap-2 text-[12px] font-light leading-relaxed text-[var(--plum-soft)]/75">
                        <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-[var(--clay)]" aria-hidden="true" />
                        {t(`dimensionSignals.${signal}`)}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="mt-3 min-h-4 text-[11px] font-light text-[var(--clay)]" aria-live="polite">
                  {correction === "error" ? t("dimensionCorrectionError") : correction === "saved" ? t("dimensionCorrectionNote") : ""}
                </p>
              </section>
            )
          })}
        </div>
      </div>
    </details>
  )
}
