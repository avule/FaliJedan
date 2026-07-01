// Vitest konfiguracija za testove ciste logike u lib folderu.

import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

// Vitest za cistu logiku (lib/). Alias "@" pokazuje na korijen projekta,
// isto kao u tsconfig.json, da importi rade jednako kao u aplikaciji.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    // Threads pool puca na Windows/OneDrive (UNKNOWN read greska pri startu),
    // forks radi pouzdano.
    pool: "forks",
  },
});
