#!/bin/bash

# Stop and remove any existing container with the same name
echo "Cleaning up any existing containers..."
docker rm -f mcp-sse-server 2>/dev/null || true

# Remove existing image
echo "Removing existing image if any..."
docker rmi -f mcp-sse-server 2>/dev/null || true

# Build the image with no cache
echo "Building Docker image from scratch..."
docker build --no-cache -t mcp-sse-server .

# Run the container
echo "Running container..."
docker run --name mcp-sse-server \
  --rm \
  -p 3337:3337 \
  -e PORT=3337 \
  -e ENDPOINT=/sse \
  -e HOST=0.0.0.0 \
  -v "$(pwd)/config.json:/app/config.json" \
  mcp-sse-server

# You can test the server with curl:
# curl -N http://localhost:3337/sse 