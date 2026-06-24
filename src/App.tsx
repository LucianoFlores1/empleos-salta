/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';

// El panel de administración solo lo usan los admins → se carga bajo demanda
// y no pesa en el bundle inicial del visitante común.
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const Login = lazy(() => import('./pages/admin/Login'));
import { MessageCircle, AlertTriangle, X, Mail, Code, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Modal from './components/Modal';
import ThemeToggle from './components/ThemeToggle';

function LegalDisclaimerDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_legal_disclaimer');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('has_seen_legal_disclaimer', 'true');
    setIsOpen(false);
  };

  return (
    <Modal open={isOpen} onClose={handleClose} labelledById="legal-title" panelClassName="max-w-lg" closeOnBackdrop={false} zClassName="z-50">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center text-brand shrink-0">
              <AlertTriangle className="w-5 h-5" aria-hidden="true" />
            </div>
            <h2 id="legal-title" className="text-lg font-bold text-ink text-balance">Aviso Legal Importante</h2>
          </div>
          <button onClick={handleClose} aria-label="Cerrar" className="p-2 text-muted hover:bg-surface rounded-full transition-colors shrink-0">
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
        <div className="text-sm text-subtle space-y-4 leading-relaxed">
          <p>
            Bienvenido a <strong>Empleos Salta</strong>. Este portal es exclusivamente un espacio de recopilación y difusión de ofertas de empleo públicas o de terceros.
          </p>
          <p>
            <strong>Por favor leé atentamente:</strong>
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>No representamos a las empresas contratantes.</li>
            <li>No participamos en los procesos de selección, entrevistas o contratación.</li>
            <li>Es tu responsabilidad verificar la autenticidad de las propuestas y las empresas antes de compartir información personal o presentarte a entrevistas.</li>
          </ul>
        </div>
        <div className="mt-8 flex justify-end">
           <button
              onClick={handleClose}
              className="px-6 py-2.5 bg-ink text-white rounded-full text-sm font-semibold hover:bg-ink-strong transition-colors w-full sm:w-auto"
           >
             Entendido
           </button>
        </div>
      </div>
    </Modal>
  );
}

