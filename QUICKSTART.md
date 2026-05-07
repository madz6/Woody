# Quick Start Guide

## Prerequisites Check

- [ ] Node.js 18+ installed (`node --version`)
- [ ] Python 3.11+ installed (`python --version`)
- [ ] Docker installed and running (`docker --version`)
- [ ] Spotify Developer account with app created

## Setup Steps (5 minutes)

### 1. Environment Setup
```bash
# Copy environment template
cp env.example.txt .env

# Edit .env and add your Spotify credentials:
# - SPOTIFY_CLIENT_ID
# - SPOTIFY_CLIENT_SECRET
```

### 2. Start Database
```bash
docker-compose up -d
```

### 3. Install Backend Dependencies
```bash
cd apps/api
pip install -r requirements.txt
```

### 4. Install Frontend Dependencies
```bash
cd apps/web
npm install
```

### 5. Start Services

**Terminal 1 - Backend:**
```bash
cd apps/api
uvicorn app.main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd apps/web
npm run dev
```

### 6. Open App
Navigate to: http://localhost:3000

## First Use

1. Enter a music prompt (e.g., "jazz for studying")
2. Click "Send" to generate decks
3. Click on a deck card to start a quest
4. Use "Keep lane" or "Side quest" buttons to regenerate
5. Connect Spotify to unlock save/add-to-playlist features

## Troubleshooting

**Database connection error:**
- Ensure Docker is running: `docker ps`
- Check Postgres is up: `docker-compose ps`
- Verify DATABASE_URL in .env

**Spotify API errors:**
- Verify credentials in .env
- Check redirect URI matches: `http://127.0.0.1:3000/auth/callback`
- Ensure app is not in "Development Mode" restrictions

**Frontend build errors:**
- Run `npm install` in apps/web
- Clear .next folder: `rm -rf apps/web/.next`

**Backend import errors:**
- Ensure you're in apps/api directory
- Verify virtual environment is activated (if using one)
- Check Python version: `python --version` (should be 3.11+)
