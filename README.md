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

### 🔔 Automated Pipeline Health Checks

This repo has a GitHub Actions workflow ([`.github/workflows/test-pipelines.yml`](.github/workflows/test-pipelines.yml)) that keeps our example pipelines green against the **latest ZenML release**:

| What it does                                                                       | Process                                                                               |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| **Runs every 24 h at 09:00 UTC** (plus on every push / PR to `main` and `develop`) | Cron trigger: `0 9 * * *`                                                             |
| **Executes all tutorial pipelines** listed in the matrix                           | Each pipeline is run inside a fresh runner with ZenML upgraded to the newest version. |
| **Alerts our SREs on Discord ** if any pipeline fails                              | On failure the job posts an alert to **`#sre-alerts`** via `DISCORD_WEBHOOK_SRE`.     |

> The following repo secrets are set for the discord alerter:
> `DISCORD_TOKEN_SRE`, `DISCORD_SRE_CHANNEL_ID`, and `DISCORD_WEBHOOK_SRE`.

Keeping an eye on this channel lets us catch breaking changes in ZenML or our tutorial code before users do.

## 🐳 Docker Image

The user-facing repository uses a pre-built Docker image for faster startup.

**To update the image**:

1. Switch to `docker-image-build` branch
2. Build and push following [Docker's guide](https://docs.docker.com/guides/getting-started/build-and-push-first-image/)
3. Update `devcontainer.json` to reference new image: `"image": "zenml/tutorial:latest"`

## 📚 Resources

- [ZenML Documentation](https://docs.zenml.io/)
- [VS Code Extension API](https://code.visualstudio.com/api)
