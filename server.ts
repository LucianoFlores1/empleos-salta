import 'dotenv/config';
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

// Proxy a Pexels: genera portadas cuando un flyer falta o es de baja calidad.
// La API key vive solo acá (server) y nunca llega al navegador.
const stockCache = new Map<string, { data: any; ts: number }>();
const STOCK_TTL = 1000 * 60 * 60 * 24; // 24 h

app.get('/api/stock-image', async (req, res) => {
  try {
    const query = ((req.query.q as string) || 'professional work').slice(0, 80);
    const key = process.env.PEXELS_API_KEY;
    if (!key) return res.status(503).json({ error: 'PEXELS_API_KEY no configurada' });

    const cached = stockCache.get(query);
    if (cached && Date.now() - cached.ts < STOCK_TTL) {
      res.set('Cache-Control', 'public, max-age=86400');
      return res.json(cached.data);
    }

    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=12&orientation=landscape`;
    const r = await fetch(url, { headers: { Authorization: key } });
    if (!r.ok) return res.status(r.status).json({ error: `Pexels respondió ${r.status}` });

    const data: any = await r.json();
    const photos = (data.photos || []).map((p: any) => ({
      url: p.src?.large || p.src?.medium || p.src?.original,
      avgColor: p.avg_color,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      alt: p.alt || '',
    }));
    if (!photos.length) return res.status(404).json({ error: 'sin resultados' });

    const payload = { photos };
    stockCache.set(query, { data: payload, ts: Date.now() });
    res.set('Cache-Control', 'public, max-age=86400');
    res.json(payload);
  } catch (error: any) {
    console.error('stock-image error:', error);
    res.status(500).json({ error: error.message || 'stock-image failed' });
  }
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
