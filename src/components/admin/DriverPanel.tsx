import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Clock, User, RefreshCw, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import { apiClient } from '../../lib/apiClient';
import { getCarDetails } from '../../data/routes';
import { normalizeTime, normalizeCrewName } from '../../utils/normalize';

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

const SKHIDNYTSIA_TO_LVIV_ORDER = ['skhidnytsia', 'boryslav', 'truskavets', 'stebnik', 'lviv'];
const LVIV_TO_SKHIDNYTSIA_ORDER = ['lviv', 'stebnik', 'truskavets', 'boryslav', 'skhidnytsia'];

const ROUTE_LVIV_TO_SKHIDNYTSIA = ['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'];
const ROUTE_SKHIDNYTSIA_TO_LVIV = ['Східниця', 'Борислав', 'Трускавець', 'Стебник', 'Львів'];

const STOP_NAMES: Record<string, string> = {
  'lviv': 'Львів',
  'stebnik': 'Стебник',
  'truskavets': 'Трускавець',
  'boryslav': 'Борислав',
  'skhidnytsia': 'Східниця'
};

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

const isLvivDeparture = (time: string): boolean => {
  const cleanTime = normalizeTime(time);
  const lvivTimes = ['09:00', '10:15', '11:10', '12:20', '13:10', '14:10', '14:50', '16:10', '18:20', '19:20', '20:00', '20:40'];
  return lvivTimes.includes(cleanTime);
};

