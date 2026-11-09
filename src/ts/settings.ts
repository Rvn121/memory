import '../scss/main.scss';

type SettingName = 'theme' | 'player' | 'board';
type Selections = Record<SettingName, string>;
type PlayerMode = '1P' | '2P';

const FORM = document.querySelector<HTMLFormElement>('#settings-form');
const PREVIEW = document.querySelector<HTMLImageElement>('#theme-preview');
const START_BUTTON = document.querySelector<HTMLButtonElement>('#start-button');
const SUMMARY = document.querySelector<HTMLElement>('#selection-summary');
const MODE_INPUT = document.querySelector<HTMLInputElement>('#player-mode');
const COLOR_OPTIONS = document.querySelector<HTMLElement>('#player-colors');
const FIRST_NAME = document.querySelector<HTMLInputElement>('#player-one-name');
const SECOND_NAME = document.querySelector<HTMLInputElement>('#player-two-name');
const SETTINGS: Selections = { theme: '', player: '', board: '' };

/**
 * Displays the corresponding preview while hovering over a theme option.
 */
function showPreview(theme: string): void {
  if (!PREVIEW) return;
  let filename = 'theme1_preview.png';
  PREVIEW.alt = 'Code vibes theme: dark game board with a turquoise card back and a Git symbol card';
  if (theme === 'theme2') {
    filename = 'theme2_preview.png';
    PREVIEW.alt = 'DA Projects theme: light blue game board with a teal card back and a shark card';
  }
  PREVIEW.src = `${import.meta.env.BASE_URL}img/${filename}`;
}


/**
 * Returns the currently selected number of human players.
 */
function getPlayerMode(): PlayerMode {
  if (MODE_INPUT?.checked) return '2P';
  return '1P';
}


/**
 * Returns a name truncated to ten characters, without surrounding whitespace.
 */
function getPlayerName(input: HTMLInputElement | null): string {
  return (input?.value || '').trim().slice(0, 10);
}


/**
 * Validates both custom names when local multiplayer is selected.
 */
function hasValidPlayers(): boolean {
  if (getPlayerMode() === '1P') return Boolean(SETTINGS.player);
  return Boolean(FIRST_NAME?.validity.valid && SECOND_NAME?.validity.valid);
}


/**
 * Returns a human-readable selected value for the summary.
 */
function getSummaryText(name: SettingName): string {
  if (name === 'theme') return getThemeSummary();
  if (name === 'board') {
    if (SETTINGS.board) return `Board-${SETTINGS.board} Cards`;
    return 'Board size';
  }
  return getPlayerSummary();
}


/** Returns the selected theme label or the initial prompt. */
function getThemeSummary(): string {
  if (SETTINGS.theme === 'da-projects') return 'DA Projects theme';
  if (SETTINGS.theme) return 'Code vibes theme';
  return 'Game theme';
}


/** Describes the chosen player color or multiplayer mode. */
function getPlayerSummary(): string {
  if (getPlayerMode() === '2P') {
    if (hasValidPlayers()) return '2 Players';
    return 'Player';
  }
  if (SETTINGS.player === 'blue') return 'Blue Player';
  if (SETTINGS.player === 'orange') return 'Orange Player';
  return 'Player';
}


/**
 * Updates labels and start availability whenever the settings change.
 */
function updateSummary(): void {
  const keys: SettingName[] = ['theme', 'player', 'board'];
  keys.forEach(updateSummaryItem);
  const complete = Boolean(SETTINGS.theme && SETTINGS.board && hasValidPlayers() && FORM?.checkValidity());
  if (START_BUTTON) START_BUTTON.disabled = !complete;
  SUMMARY?.classList.toggle('selection-summary--complete', complete);
}


/** Updates one summary value without replacing its reserved layout. */
function updateSummaryItem(name: SettingName): void {
  const label = document.querySelector<HTMLElement>(`#summary-${name}`);
  if (!label) return;
  let selected = Boolean(SETTINGS[name]);
  if (name === 'player') selected = hasValidPlayers();
  const value = label.querySelector<HTMLElement>('.selection-summary__value');
  if (value) value.textContent = getSummaryText(name);
  label.classList.toggle('selection-summary__item--selected', selected);
}


