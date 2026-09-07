# Null Sec OS 6.9

## Changes

- YouTube watch/Shorts/youtu.be URLs use the official YouTube nocookie embed player inside Null Browser. Full pages still use UV/Scramjet.
- Voice calls queue ICE candidates until remote SDP exists, use multiple STUN servers, expose RTC state, and support optional TURN through `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL`.
- Native Movies and Series apps restored with search, artwork, descriptions, official store links and legal preview clips.
- Null Cinema is a native Movies/Series launcher.
- Null Media uses compact OS-style tiles instead of oversized marketing-style hero sections.
- Existing Live TV, Vault, Null Chat, OSINT, games, UV and Scramjet remain.

### Voice note

STUN-only WebRTC cannot guarantee calls across every NAT/firewall. For reliable calls on restrictive networks, configure a TURN server using the environment variables above.


## 6.7 fixes

### Ultraviolet

6.6 registered `/uv/uv.sw.js` directly. That file is Ultraviolet's core service-worker implementation, not the complete stock registration script.

6.7 adds `public/uv/sw.js` which imports, in order:

1. `/uv/uv.bundle.js`
2. `/uv/uv.config.js`
3. `/uv/uv.sw.js`

It then creates `UVServiceWorker` and handles only routes matching the UV service prefix. Null Browser registers this wrapper under `/uv/service/`, while Scramjet keeps its own root worker.

### Movies and Series

The iTunes catalog fallback has been removed.

Movies and Series now follow the HitBoyStream catalog pattern:

- TMDB `trending/movie/week`
- TMDB `trending/tv/week`
- TMDB movie search
- TMDB TV search
- posters/backdrops from TMDB
- ratings, year, overview
- movie runtime and trailers
- series seasons and episode metadata
- provider metadata / official pages where TMDB exposes them

The browser UI stays native to Null Sec OS. Unauthorized third-party movie/episode embed mirrors are not bundled.


## 6.8 YouTube + proxy hardening

- Replaced the UV wrapper with the stock `UVServiceWorker().fetch(event)` pattern.
- Added a local `/uv/uv.config.js` so the UV prefix and asset paths are deterministic.
- Removed global COOP/COEP headers. They are not required for Null Sec's proxy setup and can interfere with direct third-party embeds.
- YouTube video URLs now play through YouTube's official `youtube.com/embed` player directly inside Null Sec.
- YouTube home/search URLs in Browser AUTO mode route to the native YouTube app rather than depending on UV/Scramjet.
- `/null-data/youtube/oembed` supplies metadata for exact video URLs without an API key.
- Optional native YouTube search uses `YOUTUBE_API_KEY` on the server. The key is never sent to the browser.
- Movies and Series remain on the HitBoyStream-style TMDB trending/search/season flow introduced in 6.7.
- Voice still supports STUN by default and optional TURN through `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL`.

After deployment, clear site data/service workers once because older UV and Scramjet worker registrations can survive a redeploy.


## 6.9 browser reliability

- BareMux updated to 2.1.9 for the UV 3.x generation.
- Scramjet now validates the exact root `/sw.js` registration and waits for that worker to activate.
- UV continues using its own narrower `/uv/service/` worker scope.
- Browser Back/Forward now use Null Browser's own navigation history instead of depending on cross-frame `history`.
- Added `TRY OTHER ENGINE` after failures.
- Added an in-browser diagnostics panel for Scramjet assets, UV assets, and Wisp WebSocket connectivity.
- Added a worker reset button so stale deployments can be repaired without manually finding browser DevTools.
- YouTube exact video URLs still use the native official player because full YouTube proxy browsing can be unreliable from datacenter-hosted deployments.

No web proxy can make every modern site work perfectly. DRM, anti-bot checks, browser integrity checks, CAPTCHA, and sites that depend on unsupported browser APIs can still fail.
