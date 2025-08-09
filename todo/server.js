import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import morgan from 'morgan';
import lockfile from 'proper-lockfile';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_DIR = path.resolve(__dirname, 'data');
const PUBLIC_DIR = path.resolve(__dirname, 'public');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PUBLIC_DIR)) fs.mkdirSync(PUBLIC_DIR, { recursive: true });

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

// Static files
app.use(express.static(PUBLIC_DIR));

// Helpers
function getUserFile(username) {
  const safe = String(username).replace(/[^a-zA-Z0-9._-]/g, '_');
  return path.join(DATA_DIR, `${safe}.json`);
}

async function safeReadJson(filePath) {
  try {
    const content = await fs.promises.readFile(filePath, 'utf8');
    const data = JSON.parse(content);
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

async function safeWriteJson(filePath, data) {
  const release = await lockfile.lock(filePath, { realpath: false, retries: { retries: 5, factor: 1.5, minTimeout: 30, maxTimeout: 200 } }).catch(() => null);
  try {
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  } finally {
    if (release) await release();
  }
}

// API
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.get('/api/users/:username/todos', async (req, res) => {
  const file = getUserFile(req.params.username);
  const todos = await safeReadJson(file);
  res.json(todos);
});

app.put('/api/users/:username/todos', async (req, res) => {
  const file = getUserFile(req.params.username);
  const todos = Array.isArray(req.body) ? req.body : [];
  await safeWriteJson(file, todos);
  res.json({ ok: true, count: todos.length });
});

// Fallback to index.html for SPA-like behavior
app.get('*', (_req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`UCLA Todo server listening on http://localhost:${PORT}`);
});