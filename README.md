# Memory – Developer Akademie

A browser-based memory game with two visual themes, a computer opponent and local multiplayer.

## Features

- **1 player:** Choose Blue or Orange and play against a computer opponent with limited memory.
- **2 players:** Enter two names (up to 10 characters each) and take turns on one device.
- **Board sizes:** 4 × 4, 4 × 6 or 6 × 6 cards.
- **Themes:** Code vibes and DA Projects (18 SVG card-face assets are included).
- Scoring, animated card flips, exit confirmation, start-player announcement and game-over screens.
- Responsive layout and touch controls; landscape guidance when there is not enough space.

## Requirements

- Node.js (current LTS recommended)
- npm

## Install and run

```bash
npm install
npm run dev
```

Open the local URL shown by Vite.

### Quality checks and production build

```bash
npm run check
npm run build
npm run preview
```

`npm run check:conventions` currently checks file length (400-line limit). It is **not** a comprehensive automatic audit of the 14-line function rule, TSDoc or accessibility.

## Project structure

| Location | Purpose |
| --- | --- |
| `index.html` | Home page |
| `settings.html` | Game settings and HTML5 form validation |
| `game.html` | Gameplay, dialogs and results |
| `imprint.html` | Imprint |
| `src/ts/` | TypeScript and game logic |
| `src/scss/` | SCSS partials, layout and responsive rules |
| `public/icons/theme1/` | Theme 1 card faces |
| `public/icons/theme2/` | Theme 2 SVG card faces |
| `public/fonts/` | Locally supplied fonts and license files |

## Fonts

The project uses **Red Rose** (home, Theme 1 and the “Settings” heading), **Almarai** (remaining settings text), and **Figtree** (Theme 2). Fonts are loaded locally with `@font-face`.

The following licensed font files are already included in `public/fonts/`:

- `RedRose-VariableFont_wght.ttf`
- `Almarai-Light.ttf`, `Almarai-Regular.ttf`, `Almarai-Bold.ttf`, `Almarai-ExtraBold.ttf`
- `Figtree-VariableFont_wght.ttf`, `Figtree-Italic-VariableFont_wght.ttf`

The corresponding SIL Open Font License notices are included in `public/fonts/`. Ensure these files and the font assets are deployed together.

## Deploying with Vite

For hosting in a repository subdirectory, set the appropriate `base` in `vite.config.ts`, then run `npm run build`. Upload the contents of `dist/` to your web server. Adjust the base to `/` if deploying at the domain root.

## Coding conventions

- TypeScript with explicit types, camelCase functions and TSDoc comments.
- SCSS modules and reusable partials; no manually maintained `style.css`.
- Target no more than 14 lines per function and 400 lines per source file.
- Semantic HTML, native HTML5 form constraints and keyboard-friendly controls.
- Minimum font size 16 px and no hover-induced layout jumps.

## Attribution

Created by Rouven Loske as part of further training at Developer Akademie in Munich, Germany. The design and icons are credited to Developer Akademie. See `imprint.html` for contact details.
