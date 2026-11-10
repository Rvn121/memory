import '../scss/main.scss';

type SettingName = 'theme' | 'player' | 'board';
type Selections = Record<SettingName, string>;
type PlayerMode = '1P' | '2P';

const form = document.querySelector<HTMLFormElement>('#settings-form');
const preview = document.querySelector<HTMLImageElement>('#theme-preview');
const startButton = document.querySelector<HTMLButtonElement>('#start-button');
const summary = document.querySelector<HTMLElement>('#selection-summary');
const modeInput = document.querySelector<HTMLInputElement>('#player-mode');
const colorOptions = document.querySelector<HTMLElement>('#player-colors');
const firstName = document.querySelector<HTMLInputElement>('#player-one-name');
const secondName = document.querySelector<HTMLInputElement>('#player-two-name');
const selectedSettings: Selections = { theme: '', player: '', board: '' };

/**
 * Displays the preview for the highlighted game theme.
 * @param theme - Identifier of the theme preview to display.
 */
function showPreview(theme: string): void {
  if (!preview) return;
  let filename = 'theme1_preview.png';
  preview.alt = 'Code vibes theme: dark game board with a turquoise card back and a Git symbol card';
  if (theme === 'theme2') {
    filename = 'theme2_preview.png';
    preview.alt = 'DA Projects theme: light blue game board with a teal card back and a shark card';
  }
  preview.src = `${import.meta.env.BASE_URL}img/${filename}`;
}


/**
 * Reads whether one or two human players are selected.
 * @returns Selected player mode.
 */
function getPlayerMode(): PlayerMode {
  if (modeInput?.checked) return '2P';
  return '1P';
}


/**
 * Reads and trims a player name to ten characters.
 * @param input - Player name field, or null if the element is missing.
 * @returns Trimmed player name.
 */
function getPlayerName(input: HTMLInputElement | null): string {
  return (input?.value || '').trim().slice(0, 10);
}


/**
 * Checks the required color or player names for the selected mode.
 * @returns Whether the player settings are valid.
 */
function hasValidPlayers(): boolean {
  if (getPlayerMode() === '1P') return Boolean(selectedSettings.player);
  return Boolean(firstName?.validity.valid && secondName?.validity.valid);
}


/**
 * Builds the summary text for the selected settings category.
 * @param name - Settings category to summarize.
 * @returns Visible summary label.
 */
function getSummaryText(name: SettingName): string {
  if (name === 'theme') return getThemeSummary();
  if (name === 'board') {
    if (selectedSettings.board) return `Board-${selectedSettings.board} Cards`;
    return 'Board size';
  }
  return getPlayerSummary();
}


/**
 * Determines the summary label for the selected visual theme.
 * @returns Theme label or default prompt.
 */
function getThemeSummary(): string {
  if (selectedSettings.theme === 'da-projects') return 'DA Projects theme';
  if (selectedSettings.theme) return 'Code vibes theme';
  return 'Game theme';
}


/**
 * Determines the summary label for the current player mode.
 * @returns Player label or default prompt.
 */
function getPlayerSummary(): string {
  if (getPlayerMode() === '2P') {
    if (hasValidPlayers()) return '2 Players';
    return 'Player';
  }
  if (selectedSettings.player === 'blue') return 'Blue Player';
  if (selectedSettings.player === 'orange') return 'Orange Player';
  return 'Player';
}


/**
 * Updates the settings summary and Start button availability.
 */
function updateSummary(): void {
  const keys: SettingName[] = ['theme', 'player', 'board'];
  keys.forEach(updateSummaryItem);
  const complete = Boolean(selectedSettings.theme && selectedSettings.board && hasValidPlayers() && form?.checkValidity());
  if (startButton) startButton.disabled = !complete;
  summary?.classList.toggle('selection-summary--complete', complete);
}


/**
 * Refreshes a single settings summary item.
 * @param name - Settings category whose label should be refreshed.
 */
function updateSummaryItem(name: SettingName): void {
  const label = document.querySelector<HTMLElement>(`#summary-${name}`);
  if (!label) return;
  let selected = Boolean(selectedSettings[name]);
  if (name === 'player') selected = hasValidPlayers();
  const value = label.querySelector<HTMLElement>('.selection-summary__value');
  if (value) value.textContent = getSummaryText(name);
  label.classList.toggle('selection-summary__item--selected', selected);
}


