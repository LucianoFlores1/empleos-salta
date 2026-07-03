import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { CATEGORIES } from '../utils';
import { updateJob } from '../api';
import { Sparkles, Loader2, X } from 'lucide-react';
import Modal from './Modal';

interface JobEditModalProps {
  job: Job;
  onClose: () => void;
  onSave: (updatedJob: Job) => void;
}

const inputClass =
  'w-full px-3 py-2 border border-line rounded-lg bg-card text-ink-strong focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-shadow';

export default function JobEditModal({ job, onClose, onSave }: JobEditModalProps) {
  const [formData, setFormData] = useState<Partial<Job>>(job);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData(job);
  }, [job]);

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
    setError('');
    try {
      const response = await fetch('/api/enhance-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobs: [formData], force: true })
      });
      if (response.ok) {
        const result = await response.json();
        if (result.jobs && result.jobs[0]) {
          setFormData({
            ...formData,
            title: result.jobs[0].title || formData.title,
            category: result.jobs[0].category || formData.category
          });
        }
      } else {
        setError('No se pudo contactar a la IA. Intentá de nuevo.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al analizar con IA.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await updateJob(job.id, formData);
      onSave({ ...job, ...formData });
      onClose();
    } catch (err) {
      console.error(err);
      setError('No se pudo guardar la oferta. Intentá de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} labelledById="edit-job-title" panelClassName="max-w-xl max-h-[90vh] flex flex-col">
      <div className="p-6 border-b border-line flex justify-between items-center shrink-0">
        <h2 id="edit-job-title" className="text-xl font-bold text-ink">Editar Oferta</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="text-muted hover:text-ink hover:bg-surface rounded-lg p-1.5 transition-colors"
        >
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 overflow-y-auto">
        {error && (
          <div role="alert" aria-live="assertive" className="p-3 bg-danger-soft text-danger rounded-lg text-sm">
            {error}
          </div>
        )}
        <div>
          <label htmlFor="edit-title" className="block text-sm font-medium text-ink mb-1">Título *</label>
          <input id="edit-title" type="text" name="title" value={formData.title || ''} onChange={e => setFormData({ ...formData, title: e.target.value })} required className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-driveId" className="block text-sm font-medium text-ink mb-1">Drive ID (imagen/flyer)</label>
          <input id="edit-driveId" type="text" name="driveId" spellCheck={false} value={formData.driveId || formData.id || ''} onChange={e => setFormData({ ...formData, driveId: e.target.value })} placeholder="ej: 1iHcgzhyg-nLXS…" className={`${inputClass} font-mono text-sm`} />
          <p className="text-xs text-muted mt-1">ID del archivo en Google Drive para mostrar el flyer.</p>
        </div>
        <div>
          <label htmlFor="edit-source" className="block text-sm font-medium text-ink mb-1">URL / link a postulación *</label>
          <input id="edit-source" type="url" name="source" inputMode="url" value={formData.source || ''} onChange={e => setFormData({ ...formData, source: e.target.value })} required className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-category" className="block text-sm font-medium text-ink mb-1">Categoría</label>
            <select id="edit-category" name="category" value={formData.category || CATEGORIES[CATEGORIES.length - 1]} onChange={e => setFormData({ ...formData, category: e.target.value })} className={`${inputClass} bg-card`}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="edit-location" className="block text-sm font-medium text-ink mb-1">Ubicación</label>
            <input id="edit-location" type="text" name="location" value={formData.location || ''} onChange={e => setFormData({ ...formData, location: e.target.value })} className={inputClass} />
          </div>
        </div>
        <div>
          <label htmlFor="edit-company" className="block text-sm font-medium text-ink mb-1">Empresa</label>
          <input id="edit-company" type="text" name="company" value={formData.company || ''} onChange={e => setFormData({ ...formData, company: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label htmlFor="edit-description" className="block text-sm font-medium text-ink mb-1">Descripción corta</label>
          <textarea id="edit-description" name="description" value={formData.description || ''} onChange={e => setFormData({ ...formData, description: e.target.value })} rows={3} className={`${inputClass} resize-none`}></textarea>
        </div>
        <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sticky bottom-0 bg-card pt-3 border-t border-line">
          <button type="button" onClick={handleAIAnalysis} disabled={analyzing || saving} className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-brand bg-surface hover:bg-line rounded-lg transition-colors border border-line-strong disabled:opacity-60">
            {analyzing ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Sparkles size={16} aria-hidden="true" />}
            Sugerir con IA
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 text-subtle bg-surface hover:bg-line rounded-lg font-medium transition-colors disabled:opacity-60" disabled={saving}>Cancelar</button>
            <button type="submit" className="px-5 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-60" disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
