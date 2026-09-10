import type { Metadata } from "next";
import { Inter, Playfair_Display, Noto_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// The real Springdale (springdale.edu.np) font pairing: Inter for body
// text, Playfair Display for headings. Applied app-wide via globals.css.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

// Used only by the assessment (CAS) pages' .cas-theme styling, matching the
// approved ledger mockup — everything else keeps the pair above.
const notoSerif = Noto_Serif({
  variable: "--font-noto-serif",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  weight: ["500", "600", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Academic Workflow Platform",
  description: "AI-powered academic workflow platform for Nepali schools",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfairDisplay.variable} ${notoSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
