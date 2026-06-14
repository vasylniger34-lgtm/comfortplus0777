import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, LogIn, Loader2, User } from 'lucide-react';
import DispatcherPanel from '../components/admin/DispatcherPanel';
import DriverPanel from '../components/admin/DriverPanel';
import { driverService } from '../lib/driverService';
import type { DriverProfile } from '../lib/driverService';

export default function AdminPage() {
  const [code, setCode] = useState('');
  const [role, setRole] = useState<'dispatcher' | 'junior_dispatcher' | 'driver' | null>(() => {
    return (localStorage.getItem('admin_role') as 'dispatcher' | 'junior_dispatcher' | 'driver' | null) || null;
  });
  const [adminName, setAdminName] = useState<string>(() => {
    return localStorage.getItem('admin_name') || '';
  });
  const [activeDriver, setActiveDriver] = useState<DriverProfile | null>(() => {
    const saved = localStorage.getItem('active_driver');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Для вводу імені молодшого диспетчера
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [tempRole, setTempRole] = useState<'junior_dispatcher' | null>(null);
  const [nameInput, setNameInput] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Складніший код для диспетчера замість 1111
    if (code === '8254') {
      setRole('dispatcher');
      setAdminName('Головний диспетчер');
      localStorage.setItem('admin_role', 'dispatcher');
      localStorage.setItem('admin_name', 'Головний диспетчер');
      setError('');
      setCode('');
      return;
    }

    // PIN-коди молодшого диспетчера
    if (code === '8255' || code === '4321') {
      setTempRole('junior_dispatcher');
      setShowNamePrompt(true);
      setError('');
      return;
    }

    setIsLoading(true);
    try {
      const driver = await driverService.getDriverByPin(code);
      if (driver) {
        setActiveDriver(driver);
        setRole('driver');
        localStorage.setItem('admin_role', 'driver');
        localStorage.setItem('active_driver', JSON.stringify(driver));
        setError('');
        setCode('');
      } else {
        setError('Невірний код доступу');
        setCode('');
      }
    } catch (err) {
      console.error(err);
      setError('Помилка авторизації. Спробуйте ще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setError('Будь ласка, введіть ім\'я');
      return;
    }
    const cleanName = nameInput.trim();
    setAdminName(cleanName);
    setRole('junior_dispatcher');
    localStorage.setItem('admin_role', 'junior_dispatcher');
    localStorage.setItem('admin_name', cleanName);
    
    // Скидаємо тимчасові стани
    setShowNamePrompt(false);
    setTempRole(null);
    setNameInput('');
    setCode('');
    setError('');
  };

  if (showNamePrompt) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card max-w-md w-full p-8 border-brand-yellow/30"
        >
          <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-yellow">
            <User size={32} />
          </div>
          
          <h2 className="text-2xl font-display font-black text-white text-center mb-2">Представтеся</h2>
          <p className="text-brand-muted text-sm text-center mb-6">
            Введіть ваше ім'я для початку роботи в системі
          </p>

          <form onSubmit={handleConfirmName} className="space-y-4">
            <div>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Ваше ім'я"
                className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white text-center text-xl focus:border-brand-yellow focus:outline-none transition-colors"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center font-medium">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowNamePrompt(false);
                  setTempRole(null);
                  setNameInput('');
                  setCode('');
                  setError('');
                }}
                className="btn-secondary flex-1 py-3 font-bold"
              >
                Назад
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 py-3 font-bold"
              >
                Підтвердити
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  }

  if (role === 'dispatcher' || role === 'junior_dispatcher') {
    return <DispatcherPanel 
      role={role} 
      adminName={adminName} 
      onLogout={() => {
        setRole(null);
        setAdminName('');
        localStorage.removeItem('admin_role');
        localStorage.removeItem('admin_name');
        localStorage.removeItem('active_driver');
      }} 
    />;
  }

  if (role === 'driver' && activeDriver) {
    return <DriverPanel driver={activeDriver} onLogout={() => { 
      setRole(null); 
      setActiveDriver(null); 
      localStorage.removeItem('admin_role');
      localStorage.removeItem('active_driver');
    }} />;
  }

  return (
    <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card max-w-md w-full p-8 border-brand-yellow/30"
      >
        <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-yellow">
          <Lock size={32} />
        </div>
        
        <h2 className="text-2xl font-display font-black text-white text-center mb-2">Вхід в систему</h2>
        <p className="text-brand-muted text-sm text-center mb-6">
          Введіть ваш персональний код для доступу до панелі
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Введіть код"
              className="w-full bg-brand-surface border border-brand-border rounded-xl px-4 py-3 text-white text-center text-2xl font-display tracking-widest focus:border-brand-yellow focus:outline-none transition-colors"
              maxLength={4}
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 font-bold disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <LogIn size={20} />
            )}
            Увійти
          </button>
        </form>
      </motion.div>
    </div>
  );
}
