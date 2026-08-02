import { getMetadata } from '../../scripts/aem.js';
import { pushDataLayerEvent } from '../../scripts/datalayer.js';

/*
 * Public client-side configuration. Both values are safe to expose.
 * They can be overridden per-page via metadata: `form-endpoint`, `recaptcha-site-key`.
 */
/* POC project (ap-southeast-2) — swap for the Mumbai (ap-south-1) project ref before launch */
const SUPABASE_FUNCTION_URL = 'https://aobzlfhzdonzlwkppyau.supabase.co/functions/v1/submit-lead';
const RECAPTCHA_SITE_KEY = 'RECAPTCHA_V3_SITE_KEY';

const SUBMIT_COOLDOWN_MS = 60000;
const COOLDOWN_STORAGE_KEY = 'jsw-lead-submitted-at';

const DEFAULTS = {
  headline: 'Be the first to know',
  nameLabel: 'Full name',
  mobileLabel: 'Mobile number',
  emailLabel: 'Email (optional)',
  consent: 'I consent to being contacted about the upcoming launch.',
  submitLabel: 'Notify me',
  success: 'Thank you. You’re on the list.',
  error: 'Something went wrong and your details were not saved. Please try again.',
  nameError: 'Please enter your full name.',
  mobileError: 'Please enter a valid 10-digit mobile number.',
  emailError: 'Please enter a valid email address, or leave it empty.',
  consentError: 'Please accept the consent statement to continue.',
  cooldownError: 'You just submitted — please wait a minute before trying again.',
};

/**
 * Reads block rows as a key/value config, preserving HTML values.
 * @param {Element} block
 * @returns {Object<string, {text: string, html: string}>}
 */
function readConfig(block) {
  const config = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length === 2) {
      const key = cells[0].textContent.trim().toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
      config[key] = {
        text: cells[1].textContent.trim(),
        html: cells[1].innerHTML.trim(),
      };
    }
  });
  return config;
}

function getConfigValue(config, key, html = false) {
  const entry = config[key];
  if (entry && entry.text) return html ? entry.html : entry.text;
  return DEFAULTS[key];
}

function getUrlParam(...names) {
  const params = new URLSearchParams(window.location.search);
  const name = names.find((n) => params.get(n));
  return name ? params.get(name).slice(0, 128) : '';
}

/** Normalizes an Indian mobile number: strips spaces/dashes and +91/0 prefixes. */
function normalizeMobile(value) {
  return value.replace(/[\s-]/g, '').replace(/^(\+91|0091|0)/, '');
}

function isValidMobile(value) {
  return /^[6-9]\d{9}$/.test(normalizeMobile(value));
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

let recaptchaPromise = null;

/** Lazily loads reCAPTCHA v3 (deferred until first interaction to protect LCP). */
function loadRecaptcha(siteKey) {
  if (!siteKey || siteKey.startsWith('RECAPTCHA_')) return Promise.resolve(null);
  if (!recaptchaPromise) {
    recaptchaPromise = new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.onload = () => window.grecaptcha.ready(() => resolve(window.grecaptcha));
      script.onerror = () => resolve(null);
      document.head.append(script);
    });
  }
  return recaptchaPromise;
}

async function getCaptchaToken(siteKey) {
  const grecaptcha = await loadRecaptcha(siteKey);
  if (!grecaptcha) return null;
  try {
    return await grecaptcha.execute(siteKey, { action: 'lead_submit' });
  } catch (e) {
    return null;
  }
}

function createField({
  name, label, type = 'text', required = false, autocomplete, inputmode, maxlength,
}) {
  const wrapper = document.createElement('div');
  wrapper.className = 'form-field';

  const labelEl = document.createElement('label');
  labelEl.setAttribute('for', `form-${name}`);
  labelEl.textContent = label;
  if (required) {
    const marker = document.createElement('span');
    marker.className = 'form-required';
    marker.setAttribute('aria-hidden', 'true');
    marker.textContent = ' *';
    labelEl.append(marker);
  }

  const input = document.createElement('input');
  input.type = type;
  input.id = `form-${name}`;
  input.name = name;
  if (required) input.required = true;
  if (autocomplete) input.autocomplete = autocomplete;
  if (inputmode) input.inputMode = inputmode;
  if (maxlength) input.maxLength = maxlength;
  input.setAttribute('aria-describedby', `form-${name}-error`);

  const error = document.createElement('p');
  error.className = 'form-error';
  error.id = `form-${name}-error`;

  wrapper.append(labelEl, input, error);
  return wrapper;
}

function setFieldError(form, name, message) {
  const input = form.querySelector(`[name="${name}"]`);
  const error = form.querySelector(`#form-${name}-error`);
  if (!input || !error) return;
  error.textContent = message || '';
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  input.closest('.form-field').classList.toggle('form-field-invalid', !!message);
}

function validate(form, config) {
  const errors = [];
  const name = form.elements.full_name.value.trim();
  if (name.length < 2) errors.push(['full_name', getConfigValue(config, 'nameError')]);
  else errors.push(['full_name', '']);

  const mobile = form.elements.mobile.value.trim();
  if (!isValidMobile(mobile)) errors.push(['mobile', getConfigValue(config, 'mobileError')]);
  else errors.push(['mobile', '']);

  const email = form.elements.email.value.trim();
  if (email && !isValidEmail(email)) errors.push(['email', getConfigValue(config, 'emailError')]);
  else errors.push(['email', '']);

  if (!form.elements.consent.checked) errors.push(['consent', getConfigValue(config, 'consentError')]);
  else errors.push(['consent', '']);

  errors.forEach(([field, message]) => setFieldError(form, field, message));
  const firstInvalid = errors.find(([, message]) => message);
  if (firstInvalid) {
    form.querySelector(`[name="${firstInvalid[0]}"]`).focus();
    return false;
  }
  return true;
}

