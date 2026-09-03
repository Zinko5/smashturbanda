# Project Progress - Smashturbanda

## Current Version
- **Release Version**: `26.09.02`
- **Development Version**: `26.09.02` (Official Release)

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
- **WebRTC P2P Over Mobile Data (Symmetric NAT / DPI)**: Exhaustive testing has proven that certain mobile networks in LATAM (e.g., Telcel, Movistar, Claro) and enterprise Wi-Fis with "AP Isolation" physically block the P2P connection. This includes aggressive UDP blocking and Deep Packet Inspection (DPI) that severs WebRTC handshakes even when routed through TCP/TLS TURN servers on standard ports (443/3478). This is a hardware/ISP limitation, not a code bug. Players on these restricted networks will experience an infinite "conectando" screen and must switch to standard residential Wi-Fi or use a VPN to play online.
- No other active bugs reported for the current release (`26.08.01.06`).
