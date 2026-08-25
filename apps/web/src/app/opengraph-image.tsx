import { ImageResponse } from "next/og"
import { SocialCard } from "./social-card"

export const alt = "Supraconscious — a quieter place for honest reflection"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(<SocialCard />, size)
}
