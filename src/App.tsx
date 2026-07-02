/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import React, { useState, useEffect, useRef } from 'react';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/admin/Login';
import { Briefcase, Linkedin, MessageCircle, AlertTriangle, X, Mail, Code, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Analytics } from '@vercel/analytics/react';

function LegalDisclaimerDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('has_seen_legal_disclaimer');
    if (!hasSeen) {
      setIsOpen(true);
    }
  }, []);

  if (!isOpen) return null;

  const handleClose = () => {
    localStorage.setItem('has_seen_legal_disclaimer', 'true');
    setIsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FAF9F7] flex items-center justify-center text-[#D96B43]">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-[#4A3F35]">Aviso Legal Importante</h2>
            </div>
            <button onClick={handleClose} className="p-2 text-[#8C7E6F] hover:bg-[#FAF9F7] rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-[#6B5E4F] space-y-4 leading-relaxed">
            <p>
              Bienvenido a <strong>Empleos Salta</strong>. Este portal es exclusivamente un espacio de recopilación y difusión de ofertas de empleo públicas o de terceros.
            </p>
            <p>
              <strong>Por favor lee atentamente:</strong>
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
                className="px-6 py-2.5 bg-[#4A3F35] text-white rounded-full text-sm font-semibold hover:bg-[#2D2A26] transition-colors w-full sm:w-auto"
             >
               Entendido
             </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Layout() {
  const [showContact, setShowContact] = useState(false);
  const contactRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
        setShowContact(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D2A26] font-sans flex flex-col">
      <LegalDisclaimerDialog />
      <header className="h-20 border-b border-[#E8E2DA] sticky top-0 z-10 px-4 sm:px-8 bg-white flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 overflow-hidden shrink-0 flex items-center justify-center">
              <img src="/logo.webp" alt="Empleos Salta Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#4A3F35]">EMPLEOS SALTA</h1>
              <p className="text-[10px] sm:text-xs text-[#8C7E6F] uppercase tracking-widest font-semibold hidden sm:block">Portal de Oportunidades Local</p>
            </div>
          </Link>
          <div className="flex gap-2 sm:gap-6 items-center text-sm font-medium text-[#6B5E4F]">
            
            <div className="relative" ref={contactRef}>
              <button 
                onClick={() => setShowContact(!showContact)}
                className={`px-2.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 transition-all rounded-xl shadow-sm ${showContact ? 'bg-[#6A340E] text-white shadow-md' : 'bg-[#8B4513] text-white hover:bg-[#6A340E] hover:shadow-md'}`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contáctanos</span>
              </button>

              <AnimatePresence>
                {showContact && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-xl border border-[#E8E2DA] overflow-hidden z-50 flex flex-col"
                  >
                    <div className="p-3 bg-[#FAF9F7] border-b border-[#E8E2DA]">
                      <p className="text-xs font-bold text-[#8C7E6F] uppercase tracking-wider text-center">Nuestro Equipo</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <a 
                        href="https://www.linkedin.com/in/lucrf/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F9F7F4] transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#E8E2DA] flex items-center justify-center shrink-0 group-hover:bg-blue-100 group-hover:text-blue-700 text-[#6B5E4F] transition-colors">
                          <Code className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#4A3F35] group-hover:text-blue-800 transition-colors">Luciano Flores</span>
                          <span className="text-xs text-[#8C7E6F] font-medium">Programador de la App</span>
                        </div>
                      </a>
                      
                      <a 
                        href="https://www.linkedin.com/in/daniela-gimena-aramayo-0b00203b4/" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#F9F7F4] transition-colors group"
                      >
                        <div className="w-10 h-10 rounded-full bg-[#E8E2DA] flex items-center justify-center shrink-0 group-hover:bg-purple-100 group-hover:text-purple-700 text-[#6B5E4F] transition-colors">
                          <Users className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-[#4A3F35] group-hover:text-purple-800 transition-colors">Daniela Aramayo</span>
                          <span className="text-xs text-[#8C7E6F] font-medium">Recursos Humanos</span>
                        </div>
                      </a>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link to="/admin" className="px-2 py-1.5 sm:px-3 text-[#8C7E6F] text-xs font-medium hover:text-[#4A3F35] hover:bg-[#FDFCFB] rounded-lg transition-colors">
              Admin
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="bg-transparent border-t border-[#E8E2DA] p-6 flex flex-col md:flex-row items-center md:items-end justify-between gap-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col items-center md:items-start gap-1 flex-shrink-0">
          <p className="text-[11px] text-[#8C7E6F] italic">Hecho con amor en Salta para toda la provincia.</p>
          <div className="mt-2 text-center md:text-left">
            <p className="text-[12px] text-[#4A4238] font-medium mb-1">¿Querés publicar una búsqueda o proponer una alianza? ¡Contáctame!</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-1">
              <a href="mailto:lucianorafaelflores@gmail.com" className="text-[12px] text-[#8C7E6F] hover:text-[#D96B43] transition-colors flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                lucianorafaelflores@gmail.com
              </a>
              <a href="https://wa.me/5493874871320" target="_blank" rel="noopener noreferrer" className="text-[12px] text-[#8C7E6F] hover:text-[#D96B43] transition-colors flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                +54 9 387 487-1320
              </a>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right max-w-2xl mt-4 md:mt-0">
           <p className="text-[10px] text-[#8C7E6F]/70 leading-relaxed border border-[#E8E2DA]/50 p-3 rounded-lg bg-[#FAF9F7]/50">
              <strong>Aviso legal:</strong> Este portal es exclusivamente un espacio de recopilación y difusión de ofertas de empleo públicas o de terceros. No representamos a las empresas contratantes ni participamos en los procesos de selección o contratación. Los usuarios deben verificar la autenticidad de las propuestas antes de compartir información personal.
           </p>
           <p className="text-[11px] text-[#8C7E6F] font-medium">&copy; {new Date().getFullYear()}</p>
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
      <Analytics />
    </BrowserRouter>
  );
}