/**
 * Enables either player colors or editable player names.
 */
function updatePlayerMode(): void {
  const twoPlayers = getPlayerMode() === '2P';
  COLOR_OPTIONS?.classList.toggle('player-options--two', twoPlayers);
  const inputs = COLOR_OPTIONS?.querySelectorAll<HTMLInputElement>('input[name="player"]') || [];
  inputs.forEach(/** Selects radio or checkbox behavior for the player mode. */ (input) => {
    input.type = 'radio';
    if (twoPlayers) input.type = 'checkbox';
  });
  inputs.forEach(/** Applies the current mode to one color control. */ (input) => updatePlayerColor(input, twoPlayers));
  updatePlayerNameFields(twoPlayers);
  updateSummary();
}


/** Keeps color controls consistent with the selected player mode. */
function updatePlayerColor(input: HTMLInputElement, twoPlayers: boolean): void {
  input.checked = twoPlayers || SETTINGS.player === input.value;
  input.disabled = twoPlayers;
  input.required = !twoPlayers;
}


/**
 * Uses native name validation only for two human players.
 */
function updatePlayerNameFields(twoPlayers: boolean): void {
  [FIRST_NAME, SECOND_NAME].forEach(/** Enables name entry only for two human players. */ (input) => {
    if (!input) return;
    input.hidden = !twoPlayers;
    input.disabled = !twoPlayers;
    input.required = twoPlayers;
  });
  document.querySelectorAll<HTMLElement>('.player-name-label').forEach(/** Shows name labels only in multiplayer mode. */ (label) => {
    label.hidden = !twoPlayers;
  });
}


/**
 * Reads a radio input and stores its newly selected value.
 */
function handleSelection(event: Event): void {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.checked) return;
  if (!['theme', 'player', 'board'].includes(input.name)) return;
  if (input.name === 'player' && getPlayerMode() === '2P') return;
  SETTINGS[input.name as SettingName] = input.value;
  if (input.name === 'theme') restorePreview();
  updateSummary();
}


/**
 * Restores the preview to the selected theme after pointer or keyboard focus leaves.
 */
function restorePreview(): void {
  if (SETTINGS.theme === 'da-projects') {
    showPreview('theme2');
    return;
  }
  showPreview('theme1');
}


/**
 * Connects the preview changes to the theme labels.
 */
function setupPreviews(): void {
  document.querySelectorAll<HTMLElement>('[data-preview]').forEach(/** Connects preview interactions for one theme option. */ (option) => {
    const previewName = option.dataset.preview || 'theme1';
    option.addEventListener('mouseenter', /** Shows the preview associated with this theme option. */ () => showPreview(previewName));
    option.addEventListener('mouseleave', restorePreview);
    option.addEventListener('focusin', /** Shows the preview associated with this theme option. */ () => showPreview(previewName));
    option.addEventListener('focusout', restorePreview);
    option.addEventListener('pointerdown', /** Shows the preview associated with this theme option. */ () => showPreview(previewName));
  });
}


/**
 * Saves the mode, player colors or names, and opens the game.
 */
function startGame(): void {
  if (START_BUTTON?.disabled || !FORM?.reportValidity()) return;
  const settings = { ...SETTINGS, mode: getPlayerMode(), playerOneName: getPlayerName(FIRST_NAME), playerTwoName: getPlayerName(SECOND_NAME) };
  sessionStorage.setItem('memory-settings', JSON.stringify(settings));
  window.location.href = `${import.meta.env.BASE_URL}game.html`;
}


/**
 * Connects all settings controls with the summary and game navigation.
 */
function initSettings(): void {
  FORM?.addEventListener('change', handleSelection);
  FORM?.addEventListener('input', updateSummary);
  MODE_INPUT?.addEventListener('change', updatePlayerMode);
  FORM?.addEventListener('submit', /** Starts the game without submitting the page. */ (event: SubmitEvent) => {
    event.preventDefault();
    startGame();
  });
  setupPreviews();
  updatePlayerMode();
}

initSettings();
