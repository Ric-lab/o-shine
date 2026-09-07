# Bingo Plinko Lucky Machine

Mobile casual game combining Bingo and Plinko mechanics. Built with React + Vite, physics by Matter.js, packaged for Android via Capacitor.

## Game modes

- **FINGO** — line/diagonal bingo (5 in a row). 50 balls.
- **BINGO** — full card blackout. 100 balls.
- **SPINGO** — any 5 marked cells. 25 balls, no free center.

Every 25 levels triggers a Lucky Spin bonus wheel.

## Scripts

| Command | Action |
| --- | --- |
| `npm run dev` | Vite dev server (web preview) |
| `npm run build` | Production web build into `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | ESLint |
| `npm run build:android` | Build web + `cap sync android` |
| `npm run open:android` | Open the Android project in Android Studio |

## Project layout

- `src/App.jsx` — root component, audio orchestration, home screen, game shell
- `src/hooks/useGameLogic.js` — game state machine, win checks, rewards
- `src/hooks/useTheme.js` — skin/asset resolution
- `src/components/GameCanvas.jsx` — Matter.js physics + render loop
- `src/components/Modal/` — Magic, Fireball, Game Over, Next Level, Message
- `public/Images/Standard/` — game image assets
- `public/Audio/Standard/` — game sound assets
- `public/Images/Immutable/`, `public/Audio/Immutable/` — assets shared across skins
- `android/` — Capacitor Android shell

## Android build

```bash
npm run build:android
npm run open:android
```

Then in Android Studio: **Build → Generate Signed Bundle / APK** (requires a release keystore configured in `android/app/build.gradle`).

## Publishing checklist

See the issues tracked in the repo before each release.
