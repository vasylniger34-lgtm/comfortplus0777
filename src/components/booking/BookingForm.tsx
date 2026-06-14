import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, ArrowRight, X, ChevronRight, CheckCircle2, Loader2, AlertCircle, ChevronDown, MapPin, Map } from 'lucide-react';
import { getPrice, CONTACTS } from '../../data/routes';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';

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
    { name: 'ЗАБРАТИ З ГОТЕЛЮ', link: '' },
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
    { name: 'ЗАБРАТИ З ГОТЕЛЮ', link: '' },
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

// Мапінг часу до екіпажу
const getCrewByTime = (time: string, isLvivDeparture: boolean) => {
  if (isLvivDeparture) {
    const mapping: Record<string, string> = {
      '09:00': '06:20', '14:50': '06:20', // Crew 1
      '10:15': '07:10', '16:10': '07:10', // Crew 2
      '11:10': '08:15', '18:20': '08:15', // Crew 3
      '12:20': '09:30', '19:20': '09:30', // Crew 4
      '13:10': '10:35', '20:00': '10:35', // Crew 5
      '14:10': '11:10', '20:40': '11:10', // Crew 6
    };
    return mapping[time] || '';
  } else {
    const mapping: Record<string, string> = {
      '06:20': '06:20', '12:00': '06:20', // Crew 1
      '07:10': '07:10', '13:20': '07:10', // Crew 2
      '08:15': '08:15', '15:30': '08:15', // Crew 3
      '09:30': '09:30', '16:20': '09:30', // Crew 4
      '10:35': '10:35', '17:00': '10:35', // Crew 5
      '11:10': '11:10', '17:40': '11:10', // Crew 6
    };
    return mapping[time] || '';
  }
};

