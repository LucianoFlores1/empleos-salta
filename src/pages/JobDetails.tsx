import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { getJob } from '../api';
import { inferCategory } from '../utils';
import { ArrowLeft, MapPin, Building, Calendar, Share2, ExternalLink } from 'lucide-react';

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

  if (loading) return <div className="flex justify-center py-20"><div className="animate-pulse w-10 h-10 bg-[#D1C7BC] rounded-full"></div></div>;
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
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-[#8C7E6F] hover:text-[#4A3F35] mb-6 transition-colors font-medium">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="bg-white rounded-2xl border border-[#E8E2DA] shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* Full Image */}
        <div className="w-full md:w-2/5 aspect-square md:aspect-auto bg-[#F9F7F4] shrink-0 relative">
          <img 
            src={`https://drive.google.com/thumbnail?id=${job.id}&sz=w1200`} 
            alt={job.title}
            className="w-full h-full object-cover object-center absolute inset-0"
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
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

          <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm text-[#6B5E4F] mb-8 border-b border-[#E8E2DA] pb-6">
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
            {job.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-[#8C7E6F]" />
                <span>{new Date(job.createdAt).toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
            )}
          </div>

          <div className="prose prose-sm sm:prose-base text-[#6B5E4F] max-w-none flex-1">
            <h3 className="text-lg font-bold text-[#4A3F35] mb-3">Acerca de la posición</h3>
            {job.description ? (
              <div className="whitespace-pre-wrap">{job.description}</div>
            ) : (
              <p className="italic text-[#8C7E6F]">Mire la imagen adjunta para más detalles sobre esta oferta.</p>
            )}
          </div>

          <div className="mt-10 pt-6 border-t border-[#E8E2DA] flex flex-col sm:flex-row gap-4 items-center justify-between">
            <p className="text-sm text-[#8C7E6F]">¿Cumplis con los requisitos? ¡Postulate ahora!</p>
            
            <a 
              href={job.source} 
              target="_blank" 
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#8B4513] hover:bg-[#723A0F] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              Aplicar a Oferta <ExternalLink size={20} />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
