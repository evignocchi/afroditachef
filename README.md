# Afrodita Chef

Static one-page site for the restaurant at Via Rialto 1b, Bologna. No build step.

```
python3 -m http.server 8000   # then open http://localhost:8000
```

## To replace before going live

- `js/main.js`: `WHATSAPP_NUMBER` (digits with country code, e.g. `393331234567`). Currently a placeholder.
- `index.html`: booking time slots (`#f-time`) are examples; set the real service hours.
- `index.html`: the menu is indicative and has no prices. Names and descriptions are drafts, as are the ingredient callouts on the dish photo.
- `assets/`: photos are the two supplied images plus crops of them (low resolution). Swap in more and larger photos.
- Opening hours are not shown because they are unknown.
