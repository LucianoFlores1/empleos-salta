export interface Job {
  id: string;
  title: string;
  source: string;
  category?: string;
  company?: string;
  location?: string;
  description?: string;
  createdAt: string;
}
