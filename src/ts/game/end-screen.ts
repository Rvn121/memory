import { renderConfettiPiece } from '../templates/game';
import type { GameState, Player } from './types';

const root = import.meta.env.BASE_URL;
const confettiCount = 20;
const resultDelay = 2000;

/**
 * Updates the final score counters for both players.
 * @param state - Game state containing the final player scores.
 */
function updateFinalScores(state: GameState): void {
  document.querySelector<HTMLElement>('#final-blue')!.textContent = String(state.scores.blue);
  document.querySelector<HTMLElement>('#final-orange')!.textContent = String(state.scores.orange);
}


/**
 * Places the decorative confetti images in the result banner.
 */
function renderConfetti(): void {
  const panel = document.querySelector<HTMLElement>('#game-end-confetti')!;
  panel.replaceChildren();
  for (let index = 0; index < confettiCount; index++) {
    const image = renderConfettiPiece(index, confettiCount);
    panel.append(image);
  }
}


/**
 * Shows the winner or draw layout based on the final scores.
 * @param state - Completed game state with scores and player names.
 */
function renderOutcome(state: GameState): void {
  const draw = state.scores.blue === state.scores.orange;
  document.querySelector<HTMLElement>('#game-end-winner')!.hidden = draw;
  document.querySelector<HTMLElement>('#game-end-draw')!.hidden = !draw;
  document.querySelector<HTMLElement>('#game-end-confetti')!.hidden = draw;
  if (!draw) {
    let winner: Player = 'orange';
    if (state.scores.blue > state.scores.orange) winner = 'blue';
    renderWinner(winner, state.names[winner], state.mode);
  }
}


/**
 * Displays the winning name and matching pawn artwork.
 * @param winner - Color assigned to the winning player.
 * @param name - Winning player's display name.
 * @param mode - Single-player or two-player game mode.
 */
function renderWinner(winner: Player, name: string, mode: '1P' | '2P'): void {
  const label = document.querySelector<HTMLElement>('#winner-name')!;
  label.textContent = `${winner.toUpperCase()} PLAYER`;
  if (mode === '2P') label.textContent = name;
  label.dataset.winner = winner;
  document.querySelector<HTMLElement>('.game-end__pawn')!.dataset.winner = winner;
  let pawn = 'chess_pawn.svg';
  if (document.body.classList.contains('game-page--theme2')) pawn = 'playertheme2.svg';
  document.querySelector<HTMLImageElement>('.game-end__pawn')!.src = `${root}icons/${pawn}`;
  renderConfetti();
}


/**
 * Shows the game-over introduction before the final result.
 * @param state - Completed game state used to display the result.
 * @param runId - Identifier of the completed round.
 * @param runValid - Named validator checking whether the round is still active.
 */
export function showGameEnd(state: GameState, runId: number, runValid: (runId: number) => boolean): void {
  updateEndImages();
  updateFinalScores(state);
  document.querySelector<HTMLElement>('#game-end')!.hidden = false;
  document.querySelector<HTMLElement>('#game-end-intro')!.hidden = false;
  document.querySelector<HTMLElement>('#game-end-outcome')!.hidden = true;
  window.setTimeout(revealOutcome, resultDelay, state, runId, runValid);
}


/**
 * Selects the end-screen artwork for the active visual theme.
 */
function updateEndImages(): void {
  const secondTheme = sessionStorage.getItem('memory-settings')?.includes('da-projects');
  let headline = 'game-over';
  let scale = 'img/Scale_Icon.png';
  if (secondTheme) {
    headline = 'game-over2';
    scale = 'icons/drawtheme2.svg';
  }
  document.querySelector<HTMLImageElement>('.game-end__headline')!.src = `${root}icons/${headline}.svg`;
  document.querySelector<HTMLImageElement>('.game-end__draw-text')!.src = `${root}img/DRAW_green.png`;
  document.querySelector<HTMLImageElement>('.game-end__scale')!.src = `${root}${scale}`;
}


/**
 * Reveals the final result if the current game is still valid.
 * @param state - Completed game state to render.
 * @param runId - Identifier of the completed round.
 * @param runValid - Named validator that prevents outdated results from appearing.
 */
function revealOutcome(state: GameState, runId: number, runValid: (runId: number) => boolean): void {
  if (!runValid(runId)) return;
  renderOutcome(state);
  document.querySelector<HTMLElement>('#game-end-intro')!.hidden = true;
  document.querySelector<HTMLElement>('#game-end-outcome')!.hidden = false;
  document.querySelector<HTMLAnchorElement>('.game-end__home')?.focus();
}
