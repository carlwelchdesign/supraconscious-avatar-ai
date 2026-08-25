import type { CSSProperties } from "react"
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://supraconscious-avatar-ai.vercel.app"

const palette = {
  midnight: "#050914",
  ivory: "#f5efe3",
  muted: "#c9c0b2",
  gold: "#e0c98d",
  copper: "#cf752f",
}

const card: CSSProperties = {
  position: "relative",
  display: "flex",
  width: "100%",
  height: "100%",
  overflow: "hidden",
  backgroundColor: palette.midnight,
  color: palette.ivory,
  fontFamily: "Georgia, serif",
}

export function SocialCard() {
  const backgroundUrl = new URL("/mineral-boundary-v3-wide.png", APP_URL).toString()

  return (
    <div style={card}>
      {/* next/image cannot be used inside an ImageResponse render tree. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        alt=""
        src={backgroundUrl}
        width="1200"
        height="630"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          background:
            "linear-gradient(90deg, rgba(5,9,20,0.02) 0%, rgba(5,9,20,0.38) 35%, rgba(5,9,20,0.96) 58%, #050914 100%)",
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          padding: "66px 70px 58px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 44, height: 2, backgroundColor: palette.copper }} />
          <div
            style={{
              fontFamily: "Arial, sans-serif",
              fontSize: 22,
              fontWeight: 500,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color: palette.gold,
            }}
          >
            Supraconscious
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignSelf: "flex-end", width: 665 }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              fontSize: 68,
              lineHeight: 1.03,
              letterSpacing: "-0.025em",
            }}
          >
            A quieter place for
            <span style={{ color: palette.gold, fontStyle: "italic" }}> honest reflection.</span>
          </div>
          <div
            style={{
              marginTop: 32,
              fontFamily: "Arial, sans-serif",
              fontSize: 28,
              lineHeight: 1.38,
              color: palette.muted,
            }}
          >
            Write what is present. Keep what fits. The meaning and next choice remain yours.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignSelf: "flex-end",
            alignItems: "center",
            gap: 16,
            width: 665,
            fontFamily: "Arial, sans-serif",
            fontSize: 18,
            letterSpacing: "0.08em",
            color: palette.gold,
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: 999, backgroundColor: palette.copper }} />
          SEVEN EQUAL DIMENSIONS · YOUR WORDS STAY PRIMARY
        </div>
      </div>
    </div>
  )
}
