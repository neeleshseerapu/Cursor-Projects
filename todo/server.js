import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import morgan from "morgan";
import lockfile from "proper-lockfile";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Configuration for external JSON database
const EXTERNAL_DB_URL = process.env.EXTERNAL_DB_URL || null;
const EXTERNAL_DB_API_KEY = process.env.EXTERNAL_DB_API_KEY || null;

// Local storage fallback
const DATA_DIR = path.resolve(__dirname, "data");
const PUBLIC_DIR = path.resolve(__dirname, "public");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

// Static files
app.use(express.static(PUBLIC_DIR));

// Helpers
function getUserFile(username) {
  const safe = String(username).replace(/[^a-zA-Z0-9._-]/g, "_");
  return path.join(DATA_DIR, `${safe}.json`);
}

async function safeReadJson(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, "utf8");
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function safeWriteJson(filePath, data) {
  const release = await lockfile
    .lock(filePath, {
      realpath: false,
      retries: { retries: 5, factor: 1.5, minTimeout: 30, maxTimeout: 200 },
    })
    .catch(() => null);
  try {
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(data, null, 2),
      "utf8"
    );
  } finally {
    if (release) await release();
  }
}

// External JSON database helpers
async function fetchFromExternalDB(username) {
  if (!EXTERNAL_DB_URL) return null;

  try {
    const response = await fetch(
      `${EXTERNAL_DB_URL}/users/${encodeURIComponent(username)}/todos`,
      {
        headers: {
          Authorization: `Bearer ${EXTERNAL_DB_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok)
      throw new Error(`External DB returned ${response.status}`);
    return await response.json();
  } catch (error) {
    console.warn("External DB fetch failed:", error.message);
    return null;
  }
}

async function saveToExternalDB(username, data) {
  if (!EXTERNAL_DB_URL) return false;

  try {
    const response = await fetch(
      `${EXTERNAL_DB_URL}/users/${encodeURIComponent(username)}/todos`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${EXTERNAL_DB_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      }
    );

    if (!response.ok)
      throw new Error(`External DB returned ${response.status}`);
    return true;
  } catch (error) {
    console.warn("External DB save failed:", error.message);
    return false;
  }
}

// API
app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.get("/api/users/:username/todos", async (req, res) => {
  const username = req.params.username;

  // Try external DB first
  if (EXTERNAL_DB_URL) {
    const externalData = await fetchFromExternalDB(username);
    if (externalData !== null) {
      return res.json(externalData);
    }
  }

  // Fallback to local storage
  const file = getUserFile(username);
  const todos = await safeReadJson(file);
  res.json(todos);
});

app.put("/api/users/:username/todos", async (req, res) => {
  const username = req.params.username;
  const todos = Array.isArray(req.body) ? req.body : [];

  // Try external DB first
  if (EXTERNAL_DB_URL) {
    const success = await saveToExternalDB(username, todos);
    if (success) {
      return res.json({ ok: true, count: todos.length, source: "external" });
    }
  }

  // Fallback to local storage
  const file = getUserFile(username);
  await safeWriteJson(file, todos);
  res.json({ ok: true, count: todos.length, source: "local" });
});

// Fallback to index.html for SPA-like behavior
app.get("*", (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "index.html"));
});

app.listen(PORT, () => {
  console.log(`UCLA Todo server listening on http://localhost:${PORT}`);
  if (EXTERNAL_DB_URL) {
    console.log(`🔗 Connected to external JSON database: ${EXTERNAL_DB_URL}`);
  } else {
    console.log(`📁 Using local JSON storage: ${DATA_DIR}`);
  }
});
