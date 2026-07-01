// Korijenski layout cijele aplikacije: ucitava fontove, postavlja SEO meta
// podatke, ambijentalnu pozadinu i Toaster za poruke. Sve stranice se
// renderuju unutar njega.

import type { Metadata } from "next";
import { Saira_Condensed, Archivo } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import { AmbientBackground } from "@/components/layout/ambient-background";
import "./globals.css";

// Display: Saira Condensed (zbijeni uppercase naslovi). Body: Archivo.
const display = Saira_Condensed({
  weight: ["500", "600", "700", "800", "900"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const sans = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const TITLE = "FaliJedan - nađi partnera za rekreativni sport";
const DESCRIPTION =
  "Organizator objavi slot, slobodni igrači se prijave. Fudbal, košarka, padel - pickup mečevi u tvom gradu.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s · FaliJedan",
  },
  description: DESCRIPTION,
  applicationName: "FaliJedan",
  keywords: [
    "pickup sport",
    "fudbal",
    "košarka",
    "padel",
    "rekreacija",
    "FaliJedan",
    "sport Balkan",
  ],
  openGraph: {
    type: "website",
    locale: "sr_RS",
    url: SITE_URL,
    siteName: "FaliJedan",
    title: TITLE,
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sr"
      className={`dark ${display.variable} ${sans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <AmbientBackground />
        {children}
        <Toaster
          theme="dark"
          position="bottom-right"
          richColors
          closeButton
          offset={16}
          toastOptions={{
            classNames: {
              toast:
                "!bg-card !border-border !text-foreground !shadow-card",
              title: "!font-display !uppercase !tracking-wider !text-sm",
              description: "!text-muted-foreground",
              actionButton:
                "!rounded-md !bg-primary !px-3 !py-1.5 !font-display !text-xs !font-bold !uppercase !tracking-wider !text-primary-foreground hover:!bg-primary/90",
              cancelButton:
                "!rounded-md !border !border-border !bg-secondary !px-3 !py-1.5 !font-display !text-xs !font-bold !uppercase !tracking-wider !text-foreground hover:!bg-secondary/80",
              success: "!border-primary/40",
              error: "!border-destructive/40",
            },
          }}
        />
      </body>
    </html>
  );
}
