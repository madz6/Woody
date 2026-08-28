import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="privacy-page">
      <Link href="/">← Woody</Link>
      <p className="eyebrow">PRIVATE FOUNDER PROTOTYPE</p>
      <h1>Privacy and data</h1>
      <section>
        <h2>What Woody reads</h2>
        <p>Woody reads the active Spotify device, current track, playback position, and playback changes while a session is active. It requests only playback-state and playback-control permissions.</p>
      </section>
      <section>
        <h2>What stays local</h2>
        <p>Session events, marked moments, optional notes, and research responses are stored in this browser. They are not a Spotify profile and are not used to train an AI model.</p>
      </section>
      <section>
        <h2>Audio</h2>
        <p>Woody does not capture, decrypt, route, or record Spotify audio. Aspect-analysis research uses only files supplied separately for local processing.</p>
      </section>
      <section>
        <h2>Your controls</h2>
        <p>Use “Delete local sessions” to remove browser research data. Use “Disconnect Spotify” to delete Woody’s local Spotify access and refresh tokens.</p>
      </section>
      <p className="privacy-contact">This is a private noncommercial prototype, not a public streaming service.</p>
    </main>
  )
}
