import { FastMCP } from "fastmcp";
import { z } from "zod";
import path from "path";
import { fileURLToPath } from "url";
import { commandManager } from "./command-manager.js";
import {
  executeCommand,
  readOutput,
  forceTerminate,
  listSessions,
} from "./tools/execute.js";
import { listProcesses, killProcess } from "./tools/process.js";
import {
  readFile,
  readMultipleFiles,
  writeFile,
  createDirectory,
  listDirectory,
  moveFile,
  searchFiles,
  getFileInfo,
  listAllowedDirectories,
} from "./tools/filesystem.js";
import { parseEditBlock, performSearchReplace } from "./tools/edit.js";
import { VERSION } from "./version.js";
import fs from "fs";

// Create a new FastMCP server
const server = new FastMCP({
  name: "desktop-commander",
  version: VERSION,
});

// Define tool schemas - reusing existing schemas from your tools/schemas.js
// For simplicity, I'm redefining basic schemas here, but you should import from your actual schema file
const ExecuteCommandArgsSchema = z.object({
  command: z.string(),
  sessionId: z.string().optional(),
  timeout: z.number().optional(),
  cwd: z.string().optional(),
});

const ReadOutputArgsSchema = z.object({
  sessionId: z.string(),
});

const ForceTerminateArgsSchema = z.object({
  sessionId: z.string(),
});

const ListSessionsArgsSchema = z.object({});

const KillProcessArgsSchema = z.object({
  pid: z.number(),
});

const BlockCommandArgsSchema = z.object({
  command: z.string(),
});

const UnblockCommandArgsSchema = z.object({
  command: z.string(),
});

const ReadFileArgsSchema = z.object({
  path: z.string(),
});

const ReadMultipleFilesArgsSchema = z.object({
  paths: z.array(z.string()),
});

const WriteFileArgsSchema = z.object({
  path: z.string(),
  content: z.string(),
});

const CreateDirectoryArgsSchema = z.object({
  path: z.string(),
});

const ListDirectoryArgsSchema = z.object({
  path: z.string(),
});

const MoveFileArgsSchema = z.object({
  sourcePath: z.string(),
  destinationPath: z.string(),
});

const SearchFilesArgsSchema = z.object({
  startPath: z.string(),
  pattern: z.string(),
});

const GetFileInfoArgsSchema = z.object({
  path: z.string(),
});

const EditBlockArgsSchema = z.object({
  content: z.string(),
});

