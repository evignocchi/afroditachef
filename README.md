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

- Form: step 1 one tap (team size), step 2 contact details, step 3 booking calendar prefilled with name and email.
- The form POSTs JSON to `/api/lead`, a Cloudflare Pages Function (`functions/api/lead.js`) that forwards the lead to the webhook in `LEAD_WEBHOOK_URL` (Delera integration on hold). **Until it is set the lead is not stored**: the visitor still reaches the calendar step.
- Booking calendar: set `data-booking-url` on the form in `demo.html` (Calendly link; it is a `PLACEHOLDER` now). A confirmed Calendly booking fires `demo_scheduled` (and Meta `Schedule`).

### Placeholders to replace (search `is-placeholder` in `demo.html`)

- Hero mini testimonial, the three testimonials section, the six client logos.
- Booking URL on the form.
- UTM parameters and click ids (`gclid`, `fbclid`, `li_fat_id`, `msclkid`) are captured and sent with the lead.
- Events pushed to `dataLayer`: `lead_form_start`, `lead_form_step`, `generate_lead`, `lead_form_error`, `cta_click`. `generate_lead` also calls `gtag`, `fbq('track','Lead')` and `lintrk` when those tags are installed.