function isInCooldown() {
  try {
    const last = parseInt(window.localStorage.getItem(COOLDOWN_STORAGE_KEY), 10);
    return last && Date.now() - last < SUBMIT_COOLDOWN_MS;
  } catch (e) {
    return false;
  }
}

function markSubmitted() {
  try {
    window.localStorage.setItem(COOLDOWN_STORAGE_KEY, String(Date.now()));
  } catch (e) {
    // storage unavailable, cooldown enforced server-side anyway
  }
}

function showStatus(block, message, isError, html) {
  const status = block.querySelector('.form-status');
  if (html) status.innerHTML = message;
  else status.textContent = message;
  status.classList.toggle('form-status-error', isError);
}

async function submit(block, form, config) {
  if (isInCooldown()) {
    showStatus(block, getConfigValue(config, 'cooldownError'), true);
    return;
  }
  if (!validate(form, config)) return;

  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  form.classList.add('form-submitting');
  showStatus(block, '', false);

  const siteKey = getMetadata('recaptcha-site-key') || RECAPTCHA_SITE_KEY;
  const endpoint = getMetadata('form-endpoint') || SUPABASE_FUNCTION_URL;
  const captchaToken = await getCaptchaToken(siteKey);

  const payload = {
    full_name: form.elements.full_name.value.trim(),
    mobile: normalizeMobile(form.elements.mobile.value.trim()),
    email: form.elements.email.value.trim() || null,
    consent: form.elements.consent.checked,
    campaign_id: form.elements.campaign_id.value || null,
    utm_source: form.elements.utm_source.value || null,
    utm_medium: form.elements.utm_medium.value || null,
    page: window.location.pathname,
    captcha_token: captchaToken,
  };

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.error) throw new Error(result.error || `HTTP ${response.status}`);

    markSubmitted();
    pushDataLayerEvent('form_complete', { form: 'jsw-lead', consentGranted: true });
    const success = document.createElement('div');
    success.className = 'form-success';
    success.setAttribute('role', 'status');
    success.innerHTML = getConfigValue(config, 'success', true);
    form.replaceWith(success);
  } catch (e) {
    pushDataLayerEvent('form_error', { form: 'jsw-lead' });
    showStatus(block, getConfigValue(config, 'error', true), true, true);
    button.disabled = false;
  } finally {
    form.classList.remove('form-submitting');
  }
}

/**
 * Decorates the lead-capture form block.
 * @param {Element} block The block element
 */
export default async function decorate(block) {
  const config = readConfig(block);
  block.textContent = '';

  const headline = document.createElement('div');
  headline.className = 'form-headline';
  headline.innerHTML = getConfigValue(config, 'headline', true);

  const form = document.createElement('form');
  form.noValidate = true;

  form.append(
    createField({
      name: 'full_name', label: getConfigValue(config, 'nameLabel'), required: true, autocomplete: 'name',
    }),
    createField({
      name: 'mobile', label: getConfigValue(config, 'mobileLabel'), type: 'tel', required: true, autocomplete: 'tel', inputmode: 'numeric', maxlength: 13,
    }),
    createField({
      name: 'email', label: getConfigValue(config, 'emailLabel'), type: 'email', autocomplete: 'email',
    }),
  );

  const consentField = document.createElement('div');
  consentField.className = 'form-field form-consent';
  const consentInput = document.createElement('input');
  consentInput.type = 'checkbox';
  consentInput.id = 'form-consent';
  consentInput.name = 'consent';
  consentInput.required = true;
  consentInput.setAttribute('aria-describedby', 'form-consent-error');
  const consentLabel = document.createElement('label');
  consentLabel.setAttribute('for', 'form-consent');
  consentLabel.innerHTML = getConfigValue(config, 'consent', true);
  const consentError = document.createElement('p');
  consentError.className = 'form-error';
  consentError.id = 'form-consent-error';
  consentField.append(consentInput, consentLabel, consentError);
  form.append(consentField);

  // hidden campaign attribution captured from the URL (?cid / utm params from bio links)
  [
    ['campaign_id', getUrlParam('cid', 'campaign_id', 'utm_campaign')],
    ['utm_source', getUrlParam('utm_source')],
    ['utm_medium', getUrlParam('utm_medium')],
  ].forEach(([name, value]) => {
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = name;
    hidden.value = value;
    form.append(hidden);
  });

  const button = document.createElement('button');
  button.type = 'submit';
  button.textContent = getConfigValue(config, 'submitLabel');
  const actions = document.createElement('div');
  actions.className = 'form-actions';
  actions.append(button);
  form.append(actions);

  const status = document.createElement('p');
  status.className = 'form-status';
  status.setAttribute('role', 'alert');
  status.setAttribute('aria-live', 'assertive');

  form.addEventListener('focusin', () => {
    pushDataLayerEvent('form_start', { form: 'jsw-lead' });
    // pre-warm the captcha script once the user shows intent
    loadRecaptcha(getMetadata('recaptcha-site-key') || RECAPTCHA_SITE_KEY);
  }, { once: true });

  consentInput.addEventListener('change', () => {
    pushDataLayerEvent('consent_state', { form: 'jsw-lead', consentGranted: consentInput.checked });
    if (consentInput.checked) setFieldError(form, 'consent', '');
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(block, form, config);
  });

  block.append(headline, form, status);
}
