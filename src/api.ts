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

export const getJobs = async (): Promise<Job[]> => {
  try {
    const snap = await getDocs(collection(db, 'jobs'));
    return snap.docs.map(d => ({ ...d.data(), id: d.id } as Job));
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

// Admin
export const createJob = async (job: Partial<Job>): Promise<Job> => {
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
  try {
    await updateDoc(doc(db, 'jobs', id), job);
    return { id, ...job } as Job;
  } catch (error) {
    return handleFirestoreError(error, OperationType.UPDATE, `jobs/${id}`) as any;
  }
}

export const deleteJob = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'jobs', id));
  } catch (error) {
    return handleFirestoreError(error, OperationType.DELETE, `jobs/${id}`) as any;
  }
}

export const importJobs = async (mode: 'replace' | 'merge', data: any[]) => {
  try {
    const preparedData = data.map(item => ({
       ...item,
       createdAt: item.date 
          ? (item.date.includes('T') ? new Date(item.date).toISOString() : new Date(`${item.date}T12:00:00Z`).toISOString()) 
          : (item.createdAt || new Date().toISOString()),
       id: item.id || generateId(),
       category: item.category || inferCategory(item.title)
    }));
    
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
