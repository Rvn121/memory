import '../scss/main.scss';
import { createState, findKnownMatch, findKnownPair, findUnknownCard, hasWinner, loadSettings, otherPlayer, rememberCard, COMPUTER_RECALL_CHANCE } from './game/logic';
import type { Card, GameState, Player } from './game/types';
import { showGameEnd } from './game/end-screen';
import { setupGameLayout } from './game/layout';

const SETTINGS = loadSettings();
const BOARD = document.querySelector<HTMLElement>('#game-board')!;
const MESSAGE = document.querySelector<HTMLElement>('#game-message')!;
const QUIT_DIALOG = document.querySelector<HTMLElement>('#quit-dialog')!;
const END_SCREEN = document.querySelector<HTMLElement>('#game-end')!;
const START_DIALOG = document.querySelector<HTMLElement>('#game-start-dialog')!;
const START_NAME = document.querySelector<HTMLElement>('#game-start-name')!;
const ORIENTATION_HINT = document.querySelector<HTMLElement>('#orientation-hint')!;
const ASSET_ROOT = import.meta.env.BASE_URL;
const COMPUTER_PAUSE = 850;
const FLIP_PAUSE = 1050;
let currentRun = 0;
let state: GameState;

/**
 * Builds the card button markup with both animated faces.
 */
function renderCard(card: Card): string {
  let theme = 'theme1/t1';
  if (SETTINGS.theme === 'da-projects') theme = 'theme2/t2';
  const face = `${ASSET_ROOT}icons/${theme}-${card.motif}.svg`;
  return `<button class="memory-card" type="button" data-id="${card.id}" aria-label="Hidden card ${card.id + 1}">
    <span class="memory-card__inner"><span class="memory-card__face memory-card__face--back">
    <img src="${ASSET_ROOT}icons/logo_developer-akademie.png" alt=""></span>
    <span class="memory-card__face memory-card__face--front"><img src="${face}" alt=""></span></span></button>`;
}


/**
 * Renders all cards with the selected board size.
 */
function renderBoard(): void {
  BOARD.className = `game__board game__board--${state.cards.length}`;
  BOARD.innerHTML = state.cards.map(renderCard).join('');
  requestAnimationFrame(updateOrientationHint);
}


/**
 * Suggests landscape only when the board or exit action is clipped.
 */
function updateOrientationHint(): void {
  const portrait = window.matchMedia('(orientation: portrait) and (max-width: 767px)').matches;
  const board = BOARD.getBoundingClientRect();
  const exit = document.querySelector<HTMLElement>('#exit-trigger')?.getBoundingClientRect();
  const clipped = board.bottom > window.innerHeight - 4 || (!!exit && exit.bottom > window.innerHeight - 4);
  ORIENTATION_HINT.hidden = !(portrait && clipped);
}


/**
 * Returns true when the computer controls the current player.
 */
function isComputerTurn(): boolean {
  return state.mode === '1P' && state.current !== state.human;
}


/**
 * Sets the two visible player names for this game.
 */
function renderPlayerNames(): void {
  for (const player of ['blue', 'orange'] as Player[]) {
    document.querySelector<HTMLElement>(`#name-${player}`)!.textContent = state.names[player];
    document.querySelector<HTMLElement>(`#final-name-${player}`)!.textContent = state.names[player];
  }
}


/**
 * Refreshes which player is active and their pair counters.
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


function updateTurnAnnouncement(): void {
  let announcement = `${state.names[state.current]}'s turn`;
  if (isComputerTurn()) announcement = 'Computer turn';
  if (state.finished) announcement = '';
  document.querySelector<HTMLElement>('#turn-announcement')!.textContent = announcement;
}


/**
 * Applies a card's current flip and matched visuals.
 */
function updateCard(card: Card): void {
  const button = BOARD.querySelector<HTMLButtonElement>(`[data-id="${card.id}"]`);
  if (!button) return;
  button.classList.toggle('is-flipped', card.faceUp || card.matched);
  button.classList.toggle('is-matched', card.matched);
  button.disabled = card.matched || state.locked || state.paused || isComputerTurn() || card.faceUp;
  let label = `Hidden card ${card.id + 1}`;
  if (card.faceUp || card.matched) label = `Card ${card.id + 1}, motif ${card.motif}`;
  button.setAttribute('aria-label', label);
}


/**
 * Refreshes card controls and player indicator.
 */
function updateView(): void {
  state.cards.forEach(updateCard);
  updateScoreboard();
}


/**
 * Shows the selected card and teaches the computer its position.
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
 * Makes sure delayed actions never affect a newly restarted game.
 */
function sleep(duration: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, duration));
}


/**
 * Resolves a pair after both flip animations have played.
 */
async function evaluatePair(runId: number): Promise<void> {
  state.locked = true;
  updateView();
  await sleep(FLIP_PAUSE);
  if (state.runId !== runId) return;
  while (state.paused && state.runId === runId) await sleep(100);
  if (state.runId !== runId) return;
  const [first, second] = state.flipped.map((id) => state.cards[id]);
  if (first.motif === second.motif) awardPair(first, second);
  else hidePair(first, second);
  state.flipped = [];
  finishTurn();
}


/**
 * Awards one matching pair to the current player.
 */
function awardPair(first: Card, second: Card): void {
  first.matched = true;
  second.matched = true;
  state.scores[state.current]++;
  state.seen.delete(first.id);
  state.seen.delete(second.id);
  MESSAGE.textContent = `${state.names[state.current]} found a pair!`;
}


/**
 * Hides mismatched cards and changes the active player.
 */
