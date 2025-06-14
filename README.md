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

## Usage

1. **Select text** on any webpage while holding your trigger key (Alt by default)
2. **View the explanation** in the floating box that appears
3. **Click the continue icon (↗)** to continue the conversation in the AI provider's chat interface

The extension analyzes the selected text in the context of the current webpage and provides relevant explanations.

## Configuration
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

We welcome contributions! Here's the development workflow:

### Getting Started

1. **Fork and Clone**
```bash
git clone https://github.com/your-username/enhance.git
cd enhance
npm install
```

2. **Create a Branch**
```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/your-bug-fix
```

### Development Process

1. **Make changes** to source files in `src/`
2. **Run build** with `npm run dev` (watches for changes)
3. **Load extension** in browser from `dist/` folder (see Loading the Extension above)
4. **Test changes** by reloading the extension
5. **Test thoroughly** - configure API keys, test text selection, verify functionality
6. **Run production build** with `npm run build` before committing

### Submit Changes

```bash
git add .
git commit -m "feat: add your feature description"
git push origin feature/your-feature-name
```

Then create a pull request with a clear description of your changes.

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

## Privacy & Security

- **Local Storage**: API keys are stored locally using browser's secure storage API
- **No Tracking**: No data is sent to external servers except your chosen AI provider
- **On-Demand**: Text selection and webpage context are only sent when you explicitly trigger an explanation
- **No Analytics**: No tracking or analytics are collected

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