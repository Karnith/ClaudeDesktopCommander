#!/bin/bash

# Test connection to the SSE server
PORT=${PORT:-3337}
ENDPOINT=${ENDPOINT:-/sse}
HOST=${HOST:-localhost}

# Clean up endpoint (remove Git Bash path prefix if present)
if [[ "$ENDPOINT" == *"/Program Files/Git/"* ]]; then
  ENDPOINT=$(echo "$ENDPOINT" | sed 's|.*/Program Files/Git/||')
  # Ensure it starts with a slash
  if [[ "$ENDPOINT" != /* ]]; then
    ENDPOINT="/$ENDPOINT"
  fi
fi

echo "Testing connection to SSE server at http://$HOST:$PORT$ENDPOINT"
echo "This should connect and wait for events. Press Ctrl+C to exit."
echo "If you see 'curl: (52) Empty reply from server', the server is not accepting connections."
echo "----------------------------------------"

# Use curl in a way that doesn't disconnect immediately (-N)
curl -N http://$HOST:$PORT$ENDPOINT 