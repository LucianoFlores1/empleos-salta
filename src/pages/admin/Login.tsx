import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail } from '../../lib/firebase';

export default function Login() {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      navigate('/admin');
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === 'auth/operation-not-allowed') {
        setError("Error: El inicio de sesión con correo no está habilitado en Firebase. Habilítalo en tu consola de Firebase (Authentication > Sign-in method).");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Credenciales inválidas. Verifica tu correo y contraseña.");
      } else if (err.code === 'auth/weak-password') {
        setError("La contraseña es muy débil (debe tener al menos 6 caracteres).");
      } else {
        setError(err.message || "Credenciales inválidas o error de conexión.");
      }
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
    </div>
  );
}
