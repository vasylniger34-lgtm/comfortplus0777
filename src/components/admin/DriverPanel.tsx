import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Clock, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { driverService } from '../../lib/driverService';

interface DriverPanelProps {
  driver?: {
    id: string;
    name: string;
    phone: string;
    pin_code: string;
  } | null;
  onLogout?: () => void;
}

const getUADateString = (dateObj: Date) => {
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}.${m}.${y}`;
};

export default function DriverPanel({ driver, onLogout }: DriverPanelProps) {
  const [rides, setRides] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(getUADateString(new Date()));
  const [selectedCrew, setSelectedCrew] = useState('06:20');
  const [assignedCar, setAssignedCar] = useState<string | null>(null);
  const [assignedCrews, setAssignedCrews] = useState<string[]>([]);

  const fetchRides = async () => {
    setIsLoading(true);
    
    try {
      // 1. Отримуємо призначені екіпажі для цього водія на selectedDate
      const allAssignments = await driverService.getAssignments(selectedDate);
      const myAssignments = allAssignments.filter(a => a.driver_id === driver?.id);
      const myCrews = myAssignments.map(a => a.crew);
      
      setAssignedCrews(myCrews);

      if (myCrews.length > 0) {
        let activeCrew = selectedCrew;
        // Якщо обраний екіпаж не є серед призначених екіпажів, ставимо перший призначений
        if (!myCrews.includes(selectedCrew)) {
          activeCrew = myCrews[0];
          setSelectedCrew(myCrews[0]);
        }
        
        // Знаходимо авто для цього екіпажу
        const assignment = myAssignments.find(a => a.crew === activeCrew);
        setAssignedCar(assignment?.car || null);

        // Fetch bookings for this crew
        const data = await apiClient.getBookings({ date: selectedDate, crew: activeCrew });
        const activeBookings = data.filter((b: any) => b.status === 'active');
        
        // Групуємо броні за часом, щоб водій бачив рейс
        const grouped: Record<string, any> = {};
        
        activeBookings.forEach((booking: any) => {
          const key = booking.departure_time;
          if (!grouped[key]) {
            grouped[key] = {
              time: key,
              route: `${booking.from || booking.bus_from} → ${booking.to || booking.bus_to}`,
              passengers: []
            };
          }
          grouped[key].passengers.push({
            name: booking.passenger_name || booking.name,
            phone: booking.passenger_phone || booking.phone,
            seats: booking.seats,
            pickup_location: booking.pickup_location
          });
        });
        
        setRides(Object.values(grouped));
      } else {
        // Якщо немає призначень для цього водія на цей день
        setAssignedCar(null);
        setRides([]);
      }
    } catch (error) {
      console.error('Помилка завантаження рейсів:', error);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    fetchRides();

    // Підписка на реалтайм оновлення через сокети
    apiClient.socket.on('bookings_changed', fetchRides);
    apiClient.socket.on('assignments_changed', fetchRides);

    return () => {
      apiClient.socket.off('bookings_changed', fetchRides);
      apiClient.socket.off('assignments_changed', fetchRides);
    };
  }, [selectedDate, selectedCrew]);

  const setDay = (offset: number) => {
    const d = new Date();
    // parse selectedDate
    const [dayPart, monthPart, yearPart] = selectedDate.split('.');
    const currentSelected = new Date(parseInt(yearPart), parseInt(monthPart) - 1, parseInt(dayPart));
    currentSelected.setDate(currentSelected.getDate() + offset);
    setSelectedDate(getUADateString(currentSelected));
  };

  return (
    <div className="min-h-screen bg-brand-dark p-4 pb-20">
      <div className="max-w-md mx-auto space-y-6">
        {/* Заголовок та вибір екіпажу */}
        <div className="flex justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-display font-black text-white">Панель Водія</h1>
              {onLogout && (
                <button onClick={onLogout} className="text-red-500 hover:text-red-400 text-[10px] uppercase tracking-wider font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                  Вийти
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-brand-muted text-xs">{driver?.name || 'Рейси'}</span>
              {assignedCar && (
                <span className="text-[10px] text-brand-yellow font-bold bg-brand-yellow/10 px-2 py-0.5 rounded border border-brand-yellow/20 font-mono">
                  Авто: {assignedCar}
                </span>
              )}
            </div>
          </div>
          
          {assignedCrews.length > 0 && (
            assignedCrews.length > 1 ? (
              <select 
                value={selectedCrew}
                onChange={(e) => setSelectedCrew(e.target.value)}
                className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-yellow font-bold focus:outline-none focus:border-brand-yellow"
              >
                {assignedCrews.map(crew => (
                  <option key={crew} value={crew}>{crew}</option>
                ))}
              </select>
            ) : (
              <div className="bg-brand-surface border border-brand-border rounded-xl px-3 py-2 text-sm text-brand-yellow font-bold">
                Екіпаж: {selectedCrew}
              </div>
            )
          )}
        </div>

        {/* Фільтр по днях (простий скрол або стрілочки) */}
        <div className="flex justify-between items-center bg-brand-surface p-2 rounded-xl border border-brand-border">
          <button onClick={() => setDay(-1)} className="text-brand-muted hover:text-white p-1">
            <ChevronLeft size={20} />
          </button>
          <div className="text-white font-bold text-sm">
            {selectedDate === getUADateString(new Date()) ? 'Сьогодні' : selectedDate}
          </div>
          <button onClick={() => setDay(1)} className="text-brand-muted hover:text-white p-1">
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Список рейсів */}
        <div className="space-y-4">
          {isLoading && rides.length === 0 ? (
            <div className="text-center text-brand-muted py-10 flex flex-col items-center gap-2">
              <RefreshCw size={24} className="animate-spin text-brand-yellow" />
              <span>Завантаження рейсів...</span>
            </div>
          ) : assignedCrews.length === 0 ? (
            <div className="text-center text-brand-muted py-10 bg-brand-surface/50 rounded-2xl border border-dashed border-brand-border">
              На цей день у вас немає призначених рейсів
            </div>
          ) : rides.length === 0 ? (
            <div className="text-center text-brand-muted py-10 bg-brand-surface/50 rounded-2xl border border-dashed border-brand-border">
              На цей день рейсів для {selectedCrew} немає
            </div>
          ) : rides.map((ride, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card border-brand-yellow/10 overflow-hidden shadow-brand-lg"
            >
              {/* Заголовок рейсу */}
              <div className="bg-brand-surface p-4 border-b border-brand-border flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-display font-black text-brand-yellow">{ride.time}</div>
                  <div>
                    <div className="text-sm font-bold text-white">{ride.route}</div>
                    <div className="text-xs text-brand-muted flex items-center gap-2 flex-wrap mt-0.5">
                      <span className="flex items-center gap-1"><Clock size={10} /> Рейс</span>
                      {assignedCar && (
                        <>
                          <span className="h-2 w-px bg-brand-border" />
                          <span className="text-[10px] text-brand-yellow font-bold bg-brand-yellow/10 px-1.5 py-0.5 rounded border border-brand-yellow/20 font-mono uppercase">
                            Авто: {assignedCar}
                          </span>
                        </>
                      )}
                      {driver?.name && (
                        <>
                          <span className="h-2 w-px bg-brand-border" />
                          <span className="text-[10px] text-white font-bold bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded">
                            Водій: {driver.name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-xs uppercase font-black text-brand-muted bg-brand-dark/50 px-2 py-1 rounded">
                  {ride.passengers.length} пас.
                </div>
              </div>

              {/* Список пасажирів */}
              <div className="p-4 space-y-4">
                {ride.passengers.map((passenger: any, pIdx: number) => (
                  <div key={pIdx} className="flex justify-between items-start gap-4 text-sm pb-4 border-b border-brand-border last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-1">
                        {passenger.name} 
                        <span className="text-brand-yellow text-xs">({passenger.seats} місць)</span>
                      </div>
                      <div className="text-brand-muted flex items-center gap-1 text-xs">
                        <MapPin size={12} />
                        Посадка: {passenger.pickup_location || 'Не вказано'}
                      </div>
                    </div>
                    
                    <a 
                      href={`tel:${passenger.phone}`}
                      className="bg-brand-yellow text-brand-dark p-3 rounded-full hover:scale-105 transition-transform shadow-brand flex-shrink-0"
                    >
                      <Phone size={16} />
                    </a>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
