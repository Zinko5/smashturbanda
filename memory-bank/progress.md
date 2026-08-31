# Project Progress - Smashturbanda

## Current Version
- **Development Version**: `26.08.01.01`

## What Works
- **Gameplay System**: Real-time platform physics, platform drop, gravity, collision detection, damage multiplier percentage, and blast zones.
- **Game Modes**: Versus Local, Versus CPU, Online (P2P), and Training Mode.
- **Roster & Archetypes**: Multiple selectable characters including: Mago (balanced), Sonic (fast), Gordo (heavy), Zoner (ranged), Palomo (flyer), Blitzcrank (hook/pull), Yone, Bomberman (bombs), and Terranova (earth walls).
- **Controls & Input**: Full keyboard support + Gamepad API support (up to 4 controllers auto-mapped and rebindable). Logic OR for mixed control schemes.
- **Settings**: Audio control, remappable key bindings, custom TURN server configuration.
- **Network Sync**: Compressed tuple-based state transfer, delta-input streaming, fallback to Google STUN servers.

## What's Left to Build
- Any game balance adjustments requested by users.
- Additional characters or stages.
- UI enhancements to further polished states.

## Known Issues / Roadblocks
- None actively reported for the current miniparche release (`26.07.06.13`).
- NAT issues in symmetric CGNAT configurations can still block direct connection if TURN servers are not configured by the client.
