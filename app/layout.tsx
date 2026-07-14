import type { Metadata } from 'next'
import { Syne, Epilogue, Space_Mono } from 'next/font/google'
import './globals.css'

// Woody design system fonts (VISUAL_LANGUAGE.md)
// Syne: headings — geometric, confident, distinctive
const syne = Syne({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800'],
  variable: '--font-syne',
  display: 'swap',
})

// Epilogue: body copy — legible, slightly condensed, human
const epilogue = Epilogue({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-epilogue',
  display: 'swap',
})

// Space Mono: data / coordinates / mono displays
const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Woody Run Companion',
  description: 'A private adaptive Spotify journey companion.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Woody',
    statusBarStyle: 'black-translucent',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${epilogue.variable} ${spaceMono.variable}`}
      suppressHydrationWarning
    >
      <body className="bg-void text-moon antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
