import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Woody Run Companion',
    short_name: 'Woody',
    description: 'Private adaptive Spotify journeys for paired run tests.',
    start_url: '/',
    display: 'standalone',
    background_color: '#080b0c',
    theme_color: '#00e5c4',
    orientation: 'portrait',
    icons: [
      { src: '/woody-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/woody-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  }
}