const getRunDirectionForTime = (schedule: any, time: string): boolean => {
  const cleanTime = normalizeTime(time);
  if (schedule) {
    const lvivRuns = [
      schedule.run2_time,
      schedule.run4_time,
      schedule.run6_time,
      schedule.run8_time,
      schedule.run10_time
    ].map(r => normalizeTime(r));
    if (lvivRuns.includes(cleanTime)) {
      return true;
    }
    const skhidRuns = [
      schedule.run1_time,
      schedule.run3_time,
      schedule.run5_time,
      schedule.run7_time,
      schedule.run9_time
    ].map(r => normalizeTime(r));
    if (skhidRuns.includes(cleanTime)) {
      return false;
    }
  }
  return isLvivDeparture(cleanTime);
};

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

    // Try to find a block of consecutive seats that can accommodate the whole booking
    let blockStartIdx = -1;
    outer: for (let startIdx = 0; startIdx <= totalSeats - requestedSeats; startIdx++) {
      // Check each seat in the potential block
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
          continue outer; // this block is not suitable
        }
      }
      blockStartIdx = startIdx;
      break outer;
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
      // 1. Отримуємо призначені екіпажі для цього водія з розкладу та бронювань
      const [schedules, allBookings] = await Promise.all([
        apiClient.getSchedules(selectedDate).catch(() => []),
        apiClient.getBookings({ date: selectedDate }).catch(() => [])
      ]);

      const driverNameClean = (driver?.name || '').trim().toLowerCase();
      const isMyDriver = (dName: string | null | undefined, dId: string | null | undefined) => {
        if (dId && driver?.id && dId === driver.id) return true;
        if (dName && driverNameClean) {
          const clean = dName.trim().toLowerCase();
          return clean === driverNameClean || clean.includes(driverNameClean) || driverNameClean.includes(clean);
        }
        return false;
      };

      const myAssignments = schedules
        .filter((s: any) => isMyDriver(s.driver_name, s.driver_id))
        .map((s: any) => ({
          id: s.id,
          date: s.date,
          crew: normalizeCrewName(s.crew_name || s.crew),
          driver_id: s.driver_id,
          car: s.car,
          rawSchedule: s
        }));

      const myCrewsFromSchedules = myAssignments.map(a => a.crew);
      const myCrewsFromBookings = allBookings
        .filter((b: any) => isMyDriver(b.driver_name, b.driver_id))
        .map((b: any) => normalizeCrewName(b.crew));

      let myCrews = Array.from(new Set([...myCrewsFromSchedules, ...myCrewsFromBookings]));
      
      // Якщо призначеного екіпажу немає, але є замовлення для водія, збираємо всі їхні екіпажі
      if (myCrews.length === 0) {
        const fallbackCrews = allBookings
          .filter((b: any) => isMyDriver(b.driver_name, b.driver_id))
          .map((b: any) => normalizeCrewName(b.crew));
        myCrews = Array.from(new Set(fallbackCrews));
      }

      setAssignedCrews(myCrews);

      let activeCrew = normalizeCrewName(selectedCrew);
      // Формуємо список замовлень водія
      let targetBookings: any[] = [];
      let assignment: any = null;

      if (myCrews.length > 0) {
        let activeCrew = normalizeCrewName(selectedCrew);
        if (!myCrews.includes(activeCrew)) {
          activeCrew = myCrews[0];
          setSelectedCrew(myCrews[0]);
        }
        
        assignment = myAssignments.find(a => a.crew === activeCrew);
        setAssignedCar(assignment?.car || null);

        const data = await apiClient.getBookings({ date: selectedDate, crew: activeCrew });
        targetBookings = data.filter((b: any) => 
          b.status !== 'скасовано' && b.status !== 'cancelled' &&
          (isMyDriver(b.driver_name, b.driver_id) || (activeCrew && normalizeCrewName(b.crew) === activeCrew))
        );
      } else {
        setAssignedCar(null);
        targetBookings = allBookings.filter((b: any) => 
          b.status !== 'скасовано' && b.status !== 'cancelled' && isMyDriver(b.driver_name, b.driver_id)
        );
      }

      if (targetBookings.length > 0) {
        const grouped: Record<string, any> = {};
        
        targetBookings.forEach((booking: any) => {
          const key = normalizeTime(booking.departure_time);
          if (!grouped[key]) {
            const isLviv = getRunDirectionForTime(assignment?.rawSchedule, key);
            grouped[key] = {
              time: key,
              route: isLviv ? 'Львів → Східниця' : 'Східниця → Львів',
              bookings: [],
              passengerCount: 0
            };
          }
          grouped[key].bookings.push(booking);
          grouped[key].passengerCount += (booking.seats || 0);
        });
        
        const carDetails = getCarDetails(assignment?.car || '');
        const totalSeats = carDetails ? carDetails.seats : 12;

        Object.keys(grouped).forEach(timeKey => {
          const isLviv = getRunDirectionForTime(assignment?.rawSchedule, timeKey);
          const { seats, backupBookings } = allocateSeatSlots(grouped[timeKey].bookings, isLviv, totalSeats);
          grouped[timeKey].seats = seats;
          grouped[timeKey].backupBookings = backupBookings;
        });
        
        setRides(Object.values(grouped));
      } else {
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
                  {ride.passengerCount} пас.
                </div>
              </div>

              {/* Список пасажирів по місцях */}
              <div className="p-4 space-y-3">
                {ride.seats.filter((s: any) => s.bookings.length > 0).map((seat: any) => {
                  return (
                    <div key={`seat-${seat.number}`} className="bg-brand-surface/40 border border-brand-border/40 rounded-2xl overflow-hidden divide-y divide-brand-border/20">
                      <div className="flex items-center gap-2 py-2 px-4 bg-brand-yellow/[0.03] border-b border-brand-border/30 text-xs font-bold text-brand-yellow">
                        <span className="font-mono bg-brand-yellow/10 px-1.5 py-0.5 rounded text-[10px]">Місце {seat.number}</span>
                      </div>
                      <div className="p-4 space-y-4">
                        {seat.bookings.map((b: any, bIdx: number) => {
                          const fromId = getStopId(b.bus_from || b.from);
                          const toId = getStopId(b.bus_to || b.to);
                          return (
                            <div key={`${b.id}-${bIdx}`} className="flex justify-between items-start gap-4 text-sm pb-4 last:pb-0 border-b border-brand-border/20 last:border-b-0">
                              <div className="space-y-1.5">
                                <div className="font-bold text-white flex items-center gap-1.5">
                                  <span>{b.passenger_name || b.name}</span>
                                  {b.totalSeats > 1 && (
                                    <span className="text-[10px] text-brand-muted font-normal bg-brand-surface border border-brand-border px-1.5 py-0.5 rounded">
                                      пас. {b.seatSubIndex}/{b.totalSeats}
                                    </span>
                                  )}
                                </div>
                                <div className="text-brand-muted text-xs flex flex-col gap-1.5">
                                  <div className="flex items-center gap-1 text-white/95 font-semibold text-[11px]">
                                    <span>{STOP_NAMES[fromId] || b.bus_from || b.from}</span>
                                    <span className="text-brand-yellow px-1">→</span>
                                    <span>{STOP_NAMES[toId] || b.bus_to || b.to}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-brand-muted">
                                    <MapPin size={12} className="text-brand-yellow flex-shrink-0" />
                                    <span>
                                      Посадка: {b.pickup_location || 'Не вказано'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-brand-muted mt-0.5">
                                    <CreditCard size={12} className="text-brand-yellow flex-shrink-0" />
                                    {(b.is_paid_online === 1 || (b.is_paid_online !== 0 && (b.updated_by === 'Клієнт' || !b.updated_by || b.updated_by === 'Client'))) ? (
                                      <span className="text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] uppercase tracking-wide">
                                        Оплачено
                                      </span>
                                    ) : (
                                      <span>
                                        Оплата:{' '}
                                        <span className="text-white font-bold font-mono">
                                          {b.price} грн{b.totalSeats > 1 ? ` (за ${b.totalSeats} міс.)` : ''}
                                        </span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              
                              <a 
                                href={`tel:${b.passenger_phone || b.phone}`}
                                className="bg-brand-yellow text-brand-dark p-3 rounded-full hover:scale-105 transition-transform shadow-brand flex-shrink-0"
                              >
                                <Phone size={15} />
                              </a>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Резервні місця */}
                {ride.backupBookings.length > 0 && (
                  <div className="mt-4 p-4 bg-red-950/20 border border-red-500/20 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center border-b border-red-500/10 pb-2">
                      <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                        ⚠️ Резервні місця ({ride.backupBookings.reduce((sum: number, b: any) => sum + (b.seats || 0), 0)}м)
                      </h4>
                      <span className="text-[9px] text-red-400/80 italic">Поза 12 місцями</span>
                    </div>
                    <div className="space-y-4 divide-y divide-red-500/10">
                      {ride.backupBookings.map((b: any, bIdx: number) => {
                        const fromId = getStopId(b.bus_from || b.from);
                        const toId = getStopId(b.bus_to || b.to);
                        return (
                          <div key={`${b.id}-${bIdx}`} className={`pt-3 first:pt-0 flex justify-between items-start gap-3 text-sm`}>
                            <div className="space-y-1.5">
                              <div className="font-bold text-white flex items-center gap-1.5">
                                <span>{b.passenger_name || b.name}</span>
                                <span className="text-[10px] text-red-400 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded font-mono">
                                  Резерв ({b.seats}м)
                                </span>
                              </div>
                              <div className="text-brand-muted text-xs flex flex-col gap-1.5">
                                <div className="flex items-center gap-1 text-white/95 font-semibold text-[11px]">
                                  <span>{STOP_NAMES[fromId] || b.bus_from || b.from}</span>
                                  <span className="text-brand-yellow px-1">→</span>
                                  <span>{STOP_NAMES[toId] || b.bus_to || b.to}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-brand-muted">
                                  <MapPin size={12} className="text-brand-yellow flex-shrink-0" />
                                  <span>Посадка: {b.pickup_location || 'Не вказано'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-brand-muted mt-0.5">
                                  <CreditCard size={12} className="text-brand-yellow flex-shrink-0" />
                                  {(b.is_paid_online === 1 || (b.is_paid_online !== 0 && (b.updated_by === 'Клієнт' || !b.updated_by || b.updated_by === 'Client'))) ? (
                                    <span className="text-emerald-400 font-bold px-1.5 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] uppercase tracking-wide">
                                      Оплачено
                                    </span>
                                  ) : (
                                    <span>
                                      Оплата:{' '}
                                      <span className="text-white font-bold font-mono">
                                        {b.price} грн{b.seats > 1 ? ` (за ${b.seats} міс.)` : ''}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <a 
                              href={`tel:${b.passenger_phone || b.phone}`}
                              className="bg-red-500 text-white p-3 rounded-full hover:scale-105 transition-transform shadow-lg flex-shrink-0"
                            >
                              <Phone size={15} />
                            </a>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
