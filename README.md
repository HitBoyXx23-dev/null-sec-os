# Null Sec OS 5.1 Scramjet 2

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
