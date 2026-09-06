# Null Sec OS 3.2

This build is structured as a real Node.js web server for Vercel.

## Vercel deployment

- Framework Preset: Node.js
- Root Directory: repository root
- Install Command: `npm install` (default is fine)
- Build Command: leave empty
- Output Directory: leave empty
- Node.js version: 22 or newer

The root `server.js` is server-only code. Browser code lives only in `public/app.js`, so Vercel will not execute DOM code such as `document.querySelector()` inside the Node runtime.

## Local run

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

Routes:
- `/` Null Sec OS UI
- `/api/health` Node health endpoint
- `/api/qr?text=hello` QR generator
- `/api/proxy?url=https%3A%2F%2Fexample.com` guarded relay
