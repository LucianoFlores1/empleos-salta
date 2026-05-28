import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Job } from '../../types';
import { getJobs, deleteJob, importJobs, createJob, updateJob } from '../../api';
import { inferCategory } from '../../utils';
import { Plus, Upload, Trash2, Edit, LogOut, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<{type: 'success'|'error', text: string} | null>(null);

  // Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Job>>({});

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate]);

  const loadData = () => {
    setLoading(true);
    getJobs().then(fetchedJobs => {
      const enrichedJobs = fetchedJobs.map(j => ({
        ...j,
        category: j.category || inferCategory(j.title),
      }));
      setJobs(enrichedJobs);
    }).finally(() => setLoading(false));
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
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
    setFormData({ title: '', source: '', category: '', company: '', location: '', description: '' });
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#E8E2DA] min-h-[70vh] p-4 sm:p-6 lg:p-8 relative">
      
      {msg && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg ${msg.type === 'success' ? 'bg-[#C7D1BC] text-[#2D5A27] border border-[#C7D1BC]' : 'bg-[#D1BCBC] text-[#5A2D2D] border border-[#D1BCBC]'}`}>
          {msg.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
          <span className="text-sm font-medium">{msg.text}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#4A3F35]">Panel de Administración</h1>
          <p className="text-[#8C7E6F] text-sm mt-1">Gestiona las ofertas y fuentes de datos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#E8E2DA] hover:bg-[#D1C7BC] text-[#4A3F35] text-sm font-medium rounded-lg transition-colors border border-transparent">
            <Upload size={16} /> Importar (Combinar)
            <input type="file" accept=".json" className="hidden" onChange={(e) => handleJsonUpload(e, 'merge')} />
          </label>
          <button onClick={openNewForm} className="inline-flex items-center gap-2 px-4 py-2 bg-[#4A3F35] hover:bg-[#2D2A26] text-white text-sm font-medium rounded-lg transition-colors">
            <Plus size={16} /> Crear Oferta
          </button>
          <button onClick={handleLogout} className="inline-flex items-center p-2 text-[#8C7E6F] hover:text-[#5A2D2D] hover:bg-[#D1BCBC] rounded-lg transition-colors" title="Cerrar Sesión">
            <LogOut size={20} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-gray-500 py-10">Cargando...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                <th className="px-4 py-3">ID / Drive ID</th>
                <th className="px-4 py-3">Título</th>
                <th className="px-4 py-3">Categoría</th>
                <th className="px-4 py-3">Compañía</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500 truncate max-w-[120px]" title={job.id}>{job.id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{job.title}</td>
                  <td className="px-4 py-3">{job.category || '-'}</td>
                  <td className="px-4 py-3">{job.company || '-'}</td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button onClick={() => openEditForm(job)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded bg-white border border-gray-200 shadow-sm transition">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(job.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded bg-white border border-gray-200 shadow-sm transition">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-gray-500">No hay ofertas registradas. Importa un JSON o crea una nueva.</td>
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
            <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white">
              <h2 className="text-xl font-bold text-gray-900">{editingId ? 'Editar Oferta' : 'Nueva Oferta'}</h2>
              <button type="button" onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <form onSubmit={handleSubmitForm} className="p-6 flex flex-col gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                  <input type="text" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drive ID (ID del archivo en drive para ver imagen) *</label>
                  <input type="text" value={formData.id || ''} onChange={e => setFormData({...formData, id: e.target.value})} disabled={!!editingId} required placeholder="ej: 1wggnirX8..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-100 font-mono text-sm" />
                  {!editingId && <p className="text-xs text-gray-500 mt-1">Este ID se usa para obtener la miniatura de Google Drive.</p>}
               </div>
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL / Link a Postulación *</label>
                  <input type="url" value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                    <input type="text" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
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
