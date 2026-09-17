# Mahesh's portfolio

A responsive portfolio with professional experience, two full-stack personal projects, technology skills, GitHub and contact links, and a downloadable resume. Includes persistent dark/light themes, smooth scrolling, reading progress, keyboard navigation, and reduced-motion support. Core content works without JavaScript.

## Local development

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5173. Stop the server with Ctrl+C.

## Production and verification

```sh
npm run build
npm run preview
npm test
```

The build writes static files to `dist/`. Preview uses port 4173. Playwright tests start and stop their own preview server when one is not already running. Windows tests use installed Microsoft Edge; on Linux install Chromium with `npx playwright install --with-deps chromium` first.

Tests cover portfolio navigation, resume downloads, theme persistence, accessibility in both themes, mobile overflow, scroll progress, and content without JavaScript.

## GitHub Pages

See [the deployment guide](docs/GITHUB-PAGES.md) for first-time setup, live URLs for every edition, and troubleshooting. Pull requests run checks without publishing. The workflow verifies production references before deployment.

Push the project to the repository's `main` branch. In repository Settings > Pages, select GitHub Actions as the build source. `.github/workflows/deploy.yml` installs dependencies, builds and tests the portfolio, then publishes `dist/` to GitHub Pages. The workflow can also be run manually.

Vite's relative base supports both account and repository Pages URLs. The resume and self-hosted fonts are bundled from `public/`; no backend or environment secrets are required.

## Editing content

- `index.html`: profile, experience, projects, skills, and contact details.
- `portfolio.html`: preserved reading-page URL with the same content.
- `src/styles.css`: responsive cards, typography, dark/light palettes, and print styles.
- `src/main.ts`: theme preferences and reading progress.
- `public/assets/Mahesh-Resume.pdf`: downloadable resume.
- `public/fonts/`: self-hosted fonts and license files.

Professional details come from the supplied resume; personal project links point to `github.com/maheshpcse`. The owner-supplied skill “Vibe Coder & Stylish UI/UX Designer” is included. Technology descriptions summarize experience without reproducing proprietary systems.

The classic navbar stays visible while scrolling. Section links leave room below it, and refreshing either portfolio page starts at the top.

Chat System and Banking System each combine their frontend and backend repositories. Original inline SVG illustrations and technology icons follow the selected theme; animated packets respect reduced-motion preferences. The themed native cursor is enabled for fine-pointer devices.

The home page opens with a 4.2-second cinematic title followed by a short reveal into the portfolio. Skip intro or Escape opens the page immediately. Reduced-motion visitors, direct section links and `portfolio.html` bypass the intro. It uses CSS/SVG only, with no video downloads or audio; the classic content stays available without JavaScript.


## In Motion — separate Anime.js portfolio

Open `motion.html` for the new animated edition, or keep using `index.html` and `portfolio.html` for the unchanged classic experience. All three pages are built for GitHub Pages with relative asset paths. Classic files are checked against `docs/classic-preserved.json`.

The new page uses locally bundled Anime.js 4.5.0: staggered title sequences, scroll-synchronized drawings and project previews, a rotating geometric bloom with a Remix control, illustrative message/transaction interactions, and filterable technology cards. The interface studies are original illustrations, not screenshots or connections to the live app backend. Project buttons link to the actual applications and both repositories.

Pause motion and system reduced-motion preferences keep all content usable. Theme and motion preferences persist separately from classic preferences. Hero loops pause when offscreen; browser background suspension and scope cleanup prevent abandoned animations. No video, external font, 3D engine or runtime CDN is needed. The page remains readable without JavaScript. The Anime.js license is in `docs/ANIMEJS-LICENSE.md`.


### Opening and closing the portfolio engine

The animated edition now includes an original SVG mechanism inspired by the supplied 21-second Anime.js screen recording: an assembled unit separates into interface, services, data, and delivery layers, then closes again. On sufficiently tall desktop screens it follows scroll progress; buttons, an accessible range slider, and layer selectors provide direct control on every screen. Paused/reduced motion uses immediate state changes and removes the pinned scroll space.

Chat System and Banking System each have an Open project story button. Native modal dialogs provide focus containment and Escape handling, while Anime.js timelines stagger opening/closing shutters and content. Closing returns focus to the triggering button. No reference video or third-party 3D model is shipped. This uses timeline seeking, staggered delays, transform interpolation, ScrollObserver callbacks, and cancellation alongside the existing Anime.js effects.

The user-requested stop / clear cache / fresh restart workflow is recorded in AGENTS.md.


## A little about me ? third portfolio edition

`scenes.html` is a separate, full-screen edition. It tells Mahesh's story in six scenes: hello, journey, tools, Chat System, Banking System, and contact. Short personal copy replaces long on-screen paragraphs; optional detail dialogs retain the deeper context. The developer illustration is original artwork, not a photograph of Mahesh.

Native scrolling drives an Anime.js timeline. As you scroll down, the current content shrinks and clips away while the next scene opens, without a full-screen color overlay. Scrolling up seeks the same timeline backward. The scene picker, previous/next buttons, Page Up/Down, arrow keys, Home, and End support direct navigation. Links support direct fragment entry and browser Back/Forward. Small screens can scroll within a scene where necessary.

Pause motion or system reduced motion switches scenes immediately. Theme and motion preferences are stored separately from the other editions. Detail dialogs use native focus handling and Escape, and all content remains readable if JavaScript is unavailable. The page uses the existing local fonts and Anime.js dependency; no new runtime service, video, or 3D asset is needed.

`docs/pre-scenes-preserved.json` protects the classic and earlier animated source files. The GitHub Pages build now includes this fourth HTML entry point alongside the original home, classic, and In Motion pages.

Scene layout fix: the canvas reserves the measured header/footer space. Content closes and reveals directly in either scroll direction; the full-screen color shutters have been removed. Scene cursors follow the selected palette. Classic now includes a Back to top button. Historical preservation snapshots remain intact; tests use docs/post-back-to-top-preserved.json for this explicitly requested classic addition.
