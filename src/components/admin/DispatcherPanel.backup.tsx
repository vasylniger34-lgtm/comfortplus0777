import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Plus, RefreshCw, X, Calendar as CalendarIcon, Clock, Edit2, Trash2, Check, PhoneCall, BarChart2, Users, Key, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { driverService } from '../../lib/driverService';
import type { DriverProfile, DriverAssignment } from '../../lib/driverService';
import { getCarDetails, getPrice, updateCarsCache, type CarDetail, CARS_LIST as defaultCarsList } from '../../data/routes';
import { normalizeTime, normalizeCrewName } from '../../utils/normalize';

const CREW_TABS = ['06:20', '07:10', '08:15', '09:30', '10:35', '11:10', 'водії', 'звіт'];

const CREW_RUNS: Record<string, { time: string; from: string; to: string }[]> = {
  '06:20': [
    { time: '06:20', from: 'Східниця', to: 'Львів' },
    { time: '09:00', from: 'Львів', to: 'Східниця' },
    { time: '12:00', from: 'Східниця', to: 'Львів' },
    { time: '14:50', from: 'Львів', to: 'Східниця' }
  ],
  '07:10': [
    { time: '07:10', from: 'Східниця', to: 'Львів' },
    { time: '10:15', from: 'Львів', to: 'Східниця' },
    { time: '13:20', from: 'Східниця', to: 'Львів' },
    { time: '16:10', from: 'Львів', to: 'Східниця' }
  ],
  '08:15': [
    { time: '08:15', from: 'Східниця', to: 'Львів' },
    { time: '11:10', from: 'Львів', to: 'Східниця' },
    { time: '15:30', from: 'Східниця', to: 'Львів' },
    { time: '18:20', from: 'Львів', to: 'Східниця' }
  ],
  '09:30': [
    { time: '09:30', from: 'Східниця', to: 'Львів' },
    { time: '12:20', from: 'Львів', to: 'Східниця' },
    { time: '16:20', from: 'Східниця', to: 'Львів' },
    { time: '19:20', from: 'Львів', to: 'Східниця' }
  ],
  '10:35': [
    { time: '10:35', from: 'Східниця', to: 'Львів' },
    { time: '13:10', from: 'Львів', to: 'Східниця' },
    { time: '17:00', from: 'Східниця', to: 'Львів' },
    { time: '20:00', from: 'Львів', to: 'Східниця' }
  ],
  '11:10': [
    { time: '11:10', from: 'Східниця', to: 'Львів' },
    { time: '14:10', from: 'Львів', to: 'Східниця' },
    { time: '17:40', from: 'Східниця', to: 'Львів' },
    { time: '20:40', from: 'Львів', to: 'Східниця' }
  ]
};



const TIMES_LVIV_TO_SKHIDNYTSIA = [
  '08:10', '09:00', '09:15', '10:15', '11:10', '11:50', '12:20', '13:10', '14:10', '14:50', '15:30', '16:10', '16:20', '17:10', '17:40', '18:20', '19:20', '20:00', '20:20', '20:40'
];

const TIMES_SKHIDNYTSIA_TO_LVIV = [
  '05:50', '06:20', '07:10', '08:15', '08:50', '09:30', '10:35', '11:10', '12:00', '12:40', '13:20', '14:10', '15:30', '16:20', '17:00', '17:40'
];

const getValidTimesForRoute = (from: string, to: string, currentTime?: string) => {
  const isLvivDeparture = isLvivToSkhidnytsia(from, to);
  let times = isLvivDeparture ? [...TIMES_LVIV_TO_SKHIDNYTSIA] : [...TIMES_SKHIDNYTSIA_TO_LVIV];
  if (currentTime) {
    const norm = normalizeTime(currentTime);
    if (norm && !times.includes(norm)) {
      times.push(norm);
      times.sort((a, b) => a.localeCompare(b));
    }
  }
  return times;
};

const LOCATIONS = ['Львів', 'Східниця', 'Трускавець', 'Борислав', 'Стебник'];

const getNormalizedCityName = (cityName: string): string => {
  if (!cityName) return '';
  const nameLower = cityName.toLowerCase();
  if (nameLower.includes('львів') || nameLower === 'lviv') return 'Львів';
  if (nameLower.includes('стебник') || nameLower === 'stebnik') return 'Стебник';
  if (nameLower.includes('трускавець') || nameLower === 'truskavets') return 'Трускавець';
  if (nameLower.includes('борислав') || nameLower === 'boryslav') return 'Борислав';
  if (nameLower.includes('східниця') || nameLower === 'skhidnytsia') return 'Східниця';
  return cityName;
};

const getCityKey = (cityName: string): string => {
  if (!cityName) return '';
  const nameLower = cityName.toLowerCase();
  if (nameLower.includes('львів') || nameLower === 'lviv') return 'lviv';
  if (nameLower.includes('стебник') || nameLower === 'stebnik') return 'stebnik';
  if (nameLower.includes('трускавець') || nameLower === 'truskavets') return 'truskavets';
  if (nameLower.includes('борислав') || nameLower === 'boryslav') return 'boryslav';
  if (nameLower.includes('східниця') || nameLower === 'skhidnytsia') return 'skhidnytsia';
  return '';
};

const isLvivToSkhidnytsia = (from: string, to: string) => {
  const f = from.toLowerCase();
  const t = to.toLowerCase();
  if (f.includes('львів') || f.includes('lviv')) return true;
  if (t.includes('львів') || t.includes('lviv') || t.includes('пустомити')) return false;

  const lvivRoute = ['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'];
  const fromIdx = lvivRoute.indexOf(getNormalizedCityName(from));
  const toIdx = lvivRoute.indexOf(getNormalizedCityName(to));
  return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
};

const CITY_KEYS: Record<string, string> = {
  'Східниця': 'skhidnytsia',
  'Борислав': 'boryslav',
  'Трускавець': 'truskavets',
  'Стебник': 'stebnik',
  'Львів': 'lviv'
};

const ROUTE_LVIV_TO_SKHIDNYTSIA = ['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'];
const ROUTE_SKHIDNYTSIA_TO_LVIV = ['Східниця', 'Борислав', 'Трускавець', 'Стебник', 'Львів'];

const allocateSeatSlots = (runBookings: any[], isLvivDeparture: boolean, totalSeats: number = 12) => {
  const route = isLvivDeparture ? ROUTE_LVIV_TO_SKHIDNYTSIA : ROUTE_SKHIDNYTSIA_TO_LVIV;

  const seats = Array.from({ length: totalSeats }, (_, i) => ({
    number: i + 1,
    bookings: [] as any[]
  }));

  const backupBookings: any[] = [];

  const sortedBookings = [...runBookings].sort((a, b) => (a.id || '').localeCompare(b.id || ''));

  sortedBookings.forEach(booking => {
    const normFrom = getNormalizedCityName(booking.bus_from || booking.from);
    const normTo = getNormalizedCityName(booking.bus_to || booking.to);
    let fromIdx = route.indexOf(normFrom);
    let toIdx = route.indexOf(normTo);
    
    if (fromIdx === -1) fromIdx = 0;
    if (toIdx === -1) toIdx = route.length - 1;

    const requestedSeats = booking.seats || 1;
    const allocatedSeatNumbers: number[] = [];

    // Try to find a block of consecutive seats
    let blockStartIdx = -1;
    // Pass 1: Try to find a block of consecutive seats that are COMPLETELY empty
    outer1: for (let startIdx = 0; startIdx <= totalSeats - requestedSeats; startIdx++) {
      for (let offset = 0; offset < requestedSeats; offset++) {
        const seatIdx = startIdx + offset;
        const seat = seats[seatIdx];
        if (seat.bookings.length > 0) {
          continue outer1; // this seat is not completely empty
        }
      }
      blockStartIdx = startIdx;
      break outer1;
    }

    // Pass 2: If no completely empty block found, try to find a block with no overlap
    if (blockStartIdx === -1) {
      outer2: for (let startIdx = 0; startIdx <= totalSeats - requestedSeats; startIdx++) {
        for (let offset = 0; offset < requestedSeats; offset++) {
          const seatIdx = startIdx + offset;
          const seat = seats[seatIdx];
          const hasOverlap = seat.bookings.some(existing => {
            const exNormFrom = getNormalizedCityName(existing.bus_from || existing.from);
            const exNormTo = getNormalizedCityName(existing.bus_to || existing.to);
            let exFromIdx = route.indexOf(exNormFrom);
            let exToIdx = route.indexOf(exNormTo);
            if (exFromIdx === -1) exFromIdx = 0;
            if (exToIdx === -1) exToIdx = route.length - 1;

            return Math.max(fromIdx, exFromIdx) < Math.min(toIdx, exToIdx);
          });
          if (hasOverlap) {
            continue outer2; // this block is not suitable
          }
        }
        blockStartIdx = startIdx;
        break outer2;
      }
    }

    if (blockStartIdx !== -1) {
      // Allocate the whole block of seats for this booking
      for (let offset = 0; offset < requestedSeats; offset++) {
        const seatIdx = blockStartIdx + offset;
        allocatedSeatNumbers.push(seatIdx);
        seats[seatIdx].bookings.push({ ...booking, _temp: true });
      }
    }

    if (allocatedSeatNumbers.length === requestedSeats) {
      allocatedSeatNumbers.forEach((seatIdx, sIdx) => {
        const list = seats[seatIdx].bookings;
        const tempIdx = list.findIndex(x => x.id === booking.id && x._temp);
        if (tempIdx !== -1) {
          list[tempIdx] = {
            ...booking,
            seatSubIndex: sIdx + 1,
            totalSeats: requestedSeats,
            assignedSeatNumber: seatIdx + 1
          };
        }
      });
    } else {
      seats.forEach(seat => {
        seat.bookings = seat.bookings.filter(x => x.id !== booking.id);
      });
      backupBookings.push(booking);
    }
  });

  return {
    seats,
    backupBookings
  };
};

const STATION_PICKUP_LOCATIONS: Record<string, string[]> = {
  'skhidnytsia': [
    'ЗАБРАТИ З ГОТЕЛЮ',
    'А-готель (3 джерело)',
    'Київська Русь (ОККО)',
    'поворот на Діану (біля чайничка)',
    'Дім Молитви (скарбничка, ринок)',
    'ТуСтань (автостанція)',
    'Содова (2с)'
  ],
  'boryslav': [
    'Тустановичі (5 школа)',
    'пов на Коваліва',
    'Циганська площа',
    '7 школа',
    'ПриватʼРайфайзен (У лева)',
    'площа І.Франка, центр, таксі, фонтан',
    'Міська рада (Спар, Дніпром)',
    'Взуттєва фабрика',
    'Пам’ятник Степану Бандері',
    'Мражниця',
    'Крутогір',
    'LuxWash мийка, після перевалу'
  ],
  'truskavets': [
    'ЗАБРАТИ З ГОТЕЛЮ',
    'Сосновий Бір',
    'Вишенька (Лісова пісня)',
    '1 школа (Перед Дрогобицьким кільцем)',
    'Автовокзал',
    'церква Іллі (на Мазепи)',
    'Стебницьке кільце (навпроти ДивоЦіну)',
    'санаторій Полонина (виїзд)'
  ],
  'stebnik': [
    'Високий замок',
    'Скрент',
    'Діброва'
  ],
  'lviv': [
    'Victoria Gardens (автосалон Toyota)',
    'Щирецька (Нова Лінія)',
    'АшанСіті (вул.В.Великого)',
    'Психічна лікарня',
    'Кардіологічний центр',
    'ЖК «Парус» (вул.Кульпарківська)',
    'ТЦ «Скриня»',
    'Приміський ринок',
    'Залізничний Вокзал (Платна парковка)'
  ]
};

