# Active Context - Smashturbanda

## Current Focus
Official Release of **Patch 26.09.02** is finalized. Includes damage & balance centralization, Yone cooldown & knockback fixes, 6 new stages (totaling 9 playable stages + Random option), and an 8-way mobile touch D-Pad with smooth drag aiming and pure vertical directional support.

## Recent Changes (Patch 26.09.02 - Versión de Lanzamiento Oficial)
1. **8-Way Touch D-Pad Controls (26.09.02.05)**: Full 8-way directional grid (52px cells) with smooth `touchmove` thumb sliding, strict 3x3 CSS grid layout, and fixed pure vertical aiming (`up` / `down`) in [game.js](file:///home/zinko/publico/smashturbanda/game.js), [styles.css](file:///home/zinko/publico/smashturbanda/styles.css), [index.html](file:///home/zinko/publico/smashturbanda/index.html), and [input.js](file:///home/zinko/publico/smashturbanda/input.js).
2. **Roster Expanded to 9 Stages (26.09.02.03 & 26.09.02.04)**: Added Floating Islands (`islands`), Breakable Castle (`castle`), Asymmetric Pyramid (`pyramid`), Volcano (`volcano`), Zeppelin (`zeppelin`), and Temple (`temple`) to [game.js](file:///home/zinko/publico/smashturbanda/game.js).
3. **Yone Mechanics & Balance Centralization (26.09.02.01 & 26.09.02.02)**: Centralized all character stats in [damageConfig.js](file:///home/zinko/publico/smashturbanda/damageConfig.js) (`DAMAGE_CONFIG`). Corrected Yone's ability cooldown to start upon return to body and balanced soul mark execution knockback.

## Next Steps
- Inform players that online multiplayer requires standard residential Wi-Fi or a VPN if their mobile provider strictly blocks WebRTC P2P.
- Monitor mobile gameplay user experience and touch input responsiveness.

## Active Decisions
- Keep external assets minimal: The project utilizes pure JavaScript logic, drawing sprites dynamically on HTML5 canvas or styling with CSS, preventing reliance on heavy image sprites sheets.
- Keep standard PeerJS 1.4.7 for networking consistency.
- Ensure all styling, graphical layout, and user interface elements conform strictly to the styles and guidelines defined in [design.md](file:///home/zinko/publico/smashturbanda/design.md).
