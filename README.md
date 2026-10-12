# Aiclo, landing page

Static one-page site for Aiclo (Conversation Intelligence per i team di vendita). No build step.

```
python3 -m http.server 8000   # then open http://localhost:8000
```

- `index.html`: the page. `css/styles.css`, `js/main.js`, `fonts/` (Sora, Onest, JetBrains Mono, self-hosted), `assets/`.
- Copy, numbers and FAQ come from aiclo.io. Product UI in the panels is demo data.

## To check before going live

- Demo CTAs point to `https://www.aiclo.io/#contatti`; footer links point to aiclo.io paths that should be verified.
- App Store / Google Play links are generic store URLs: replace them with the real app pages.

## Ad landing page (`demo.html`)

Single-goal page for paid traffic: no navigation, a two-step demo form in the hero, sticky CTA on mobile, `noindex`.

- The form POSTs JSON to `/api/lead`, a Cloudflare Pages Function (`functions/api/lead.js`) that forwards the lead to the webhook in the `LEAD_WEBHOOK_URL` environment variable (HubSpot, Make, Zapier, n8n…). **Until that variable is set, submissions fail** and the form shows a link to the Aiclo contact page.
- UTM parameters and click ids (`gclid`, `fbclid`, `li_fat_id`, `msclkid`) are captured and sent with the lead.
- Events pushed to `dataLayer`: `lead_form_start`, `lead_form_step`, `generate_lead`, `lead_form_error`, `cta_click`. `generate_lead` also calls `gtag`, `fbq('track','Lead')` and `lintrk` when those tags are installed.
