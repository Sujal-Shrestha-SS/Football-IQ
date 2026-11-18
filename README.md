<div align="center">

# Football IQ

**The ultimate football trivia app for hardcore fans.**  
7 game modes · AI-generated questions · Live multiplayer battles · Mobile-first

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com)
[![Capacitor](https://img.shields.io/badge/Capacitor-Android-119EFF?style=flat&logo=capacitor)](https://capacitorjs.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-8E75B2?style=flat&logo=google)](https://aistudio.google.com)

</div>

---

## 🎮 Game Modes

| Mode | Description |
|---|---|
| **Three Clubs** | See 3 club badges — name the player who represented all three |
| **Career Path** | Follow a chronological club list — guess the footballer |
| **Guess the Player** | Progressive clues (nationality, position, era, trophy, stat) reveal who it is |
| **Football Quiz** | Hard multiple-choice trivia — records, stats, finals, transfers |
| **Jumbled Name** | Unscramble letters to find the footballer |
| **Transfer Quiz** | Niche transfer fees, surprise moves, loan deals, free transfers |
| **Shirt Number** | Which player wore that number for that club? |
| **Tic-Tac-Toe** | Football-themed Tic-Tac-Toe using real players |

All questions are **expert difficulty**, focused post-2010, and powered by **Gemini AI** with offline seed data as fallback.

---

## Tech Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS v4
- **Animations** — Framer Motion (`motion`), canvas-confetti
- **Icons** — Lucide React
- **Backend** — Node.js, Express, WebSockets (`ws`)
- **AI** — Google Gemini API (`@google/genai`)
- **Mobile** — Capacitor (Android)

---

## Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A free **Gemini API key** from [Google AI Studio](https://aistudio.google.com/app/apikey)
- (For Android) [Android Studio](https://developer.android.com/studio) with Android SDK

---

## Run Locally

**1. Clone the repository**
```bash
git clone https://github.com/YOURUSERNAME/football-iq.git
cd football-iq
```

**2. Install dependencies**
```bash
npm install
```

**3. Set up environment variables**
```bash
cp .env.example .env
```
Open `.env` and add your Gemini API key:
```
GEMINI_API_KEY=your_api_key_here
```

**4. Start the development server**
```bash
npm run dev
```

The app runs at **http://localhost:3000**

> The server handles both the React frontend and the multiplayer WebSocket backend — no separate process needed.

---

## 📦 Build for Production

```bash
npm run build
```

Output goes to `dist/`. The Express server in `server.ts` serves it automatically.

---

## Build Android APK

**1. Build the web app**
```bash
npm run build
```

**2. Sync web assets into the Android project**
```bash
npx cap sync android
```

**3. Build the debug APK**
```bash
cd android
./gradlew assembleDebug
```

The APK will be at:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

> Enable **"Install from unknown sources"** on your Android phone, then sideload the APK.

> [!NOTE]
> For multiplayer and AI-generated questions on Android, the app needs to reach the backend server. Update the server URL in `capacitor.config.ts` to point to your deployed backend.

---

## ☁️ Deploy the Backend

The `server.ts` file is a single Express + WebSocket server that serves the frontend and powers multiplayer. Deploy it to any Node.js host.

**Render (recommended — free tier available)**

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New Web Service → connect your repo
3. Set:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
4. Add environment variable: `GEMINI_API_KEY` = your key
5. Deploy — you'll get a URL like `https://football-iq.onrender.com`

> Free tier spins down after 15 min of inactivity. Use [UptimeRobot](https://uptimerobot.com) to keep it warm.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ Yes | Your Google Gemini API key |
| `PORT` | No | Server port (defaults to `3000`) |

---

## Project Structure

```
football-iq/
├── src/
│   ├── components/     # Reusable UI components
│   ├── games/          # Individual game mode components
│   ├── screens/        # App screens (Home, Profile, Multiplayer...)
│   ├── services/       # Game logic, storage, sound, multiplayer
│   ├── data/           # Static seed question banks (JSON)
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Root component and screen state machine
│   └── main.tsx        # React entry point
├── android/            # Capacitor Android project
├── server.ts           # Express + WebSocket backend
├── capacitor.config.ts # Capacitor mobile configuration
└── vite.config.ts      # Vite build configuration
```

---


