import { renderConfettiPiece } from '../templates/game';
import type { GameState, Player } from './types';

const ROOT = import.meta.env.BASE_URL;
const CONFETTI_COUNT = 20;
const RESULT_DELAY = 2000;

/**
 * Updates both final score counters.
 */
function updateFinalScores(state: GameState): void {
  document.querySelector<HTMLElement>('#final-blue')!.textContent = String(state.scores.blue);
  document.querySelector<HTMLElement>('#final-orange')!.textContent = String(state.scores.orange);
}


/**
 * Places confetti pieces randomly in the top banner.
 */
function renderConfetti(): void {
  const panel = document.querySelector<HTMLElement>('#game-end-confetti')!;
  panel.replaceChildren();
  for (let index = 0; index < CONFETTI_COUNT; index++) {
    const image = renderConfettiPiece(index, CONFETTI_COUNT);
    panel.append(image);
  }
}


/**
 * Selects the winner or draw layout and colors.
 */
function renderOutcome(state: GameState): void {
  const draw = state.scores.blue === state.scores.orange;
  document.querySelector<HTMLElement>('#game-end-winner')!.hidden = draw;
  document.querySelector<HTMLElement>('#game-end-draw')!.hidden = !draw;
  document.querySelector<HTMLElement>('#game-end-confetti')!.hidden = draw || document.body.classList.contains('game-page--theme2');
  if (!draw) {
    let winner: Player = 'orange';
    if (state.scores.blue > state.scores.orange) winner = 'blue';
    renderWinner(winner, state.names[winner], state.mode);
  }
}


/**
 * Colors the winning player name and chess pawn.
 */
function renderWinner(winner: Player, name: string, mode: '1P' | '2P'): void {
  const label = document.querySelector<HTMLElement>('#winner-name')!;
  label.textContent = `${winner.toUpperCase()} PLAYER`;
  if (mode === '2P') label.textContent = name;
  label.dataset.winner = winner;
  document.querySelector<HTMLElement>('.game-end__pawn')!.dataset.winner = winner;
  let pawn = 'chess_pawn.svg';
  if (document.body.classList.contains('game-page--theme2')) pawn = 'playertheme2.svg';
  document.querySelector<HTMLImageElement>('.game-end__pawn')!.src = `${ROOT}icons/${pawn}`;
  renderConfetti();
}


/**
 * First shows Game over, then reveals the winner or draw.
 */
export function showGameEnd(state: GameState, runValid: () => boolean): void {
  updateEndImages();
  updateFinalScores(state);
  document.querySelector<HTMLElement>('#game-end')!.hidden = false;
  document.querySelector<HTMLElement>('#game-end-intro')!.hidden = false;
  document.querySelector<HTMLElement>('#game-end-outcome')!.hidden = true;
  window.setTimeout(/** Reveals the result after the game-over delay. */ () => revealOutcome(state, runValid), RESULT_DELAY);
}


/** Selects endscreen artwork for the active game theme. */
function updateEndImages(): void {
  const secondTheme = sessionStorage.getItem('memory-settings')?.includes('da-projects');
  let headline = 'game-over';
  let scale = 'img/Scale_Icon.png';
  if (secondTheme) {
    headline = 'game-over2';
    scale = 'icons/drawtheme2.svg';
  }
  document.querySelector<HTMLImageElement>('.game-end__headline')!.src = `${ROOT}icons/${headline}.svg`;
  document.querySelector<HTMLImageElement>('.game-end__draw-text')!.src = `${ROOT}img/DRAW_green.png`;
  document.querySelector<HTMLImageElement>('.game-end__scale')!.src = `${ROOT}${scale}`;
}


/**
 * Advances to the final result only for the active game.
 */
function revealOutcome(state: GameState, runValid: () => boolean): void {
  if (!runValid()) return;
  renderOutcome(state);
  document.querySelector<HTMLElement>('#game-end-intro')!.hidden = true;
  document.querySelector<HTMLElement>('#game-end-outcome')!.hidden = false;
  document.querySelector<HTMLAnchorElement>('.game-end__home')?.focus();
}
