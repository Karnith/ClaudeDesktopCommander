# MCP Server with SSE Support

This extension adds Server-Sent Events (SSE) support to the desktop-commander MCP server using the fastmcp library.

## What is SSE?

Server-Sent Events (SSE) is a server push technology enabling a client to receive automatic updates from a server via HTTP connection. Unlike WebSockets, SSE is a one-way communication channel - server to client only.

## Why use SSE for MCP?

SSE provides several advantages for MCP server implementations:

1. **Web Integration**: Makes the MCP server accessible via web browsers and HTTP clients
2. **Simplified Connectivity**: No need for direct access to stdin/stdout
3. **Multiple Clients**: Supports multiple simultaneous client connections
4. **Firewall Friendly**: Uses standard HTTP, so works through most firewalls

## Installation

```bash
npm install
npm run build
```

## Running the SSE Server

### Local Development

```bash
npm run start:sse
```

By default, the server runs on port 3000 with endpoint `/sse`.

You can customize the port and endpoint:

```bash
npm run start:sse -- --port=8080 --endpoint=/mcp
```

### Docker Deployment

The project includes Docker Compose configuration for easy deployment.

#### Production Deployment

```bash
# Build and start the container
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

#### Development Mode

Development mode includes volume mounts for live code updates and uses the watch script.

```bash
# Build and start in development mode
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Stop development container
docker-compose -f docker-compose.yml -f docker-compose.override.yml down
```

#### Customizing Docker Deployment

To use a different port or SSE endpoint, you can modify the docker-compose.yml:

```yaml
services:
  mcp-sse-server:
    ports:
      - "8080:3000"  # Map container port 3000 to host port 8080
    environment:
      - NODE_ENV=production
      - PORT=3000     # Port inside container
      - ENDPOINT=/mcp # Custom endpoint
```

## Connecting to the SSE Server

You can connect to the SSE server using the `SSEClientTransport` from the MCP SDK:

```javascript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

const client = new Client(
  {
    name: "example-client",
    version: "1.0.0",
  },
  {
    capabilities: {},
  },
);

const transport = new SSEClientTransport(new URL("http://localhost:3000/sse"));

await client.connect(transport);

// Now you can use the client to call tools
const listSessionsResult = await client.callTool("list_sessions", {});
console.log(listSessionsResult);
```

## Available Tools

The SSE server provides the same set of tools as the original desktop-commander MCP server:

### Terminal Tools

- `execute_command`: Execute a terminal command with timeout
- `read_output`: Read new output from a running terminal session
- `force_terminate`: Force terminate a running terminal session
- `list_sessions`: List all active terminal sessions
- `list_processes`: List all running processes
- `kill_process`: Terminate a running process by PID
- `block_command`: Add a command to the blacklist
- `unblock_command`: Remove a command from the blacklist
- `list_blocked_commands`: List all currently blocked commands

### Filesystem Tools

- `read_file`: Read the complete contents of a file from the file system
- `read_multiple_files`: Read the contents of multiple files simultaneously
- `write_file`: Completely replace file contents
- `create_directory`: Create a new directory or ensure a directory exists
- `list_directory`: Get a detailed listing of all files and directories
- `move_file`: Move or rename files and directories
- `search_files`: Recursively search for files and directories matching a pattern
- `get_file_info`: Retrieve detailed metadata about a file or directory
- `list_allowed_directories`: Returns the list of directories that this server is allowed to access
- `edit_block`: Apply surgical text replacements to files

## Implementation Details

This implementation uses fastmcp, a powerful TypeScript framework for building MCP servers capable of handling client sessions. The migration from the original StdioServerTransport to SSE maintains all the existing functionality while adding the ability to connect via HTTP. 