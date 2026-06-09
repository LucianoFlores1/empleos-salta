import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { enhanceJobs } from './src/geminiWorker';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));

// --- API Routes ---
app.get('/api/job', async (req, res) => {
  try {
    const id = req.query.id as string;
    const fs = require('fs');
    if (!id) return res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
    
    // Quick mock for local dev
    let indexPath = path.join(process.cwd(), 'dist', 'index.html');
    if (!fs.existsSync(indexPath)) indexPath = path.join(process.cwd(), 'index.html');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(fs.readFileSync(indexPath, 'utf8'));
  } catch(e) {
    res.status(500).send("Error");
  }
});

// Parity dev route for home
app.get('/', async (req, res, next) => {
    // Vite will usually intercept this in development via middleware,
    // but in production dist/ it's handled by express.static before reaching here 
    // unless we place it carefully. For simplicity locally, let Vite handle it, 
    // only on Vercel the function runs.
    next();
});

app.post('/api/enhance-jobs', async (req, res) => {
  try {
    const { jobs, force } = req.body;
    if (!Array.isArray(jobs)) {
      return res.status(400).json({ error: 'jobs must be an array' });
    }
    const enhanced = await enhanceJobs(jobs, force);
    res.json({ jobs: enhanced });
  } catch (error: any) {
    console.error('Enhance jobs error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
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
