import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Job } from '../types';
import { getJobs, deleteJob } from '../api';
import { inferCategory, CATEGORIES, formatRelativeDate } from '../utils';
import { Search, MapPin, Building, ChevronLeft, ChevronRight, Filter, Edit2, Grid, List, Trash2, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import JobEditModal from '../components/JobEditModal';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all'|'3days'|'7days'|'30days'>('all');
  const [sort, setSort] = useState<'recent' | 'relevant' | 'az'>('recent');
  const [viewMode, setViewMode] = useState<'default' | 'compact'>('default');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const setPage = (newPage: number | ((p: number) => number)) => {
    const p = typeof newPage === 'function' ? newPage(page) : newPage;
    setSearchParams(prev => {
      if (p === 1 || isNaN(p)) prev.delete('page');
      else prev.set('page', p.toString());
      return prev;
    }, { replace: true });
  };
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ITEMS_PER_PAGE = 12;

  const [isAdmin, setIsAdmin] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, user => {
      setIsAdmin(!!user);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoading(true);
    getJobs().then(fetchedJobs => {
      const enrichedJobs = fetchedJobs.map(j => ({
        ...j,
        category: j.category || inferCategory(j.title),
      }));
      setJobs(enrichedJobs);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  const categories = useMemo(() => {
    // Keep empty categories if they are in CATEGORIES, but add any others that might exist in jobs
    const cats = new Set([...CATEGORIES, ...jobs.map(j => j.category || 'Otros').filter(Boolean)]);
    return Array.from(cats);
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    let result = jobs;
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(s) || 
        (j.description || '').toLowerCase().includes(s) ||
        (j.company || '').toLowerCase().includes(s)
      );
    }

    if (categoryFilter.length > 0) {
      result = result.filter(j => categoryFilter.includes(j.category || 'Otros'));
    }

    if (dateFilter !== 'all') {
      const now = new Date().getTime();
      const diff = dateFilter === '3days' ? 3 * 24 * 60 * 60 * 1000 : dateFilter === '7days' ? 7 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
      result = result.filter(j => (now - new Date(j.createdAt).getTime()) <= diff);
    }

    result = [...result].sort((a, b) => {
      if (sort === 'az') return a.title.localeCompare(b.title);
      if (sort === 'recent') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0; // 'relevant' can just fallback to recent in this prototype
    });

    return result;
  }, [jobs, search, categoryFilter, dateFilter, sort]);

  const totalPages = Math.ceil(filteredJobs.length / ITEMS_PER_PAGE);

  const handlePageSubmit = () => {
    const newPage = parseInt(pageInput, 10);
    if (!isNaN(newPage)) {
      if (newPage > totalPages) setPage(totalPages);
      else if (newPage < 1) setPage(1);
      else setPage(newPage);
    }
    setIsEditingPage(false);
  };

  const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar esta oferta de empleo?',
      onConfirm: async () => {
        try {
          await deleteJob(jobId);
          setJobs(jobs.filter(j => j.id !== jobId));
        } catch (err) {
          console.error('Error deleting job:', err);
        }
      }
    });
  };

  const currentJobs = filteredJobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleCategory = (cat: string) => {
    setCategoryFilter(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setPage(1);
  };

  const handleClearFilters = () => {
    setCategoryFilter([]);
    setDateFilter('all');
    setSearch('');
    setPage(1);
  };

  const activeFiltersCount = categoryFilter.length + (dateFilter !== 'all' ? 1 : 0) + (search ? 1 : 0);

  return (
    <div className="flex flex-col md:flex-row gap-8">
      <Helmet>
        <title>Empleos Salta | Todas las Ofertas Laborales</title>
        <meta name="description" content="Descubrí las mejores ofertas de empleo y oportunidades laborales en Salta Capital y el interior." />
      </Helmet>

      {/* Sidebar Filters */}
      <motion.aside 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`w-full md:w-72 shrink-0 overflow-hidden transition-all duration-300 ease-in-out md:max-h-none md:opacity-100 md:mt-0 md:mb-0 ${isFilterOpen ? 'max-h-[1200px] opacity-100 mt-4 mb-4' : 'max-h-0 opacity-0'}`}
      >
        <div className="flex flex-col gap-8 bg-[#F9F7F4] p-6 lg:p-8 rounded-xl border border-[#E8E2DA]">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-[#8C7E6F] uppercase tracking-wider">Categorías</h3>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="md:hidden bg-[#8B4513] hover:bg-[#6b350e] text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors"
            >
              Aplicar
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {categories.map(cat => (
              <label key={cat} className="flex items-center gap-3 text-sm cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={categoryFilter.includes(cat)} 
                  onChange={() => toggleCategory(cat)}
                  className="peer hidden"
                />
                <div className="w-5 h-5 flex-shrink-0 border-2 border-[#D1C7BC] rounded-md group-hover:border-[#8B4513] bg-white peer-checked:bg-[#8B4513] peer-checked:border-[#8B4513] flex items-center justify-center transition-colors">
                  <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="currentColor" viewBox="0 0 20 20"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                </div>
                <span className="text-[#4A3F35] peer-checked:font-semibold">{cat}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-[#8C7E6F] uppercase tracking-wider mt-4 mb-4">Publicado en</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => { setDateFilter('all'); setPage(1); }} className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors ${dateFilter === 'all' ? 'bg-[#E8E2DA] text-[#4A3F35] font-medium' : 'text-[#6B5E4F] hover:bg-[#E8E2DA]'}`}>Todas</button>
            <button onClick={() => { setDateFilter('3days'); setPage(1); }} className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors ${dateFilter === '3days' ? 'bg-[#E8E2DA] text-[#4A3F35] font-medium' : 'text-[#6B5E4F] hover:bg-[#E8E2DA]'}`}>Últimos 3 días</button>
            <button onClick={() => { setDateFilter('7days'); setPage(1); }} className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors ${dateFilter === '7days' ? 'bg-[#E8E2DA] text-[#4A3F35] font-medium' : 'text-[#6B5E4F] hover:bg-[#E8E2DA]'}`}>Últimos 7 días</button>
            <button onClick={() => { setDateFilter('30days'); setPage(1); }} className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors ${dateFilter === '30days' ? 'bg-[#E8E2DA] text-[#4A3F35] font-medium' : 'text-[#6B5E4F] hover:bg-[#E8E2DA]'}`}>Últimos 30 días</button>
          </div>
        </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-start w-full">
            <div className="w-full max-w-[320px] sm:max-w-[400px] relative">
              <input 
                type="text" 
                placeholder="Buscar empleo (ej. Administracion, Abogado)..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-4 pr-10 h-[46px] bg-white border border-[#E8E2DA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-transparent transition-all shadow-sm text-[#2D2A26] placeholder-[#A6998A]"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C7E6F]">
                <Search size={18} />
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto items-center shrink-0">
            <div className="relative md:hidden shrink-0">
              <button 
                className="flex items-center justify-center w-[46px] h-[46px] bg-white rounded-xl border border-[#E8E2DA] text-[#6B5E4F] shadow-sm"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={18} />
                {activeFiltersCount > 0 && (
                   <span className="absolute -top-2 -right-2 bg-[#8B4513] text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#FDFCFB]">
                     {activeFiltersCount}
                   </span>
                )}
              </button>
            </div>

            <AnimatePresence>
              {activeFiltersCount > 0 && (
                <motion.div
                   initial={{ opacity: 0, scale: 0.9, width: 0 }}
                   animate={{ opacity: 1, scale: 1, width: 'auto' }}
                   exit={{ opacity: 0, scale: 0.9, width: 0 }}
                   className="overflow-hidden shrink-0"
                >
                  <button 
                     onClick={handleClearFilters}
                     className="flex items-center gap-1 h-[46px] w-max px-3 bg-red-50 text-red-600 rounded-lg border border-red-100 text-xs font-semibold hover:bg-red-100 transition-colors"
                  >
                    <X size={14} />
                    <span className="hidden sm:inline">Limpiar</span>
                    <span className="bg-red-100 px-1.5 py-0.5 rounded-md ml-1">{activeFiltersCount}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-[#E8E2DA] items-center md:flex min-w-max hidden sm:flex h-[46px]">
              <button 
                onClick={() => setViewMode('default')}
                className={`w-[36px] h-[36px] flex items-center justify-center rounded-lg transition-colors ${viewMode === 'default' ? 'bg-[#E8E2DA] text-[#4A3F35]' : 'text-[#8C7E6F] hover:bg-[#F9F7F4]'}`}
                title="Lista"
              >
                <List size={18} />
              </button>
              <button 
                onClick={() => setViewMode('compact')}
                className={`w-[36px] h-[36px] flex items-center justify-center rounded-lg transition-colors ${viewMode === 'compact' ? 'bg-[#E8E2DA] text-[#4A3F35]' : 'text-[#8C7E6F] hover:bg-[#F9F7F4]'}`}
                title="Cuadrícula"
              >
                <Grid size={18} />
              </button>
            </div>
            {/* View Mode Toggle Mobile */}
            <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-[#E8E2DA] sm:hidden">
              <button 
                onClick={() => setViewMode(viewMode === 'default' ? 'compact' : 'default')}
                className="p-2 text-[#4A3F35] bg-[#E8E2DA] rounded-lg"
              >
                {viewMode === 'default' ? <Grid size={18} /> : <List size={18} />}
              </button>
            </div>
            
            <div className="flex gap-1 bg-[#E8E2DA] p-1 rounded-xl shadow-inner w-full sm:w-auto border border-[#E8E2DA]">
              <button 
                onClick={() => setSort('recent')}
                className={`px-4 py-2 flex-1 sm:flex-none text-[11px] uppercase tracking-wider font-bold rounded-lg transition-colors bg-white shadow-sm text-[#4A3F35]`}
              >
                 RECIENTES
              </button>
            </div>
            </div>
          </div>
          <p className="text-[#8C7E6F] text-sm mt-3 hidden sm:block">Mostrando {currentJobs.length} de {filteredJobs.length} resultados encontrados</p>
        </div>

        <div 
          className={`grid gap-4 sm:gap-6 ${
            viewMode === 'compact' 
              ? 'grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
          }`}
        >
          {loading ? (
            Array.from({ length: 12 }).map((_, i) => (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.2, delay: i * 0.03 }}
                key={`skeleton-${i}`} 
                className="animate-pulse bg-white rounded-2xl overflow-hidden border border-[#C0B4A5] border-b-[6px] border-b-[#A6998A] border-l-[6px] border-l-[#D1C7BC] shadow-[0_6px_24px_rgba(139,69,19,0.03)] flex flex-col h-full"
              >
                <div className={`${viewMode === 'compact' ? 'h-24 sm:h-32' : 'h-32 sm:h-40'} bg-[#E8E2DA] relative border-b-2 border-[#D1C7BC]`}>
                   <div className="absolute inset-0 ring-1 ring-inset ring-black/10 z-20 pointer-events-none"></div>
                </div>
                <div className={`${viewMode === 'compact' ? 'p-3' : 'p-5'} flex flex-col flex-1`}>
                  <div className="h-4 bg-[#E8E2DA] rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-[#E8E2DA] rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-[#E8E2DA] rounded w-4/5 mb-4"></div>
                  <div className="mt-auto flex justify-between items-end border-t border-[#E8E2DA]/50 pt-3">
                    <div className="h-4 bg-[#E8E2DA] rounded w-1/3"></div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : currentJobs.length === 0 ? (
            <div 
              key="empty"
              className="col-span-full py-16 text-center text-[#8C7E6F] bg-[#F9F7F4] rounded-2xl border border-dashed border-[#E8E2DA]"
            >
              No se encontraron ofertas que coincidan con tu búsqueda.
            </div>
          ) : currentJobs.map((job, index) => (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: Math.min(index * 0.03, 0.3), ease: "easeOut" }}
              key={job.id}
              className="h-full relative group"
            >
            <Link to={`/jobs/${job.id}`} className="block bg-white rounded-2xl overflow-hidden border border-[#C0B4A5] border-b-[6px] border-b-[#A6998A] border-l-[6px] border-l-[#D1C7BC] shadow-[0_6px_24px_rgba(139,69,19,0.08)] group-hover:shadow-[0_12px_40px_rgba(139,69,19,0.15)] group-hover:-translate-y-1 group-hover:border-b-[#8C7E6F] group-hover:border-l-[#C0B4A5] transition-all duration-300 flex flex-col h-full outline-none focus-within:border-[#8B4513]">
              <div className={`${viewMode === 'compact' ? 'h-24 sm:h-32' : 'h-32 sm:h-40'} w-full overflow-hidden bg-[#E8E2DA] relative border-b-2 border-[#D1C7BC]`}>
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 z-20 pointer-events-none"></div>
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <span className="text-white bg-black/60 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">Ver Flyer</span>
                </div>
                <img 
                  src={`https://drive.google.com/thumbnail?id=${job.driveId || job.id}&sz=w400`} 
                  alt={job.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                    const fallback = document.createElement('div');
                    fallback.className = 'absolute inset-0 w-full h-full flex items-center justify-center bg-[#F9F7F4] p-4 pointer-events-none';
                    fallback.innerHTML = `
                      <div class="bg-[#FFF9E6] w-3/4 max-w-[140px] aspect-square flex flex-col items-center justify-center text-center shadow-md rotate-2 relative border border-[#E8D099]">
                        <div class="w-3 h-3 rounded-full bg-red-600 absolute -top-1.5 shadow-[0_2px_4px_rgba(0,0,0,0.4)]"></div>
                        <span class="text-sm font-black text-[#8B4513] ${viewMode === 'compact' ? 'scale-75' : ''} uppercase tracking-wider leading-tight">Oferta<br/>Obsoleta</span>
                      </div>
                    `;
                    target.parentElement?.insertBefore(fallback, target);
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end text-white bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-0">
                  {job.category && <span className={`text-[10px] uppercase font-bold tracking-widest bg-[#8B4513] w-max rounded shadow-sm relative z-10 ${viewMode === 'compact' ? 'px-1.5 py-0.5 scale-90 origin-bottom-left' : 'px-2 py-0.5'}`}>{job.category}</span>}
                </div>
              </div>
              <div className={`${viewMode === 'compact' ? 'p-3' : 'p-5'} flex flex-col flex-1`}>
                <h4 className={`${viewMode === 'compact' ? 'text-sm font-bold' : 'font-bold'} text-[#4A3F35] leading-tight mb-2 line-clamp-2`}>{job.title}</h4>
                <div className={`text-xs text-[#8C7E6F] mb-4 flex items-center gap-1.5 truncate ${viewMode === 'compact' ? 'scale-90 origin-left' : ''}`}>
                  <span className="bg-[#E8E2DA] text-[#4A3F35] font-semibold px-2 py-0.5 rounded-md truncate max-w-[70%]">
                    {job.company || 'Empresa sin especificar'}
                  </span>
                  {job.location && <span className="truncate opacity-80 shrink-0">• {job.location}</span>}
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <span className={`italic ${viewMode === 'compact' ? 'text-[9px]' : 'text-[10px]'} text-[#A6998A]`}>
                    {(() => {
                      const dateStr = job.date || job.createdAt;
                      const { text, type } = formatRelativeDate(dateStr, !!job.date);
                      if (type === 'obsolete') return <span className="text-yellow-900 font-extrabold bg-yellow-300 border border-yellow-400 px-2 py-0.5 rounded shadow-sm inline-block transform -rotate-2 text-[9px] uppercase tracking-widest">{text}</span>;
                      if (type === 'today') return <span className="text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded">{text}</span>;
                      if (type === 'yesterday') return <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{text}</span>;
                      return text;
                    })()}
                  </span>
                  <span className={`bg-[#8B4513] text-white font-bold rounded-lg shadow-sm group-hover:bg-[#6A340E] group-hover:shadow transition-all ${viewMode === 'compact' ? 'px-2 py-1 text-[10px]' : 'px-3 py-1.5 text-xs'}`}>{viewMode === 'compact' ? 'Ir →' : 'Postularse →'}</span>
                </div>
              </div>
            </Link>
            {isAdmin && (
              <div className="absolute top-2 right-2 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button 
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     setEditingJob(job);
                   }}
                   className="bg-white/90 hover:bg-white text-[#8B4513] p-2 rounded-lg shadow backdrop-blur-sm transition-all pointer-events-auto cursor-pointer"
                   title="Editar oferta"
                 >
                   <Edit2 size={16} />
                 </button>
                 <button 
                   onClick={(e) => handleDeleteJob(job.id, e)}
                   className="bg-white/90 hover:bg-white text-red-600 p-2 rounded-lg shadow backdrop-blur-sm transition-all pointer-events-auto cursor-pointer"
                   title="Eliminar oferta"
                 >
                   <Trash2 size={16} />
                 </button>
              </div>
            )}
            </motion.div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-[#E8E2DA]">
            <button 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
              className="w-8 h-8 rounded-lg border border-[#E8E2DA] flex items-center justify-center text-xs font-bold text-[#6B5E4F] hover:bg-[#E8E2DA] disabled:opacity-50 transition-colors bg-white"
            >
              <ChevronLeft size={16} />
            </button>
            {isEditingPage ? (
              <div className="flex items-center gap-1 bg-[#E8E2DA] px-2 py-1 rounded-lg">
                <input
                  type="number"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handlePageSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handlePageSubmit()}
                  autoFocus
                  className="w-10 text-center text-xs font-bold text-[#4A3F35] bg-white border border-[#D8D2CA] outline-none rounded py-0.5 no-spinners"
                />
                <span className="text-xs font-bold text-[#4A3F35]">/ {totalPages}</span>
              </div>
            ) : (
              <span 
                onClick={() => {
                  setIsEditingPage(true);
                  setPageInput(page.toString());
                }}
                className="cursor-pointer text-xs font-bold text-[#4A3F35] bg-[#E8E2DA] hover:bg-[#D8D2CA] px-3 py-1.5 rounded-lg transition-colors"
                title="Ir a página"
              >
                {page} / {totalPages}
              </span>
            )}
            <button 
              disabled={page === totalPages} 
              onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 rounded-lg border border-[#E8E2DA] flex items-center justify-center text-xs font-bold text-[#6B5E4F] hover:bg-[#E8E2DA] disabled:opacity-50 transition-colors bg-white"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {editingJob && (
        <JobEditModal 
          job={editingJob} 
          onClose={() => setEditingJob(null)} 
          onSave={(updatedJob) => {
            setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
          }} 
        />
      )}

      {confirmDialog && confirmDialog.isOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Confirmar acción</h3>
              <p className="text-gray-600">{confirmDialog.message}</p>
            </div>
            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
              <button 
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
