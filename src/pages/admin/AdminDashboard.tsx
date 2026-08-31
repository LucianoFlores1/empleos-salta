import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../types';
import { getJobs, deleteJob, importJobs, createJob, updateJob, bulkUpdateJobsCategory, bulkDeleteJobs } from '../../api';
import { inferCategory, CATEGORIES, formatRelativeDate } from '../../utils';
import { Plus, Upload, Trash2, Edit, LogOut, CheckCircle2, AlertCircle, RefreshCw, FolderTree, ArrowDownAZ, ArrowUpAZ, Image as ImageIcon } from 'lucide-react';
import { auth, logout, checkIsAdmin } from '../../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ConfirmDialog from '../../components/ConfirmDialog';
import FlyerImage from '../../components/FlyerImage';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Filters & Selection & Sorting
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkCategory, setBulkCategory] = useState<string>('');
  const [isUpdatingBulk, setIsUpdatingBulk] = useState(false);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [isImporting, setIsImporting] = useState(false);
  const [useAIForImport, setUseAIForImport] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragAction, setDragAction] = useState<boolean | null>(null);

  // Import Preview State
  const [isImportPreviewOpen, setIsImportPreviewOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Job>>({});

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
      } else {
        const isAdm = await checkIsAdmin(user.uid);
        if (!isAdm) {
          navigate('/login');
        } else {
          loadData();
        }
      }
    });
    return () => unsub();
  }, [navigate]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDragging(false);
      setDragAction(null);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  const loadData = () => {
    setLoading(true);
    getJobs().then(fetchedJobs => {
      const enrichedJobs = fetchedJobs.map(j => ({
        ...j,
        category: j.category || inferCategory(j.title),
      }));
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
    setConfirmDialog({
      isOpen: true,
      message: '¿Seguro que deseas eliminar esta oferta?',
      onConfirm: async () => {
        try {
          await deleteJob(id);
          showMsg('success', 'Oferta eliminada correctamente');
          loadData();
        } catch (e: any) {
          showMsg('error', e.message);
        }
      }
    });
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
        
        setImportPreviewData(data);
        setIsImportPreviewOpen(true);
      } catch (err: any) {
        showMsg('error', `Error importando JSON: ${err.message}`);
      }
    };
    reader.onerror = () => showMsg('error', 'Error leyendo archivo');
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    setIsImportPreviewOpen(false);
    try {
      const result = await importJobs('merge', importPreviewData, useAIForImport);
      if (result.count === 0 && result.message) {
        showMsg('success', result.message);
      } else {
        showMsg('success', `Datos importados exitosamente (${result.count} ítems agregados nuevos)`);
      }
      loadData();
    } catch (err: any) {
      showMsg('error', `Error importando JSON: ${err.message}`);
    } finally {
      setIsImporting(false);
      setImportPreviewData([]);
    }
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
    setConfirmDialog({
      isOpen: true,
      message: `¿Mover ${selectedIds.size} oferta(s) a la categoría "${bulkCategory}"?`,
      onConfirm: async () => {
        setIsUpdatingBulk(true);
        try {
          await bulkUpdateJobsCategory(Array.from(selectedIds), bulkCategory);
          showMsg('success', `${selectedIds.size} ofertas recategorizadas`);
          setSelectedIds(new Set());
          loadData();
          setBulkCategory('');
        } catch (err: any) {
          showMsg('error', `Error: ${err.message}`);
        } finally {
          setIsUpdatingBulk(false);
        }
      }
    });
  };

  const handleReevaluateAllCategories = async () => {
    let toUpdate = [];
    for (const job of jobs) {
       const newCat = inferCategory(job.title);
       if (newCat !== job.category) {
         toUpdate.push({ id: job.id, newCat });
       }
    }

    if (toUpdate.length === 0) {
      showMsg('success', 'Todas las ofertas ya tienen la mejor categoría asignada según el título.');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      message: `¿Reevaluar y cambiar de categoría ${toUpdate.length} oferta(s) según sus títulos? No afectará fechas.`,
      onConfirm: async () => {
        setIsUpdatingBulk(true);
        let updatedCount = 0;
        try {
           for (const update of toUpdate) {
               await updateJob(update.id, { category: update.newCat });
               updatedCount++;
           }
           showMsg('success', `${updatedCount} ofertas recategorizadas automáticamente.`);
           loadData();
        } catch (err: any) {
           showMsg('error', `Error: ${err.message}`);
        } finally {
           setIsUpdatingBulk(false);
        }
      }
    });
  };

  const handleAutoCategorizeList = async () => {
    const otrosJobs = jobs.filter(j => j.category === 'Otros');
    if (otrosJobs.length === 0) {
      showMsg('success', 'No hay ofertas en "Otros" para recategorizar.');
      return;
    }
    
    setConfirmDialog({
      isOpen: true,
      message: `¿Auto-recategorizar ${otrosJobs.length} ofertas marcadas como "Otros"?`,
      onConfirm: async () => {
        setIsUpdatingBulk(true);
        let updatedCount = 0;
        try {
           const updates = otrosJobs.map(job => {
             const newCat = inferCategory(job.title);
             if (newCat !== 'Otros') {
               updatedCount++;
               return updateJob(job.id, { category: newCat });
             }
             return Promise.resolve();
           });
           await Promise.all(updates);
           showMsg('success', `${updatedCount} ofertas recategorizadas automáticamente.`);
           loadData();
        } catch (err: any) {
           showMsg('error', `Error: ${err.message}`);
        } finally {
           setIsUpdatingBulk(false);
        }
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      isOpen: true,
      message: `¿Seguro que deseas eliminar ${selectedIds.size} oferta(s)?`,
      onConfirm: async () => {
        setIsUpdatingBulk(true);
        try {
          await bulkDeleteJobs(Array.from(selectedIds));
          showMsg('success', `${selectedIds.size} ofertas eliminadas`);
          setSelectedIds(new Set());
          loadData();
        } catch (err: any) {
          showMsg('error', `Error: ${err.message}`);
        } finally {
          setIsUpdatingBulk(false);
        }
      }
    });
  };

  const handleDeleteAll = async () => {
    if (jobs.length === 0) return;
    setConfirmDialog({
      isOpen: true,
      message: `🚨 ADVERTENCIA: ¿Seguro que deseas ELIMINAR TODAS LAS OFERTAS (${jobs.length}) de la base de datos? Esta acción es irreversible.`,
      onConfirm: async () => {
        setIsUpdatingBulk(true);
        try {
          await bulkDeleteJobs(jobs.map(j => j.id));
          showMsg('success', 'Todas las ofertas han sido eliminadas.');
          setSelectedIds(new Set());
          loadData();
        } catch (err: any) {
          showMsg('error', `Error: ${err.message}`);
        } finally {
          setIsUpdatingBulk(false);
        }
      }
    });
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

  const handleRowMouseDown = (id: string, e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    
    const target = e.target as HTMLElement;
    // Don't trigger if clicking buttons or checkboxes directly
    if (target.closest('button') || target.tagName.toLowerCase() === 'input') {
      return;
    }

    const isSelected = selectedIds.has(id);
    const newAction = !isSelected;
    
    setIsDragging(true);
    setDragAction(newAction);

    const newSelected = new Set(selectedIds);
    if (newAction) newSelected.add(id);
    else newSelected.delete(id);
    setSelectedIds(newSelected);
  };

  const handleRowMouseEnter = (id: string, e: React.MouseEvent) => {
    if (isDragging && dragAction !== null) {
      if (e.buttons !== 1) { // Left mouse button isn't held down anymore
        setIsDragging(false);
        setDragAction(null);
        return;
      }
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (dragAction) next.add(id);
        else next.delete(id);
        return next;
      });
    }
  };

  const handleSelectObsolete = () => {
    const obsoleteIds = filteredJobs
      .filter(j => {
         const dateStr = j.date || j.createdAt;
         return formatRelativeDate(dateStr, !!j.date).type === 'obsolete';
      })
      .map(j => j.id);
    setSelectedIds(new Set(obsoleteIds));
  };

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (categoryFilter) {
      result = result.filter(j => j.category === categoryFilter);
    }
    return result.slice().sort((a, b) => {
      const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === 'desc' ? diff : -diff;
    });
  }, [jobs, categoryFilter, sortOrder]);

  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(jobs.map(j => j.category))).filter(Boolean).sort();
  }, [jobs]);

  return (
    <div className="bg-card rounded-2xl shadow-sm border border-line min-h-[70vh] p-4 sm:p-6 lg:p-8 relative">
      
      {msg && (
        <div role="status" aria-live="polite" className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${msg.type === 'success' ? 'bg-positive-soft text-positive border border-positive-soft' : 'bg-danger-soft text-danger border border-danger-soft'}`}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{msg.text}</span>
        </div>
      )}

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-8 text-sm">
        <div>
          <h1 className="text-2xl font-bold text-ink">Panel de Administración</h1>
          <p className="text-muted text-sm mt-1">Gestiona las ofertas y fuentes de datos.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {selectedIds.size > 0 && (
            <div className="flex items-center gap-2 bg-surface p-1.5 rounded-lg border border-line">
              <span className="text-muted px-2 font-medium">{selectedIds.size} sec.</span>
              <select 
                value={bulkCategory} 
                onChange={(e) => setBulkCategory(e.target.value)}
                className="bg-card border border-line text-ink rounded px-2 py-1 outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="">-- Asignar Categoría --</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <button 
                onClick={handleBulkCategoryUpdate}
                disabled={!bulkCategory || isUpdatingBulk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand hover:bg-brand-dark disabled:bg-gray-300 text-white font-medium rounded transition-colors"
              >
                <FolderTree size={16} /> Mover
              </button>
              <button 
                onClick={handleBulkDelete}
                disabled={isUpdatingBulk}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-danger-soft hover:bg-danger-soft disabled:bg-gray-200 text-danger font-medium rounded transition-colors"
                title="Eliminar seleccionados"
              >
                <Trash2 size={16} /> Eliminar
              </button>
            </div>
          )}

          <div className="h-6 w-px bg-line hidden sm:block"></div>

          <label className="cursor-pointer inline-flex items-center gap-2 text-sm text-ink" title="Usar IA para autocompletar títulos genéricos de imágenes">
            <input type="checkbox" checked={useAIForImport} onChange={(e) => setUseAIForImport(e.target.checked)} className="rounded text-brand focus:ring-brand" />
            Usar IA
          </label>

          <button onClick={handleDeleteAll} disabled={isUpdatingBulk || jobs.length === 0} className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
            <Trash2 size={16} /> Limpiar Todo
          </button>
          <label className={`cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-line hover:bg-line-strong text-ink text-sm font-medium rounded-lg transition-colors border border-transparent whitespace-nowrap ${isImporting ? 'opacity-70 cursor-wait' : ''}`}>
            {isImporting ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />} 
            {isImporting ? 'Importando...' : 'Importar (Combinar)'}
            <input type="file" accept=".json" className="hidden" disabled={isImporting} onChange={(e) => handleJsonUpload(e, 'merge')} />
          </label>
          <button onClick={openNewForm} className="inline-flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-dark text-white text-sm font-medium rounded-lg transition-colors whitespace-nowrap">
            <Plus size={16} /> Crear Oferta
          </button>
          <button onClick={handleLogout} className="inline-flex items-center p-2 text-muted hover:text-danger hover:bg-danger-soft rounded-lg transition-colors" title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <select 
          value={categoryFilter} 
          onChange={(e) => {
            setCategoryFilter(e.target.value);
            setSelectedIds(new Set()); // clear selection on format change
          }}
          className="border border-line bg-surface text-ink text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-line w-full sm:w-auto"
        >
          <option value="">Todas las Categorías ({jobs.length})</option>
          {uniqueCategories.map(cat => (
             <option key={cat} value={cat}>{cat} ({jobs.filter(j => j.category === cat).length})</option>
          ))}
        </select>
        
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="inline-flex items-center gap-2 px-3 py-2 bg-surface border border-line hover:bg-line text-ink text-sm font-medium rounded-lg transition-colors w-full sm:w-auto"
        >
          {sortOrder === 'desc' ? <ArrowDownAZ size={16} /> : <ArrowUpAZ size={16} />}
          {sortOrder === 'desc' ? 'Más recientes primero' : 'Más antiguas primero'}
        </button>
        <button
          onClick={handleSelectObsolete}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto bg-amber-100/50 hover:bg-amber-100 text-amber-800 border border-amber-200"
          title="Seleccionar todas las ofertas obsoletas en la vista actual"
        >
          <AlertCircle size={16} />
          Seleccionar Obsoletas
        </button>
        <button
          onClick={handleAutoCategorizeList}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors w-full sm:w-auto bg-blue-100/50 hover:bg-blue-100 text-blue-800 border border-blue-200"
          title="Recategorizar masivamente todas las ofertas que están en la categoría 'Otros'"
        >
          <RefreshCw size={16} />
          Autocategorizar 'Otros'
        </button>
      </div>

      {loading ? (
        <p className="text-center text-muted py-10">Cargando...</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface border-b border-line text-sm font-semibold text-subtle uppercase tracking-wider">
                <th className="px-4 py-3 w-10 text-center">
                  <input
                    type="checkbox"
                    aria-label="Seleccionar todas las ofertas"
                    checked={filteredJobs.length > 0 && selectedIds.size === filteredJobs.length}
                    ref={input => {
                      if (input) {
                        input.indeterminate = selectedIds.size > 0 && selectedIds.size < filteredJobs.length;
                      }
                    }}
                    onChange={() => toggleSelectAll(filteredJobs)}
                    className="rounded border-line text-brand focus:ring-brand"
                  />
                </th>
                <th className="px-4 py-3">ID / Drive ID</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Compañía</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line text-sm text-ink bg-card">
              {filteredJobs.map(job => (
                <tr 
                  key={job.id} 
                  className={`${selectedIds.has(job.id) ? 'bg-line-strong/20' : 'hover:bg-surface/50'} select-none transition-colors duration-150`}
                  onMouseDown={(e) => handleRowMouseDown(job.id, e)}
                  onMouseEnter={(e) => handleRowMouseEnter(job.id, e)}
                >
                  <td className="px-4 py-3 text-center">
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${job.title}`}
                      checked={selectedIds.has(job.id)}
                      onChange={() => toggleSelectJob(job.id)}
                      className="rounded border-line text-brand focus:ring-brand"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted truncate max-w-[120px]" title={job.driveId || job.id}>{job.driveId || job.id}</td>
                  <td className="px-4 py-3 font-medium text-ink line-clamp-1">{job.title}</td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-surface text-ink">
                      {job.category || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">{job.company || '-'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-muted text-xs">
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : '-'}
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    <button onClick={() => openEditForm(job)} aria-label={`Editar ${job.title}`} title="Editar" className="p-1.5 text-muted hover:text-brand rounded bg-card border border-line shadow-sm transition">
                      <Edit size={16} aria-hidden="true" />
                    </button>
                    <button onClick={() => handleDelete(job.id)} aria-label={`Eliminar ${job.title}`} title="Eliminar" className="p-1.5 text-muted hover:text-red-600 rounded bg-card border border-line shadow-sm transition">
                      <Trash2 size={16} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredJobs.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted">No hay ofertas que coincidan con la búsqueda.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl overflow-hidden">
            <div className="p-6 border-b border-line flex justify-between items-center bg-card z-10 shrink-0">
              <h2 className="text-xl font-bold text-ink">{editingId ? 'Editar Oferta' : 'Nueva Oferta'}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} aria-label="Cerrar" className="text-muted hover:text-subtle text-2xl leading-none">&times;</button>
            </div>

            <div className="flex flex-col md:flex-row flex-1 overflow-y-auto md:overflow-hidden min-h-0">
               {/* Left: Image Preview */}
               <div className="w-full md:w-1/2 bg-surface border-b md:border-b-0 md:border-r border-line p-4 md:p-6 flex flex-col items-center justify-start md:overflow-y-auto shrink-0 md:shrink">
                 {(formData.driveId || formData.id) ? (
                    <div className="relative w-full flex flex-col items-center justify-start">
                       <span className="text-xs font-semibold text-muted mb-2 md:mb-3 uppercase tracking-wider block">Vista previa del flyer</span>
                       <FlyerImage
                         mode="natural"
                         fallbackSize="lg"
                         src={`https://drive.google.com/thumbnail?id=${formData.driveId || formData.id}&sz=w800`}
                         alt="Previsualización del flyer"
                         imgClassName="max-h-[250px] md:max-h-[500px] w-auto rounded-lg shadow-sm border border-line"
                       />
                    </div>
                 ) : (
                    <div className="flex flex-col items-center justify-center text-center text-muted min-h-[150px] md:min-h-[300px] h-full">
                       <ImageIcon className="w-8 h-8 md:w-12 md:h-12 mb-2 md:mb-3 opacity-50" aria-hidden="true" />
                       <p className="text-xs md:text-sm">Ingresá un ID de Google Drive para ver la previsualización</p>
                    </div>
                 )}
               </div>

               {/* Right: Form */}
               <div className="w-full md:w-1/2 flex flex-col md:overflow-y-auto shrink-0">
                 <form id="job-form" onSubmit={handleSubmitForm} className="p-6 flex flex-col gap-4">
                   <div>
                      <label className="block text-sm font-medium text-ink mb-1">Título *</label>
                      <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-ink mb-1">Drive ID (Imágen/Flyer)</label>
                      <input type="text" value={formData.driveId || formData.id || ''} onChange={e => setFormData({...formData, driveId: e.target.value})} placeholder="ej: 1iHcgzhyg-nLXS..." className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand outline-none font-mono text-sm" />
                      <p className="text-xs text-muted mt-1">ID del archivo en Google Drive para mostrar el flyer.</p>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-ink mb-1">URL / Link a Postulación *</label>
                      <input type="url" value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})} required className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="block text-sm font-medium text-ink mb-1">Categoría</label>
                        <select value={formData.category || CATEGORIES[CATEGORIES.length - 1]} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand outline-none bg-card">
                          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                     </div>
                     <div>
                        <label className="block text-sm font-medium text-ink mb-1">Ubicación</label>
                        <input type="text" value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value})} className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                     </div>
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-ink mb-1">Empresa</label>
                      <input type="text" value={formData.company || ''} onChange={e => setFormData({...formData, company: e.target.value})} className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand outline-none" />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-ink mb-1">Descripción corta</label>
                      <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} className="w-full px-3 py-2 border border-line rounded-lg focus:ring-2 focus:ring-brand outline-none resize-none"></textarea>
                   </div>
                 </form>
               </div>
            </div>
            
            <div className="p-4 sm:p-6 border-t border-line flex justify-end gap-3 bg-card shrink-0">
                <button type="button" onClick={() => setIsFormOpen(false)} className="px-5 py-2.5 text-subtle bg-surface hover:bg-line rounded-lg font-medium transition-colors">Cancelar</button>
                <button type="submit" form="job-form" className="px-5 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors">Guardar</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={!!confirmDialog?.isOpen}
        message={confirmDialog?.message || ''}
        loading={isUpdatingBulk}
        zClassName="z-[60]"
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => {
          const action = confirmDialog?.onConfirm;
          setConfirmDialog(null);
          await action?.();
        }}
      />

      {/* Import Preview Modal */}
      {isImportPreviewOpen && (
        <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-line flex justify-between items-center bg-card z-10 shrink-0">
              <h2 className="text-xl font-bold text-ink">Previsualizar Importación ({importPreviewData.length} empleos)</h2>
              <button type="button" onClick={() => setIsImportPreviewOpen(false)} aria-label="Cerrar" className="text-muted hover:text-subtle text-2xl leading-none">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 bg-surface">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {importPreviewData.map((job, idx) => (
                    <div key={idx} className="bg-card border border-line rounded-lg shadow-sm overflow-hidden flex flex-col">
                      <div className="h-56 relative border-b border-line overflow-hidden">
                         {(job.driveId || job.id) ? (
                            <FlyerImage
                               src={`https://drive.google.com/thumbnail?id=${job.driveId || job.id}&sz=w600`}
                               alt={`Flyer de ${job.title || 'la oferta'}`}
                               className="absolute inset-0"
                            />
                         ) : (
                            <div className="absolute inset-0 flex items-center justify-center bg-surface">
                              <ImageIcon className="w-10 h-10 text-line-strong" aria-hidden="true" />
                            </div>
                         )}
                      </div>
                      <div className="p-4 flex flex-col gap-3">
                         <div>
                           <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Título de la oferta</label>
                           <input 
                              type="text" 
                              value={job.title || ''} 
                              onChange={(e) => {
                                 const newData = [...importPreviewData];
                                 newData[idx] = { ...newData[idx], title: e.target.value };
                                 setImportPreviewData(newData);
                              }}
                              className="w-full px-3 py-2 border border-line rounded-md text-sm focus:ring-2 focus:ring-brand outline-none transition-shadow"
                              placeholder="Ej: Administrador contable"
                           />
                         </div>
                         <div>
                           <label className="block text-xs font-semibold text-muted mb-1 uppercase tracking-wider">Empresa (Opcional)</label>
                           <input 
                              type="text" 
                              value={job.company || ''} 
                              onChange={(e) => {
                                 const newData = [...importPreviewData];
                                 newData[idx] = { ...newData[idx], company: e.target.value };
                                 setImportPreviewData(newData);
                              }}
                              className="w-full px-3 py-2 border border-line rounded-md text-sm focus:ring-2 focus:ring-brand outline-none transition-shadow"
                              placeholder="Ej: Consultora X"
                           />
                         </div>
                         <div className="flex items-center gap-2 mt-1">
                           <button onClick={() => {
                               const newData = importPreviewData.filter((_, i) => i !== idx);
                               setImportPreviewData(newData);
                             }} 
                             className="text-red-500 hover:text-red-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                             title="Descartar esta oferta de la importación"
                           >
                              <Trash2 className="w-3.5 h-3.5" /> Descartar
                           </button>
                         </div>
                      </div>
                    </div>
                 ))}
               </div>
               {importPreviewData.length === 0 && (
                 <div className="text-center py-20 text-muted font-medium">
                    No hay empleos para importar.
                 </div>
               )}
            </div>

            <div className="p-4 sm:p-6 border-t border-line flex justify-end gap-3 bg-card shrink-0">
                <button type="button" onClick={() => setIsImportPreviewOpen(false)} className="px-5 py-2.5 text-subtle bg-surface hover:bg-line rounded-lg font-medium transition-colors">Cancelar</button>
                <button 
                  type="button" 
                  onClick={handleConfirmImport} 
                  disabled={importPreviewData.length === 0 || isImporting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand-dark transition-colors disabled:opacity-50"
                >
                  {isImporting ? <RefreshCw size={18} className="animate-spin" /> : <Upload size={18} />}
                  Confirmar Importación ({importPreviewData.length})
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
