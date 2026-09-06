# Null Sec OS 3.8 Vercel Safe

This build fixes `ReferenceError: document is not defined`.

## Why the crash happened
Vercel's Node.js framework preset was treating a root-level browser `app.js` as server code. Browser globals such as `document` do not exist in Node.

## New structure
- `public/index.html` browser UI
- `public/app.js` browser-only JavaScript
- `public/styles.css` browser-only CSS
- `api/proxy/index.js` Node Vercel Function
- `api/health.js` Node Vercel Function
- `api/qr.js` Node Vercel Function
- `api/osint/*.js` Node Vercel Functions
- `lib/relay.js` shared server-only code
- no root `app.js`
- no root `server.js`

## Deploy
Push the CONTENTS of this folder to the repository root.

For Vercel, the safest preset for this build is **Other**, because `/api/*.js` are still Node.js Vercel Functions automatically while the frontend is static.

If you keep the **Node.js** preset, this build is still structured to avoid the old crash because there is no browser JavaScript at the repository root.

Do not copy an older root `app.js` back into the repo.
