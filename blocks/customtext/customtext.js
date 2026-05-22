import { extractBlockConfig } from '../../scripts/utils.js';

export default function decorate(block) {
  const config = extractBlockConfig(block);
  const rows = [...block.children];

  rows.forEach((row) => {
    row.classList.add('customtext-content');

    // Apply all configuration keys as CSS variables
    Object.keys(config).forEach((key) => {
      let value = config[key];
      // Auto-append 'px' to sizes if they are just numbers
      if ((key === 'font-size' || key === 'line-height') && !Number.isNaN(Number(value)) && value !== '') {
        if (key === 'font-size') value = `${value}px`;
      }
      row.style.setProperty(`--customtext-${key}`, value);
    });
  });
}
