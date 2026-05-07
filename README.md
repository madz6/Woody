# Woody - Music Discovery App

Woody is a web app for music discovery that uses Spotify integration to create personalized "decks" and "quest runs" based on your prompts.

## Features

- **Decks with Previews**: Choose from 4 generated decks, each with preview chips you can audition
- **Quest Runs**: Generate personalized music journeys with SAFE, STRETCH, and WILDCARD categories
- **No Spoilers Mode**: Hide track metadata until you react or reveal
- **Spotify Integration**: 
  - Instant start without login (uses Client Credentials for search)
  - Connect Spotify to save tracks and add to playlists
- **Keep Lane / Side Quest**: Two modes that regenerate your quest run

## Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, TailwindCSS
- **Backend**: FastAPI, Python 3.11+, SQLAlchemy, PostgreSQL
- **Auth**: Spotify Authorization Code with PKCE
- **Database**: PostgreSQL (via Docker Compose)

## Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker and Docker Compose
- Spotify Developer Account

## Setup

### 1. Spotify Developer Setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create a new app
3. Add redirect URI: `http://127.0.0.1:3000/auth/callback`
4. Copy your Client ID and Client Secret

### 2. Environment Variables

Create a `.env` file in the project root (you can use `env.example.txt` as a template) and fill in your values:

```bash
# Copy the example (or create manually)
cp env.example.txt .env
# On Windows PowerShell:
# Copy-Item env.example.txt .env
```

Edit `.env`:
```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
SPOTIFY_REDIRECT_URI=http://127.0.0.1:3000/auth/callback
SESSION_SECRET=change_me_to_random_string
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/woody
```

### 3. Start Database

```bash
docker-compose up -d
```

This starts PostgreSQL on port 5432 with:
- User: `postgres`
- Password: `postgres`
- Database: `woody`

### 4. Backend Setup

```bash
cd apps/api
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

### 5. Frontend Setup

In a new terminal:

```bash
cd apps/web
npm install
npm run dev
```

The web app will be available at `http://localhost:3000`

## Usage

1. Open `http://localhost:3000` in your browser
2. Enter a music prompt (e.g., "jazz for studying")
3. Optionally select context chips (Late night, Gym, Focus, Aux)
4. Toggle "No spoilers" if you want to hide track info
5. Click "Send" to generate 4 decks
6. Click on a deck card to start a quest run
7. Use "Keep lane" or "Side quest" buttons to regenerate the quest
8. React to tracks: Like, Skip, Reveal, or open in Spotify
9. Connect Spotify to unlock: Save to library and Add to playlist features

## Project Structure

```
woody/
├── apps/
│   ├── api/              # FastAPI backend
│   │   ├── app/
│   │   │   ├── main.py
│   │   │   ├── database.py
│   │   │   ├── models.py
│   │   │   ├── providers/    # Spotify provider abstraction
│   │   │   ├── routers/      # API endpoints
│   │   │   └── moments/      # Sprint 1 placeholder
│   │   └── tests/
│   └── web/              # Next.js frontend
│       └── app/
├── packages/
│   └── shared/           # Shared TypeScript types
├── docker-compose.yml
├── .env.example
└── README.md
```

## API Endpoints

- `POST /session/start` - Create or resume session
- `POST /recommend/decks` - Generate 4 decks with preview chips
- `POST /recommend/quest` - Generate quest run
- `POST /feedback` - Submit track reaction (like/skip/reveal)
- `GET /spotify/status` - Check Spotify connection
- `GET /spotify/login` - Get Spotify OAuth URL
- `POST /spotify/exchange` - Exchange OAuth code for tokens
- `POST /spotify/save` - Save track to library
- `GET /spotify/playlists` - List user playlists
- `POST /spotify/add_to_playlist` - Add track to playlist

## Testing

Run smoke tests (requires Spotify credentials in `.env`):

```bash
cd apps/api
pytest tests/test_smoke.py -v
```

Tests will be skipped gracefully if Spotify credentials are missing.

## Linting

Backend:
```bash
cd apps/api
black app/
ruff check app/
```

Frontend:
```bash
cd apps/web
npm run lint
```

## Security Notes

- **Never commit `.env` file** - it contains secrets
- Secrets are read only from environment variables
- Session cookies are httpOnly and SameSite=Lax
- In production, set `secure=True` for cookies and use HTTPS

## Future Work (Sprint 1+)

- Moment embeddings for better track similarity
- Advanced recommendation algorithms
- Playlist management UI improvements
- User preferences and history

## License

Private project - all rights reserved.
