import { useState, type MouseEvent } from 'react';
import { flushSync } from 'react-dom';
import { Sun, Moon } from 'lucide-react';

function isDark() {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
}

function applyTheme(dark: boolean) {
  const root = document.documentElement;
  root.classList.toggle('dark', dark);
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  } catch {
    /* ignore */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', dark ? '#211b15' : '#ffffff');
}

export default function ThemeToggle({ className = '' }: { className?: string }) {
  const [dark, setDark] = useState(isDark);

  const toggle = (e: MouseEvent<HTMLButtonElement>) => {
    const next = !dark;
    const commit = () => {
      flushSync(() => setDark(next));
      applyTheme(next);
    };

    const reduce =
      typeof matchMedia !== 'undefined' &&
      matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Sin soporte de View Transitions o con movimiento reducido → cambio simple
    const startVT = (document as any).startViewTransition?.bind(document);
    if (!startVT || reduce) {
      setDark(next);
      applyTheme(next);
      return;
    }

    // Punto de origen del círculo = el click; radio = esquina más lejana
    const x = e.clientX;
    const y = e.clientY;
    const r = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const root = document.documentElement;
    root.style.setProperty('--vt-x', `${x}px`);
    root.style.setProperty('--vt-y', `${y}px`);
    root.style.setProperty('--vt-r', `${r}px`);

    startVT(commit);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={`relative grid place-items-center w-9 h-9 rounded-xl border border-line bg-card text-ink hover:bg-surface transition-colors overflow-hidden ${className}`}
    >
      <Sun
        size={18}
        className={`col-start-1 row-start-1 transition-all duration-300 ${dark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}
        aria-hidden="true"
      />
      <Moon
        size={18}
        className={`col-start-1 row-start-1 transition-all duration-300 ${dark ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}
        aria-hidden="true"
      />
    </button>
  );
}
