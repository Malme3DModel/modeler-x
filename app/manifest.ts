import { MetadataRoute } from 'next'

function getBasePath(): string {
  return process.env.NODE_ENV === 'production' ? '/modeler-x' : '';
}

function getPublicPath(path: string): string {
  const basePath = getBasePath();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${basePath}${normalizedPath}`;
}

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Modeler-X CAD Studio',
    short_name: 'Modeler-X',
    start_url: getBasePath() || './',
    display: 'standalone',
    description: 'A fully integrated Scripted CAD Kernel for the browser built with Next.js and OpenCascade.js',
    icons: [
      {
        src: getPublicPath('./icon-192x192.svg'),
        sizes: '192x192',
        type: 'image/svg+xml'
      },
      {
        src: getPublicPath('./icon-512x512.svg'),
        sizes: '512x512',
        type: 'image/svg+xml',
        purpose: 'maskable'
      }
    ],
    theme_color: '#1f2937',
    background_color: '#111827',
    orientation: 'landscape-primary',
    categories: ['productivity', 'utilities'],
    lang: 'ja'
  }
} 