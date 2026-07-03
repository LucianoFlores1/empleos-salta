import { Job } from './types';
import { db, auth, isFirebaseConfigured } from './lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { inferCategory } from './utils';

// ── Modo dev (sin Firebase) ──────────────────────────────────────────────
// Cuando no hay .env configurado, la app muestra estas ofertas de ejemplo
// para poder ver el diseño localmente. No se escribe nada en ninguna base.
const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000).toISOString();

const MOCK_JOBS: Job[] = [
  // Tamaños variados a propósito (vertical, cuadrado, panorámico) para
  // simular los flyers reales de Drive y ver cómo se normalizan.
  { id: 'demo-1', previewUrl: 'https://picsum.photos/seed/demo-1/400/600', title: 'Recepcionista administrativa', company: 'Estudio Contable Norte', location: 'Salta Capital', category: 'Administración', source: '#', createdAt: daysAgo(0), description: 'Atención al público, agenda y manejo de documentación. Se valora experiencia previa en estudios contables.' },
  { id: 'demo-2', previewUrl: 'https://picsum.photos/seed/demo-2/600/400', title: 'Desarrollador/a Frontend React', company: 'TechSalta', location: 'Remoto', category: 'Tecnologías', source: '#', createdAt: daysAgo(1) },
  { id: 'demo-3', previewUrl: 'https://picsum.photos/seed/demo-3/500/500', title: 'Vendedor/a de salón', company: 'Mueblería El Roble', location: 'San Lorenzo', category: 'Ventas y Atención', source: '#', createdAt: daysAgo(3) },
  { id: 'demo-4', previewUrl: 'https://picsum.photos/seed/demo-4/380/620', title: 'Enfermero/a profesional', company: 'Clínica del Valle', location: 'Salta Capital', category: 'Salud y Cuidado', source: '#', createdAt: daysAgo(5) },
  { id: 'demo-5', previewUrl: 'https://picsum.photos/seed/demo-5/820/320', title: 'Chofer de reparto', company: 'Distribuidora Andina', location: 'Cerrillos', category: 'Logística y Transporte', source: '#', createdAt: daysAgo(8) },
  { id: 'demo-6', previewUrl: 'https://picsum.photos/seed/demo-6/450/600', title: 'Cocinero/a para parrilla', company: 'Restó La Posta', location: 'Salta Capital', category: 'Gastronomía', source: '#', createdAt: daysAgo(12), description: 'Turno noche. Experiencia en parrilla y cocina de salón.' },
  // Flyer de baja resolución a propósito (220px) → debe disparar la portada de Pexels.
  { id: 'demo-7', previewUrl: 'https://picsum.photos/seed/demo-7/220/150', title: 'Diseñador/a gráfico', company: 'Agencia Pulpo', location: 'Remoto', category: 'Diseño y Marketing', source: '#', createdAt: daysAgo(18) },
  // Sin imagen válida → falla y cae a la portada de Pexels.
  { id: 'demo-8', title: 'Operario/a de mantenimiento', company: 'Minera Puna', location: 'San Antonio de los Cobres', category: 'Minería y Campo', source: '#', createdAt: daysAgo(40) },
];

// Si existe public/dev-jobs.json (data real scrapeada), el modo dev la usa para
// ver cómo se vería en producción. Si no está, cae a los 8 ejemplos de arriba.
let devJobsCache: Job[] | null = null;
async function loadDevJobs(): Promise<Job[]> {
  if (devJobsCache) return devJobsCache;
  try {
    const res = await fetch('/dev-jobs.json');
    if (!res.ok) throw new Error('no dev-jobs');
    const raw = await res.json();
    if (!Array.isArray(raw) || raw.length === 0) throw new Error('vacío');
    devJobsCache = raw.map((j: any) => ({
      id: j.id || j._docId,
      driveId: j.driveId,
      title: j.title || 'Sin título',
      source: j.source || '#',
      category: j.category,
      company: j.company,
      location: j.location,
      description: j.description,
      createdAt: j.createdAt || new Date().toISOString(),
      date: j.date,
    })) as Job[];
    return devJobsCache;
  } catch {
    devJobsCache = MOCK_JOBS;
    return MOCK_JOBS;
  }
}
// ─────────────────────────────────────────────────────────────────────────

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider: any) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Ensure unique random IDs if missing
const generateId = () => Math.random().toString(36).substring(2, 10);

const CACHE_KEY = 'empleos_salta_jobs_cache';
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

export const getJobs = async (): Promise<Job[]> => {
  if (!isFirebaseConfigured) {
    return loadDevJobs();
  }
  try {
    const cachedData = sessionStorage.getItem(CACHE_KEY);
    if (cachedData) {
      const { data, timestamp } = JSON.parse(cachedData);
      if (Date.now() - timestamp < CACHE_TTL) {
        return data;
      }
    }
    const snap = await getDocs(collection(db, 'jobs'));
    const jobs = snap.docs.map(d => ({ ...d.data(), id: d.id } as Job));
    sessionStorage.setItem(CACHE_KEY, JSON.stringify({ data: jobs, timestamp: Date.now() }));
    return jobs;
  } catch (error) {
    return handleFirestoreError(error, OperationType.LIST, 'jobs') as any;
  }
};

