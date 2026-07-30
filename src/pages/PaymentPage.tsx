import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CreditCard, Lock, CheckCircle2, ShieldAlert, Loader2, 
  ArrowLeft, Calendar, User, Phone, Bus, ShieldCheck, Check
} from 'lucide-react';
import { STOPS, CONTACTS } from '../data/routes';
import { apiClient } from '../lib/apiClient';
import SuccessScreen from '../components/payment/SuccessScreen';
import { useAuth } from '../context/AuthContext';
import { normalizeTime, normalizeCrewName } from '../utils/normalize';

const getUADateString = (dateObj: Date) => {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}.${m}.${y}`;
};

const parseSafeDate = (d: any): Date => {
  if (!d) return new Date();
  if (d instanceof Date && !isNaN(d.getTime())) return d;
  if (typeof d === 'string') {
    if (d.includes('.')) {
      const parts = d.split('.');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1;
        const year = parseInt(parts[2], 10);
        const parsed = new Date(year, month, day);
        if (!isNaN(parsed.getTime())) return parsed;
      }
    }
    const parsed = new Date(d);
    if (!isNaN(parsed.getTime())) return parsed;
  }
  return new Date();
};

const getStopIdByName = (name: string) => {
  const found = STOPS.find(s => s.name === name || s.id === name);
  return found ? found.id : name;
};

const getCrewByTime = (time: string, isLvivDeparture: boolean) => {
  const normTime = normalizeTime(time);
  if (isLvivDeparture) {
    const mapping: Record<string, string> = {
      '08:10': '05:50', '14:10': '05:50',
      '09:00': '06:20', '09:15': '06:20', '14:50': '06:20', '15:30': '06:20',
      '10:15': '07:10', '16:10': '07:10',
      '11:10': '08:15', '17:10': '08:15',
      '11:50': '08:50', '18:20': '08:50',
      '12:20': '09:30', '19:20': '09:30',
      '13:10': '10:35', '20:00': '10:35',
      '14:50': '12:00', '17:40': '12:00', '20:20': '12:00', '20:40': '12:00'
    };
    return normalizeCrewName(mapping[normTime] || normTime || '06:20');
  } else {
    const mapping: Record<string, string> = {
      '05:50': '05:50', '11:10': '05:50',
      '06:20': '06:20', '12:00': '06:20', '12:40': '06:20',
      '07:10': '07:10', '13:20': '07:10',
      '08:15': '08:15', '14:10': '08:15',
      '08:50': '08:50', '15:30': '08:50',
      '09:30': '09:30', '16:20': '09:30',
      '10:35': '10:35', '17:00': '10:35',
      '11:10': '11:10', '17:40': '11:10',
      '12:00': '12:00'
    };
    return normalizeCrewName(mapping[normTime] || normTime || '06:20');
  }
};

export default function PaymentPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, updateBalance } = useAuth();
  
  const stateData = location.state?.bookingData;
  
  const [loadedBooking, setLoadedBooking] = useState<any>(null);
  const [isLoadingBooking, setIsLoadingBooking] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [agreed, setAgreed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdBookingId, setCreatedBookingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const queryParams = new URLSearchParams(location.search);
  const successParam = queryParams.get('success');
  const failureParam = queryParams.get('failure');
  const bookingIdParam = queryParams.get('booking_id');

  // Load booking if returning from Portmone
  useEffect(() => {
    if (bookingIdParam && (successParam === 'true' || failureParam === 'true')) {
      setIsLoadingBooking(true);
      apiClient.getBooking(bookingIdParam)
        .then((data) => {
          setLoadedBooking(data);
          setIsLoadingBooking(false);
          if (successParam === 'true') {
            setIsSuccess(true);
          } else if (failureParam === 'true') {
            setErrors({ submit: 'Платіж було відхилено або скасовано платіжною системою. Спробуйте ще раз.' });
          }
        })
        .catch((err) => {
          console.error(err);
          setLoadError('Не вдалося завантажити деталі замовлення.');
          setIsLoadingBooking(false);
        });
    }
  }, [bookingIdParam, successParam, failureParam]);

  // Redirect back if no booking details available and not returning from gateway
  useEffect(() => {
    if (!stateData && !bookingIdParam) {
      const timer = setTimeout(() => navigate('/'), 5000);
      return () => clearTimeout(timer);
    }
  }, [stateData, bookingIdParam, navigate]);

  const rawBookingData = loadedBooking || stateData;
  const bookingData = rawBookingData ? {
    ...rawBookingData,
    from: getStopIdByName(rawBookingData.bus_from || rawBookingData.from),
    to: getStopIdByName(rawBookingData.bus_to || rawBookingData.to),
    date: parseSafeDate(rawBookingData.date || rawBookingData.bus_date),
    departureTime: rawBookingData.departure_time || rawBookingData.departureTime,
    pickupLocation: rawBookingData.pickup_location || rawBookingData.pickupLocation,
    dropoffLocation: rawBookingData.dropoffLocation,
    seats: rawBookingData.seats,
    price: rawBookingData.price,
    name: rawBookingData.passenger_name || rawBookingData.name,
    phone: rawBookingData.passenger_phone || rawBookingData.phone,
    crew: rawBookingData.crew
  } : null;

  if (isLoadingBooking) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 pt-32">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mx-auto" />
          <p className="text-brand-light font-bold text-lg">Завантаження деталей замовлення...</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 pt-32">
        <div className="max-w-md w-full card p-8 text-center space-y-6 border-red-500/20">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-2xl font-display font-black text-white">Помилка завантаження</h2>
          <p className="text-brand-muted">{loadError}</p>
          <button onClick={() => navigate('/')} className="btn-primary w-full flex items-center justify-center gap-2">
            <ArrowLeft size={18} />
            Повернутися на головну
          </button>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-6 pt-32">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full card p-8 text-center space-y-6 border-red-500/20"
        >
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto text-red-500">
            <ShieldAlert size={36} />
          </div>
          <h2 className="text-2xl font-display font-black text-white">Дані бронювання відсутні</h2>
          <p className="text-brand-muted">
            Ми не знайшли інформацію про ваше замовлення. Можливо, сесія застаріла або ви перейшли сюди безпосередньо.
          </p>
          <button onClick={() => navigate('/')} className="btn-primary w-full flex items-center justify-center gap-2">
            <ArrowLeft size={18} />
            Повернутися на головну
          </button>
          <p className="text-[10px] text-brand-muted">
            Редирект через 5 секунд...
          </p>
        </motion.div>
      </div>
    );
  }

  const fromStop = STOPS.find(s => s.id === bookingData.from);
  const toStop = STOPS.find(s => s.id === bookingData.to);
  const totalAmount = bookingData.price * bookingData.seats;

  const handlePayment = async (method: 'card' | 'balance') => {
    if (!agreed) {
      setErrors({ agree: 'Ви повинні погодитись з офертою' });
      return;
    }

    setIsProcessing(true);
    setErrors({});

    try {
      const payloadPickupLoc = bookingData.dropoffLocation 
        ? `${bookingData.pickupLocation} (Висадка: ${bookingData.dropoffLocation})`
        : bookingData.pickupLocation;

      const isFree = totalAmount === 0;

      const apiPayload = {
        from: fromStop?.name || bookingData.from,
        to: toStop?.name || bookingData.to,
        pickup_location: payloadPickupLoc,
        date: getUADateString(bookingData.date),
        name: bookingData.name,
        phone: bookingData.phone,
        seats: bookingData.seats,
        departure_time: bookingData.departureTime,
        price: totalAmount,
        status: method === 'balance' || isFree ? 'active' : 'pending',
        is_paid_online: method === 'balance' || isFree ? 1 : 0,
        user_id: user?.id || null,
        crew: bookingData.crew || getCrewByTime(bookingData.departureTime, bookingData.directionIndex === 0)
      };

      if (method === 'balance' || isFree) {
        if (method === 'balance' && !isFree) {
          if (!user || user.balance < totalAmount) {
            throw new Error('Недостатньо коштів на балансі');
          }
        }
        
        // Створюємо "active" бронювання на сервері
        const createdBooking = await apiClient.createBooking(apiPayload);
        
        if (method === 'balance' && !isFree) {
          await updateBalance(-totalAmount);
        }
        
        setCreatedBookingId(createdBooking.id);
        setIsSuccess(true);
        setIsProcessing(false);
      } else {
        // Створюємо "pending" бронювання на сервері
        const createdBooking = await apiClient.createBooking(apiPayload);
        setCreatedBookingId(createdBooking.id);

        // 2. Отримуємо параметри для форми Portmone
        const paymentInfo = await apiClient.initiatePortmonePayment(createdBooking.id);

        // 3. Динамічно створюємо та сабмітимо приховану HTML-форму
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = paymentInfo.action;

        Object.entries(paymentInfo.params).forEach(([key, val]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(val);
          form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
      }
    } catch (err: any) {
      console.error('Помилка оформлення бронювання:', err);
      setErrors({ submit: err.message || 'Сталася помилка при оформленні бронювання. Спробуйте ще раз.' });
      setIsProcessing(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-brand-dark flex items-center justify-center p-4 pt-24 pb-12">
        <div className="max-w-xl w-full bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-2xl relative">
          <SuccessScreen 
            data={bookingData} 
            bookingId={bookingIdParam || createdBookingId || undefined} 
            onClose={() => navigate('/')} 
          />
        </div>
      </div>
    );
  }



  return (
    <div className="min-h-screen bg-brand-dark pt-28 pb-16 px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-yellow/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)} 
            className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-light hover:text-brand-yellow hover:border-brand-yellow transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white">Безпечна оплата</h1>
            <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">Платіжний шлюз Portmone.com</p>
          </div>
        </div>

        <div className="grid md:grid-cols-12 gap-8 items-start">
          {/* LEFT COLUMN: ORDER INFO */}
          <div className="md:col-span-5 space-y-6">
            <div className="card p-6 border-brand-border bg-brand-card/40 backdrop-blur-xl space-y-6">
              <h3 className="text-lg font-display font-bold text-white border-b border-brand-border pb-3 flex items-center gap-2">
                <Bus size={18} className="text-brand-yellow" /> Деталі поїздки
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-xs text-brand-muted mb-1">Напрямок</div>
                    <div className="text-white font-bold text-sm">
                      {fromStop?.name} → {toStop?.name}
                    </div>
                  </div>
                  <div className="bg-brand-surface border border-brand-border rounded px-2 py-0.5 text-[10px] text-brand-yellow font-black">
                    {bookingData.departureTime}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-brand-muted mb-1">Дата відправлення</div>
                    <div className="text-white text-sm font-semibold">
                      {bookingData.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-brand-muted mb-1">Кількість місць</div>
                    <div className="text-white text-sm font-semibold">
                      {bookingData.seats} {bookingData.seats === 1 ? 'пасажир' : bookingData.seats < 5 ? 'пасажири' : 'пасажирів'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 border-t border-brand-border pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">Клієнт:</span>
                    <span className="text-white font-medium">{bookingData.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-muted">Телефон:</span>
                    <span className="text-white font-medium">{bookingData.phone}</span>
                  </div>
                  {bookingData.pickupLocation && (
                    <div className="text-xs bg-brand-surface p-2.5 rounded-lg border border-brand-border leading-relaxed text-brand-light">
                      <span className="text-brand-yellow font-semibold">Посадка: </span>
                      {bookingData.pickupLocation}
                    </div>
                  )}
                  {bookingData.dropoffLocation && (
                    <div className="text-xs bg-brand-surface p-2.5 rounded-lg border border-brand-border leading-relaxed text-brand-light">
                      <span className="text-brand-yellow font-semibold">Висадка: </span>
                      {bookingData.dropoffLocation}
                    </div>
                  )}
                </div>

                <div className="border-t border-dashed border-brand-border pt-4 flex justify-between items-baseline">
                  <span className="text-white font-bold">Разом до сплати:</span>
                  <span className="text-3xl font-display font-black text-brand-yellow">{totalAmount} грн</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-brand-surface/30 border border-brand-border rounded-2xl p-4 text-xs text-brand-muted leading-relaxed">
              <ShieldCheck size={36} className="text-green-500 flex-shrink-0" />
              <div>
                Платіж захищено протоколом SSL. Всі дані шифруються та обробляються платіжною системою Portmone, що відповідає стандарту безпеки PCI DSS.
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: PAYMENT FORM */}
          <div className="md:col-span-7">
            <form onSubmit={(e) => e.preventDefault()} className="card p-6 md:p-8 space-y-6 bg-brand-card/80 backdrop-blur-xl border-brand-yellow/10">
              {/* Payment Methods (Information card instead of direct inputs) */}
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-brand-border">
                  <CreditCard size={18} className="text-brand-yellow" />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">Безпечна оплата Portmone</span>
                </div>

                <div className="bg-brand-surface/40 border border-brand-border/60 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-yellow/10 border border-brand-yellow/20 flex items-center justify-center text-brand-yellow flex-shrink-0">
                      <Lock size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Перенаправлення на платіжну систему</h4>
                      <p className="text-xs text-brand-muted">Всі транзакції проходять на захищеній сторінці Portmone.com</p>
                    </div>
                  </div>

                  <p className="text-xs text-brand-light leading-relaxed">
                    Після натискання кнопки «Перейти до оплати» ви будете автоматично перенаправлені на офіційну платіжну сторінку сервісу **Portmone.com**, де зможете безпечно ввести реквізити картки або скористатися іншими доступними платіжними засобами.
                  </p>
                </div>
              </div>

              {/* Legal Checkboxes */}
              <div className="border-t border-brand-border pt-5 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group select-none">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => { setAgreed(e.target.checked); setErrors(prev => ({ ...prev, agree: '' })); }}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 mt-0.5 ${agreed ? 'bg-brand-yellow border-brand-yellow text-brand-dark' : 'border-brand-border group-hover:border-brand-yellow/50'}`}>
                    {agreed && <Check size={14} className="stroke-[3]" />}
                  </div>
                  <span className="text-xs text-brand-muted leading-relaxed group-hover:text-brand-light transition-colors">
                    Я погоджуюсь з умовами{' '}
                    <a href="/oferta" target="_blank" rel="noreferrer" className="text-brand-yellow hover:underline">публічної оферти</a>
                    {' '}та{' '}
                    <a href="/povernenya" target="_blank" rel="noreferrer" className="text-brand-yellow hover:underline">правилами повернення коштів</a>.
                  </span>
                </label>
                {errors.agree && <p className="text-red-400 text-xs">{errors.agree}</p>}
              </div>

              {errors.submit && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-200">
                  {errors.submit}
                </div>
              )}

              {/* Submit Button */}
              {totalAmount === 0 ? (
                <button
                  type="button"
                  onClick={() => handlePayment('balance')}
                  disabled={isProcessing || !agreed}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all shadow-brand ${agreed ? 'bg-brand-yellow text-brand-dark hover:scale-[1.01] active:scale-[0.99]' : 'bg-brand-yellow/20 text-brand-dark/30 cursor-not-allowed shadow-none'}`}
                >
                  <Check size={16} className="stroke-[3]" />
                  Забронювати безкоштовно
                </button>
              ) : user && (user.balance || 0) >= totalAmount ? (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => handlePayment('balance')}
                    disabled={isProcessing || !agreed}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all shadow-brand ${agreed ? 'bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 hover:scale-[1.01] active:scale-[0.99]' : 'bg-green-500/5 border border-green-500/10 text-green-500/30 cursor-not-allowed shadow-none'}`}
                  >
                    💚 Оплатити з балансу ({user.balance} грн)
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePayment('card')}
                    disabled={isProcessing || !agreed}
                    className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl font-bold text-base transition-all shadow-brand ${agreed ? 'bg-brand-yellow text-brand-dark hover:scale-[1.01] active:scale-[0.99]' : 'bg-brand-yellow/20 text-brand-dark/30 cursor-not-allowed shadow-none'}`}
                  >
                    💳 Оплатити карткою · {totalAmount} грн
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handlePayment('card')}
                  disabled={isProcessing || !agreed}
                  className={`w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold text-base transition-all shadow-brand ${agreed ? 'bg-brand-yellow text-brand-dark hover:scale-[1.01] active:scale-[0.99]' : 'bg-brand-yellow/20 text-brand-dark/30 cursor-not-allowed shadow-none'}`}
                >
                  <Lock size={16} />
                  Перейти до оплати {totalAmount} грн
                </button>
              )}

              {/* Verified Badges */}
              <div className="flex justify-center items-center gap-4 pt-2 opacity-40">
                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_(2021–present).svg" alt="Visa" className="h-3.5" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-5" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/a/a6/Logo_PROSTIR.png" alt="Prostir" className="h-4" />
                <img src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Portmone_logo.svg" alt="Portmone" className="h-4" />
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* FULLSCREEN PROCESSING OVERLAY */}
      <AnimatePresence>
        {isProcessing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-dark/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="max-w-sm w-full space-y-8">
              {/* Spinner */}
              <div className="relative w-24 h-24 mx-auto">
                <motion.div 
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="w-full h-full border-4 border-brand-yellow/20 border-t-brand-yellow rounded-full"
                />
                <div className="absolute inset-0 flex items-center justify-center text-brand-yellow">
                  <Lock size={32} className="animate-pulse" />
                </div>
              </div>

              <div>
                <h3 className="text-xl font-display font-black text-white mb-2">Ініціація оплати</h3>
                <p className="text-sm text-brand-muted">Перенаправлення на безпечний шлюз Portmone. Будь ласка, зачекайте.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
