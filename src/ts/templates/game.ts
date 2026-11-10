import cardTemplate from '../../templates/game/card.html?raw';
import confettiTemplate from '../../templates/game/confetti.html?raw';
import type { Card } from '../game/types';

/**
 * Replaces trusted placeholders in a prepared HTML template.
 * @param template - HTML template containing named placeholders.
 * @param values - Map of placeholder names to trusted replacement values.
 * @returns HTML with all provided placeholders replaced.
 */
function fillTemplate(template: string, values: Record<string, string | number>): string {
  for (const [key, value] of Object.entries(values)) {
    template = template.replaceAll(`{{${key}}}`, String(value));
  }
  return template;
}


/**
 * Creates the markup for both faces of a memory card.
 * @param card - Card data including its index and motif.
 * @param selectedTheme - Theme identifier used to select card artwork.
 * @returns HTML markup for the card.
 */
export function renderCard(card: Card, selectedTheme: string): string {
  let theme = 'theme1/t1';
  if (selectedTheme === 'da-projects') theme = 'theme2/t2';
  const root = import.meta.env.BASE_URL;
  const face = `${root}icons/${theme}-${card.motif}.svg`;
  return fillTemplate(cardTemplate, { id: card.id, number: card.id + 1, root, face });
}


/**
 * Creates a confetti image with a randomized position and angle.
 * @param index - Zero-based position of this confetti piece.
 * @param count - Total number of confetti pieces in the banner.
 * @returns Configured decorative image element.
 */
export function renderConfettiPiece(index: number, count: number): HTMLImageElement {
  const container = document.createElement('div');
  container.innerHTML = confettiTemplate;
  const image = container.querySelector('img')!;
  const variant = index % 8 + 1;
  const x = (index + Math.random() * 0.65) / count * 94;
  const y = Math.random() * 32;
  const rotation = Math.round(Math.random() * 110 - 55);
  image.src = import.meta.env.BASE_URL + 'img/confetti-' + variant + '.png';
  image.style.left = x + '%';
  image.style.top = y + '%';
  image.style.transform = 'rotate(' + rotation + 'deg)';
  return image;
}
