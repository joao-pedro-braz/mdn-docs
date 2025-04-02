# MDN Docs for JSX/TSX

## Overview
MDN Docs is a Visual Studio Code extension that provides instant MDN (Mozilla Developer Network) documentation when hovering over HTML elements and attributes in your JSX/TSX files. It helps React developers quickly access web documentation without leaving their editor.

## Features
- Displays MDN documentation for JSX elements (like `<div>`, `<span>`, etc.)
- Shows information for global HTML attributes (like `id`, `class`, `style`)
- Provides documentation for element-specific attributes
- Caches documentation locally for fast access and offline use
- Works with both JavaScript React (.jsx) and TypeScript React (.tsx) files

## How It Works
The extension detects when you're hovering over JSX elements or attributes, queries the TypeScript language server to determine what you're hovering over, then fetches and displays relevant documentation from MDN.

## Installation
1. Open VS Code
2. Go to Extensions (Ctrl+Shift+X)
3. Search for "MDN Docs for JSX/TSX"
4. Click Install

Or install using the VS Code Quick Open (Ctrl+P):
```
ext install josaid.mdn-docs
```

## Requirements
- Visual Studio Code 1.98.0 or newer

## Usage
Simply hover over any HTML element or attribute in your JSX/TSX files:

- Hover over a tag name (like `<div>`) to see element documentation
- Hover over an attribute (like `className` or `onClick`) to see attribute documentation

The extension activates automatically for files with `.jsx` and `.tsx` extensions.

## Development
Want to contribute to the extension?

### Prerequisites
- Node.js
- npm
- Git
- VS Code

### Setting Up Development Environment
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mdn-docs.git
   cd mdn-docs
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Build the extension:
   ```
   npm run compile
   ```

4. Launch in debug mode:
   - Press F5 in VS Code to launch a new window with your extension loaded
   - Create/open a JSX/TSX file and hover over an element or attribute

### Development Commands
- `npm run watch` - Auto-compile changes during development
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run package` - Package the extension for distribution

## Contributing
Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-update`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-update`)
5. Open a Pull Request

## Resources
- [MDN Web Docs](https://developer.mozilla.org/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [React Documentation](https://reactjs.org/docs/getting-started.html)

## License
This project is licensed under the MIT License - see the LICENSE file for details.
