# Ajaib · Sektor & Industri — Heatmap Prototype

Clickable prototype of the Ajaib USS sector-revamp heatmap variant (light mode).
Tile size = market weight, tile color = today's change. Drill: heatmap tile →
sector detail → stock detail. Built with React + Vite.

## Run locally

Requires [Node.js](https://nodejs.org) 18+.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

---

## Put it on a live URL

### First: set your repo name in two places
This prototype is preconfigured for a repo named **`ajaib-sector-heatmap`**.
If you use a different repo name, update BOTH:
- `vite.config.js` → `base: '/YOUR_REPO_NAME/'`
- `package.json` → `"homepage": "https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPO_NAME/"`

Also replace `YOUR_GITHUB_USERNAME` in `package.json` with your actual username.

### Option A — one command (gh-pages)

```bash
# create an empty repo on GitHub first, then:
git init
git add .
git commit -m "Ajaib sector heatmap prototype"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/ajaib-sector-heatmap.git
git push -u origin main

npm run deploy
```

Then on GitHub: **Settings → Pages → Source → Deploy from a branch → `gh-pages` → Save.**
Live in a few minutes at `https://YOUR_GITHUB_USERNAME.github.io/ajaib-sector-heatmap/`.

### Option B — auto-deploy on every push (GitHub Actions)

A workflow is included at `.github/workflows/deploy.yml`. To use it:
1. Push the repo to GitHub (the `git` steps above).
2. **Settings → Pages → Source → GitHub Actions.**
3. Every push to `main` rebuilds and redeploys automatically — no `npm run deploy` needed.

### Option C — skip the `base` fiddliness (Vercel / Netlify)

Import the GitHub repo at vercel.com or netlify.com. Zero config, no `base` needed.
If you go this route, delete the `base` line in `vite.config.js`.

---

## Files

- `src/App.jsx` — the entire prototype (data, screens, components)
- `src/main.jsx` — React entry point
- `index.html` — page shell (loads Inter font)
- `vite.config.js` — build config (`base` path for GitHub Pages)
