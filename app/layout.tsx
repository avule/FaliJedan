import type { Metadata } from "next";
import { Bebas_Neue } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Toaster } from "sonner";
import "./globals.css";

const bebas = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "FaliJedan — nađi partnera za rekreativni sport",
  description:
    "Organizator objavi slot, slobodni igrači se prijave. Fudbal, košarka, tenis, odbojka, padel.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="sr"
      className={`dark ${bebas.variable} ${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
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
              success: "!border-primary/40",
              error: "!border-destructive/40",
            },
          }}
        />
      </body>
    </html>
  );
}
