# Null Sec OS 7.6

This build replaces the fragile vendored-only Scramjet wiring with the canonical Scramjet 2.x server mounts and restores cross-origin isolation.

## Browser changes

- `Cross-Origin-Opener-Policy: same-origin`
- `Cross-Origin-Embedder-Policy: require-corp`
- Scramjet served from `/scramjet/` directly from the installed npm package
- controller served from `/controller/`
- Libcurl served from `/libcurl/`
- root service worker imports `/controller/controller.sw.js`
- browser refuses to initialize when `crossOriginIsolated` is false instead of silently failing
- diagnostics now include `ISOLATION`
- iframe load state now reflects the iframe load event rather than treating synchronous `frame.go()` as a completed page load

## Vercel

`vercel.json` enables Fluid compute and explicitly includes `node_modules/@mercuryworkshop/**` in the `app.js` function bundle. This avoids relying on generated `public/vendor` files.

Expected Browser status after a fresh deployment/reload:

- ASSETS OK
- WISP OK
- WORKER OK
- ISOLATION OK
