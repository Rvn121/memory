/** Registers responsive placement updates for the exit control. */
export function setupGameLayout(): void {
  const mobileLayout = window.matchMedia('(max-width: 622px)');
  mobileLayout.addEventListener('change', moveExitButton);
  moveExitButton();
}


/** Moves the exit control to the appropriate viewport layout. */
function moveExitButton(): void {
  const header = document.querySelector<HTMLElement>('.game__header');
  const container = document.querySelector<HTMLElement>('.game__container');
  const exitButton = document.querySelector<HTMLButtonElement>('#exit-trigger');
  const mobileLayout = window.matchMedia('(max-width: 622px)');
  if (!header || !container || !exitButton) return;
  if (mobileLayout.matches) {
    container.append(exitButton);
  } else {
    header.append(exitButton);
  }
}
