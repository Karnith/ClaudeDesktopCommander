#!/bin/bash

# Build the SSE server
echo "Building SSE server..."

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the TypeScript files
echo "Compiling TypeScript..."
npx tsc

# Make the server executable
chmod +x dist/sse-server.js

echo "Build complete!"
echo "Run the SSE server with: npm run start:sse"
echo "Or directly with: node dist/sse-server.js" 