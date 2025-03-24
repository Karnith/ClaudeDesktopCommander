#!/usr/bin/env node

import { startServer } from "./fastmcp-server.js";
import { commandManager } from "./command-manager.js";

async function runServer() {
  try {
    // Handle uncaught exceptions
    process.on("uncaughtException", (error) => {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error(`Uncaught exception: ${errorMessage}`);
      // Don't exit for client disconnection errors
      if (errorMessage.includes("Connection closed")) {
        console.log("Client disconnected from SSE stream");
      } else {
        process.exit(1);
      }
    });

    // Handle unhandled rejections
    process.on("unhandledRejection", (reason) => {
      const errorMessage =
        reason instanceof Error ? reason.message : String(reason);

      // Don't exit for client disconnection errors
      if (errorMessage.includes("Connection closed")) {
        console.log("Client disconnected from SSE stream");
        return;
      }

      // If error contains McpError with Connection closed, it's a client disconnect
      if (
        errorMessage.includes("McpError") &&
        errorMessage.includes("Connection closed")
      ) {
        console.log("Client disconnected from SSE stream");
        return;
      }

      console.error(`Unhandled rejection: ${errorMessage}`);
      process.exit(1);
    });

    // Load blocked commands from config file
    await commandManager.loadBlockedCommands();

    // Get port from arguments or environment variables
    const portArg = process.argv.find((arg) => arg.startsWith("--port="));
    const portEnv = process.env.PORT;
    const port = portArg
      ? parseInt(portArg.split("=")[1], 10)
      : portEnv
      ? parseInt(portEnv, 10)
      : 3000;

    // Get endpoint from arguments or environment variables
    const endpointArg = process.argv.find((arg) =>
      arg.startsWith("--endpoint=")
    );
    const endpointEnv = process.env.ENDPOINT;

    // Fix for Windows Git Bash path issues
    let endpoint = endpointArg
      ? endpointArg.split("=")[1]
      : endpointEnv || "/sse";

    // Remove any Git Bash path prefixes (like /c:/Program Files/Git/)
    if (endpoint.includes("/Program Files/Git/")) {
      endpoint = endpoint.substring(
        endpoint.lastIndexOf("/Program Files/Git/") +
          "/Program Files/Git/".length
      );
    }

    // Ensure endpoint starts with a slash but doesn't include Git paths
    if (!endpoint.startsWith("/")) {
      endpoint = `/${endpoint}`;
    }

    // Get host from arguments or environment variables
    const hostArg = process.argv.find((arg) => arg.startsWith("--host="));
    const hostEnv = process.env.HOST;
    const host = hostArg ? hostArg.split("=")[1] : hostEnv || "localhost";

    // Start the server with SSE transport
    await startServer({
      transportType: "sse" as const,
      sse: {
        endpoint: endpoint.startsWith("/")
          ? (endpoint as `/${string}`)
          : (`/${endpoint}` as `/${string}`),
        port: port,
        host: host, // Use the configured host
      },
    });

    // Clean up endpoint for display (remove any Git Bash path prefixes)
    let cleanEndpoint = endpoint;
    if (cleanEndpoint.includes("/Program Files/Git/")) {
      cleanEndpoint = cleanEndpoint.substring(
        cleanEndpoint.lastIndexOf("/Program Files/Git/") +
          "/Program Files/Git/".length
      );
      if (!cleanEndpoint.startsWith("/")) {
        cleanEndpoint = `/${cleanEndpoint}`;
      }
    }

    console.log(
      `🚀 MCP SSE Server is running on http://0.0.0.0:${port}${cleanEndpoint} (accessible from any IP address)`
    );
    console.log(
      `You can connect locally at http://localhost:${port}${cleanEndpoint}`
    );
    console.log("Press Ctrl+C to stop the server");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Don't exit for client disconnection errors
    if (errorMessage.includes("Connection closed")) {
      console.log("Client disconnected from SSE stream");
      return;
    }

    console.error(`Failed to start server: ${errorMessage}`);
    process.exit(1);
  }
}

runServer().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error);

  // Don't exit for client disconnection errors
  if (errorMessage.includes("Connection closed")) {
    console.log("Client disconnected from SSE stream");
    return;
  }

  console.error(`Fatal error running server: ${errorMessage}`);
  process.exit(1);
});
