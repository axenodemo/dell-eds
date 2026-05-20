import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

export default function decorate(block) {
  const rows = [...block.children];

  const container = document.createElement('div');
  container.className = 'feature-card-inner';

  const content = document.createElement('div');
  content.className = 'feature-card-content';

  const imageWrapper = document.createElement('div');
  imageWrapper.className = 'feature-card-image';

  const buttonsWrapper = document.createElement('div');
  buttonsWrapper.className = 'feature-card-buttons';

  const iconsWrapper = document.createElement('div');
  iconsWrapper.className = 'feature-card-icons';

  let title = null;
  let description = null;
  const buttons = [];
  const iconsData = [];
  let image = null;

  // 1. First pass: Extract Image, Title (if heading), and Buttons
  const remainingRows = [];
  rows.forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell) return;

    if (cell.querySelector('picture')) {
      image = cell.querySelector('picture');
      return;
    }

    if (cell.querySelector('h1, h2, h3, h4, h5, h6')) {
      title = cell.querySelector('h1, h2, h3, h4, h5, h6');
      return;
    }

    const link = cell.querySelector('a');
    if (link && cell.textContent.trim() === link.textContent.trim()) {
      const isPrimary = cell.querySelector('strong');
      const isSecondary = cell.querySelector('em');
      
      const text = link.textContent.trim();
      const hasTextArrow = text.includes('→') || text.includes('->') || text.includes('>');
      const hasIconArrow = cell.querySelector('.icon') !== null;
      
      let type = 'link';
      
      if (hasTextArrow || hasIconArrow) {
        type = 'link';
      } else if (isPrimary) {
        type = 'primary';
      } else if (isSecondary) {
        type = 'secondary';
      } else {
        type = buttons.length === 0 ? 'primary' : 'secondary';
      }

      buttons.push({ link, type });
      return;
    }

    remainingRows.push(row);
  });

  // 2. Second pass: Separate icon rows and text rows for fallbacks
  const textRows = [];
  remainingRows.forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell.querySelector('.icon')) {
      textRows.push(row);
    }
  });

  // Fallback Title
  if (!title && textRows.length > 0) {
    const titleRow = textRows.shift();
    title = document.createElement('h3');
    title.textContent = titleRow.textContent.trim();
  }

  // Fallback Description
  if (!description && textRows.length > 0) {
    const descRow = textRows.shift();
    description = document.createElement('p');
    description.textContent = descRow.textContent.trim();
  }

  // 3. Third pass: Extract Icons and Sibling Labels
  remainingRows.forEach((row) => {
    const cell = row.firstElementChild;
    if (!cell || !cell.querySelector('.icon')) return;

    const iconSpan = cell.querySelector('.icon');
    let label = cell.textContent.trim();

    // Hybrid Check: If this cell has no text, look at the row immediately before it
    if (!label) {
      const originalIndex = rows.indexOf(row);
      if (originalIndex > 0) {
        const prevRow = rows[originalIndex - 1];
        const prevCell = prevRow ? prevRow.firstElementChild : null;
        if (prevCell && !prevCell.querySelector('picture, a, h1, h2, h3, h4, h5, h6, .icon')) {
          label = prevCell.textContent.trim();
        }
      }
    }

    iconsData.push({ iconSpan, label });
  });

  // Assemble Title
  if (title) {
    title.className = 'feature-card-title';
    title.id = 'card-title';
    content.append(title);
  }

  // Assemble Description
  if (description) {
    description.className = 'feature-card-description';
    content.append(description);
  }

  // Assemble Buttons and Links
  buttons.forEach(({ link, type }) => {
    if (type === 'primary') {
      link.className = 'feature-card-btn primary';
    } else if (type === 'secondary') {
      link.className = 'feature-card-btn secondary';
    } else {
      link.className = 'feature-card-link';
    }
    buttonsWrapper.append(link);
  });
  if (buttonsWrapper.children.length > 0) {
    content.append(buttonsWrapper);
  }

  // Assemble Icons
  iconsData.forEach(({ iconSpan, label }) => {
    const iconItem = document.createElement('div');
    iconItem.className = 'feature-card-icon-item';

    if (iconSpan) {
      iconItem.append(iconSpan);
    }

    const labelSpan = document.createElement('span');
    labelSpan.className = 'feature-card-icon-label';
    labelSpan.textContent = label;
    iconItem.append(labelSpan);

    iconsWrapper.append(iconItem);
  });
  if (iconsWrapper.children.length > 0) {
    content.append(iconsWrapper);
  }

  // Assemble Image
  if (image) {
    const img = image.querySelector('img');
    if (img) {
      const optimizedPic = createOptimizedPicture(img.src, img.alt || '', false, [{ width: '750' }]);
      imageWrapper.append(optimizedPic);
    }
  }

  container.append(imageWrapper, content);
  block.replaceChildren(container);

  // Trigger AEM icon decoration
  decorateIcons(block);
}


