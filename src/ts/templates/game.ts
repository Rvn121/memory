import cardTemplate from '../../templates/game/card.html?raw';
import confettiTemplate from '../../templates/game/confetti.html?raw';
import type { Card } from '../game/types';

/** Fills trusted HTML templates with internal asset paths and numeric values only. */
function fillTemplate(template: string, values: Record<string, string | number>): string {
  for (const [key, value] of Object.entries(values)) {
    template = template.replaceAll(`{{${key}}}`, String(value));
  }
  return template;
}


/** Builds both card faces from the dedicated card template. */
export function renderCard(card: Card, selectedTheme: string): string {
  let theme = 'theme1/t1';
  if (selectedTheme === 'da-projects') theme = 'theme2/t2';
  const root = import.meta.env.BASE_URL;
  const face = `${root}icons/${theme}-${card.motif}.svg`;
  return fillTemplate(cardTemplate, { id: card.id, number: card.id + 1, root, face });
}


/** Places one decorative confetti image at a randomized position. */
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
