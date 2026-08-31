# Technical Context - Smashturbanda

## Technologies & Frameworks
- **Frontend Stack**: Pure HTML5, CSS3, and ES6+ JavaScript.
- **Canvas Rendering**: 2D Context API (`HTMLCanvasElement.getContext('2d')`).
- **Networking**: PeerJS (v1.4.7) wrapper for WebRTC (P2P DataChannels).
- **Icons**: Lucide Icons package (dynamic UI symbols).
- **Promotional Materials**: Typst (specifically using `plantilla.typ` in `notas-del-parche/promocion/`).

## Development Setup
- Static file server (e.g. `python3 -m http.server`, Live Server extension, or direct browser loading).
- Run locally by launching `index.html` in a web browser.
- External files read and persisted via native APIs (`localStorage` for configuration storage, `window.crypto` for HMAC-SHA1 signature calculations).

## Versioning & Patch Notes
- **Versioning Standard**: Follows the `aa.bb.cc.dd` format (Year.Month.Patch.Minor).
  - *Note*: Always verify the current system date/month when starting a new patch. The month segment (`bb`) must match the actual calendar month (e.g., `08` for August), and the patch accumulator (`cc`) resets to `01` if it is a new month.
- **Guidelines**: Detailed instructions for versioning, changelogs, promotional posters (Typst), and Git workflows are documented in [guia-notas.md](file:///home/zinko/publico/smashturbanda/notas-del-parche/guia-notas.md).

## Technical Constraints
- No build pipeline (like Webpack or Vite) is active for the production version; it runs directly from vanilla script tags loaded in `index.html`.
- WebRTC requires secure contexts (HTTPS) in modern browsers, particularly for camera, microphone, or secure signaling over public pages.
- CPU usage must remain low to prevent visual frame stuttering.
- **WebRTC Networking Limits**: The game relies entirely on P2P DataChannels. Extensive testing confirms that players on enterprise/public Wi-Fi with "AP Isolation" or mobile data networks in LATAM with strict Deep Packet Inspection (DPI) and Symmetric NAT will permanently stall at connection. No amount of TURN/STUN configuration can bypass aggressive DPI WebRTC blocking. Players must use a VPN or switch to a standard residential Wi-Fi to play online.
