# Enhance Browser Extension

A cross-browser extension (Firefox & Chrome) that allows you to select text on any webpage and get AI-powered explanations in context using OpenAI or Anthropic APIs.

## Features

- 🔍 Select any text on a webpage and get instant explanations
- 🤖 Support for multiple AI providers (OpenAI GPT, Anthropic Claude)
- 🎯 Context-aware explanations that consider the webpage content
- ⚙️ Easy configuration through extension options
- 🔒 Secure local storage of API keys

## Browser Compatibility

✅ **Firefox** - Native support  
✅ **Chrome** - Supported via WebExtension polyfill  
✅ **Edge** - Should work (same engine as Chrome)  
✅ **Opera** - Should work (Chromium-based)

The extension uses the WebExtension polyfill to ensure compatibility across all major browsers while maintaining a single codebase.

## Setup Instructions

### 1. Install Dependencies and Build

```bash
npm install
npm run build
```

This will compile the TypeScript source files and create a `dist/` directory with the built extension.

### 2. Install the Extension

#### Development Installation:

**Firefox:**
1. Open Firefox and navigate to `about:debugging`
2. Click "This Firefox" in the left sidebar
3. Click "Load Temporary Add-on"
4. Select the `manifest.json` file from the `dist/` directory

**Chrome:**
1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked"
4. Select the `dist/` directory (containing the built extension)

#### Production Installation:
1. Package the extension: `npm run package`
2. Install the generated package file

### 3. Development Workflow

For development with automatic rebuilding:

```bash
npm run dev
```

This runs webpack in watch mode, automatically recompiling when you change TypeScript files.

### 4. Configure API Access

1. Click the extension icon or go to Add-ons → In-Context Lookup → Options
2. Choose your preferred AI provider:
   - **OpenAI**: Get API key from [platform.openai.com](https://platform.openai.com/api-keys)
   - **Anthropic**: Get API key from [console.anthropic.com](https://console.anthropic.com/account/keys)
3. Enter your API key and select a model
4. Test the connection to ensure everything works

## Usage

1. **Select text** on any webpage
2. **Click the floating "🔍 Explain" button** that appears
3. **View the explanation** in the modal popup

The extension will analyze the selected text in the context of the current webpage and provide relevant explanations.

## File Structure

```
/
├── src/                      # TypeScript source files
│   ├── background.ts         # Background script for API calls
│   ├── content/
│   │   └── content.ts        # Content script for UI and text selection
│   └── options/
│       └── options.ts        # Options page functionality
├── dist/                     # Built extension (generated)
├── content/
│   └── content.css           # Styles for floating button and modal
├── options/
│   ├── options.html          # Options page HTML
│   └── options.css           # Options page styles
├── icons/                    # Extension icons (16px, 48px, 128px)
├── manifest.json             # Extension manifest
├── package.json              # Node.js dependencies and build scripts
├── tsconfig.json             # TypeScript configuration
└── webpack.config.js         # Build configuration
```

## API Providers

### OpenAI
- Models: GPT-3.5 Turbo, GPT-4, GPT-4 Turbo
- Cost: Pay per token usage
- Sign up: [platform.openai.com](https://platform.openai.com)

### Anthropic
- Models: Claude 3 Haiku, Sonnet, Opus
- Cost: Pay per token usage  
- Sign up: [console.anthropic.com](https://console.anthropic.com)

## Privacy & Security

- API keys are stored locally using Firefox's secure storage API
- No data is sent to external servers except your chosen AI provider
- Text selection and webpage context are only sent when you explicitly click "Explain"
- No tracking or analytics

## Development

### Prerequisites
- Firefox 88+ (for Manifest V2 support)
- Web Extensions API knowledge

### Local Development
1. Clone this repository
2. Add icon files to `icons/` directory
3. Load as temporary add-on in Firefox
4. Make changes and reload the extension

### Testing
1. Configure API keys in options
2. Use the "Test API Connection" button
3. Try selecting text on various websites
4. Check browser console for any errors

## Troubleshooting

### Common Issues

**"No API key configured" error:**
- Go to extension options and configure your API key

**"API request failed" error:**
- Check your API key is valid and has credits
- Verify you selected the correct provider and model
- Test the connection in options page

**Floating button doesn't appear:**
- Make sure you've selected enough text (minimum 10 characters)
- Check if the website blocks extension scripts
- Try refreshing the page

**Modal doesn't show:**
- Check browser console for JavaScript errors
- Ensure content script loaded properly
- Try reloading the extension

### Browser Console Logs
Open browser console (F12) to see detailed error messages and debug information.

## License

MIT License - feel free to modify and distribute.