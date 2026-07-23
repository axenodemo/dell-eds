const ICONS = {
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.2" cy="6.8" r="1.4" fill="currentColor"/>',
  x: '<path d="M4 3.5l16 17M20 3.5l-16 17" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  twitter: '<path d="M4 3.5l16 17M20 3.5l-16 17" fill="none" stroke="currentColor" stroke-width="2.5"/>',
  linkedin: '<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" fill="currentColor"/><rect x="2" y="9" width="4" height="12" fill="currentColor"/><circle cx="4" cy="4" r="2" fill="currentColor"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor"/>',
  facebook: '<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" fill="none" stroke="currentColor" stroke-width="2"/>',
  default: '<path d="M10 14a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5M14 10a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5" fill="none" stroke="currentColor" stroke-width="2"/>',
};

/**
 * Decorates the social links block.
 * Expected content: one row per platform — [platform name, link].
 * @param {Element} block The block element
 */
export default function decorate(block) {
  const list = document.createElement('ul');
  list.className = 'social-list';

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const name = cells[0]?.textContent.trim();
    const link = row.querySelector('a');
    if (!name || !link) return;

    const iconPaths = ICONS[name.toLowerCase()] || ICONS.default;
    const item = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', `JSW Motors on ${name} (opens in a new tab)`);
    a.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true" focusable="false">${iconPaths}</svg><span>${name}</span>`;
    item.append(a);
    list.append(item);
  });

  block.textContent = '';
  block.append(list);
}
