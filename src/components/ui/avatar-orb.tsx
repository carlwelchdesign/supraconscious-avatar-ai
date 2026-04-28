"use client"

import { cn } from "@/lib/utils"

type AvatarOrbProps = {
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
}

const sizes = {
  xs: { orb: "w-10 h-10", ring1: "-inset-1.5", ring2: "-inset-3", ring3: "-inset-5" },
  sm: { orb: "w-16 h-16", ring1: "-inset-2", ring2: "-inset-4", ring3: "-inset-7" },
  md: { orb: "w-24 h-24", ring1: "-inset-3", ring2: "-inset-6", ring3: "-inset-10" },
  lg: { orb: "w-36 h-36", ring1: "-inset-4", ring2: "-inset-8", ring3: "-inset-14" },
  xl: { orb: "w-48 h-48", ring1: "-inset-5", ring2: "-inset-10", ring3: "-inset-18" },
}

export function AvatarOrb({ size = "md", className }: AvatarOrbProps) {
  const s = sizes[size]

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Outer rings */}
      <span
        className={cn(
          "absolute rounded-full border border-[var(--clay)] opacity-20 animate-ring-3",
          s.ring3
        )}
      />
      <span
        className={cn(
          "absolute rounded-full border border-[var(--clay)] opacity-30 animate-ring-2",
          s.ring2
        )}
      />
      <span
        className={cn(
          "absolute rounded-full border border-[var(--clay)] opacity-40 animate-ring-1",
          s.ring1
        )}
      />

      {/* Orb body */}
      <span
        className={cn(
          "relative rounded-full animate-orb-breathe",
          s.orb
        )}
        style={{
          background:
            "radial-gradient(circle at 32% 30%, #FAF0E8 0%, #D4AA82 38%, #8C648C 68%, #2B1B35 100%)",
        }}
      >
        {/* Specular highlight */}
        <span
          className="absolute rounded-full"
          style={{
            inset: "14%",
            background:
              "radial-gradient(circle at 28% 26%, rgba(255,248,240,0.88) 0%, transparent 60%)",
          }}
        />
      </span>
    </div>
  )
}
