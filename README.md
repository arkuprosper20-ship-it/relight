# Relight — AI Product Photo Cleaner

Relight turns a messy product photo into a cleaner marketplace-ready banner directly in the browser. The project includes local image segmentation/refinement, a custom realistic shadow renderer, background presets, crop/lighting controls, before/after comparison, project persistence, and PNG/JPG/WebP export.

## Run locally

```bash
npm install
npm run dev
```

## Verify the TypeScript project

```bash
npx tsc -b --noEmit
```

## Production build

```bash
npm run build
npm run preview
```

## Notes

- No API key is required by the current browser pipeline.
- Product images are processed client-side by the editor pipeline.
- The segmentation engine has a synchronous fallback and a Web Worker path.
- The custom shadow engine is deterministic and does not depend on an external image API.
- `node_modules` is intentionally not included in the project archive; run `npm install` after extracting.
