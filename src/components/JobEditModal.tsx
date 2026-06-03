import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { CATEGORIES } from '../utils';
import { updateJob } from '../api';
import { Sparkles, Loader2 } from 'lucide-react';

interface JobEditModalProps {
  job: Job;
  onClose: () => void;
  onSave: (updatedJob: Job) => void;
}

export default function JobEditModal({ job, onClose, onSave }: JobEditModalProps) {
  const [formData, setFormData] = useState<Partial<Job>>(job);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    setFormData(job);
  }, [job]);

  const handleAIAnalysis = async () => {
    setAnalyzing(true);
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
        alert("Error al contactar a la IA");
      }
    } catch (err) {
      console.error(err);
      alert("Error al analizar con IA");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateJob(job.id, formData);
      onSave({ ...job, ...formData });
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error updating job');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4" onClick={(e) => { if(e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">Editar Oferta</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
              <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] outline-none" />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Drive ID (Imágen/Flyer)</label>
              <input type="text" value={formData.driveId || formData.id || ''} onChange={e => setFormData({...formData, driveId: e.target.value})} placeholder="ej: 1iHcgzhyg-nLXS..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] outline-none font-mono text-sm" />
              <p className="text-xs text-gray-500 mt-1">ID del archivo en Google Drive para mostrar el flyer.</p>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link a Postulación *</label>
              <input type="url" value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] outline-none" />
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select value={formData.category || CATEGORIES[CATEGORIES.length - 1]} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] outline-none bg-white">
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                <input type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] outline-none" />
             </div>
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
              <input type="text" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] outline-none" />
           </div>
           <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción corta</label>
              <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] outline-none resize-none"></textarea>
           </div>
           <div className="mt-4 flex justify-between items-center sticky bottom-0 bg-white pt-2 border-t border-gray-100">
              <button type="button" onClick={handleAIAnalysis} disabled={analyzing || saving} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#8B4513] bg-[#F9F7F4] hover:bg-[#E8E2DA] rounded-lg transition-colors border border-[#D1C7BC]">
                {analyzing ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                Sugerir con IA
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={onClose} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors" disabled={saving}>Cancelar</button>
                <button type="submit" className="px-5 py-2.5 bg-[#8B4513] text-white rounded-lg font-medium hover:bg-[#6b350e] transition-colors" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
           </div>
        </form>
      </div>
    </div>
  );
}
