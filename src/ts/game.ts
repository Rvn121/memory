import '../scss/main.scss';
import { createState, findKnownMatch, findKnownPair, findUnknownCard, hasWinner, loadSettings, otherPlayer, rememberCard, computerRecallChance } from './game/logic';
import type { Card, GameState, Player } from './game/types';
import { showGameEnd } from './game/end-screen';
import { setupGameLayout } from './game/layout';
import { renderCard } from './templates/game';

const selectedSettings = loadSettings();
const gameBoard = document.querySelector<HTMLElement>('#game-board')!;
const quitDialog = document.querySelector<HTMLElement>('#quit-dialog')!;
const endScreen = document.querySelector<HTMLElement>('#game-end')!;
const startDialog = document.querySelector<HTMLElement>('#game-start-dialog')!;
const startName = document.querySelector<HTMLElement>('#game-start-name')!;
const orientationHint = document.querySelector<HTMLElement>('#orientation-hint')!;
const computerPause = 850;
const flipPause = 1050;
let currentRun = 0;
let state: GameState;

/**
 * Renders the shuffled cards using the selected theme.
 */
function renderBoard(): void {
  gameBoard.className = `game__board game__board--${state.cards.length}`;
  const cardsHtml: string[] = [];
  for (const card of state.cards) cardsHtml.push(renderCard(card, selectedSettings.theme));
  gameBoard.innerHTML = cardsHtml.join('');
  requestAnimationFrame(updateOrientationHint);
}


/**
 * Shows the landscape hint only when the portrait layout is clipped.
 */
function updateOrientationHint(): void {
  const portrait = window.matchMedia('(orientation: portrait) and (max-width: 767px)').matches;
  const board = gameBoard.getBoundingClientRect();
  const exit = document.querySelector<HTMLElement>('#exit-trigger')?.getBoundingClientRect();
  const clipped = board.bottom > window.innerHeight - 4 || (!!exit && exit.bottom > window.innerHeight - 4);
  orientationHint.hidden = !(portrait && clipped);
}


/**
 * Checks whether the computer is controlling the active turn.
 * @returns Whether the active player is computer-controlled.
 */
function isComputerTurn(): boolean {
  return state.mode === '1P' && state.current !== state.human;
}


/**
 * Displays the names of both players in the header and final score.
 */
function renderPlayerNames(): void {
  for (const player of ['blue', 'orange'] as Player[]) {
    document.querySelector<HTMLElement>(`#name-${player}`)!.textContent = state.names[player];
    document.querySelector<HTMLElement>(`#final-name-${player}`)!.textContent = state.names[player];
  }
}


/**
 * Updates scores, active-player styling, and accessibility labels.
 */
function updateScoreboard(): void {
  for (const player of ['blue', 'orange'] as Player[]) {
    document.querySelector<HTMLElement>(`#score-${player}`)!.textContent = String(state.scores[player]);
    const chip = document.querySelector<HTMLElement>(`#player-${player}`)!;
    chip.classList.toggle('game__player--active', state.current === player && !state.finished);
    let label = `${state.names[player]}: ${state.scores[player]} pairs`;
    if (state.current === player) label += ', current turn';
    chip.setAttribute('aria-label', label);
  }
  updateTurnAnnouncement();
}


/**
 * Announces the active player to screen readers.
 */
function updateTurnAnnouncement(): void {
  let announcement = `${state.names[state.current]}'s turn`;
  if (isComputerTurn()) announcement = 'Computer turn';
  if (state.finished) announcement = '';
  document.querySelector<HTMLElement>('#turn-announcement')!.textContent = announcement;
}


/**
 * Synchronizes the appearance and accessibility state of a card.
 * @param card - Card whose current state should be displayed.
 */
function updateCard(card: Card): void {
  const button = gameBoard.querySelector<HTMLButtonElement>(`[data-id="${card.id}"]`);
  if (!button) return;
  button.classList.toggle('is-flipped', card.faceUp || card.matched);
  button.classList.toggle('is-matched', card.matched);
  button.disabled = card.matched || state.locked || state.paused || isComputerTurn() || card.faceUp;
  let label = `Hidden card ${card.id + 1}`;
  if (card.faceUp || card.matched) label = `Card ${card.id + 1}, motif ${card.motif}`;
  button.setAttribute('aria-label', label);
}