// Add terminal tools
server.addTool({
  name: "execute_command",
  description:
    "Execute a terminal command with timeout. Command will continue running in background if it doesn't complete within timeout.",
  parameters: ExecuteCommandArgsSchema,
  execute: async (args) => {
    const result = await executeCommand(args);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "read_output",
  description: "Read new output from a running terminal session.",
  parameters: ReadOutputArgsSchema,
  execute: async (args) => {
    const result = await readOutput(args);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "force_terminate",
  description: "Force terminate a running terminal session.",
  parameters: ForceTerminateArgsSchema,
  execute: async (args) => {
    const result = await forceTerminate(args);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "list_sessions",
  description: "List all active terminal sessions.",
  parameters: ListSessionsArgsSchema,
  execute: async () => {
    const result = await listSessions();
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "list_processes",
  description: "List all running processes.",
  parameters: z.object({}),
  execute: async () => {
    const result = await listProcesses();
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "kill_process",
  description: "Terminate a running process by PID.",
  parameters: KillProcessArgsSchema,
  execute: async (args) => {
    const result = await killProcess(args);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "block_command",
  description: "Add a command to the blacklist.",
  parameters: BlockCommandArgsSchema,
  execute: async (args) => {
    const result = await commandManager.blockCommand(args.command);
    return JSON.stringify({
      content: [
        {
          type: "text",
          text: result
            ? "Command blocked successfully"
            : "Failed to block command",
        },
      ],
    });
  },
});

server.addTool({
  name: "unblock_command",
  description: "Remove a command from the blacklist.",
  parameters: UnblockCommandArgsSchema,
  execute: async (args) => {
    const result = await commandManager.unblockCommand(args.command);
    return JSON.stringify({
      content: [
        {
          type: "text",
          text: result
            ? "Command unblocked successfully"
            : "Failed to unblock command",
        },
      ],
    });
  },
});

server.addTool({
  name: "list_blocked_commands",
  description: "List all currently blocked commands.",
  parameters: z.object({}),
  execute: async () => {
    // Read blocked commands from config file directly
    try {
      const configPath = path.resolve("./config.json");
      const configData = JSON.parse(fs.readFileSync(configPath, "utf8"));
      const blockedCommands = configData.blockedCommands || [];
      return JSON.stringify({
        content: [
          {
            type: "text",
            text: `Blocked commands: ${blockedCommands.join(", ")}`,
          },
        ],
      });
    } catch (error) {
      return JSON.stringify({
        content: [
          {
            type: "text",
            text: "Failed to read blocked commands",
          },
        ],
      });
    }
  },
});

// Add filesystem tools
server.addTool({
  name: "read_file",
  description: "Read the complete contents of a file from the file system.",
  parameters: ReadFileArgsSchema,
  execute: async (args) => {
    const result = await readFile(args.path);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "read_multiple_files",
  description: "Read the contents of multiple files simultaneously.",
  parameters: ReadMultipleFilesArgsSchema,
  execute: async (args) => {
    const result = await readMultipleFiles(args.paths);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "write_file",
  description: "Completely replace file contents.",
  parameters: WriteFileArgsSchema,
  execute: async (args) => {
    const result = await writeFile(args.path, args.content);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "create_directory",
  description: "Create a new directory or ensure a directory exists.",
  parameters: CreateDirectoryArgsSchema,
  execute: async (args) => {
    const result = await createDirectory(args.path);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "list_directory",
  description:
    "Get a detailed listing of all files and directories in a specified path.",
  parameters: ListDirectoryArgsSchema,
  execute: async (args) => {
    const result = await listDirectory(args.path);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "move_file",
  description: "Move or rename files and directories.",
  parameters: MoveFileArgsSchema,
  execute: async (args) => {
    const result = await moveFile(args.sourcePath, args.destinationPath);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "search_files",
  description:
    "Recursively search for files and directories matching a pattern.",
  parameters: SearchFilesArgsSchema,
  execute: async (args) => {
    const result = await searchFiles(args.startPath, args.pattern);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "get_file_info",
  description: "Retrieve detailed metadata about a file or directory.",
  parameters: GetFileInfoArgsSchema,
  execute: async (args) => {
    const result = await getFileInfo(args.path);
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "list_allowed_directories",
  description:
    "Returns the list of directories that this server is allowed to access.",
  parameters: z.object({}),
  execute: async () => {
    const result = await listAllowedDirectories();
    return JSON.stringify(result);
  },
});

server.addTool({
  name: "edit_block",
  description: "Apply surgical text replacements to files.",
  parameters: EditBlockArgsSchema,
  execute: async (args) => {
    try {
      const parsed = await parseEditBlock(args.content);
      const result = await performSearchReplace(
        parsed.filePath,
        parsed.searchReplace
      );
      return JSON.stringify({
        content: [{ type: "text", text: "Edit block applied successfully" }],
      });
    } catch (error) {
      return JSON.stringify({
        content: [
          {
            type: "text",
            text: `Failed to apply edit block: ${
              error instanceof Error ? error.message : String(error)
            }`,
          },
        ],
      });
    }
  },
});

// Define the ServerOptions type
interface ServerOptions {
  transportType: "sse";
  sse: {
    endpoint: `/${string}`;
    port: number;
    host?: string;
  };
}

// Function to start the server
export async function startServer(serverOptions: ServerOptions) {
  console.log(
    `Starting server with ${serverOptions.transportType} transport...`
  );

  let cleanEndpoint: string = "";

  if (serverOptions.transportType === "sse") {
    console.log(
      `Setting up SSE endpoint at ${serverOptions.sse.endpoint} on port ${serverOptions.sse.port}`
    );

    // Clean up endpoint for display (remove any Git Bash path prefixes)
    cleanEndpoint = String(serverOptions.sse.endpoint);
    if (cleanEndpoint.includes("/Program Files/Git/")) {
      cleanEndpoint = cleanEndpoint.substring(
        cleanEndpoint.lastIndexOf("/Program Files/Git/") +
          "/Program Files/Git/".length
      );
      if (!cleanEndpoint.startsWith("/")) {
        cleanEndpoint = `/${cleanEndpoint}`;
      }
    }
  }

  // Start the server
  await server.start(serverOptions);
  console.log(`Server started with ${serverOptions.transportType} transport`);

  if (serverOptions.transportType === "sse") {
    console.log(
      `SSE endpoint available at http://${
        serverOptions.sse.host || "localhost"
      }:${serverOptions.sse.port}${cleanEndpoint}`
    );
  }

  return server;
}

// Export the server for testing
export { server };
