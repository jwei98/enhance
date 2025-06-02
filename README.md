# Enhance - AI-Powered Text Explanation Extension

<div align="center">
  <img src="icons/icon-128.png" alt="Enhance Logo" width="128" height="128">
  
  **Instantly understand any text on the web with AI-powered explanations**
  
  [![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![WebExtensions](https://img.shields.io/badge/WebExtensions-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)
</div>

## Overview

Enhance is a browser extension that provides instant AI-powered explanations for any text you select on web pages. Simply hold a modifier key, select text, and get concise explanations powered by OpenAI or Anthropic's language models.

### ✨ Features

- **🎯 Smart Text Selection**: Hold Alt (or your preferred key) + select text to get instant explanations
- **🤖 Multiple AI Providers**: Support for OpenAI (GPT models) and Anthropic (Claude models)
- **🎨 Clean Interface**: Floating explanations with continue-to-chat functionality
- **🔧 Configurable**: Customizable trigger keys, response length, and context settings
- **🌐 Cross-Browser**: Works on Firefox and Chrome (via WebExtension polyfill)

## Installation

### For Users

#### Firefox
1. Download the latest release from the [Releases page](../../releases)
2. Open Firefox and go to `about:addons`
3. Click the gear icon and select "Install Add-on From File"
4. Select the downloaded `.xpi` file

#### Chrome
1. Download the latest release from the [Releases page](../../releases)
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extracted extension folder

### Configuration
1. Right-click the extension icon and select "Options"
2. Add your OpenAI or Anthropic API key
3. Choose your preferred model and settings
4. Test the API connection

## Development Setup

### Prerequisites

- **Node.js**: Version 16 or higher
- **npm**: Comes with Node.js
- **Git**: For version control

### Quick Start

```bash
# Clone the repository
git clone https://github.com/your-username/enhance.git
cd enhance

# Install dependencies
npm install

# Build for development (with watch mode)
npm run dev

# Build for production
npm run build

# Package for distribution
npm run package
```

### Project Structure

```
enhance/
├── src/                      # TypeScript source files
│   ├── background.ts         # Background script (API calls, message handling)
│   ├── content/
│   │   └── content.ts        # Content script (text selection, UI)
│   └── options/
│       └── options.ts        # Options page logic
├── options/                  # Options page files
│   ├── options.html          # Options page HTML
│   └── options.css           # Options page styles
├── content/
│   └── content.css           # Content script styles
├── icons/                    # Extension icons
├── dist/                     # Built extension (generated)
├── manifest.json             # Extension manifest
├── package.json              # Node.js dependencies and scripts
├── tsconfig.json             # TypeScript configuration
└── webpack.config.js         # Build configuration
```

### Development Workflow

1. **Make changes** to source files in `src/`
2. **Run build** with `npm run dev` (watches for changes)
3. **Load extension** in browser from `dist/` folder
4. **Test changes** by reloading the extension
5. **Run production build** with `npm run build` before committing

### Available Scripts

```bash
# Development
npm run dev          # Build with watch mode for development
npm run build        # Production build
npm run clean        # Clean dist directory

# Packaging
npm run package      # Create distributable .zip file

# Linting (if you add linting)
npm run lint         # Run ESLint
npm run lint:fix     # Fix linting issues automatically
```

### Loading the Extension

#### Firefox
1. Build the project: `npm run build`
2. Open Firefox and go to `about:debugging`
3. Click "This Firefox"
4. Click "Load Temporary Add-on"
5. Select any file in the `dist/` folder

#### Chrome
1. Build the project: `npm run build`
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `dist/` folder

### Testing

The extension can be tested manually by:

1. **Loading in browser** (see above)
2. **Configuring API keys** in the options page
3. **Testing text selection** on any webpage
4. **Verifying functionality** with different providers and models

## Usage

1. **Select text** on any webpage while holding your trigger key (Alt by default)
2. **View the explanation** in the floating box that appears
3. **Click the continue icon (↗)** to continue the conversation in the AI provider's chat interface

The extension analyzes the selected text in the context of the current webpage and provides relevant explanations.

## Architecture

### Core Components

- **Background Script** (`src/background.ts`): Handles API calls, manages settings, processes requests
- **Content Script** (`src/content/content.ts`): Manages text selection, floating UI, user interactions
- **Options Page** (`src/options/options.ts`): Settings management, API testing, provider configuration

### Key Features

- **Provider System**: Scalable architecture for adding new AI providers
- **Type Safety**: Full TypeScript implementation with strict typing
- **Cross-Browser**: WebExtension polyfill for Chrome compatibility

## Contributing

We welcome contributions! Here's how to get started:

### 1. Fork and Clone

```bash
git clone https://github.com/your-username/enhance.git
cd enhance
```

### 2. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### 3. Set Up Development

```bash
npm install
npm run dev  # Start development build with watch mode
```

### 4. Make Changes

- Follow the existing code style and patterns
- Add TypeScript types for new functionality
- Test your changes thoroughly
- Update documentation if needed

### 5. Test Your Changes

```bash
# Build and test in browser
npm run build

# Load extension in Firefox/Chrome
# Test functionality with different providers
# Verify options page works correctly
```

### 6. Commit and Push

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

### 7. Create Pull Request

- Open a pull request against the main branch
- Describe your changes clearly
- Include screenshots if UI changes are involved

### Development Guidelines

- **Code Style**: Follow the existing TypeScript patterns
- **Type Safety**: Add proper TypeScript types for all new code
- **Browser Compatibility**: Test on both Firefox and Chrome
- **Provider Pattern**: When adding new AI providers, follow the existing provider configuration pattern
- **Error Handling**: Include proper error handling and user feedback
- **Performance**: Minimize impact on page load and user experience

### Adding New AI Providers

To add support for a new AI provider:

1. **Update Provider Configuration** in `src/background.ts`:
```typescript
providers = {
  // ... existing providers
  newProvider: {
    name: "New Provider",
    apiUrl: "https://api.newprovider.com/v1/chat",
    defaultModel: "new-model-v1",
    handler: this.callNewProvider.bind(this),
  }
}
```

2. **Implement API Handler**:
```typescript
async callNewProvider(prompt: string, settings: Settings): Promise<string> {
  // Implementation for new provider's API
}
```

3. **Update Settings Interface** to include API key property
4. **Add UI Elements** in options page for the new provider
5. **Test thoroughly** with the new provider

## API Providers

### OpenAI
- **Models**: GPT-4o, GPT-4 Turbo, GPT-3.5 Turbo
- **Cost**: Pay per token usage
- **API Key**: Get at [platform.openai.com/api-keys](https://platform.openai.com/api-keys)

### Anthropic
- **Models**: Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku
- **Cost**: Pay per token usage  
- **API Key**: Get at [console.anthropic.com/account/keys](https://console.anthropic.com/account/keys)

## Privacy & Security

- **Local Storage**: API keys are stored locally using browser's secure storage API
- **No Tracking**: No data is sent to external servers except your chosen AI provider
- **On-Demand**: Text selection and webpage context are only sent when you explicitly trigger an explanation
- **No Analytics**: No tracking or analytics are collected

## Troubleshooting

### Common Issues

**"No API key configured" error:**
- Go to extension options and configure your API key

**"API request failed" error:**
- Check your API key is valid and has credits
- Verify you selected the correct provider and model
- Test the connection in options page

**Floating box doesn't appear:**
- Make sure you held the trigger key while selecting text
- Check if the website blocks extension scripts
- Try refreshing the page

**Models not loading:**
- Check your API key is valid
- Ensure you have an active internet connection
- Try refreshing the options page

### Browser Console Logs
Open browser console (F12) to see detailed error messages and debug information.

## Browser Compatibility

✅ **Firefox** - Native support (Manifest V2)  
✅ **Chrome** - Supported via WebExtension polyfill  
✅ **Edge** - Should work (Chromium-based)  
✅ **Opera** - Should work (Chromium-based)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- **Issues**: Report bugs and request features via [GitHub Issues](../../issues)
- **Discussions**: Join discussions in [GitHub Discussions](../../discussions)

## Acknowledgments

- Built with [WebExtensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)
- Powered by [OpenAI](https://openai.com/) and [Anthropic](https://www.anthropic.com/) APIs
- TypeScript build system with [Webpack](https://webpack.js.org/)
- Cross-browser compatibility via [webextension-polyfill](https://github.com/mozilla/webextension-polyfill)