/**
 * Switches player controls between color choice and name entry.
 */
function updatePlayerMode(): void {
  const twoPlayers = getPlayerMode() === '2P';
  colorOptions?.classList.toggle('player-options--two', twoPlayers);
  const inputs = colorOptions?.querySelectorAll<HTMLInputElement>('input[name="player"]') || [];
  for (const input of Array.from(inputs)) {
    input.type = 'radio';
    if (twoPlayers) input.type = 'checkbox';
    updatePlayerColor(input, twoPlayers);
  }
  updatePlayerNameFields(twoPlayers);
  updateSummary();
}


/**
 * Synchronizes a player color input with the selected mode.
 * @param input - Color input to configure.
 * @param twoPlayers - Whether the game uses two human players.
 */
function updatePlayerColor(input: HTMLInputElement, twoPlayers: boolean): void {
  input.checked = twoPlayers || selectedSettings.player === input.value;
  input.disabled = twoPlayers;
  input.required = !twoPlayers;
}


/**
 * Shows and validates custom names only in two-player mode.
 * @param twoPlayers - Whether editable names should be enabled.
 */
function updatePlayerNameFields(twoPlayers: boolean): void {
  for (const input of [firstName, secondName]) {
    if (!input) continue;
    input.hidden = !twoPlayers;
    input.disabled = !twoPlayers;
    input.required = twoPlayers;
  }
  for (const label of Array.from(document.querySelectorAll<HTMLElement>('.player-name-label'))) label.hidden = !twoPlayers;
}


/**
 * Stores a valid selection from the settings form.
 * @param event - Change event emitted by a settings input.
 */
function handleSelection(event: Event): void {
  const input = event.target;
  if (!(input instanceof HTMLInputElement) || !input.checked) return;
  if (!['theme', 'player', 'board'].includes(input.name)) return;
  if (input.name === 'player' && getPlayerMode() === '2P') return;
  selectedSettings[input.name as SettingName] = input.value;
  if (input.name === 'theme') restorePreview();
  updateSummary();
}


/**
 * Restores the preview of the currently selected theme.
 */
function restorePreview(): void {
  if (selectedSettings.theme === 'da-projects') {
    showPreview('theme2');
    return;
  }
  showPreview('theme1');
}


/**
 * Connects pointer and keyboard interactions to theme previews.
 */
function setupPreviews(): void {
  for (const option of Array.from(document.querySelectorAll<HTMLElement>('[data-preview]'))) {
    option.addEventListener('mouseenter', handlePreviewEvent);
    option.addEventListener('mouseleave', restorePreview);
    option.addEventListener('focusin', handlePreviewEvent);
    option.addEventListener('focusout', restorePreview);
    option.addEventListener('pointerdown', handlePreviewEvent);
  }
}


/**
 * Shows the preview selected by the event target.
 * @param event - Pointer or focus event from a theme option.
 */
function handlePreviewEvent(event: Event): void {
  const option = event.currentTarget;
  if (!(option instanceof HTMLElement)) return;
  showPreview(option.dataset.preview || 'theme1');
}


/**
 * Validates and saves the settings before opening the game page.
 */
function startGame(): void {
  if (startButton?.disabled || !form?.reportValidity()) return;
  const settings = { ...selectedSettings, mode: getPlayerMode(), playerOneName: getPlayerName(firstName), playerTwoName: getPlayerName(secondName) };
  sessionStorage.setItem('memory-settings', JSON.stringify(settings));
  window.location.href = `${import.meta.env.BASE_URL}game.html`;
}


/**
 * Prevents form navigation and opens the game after validation.
 * @param event - Submit event from the settings form.
 */
function handleSettingsSubmit(event: SubmitEvent): void {
  event.preventDefault();
  startGame();
}


/**
 * Registers settings controls and initializes the current view.
 */
function initSettings(): void {
  form?.addEventListener('change', handleSelection);
  form?.addEventListener('input', updateSummary);
  modeInput?.addEventListener('change', updatePlayerMode);
  form?.addEventListener('submit', handleSettingsSubmit);
  setupPreviews();
  updatePlayerMode();
}

initSettings();
