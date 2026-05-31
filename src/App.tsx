/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import Home from './pages/Home';
import JobDetails from './pages/JobDetails';
import AdminDashboard from './pages/admin/AdminDashboard';
import Login from './pages/admin/Login';
import { Briefcase } from 'lucide-react';

function Layout() {
  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#2D2A26] font-sans flex flex-col">
      <header className="h-20 border-b border-[#E8E2DA] sticky top-0 z-10 px-4 sm:px-8 bg-white flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-12 h-12 overflow-hidden shrink-0 flex items-center justify-center">
              <img src="/logo.webp" alt="Empleos Salta Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-[#4A3F35]">EMPLEOS SALTA</h1>
              <p className="text-[10px] sm:text-xs text-[#8C7E6F] uppercase tracking-widest font-semibold hidden sm:block">Portal de Oportunidades Local</p>
            </div>
          </Link>
          <div className="flex gap-4 sm:gap-8 items-center text-sm font-medium text-[#6B5E4F]">
            {/* hidden on small screens just as a touch of layout */}
            <Link to="/admin" className="px-5 py-2.5 bg-[#4A3F35] text-white rounded-full text-sm font-semibold hover:bg-[#2D2A26] transition-colors">
              Panel Administrador
            </Link>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>
      <footer className="bg-transparent border-t border-[#E8E2DA] p-6 flex flex-col sm:flex-row items-center justify-between gap-4 max-w-7xl mx-auto w-full">
         <p className="text-[11px] text-[#8C7E6F] italic">Hecho con amor en Salta para toda la provincia.</p>
         <p className="text-[11px] text-[#8C7E6F] font-medium">&copy; {new Date().getFullYear()}</p>
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

