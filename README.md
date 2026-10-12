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
