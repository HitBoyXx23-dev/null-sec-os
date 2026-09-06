# Null Sec OS

Null Sec OS is a cyber themed browser desktop that deploys directly from GitHub to Vercel.

## Included

- Null Sec boot sequence and HUD desktop
- Draggable, resizable, minimizable and maximizable windows
- Null Relay browser
- Built in Node.js Vercel Function at `/api/proxy`
- Relay health endpoint at `/api/health`
- SSRF protection for localhost and private network targets
- Direct iframe fallback mode
- Null shell terminal
- Virtual vault
- Ops Center with local UI telemetry
- Scratchpad saved in `localStorage`
- System configuration panel
- No frontend framework and no build command

## Deploy from GitHub to Vercel

1. Create a GitHub repository.
2. Put every file and folder from this project in the repository root, including the `api` folder.
3. Import the repository into Vercel.
4. Use the **Other** framework preset.
5. Leave the build command and output directory empty.
6. Deploy.

Vercel serves the static frontend and automatically turns the files in `api/` into Node.js Functions.

## Run locally with the Vercel backend

Install the Vercel CLI and run:

```bash
npx vercel dev
```

Opening `index.html` by itself will show the UI, but Relay mode needs `/api/proxy`, so use `vercel dev` when testing the backend locally.

## Null Relay limits

Null Relay is a lightweight HTML and text viewer, not a VPN, anonymity network, or full browser engine. It only accepts GET requests to public HTTP/HTTPS hosts. Localhost, private IP ranges, credentialed URLs, non-web protocols, oversized responses, and non-HTML/text responses are blocked.

Some modern websites may still fail because they depend on login cookies, anti-bot checks, WebSockets, streaming, browser isolation rules, CORS behavior, or complex client-side routing. Direct Frame mode is available for sites that permit normal iframe embedding.
