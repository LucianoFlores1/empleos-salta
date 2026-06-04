export default async function handler(req, res) {
  try {
    const { id } = req.query;
    
    // Get environment variables (they should be available in Vercel)
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || '(default)';

    if (!projectId) {
      console.warn("No Firebase Project ID found in Vercel env");
      return serveStaticIndex(res);
    }

    // Fetch job data from Firestore via REST API (No SDK needed, super fast edge-friendly)
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/jobs/${id}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Firestore fetch failed for job ${id}: ${response.status}`);
      return serveStaticIndex(res);
    }

    const data = await response.json();
    
    // Firestore REST API returns data in a "fields" object
    if (!data.fields) {
      return serveStaticIndex(res);
    }

    // Extract fields (Firestore REST format: { title: { stringValue: "..." } })
    const title = data.fields.title?.stringValue || 'Oferta Laboral';
    const company = data.fields.company?.stringValue || '';
    const driveId = data.fields.driveId?.stringValue || id; // Fallback to id if it's the image ID
    
    const description = `Oferta laboral en Salta: ${title}. ${company ? 'Empresa: ' + company + '.' : ''}`;
    let imageUrl = '/logo.webp';
    if (driveId) {
      // Use the logic present in JobDetails.tsx
      imageUrl = `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`;
    }

    // Read static index.html
    const fs = require('fs');
    const path = require('path');
    
    // In Vercel, public files or root files are sometimes moved. It's safer to read 'dist/index.html' if available, otherwise 'index.html'
    let indexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))) {
      indexPath = path.join(process.cwd(), 'dist', 'index.html');
    } else if (fs.existsSync(path.join(__dirname, '..', 'index.html'))) {
        // Fallback for some weird vercel output formats
        indexPath = path.join(__dirname, '..', 'index.html');
    }

    let html = fs.readFileSync(indexPath, 'utf-8');

    // Replace Meta Tags
    html = html.replace(
      /<title>.*<\/title>/gi, 
      `<title>${title} | Empleos Salta</title>`
    );

    html = html.replace(
      /<meta property="og:title" content="[^"]*"/gi,
      `<meta property="og:title" content="${title} | Empleos Salta"`
    );
    
    html = html.replace(
      /<meta property="og:description" content="[^"]*"/gi,
      `<meta property="og:description" content="${description}"`
    );

    html = html.replace(
      /<meta property="og:image" content="[^"]*"/gi,
      `<meta property="og:image" content="${imageUrl}"`
    );

    html = html.replace(
      /<meta name="twitter:title" content="[^"]*"/gi,
      `<meta name="twitter:title" content="${title} | Empleos Salta"`
    );

    html = html.replace(
      /<meta name="twitter:description" content="[^"]*"/gi,
      `<meta name="twitter:description" content="${description}"`
    );

    html = html.replace(
      /<meta name="twitter:image" content="[^"]*"/gi,
      `<meta name="twitter:image" content="${imageUrl}"`
    );

    // Provide the dynamic HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300'); // Cache at Edge
    res.status(200).send(html);

  } catch (err) {
    console.error("Error generating dynamic og tags:", err);
    serveStaticIndex(res);
  }
}

function serveStaticIndex(res) {
  const fs = require('fs');
  const path = require('path');
  let indexPath = path.join(process.cwd(), 'index.html');
  if (fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))) {
    indexPath = path.join(process.cwd(), 'dist', 'index.html');
  }
  
  if (fs.existsSync(indexPath)) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.status(200).send(fs.readFileSync(indexPath, 'utf8'));
  } else {
    res.status(404).send('Page not found');
  }
}
