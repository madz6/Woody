# Woody — Getting Started

## One-time setup

### 1. Install dependencies
Open your terminal in the woody folder and run:
```
npm install
```

### 2. Create your .env.local file
Copy the example:
```
cp .env.local.example .env.local
```
Then fill in the values (see below).

### 3. Get your Spotify API credentials
1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account
3. Click "Create App"
4. Name it "Woody", description "Music discovery app"
5. Add redirect URI: `http://localhost:3000/api/auth/callback`
6. Copy your **Client ID** and **Client Secret** into `.env.local`

### 4. Get your Anthropic API key
1. Go to https://console.anthropic.com
2. Create an account if you don't have one
3. Go to API Keys → Create Key
4. Copy the key into `.env.local` as `ANTHROPIC_API_KEY`

### 5. Run the dev server
```
npm run dev
```
Open http://localhost:3000

## What works now
- Type a vibe into the intent bar and press Enter
- Claude parses your intent into a structured lens
- Spotify searches for matching tracks
- 4 suggestions appear as nodes

## What's next
- Player (Spotify Web Playback SDK)
- Map (Three.js globe)
- Session memory
- Smart EQ
