# Null Sec UBG 7.2

This build shifts Null Sec from a proxy-first desktop into a UBG-style local arcade desktop.

## Changes

- Ultraviolet, BareMux and Epoxy removed completely.
- Scramjet remains the single general-purpose browser engine.
- YouTube is separated from the proxy browser and uses YouTube's official embed player for exact video URLs.
- Optional native YouTube search still uses `YOUTUBE_API_KEY`.
- New Null Arcade is the default startup app.
- Game hub includes search, favorites, recent games, random game, featured games and one-click maximized launch.
- Existing local games remain bundled, so the arcade itself does not depend on a web proxy.
- Startup was rebuilt into an animated arcade-runtime boot sequence.
- Existing Movies, Series, Live TV, chat, voice, Vault, OSINT and utilities remain.

## Notes

"UBG" here means the site is designed like an unblocked-games portal, with locally bundled games. It does not attempt to defeat school or organization network controls.

YouTube embeds can still be unavailable for individual videos when the uploader disables embedding, or when YouTube applies account, region, age or policy restrictions.


## 7.1 full YouTube website mode

The YouTube app now opens the actual `youtube.com` website through Scramjet instead of replacing YouTube with a custom player UI.

- YouTube homepage, search and normal website navigation use Scramjet.
- Normal YouTube URLs typed into Null Browser also stay in the Scramjet browser.
- The official YouTube embed player remains available only as a fallback for an individual watch URL.
- Ultraviolet remains removed.

Full YouTube proxy compatibility still depends on YouTube, Chromium, Scramjet and the hosting network. Login, DRM, anti-bot checks, some media requests and individual videos may still fail when proxied.


## 7.2 arcade expansion

Null Arcade is now the primary UBG experience.

New local games:
- Flappy Null
- Neon Dodger
- Connect Four
- Null Invaders
- Stacker

Arcade upgrades:
- game categories
- favorites and recent games
- per-game launch counts
- total play stats
- game detail/controls overlay before launch
- random game
- featured games
- `/` keyboard shortcut for quick search
- maximized launch for local games

The games are bundled client-side and do not require Scramjet or another external game site.
