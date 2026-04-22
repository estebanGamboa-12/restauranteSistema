import type { Metadata } from "next";
import { Playfair_Display, DM_Sans } from "next/font/google";
import { cn } from "@/lib/utils";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { SiteAuthProvider } from "@/components/providers/SiteAuthProvider";
import { SiteContentProvider } from "@/components/providers/SiteContentProvider";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { RouteCurtain } from "@/components/fx/RouteCurtain";
import { IntroLoader } from "@/components/fx/IntroLoader";
import { CustomCursor } from "@/components/fx/CustomCursor";
import { TouchRipple } from "@/components/fx/TouchRipple";
import { ScrollProgress } from "@/components/fx/ScrollProgress";
import "./globals.css";
import "@/styles/variables.css";

const fontDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const fontSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Paco's Food — La Comida de Paco",
  description:
    "Paco's Food, La Comida de Paco — comida casera en Almonte, Huelva. Cocina mediterránea, producto fresco y reservas online.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={cn(fontDisplay.variable, fontSans.variable)}>
      <body className="min-h-screen min-w-0 overflow-x-hidden bg-xalisco-black font-sans text-xalisco-cream antialiased">
        <SmoothScrollProvider>
          <SiteAuthProvider>
            <SiteContentProvider>
              <IntroLoader />
              <ScrollProgress />
              <CustomCursor />
              <TouchRipple />
              <Navbar />
              <main className="pt-16 lg:pt-20">
                <RouteCurtain>{children}</RouteCurtain>
              </main>
              <Footer />
            </SiteContentProvider>
          </SiteAuthProvider>
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
