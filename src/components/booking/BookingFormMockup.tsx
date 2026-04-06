import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, ArrowRight, Car, X, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { getPrice, CONTACTS } from '../../data/routes';
import { useAuth } from '../../context/AuthContext';

import DatePicker from './DatePicker';

interface BookingFormProps {
  onPay: (data: BookingData) => void;
}

export interface BookingData {
  from: string;
  to: string;
  date: Date;
  name: string;
  phone: string;
  price: number;
  seats: number;
  departureTime: string;
}

const ROUTE_LVIV_TO_SKHIDNYTSIA = [
  { id: 'lviv', name: 'Львів' },
  { id: 'stebnik', name: 'Стебник' },
  { id: 'truskavets', name: 'Трускавець' },
  { id: 'boryslav', name: 'Борислав' },
  { id: 'skhidnytsia', name: 'Східниця' },
];

const ROUTE_SKHIDNYTSIA_TO_LVIV = [
  { id: 'skhidnytsia', name: 'Східниця' },
  { id: 'boryslav', name: 'Борислав' },
  { id: 'truskavets', name: 'Трускавець' },
  { id: 'stebnik', name: 'Стебник' },
  { id: 'lviv', name: 'Львів' },
];

function CallUsModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="card max-w-sm w-full p-6 text-center shadow-2xl border-brand-yellow/30"
      >
        <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-yellow">
          <Phone size={32} />
        </div>
        <h3 className="text-xl font-display font-bold text-white mb-2">Зателефонуйте нам</h3>
        <p className="text-brand-muted text-sm mb-6 leading-relaxed">
          Бронювання поїздок на короткі відстані здійснюється виключно за телефоном.
        </p>
        <div className="space-y-3">
          <a href={`tel:${CONTACTS.phone1}`} className="btn-primary w-full flex items-center justify-center gap-2">
            <Phone size={18} />
            {CONTACTS.phone1Display}
          </a>
          <a href={`tel:${CONTACTS.phone2}`} className="btn-primary w-full flex items-center justify-center gap-2">
            <Phone size={18} />
            {CONTACTS.phone2Display}
          </a>
        </div>
        <button 
          onClick={onClose}
          className="mt-6 text-brand-muted hover:text-white transition-colors text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1 mx-auto"
        >
          <X size={14} /> Закрити
        </button>
      </motion.div>
    </motion.div>
  );
}

