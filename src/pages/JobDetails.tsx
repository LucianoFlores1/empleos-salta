import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { getJob } from '../api';
import { inferCategory, formatRelativeDate } from '../utils';
import { ArrowLeft, MapPin, Building, Calendar, Share2, ExternalLink, Image as ImageIcon } from 'lucide-react';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (id) {
      getJob(id).then(j => {
        setJob({
          ...j,
          category: j.category || inferCategory(j.title)
        });
        setLoading(false);
      }).catch(() => {
        setError(true);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) return (
    <div className="max-w-5xl mx-auto animate-pulse">
      <div className="h-6 w-24 bg-[#E8E2DA] rounded mb-6"></div>
      <div className="bg-white rounded-2xl border border-[#E8E2DA] shadow-sm overflow-hidden flex flex-col md:flex-row h-[600px]">
        <div className="w-full md:w-1/2 lg:w-[55%] bg-[#F9F7F4] border-r border-[#E8E2DA]"></div>
        <div className="p-6 md:p-8 flex flex-col flex-1 gap-6">
           <div>
             <div className="h-6 bg-[#E8E2DA] rounded w-16 mb-4"></div>
             <div className="h-10 bg-[#E8E2DA] rounded w-3/4"></div>
           </div>
           <div className="flex gap-4">
             <div className="h-5 bg-[#E8E2DA] rounded w-24"></div>
             <div className="h-5 bg-[#E8E2DA] rounded w-32"></div>
           </div>
           <div className="mt-8 flex-1">
             <div className="h-4 bg-[#E8E2DA] rounded w-full mb-3"></div>
             <div className="h-4 bg-[#E8E2DA] rounded w-full mb-3"></div>
             <div className="h-4 bg-[#E8E2DA] rounded w-2/3"></div>
           </div>
        </div>
      </div>
    </div>
  );
  if (error || !job) return (
    <div className="text-center py-20 text-[#8C7E6F] bg-white rounded-2xl border border-[#E8E2DA] p-8 shadow-sm max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-[#4A3F35] mb-2">Oferta no encontrada</h2>
      <p className="mb-6">Es posible que la oferta haya expirado o haya sido eliminada.</p>
      <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4A3F35] text-white rounded-full text-sm font-semibold hover:bg-[#2D2A26] transition-colors">
        <ArrowLeft size={18} /> Volver al inicio
      </Link>
    </div>
  );

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: job.title,
        url: window.location.href
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado al portapapeles');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#8C7E6F] hover:text-[#4A3F35] mb-6 transition-colors font-medium">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="bg-white rounded-2xl border border-[#E8E2DA] shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* Full Image */}
        <div className="w-full md:w-1/2 lg:w-[55%] bg-[#F9F7F4] shrink-0 p-4 sm:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#E8E2DA]">
          <a href={`https://drive.google.com/uc?export=view&id=${job.id}`} target="_blank" rel="noopener noreferrer" className="relative group w-full max-w-lg mx-auto block">
            <img 
              src={`https://drive.google.com/thumbnail?id=${job.id}&sz=w1200`} 
              alt={job.title}
              className="w-full h-auto object-contain rounded-xl shadow-md border border-[#E8E2DA] transition-transform group-hover:scale-[1.02] duration-300"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center pointer-events-none">
               <span className="bg-white text-[#4A3F35] px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg">
                 <ImageIcon size={18} /> Ampliar Flyer
               </span>
            </div>
          </a>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              {job.category && <span className="text-[10px] uppercase font-bold tracking-widest bg-[#8B4513] text-white w-max px-2 py-0.5 rounded shadow-sm mb-3 inline-block">{job.category}</span>}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#4A3F35] leading-tight">{job.title}</h1>
            </div>
            <button onClick={handleShare} className="p-2 text-[#8C7E6F] hover:text-[#8B4513] hover:bg-[#E8E2DA] rounded-lg transition-colors shrink-0" title="Compartir">
              <Share2 size={24} />
            </button>
          </div>

          <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm text-[#6B5E4F] mb-8">
            {job.company && (
              <div className="flex items-center gap-2">
                <Building size={18} className="text-[#8C7E6F]" />
                <span className="font-semibold text-[#4A3F35]">{job.company}</span>
              </div>
            )}
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-[#8C7E6F]" />
                <span>{job.location}</span>
              </div>
            )}
            {(job.date || job.createdAt) && (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#8C7E6F]" />
                <span>
                  {(() => {
                    const dateStr = job.date || job.createdAt;
                    const { text, type } = formatRelativeDate(dateStr, !!job.date);
                    if (type === 'obsolete') return <span className="text-yellow-900 font-extrabold bg-yellow-300 border border-yellow-400 px-2 py-0.5 rounded shadow-sm inline-block transform -rotate-1 text-xs uppercase tracking-widest ml-1">{text}</span>;
                    if (type === 'today') return <span className="text-orange-600 font-bold bg-orange-50 px-1.5 py-0.5 rounded">{text}</span>;
                    if (type === 'yesterday') return <span className="text-blue-600 font-bold bg-blue-50 px-1.5 py-0.5 rounded">{text}</span>;
                    return new Date(dateStr).toLocaleDateString('es-AR', { 
                      timeZone: job.date ? 'UTC' : undefined, 
                      year: 'numeric', month: 'long', day: 'numeric' 
                    });
                  })()}
                </span>
              </div>
            )}
          </div>

          {job.description && (
             <div className="prose prose-sm sm:prose-base text-[#6B5E4F] max-w-none flex-1 mb-6">
                <h3 className="text-lg font-bold text-[#4A3F35] mb-3">Información Adicional</h3>
                <div className="whitespace-pre-wrap">{job.description}</div>
             </div>
          )}

          <div className={`mt-auto ${job.description ? 'pt-6 border-t border-[#E8E2DA]' : ''}`}>
            <div className="bg-[#F9F7F4] rounded-xl p-5 md:p-6 border border-[#E8E2DA]">
              <div className="flex items-start gap-3 sm:gap-4 flex-col sm:flex-row">
                <div className="bg-[#8B4513] text-white p-2.5 rounded-lg shrink-0">
                  <ExternalLink size={20} />
                </div>
                <div>
                  <h4 className="text-[#4A3F35] font-bold text-base mb-2">¿Cómo postularse?</h4>
                  <p className="text-sm text-[#8C7E6F] leading-relaxed mb-3">
                    Toda la información sobre contacto, requisitos o correos para enviar CV está <strong>detallada en el flyer</strong> de la oferta.
                  </p>
                  <ul className="text-sm text-[#8C7E6F] leading-relaxed list-disc pl-4 space-y-1">
                    <li>Revisá atentamente el flyer para ver el email o teléfono de la empresa.</li>
                    <li>Tocá la imagen para ampliarla y leer todo con claridad.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
