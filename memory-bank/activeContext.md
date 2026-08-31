# Active Context - Smashturbanda

## Current Focus
The game's primary features have recently been expanded to support a robust local multiplayer setup (up to 4 players) with gamepad integration, while stabilizing the WebRTC PeerJS P2P connection issues by switching default configuration to Google STUN servers.

## Recent Changes (Patch 26.07.06.13)
1. **Local 4-Player Support**: Expanded "Versus Local" to support up to 4 players. Added a sidebar UI with slots for adding/removing players (P3/P4) using `+` and `✕` buttons.
2. **Character Selection (CSS) Active Turn Selection**: Implemented slot active state (`▶ Eligiendo`) for local character and name selection.
3. **Gamepad API Integration**: Automatically detects connected gamepads (e.g. DualShock) and binds them to the first available player slots.
4. **Mixed Input Handling**: Combines keyboard keys and gamepads via logical OR per player slot, allowing players to play simultaneously without conflict.
5. **P3/P4 Keyboard Controls**: Added default key mappings for Player 3 (`T/G/F/H` for movement, `T` for jump, `Y/U/I/O` for attacks) and Player 4 (`Numpad 8/5/4/6` for movement, `Numpad 7/9/÷/×` for attacks).
6. **WebRTC P2P Stability**: Defaulted exclusively to stable Google STUN servers, removing unstable TURN configs that caused initialization timeouts and failures.

## Next Steps
- Verify if any additional configuration or control layouts are requested.
- Monitor console debug outputs for PeerJS during online sessions.
- Maintain stability and code quality within the core game files (`game.js`, `multiplayer.js`, `input.js`, `styles.css`).

## Active Decisions
- Keep external assets minimal: The project utilizes pure JavaScript logic, drawing sprites dynamically on HTML5 canvas or styling with CSS, preventing reliance on heavy image sprites sheets.
- Keep standard PeerJS 1.4.7 for networking consistency.
- Ensure all styling, graphical layout, and user interface elements conform strictly to the styles and guidelines defined in [design.md](file:///home/zinko/publico/smashturbanda/design.md).
