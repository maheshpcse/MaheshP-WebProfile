# Portfolio workspace workflow

- Preserve the classic portfolio unless the user explicitly requests classic changes. Current animated work lives in `motion.html` and `src/motion/`.
- User-requested workflow for every implementation/change: stop this project's localhost servers, verify cache/output deletion targets are inside this workspace, clear `node_modules/.vite`, `node_modules/.vite-temp`, and `dist`, and restart a fresh localhost server with Vite `--force` after verification. Stop temporary test preview servers, leaving the requested development server available.
- If the user explicitly asks to stop servers without restarting, leave them stopped.

- The third scene-based edition lives in `scenes.html` and `src/scenes/`. Preserve both the classic and `motion.html` / `src/motion/` editions during scene-version work unless the user explicitly asks to change them. Their snapshots are in `docs/pre-scenes-preserved.json`.
