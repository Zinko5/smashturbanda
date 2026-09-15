# Active Context - Smashturbanda

## Current Focus
Development of **Patch 26.09.03** - Critical WebRTC P2P connection fix.

## Recent Changes (Patch 26.09.03)
1. **Random Stage First in Order (26.09.03.01)**: Reordered the stage selection grid in [index.html](file:///home/zinko/publico/smashturbanda/index.html) and stage roulette sequence in [multiplayer.js](file:///home/zinko/publico/smashturbanda/multiplayer.js) so the **Aleatorio** option appears as the very first map option.
2. **Critical WebRTC ICE Handler Fix (26.09.03.02)**: Fixed `monitorRTCPeerConnection` in [multiplayer.js](file:///home/zinko/publico/smashturbanda/multiplayer.js) which was **overwriting PeerJS's internal `onicecandidate` handler** via direct property assignment (`pc.onicecandidate = ...`), preventing ICE candidates from being trickled to remote peers. Replaced all `pc.onXXX =` assignments with `pc.addEventListener(...)` to coexist with PeerJS internals. Also added automatic ICE restart on failure and a 15-second connection timeout with user feedback.

## Previous Release (Patch 26.09.02)
1. **8-Way Touch D-Pad Controls (26.09.02.05)**: Full 8-way directional grid (52px cells) with smooth `touchmove` thumb sliding, strict 3x3 CSS grid layout, and fixed pure vertical aiming (`up` / `down`) in [game.js](file:///home/zinko/publico/smashturbanda/game.js), [styles.css](file:///home/zinko/publico/smashturbanda/styles.css), [index.html](file:///home/zinko/publico/smashturbanda/index.html), and [input.js](file:///home/zinko/publico/smashturbanda/input.js).
2. **Roster Expanded to 9 Stages (26.09.02.03 & 26.09.02.04)**: Added Floating Islands (`islands`), Breakable Castle (`castle`), Asymmetric Pyramid (`pyramid`), Volcano (`volcano`), Zeppelin (`zeppelin`), and Temple (`temple`) to [game.js](file:///home/zinko/publico/smashturbanda/game.js).
3. **Yone Mechanics & Balance Centralization (26.09.02.01 & 26.09.02.02)**: Centralized all character stats in [damageConfig.js](file:///home/zinko/publico/smashturbanda/damageConfig.js) (`DAMAGE_CONFIG`). Corrected Yone's ability cooldown to start upon return to body and balanced soul mark execution knockback.

## Next Steps
- Test the WebRTC fix with multiple players on separate networks to confirm connections now work reliably.
- Monitor mobile gameplay user experience and touch input responsiveness.

## Active Decisions
- Keep external assets minimal: The project utilizes pure JavaScript logic, drawing sprites dynamically on HTML5 canvas or styling with CSS, preventing reliance on heavy image sprites sheets.
- Keep standard PeerJS 1.4.7 for networking consistency.
- Ensure all styling, graphical layout, and user interface elements conform strictly to the styles and guidelines defined in [design.md](file:///home/zinko/publico/smashturbanda/design.md).
