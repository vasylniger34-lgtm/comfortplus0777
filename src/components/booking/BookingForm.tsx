import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, User, Phone, MapPin, ArrowRight, ChevronDown } from 'lucide-react';
import { STOPS, getPrice } from '../../data/routes';

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

function StopSelect({
  value,
  onChange,
  excludeId,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  excludeId?: string;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = STOPS.find(s => s.id === value);
  const options = STOPS.filter(s => s.id !== excludeId);

  return (
    <div ref={ref} className="relative">
      <div className="label mb-2">{label}</div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="input-field flex items-center gap-3 cursor-pointer"
      >
        <MapPin size={18} className="text-brand-yellow flex-shrink-0" />
        <span className={`flex-1 text-left ${selected ? 'text-white' : 'text-brand-muted'}`}>
          {selected ? selected.name : 'Оберіть місто'}
        </span>
        <ChevronDown
          size={16}
          className={`text-brand-muted transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 z-50 card overflow-hidden shadow-card-hover"
          >
            {options.map((stop) => (
              <button
                key={stop.id}
                type="button"
                onClick={() => { onChange(stop.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all duration-150
                  hover:bg-brand-yellow/10 hover:text-brand-yellow
                  ${value === stop.id ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-brand-light'}
                  border-b border-brand-border last:border-0
                `}
              >
                <div className={`w-2 h-2 rounded-full ${value === stop.id ? 'bg-brand-yellow' : 'bg-brand-border'}`} />
                <span className="font-medium">{stop.name}</span>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const MORNING_TIMES = ['05:50', '06:20', '07:10', '08:15', '08:50', '09:30', '10:35'];
const AFTERNOON_TIMES = ['11:10', '12:00', '12:40', '13:20', '14:10', '15:30', '16:20', '17:00', '17:40'];

export default function BookingForm({ onPay }: BookingFormProps) {
  const [from, setFrom] = useState('lviv');
  const [to, setTo] = useState('skhidnytsia');
  const [date, setDate] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [seats, setSeats] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const price = getPrice(from, to);


  const swapStops = () => {
    const temp = from;
    setFrom(to);
    setTo(temp);
  };

  const formatPhone = (val: string) => {
    // Keep +380 prefix and format as +380 XX XXX XX XX
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
    if (!from) errs.from = "Оберіть місто відправлення";
    if (!to) errs.to = "Оберіть місто призначення";
    if (from === to) errs.to = "Місто призначення має відрізнятися";
    if (!date) errs.date = "Оберіть дату";
    if (!selectedTime) errs.time = "Оберіть час";
    if (!name.trim() || name.trim().length < 2) errs.name = "Введіть ваше повне ім'я";
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 12) errs.phone = "Введіть коректний номер телефону";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    onPay({ from, to, date: date!, name, phone, price: price * seats, seats, departureTime: selectedTime });
  };

  return (
    <section id="booking" className="max-w-6xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="label mb-3">Швидке бронювання</div>
        <h2 className="section-title mb-3">Забронюйте місце онлайн</h2>
        <p className="text-brand-muted max-w-md mx-auto">
          Безпечна оплата · Миттєве підтвердження · SMS-повідомлення
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-2xl mx-auto"
      >
        <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-6">
          {/* Route selection */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-yellow text-xs font-bold">1</div>
              Маршрут
            </h3>
            <div className="grid grid-cols-[1fr,auto,1fr] gap-2 items-end">
              <StopSelect value={from} onChange={v => { setFrom(v); setErrors(e => ({ ...e, from: '' })); }} excludeId={to} label="Звідки" />
              <button
                type="button"
                onClick={swapStops}
                className="mb-0.5 w-10 h-10 rounded-xl bg-brand-surface border border-brand-border hover:border-brand-yellow hover:bg-brand-yellow/10 flex items-center justify-center transition-all duration-200 group"
              >
                <ArrowLeftRight size={16} className="text-brand-muted group-hover:text-brand-yellow transition-colors" />
              </button>
              <StopSelect value={to} onChange={v => { setTo(v); setErrors(e => ({ ...e, to: '' })); }} excludeId={from} label="Куди" />
            </div>
            {(errors.from || errors.to) && (
              <p className="text-red-400 text-xs mt-1">{errors.from || errors.to}</p>
            )}
          </div>

          {/* Price preview */}
          {price > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-2 text-sm text-brand-light">
                <ArrowRight size={14} className="text-brand-yellow" />
                {STOPS.find(s=>s.id===from)?.name} → {STOPS.find(s=>s.id===to)?.name}
              </div>
              <div className="text-brand-yellow font-bold text-lg">{price} грн</div>
            </motion.div>
          )}

          {/* Date */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-yellow text-xs font-bold">2</div>
              Дата та час
            </h3>
            <div className="label mb-2">Дата поїздки</div>
            <DatePicker value={date} onChange={d => { setDate(d); setErrors(e => ({ ...e, date: '' })); }} />
            {errors.date && <p className="text-red-400 text-xs mt-1">{errors.date}</p>}

            {/* Time selection */}
            <div className="mt-4">
              <div className="label mb-2">Час відправлення</div>
              <div className="space-y-2">
                <div>
                  <div className="text-brand-muted text-xs mb-1.5">Вранці</div>
                  <div className="flex flex-wrap gap-2">
                    {MORNING_TIMES.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => { setSelectedTime(time); setErrors(e => ({ ...e, time: '' })); }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                          selectedTime === time
                            ? 'bg-brand-yellow text-brand-dark shadow-brand'
                            : 'bg-brand-surface border border-brand-border text-brand-light hover:border-brand-yellow/50 hover:text-brand-yellow'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-brand-muted text-xs mb-1.5">Вдень/Ввечері</div>
                  <div className="flex flex-wrap gap-2">
                    {AFTERNOON_TIMES.map(time => (
                      <button
                        key={time}
                        type="button"
                        onClick={() => { setSelectedTime(time); setErrors(e => ({ ...e, time: '' })); }}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                          selectedTime === time
                            ? 'bg-brand-yellow text-brand-dark shadow-brand'
                            : 'bg-brand-surface border border-brand-border text-brand-light hover:border-brand-yellow/50 hover:text-brand-yellow'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              {errors.time && <p className="text-red-400 text-xs mt-1">{errors.time}</p>}
            </div>
          </div>

          {/* Seats */}
          <div>
            <div className="label mb-2">Кількість місць</div>
            <div className="flex items-center gap-4">
              {[1, 2, 3, 4].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeats(n)}
                  className={`w-12 h-12 rounded-xl text-sm font-bold transition-all duration-150 ${
                    seats === n
                      ? 'bg-brand-yellow text-brand-dark shadow-brand'
                      : 'bg-brand-surface border border-brand-border text-brand-light hover:border-brand-yellow/50 hover:text-brand-yellow'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Passenger info */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-brand-yellow/20 flex items-center justify-center text-brand-yellow text-xs font-bold">3</div>
              Дані пасажира
            </h3>
            <div className="space-y-4">
              <div>
                <div className="label mb-2">Повне ім'я</div>
                <div className="relative">
                  <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setErrors(err => ({ ...err, name: '' })); }}
                    placeholder="Наприклад: Іваненко Іван"
                    className="input-field pl-11"
                  />
                </div>
                {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <div className="label mb-2">Номер телефону</div>
                <div className="relative">
                  <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => {
                      setPhone(formatPhone(e.target.value));
                      setErrors(err => ({ ...err, phone: '' }));
                    }}
                    placeholder="+380 XX XXX XX XX"
                    className="input-field pl-11"
                  />
                </div>
                {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Total */}
          {price > 0 && (
            <div className="bg-brand-surface rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm text-brand-light">
                <span>Ціна за місце</span>
                <span>{price} грн</span>
              </div>
              {seats > 1 && (
                <div className="flex justify-between text-sm text-brand-light">
                  <span>Кількість місць</span>
                  <span>×{seats}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-white font-bold text-lg border-t border-brand-border pt-2">
                <span>Разом</span>
                <span className="text-brand-yellow text-2xl">{price * seats} грн</span>
              </div>
            </div>
          )}

          <button type="submit" className="btn-primary w-full text-base py-4 flex items-center justify-center gap-2">
            Перейти до оплати
            <ArrowRight size={18} />
          </button>
        </form>
      </motion.div>
    </section>
  );
}
