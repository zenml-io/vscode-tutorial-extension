# ZenML VS Code Tutorial Extension - Developer Guide

Development repository for contributors working on the ZenML VSCode Tutorial Extension.

<div style="display: flex; justify-content: center;">
  <img src=".devcontainer/assets/welcome-page.png" alt="Welcome page screenshot" width="1000" />
</div>

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/en/download/)
- [VS Code](https://code.visualstudio.com/Download)
- [Docker](https://www.docker.com/get-started/)
- [Dev Containers Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers)

### Setup

1. **Clone & install**:

   ```bash
   git clone https://github.com/zenml-io/vscode-tutorial-extension
   cd vscode-tutorial-extension
   npm install && npm run compile
   ```

2. **Open in VS Code** and reopen in dev container when prompted

3. **Test the extension**: Press `F5` or use Run and Debug panel → "Run Extension"

**⚠️ Important**: Always run in dev container - the extension expects this environment.

## 🛠️ Development Workflow

### Making Changes

The extension runs in two places:

- **Development** (this repo)
- **User-facing** ([vscode-tutorial repo](https://github.com/zenml-io/vscode-tutorial))

**After making changes**, you need to:

1. **Build extension**:

   ```bash
   npm run buildExtension
   ```

   _This packages the extension and replaces the current one in `.devcontainer/extensions/`_

2. **Test in user environment**: Test changes in both GitHub Codespaces and local dev containers

### File Structure

- **Extension code**: Main TypeScript files
- **Tutorial content**: `pipelines/` directory
- **Tutorial structure**: `tutorialMetadata.json`
- **Entry point**: `extension.ts` → `Tutorial` class

### Editing Content

**Quick text edits**:

- Uncomment the "edit text" button in WebView HTML
- Edit markdown files directly
- Save (`Cmd+S`) → Reload extension (`Cmd+R`)

**Adding/reorganizing steps**:

- Edit `tutorialMetadata.json`
- Each section has steps with optional `doc` (markdown) and `code` (Python) files

## 🐳 Docker Image

The user-facing repository uses a pre-built Docker image for faster startup.

**To update the image**:

1. Switch to `docker-image-build` branch
2. Build and push following [Docker's guide](https://docs.docker.com/guides/getting-started/build-and-push-first-image/)
3. Update `devcontainer.json` to reference new image: `"image": "zenml/tutorial:latest"`

## 📚 Resources

- [ZenML Documentation](https://docs.zenml.io/)
- [VS Code Extension API](https://code.visualstudio.com/api)
