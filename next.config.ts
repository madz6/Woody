import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'i.scdn.co' },
      { protocol: 'https', hostname: 'mosaic.scdn.co' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' https://sdk.scdn.co 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://i.scdn.co https://mosaic.scdn.co; connect-src 'self' https://api.spotify.com https://accounts.spotify.com; frame-src https://sdk.scdn.co; media-src https://*.scdn.co; font-src 'self' data:; base-uri 'self'; form-action 'self'; frame-ancestors 'none'" },
        ],
      },
    ]
  },
}

export default nextConfig
