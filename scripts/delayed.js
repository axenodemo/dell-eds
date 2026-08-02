// add delayed functionality here
import { pushDataLayerEvent } from './datalayer.js';

/*
 * Adobe Data Collection (Launch) library for the JSW teaser property.
 * Paste the property embed code URL here (Data Collection > Environments > Install).
 * Left empty, no martech is loaded — the data layer still queues events.
 */
const LAUNCH_SCRIPT_URL = '';

function initAnalytics() {
  const params = new URLSearchParams(window.location.search);
  // anonymous behavioural data only — never push PII to the data layer
  pushDataLayerEvent('page_view', {
    page: window.location.pathname,
    campaignId: params.get('cid') || params.get('utm_campaign') || null,
    utmSource: params.get('utm_source') || null,
    utmMedium: params.get('utm_medium') || null,
  });

  if (LAUNCH_SCRIPT_URL) {
    const script = document.createElement('script');
    script.src = LAUNCH_SCRIPT_URL;
    script.async = true;
    document.head.append(script);
  }
}

initAnalytics();
