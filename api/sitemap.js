export default async function handler(req, res) {
  try {
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || '(default)';

    if (!projectId) {
      return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/jobs?pageSize=100`;
    
    const response = await fetch(url);
    if (!response.ok) {
       return res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>');
    }

    const data = await response.json();
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Core routes
    xml += `
  <url>
    <loc>https://empleos-salta.vercel.app/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    // Job routes
    if (data.documents && data.documents.length > 0) {
      data.documents.forEach(doc => {
        const docId = doc.name.split('/').pop();
        const updatedAt = doc.fields?.updatedAt?.stringValue || doc.fields?.createdAt?.stringValue || new Date().toISOString();
        
        xml += `
  <url>
    <loc>https://empleos-salta.vercel.app/job/${docId}</loc>
    <lastmod>${updatedAt.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      });
    }

    xml += '\n</urlset>';

    res.setHeader('Content-Type', 'text/xml; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400'); // Cache for 24 hours
    res.status(200).send(xml);

  } catch (err) {
    console.error("Error generating sitemap:", err);
    res.status(500).send('Error');
  }
}
