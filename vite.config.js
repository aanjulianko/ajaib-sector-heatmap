import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: `base` must match your GitHub repository name exactly,
// wrapped in slashes. If your repo is named `ajaib-sector-heatmap`,
// leave this as is. If you rename the repo, update this too.
// (Deploying to Vercel or Netlify instead? Delete the `base` line —
// those platforms handle routing automatically.)
export default defineConfig({
  plugins: [react()],
  base: '/ajaib-sector-heatmap/',
})
