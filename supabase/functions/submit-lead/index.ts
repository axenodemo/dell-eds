// JSW Motors teaser — lead submission Edge Function.
// Verifies reCAPTCHA v3 server-side, applies per-IP rate limiting, and inserts
// the lead using the service role key (which never leaves this function).
//
// Required secrets (supabase secrets set KEY=value):
//   RECAPTCHA_SECRET  - reCAPTCHA v3 secret key (skipped in local dev if unset)
//   RATE_SALT         - random string used to hash client IPs
//   ALLOWED_ORIGINS   - comma-separated list of allowed page origins
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from 'npm:@supabase/supabase-js@2';

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // submissions per IP per window
const CAPTCHA_MIN_SCORE = 0.5;

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',').map((o) => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && (allowedOrigins.length === 0 || allowedOrigins.includes(origin));
  return {
    'access-control-allow-origin': allowed ? origin : (allowedOrigins[0] ?? '*'),
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'content-type': 'application/json',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), { status, headers });
}

async function sha256(value: string): Promise<string> {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function verifyCaptcha(token: string | null): Promise<boolean> {
  const secret = Deno.env.get('RECAPTCHA_SECRET');
  if (!secret) {
    console.warn('RECAPTCHA_SECRET not set — skipping CAPTCHA verification (dev mode only)');
    return true;
  }
  if (!token) return false;
  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ secret, response: token }),
  });
  const result = await res.json();
  return result.success === true
    && (result.score ?? 0) >= CAPTCHA_MIN_SCORE
    && (result.action === undefined || result.action === 'lead_submit');
}

Deno.serve(async (req) => {
  const headers = corsHeaders(req.headers.get('origin'));
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return json({ error: 'method not allowed' }, 405, headers);

  let payload;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'invalid JSON' }, 400, headers);
  }

  // server-side validation (mirror of client rules — never trust the client)
  const fullName = String(payload.full_name ?? '').trim().slice(0, 200);
  const mobile = String(payload.mobile ?? '').trim();
  const email = payload.email ? String(payload.email).trim().slice(0, 320) : null;
  const consent = payload.consent === true;

  if (fullName.length < 2) return json({ error: 'invalid name' }, 422, headers);
  if (!/^[6-9]\d{9}$/.test(mobile)) return json({ error: 'invalid mobile' }, 422, headers);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return json({ error: 'invalid email' }, 422, headers);
  if (!consent) return json({ error: 'consent required' }, 422, headers);

  if (!(await verifyCaptcha(payload.captcha_token ?? null))) {
    return json({ error: 'captcha verification failed' }, 403, headers);
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // per-IP rate limiting (hashed IP only, never stored raw)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
  const ipHash = await sha256(`${Deno.env.get('RATE_SALT') ?? ''}:${ip}`);
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();

  const { count } = await supabase
    .from('rate_events')
    .select('*', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', windowStart);

  if ((count ?? 0) >= RATE_LIMIT_MAX) {
    return json({ error: 'too many requests' }, 429, headers);
  }
  await supabase.from('rate_events').insert({ ip_hash: ipHash });

  // idempotency: same mobile already registered — succeed without duplicating
  const { count: existing } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('mobile', mobile);

  if ((existing ?? 0) > 0) {
    return json({ ok: true, duplicate: true }, 200, headers);
  }

  const { error } = await supabase.from('leads').insert({
    full_name: fullName,
    mobile,
    email,
    consent,
    campaign_id: payload.campaign_id ?? null,
    utm_source: payload.utm_source ?? null,
    utm_medium: payload.utm_medium ?? null,
    user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
    page: payload.page ?? null,
  });

  if (error) {
    console.error('lead insert failed', error);
    return json({ error: 'storage error' }, 500, headers);
  }

  return json({ ok: true }, 200, headers);
});
