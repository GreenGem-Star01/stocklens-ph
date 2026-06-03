import { ImageResponse } from "next/og";

import {
  BRAND_ACCENT,
  BRAND_FULL_NAME,
  BRAND_TAGLINE,
} from "@/lib/constants/brand";

export const alt = BRAND_FULL_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(180deg, #f0f9f9 0%, #ffffff 55%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="96"
          height="96"
        >
          <rect
            x="4"
            y="4"
            width="24"
            height="24"
            rx="7"
            fill="none"
            stroke={BRAND_ACCENT}
            strokeWidth="2"
          />
          <path
            d="M10 20 L14 14 L18 17 L22 10"
            fill="none"
            stroke={BRAND_ACCENT}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="22" cy="10" r="1.5" fill={BRAND_ACCENT} />
        </svg>
        <div
          style={{
            marginTop: 32,
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 56,
            fontWeight: 700,
            color: "#030213",
          }}
        >
          <span>StockLens</span>
          <span
            style={{
              fontSize: 28,
              fontWeight: 600,
              padding: "8px 20px",
              borderRadius: 999,
              background: "#ececf0",
              color: "#717182",
            }}
          >
            PH
          </span>
        </div>
        <p style={{ marginTop: 20, fontSize: 28, color: "#717182" }}>
          {BRAND_TAGLINE}
        </p>
      </div>
    ),
    { ...size },
  );
}
