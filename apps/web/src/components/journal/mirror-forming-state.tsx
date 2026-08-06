import { AvatarOrb } from "@inner-avatar/ui/avatar-orb"
import type { ReactNode } from "react"

type Props = {
  status: string
  supportingText: string
  orb?: ReactNode
}

export function MirrorFormingState({ status, supportingText, orb }: Props) {
  return (
    <div className="flex min-h-[292px] flex-col items-center justify-center text-center">
      <div
        aria-hidden="true"
        className="mirror-forming-visual relative mb-5 flex aspect-square w-full max-w-[220px] items-center justify-center overflow-hidden rounded-full"
      >
        <span className="mirror-forming-halo mirror-forming-motion absolute inset-[8%] rounded-full" />
        <span className="mirror-forming-ring mirror-forming-ring-outer mirror-forming-motion absolute inset-[12%] rounded-full" />
        <span className="mirror-forming-ring mirror-forming-ring-inner mirror-forming-motion absolute inset-[24%] rounded-full" />
        <span className="mirror-forming-point mirror-forming-point-clay mirror-forming-motion absolute" />
        <span className="mirror-forming-point mirror-forming-point-blue mirror-forming-motion absolute" />
        <span className="mirror-forming-point mirror-forming-point-pearl mirror-forming-motion absolute" />
        {orb ?? <AvatarOrb size="sm" stage={1} className="mirror-forming-orb mirror-forming-motion relative z-10" />}
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
