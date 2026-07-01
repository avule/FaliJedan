// Dinamicki generisana ikonica aplikacije.

import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Favicon brenda: monogram "FJ", volt limeta na skoro crnoj. Generisan iz koda.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0c0b",
          color: "#caff3c",
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: "-0.05em",
          fontFamily: "sans-serif",
        }}
      >
        FJ
      </div>
    ),
    { ...size }
  );
}
