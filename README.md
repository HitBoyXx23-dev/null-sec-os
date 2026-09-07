# Null Sec OS 5.0

This build replaces the UV-style relay with the actual Ultraviolet stack used by the official Ultraviolet app architecture.

## Real Ultraviolet browser

The server exposes the installed vendor assets from:

- `@titaniumnetwork-dev/ultraviolet`
- `@mercuryworkshop/bare-mux`
- `@mercuryworkshop/epoxy-transport`

The browser registers `/uv/sw.js`, configures BareMux, connects Epoxy to `/wisp/`, and navigates using `/uv/service/` plus Ultraviolet's XOR URL codec.

The Node server routes Wisp WebSocket upgrades with `wisp-server-node`.

## Null Chat

Null Chat is realtime over `/chat/` WebSockets.

- Usernames are active-session handles, 3-20 letters/numbers/underscore.
- `# PUBLIC` is a realtime public channel. It is protected in transit by HTTPS/WSS, but is intentionally public and is visible to the chat server.
- Private DMs are encrypted in the browser with ECDH P-256 + AES-GCM. The server forwards only ciphertext.
- Each online user's public key gets a SHA-256 safety fingerprint in the UI. Verify fingerprints out of band if sender authenticity matters.
- There is no account database in this build, so usernames are claimed while connected and do not persist as registered accounts.

## UI cleanup

The always-on desktop time and old `BUILD 3.4 CLASSIC` label were removed. The Clock app remains available. A large subtle `NULL SEC` watermark is rendered behind the desktop.

## Vercel

This build targets Node 24 and uses Vercel's Node server + WebSocket support.

Put the ZIP contents at the repository root, keep the Node.js framework preset, and redeploy.
