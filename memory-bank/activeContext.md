# Active Context - Smashturbanda

## Current Focus
The game's primary features have recently been expanded to support a robust local multiplayer setup (up to 4 players) with gamepad integration, while stabilizing the WebRTC PeerJS P2P connection issues by switching default configuration to Google STUN servers.

## Recent Changes (Patch 26.09.01 - Versión de Lanzamiento)
1. **Damage & Balance Centralization**: Created [damageConfig.js](file:///home/zinko/publico/smashturbanda/damageConfig.js) (`DAMAGE_CONFIG`) to decouple all damage, knockback, damage types ('golpe'/'explosivo'), Yone soul form bonuses, and ability cooldowns in seconds from engine code in [game.js](file:///home/zinko/publico/smashturbanda/game.js).
2. **Launch Release 26.09.01**: Generated official patch notes in [26.09.01.md](file:///home/zinko/publico/smashturbanda/notas-del-parche/finales/26.09.01.md), promotional Typst poster in [26.09.01.typ](file:///home/zinko/publico/smashturbanda/notas-del-parche/promocion/26.09.01.typ), and updated `GAME_VERSION` in `multiplayer.js` and `index.html`.

## Next Steps
- Inform players that online multiplayer requires standard residential Wi-Fi or a VPN if their mobile provider strictly blocks WebRTC P2P.
- Monitor mobile gameplay user experience and touch input responsiveness.

## Active Decisions
- Keep external assets minimal: The project utilizes pure JavaScript logic, drawing sprites dynamically on HTML5 canvas or styling with CSS, preventing reliance on heavy image sprites sheets.
- Keep standard PeerJS 1.4.7 for networking consistency.
- Ensure all styling, graphical layout, and user interface elements conform strictly to the styles and guidelines defined in [design.md](file:///home/zinko/publico/smashturbanda/design.md).
