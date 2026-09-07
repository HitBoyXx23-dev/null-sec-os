# Null Sec OS 6.6

## Changes

- YouTube watch/Shorts/youtu.be URLs use the official YouTube nocookie embed player inside Null Browser. Full pages still use UV/Scramjet.
- Voice calls queue ICE candidates until remote SDP exists, use multiple STUN servers, expose RTC state, and support optional TURN through `TURN_URL`, `TURN_USERNAME`, and `TURN_CREDENTIAL`.
- Native Movies and Series apps restored with search, artwork, descriptions, official store links and legal preview clips.
- Null Cinema is a native Movies/Series launcher.
- Null Media uses compact OS-style tiles instead of oversized marketing-style hero sections.
- Existing Live TV, Vault, Null Chat, OSINT, games, UV and Scramjet remain.

### Voice note

STUN-only WebRTC cannot guarantee calls across every NAT/firewall. For reliable calls on restrictive networks, configure a TURN server using the environment variables above.
