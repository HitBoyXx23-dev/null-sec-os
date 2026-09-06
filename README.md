# Null Sec OS 3.1

Null Sec OS is a browser desktop designed for GitHub to Vercel deployment with Node.js serverless functions.

## Deploy on Vercel

1. Push every file in this folder to the root of a GitHub repository.
2. Import the repository into Vercel.
3. Use the Node.js / Other Node-compatible framework preset you selected.
4. Vercel installs the dependency from `package.json` and exposes the files in `api/` as Node functions.
5. Deploy. No separate backend host is required.

## Node backend

- `/api/health` reports backend status.
- `/api/proxy?url=...` is Null Browser's guarded public-web relay.
- `/api/qr?text=...` generates QR PNGs with the Node `qrcode` package.

The relay only accepts public HTTP/HTTPS targets and blocks localhost, private networks, credentialed URLs and oversized responses. Some websites still cannot work through a relay because they depend on DRM, anti-bot systems, login state, service workers, WebSockets or browser security policies.

## In-OS navigation

Null Sec OS 3.1 removes new-tab launchers from its apps. Media collections and radio directories route into Null Browser. QR Forge generates inside its own window. Supported YouTube watch links use YouTube's official embedded player inside the OS.

## Local testing

For frontend-only testing, use any static server. Vercel Functions require the Vercel runtime or a compatible local environment.
