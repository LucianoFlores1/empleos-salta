export default async function handler(req, res) {
  try {
    // Get environment variables (they should be available in Vercel)
    const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID;
    const databaseId = process.env.VITE_FIREBASE_DATABASE_ID || process.env.FIREBASE_DATABASE_ID || '(default)';

    if (!projectId) {
      console.warn("No Firebase Project ID found in Vercel env");
      return serveStaticIndex(res);
    }

    // Fetch job data from Firestore via REST API (No SDK needed, super fast edge-friendly)
    // We fetch the jobs collection, but we need to query or just get a list. 
    // Usually, the easiest is to list documents. Not ordered unless we use runQuery, 
    // but just listing documents is fine for AI bots to know what's there.
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents/jobs?pageSize=50`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Firestore fetch failed for homepage: ${response.status}`);
      return serveStaticIndex(res);
    }

    const data = await response.json();
    
    let jobsListHtml = '<ul>';
    let jsonLdJobs = [];

    if (data.documents && data.documents.length > 0) {
      data.documents.forEach(doc => {
        const fields = doc.fields || {};
        const title = fields.title?.stringValue || 'Oferta Laboral';
        const company = fields.company?.stringValue || 'Empresa Confidencial';
        const modality = fields.modality?.stringValue || 'Presencial';
        const docId = doc.name.split('/').pop();
        
        jobsListHtml += `<li><a href="/job/${docId}">${title} en ${company} - ${modality}</a></li>`;
        
        jsonLdJobs.push({
          "@type": "JobPosting",
          "title": title,
          "hiringOrganization": {
            "@type": "Organization",
            "name": company
          },
          "jobLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Salta",
              "addressRegion": "Salta",
              "addressCountry": "AR"
            }
          },
          "url": `https://empleos-salta.vercel.app/job/${docId}`
        });
      });
    }
    jobsListHtml += '</ul>';

    const seoBlock = `
    <div id="seo-ai-content" style="display: none;">
      <h2>Empleos disponibles hoy en Salta</h2>
      <p>Cantidad de empleos disponibles hoy: ${jsonLdJobs.length}</p>
      ${jobsListHtml}
    </div>
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@graph": ${JSON.stringify(jsonLdJobs)}
    }
    </script>
    `;

    // Read static index.html
    const fs = require('fs');
    const path = require('path');
    
    let indexPath = path.join(process.cwd(), 'index.html');
    if (fs.existsSync(path.join(process.cwd(), 'dist', 'index.html'))) {
      indexPath = path.join(process.cwd(), 'dist', 'index.html');
    } else if (fs.existsSync(path.join(__dirname, '..', 'index.html'))) {
        indexPath = path.join(__dirname, '..', 'index.html');
    }

    let html = fs.readFileSync(indexPath, 'utf-8');

    // Inject before closing </body> tag
    html = html.replace('</body>', `${seoBlock}\n</body>`);

    // Provide the dynamic HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400'); // Cache for 1 hour at Edge
    res.status(200).send(html);

  } catch (err) {
    console.error("Error generating dynamic home tags:", err);
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
