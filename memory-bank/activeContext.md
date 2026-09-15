# Active Context - Smashturbanda

## Current Focus
Lanzamiento Oficial del **Parche 26.09.03** - Corrección Crítica de Conectividad WebRTC P2P y mejoras de calidad de vida.

## Recent Changes (Parche 26.09.03 - Lanzamiento Oficial)
1. **Critical WebRTC ICE Handler Fix (26.09.03.02)**: Se corrigió `monitorRTCPeerConnection` en [multiplayer.js](file:///home/zinko/publico/smashturbanda/multiplayer.js) que sobreescribía `pc.onicecandidate` de PeerJS mediante asignación directa, evitando el envío de candidatos ICE locales a pares remotos. Se reemplazó por `addEventListener`, asegurando la coexistencia con los callbacks internos de PeerJS. Se agregó reinicio automático de ICE (`restartIce()`) y tiempo límite de conexión de 15s con avisos toast.
2. **Random Stage First in Order (26.09.03.01)**: Reordenamiento en [index.html](file:///home/zinko/publico/smashturbanda/index.html) y [multiplayer.js](file:///home/zinko/publico/smashturbanda/multiplayer.js) para posicionar el mapa **Aleatorio** como primera opción.
3. **Afiche Promocional Typst**: Generado [26.09.03.typ](file:///home/zinko/publico/smashturbanda/notas-del-parche/promocion/26.09.03.typ) con agradecimientos a Alex, Victor y Martin, y explicación del bug de red.

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
