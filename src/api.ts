import { Job } from './types';
import { db, auth } from './lib/firebase';
import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { inferCategory } from './utils';

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
