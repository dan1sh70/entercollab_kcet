import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

let globalShowToast: (message: string, type?: 'success' | 'error' | 'info') => void = () => {};

export function showToast(message: string, type?: 'success' | 'error' | 'info') {
  globalShowToast(message, type);
}

export default function Toast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000);
  };

  useEffect(() => {
    globalShowToast = addToast;
  }, []);

  const colors = {
    success: 'bg-emerald-500',
    error: 'bg-red-500',
    info: 'bg-indigo-500',
  };

  return (
    <div className="fixed top-20 right-4 z-[100] space-y-3">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-enter flex items-center gap-3 px-5 py-3 ${colors[toast.type]} text-white rounded-xl shadow-xl shadow-black/10 min-w-[280px]`}>
          <i className={`fa-solid ${toast.type === 'success' ? 'fa-check-circle' : toast.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}`} />
          <span className="text-sm font-medium flex-1">{toast.message}</span>
          <button onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))} className="text-white/70 hover:text-white transition-colors">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      ))}
    </div>
  );
}
