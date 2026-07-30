import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Phone, Plus, RefreshCw, X, Calendar as CalendarIcon, Clock, 
  Trash2, Check, PhoneCall, BarChart2, Users, FileSpreadsheet, Search, AlertCircle, Copy
} from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { driverService } from '../../lib/driverService';
import type { DriverProfile } from '../../lib/driverService';
import { normalizeTime, normalizeCrewName } from '../../utils/normalize';

const CREW_TABS = ['05:50', '06:20', '07:10', '08:15', '08:50', '09:30', '10:35', '12:00', 'всі', 'водії', 'звіт'];

const ALL_TIMES = [
  '05:50', '06:20', '07:10', '08:10', '08:15', '08:50', '09:00', '09:15', '09:30', 
  '10:15', '10:35', '11:10', '11:50', '12:00', '12:20', '12:40', '13:10', '13:20', 
  '14:10', '14:50', '15:30', '16:10', '16:20', '17:00', '17:10', '17:40', '18:15', '18:20', 
  '19:20', '20:00', '20:20', '20:40', '21:00'
];

const CREW_SUB_RUNS: Record<string, { time: string; label: string }[]> = {
  '05:50': [
    { time: '05:50', label: '05:50 зі Східниці' },
    { time: '08:10', label: '08:10 зі Львова' },
    { time: '11:10', label: '11:10 зі Східниці' },
    { time: '14:10', label: '14:10 зі Львова' }
  ],
  '06:20': [
    { time: '06:20', label: '06:20 зі Східниці' },
    { time: '09:15', label: '09:15 зі Львова' },
    { time: '14:50', label: '14:50 зі Львова' },
    { time: '17:40', label: '17:40 зі Східниці' },
    { time: '20:40', label: '20:40 зі Львова' }
  ],
  '07:10': [
    { time: '07:10', label: '07:10 зі Східниці' },
    { time: '10:15', label: '10:15 зі Львова' },
    { time: '13:20', label: '13:20 зі Східниці' },
    { time: '16:10', label: '16:10 зі Львова' },
    { time: '19:20', label: '19:20 зі Східниці' }
  ],
  '08:15': [
    { time: '08:15', label: '08:15 зі Східниці' },
    { time: '11:10', label: '11:10 зі Львова' },
    { time: '14:10', label: '14:10 зі Східниці' },
    { time: '17:10', label: '17:10 зі Львова' },
    { time: '20:00', label: '20:00 зі Львова' }
  ],
  '08:50': [
    { time: '08:50', label: '08:50 зі Східниці' },
    { time: '11:50', label: '11:50 зі Львова' },
    { time: '15:30', label: '15:30 зі Східниці' },
    { time: '18:20', label: '18:20 зі Львова' }
  ],
  '09:30': [
    { time: '09:30', label: '09:30 зі Східниці' },
    { time: '12:20', label: '12:20 зі Львова' },
    { time: '16:20', label: '16:20 зі Східниці' },
    { time: '19:20', label: '19:20 зі Львова' }
  ],
  '10:35': [
    { time: '10:35', label: '10:35 зі Східниці' },
    { time: '13:10', label: '13:10 зі Львова' },
    { time: '17:00', label: '17:00 зі Східниці' },
    { time: '20:00', label: '20:00 зі Львова' }
  ],
  '12:00': [
    { time: '12:00', label: '12:00 зі Східниці' },
    { time: '14:50', label: '14:50 зі Львова' },
    { time: '17:40', label: '17:40 зі Східниці' },
    { time: '20:20', label: '20:20 зі Львова' }
  ]
};

interface BookingItem {
  id: string;
  user_id?: string;
  bus_from: string;
  bus_to: string;
  bus_date: string;
  departure_time: string;
  seats: number;
  price: number;
  status: string;
  passenger_name: string;
  passenger_phone: string;
  pickup_location?: string;
  crew?: string;
  driver_id?: string;
  driver_name?: string;
  comment?: string;
  payment_type?: string;
  is_paid_online?: number;
  from?: string;
  to?: string;
  date?: string;
  name?: string;
  phone?: string;
}

interface NewDraftBooking {
  tempId: string;
  departure_time: string;
  passenger_name: string;
  passenger_phone: string;
  bus_from: string;
  bus_to: string;
  seats: number;
  price: number;
  pickup_location: string;
  crew: string;
  status: string;
  driver_name: string;
  comment: string;
}

interface DispatcherPanelProps {
  adminName?: string;
  role?: 'dispatcher' | 'junior_dispatcher' | 'driver' | null;
  onLogout?: () => void;
}

