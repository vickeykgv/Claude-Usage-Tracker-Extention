# Claude Usage Tracker Extension

<div align="center">

**Track your Claude API usage limits in real-time directly from your browser.**

[![version](https://img.shields.io/badge/version-4.0.0-brightgreen)]()
[![Chrome](https://img.shields.io/badge/Chrome-Extension-blue)]()
[![License](https://img.shields.io/badge/license-MIT-green)]()

[Features](#features) • [Installation](#installation) • [How It Works](#how-it-works) • [Usage](#usage) • [Contributing](#contributing)

</div>

---

## Overview

Claude Usage Tracker is a lightweight Chrome extension that monitors your Claude.ai subscription usage limits in real-time. Instantly check your token usage, rate limits, and reset times without leaving your browser tab.

**Perfect for:** Claude API users, Claude.ai subscribers, and development teams tracking consumption patterns.

---

## Features

✨ **Real-Time Usage Monitoring**
- View current usage percentages for multiple rate limit windows
- Track 5-hour, 7-day, and other usage windows simultaneously

🎨 **Beautiful, Minimal UI**
- Clean popup interface with visual progress bars
- Color-coded status indicators (green ✓, yellow ⚠, red ✗)
- Grid-based design with Space Grotesk typography

⚡ **Smart Caching**
- Caches usage data for quick access
- One-click refresh button to fetch latest stats
- Automatic timestamp tracking

🔐 **Privacy-First Design**
- No data sent to external servers
- Works directly with Claude.ai API
- Credentials handled securely via browser's `include` mode

📊 **Multiple Usage Windows**
- Monitor different rate limit windows simultaneously
- Shows reset time for each limit
- Flexible data format support

---

## Installation

### For Users (Coming Soon to Chrome Web Store)

The extension is currently in development. To use it:

1. Download or clone this repository
2. Navigate to `chrome://extensions/` in your browser
3. Enable **"Developer mode"** (top-right toggle)
4. Click **"Load unpacked"**
5. Select the `claude-usage-chrome/` folder
6. The extension will appear in your toolbar

### For Developers

See [Setup Instructions](claude-usage-chrome/setup.md) for development environment setup.

---

## How It Works

### Architecture

The extension uses a three-component architecture:

```
┌─────────────────────────────────────────────┐
│         Chrome Extension Popup              │
│      (popup.html + popup.js)                │
│  Displays usage UI & manages state          │
└────────────────┬────────────────────────────┘
                 │ Message Passing
                 ▼
┌─────────────────────────────────────────────┐
│    Content Script (content.js)              │
│    Runs on claude.ai domain                 │
│  • Detects organization ID                  │
│  • Fetches /api/organizations/{orgId}/usage │
└────────────────┬────────────────────────────┘
                 │ CORS-safe, same-origin
                 ▼
┌─────────────────────────────────────────────┐
│         Claude.ai API                       │
│   /api/organizations/{orgId}/usage          │
│  Returns usage data & reset times           │
└─────────────────────────────────────────────┘
```

### Key Components

| File | Purpose |
|------|---------|
| `manifest.json` | Extension metadata & permissions |
| `popup.html` | UI layout with styling |
| `popup.js` | UI logic & data rendering |
| `content.js` | API communication & org ID detection |
| `background.js` | Service worker for caching |

### How Organization ID Detection Works

The extension intelligently locates your Claude organization ID from:
1. Browser cookies (`lastActiveOrg`)
2. LocalStorage entries
3. Next.js page data (`window.__NEXT_DATA__`)

This allows it to work across different Claude.ai pages without manual configuration.

---

## Usage

### Opening the Extension

1. Click the extension icon in your Chrome toolbar
2. A popup appears showing your current usage

### Reading the Display

- **Usage Percentage**: Shows how much of your limit is consumed (color-coded)
- **Progress Bar**: Visual representation of usage
- **Reset Time**: When your limit resets (e.g., "in 2h 34m")
- **Status Dot**: Green = connected, Red = error
- **Timestamp**: When the data was last updated

### Actions

- **Refresh Button** (⟳): Fetch the latest usage data
- **Click to Visit**: Clicking the popup opens claude.ai (planned feature)

---

## Data Explained

The extension displays multiple usage windows, typically:

| Window | Description |
|--------|-------------|
| **5-hour window** | Short-term rate limit |
| **7-day window** | Medium-term subscription limit |
| **Opus window** (if applicable) | Model-specific limits |

Each shows:
- Current utilization percentage
- Time until reset
- Color indicator (🟢 safe, 🟡 caution, 🔴 critical)

---

## Development

### Project Structure

```
claude-usage-chrome/
├── manifest.json       # Extension configuration
├── popup.html          # UI markup
├── popup.js            # UI controller
├── content.js          # Claude.ai API client
├── background.js       # Service worker
├── setup.md            # Dev setup guide
└── icon*.png          # Extension icons
```

### Building from Source

1. Clone the repository
2. Make changes to files in `claude-usage-chrome/`
3. Reload the extension in `chrome://extensions/`
4. Test functionality on [claude.ai](https://claude.ai)

### Key Technologies

- **Chrome Extensions API** (Manifest V3)
- **Web Storage API** for caching
- **Fetch API** for HTTP requests
- **Vanilla JavaScript** (no dependencies)

---

## Troubleshooting

### Extension shows "Not logged in" or "No organization"

**Solution:**
- Ensure you're logged into [Claude.ai](https://claude.ai)
- Visit any Claude chat page to establish organization context
- Click the refresh button in the extension

### Usage data doesn't update

**Solution:**
- Click the refresh button (⟳)
- Check your internet connection
- Verify you're logged into Claude.ai
- Ensure you have an active subscription

### Extension appears broken or displays errors

**Solution:**
- Reload the extension from `chrome://extensions/`
- Clear browser cache: `Ctrl+Shift+Delete`
- Re-add the extension using "Load unpacked"

---

## Permissions Explained

The extension requests these permissions:

| Permission | Why |
|-----------|-----|
| `storage` | Cache usage data for quick access |
| `scripting` | (Reserved for future features) |
| `tabs` | Detect which tab is Claude.ai |
| `https://claude.ai/*` | Access Claude.ai API endpoints |

**Privacy note:** The extension only reads data from Claude.ai that you already have access to. No data is sent to third-party servers.

---

## Contributing

Contributions are welcome! To help improve Claude Usage Tracker:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your improvements
4. Commit with clear messages (`git commit -m 'Add amazing feature'`)
5. Push to your branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Ideas for Contribution

- [ ] Add notifications for usage thresholds
- [ ] Export usage history as CSV
- [ ] Support for other Claude platforms
- [ ] Multi-organization support
- [ ] Dark/light theme toggle
- [ ] Usage analytics dashboard
- [ ] Browser storage visualization

---

## Roadmap

- [x] Real-time usage tracking
- [x] Multi-window support
- [ ] Notification alerts for high usage
- [ ] Historical usage tracking
- [ ] Chrome Web Store publication
- [ ] Firefox extension support
- [ ] Usage trend analytics

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

Found a bug or have a suggestion?

- **Issues**: Create an issue on the repository
- **Discussions**: Open a discussion for feature requests
- **Email**: Contact the maintainer

---

## Credits

**Claude Usage Tracker** is crafted with ❤️ by the vikkiverse team.

Built with:
- [Chrome Extensions API](https://developer.chrome.com/docs/extensions/)
- [Space Grotesk Font](https://fonts.google.com/specimen/Space+Grotesk)

---

## Disclaimer

This extension is not affiliated with or endorsed by Anthropic. Claude is a trademark of Anthropic, Inc. This tool is created independently to help users monitor their API usage.

---

**⭐ If you find this extension helpful, please consider starring the repository!**
