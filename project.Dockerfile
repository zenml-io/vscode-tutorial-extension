ARG ZENML_VERSION=latest
ARG PROJECT_DIR_NAME

FROM zenmldocker/zenml-codespace:${ZENML_VERSION}

# Set build arguments again for use in subsequent commands
ARG PROJECT_DIR_NAME

# Set the working directory for the project
WORKDIR /home/coder/extensions/zenml.zenml-codespace-tutorial-0.0.1/pipelines

# Copy the specific project's requirements file
COPY ./${PROJECT_DIR_NAME}/requirements.txt /tmp/requirements.txt

# Install project-specific dependencies using uv for faster installation
RUN uv pip install --system --no-cache -r /tmp/requirements.txt && \
    rm /tmp/requirements.txt


# Enable tutorial content for this specific project
ENV ZENML_ENABLE_TUTORIAL=true

# Default command can be overridden in docker run or docker-compose
# CMD ["python", "run.py"] # Or your project's typical entrypoint 