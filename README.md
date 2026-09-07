# Null Sec OS 6.3

Full Null Sec OS build with dual proxy browsing and reworked media.

## Browser
- Scramjet 2.x remains installed.
- Real Ultraviolet 3 is installed alongside it.
- Null Browser has AUTO / SCRAMJET / ULTRAVIOLET selector.
- AUTO prefers Ultraviolet for YouTube and Scramjet for general pages.
- Both engines use the same `/wisp/` endpoint.

## Media
- Internet Archive media catalog removed.
- NASA Live/TV entries removed.
- Null Media now links to the Movies, Series, Live and News pages from:
  `https://github.com/HitBoyXx23-dev/hitboystream`
- Null Live TV follows that repo's Live TV logic:
  1. load country playlist names from `iptv-org/iptv`
  2. load the chosen `.m3u`
  3. parse channel names/URLs
  4. play HLS with bundled HLS.js
- The original HitBoyStream Live page is also available as a one-click fallback through Null Browser.

## Existing Null Sec features preserved
- classic green-on-black desktop
- Null Chat + WebRTC voice
- E2EE private DMs
- encrypted local Vault
- passive OSINT suite
- terminal, tools, games, media player, radio
- Vercel/Express deployment
