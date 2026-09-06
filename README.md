# Null Sec OS 4.1

Classic Null Sec OS UI with a UV-style browser route and Username OSINT.

## Proxy architecture

Null Browser now navigates to encoded same-origin paths:

`/uvproxy/<encoded-target>`

`public/null-sw.js` intercepts those routes and sends them through the Node `/api/proxy` relay. The root Node server also provides a `/uvproxy/:encoded` fallback for the first navigation before the service worker controls the page.

This is UV-style architecture rather than a vendored copy of Ultraviolet. It keeps the Vercel-compatible HTTP relay and avoids requiring a Wisp/WebSocket transport.

## Username OSINT

`/api/osint/username?username=...` passively checks public profile URLs on selected services and classifies responses as found, not found, or uncertain. It does not attempt logins, password checks, private APIs, or authenticated enumeration.

## Deploy

Keep the Vercel Node.js preset. Delete old repo files, put the contents of this ZIP at repo root, commit, and redeploy.

Important files:
- `app.js` server-only Express entry
- `public/client.js` browser-only OS code
- `public/null-sw.js` Null Proxy service worker
- `api/proxy/index.js` Node relay
- `api/osint/username.js` public Username OSINT
