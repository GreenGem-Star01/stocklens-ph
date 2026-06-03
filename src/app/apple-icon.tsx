import { ImageResponse } from "next/og";

import { BRAND_ACCENT } from "@/lib/constants/brand";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
          borderRadius: 36,
        }}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          width="120"
          height="120"
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
      </div>
    ),
    { ...size },
  );
}