/**
 * Refreshes all card controls and the player status display.
 */
function updateView(): void {
  state.cards.forEach(updateCard);
  updateScoreboard();
}


/**
 * Reveals an eligible card and records its position for the computer.
 * @param id - Zero-based index of the selected card.
 */
function flipCard(id: number): void {
  const card = state.cards[id];
  if (!card || card.faceUp || card.matched || state.locked || state.finished || state.paused) return;
  card.faceUp = true;
  state.flipped.push(id);
  rememberCard(state, id);
  updateView();
  if (state.flipped.length === 2) void evaluatePair(state.runId);
}


/**
 * Creates a delay between visible game actions.
 * @param duration - Delay in milliseconds.
 * @returns Promise that resolves after the delay.
 */
function sleep(duration: number): Promise<void> {
  const delay = Promise.withResolvers<void>();
  window.setTimeout(delay.resolve, duration);
  return delay.promise;
}


/**
 * Evaluates two revealed cards after their flip animation finishes.
 * @param runId - Identifier used to ignore results from a previous game.
 * @returns Promise that resolves when the pair has been processed.
 */
async function evaluatePair(runId: number): Promise<void> {
  state.locked = true;
  updateView();
  await sleep(flipPause);
  if (state.runId !== runId) return;
  while (state.paused && state.runId === runId) await sleep(100);
  if (state.runId !== runId) return;
  const first = state.cards[state.flipped[0]];
  const second = state.cards[state.flipped[1]];
  if (first.motif === second.motif) awardPair(first, second);
  else hidePair(first, second);
  state.flipped = [];
  finishTurn();
}


/**
 * Awards a point and marks the selected cards as matched.
 * @param first - First revealed card.
 * @param second - Second revealed card.
 */
function awardPair(first: Card, second: Card): void {
  first.matched = true;
  second.matched = true;
  state.scores[state.current]++;
  state.seen.delete(first.id);
  state.seen.delete(second.id);
}


/**
 * Hides an unmatched pair and hands the turn to the other player.
 * @param first - First revealed card.
 * @param second - Second revealed card.
 */
function hidePair(first: Card, second: Card): void {
  first.faceUp = false;
  second.faceUp = false;
  state.current = otherPlayer(state.current);
}


/**
 * Updates the game or begins the next computer turn after a pair.
 */
function finishTurn(): void {
  state.locked = false;
  if (hasWinner(state)) return finishGame();
  updateView();
  if (isComputerTurn() && !state.paused) void computerTurn(state.runId);
}


/**
 * Stops normal play and opens the final result sequence.
 */
function finishGame(): void {
  state.finished = true;
  updateView();
  const runId = state.runId;
  showGameEnd(state, runId, isCurrentRun);
}


/**
 * Checks whether a delayed action belongs to the active round.
 * @param runId - Identifier of the round to validate.
 * @returns True only for the active round.
 */
function isCurrentRun(runId: number): boolean {
  return state.runId === runId;
}


/**
 * Pauses the current game and displays the exit confirmation.
 */
function openQuitDialog(): void {
  if (state.finished) return;
  state.paused = true;
  updateView();
  quitDialog.hidden = false;
  document.querySelector<HTMLButtonElement>('#back-to-game')?.focus();
}


/**
 * Closes the exit confirmation and resumes the paused game.
 */
function closeQuitDialog(): void {
  quitDialog.hidden = true;
  state.paused = false;
  updateView();
  if (isComputerTurn() && !state.locked) void computerTurn(state.runId);
  document.querySelector<HTMLButtonElement>('#exit-trigger')?.focus();
}


/**
 * Closes the exit dialog when its backdrop is clicked.
 * @param event - Mouse click on the dialog backdrop or its contents.
 */
function handleQuitBackdrop(event: MouseEvent): void {
  if (event.target === quitDialog && !quitDialog.hidden) closeQuitDialog();
}


/**
 * Displays the random starting player before allowing moves.
 * @param runId - Identifier of the current game to protect delayed updates.
 * @returns Promise that resolves after the starting announcement.
 */
async function announceStartingPlayer(runId: number): Promise<void> {
  state.paused = true;
  startName.textContent = state.names[state.current];
  startName.className = `game-start__name game-start__name--${state.current}`;
  startDialog.hidden = false;
  updateView();
  await sleep(2000);
  if (state.runId !== runId) return;
  startDialog.hidden = true;
  state.paused = false;
  updateView();
  if (isComputerTurn()) void computerTurn(runId);
}


