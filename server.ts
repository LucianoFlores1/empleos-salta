import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { createServer as createViteServer } from 'vite';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

import { inferCategory } from './src/utils';

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), 'data.json');
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev-only-change-in-prod';

// We hardcode an admin for prototype purposes. 
// Password is "admin123"
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = bcrypt.hashSync('admin123', 8);

app.use(express.json({ limit: '10mb' }));

// --- Helpers ---
const readData = async () => {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    if ((err as any).code === 'ENOENT') {
      await fs.writeFile(DATA_FILE, '[]');
      return [];
    }
    throw err;
  }
};

const writeData = async (data: any) => {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
};

const requireAdmin = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// --- API Routes Public ---

app.get('/api/jobs', async (req, res) => {
  try {
    const jobs = await readData();
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to read data' });
  }
});

app.get('/api/jobs/:id', async (req, res) => {
  try {
    const jobs = await readData();
    const job = jobs.find((j: any) => j.id === req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed' });
  }
});

// --- API Routes Admin ---

app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && bcrypt.compareSync(password, ADMIN_PASSWORD_HASH)) {
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/admin/jobs', requireAdmin, async (req, res) => {
  try {
    const jobs = await readData();
    const newJob = {
      ...req.body,
      createdAt: new Date().toISOString()
    };
    if (!newJob.id) {
       newJob.id = crypto.randomBytes(8).toString('hex');
    }
    jobs.push(newJob);
    await writeData(jobs);
    res.status(201).json(newJob);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save job' });
  }
});

app.put('/api/admin/jobs/:id', requireAdmin, async (req, res) => {
  try {
    const jobs = await readData();
    const index = jobs.findIndex((j: any) => j.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'Not found' });
    
    jobs[index] = { ...jobs[index], ...req.body };
    await writeData(jobs);
    res.json(jobs[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update' });
  }
});

app.delete('/api/admin/jobs/:id', requireAdmin, async (req, res) => {
  try {
    let jobs = await readData();
    jobs = jobs.filter((j: any) => j.id !== req.params.id);
    await writeData(jobs);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete' });
  }
});

app.post('/api/admin/jobs/import', requireAdmin, async (req, res) => {
  try {
    const { mode, data } = req.body;
    // data is expected to be an array of jobs
    if (!Array.isArray(data)) return res.status(400).json({ error: 'Invalid data format' });
    
    let currentJobs = await readData();
    
    // Auto-generate ids & dates for imported items if missing
    const preparedData = data.map(item => ({
       ...item,
       createdAt: item.createdAt || new Date().toISOString(),
       id: item.id || crypto.randomBytes(8).toString('hex'),
       category: item.category || inferCategory(item.title)
    }));

    if (mode === 'replace') {
      await writeData(preparedData);
    } else {
      // merge or add
      const existingIds = new Set(currentJobs.map((j: any) => j.id));
      const toAdd = preparedData.filter(j => !existingIds.has(j.id));
      const toUpdate = preparedData.filter(j => existingIds.has(j.id));
      
      let merged = [...currentJobs];
      for (const update of toUpdate) {
         const idx = merged.findIndex((m: any) => m.id === update.id);
         if (idx !== -1) {
            merged[idx] = { ...merged[idx], ...update };
         }
      }
      merged = merged.concat(toAdd);
      await writeData(merged);
    }
    res.json({ success: true, count: preparedData.length });
  } catch (err) {
    res.status(500).json({ error: 'Failed to import' });
  }
});

// --- Server Setup ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
