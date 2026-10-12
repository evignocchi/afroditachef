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

- Form mirrors the current involve.me funnel (landing.aiclo.io/richiedi-demo-gratuita-fb): role, team size, sales channel (one tap each), then first/last name, email, phone, company and GDPR consent. Field values keep the funnel's labels.
- Qualified leads book inline in the HighLevel booking widget (`data-booking-url`, prefilled with name, email, phone, UTM); out-of-target leads get a callback message. Rules: `data-out-of-target-roles` and `data-out-of-target-sizes` on the form (JSON arrays, empty = everyone qualifies).
- The form POSTs JSON to `/api/lead`, a Cloudflare Pages Function (`functions/api/lead.js`) that forwards the lead to the webhook in `LEAD_WEBHOOK_URL` (Delera integration on hold). **Until it is set the lead is not stored**: the visitor still reaches the calendar step.

### Placeholders to replace (search `is-placeholder` in `demo.html`)

- Hero mini testimonial, the three testimonials section, the six client logos.
- UTM parameters and click ids (`gclid`, `fbclid`, `li_fat_id`, `msclkid`) are captured and sent with the lead.
- Events pushed to `dataLayer`: `lead_form_start`, `lead_form_step`, `generate_lead`, `lead_form_error`, `cta_click`. `generate_lead` also calls `gtag`, `fbq('track','Lead')` and `lintrk` when those tags are installed.
