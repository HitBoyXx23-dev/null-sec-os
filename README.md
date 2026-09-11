# Null Sec OS 7.4

Vercel-targeted Null Sec OS build with the classic green-on-black desktop restored.

## Fixed

- Browser diagnostics now call a real `/api/proxy-status` endpoint.
- `/api/proxy-status` and `/api/scramjet-status` share the same Vercel-safe asset check.
- Added `build` and `vercel-build` scripts so Scramjet browser assets are copied into `public/vendor` during Vercel builds as well as install.
- Added `/api/build-info` so a deployment can be checked quickly.
- Worker status now renders as `OK` or `FAIL` with enough width to avoid clipped text.
- Wisp diagnostics remain separate from asset and worker checks.

## UI

- Project branding is back to **Null Sec OS**.
- Restored the older classic desktop direction.
- Compact square windows and controls.
- Classic top bar, taskbar and start menu.
- Subtle NULL SEC desktop watermark.
- Dashboard opens on boot again.
- Games remain available through Null Arcade, but no longer replace the OS identity.
- Startup is a short classic system boot rather than a large animated arcade splash.

## Vercel

This build is intended for GitHub -> Vercel with the Express framework preset.

The generated Scramjet files are produced by:

`npm run vercel-build`

After a successful deploy:

- `/api/build-info` should report version `7.4.0`
- `/api/proxy-status` should return `"ok": true`
- Null Browser -> status should show `ASSETS OK`, `WISP OK`, `WORKER OK`
