import type { ReactNode } from "react"

export function EvidenceBlock({ eyebrow, title, tone, id, className = "", children }: {
  eyebrow: string
  title: string
  tone: "member" | "guide" | "source" | "action"
  id?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section id={id} className={`scroll-mt-28 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-raised)] p-5 sm:p-6 ${className}`} data-evidence-tone={tone}>
      <p className="observatory-label">{eyebrow}</p>
      <h2 className="mt-2 font-display text-2xl text-[var(--text-primary)]">{title}</h2>
      <div className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{children}</div>
    </section>
  )
}

export function DimensionFacet({ name, selectionLabel, observationLabel, interpretationLabel, observation, interpretation, actions }: {
  name: string
  selectionLabel: string
  observationLabel: string
  interpretationLabel: string
  observation?: string | null
  interpretation?: string | null
  actions?: ReactNode
}) {
  return (
    <article className="border-b border-[var(--border-subtle)] bg-[color-mix(in_srgb,var(--surface)_82%,transparent)] p-5 last:border-b-0 sm:border-r sm:[&:nth-child(even)]:border-r-0 xl:border-b-0 xl:[&:nth-child(even)]:border-r xl:last:border-r-0">
      <p className="observatory-label">{selectionLabel}</p>
      <h3 className="mt-1 font-display text-xl text-[var(--text-primary)]">{name}</h3>
      {observation && <p className="mt-3 text-sm leading-6 text-[var(--text-secondary)]"><span className="font-medium text-[var(--text-primary)]">{observationLabel}:</span> {observation}</p>}
      {interpretation && <p className="mt-2 text-sm italic leading-6 text-[var(--text-secondary)]"><span className="not-italic font-medium text-[var(--text-primary)]">{interpretationLabel}:</span> {interpretation}</p>}
      {actions && <div className="mt-4">{actions}</div>}
    </article>
  )
}

export function ProvenanceLine({ mode, modeLabel, message }: { mode: string; modeLabel: string; message: string }) {
  return (
    <div className="flex flex-col gap-1 border-l-2 border-[var(--action-primary)] pl-4">
      <p className="observatory-label">{modeLabel} · {mode.replaceAll("_", " ")}</p>
      <p className="text-sm leading-6 text-[var(--text-secondary)]">{message}</p>
    </div>
  )
}