export const getJob = async (id: string): Promise<Job> => {
  if (!isFirebaseConfigured) {
    const jobs = await loadDevJobs();
    const found = jobs.find(j => j.id === id);
    if (!found) throw new Error('Not found');
    return found;
  }
  try {
    const snap = await getDoc(doc(db, 'jobs', id));
    if (!snap.exists()) throw new Error('Not found');
    return { ...snap.data(), id: snap.id } as Job;
  } catch (error) {
    return handleFirestoreError(error, OperationType.GET, `jobs/${id}`) as any;
  }
};

export const clearJobsCache = () => {
  sessionStorage.removeItem(CACHE_KEY);
};

// Admin
export const createJob = async (job: Partial<Job>): Promise<Job> => {
  clearJobsCache();
  const newJob = {
    ...job,
    createdAt: new Date().toISOString(),
  };
  if (!newJob.id) {
    newJob.id = generateId();
  }
  
  try {
    await setDoc(doc(db, 'jobs', newJob.id), newJob);
    return newJob as Job;
  } catch (error) {
    return handleFirestoreError(error, OperationType.CREATE, `jobs/${newJob.id}`) as any;
  }
}

export const updateJob = async (id: string, job: Partial<Job>): Promise<Job> => {
  clearJobsCache();
  try {
    await updateDoc(doc(db, 'jobs', id), job);
    return { id, ...job } as Job;
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, `jobs/${id}`) as any;
  }
}

export const deleteJob = async (id: string): Promise<void> => {
  clearJobsCache();
  try {
    await deleteDoc(doc(db, 'jobs', id));
  } catch (error) {
    return handleFirestoreError(error, OperationType.DELETE, `jobs/${id}`) as any;
  }
}

export const importJobs = async (mode: 'replace' | 'merge', data: any[], useAI: boolean = true) => {
  clearJobsCache();
  try {
    // 1. Get existing IDs so we don't add duplicates
    const snap = await getDocs(collection(db, 'jobs'));
    const existingIds = new Set(snap.docs.map(doc => doc.id));
    
    // Filter out jobs that already exist only if we are not merging/replacing
    // Actually, mode is always 'merge' or 'replace' here, so we shouldn't filter them out
    // if the intention is to update existing ones. However, if the user imports the same list twice,
    // merge will update them which is fine.
    const newItems = data;

    if (newItems.length === 0) {
      return { success: true, count: 0, message: "No hay ofertas nuevas." };
    }

    // 2. Enhance them using our server-side API if requested
    let enhancedData = newItems;
    if (useAI) {
      try {
        const response = await fetch('/api/enhance-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobs: newItems })
        });
        if (response.ok) {
          const result = await response.json();
          enhancedData = result.jobs;
        } else {
          console.warn("API de mejora de ofertas falló, usando datos originales.");
        }
      } catch (err) {
        console.error("No se pudo contactar al servidor para mejorar ofertas", err);
      }
    }

    const preparedData = enhancedData.map(item => {
      let parsedDate = item.createdAt || new Date().toISOString();
      if (item.date) {
        try {
          const d1 = new Date(item.date.includes('T') ? item.date : `${item.date}T12:00:00Z`);
          if (!isNaN(d1.getTime())) {
            parsedDate = d1.toISOString();
          } else {
            const d2 = new Date(item.date);
            if (!isNaN(d2.getTime())) {
              parsedDate = d2.toISOString();
            }
          }
        } catch (e) {
          console.warn("Invalid date format", item.date);
        }
      }
      return {
        ...item,
        createdAt: parsedDate,
        id: item.id || generateId(),
        category: item.category || inferCategory(item.title)
      };
    });
    
    // Batch writes (max 500 per batch)
    // For simplicity, we just use multiple batches if needed.
    const chunks = [];
    for (let i = 0; i < preparedData.length; i += 400) {
      chunks.push(preparedData.slice(i, i + 400));
    }
    
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const item of chunk) {
        batch.set(doc(db, 'jobs', item.id), item, { merge: mode === 'merge' });
      }
      await batch.commit();
    }
    
    return { success: true, count: preparedData.length };
  } catch (error) {
    return handleFirestoreError(error, OperationType.WRITE, 'jobs') as any;
  }
}

export const bulkUpdateJobsCategory = async (ids: string[], category: string): Promise<void> => {
  clearJobsCache();
  try {
    const chunks = [];
    for (let i = 0; i < ids.length; i += 400) {
      chunks.push(ids.slice(i, i + 400));
    }
    
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.update(doc(db, 'jobs', id), { category });
      }
      await batch.commit();
    }
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, 'jobs') as any;
  }
}

export const bulkDeleteJobs = async (ids: string[]): Promise<void> => {
  clearJobsCache();
  try {
    const chunks = [];
    for (let i = 0; i < ids.length; i += 400) {
      chunks.push(ids.slice(i, i + 400));
    }
    
    for (const chunk of chunks) {
      const batch = writeBatch(db);
      for (const id of chunk) {
        batch.delete(doc(db, 'jobs', id));
      }
      await batch.commit();
    }
  } catch (error) {
    return handleFirestoreError(error, OperationType.DELETE, 'jobs') as any;
  }
}
