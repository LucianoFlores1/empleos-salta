import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Job } from '../types';
import { getJobs } from '../api';
import { inferCategory, CATEGORIES, formatRelativeDate } from '../utils';
import { Search, MapPin, Building, ChevronLeft, ChevronRight, Filter } from 'lucide-react';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string[]>([]);
  const [dateFilter, setDateFilter] = useState<'all'|'3days'|'7days'|'30days'>('all');
  const [sort, setSort] = useState<'recent' | 'relevant' | 'az'>('recent');
  const [page, setPage] = useState(1);
  const [isEditingPage, setIsEditingPage] = useState(false);
  const [pageInput, setPageInput] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const ITEMS_PER_PAGE = 12;

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

  const currentJobs = filteredJobs.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const toggleCategory = (cat: string) => {
    setCategoryFilter(prev => 
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
    setPage(1);
  };

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Sidebar Filters */}
      <aside className={`w-full md:w-72 shrink-0 flex flex-col gap-8 bg-[#F9F7F4] p-6 lg:p-8 rounded-xl border border-[#E8E2DA] md:block ${isFilterOpen ? 'block' : 'hidden'}`}>
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
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end justify-between mb-2">
          <div className="flex-1 w-full max-w-lg">
             <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar empleo (ej. Administracion, Abogado)..." 
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-4 pr-10 py-3 bg-white border border-[#E8E2DA] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513] focus:border-transparent transition-all shadow-sm text-[#2D2A26] placeholder-[#A6998A]"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8C7E6F]">
                <Search size={18} />
              </div>
             </div>
             <p className="text-[#8C7E6F] text-sm mt-3 hidden sm:block">Mostrando {currentJobs.length} de {filteredJobs.length} resultados encontrados</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            <button 
              className="md:hidden flex items-center justify-center p-3 bg-white rounded-xl border border-[#E8E2DA] text-[#6B5E4F] shadow-sm"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <Filter size={18} />
            </button>
            <div className="flex gap-1 bg-[#E8E2DA] p-1 rounded-xl shadow-inner w-full sm:w-auto border border-[#E8E2DA]">
              <button 
                onClick={() => setSort('recent')}
                className={`px-4 py-2 flex-1 sm:flex-none text-[11px] uppercase tracking-wider font-bold rounded-lg transition-colors ${sort === 'recent' ? 'bg-white shadow-sm text-[#4A3F35]' : 'text-[#6B5E4F] hover:bg-white/50'}`}
              >
                 RECIENTES
              </button>
              <button 
                onClick={() => setSort('az')}
                className={`px-4 py-2 flex-1 sm:flex-none text-[11px] uppercase tracking-wider font-bold rounded-lg transition-colors ${sort === 'az' ? 'bg-white shadow-sm text-[#4A3F35]' : 'text-[#6B5E4F] hover:bg-white/50'}`}
              >
                 A - Z
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl overflow-hidden border border-[#C0B4A5] border-b-[6px] border-b-[#A6998A] border-l-[6px] border-l-[#D1C7BC] shadow-[0_6px_24px_rgba(139,69,19,0.03)] flex flex-col h-full min-h-[300px]">
                <div className="h-32 sm:h-40 bg-[#E8E2DA] relative border-b-2 border-[#D1C7BC]">
                   <div className="absolute inset-0 ring-1 ring-inset ring-black/10 z-20 pointer-events-none"></div>
                </div>
                <div className="p-5 flex flex-col flex-1 gap-4">
                  <div className="h-5 bg-[#E8E2DA] rounded w-3/4"></div>
                  <div className="h-3 bg-[#E8E2DA] rounded w-full"></div>
                  <div className="mt-auto flex justify-between items-center">
                    <div className="h-4 bg-[#E8E2DA] rounded w-1/3"></div>
                    <div className="h-4 bg-[#E8E2DA] rounded w-1/4"></div>
                  </div>
                </div>
              </div>
            ))
          ) : currentJobs.length === 0 ? (
            <div className="col-span-full py-16 text-center text-[#8C7E6F] bg-[#F9F7F4] rounded-2xl border border-dashed border-[#E8E2DA]">
              No se encontraron ofertas que coincidan con tu búsqueda.
            </div>
          ) : currentJobs.map(job => (
            <Link key={job.id} to={`/jobs/${job.id}`} className="group bg-white rounded-2xl overflow-hidden border border-[#C0B4A5] border-b-[6px] border-b-[#A6998A] border-l-[6px] border-l-[#D1C7BC] shadow-[0_6px_24px_rgba(139,69,19,0.08)] hover:shadow-[0_12px_40px_rgba(139,69,19,0.15)] hover:-translate-y-1 hover:border-b-[#8C7E6F] hover:border-l-[#C0B4A5] transition-all duration-300 flex flex-col h-full outline-none focus-within:border-[#8B4513]">
              <div className="h-32 sm:h-40 w-full overflow-hidden bg-[#E8E2DA] relative border-b-2 border-[#D1C7BC]">
                <div className="absolute inset-0 ring-1 ring-inset ring-black/10 z-20 pointer-events-none"></div>
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                  <span className="text-white bg-black/60 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">Ver Flyer</span>
                </div>
                <img 
                  src={`https://drive.google.com/thumbnail?id=${job.id}&sz=w400`} 
                  alt={job.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.parentElement!.classList.add('flex', 'items-center', 'justify-center', 'bg-[#D1C7BC]');
                    e.currentTarget.parentElement!.innerHTML = '<div class="absolute inset-0 bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"><span class="text-white bg-black/60 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm">Ver Flyer</span></div>';
                  }}
                />
                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end text-white bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none z-0">
                  {job.category && <span className="text-[10px] uppercase font-bold tracking-widest bg-[#8B4513] w-max px-2 py-0.5 rounded shadow-sm relative z-10">{job.category}</span>}
                </div>
              </div>
              <div className="p-5 flex flex-col flex-1">
                <h4 className="font-bold text-[#4A3F35] leading-tight mb-2 line-clamp-2">{job.title}</h4>
                <div className="text-xs text-[#8C7E6F] mb-4 flex items-center gap-1.5 truncate">
                  <span className="bg-[#E8E2DA] text-[#4A3F35] font-semibold px-2 py-0.5 rounded-md truncate max-w-[70%]">
                    {job.company || 'Empresa sin especificar'}
                  </span>
                  {job.location && <span className="truncate opacity-80 shrink-0">• {job.location}</span>}
                </div>
                <div className="flex justify-between items-center mt-auto">
                  <span className="text-[10px] text-[#A6998A] italic">
                    {(() => {
                      const dateStr = job.date || job.createdAt;
                      const { text, type } = formatRelativeDate(dateStr, !!job.date);
                      if (type === 'obsolete') return <span className="text-yellow-900 font-extrabold bg-yellow-300 border border-yellow-400 px-2 py-0.5 rounded shadow-sm inline-block transform -rotate-2 text-[9px] uppercase tracking-widest">{text}</span>;
                      if (type === 'today') return <span className="text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded">{text}</span>;
                      if (type === 'yesterday') return <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{text}</span>;
                      return text;
                    })()}
                  </span>
                  <span className="bg-[#8B4513] text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm group-hover:bg-[#6A340E] group-hover:shadow transition-all">Postularse →</span>
                </div>
              </div>
            </Link>
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
    </div>
  );
}
