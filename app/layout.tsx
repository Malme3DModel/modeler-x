import type { Metadata } from 'next'
import './globals.css'
import ServiceWorkerRegistration from '@/components/pwa/ServiceWorkerRegistration'
import PWAInstallPrompt from '@/components/pwa/PWAInstallPrompt'

function getBasePath(): string {
  return process.env.NODE_ENV === 'production' ? '/modeler-x' : '';
}

function getPublicPath(path: string): string {
  const basePath = getBasePath();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}

export const metadata: Metadata = {
  title: 'Modeler-X CAD Studio',
  description: 'A fully integrated Scripted CAD Kernel for the browser built with Next.js and OpenCascade.js',
  themeColor: '#1f2937',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Modeler-X',
  },
  icons: {
    icon: getPublicPath('/favicon.ico'),
    apple: getPublicPath('/icon-192x192.svg'),
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>
        {children}
        <ServiceWorkerRegistration />
        <PWAInstallPrompt />
      </body>
    </html>
  )
}    