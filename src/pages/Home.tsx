import React, { useState, useEffect, useMemo, lazy, Suspense } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion, AnimatePresence } from 'motion/react';
import { Job } from '../types';
import { getJobs, deleteJob } from '../api';
import { inferCategory, CATEGORIES, formatRelativeDate, formatJobTitle } from '../utils';
import { Search, ChevronLeft, ChevronRight, Filter, Edit2, Grid, List, Trash2, X, ArrowRight } from 'lucide-react';
import { auth } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ConfirmDialog from '../components/ConfirmDialog';
import CardCover from '../components/CardCover';

const JobEditModal = lazy(() => import('../components/JobEditModal'));

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all'|'3days'|'7days'|'30days'>('all');
  const [sort, setSort] = useState<'recent' | 'relevant' | 'az'>('recent');
  const [viewMode, setViewMode] = useState<'default' | 'compact'>('compact');
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
      return 0; 
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
        <div className="flex flex-col gap-8 bg-surface p-6 lg:p-8 rounded-xl border border-line">
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-muted uppercase tracking-wider">Categorías</h3>
            <button
              onClick={() => setIsFilterOpen(false)}
              className="md:hidden bg-brand hover:bg-brand-dark text-white font-bold text-xs px-3 py-1.5 rounded-lg shadow-sm transition-colors"
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
                  className="peer sr-only"
                />
                <div className="w-5 h-5 flex-shrink-0 border-2 border-line-strong rounded-md group-hover:border-brand bg-card peer-checked:bg-brand peer-checked:border-brand peer-focus-visible:ring-2 peer-focus-visible:ring-brand peer-focus-visible:ring-offset-2 flex items-center justify-center transition-colors">
                  <svg className="w-3 h-3 text-white opacity-0 peer-checked:opacity-100" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true"><path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/></svg>
                </div>
                <span className="text-ink peer-checked:font-semibold">{cat}</span>
              </label>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold text-muted uppercase tracking-wider mt-4 mb-4">Publicado en</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => { setDateFilter('all'); setPage(1); }} className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors ${dateFilter === 'all' ? 'bg-line text-ink font-medium' : 'text-subtle hover:bg-line'}`}>Todas</button>
            <button onClick={() => { setDateFilter('3days'); setPage(1); }} className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors ${dateFilter === '3days' ? 'bg-line text-ink font-medium' : 'text-subtle hover:bg-line'}`}>Últimos 3 días</button>
            <button onClick={() => { setDateFilter('7days'); setPage(1); }} className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors ${dateFilter === '7days' ? 'bg-line text-ink font-medium' : 'text-subtle hover:bg-line'}`}>Últimos 7 días</button>
            <button onClick={() => { setDateFilter('30days'); setPage(1); }} className={`w-full text-left py-2 px-3 text-sm rounded-lg transition-colors ${dateFilter === '30days' ? 'bg-line text-ink font-medium' : 'text-subtle hover:bg-line'}`}>Últimos 30 días</button>
          </div>
        </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6 w-full max-w-full overflow-hidden">
        <div className="flex flex-col gap-4 mb-2">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-start w-full">
            <div className="w-full max-w-[320px] sm:max-w-[400px] relative">
              <label htmlFor="job-search" className="sr-only">Buscar empleo</label>
              <input
                id="job-search"
                type="search"
                name="q"
                autoComplete="off"
                placeholder="Buscar empleo (ej. Administración, Abogado)…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-4 pr-10 h-[46px] bg-card border border-line rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all shadow-sm text-ink-strong placeholder-muted"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none">
                <Search size={18} aria-hidden="true" />
              </div>
            </div>
            
            <div className="flex gap-2 w-full sm:w-auto items-center shrink-0 overflow-x-auto no-scrollbar">
            <div className="relative md:hidden shrink-0">
              <button
                type="button"
                aria-label="Filtros"
                aria-expanded={isFilterOpen}
                className="flex items-center justify-center w-[46px] h-[46px] bg-card rounded-xl border border-line text-subtle shadow-sm hover:bg-surface transition-colors"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <Filter size={18} aria-hidden="true" />
                {activeFiltersCount > 0 && (
                   <span className="absolute -top-2 -right-2 bg-brand text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-canvas">
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
            
            <div role="group" aria-label="Modo de vista" className="flex gap-1 bg-card p-1 rounded-xl shadow-sm border border-line items-center md:flex min-w-max hidden sm:flex h-[46px]">
              <button
                type="button"
                onClick={() => setViewMode('default')}
                aria-label="Vista de lista"
                aria-pressed={viewMode === 'default'}
                className={`w-[36px] h-[36px] flex items-center justify-center rounded-lg transition-colors ${viewMode === 'default' ? 'bg-line text-ink' : 'text-muted hover:bg-surface'}`}
              >
                <List size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('compact')}
                aria-label="Vista de cuadrícula"
                aria-pressed={viewMode === 'compact'}
                className={`w-[36px] h-[36px] flex items-center justify-center rounded-lg transition-colors ${viewMode === 'compact' ? 'bg-line text-ink' : 'text-muted hover:bg-surface'}`}
              >
                <Grid size={18} aria-hidden="true" />
              </button>
            </div>
            
            <div className="flex gap-1 bg-card p-1 rounded-xl shadow-sm border border-line sm:hidden">
              <button
                type="button"
                aria-label={viewMode === 'default' ? 'Cambiar a vista de cuadrícula' : 'Cambiar a vista de lista'}
                onClick={() => setViewMode(viewMode === 'default' ? 'compact' : 'default')}
                className="p-2 text-ink bg-line rounded-lg"
              >
                {viewMode === 'default' ? <Grid size={18} aria-hidden="true" /> : <List size={18} aria-hidden="true" />}
              </button>
            </div>

            <div role="group" aria-label="Ordenar ofertas" className="flex gap-1 bg-surface p-1 rounded-xl w-full sm:w-auto border border-line">
              {([['recent', 'Recientes'], ['az', 'A-Z']] as const).map(([val, label]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => { setSort(val); setPage(1); }}
                  aria-pressed={sort === val}
                  className={`px-4 py-2 flex-1 sm:flex-none text-[11px] uppercase tracking-wider font-bold rounded-lg transition-colors ${sort === val ? 'bg-card shadow-sm text-ink' : 'text-muted hover:text-ink'}`}
                >
                  {label}
                </button>
              ))}
            </div>
            </div>
          </div>
          <p aria-live="polite" className="text-muted text-sm mt-3 hidden sm:block">Mostrando {currentJobs.length} de {filteredJobs.length} resultados encontrados</p>
        </div>

        <div 
          className={`grid gap-4 sm:gap-6 ${
            viewMode === 'compact' 
              ? 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
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
                className="animate-pulse bg-card rounded-2xl overflow-hidden border border-line shadow-sm flex flex-col h-full"
              >
                <div className={`${viewMode === 'compact' ? 'h-24 sm:h-32' : 'h-32 sm:h-40'} bg-surface relative border-b border-line`}></div>
                <div className={`${viewMode === 'compact' ? 'p-3' : 'p-5'} flex flex-col flex-1`}>
                  <div className="h-4 bg-line rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-line rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-line rounded w-4/5 mb-4"></div>
                  <div className="mt-auto flex justify-between items-end border-t border-line/50 pt-3">
                    <div className="h-4 bg-line rounded w-1/3"></div>
                  </div>
                </div>
              </motion.div>
            ))
          ) : currentJobs.length === 0 ? (
            <div 
              key="empty"
              className="col-span-full py-16 text-center text-muted bg-surface rounded-2xl border border-dashed border-line"
            >
              No se encontraron ofertas que coincidan con tu búsqueda.
            </div>
          ) : currentJobs.map((job, index) => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 34, delay: Math.min(index * 0.028, 0.22) }}
              whileHover={{ y: -6 }}
              whileTap={{ scale: 0.985 }}
              className="h-full relative group"
            >
            <Link to={`/jobs/${job.id}`} className="block bg-card rounded-2xl overflow-hidden border border-line shadow-sm hover:shadow-xl hover:shadow-brand/5 hover:border-line-strong transition-[box-shadow,border-color] duration-300 flex flex-col h-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2">
              <div className={`${viewMode === 'compact' ? 'h-28 sm:h-36' : 'h-36 sm:h-44'} w-full overflow-hidden relative border-b border-line`}>
                <CardCover
                  job={job}
                  imgClassName="transition-transform duration-[600ms] ease-out group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-black/15 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                  <span className="text-white bg-black/45 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md translate-y-1 group-hover:translate-y-0 transition-transform duration-300">Ver flyer</span>
                </div>
                {job.category && (
                  <span className="absolute top-2.5 left-2.5 z-20 text-[10px] uppercase font-semibold tracking-wide text-white bg-black/30 backdrop-blur-md border border-white/15 rounded-full px-2.5 py-1 max-w-[80%] truncate">
                    {job.category}
                  </span>
                )}
              </div>
              <div className={`${viewMode === 'compact' ? 'p-3.5' : 'p-5'} flex flex-col flex-1`}>
                <h4 className={`${viewMode === 'compact' ? 'text-[15px]' : 'text-lg'} font-bold text-ink leading-snug mb-3 line-clamp-2 text-pretty group-hover:text-brand transition-colors`}>{formatJobTitle(job.title)}</h4>
                <div className="flex items-center gap-1.5 min-w-0 mb-4">
                  <span className="text-xs text-subtle truncate min-w-0">{job.company || 'Empresa sin especificar'}</span>
                  {job.location && <span className="text-xs text-muted truncate shrink-0 hidden sm:inline">· {job.location}</span>}
                </div>
                <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-line/60">
                  <span className="text-[11px] text-muted">
                    {(() => {
                      const dateStr = job.date || job.createdAt;
                      const { text, type } = formatRelativeDate(dateStr, !!job.date);
                      if (type === 'obsolete') return <span className="text-amber-700 dark:text-amber-400 font-semibold">{text}</span>;
                      if (type === 'today') return <span className="text-brand font-semibold">{text}</span>;
                      if (type === 'yesterday') return <span className="text-subtle font-semibold">{text}</span>;
                      return text;
                    })()}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-brand">
                    {viewMode === 'compact' ? 'Ver' : 'Ver oferta'}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </div>
              </div>
            </Link>
            {isAdmin && (
              <div className="absolute top-2 right-2 flex flex-col gap-2 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                 <button
                   type="button"
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     setEditingJob(job);
                   }}
                   className="bg-card/90 hover:bg-card text-brand p-2 rounded-lg shadow backdrop-blur-sm transition-all pointer-events-auto cursor-pointer"
                   aria-label={`Editar ${job.title}`}
                   title="Editar oferta"
                 >
                   <Edit2 size={16} aria-hidden="true" />
                 </button>
                 <button
                   type="button"
                   onClick={(e) => handleDeleteJob(job.id, e)}
                   className="bg-card/90 hover:bg-card text-red-600 p-2 rounded-lg shadow backdrop-blur-sm transition-all pointer-events-auto cursor-pointer"
                   aria-label={`Eliminar ${job.title}`}
                   title="Eliminar oferta"
                 >
                   <Trash2 size={16} aria-hidden="true" />
                 </button>
              </div>
            )}
            </motion.div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8 pt-6 border-t border-line">
            <button
              type="button"
              aria-label="Página anterior"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-xs font-bold text-subtle hover:bg-line disabled:opacity-50 transition-colors bg-card"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            {isEditingPage ? (
              <div className="flex items-center gap-1 bg-line px-2 py-1 rounded-lg">
                <input
                  type="number"
                  value={pageInput}
                  onChange={(e) => setPageInput(e.target.value)}
                  onBlur={handlePageSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handlePageSubmit()}
                  autoFocus
                  className="w-10 text-center text-xs font-bold text-ink bg-card border border-line-strong outline-none rounded py-0.5 no-spinners"
                />
                <span className="text-xs font-bold text-ink">/ {totalPages}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsEditingPage(true);
                  setPageInput(page.toString());
                }}
                className="text-xs font-bold text-ink bg-line hover:bg-line-strong px-3 py-1.5 rounded-lg transition-colors"
                title="Ir a página"
                aria-label={`Página ${page} de ${totalPages}. Ir a una página`}
              >
                {page} / {totalPages}
              </button>
            )}
            <button
              type="button"
              aria-label="Página siguiente"
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 rounded-lg border border-line flex items-center justify-center text-xs font-bold text-subtle hover:bg-line disabled:opacity-50 transition-colors bg-card"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {editingJob && (
        <Suspense fallback={null}>
          <JobEditModal
            job={editingJob}
            onClose={() => setEditingJob(null)}
            onSave={(updatedJob) => {
              setJobs(jobs.map(j => j.id === updatedJob.id ? updatedJob : j));
            }}
          />
        </Suspense>
      )}

      <ConfirmDialog
        open={!!confirmDialog?.isOpen}
        message={confirmDialog?.message || ''}
        confirmLabel="Eliminar"
        onCancel={() => setConfirmDialog(null)}
        onConfirm={async () => {
          const action = confirmDialog?.onConfirm;
          setConfirmDialog(null);
          await action?.();
        }}
      />
    </div>
  );
}