function Layout() {
  const [showContact, setShowContact] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setShowContact(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setShowContact(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div className="min-h-screen bg-canvas text-ink-strong font-sans flex flex-col">
      <LegalDisclaimerDialog />
      <header className="h-20 border-b border-line sticky top-0 z-40 px-4 sm:px-8 bg-card flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group">
            <div className="relative w-11 h-11 sm:w-[52px] sm:h-[52px] shrink-0 grid place-items-center">
              {/* glow solar: aparece al pasar el mouse, como el sol del logo */}
              <span
                aria-hidden="true"
                className="absolute inset-0 rounded-full bg-amber-400/0 blur-xl scale-50 transition-all duration-500 group-hover:bg-amber-400/40 group-hover:scale-125"
              />
              <motion.img
                src="/logo.png"
                alt="Empleos Salta"
                width={52}
                height={52}
                className="relative w-full h-full object-contain"
                initial={{ opacity: 0, y: 6, scale: 0.7, rotate: -8 }}
                animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 240, damping: 15, delay: 0.05 }}
                whileHover={{ scale: 1.1, rotate: -4 }}
                whileTap={{ scale: 0.94 }}
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-ink leading-none group-hover:text-brand transition-colors">EMPLEOS SALTA</h1>
              <p className="text-[10px] sm:text-xs text-muted uppercase tracking-widest font-semibold hidden sm:block mt-0.5">Portal de Oportunidades Local</p>
            </div>
          </Link>
          <div className="flex gap-2 sm:gap-4 items-center text-sm font-medium text-subtle">

            <ThemeToggle />

            <div className="relative" ref={contactRef}>
              <button
                type="button"
                onClick={() => setShowContact(!showContact)}
                aria-haspopup="true"
                aria-expanded={showContact}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all rounded-xl shadow-sm ${showContact ? 'bg-brand-dark text-white shadow-md' : 'bg-brand text-white hover:bg-brand-dark hover:shadow-md'}`}
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Contáctanos</span>
              </button>

              <AnimatePresence>
                {showContact && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-64 bg-card rounded-2xl shadow-xl border border-line overflow-hidden z-50 flex flex-col"
                  >
                    <div className="p-3 bg-surface border-b border-line">
                      <p className="text-xs font-bold text-muted uppercase tracking-wider text-center">Nuestro Equipo</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <a 
                        href="https://www.linkedin.com/in/lucrf/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 text-subtle transition-colors">
                          <Code className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-ink group-hover:text-blue-800 transition-colors">Luciano Flores</span>
                          <span className="text-xs text-muted font-medium">Programador de la App</span>
                        </div>
                      </a>
                      
                      <a 
                        href="https://www.linkedin.com/in/daniela-gimena-aramayo-0b00203b4/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-line flex items-center justify-center shrink-0 group-hover:bg-purple-100 group-hover:text-purple-700 text-subtle transition-colors">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-ink group-hover:text-purple-800 transition-colors">Daniela Aramayo</span>
                          <span className="text-xs text-muted font-medium">Recursos Humanos</span>
                        </div>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/admin" className="px-2 py-1.5 sm:px-3 text-muted text-xs font-medium hover:text-ink hover:bg-canvas rounded-lg transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <Suspense fallback={<div className="py-24 text-center text-muted text-sm">Cargando…</div>}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </Suspense>
      </main>
      <footer className="mt-10 border-t border-line bg-surface/60">
        <div className="max-w-7xl mx-auto w-full px-4 sm:px-8 py-10">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1.4fr]">
            {/* Marca */}
            <div className="flex flex-col items-center md:items-start text-center md:text-left gap-3">
              <div className="flex items-center gap-2.5">
                <img src="/logo.png" alt="" width={40} height={40} className="w-10 h-10 object-contain shrink-0" aria-hidden="true" />
                <div>
                  <p className="font-display font-bold text-ink leading-none tracking-tight">EMPLEOS SALTA</p>
                  <p className="text-[10px] text-muted uppercase tracking-widest font-semibold mt-1">Portal de Oportunidades Local</p>
                </div>
              </div>
              <p className="text-xs text-muted italic max-w-[16rem]">Hecho con ♥ en Salta, para toda la provincia. ☀️</p>
            </div>

            {/* Contacto */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-subtle">Contacto</h2>
              <p className="text-xs text-muted text-center md:text-left max-w-[15rem]">¿Querés publicar una búsqueda o proponer una alianza?</p>
              <div className="flex flex-col gap-2 w-full max-w-[15rem]">
                <a href="mailto:lucianorafaelflores@gmail.com" className="group/c inline-flex items-center gap-2 text-xs font-medium text-subtle bg-card border border-line rounded-lg px-3 py-2 hover:border-brand hover:text-brand transition-colors">
                  <Mail className="w-4 h-4 shrink-0 text-muted group-hover/c:text-brand transition-colors" aria-hidden="true" />
                  <span className="truncate">lucianorafaelflores@gmail.com</span>
                </a>
                <a href="https://wa.me/5493874871320" target="_blank" rel="noopener noreferrer" className="group/c inline-flex items-center gap-2 text-xs font-medium text-subtle bg-card border border-line rounded-lg px-3 py-2 hover:border-brand hover:text-brand transition-colors">
                  <MessageCircle className="w-4 h-4 shrink-0 text-muted group-hover/c:text-brand transition-colors" aria-hidden="true" />
                  <span className="truncate">+54 9 387 487-1320</span>
                </a>
              </div>
            </div>

            {/* Aviso legal */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-subtle">Aviso legal</h2>
              <p className="text-[11px] text-muted leading-relaxed text-center md:text-left">
                Este portal es un espacio de recopilación y difusión de ofertas de empleo de terceros. No representamos a las empresas contratantes ni participamos en los procesos de selección. Verificá la autenticidad de cada propuesta antes de compartir tus datos personales.
              </p>
            </div>
          </div>

          {/* Barra inferior */}
          <div className="mt-9 pt-5 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-muted">
            <p>&copy; {new Date().getFullYear()} Empleos Salta — Todos los derechos reservados.</p>
            <p className="flex items-center gap-1.5">
              Desarrollado por
              <a href="https://www.linkedin.com/in/lucrf/" target="_blank" rel="noopener noreferrer" className="font-semibold text-subtle hover:text-brand transition-colors">Luciano Flores</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="jobs/:id" element={<JobDetails />} />
          <Route path="login" element={<Login />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

