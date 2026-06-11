import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithGoogle, loginWithEmail } from '../../lib/firebase';

export default function Login() {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/admin');
    } catch (err: any) {
      setError("Error al iniciar sesión: " + err.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      navigate('/admin');
    } catch (err: any) {
      setError("Credenciales inválidas o error de conexión.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Acceso Administrador</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Para administrar las ofertas de empleo, debes iniciar sesión.
      </p>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 mb-6">
        <input 
          type="email" 
          placeholder="Correo electrónico" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] text-sm"
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] text-sm"
        />
        <button 
          type="submit" 
          className="w-full bg-[#8B4513] hover:bg-[#6b350e] text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm"
        >
          Iniciar sesión
        </button>
      </form>

      <div className="relative flex items-center py-2 mb-6">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink-0 mx-4 text-gray-400 text-sm">o</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <button 
        type="button"
        onClick={handleGoogleLogin} 
        className="w-full inline-flex items-center justify-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-medium py-2.5 px-4 rounded-lg transition-colors shadow-sm gap-3"
      >
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
        Ingresar con Google
      </button>
    </div>
  );
}
