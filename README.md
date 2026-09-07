# Null Sec OS 6.7

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
