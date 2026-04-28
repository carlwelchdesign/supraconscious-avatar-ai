"use client"

import { AvatarOrb } from "@/components/ui/avatar-orb"

export function HeroVisual() {
  return (
    <div className="relative flex items-center justify-center h-[520px]">
      {/* Ambient blobs */}
      <span
        className="absolute rounded-full blur-[72px] opacity-50 animate-blob-1 pointer-events-none"
        style={{
          width: 480,
          height: 480,
          top: "-80px",
          right: "-60px",
          background: "radial-gradient(circle, #E8D5D5, transparent)",
        }}
      />
      <span
        className="absolute rounded-full blur-[60px] opacity-40 animate-blob-2 pointer-events-none"
        style={{
          width: 320,
          height: 320,
          bottom: "0",
          left: "20px",
          background: "radial-gradient(circle, #D8C9B8, transparent)",
        }}
      />
      <span
        className="absolute rounded-full blur-[48px] opacity-30 animate-blob-3 pointer-events-none"
        style={{
          width: 240,
          height: 240,
          top: "40%",
          right: "40%",
          background: "radial-gradient(circle, rgba(123,155,181,0.5), transparent)",
        }}
      />

      {/* Central orb */}
      <AvatarOrb size="xl" className="relative z-10" />

      {/* Floating journal fragment — upper left */}
      <div
        className="absolute top-10 left-0 bg-[var(--pearl)] border border-[var(--border)] rounded-2xl p-4 shadow-sm backdrop-blur-sm animate-float z-20 max-w-[190px]"
        style={{ boxShadow: "0 4px 24px rgba(43,27,53,0.07)" }}
      >
        <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--clay)] mb-1.5">
          Pattern noticed
        </p>
        <p className="font-display italic text-sm text-[var(--plum-soft)] leading-relaxed">
          "I keep returning to this feeling of…"
        </p>
      </div>

      {/* Floating reflection card — right */}
      <div
        className="absolute top-1/2 -translate-y-1/2 -right-4 bg-[var(--pearl)] border border-[var(--border)] rounded-2xl p-4 shadow-sm animate-float-alt z-20 max-w-[200px]"
        style={{ boxShadow: "0 4px 24px rgba(43,27,53,0.07)" }}
      >
        <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--clay)] mb-1.5">
          Avatar reflection
        </p>
        <p className="font-display italic text-sm text-[var(--plum-soft)] leading-relaxed">
          "There's a recurring theme of self-permission here."
        </p>
      </div>

      {/* Floating mood fragment — lower */}
      <div
        className="absolute bottom-16 right-8 bg-[var(--pearl)] border border-[var(--border)] rounded-2xl p-4 shadow-sm animate-float z-20 max-w-[180px]"
        style={{
          animationDelay: "1.5s",
          boxShadow: "0 4px 24px rgba(43,27,53,0.07)",
        }}
      >
        <p className="text-[10px] font-medium tracking-widest uppercase text-[var(--clay)] mb-1.5">
          Today&apos;s entry
        </p>
        <p className="font-display italic text-sm text-[var(--plum-soft)] leading-relaxed">
          "I noticed I soften when I stop performing…"
        </p>
      </div>
    </div>
  )
}
