import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'OpenCascade.js Demo',
  description: 'A 3D CAD application using OpenCascade.js and model-viewer',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <Script src="/monaco-editor-workers/monaco.config.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  )
} 