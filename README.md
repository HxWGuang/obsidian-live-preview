# Obsidian Live Preview

[English](README.md) | [简体中文](README.zh-CN.md)

A live HTML preview plugin for [Obsidian](https://obsidian.md), inspired by VSCode's Live Preview. It starts a local HTTP server, serves your HTML files with auto-reload on save, and provides an embedded preview panel inside Obsidian — plus the ability to open in your system browser.

## Features

- **Local HTTP Server** — Serves `.html` files from their parent directory, so relative paths, CSS, JS, fonts, and images all work correctly.
- **Auto-Reload on Change** — Uses WebSocket to push reload signals to the browser. Edit your HTML (or linked CSS/JS), and the preview refreshes automatically within ~300ms.
- **Embedded Preview Panel** — A dedicated Obsidian pane (right sidebar or any split) renders your HTML in an iframe pointed at the local server.
- **Open in Browser** — One command to open the current preview in your system's default browser.
- **Path Traversal Protection** — The server only serves files within the chosen directory. Requests attempting directory escape are rejected.
- **Port Auto-Increment** — If the configured port is busy, the server automatically tries the next available port.

## Installation

### From Obsidian Community Plugins

*Coming soon — pending submission to the Obsidian plugin directory.*

### Manual Installation

1. Download the latest release from [Releases](https://github.com/HxWGuang/obsidian-live-preview/releases).
2. Extract the files into `<vault>/.obsidian/plugins/obsidian-live-preview/`.
3. Reload Obsidian (`Cmd/Ctrl + R`).
4. Go to **Settings → Community plugins → Installed plugins** and enable **Live Preview**.

### From Source (BRAT)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
2. In BRAT settings, add this repository: `HxWGuang/obsidian-live-preview`.
3. Enable the plugin in Community plugins.

## Usage

1. Open any `.html` or `.htm` file in your vault — the preview starts automatically in the right sidebar.
2. Edit the file. The preview refreshes automatically.
3. Use the command palette (`Cmd/Ctrl + P`):
   - **Start Live Preview** — Manually start the preview for the active HTML file.
   - **Stop Live Preview** — Shut down the local server.
   - **Open Preview in Browser** — Open the current preview page in your system browser.

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| **Port** | `5500` | Starting port for the local HTTP server. Auto-increments if busy. |
| **Debounce delay** | `300` ms | Delay after a file change before the preview refreshes. |

## Security

- The HTTP server binds to `127.0.0.1` (localhost only) — no external network access.
- Only whitelisted static file extensions are served (`.html`, `.css`, `.js`, images, fonts, etc.).
- Path traversal attempts (e.g., `../../../`) are blocked at the server level.
- The embedded preview uses an iframe with `sandbox` attributes for isolation.

## Development

```bash
# Clone the repository
git clone https://github.com/HxWGuang/obsidian-live-preview.git
cd obsidian-live-preview

# Install dependencies
npm install

# Build
npm run build

# Copy to your vault for testing
cp main.js manifest.json styles.css /path/to/vault/.obsidian/plugins/obsidian-live-preview/
```

## Tech Stack

- **Language**: TypeScript
- **Bundler**: esbuild
- **WebSocket**: ws
- **Platform**: Obsidian Plugin API, Node.js http module
- **Minimum Obsidian Version**: 0.15.0
- **Desktop Only** (uses Node.js built-in modules for the HTTP server)

## License

[MIT](LICENSE)

## Author

**HxGuang** — [GitHub](https://github.com/HxWGuang)
