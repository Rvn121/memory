/** Identifies a player by the color used throughout the game. */
export type Player = 'blue' | 'orange';

/** Describes one card, its matching symbol and its current state. */
export type Card = {
  /** Unique board position, starting at zero. */
  id: number;
  /** Symbol number shared by the two cards of a matching pair. */
  motif: number;
  /** Whether this card belongs to a pair that has already been found. */
  matched: boolean;
  /** Whether this card has been turned face up. */
  faceUp: boolean;
};

/** Contains the selections saved on the settings page before a game starts. */
export type GameSettings = {
  /** Selected visual theme: code-vibes or da-projects. */
  theme: string;
  /** Color controlled by the human in single-player mode. */
  player: Player;
  /** Total number of cards, stored as text: 16, 24 or 36. */
  board: string;
  /** One human against the computer, or two humans on the same device. */
  mode: '1P' | '2P';
  /** Custom name for the blue player in two-player mode. */
  playerOneName: string;
  /** Custom name for the orange player in two-player mode. */
  playerTwoName: string;
};

/** Holds the changing data needed to play and display the current game. */
export type GameState = {
  /** All cards in their shuffled board order. */
  cards: Card[];
  /** Color of the player whose turn is active. */
  current: Player;
  /** Human player's color; used to identify computer turns in single-player mode. */
  human: Player;
  /** Determines whether the game includes a computer opponent. */
  mode: '1P' | '2P';
  /** Display names indexed by player color. */
  names: Record<Player, string>;
  /** Number of matching pairs found by each player. */
  scores: Record<Player, number>;
  /** IDs of cards revealed during the current attempt. */
  flipped: number[];
  /** Blocks further flips while the current pair is being evaluated. */
  locked: boolean;
  /** Suspends play during the starting announcement or quit confirmation. */
  paused: boolean;
  /** Whether a final result has been reached. */
  finished: boolean;
  /** Limited computer memory mapping previously seen card IDs to symbol numbers. */
  seen: Map<number, number>;
  /** Identifies this game so delayed actions from older games can be ignored. */
  runId: number;
};
