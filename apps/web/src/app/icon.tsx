import { ImageResponse } from "next/og"

export const size = { width: 512, height: 512 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: 112,
          background: "linear-gradient(145deg, #111426 0%, #050914 78%)",
          color: "#f5efe3",
          fontFamily: "Georgia, serif",
          fontSize: 280,
          lineHeight: 1,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: -238,
            top: -78,
            width: 430,
            height: 670,
            border: "8px solid #cf752f",
            borderRadius: "50%",
            boxShadow: "0 0 48px rgba(207,117,47,0.3)",
          }}
        />
        <div style={{ display: "flex", marginTop: -16 }}>S</div>
      </div>
    ),
    size,
  )
}