function hidePair(first: Card, second: Card): void {
  first.faceUp = false;
  second.faceUp = false;
  state.current = otherPlayer(state.current);
  MESSAGE.textContent = '';
}


/**
 * Updates the game after a successful or unsuccessful attempt.
 */
function finishTurn(): void {
  state.locked = false;
  if (hasWinner(state)) return finishGame();
  updateView();
  if (isComputerTurn() && !state.paused) void computerTurn(state.runId);
}


/**
 * Displays the game-over screen and its delayed outcome.
 */
function finishGame(): void {
  state.finished = true;
  updateView();
  const runId = state.runId;
  showGameEnd(state, () => state.runId === runId);
}


/**
 * Opens the confirmation without leaving the current round.
 */
function openQuitDialog(): void {
  if (state.finished) return;
  state.paused = true;
  updateView();
  QUIT_DIALOG.hidden = false;
  document.querySelector<HTMLButtonElement>('#back-to-game')?.focus();
}


/**
 * Closes the confirmation and continues the paused round.
 */
function closeQuitDialog(): void {
  QUIT_DIALOG.hidden = true;
  state.paused = false;
  updateView();
  if (isComputerTurn() && !state.locked) void computerTurn(state.runId);
  document.querySelector<HTMLButtonElement>('#exit-trigger')?.focus();
}


/**
 * Closes the quit dialog if the user clicks its dark backdrop.
 */
function handleQuitBackdrop(event: MouseEvent): void {
  if (event.target === QUIT_DIALOG && !QUIT_DIALOG.hidden) closeQuitDialog();
}


/**
 * Shows the randomized starting player before the first card can turn.
 */
async function announceStartingPlayer(runId: number): Promise<void> {
  state.paused = true;
  START_NAME.textContent = state.names[state.current];
  START_NAME.className = `game-start__name game-start__name--${state.current}`;
  START_DIALOG.hidden = false;
  updateView();
  await sleep(2000);
  if (state.runId !== runId) return;
  START_DIALOG.hidden = true;
  state.paused = false;
  updateView();
  if (isComputerTurn()) void computerTurn(runId);
}


/**
 * Prevents leaving the modal via a keyboard shortcut accidentally.
 */
function handleQuitKeys(event: KeyboardEvent): void {
  if (QUIT_DIALOG.hidden) return;
  if (event.key === 'Escape') closeQuitDialog();
  if (event.key !== 'Tab') return;
  trapQuitFocus(event);
}


function trapQuitFocus(event: KeyboardEvent): void {
  const controls = Array.from(QUIT_DIALOG.querySelectorAll<HTMLButtonElement>('button'));
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
 * Selects a useful card for the computer's first or second flip.
 */
function pickComputerCard(): number | undefined {
  const remembers = Math.random() < COMPUTER_RECALL_CHANCE;
  if (!remembers) return findRandomCard();
  if (state.flipped.length === 1) return findKnownMatch(state) ?? findUnknownCard(state);
  return findKnownPair(state)[0] ?? findUnknownCard(state);
}


/**
 * Sometimes chooses blindly instead of using remembered card positions.
 */
function findRandomCard(): number | undefined {
  const available = state.cards.filter((card) => !card.matched && !card.faceUp);
  return available[Math.floor(Math.random() * available.length)]?.id;
}


/**
 * Plays one computer move, with pauses to make its choices visible.
 */
async function computerTurn(runId: number): Promise<void> {
  await sleep(COMPUTER_PAUSE);
  if (state.runId !== runId || state.finished || state.paused || !isComputerTurn() || state.locked) return;
  const first = pickComputerCard();
  if (first === undefined) return;
  flipCard(first);
  await sleep(COMPUTER_PAUSE);
  if (state.runId !== runId || state.finished || state.paused || !isComputerTurn()) return;
  const second = pickComputerCard();
  if (second !== undefined) flipCard(second);
}


/**
 * Handles only a valid human card selection.
 */
function handleCardClick(event: MouseEvent): void {
  const target = event.target;
  if (!(target instanceof Element) || state.locked || state.paused || isComputerTurn()) return;
  const button = target.closest<HTMLButtonElement>('.memory-card');
  if (button && !button.disabled) flipCard(Number(button.dataset.id));
}


/**
 * Starts a new game without retaining cards or computer knowledge.
 */
function startNewGame(): void {
  state = createState(SETTINGS, ++currentRun);
  QUIT_DIALOG.hidden = true;
  START_DIALOG.hidden = true;
  END_SCREEN.hidden = true;
  MESSAGE.textContent = '';
  document.body.classList.toggle('game-page--theme2', SETTINGS.theme === 'da-projects');
  document.body.classList.toggle('game-page--single', SETTINGS.mode === '1P');
  renderBoard();
  renderPlayerNames();
  updateView();
  void announceStartingPlayer(state.runId);
}


/**
 * Installs the game interactions and creates the initial board.
 */
function initGame(): void {
  setupGameLayout();
  BOARD.addEventListener('click', handleCardClick);
  document.querySelector<HTMLButtonElement>('#exit-trigger')?.addEventListener('click', openQuitDialog);
  document.querySelector<HTMLButtonElement>('#back-to-game')?.addEventListener('click', closeQuitDialog);
  document.querySelector<HTMLButtonElement>('#confirm-exit')?.addEventListener('click', () => { window.location.href = './settings.html'; });
  QUIT_DIALOG.addEventListener('click', handleQuitBackdrop);
  document.addEventListener('keydown', handleQuitKeys);
  window.addEventListener('resize', updateOrientationHint);
  window.addEventListener('orientationchange', updateOrientationHint);
  startNewGame();
}

initGame();
