import { GoogleGenAI, Type } from '@google/genai';
import { CATEGORIES } from './utils';

let ai: GoogleGenAI | null = null;

export const enhanceJobs = async (jobs: any[], force: boolean = false) => {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      console.warn("GEMINI_API_KEY not found. Returning original jobs.");
      return jobs;
    }
    ai = new GoogleGenAI({ 
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
    });
  }

  const jobsToEnhance: { originalItem: any, index: number }[] = [];
  const enhancedJobs = [...jobs];

  // Identify jobs that need enhancement
  for (let i = 0; i < jobs.length; i++) {
    const job = jobs[i];
    if (force || (job.title && (job.title.startsWith('IMG-') || job.title.endsWith('.jpg') || job.title.endsWith('.png')))) {
      jobsToEnhance.push({ originalItem: job, index: i });
    }
  }

  if (jobsToEnhance.length > 0) {
    // Process in batches of 15 to avoid large single payloads if needed, though typically 1 request per 50 is fine.
    const batchSize = 25;
    for (let i = 0; i < jobsToEnhance.length; i += batchSize) {
      const batch = jobsToEnhance.slice(i, i + batchSize);
      const batchInput = batch.map((item, idx) => ({ id: idx, title: item.originalItem.title }));
      
      const prompt = `Here is a list of job offer files. Their current titles are image filenames. 
For each, suggest a better standard job title that sounds like a job offer (e.g., "Oferta de trabajo - [Date if found]").
Also select the most appropriate category from this list: ${CATEGORIES.join(', ')}.
Respond strictly as JSON.

Input Data:
${JSON.stringify(batchInput)}

You must return a JSON array of objects, each containing: "id" (matching the input id), "title" (the enhanced title), and "category" (the selected category).`;

      let response = null;
      let retries = 3;
      let delayMs = 2000;
      while (retries > 0) {
        try {
          response = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.INTEGER },
                    title: { type: Type.STRING, description: "The enhanced job title" },
                    category: { type: Type.STRING, description: "The selected category" }
                  },
                  required: ["id", "title", "category"]
                }
              }
            }
          });
          break; // Success
        } catch (apiErr: any) {
          retries--;
          console.warn(`Gemini API batch enhancement failed. Retries left: ${retries}`, apiErr.message || apiErr);
          if (retries === 0) break;
          // Check for 429 quota and sleep longer if needed
          if (apiErr.status === 429 || apiErr.message?.includes('429')) {
             const retryDelayMatch = typeof apiErr.message === 'string' ? apiErr.message.match(/retry in ([\d\.]+)s/) : null;
             const waitTime = retryDelayMatch ? (parseFloat(retryDelayMatch[1]) + 1) * 1000 : 30000;
             console.warn(`Waiting ${waitTime}ms before retrying...`);
             await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
             await new Promise(resolve => setTimeout(resolve, delayMs));
             delayMs *= 2;
          }
        }
      }

      if (response && response.text) {
        try {
          const results = JSON.parse(response.text.trim());
          if (Array.isArray(results)) {
            for (const resItem of results) {
              const batchMatch = batch.find(b => batch.findIndex(item => item === b) === resItem.id);
              if (batchMatch) {
                enhancedJobs[batchMatch.index] = {
                  ...batchMatch.originalItem,
                  title: resItem.title || batchMatch.originalItem.title,
                  category: resItem.category || batchMatch.originalItem.category
                };
              }
            }
          }
        } catch (e) {
          console.error("Failed to parse Gemini batch response", e);
        }
      }
    }
  }

  return enhancedJobs;
};
