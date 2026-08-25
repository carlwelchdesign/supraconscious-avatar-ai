"use client"

import { useEffect, useRef } from "react"

export type LivingFieldState = "resting" | "listening" | "reflecting" | "grounding"

type Props = {
  state: LivingFieldState
  motionEnabled: boolean
  className?: string
  seed?: number
}

type Particle = { x: number; y: number; vx: number; vy: number; phase: number; size: number }

const MODES: Record<LivingFieldState, { speed: number; link: number; alpha: number; coherence: number; energy: number }> = {
  resting: { speed: 0.16, link: 88, alpha: 0.58, coherence: 0.38, energy: 1 },
  listening: { speed: 0.22, link: 102, alpha: 0.68, coherence: 0.54, energy: 1 },
  reflecting: { speed: 0.27, link: 116, alpha: 0.78, coherence: 0.72, energy: 1.08 },
  grounding: { speed: 0.055, link: 72, alpha: 0.3, coherence: 0.18, energy: 0.62 },
}

function seededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0
    return value / 4294967296
  }
}

export function LivingField({ state, motionEnabled, className = "", seed = 2407 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const context = canvas.getContext("2d")
    if (!context) return

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const animate = motionEnabled && !reduceMotion
    const random = seededRandom(seed)
    let width = 0
    let height = 0
    let particles: Particle[] = []
    let frame = 0
    let previousTime = performance.now()
    let visible = document.visibilityState === "visible"

    const resize = () => {
      const bounds = canvas.getBoundingClientRect()
      width = Math.max(1, bounds.width)
      height = Math.max(1, bounds.height)
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      context.setTransform(dpr, 0, 0, dpr, 0, 0)
      const count = Math.min(150, Math.max(48, Math.round((width * height) / 11800)))
      particles = Array.from({ length: count }, () => ({
        x: random() * width,
        y: random() * height,
        vx: random() * 2 - 1,
        vy: random() * 2 - 1,
        phase: random() * Math.PI * 2,
        size: 0.55 + random() * 1.35,
      }))
    }

    const draw = (time: number, advance: boolean) => {
      const mode = MODES[state]
      const delta = Math.min(32, time - previousTime) / 16.67
      previousTime = time
      context.clearRect(0, 0, width, height)

      const breath = animate ? 0.86 + Math.sin(time * 0.00042) * 0.14 : 0.94
      const glow = context.createRadialGradient(width * 0.32, height * 0.5, 0, width * 0.32, height * 0.5, width * 0.72)
      glow.addColorStop(0, `rgba(194, 112, 68, ${0.2 * breath * mode.energy})`)
      glow.addColorStop(0.48, `rgba(101, 72, 146, ${0.12 * mode.energy})`)
      glow.addColorStop(1, "rgba(3, 7, 18, 0)")
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)

      for (let index = 0; index < particles.length; index += 1) {
        const particle = particles[index]
        if (advance) {
          const current = Math.sin(time * 0.00018 + particle.phase) * mode.coherence
          particle.x += (particle.vx + current * 0.34) * mode.speed * delta
          particle.y += (particle.vy + Math.cos(time * 0.00014 + particle.phase) * mode.coherence * 0.22) * mode.speed * delta
          if (particle.x < -8) particle.x = width + 8
          if (particle.x > width + 8) particle.x = -8
          if (particle.y < -8) particle.y = height + 8
          if (particle.y > height + 8) particle.y = -8
        }

        for (let next = index + 1; next < particles.length; next += 1) {
          const peer = particles[next]
          const dx = particle.x - peer.x
          const dy = particle.y - peer.y
          const distance = Math.hypot(dx, dy)
          if (distance < mode.link) {
            context.strokeStyle = `rgba(197, 151, 109, ${(1 - distance / mode.link) * 0.16 * mode.alpha})`
            context.lineWidth = 0.5
            context.beginPath()
            context.moveTo(particle.x, particle.y)
            context.lineTo(peer.x, peer.y)
            context.stroke()
          }
        }

        context.fillStyle = `rgba(236, 213, 188, ${0.55 * mode.alpha * breath})`
        context.beginPath()
        context.arc(particle.x, particle.y, particle.size * mode.energy, 0, Math.PI * 2)
        context.fill()
      }
    }

    const loop = (time: number) => {
      if (!visible) return
      draw(time, true)
      frame = window.requestAnimationFrame(loop)
    }
    const handleVisibility = () => {
      visible = document.visibilityState === "visible"
      window.cancelAnimationFrame(frame)
      if (visible && animate) {
        previousTime = performance.now()
        frame = window.requestAnimationFrame(loop)
      }
    }

    const observer = new ResizeObserver(() => {
      resize()
      draw(performance.now(), false)
    })
    observer.observe(canvas)
    document.addEventListener("visibilitychange", handleVisibility)
    resize()
    draw(performance.now(), false)
    if (animate) frame = window.requestAnimationFrame(loop)

    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", handleVisibility)
      window.cancelAnimationFrame(frame)
    }
  }, [motionEnabled, seed, state])

  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`} data-field-state={state}>
      <div className="living-field-static absolute inset-0" />
      <canvas ref={canvasRef} className={`absolute inset-0 h-full w-full ${motionEnabled ? "opacity-100" : "opacity-0"}`} />
    </div>
  )
}
