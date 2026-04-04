import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date) => void;
}

const DAYS = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
const MONTHS = [
  'Січень', 'Лютий', 'Березень', 'Квітень', 'Травень', 'Червень',
  'Липень', 'Серпень', 'Вересень', 'Жовтень', 'Листопад', 'Грудень'
];

export default function DatePicker({ value, onChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() - 1);
      return d;
    });
  };

  const nextMonth = () => {
    setViewDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + 1);
      return d;
    });
  };

  const formatValue = () => {
    if (!value) return 'Оберіть дату';
    return value.toLocaleDateString('uk-UA', {
      weekday: 'short',
      day: 'numeric',
      month: 'long',
    });
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  let firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  // Convert Sunday (0) to be last (6) for European week starting Monday
  firstDay = firstDay === 0 ? 6 : firstDay - 1;

  const dayLabels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];

  // Quick select options
  const quickOptions = [
    { label: 'Сьогодні', offset: 0 },
    { label: 'Завтра', offset: 1 },
    { label: 'Післязавтра', offset: 2 },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`input-field flex items-center gap-3 text-left w-full cursor-pointer ${
          value ? 'text-white' : 'text-brand-muted'
        }`}
      >
        <Calendar size={18} className="text-brand-yellow flex-shrink-0" />
        <span className="flex-1">{formatValue()}</span>
        {value && (
          <span className="text-brand-yellow text-xs font-medium">
            {value.toLocaleDateString('uk-UA', { weekday: 'long' }).charAt(0).toUpperCase() + 
             value.toLocaleDateString('uk-UA', { weekday: 'long' }).slice(1)}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="absolute top-full left-0 right-0 mt-2 z-50 card p-4 shadow-card-hover"
          >
            {/* Quick select */}
            <div className="flex gap-2 mb-4">
              {quickOptions.map(({ label, offset }) => {
                const d = new Date(today);
                d.setDate(d.getDate() + offset);
                const isSelected = value &&
                  value.getDate() === d.getDate() &&
                  value.getMonth() === d.getMonth() &&
                  value.getFullYear() === d.getFullYear();
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => { onChange(d); setIsOpen(false); }}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? 'bg-brand-yellow text-brand-dark'
                        : 'bg-brand-surface text-brand-light hover:bg-brand-yellow/10 hover:text-brand-yellow border border-brand-border'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Month header */}
            <div className="flex items-center justify-between mb-4">
              <button
                type="button"
                onClick={prevMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-surface text-brand-light hover:text-brand-yellow transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-white font-semibold text-sm">
                {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={nextMonth}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-surface text-brand-light hover:text-brand-yellow transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {dayLabels.map(d => (
                <div key={d} className="text-center text-brand-muted text-xs py-1 font-medium">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                const isToday = date.getTime() === today.getTime();
                const isPast = date < today;
                const isSelected = value &&
                  value.getDate() === day &&
                  value.getMonth() === viewDate.getMonth() &&
                  value.getFullYear() === viewDate.getFullYear();

                return (
                  <button
                    key={day}
                    type="button"
                    disabled={isPast}
                    onClick={() => { onChange(date); setIsOpen(false); }}
                    className={`
                      h-9 w-full rounded-lg text-sm font-medium transition-all duration-150
                      ${isPast ? 'text-brand-border cursor-not-allowed' : 'cursor-pointer'}
                      ${isSelected ? 'bg-brand-yellow text-brand-dark shadow-brand' : ''}
                      ${!isSelected && !isPast && isToday ? 'text-brand-yellow border border-brand-yellow/50' : ''}
                      ${!isSelected && !isPast && !isToday ? 'text-brand-light hover:bg-brand-yellow/10 hover:text-brand-yellow' : ''}
                    `}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
