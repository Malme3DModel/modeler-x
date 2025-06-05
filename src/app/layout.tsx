import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cascade Studio - Next.js",
  description: "A Full Live-Scripted CAD Kernel in the Browser powered by Next.js",
  keywords: "SCAD, OpenSCAD, CAD, OpenCascade, Scripting, Next.js",
  applicationName: "Cascade Studio",
  authors: [{ name: "Johnathon Selstad" }],
  viewport: "width=device-width, initial-scale=1.0",
  themeColor: "#1e1e1e",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon/favicon.ico",
    apple: "/icon/apple-touch-icon.png",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geist.variable} ${geistMono.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
