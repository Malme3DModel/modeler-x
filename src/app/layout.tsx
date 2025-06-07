import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Modeler X - Next.js",
  description: "A Full Live-Scripted CAD Kernel in the Browser powered by Next.js",
  keywords: "SCAD, OpenSCAD, CAD, OpenCascade, Scripting, Next.js",
  applicationName: "Modeler X",
  authors: [{ name: "Johnathon Selstad" }],
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon/favicon.ico",
    apple: "/icon/apple-touch-icon.png",
  }
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1e1e1e',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <ThemeProvider defaultTheme="vs-dark">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
