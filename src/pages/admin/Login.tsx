import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle } from '../../lib/firebase';

export default function Login() {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithGoogle();
      navigate('/admin');
    } catch (err: any) {
      setError("Error al iniciar sesión: " + err.message);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Acceso Administrador</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Para administrar las ofertas de empleo, debes iniciar sesión con tu cuenta de Google autorizada.
      </p>
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}
      <button 
        onClick={handleLogin} 
        className="w-full inline-flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm gap-3"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        Ingresar con Google
      </button>
    </div>
  );
}
