#!/bin/bash

# MCP SSE Server Docker Deployment Script

# Load environment variables from .env file if it exists
if [ -f .env ]; then
  echo "Loading environment variables from .env file"
  export $(grep -v '^#' .env | xargs)
fi

# Default values
MODE="prod"
ACTION="up"

# Display help
function show_help {
  echo "Usage: ./deploy.sh [OPTIONS]"
  echo ""
  echo "Options:"
  echo "  -m, --mode <prod|dev>     Set the deployment mode (default: prod)"
  echo "  -a, --action <up|down>    Set the action to perform (default: up)"
  echo "  -p, --port <port>         Set the port to use (default: 3337)"
  echo "  -e, --endpoint <endpoint> Set the SSE endpoint (default: /sse)"
  echo "  -d, --detach              Run in detached mode (background)"
  echo "  -h, --help                Show this help message"
  echo ""
  echo "Examples:"
  echo "  ./deploy.sh                      # Start production server"
  echo "  ./deploy.sh -m dev               # Start development server"
  echo "  ./deploy.sh -a down              # Stop production server"
  echo "  ./deploy.sh -m dev -a down       # Stop development server"
  echo "  ./deploy.sh -p 8080 -e /mcp -d   # Start production server on port 8080 with /mcp endpoint in detached mode"
}

# Parse arguments
DETACH=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    -m|--mode)
      MODE="$2"
      shift 2
      ;;
    -a|--action)
      ACTION="$2"
      shift 2
      ;;
    -p|--port)
      export PORT="$2"
      shift 2
      ;;
    -e|--endpoint)
      export ENDPOINT="$2"
      shift 2
      ;;
    -d|--detach)
      DETACH="-d"
      shift
      ;;
    -h|--help)
      show_help
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      show_help
      exit 1
      ;;
  esac
done

# Validate mode
if [[ "$MODE" != "prod" && "$MODE" != "dev" ]]; then
  echo "Error: Mode must be either 'prod' or 'dev'"
  exit 1
fi

# Validate action
if [[ "$ACTION" != "up" && "$ACTION" != "down" ]]; then
  echo "Error: Action must be either 'up' or 'down'"
  exit 1
fi

# Set the compose command based on mode
if [[ "$MODE" == "dev" ]]; then
  COMPOSE_CMD="docker compose -f docker-compose.yml -f docker-compose.override.yml"
else
  COMPOSE_CMD="docker compose"
fi

# Print configuration
echo "==== Configuration ===="
echo "Mode: $MODE"
echo "Action: $ACTION"
echo "Port: ${PORT:-3337}"
echo "Endpoint: ${ENDPOINT:-/sse}"
echo "======================="

# Execute the action
if [[ "$ACTION" == "up" ]]; then
  echo "Starting MCP SSE Server in $MODE mode..."
  $COMPOSE_CMD up --build $DETACH
elif [[ "$ACTION" == "down" ]]; then
  echo "Stopping MCP SSE Server in $MODE mode..."
  $COMPOSE_CMD down
fi 