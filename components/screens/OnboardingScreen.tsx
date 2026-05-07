'use client'

import { motion } from 'framer-motion'
import { SpotifyLoginNav } from '@/components/auth/SpotifyLoginNav'

/** First-time connect screen — shown when Spotify is not yet connected.
 *  Three-moment onboarding: this is Moment 1 (Connect).
 *  Moments 2 and 3 happen inside HomeScreen after connect.
 */
export function OnboardingScreen() {
  return (
    <div className="fixed inset-0 bg-soil flex items-center justify-center px-6 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0, 0, 0.2, 1] }}
        className="text-center max-w-xs"
      >
        {/* Globe suggestion — concentric circles */}
        <div className="flex justify-center mb-10">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-white/[0.06]" />
            <div className="absolute inset-2 rounded-full border border-white/[0.08]" />
            <div className="absolute inset-4 rounded-full border border-white/[0.12]" />
            <div className="w-1.5 h-1.5 rounded-full bg-text-lo" />
          </div>
        </div>

        {/* Headline in Lora */}
        <h1 className="display-text mb-3 text-text-hi">
          your territory
        </h1>

        <p className="text-sm text-text-mid leading-relaxed mb-10">
          Describe a vibe. Woody finds the music that fits — and learns what you mean over time.
        </p>

        <SpotifyLoginNav className="
          inline-flex items-center gap-2
          px-6 py-3 rounded-2xl
          bg-bark border border-white/[0.1]
          text-sm text-text-hi font-sans
          hover:border-white/[0.2] hover:bg-bark-light
          transition-colors duration-interaction
        ">
          {/* Spotify mark */}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="text-moss-green">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
          </svg>
          Connect Spotify
        </SpotifyLoginNav>

        <p className="mt-6 text-[11px] text-text-lo">
          Spotify Premium required for playback
        </p>
      </motion.div>
    </div>
  )
}
