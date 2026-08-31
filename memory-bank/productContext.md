# Product Context - Smashturbanda

## Why this project exists
Smashturbanda is a web-based, low-overhead platform fighter that brings the excitement of games like *Super Smash Bros.* to web browsers. It is lightweight, fast, and does not require complex installs or high-end graphics hardware. It provides direct, instantaneous gaming sessions either locally on a shared keyboard/gamepads or online using simple, server-less peer-to-peer (P2P) networking.

## Problems it solves
1. **Accessibility**: Modern fighting games require expensive hardware, large downloads, or specific gaming consoles. Smashturbanda runs on any machine with a modern web browser.
2. **Setup friction**: Online matchmaking usually requires accounts, lobbies, and complex matchmaking systems. Smashturbanda uses simple P2P room codes to hook up players directly.
3. **Local Multiplayer limits**: Many modern PC games lack comfortable, drop-in local multiplayer configurations. Smashturbanda supports up to 4 players locally with mixed gamepad and keyboard support on a single screen.

## How it works
- **Web App**: Hosted as a static webpage, leveraging HTML5 Canvas for rendering, standard JavaScript for game loop and physics, and CSS for the user interface.
- **Controls**: Players can control their characters with highly responsive inputs (either custom keyboard layouts or connected gamepads).
- **Match Setup**: Players select character names, character types (e.g. Mago, Sonic, Gordo, Palomo, Yone, Sett, Terranova, Bomberman), set rules (Time or Stocks), and pick a stage before launching into battle.

## User Experience Goals
- **Instant action**: Minimal load times and zero barriers to starting a match.
- **Visual Clarity**: High-contrast HUD, clean styling, and distinct character visuals so players can easily track the chaotic combat.
- **Responsive Feel**: Input latency must feel minimal to allow for tight aerial combos, precise shield-dodges, and recovery maneuvers.
