import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Phone, Plus, RefreshCw, X, Calendar as CalendarIcon, Clock, Edit2, Trash2, Check, PhoneCall, BarChart2, Users, Key } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { driverService } from '../../lib/driverService';
import type { DriverProfile, DriverAssignment } from '../../lib/driverService';

const CREW_TABS = ['05:50', '06:20', '07:10', '08:50', '09:30', '10:35', '12:40', 'водії', 'звіт'];

const VALID_TIMES = [
  '05:50', '06:20', '07:10', '08:10', '08:50', '09:00', '09:30', 
  '10:15', '10:35', '11:10', '11:50', '12:00', '12:20', '12:40', 
  '13:10', '13:20', '14:10', '14:50', '15:30', '16:10', '16:20', 
  '17:00', '17:40', '18:20', '19:20', '20:00', '20:40'
].sort();

const LOCATIONS = ['Львів', 'Східниця', 'Трускавець', 'Борислав', 'Стебник'];

// Мапінг часу до екіпажу
const getCrewByTime = (time: string) => {
  const mapping: Record<string, string> = {
    '05:50': '05:50', '08:10': '05:50', '11:10': '05:50', '14:10': '05:50',
    '06:20': '06:20', '09:00': '06:20', '12:00': '06:20', '14:50': '06:20',
    '07:10': '07:10', '10:15': '07:10', '13:20': '07:10', '16:10': '07:10',
    '08:50': '08:50', '11:50': '08:50', '15:30': '08:50', '18:20': '08:50',
    '09:30': '09:30', '12:20': '09:30', '16:20': '09:30', '19:20': '09:30',
    '10:35': '10:35', '13:10': '10:35', '17:00': '10:35', '20:00': '10:35',
    '12:40': '12:40', '15:30': '12:40', '17:40': '12:40', '20:40': '12:40'
  };
  return mapping[time] || '';
};

// Хелпери для дат
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

