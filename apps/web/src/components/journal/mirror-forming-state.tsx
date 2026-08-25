import { LivingField } from "@/components/ambient/living-field"

type Props = {
  status: string
  supportingText: string
}

export function MirrorFormingState({ status, supportingText }: Props) {
  return (
    <div className="flex min-h-[292px] flex-col items-center justify-center text-center">
      <div
        aria-hidden="true"
        className="mirror-forming-field relative mb-5 h-32 w-full max-w-[360px] overflow-hidden rounded-[28px] border border-[var(--border-subtle)]"
      >
        <LivingField state="reflecting" motionEnabled className="absolute inset-0" seed={7319} />
        <span className="mirror-forming-current mirror-forming-current-a mirror-forming-motion absolute" />
        <span className="mirror-forming-current mirror-forming-current-b mirror-forming-motion absolute" />
      </div>

      <div role="status" aria-live="polite" aria-atomic="true" className="max-w-[280px]">
        <p className="font-display text-[18px] font-medium leading-snug text-[var(--primary)]">
          {status}
        </p>
        <p className="mt-2 text-[13px] font-light leading-relaxed text-[var(--plum-soft)]">
          {supportingText}
        </p>
      </div>
    </div>
  )
}