// Мапінг часу до екіпажу з урахуванням напрямку
const getCrewByTime = (time: string, fromCity: string, toCity: string) => {
  const isLvivDeparture = isLvivToSkhidnytsia(fromCity, toCity);
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
    return mapping[normTime] || normTime || '06:20';
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
    return mapping[normTime] || normTime || '06:20';
  }
};

// Хелпери для дат
const getUADateString = (dateObj: Date) => {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}.${m}.${y}`;
};

const formatDateToUA = (isoDate: string) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
};

const formatDateToISO = (uaDate: string) => {
  if (!uaDate) return '';
  const [d, m, y] = uaDate.split('.');
  return `${y}-${m}-${d}`;
};

const getTodayISO = () => new Date().toISOString().split('T')[0];

interface DispatcherPanelProps {
  onLogout?: () => void;
  role?: 'dispatcher' | 'junior_dispatcher' | null;
  adminName?: string;
}

export default function DispatcherPanel({ onLogout, role, adminName }: DispatcherPanelProps) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateUA, setSelectedDateUA] = useState(getUADateString(new Date()));
  const [activeTab, setActiveTab] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  const [visibleDaysCount, setVisibleDaysCount] = useState(7);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [cars, setCars] = useState<CarDetail[]>([]);
  const carsList = cars.length > 0 ? cars.map(c => c.plate) : defaultCarsList;

  // Розклади рейсів
  const [schedules, setSchedules] = useState<any[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [scheduleForm, setScheduleForm] = useState({
    crew_name: 'Екіпаж 1',
    driver_id: '',
    car: '',
    run1_time: '06:20',
    run2_time: '09:00',
    run3_time: '12:00',
    run4_time: '14:50',
    run5_time: '',
    run6_time: '',
    run7_time: '',
    run8_time: '',
    run9_time: '',
    run10_time: ''
  });

  // Налаштування та Шаблони
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'templates' | 'cars' | 'dispatchers'>('templates');
  
  // Керування Диспетчерами у налаштуваннях
  const [dispatchersList, setDispatchersList] = useState<any[]>([]);
  const [newDispName, setNewDispName] = useState('');
  const [newDispPin, setNewDispPin] = useState('');
  const [dispError, setDispError] = useState('');

  // Керування Шаблонами у налаштуваннях
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    run1_time: '06:20',
    run2_time: '09:00',
    run3_time: '12:00',
    run4_time: '14:50',
    run5_time: '',
    run6_time: '',
    run7_time: '',
    run8_time: '',
    run9_time: '',
    run10_time: ''
  });
  const [templateError, setTemplateError] = useState('');

  // Керування Машинами у налаштуваннях (перенесено з DriversSubPanel)
  const [newCarPlate, setNewCarPlate] = useState('');
  const [newCarSeats, setNewCarSeats] = useState(12);
  const [newCarDescription, setNewCarDescription] = useState('');
  const [newCarModel, setNewCarModel] = useState('');
  const [newCarColorName, setNewCarColorName] = useState('');
  const [newCarColorHex, setNewCarColorHex] = useState('#FFFFFF');
  const [isAddingCar, setIsAddingCar] = useState(false);
  const [addCarError, setAddCarError] = useState('');

  const getDaysArray = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < visibleDaysCount; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const uaDate = getUADateString(d);
      
      let label = '';
      if (i === 0) label = 'Сьогодні';
      else if (i === 1) label = 'Завтра';
      else {
        // Отримуємо день тижня та число.місяць скорочено (наприклад: Ср, 27.05)
        const dayOfWeek = d.toLocaleDateString('uk-UA', { weekday: 'short' });
        const dayMonth = d.toLocaleDateString('uk-UA', { day: 'numeric', month: 'numeric' });
        label = `${dayOfWeek.toUpperCase()}, ${dayMonth}`;
      }
      
      days.push({
        dateUA: uaDate,
        label: label
      });
    }
    return days;
  };
  
  // Форма нової броні
  const [newBooking, setNewBooking] = useState({
    name: '',
    phone: '+380',
    from: '',
    to: '',
    pickup_location: '',
    date: getTodayISO(), // Зберігаємо в ISO для інпуту
    departure_time: '09:00',
    seats: 1,
    price: 350,
    crew: 'Екіпаж 1',
    status: 'active'
  });

  const handleNewBookingRouteUpdate = (updates: Partial<typeof newBooking>) => {
    const updated = { ...newBooking, ...updates };
    const normFrom = getNormalizedCityName(updated.from);
    const normTo = getNormalizedCityName(updated.to);
    const lvivRoute = ['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'];
    const hasKnownFrom = lvivRoute.includes(normFrom);
    const hasKnownTo = lvivRoute.includes(normTo);

    if (hasKnownFrom && hasKnownTo) {
      const validTimes = getValidTimesForRoute(updated.from, updated.to, updated.departure_time);
      if (!validTimes.includes(updated.departure_time)) {
        updated.departure_time = validTimes[0] || '06:20';
      }
      const fromKey = getCityKey(updated.from);
      const toKey = getCityKey(updated.to);
      if (fromKey && toKey) {
        const routePrice = getPrice(fromKey, toKey);
        if (routePrice > 0) {
          updated.price = routePrice;
        }
      }
    }
    
    setNewBooking(updated);
  };

  const handleEditingBookingRouteUpdate = (updates: Partial<typeof editingBooking>) => {
    const updated = { ...editingBooking, ...updates };
    const normFrom = getNormalizedCityName(updated.from);
    const normTo = getNormalizedCityName(updated.to);
    const lvivRoute = ['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'];
    const hasKnownFrom = lvivRoute.includes(normFrom);
    const hasKnownTo = lvivRoute.includes(normTo);

    if (hasKnownFrom && hasKnownTo) {
      const validTimes = getValidTimesForRoute(updated.from, updated.to, updated.departure_time);
      if (!validTimes.includes(updated.departure_time)) {
        updated.departure_time = validTimes[0] || '06:20';
      }
      const fromKey = getCityKey(updated.from);
      const toKey = getCityKey(updated.to);
      if (fromKey && toKey) {
        const routePrice = getPrice(fromKey, toKey);
        if (routePrice > 0) {
          updated.price = routePrice;
        }
      }
    }
    
    setEditingBooking(updated);
  };

  const openAddModalForRun = (time: string, fromCity: string, toCity: string) => {
    const validFrom = fromCity || 'Східниця';
    const validTo = toCity || 'Львів';
    const validTime = normalizeTime(time) || '06:20';
    const fromKey = getCityKey(validFrom);
    const toKey = getCityKey(validTo);
    const calculatedPrice = (fromKey && toKey ? getPrice(fromKey, toKey) : 0) || 350;

    setNewBooking({
      name: '',
      phone: '+380',
      from: validFrom,
      to: validTo,
      date: formatDateToISO(selectedDateUA) || getTodayISO(),
      departure_time: validTime,
      seats: 1,
      price: calculatedPrice,
      pickup_location: '',
      crew: activeTab,
      status: 'active'
    });
    setShowAddModal(true);
  };

  const [expandedRuns, setExpandedRuns] = useState<Record<string, boolean>>({});

  const toggleRunExpanded = (time: string) => {
    setExpandedRuns(prev => ({
      ...prev,
      [time]: !prev[time]
    }));
  };

  const fetchAssignmentsAndDrivers = async () => {
    try {
      const [driversData, assignmentsData, carsData] = await Promise.all([
        driverService.getDrivers(),
        driverService.getAssignments(selectedDateUA),
        apiClient.getCars()
      ]);
      setDrivers(driversData || []);
      setAssignments(assignmentsData || []);
      setCars(carsData || []);
      updateCarsCache(carsData || []);
    } catch (e) {
      console.error('Помилка завантаження водіїв/призначень/машин:', e);
    }
  };

  const fetchSchedules = async () => {
    try {
      const data = await apiClient.getSchedules(selectedDateUA);
      setSchedules(data || []);
    } catch (e) {
      console.error('Помилка завантаження розкладу:', e);
    }
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const data = await apiClient.getBookings({ date: selectedDateUA });
      setBookings(data || []);
    } catch (error) {
      console.error('Помилка завантаження:', error);
    }
    setIsLoading(false);
  };

  const fetchTemplates = async () => {
    try {
      const data = await apiClient.getTemplates();
      setTemplates(data || []);
    } catch (e) {
      console.error('Помилка завантаження шаблонів:', e);
    }
  };

  const fetchDispatchers = async () => {
    try {
      const data = await apiClient.getDispatchers();
      setDispatchersList(data || []);
    } catch (e) {
      console.error('Помилка завантаження диспетчерів:', e);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchAssignmentsAndDrivers();
    fetchSchedules();
    fetchTemplates();
    fetchDispatchers();

    // Підписка на сокети
    apiClient.socket.on('bookings_changed', fetchBookings);
    apiClient.socket.on('assignments_changed', fetchAssignmentsAndDrivers);
    apiClient.socket.on('schedules_changed', fetchSchedules);
    apiClient.socket.on('templates_changed', fetchTemplates);
    apiClient.socket.on('dispatchers_changed', fetchDispatchers);

    return () => {
      apiClient.socket.off('bookings_changed', fetchBookings);
      apiClient.socket.off('assignments_changed', fetchAssignmentsAndDrivers);
      apiClient.socket.off('schedules_changed', fetchSchedules);
      apiClient.socket.off('templates_changed', fetchTemplates);
      apiClient.socket.off('dispatchers_changed', fetchDispatchers);
    };
  }, [selectedDateUA]);

  useEffect(() => {
    const crewNames = schedules.map(s => normalizeCrewName(s.crew_name));
    const normalizedActiveTab = normalizeCrewName(activeTab);
    if (!activeTab || (!crewNames.includes(normalizedActiveTab) && activeTab !== 'водії' && activeTab !== 'звіт')) {
      if (crewNames.length > 0) {
        setActiveTab(crewNames[0]);
      } else {
        setActiveTab('водії');
      }
    }
  }, [schedules]);

  const openCreateScheduleModal = () => {
    setEditingSchedule(null);
    const defaultTemplate = templates[0];
    setScheduleForm({
      crew_name: defaultTemplate ? defaultTemplate.name : 'Екіпаж 1',
      driver_id: '',
      car: '',
      run1_time: defaultTemplate ? defaultTemplate.run1_time : '06:20',
      run2_time: defaultTemplate ? defaultTemplate.run2_time : '09:00',
      run3_time: defaultTemplate ? defaultTemplate.run3_time : '12:00',
      run4_time: defaultTemplate ? defaultTemplate.run4_time : '14:50',
      run5_time: defaultTemplate ? (defaultTemplate.run5_time || '') : '',
      run6_time: defaultTemplate ? (defaultTemplate.run6_time || '') : '',
      run7_time: defaultTemplate ? (defaultTemplate.run7_time || '') : '',
      run8_time: defaultTemplate ? (defaultTemplate.run8_time || '') : '',
      run9_time: defaultTemplate ? (defaultTemplate.run9_time || '') : '',
      run10_time: defaultTemplate ? (defaultTemplate.run10_time || '') : ''
    });
    setShowScheduleModal(true);
  };

  const openEditScheduleModal = (schedule: any) => {
    setEditingSchedule(schedule);
    setScheduleForm({
      crew_name: schedule.crew_name,
      driver_id: schedule.driver_id || '',
      car: schedule.car || '',
      run1_time: schedule.run1_time,
      run2_time: schedule.run2_time,
      run3_time: schedule.run3_time,
      run4_time: schedule.run4_time,
      run5_time: schedule.run5_time || '',
      run6_time: schedule.run6_time || '',
      run7_time: schedule.run7_time || '',
      run8_time: schedule.run8_time || '',
      run9_time: schedule.run9_time || '',
      run10_time: schedule.run10_time || ''
    });
    setShowScheduleModal(true);
  };

  const handleCrewPresetChange = (name: string) => {
    const foundPreset = templates.find(t => t.name === name);
    if (foundPreset) {
      setScheduleForm(prev => ({
        ...prev,
        crew_name: name,
        run1_time: foundPreset.run1_time,
        run2_time: foundPreset.run2_time,
        run3_time: foundPreset.run3_time,
        run4_time: foundPreset.run4_time,
        run5_time: foundPreset.run5_time || '',
        run6_time: foundPreset.run6_time || '',
        run7_time: foundPreset.run7_time || '',
        run8_time: foundPreset.run8_time || '',
        run9_time: foundPreset.run9_time || '',
        run10_time: foundPreset.run10_time || ''
      }));
    } else {
      setScheduleForm(prev => ({
        ...prev,
        crew_name: name
      }));
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        date: selectedDateUA,
        ...scheduleForm
      };
      
      if (editingSchedule) {
        await apiClient.updateSchedule(editingSchedule.id, payload);
      } else {
        await apiClient.createSchedule(payload);
      }
      
      setShowScheduleModal(false);
      fetchSchedules();
    } catch (err: any) {
      alert('Помилка збереження рейсу: ' + err.message);
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (window.confirm('Ви впевнені, що хочете видалити цей рейс дня?')) {
      try {
        await apiClient.deleteSchedule(id);
        fetchSchedules();
      } catch (err: any) {
        alert('Помилка видалення рейсу: ' + err.message);
      }
    }
  };

  // Додавання диспетчера у налаштуваннях
  const handleAddDispatcher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'junior_dispatcher') return;
    setDispError('');
    if (!newDispName.trim() || newDispPin.length !== 4) {
      setDispError('PIN-код має складатися з 4 цифр');
      return;
    }
    try {
      await apiClient.createDispatcher(newDispName.trim(), newDispPin, 'junior_dispatcher');
      setNewDispName('');
      setNewDispPin('');
      fetchDispatchers();
    } catch (err: any) {
      setDispError(err.message || 'Помилка створення диспетчера');
    }
  };

  // Видалення диспетчера
  const handleDeleteDispatcher = async (id: string) => {
    if (role === 'junior_dispatcher') return;
    if (!window.confirm('Ви впевнені, що хочете видалити цього диспетчера?')) return;
    try {
      await apiClient.deleteDispatcher(id);
      fetchDispatchers();
    } catch (err: any) {
      alert(err.message || 'Помилка видалення диспетчера');
    }
  };

  // Збереження / редагування шаблонів
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'junior_dispatcher') return;
    setTemplateError('');
    if (!templateForm.name.trim()) {
      setTemplateError('Вкажіть назву шаблону');
      return;
    }
    try {
      if (editingTemplate) {
        await apiClient.updateTemplate(editingTemplate.id, templateForm);
        setEditingTemplate(null);
      } else {
        await apiClient.createTemplate(templateForm);
      }
      setTemplateForm({
        name: '',
        run1_time: '06:20',
        run2_time: '09:00',
        run3_time: '12:00',
        run4_time: '14:50',
        run5_time: '',
        run6_time: '',
        run7_time: '',
        run8_time: '',
        run9_time: '',
        run10_time: ''
      });
      fetchTemplates();
    } catch (err: any) {
      setTemplateError(err.message || 'Помилка збереження шаблону');
    }
  };

  // Видалення шаблону
  const handleDeleteTemplate = async (id: string) => {
    if (role === 'junior_dispatcher') return;
    if (!window.confirm('Ви впевнені, що хочете видалити цей шаблон?')) return;
    try {
      await apiClient.deleteTemplate(id);
      fetchTemplates();
    } catch (err: any) {
      alert(err.message || 'Помилка видалення шаблону');
    }
  };

  // Керування автомобілями
  const handleAddCar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'junior_dispatcher') return;
    setAddCarError('');
    if (!newCarPlate.trim() || !newCarSeats) {
      setAddCarError('Номер машини та кількість місць є обов\'язковими.');
      return;
    }

    const formattedPlate = newCarPlate.trim().toUpperCase();

    setIsAddingCar(true);
    try {
      await apiClient.addCar({
        plate: formattedPlate,
        seats: newCarSeats,
        description: newCarDescription.trim(),
        model: newCarModel.trim(),
        colorName: newCarColorName.trim(),
        colorHex: newCarColorHex
      });
      setNewCarPlate('');
      setNewCarSeats(12);
      setNewCarDescription('');
      setNewCarModel('');
      setNewCarColorName('');
      setNewCarColorHex('#FFFFFF');
      await fetchAssignmentsAndDrivers();
    } catch (err: any) {
      console.error(err);
      setAddCarError(err.message || 'Помилка при додаванні автомобіля.');
    } finally {
      setIsAddingCar(false);
    }
  };

  const handleDeleteCar = async (plate: string) => {
    if (role === 'junior_dispatcher') return;
    if (!window.confirm(`Ви впевнені, що хочете видалити автомобіль ${plate}?`)) return;
    try {
      await apiClient.deleteCar(plate);
      await fetchAssignmentsAndDrivers();
    } catch (err) {
      console.error(err);
      alert('Помилка при видаленні автомобіля.');
    }
  };

  const findCrewByTimeAndRoute = (time: string, fromCity: string, toCity: string) => {
    const cleanTime = normalizeTime(time);
    const isLviv = isLvivToSkhidnytsia(fromCity, toCity);
    
    // Шукаємо в активних розкладах на selectedDateUA
    const found = schedules.find(s => {
      const runs = isLviv 
        ? [s.run2_time, s.run4_time, s.run6_time, s.run8_time, s.run10_time]
        : [s.run1_time, s.run3_time, s.run5_time, s.run7_time, s.run9_time];
      return runs.map(r => normalizeTime(r)).includes(cleanTime);
    });

    if (found) {
      return normalizeCrewName(found.crew_name);
    }

    // Якщо розкладу немає, використовуємо дефолтне мапування
    const mapped = getCrewByTime(cleanTime, fromCity, toCity);
    return normalizeCrewName(mapped || 'Екіпаж 1');
  };

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const crew = findCrewByTimeAndRoute(newBooking.departure_time, newBooking.from, newBooking.to);
    const payload = { 
      ...newBooking, 
      crew,
      date: formatDateToUA(newBooking.date),
      updated_by: adminName || 'Диспетчер'
    };

    try {
      await apiClient.createBooking(payload);
      setShowAddModal(false);
      setNewBooking({
        name: '',
        phone: '+380',
        from: '',
        to: '',
        pickup_location: '',
        date: getTodayISO(),
        departure_time: activeTab === 'звіт' || activeTab === 'водії' ? '06:20' : activeTab,
        seats: 1,
        price: 350,
        crew: activeTab === 'звіт' || activeTab === 'водії' ? 'Екіпаж 1' : activeTab,
        status: 'active'
      });
      fetchBookings();
    } catch (err: any) {
      alert('Помилка додавання: ' + err.message);
    }
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const crew = findCrewByTimeAndRoute(editingBooking.departure_time, editingBooking.from, editingBooking.to);
    const payload = { 
      ...editingBooking, 
      crew,
      date: editingBooking.date.includes('-') ? formatDateToUA(editingBooking.date) : editingBooking.date,
      updated_by: adminName || 'Диспетчер'
    };

    try {
      await apiClient.updateBooking(editingBooking.id, payload);
      setEditingBooking(null);
      fetchBookings();
    } catch (err: any) {
      alert('Помилка оновлення: ' + err.message);
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Ви впевнені, що хочете видалити це бронювання?')) {
      try {
        await apiClient.deleteBooking(id);
        fetchBookings();
      } catch (err: any) {
        alert('Помилка видалення: ' + err.message);
      }
    }
  };

  const setDay = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setSelectedDateUA(getUADateString(d));
  };

  const handlePhoneChange = (val: string, setter: (v: any) => void, obj: any) => {
    const prefix = '+380';
    if (!val.startsWith(prefix)) {
      setter({ ...obj, phone: prefix });
      return;
    }
    // Очищаємо всі символи після +380 від літер/знаків, залишаємо лише цифри
    const suffix = val.substring(prefix.length).replace(/\D/g, '');
    // Обмежуємо довжину 9 цифрами (разом з префіксом — 13 символів)
    const limitedSuffix = suffix.substring(0, 9);
    setter({ ...obj, phone: prefix + limitedSuffix });
  };

  // Групуємо броні за часом для поточного екіпажу
  const groupedBookings: Record<string, any[]> = {};
  bookings.forEach(b => {
    if (normalizeCrewName(b.crew) === normalizeCrewName(activeTab)) {
      const key = normalizeTime(b.departure_time);
      if (!groupedBookings[key]) groupedBookings[key] = [];
      groupedBookings[key].push(b);
    }
  });

  // Розрахунок звіту
  const totalPassengers = bookings.reduce((sum, b) => sum + (b.seats || 0), 0);
  const totalSum = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const crewBreakdown: Record<string, { passengers: number, sum: number }> = {};
  
  bookings.forEach(b => {
    const crew = normalizeCrewName(b.crew || 'Не визначено');
    if (!crewBreakdown[crew]) crewBreakdown[crew] = { passengers: 0, sum: 0 };
    crewBreakdown[crew].passengers += (b.seats || 0);
    crewBreakdown[crew].sum += (b.price || 0);
  });

  const crewTabs = [
    ...schedules.map(s => normalizeCrewName(s.crew_name)),
    'водії',
    'звіт'
  ];

  return (
    <div className="min-h-screen bg-brand-dark p-4 md:p-8 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-white">Панель Диспетчера</h1>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => {
                setNewBooking({...newBooking, date: getTodayISO(), crew: activeTab === 'звіт' || activeTab === 'водії' ? '06:20' : activeTab, departure_time: activeTab === 'звіт' || activeTab === 'водії' ? '06:20' : activeTab});
                setShowAddModal(true);
              }}
              className="btn-primary flex items-center justify-center gap-2 px-5 py-2.5 shadow-brand text-dark font-bold flex-1 md:flex-none"
            >
              <Plus size={18} />
              Додати бронь
            </button>

            <button 
              onClick={() => {
                setSettingsTab('templates');
                setShowSettingsModal(true);
              }}
              className="bg-brand-surface border border-brand-border hover:bg-brand-surface/80 hover:border-brand-yellow/50 text-white flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-1 md:flex-none"
            >
              <Settings size={18} className="text-brand-yellow" />
              Налаштування
            </button>
            
            {onLogout && (
              <button 
                onClick={onLogout}
                className="bg-brand-surface border border-brand-border hover:bg-brand-surface/80 text-white flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors flex-1 md:flex-none"
              >
                Вийти
              </button>
            )}
          </div>
        </div>

        {/* Дата */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-brand-surface border border-brand-border p-4 rounded-2xl flex-shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar">
            <div className="flex gap-2">
              {getDaysArray().map((day) => {
                const isActive = selectedDateUA === day.dateUA;
                return (
                  <button
                    key={day.dateUA}
                    onClick={() => setSelectedDateUA(day.dateUA)}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex-shrink-0 border
                      ${isActive 
                        ? 'bg-brand-yellow text-brand-dark border-brand-yellow shadow-brand font-black scale-105' 
                        : 'bg-brand-surface text-brand-muted border-brand-border hover:text-white hover:border-brand-yellow/30'
                      }
                    `}
                  >
                    {day.label}
                  </button>
                );
              })}
              
              {/* Кнопка +7 днів */}
              <button
                type="button"
                onClick={() => setVisibleDaysCount(prev => prev + 7)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-brand-dark border border-dashed border-brand-border text-brand-yellow hover:border-brand-yellow hover:bg-brand-yellow/5 transition-all flex-shrink-0 flex items-center gap-1"
                title="Додати ще 7 днів"
              >
                <Plus size={14} /> + 7 днів
              </button>
            </div>
          </div>

          <div className="h-6 w-px bg-brand-border flex-shrink-0 mx-2 hidden sm:block" />

          {/* Ручний ввід дати */}
          <div className="relative flex-shrink-0 w-full sm:w-auto">
            <input 
              type="text" 
              value={selectedDateUA}
              onChange={(e) => setSelectedDateUA(e.target.value)}
              className="bg-brand-surface border border-brand-border rounded-xl px-4 py-2 text-xs font-bold text-white focus:outline-none focus:border-brand-yellow w-full sm:w-28 text-center"
              placeholder="ДД.ММ.РРРР"
            />
          </div>
        </div>

        {/* Основний контент (Таблиці або Звіт) */}
        <div className="flex-1 bg-brand-surface border border-brand-border rounded-2xl overflow-hidden flex flex-col">
          
          {/* Таби зверху (перенесено з низу) */}
          <div className="bg-brand-dark border-b border-brand-border flex overflow-x-auto no-scrollbar flex-shrink-0 items-center justify-between pr-4">
            <div className="flex overflow-x-auto no-scrollbar">
              {crewTabs.map(tab => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-bold transition-all border-r border-brand-border flex-shrink-0
                    ${activeTab === tab 
                      ? 'bg-brand-surface text-brand-yellow border-b-2 border-b-brand-yellow' 
                      : 'text-brand-muted hover:text-white hover:bg-brand-surface/50'
                    }
                    ${tab === 'звіт' || tab === 'водії' ? 'bg-brand-yellow/5' : ''}
                  `}
                >
                  {tab === 'звіт' ? '📊 Звіт' : tab === 'водії' ? '👥 Водії' : tab}
                </button>
              ))}
            </div>
            {role !== 'junior_dispatcher' && (
              <button
                type="button"
                onClick={openCreateScheduleModal}
                className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1.5 rounded-lg text-brand-dark"
              >
                <Plus size={14} />
                <span>Створити рейс</span>
              </button>
            )}
          </div>

          {/* Інформація про водія та авто під датами (вкладка екіпажу) */}
          {activeTab !== 'водії' && activeTab !== 'звіт' && (() => {
            const currentSchedule = schedules.find(s => normalizeCrewName(s.crew_name) === normalizeCrewName(activeTab));
            const assignedDriver = drivers.find(d => d.id === currentSchedule?.driver_id);
            const driverName = assignedDriver ? assignedDriver.name : 'Не призначено';
            const carNumber = currentSchedule?.car || 'Не призначено';

            return (
              <div className="bg-brand-dark/40 px-6 py-3.5 border-b border-brand-border flex flex-wrap gap-4 items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="text-xs uppercase font-bold text-brand-muted tracking-wide">Поточний екіпаж:</div>
                  <div className="text-sm font-black text-brand-yellow bg-brand-yellow/10 px-3 py-1 rounded border border-brand-yellow/20 flex items-center gap-2">
                    <span>ЕКІПАЖ: {activeTab}</span>
                    {role !== 'junior_dispatcher' && currentSchedule && (
                      <button 
                        type="button"
                        onClick={() => openEditScheduleModal(currentSchedule)}
                        className="text-[10px] text-brand-muted hover:text-brand-yellow transition-colors underline font-bold"
                      >
                        (редагувати)
                      </button>
                    )}
                    {role !== 'junior_dispatcher' && currentSchedule && (
                      <button 
                        type="button"
                        onClick={() => handleDeleteSchedule(currentSchedule.id)}
                        className="text-[10px] text-red-400 hover:text-red-300 transition-colors underline font-bold ml-1"
                      >
                        (видалити)
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider flex-wrap">
                  <div className="flex items-center gap-1.5 bg-brand-surface px-3 py-1.5 rounded-lg border border-brand-border">
                    <span className="text-brand-muted">Водій:</span>
                    <span className="text-white">{driverName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-brand-surface px-3 py-1.5 rounded-lg border border-brand-border">
                    <span className="text-brand-muted">Авто:</span>
                    <span className="text-white font-mono">{carNumber}</span>
                  </div>
                </div>
              </div>
            );
          })()}
          
          {/* Контент */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 sm:space-y-8">
            {activeTab === 'водії' ? (
              <DriversSubPanel 
                selectedDateUA={selectedDateUA} 
                role={role} 
                schedules={schedules} 
                fetchSchedules={fetchSchedules}
                cars={cars}
                fetchCars={fetchAssignmentsAndDrivers}
              />
            ) : activeTab === 'звіт' ? (
              // Вигляд Звіту
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-brand-dark p-4 rounded-xl border border-brand-border">
                    <div className="text-brand-muted text-xs uppercase font-bold">Всього пасажирів</div>
                    <div className="text-3xl font-display font-black text-brand-yellow">{totalPassengers}</div>
                  </div>
                  <div className="bg-brand-dark p-4 rounded-xl border border-brand-border">
                    <div className="text-brand-muted text-xs uppercase font-bold">Загальна сума</div>
                    <div className="text-3xl font-display font-black text-green-500">{totalSum} грн</div>
                  </div>
                  <div className="bg-brand-dark p-4 rounded-xl border border-brand-border">
                    <div className="text-brand-muted text-xs uppercase font-bold">Всього броней</div>
                    <div className="text-3xl font-display font-black text-white">{bookings.length}</div>
                  </div>
                </div>

                <div className="bg-brand-dark rounded-xl border border-brand-border overflow-hidden">
                  <div className="p-4 border-b border-brand-border font-bold text-white">Розподіл по екіпажах</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="text-brand-muted text-xs uppercase bg-brand-surface">
                        <tr>
                          <th className="px-4 py-2">Екіпаж</th>
                          <th className="px-4 py-2">Водій / Авто</th>
                          <th className="px-4 py-2">Пасажирів</th>
                          <th className="px-4 py-2">Каса</th>
                        </tr>
                      </thead>
                      <tbody className="text-sm text-white divide-y divide-brand-border">
                        {Object.keys(crewBreakdown).map(crew => {
                          const schedule = schedules.find(s => normalizeCrewName(s.crew_name) === normalizeCrewName(crew));
                          const assignedDriver = drivers.find(d => d.id === schedule?.driver_id);
                          const driverName = assignedDriver ? assignedDriver.name : 'Не призначено';
                          const carNumber = schedule?.car || 'Не призначено';

                          return (
                            <tr key={crew} className="hover:bg-brand-surface/50">
                              <td className="px-4 py-3 font-bold text-brand-yellow">{crew}</td>
                              <td className="px-4 py-3 text-xs">
                                <div className="font-bold">{driverName}</div>
                                {schedule?.car && <div className="text-brand-muted font-mono mt-0.5 uppercase">{carNumber}</div>}
                              </td>
                              <td className="px-4 py-3">{crewBreakdown[crew].passengers}</td>
                              <td className="px-4 py-3 text-green-500">{crewBreakdown[crew].sum} грн</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              // Вигляд Таблиць
              (() => {
                const currentSchedule = schedules.find(s => normalizeCrewName(s.crew_name) === normalizeCrewName(activeTab));
                if (!currentSchedule) {
                  return (
                    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-brand-border rounded-2xl bg-brand-dark/20 m-6">
                      <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mb-4 text-brand-yellow">
                        <CalendarIcon size={32} />
                      </div>
                      <h3 className="text-xl font-display font-bold text-white mb-2">Рейси на цей день не створено</h3>
                      <p className="text-brand-muted max-w-sm mb-6 text-sm">
                        На {selectedDateUA} ще немає створених рейсів. Створіть перший рейс екіпажу, щоб почати приймати бронювання.
                      </p>
                      {role !== 'junior_dispatcher' && (
                        <button 
                          type="button"
                          onClick={openCreateScheduleModal}
                          className="btn-primary py-3 px-6 font-bold flex items-center gap-2"
                        >
                          <Plus size={18} />
                          Створити рейс дня
                        </button>
                      )}
                    </div>
                  );
                }

                const runs = [
                  { time: currentSchedule.run1_time, from: 'Східниця', to: 'Львів' },
                  { time: currentSchedule.run2_time, from: 'Львів', to: 'Східниця' },
                  { time: currentSchedule.run3_time, from: 'Східниця', to: 'Львів' },
                  { time: currentSchedule.run4_time, from: 'Львів', to: 'Східниця' },
                  { time: currentSchedule.run5_time, from: 'Східниця', to: 'Львів' },
                  { time: currentSchedule.run6_time, from: 'Львів', to: 'Східниця' },
                  { time: currentSchedule.run7_time, from: 'Східниця', to: 'Львів' },
                  { time: currentSchedule.run8_time, from: 'Львів', to: 'Східниця' },
                  { time: currentSchedule.run9_time, from: 'Східниця', to: 'Львів' },
                  { time: currentSchedule.run10_time, from: 'Львів', to: 'Східниця' }
                ].filter(r => r.time && r.time.trim() !== '');

                return (
                  <div className="space-y-8">
                      {runs.map(run => {
                        // Фільтруємо бронювання саме для цього рейсу (час та екіпаж)
                        const runBookings = bookings.filter(
                          b => normalizeTime(b.departure_time) === normalizeTime(run.time) && normalizeCrewName(b.crew) === normalizeCrewName(activeTab)
                        );

                         const isLviv = run.from === 'Львів';
                         const schedule = schedules.find(s => normalizeCrewName(s.crew_name) === normalizeCrewName(activeTab));
                         const carDetails = getCarDetails(schedule?.car);
                         const totalSeats = carDetails ? carDetails.seats : 12;
                         const { seats: allocatedSeats, backupBookings } = allocateSeatSlots(runBookings, isLviv, totalSeats);

                         // Рахуємо скільки місць зайнято
                         const occupiedCount = runBookings.reduce((sum, b) => sum + (b.seats || 0), 0);
                         const isExpanded = !!expandedRuns[run.time];
                         const seatsToRender = isExpanded ? allocatedSeats : allocatedSeats.filter(s => s.bookings.length > 0);

                        return (
                          <div key={run.time} className="space-y-3 bg-brand-dark/40 p-3 sm:p-4 rounded-xl border border-brand-border/40">
                            <div className="bg-brand-dark px-3 sm:px-4 py-2.5 rounded-lg border border-brand-yellow/20 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3">
                              <div className="flex items-center justify-between sm:justify-start gap-3 flex-wrap">
                                <div className="flex items-center gap-3">
                                  <span className="font-display font-black text-brand-yellow text-xl">{run.time}</span>
                                  <span className="text-xs font-bold text-white bg-brand-surface border border-brand-border px-2 py-0.5 rounded uppercase">
                                    {run.from} → {run.to}
                                  </span>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={() => openAddModalForRun(run.time, run.from, run.to)}
                                  className="bg-brand-yellow/10 hover:bg-brand-yellow/20 text-brand-yellow border border-brand-yellow/20 hover:border-brand-yellow/40 text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1 normal-case"
                                >
                                  <Plus size={11} className="text-brand-yellow" />
                                  <span>Додати бронювання</span>
                                </button>
                              </div>
                              <div className="text-[10px] sm:text-xs text-brand-muted uppercase font-bold flex items-center justify-between lg:justify-end gap-3 flex-wrap">
                                <span>Екіпаж: <strong className="text-white">{activeTab}</strong></span>
                                <span className="h-3 w-px bg-brand-border hidden sm:inline" />
                                <span>Зайнято місць: <strong className={occupiedCount > 12 ? "text-red-500" : "text-brand-yellow"}>{occupiedCount}/12</strong></span>
                                <span className="h-3 w-px bg-brand-border" />
                                <button
                                  type="button"
                                  onClick={() => toggleRunExpanded(run.time)}
                                  className="bg-brand-surface border border-brand-border hover:border-brand-yellow/50 text-[10px] text-white font-bold px-2 py-1 rounded transition-colors flex items-center justify-center gap-1 normal-case flex-1 lg:flex-initial animate-none"
                                >
                                  {isExpanded ? (
                                    <>
                                      <ChevronUp size={12} className="text-brand-yellow" />
                                      <span>Згорнути</span>
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown size={12} className="text-brand-yellow" />
                                      <span>Розгорнути</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                              <thead className="text-brand-muted text-xs uppercase tracking-wider">
                                <tr className="border-b border-brand-border">
                                  <th className="px-4 py-2 font-medium w-12 text-center">Місце</th>
                                  <th className="px-4 py-2 font-medium">Клієнт</th>
                                  <th className="px-4 py-2 font-medium w-48">Маршрут</th>
                                  <th className="px-4 py-2 font-medium w-40">Телефон</th>
                                  <th className="px-4 py-2 font-medium">Зупинка посадки</th>
                                  <th className="px-4 py-2 font-medium w-24 text-right">Дії</th>
                                </tr>
                              </thead>
                              <tbody className="text-sm text-white divide-y divide-brand-border/30">
                                {runBookings.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-4 text-center text-brand-muted/60 italic text-xs">
                                      Немає бронювань на цей рейс.{" "}
                                      <button
                                        type="button"
                                        onClick={() => openAddModalForRun(run.time, run.from, run.to)}
                                        className="text-brand-yellow hover:underline ml-1 font-bold inline-flex items-center gap-0.5"
                                      >
                                        <Plus size={10} />
                                        <span>Додати перше бронювання</span>
                                      </button>
                                    </td>
                                  </tr>
                                ) : (
                                  seatsToRender.flatMap((seat) => {
                                    if (seat.bookings.length === 0) {
                                      return [
                                        <tr key={`empty-${seat.number}`} className="text-brand-muted/50 hover:bg-brand-surface/30 transition-colors">
                                          <td className="px-4 py-2 text-center font-mono text-brand-muted/40">
                                            {seat.number}
                                          </td>
                                          <td className="px-4 py-2 italic text-xs">
                                            <span className="text-emerald-500/40">Вільне місце</span>
                                          </td>
                                          <td className="px-4 py-2 text-xs">—</td>
                                          <td className="px-4 py-2 font-mono text-xs">—</td>
                                          <td className="px-4 py-2 text-xs">—</td>
                                          <td className="px-4 py-2 text-right">
                                            <button
                                              type="button"
                                              onClick={() => openAddModalForRun(run.time, run.from, run.to)}
                                              className="text-brand-yellow hover:text-white p-1 rounded hover:bg-brand-yellow/10 transition-colors inline-flex items-center gap-1 text-xs font-bold"
                                              title="Додати бронювання"
                                            >
                                              <Plus size={12} />
                                              <span>Додати</span>
                                            </button>
                                          </td>
                                        </tr>
                                      ];
                                    }

                                    return seat.bookings.map((b: any, bIdx: number) => {
                                      const isFirst = bIdx === 0;
                                      return (
                                        <tr key={`${b.id}-${seat.number}-${bIdx}`} className="hover:bg-brand-yellow/5 transition-colors">
                                          {isFirst && (
                                            <td 
                                              rowSpan={seat.bookings.length} 
                                              className="px-4 py-2.5 text-brand-yellow font-mono text-center font-bold border-r border-brand-border/30 align-middle"
                                            >
                                              {seat.number}
                                            </td>
                                          )}
                                          <td className="px-4 py-2.5 font-semibold">
                                            <div>
                                              <span>{b.passenger_name || b.name}</span>
                                              {b.totalSeats > 1 && (
                                                <span className="text-xs text-brand-muted font-normal ml-1">
                                                  ({b.seatSubIndex}/{b.totalSeats})
                                                </span>
                                              )}
                                            </div>
                                            {b.updated_by && (
                                              <div className="text-[10px] text-brand-muted font-normal mt-0.5">
                                                Змінив: {b.updated_by}
                                              </div>
                                            )}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-gray-300">
                                            {b.bus_from || b.from} → {b.bus_to || b.to}
                                          </td>
                                          <td className="px-4 py-2.5 font-mono text-xs">
                                            {b.passenger_phone || b.phone}
                                          </td>
                                          <td className="px-4 py-2.5 text-xs text-brand-muted">
                                            {b.pickup_location || '-'}
                                          </td>
                                          <td className="px-4 py-2.5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                              <a href={`tel:${b.passenger_phone || b.phone}`} className="text-green-500 hover:text-green-400 p-1 rounded hover:bg-brand-surface transition-colors" title="Подзвонити">
                                                <PhoneCall size={14} />
                                              </a>
                                              {role !== 'junior_dispatcher' && (
                                                <>
                                                  <button 
                                                    onClick={() => {
                                                      const isoDate = formatDateToISO(b.date || b.bus_date);
                                                      setEditingBooking({...b, date: isoDate});
                                                    }}
                                                    className="text-brand-yellow hover:text-brand-gold p-1 rounded hover:bg-brand-surface transition-colors"
                                                    title="Редагувати"
                                                  >
                                                    <Edit2 size={14} />
                                                  </button>
                                                  <button 
                                                    onClick={() => handleDeleteBooking(b.id)}
                                                    className="text-red-500 hover:text-red-400 p-1 rounded hover:bg-brand-surface transition-colors"
                                                    title="Видалити"
                                                  >
                                                    <Trash2 size={14} />
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    });
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Резервні місця */}
                          {backupBookings.length > 0 && (
                            <div className="mt-4 p-4 bg-red-950/20 border border-red-500/20 rounded-xl space-y-3">
                              <div className="flex justify-between items-center border-b border-red-500/10 pb-2">
                                <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                                  ⚠️ Резервні місця ({backupBookings.reduce((sum, b) => sum + (b.seats || 0), 0)}м)
                                </h4>
                                <span className="text-[10px] text-red-400/80 italic">Поза лімітом місць автомобіля</span>
                              </div>
                              <div className="space-y-3 divide-y divide-red-500/10">
                                {backupBookings.map((b: any, bIdx: number) => {
                                  return (
                                    <div key={`backup-${b.id}-${bIdx}`} className="pt-3 first:pt-0 flex justify-between items-start gap-3 text-xs">
                                      <div className="space-y-1">
                                        <div className="font-bold text-white flex items-center gap-1.5">
                                          <span>{b.passenger_name || b.name}</span>
                                          <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded font-mono font-bold">
                                            Резерв ({b.seats}м)
                                          </span>
                                        </div>
                                        <div className="text-brand-muted text-[11px] flex flex-col gap-1">
                                          <div className="font-semibold text-white/95">
                                            {b.bus_from || b.from} → {b.bus_to || b.to}
                                          </div>
                                          <div>
                                            Посадка: {b.pickup_location || 'Не вказано'}
                                          </div>
                                          <div>
                                            Оплата:{' '}
                                            <span className="text-white font-bold font-mono">
                                              {b.price} грн
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-1.5 font-bold">
                                        <a 
                                          href={`tel:${b.passenger_phone || b.phone}`}
                                          className="bg-red-500 text-white p-2 rounded-full hover:scale-105 transition-transform shadow flex-shrink-0"
                                          title="Подзвонити"
                                        >
                                          <PhoneCall size={12} />
                                        </a>
                                        {role !== 'junior_dispatcher' && (
                                          <>
                                            <button 
                                              onClick={() => {
                                                const isoDate = formatDateToISO(b.date || b.bus_date);
                                                setEditingBooking({...b, date: isoDate});
                                              }}
                                              className="text-brand-yellow hover:text-brand-gold p-1.5 rounded hover:bg-brand-surface transition-colors"
                                              title="Редагувати"
                                            >
                                              <Edit2 size={13} />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteBooking(b.id)}
                                              className="text-red-500 hover:text-red-400 p-1.5 rounded hover:bg-brand-surface transition-colors"
                                              title="Видалити"
                                            >
                                              <Trash2 size={13} />
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Модалка додавання броні */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-lg w-full p-6 space-y-4 border-brand-yellow/20"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white">Додати нове бронювання</h3>
                <button onClick={() => setShowAddModal(false)} className="text-brand-muted hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAddBooking} className="space-y-4">
                <div>
                  <label className="label text-xs mb-1 block">Ім'я клієнта</label>
                  <input 
                    type="text" 
                    required
                    value={newBooking.name}
                    onChange={e => setNewBooking({...newBooking, name: e.target.value})}
                    className="input-field h-11"
                    placeholder="Іван Іванов"
                  />
                </div>

                <div>
                  <label className="label text-xs mb-1 block">Телефон</label>
                  <input 
                    type="tel" 
                    required
                    value={newBooking.phone}
                    onChange={e => handlePhoneChange(e.target.value, setNewBooking, newBooking)}
                    className="input-field h-11"
                    placeholder="+380..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs mb-1 block">Звідки</label>
                    <input 
                      type="text"
                      value={newBooking.from}
                      onChange={e => handleNewBookingRouteUpdate({ from: e.target.value })}
                      className="input-field h-11 bg-brand-surface text-white placeholder-brand-muted/40"
                      placeholder="Звідки"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {LOCATIONS.map(loc => {
                        const isActive = getNormalizedCityName(newBooking.from) === loc;
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleNewBookingRouteUpdate({ from: loc })}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                              isActive 
                                ? 'bg-brand-yellow text-brand-dark' 
                                : 'bg-brand-surface border border-brand-border/40 text-brand-muted hover:text-white hover:border-brand-yellow/30'
                            }`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs mb-1 block">Куди</label>
                    <input 
                      type="text"
                      value={newBooking.to}
                      onChange={e => handleNewBookingRouteUpdate({ to: e.target.value })}
                      className="input-field h-11 bg-brand-surface text-white placeholder-brand-muted/40"
                      placeholder="Куди"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {LOCATIONS.map(loc => {
                        const isActive = getNormalizedCityName(newBooking.to) === loc;
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleNewBookingRouteUpdate({ to: loc })}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                              isActive 
                                ? 'bg-brand-yellow text-brand-dark' 
                                : 'bg-brand-surface border border-brand-border/40 text-brand-muted hover:text-white hover:border-brand-yellow/30'
                            }`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs mb-1 block">Дата</label>
                    <input 
                      type="date" 
                      required
                      value={newBooking.date}
                      onChange={e => setNewBooking({...newBooking, date: e.target.value})}
                      className="input-field h-11 text-white bg-brand-surface"
                    />
                  </div>
                  <div>
                    <label className="label text-xs mb-1 block">Час (Рейс)</label>
                    <select 
                      value={newBooking.departure_time}
                      onChange={e => setNewBooking({...newBooking, departure_time: e.target.value})}
                      className="input-field h-11 bg-brand-surface"
                    >
                      {getValidTimesForRoute(newBooking.from, newBooking.to, newBooking.departure_time).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs mb-1 block">Місць</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={newBooking.seats}
                      onChange={e => setNewBooking({...newBooking, seats: parseInt(e.target.value)})}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label text-xs mb-1 block">Ціна (грн)</label>
                    <input 
                      type="number" 
                      required
                      value={newBooking.price}
                      onChange={e => setNewBooking({...newBooking, price: parseInt(e.target.value)})}
                      className="input-field h-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs mb-1 block">Зупинка посадки</label>
                  <input 
                    type="text" 
                    list="new-booking-pickup-list"
                    value={newBooking.pickup_location}
                    onChange={e => setNewBooking({...newBooking, pickup_location: e.target.value})}
                    className="input-field h-11"
                    placeholder="Оберіть зі списку або введіть довільно"
                  />
                  <datalist id="new-booking-pickup-list">
                    {(STATION_PICKUP_LOCATIONS[CITY_KEYS[newBooking.from]] || []).map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                <button type="submit" className="btn-primary w-full py-3 text-dark font-bold shadow-brand mt-2">
                  Зберегти бронювання
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Модалка редагування броні */}
      <AnimatePresence>
        {editingBooking && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="card max-w-lg w-full p-6 space-y-4 border-brand-yellow/20"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-display font-bold text-white">Редагувати бронювання</h3>
                <button onClick={() => setEditingBooking(null)} className="text-brand-muted hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateBooking} className="space-y-4">
                <div>
                  <label className="label text-xs mb-1 block">Ім'я клієнта</label>
                  <input 
                    type="text" 
                    required
                    value={editingBooking.name}
                    onChange={e => setEditingBooking({...editingBooking, name: e.target.value})}
                    className="input-field h-11"
                  />
                </div>

                <div>
                  <label className="label text-xs mb-1 block">Телефон</label>
                  <input 
                    type="tel" 
                    required
                    value={editingBooking.phone}
                    onChange={e => handlePhoneChange(e.target.value, setEditingBooking, editingBooking)}
                    className="input-field h-11"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs mb-1 block">Звідки</label>
                    <input 
                      type="text"
                      value={editingBooking.from}
                      onChange={e => handleEditingBookingRouteUpdate({ from: e.target.value })}
                      className="input-field h-11 bg-brand-surface text-white placeholder-brand-muted/40"
                      placeholder="Звідки"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {LOCATIONS.map(loc => {
                        const isActive = getNormalizedCityName(editingBooking.from) === loc;
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleEditingBookingRouteUpdate({ from: loc })}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                              isActive 
                                ? 'bg-brand-yellow text-brand-dark' 
                                : 'bg-brand-surface border border-brand-border/40 text-brand-muted hover:text-white hover:border-brand-yellow/30'
                            }`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <label className="label text-xs mb-1 block">Куди</label>
                    <input 
                      type="text"
                      value={editingBooking.to}
                      onChange={e => handleEditingBookingRouteUpdate({ to: e.target.value })}
                      className="input-field h-11 bg-brand-surface text-white placeholder-brand-muted/40"
                      placeholder="Куди"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {LOCATIONS.map(loc => {
                        const isActive = getNormalizedCityName(editingBooking.to) === loc;
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => handleEditingBookingRouteUpdate({ to: loc })}
                            className={`text-[10px] font-bold px-2 py-1 rounded transition-all ${
                              isActive 
                                ? 'bg-brand-yellow text-brand-dark' 
                                : 'bg-brand-surface border border-brand-border/40 text-brand-muted hover:text-white hover:border-brand-yellow/30'
                            }`}
                          >
                            {loc}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs mb-1 block">Дата</label>
                    <input 
                      type="date" 
                      required
                      value={editingBooking.date}
                      onChange={e => setEditingBooking({...editingBooking, date: e.target.value})}
                      className="input-field h-11 text-white bg-brand-surface"
                    />
                  </div>
                  <div>
                    <label className="label text-xs mb-1 block">Час (Рейс)</label>
                    <select 
                      value={editingBooking.departure_time}
                      onChange={e => setEditingBooking({...editingBooking, departure_time: e.target.value})}
                      className="input-field h-11 bg-brand-surface"
                    >
                      {getValidTimesForRoute(editingBooking.from, editingBooking.to, editingBooking.departure_time).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label text-xs mb-1 block">Місць</label>
                    <input 
                      type="number" 
                      required
                      min="1"
                      value={editingBooking.seats}
                      onChange={e => setEditingBooking({...editingBooking, seats: parseInt(e.target.value)})}
                      className="input-field h-11"
                    />
                  </div>
                  <div>
                    <label className="label text-xs mb-1 block">Ціна (грн)</label>
                    <input 
                      type="number" 
                      required
                      value={editingBooking.price}
                      onChange={e => setEditingBooking({...editingBooking, price: parseInt(e.target.value)})}
                      className="input-field h-11"
                    />
                  </div>
                </div>

                <div>
                  <label className="label text-xs mb-1 block">Зупинка посадки</label>
                  <input 
                    type="text" 
                    list="edit-booking-pickup-list"
                    value={editingBooking.pickup_location || ''}
                    onChange={e => setEditingBooking({...editingBooking, pickup_location: e.target.value})}
                    className="input-field h-11"
                    placeholder="Оберіть зі списку або введіть довільно"
                  />
                  <datalist id="edit-booking-pickup-list">
                    {(STATION_PICKUP_LOCATIONS[CITY_KEYS[editingBooking.from]] || []).map((loc) => (
                      <option key={loc} value={loc} />
                    ))}
                  </datalist>
                </div>

                <button type="submit" className="btn-primary w-full py-3 text-dark font-bold shadow-brand mt-2">
                  Зберегти зміни
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Модалка створення / редагування рейсів дня */}
      <AnimatePresence>
        {showScheduleModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/80 backdrop-blur-sm">
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="card max-w-lg w-full p-6 space-y-4 border-brand-yellow/20"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-display font-bold text-white">
                    {editingSchedule ? 'Редагувати рейс екіпажу' : 'Створити рейс екіпажу'}
                  </h3>
                  <button onClick={() => setShowScheduleModal(false)} className="text-brand-muted hover:text-white">
                    <X size={20} />
                  </button>
                </div>

                <form onSubmit={handleSaveSchedule} className="space-y-4">
                  {/* Вибір швидких екіпажів */}
                  <div>
                    <label className="label text-xs mb-1 block text-brand-muted">Оберіть шаблон екіпажу</label>
                    <div className="grid grid-cols-3 gap-2">
                      {templates.map(t => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => handleCrewPresetChange(t.name)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-bold transition-all border ${
                            scheduleForm.crew_name === t.name 
                              ? 'bg-brand-yellow text-brand-dark border-brand-yellow font-black'
                              : 'bg-brand-surface border-brand-border text-brand-muted hover:border-brand-yellow/50'
                          }`}
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                    {templates.length === 0 && (
                      <div className="text-xs text-brand-muted italic mt-1">Немає збережених шаблонів. Створіть їх у Налаштуваннях.</div>
                    )}
                  </div>

                  {/* Назва екіпажу */}
                  <div>
                    <label className="label text-xs mb-1 block">Назва екіпажу (можна змінити)</label>
                    <input 
                      type="text" 
                      required
                      value={scheduleForm.crew_name}
                      onChange={e => setScheduleForm({...scheduleForm, crew_name: e.target.value})}
                      className="input-field h-11 bg-brand-dark text-white"
                      placeholder="Наприклад: Екіпаж 1 або Додатковий"
                    />
                  </div>

                  {/* Водій та автомобіль */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="label text-xs mb-1 block">Водій</label>
                      <select
                        value={scheduleForm.driver_id}
                        onChange={e => setScheduleForm({...scheduleForm, driver_id: e.target.value})}
                        className="input-field h-11 bg-brand-dark text-white"
                        required
                      >
                        <option value="">-- Оберіть водія --</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>{d.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs mb-1 block">Машина</label>
                      <select
                        value={scheduleForm.car}
                        onChange={e => setScheduleForm({...scheduleForm, car: e.target.value})}
                        className="input-field h-11 bg-brand-dark text-white"
                        required
                      >
                        <option value="">-- Оберіть машину --</option>
                        {carsList.map(car => (
                          <option key={car} value={car}>{car.toUpperCase()}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Години рейсів */}
                  <div>
                    <label className="label text-xs mb-2 block font-bold text-brand-yellow">Час відправлень (до 10 рейсів за день)</label>
                    <div className="grid grid-cols-2 gap-4 bg-brand-dark/30 p-3 rounded-xl border border-brand-border/40 max-h-[220px] overflow-y-auto">
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 1: Сх → Лв</label>
                        <input 
                          type="text" 
                          required
                          value={scheduleForm.run1_time}
                          onChange={e => setScheduleForm({...scheduleForm, run1_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="06:20"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 2: Лв → Сх</label>
                        <input 
                          type="text" 
                          required
                          value={scheduleForm.run2_time}
                          onChange={e => setScheduleForm({...scheduleForm, run2_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="09:00"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 3: Сх → Лв</label>
                        <input 
                          type="text" 
                          required
                          value={scheduleForm.run3_time}
                          onChange={e => setScheduleForm({...scheduleForm, run3_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="12:00"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 4: Лв → Сх</label>
                        <input 
                          type="text" 
                          required
                          value={scheduleForm.run4_time}
                          onChange={e => setScheduleForm({...scheduleForm, run4_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="14:50"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 5: Сх → Лв</label>
                        <input 
                          type="text" 
                          value={scheduleForm.run5_time}
                          onChange={e => setScheduleForm({...scheduleForm, run5_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="Немає"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 6: Лв → Сх</label>
                        <input 
                          type="text" 
                          value={scheduleForm.run6_time}
                          onChange={e => setScheduleForm({...scheduleForm, run6_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="Немає"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 7: Сх → Лв</label>
                        <input 
                          type="text" 
                          value={scheduleForm.run7_time}
                          onChange={e => setScheduleForm({...scheduleForm, run7_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="Немає"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 8: Лв → Сх</label>
                        <input 
                          type="text" 
                          value={scheduleForm.run8_time}
                          onChange={e => setScheduleForm({...scheduleForm, run8_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="Немає"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 9: Сх → Лв</label>
                        <input 
                          type="text" 
                          value={scheduleForm.run9_time}
                          onChange={e => setScheduleForm({...scheduleForm, run9_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="Немає"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-brand-muted uppercase font-bold mb-1 block">Рейс 10: Лв → Сх</label>
                        <input 
                          type="text" 
                          value={scheduleForm.run10_time}
                          onChange={e => setScheduleForm({...scheduleForm, run10_time: e.target.value})}
                          className="input-field h-10 text-center font-bold text-xs bg-brand-dark text-white"
                          placeholder="Немає"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowScheduleModal(false)}
                      className="btn-secondary flex-1 py-2.5 font-bold"
                    >
                      Скасувати
                    </button>
                    <button
                      type="submit"
                      className="btn-primary flex-1 py-2.5 font-bold text-brand-dark"
                    >
                      Зберегти
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      {/* Модалка налаштувань */}
      <AnimatePresence>
        {showSettingsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/85 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card max-w-4xl w-full p-6 space-y-6 border-brand-yellow/25 flex flex-col max-h-[90vh] overflow-hidden bg-brand-dark"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-brand-border pb-4 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⚙️</span>
                  <h3 className="text-2xl font-display font-black text-white">Налаштування системи</h3>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="text-brand-muted hover:text-white transition-colors p-1 rounded-lg hover:bg-brand-surface">
                  <X size={24} />
                </button>
              </div>

              {/* Sub-tabs */}
              <div className="flex border-b border-brand-border flex-shrink-0 overflow-x-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSettingsTab('templates')}
                  className={`px-6 py-2.5 text-sm font-bold transition-all border-b-2 flex-shrink-0
                    ${settingsTab === 'templates' 
                      ? 'text-brand-yellow border-brand-yellow font-black' 
                      : 'text-brand-muted border-transparent hover:text-white'
                    }
                  `}
                >
                  📋 Шаблони рейсів
                </button>

                <button
                  type="button"
                  onClick={() => setSettingsTab('cars')}
                  className={`px-6 py-2.5 text-sm font-bold transition-all border-b-2 flex-shrink-0
                    ${settingsTab === 'cars' 
                      ? 'text-brand-yellow border-brand-yellow font-black' 
                      : 'text-brand-muted border-transparent hover:text-white'
                    }
                  `}
                >
                  🚗 Машини
                </button>
                
                {role !== 'junior_dispatcher' && (
                  <button
                    type="button"
                    onClick={() => setSettingsTab('dispatchers')}
                    className={`px-6 py-2.5 text-sm font-bold transition-all border-b-2 flex-shrink-0
                      ${settingsTab === 'dispatchers' 
                        ? 'text-brand-yellow border-brand-yellow font-black' 
                        : 'text-brand-muted border-transparent hover:text-white'
                      }
                    `}
                  >
                    🔑 Диспетчери
                  </button>
                )}
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto pr-1">
                {/* 1. Вкладка ШАБЛОНИ */}
                {settingsTab === 'templates' && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-3 flex justify-between items-center">
                      <h4 className="font-display font-black text-white text-lg">
                        {editingTemplate ? 'Редагувати шаблон рейсів' : 'Створити шаблон рейсів'}
                      </h4>
                      <span className="text-xs text-brand-muted">Всього шаблонів: {templates.length}</span>
                    </div>

                    {role !== 'junior_dispatcher' && (
                      <form onSubmit={handleSaveTemplate} className="bg-brand-surface p-4 rounded-xl border border-brand-border space-y-4 text-white">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="label text-xs mb-1 block">Назва шаблону (напр. Екіпаж 1)</label>
                            <input
                              type="text"
                              placeholder="Наприклад: Екіпаж 7"
                              value={templateForm.name}
                              onChange={e => setTemplateForm({...templateForm, name: e.target.value})}
                              className="input-field h-10 w-full bg-brand-dark text-white"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label text-[10px] mb-1 block">Рейс 1 (Сх → Лв)</label>
                              <input
                                type="text"
                                value={templateForm.run1_time}
                                onChange={e => setTemplateForm({...templateForm, run1_time: e.target.value})}
                                className="input-field h-10 text-center font-bold bg-brand-dark text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="label text-[10px] mb-1 block">Рейс 2 (Лв → Сх)</label>
                              <input
                                type="text"
                                value={templateForm.run2_time}
                                onChange={e => setTemplateForm({...templateForm, run2_time: e.target.value})}
                                className="input-field h-10 text-center font-bold bg-brand-dark text-white"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="label text-[10px] mb-1 block">Рейс 3 (Сх → Лв)</label>
                              <input
                                type="text"
                                value={templateForm.run3_time}
                                onChange={e => setTemplateForm({...templateForm, run3_time: e.target.value})}
                                className="input-field h-10 text-center font-bold bg-brand-dark text-white"
                                required
                              />
                            </div>
                            <div>
                              <label className="label text-[10px] mb-1 block">Рейс 4 (Лв → Сх)</label>
                              <input
                                type="text"
                                value={templateForm.run4_time}
                                onChange={e => setTemplateForm({...templateForm, run4_time: e.target.value})}
                                className="input-field h-10 text-center font-bold bg-brand-dark text-white"
                                required
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-xs font-bold text-brand-yellow mb-1">Налаштування рейсів шаблону (Рейси 1-4 обов'язкові, 5-10 опціональні)</div>
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 bg-brand-dark/40 p-3 rounded-xl border border-brand-border/40 text-white">
                          <div>
                            <label className="label text-[9px] mb-1 block">Рейс 5 (Сх→Лв)</label>
                            <input
                              type="text"
                              value={templateForm.run5_time}
                              onChange={e => setTemplateForm({...templateForm, run5_time: e.target.value})}
                              className="input-field h-9 text-center font-bold text-xs bg-brand-dark text-white"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="label text-[9px] mb-1 block">Рейс 6 (Лв→Сх)</label>
                            <input
                              type="text"
                              value={templateForm.run6_time}
                              onChange={e => setTemplateForm({...templateForm, run6_time: e.target.value})}
                              className="input-field h-9 text-center font-bold text-xs bg-brand-dark text-white"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="label text-[9px] mb-1 block">Рейс 7 (Сх→Лв)</label>
                            <input
                              type="text"
                              value={templateForm.run7_time}
                              onChange={e => setTemplateForm({...templateForm, run7_time: e.target.value})}
                              className="input-field h-9 text-center font-bold text-xs bg-brand-dark text-white"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="label text-[9px] mb-1 block">Рейс 8 (Лв→Сх)</label>
                            <input
                              type="text"
                              value={templateForm.run8_time}
                              onChange={e => setTemplateForm({...templateForm, run8_time: e.target.value})}
                              className="input-field h-9 text-center font-bold text-xs bg-brand-dark text-white"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="label text-[9px] mb-1 block">Рейс 9 (Сх→Лв)</label>
                            <input
                              type="text"
                              value={templateForm.run9_time}
                              onChange={e => setTemplateForm({...templateForm, run9_time: e.target.value})}
                              className="input-field h-9 text-center font-bold text-xs bg-brand-dark text-white"
                              placeholder="-"
                            />
                          </div>
                          <div>
                            <label className="label text-[9px] mb-1 block">Рейс 10 (Лв→Сх)</label>
                            <input
                              type="text"
                              value={templateForm.run10_time}
                              onChange={e => setTemplateForm({...templateForm, run10_time: e.target.value})}
                              className="input-field h-9 text-center font-bold text-xs bg-brand-dark text-white"
                              placeholder="-"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-2">
                          {editingTemplate && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTemplate(null);
                                setTemplateForm({
                                  name: '',
                                  run1_time: '06:20',
                                  run2_time: '09:00',
                                  run3_time: '12:00',
                                  run4_time: '14:50',
                                  run5_time: '',
                                  run6_time: '',
                                  run7_time: '',
                                  run8_time: '',
                                  run9_time: '',
                                  run10_time: ''
                                });
                              }}
                              className="btn-secondary px-6 py-2 text-sm font-bold h-10"
                            >
                              Скасувати
                            </button>
                          )}
                          <button
                            type="submit"
                            className="btn-primary px-8 py-2 text-sm font-bold text-brand-dark h-10"
                          >
                            {editingTemplate ? 'Оновити' : 'Зберегти шаблон'}
                          </button>
                        </div>
                        {templateError && (
                          <div className="text-red-500 text-xs">{templateError}</div>
                        )}
                      </form>
                    )}

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {templates.length === 0 ? (
                        <div className="text-center text-brand-muted py-6 text-sm">Немає збережених шаблонів</div>
                      ) : (
                        templates.map(t => (
                          <div key={t.id} className="flex justify-between items-center p-3 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-yellow/30 transition-colors text-white">
                            <div>
                              <div className="font-bold text-white text-sm">{t.name}</div>
                              <div className="text-xs text-brand-muted mt-1 flex flex-wrap gap-2">
                                <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 1: {t.run1_time}</span>
                                <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 2: {t.run2_time}</span>
                                <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 3: {t.run3_time}</span>
                                <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 4: {t.run4_time}</span>
                                {t.run5_time && <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 5: {t.run5_time}</span>}
                                {t.run6_time && <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 6: {t.run6_time}</span>}
                                {t.run7_time && <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 7: {t.run7_time}</span>}
                                {t.run8_time && <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 8: {t.run8_time}</span>}
                                {t.run9_time && <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 9: {t.run9_time}</span>}
                                {t.run10_time && <span className="bg-brand-dark px-1.5 py-0.5 rounded border border-brand-border">Рейс 10: {t.run10_time}</span>}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {role !== 'junior_dispatcher' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingTemplate(t);
                                      setTemplateForm({
                                        name: t.name,
                                        run1_time: t.run1_time,
                                        run2_time: t.run2_time,
                                        run3_time: t.run3_time,
                                        run4_time: t.run4_time,
                                        run5_time: t.run5_time || '',
                                        run6_time: t.run6_time || '',
                                        run7_time: t.run7_time || '',
                                        run8_time: t.run8_time || '',
                                        run9_time: t.run9_time || '',
                                        run10_time: t.run10_time || ''
                                      });
                                    }}
                                    type="button"
                                    className="text-brand-yellow hover:text-brand-gold p-1 transition-colors"
                                    title="Редагувати шаблон"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTemplate(t.id)}
                                    type="button"
                                    className="text-red-500 hover:text-red-400 p-1 transition-colors"
                                    title="Видалити шаблон"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 2. Вкладка МАШИНИ */}
                {settingsTab === 'cars' && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-3 flex justify-between items-center">
                      <h4 className="font-display font-black text-white text-lg">Керування автомобілями компанії</h4>
                      <span className="text-xs text-brand-muted">Всього: {cars.length}</span>
                    </div>

                    {role !== 'junior_dispatcher' && (
                      <form onSubmit={handleAddCar} className="bg-brand-surface p-4 rounded-xl border border-brand-border space-y-4 text-white">
                        <div className="text-xs text-brand-muted uppercase font-bold mb-1">Додати автомобіль</div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="label text-xs mb-1 block">Номерний знак *</label>
                            <input
                              type="text"
                              placeholder="напр. ВС 1060 ХВ"
                              value={newCarPlate}
                              onChange={e => setNewCarPlate(e.target.value)}
                              className="input-field h-10 w-full bg-brand-dark text-white uppercase"
                              required
                            />
                          </div>

                          <div>
                            <label className="label text-xs mb-1 block">Модель авто</label>
                            <input
                              type="text"
                              placeholder="напр. Mercedes Sprinter"
                              value={newCarModel}
                              onChange={e => setNewCarModel(e.target.value)}
                              className="input-field h-10 w-full bg-brand-dark text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="label text-xs mb-1 block">Кількість місць *</label>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={newCarSeats}
                              onChange={e => setNewCarSeats(parseInt(e.target.value) || 12)}
                              className="input-field h-10 w-full bg-brand-dark text-white"
                              required
                            />
                          </div>
                          <div>
                            <label className="label text-xs mb-1 block">Назва кольору</label>
                            <input
                              type="text"
                              placeholder="напр. білий"
                              value={newCarColorName}
                              onChange={e => setNewCarColorName(e.target.value)}
                              className="input-field h-10 w-full bg-brand-dark text-white"
                            />
                          </div>
                          <div className="grid grid-cols-3 gap-2 items-center">
                            <div className="col-span-2">
                              <label className="label text-[10px] mb-1 block">HEX код кольору</label>
                              <input
                                type="text"
                                placeholder="#FFFFFF"
                                value={newCarColorHex}
                                onChange={e => setNewCarColorHex(e.target.value)}
                                className="input-field h-10 w-full bg-brand-dark font-mono text-xs text-white"
                              />
                            </div>
                            <div className="col-span-1 pt-5">
                              <input
                                type="color"
                                value={newCarColorHex.startsWith('#') && newCarColorHex.length === 7 ? newCarColorHex : '#FFFFFF'}
                                onChange={e => setNewCarColorHex(e.target.value)}
                                className="w-full h-10 rounded-lg bg-transparent border-0 cursor-pointer p-0"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="label text-xs mb-1 block">Опис (короткий)</label>
                          <input
                            type="text"
                            placeholder="напр. білий мерседес"
                            value={newCarDescription}
                            onChange={e => setNewCarDescription(e.target.value)}
                            className="input-field h-10 w-full bg-brand-dark text-white"
                          />
                        </div>

                        {addCarError && (
                          <div className="text-red-500 text-xs">{addCarError}</div>
                        )}

                        <button
                          type="submit"
                          disabled={isAddingCar}
                          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50 mt-2"
                        >
                          {isAddingCar ? <RefreshCw size={16} className="animate-spin text-dark" /> : <Plus size={16} className="text-dark" />}
                          <span className="text-dark">Додати автомобіль</span>
                        </button>
                      </form>
                    )}

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {cars.length === 0 ? (
                        <div className="text-center text-brand-muted py-10 text-sm border border-brand-border/40 rounded-xl bg-brand-surface/20">
                          Немає зареєстрованих автомобілів
                        </div>
                      ) : (
                        cars.map(car => (
                          <div key={car.plate} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-yellow/30 transition-all gap-3 text-white">
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                              <div className="bg-brand-dark border border-brand-border px-2.5 py-1 rounded font-mono text-sm font-bold text-brand-yellow tracking-wide uppercase">
                                {car.plate}
                              </div>
                              
                              <div className="space-y-0.5">
                                <div className="font-bold text-white text-sm">
                                  {car.model || 'Без моделі'} <span className="text-xs font-normal text-brand-muted">({car.seats} місць)</span>
                                </div>
                                {car.description && (
                                  <div className="text-xs text-brand-muted">{car.description}</div>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 border-brand-border/40 pt-2 sm:pt-0">
                              <div className="flex items-center gap-1.5 bg-brand-dark/50 px-2 py-1 rounded border border-brand-border/30">
                                <span 
                                  className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm" 
                                  style={{ backgroundColor: car.colorHex || '#FFFFFF' }} 
                                />
                                <span className="text-xs text-brand-muted font-medium">{car.colorName || 'колір'}</span>
                              </div>

                              {role !== 'junior_dispatcher' && (
                                <button
                                  onClick={() => handleDeleteCar(car.plate)}
                                  type="button"
                                  className="text-red-500 hover:text-red-400 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* 3. Вкладка ДИСПЕТЧЕРИ */}
                {settingsTab === 'dispatchers' && role !== 'junior_dispatcher' && (
                  <div className="space-y-6">
                    <div className="border-b border-brand-border pb-3 flex justify-between items-center">
                      <h4 className="font-display font-black text-white text-lg">Керування диспетчерами</h4>
                      <span className="text-xs text-brand-muted">Всього: {dispatchersList.length}</span>
                    </div>

                    <form onSubmit={handleAddDispatcher} className="bg-brand-surface p-4 rounded-xl border border-brand-border space-y-3 text-white">
                      <div className="text-xs text-brand-muted uppercase font-bold mb-1">Створити молодшого диспетчера</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          placeholder="Ім'я диспетчера"
                          value={newDispName}
                          onChange={e => setNewDispName(e.target.value)}
                          className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-yellow"
                          required
                        />
                        <input
                          type="text"
                          placeholder="PIN (4 цифри)"
                          value={newDispPin}
                          onChange={e => setNewDispPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white text-center font-display tracking-widest placeholder-brand-muted focus:outline-none focus:border-brand-yellow"
                          maxLength={4}
                          required
                        />
                      </div>
                      
                      {dispError && (
                        <div className="text-red-500 text-xs">{dispError}</div>
                      )}

                      <button
                        type="submit"
                        className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-sm font-bold"
                      >
                        <Plus size={16} className="text-dark" />
                        <span className="text-dark">Додати диспетчера</span>
                      </button>
                    </form>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {dispatchersList.length === 0 ? (
                        <div className="text-center text-brand-muted py-6 text-sm">Немає зареєстрованих диспетчерів</div>
                      ) : (
                        dispatchersList.map(d => (
                          <div key={d.id} className="flex justify-between items-center p-3 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-yellow/30 transition-colors text-white">
                            <div className="space-y-1">
                              <div className="font-bold text-white text-sm">
                                {d.name} 
                                {d.role === 'dispatcher' && <span className="ml-2 text-[10px] bg-brand-yellow/20 text-brand-yellow px-1.5 py-0.5 rounded font-black uppercase">Головний</span>}
                                {d.role === 'junior_dispatcher' && <span className="ml-2 text-[10px] bg-brand-muted/20 text-brand-muted px-1.5 py-0.5 rounded font-bold uppercase">Молодший</span>}
                              </div>
                              <div className="text-[10px] text-brand-muted">Створено: {d.created_at || '—'}</div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span className="text-xs bg-brand-dark border border-brand-border px-2 py-1 rounded font-display tracking-widest text-brand-yellow font-bold">
                                PIN: {d.pin_code}
                              </span>
                              {d.role !== 'dispatcher' && (
                                <button
                                  onClick={() => handleDeleteDispatcher(d.id)}
                                  type="button"
                                  className="text-red-500 hover:text-red-400 p-1 transition-colors"
                                  title="Видалити диспетчера"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Sub-panel for managing drivers and assignments
interface DriversSubPanelProps {
  selectedDateUA: string;
  role?: string;
  schedules?: any[];
  fetchSchedules?: () => void;
  drivers?: any[];
  cars: CarDetail[];
  fetchCars: () => Promise<void>;
}

function DriversSubPanel({ 
  selectedDateUA, 
  role, 
  schedules = [], 
  fetchSchedules, 
  drivers: parentDrivers = [],
  cars = [],
  fetchCars
}: DriversSubPanelProps) {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [isDriversLoading, setIsDriversLoading] = useState(false);
  
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('+380');
  const [newDriverPin, setNewDriverPin] = useState('');
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [addDriverError, setAddDriverError] = useState('');



  const [savingCrews, setSavingCrews] = useState<Record<string, boolean>>({});

  const loadData = async () => {
    setIsDriversLoading(true);
    try {
      const driversData = await driverService.getDrivers();
      setDrivers(driversData);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDriversLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDateUA]);

  const handlePhoneChange = (val: string) => {
    const prefix = '+380';
    if (!val.startsWith(prefix)) {
      setNewDriverPhone(prefix);
      return;
    }
    const suffix = val.substring(prefix.length).replace(/\D/g, '');
    const limitedSuffix = suffix.substring(0, 9);
    setNewDriverPhone(prefix + limitedSuffix);
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddDriverError('');
    if (!newDriverName.trim() || newDriverPin.length !== 4) {
      setAddDriverError('Заповніть всі поля. PIN-код має складатися з 4 цифр.');
      return;
    }
    
    if (drivers.some(d => d.pin_code === newDriverPin)) {
      setAddDriverError('Водій з таким PIN-кодом вже існує.');
      return;
    }

    setIsAddingDriver(true);
    try {
      await driverService.addDriver(newDriverName, newDriverPhone, newDriverPin);
      setNewDriverName('');
      setNewDriverPhone('+380');
      setNewDriverPin('');
      await loadData();
    } catch (err: any) {
      console.error(err);
      setAddDriverError(err.message || 'Помилка при додаванні водія.');
    } finally {
      setIsAddingDriver(false);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!window.confirm('Ви впевнені, що хочете видалити цього водія?')) return;
    try {
      await driverService.deleteDriver(id);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Помилка при видаленні водія.');
    }
  };

  const handleAssignChange = async (scheduleId: string, driverId: string) => {
    setSavingCrews(prev => ({ ...prev, [scheduleId]: true }));
    try {
      await apiClient.updateSchedule(scheduleId, { driver_id: driverId ? driverId : null });
      if (fetchSchedules) fetchSchedules();
    } catch (err) {
      console.error(err);
      alert('Помилка при призначенні водія.');
    } finally {
      setSavingCrews(prev => ({ ...prev, [scheduleId]: false }));
    }
  };

  const handleCarChange = async (scheduleId: string, car: string) => {
    setSavingCrews(prev => ({ ...prev, [scheduleId]: true }));
    try {
      await apiClient.updateSchedule(scheduleId, { car: car ? car : null });
      if (fetchSchedules) fetchSchedules();
    } catch (err) {
      console.error(err);
      alert('Помилка при призначенні авто.');
    } finally {
      setSavingCrews(prev => ({ ...prev, [scheduleId]: false }));
    }
  };



  return (
    <div className="space-y-8 text-white">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Призначення на день */}
        <div className="bg-brand-dark p-6 rounded-xl border border-brand-border space-y-4">
          <div className="flex justify-between items-center border-b border-brand-border pb-3">
            <h3 className="font-display font-black text-white text-lg">Призначення рейсів</h3>
            <span className="text-xs text-brand-yellow font-bold bg-brand-yellow/10 px-2 py-1 rounded">
              на {selectedDateUA}
            </span>
          </div>

          {isDriversLoading ? (
            <div className="py-10 text-center text-brand-muted flex flex-col items-center gap-2">
              <RefreshCw size={24} className="animate-spin text-brand-yellow" />
              <span>Завантаження призначень...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {schedules.length === 0 ? (
                <div className="text-center text-brand-muted py-6 text-sm">
                  Немає створених екіпажів на цю дату. Спершу створіть рейс на вкладці екіпажів.
                </div>
              ) : (
                schedules.map(s => {
                  const currentDriverId = s.driver_id || '';
                  const currentCar = s.car || '';
                  const isSaving = savingCrews[s.id];

                  return (
                    <div key={s.id} className="flex justify-between items-center p-3 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-yellow/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="text-sm font-display font-black text-brand-yellow w-24 truncate">{s.crew_name}</div>
                        <div className="text-[10px] text-brand-muted uppercase font-bold hidden sm:block">Екіпаж</div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-[200px] sm:min-w-[320px]">
                        {isSaving ? (
                          <RefreshCw size={16} className="animate-spin text-brand-yellow mr-2" />
                        ) : (currentDriverId || currentCar) ? (
                          <span className="text-green-500 text-xs font-bold mr-1 whitespace-nowrap">✓ Призначено</span>
                        ) : null}
                        
                        <div className="flex gap-2 w-full">
                          <select
                            value={currentDriverId}
                            disabled={role === 'junior_dispatcher'}
                            onChange={(e) => handleAssignChange(s.id, e.target.value)}
                            className="bg-brand-dark border border-brand-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-yellow w-1/2 disabled:opacity-50"
                          >
                            <option value="">-- Водій --</option>
                            {drivers.map(d => (
                              <option key={d.id} value={d.id}>
                                {d.name}
                              </option>
                            ))}
                          </select>

                          <select
                            value={currentCar}
                            disabled={role === 'junior_dispatcher'}
                            onChange={(e) => handleCarChange(s.id, e.target.value)}
                            className="bg-brand-dark border border-brand-border rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-brand-yellow w-1/2 disabled:opacity-50"
                          >
                            <option value="">-- Машина --</option>
                            {cars.length > 0 ? (
                              cars.map(c => (
                                <option key={c.plate} value={c.plate}>
                                  {c.plate}
                                </option>
                              ))
                            ) : (
                              defaultCarsList.map(plate => (
                                <option key={plate} value={plate}>
                                  {plate}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Керування водіями */}
        <div className="bg-brand-dark p-6 rounded-xl border border-brand-border flex flex-col space-y-6">
          <div className="border-b border-brand-border pb-3">
            <h3 className="font-display font-black text-white text-lg">Список водіїв</h3>
          </div>

          {role !== 'junior_dispatcher' && (
            <form onSubmit={handleAddDriver} className="bg-brand-surface p-4 rounded-xl border border-brand-border space-y-3">
              <div className="text-xs text-brand-muted uppercase font-bold mb-1">Додати водія</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Ім'я водія"
                  value={newDriverName}
                  onChange={e => setNewDriverName(e.target.value)}
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-yellow"
                  required
                />
                <input
                  type="tel"
                  placeholder="Телефон"
                  value={newDriverPhone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-yellow"
                  required
                />
                <input
                  type="text"
                  placeholder="PIN (4 цифри)"
                  value={newDriverPin}
                  onChange={e => setNewDriverPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-sm text-white text-center font-display tracking-widest placeholder-brand-muted focus:outline-none focus:border-brand-yellow"
                  maxLength={4}
                  required
                />
              </div>
              
              {addDriverError && (
                <div className="text-red-500 text-xs">{addDriverError}</div>
              )}

              <button
                type="submit"
                disabled={isAddingDriver}
                className="btn-primary w-full py-2 flex items-center justify-center gap-2 text-sm font-bold disabled:opacity-50"
              >
                {isAddingDriver ? <RefreshCw size={16} className="animate-spin text-dark" /> : <Plus size={16} className="text-dark" />}
                <span className="text-dark">Додати водія</span>
              </button>
            </form>
          )}

          <div className="flex-1 overflow-y-auto max-h-[300px] space-y-2">
            {isDriversLoading ? (
              <div className="py-10 text-center text-brand-muted">Завантаження...</div>
            ) : drivers.length === 0 ? (
              <div className="text-center text-brand-muted py-6 text-sm">Немає зареєстрованих водіїв</div>
            ) : (
              drivers.map(d => (
                <div key={d.id} className="flex justify-between items-center p-3 rounded-lg bg-brand-surface border border-brand-border">
                  <div className="space-y-1">
                    <div className="font-bold text-white text-sm">{d.name}</div>
                    <div className="text-xs text-brand-muted font-mono">{d.phone}</div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-xs bg-brand-dark border border-brand-border px-2 py-1 rounded font-display tracking-widest text-brand-yellow font-bold">
                      PIN: {d.pin_code}
                    </span>
                    {role !== 'junior_dispatcher' && (
                      <button
                        onClick={() => handleDeleteDriver(d.id)}
                        type="button"
                        className="text-red-500 hover:text-red-400 p-1 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>



    </div>
  );
}