export default function DispatcherPanel({ onLogout }: { onLogout?: () => void }) {
  const [bookings, setBookings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDateUA, setSelectedDateUA] = useState(new Date().toLocaleDateString('uk-UA'));
  const [activeTab, setActiveTab] = useState('05:50');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBooking, setEditingBooking] = useState<any>(null);
  
  // Форма нової броні
  const [newBooking, setNewBooking] = useState({
    name: '',
    phone: '+380',
    from: 'Львів',
    to: 'Східниця',
    pickup_location: '',
    date: getTodayISO(), // Зберігаємо в ISO для інпуту
    departure_time: '05:50',
    seats: 1,
    price: 350,
    crew: '05:50',
    status: 'active'
  });

  const fetchBookings = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('date', selectedDateUA)
      .order('departure_time', { ascending: true });
      
    if (error) {
      console.error('Помилка завантаження:', error);
    } else {
      setBookings(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchBookings();

    const channel = supabase
      .channel('dispatcher-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDateUA]);

  const handleAddBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const crew = getCrewByTime(newBooking.departure_time);
    const payload = { 
      ...newBooking, 
      crew,
      date: formatDateToUA(newBooking.date) // Конвертуємо в ДД.ММ.РРРР для бази
    };

    const { error } = await supabase
      .from('bookings')
      .insert([payload]);

    if (error) {
      alert('Помилка додавання: ' + error.message);
    } else {
      setShowAddModal(false);
      setNewBooking({
        name: '',
        phone: '+380',
        from: 'Львів',
        to: 'Східниця',
        pickup_location: '',
        date: getTodayISO(),
        departure_time: activeTab === 'звіт' || activeTab === 'водії' ? '05:50' : activeTab,
        seats: 1,
        price: 350,
        crew: activeTab === 'звіт' || activeTab === 'водії' ? '05:50' : activeTab,
        status: 'active'
      });
      fetchBookings();
    }
  };

  const handleUpdateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const crew = getCrewByTime(editingBooking.departure_time);
    const payload = { 
      ...editingBooking, 
      crew,
      date: editingBooking.date.includes('-') ? formatDateToUA(editingBooking.date) : editingBooking.date
    };

    const { error } = await supabase
      .from('bookings')
      .update(payload)
      .eq('id', editingBooking.id);

    if (error) {
      alert('Помилка оновлення: ' + error.message);
    } else {
      setEditingBooking(null);
      fetchBookings();
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (window.confirm('Ви впевнені, що хочете видалити це бронювання?')) {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);

      if (error) {
        alert('Помилка видалення: ' + error.message);
      } else {
        fetchBookings();
      }
    }
  };

  const setDay = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setSelectedDateUA(d.toLocaleDateString('uk-UA'));
  };

  const handlePhoneChange = (val: string, setter: (v: any) => void, obj: any) => {
    // Не дозволяємо видалити +380
    if (!val.startsWith('+380')) {
      setter({ ...obj, phone: '+380' });
      return;
    }
    setter({ ...obj, phone: val });
  };

  // Групуємо броні за часом для поточного екіпажу
  const groupedBookings: Record<string, any[]> = {};
  bookings.forEach(b => {
    if (b.crew === activeTab) {
      const key = b.departure_time;
      if (!groupedBookings[key]) groupedBookings[key] = [];
      groupedBookings[key].push(b);
    }
  });

  // Розрахунок звіту
  const totalPassengers = bookings.reduce((sum, b) => sum + (b.seats || 0), 0);
  const totalSum = bookings.reduce((sum, b) => sum + (b.price || 0), 0);
  const crewBreakdown: Record<string, { passengers: number, sum: number }> = {};
  
  bookings.forEach(b => {
    const crew = b.crew || 'Не визначено';
    if (!crewBreakdown[crew]) crewBreakdown[crew] = { passengers: 0, sum: 0 };
    crewBreakdown[crew].passengers += (b.seats || 0);
    crewBreakdown[crew].sum += (b.price || 0);
  });

  return (
    <div className="min-h-screen bg-brand-dark p-4 md:p-8 flex flex-col">
      <div className="max-w-6xl mx-auto w-full flex-1 flex flex-col space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-black text-white">Панель Диспетчера</h1>
            <p className="text-brand-muted text-sm">Керування бронюваннями (Google Sheets Style)</p>
          </div>
          
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button 
              onClick={() => {
                setNewBooking({...newBooking, date: getTodayISO(), crew: activeTab === 'звіт' || activeTab === 'водії' ? '05:50' : activeTab, departure_time: activeTab === 'звіт' || activeTab === 'водії' ? '05:50' : activeTab});
                setShowAddModal(true);
              }}
              className="btn-primary flex items-center gap-2 px-5 py-2.5 shadow-brand text-dark font-bold"
            >
              <Plus size={18} />
              Додати бронь
            </button>
            
            {onLogout && (
              <button 
                onClick={onLogout}
                className="bg-brand-surface border border-brand-border hover:bg-brand-surface/80 text-white flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold transition-colors"
              >
                Вийти
              </button>
            )}
          </div>
        </div>

        {/* Дата */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button 
            onClick={() => setDay(0)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedDateUA === new Date().toLocaleDateString('uk-UA') ? 'bg-brand-yellow text-brand-dark' : 'bg-brand-surface text-white border border-brand-border'}`}
          >
            Сьогодні
          </button>
          <button 
            onClick={() => setDay(1)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${selectedDateUA === new Date(Date.now() + 86400000).toLocaleDateString('uk-UA') ? 'bg-brand-yellow text-brand-dark' : 'bg-brand-surface text-white border border-brand-border'}`}
          >
            Завтра
          </button>
          <div className="relative">
            <input 
              type="text" 
              value={selectedDateUA}
              onChange={(e) => setSelectedDateUA(e.target.value)}
              className="bg-brand-surface border border-brand-border rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-brand-yellow w-32"
              placeholder="ДД.ММ.РРРР"
            />
          </div>
        </div>

        {/* Основний контент (Таблиці або Звіт) */}
        <div className="flex-1 bg-brand-surface border border-brand-border rounded-2xl overflow-hidden flex flex-col">
          
          {/* Контент */}
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
            {activeTab === 'водії' ? (
              <DriversSubPanel selectedDateUA={selectedDateUA} />
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
                  <table className="w-full text-left">
                    <thead className="text-brand-muted text-xs uppercase bg-brand-surface">
                      <tr>
                        <th className="px-4 py-2">Екіпаж</th>
                        <th className="px-4 py-2">Пасажирів</th>
                        <th className="px-4 py-2">Каса</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-white divide-y divide-brand-border">
                      {Object.keys(crewBreakdown).map(crew => (
                        <tr key={crew} className="hover:bg-brand-surface/50">
                          <td className="px-4 py-3 font-bold text-brand-yellow">{crew}</td>
                          <td className="px-4 py-3">{crewBreakdown[crew].passengers}</td>
                          <td className="px-4 py-3 text-green-500">{crewBreakdown[crew].sum} грн</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              // Вигляд Таблиць
              Object.keys(groupedBookings).length === 0 ? (
                <div className="text-center text-brand-muted py-10">
                  Немає бронювань для цього екіпажу на цей день
                </div>
              ) : (
                Object.keys(groupedBookings).sort().map(time => (
                  <div key={time} className="space-y-2">
                    <div className="bg-brand-dark px-4 py-2 rounded-lg border border-brand-yellow/20 flex justify-between items-center">
                      <span className="font-display font-black text-brand-yellow text-lg">{time}</span>
                      <span className="text-xs text-brand-muted uppercase font-bold">Рейс</span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="text-brand-muted text-xs uppercase tracking-wider">
                          <tr className="border-b border-brand-border">
                            <th className="px-4 py-2 font-medium w-10">№</th>
                            <th className="px-4 py-2 font-medium">Клієнт</th>
                            <th className="px-4 py-2 font-medium">Маршрут</th>
                            <th className="px-4 py-2 font-medium">Телефон</th>
                            <th className="px-4 py-2 font-medium">Зупинка</th>
                            <th className="px-4 py-2 font-medium">Дії</th>
                          </tr>
                        </thead>
                        <tbody className="text-sm text-white divide-y divide-brand-border/50">
                          {groupedBookings[time].map((booking, idx) => (
                            <tr key={booking.id} className="hover:bg-brand-yellow/5 transition-colors">
                              <td className="px-4 py-3 text-brand-muted font-mono">{idx + 1}.</td>
                              <td className="px-4 py-3 font-medium">{booking.name} ({booking.seats} м.)</td>
                              <td className="px-4 py-3 text-xs">{booking.from} → {booking.to}</td>
                              <td className="px-4 py-3 font-mono">{booking.phone}</td>
                              <td className="px-4 py-3 text-xs text-brand-muted">{booking.pickup_location || '-'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <a href={`tel:${booking.phone}`} className="text-green-500 hover:text-green-400 p-1">
                                    <PhoneCall size={16} />
                                  </a>
                                  <button 
                                    onClick={() => {
                                      // Конвертуємо дату для інпуту
                                      const isoDate = formatDateToISO(booking.date);
                                      setEditingBooking({...booking, date: isoDate});
                                    }}
                                    className="text-brand-yellow hover:text-brand-gold p-1"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteBooking(booking.id)}
                                    className="text-red-500 hover:text-red-400 p-1"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )
            )}
          </div>

          {/* Таби знизу (як в Екселі) */}
          <div className="bg-brand-dark border-t border-brand-border flex overflow-x-auto no-scrollbar">
            {CREW_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-3 text-sm font-bold transition-all border-r border-brand-border flex-shrink-0
                  ${activeTab === tab 
                    ? 'bg-brand-surface text-brand-yellow border-t-2 border-t-brand-yellow' 
                    : 'text-brand-muted hover:text-white hover:bg-brand-surface/50'
                  }
                  ${tab === 'звіт' || tab === 'водії' ? 'bg-brand-yellow/5' : ''}
                `}
              >
                {tab === 'звіт' ? '📊 Звіт' : tab === 'водії' ? '👥 Водії' : tab}
              </button>
            ))}
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
                    <select 
                      value={newBooking.from}
                      onChange={e => setNewBooking({...newBooking, from: e.target.value})}
                      className="input-field h-11 bg-brand-surface"
                    >
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs mb-1 block">Куди</label>
                    <select 
                      value={newBooking.to}
                      onChange={e => setNewBooking({...newBooking, to: e.target.value})}
                      className="input-field h-11 bg-brand-surface"
                    >
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
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
                      {VALID_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
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
                    value={newBooking.pickup_location}
                    onChange={e => setNewBooking({...newBooking, pickup_location: e.target.value})}
                    className="input-field h-11"
                    placeholder="Напр. Готель Тустань"
                  />
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
                    <select 
                      value={editingBooking.from}
                      onChange={e => setEditingBooking({...editingBooking, from: e.target.value})}
                      className="input-field h-11 bg-brand-surface"
                    >
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="label text-xs mb-1 block">Куди</label>
                    <select 
                      value={editingBooking.to}
                      onChange={e => setEditingBooking({...editingBooking, to: e.target.value})}
                      className="input-field h-11 bg-brand-surface"
                    >
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
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
                      {VALID_TIMES.map(t => <option key={t} value={t}>{t}</option>)}
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
                    value={editingBooking.pickup_location || ''}
                    onChange={e => setEditingBooking({...editingBooking, pickup_location: e.target.value})}
                    className="input-field h-11"
                  />
                </div>

                <button type="submit" className="btn-primary w-full py-3 text-dark font-bold shadow-brand mt-2">
                  Зберегти зміни
                </button>
              </form>
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
}

function DriversSubPanel({ selectedDateUA }: DriversSubPanelProps) {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [assignments, setAssignments] = useState<DriverAssignment[]>([]);
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
      const [driversData, assignmentsData] = await Promise.all([
        driverService.getDrivers(),
        driverService.getAssignments(selectedDateUA)
      ]);
      setDrivers(driversData);
      setAssignments(assignmentsData);
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
    if (!val.startsWith('+380')) {
      setNewDriverPhone('+380');
      return;
    }
    setNewDriverPhone(val);
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
    } catch (err) {
      console.error(err);
      setAddDriverError('Помилка при додаванні водія.');
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

  const handleAssignChange = async (crew: string, driverId: string) => {
    setSavingCrews(prev => ({ ...prev, [crew]: true }));
    try {
      await driverService.assignDriver(driverId ? driverId : null, crew, selectedDateUA);
      const updatedAssignments = await driverService.getAssignments(selectedDateUA);
      setAssignments(updatedAssignments);
    } catch (err) {
      console.error(err);
      alert('Помилка при призначенні водія.');
    } finally {
      setSavingCrews(prev => ({ ...prev, [crew]: false }));
    }
  };

  const ACTIVE_CREWS = ['05:50', '06:20', '07:10', '08:50', '09:30', '10:35', '12:40'];

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
              {ACTIVE_CREWS.map(crew => {
                const assignment = assignments.find(a => a.crew === crew);
                const currentDriverId = assignment ? assignment.driver_id : '';
                const isSaving = savingCrews[crew];

                return (
                  <div key={crew} className="flex justify-between items-center p-3 rounded-lg bg-brand-surface border border-brand-border hover:border-brand-yellow/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="text-xl font-display font-black text-brand-yellow w-16">{crew}</div>
                      <div className="text-xs text-brand-muted uppercase font-bold">Екіпаж</div>
                    </div>

                    <div className="flex items-center gap-2 min-w-[200px]">
                      {isSaving ? (
                        <RefreshCw size={16} className="animate-spin text-brand-yellow mr-2" />
                      ) : currentDriverId ? (
                        <span className="text-green-500 text-xs font-bold mr-1">✓ Призначено</span>
                      ) : null}
                      
                      <select
                        value={currentDriverId}
                        onChange={(e) => handleAssignChange(crew, e.target.value)}
                        className="bg-brand-dark border border-brand-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-brand-yellow w-full"
                      >
                        <option value="">-- Не призначено --</option>
                        {drivers.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.pin_code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Керування водіями */}
        <div className="bg-brand-dark p-6 rounded-xl border border-brand-border flex flex-col space-y-6">
          <div className="border-b border-brand-border pb-3">
            <h3 className="font-display font-black text-white text-lg">Список водіїв</h3>
          </div>

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
                    <button
                      onClick={() => handleDeleteDriver(d.id)}
                      type="button"
                      className="text-red-500 hover:text-red-400 p-1 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
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
