# Null Sec OS 5.4 Vendored Scramjet Assets

This build removes Ultraviolet from Null Browser and uses the Scramjet 2.x controller generation.

## Browser engine

Null Browser now loads:

- `@mercuryworkshop/scramjet` 2.x
- `@mercuryworkshop/scramjet-controller`
- `@mercuryworkshop/libcurl-transport` 2.x
- `@mercuryworkshop/wisp-js`

The browser registers `/sw.js`, initializes a Scramjet `Controller`, creates a controller-managed frame, and navigates with `frame.go(url)`.

The remote URL is never assigned directly to the iframe. This avoids normal X-Frame-Options / CSP embedding behavior being mistaken for the proxy path.

## Important first-load behavior

A newly installed service worker may need to take control before Scramjet can initialize. The app waits for `controllerchange`. If a browser has stale UV service workers from the older build, unregister the old worker or clear site data once, then reload.

## Realtime chat

The username public chat and browser-encrypted private DMs remain in this build.

## Deploy

Delete the old repo contents, copy this ZIP to the repository root, and redeploy with the Node.js preset.


## 5.2 controller asset fix

The server now resolves the browser controller from the exact installed file:

`@mercuryworkshop/scramjet-controller/dist/controller.api.js`

and serves the directory containing `controller.api.js`, `controller.inject.js`, and `controller.sw.js`.

The older build resolved the package entrypoint instead, which could expose the wrong directory and make `/controller/controller.api.js` return 404.

Open `/api/scramjet-status` after deployment to verify that the runtime resolved all Scramjet assets successfully. Null Browser also preflights every required asset and reports the exact HTTP failure instead of only saying that the controller did not load.


## 5.3 package exports fix

Version 5.2 incorrectly called:

`require.resolve("@mercuryworkshop/scramjet-controller/dist/controller.api.js")`

The published package does not export that subpath, so Node 24 correctly throws `ERR_PACKAGE_PATH_NOT_EXPORTED`.

5.3 never resolves a private `dist/*` subpath. It resolves the package's legal entrypoint:

`require.resolve("@mercuryworkshop/scramjet-controller")`

then walks upward to the package root and checks these on-disk candidates:

- `<package root>/dist/controller.api.js`
- `<entrypoint directory>/controller.api.js`
- `<package root>/controller.api.js`

The same export-safe strategy is used for Libcurl.

Vendor discovery is now lazy. A Scramjet asset problem no longer executes during module startup and can no longer take down the entire Node app before `/api/scramjet-status` is reachable.


## 5.4 Vercel static asset fix

The previous runtime resolver was correct about the npm package layout, but Vercel Node File Trace removed the browser-only files because they were only accessed through `express.static`.

5.4 moves that work to npm `postinstall`. `scripts/copy-proxy-assets.cjs` copies the exact Scramjet browser runtime into `public/vendor/` while the complete npm installation is still present. Vercel deploys `public/vendor/` as application files, so these assets no longer depend on runtime node_modules tracing.

After deployment, `/api/scramjet-status` should report `mode: "vendored-static-assets"` and `ok: true`.
