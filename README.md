# LaunchPad 🚀

A sleek Chrome extension that displays upcoming rocket launches with real-time countdowns and alarm notifications.

![LaunchPad Screenshot](screenshots/screenshot.png)

## Features

- 📊 **Today's Launch Count**: See how many rockets are launching in the next 24 hours
- ⏱️ **Real-time Countdown**: Live countdown to each launch with smart time display
- 🔔 **Alarm Notifications**: Set alarms to get notified 1 hour before launch
- 📱 **Expandable Cards**: Click any launch to see detailed information
- 🎨 **SpaceX Console Style**: Beautiful dark theme inspired by mission control

## Installation

### From Chrome Web Store
(Coming soon)

### Manual Installation (Developer Mode)

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the `LaunchPad` folder
6. The extension icon will appear in your toolbar

## Usage

1. Click the LaunchPad icon in your Chrome toolbar
2. View upcoming launches with live countdowns
3. Click any launch card to expand and see details
4. Click "ALARM" to set a notification for 1 hour before launch
5. Click "DETAILS" to view more information on RocketLaunch.live

## Data Source

Launch data provided by [RocketLaunch.live](https://rocketlaunch.live/)

## Permissions

- `notifications`: To show alarm notifications
- `storage`: To save your alarm settings
- `alarms`: To schedule launch reminders
- `activeTab`: For extension functionality

## Development

### Project Structure

```
LaunchPad/
├── manifest.json      # Extension configuration
├── popup.html         # Popup UI
├── popup.js           # Popup logic
├── popup.css          # Styling
├── background.js      # Background service worker
├── icons/             # Extension icons
├── README.md          # This file
├── LICENSE            # MIT License
└── .gitignore         # Git ignore rules
```

### API

This extension uses the RocketLaunch.live JSON API:
- Endpoint: `https://fdo.rocketlaunch.live/json/launches/next/5`
- Returns: Next 5 upcoming launches with detailed information

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [RocketLaunch.live](https://rocketlaunch.live/) for providing the launch data API
- SpaceX for the inspiration behind the console UI design

---

**Enjoy tracking rocket launches!** 🚀
