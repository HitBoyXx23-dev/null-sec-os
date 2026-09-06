# Null Sec OS 3.0

Null Sec OS is a cyber themed browser desktop designed to deploy directly from GitHub to Vercel.

## Highlights

- 50+ built-in apps and games
- Dark Null Sec desktop, boot sequence, HUD, launcher search, taskbar and draggable windows
- Null Browser with Smart, Relay and Direct modes
- YouTube watch links use the official privacy-enhanced YouTube embed player
- Node.js Vercel relay at `/api/proxy`
- Relay supports compatible HTML, CSS, scripts, JSON, SVG, images, fonts and audio
- SSRF defenses block localhost, private networks, credentialed URLs and non-HTTP protocols
- Null Media hub with legal public-domain and official media sources
- NullSH terminal, Vault, Ops Center, Scratchpad and Config
- Utilities including Calculator, Paint, JSON Lab, Base64, URL Codec, UUID, Password Forge, SHA-256, Regex, Color Lab, Text Lab, units and more
- Games including Snake, Pong, Breakout, Tic Tac Toe, Memory, Mines, Simon, 2048, Lights Out and more
- No frontend framework and no build command

## Deploy from GitHub to Vercel

1. Create a GitHub repository.
2. Put the contents of this project in the repository root, including `api/`.
3. Import the repository into Vercel.
4. Choose the **Other** framework preset.
5. Leave the build command and output directory empty.
6. Deploy.

Vercel serves the static frontend and turns `api/*.js` into Node.js Functions.

## Local development

Install the Vercel CLI and run:

```bash
npx vercel dev
```

Opening `index.html` directly will run the desktop, but the relay endpoints need `vercel dev` or a Vercel deployment.

## Browser compatibility notes

A server relay cannot turn an iframe into a full browser engine. Sites can depend on login cookies, anti-bot systems, service workers, DRM, WebSockets, complex CORS behavior, or explicit embedding restrictions. Null Browser uses an official YouTube embed bridge for normal YouTube video URLs because relaying the full YouTube site is not reliable. For incompatible pages, Direct mode or opening the site in a normal browser tab is the correct fallback.

Null Media intentionally links to legal public-domain and official media collections. It does not bundle pirated movie or TV streams.
