import express from 'express';
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, 'public');
const DIAGRAMS_DIR = join(PUBLIC_DIR, 'diagrams');
const DIST_DIR = join(__dirname, 'dist');

// Ensure diagrams directory exists
if (!existsSync(DIAGRAMS_DIR)) {
  mkdirSync(DIAGRAMS_DIR, { recursive: true });
}

// Migrate legacy architecture.json → diagrams/default.json if needed
const LEGACY_FILE = join(PUBLIC_DIR, 'architecture.json');
const DEFAULT_FILE = join(DIAGRAMS_DIR, 'default.json');
if (existsSync(LEGACY_FILE) && !existsSync(DEFAULT_FILE)) {
  const data = readFileSync(LEGACY_FILE, 'utf-8');
  writeFileSync(DEFAULT_FILE, data, 'utf-8');
}

const app = express();
app.use(express.json({ limit: '1mb' }));

// List all diagrams
app.get('/api/diagrams', (_req, res) => {
  try {
    const files = readdirSync(DIAGRAMS_DIR).filter((f) => f.endsWith('.json'));
    const diagrams = files.map((f) => {
      try {
        const data = JSON.parse(readFileSync(join(DIAGRAMS_DIR, f), 'utf-8'));
        return {
          id: f.replace('.json', ''),
          title: data.title || f.replace('.json', ''),
          subtitle: data.subtitle,
          nodeCount: data.nodes?.length ?? 0,
          edgeCount: data.edges?.length ?? 0,
        };
      } catch {
        return { id: f.replace('.json', ''), title: f.replace('.json', ''), nodeCount: 0, edgeCount: 0 };
      }
    });
    res.json(diagrams);
  } catch (err) {
    res.status(500).json({ error: err.message ?? 'Failed to list diagrams' });
  }
});

// Get a specific diagram
app.get('/api/diagrams/:id', (req, res) => {
  try {
    const file = join(DIAGRAMS_DIR, `${req.params.id}.json`);
    if (!existsSync(file)) {
      return res.status(404).json({ error: 'Diagram not found' });
    }
    const data = readFileSync(file, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
    res.status(500).json({ error: err.message ?? 'Failed to read diagram' });
  }
});

// Create or update a diagram
app.put('/api/diagrams/:id', (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object') {
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
    if (!Array.isArray(body.nodes) || !Array.isArray(body.edges)) {
      return res.status(400).json({ error: 'nodes and edges arrays required' });
    }
    const file = join(DIAGRAMS_DIR, `${req.params.id}.json`);
    writeFileSync(file, JSON.stringify(body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message ?? 'Failed to write diagram' });
  }
});

// Delete a diagram
app.delete('/api/diagrams/:id', (req, res) => {
  try {
    const file = join(DIAGRAMS_DIR, `${req.params.id}.json`);
    if (!existsSync(file)) {
      return res.status(404).json({ error: 'Diagram not found' });
    }
    unlinkSync(file);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message ?? 'Failed to delete diagram' });
  }
});

// Legacy endpoints — redirect to default diagram
app.get('/api/architecture', (req, res) => {
  try {
    if (!existsSync(DEFAULT_FILE)) {
      return res.status(404).json({ error: 'architecture.json not found' });
    }
    const data = readFileSync(DEFAULT_FILE, 'utf-8');
    res.json(JSON.parse(data));
  } catch (err) {
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
    writeFileSync(DEFAULT_FILE, JSON.stringify(body, null, 2), 'utf-8');
    res.json({ success: true });
  } catch (err) {
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
