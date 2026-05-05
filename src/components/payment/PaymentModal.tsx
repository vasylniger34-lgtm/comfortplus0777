import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bus, CheckCircle2 } from 'lucide-react';
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
  const [agreed, setAgreed] = useState(false);
  const { user, updateBalance } = useAuth();

  const fromStop = STOPS.find(s => s.id === data.from);
  const toStop = STOPS.find(s => s.id === data.to);

  const [errorMsg, setErrorMsg] = useState('');
  
  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxd8ZIMLZdgaOKw7YBmbTK72mCUvy8rmRcOUvqQ2W3vZifJy3wTVbh_q-ikWL1FarXk/exec';

  const handlePay = async (m: 'applepay' | 'googlepay' | 'card' | 'balance') => {
    if (!agreed && m !== 'balance') return;
    
    setMethod(m);
    setStep('processing');
    setErrorMsg('');
    
    // In a real implementation, 'card' would redirect to Portmone here
    // For now we simulate the booking process
    
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
              <div className="flex justify-center pt-3 md:hidden">
                <div className="w-10 h-1 bg-brand-border rounded-full" />
              </div>

              <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border">
                <div>
                  <div className="text-white font-display font-bold text-lg">Оплата</div>
                  <div className="text-brand-muted text-sm">Безпечна транзакція Portmone</div>
                </div>
                <button
                  onClick={onClose}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-brand-border text-brand-muted hover:text-white hover:border-brand-yellow transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="px-6 py-4 border-b border-brand-border bg-brand-surface/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-brand-yellow/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Bus size={18} className="text-brand-yellow" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-semibold">
                      {fromStop?.name} → {toStop?.name}
                    </div>
                    <div className="text-brand-muted text-sm mt-0.5">
                      {data.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })} · {data.departureTime}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-brand-yellow font-display font-bold text-xl">
                      {data.price} грн
                    </div>
                    <div className="text-[10px] text-brand-muted uppercase">До сплати</div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-5 space-y-4">
                {/* Agreement Checkbox */}
                <button 
                  onClick={() => setAgreed(!agreed)}
                  className="flex items-start gap-3 text-left group"
                >
                  <div className={`mt-0.5 w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${agreed ? 'bg-brand-yellow border-brand-yellow' : 'border-brand-border bg-brand-surface group-hover:border-brand-yellow/50'}`}>
                    {agreed && <CheckCircle2 size={14} className="text-brand-dark" />}
                  </div>
                  <span className="text-xs text-brand-muted leading-tight">
                    Я погоджуюся з <span className="text-brand-light underline">умовами договору оферти</span> та <span className="text-brand-light underline">політикою конфіденційності</span>. Я підтверджую, що мені виповнилося 18 років.
                  </span>
                </button>

                <div className="space-y-3">
                  {/* Balance payment */}
                  {user && (user.balance || 0) >= data.price && (
                    <button
                      onClick={() => handlePay('balance')}
                      className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl bg-green-500/10 border border-green-500/30 text-green-400 font-bold text-base hover:bg-green-500/20 transition-all"
                    >
                      💚 Оплатити з балансу ({user.balance} грн)
                    </button>
                  )}

                  {/* Card payment */}
                  <button
                    onClick={() => handlePay('card')}
                    disabled={!agreed}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all shadow-brand ${agreed ? 'bg-brand-yellow text-brand-dark hover:scale-[1.02] active:scale-[0.98]' : 'bg-brand-yellow/20 text-brand-dark/30 cursor-not-allowed shadow-none'}`}
                  >
                    💳 Оплатити карткою · {data.price} грн
                  </button>

                  <div className="flex items-center justify-center gap-4 py-2 opacity-50">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/d/d6/Visa_2021.svg" alt="Visa" className="h-4" />
                    <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
                    <img src="https://www.portmone.com.ua/r3/images/logo.svg" alt="Portmone" className="h-4" />
                  </div>
                </div>

                <p className="text-center text-brand-muted text-[10px] uppercase tracking-wider">
                  🔒 Безпека платежів гарантована Portmone.com
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
                  <p className="text-brand-muted text-sm text-center">Перенаправлення на сторінку оплати...</p>
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
