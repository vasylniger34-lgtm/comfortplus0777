import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, ArrowRight, X, ChevronRight, CheckCircle2, Loader2, ChevronDown, ChevronUp, MapPin } from 'lucide-react';
import { getPrice, CONTACTS, getCarDetails } from '../../data/routes';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../lib/apiClient';
import { normalizeTime, normalizeCrewName } from '../../utils/normalize';

import DatePicker from './DatePicker';

interface BookingFormProps {
  onPay: (data: BookingData) => void;
  directionIndex: number | null;
  setDirectionIndex: (dir: number | null) => void;
}

export interface BookingData {
  from: string;
  to: string;
  pickupLocation?: string;
  dropoffLocation?: string;
  date: Date;
  name: string;
  phone: string;
  price: number;
  seats: number;
  departureTime: string;
  directionIndex: number;
  crew?: string;
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
    { name: 'А-готель (3 джерело)', link: '' },
    { name: 'Київська Русь (ОККО)', link: '' },
    { name: 'поворот на Діану (біля чайничка)', link: '' },
    { name: 'Дім Молитви (скарбничка, ринок)', link: '' },
    { name: 'ТуСтань (автостанція)', link: '' },
    { name: 'Содова (2с)', link: '' }
  ],
  boryslav: [
    { name: 'Тустановичі (5 школа)', link: '' },
    { name: 'пов на Коваліва', link: '' },
    { name: 'Циганська площа', link: '' },
    { name: '7 школа', link: '' },
    { name: 'ПриватʼРайфайзен (У лева)', link: '' },
    { name: 'площа І.Франка, центр, таксі, фонтан', link: '' },
    { name: 'Міська рада (Спар, Дніпром)', link: '' },
    { name: 'Взуттєва фабрика', link: '' },
    { name: 'Пам’ятник Степану Бандері', link: '' },
    { name: 'Мражниця', link: '' },
    { name: 'Крутогір', link: '' },
    { name: 'LuxWash мийка, після перевалу', link: '' }
  ],
  truskavets: [
    { name: 'ЗАБРАТИ З ГОТЕЛЮ', link: '' },
    { name: 'Сосновий Бір', link: '' },
    { name: 'Вишенька (Лісова пісня)', link: '' },
    { name: '1 школа (Перед Дрогобицьким кільцем)', link: '' },
    { name: 'Автовокзал', link: '' },
    { name: 'церква Іллі (на Мазепи)', link: '' },
    { name: 'Стебницьке кільце (навпроти ДивоЦіну)', link: '' },
    { name: 'санаторій Полонина (виїзд)', link: '' }
  ],
  stebnik: [
    { name: 'Високий замок', link: '' },
    { name: 'Скрент', link: '' },
    { name: 'Діброва', link: '' }
  ],
  lviv: [
    { name: 'Victoria Gardens (автосалон Toyota)', link: '' },
    { name: 'Щирецька (Нова Лінія)', link: '' },
    { name: 'АшанСіті (вул.В.Великого)', link: '' },
    { name: 'Психічна лікарня', link: '' },
    { name: 'Кардіологічний центр', link: '' },
    { name: 'ЖК «Парус» (вул.Кульпарківська)', link: '' },
    { name: 'ТЦ «Скриня»', link: '' },
    { name: 'Приміський ринок', link: '' },
    { name: 'Залізничний Вокзал (Платна парковка)', link: '' }
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

const getUADateString = (dateObj: Date) => {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}.${m}.${y}`;
};

const MinibusIcon = ({ color, isSelected }: { color: string; isSelected: boolean }) => {
  const strokeColor = color.toLowerCase() === '#ffffff' 
    ? (isSelected ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.4)')
    : 'none';
  
  return (
    <svg 
      width="24" 
      height="14" 
      viewBox="0 0 24 14" 
      fill={color} 
      stroke={strokeColor}
      strokeWidth={strokeColor !== 'none' ? '0.75' : '0'}
      className="inline-block align-middle rounded-sm"
      style={{ filter: color.toLowerCase() === '#ffffff' ? 'drop-shadow(0px 1px 1px rgba(0,0,0,0.15))' : 'none' }}
    >
      <path d="M2 3C2 1.89543 2.89543 1 4 1H16.5C17.0673 1 17.6072 1.24131 17.9789 1.66068L21.7584 5.92298C21.9142 6.09893 22 6.32622 22 6.5623V11C22 12.1046 21.1046 13 20 13H4C2.89543 13 2 12.1046 2 11V3Z" />
      <path d="M4.5 3H7.5V6H4.5V3Z" fill={isSelected ? '#facc15' : '#1e293b'} opacity="0.6" />
      <path d="M9 3H13.5V6H9V3Z" fill={isSelected ? '#facc15' : '#1e293b'} opacity="0.6" />
      <path d="M15 3H17.382C17.8427 3 18.2731 3.20894 18.5528 3.5682L20.2528 5.75391C20.4121 5.95874 20.5 6.2117 20.5 6.47188V6.5H15V3Z" fill={isSelected ? '#facc15' : '#1e293b'} opacity="0.6" />
      <circle cx="6.5" cy="12.5" r="2" fill="#000" stroke="#fff" strokeWidth="0.5" />
      <circle cx="17.5" cy="12.5" r="2" fill="#000" stroke="#fff" strokeWidth="0.5" />
    </svg>
  );
};

export default function BookingForm({ onPay, directionIndex, setDirectionIndex }: BookingFormProps) {
  const { user } = useAuth();
  
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+380');
  const [seats, setSeats] = useState(1);
  const [selectedTime, setSelectedTime] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCallModal, setShowCallModal] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');

  const [schedules, setSchedules] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);

  const price = getPrice(from, to);
  const currentRoute = directionIndex === 0 ? ROUTE_LVIV_TO_SKHIDNYTSIA : ROUTE_SKHIDNYTSIA_TO_LVIV;

  useEffect(() => {
    if (user && !name && phone === '+380') {
      setName(user.name);
      setPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    setFrom('');
    setTo('');
    setPickupLocation('');
    setDropoffLocation('');
    setSelectedTime('');
    setIsCollapsed(true);
  }, [directionIndex]);

  const fetchSchedulesAndBookings = async () => {
    if (!date) return;
    try {
      const dateStr = getUADateString(date);
      const [schedulesData, bookingsData] = await Promise.all([
        apiClient.getSchedules(dateStr),
        apiClient.getBookings({ date: dateStr })
      ]);
      setSchedules(schedulesData || []);
      setBookings(bookingsData || []);
    } catch (err) {
      console.error('Помилка завантаження даних рейсу/бронювань:', err);
    }
  };

  useEffect(() => {
    if (!date) {
      setSchedules([]);
      setBookings([]);
      return;
    }

    setIsLoadingSchedules(true);
    fetchSchedulesAndBookings().finally(() => {
      setIsLoadingSchedules(false);
    });

    const handleSchedulesChanged = () => fetchSchedulesAndBookings();
    const handleBookingsChanged = () => fetchSchedulesAndBookings();

    apiClient.socket.on('schedules_changed', handleSchedulesChanged);
    apiClient.socket.on('bookings_changed', handleBookingsChanged);

    return () => {
      apiClient.socket.off('schedules_changed', handleSchedulesChanged);
      apiClient.socket.off('bookings_changed', handleBookingsChanged);
    };
  }, [date]);

  const DEFAULT_SKHIDNYTSIA_TIMES = [
    '05:50', '06:20', '07:10', '08:15', '08:50', '09:30', '10:35', '11:10', '12:00', 
    '12:40', '13:20', '14:10', '15:30', '16:20', '17:00', '17:40'
  ];

  const DEFAULT_LVIV_TIMES = [
    '08:10', '09:15', '10:15', '11:10', '11:50', '12:20', '13:10', '14:10', '14:50', 
    '15:30', '16:10', '17:10', '18:20', '19:20', '20:00', '20:40'
  ];

  const getDynamicDepartureTimes = () => {
    if (!date) return [];
    
    const timesSet = new Set<string>();

    if (schedules && schedules.length > 0) {
      schedules.forEach(s => {
        if (directionIndex === 0) {
          if (s.run2_time) timesSet.add(normalizeTime(s.run2_time));
          if (s.run4_time) timesSet.add(normalizeTime(s.run4_time));
          if (s.run6_time) timesSet.add(normalizeTime(s.run6_time));
          if (s.run8_time) timesSet.add(normalizeTime(s.run8_time));
          if (s.run10_time) timesSet.add(normalizeTime(s.run10_time));
        } else {
          if (s.run1_time) timesSet.add(normalizeTime(s.run1_time));
          if (s.run3_time) timesSet.add(normalizeTime(s.run3_time));
          if (s.run5_time) timesSet.add(normalizeTime(s.run5_time));
          if (s.run7_time) timesSet.add(normalizeTime(s.run7_time));
          if (s.run9_time) timesSet.add(normalizeTime(s.run9_time));
        }
      });
    }

    if (bookings && bookings.length > 0) {
      bookings.forEach(b => {
        const bTime = normalizeTime(b.departure_time);
        const bFrom = (b.bus_from || b.from || '').toLowerCase();
        if (directionIndex === 0 && bFrom.includes('львів')) {
          timesSet.add(bTime);
        } else if (directionIndex === 1 && !bFrom.includes('львів')) {
          timesSet.add(bTime);
        }
      });
    }

    // У неділю (getDay() === 0) додаємо додаткові рейси: 18:15 зі Східниці та 21:00 зі Львова
    const isSundayDate = date.getDay() === 0;

    if (timesSet.size === 0) {
      const defaults = directionIndex === 0 
        ? (isSundayDate ? [...DEFAULT_LVIV_TIMES, '21:00'] : DEFAULT_LVIV_TIMES)
        : (isSundayDate ? [...DEFAULT_SKHIDNYTSIA_TIMES, '18:15'] : DEFAULT_SKHIDNYTSIA_TIMES);
      defaults.forEach(t => timesSet.add(t));
    } else if (isSundayDate) {
      if (directionIndex === 0) timesSet.add('21:00');
      else timesSet.add('18:15');
    }

    return Array.from(timesSet)
      .filter(t => t && t.trim() !== '')
      .sort((a, b) => {
        const [hA, mA] = a.split(':').map(Number);
        const [hB, mB] = b.split(':').map(Number);
        return (hA * 60 + mA) - (hB * 60 + mB);
      });
  };

  const departureTimes = getDynamicDepartureTimes();

  const findCrewByTime = (time: string) => {
    const cleanTime = normalizeTime(time);
    const found = schedules.find(s => {
      const runs = directionIndex === 0
        ? [s.run2_time, s.run4_time, s.run6_time, s.run8_time, s.run10_time]
        : [s.run1_time, s.run3_time, s.run5_time, s.run7_time, s.run9_time];
      return runs.map(r => normalizeTime(r)).includes(cleanTime);
    });
    return normalizeCrewName(found ? found.crew_name : getCrewByTime(cleanTime, directionIndex === 0));
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
      setDropoffLocation('');
    } else {
      const fromIdx = currentRoute.findIndex(s => s.id === from);
      const toIdx = currentRoute.findIndex(s => s.id === stopId);
      
      if (toIdx > fromIdx) {
        const isShort = from !== 'lviv' && stopId !== 'lviv';
        if (isShort) {
          setFrom('');
          setTo('');
          setSelectedTime('');
          setPickupLocation('');
          setDropoffLocation('');
          setShowCallModal(true);
        } else {
          setTo(stopId);
        }
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
    if (departureTimes.length === 0) {
      errs.time = "Немає доступних рейсів на цю дату";
    } else if (!selectedTime) {
      errs.time = "Оберіть час";
    }
    if (selectedTime && !pickupLocation) errs.pickupLocation = "Оберіть зупинку для посадки";
    if (selectedTime && (to === 'skhidnytsia' || to === 'truskavets') && !dropoffLocation) {
      errs.dropoffLocation = "Оберіть зупинку для висадки";
    }
    if (!name.trim()) errs.name = "Введіть ваше ім'я";
    if (phone.replace(/\D/g, '').length < 12) errs.phone = "Введіть коректний номер телефону";
    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const isShortTrip = (from !== 'lviv' && to !== 'lviv');
    if (isShortTrip && from !== '') {
        setFrom('');
        setTo('');
        setShowCallModal(true);
        return;
    }

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    
    const bookingData: BookingData = {
      from,
      to,
      pickupLocation,
      dropoffLocation,
      date: date || new Date(),
      name,
      phone,
      price,
      seats,
      departureTime: selectedTime,
      directionIndex: directionIndex || 0,
      crew: findCrewByTime(selectedTime)
    };

    onPay(bookingData);
  };

  const nearestTime = departureTimes.find(time => !isTimePassed(time)) || null;

  const AvailabilityCard = ({ time }: { time: string }) => {
    const passed = isTimePassed(time);
    if (passed) return null;
    const isSelected = selectedTime === time;
    const isNearest = time === nearestTime;

    const cleanTime = normalizeTime(time);
    const schedule = schedules.find(s => {
      const runs = directionIndex === 0
        ? [s.run2_time, s.run4_time, s.run6_time, s.run8_time, s.run10_time]
        : [s.run1_time, s.run3_time, s.run5_time, s.run7_time, s.run9_time];
      return runs.map(r => normalizeTime(r)).includes(cleanTime);
    });
    const carDetails = getCarDetails(schedule?.car);
    const crewName = findCrewByTime(time);
    const totalSeats = carDetails ? carDetails.seats : 12;
    const runBookings = bookings.filter(b => normalizeTime(b.departure_time) === cleanTime && normalizeCrewName(b.crew) === normalizeCrewName(crewName));

    const isLviv = directionIndex === 0;
    const routeStops = isLviv 
      ? ['lviv', 'stebnik', 'truskavets', 'boryslav', 'skhidnytsia']
      : ['skhidnytsia', 'boryslav', 'truskavets', 'stebnik', 'lviv'];
      
    const getStopId = (val: string) => {
      if (!val) return '';
      const valLower = val.toLowerCase();
      if (valLower.includes('львів') || valLower === 'lviv') return 'lviv';
      if (valLower.includes('стебник') || valLower === 'stebnik') return 'stebnik';
      if (valLower.includes('трускавець') || valLower === 'truskavets') return 'truskavets';
      if (valLower.includes('борислав') || valLower === 'boryslav') return 'boryslav';
      if (valLower.includes('східниця') || valLower === 'skhidnytsia') return 'skhidnytsia';
      return val;
    };

    const segments = [0, 0, 0, 0];
    runBookings.forEach(b => {
      const bFromId = getStopId(b.bus_from || b.from);
      const bToId = getStopId(b.bus_to || b.to);
      const fromIdx = routeStops.indexOf(bFromId);
      const toIdx = routeStops.indexOf(bToId);
      if (fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx) {
        for (let i = fromIdx; i < toIdx; i++) {
          segments[i] += b.seats || 0;
        }
      }
    });

    const newFromId = getStopId(from);
    const newToId = getStopId(to);
    const newFromIdx = routeStops.indexOf(newFromId);
    const newToIdx = routeStops.indexOf(newToId);

    let maxOccupancy = 0;
    if (newFromIdx !== -1 && newToIdx !== -1 && newFromIdx < newToIdx) {
      for (let i = newFromIdx; i < newToIdx; i++) {
        if (segments[i] > maxOccupancy) {
          maxOccupancy = segments[i];
        }
      }
    } else {
      maxOccupancy = Math.max(...segments);
    }

    const seatsLeft = Math.max(0, totalSeats - maxOccupancy);
    const isFull = seatsLeft <= 0;

    return (
      <button
        type="button"
        disabled={isFull}
        onClick={() => { 
          if (!isFull) {
            setSelectedTime(time); 
            setErrors(e => ({ ...e, time: '' })); 
            setIsCollapsed(true);
          }
        }}
        className={`relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) text-left w-full
          ${isFull
            ? 'bg-brand-surface/40 border-brand-border/30 opacity-60 cursor-not-allowed'
            : isSelected 
              ? 'bg-brand-yellow text-brand-dark border-brand-yellow shadow-[0_10px_30px_rgba(245,158,11,0.25)] scale-[1.015]' 
              : 'bg-brand-surface border-brand-border hover:border-brand-yellow/50 hover:bg-brand-yellow/[0.03] hover:scale-[1.015] active:scale-[0.985] hover:shadow-[0_10px_30px_rgba(0,0,0,0.3),_0_0_20px_rgba(245,158,11,0.08)] group'
          }
        `}
      >
        <div className="flex items-center gap-6">
            <div className={`p-3 rounded-xl flex items-center justify-center ${
              isFull 
                ? 'bg-brand-border/20 text-brand-muted' 
                : isSelected ? 'bg-brand-dark/10' : 'bg-brand-yellow/10 text-brand-yellow'
            }`}>
              <MapPin size={24} />
            </div>
            <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                    <span className="text-2xl font-display font-black">~{time}</span>
                    {isNearest && (
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                        isSelected 
                          ? 'bg-brand-dark/15 text-brand-dark opacity-90' 
                          : 'bg-brand-yellow/15 text-brand-yellow border border-brand-yellow/20'
                      }`}>
                        НАЙБЛИЖЧИЙ
                      </span>
                    )}
                </div>
                <div className={`text-xs font-medium flex items-center flex-wrap gap-1.5 ${isSelected ? 'text-brand-dark/80' : 'text-brand-muted'}`}>
                   Орієнтовний час готовності 
                   {carDetails && (
                     <>
                       <span className="opacity-40">•</span> 
                       <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] border flex items-center gap-1.5 ${
                         isSelected 
                           ? 'bg-brand-dark/10 text-brand-dark border-brand-dark/20' 
                           : 'bg-brand-surface/80 text-white border-brand-border/50'
                       }`}>
                         <MinibusIcon color={carDetails.colorHex} isSelected={isSelected} />
                         {carDetails.plate}
                       </span>
                       <span className="opacity-80">({carDetails.model}, {carDetails.colorName})</span>
                     </>
                   )}
                   <span className="opacity-40">•</span> 
                   <User size={12} className="inline mr-0.5" />
                   {isFull ? 'Немає місць' : `${seatsLeft} місць`}
                </div>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <div className={`text-[10px] uppercase font-black tracking-tighter ${
                  isFull 
                    ? 'text-red-500' 
                    : isSelected ? 'text-brand-dark/60' : 'text-green-500'
                }`}>
                  {isFull ? 'Статус: Зайнятий' : 'Статус: Вільний'}
                </div>
                <div className={`text-xs font-bold ${isSelected ? 'text-brand-dark' : 'text-white'}`}>
                  {isFull ? 'Місця закінчились' : 'Готовий до виїзду'}
                </div>
            </div>
            <div className={`w-3 h-3 rounded-full ${isFull ? 'bg-red-500' : 'pulse ' + (isSelected ? 'bg-brand-dark' : 'bg-green-500')}`} />
        </div>
        {isSelected && !isFull && (
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
                    className={`p-6 rounded-2xl border-2 transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) text-left group
                      ${directionIndex === dir.id 
                        ? 'border-brand-yellow bg-brand-yellow/[0.04] shadow-[0_10px_30px_rgba(245,158,11,0.12)] scale-[1.01]' 
                        : 'border-brand-border hover:border-brand-yellow/50 hover:bg-brand-yellow/[0.02] hover:scale-[1.01] active:scale-[0.99]'
                      }
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
                  ) : isLoadingSchedules ? (
                    <div className="card-inner p-10 border border-dashed border-brand-border rounded-2xl text-center text-brand-muted flex flex-col items-center justify-center gap-3">
                      <Loader2 size={32} className="text-brand-yellow animate-spin" />
                      <span>Завантаження рейсів...</span>
                    </div>
                  ) : departureTimes.length === 0 ? (
                    <div className="card-inner p-8 border border-red-500/30 bg-red-500/10 rounded-2xl text-center text-red-200">
                      На вибрану дату немає доступних рейсів. Спробуйте іншу дату або зверніться до диспетчера за телефоном.
                    </div>
                  ) : (
                    <div className="space-y-0">
                      <AnimatePresence initial={false}>
                        {departureTimes.map(time => {
                          const isSelected = selectedTime === time;
                          const shouldShow = !selectedTime || !isCollapsed || isSelected;

                          return (
                            <motion.div
                              key={time}
                              initial={false}
                              animate={shouldShow ? "visible" : "hidden"}
                              variants={{
                                visible: { 
                                  height: 'auto', 
                                  opacity: 1, 
                                  scale: 1,
                                  marginBottom: 16,
                                  display: 'block',
                                  transition: {
                                    height: { type: 'spring', stiffness: 220, damping: 24 },
                                    opacity: { duration: 0.2, ease: 'easeOut' },
                                    scale: { duration: 0.2, ease: 'easeOut' }
                                  }
                                },
                                hidden: { 
                                  height: 0, 
                                  opacity: 0, 
                                  scale: 0.96,
                                  marginBottom: 0,
                                  transitionEnd: { display: 'none' },
                                  transition: {
                                    height: { type: 'spring', stiffness: 220, damping: 24 },
                                    opacity: { duration: 0.15, ease: 'easeIn' },
                                    scale: { duration: 0.15, ease: 'easeIn' }
                                  }
                                }
                              }}
                              style={{ overflow: 'hidden' }}
                            >
                              <AvailabilityCard time={time} />
                            </motion.div>
                          );
                        })}
                      </AnimatePresence>
                      {selectedTime && (
                        <div className="flex justify-end pt-2">
                          <button
                            type="button"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="text-brand-yellow hover:text-brand-gold text-sm font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {isCollapsed ? (
                              <>Показати всі рейси ({departureTimes.length}) <ChevronDown size={16} /></>
                            ) : (
                              <>Згорнути список <ChevronUp size={16} /></>
                            )}
                          </button>
                        </div>
                      )}
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
                      <button type="submit" disabled={isSubmitting} className="btn-primary w-full md:w-auto px-12 py-5 text-lg flex items-center justify-center gap-3 group disabled:opacity-50 shadow-brand hover:shadow-[0_10px_30px_rgba(245,158,11,0.35)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 ease-out">
                        {isSubmitting ? 'Зберігаємо...' : 'Забронювати'}
                        {!isSubmitting && <ChevronRight size={20} className="group-hover:translate-x-1.5 transition-transform duration-300" />}
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
