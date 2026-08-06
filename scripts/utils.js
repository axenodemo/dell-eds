/**
 * Extracts configuration from a block's row if it starts with 'block-config:'.
 * The config can be a JSON string or a CSS-style string (e.g. {font-size:32px; font-weight:200}).
 * @param {Element} block The block element
 * @returns {Object} The configuration object
 */
export function extractBlockConfig(block) {
  const rows = [...block.children];
  const lastRow = rows[rows.length - 1];
  if (!lastRow) return {};

  const text = lastRow.textContent.trim();
  if (text.startsWith('block-config:')) {
    let configStr = text.substring('block-config:'.length).trim();
    lastRow.remove(); // Remove the config row from rendering

    // Handle braces
    if (configStr.startsWith('{') && configStr.endsWith('}')) {
      configStr = configStr.substring(1, configStr.length - 1).trim();
    }

    // Try parsing as JSON first
    try {
      // If it was already a valid JSON object string inside the braces
      return JSON.parse(`{${configStr}}`);
    } catch (e) {
      // Fallback: parse as CSS-like syntax (key: value; key2: value2)
      const config = {};
      configStr.split(';').forEach((declaration) => {
        if (!declaration.trim()) return;
        const parts = declaration.split(':');
        const key = parts[0]?.trim();
        const value = parts.slice(1).join(':')?.trim();
        if (key && value) {
          config[key] = value;
        }
      });
      return config;
    }
  }
  return {};
}
