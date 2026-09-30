import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './src/lib/firebase.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const isProd = process.env.NODE_ENV === 'production';

// Robots.txt Route
app.get('/robots.txt', (req, res) => {
  res.header('Content-Type', 'text/plain');
  res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /profile
Disallow: /notifications
Disallow: /write

Sitemap: ${APP_URL}/sitemap.xml`);
});

// Sitemap Route (Available in both modes)
app.get('/sitemap.xml', async (req, res) => {
  res.header('Content-Type', 'application/xml');
  
  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${APP_URL}/</loc>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${APP_URL}/categories</loc>
    <priority>0.8</priority>
  </url>`;

  try {
    const storiesRef = collection(db, 'stories');
    const q = query(storiesRef, where('status', '==', 'approved'));
    const snap = await getDocs(q);
    
    snap.forEach(doc => {
      const data = doc.data();
      const dateStr = data.createdAt ? new Date(data.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      sitemap += `
  <url>
    <loc>${APP_URL}/story/${doc.id}</loc>
    <lastmod>${dateStr}</lastmod>
    <priority>0.6</priority>
  </url>`;
    });
  } catch (error) {
    console.error('Error generating sitemap stories:', error);
  }

  sitemap += '\n</urlset>';
  res.send(sitemap);
});

if (isProd) {
  // Serve static files from the dist directory
  app.use(express.static(path.join(__dirname, 'dist')));

  // All other routes serve index.html (SPA support)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
} else {
  // In dev, use Vite dev server as middleware
  const vite = await import('vite').then(v => v.createServer({
    server: { middlewareMode: true },
    appType: 'spa'
  }));
  app.use(vite.middlewares);
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
