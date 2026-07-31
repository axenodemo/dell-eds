export default function decorate(block) {
  const rows = [...block.children];
  let renderedCount = 0;

  rows.forEach((row) => {
    const [pictureCell, contentCell, linkCell] = row.children;

    const picture = pictureCell?.querySelector('picture, img') || null;
    const titleText = contentCell?.querySelector('h1, h2, h3')?.textContent.trim() || '';
    const descText = contentCell?.querySelector('p')?.textContent.trim() || '';
    const href = linkCell?.querySelector('a')?.getAttribute('href') || '#';

    if (!picture && !titleText && !descText) return;

    const cardLink = document.createElement('a');
    cardLink.classList.add('testimonial-cards-inner');
    cardLink.href = href;

    if (picture) cardLink.appendChild(picture);

    const overlay = document.createElement('div');
    overlay.classList.add('testimonial-cards-overlay');

    const titleEl = document.createElement('span');
    titleEl.classList.add('testimonial-cards-title');
    titleEl.textContent = titleText;
    overlay.appendChild(titleEl);

    if (descText) {
      const descEl = document.createElement('span');
      descEl.classList.add('testimonial-cards-desc');
      descEl.textContent = descText;
      overlay.appendChild(descEl);
    }

    cardLink.appendChild(overlay);
    row.innerHTML = '';
    row.appendChild(cardLink);

    renderedCount += 1;
  });

  block.dataset.cards = renderedCount;
}