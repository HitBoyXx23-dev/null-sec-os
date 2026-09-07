# Null Sec OS 6.5

This build fixes the Vercel TV JSON failure and removes direct HitBoyStream website wrappers from Null Media.

## What changed
- TV endpoints moved away from `/api/*` to `/null-data/*` so Vercel does not confuse them with filesystem API functions.
- Country catalog is built into Null Sec OS.
- Country M3U playlists use multiple upstream mirrors.
- Playlist metadata includes title, logo, group, tvg id and language.
- Native channel search, group filtering and local favorites.
- Same-origin `/null-media/hls` gateway rewrites HLS manifests, nested playlists, keys and segment URLs for much better CORS compatibility.
- No direct HitBoyStream page buttons in Null Media.
- Null Cinema is now a native media router rather than an external-site wrapper.
- Scramjet + real Ultraviolet dual browser is preserved.

The source model is based on the HitBoyStream Live TV approach, which consumes country playlists from iptv-org.


## 6.5 Ultraviolet route fix

Fixed the real Ultraviolet worker registration.

Previous code registered `/uv/sw.js` with scope `/uv/`, but Ultraviolet's package uses `uv.sw.js` and its service worker must own the configured proxy prefix, normally `/uv/service/`.

The client now:
- reads `__uv$config.sw`
- reads `__uv$config.prefix`
- registers the UV worker with that exact scope
- waits for that specific worker to activate
- keeps BareMux + Epoxy connected to `/wisp/`
- leaves the root Scramjet worker separate
- exposes `/api/uv-status` for deployment diagnostics

After deploying this build, clear the old site's service-worker/site data once so the stale registration from 6.4 cannot keep intercepting requests.
