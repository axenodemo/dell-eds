# JSW Motors — Pre-launch Teaser Page

A single "coming soon" page on Edge Delivery Services: dark hero with the vehicle silhouette, DPDP-compliant interest form (→ Supabase, Mumbai), and social handles. All copy is authored in the DA doc — the brand team edits without a deploy.

## Architecture

```
DA doc (/jsw/coming-soon)          Copy, silhouette image, social links — brand-editable
  └─ blocks/form/                  Plain HTML form block (no AEM Forms entitlement needed)
       └─ POST JSON ──────────────► Supabase Edge Function `submit-lead` (ap-south-1, Mumbai)
                                      ├─ verifies reCAPTCHA v3 token (secret never client-side)
                                      ├─ per-IP rate limit (5/hour, hashed IPs)
                                      └─ INSERT into `leads` via service role
scripts/delayed.js                 Adobe Data Collection (Launch) — anonymous events only
```

## Editing content (brand team)

Edit the DA doc at `da.live` → `axenodemo/dell-eds` → `/jsw/coming-soon`, then Preview/Publish. No code deploy needed. Editable pieces:

| Where | What |
|---|---|
| Hero section | H1 announcement line, sub-line, silhouette image (drop a new image into the doc) |
| `Form` block | rows: `headline`, `name label`, `mobile label`, `email label`, `consent` (rich text incl. privacy link), `submit label`, `success`, `error` (optional: `name error`, `mobile error`, `email error`, `consent error`, `cooldown error`) |
| `Social Links` block | one row per handle: platform name + URL (Instagram, X, LinkedIn, YouTube, Facebook get icons) |

The hero section needs section-metadata `style: jsw-hero`. Ready-to-upload DA source HTML for both pages is in `docs/jsw-teaser/da/`. To push via the DA admin API (after `da-auth`):

```bash
curl -X POST "https://admin.da.live/source/axenodemo/dell-eds/jsw/coming-soon.html" \
  -H "Authorization: Bearer $DA_TOKEN" \
  -F "data=@docs/jsw-teaser/da/coming-soon.html;type=text/html"
```

The site's `/nav` and `/footer` docs should be replaced with minimal neutral versions before launch (currently boilerplate).

## Configuration (before launch)

| Value | Where |
|---|---|
| Supabase function URL | `SUPABASE_FUNCTION_URL` in `blocks/form/form.js`, or per-page metadata `form-endpoint` |
| reCAPTCHA v3 site key | `RECAPTCHA_SITE_KEY` in `blocks/form/form.js`, or metadata `recaptcha-site-key` |
| reCAPTCHA v3 secret | Supabase secret `RECAPTCHA_SECRET` (server-side only — never in this repo) |
| Adobe Launch embed URL | `LAUNCH_SCRIPT_URL` in `scripts/delayed.js` |

While the site key/secret are placeholders, CAPTCHA is skipped (dev mode) — set both before launch.

## Supabase setup (one-time)

```bash
supabase projects create jsw-teaser --region ap-south-1   # Mumbai, data residency
supabase link --project-ref <PROJECT_REF>
supabase db push                                           # applies supabase/migrations/
supabase secrets set RECAPTCHA_SECRET=<secret> RATE_SALT=<random> \
  ALLOWED_ORIGINS=https://<production-domain>
supabase functions deploy submit-lead
```

### Schema (`public.leads`)

`id (uuid) | created_at | full_name | mobile | email | consent (bool) | campaign_id | utm_source | utm_medium | user_agent | page`

Security model: RLS is enabled with **zero policies**, so the public anon key can neither read nor write. Only the Edge Function (service role) inserts. The service role key and CAPTCHA secret live in Supabase function secrets, never in the client or repo. Restrict Supabase dashboard access to the CRM team.

## Exporting leads

- **CSV (dashboard):** Table Editor → `leads` → Export as CSV.
- **CSV (CLI):** `psql "$SUPABASE_DB_URL" -c "\copy (select * from leads order by created_at) to 'leads.csv' csv header"`
- **SQL dump:** `supabase db dump --data-only -f leads.sql`

### Salesforce / Marketing Cloud migration notes

- The schema is flat and imports directly: `full_name → Name`, `mobile → MobilePhone`, `email → Email`, `campaign_id/utm_* → Campaign Member fields`, `consent + created_at → Consent audit fields`.
- `consent=true` with `created_at` is the DPDP consent record — map it to SFMC's contact-level consent attribute; do not import rows with `consent=false` (none should exist; the function rejects them).
- Mobile numbers are normalized to 10 digits (no +91) — prepend `+91` if SFMC expects E.164.
- Dedupe key: `mobile` (the Edge Function already prevents duplicates).

## Analytics (anonymous only — no PII)

`window.adobeDataLayer` events, consumed by Adobe Data Collection once `LAUNCH_SCRIPT_URL` is set:

| Event | When | Payload |
|---|---|---|
| `page_view` | delayed phase | `page`, `campaignId`, `utmSource`, `utmMedium` |
| `form_start` | first interaction with the form | `form` |
| `consent_state` | consent checkbox toggled | `consentGranted` (bool) |
| `form_complete` / `form_error` | submission result | `form` |

Campaign attribution: bio links should carry `?cid=<campaign>&utm_source=<platform>&utm_medium=bio`; the same values are captured into the lead row.

## Local development

```bash
aem up --no-open --html-folder drafts
# http://localhost:3000/drafts/jsw/coming-soon?cid=JSW-TEASER-01&utm_source=instagram&utm_medium=bio
```

The silhouette (`drafts/jsw/silhouette.jpg`) is **git-ignored on purpose** — this repo is public and the asset is confidential until launch. Get it from the brand team (crop of the teaser key visual, no logo/QR/contact) and drop it into `drafts/jsw/` locally; in production it lives in the DA doc.

## Launch checklist

- [ ] DA docs created (`/jsw/coming-soon`, `/jsw/privacy-notice`), silhouette uploaded, published
- [ ] Neutral `/nav` and `/footer` docs published
- [ ] Supabase project (ap-south-1) provisioned, migration applied, function deployed with secrets
- [ ] reCAPTCHA v3 keys issued for the production domain and configured
- [ ] `ALLOWED_ORIGINS` set to the production origin
- [ ] Adobe Launch property created, embed URL set in `delayed.js`
- [ ] Domain/subdomain confirmed with DevOps and CDN mapped to the aem.live origin
- [ ] PSI / Lighthouse = 100 on the preview URL
- [ ] End-to-end test lead submitted and visible in `leads`
