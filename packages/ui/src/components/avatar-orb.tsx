import Image from "next/image"
import { cn } from "../utils"

const STAGE_IMAGES: Record<number, string> = {
  1: "/avatars/stage1_echo.png",
  2: "/avatars/stage2_witness.png",
  3: "/avatars/stage3_clear_mirror.png",
  4: "/avatars/stage4_reframer.png",
  5: "/avatars/stage5_inner_author.png",
}

const SIZES = {
  xs: 64,
  sm: 120,
  md: 160,
  lg: 220,
  xl: 320,
}

type AvatarOrbProps = {
  stage?: 1 | 2 | 3 | 4 | 5
  size?: "xs" | "sm" | "md" | "lg" | "xl"
  className?: string
  priority?: boolean
}

export function AvatarOrb({ stage = 1, size = "md", className, priority }: AvatarOrbProps) {
  const px = SIZES[size]
  const src = STAGE_IMAGES[stage] ?? STAGE_IMAGES[1]

  return (
    <div
      className={cn("relative flex-shrink-0", className)}
      style={{ width: px, height: px }}
    >
      <Image
        src={src}
        alt={`Guide stage ${stage}`}
        fill
        sizes={`${px}px`}
        className="object-contain"
        priority={priority ?? (size === "lg" || size === "xl")}
      />
    </div>
  )
}
