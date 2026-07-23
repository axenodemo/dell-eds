/**
 * Minimal Adobe Client Data Layer helper.
 * IMPORTANT: only anonymous, behavioural data may be pushed here — never PII
 * (no names, mobile numbers, or email addresses).
 */

/**
 * Pushes an event to the Adobe data layer.
 * @param {string} event event name
 * @param {Object} [data] anonymous event payload
 */
// eslint-disable-next-line import/prefer-default-export
export function pushDataLayerEvent(event, data = {}) {
  window.adobeDataLayer = window.adobeDataLayer || [];
  window.adobeDataLayer.push({ event, ...data });
}
