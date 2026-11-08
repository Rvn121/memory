# Memory – Spielseite

- `settings.html` speichert Theme, Spielerfarbe und Kartenzahl in `sessionStorage` und öffnet `game.html`.
- `game.html` lädt `src/ts/game.ts`; Spiellogik und Datentypen liegen unter `src/ts/game/`.
- Die Motive werden aus `public/icons/theme1/t1-1.svg` bis `t1-18.svg` zufällig ausgewählt, verdoppelt und gemischt.
- Spieler und Computer spielen abwechselnd. Gleiche Paare bringen einen Punkt und einen weiteren Versuch.
- Der Computer merkt sich beim Spielen sichtbare Kartenpositionen und sucht bekannte Paare.
- Die Runde endet, wenn alle Paare gefunden sind oder ein Punktvorsprung nicht mehr eingeholt werden kann.
- `public/icons/playericon.svg` gehört zur Spieleranzeige. `src/scss/pages/_game.scss` enthält die Spiel-Styles.
- Es gibt keine manuell erstellte CSS-Datei. Vite kompiliert die SCSS-Imports selbst.

## Lokal starten

```powershell
npm.cmd install
npm.cmd run dev
```

Anschließend die Startseite öffnen und über die Settings ein Spiel starten.

## Exit confirmation and round result

- Clicking **Exit game** pauses the board and opens a centered 539 × 270 px confirmation dialog.
- **Back to game** resumes the ongoing round without resetting scores or revealed cards.
- **Exit game** in the dialog navigates immediately to `settings.html`.
- At round end, the full-screen **Game over** summary with the final scores appears for two seconds.
- The winner screen then displays the winning player and colored pawn with randomized confetti. A tie displays the DRAW and scales assets instead.
- **Back to start** returns to `index.html`. All page styles are authored in SCSS.

## Player mode

- 1P: Choose Blue or Orange; the other color is controlled by the computer.
- 2P: Both participants are human. Their editable names default to Player 1 and Player 2 (10 characters maximum). Player 1 is Blue, Player 2 Orange.
- Scores, turn indicators, final scores and winner names use the chosen mode. The computer never takes a turn in 2P.

## Responsive layout and touch
- Desktop content remains centered at a maximum width of 1440 px, with full-width backgrounds.
- Responsive refinements target 1200, 992, 768, 576 and 400 px; cards shrink within the viewport without horizontal scrolling (including a 6-column 36-card board).
- All playable cards and navigation use native button or link clicks, which support touch and keyboard activation. Theme previews also react to touch (`pointerdown`).
- On touch screens, persistent hover treatments are suppressed and controls have active feedback. Reduced-motion preferences disable key animations.
- Check on real devices at 320, 375, 576, 768, 992 and 1440 px, including landscape mode, 1P/2P names, quit dialog and all board sizes.
