# Deploy the portfolio to GitHub Pages

## First deployment

1. Create a GitHub repository under maheshpcse. Put this project's source at its root, including .github/workflows/deploy.yml, .nvmrc, package-lock.json, public/, src/, scripts/, tests/, and docs/.
2. Use main as the deployment branch. For another branch, update the workflow triggers and main-branch conditions.
3. In **Settings > Pages > Build and deployment > Source**, select **GitHub Actions**.
4. Push to main, or open **Actions > Deploy portfolio to GitHub Pages > Run workflow** and choose main.
5. When build and deploy succeed, open the URL shown in the github-pages environment.

Do not upload only source HTML: Vite must build the TypeScript. Do not commit node_modules/, .tools/, or dist/. No personal access token, backend, or environment file is needed.

## Live URLs

For a repository named my-portfolio:

| Edition | URL |
| --- | --- |
| Home with intro | https://maheshpcse.github.io/my-portfolio/ |
| Classic reading page | https://maheshpcse.github.io/my-portfolio/portfolio.html |
| In Motion | https://maheshpcse.github.io/my-portfolio/motion.html |
| Scenes | https://maheshpcse.github.io/my-portfolio/scenes.html |

Replace my-portfolio with your repository name. If the repository is maheshpcse.github.io, omit /my-portfolio. Vite's relative base supports both locations. Each edition is a real HTML file; no SPA redirect is needed.

## Automated checks and deployment

Pull requests targeting main install locked dependencies, build all pages, verify output references, and run browser tests. They do not publish.

Pushes to main and manual runs on main perform the same checks, upload only dist/, and deploy using GitHub's Pages actions. Only the deployment job receives pages: write and id-token: write. Active deployments finish before queued runs.

.nvmrc selects Node 22. public/.nojekyll is copied into the output. The workflow installs Playwright Chromium with Linux dependencies. Keep the preservation snapshots in docs/: the tests require them.

## Local verification

Run these commands in order:

    npm ci
    npm run build
    node scripts/verify-pages.mjs
    npm run preview

Open http://127.0.0.1:4173 and check every edition. Run npm test in another terminal. On Linux first run npx playwright install --with-deps chromium.

## Troubleshooting

Check failed jobs in Actions. For Pages configuration errors, confirm GitHub Actions is the publishing source. For pending approval, review github-pages environment protection settings. For asset 404s, confirm dist/ was published and the relative Vite base was retained.

Local verification does not publish the website. A hosted deployment is only confirmed after the workflow succeeds in your repository.

Reference: [GitHub custom Pages workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
