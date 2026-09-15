# Project Progress - Smashturbanda

## Current Version
- **Release Version**: `26.09.03`
- **Development Version**: `26.09.03` (Lanzamiento Oficial)

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
- **WebRTC ICE Handler Bug (FIXED in 26.09.03.02)**: The `monitorRTCPeerConnection` debug function was overwriting PeerJS's internal `onicecandidate` handler via direct property assignment, preventing ICE candidate trickle. This caused most cross-network connections to fail randomly. Fixed by switching to `addEventListener`. Added ICE restart fallback and 15s connection timeout.
- **WebRTC P2P Over Mobile Data (Symmetric NAT / DPI)**: Some mobile networks with aggressive DPI or enterprise Wi-Fis with AP Isolation may still block WebRTC. Players must use standard residential Wi-Fi or a VPN.
- No other active bugs reported for the current release.