export default function BookingFormMockup({ onPay }: BookingFormProps) {
  const { user } = useAuth();
  
  const [directionIndex, setDirectionIndex] = useState<number | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [seats, setSeats] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCallModal, setShowCallModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxqZBUF__yX2N0Sljl6wZKBD0Nlt89Vsr7QCfX4Du0CdLwGuWTWhb-YIz01R11wXjQ3/exec';

  const price = getPrice(from, to);
  const currentRoute = directionIndex === 0 ? ROUTE_LVIV_TO_SKHIDNYTSIA : ROUTE_SKHIDNYTSIA_TO_LVIV;

  useEffect(() => {
    if (user && !name && phone === '+380') {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  const isTimePassed = (time: string) => {
    if (!date) return false;
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (!isToday) return false;
    const [hours, minutes] = time.split(':').map(Number);
    const departureDate = new Date(date);
    departureDate.setHours(hours, minutes, 0, 0);
    return departureDate < now;
  };

  const MORNING_TIMES = ['05:50', '06:20', '07:10', '08:15', '08:50', '09:30', '10:35'];
  const AFTERNOON_TIMES = ['11:10', '12:00', '12:40', '13:20', '14:10', '15:30', '16:20', '17:00', '17:40'];

  const handleStopSelect = (stopId: string) => {
    if (!from || (from && to)) {
      setFrom(stopId);
      setTo('');
      setSelectedTime('');
    } else {
      const fromIdx = currentRoute.findIndex(s => s.id === from);
      const toIdx = currentRoute.findIndex(s => s.id === stopId);
      
      if (toIdx > fromIdx) {
        setTo(stopId);
        // Перевірка на короткий маршрут
        const isShort = from !== 'lviv' && stopId !== 'lviv';
        if (isShort) setShowCallModal(true);
      } else {
        setFrom(stopId);
        setTo('');
      }
    }
  };

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

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!from || !to) errs.route = "Оберіть маршрут (Звідки та Куди)";
    if (!date) errs.date = "Оберіть дату";
    if (!selectedTime) errs.time = "Оберіть час";
    if (!name.trim() || name.trim().length < 2) errs.name = "Введіть ім'я";
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 12) errs.phone = "Введіть коректний номер";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Фінальна перевірка на короткий маршрут перед оплатою
    const isShortTrip = (from !== 'lviv' && to !== 'lviv');
    if (isShortTrip && from !== '') {
        setShowCallModal(true);
        return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    
    // Нова логіка: Відправка в Google Sheets
    setIsSubmitting(true);
    try {
      const payload = {
        from: currentRoute.find(s=>s.id===from)?.name || from,
        to: currentRoute.find(s=>s.id===to)?.name || to,
        date: date?.toLocaleDateString('uk-UA'),
        name,
        phone,
        seats,
        departureTime: selectedTime,
        price: price * seats
      };

      await fetch(SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        cache: 'no-cache',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      setSubmitStatus('success');
      setStatusMessage(`Ваше бронювання на ${selectedTime} успішно додано в таблицю!`);
      
      setTimeout(() => {
        onPay({ from, to, date: date!, name, phone, price: price * seats, seats, departureTime: selectedTime });
      }, 2500);

    } catch (error) {
      console.error('Sheets Error:', error);
      setSubmitStatus('error');
      setStatusMessage('Сталася помилка при з\'єднанні з таблицею. Спробуйте ще раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const AvailabilityCard = ({ time }: { time: string }) => {
    const passed = isTimePassed(time);
    if (passed) return null;
    const isSelected = selectedTime === time;
    const seatsLeft = 8 - Math.floor(Math.random() * 3);

    return (
      <button
        type="button"
        onClick={() => { setSelectedTime(time); setErrors(e => ({ ...e, time: '' })); }}
        className={`relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 text-left w-full
          ${isSelected 
            ? 'bg-brand-yellow text-brand-dark border-brand-yellow shadow-brand scale-[1.01]' 
            : 'bg-brand-surface border-brand-border hover:border-brand-yellow/40 hover:bg-brand-yellow/5 group'
          }
        `}
      >
        <div className="flex items-center gap-6">
            <div className={`p-3 rounded-xl flex items-center justify-center ${isSelected ? 'bg-brand-dark/10' : 'bg-brand-yellow/10 text-brand-yellow'}`}>
              <Car size={24} />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-display font-black">~{time}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${isSelected ? 'bg-brand-dark/10 opacity-70' : 'bg-brand-yellow/10 text-brand-yellow'}`}>
                        Екіпаж №{time.replace(':', '')}
                    </span>
                </div>
                <div className={`text-xs font-medium flex items-center gap-1.5 ${isSelected ? 'text-brand-dark/80' : 'text-brand-muted'}`}>
                   Орієнтовний час готовності <span className="opacity-40">•</span> <User size={12} className="inline mr-0.5" />{seatsLeft} місць
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <div className={`text-[10px] uppercase font-black tracking-tighter ${isSelected ? 'text-brand-dark/60' : 'text-green-500'}`}>Статус: Вільний</div>
                <div className={`text-xs font-bold ${isSelected ? 'text-brand-dark' : 'text-white'}`}>Готовий до виїзду</div>
            </div>
            <div className={`w-3 h-3 rounded-full pulse ${isSelected ? 'bg-brand-dark' : 'bg-green-500'}`} />
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2 transform transition-transform">
             <div className="bg-brand-dark text-brand-yellow p-1.5 rounded-full shadow-lg border border-brand-yellow/20">
                <ArrowRight size={16} />
             </div>
          </div>
        )}
      </button>
    );
  };

  return (
    <section id="booking" className="max-w-6xl mx-auto px-4 py-16">
      <AnimatePresence>{showCallModal && <CallUsModal onClose={() => setShowCallModal(false)} />}</AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        {submitStatus === 'success' ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card p-12 text-center space-y-6 border-green-500/30"
          >
             <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto text-green-500">
                <CheckCircle2 size={48} />
             </div>
             <h2 className="text-3xl font-display font-black text-white">Успішно заброньовано!</h2>
             <p className="text-brand-muted max-w-sm mx-auto">{statusMessage}</p>
             <button 
               onClick={() => setSubmitStatus('idle')}
               className="btn-primary px-8 py-3 mx-auto flex items-center justify-center gap-2"
             >
                Повернутись назад
             </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-12 relative overflow-hidden">
            {isSubmitting && (
              <div className="absolute inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 size={48} className="text-brand-yellow animate-spin" />
                    <Car size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-yellow" />
                  </div>
                  <p className="text-brand-yellow font-bold animate-pulse text-center px-4">Записуємо ваше місце в таблицю...</p>
              </div>
            )}

            {/* STEP 1: DIRECTION */}
            <div>
              <h3 className="section-title text-2xl mb-6 flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-brand-yellow text-brand-dark flex items-center justify-center text-sm font-black">1</span>
                Оберіть напрямок
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { id: 0, label: 'Львів → Східниця', desc: 'Через Стебник, Трускавець, Борислав' },
                  { id: 1, label: 'Східниця → Львів', desc: 'Через Борислав, Трускавець, Стебник' }
                ].map((dir) => (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => { setDirectionIndex(dir.id); setFrom(''); setTo(''); }}
                    className={`p-6 rounded-2xl border-2 transition-all text-left group
                      ${directionIndex === dir.id ? 'border-brand-yellow bg-brand-yellow/5' : 'border-brand-border hover:border-brand-yellow/40'}
                    `}
                  >
                    <div className="flex justify-between items-center mb-2">
                        <span className={`font-display font-black text-xl ${directionIndex === dir.id ? 'text-brand-yellow' : 'text-white'}`}>{dir.label}</span>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${directionIndex === dir.id ? 'border-brand-yellow' : 'border-brand-border'}`}>
                          {directionIndex === dir.id && <div className="w-2.5 h-2.5 rounded-full bg-brand-yellow" />}
                        </div>
                    </div>
                    <p className="text-sm text-brand-muted">{dir.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* STEP 2: STOPS (ONLY IF DIRECTION PICKED) */}
            <AnimatePresence>
              {directionIndex !== null && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <h3 className="section-title text-2xl mb-8 flex items-center gap-3 pt-4 border-t border-brand-border">
                    <span className="w-8 h-8 rounded-full bg-brand-yellow text-brand-dark flex items-center justify-center text-sm font-black">2</span>
                    Оберіть маршрут (два кліки)
                  </h3>
                  
                  <div className="relative pb-12">
                    <div className="absolute left-4 right-4 h-1 bg-brand-border top-5 -z-10" />
                    
                    <div className="flex justify-between items-start">
                      {currentRoute.map((stop, idx) => {
                        const isFrom = from === stop.id;
                        const isTo = to === stop.id;
                        const isIntermediate = from && to && 
                            currentRoute.findIndex(s => s.id === from) < idx && 
                            currentRoute.findIndex(s => s.id === to) > idx;

                        return (
                          <div key={stop.id} className="flex flex-col items-center group w-full">
                            <button
                              type="button"
                              onClick={() => handleStopSelect(stop.id)}
                              className={`relative w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all duration-300
                                  ${isFrom || isTo ? 'bg-brand-yellow border-brand-yellow scale-125 shadow-brand' : 'bg-brand-dark border-brand-border group-hover:border-brand-yellow/50'}
                                  ${isIntermediate ? 'border-brand-yellow/60' : ''}
                              `}
                            >
                              {isFrom && <span className="text-brand-dark text-[10px] font-black italic">ЗВІДКИ</span>}
                              {isTo && <span className="text-brand-dark text-[10px] font-black italic">КУДИ</span>}
                              {!isFrom && !isTo && <div className={`w-2 h-2 rounded-full ${isIntermediate ? 'bg-brand-yellow' : 'bg-brand-border'}`} />}
                            </button>
                            <span className={`mt-4 text-[11px] font-bold text-center max-w-[80px] transition-colors ${isFrom || isTo ? 'text-brand-yellow' : 'text-brand-muted hover:text-white'}`}>
                              {stop.name}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {!from && <div className="mt-8 text-center text-sm text-brand-yellow animate-pulse">Оберіть точку відправлення</div>}
                    {from && !to && <div className="mt-8 text-center text-sm text-brand-yellow animate-pulse">Тепер оберіть точку прибуття</div>}
                    {from && to && (
                        <div className="mt-8 bg-brand-yellow/10 p-4 rounded-xl border border-brand-yellow/20 flex items-center justify-center gap-4">
                          <span className="text-white font-bold">{currentRoute.find(s=>s.id===from)?.name}</span>
                          <ArrowRight size={16} className="text-brand-yellow" />
                          <span className="text-white font-bold">{currentRoute.find(s=>s.id===to)?.name}</span>
                          <button onClick={()=>{setFrom('');setTo('');}} className="ml-4 text-[10px] text-brand-muted hover:text-white underline">Зкинути</button>
                        </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STEP 3: DATE & AVAILABILITY */}
            {from && to && (
              <div className="space-y-10 pt-8 border-t border-brand-border">
                <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="section-title text-xl mb-4 flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-brand-yellow text-brand-dark flex items-center justify-center text-[10px] font-black">3</span>
                        Дата
                      </h3>
                      <DatePicker value={date} onChange={d => { setDate(d); setErrors(e => ({ ...e, date: '' })); setSelectedTime(''); }} />
                      {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}
                    </div>
                </div>

                <div>
                  <h3 className="label mb-4 flex items-center justify-between">
                    <span>Доступність екіпажів</span>
                    {date && <span className="text-[10px] text-green-500 uppercase tracking-widest animate-pulse">Live Оновлення</span>}
                  </h3>
                  {!date ? (
                    <div className="card-inner p-10 border border-dashed border-brand-border rounded-2xl text-center text-brand-muted">Оберіть дату поїздки</div>
                  ) : (
                    <div className="space-y-4">
                      {MORNING_TIMES.concat(AFTERNOON_TIMES).map(time => <AvailabilityCard key={time} time={time} />)}
                    </div>
                  )}
                  {errors.time && <p className="text-red-400 text-xs mt-2">{errors.time}</p>}
                </div>

                {/* PASSENGER INFO + SEATS */}
                <div className="pt-8 border-t border-brand-border">
                    <h3 className="section-title text-xl mb-6">Дані пасажира та Місця</h3>
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1">
                            <div className="label mb-2">Ваше ім'я</div>
                            <div className="relative">
                              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow" />
                              <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(err => ({ ...err, name: '' })); }} placeholder="Іван Іваненко" className="input-field pl-12 h-14" />
                            </div>
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div className="lg:col-span-1">
                            <div className="label mb-2">Телефон</div>
                            <div className="relative">
                              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow" />
                              <input type="tel" value={phone} onChange={e => { setPhone(formatPhone(e.target.value)); setErrors(err => ({ ...err, phone: '' })); }} placeholder="+380" className="input-field pl-12 h-14" />
                            </div>
                            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                        </div>
                        <div className="lg:col-span-1">
                            <div className="label mb-2">Кількість місць</div>
                            <div className="flex gap-2">
                              {[1, 2, 3, 4].map(n => (
                                <button
                                  key={n}
                                  type="button"
                                  onClick={() => setSeats(n)}
                                  className={`flex-1 h-14 rounded-xl text-sm font-bold transition-all ${seats === n ? 'bg-brand-yellow text-brand-dark shadow-brand' : 'bg-brand-surface border border-brand-border text-brand-muted hover:border-brand-yellow/50'}`}
                                >
                                  {n}
                                </button>
                              ))}
                            </div>
                        </div>
                    </div>
                </div>

                {submitStatus === 'error' && (
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 text-sm text-center">
                     {statusMessage}
                  </div>
                )}

                {price > 0 && selectedTime && (
                  <div className="bg-brand-dark/40 rounded-2xl p-6 border border-brand-yellow/20 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div>
                      <div className="text-brand-muted text-xs uppercase tracking-widest font-black mb-1">Разом за {seats} пас.</div>
                      <div className="text-brand-yellow text-4xl font-display font-black leading-none">{price * seats} грн</div>
                    </div>
                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full md:w-auto px-12 py-5 text-lg flex items-center justify-center gap-3 group disabled:opacity-50">
                      {isSubmitting ? 'Записуємо...' : 'Забронювати'}
                      {!isSubmitting && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                    </button>
                  </div>
                )}
              </div>
            )}
          </form>
        )}
      </motion.div>
    </section>
  );
}
