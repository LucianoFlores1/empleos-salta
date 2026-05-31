import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../types';
import { getJobs, deleteJob, importJobs, createJob, updateJob, bulkUpdateJobsCategory } from '../../api';
import { inferCategory, CATEGORIES } from '../../utils';
import { Plus, Upload, Trash2, Edit, LogOut, CheckCircle2, AlertCircle, RefreshCw, FolderTree } from 'lucide-react';
import { auth, logout } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Filters & Selection
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Job>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate('/login');
      } else {
        loadData();
      }
    });
    return () => unsub();
  }, [navigate]);

  const loadData = () => {
    setLoading(true);
    getJobs().then(fetchedJobs => {
      const enrichedJobs = fetchedJobs.map(j => ({
        ...j,
        category: j.category || inferCategory(j.title),
      }));
      // Sort newest first
      enrichedJobs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setJobs(enrichedJobs);
      setSelectedIds(new Set());
    }).finally(() => setLoading(false));
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const showMsg = (type: 'success'|'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3000);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar esta oferta?')) {
      try {
        await deleteJob(id);
        showMsg('success', 'Oferta eliminada correctamente');
        loadData();
      } catch (e: any) {
        showMsg('error', e.message);
      }
    }
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>, mode: 'replace' | 'merge') => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error('El JSON debe ser un array de objetos');
        
        await importJobs(mode, data);
        showMsg('success', `Datos importados exitosamente (${data.length} ítems)`);
        loadData();
      } catch (err: any) {
        showMsg('error', `Error importando JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const openNewForm = () => {
    setEditingId(null);
    setFormData({ title: '', source: '', category: CATEGORIES[0], company: '', location: '', description: '' });
    setIsFormOpen(true);
  }

  const openEditForm = (job: Job) => {
    setEditingId(job.id);
    setFormData(job);
    setIsFormOpen(true);
  }

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateJob(editingId, formData);
        showMsg('success', 'Oferta actualizada');
      } else {
        await createJob(formData);
        showMsg('success', 'Oferta creada');
      }
      setIsFormOpen(false);
      loadData();
    } catch (err: any) {
      showMsg('error', err.message);
    }
  }

  const handleBulkCategoryUpdate = async () => {
    if (!bulkCategory || selectedIds.size === 0) return;
    if (confirm(`¿Mover ${selectedIds.size} oferta(s) a la categoría "${bulkCategory}"?`)) {
      setIsUpdatingBulk(true);
      try {
        await bulkUpdateJobsCategory(Array.from(selectedIds), bulkCategory);
        showMsg('success', `${selectedIds.size} ofertas recategorizadas`);
        loadData();
        setBulkCategory('');
      } catch (err: any) {
        showMsg('error', `Error: ${err.message}`);
      } finally {
        setIsUpdatingBulk(false);
      }
    }
  };

  const toggleSelectAll = (filteredJobs: Job[]) => {
    if (selectedIds.size === filteredJobs.length && filteredJobs.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredJobs.map(j => j.id)));
    }
  };

  const toggleSelectJob = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const filteredJobs = useMemo(() => {
    if (!categoryFilter) return jobs;
    return jobs.filter(j => j.category === categoryFilter);
  }, [jobs, categoryFilter]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.category))).filter(Boolean).sort();
  }, [jobs]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E2DA] min-h-[70vh] p-4 sm:p-6 lg:p-8 relative">
      
      {msg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${msg.type === 'success' ? 'bg-[#C7D1BC] text-[#2D5A27] border border-[#C7D1BC]' : 'bg-[#D1BCBC] text-[#5A2D2D] border border-[#D1BCBC]'}`}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{msg.text}</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8 text-sm">
        <div>
          <h1 className="text-2xl font-bold text-[#4A3F35]">Panel de Administración</h1>
          <p className="text-[#8C7E6F] text-sm mt-1">Gestiona las ofertas y fuentes de datos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-[#F9F7F4] p-1.5 rounded-lg border border-[#E8E2DA]">
              <span className="text-[#8C7E6F] px-2 font-medium">{selectedIds.size} sec.</span>
              <select 
                value={bulkCategory} 
                onChange={(e) => setBulkCategory(e.target.value)}
                className="bg-white border border-[#E8E2DA] text-[#4A3F35] rounded px-2 py-1 outline-none focus:ring-1 focus:ring-[#8C7E6F]"
              >
                <option value="">-- Asignar Categoría --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button 
                onClick={handleBulkCategoryUpdate}
                disabled={!bulkCategory || isUpdatingBulk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#4A3F35] hover:bg-[#2D2A26] disabled:bg-gray-300 text-white font-medium rounded transition-colors"
              >
                <FolderTree size={16} /> Mover
              </button>
            </div>
          )}

          <div className="h-6 w-px bg-[#E8E2DA] hidden sm:block"></div>

          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#E8E2DA] hover:bg-[#D1C7BC] text-[#4A3F35] text-sm font-medium rounded-lg transition-colors border border-transparent whitespace-nowrap">
            <Upload size={16} /> Importar (Combinar)
            <input type="file" accept=".json" className="hidden" onChange={(e) => handleJsonUpload(e, 'merge')} />
          </label>
          <button onClick={openNewForm} className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A3F35] hover:bg-[#2D2A26] text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
            <Plus size={16} /> Crear Oferta
          </button>
          <button onClick={handleLogout} className="inline-flex items-center p-2 text-[#8C7E6F] hover:text-[#5A2D2D] hover:bg-[#D1BCBC] rounded-lg transition-colors" title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <select 
          value={categoryFilter} 
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setSelectedIds(new Set()); // clear selection on format change
          }}
          className="border border-[#E8E2DA] bg-[#F9F7F4] text-[#4A3F35] text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-[#E8E2DA] w-full sm:w-auto"
        >
          <option value="">Todas las Categorías ({jobs.length})</option>
          {uniqueCategories.map(cat => (
             <option key={cat} value={cat}>{cat} ({jobs.filter(j => j.category === cat).length})</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-4 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    checked={filteredJobs.length > 0 && selectedIds.size === filteredJobs.length}
                    ref={input => {
                      if (input) {
                        input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredJobs.length;
                      }
                    }}
                    onChange={() => toggleSelectAll(filteredJobs)}
                    className="rounded border-gray-300 text-[#4A3F35] focus:ring-[#4A3F35]"
                  />
                </th>
                <th className="px-4 py-3">ID / Drive ID</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Compañía</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700 bg-white">
              {filteredJobs.map(job => (
                <tr key={job.id} className={`${selectedIds.has(job.id) ? 'bg-blue-50/50' : 'hover:bg-gray-50/50'}`}>
                  <td className="px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(job.id)}
                      onChange={() => toggleSelectJob(job.id)}
                      className="rounded border-gray-300 text-[#4A3F35] focus:ring-[#4A3F35]"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 truncate max-w-[120px]" title={job.id}>{job.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900 line-clamp-1">{job.title}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      {job.category || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{job.company || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => openEditForm(job)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-white border border-gray-200 shadow-sm transition">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(job.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-white border border-gray-200 shadow-sm transition">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-gray-500">No hay ofertas que coincidan con la búsqueda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-xl">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Editar Oferta' : 'Nueva Oferta'}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmitForm} className="p-6 flex flex-col gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drive ID (ID del archivo en drive) *</label>
                  <input type="text" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} disabled={!!editingId} required placeholder="ej: 1wggnirX8..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 font-mono text-sm" />
                  {!editingId && <p className="text-xs text-gray-500 mt-1">Este ID se usa para obtener la miniatura de Google Drive.</p>}
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link a Postulación *</label>
                  <input type="url" value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <select value={formData.category || CATEGORIES[CATEGORIES.length - 1]} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                      {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
                    <input type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                 </div>
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Empresa</label>
                  <input type="text" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Descripción corta</label>
                  <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"></textarea>
               </div>
               <div className="mt-4 flex justify-end gap-3 sticky bottom-0 bg-white pt-2 border-t border-gray-100">
                  <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancelar</button>
                  <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">Guardar</button>
               </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