/**
 * Handles Escape and keyboard focus navigation in the exit dialog.
 * @param event - Keyboard event received while the dialog is open.
 */
function handleQuitKeys(event: KeyboardEvent): void {
  if (quitDialog.hidden) return;
  if (event.key === 'Escape') closeQuitDialog();
  if (event.key !== 'Tab') return;
  trapQuitFocus(event);
}


/**
 * Keeps keyboard focus inside the exit confirmation dialog.
 * @param event - Tab key event to handle when focus reaches a boundary.
 */
function trapQuitFocus(event: KeyboardEvent): void {
  const controls = Array.from(quitDialog.querySelectorAll<HTMLButtonElement>('button'));
  let target = controls[controls.length - 1];
  let next = controls[0];
  if (event.shiftKey) {
    target = controls[0];
    next = controls[controls.length - 1];
  }
  if (document.activeElement !== target) return;
  event.preventDefault();
  next.focus();
}


/**
 * Selects a computer card using limited recall or random choice.
 * @returns Index of the chosen card, or undefined when no card is available.
 */
function pickComputerCard(): number | undefined {
  const remembers = Math.random() < computerRecallChance;
  if (!remembers) return findRandomCard();
  if (state.flipped.length === 1) return findKnownMatch(state) ?? findUnknownCard(state);
  return findKnownPair(state)[0] ?? findUnknownCard(state);
}


/**
 * Chooses a random eligible card without using computer memory.
 * @returns Index of an available card, or undefined if none remain.
 */
function findRandomCard(): number | undefined {
  const available: Card[] = [];
  for (const card of state.cards) if (!card.matched && !card.faceUp) available.push(card);
  return available[Math.floor(Math.random() * available.length)]?.id;
}


/**
 * Performs the computer's card selections with visible pauses.
 * @param runId - Identifier used to cancel actions from an outdated game.
 * @returns Promise that resolves after the computer has made its move.
 */
async function computerTurn(runId: number): Promise<void> {
  await sleep(computerPause);
  if (state.runId !== runId || state.finished || state.paused || !isComputerTurn() || state.locked) return;
  const first = pickComputerCard();
  if (first === undefined) return;
  flipCard(first);
  await sleep(computerPause);
  if (state.runId !== runId || state.finished || state.paused || !isComputerTurn()) return;
  const second = pickComputerCard();
  if (second !== undefined) flipCard(second);
}


/**
 * Processes a valid human card selection.
 * @param event - Mouse or synthesized click event from the board.
 */
function handleCardClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element) || state.locked || state.paused || isComputerTurn()) return;
  const button = target.closest<HTMLButtonElement>('.memory-card');
  if (button && !button.disabled) flipCard(Number(button.dataset.id));
}


/**
 * Resets the game state and announces the randomly chosen starter.
 */
function startNewGame(): void {
  state = createState(selectedSettings, ++currentRun);
  quitDialog.hidden = true;
  startDialog.hidden = true;
  endScreen.hidden = true;
  document.body.classList.toggle('game-page--theme2', selectedSettings.theme === 'da-projects');
  document.body.classList.toggle('game-page--single', selectedSettings.mode === '1P');
  renderBoard();
  renderPlayerNames();
  updateView();
  void announceStartingPlayer(state.runId);
}


/**
 * Leaves the current game and returns to the settings page.
 */
function exitToSettings(): void {
  window.location.href = './settings.html';
}


/**
 * Connects game controls and starts the first round.
 */
function initGame(): void {
  setupGameLayout();
  gameBoard.addEventListener('click', handleCardClick);
  document.querySelector<HTMLButtonElement>('#exit-trigger')?.addEventListener('click', openQuitDialog);
  document.querySelector<HTMLButtonElement>('#back-to-game')?.addEventListener('click', closeQuitDialog);
  document.querySelector<HTMLButtonElement>('#confirm-exit')?.addEventListener('click', exitToSettings);
  quitDialog.addEventListener('click', handleQuitBackdrop);
  document.addEventListener('keydown', handleQuitKeys);
  window.addEventListener('resize', updateOrientationHint);
  window.addEventListener('orientationchange', updateOrientationHint);
  startNewGame();
}

initGame();
