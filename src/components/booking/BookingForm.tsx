import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, ArrowRight, X, ChevronRight, CheckCircle2, Loader2, AlertCircle, ChevronDown, MapPin, Map } from 'lucide-react';
import { getPrice, CONTACTS } from '../../data/routes';
import { useAuth } from '../../context/AuthContext';

import DatePicker from './DatePicker';

interface BookingFormProps {
  onPay: (data: BookingData) => void;
}

export interface BookingData {
  from: string;
  to: string;
  pickupLocation?: string;
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

export const PICKUP_LOCATIONS: Record<string, {name: string, link: string}[]> = {
  skhidnytsia: [
    { name: 'Готель Тустань', link: 'https://maps.app.goo.gl/9S5Fj2L5Sg9qL2Yw8' },
    { name: 'Ринок', link: 'https://maps.app.goo.gl/Z9JqR5G6H6v8F2fA9' },
    { name: 'Київська Русь', link: 'https://maps.app.goo.gl/vS8D9L2L6f5R3G7A8' },
    { name: 'Три сини та донька 4*', link: 'https://maps.app.goo.gl/v6D9L4M2S8R1G3B5A' },
    { name: 'Східницький замок', link: 'https://maps.app.goo.gl/v8G9L5S2M1R3G4B7A' },
    { name: 'Діана (Початок селища)', link: 'https://maps.app.goo.gl/v9D4M1S2R5G3B6A8L' },
    { name: 'Поворот на Борислав', link: 'https://maps.app.goo.gl/v7G5L2S1M3R4G9B8A' }
  ],
  boryslav: [
    { name: 'Поворот на Коваліва. АТБ', link: 'https://maps.app.goo.gl/9tH6M4L1S8R2G5B7A' },
    { name: 'Тустановичі. 5 школа', link: 'https://maps.app.goo.gl/v8D5M4L2S1R3G9B6A' },
    { name: 'Центр. Нова пошта 1', link: 'https://maps.app.goo.gl/v7G3M1S5R2G4B8A9L' }
  ],
  truskavets: [
    { name: 'Вишенька. Лісова пісня', link: 'https://maps.app.goo.gl/v1G4L2S5M8R3G6B9A' },
    { name: 'Автовокзал', link: 'https://maps.app.goo.gl/v9M5L1S2R3G4B7A8L' },
    { name: 'Церква св. Іллі. Поліція', link: 'https://maps.app.goo.gl/v5G3M1S8R2G4B9A7L' },
    { name: 'Стебницьке кільце. ТЦ Вектор', link: 'https://maps.app.goo.gl/v2G9M4L5S1R3G8B6A' }
  ],
  stebnik: [
    { name: 'Рідний край. Скрент', link: 'https://maps.app.goo.gl/v4G8M1S2R5G3B9A7L' },
    { name: 'Високий замок. Рукавичка', link: 'https://maps.app.goo.gl/v1G9M5L2S8R3G4B6A' }
  ],
  lviv: [
    { name: 'Головний залізничний вокзал (Платна парковка)', link: 'https://maps.app.goo.gl/v3G8L1S5M2R4G7B9A' },
    { name: 'ТЦ Скриня', link: 'https://maps.app.goo.gl/v9M1L5S2R3G4B8A7L' }
  ]
};

// Custom Sprinter Taxi Icon
function SprinterTaxiIcon({ className }: { className?: string }) {
  return (
    <div className={`relative flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-7 text-brand-yellow">
        {/* Van body */}
        <path d="M2 17h20v-4l-3-4H7l-3 4v4z" />
        <path d="M7 9V7a1 1 0 011-1h8a1 1 0 011 1v2" />
        <rect x="8" y="10" width="8" height="3" fill="currentColor" fillOpacity="0.2" />
        <circle cx="7" cy="17" r="2" />
        <circle cx="17" cy="17" r="2" />
      </svg>
      <div className="bg-brand-yellow text-brand-dark text-[9px] font-black px-1.5 py-0.5 rounded-sm -mt-0.5 tracking-tighter uppercase shadow-sm">таксі</div>
    </div>
  );
}

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
          <a href={`tel:${CONTACTS.phone1}`} className="btn-primary w-full flex items-center justify-center gap-2 text-dark font-bold">
            <Phone size={18} />
            {CONTACTS.phone1Display}
          </a>
          <a href={`tel:${CONTACTS.phone2}`} className="btn-primary w-full flex items-center justify-center gap-2 text-dark font-bold">
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

export default function BookingForm({ onPay }: BookingFormProps) {
  const { user } = useAuth();
  
  const [directionIndex, setDirectionIndex] = useState<number | null>(null);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [seats, setSeats] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [isPickupDropdownOpen, setIsPickupDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCallModal, setShowCallModal] = useState(false);
  const [showAllCrews, setShowAllCrews] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  // Availability from Google Sheets
  const [availability, setAvailability] = useState<Record<string, any[]>>({});
  const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);

  const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxd8ZIMLZdgaOKw7YBmbTK72mCUvy8rmRcOUvqQ2W3vZifJy3wTVbh_q-ikWL1FarXk/exec';

  const price = getPrice(from, to);
  const currentRoute = directionIndex === 0 ? ROUTE_LVIV_TO_SKHIDNYTSIA : ROUTE_SKHIDNYTSIA_TO_LVIV;

  useEffect(() => {
    if (user && !name && phone === '+380') {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  // Fetch availability when date changes
  useEffect(() => {
    if (date) {
      fetchAvailability();
    }
  }, [date]);

  const fetchAvailability = async () => {
    setIsLoadingAvailability(true);
    try {
      const res = await fetch(SCRIPT_URL);
      const data = await res.json();
      setAvailability(data);
    } catch (err) {
      console.error('Failed to fetch availability:', err);
    } finally {
      setIsLoadingAvailability(false);
    }
  };

  // 6 crews, each alternating Східниця→Львів and Львів→Східниця throughout the day
  // Structure: crewNumber → { skhidnytsia_lviv: times[], lviv_skhidnytsia: times[] }
  const CREWS = [
    { name: 'Екіпаж №1', skhidnytsia_lviv: ['05:50', '10:35', '15:30'], lviv_skhidnytsia: ['08:10', '13:10', '19:20'] },
    { name: 'Екіпаж №2', skhidnytsia_lviv: ['06:20', '11:10', '16:20'], lviv_skhidnytsia: ['09:00', '14:10', '20:00'] },
    { name: 'Екіпаж №3', skhidnytsia_lviv: ['07:10', '12:40', '17:00'], lviv_skhidnytsia: ['10:15', '15:30', '20:40'] },
    { name: 'Екіпаж №4', skhidnytsia_lviv: ['08:10', '13:20', '17:40'], lviv_skhidnytsia: ['11:05', '16:10'] },
    { name: 'Екіпаж №5', skhidnytsia_lviv: ['08:50', '14:10'],           lviv_skhidnytsia: ['11:50', '18:20'] },
    { name: 'Екіпаж №6', skhidnytsia_lviv: ['09:30', '12:00'],           lviv_skhidnytsia: ['12:20', '14:50'] },
  ];

  // Get departure times for the selected direction
  const getTimesForDirection = () => {
    if (directionIndex === null) return [];
    const key = directionIndex === 0 ? 'lviv_skhidnytsia' : 'skhidnytsia_lviv';
    const entries: { time: string; crewName: string }[] = [];
    CREWS.forEach(crew => {
      crew[key].forEach(time => {
        entries.push({ time, crewName: crew.name });
      });
    });
    // Sort by time
    entries.sort((a, b) => a.time.localeCompare(b.time));
    return entries;
  };

  const availableDepartures = getTimesForDirection();

  // Get crew name for a given time
  const getCrewName = (time: string) => {
    const entry = availableDepartures.find(e => e.time === time);
    return entry?.crewName || `Екіпаж №${time.replace(':', '')}`;
  };

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

  const handleStopSelect = (stopId: string) => {
    if (!from || (from && to)) {
      setFrom(stopId);
      setTo('');
      setSelectedTime('');
      setPickupLocation('');
    } else {
      const fromIdx = currentRoute.findIndex(s => s.id === from);
      const toIdx = currentRoute.findIndex(s => s.id === stopId);
      
      if (toIdx > fromIdx) {
        setTo(stopId);
        // Перевірка на короткий маршрут (тільки за телефоном)
        const isShort = from !== 'lviv' && stopId !== 'lviv';
        if (isShort) setShowCallModal(true);
      } else {
        setFrom(stopId);
        setTo('');
        setSelectedTime('');
        setPickupLocation('');
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
    if (selectedTime && !pickupLocation) errs.pickupLocation = "Оберіть зупинку для посадки";
    if (!name.trim() || name.trim().length < 2) errs.name = "Введіть ім'я";
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 12) errs.phone = "Введіть коректний номер";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isShortTrip = (from !== 'lviv' && to !== 'lviv');
    const isForbidden = (price === 0);

    if (isForbidden && from && to) {
        setErrors({ route: "Даний маршрут недоступний для бронювання." });
        return;
    }

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

    // Open payment modal immediately
    onPay({ from, to, pickupLocation, date: date!, name, phone, price: price * seats, seats, departureTime: selectedTime });
  };

  const AvailabilityCard = ({ time, isVisible }: { time: string; isVisible: boolean }) => {
    const passed = isTimePassed(time);
    if (passed) return null;
    
    const isSelected = selectedTime === time;
    const timeData = availability[time] || [];
    const freeSeats = timeData.length > 0 ? timeData.filter(s => !s.name).length : 12;
    
    // Hide crew if no free seats
    if (freeSeats === 0) return null;
    
    // If a crew is selected — only show the selected one unless expanded
    if (!isVisible && !isSelected) return null;

    return (
      <motion.button
        type="button"
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3 }}
        onClick={() => { 
          setSelectedTime(isSelected ? '' : time); 
          setShowAllCrews(isSelected); 
          setErrors(e => ({ ...e, time: '' })); 
        }}
        className={`relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 text-left w-full
          ${isSelected 
            ? 'bg-brand-yellow text-brand-dark border-brand-yellow shadow-brand scale-[1.01]' 
            : 'bg-brand-surface border-brand-border hover:border-brand-yellow/40 hover:bg-brand-yellow/5 group'
          }
        `}
      >
        <div className="flex items-center gap-6">
            <div className={`p-1 rounded-xl flex items-center justify-center ${isSelected ? 'bg-brand-dark/10' : 'text-brand-yellow'}`}>
              <SprinterTaxiIcon />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-display font-black">~{time}</span>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${isSelected ? 'bg-brand-dark/10 opacity-70' : 'bg-brand-yellow/10 text-brand-yellow'}`}>
                        {getCrewName(time)}
                    </span>
                </div>
                <div className={`text-xs font-medium flex items-center gap-1.5 ${isSelected ? 'text-brand-dark/80' : 'text-brand-muted'}`}>
                   Орієнтовний час готовності <span className="opacity-40">•</span> <User size={12} className="inline mr-0.5" />{freeSeats} місць
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <div className={`text-[10px] uppercase font-black tracking-tighter ${isSelected ? 'text-brand-dark/60' : freeSeats <= 3 ? 'text-orange-400' : 'text-green-500'}`}>
                  {isSelected ? 'Обрано' : freeSeats <= 3 ? 'Мало місць' : 'Статус: Вільний'}
                </div>
                <div className={`text-xs font-bold ${isSelected ? 'text-brand-dark' : 'text-white'}`}>Готовий до виїзду</div>
            </div>
            <div className={`w-3 h-3 rounded-full pulse ${isSelected ? 'bg-brand-dark' : freeSeats <= 3 ? 'bg-orange-400' : 'bg-green-500'}`} />
        </div>
        {isSelected && (
          <div className="absolute -top-2 -right-2 transform transition-transform">
             <div className="bg-brand-dark text-brand-yellow p-1.5 rounded-full shadow-lg border border-brand-yellow/20">
                <ArrowRight size={16} />
             </div>
          </div>
        )}
      </motion.button>
    );
  };

