export type Player = 'blue' | 'orange';
export type Card = { id: number; motif: number; matched: boolean; faceUp: boolean };
export type GameSettings = {
  theme: string;
  player: Player;
  board: string;
  mode: '1P' | '2P';
  playerOneName: string;
  playerTwoName: string;
};
export type GameState = {
  cards: Card[];
  current: Player;
  human: Player;
  mode: '1P' | '2P';
  names: Record<Player, string>;
  scores: Record<Player, number>;
  flipped: number[];
  locked: boolean;
  paused: boolean;
  finished: boolean;
  seen: Map<number, number>;
  runId: number;
};
