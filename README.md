# Archivio SuperEnalotto

Storico completo delle estrazioni SuperEnalotto con SuperStar (dal 2006), aggiornato automaticamente ogni sera da GitHub Actions, più un generatore di 3 schedine basato sulle statistiche.

- `data/estrazioni.json` – lo storico (fonte: xamig.com)
- `scripts/aggiorna.mjs` – lo script che scarica le nuove estrazioni
- `.github/workflows/aggiorna.yml` – l'aggiornamento automatico (ogni sera alle 21:30 e al mattino)
- `index.html` – il generatore, pubblicato con GitHub Pages
