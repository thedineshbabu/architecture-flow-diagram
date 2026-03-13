import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, 'public');
const DATA_FILE = join(PUBLIC_DIR, 'architecture.json');
const DIST_DIR = join(__dirname, 'dist');

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/architecture', (req, res) => {
  try {
    if (!existsSync(DATA_FILE)) {
      return res.status(404).json({ error: 'architecture.json not found' });
    }
    const data = readFileSync(DATA_FILE, 'utf-8');
    const json = JSON.parse(data);
    res.json(json);
  } catch (err) {
    console.error('GET /api/architecture error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to read architecture' });
  }
});

app.put('/api/architecture', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
      return res.status(400).json({ error: 'nodes and edges arrays required' });
    }
    if (!existsSync(PUBLIC_DIR)) {
      mkdirSync(PUBLIC_DIR, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    console.error('PUT /api/architecture error:', err);
    res.status(500).json({ error: err.message ?? 'Failed to write architecture' });
  }
});

if (existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (_, res) => res.sendFile(join(DIST_DIR, 'index.html')));
}

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`API server running at http://localhost:${PORT}`);
  if (existsSync(DIST_DIR)) {
    console.log(`Serving app from dist/ - open http://localhost:${PORT}`);
  }
});
