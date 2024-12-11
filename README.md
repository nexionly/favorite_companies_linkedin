# Favorite Companies - Chrome Extension

A Chrome extension that helps you save and organize companies you want to have quick access to on LinkedIn. Save companies directly from LinkedIn, including their descriptions and logos, and export your list whenever needed.

## Features

- Save companies directly from LinkedIn company pages
- Automatically captures company descriptions and logos
- Export your saved companies to CSV
- Import previously exported companies
- Clean and simple interface

## Installation Instructions

### Local Installation (Developer Mode)
1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" by toggling the switch in the top right corner
4. Click "Load unpacked" button in the top left
5. Navigate to and select the folder containing the extension files
6. The extension should now appear in your Chrome toolbar

### Using the Extension
1. Visit any LinkedIn company page
2. Click the extension icon in your Chrome toolbar
3. Click the "+" button to save the company
4. View your saved companies in the extension popup
5. Use the Export button to save your list as CSV
6. Use the Import button to restore a previously exported list

## Files Structure
```
favorite-companies/
├── icons/
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── heart24.png
├── popup.html
├── popup.js
├── styles.css
└── manifest.json
```

## Permissions Required
- `storage`: To save companies locally
- `activeTab`: To access the current LinkedIn page
- `scripting`: To extract company information

## Development
To modify the extension:
1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Your changes will be immediately reflected

## License
[MIT License](LICENSE)

Made with Love by [Tomas Williams](https://www.linkedin.com/in/tomaswilliamsa/) ❤️
