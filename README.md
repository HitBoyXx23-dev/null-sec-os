# Null Sec OS 7.7

This build fixes the Scramjet worker flow for Vercel.

## What changed

- Returned Scramjet/controller/libcurl browser files to `public/vendor` build output.
- The root worker imports `/vendor/controller/controller.sw.js`.
- The worker uses the canonical Scramjet 2 fetch flow:
  - route Scramjet requests through `$scramjetController`
  - use normal `fetch()` for everything else
- The client waits for `navigator.serviceWorker.controller`, not merely `registration.active`.
- The Scramjet `Controller` receives the worker that actually controls the page.
- Service worker registration is cache-busted with `?v=7.7`.
- Asset checks include `/sw.js`.
- Reset unregisters root workers and tells the user to reload.
- COOP/COEP isolation is enabled for Scramjet 2.

## Vercel

The build command remains:

`npm run vercel-build`

which copies browser-only npm assets into `public/vendor`.

After deployment, hard reload once. Browser diagnostics should report:
- ASSETS OK
- WISP OK
- WORKER OK
- ISOLATION OK