export default function DispatcherPanel({ adminName = 'Диспетчер', role = 'dispatcher', onLogout }: DispatcherPanelProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [activeTab, setActiveTab] = useState<string>('06:20');
  const [directionFilter, setDirectionFilter] = useState<'all' | 'skhidnytsia_lviv' | 'lviv_skhidnytsia'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [savingCellId, setSavingCellId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Стан для секційних порожніх рядків додавання
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, NewDraftBooking>>({});

  // Вкладка "Водії"
  const [newDriverName, setNewDriverName] = useState('');
  const [newDriverPhone, setNewDriverPhone] = useState('');
  const [newDriverPin, setNewDriverPin] = useState('');
  const [driverError, setDriverError] = useState('');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 1. Завантаження даних
  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [bookingsData, driversData] = await Promise.all([
        apiClient.getBookings({ date: selectedDate }).catch(() => []),
        driverService.getDrivers().catch(() => [])
      ]);

      setBookings(bookingsData || []);
      setDrivers(driversData || []);
    } catch (err) {
      console.error('Помилка завантаження даних:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Підписка на WebSocket події (Socket.io)
  useEffect(() => {
    const handleBookingsChanged = () => {
      console.log('⚡ Socket.io: отримано bookings_changed, оновлюємо...');
      fetchAllData();
    };

    apiClient.socket.on('bookings_changed', handleBookingsChanged);
    return () => {
      apiClient.socket.off('bookings_changed', handleBookingsChanged);
    };
  }, [fetchAllData]);

  // 2. Фільтрація бронювань
  const filteredBookings = bookings.filter(b => {
    if (activeTab !== 'всі' && activeTab !== 'водії' && activeTab !== 'звіт') {
      const bCrew = normalizeCrewName(b.crew);
      if (bCrew !== normalizeCrewName(activeTab)) return false;
    }

    const fromLower = (b.bus_from || b.from || '').toLowerCase();
    const toLower = (b.bus_to || b.to || '').toLowerCase();
    if (directionFilter === 'skhidnytsia_lviv') {
      if (fromLower.includes('львів') || toLower.includes('східниця')) return false;
    } else if (directionFilter === 'lviv_skhidnytsia') {
      if (fromLower.includes('східниця') || toLower.includes('львів')) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const name = (b.passenger_name || b.name || '').toLowerCase();
      const phone = (b.passenger_phone || b.phone || '').toLowerCase();
      const from = (b.bus_from || b.from || '').toLowerCase();
      const to = (b.bus_to || b.to || '').toLowerCase();
      const pickup = (b.pickup_location || '').toLowerCase();
      return name.includes(q) || phone.includes(q) || from.includes(q) || to.includes(q) || pickup.includes(q);
    }

    return true;
  });

  // 3. Динамічне групування по окремих годинах / рейсах для під-секцій таблиці
  const groupedTimeSections = (() => {
    const isSunday = (() => {
      if (!selectedDate) return false;
      const [y, m, d] = selectedDate.split('-').map(Number);
      if (y && m && d) {
        return new Date(y, m - 1, d).getDay() === 0;
      }
      return false;
    })();

    let currentSubRuns = [...(CREW_SUB_RUNS[activeTab] || [])];
    if (isSunday) {
      if (activeTab === '05:50' || activeTab === '12:00' || activeTab === '08:15' || activeTab === 'всі') {
        currentSubRuns.push(
          { time: '18:15', label: '18:15 зі Східниці (Неділя)' },
          { time: '21:00', label: '21:00 зі Львова (Неділя)' }
        );
      }
    }

    const timesInBookings = Array.from(new Set(filteredBookings.map(b => normalizeTime(b.departure_time))));
    const allTimesSet = new Set([...currentSubRuns.map(r => r.time), ...timesInBookings]);
    const sortedTimes = Array.from(allTimesSet).filter(Boolean).sort((a, b) => a.localeCompare(b));

    return sortedTimes.map(t => {
      const subConfig = currentSubRuns.find(r => r.time === t);
      const timeBookings = filteredBookings.filter(b => normalizeTime(b.departure_time) === t);

      let label = subConfig ? subConfig.label : `${t}`;
      if (!subConfig && timeBookings.length > 0) {
        const firstFrom = (timeBookings[0].bus_from || timeBookings[0].from || '').toLowerCase();
        if (firstFrom.includes('львів')) {
          label = `${t} зі Львова`;
        } else {
          label = `${t} зі Східниці`;
        }
      }

      const isLviv = label.toLowerCase().includes('львів') || label.toLowerCase().includes('львова');
      const defaultFrom = isLviv ? 'Львів' : 'Східниця';
      const defaultTo = isLviv ? 'Східниця' : 'Львів';

      return {
        time: t,
        label,
        defaultFrom,
        defaultTo,
        bookings: timeBookings
      };
    });
  })();

  // 4. Інлайн Збереження зміни комірки існуючого бронювання
  const handleCellUpdate = async (bookingId: string, field: string, value: any) => {
    setSavingCellId(`${bookingId}_${field}`);

    // Оптимістичне оновлення локального стану
    setBookings(prev => prev.map(b => {
      if (b.id === bookingId) {
        if (field === 'driver_name') {
          const drv = drivers.find(d => d.name === value);
          return { ...b, driver_name: value, driver_id: drv ? drv.id : undefined };
        }
        return { ...b, [field]: value };
      }
      return b;
    }));

    try {
      const updatePayload: any = {
        updated_by: adminName
      };

      if (field === 'passenger_name') {
        updatePayload.passenger_name = value;
        updatePayload.name = value;
      } else if (field === 'passenger_phone') {
        updatePayload.passenger_phone = value;
        updatePayload.phone = value;
      } else if (field === 'bus_from') {
        updatePayload.bus_from = value;
        updatePayload.from = value;
      } else if (field === 'bus_to') {
        updatePayload.bus_to = value;
        updatePayload.to = value;
      } else if (field === 'departure_time') {
        updatePayload.departure_time = normalizeTime(value);
      } else if (field === 'driver_name') {
        updatePayload.driver_name = value;
        const drv = drivers.find(d => d.name === value);
        updatePayload.driver_id = drv ? drv.id : null;
      } else {
        updatePayload[field] = value;
      }

      await apiClient.updateBooking(bookingId, updatePayload);
      showToast('Збережено', 'success');
    } catch (err) {
      console.error('Помилка оновлення комірки:', err);
      showToast('Помилка збереження', 'error');
      fetchAllData();
    } finally {
      setSavingCellId(null);
    }
  };

  // 5. Збереження з чернетки конкретної години
  const handleSectionDraftChange = (timeKey: string, field: string, value: any) => {
    setSectionDrafts(prev => ({
      ...prev,
      [timeKey]: {
        ...(prev[timeKey] || {
          tempId: `draft_${timeKey}`,
          departure_time: timeKey,
          passenger_name: '',
          passenger_phone: '',
          bus_from: 'Східниця',
          bus_to: 'Львів',
          seats: 1,
          price: 350,
          pickup_location: '',
          crew: activeTab === 'всі' || activeTab === 'водії' || activeTab === 'звіт' ? '06:20' : activeTab,
          status: 'підтверджено',
          driver_name: '',
          comment: ''
        }),
        [field]: value
      }
    }));
  };

  const handleSectionDraftBlur = async (timeKey: string, defaultFrom: string, defaultTo: string) => {
    const draft = sectionDrafts[timeKey];
    if (!draft || (!draft.passenger_name.trim() && !draft.passenger_phone.trim() && !draft.pickup_location.trim())) {
      return;
    }

    try {
      setSavingCellId(`draft_${timeKey}`);
      const crewToUse = activeTab === 'всі' || activeTab === 'водії' || activeTab === 'звіт' ? '06:20' : activeTab;
      
      const newBookingPayload = {
        bus_date: selectedDate,
        date: selectedDate,
        departure_time: timeKey,
        passenger_name: draft.passenger_name || 'Пасажир',
        name: draft.passenger_name || 'Пасажир',
        passenger_phone: draft.passenger_phone || '+380',
        phone: draft.passenger_phone || '+380',
        bus_from: draft.bus_from || defaultFrom,
        from: draft.bus_from || defaultFrom,
        bus_to: draft.bus_to || defaultTo,
        to: draft.bus_to || defaultTo,
        seats: Number(draft.seats) || 1,
        price: 350,
        pickup_location: draft.pickup_location || '',
        crew: crewToUse,
        status: 'підтверджено',
        driver_name: draft.driver_name || null,
        driver_id: null,
        updated_by: adminName
      };

      const created = await apiClient.createBooking(newBookingPayload);
      showToast('Бронювання успішно додано!', 'success');

      setBookings(prev => [...prev, created]);

      // Очищаємо чернетку для цієї години
      setSectionDrafts(prev => {
        const next = { ...prev };
        delete next[timeKey];
        return next;
      });
    } catch (err) {
      console.error('Помилка створення бронювання зі секції:', err);
      showToast('Помилка збереження', 'error');
    } finally {
      setSavingCellId(null);
    }
  };

  // Видалення
  const handleDeleteBooking = async (id: string) => {
    if (!confirm('Видалити це бронювання?')) return;
    try {
      await apiClient.deleteBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
      showToast('Видалено', 'success');
    } catch (err) {
      showToast('Помилка видалення', 'error');
    }
  };

  // Копіювання бронювання
  const handleCopyBooking = async (booking: BookingItem) => {
    const crewName = normalizeCrewName(booking.crew || activeTab);
    const sameCrewBookings = bookings.filter(b => normalizeCrewName(b.crew) === crewName);
    const occupiedSeats = sameCrewBookings.reduce((sum, b) => sum + (Number(b.seats) || 1), 0);
    const seatsToCopy = Number(booking.seats) || 1;
    const MAX_SEATS_PER_BUS = 12;

    if (occupiedSeats + seatsToCopy > MAX_SEATS_PER_BUS) {
      if (!confirm(`Увага! На рейсі ${crewName} вже зайнято ${occupiedSeats} з ${MAX_SEATS_PER_BUS} місць. Все одно скопіювати?`)) {
        return;
      }
    }

    try {
      setSavingCellId(booking.id);
      const copyPayload = {
        bus_date: booking.bus_date || selectedDate,
        date: booking.bus_date || selectedDate,
        departure_time: booking.departure_time || '06:20',
        passenger_name: booking.passenger_name || booking.name || 'Пасажир',
        name: booking.passenger_name || booking.name || 'Пасажир',
        passenger_phone: booking.passenger_phone || booking.phone || '',
        phone: booking.passenger_phone || booking.phone || '',
        bus_from: booking.bus_from || booking.from || 'Східниця',
        from: booking.bus_from || booking.from || 'Східниця',
        bus_to: booking.bus_to || booking.to || 'Львів',
        to: booking.bus_to || booking.to || 'Львів',
        seats: seatsToCopy,
        price: Number(booking.price) || 0,
        pickup_location: booking.pickup_location || booking.comment || '',
        crew: booking.crew || activeTab,
        status: booking.status || 'підтверджено',
        driver_name: booking.driver_name || null,
        driver_id: booking.driver_id || null,
        updated_by: adminName
      };

      const created = await apiClient.createBooking(copyPayload);

      setBookings(prev => {
        const targetIdx = prev.findIndex(b => b.id === booking.id);
        if (targetIdx === -1) return [created, ...prev];
        const next = [...prev];
        next.splice(targetIdx + 1, 0, created);
        return next;
      });

      showToast('Бронювання успішно скопійовано!', 'success');
    } catch (err) {
      console.error('Помилка копіювання бронювання:', err);
      showToast('Помилка копіювання', 'error');
    } finally {
      setSavingCellId(null);
    }
  };

  // ⚡ Призначення 1 кліком одного водія на ВСІ замовлення екіпажу/рейсу
  const handleAssignDriverToCrew = async (driverId: string) => {
    if (!driverId) return;
    const driver = drivers.find(d => d.id === driverId || d.name === driverId);
    if (!driver) return;

    const crewBookings = filteredBookings;
    if (crewBookings.length === 0) {
      showToast(`Немає замовлень на рейсі ${activeTab}`, 'error');
      return;
    }

    setIsLoading(true);
    try {
      try {
        await apiClient.createSchedule({
          date: selectedDate,
          crew_name: activeTab,
          driver_id: driver.id,
          driver_name: driver.name
        });
      } catch (e) {
        console.warn('Розклад для водія вже існує або оновлено');
      }

      await Promise.all(
        crewBookings.map(b => 
          apiClient.updateBooking(b.id, { 
            driver_name: driver.name,
            driver_id: driver.id,
            updated_by: adminName 
          }).catch(err => console.error(err))
        )
      );

      driverService.saveAssignment({
        id: `asg_${Date.now()}`,
        date: selectedDate,
        crew: activeTab,
        driver_id: driver.id,
        driver_name: driver.name,
        car: ''
      });

      setBookings(prev => prev.map(b => {
        const isCrewMatch = activeTab === 'всі' || normalizeCrewName(b.crew) === normalizeCrewName(activeTab);
        if (isCrewMatch) {
          return { ...b, driver_name: driver.name, driver_id: driver.id };
        }
        return b;
      }));

      showToast(`Водія ${driver.name} успішно призначено на всі замовлення рейсу ${activeTab}!`, 'success');
    } catch (err) {
      console.error('Помилка масового призначення:', err);
      showToast('Помилка призначення водія на рейс', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Водії
  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setDriverError('');

    if (!newDriverName || !newDriverPhone || !newDriverPin) {
      setDriverError('Заповніть всі поля');
      return;
    }

    try {
      const added = await driverService.addDriver(newDriverName, newDriverPhone, newDriverPin);
      setDrivers(prev => [...prev, added]);
      setNewDriverName('');
      setNewDriverPhone('');
      setNewDriverPin('');
      showToast('Водія успішно додано', 'success');
    } catch (err: any) {
      setDriverError(err.message || 'Помилка додавання водія');
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!confirm('Видалити цього водія?')) return;
    try {
      await driverService.deleteDriver(id);
      setDrivers(prev => prev.filter(d => d.id !== id));
      showToast('Водія видалено', 'success');
    } catch (err) {
      showToast('Помилка видалення водія', 'error');
    }
  };

  const totalSeatsCount = filteredBookings.reduce((sum, b) => sum + (Number(b.seats) || 1), 0);
  const totalRevenue = filteredBookings.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  return (
    <div className="min-h-screen bg-brand-dark text-gray-100 flex flex-col font-sans select-none">
      
      {/* 1. Верхня панель */}
      <header className="bg-brand-surface border-b border-brand-border shadow-md sticky top-0 z-30">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-brand-yellow text-brand-dark px-3.5 py-2 rounded-lg font-bold text-sm shadow">
              <FileSpreadsheet size={18} />
              <span>Диспетчерська Таблиця</span>
            </div>
            <span className="text-xs text-brand-muted font-mono hidden sm:inline">
              Диспетчер: <strong className="text-brand-yellow">{adminName}</strong>
            </span>
          </div>

          {/* Вибір дати */}
          <div className="flex items-center gap-2 bg-brand-dark/90 p-1.5 rounded-lg border border-brand-border">
            <CalendarIcon size={16} className="text-brand-yellow ml-2" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent text-white text-xs font-bold font-mono focus:outline-none cursor-pointer"
            />
            <button
              onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                selectedDate === new Date().toISOString().split('T')[0] 
                  ? 'bg-brand-yellow text-brand-dark' 
                  : 'bg-brand-card text-brand-muted hover:text-white'
              }`}
            >
              Сьогодні
            </button>
            <button
              onClick={() => {
                const tmr = new Date();
                tmr.setDate(tmr.getDate() + 1);
                setSelectedDate(tmr.toISOString().split('T')[0]);
              }}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
                selectedDate === new Date(Date.now() + 86400000).toISOString().split('T')[0]
                  ? 'bg-brand-yellow text-brand-dark'
                  : 'bg-brand-card text-brand-muted hover:text-white'
              }`}
            >
              Завтра
            </button>
          </div>

          {/* Пошук & Показники */}
          <div className="flex items-center gap-3">
            <div className="relative w-48 sm:w-64">
              <Search size={14} className="absolute left-3 top-3 text-brand-muted" />
              <input
                type="text"
                placeholder="Пошук пасажира, тел..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-brand-dark border border-brand-border text-xs rounded-lg pl-9 pr-3 py-2 text-white placeholder-brand-muted focus:outline-none focus:border-brand-yellow"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-brand-muted hover:text-white">
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="hidden lg:flex items-center gap-3 text-xs bg-brand-dark/90 px-3.5 py-2 rounded-lg border border-brand-border font-mono">
              <div>Місць: <span className="text-brand-yellow font-bold text-sm">{totalSeatsCount}</span></div>
              <div className="text-brand-border">|</div>
              <div>Сума: <span className="text-brand-gold font-bold text-sm">{totalRevenue} грн</span></div>
            </div>

            {onLogout && (
              <button
                onClick={onLogout}
                className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 px-3.5 py-2 rounded-lg transition-colors font-bold"
              >
                Вийти
              </button>
            )}
          </div>
        </div>

        {/* 2. Таби Екіпажів */}
        <div className="max-w-[1920px] mx-auto px-4 flex items-center justify-between gap-2 overflow-x-auto border-t border-brand-border/60 scrollbar-none pt-1.5">
          <div className="flex items-center gap-1.5">
            {CREW_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3.5 py-2 rounded-t-lg text-xs font-bold transition-all flex items-center gap-1.5 border-b-2 ${
                  activeTab === tab
                    ? 'bg-brand-dark text-brand-yellow border-brand-yellow shadow'
                    : 'bg-brand-card/60 text-brand-muted border-transparent hover:bg-brand-card hover:text-white'
                }`}
              >
                {tab === 'водії' ? (
                  <>
                    <Users size={14} />
                    <span>Водії</span>
                  </>
                ) : tab === 'звіт' ? (
                  <>
                    <BarChart2 size={14} />
                    <span>Звіт</span>
                  </>
                ) : (
                  <>
                    <Clock size={13} />
                    <span>{tab === 'всі' ? 'Всі рейс' : `Рейс ${tab}`}</span>
                  </>
                )}
              </button>
            ))}
          </div>

          {activeTab !== 'водії' && activeTab !== 'звіт' && (
            <div className="flex items-center gap-1 text-[11px] bg-brand-dark/80 p-1 rounded border border-brand-border/60 my-1">
              <button
                onClick={() => setDirectionFilter('all')}
                className={`px-2.5 py-1 rounded transition-colors ${directionFilter === 'all' ? 'bg-brand-yellow text-brand-dark font-bold' : 'text-brand-muted hover:text-white'}`}
              >
                Всі напрямки
              </button>
              <button
                onClick={() => setDirectionFilter('skhidnytsia_lviv')}
                className={`px-2.5 py-1 rounded transition-colors ${directionFilter === 'skhidnytsia_lviv' ? 'bg-brand-yellow text-brand-dark font-bold' : 'text-brand-muted hover:text-white'}`}
              >
                Східниця → Львів
              </button>
              <button
                onClick={() => setDirectionFilter('lviv_skhidnytsia')}
                className={`px-2.5 py-1 rounded transition-colors ${directionFilter === 'lviv_skhidnytsia' ? 'bg-brand-yellow text-brand-dark font-bold' : 'text-brand-muted hover:text-white'}`}
              >
                Львів → Східниця
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Тост */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-lg shadow-xl text-xs font-bold flex items-center gap-2 border ${
              notification.type === 'success' ? 'bg-emerald-900/90 text-emerald-200 border-emerald-500' : 'bg-red-900/90 text-red-200 border-red-500'
            }`}
          >
            {notification.type === 'success' ? <Check size={16} /> : <AlertCircle size={16} />}
            <span>{notification.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Головна область */}
      <main className="flex-1 max-w-[1920px] w-full mx-auto p-3 sm:p-4 overflow-x-auto">
        
        {/* ВОДІЇ */}
        {activeTab === 'водії' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-brand-surface p-5 rounded-xl border border-brand-border shadow-lg">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Users className="text-brand-yellow" size={18} />
                <span>Додати нового водія компанії</span>
              </h3>
              <form onSubmit={handleAddDriver} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Ім'я водія *"
                  value={newDriverName}
                  onChange={e => setNewDriverName(e.target.value)}
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-xs text-white placeholder-brand-muted focus:border-brand-yellow focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="Телефон (+380...) *"
                  value={newDriverPhone}
                  onChange={e => setNewDriverPhone(e.target.value)}
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-xs text-white placeholder-brand-muted focus:border-brand-yellow focus:outline-none"
                  required
                />
                <input
                  type="text"
                  placeholder="PIN код (4 цифри) *"
                  value={newDriverPin}
                  onChange={e => setNewDriverPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  className="bg-brand-dark border border-brand-border rounded-lg px-3 py-2 text-xs text-white font-mono text-center placeholder-brand-muted focus:border-brand-yellow focus:outline-none"
                  maxLength={4}
                  required
                />
                <button
                  type="submit"
                  className="sm:col-span-3 bg-brand-yellow hover:bg-brand-gold text-brand-dark font-bold text-xs py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>Зберегти водія</span>
                </button>
              </form>
              {driverError && <div className="text-red-400 text-xs mt-2">{driverError}</div>}
            </div>

            <div className="bg-brand-surface p-5 rounded-xl border border-brand-border shadow-lg">
              <h3 className="text-base font-bold text-white mb-4">Зареєстровані водії ({drivers.length})</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {drivers.map(driver => (
                  <div key={driver.id} className="bg-brand-dark border border-brand-border p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{driver.name}</div>
                      <div className="text-xs text-brand-muted font-mono">{driver.phone}</div>
                      <div className="text-[10px] text-brand-yellow font-mono mt-0.5">PIN: {driver.pin_code || '****'}</div>
                    </div>
                    <button
                      onClick={() => handleDeleteDriver(driver.id)}
                      className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ЗВІТ */}
        {activeTab === 'звіт' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-brand-surface p-6 rounded-xl border border-brand-border shadow-lg">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BarChart2 className="text-brand-yellow" size={20} />
                <span>Звіт за замовленнями ({selectedDate})</span>
              </h3>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-brand-dark p-4 rounded-lg border border-brand-border">
                  <div className="text-xs text-brand-muted uppercase font-semibold">Всього пасажирів</div>
                  <div className="text-2xl font-bold text-brand-yellow font-mono mt-1">{totalSeatsCount}</div>
                </div>
                <div className="bg-brand-dark p-4 rounded-lg border border-brand-border">
                  <div className="text-xs text-brand-muted uppercase font-semibold">Загальна каса</div>
                  <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{totalRevenue} грн</div>
                </div>
                <div className="bg-brand-dark p-4 rounded-lg border border-brand-border">
                  <div className="text-xs text-brand-muted uppercase font-semibold">Всього бронювань</div>
                  <div className="text-2xl font-bold text-blue-400 font-mono mt-1">{filteredBookings.length}</div>
                </div>
                <div className="bg-brand-dark p-4 rounded-lg border border-brand-border">
                  <div className="text-xs text-brand-muted uppercase font-semibold">Завершено</div>
                  <div className="text-2xl font-bold text-purple-400 font-mono mt-1">
                    {filteredBookings.filter(b => b.status === 'завершено').length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ГОЛОВНА ТАБЛИЦЯ ІЗ СЕКЦІЯМИ ДЛЯ КОЖНОЇ ГОДИНИ/РЕЙСУ */}
        {activeTab !== 'водії' && activeTab !== 'звіт' && (
          <div className="bg-brand-surface rounded-xl border border-brand-border shadow-2xl overflow-hidden">
            
            <div className="bg-brand-dark/90 px-4 py-2.5 border-b border-brand-border flex flex-wrap items-center justify-between text-xs text-brand-muted gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-brand-yellow animate-pulse" />
                <span className="font-bold text-white text-xs">Інтерактивна Таблиця (Розділена по годинах):</span>
                <span>Клікніть у будь-яке поле для введення. Зміни зберігаються моментально!</span>
              </div>

              {/* ⚡ 1-КЛИК ПРИЗНАЧЕННЯ ВОДІЯ НА ВЕСЬ РЕЙС */}
              {activeTab !== 'всі' && (
                <div className="flex items-center gap-2 bg-brand-card/90 px-3 py-1 rounded-lg border border-brand-border">
                  <User size={14} className="text-brand-yellow" />
                  <span className="text-[11px] font-bold text-white">Водій на рейс {activeTab}:</span>
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        handleAssignDriverToCrew(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="bg-brand-dark border border-brand-border text-xs rounded px-2.5 py-1 text-brand-yellow font-bold focus:outline-none cursor-pointer hover:bg-brand-surface transition-colors"
                  >
                    <option value="">⚡ Призначити водія на рейс {activeTab} (1 клік)...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id} className="bg-brand-dark text-white font-medium">
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="font-mono text-[11px] text-brand-yellow bg-brand-yellow/10 border border-brand-yellow/30 px-2.5 py-0.5 rounded font-bold">
                Синхронізація з водієм: ⚡ LIVE
              </div>
            </div>

            <div className="overflow-x-auto max-h-[calc(100vh-220px)] scrollbar-thin scrollbar-thumb-brand-border">
              <table className="w-full text-left border-collapse text-xs font-sans">
                
                <thead className="bg-brand-card text-gray-300 font-semibold sticky top-0 z-20 shadow-md uppercase text-[11px] tracking-wider select-none border-b border-brand-border">
                  <tr>
                    <th className="py-3.5 px-3 border-r border-brand-border text-center w-12">№</th>
                    <th className="py-3.5 px-3 border-r border-brand-border w-28">Час / Рейс</th>
                    <th className="py-3.5 px-3 border-r border-brand-border w-48">ПІБ Пасажира</th>
                    <th className="py-3.5 px-3 border-r border-brand-border w-40">Телефон</th>
                    <th className="py-3.5 px-3 border-r border-brand-border w-44">Звідки</th>
                    <th className="py-3.5 px-3 border-r border-brand-border w-44">Куди</th>
                    <th className="py-3.5 px-3 border-r border-brand-border text-center w-20">Місць</th>
                    <th className="py-3.5 px-3 border-r border-brand-border w-40">Водій</th>
                    <th className="py-3.5 px-3 border-r border-brand-border min-w-[200px]">Примітка / Адреса</th>
                    <th className="py-3.5 px-3 text-center w-20">Дії</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-brand-border/90 bg-brand-dark text-gray-200">
                  
                  {isLoading ? (
                    <tr>
                      <td colSpan={10} className="py-16 text-center text-brand-muted">
                        <RefreshCw size={28} className="animate-spin mx-auto mb-3 text-brand-yellow" />
                        <span className="text-sm font-medium">Завантаження таблиці...</span>
                      </td>
                    </tr>
                  ) : (
                    <>
                      {groupedTimeSections.map((secGroup) => {
                        const secDraft = sectionDrafts[secGroup.time] || {
                          tempId: `draft_${secGroup.time}`,
                          departure_time: secGroup.time,
                          passenger_name: '',
                          passenger_phone: '',
                          bus_from: secGroup.defaultFrom,
                          bus_to: secGroup.defaultTo,
                          seats: 1,
                          price: 350,
                          pickup_location: '',
                          crew: activeTab === 'всі' ? '06:20' : activeTab,
                          status: 'підтверджено',
                          driver_name: '',
                          comment: ''
                        };

                        const secSeatsTotal = secGroup.bookings.reduce((sum, b) => sum + (Number(b.seats) || 1), 0);

                        return (
                          <React.Fragment key={`sec_${secGroup.time}`}>
                            
                            {/* РЯДОК-РОЗДІЛИТЕЛЬ ГОДИНИ/РЕЙСУ (ЯК У GOOGLE ТАБЛИЦЯХ) */}
                            <tr className="bg-brand-yellow/15 border-y-2 border-brand-yellow/40">
                              <td colSpan={10} className="py-2 px-4 text-xs font-mono font-bold text-brand-yellow bg-brand-yellow/10">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-brand-yellow" />
                                    <span className="text-sm uppercase tracking-wider text-white font-extrabold">
                                      {secGroup.label}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-brand-muted font-normal font-sans">
                                    Занято місць: <strong className="text-brand-yellow font-bold text-xs">{secSeatsTotal}</strong> / 12 | Бронювань: <strong className="text-white font-bold">{secGroup.bookings.length}</strong>
                                  </div>
                                </div>
                              </td>
                            </tr>

                            {/* Замовлення цієї години */}
                            {secGroup.bookings.map((b, bIdx) => (
                              <tr 
                                key={b.id} 
                                className="hover:bg-brand-surface/90 transition-colors group border-b border-brand-border/70 font-sans"
                              >
                                <td className="py-2.5 px-2 text-center border-r border-brand-border/60 text-brand-muted font-mono text-xs bg-brand-surface/40 font-semibold">
                                  {bIdx + 1}
                                </td>

                                {/* Час */}
                                <td className="py-2 px-2 border-r border-brand-border/60">
                                  <select
                                    value={b.departure_time || secGroup.time}
                                    onChange={e => handleCellUpdate(b.id, 'departure_time', e.target.value)}
                                    className="w-full bg-transparent hover:bg-brand-card focus:bg-brand-surface border border-transparent focus:border-brand-yellow rounded-md px-2 py-1.5 text-xs font-mono font-bold text-brand-yellow focus:outline-none cursor-pointer"
                                  >
                                    {ALL_TIMES.map(t => (
                                      <option key={t} value={t} className="bg-brand-dark text-white">{t}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* ПІБ Пасажира */}
                                <td className="py-2 px-2 border-r border-brand-border/60">
                                  <input
                                    type="text"
                                    defaultValue={b.passenger_name || b.name || ''}
                                    onBlur={e => {
                                      if (e.target.value !== (b.passenger_name || b.name)) {
                                        handleCellUpdate(b.id, 'passenger_name', e.target.value);
                                      }
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') e.currentTarget.blur();
                                    }}
                                    placeholder="Ім'я..."
                                    className="w-full bg-transparent hover:bg-brand-card focus:bg-brand-surface border border-transparent focus:border-brand-yellow rounded-md px-2.5 py-1.5 text-xs font-medium text-white placeholder-brand-muted focus:outline-none"
                                  />
                                </td>

                                {/* Телефон */}
                                <td className="py-2 px-2 border-r border-brand-border/60">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      defaultValue={b.passenger_phone || b.phone || ''}
                                      onBlur={e => {
                                        if (e.target.value !== (b.passenger_phone || b.phone)) {
                                          handleCellUpdate(b.id, 'passenger_phone', e.target.value);
                                        }
                                      }}
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') e.currentTarget.blur();
                                      }}
                                      placeholder="+380..."
                                      className="w-full bg-transparent hover:bg-brand-card focus:bg-brand-surface border border-transparent focus:border-brand-yellow rounded-md px-2 py-1.5 text-xs font-mono text-gray-200 placeholder-brand-muted focus:outline-none"
                                    />
                                    {(b.passenger_phone || b.phone) && (
                                      <a 
                                        href={`tel:${b.passenger_phone || b.phone}`}
                                        title="Дзвінок" 
                                        className="text-brand-muted hover:text-brand-yellow p-1 rounded transition-colors"
                                      >
                                        <PhoneCall size={14} />
                                      </a>
                                    )}
                                  </div>
                                </td>

                                {/* Звідки */}
                                <td className="py-2 px-2 border-r border-brand-border/60">
                                  <input
                                    type="text"
                                    defaultValue={b.bus_from || b.from || ''}
                                    onBlur={e => {
                                      if (e.target.value !== (b.bus_from || b.from)) {
                                        handleCellUpdate(b.id, 'bus_from', e.target.value);
                                      }
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') e.currentTarget.blur();
                                    }}
                                    placeholder="Звідки..."
                                    className="w-full bg-transparent hover:bg-brand-card focus:bg-brand-surface border border-transparent focus:border-brand-yellow rounded-md px-2.5 py-1.5 text-xs text-gray-200 placeholder-brand-muted focus:outline-none"
                                  />
                                </td>

                                {/* Куди */}
                                <td className="py-2 px-2 border-r border-brand-border/60">
                                  <input
                                    type="text"
                                    defaultValue={b.bus_to || b.to || ''}
                                    onBlur={e => {
                                      if (e.target.value !== (b.bus_to || b.to)) {
                                        handleCellUpdate(b.id, 'bus_to', e.target.value);
                                      }
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') e.currentTarget.blur();
                                    }}
                                    placeholder="Куди..."
                                    className="w-full bg-transparent hover:bg-brand-card focus:bg-brand-surface border border-transparent focus:border-brand-yellow rounded-md px-2.5 py-1.5 text-xs text-gray-200 placeholder-brand-muted focus:outline-none"
                                  />
                                </td>

                                {/* Місць */}
                                <td className="py-2 px-2 border-r border-brand-border/60 text-center">
                                  <input
                                    type="number"
                                    min={1}
                                    max={20}
                                    defaultValue={b.seats || 1}
                                    onBlur={e => {
                                      const val = parseInt(e.target.value) || 1;
                                      if (val !== b.seats) {
                                        handleCellUpdate(b.id, 'seats', val);
                                      }
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') e.currentTarget.blur();
                                    }}
                                    className="w-full bg-transparent hover:bg-brand-card focus:bg-brand-surface border border-transparent focus:border-brand-yellow rounded-md text-center py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                                  />
                                </td>

                                {/* Водій */}
                                <td className="py-2 px-2 border-r border-brand-border/60">
                                  <select
                                    value={b.driver_name || ''}
                                    onChange={e => handleCellUpdate(b.id, 'driver_name', e.target.value)}
                                    className="w-full bg-transparent hover:bg-brand-card focus:bg-brand-surface border border-transparent focus:border-brand-yellow rounded-md px-2 py-1.5 text-xs text-gray-200 focus:outline-none cursor-pointer"
                                  >
                                    <option value="" className="bg-brand-dark text-brand-muted">Не призначено</option>
                                    {drivers.map(d => (
                                      <option key={d.id} value={d.name} className="bg-brand-dark text-white">{d.name}</option>
                                    ))}
                                  </select>
                                </td>

                                {/* Примітка / Адреса */}
                                <td className="py-2 px-2 border-r border-brand-border/60">
                                  <input
                                    type="text"
                                    defaultValue={b.pickup_location || b.comment || ''}
                                    onBlur={e => {
                                      if (e.target.value !== (b.pickup_location || b.comment)) {
                                        handleCellUpdate(b.id, 'pickup_location', e.target.value);
                                      }
                                    }}
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') e.currentTarget.blur();
                                    }}
                                    placeholder="Адреса / примітка..."
                                    className="w-full bg-transparent hover:bg-brand-card focus:bg-brand-surface border border-transparent focus:border-brand-yellow rounded-md px-2.5 py-1.5 text-xs text-brand-muted placeholder-gray-700 focus:outline-none"
                                  />
                                </td>

                                {/* Дії */}
                                <td className="py-2 px-2 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      onClick={() => handleCopyBooking(b)}
                                      title="Скопіювати бронювання"
                                      className="text-brand-muted hover:text-brand-yellow p-1.5 rounded-md hover:bg-brand-yellow/10 transition-colors opacity-60 group-hover:opacity-100"
                                    >
                                      <Copy size={15} />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteBooking(b.id)}
                                      title="Видалити рядок"
                                      className="text-brand-muted hover:text-red-400 p-1.5 rounded-md hover:bg-red-500/10 transition-colors opacity-60 group-hover:opacity-100"
                                    >
                                      <Trash2 size={15} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}

                            {/* ВІЛЬНИЙ РЯДОК ДЛЯ ДОДАВАННЯ ПРЯМО В ЦЮ ГОДИНУ */}
                            <tr className="bg-brand-yellow/5 hover:bg-brand-yellow/10 transition-colors border-b border-brand-border/60 font-sans">
                              <td className="py-2.5 px-2 text-center border-r border-brand-border/60 text-brand-yellow/70 font-mono text-xs bg-brand-yellow/10 font-bold">
                                +
                              </td>

                              {/* Час */}
                              <td className="py-2 px-2 border-r border-brand-border/60">
                                <span className="text-xs font-mono font-bold text-brand-yellow px-2 py-1">
                                  {secGroup.time}
                                </span>
                              </td>

                              {/* ПІБ Пасажира */}
                              <td className="py-2 px-2 border-r border-brand-border/60">
                                <input
                                  type="text"
                                  value={secDraft.passenger_name}
                                  onChange={e => handleSectionDraftChange(secGroup.time, 'passenger_name', e.target.value)}
                                  onBlur={() => handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo);
                                  }}
                                  placeholder={`+ Додати у рейс ${secGroup.time}...`}
                                  className="w-full bg-transparent border border-dashed border-brand-border/80 focus:border-brand-yellow rounded-md px-2.5 py-1.5 text-xs text-white placeholder-brand-muted focus:outline-none"
                                />
                              </td>

                              {/* Телефон */}
                              <td className="py-2 px-2 border-r border-brand-border/60">
                                <input
                                  type="text"
                                  value={secDraft.passenger_phone}
                                  onChange={e => handleSectionDraftChange(secGroup.time, 'passenger_phone', e.target.value)}
                                  onBlur={() => handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo);
                                  }}
                                  placeholder="+380..."
                                  className="w-full bg-transparent border border-dashed border-brand-border/80 focus:border-brand-yellow rounded-md px-2 py-1.5 text-xs font-mono text-gray-300 placeholder-brand-muted focus:outline-none"
                                />
                              </td>

                              {/* Звідки */}
                              <td className="py-2 px-2 border-r border-brand-border/60">
                                <input
                                  type="text"
                                  value={secDraft.bus_from}
                                  onChange={e => handleSectionDraftChange(secGroup.time, 'bus_from', e.target.value)}
                                  onBlur={() => handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo);
                                  }}
                                  placeholder="Звідки..."
                                  className="w-full bg-transparent border border-dashed border-brand-border/80 focus:border-brand-yellow rounded-md px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
                                />
                              </td>

                              {/* Куди */}
                              <td className="py-2 px-2 border-r border-brand-border/60">
                                <input
                                  type="text"
                                  value={secDraft.bus_to}
                                  onChange={e => handleSectionDraftChange(secGroup.time, 'bus_to', e.target.value)}
                                  onBlur={() => handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo);
                                  }}
                                  placeholder="Куди..."
                                  className="w-full bg-transparent border border-dashed border-brand-border/80 focus:border-brand-yellow rounded-md px-2.5 py-1.5 text-xs text-gray-300 focus:outline-none"
                                />
                              </td>

                              {/* Місць */}
                              <td className="py-2 px-2 border-r border-brand-border/60 text-center">
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={secDraft.seats}
                                  onChange={e => handleSectionDraftChange(secGroup.time, 'seats', parseInt(e.target.value) || 1)}
                                  onBlur={() => handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo);
                                  }}
                                  className="w-full bg-transparent border border-dashed border-brand-border/80 focus:border-brand-yellow rounded-md text-center py-1.5 text-xs font-mono font-bold text-white focus:outline-none"
                                />
                              </td>

                              {/* Водій */}
                              <td className="py-2 px-2 border-r border-brand-border/60">
                                <select
                                  value={secDraft.driver_name}
                                  onChange={e => handleSectionDraftChange(secGroup.time, 'driver_name', e.target.value)}
                                  onBlur={() => handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo)}
                                  className="w-full bg-transparent border border-dashed border-brand-border/80 focus:border-brand-yellow rounded-md px-2 py-1.5 text-xs text-brand-muted focus:outline-none"
                                >
                                  <option value="" className="bg-brand-dark text-brand-muted">Водій...</option>
                                  {drivers.map(d => (
                                    <option key={d.id} value={d.name} className="bg-brand-dark text-white">{d.name}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Примітка */}
                              <td className="py-2 px-2 border-r border-brand-border/60">
                                <input
                                  type="text"
                                  value={secDraft.pickup_location}
                                  onChange={e => handleSectionDraftChange(secGroup.time, 'pickup_location', e.target.value)}
                                  onBlur={() => handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSectionDraftBlur(secGroup.time, secGroup.defaultFrom, secGroup.defaultTo);
                                  }}
                                  placeholder="Адреса / примітка..."
                                  className="w-full bg-transparent border border-dashed border-brand-border/80 focus:border-brand-yellow rounded-md px-2.5 py-1.5 text-xs text-brand-muted placeholder-gray-700 focus:outline-none"
                                />
                              </td>

                              {/* Дії */}
                              <td className="py-2 px-2 text-center text-xs text-brand-yellow/60 font-mono">
                                нов.
                              </td>
                            </tr>
                          </React.Fragment>
                        );
                      })}
                    </>
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-brand-card px-4 py-2.5 border-t border-brand-border flex flex-wrap items-center justify-between text-xs text-brand-muted font-mono">
              <div>
                Показано бронювань: <strong className="text-white">{filteredBookings.length}</strong>
              </div>
              <div className="flex items-center gap-4">
                <span>Екіпаж: <strong className="text-brand-yellow">{activeTab}</strong></span>
                <span>Напрямок: <strong className="text-brand-yellow">{directionFilter === 'all' ? 'Всі' : directionFilter}</strong></span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
