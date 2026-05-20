/**
 * decorates the title-eyebrow block
 * @param {Element} block The title-eyebrow block element
 */
export default function decorate(block) {
  // Extract authored content
  const heading3 = block.querySelector('.title-eyebrow h3');
  const heading1 = block.querySelector('.title-eyebrow h1');

  // Clear existing content
  block.textContent = '';

  // Create the outer container structure matching reference
  const container = document.createElement('div');
  container.className = 'ts-container';

  const row = document.createElement('div');
  row.className = 'ts-row';

  // Authored H3 becomes the "eyebrow" in reference (H3)
  if (heading3) {
    const eyebrow = document.createElement('h3');
    eyebrow.className = 'ts-eyebrow';
    eyebrow.textContent = heading3.textContent;
    row.append(eyebrow);
  }

  // Authored H1 becomes the "Title" in reference (H2)
  if (heading1) {
    const title = document.createElement('h1');
    title.className = 'ts-title';
    title.textContent = heading1.textContent;
    row.append(title);
  }

  container.append(row);
  block.append(container);
}
