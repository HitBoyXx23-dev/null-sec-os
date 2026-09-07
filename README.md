# Null Sec OS 4.2

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

## Null Crypt communications

Two self-contained communication apps are included:

- **Null Crypt Chat** uses a WebRTC DataChannel plus an additional application-layer ECDH P-256 key agreement and AES-GCM encryption for every chat payload.
- **Null Voice** uses WebRTC voice with DTLS-SRTP transport encryption.

Both use manual offer/answer connection codes, so there is no hosted signaling service or external chat provider. Because this build intentionally ships with no external STUN/TURN server, direct peer connectivity depends on the peers' NAT/network environment. On restrictive networks, a TURN service would be required for reliable calls.

Voice is encrypted in transit by WebRTC, but this build does not add a second Insertable Streams application-encryption layer to audio.