  const isForbidden = from && to && price === 0;

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
          <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-4 relative overflow-hidden">
            {isSubmitting && (
              <div className="absolute inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 size={48} className="text-brand-yellow animate-spin" />
                    <SprinterTaxiIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-brand-yellow scale-50" />
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
                    onClick={() => { setDirectionIndex(dir.id); setFrom(''); setTo(''); setErrors({}); }}
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

            {/* STEP 2: STOPS */}
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
                    {!from ? 'Оберіть місто відправлення' : 'Тепер оберіть місто прибуття'}
                  </h3>
                  
                  <div className="relative">
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
                              onClick={() => { handleStopSelect(stop.id); setErrors({}); }}
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

                    {!from && <div className="mt-4 text-center text-sm text-brand-yellow animate-pulse uppercase font-black tracking-widest bg-brand-yellow/5 py-3 rounded-lg border border-brand-yellow/10">Оберіть точку відправлення</div>}
                    {from && !to && <div className="mt-4 text-center text-sm text-brand-yellow animate-pulse uppercase font-black tracking-widest bg-brand-yellow/5 py-3 rounded-lg border border-brand-yellow/10">Тепер оберіть точку прибуття</div>}
                    {from && to && (
                        <div className="mt-2 bg-brand-yellow/5 p-3 rounded-xl border border-brand-yellow/10 flex items-center justify-center gap-4">
                          <div className="flex items-center gap-3">
                            <span className="text-white font-bold">{currentRoute.find(s=>s.id===from)?.name}</span>
                            <ArrowRight size={16} className="text-brand-yellow" />
                            <span className="text-white font-bold">{currentRoute.find(s=>s.id===to)?.name}</span>
                          </div>
                          <button type="button" onClick={()=>{setFrom('');setTo('');setSelectedTime('');setErrors({});}} className="text-[10px] text-brand-muted hover:text-white underline">Зкинути</button>
                        </div>
                    )}

                    {(isForbidden || errors.route) && (
                      <div className="mt-4 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-red-500 text-sm flex items-center gap-3 justify-center">
                        <AlertCircle size={18} />
                        <span>{errors.route || "Даний маршрут недоступний для бронювання."}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STEP 3: DATE & AVAILABILITY */}
            {from && to && !isForbidden && (
              <div className="space-y-4 pt-2 border-t border-brand-border">
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
                  ) : isLoadingAvailability ? (
                    <div className="flex flex-col items-center justify-center p-12 space-y-4">
                       <Loader2 size={32} className="text-brand-yellow animate-spin" />
                       <span className="text-brand-muted text-sm">Оновлюємо наявні місця...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <AnimatePresence mode="popLayout">
                        {availableDepartures.map(({ time }) => (
                          <AvailabilityCard key={time} time={time} isVisible={showAllCrews} />
                        ))}
                      </AnimatePresence>
                      {selectedTime && !showAllCrews && (
                        <motion.button
                          type="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3 }}
                          onClick={() => setShowAllCrews(true)}
                          className="w-full py-3 text-sm text-brand-muted hover:text-brand-yellow flex items-center justify-center gap-2 rounded-xl border border-dashed border-brand-border hover:border-brand-yellow/30 transition-all"
                        >
                          <ChevronDown size={16} />
                          Показати інші екіпажі
                        </motion.button>
                      )}
                    </div>
                  )}
                  {errors.time && <p className="text-red-400 text-xs mt-2">{errors.time}</p>}
                </div>

                {/* PICKUP LOCATION (Only visible when time is selected) */}
                {selectedTime && PICKUP_LOCATIONS[from] && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    className="pt-4 overflow-visible"
                  >
                    <div className="bg-brand-surface/40 border border-brand-border rounded-2xl p-5">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-full bg-brand-yellow/10 flex items-center justify-center">
                          <MapPin size={16} className="text-brand-yellow" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium text-sm">Зупинка посадки ({currentRoute.find(s=>s.id===from)?.name})</h4>
                          <p className="text-brand-muted text-xs">Оберіть найзручнішу для вас локацію</p>
                        </div>
                      </div>
                      
                      <div className="relative">
                        <button 
                          type="button" 
                          onClick={() => setIsPickupDropdownOpen(!isPickupDropdownOpen)}
                          className={`w-full text-left bg-brand-dark/80 border ${errors.pickupLocation ? 'border-red-500' : 'border-brand-border'} rounded-xl p-4 flex items-center justify-between hover:border-brand-yellow/50 transition-all`}
                        >
                          <div className="flex flex-col">
                            <span className="text-brand-muted text-[10px] uppercase font-bold tracking-wider mb-1">Ваша зупинка</span>
                            <span className={`text-sm font-medium ${pickupLocation ? 'text-white' : 'text-brand-muted'}`}>
                              {pickupLocation || "Натисніть, щоб обрати..."}
                            </span>
                          </div>
                          <ChevronDown size={18} className={`text-brand-yellow transition-transform ${isPickupDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isPickupDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              className="absolute top-full left-0 right-0 z-20 mt-2 bg-[#2A2A2A] border border-brand-border rounded-xl shadow-xl overflow-hidden"
                            >
                              <div className="max-h-60 overflow-y-auto w-full py-2 custom-scrollbar">
                                {PICKUP_LOCATIONS[from].map(loc => (
                                  <button
                                     key={loc.name}
                                     type="button"
                                     onClick={() => { setPickupLocation(loc.name); setIsPickupDropdownOpen(false); setErrors(e => ({ ...e, pickupLocation: '' })); }}
                                     className={`w-full text-left px-5 py-3 text-sm flex items-center justify-between transition-colors ${pickupLocation === loc.name ? 'text-brand-yellow bg-brand-yellow/10' : 'text-white hover:bg-brand-surface'}`}
                                  >
                                     {loc.name}
                                     {pickupLocation === loc.name && <CheckCircle2 size={16} />}
                                  </button>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {errors.pickupLocation && <p className="text-red-400 text-xs mt-2">{errors.pickupLocation}</p>}

                      {/* Map Button (visible if something is selected) */}
                      <AnimatePresence>
                        {pickupLocation && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                          >
                            <a 
                              href={PICKUP_LOCATIONS[from].find(l => l.name === pickupLocation)?.link} 
                              target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-brand-surface border border-brand-border hover:border-brand-yellow/50 rounded-lg text-xs font-medium text-brand-light hover:text-white transition-all group w-max"
                            >
                              <div className="w-6 h-6 rounded-md bg-blue-500/10 flex items-center justify-center group-hover:scale-105 transition-transform">
                                <Map size={14} className="text-blue-400" />
                              </div>
                              Відкрити на Google Картах
                            </a>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                )}

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
                    <button type="submit" disabled={isSubmitting} className="btn-primary w-full md:w-auto px-12 py-5 text-lg flex items-center justify-center gap-3 group disabled:opacity-50 text-dark font-black">
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
