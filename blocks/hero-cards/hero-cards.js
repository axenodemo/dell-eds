export default function decorate(block) {
  block.classList.add('hero-cards-category-grid');

  const rows = [...block.querySelectorAll(':scope > div')];

  const grid = document.createElement('div');
  grid.classList.add('hero-cards-category-grid__grid');

  rows.forEach((row) => {
    const cols = [...row.querySelectorAll(':scope > div')];

    cols.forEach((col) => {
      const card = document.createElement('a');
      card.classList.add('hero-cards-category-grid__card');

      const picture = col.querySelector('picture, img');
      const link = col.querySelector('a');
      if (link) card.href = link.href;

      let labelText = '';
      const allEls = [...col.querySelectorAll('p, h1, h2, h3, h4, h5, h6')];
      for (const el of allEls) {
        // Check for text inside <a> tags too
        const anchor = el.querySelector('a');
        if (anchor && anchor.textContent.trim()) {
          labelText = anchor.textContent.trim();
          break;
        }

        const text = [...el.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE)
          .map((n) => n.textContent.trim())
          .filter(Boolean)
          .join('');
        if (text) {
          labelText = text;
          break;
        }
      }
      if (!labelText) {
        labelText = [...col.childNodes]
          .filter((n) => n.nodeType === Node.TEXT_NODE && n.textContent.trim())
          .map((n) => n.textContent.trim())
          .join('');
      }

      const label = document.createElement('span');
      label.classList.add('hero-cards-category-grid__label');
      label.textContent = labelText;

      const imgWrap = document.createElement('div');
      imgWrap.classList.add('hero-cards-category-grid__img-wrap');
      if (picture) {
        imgWrap.append(picture.cloneNode(true));
      }

      card.append(label, imgWrap);
      grid.append(card);
    });
  });

  block.textContent = '';
  block.append(grid);
}