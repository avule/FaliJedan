// Generise Open Graph sliku za dijeljenje linka na drustvenim mrezama.

import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "FaliJedan - pickup sport platforma";

// Slika za dijeljenje na mrezama. Generisana iz koda da uvijek prati brend.
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background:
            "linear-gradient(135deg, #0a0c0b 0%, #0d1411 60%, #0a1310 100%)",
          color: "#f3f6f1",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "#caff3c",
            fontWeight: 700,
          }}
        >
          Pickup sport
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 110,
            fontWeight: 800,
            lineHeight: 1,
            letterSpacing: "-0.03em",
          }}
        >
          <span>Fali</span>
          <span style={{ color: "#caff3c" }}>Jedan</span>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 38,
            color: "#cbd5e1",
            maxWidth: 900,
          }}
        >
          Fali vam jedan igrač? Nađi ga za 2 minute.
        </div>
        <div
          style={{
            marginTop: 48,
            fontSize: 26,
            color: "#64748b",
          }}
        >
          Fudbal · Košarka · Padel · BiH · Srbija · Hrvatska · CG · MK
        </div>
      </div>
    ),
    { ...size }
  );
}
