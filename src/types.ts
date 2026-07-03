export interface Job {
  id: string;
  driveId?: string;
  title: string;
  source: string;
  category?: string;
  company?: string;
  location?: string;
  description?: string;
  createdAt: string;
  date?: string;
  /** Solo para modo dev / datos de ejemplo: URL de imagen directa que tiene
   *  prioridad sobre el thumbnail de Google Drive. En producción no se usa. */
  previewUrl?: string;
}
