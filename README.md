# Null Sec OS 3.9 Node Preset Fix

This build is intentionally structured for the Vercel Node.js preset.

## Critical fix

The root `app.js` is now SERVER code only. It contains no `window`, `document`, DOM selectors, or browser APIs.

The old browser code was renamed to:

`public/client.js`

So if Vercel compiles the root app into `/var/task/app.cjs`, it will compile the Express server, not the browser UI.

## Deploy

1. Delete the existing repository contents first, especially any old root `app.js`, `app.cjs`, `server.js`, and old `public/app.js`.
2. Copy the CONTENTS of this ZIP into the repository root.
3. Commit the deletions and additions to GitHub.
4. In Vercel, keep Framework Preset set to Node.js.
5. Make sure Root Directory points to the folder containing this `package.json` and root `app.js`.
6. Redeploy the latest commit.

API routes:
- `/api/proxy?url=https://example.com`
- `/api/health`
- `/api/qr?text=hello`
- `/api/osint/dns`
- `/api/osint/rdap`
- `/api/osint/ct`
- `/api/osint/headers`
- `/api/osint/robots`
