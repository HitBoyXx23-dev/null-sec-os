# Null Sec OS 5.6

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


## 5.5 rewritten route fix

Scramjet correctly generates URLs under `/~/sj/...`.

The previous Express fallback explicitly excluded `/~/sj/`, so those requests fell through to the JSON 404 middleware and returned:

`{"error":"Not found"}`

5.5 adds an explicit GET handler for `/~/sj/*` that returns the application shell. The root-scoped Scramjet service worker can then intercept that navigation and perform the actual rewritten fetch.

This is specifically for rewritten browser navigations. API and static vendor paths still bypass the SPA fallback.


## 5.6 additions

### Null Browser Shield

The Scramjet service worker now rejects a conservative list of obvious advertising and tracking endpoints before routing requests. Null Browser also rewrites `_blank` / `_new` link behavior back into the current Scramjet frame and overrides ordinary `window.open` attempts inside accessible proxied documents.

This is intentionally conservative. It is not a promise to remove every YouTube in-stream ad, because aggressive blocking of shared Google video infrastructure can also break normal playback.

### Null Chat voice

Voice is now inside Null Chat. Select an online username and use CALL. Signaling travels over the existing `/chat/` WebSocket; audio travels peer-to-peer over WebRTC DTLS-SRTP.

The default ICE configuration uses Cloudflare's public STUN service at `stun:stun.cloudflare.com:3478`. STUN helps peers discover public network addresses but does not relay media. Restrictive NAT/firewall combinations can still require a TURN service.

### Recent messages

The server keeps the most recent 50 public messages in memory and sends them after login. This history is instance-local on serverless deployments and is not a durable database.

Each browser also keeps the latest 100 displayed public/private messages per username locally so reopening Null Chat shows recent local conversation history automatically.

### Vault

Vault now stores actual entries. It derives an AES-256-GCM key from the user's vault password with PBKDF2-SHA-256 and 250,000 iterations. The encrypted blob stays in browser localStorage. It supports create, unlock, add/delete entries, lock, and encrypted export/import.
