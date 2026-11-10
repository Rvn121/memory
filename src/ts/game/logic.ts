import type { Card, GameSettings, GameState, Player } from './types';

const validBoards = [16, 24, 36];
export const computerMemoryLimit = 6;
export const computerRecallChance = 0.65;

/**
 * Loads game selections from session storage or uses safe defaults.
 * @returns Validated game settings.
 */
export function loadSettings(): GameSettings {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem('memory-settings') || 'null');
    if (typeof parsed !== 'object' || parsed === null) return defaultSettings();
    return readStoredSettings(parsed as Partial<GameSettings>);
  } catch { return defaultSettings(); }
}


/**
 * Validates and normalizes settings loaded from storage.
 * @param data - Stored game selections that may contain invalid values.
 * @returns Normalized settings for a new game.
 */
function readStoredSettings(data: Partial<GameSettings>): GameSettings {
  const settings = defaultSettings();
  const board = Number(data.board);
  if (data.theme === 'da-projects') settings.theme = 'da-projects';
  if (data.player === 'orange') settings.player = 'orange';
  if (validBoards.includes(board)) settings.board = String(board);
  if (data.mode === '2P') settings.mode = '2P';
  settings.playerOneName = cleanName(data.playerOneName, 'Player 1');
  settings.playerTwoName = cleanName(data.playerTwoName, 'Player 2');
  return settings;
}


/**
 * Creates the default selection for a playable game.
 * @returns Default game settings.
 */
function defaultSettings(): GameSettings {
  return { theme: 'code-vibes', player: 'blue', board: '16', mode: '1P', playerOneName: 'Player 1', playerTwoName: 'Player 2' };
}


/**
 * Sanitizes a stored player name and provides a fallback.
 * @param value - Stored value that may not be a string.
 * @param fallback - Default name if the stored name is missing or blank.
 * @returns Validated player name.
 */
function cleanName(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const name = value.trim().slice(0, 10);
  if (!name) return fallback;
  return name;
}


/**
 * Randomizes the order of an array in place.
 * @param items - Array to shuffle using the Fisher-Yates algorithm.
 * @returns The same array with its elements shuffled.
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
 * Creates shuffled pairs of randomly selected card motifs.
 * @param size - Total card count, either 16, 24, or 36.
 * @returns Shuffled cards with their initial hidden state.
 */
export function createCards(size: number): Card[] {
  const choices = shuffle(Array.from({ length: 18 }, createMotifNumber)).slice(0, size / 2);
  const pairs = shuffle([...choices, ...choices]);
  return pairs.map(createCard);
}


/**
 * Generates consecutive motif numbers for a new deck.
 * @param unused - Unused array placeholder supplied by Array.from.
 * @param index - Zero-based motif index.
 * @returns Motif number starting at one.
 */
function createMotifNumber(unused: unknown, index: number): number {
  return index + 1;
}


/**
 * Builds a new hidden memory card for a selected motif.
 * @param motif - Symbol number displayed on the card front.
 * @param id - Unique position of this card in the board.
 * @returns A new hidden, unmatched card.
 */
function createCard(motif: number, id: number): Card {
  return { id, motif, matched: false, faceUp: false };
}


/**
 * Creates a new game with a random starting player.
 * @param settings - Validated game preferences.
 * @param runId - Identifier distinguishing this round from previous rounds.
 * @returns Initialized game state.
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
 * Finds the opposite player color.
 * @param player - Color of the currently selected player.
 * @returns Color of the other player.
 */
export function otherPlayer(player: Player): Player {
  if (player === 'blue') return 'orange';
  return 'blue';
}


/**
 * Checks whether the remaining pairs can still change the result.
 * @param state - Current cards and player scores.
 * @returns Whether the round has reached a final result.
 */
export function hasWinner(state: GameState): boolean {
  let remaining = 0;
  for (const card of state.cards) if (!card.matched) remaining++;
  remaining /= 2;
  return Math.abs(state.scores.blue - state.scores.orange) > remaining || remaining === 0;
}


/**
 * Searches the computer's limited memory for two matching cards.
 * @param state - Game state containing revealed card positions.
 * @returns Two known matching card indices, or an empty array.
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
 * Looks for a remembered partner of the currently revealed card.
 * @param state - Game state with the open card and remembered positions.
 * @returns Matching card index, or undefined when none is known.
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
 * Chooses a facedown card, preferring positions not yet remembered.
 * @param state - Game state containing the cards and computer memory.
 * @returns Available card index, or undefined when none remain.
 */
export function findUnknownCard(state: GameState): number | undefined {
  const candidates: Card[] = [];
  const unknown: Card[] = [];
  for (const card of state.cards) {
    if (card.matched || card.faceUp) continue;
    candidates.push(card);
    if (!state.seen.has(card.id)) unknown.push(card);
  }
  if (unknown.length > 0) return shuffle(unknown)[0]?.id;
  return shuffle(candidates)[0]?.id;
}


/**
 * Remembers a revealed card within the computer's memory limit.
 * @param state - Game state holding the limited memory.
 * @param id - Zero-based index of the revealed card.
 */
export function rememberCard(state: GameState, id: number): void {
  if (state.mode !== '1P') return;
  state.seen.delete(id);
  state.seen.set(id, state.cards[id].motif);
  if (state.seen.size > computerMemoryLimit) {
    const oldest = state.seen.keys().next().value;
    if (oldest !== undefined) state.seen.delete(oldest);
  }
}
