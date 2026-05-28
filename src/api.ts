import { Job } from './types';

const API_BASE = '/api';

export const getJobs = async (): Promise<Job[]> => {
  const res = await fetch(`${API_BASE}/jobs`);
  if (!res.ok) throw new Error('Failed to fetch jobs');
  return res.json();
};

export const getJob = async (id: string): Promise<Job> => {
  const res = await fetch(`${API_BASE}/jobs/${id}`);
  if (!res.ok) throw new Error('Failed to fetch job');
  return res.json();
};

// Admin
const getAuthHeaders = () => {
  const token = localStorage.getItem('adminToken');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };
};

export const createJob = async (job: Partial<Job>): Promise<Job> => {
  const res = await fetch(`${API_BASE}/admin/jobs`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(job)
  });
  if (!res.ok) throw new Error('Failed to create job');
  return res.json();
}

export const updateJob = async (id: string, job: Partial<Job>): Promise<Job> => {
  const res = await fetch(`${API_BASE}/admin/jobs/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(job)
  });
  if (!res.ok) throw new Error('Failed to update job');
  return res.json();
}

export const deleteJob = async (id: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/admin/jobs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders()
  });
  if (!res.ok) throw new Error('Failed to delete job');
}

export const importJobs = async (mode: 'replace' | 'merge', data: any[]) => {
  const res = await fetch(`${API_BASE}/admin/jobs/import`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({ mode, data })
  });
  if (!res.ok) throw new Error('Failed to import jobs');
  return res.json();
}
