import type { GameState, GameSettings } from './types';

/**
 * Keeps the visible turn icon and its accessible name in sync with play.
 * @param state - Current round and active player.
 * @param theme - Selected visual theme.
 */
export function renderCurrentPlayer(state: GameState, theme: GameSettings['theme']): void {
  const announcement = document.querySelector<HTMLElement>('#turn-announcement')!;
  const icon = document.querySelector<HTMLImageElement>('#current-player-icon')!;
  const computer = state.mode === '1P' && state.current !== state.human;
  let filename = 'playericon.svg';
  if (theme === 'da-projects') filename = 'chess_pawn_background.svg';
  if (theme === 'da-projects' && state.current === 'orange') filename = 'chess_pawn_background_orange.svg';
  announcement.hidden = state.finished;
  announcement.dataset.player = state.current;
  icon.src = `${import.meta.env.BASE_URL}icons/${filename}`;
  icon.alt = state.names[state.current];
  if (computer) icon.alt = 'Computer';
}
