# Null Sec OS 7.5

## Browser fix

This build fixes two separate issues seen on Vercel.

### Buttons appeared to do nothing

The Scramjet frame host had `display:none` in CSS. The browser created the frame and called `frame.go()`, but never changed the host back to visible.

7.5 explicitly shows `.sj-host` whenever a page starts loading and when the frame is created.

### False ASSETS FAIL on Vercel

Vercel can deploy `public/` static assets separately from the Node function bundle. A server-side `fs.existsSync()` check can therefore report missing files even when `/vendor/...` is publicly available.

7.5 checks the six actual Scramjet asset URLs from the browser:

- `/vendor/controller/controller.api.js`
- `/vendor/controller/controller.sw.js`
- `/vendor/controller/controller.inject.js`
- `/vendor/scramjet/scramjet.js`
- `/vendor/scramjet/scramjet.wasm`
- `/vendor/libcurl/index.mjs`

The status panel now represents what the browser can really load.

## Recovery

`ensureScramjet()` now:
1. verifies all six URLs,
2. reloads the Scramjet core script if its global is missing,
3. reloads the controller API if its global is missing,
4. verifies the exact root `/sw.js` worker,
5. starts Libcurl + Wisp,
6. waits for the Scramjet controller before creating frames.

## Vercel

The build still runs `node scripts/copy-proxy-assets.cjs` during `vercel-build`.

After deploying 7.5, Browser status should show:
- ASSETS OK
- WISP OK
- WORKER OK
