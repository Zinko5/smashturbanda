# Smashturbanda - Project Brief

## Overview
Smashturbanda is a 2D platform fighter game ("Platform Fighter") inspired by the *Super Smash Bros.* series. It is designed to run efficiently on low-resource machines and browsers, featuring minimalist design, pixel art/geometric aesthetics, local multiplayer for up to 4 players, and P2P online multiplayer utilizing PeerJS (WebRTC).

## Core Requirements & Goals
1. **Low-Resource Optimization**: Prioritize high performance and low latency. The game must run smoothly (typically target 60 FPS) in standard web browsers on low-end hardware.
2. **Platform Fighter Gameplay**:
   - Damage percentage system (0% onwards, increasing knockback as damage increases).
   - Platform navigation (semi-solid platforms, dropping through them).
   - Blast zones around the screen boundaries representing KO zones.
   - Match rules: Stock-based (lives) or Time-based matches.
3. **Local & Online Multiplayer**:
   - **Local Mode**: 2 to 4 players on a single machine. Supports keyboards and Gamepad API (e.g. DualShock controllers).
   - **Online Mode**: P2P multiplayer room connection using PeerJS.
   - **CPU Mode**: Play against simulated computer-controlled characters.
   - **Training Mode**: Sandbox arena to test character combos, percentages, and behavior.
4. **Rich Character Roster**: A minimum of 4 distinct gameplay archetypes (e.g. Balanced, Agile/Fast, Heavy, Zoner, Flyer, etc.).
5. **Robust Audio System**: Lightweight chiptune soundtracks and synthesized sound effects with independent volume levels.
