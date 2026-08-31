# Active Context - Smashturbanda

## Current Focus
The game's primary features have recently been expanded to support a robust local multiplayer setup (up to 4 players) with gamepad integration, while stabilizing the WebRTC PeerJS P2P connection issues by switching default configuration to Google STUN servers.

## Recent Changes (Patch 26.08.01.06)
1. **Cloudflare Worker TURN Proxy**: Implemented and perfected a serverless Cloudflare Worker proxy (`multiplayer.js: TURN_BACKEND_URL`) to dynamically fetch Metered.ca TURN credentials using a permanent `apiKey` (GET request). This prevents rate limits and hides the keys from the frontend.
2. **TURN Server Bundling & Fallbacks**: The frontend now parses Metered's dynamic response to bundle TURN URLs correctly into `iceServers`. It forces standard WebRTC ports (3478, 80, 443) over UDP, TCP, and TLS, and appends `openrelay.metered.ca` as a final fallback.
3. **WebRTC P2P Over Mobile Data Diagnosis**: Conducted exhaustive cross-device testing. Confirmed that the codebase perfectly gathers and relays ICE candidates, but fails to connect over certain mobile networks (and Wi-Fi routers with AP Isolation) due to aggressive ISP-level Deep Packet Inspection (DPI) and UDP/WebRTC blocking.

## Next Steps
- Inform players that online multiplayer requires standard residential Wi-Fi or a VPN if their mobile provider strictly blocks WebRTC P2P.
- Verify if any additional game balance or character selection UI enhancements are requested.
- Monitor console debug outputs for any new PeerJS issues.

## Active Decisions
- Keep external assets minimal: The project utilizes pure JavaScript logic, drawing sprites dynamically on HTML5 canvas or styling with CSS, preventing reliance on heavy image sprites sheets.
- Keep standard PeerJS 1.4.7 for networking consistency.
- Ensure all styling, graphical layout, and user interface elements conform strictly to the styles and guidelines defined in [design.md](file:///home/zinko/publico/smashturbanda/design.md).
