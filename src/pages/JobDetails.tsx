import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { motion } from 'motion/react';
import { Job } from '../types';
import { getJob, deleteJob } from '../api';
import { inferCategory, formatRelativeDate, formatJobTitle } from '../utils';
import { ArrowLeft, MapPin, Building, Calendar, Share2, ExternalLink, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react';
import { auth, checkIsAdmin } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import ConfirmDialog from '../components/ConfirmDialog';
import FlyerImage from '../components/FlyerImage';

const JobEditModal = lazy(() => import('../components/JobEditModal'));

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{isOpen: boolean, message: string, onConfirm: () => void} | null>(null);
  const [copyMsg, setCopyMsg] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      if (user) {
        const isAdm = await checkIsAdmin(user.uid);
        setIsAdmin(isAdm);
      } else {
        setIsAdmin(false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
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
      <div className="h-6 w-24 bg-line rounded mb-6"></div>
      <div className="bg-card rounded-2xl border border-line shadow-sm overflow-hidden flex flex-col md:flex-row h-[600px]">
        <div className="w-full md:w-1/2 lg:w-[55%] bg-surface border-r border-line"></div>
        <div className="p-6 md:p-8 flex flex-col flex-1 gap-6">
           <div>
             <div className="h-6 bg-line rounded w-16 mb-4"></div>
             <div className="h-10 bg-line rounded w-3/4"></div>
           </div>
           <div className="flex gap-4">
             <div className="h-5 bg-line rounded w-24"></div>
             <div className="h-5 bg-line rounded w-32"></div>
           </div>
           <div className="mt-8 flex-1">
             <div className="h-4 bg-line rounded w-full mb-3"></div>
             <div className="h-4 bg-line rounded w-full mb-3"></div>
             <div className="h-4 bg-line rounded w-2/3"></div>
           </div>
        </div>
      </div>
    </div>
  );
  if (error || !job) return (
    <div className="text-center py-20 text-muted bg-card rounded-2xl border border-line p-8 shadow-sm max-w-lg mx-auto">
      <h2 className="text-xl font-bold text-ink mb-2">Oferta no encontrada</h2>
      <p className="mb-6">Es posible que la oferta haya expirado o haya sido eliminada.</p>
      <Link to="/" className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-white rounded-full text-sm font-semibold hover:bg-brand-dark transition-colors">
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
      setCopyMsg(true);
      setTimeout(() => setCopyMsg(false), 3000);
    }
  };

  const handleDeleteJob = async () => {
    setConfirmDialog({
      isOpen: true,
      message: '¿Estás seguro de que deseas eliminar esta oferta de empleo?',
      onConfirm: async () => {
        try {
          await deleteJob(job.id);
          navigate('/', { replace: true });
        } catch (err) {
          console.error('Error deleting job:', err);
        }
      }
    });
  };

  const niceTitle = formatJobTitle(job.title);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="max-w-5xl mx-auto"
    >
      <Helmet>
        <title>{niceTitle} | Empleos Salta</title>
        <meta name="description" content={`Oferta laboral en Salta: ${niceTitle}. ${job.company ? 'Empresa: ' + job.company + '.' : ''} postúlate ahora.`} />
        <meta property="og:title" content={`${niceTitle} | Empleos Salta`} />
        <meta property="og:description" content={`Oferta laboral en Salta: ${niceTitle}. ${job.company ? 'Empresa: ' + job.company + '.' : ''} postúlate ahora.`} />
        <meta property="og:image" content={`https://drive.google.com/thumbnail?id=${job.driveId || job.id}&sz=w1200`} />
        <meta property="og:url" content={window.location.href} />
        <meta name="twitter:title" content={`${niceTitle} | Empleos Salta`} />
        <meta name="twitter:description" content={`Oferta laboral en Salta: ${niceTitle}. ${job.company ? 'Empresa: ' + job.company + '.' : ''} postúlate ahora.`} />
        <meta name="twitter:image" content={`https://drive.google.com/thumbnail?id=${job.driveId || job.id}&sz=w1200`} />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org/",
            "@type": "JobPosting",
            "title": job.title,
            "description": job.description || 'Consulta el flyer para más detalles.',
            "identifier": {
              "@type": "PropertyValue",
              "name": job.company || "Empresa Confidencial",
              "value": job.id
            },
            "datePosted": job.date || job.createdAt || new Date().toISOString(),
            "validThrough": new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            "employmentType": "FULL_TIME",
            "hiringOrganization": {
              "@type": "Organization",
              "name": job.company || "Empresa Confidencial"
            },
            "jobLocation": {
              "@type": "Place",
              "address": {
                "@type": "PostalAddress",
                "addressLocality": job.location || "Salta",
                "addressRegion": "Salta",
                "addressCountry": "AR"
              }
            }
          })}
        </script>
      </Helmet>

      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted hover:text-ink mb-6 transition-colors font-medium">
        <ArrowLeft size={16} /> Volver
      </button>

      <div className="bg-card rounded-2xl border border-line shadow-sm overflow-hidden flex flex-col md:flex-row">
        
        {/* Full Image */}
        <div className="w-full md:w-1/2 lg:w-[55%] bg-surface shrink-0 p-4 sm:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-line">
          <a href={`https://drive.google.com/uc?export=view&id=${job.driveId || job.id}`} target="_blank" rel="noopener noreferrer" className="relative group w-full max-w-lg mx-auto block overflow-hidden rounded-xl shadow-md border border-line">
            <FlyerImage
              mode="natural"
              fallbackSize="lg"
              loading="eager"
              src={job.previewUrl || `https://drive.google.com/thumbnail?id=${job.driveId || job.id}&sz=w1200`}
              alt={`Flyer de la oferta: ${job.title}`}
              imgClassName="transition-transform duration-300 group-hover:scale-[1.02]"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
               <span className="bg-card text-ink px-4 py-2 rounded-lg font-semibold flex items-center gap-2 shadow-lg">
                 <ImageIcon size={18} aria-hidden="true" /> Ampliar flyer
               </span>
            </div>
          </a>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col flex-1">
          <div className="flex justify-between items-start gap-4 mb-4">
            <div>
              {job.category && <span className="text-[10px] uppercase font-bold tracking-widest bg-brand text-white w-max px-2 py-0.5 rounded shadow-sm mb-3 inline-block">{job.category}</span>}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-ink leading-tight text-pretty">{niceTitle}</h1>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button onClick={() => setIsEditing(true)} className="p-2 text-brand hover:text-brand-dark hover:bg-line rounded-lg transition-colors shrink-0" title="Editar oferta">
                    <Edit2 size={24} />
                  </button>
                  <button onClick={handleDeleteJob} className="p-2 text-red-600 hover:text-red-800 hover:bg-line rounded-lg transition-colors shrink-0" title="Eliminar oferta">
                    <Trash2 size={24} />
                  </button>
                </>
              )}
              <button onClick={handleShare} className="p-2 text-muted hover:text-brand hover:bg-line rounded-lg transition-colors shrink-0" title="Compartir">
                <Share2 size={24} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-y-3 gap-x-6 text-sm text-subtle mb-8">
            <div className="flex items-center gap-2">
              <Building size={18} className="text-muted" />
              <span className="font-semibold text-ink">{job.company || 'Empresa sin especificar'}</span>
            </div>
            {job.location && (
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-muted" />
                <span>{job.location}</span>
              </div>
            )}
            {(job.date || job.createdAt) && (
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-muted" />
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
             <div className="prose prose-sm sm:prose-base text-subtle max-w-none flex-1 mb-6">
                <h3 className="text-lg font-bold text-ink mb-3">Información Adicional</h3>
                <div className="whitespace-pre-wrap">{job.description}</div>
             </div>
          )}

          <div className={`mt-auto ${job.description ? 'pt-6 border-t border-line' : ''}`}>
            <div className="bg-surface rounded-xl p-5 md:p-6 border border-line">
              <div className="flex items-start gap-3 sm:gap-4 flex-col sm:flex-row">
                <div className="bg-brand text-white p-2.5 rounded-lg shrink-0">
                  <ExternalLink size={20} />
                </div>
                <div>
                  <h4 className="text-ink font-bold text-base mb-2">¿Cómo postularse?</h4>
                  <p className="text-sm text-muted leading-relaxed mb-3">
                    Toda la información sobre contacto, requisitos o correos para enviar CV está <strong>detallada en el flyer</strong> de la oferta.
                  </p>
                  <ul className="text-sm text-muted leading-relaxed list-disc pl-4 space-y-1">
                    <li>Revisá atentamente el flyer para ver el email o teléfono de la empresa.</li>
                    <li>Tocá la imagen para ampliarla y leer todo con claridad.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {isEditing && (
        <Suspense fallback={null}>
          <JobEditModal
            job={job}
            onClose={() => setIsEditing(false)}
            onSave={(updatedJob) => {
               setJob(updatedJob);
            }}
          />
        </Suspense>
      )}

      <div aria-live="polite" className="sr-only">{copyMsg ? 'Link copiado al portapapeles' : ''}</div>
      {copyMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-brand-dark text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
          Link copiado al portapapeles
        </div>
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
    </motion.div>
  );
}
