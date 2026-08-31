import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginWithEmail, loginWithGoogle } from '../../lib/firebase';

export default function Login() {
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
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
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      await loginWithGoogle();
      navigate('/admin');
    } catch (err: any) {
      console.error("Google login error:", err);
      setError("No se pudo iniciar sesión con Google. Asegúrate de que tu cuenta tenga los permisos correspondientes o intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 bg-white p-8 rounded-xl border border-gray-200 shadow-sm text-center">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Acceso Administrador</h1>
      <p className="text-gray-600 mb-6 text-sm">
        Para administrar las ofertas de empleo, debes iniciar sesión.
      </p>
      
      {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

      <form onSubmit={handleEmailLogin} className="flex flex-col gap-4 mb-4">
        <input 
          type="email" 
          placeholder="Correo electrónico" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] text-sm"
        />
        <input 
          type="password" 
          placeholder="Contraseña" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513] text-sm"
        />
        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#8B4513] hover:bg-[#6b350e] text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50"
        >
          {loading ? 'Iniciando...' : 'Iniciar sesión con Email'}
        </button>
      </form>

      <div className="relative my-6 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <span className="relative bg-white px-3 text-xs text-gray-500 uppercase tracking-wider font-semibold">o también</span>
      </div>

      <button 
        onClick={handleGoogleLogin}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-[#FAF9F7] text-gray-700 font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm text-sm disabled:opacity-50"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.92h6.61a5.66 5.66 0 01-2.45 3.71v3.08h3.95c2.31-2.13 3.63-5.27 3.63-8.64z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.97-1.08 7.96-2.91l-3.95-3.08c-1.09.73-2.5 1.16-4.01 1.16-3.09 0-5.71-2.09-6.64-4.9H1.32v3.18A11.996 11.996 0 0012 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.36 14.27a7.22 7.22 0 010-4.54V6.55H1.32a11.993 11.993 0 000 10.9l4.04-3.18z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.32 0 3.31 2.69 1.32 6.55l4.04 3.18c.93-2.81 3.55-4.98 6.64-4.98z"
          />
        </svg>
        <span>Iniciar sesión con Google</span>
      </button>
    </div>
  );
}