const getUADateString = (dateObj: Date) => {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}.${m}.${y}`;
};

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
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [isPickupDropdownOpen, setIsPickupDropdownOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCallModal, setShowCallModal] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const price = getPrice(from, to);
  const currentRoute = directionIndex === 0 ? ROUTE_LVIV_TO_SKHIDNYTSIA : ROUTE_SKHIDNYTSIA_TO_LVIV;

  useEffect(() => {
    if (user && !name && phone === '+380') {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  const TIMES_LVIV_TO_SKHIDNYTSIA = [
    '09:00', '10:15', '11:10', '12:20', '13:10', '14:10', '14:50', '16:10', '18:20', '19:20', '20:00', '20:40'
  ];
  const TIMES_SKHIDNYTSIA_TO_LVIV = [
    '06:20', '07:10', '08:15', '09:30', '10:35', '11:10', '12:00', '13:20', '15:30', '16:20', '17:00', '17:40'
  ];
  const departureTimes = directionIndex === 0 ? TIMES_LVIV_TO_SKHIDNYTSIA : TIMES_SKHIDNYTSIA_TO_LVIV;

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
      setDropoffLocation('');
    } else {
      const fromIdx = currentRoute.findIndex(s => s.id === from);
      const toIdx = currentRoute.findIndex(s => s.id === stopId);
      
      if (toIdx > fromIdx) {
        setTo(stopId);
        const isShort = from !== 'lviv' && stopId !== 'lviv';
        if (isShort) setShowCallModal(true);
      } else {
        setFrom(stopId);
        setTo('');
        setSelectedTime('');
        setPickupLocation('');
        setDropoffLocation('');
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
    if (selectedTime && (to === 'skhidnytsia' || to === 'truskavets') && !dropoffLocation) {
      errs.dropoffLocation = "Оберіть зупинку для висадки";
    }
    if (!name.trim() || name.trim().length < 2) errs.name = "Введіть ім'я";
    const phoneDigits = phone.replace(/\D/g, '');
    if (phoneDigits.length < 12) errs.phone = "Введіть коректний номер";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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
    
    setIsSubmitting(true);
    try {
      const payloadPickupLoc = dropoffLocation 
        ? `${pickupLocation} (Висадка: ${dropoffLocation})`
        : pickupLocation;

      const payload = {
        from: currentRoute.find(s=>s.id===from)?.name || from,
        to: currentRoute.find(s=>s.id===to)?.name || to,
        pickup_location: payloadPickupLoc,
        date: date ? getUADateString(date) : '',
        name,
        phone,
        seats,
        departure_time: selectedTime,
        price: price * seats,
        status: 'active',
        crew: getCrewByTime(selectedTime, directionIndex === 0)
      };

      // Відправка в API
      await apiClient.createBooking(payload);

      // Відправка в Telegram
      try {
        const botToken = '8615069227:AAEiCjdj66e469JqarZxWSlfzFQs1jGkr4M';
        const ADMIN_CHAT_IDS = ['8472692319', '8618558820'];
        
        const isHotelPickup = pickupLocation === 'ЗАБРАТИ З ГОТЕЛЮ';
        const isHotelDropoff = dropoffLocation === 'ДОСТАВИТИ ДО ГОТЕЛЮ';
        const isHotelTrip = isHotelPickup || isHotelDropoff;

        const adminText = `🔔 Нове бронювання на сайті!\n\n👤 Клієнт: ${name}\n📞 Телефон: ${phone}\nМаршрут: ${payload.from} → ${payload.to}\n🚏 Зупинка посадки: ${pickupLocation}\n🚏 Зупинка висадки: ${dropoffLocation || 'Стандартна'}\n📅 Дата: ${payload.date}\n🕒 Час: ${selectedTime}\n👥 Місць: ${seats}\n💰 Сума: ${price * seats} грн${isHotelTrip ? ' (+ додаткова оплата за готель)' : ''}`;
        
        for (const adminId of ADMIN_CHAT_IDS) {
          fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              chat_id: adminId,
              text: adminText
            })
          });
        }

        // Окремий ордер для готелю
        if (isHotelTrip) {
          const hotelText = `🏨 УВАГА! ТРЕБА ПЕРЕТЕЛЕФОНУВАТИ! Забір/доставка з готелю\n\n👤 Клієнт: ${name}\n📞 Телефон: ${phone}\nМаршрут: ${payload.from} → ${payload.to}\n🚏 Зупинка посадки: ${pickupLocation}\n🚏 Зупинка висадки: ${dropoffLocation || '-'}\n📅 Дата: ${payload.date}\n🕒 Час: ${selectedTime}\n👥 Місць: ${seats}\n💰 Сума: ${price * seats} грн\n\n⚠️ Клієнт забронював рейс з ${isHotelPickup && isHotelDropoff ? 'забору з готелю та доставки в готель' : isHotelPickup ? 'забору з готелю' : 'доставки в готель'}. Треба перетелефонувати й узгодити ціну!`;
          
          for (const adminId of ADMIN_CHAT_IDS) {
            fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                chat_id: adminId,
                text: hotelText
              })
            });
          }
        }
      } catch (e) {
        console.error('Telegram error', e);
      }

      setSubmitStatus('success');
      setStatusMessage('Дякуємо! Ваша заявка прийнята. Оскільки онлайн-оплата тимчасово недоступна, будь ласка, зателефонуйте нам для підтвердження броні.');

    } catch (error) {
      console.error('Supabase Error:', error);
      setSubmitStatus('error');
      setStatusMessage('Сталася помилка при збереженні. Спробуйте ще раз або зателефонуйте нам.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const AvailabilityCard = ({ time }: { time: string }) => {
    const passed = isTimePassed(time);
    if (passed) return null;
    const isSelected = selectedTime === time;
    const seatsLeft = 8; // Заглушка

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
              <MapPin size={24} />
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
      <AnimatePresence>{showCallModal && <CallUsModal onClose={() => { setShowCallModal(false); setFrom(''); setTo(''); }} />}</AnimatePresence>

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
            className="card p-12 text-center space-y-6 border-brand-yellow/30"
          >
             <div className="w-20 h-20 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto text-brand-yellow">
                <CheckCircle2 size={48} />
             </div>
             <h2 className="text-3xl font-display font-black text-white">Заявка прийнята!</h2>
             <p className="text-brand-muted max-w-md mx-auto text-lg">{statusMessage}</p>
             
             <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-6">
               <a href={`tel:${CONTACTS.phone1}`} className="btn-primary p-4 flex items-center justify-center gap-3 text-dark font-black text-lg shadow-brand">
                 <Phone size={20} />
                 {CONTACTS.phone1Display}
               </a>
               <a href={`tel:${CONTACTS.phone2}`} className="btn-primary p-4 flex items-center justify-center gap-3 text-dark font-black text-lg shadow-brand">
                 <Phone size={20} />
                 {CONTACTS.phone2Display}
               </a>
             </div>
             
             <button 
               onClick={() => setSubmitStatus('idle')}
               className="text-brand-muted hover:text-white underline text-sm mt-4"
             >
                Повернутись до форми
             </button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 md:p-8 space-y-12 relative overflow-hidden">
            {isSubmitting && (
              <div className="absolute inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4">
                  <Loader2 size={48} className="text-brand-yellow animate-spin" />
                  <p className="text-brand-yellow font-bold animate-pulse text-center px-4">Зберігаємо вашу заявку...</p>
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
                    onClick={() => { setDirectionIndex(dir.id); setFrom(''); setTo(''); setPickupLocation(''); setDropoffLocation(''); }}
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
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* STEP 3: DATE & TIME */}
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

                    <div className="space-y-6">
                      <div>
                        <h3 className="label mb-2">Зупинка для посадки</h3>
                        <div className="relative">
                          <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow" />
                          <select 
                            value={pickupLocation} 
                            onChange={e => { setPickupLocation(e.target.value); setErrors(err => ({ ...err, pickupLocation: '' })); }}
                            className="input-field pl-12 h-14 appearance-none"
                          >
                            <option value="">Оберіть зупинку...</option>
                            {PICKUP_LOCATIONS[from]?.map((loc, idx) => (
                              <option key={idx} value={loc.name}>{loc.name}</option>
                            ))}
                          </select>
                          <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                        </div>
                        {errors.pickupLocation && <p className="text-red-400 text-xs mt-1">{errors.pickupLocation}</p>}
                      </div>

                      {(to === 'skhidnytsia' || to === 'truskavets') && (
                        <div>
                          <h3 className="label mb-2">Зупинка для висадки</h3>
                          <div className="relative">
                            <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow" />
                            <select 
                              value={dropoffLocation} 
                              onChange={e => { setDropoffLocation(e.target.value); setErrors(err => ({ ...err, dropoffLocation: '' })); }}
                              className="input-field pl-12 h-14 appearance-none"
                            >
                              <option value="">Оберіть зупинку для висадки...</option>
                              <option value="ДОСТАВИТИ ДО ГОТЕЛЮ">ДОСТАВИТИ ДО ГОТЕЛЮ</option>
                              {PICKUP_LOCATIONS[to]?.filter(loc => loc.name !== 'ЗАБРАТИ З ГОТЕЛЮ').map((loc, idx) => (
                                <option key={idx} value={loc.name}>{loc.name}</option>
                              ))}
                            </select>
                            <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted pointer-events-none" />
                          </div>
                          {errors.dropoffLocation && <p className="text-red-400 text-xs mt-1">{errors.dropoffLocation}</p>}
                        </div>
                      )}
                    </div>
                </div>

                <div>
                  <h3 className="label mb-4">Доступність екіпажів</h3>
                  {!date ? (
                    <div className="card-inner p-10 border border-dashed border-brand-border rounded-2xl text-center text-brand-muted">Оберіть дату поїздки</div>
                  ) : (
                    <div className="space-y-4">
                      {departureTimes.map(time => <AvailabilityCard key={time} time={time} />)}
                    </div>
                  )}
                  {errors.time && <p className="text-red-400 text-xs mt-2">{errors.time}</p>}
                </div>

                {/* PASSENGER INFO */}
                <div className="pt-8 border-t border-brand-border">
                    <h3 className="section-title text-xl mb-6">Дані пасажира та Місця</h3>
                    <div className="grid lg:grid-cols-3 gap-6">
                        <div>
                            <div className="label mb-2">Ваше ім'я</div>
                            <div className="relative">
                              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow" />
                              <input type="text" value={name} onChange={e => { setName(e.target.value); setErrors(err => ({ ...err, name: '' })); }} placeholder="Іван Іваненко" className="input-field pl-12 h-14" />
                            </div>
                            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <div className="label mb-2">Телефон</div>
                            <div className="relative">
                              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-yellow" />
                              <input type="tel" value={phone} onChange={e => { setPhone(formatPhone(e.target.value)); setErrors(err => ({ ...err, phone: '' })); }} placeholder="+380" className="input-field pl-12 h-14" />
                            </div>
                            {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
                        </div>
                        <div>
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

                {price > 0 && selectedTime && (
                  <div className="space-y-4">
                    {(pickupLocation === 'ЗАБРАТИ З ГОТЕЛЮ' || dropoffLocation === 'ДОСТАВИТИ ДО ГОТЕЛЮ') && (
                      <div className="bg-brand-yellow/10 border border-brand-yellow/30 rounded-2xl p-4 text-brand-yellow text-sm leading-relaxed flex items-start gap-3">
                        <span className="text-xl">🏨</span>
                        <div>
                          <p className="font-bold">Ціна за забирання з готелю або доставку до готелю є додатковою.</p>
                          <p className="text-xs text-brand-muted mt-1">Наш менеджер перетелефонує вам найближчим часом для узгодження вартості цієї послуги.</p>
                        </div>
                      </div>
                    )}
                    <div className="bg-brand-dark/40 rounded-2xl p-6 border border-brand-yellow/20 flex flex-col md:flex-row justify-between items-center gap-6">
                      <div>
                        <div className="text-brand-muted text-xs uppercase tracking-widest font-black mb-1">Разом за {seats} пас.</div>
                        <div className="text-brand-yellow text-4xl font-display font-black leading-none">{price * seats} грн</div>
                      </div>
                      <button type="submit" disabled={isSubmitting} className="btn-primary w-full md:w-auto px-12 py-5 text-lg flex items-center justify-center gap-3 group disabled:opacity-50">
                        {isSubmitting ? 'Зберігаємо...' : 'Забронювати'}
                        {!isSubmitting && <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />}
                      </button>
                    </div>
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
