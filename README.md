# Null Sec OS 5.2 Scramjet Asset Fix

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
