# Deployment

- Source code lives on the main branch.

- The live site is GitHub Pages, served from the gh-pages branch.

- Publish with: npm run deploy (runs build, then gh-pages -d dist).

- Live URL: https://sharmalily1984-cloud.github.io/insurance-premium-web/

- Vite base in vite.config.ts must stay /insurance-premium-web/ — never change it.

- Always run git pull --no-rebase origin main before pushing to avoid non-fast-forward rejections.

- Self-check: npm run selfcheck. Canonical value: Sum Insured 84000 → Annual Premium 7000 → Calculated Premium 1530.05.
