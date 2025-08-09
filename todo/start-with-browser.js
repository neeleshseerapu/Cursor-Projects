#!/usr/bin/env node

import { spawn } from "child_process";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = process.env.PORT || 3001;
const URL = `http://localhost:${PORT}`;

// Function to open browser based on OS
function openBrowser(url) {
  const platform = process.platform;

  let command;
  let args;

  switch (platform) {
    case "darwin": // macOS
      command = "open";
      args = [url];
      break;
    case "win32": // Windows
      command = "cmd";
      args = ["/c", "start", url];
      break;
    default: // Linux and others
      command = "xdg-open";
      args = [url];
      break;
  }

  try {
    spawn(command, args, { stdio: "ignore" });
    console.log(`🌐 Opening browser to ${url}`);
  } catch (error) {
    console.log(
      `⚠️  Could not open browser automatically. Please open: ${url}`
    );
  }
}

// Main function
async function main() {
  console.log("🚀 Starting UCLA Todo App...");

  // Check if server.js exists
  const serverPath = join(__dirname, "server.js");
  if (!existsSync(serverPath)) {
    console.error("❌ server.js not found in current directory");
    process.exit(1);
  }

  // Start the server
  const server = spawn("node", ["server.js"], {
    stdio: "inherit",
    cwd: __dirname,
  });

  // Wait for server to start
  console.log("⏳ Waiting for server to start...");

  // Wait 3 seconds for server to start
  setTimeout(() => {
    console.log("✅ Server should be ready!");
    openBrowser(URL);
  }, 3000);

  // Handle server process
  server.on("close", (code) => {
    console.log(`\n👋 Server stopped with code ${code}`);
    process.exit(code);
  });

  // Handle process termination
  process.on("SIGINT", () => {
    console.log("\n🛑 Stopping server...");
    server.kill("SIGINT");
  });

  process.on("SIGTERM", () => {
    console.log("\n🛑 Stopping server...");
    server.kill("SIGTERM");
  });
}

// Run the main function
main().catch((error) => {
  console.error("❌ Error starting app:", error);
  process.exit(1);
});
