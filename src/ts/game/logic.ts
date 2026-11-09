import type { Card, GameSettings, GameState, Player } from './types';

const VALID_BOARDS = [16, 24, 36];
export const COMPUTER_MEMORY_LIMIT = 6;
export const COMPUTER_RECALL_CHANCE = 0.65;

/**
 * Reads the last game selection and uses safe defaults if it is missing.
 */
export function loadSettings(): GameSettings {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem('memory-settings') || 'null');
    if (typeof parsed !== 'object' || parsed === null) return defaultSettings();
    return readStoredSettings(parsed as Partial<GameSettings>);
  } catch { return defaultSettings(); }
}


/** Validates stored selections before applying them to a new game. */
function readStoredSettings(data: Partial<GameSettings>): GameSettings {
  const settings = defaultSettings();
  const board = Number(data.board);
  if (data.theme === 'da-projects') settings.theme = 'da-projects';
  if (data.player === 'orange') settings.player = 'orange';
  if (VALID_BOARDS.includes(board)) settings.board = String(board);
  if (data.mode === '2P') settings.mode = '2P';
  settings.playerOneName = cleanName(data.playerOneName, 'Player 1');
  settings.playerTwoName = cleanName(data.playerTwoName, 'Player 2');
  return settings;
}


/**
 * Returns a playable default configuration.
 */
function defaultSettings(): GameSettings {
  return { theme: 'code-vibes', player: 'blue', board: '16', mode: '1P', playerOneName: 'Player 1', playerTwoName: 'Player 2' };
}


/**
 * Safely sanitizes a player name read from session storage.
 */
function cleanName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const name = value.trim().slice(0, 10);
  if (!name) return fallback;
  return name;
}


/**
 * Shuffles a list in place using the Fisher-Yates algorithm.
 */
export function shuffle<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const previousItem = items[i];
    items[i] = items[j];
    items[j] = previousItem;
  }
  return items;
}


/**
 * Creates the randomly chosen and duplicated card motifs.
 */
export function createCards(size: number): Card[] {
  const choices = shuffle(Array.from({ length: 18 }, /** Converts a zero-based index to a motif number. */ (_, i) => i + 1)).slice(0, size / 2);
  const pairs = shuffle([...choices, ...choices]);
  return pairs.map(/** Creates an initially hidden, unmatched card. */ (motif, id) => ({ id, motif, matched: false, faceUp: false }));
}


/**
 * Creates an independent game state with a randomized first player.
 */
export function createState(settings: GameSettings, runId: number): GameState {
  let current: Player = 'orange';
  if (Math.random() < 0.5) current = 'blue';
  let names = { blue: 'Blue', orange: 'Orange' };
  if (settings.mode === '2P') {
    names = { blue: settings.playerOneName, orange: settings.playerTwoName };
  }
  return { cards: createCards(Number(settings.board)), current,
    human: settings.player, mode: settings.mode, names,
    scores: { blue: 0, orange: 0 }, flipped: [], locked: false, paused: false,
    finished: false, seen: new Map(), runId };
}


/**
 * Returns the other player's color.
 */
export function otherPlayer(player: Player): Player {
  if (player === 'blue') return 'orange';
  return 'blue';
}


/**
 * Returns true if the score lead can no longer be caught.
 */
export function hasWinner(state: GameState): boolean {
  const remaining = state.cards.filter(/** Keeps pairs that have not yet been found. */ (card) => !card.matched).length / 2;
  return Math.abs(state.scores.blue - state.scores.orange) > remaining || remaining === 0;
}


/**
 * Selects a known matching pair when the computer has seen both cards.
 */
export function findKnownPair(state: GameState): number[] {
  const groups = new Map<number, number[]>();
  for (const [id, motif] of state.seen) {
    if (state.cards[id].matched || state.cards[id].faceUp) continue;
    if (!groups.has(motif)) groups.set(motif, []);
    groups.get(motif)!.push(id);
  }
  for (const ids of groups.values()) {
    if (ids.length >= 2) return ids.slice(0, 2);
  }
  return [];
}


/**
 * Picks a remembered match to the already open card, if one exists.
 */
export function findKnownMatch(state: GameState): number | undefined {
  const first = state.cards[state.flipped[0]];
  for (const [id, motif] of state.seen) {
    if (id === first.id || state.cards[id].matched) continue;
    if (motif === first.motif) return id;
  }
  return undefined;
}


/**
 * Picks a random facedown card, preferring cards not seen before.
 */
export function findUnknownCard(state: GameState): number | undefined {
  const candidates = state.cards.filter(/** Keeps cards available for another flip. */ (card) => !card.matched && !card.faceUp);
  const unknown = candidates.filter(/** Keeps cards the computer has not seen. */ (card) => !state.seen.has(card.id));
  if (unknown.length > 0) return shuffle(unknown)[0]?.id;
  return shuffle(candidates)[0]?.id;
}


/**
 * Remembers only a limited number of recently revealed positions.
 */
export function rememberCard(state: GameState, id: number): void {
  if (state.mode !== '1P') return;
  state.seen.delete(id);
  state.seen.set(id, state.cards[id].motif);
  if (state.seen.size > COMPUTER_MEMORY_LIMIT) {
    const oldest = state.seen.keys().next().value;
    if (oldest !== undefined) state.seen.delete(oldest);
  }
}
