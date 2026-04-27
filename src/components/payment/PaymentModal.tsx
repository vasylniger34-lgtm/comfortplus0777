import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bus } from 'lucide-react';
import type { BookingData } from '../booking/BookingForm';
import { STOPS } from '../../data/routes';
import SuccessScreen from './SuccessScreen';
import { useAuth } from '../../context/AuthContext';

interface PaymentModalProps {
  data: BookingData;
  onClose: () => void;
}

type PayStep = 'choose' | 'processing' | 'success';

export default function PaymentModal({ data, onClose }: PaymentModalProps) {
  const [step, setStep] = useState<PayStep>('choose');
  const [, setMethod] = useState<'applepay' | 'googlepay' | 'card' | 'balance' | null>(null);
  const { user, updateBalance } = useAuth();

  const fromStop = STOPS.find(s => s.id === data.from);
  const toStop = STOPS.find(s => s.id === data.to);

  const [errorMsg, setErrorMsg] = useState('');
  
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxd8ZIMLZdgaOKw7YBmbTK72mCUvy8rmRcOUvqQ2W3vZifJy3wTVbh_q-ikWL1FarXk/exec';

  const handlePay = async (m: 'applepay' | 'googlepay' | 'card' | 'balance') => {
    setMethod(m);
    setStep('processing');
    setErrorMsg('');
    
    // Fake payment processing delay
    await new Promise(r => setTimeout(r, 1500));

    try {
      const payload = {
        from: (STOPS.find(s=>s.id===data.from)?.name || data.from) + (data.pickupLocation ? ` (${data.pickupLocation})` : ''),
        to: STOPS.find(s=>s.id===data.to)?.name || data.to,
        date: data.date.toLocaleDateString('uk-UA'),
        name: data.name,
        phone: data.phone,
        seats: data.seats,
        departureTime: data.departureTime,
        price: data.price
      };

      const response = await fetch(SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        cache: 'no-cache',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (result.result === 'error') {
        const msg = result.message || 'Помилка';
        if (msg === 'нема місць' || msg === 'No seats' || msg.includes('Недостатньо')) {
          throw new Error('У вибраному екіпажі більше немає вільних місць.');
        } else if (msg === 'конфлікт запису' || msg === 'Conflict') {
          throw new Error('Це місце щойно було заброньоване. Спробуйте ще раз.');
        } else if (msg.includes('Unknown time')) {
          throw new Error('Обраний час не знайдено в системі.');
        } else {
          throw new Error(msg);
        }
      }

      // Success
      if (m === 'balance' && user) {
        updateBalance(-data.price);
      }
      setStep('success');

    } catch (e: any) {
      setErrorMsg(e.message || 'Сталася помилка. Перевірте з\'єднання.');
      // Auto-return to choose step
      setTimeout(() => setStep('choose'), 3000);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <motion.div
        initial={{ y: '100%', opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: '100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 w-full md:max-w-md bg-brand-card border border-brand-border rounded-t-3xl md:rounded-3xl overflow-hidden"
      >
        <AnimatePresence mode="wait">
          {step === 'choose' && (
            <motion.div key="choose" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {/* Handle bar (mobile) */}
              <div className="flex justify-center pt-3 md:hidden">
                <div className="w-10 h-1 bg-brand-border rounded-full" />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
                <div>
                  <div className="text-white font-display font-bold text-lg">Оплата</div>
                  <div className="text-brand-muted text-sm">Безпечна транзакція</div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-brand-border text-brand-muted hover:text-white hover:border-brand-yellow transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Order summary */}
              <div className="px-6 py-4 border-b border-brand-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bus size={18} className="text-brand-yellow" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">
                      {fromStop?.name} → {toStop?.name}
                    </div>
                    <div className="text-brand-muted text-sm mt-0.5">
                      {data.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} · {data.departureTime} · {data.seats} {data.seats === 1 ? 'місце' : 'місця'}
                    </div>
                    <div className="text-brand-muted text-sm">
                      {data.name}
                    </div>
                  </div>
                  <div className="text-brand-yellow font-display font-bold text-xl">
                    {data.price} грн
                  </div>
                </div>
              </div>

              {/* Payment methods */}
              <div className="px-6 py-5 space-y-3">
                <p className="text-brand-muted text-xs uppercase tracking-wide font-medium mb-4">
                  Оберіть спосіб оплати
                </p>

                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 mb-2">
                  <p className="text-red-400 text-sm font-medium text-center">
                    ⚠️ Онлайн-оплата тимчасово недоступна з технічних причин. 
                    Будь ласка, зверніться до диспетчера для бронювання.
                  </p>
                </div>

                {/* Balance payment */}
                {user && (user.balance || 0) >= data.price && (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400/50 font-bold text-base cursor-not-allowed"
                  >
                    💚 Оплатити з балансу ({user.balance} грн)
                  </button>
                )}

                {/* Apple Pay */}
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-white/50 text-black/50 font-semibold text-base cursor-not-allowed shadow-md"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                  Apple Pay
                </button>

                {/* Google Pay */}
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-brand-surface/50 border border-brand-border text-white/50 font-semibold text-base cursor-not-allowed"
                >
                  <svg viewBox="0 0 24 24" className="w-6 h-6">
                    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="#fff"/>
                    <path d="M12 24c6.627 0 12-5.373 12-12S18.627 0 12 0 0 5.373 0 12s5.373 12 12 12z" fill="url(#a)"/>
                    <path d="m11.21 12 3.4-3.37L6.55 12l3.91 3.7 3.56-3.7" fill="#4285F4"/>
                    <text x="12" y="15.5" textAnchor="middle" fontSize="5" fontFamily="Arial" fontWeight="bold" fill="#4285F4">G</text>
                    <defs>
                      <linearGradient id="a" x1="0" y1="0" x2="24" y2="24">
                        <stop offset="0%" stopColor="#fff" stopOpacity="0"/>
                        <stop offset="100%" stopColor="#fff" stopOpacity="0"/>
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="flex items-center">
                    <span style={{color:'#4285F4', fontWeight:700}}>G</span>
                    <span style={{color:'#EA4335', fontWeight:700}}>o</span>
                    <span style={{color:'#FBBC05', fontWeight:700}}>o</span>
                    <span style={{color:'#4285F4', fontWeight:700}}>g</span>
                    <span style={{color:'#34A853', fontWeight:700}}>l</span>
                    <span style={{color:'#EA4335', fontWeight:700}}>e</span>
                    <span className="text-white ml-1">Pay</span>
                  </div>
                </button>

                {/* Card payment */}
                <button
                  disabled
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-brand-yellow/50 text-brand-dark/50 font-bold text-base cursor-not-allowed shadow-brand"
                >
                  💳 Оплатити карткою · {data.price} грн
                </button>

                <p className="text-center text-brand-muted text-xs mt-2">
                  🔒 Захищено 256-bit SSL шифруванням
                </p>
              </div>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-16 px-6"
            >
              {errorMsg ? (
                <>
                  <div className="w-16 h-16 bg-red-500/10 border-2 border-red-500 rounded-full flex items-center justify-center mb-6 text-red-500">
                    <X size={32} />
                  </div>
                  <h3 className="text-white font-display font-bold text-xl mb-2 text-center">Помилка оформлення</h3>
                  <p className="text-red-400 text-sm text-center font-medium max-w-[250px]">{errorMsg}</p>
                </>
              ) : (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-brand-yellow/30 border-t-brand-yellow rounded-full mb-6"
                  />
                  <h3 className="text-white font-display font-bold text-xl mb-2">Оформлення квитка</h3>
                  <p className="text-brand-muted text-sm text-center">Бронюємо місце. Зачекайте кілька секунд...</p>
                </>
              )}
            </motion.div>
          )}

          {step === 'success' && (
            <SuccessScreen data={data} onClose={onClose} />
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
