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
    { name: 'ТЦ Скриня', link: 'https://maps.app.goo.gl/v9M1L5S2R3G4B8A7L' },
    { name: '«ЖК Парус»', link: '' },
    { name: 'ТЦ «АШАН»', link: '' },
    { name: 'ТЦ Victoria Gardens Автосалон Toyota', link: '' }
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
          <div className="card p-8 md:p-12 text-center space-y-8 border-brand-yellow/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-brand-yellow to-transparent opacity-50"></div>
            
            <div className="w-24 h-24 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto text-brand-yellow shadow-lg shadow-brand-yellow/5">
               <AlertCircle size={56} />
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl md:text-4xl font-display font-black text-white">Онлайн-бронювання тимчасово недоступне</h2>
              <p className="text-brand-muted max-w-lg mx-auto text-lg leading-relaxed">
                Ми наразі налаштовуємо платіжну систему для вашої зручності. 
                <span className="block mt-2 text-brand-yellow font-bold">Будь ласка, забронюйте поїздку за телефоном:</span>
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
              <a href={`tel:${CONTACTS.phone1}`} className="btn-primary p-5 flex items-center justify-center gap-3 text-dark font-black text-xl hover:scale-[1.02] transition-transform shadow-brand">
                <Phone size={24} />
                {CONTACTS.phone1Display}
              </a>
              <a href={`tel:${CONTACTS.phone2}`} className="btn-primary p-5 flex items-center justify-center gap-3 text-dark font-black text-xl hover:scale-[1.02] transition-transform shadow-brand">
                <Phone size={24} />
                {CONTACTS.phone2Display}
              </a>
            </div>
            
            <div className="pt-6 border-t border-brand-border/50">
              <p className="text-brand-muted text-sm uppercase tracking-widest font-bold">Дякуємо за розуміння!</p>
            </div>
          </div>
        )}
      </motion.div>
    </section>
  );
}
