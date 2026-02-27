# 🌸 Daily Quote Widget

A lightweight always-on-screen daily inspirational quote widget for macOS, built with Electron. Styled with a soft pink theme.

## Features

- 🌸 Soft pink aesthetic — light pink background with dark pink text
- 📌 Always-on-top floating widget, visible across all Spaces and even in full-screen apps
- 🗓️ One new quote per day, persisted locally — same quote all day, every day
- 🔄 Automatically refreshes at midnight without any user action
- 🖱️ Draggable — reposition anywhere on screen
- 🔔 Tray icon — right-click to show/hide, preview a random quote, or quit
- 💾 Quote stored locally in `~/.daily-quote-widget/quote-data.json`

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or later)
- macOS

### Install & Run

```bash
# Install dependencies
npm install

# Run the app
npm start
```

### Build a distributable .app

```bash
npm run build
```

The built `.dmg` and `.app` will be in the `dist/` folder.

## Usage

- **Drag** the widget anywhere on screen by clicking and dragging the top bar
- **Close (×)** button hides the widget to the tray (doesn't quit)
- **Tray icon** (menubar) — click to show/hide, right-click for options:
  - Preview a random quote
  - Reset to today's quote
  - Quit the app

## Customization

Add your own quotes to the `QUOTES` array in `main.js`:

```js
{ text: "Your quote here.", author: "Author Name" }
```

## File Structure

```
daily-quote-widget/
├── main.js          # Main Electron process (quote logic, window, tray)
├── preload.js       # Secure IPC bridge between main and renderer
├── renderer/
│   └── index.html   # The visible widget UI
├── package.json
└── README.md
```
