import type { Metadata } from 'next'
import './globals.css'
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration'
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt'

export const metadata: Metadata = {
  title: 'Modeler-X CAD Studio',
  description: 'A fully integrated Scripted CAD Kernel for the browser built with Next.js and OpenCascade.js',
  manifest: '/manifest.json',
  themeColor: '#1f2937',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Modeler-X',
  },
  icons: {
    apple: '/icon-192x192.svg',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1f2937" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Modeler-X" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
      </head>
      <body>
        {children}
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}    