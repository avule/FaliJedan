/**
 * Static athletic background — court line geometry + radial glows + grain.
 * No photos, no animation, no client JS. Renders behind everything (-z-10).
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Base vertical wash — darker at edges, slightly lifted at top */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, hsl(220 35% 5%) 0%, hsl(220 30% 4%) 55%, hsl(220 40% 3%) 100%)",
        }}
      />

      {/* Primary mint glow from top-center */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 45% at 50% -8%, hsl(var(--primary) / 0.14), transparent 70%)",
        }}
      />

      {/* Accent orange glow from bottom-right — very subtle */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 50% 40% at 88% 105%, hsl(var(--accent) / 0.07), transparent 65%)",
        }}
      />

      {/* Court line geometry — single SVG, lines pushed to edges so center stays clean */}
      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMid slice"
        className="absolute inset-0 h-full w-full"
      >
        {/* Football: center circle + halfway line, lower-left quadrant */}
        <g
          stroke="hsl(var(--primary))"
          strokeWidth="1.5"
          fill="none"
          opacity="0.07"
        >
          <line x1="-50" y1="720" x2="1650" y2="720" />
          <circle cx="240" cy="720" r="200" />
          <circle cx="240" cy="720" r="3" fill="hsl(var(--primary))" />
          {/* penalty box hint */}
          <rect x="-50" y="610" width="220" height="220" />
        </g>

        {/* Basketball: three-point arc + backboard line, top-right */}
        <g
          stroke="hsl(0 0% 100%)"
          strokeWidth="1.5"
          fill="none"
          opacity="0.05"
        >
          <path d="M 1080 -20 A 320 320 0 0 1 1700 -20" />
          <line x1="1280" y1="-20" x2="1500" y2="-20" />
          <line x1="1390" y1="-20" x2="1390" y2="80" />
          <circle cx="1390" cy="120" r="40" />
        </g>

        {/* Padel court grid: outline + service lines, lower-right */}
        <g
          stroke="hsl(0 0% 100%)"
          strokeWidth="1"
          fill="none"
          opacity="0.06"
        >
          <rect x="1040" y="500" width="540" height="360" />
          <line x1="1040" y1="680" x2="1580" y2="680" />
          <line x1="1310" y1="500" x2="1310" y2="680" />
          {/* net line — slightly thicker */}
          <line
            x1="1040"
            y1="680"
            x2="1580"
            y2="680"
            strokeWidth="2"
            opacity="0.8"
          />
        </g>

        {/* Diagonal accent line — connects compositions, very faint */}
        <line
          x1="0"
          y1="0"
          x2="1600"
          y2="900"
          stroke="hsl(var(--primary))"
          strokeWidth="1"
          opacity="0.03"
        />
      </svg>

      {/* Grain / noise overlay — inline SVG filter, no asset needed */}
      <svg
        className="absolute inset-0 h-full w-full opacity-[0.08] mix-blend-overlay"
        xmlns="http://www.w3.org/2000/svg"
      >
        <filter id="ambient-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#ambient-noise)" />
      </svg>

      {/* Bottom vignette — anchors content, prevents grid feeling 'floaty' */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 60%, hsl(220 40% 3% / 0.6) 100%)",
        }}
      />
    </div>
  );
}
