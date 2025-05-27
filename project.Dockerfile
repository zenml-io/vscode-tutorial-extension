# Build argument for the ZenML version, passed by the process_projects.py script
ARG ZENML_VERSION

# Use the pre-built zenml-codespace image which includes code-server and base extensions
FROM zenmldocker/zenml-codespace:${ZENML_VERSION}

# Switch to root user for installations.
# The zenml-codespace image's entrypoint script (likely /code-server.sh via dumb-init)
# should handle final user context (e.g., via fixuid).
USER root

# --- Project-specific additions for VSCode Tutorial Extension ---

# Install Node.js (using NodeSource for a specific version) and other tools if missing
ARG NODE_MAJOR_VERSION=20
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    gnupg \
    && curl -fsSL https://deb.nodesource.com/setup_${NODE_MAJOR_VERSION}.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install vsce (for packaging VS Code extensions) globally
RUN npm install -g @vscode/vsce

# The zenml-codespace image should already set WORKDIR to /home/coder/workspace.
# If not, or to be explicit:
WORKDIR /home/coder/workspace

# Copy Python requirements for the extension project (if any).
# The base image might have its own way of handling Python dependencies,
# but this allows project-specific ones.
COPY requirements.txt .
RUN if [ -f requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Copy the VS Code extension project source code into the workspace
COPY . .

# Build and package the VS Code extension
# Install npm dependencies (respecting package-lock.json if present)
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Run build/compile scripts if defined in package.json
# jq should be available from the zenml-codespace base image (as it's in base-codespace.Dockerfile)
RUN if [ -n "$(jq -r '.scripts."vscode:prepublish" // empty' package.json)" ]; then \
        echo "Running vscode:prepublish script via npm run..."; \
        npm run vscode:prepublish; \
    elif [ -n "$(jq -r '.scripts.compile // empty' package.json)" ]; then \
        echo "Running compile script..."; \
        npm run compile; \
    elif [ -n "$(jq -r '.scripts.build // empty' package.json)" ]; then \
        echo "Running build script..."; \
        npm run build; \
    else \
        echo "No explicit compile/build/vscode:prepublish script found. 'vsce package' will handle packaging."; \
    fi
RUN vsce package --out extension.vsix --no-dependencies

# Install the packaged tutorial extension into code-server's existing extension directory.
# The `code-server` command and its extension directory (/opt/code-server/extensions)
# are expected to be set up by the zenml-codespace base image.
RUN code-server --install-extension /home/coder/workspace/extension.vsix --force

# --- End Project-specific additions ---

# Enable tutorial content for this specific project
ENV ZENML_ENABLE_TUTORIAL=true

# The CMD should be inherited from the zenmldocker/zenml-codespace base image,
# which is responsible for starting code-server correctly.
# No explicit CMD or USER change back is needed here, assuming the base image's entrypoint handles it. 