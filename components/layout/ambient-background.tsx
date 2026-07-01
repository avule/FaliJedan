/**
 * Staticna ambijentalna pozadina (redizajn): volt radial glow gore-desno,
 * blagi narandzasti lijevo, i mreza 64px preko svega na ~2% vidljivosti.
 * Bez slika, bez JS-a. Renderuje se iza svega.
 */
export function AmbientBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background"
    >
      {/* Radialni sjaj: volt gore desno i slab narandzasti lijevo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1100px 600px at 78% -8%, hsl(var(--primary) / 0.10), transparent 60%), radial-gradient(900px 600px at 6% 18%, hsl(var(--accent) / 0.06), transparent 55%)",
        }}
      />

      {/* Mreza 64px, jedva vidljiva */}
      <div
        className="absolute inset-0 opacity-50"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.022) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.022) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
