import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Lock, User as UserIcon, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const formatPhone = (val: string) => {
    let digits = val.replace(/\D/g, '');
    if (!digits.startsWith('380')) digits = '380' + digits.replace(/^380/, '');
    digits = digits.slice(0, 12);
    let formatted = '+380';
    if (digits.length > 3) formatted += ' ' + digits.slice(3, 5);
    if (digits.length > 5) formatted += ' ' + digits.slice(5, 8);
    if (digits.length > 8) formatted += ' ' + digits.slice(8, 10);
    if (digits.length > 10) formatted += ' ' + digits.slice(10, 12);
    return formatted;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (phone.length < 16) {
      setError('Введіть коректний номер телефону');
      return;
    }
    if (password.length < 4) {
      setError('Пароль має містити мінімум 4 символи');
      return;
    }

    if (mode === 'login') {
      const success = await login(phone, password);
      if (success) {
        onClose();
      } else {
        setError('Невірний номер або пароль.');
      }
    } else {
      if (!name.trim()) {
        setError('Введіть ваше ім\'я');
        return;
      }
      const newUser = await register(name, phone, password);
      if (newUser) {
        onClose();
      } else {
        setError('Помилка реєстрації. Можливо, номер уже зайнятий.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-brand-surface border border-brand-border rounded-2xl w-full max-w-sm overflow-hidden z-10"
      >
        <div className="flex items-center justify-between p-4 border-b border-brand-border bg-brand-card">
          <div className="flex gap-4">
             <button 
                type="button"
                onClick={() => { setMode('login'); setError(''); }} 
                className={`font-semibold transition-colors ${mode === 'login' ? 'text-white' : 'text-brand-muted hover:text-white'}`}
             >
                Вхід
             </button>
             <button 
                type="button"
                onClick={() => { setMode('register'); setError(''); }} 
                className={`font-semibold transition-colors ${mode === 'register' ? 'text-white' : 'text-brand-muted hover:text-white'}`}
             >
                Реєстрація
             </button>
          </div>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl flex items-start gap-2"
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {mode === 'register' && (
            <div>
              <label className="block text-brand-muted text-sm mb-1.5">Ваше ім'я</label>
              <div className="relative">
                <UserIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Введіть ваше ім'я"
                  className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-brand-muted text-sm mb-1.5">Номер телефону</label>
            <div className="relative">
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(formatPhone(e.target.value))}
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-brand-muted text-sm mb-1.5">Пароль</label>
            <div className="relative">
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-muted" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введіть пароль"
                className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 pl-11 text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" className="btn-primary w-full py-3">
              {mode === 'login' ? 'Увійти' : 'Зареєструватись'}
            </button>
          </div>
          
          <div className="text-center text-xs text-brand-muted mt-4 border-t border-brand-border pt-4">
            {mode === 'login' 
              ? 'Якщо ви ще не зареєстровані, ви можете зробити це на вкладці поруч.'
              : 'Ми нікому не передаємо ваші дані.'}
          </div>
        </form>
      </motion.div>
    </div>
  );
}
