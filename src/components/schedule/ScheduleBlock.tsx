import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Clock, ChevronDown } from 'lucide-react';
import { SCHEDULE_SKHIDNYTSIA_TO_LVIV, SCHEDULE_LVIV_TO_SKHIDNYTSIA } from '../../data/schedule';

type Direction = 'skhidnytsia-lviv' | 'lviv-skhidnytsia';

export default function ScheduleBlock() {
  const [direction, setDirection] = useState<Direction>('skhidnytsia-lviv');
  const [expanded, setExpanded] = useState(false);

  const schedule = direction === 'skhidnytsia-lviv'
    ? SCHEDULE_SKHIDNYTSIA_TO_LVIV
    : SCHEDULE_LVIV_TO_SKHIDNYTSIA;

  const displayed = expanded ? schedule : schedule.slice(0, 8);

  const getNowIndex = () => {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return schedule.findIndex(entry => {
      const [h, m] = entry.departure.split(':').map(Number);
      return h * 60 + m > currentMins;
    });
  };

  const nextIndex = getNowIndex();

  return (
    <section id="schedule" className="max-w-6xl mx-auto px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <div className="label mb-3">Щоденні рейси</div>
        <h2 className="section-title mb-3">Розклад маршрутів</h2>
        <p className="text-brand-muted max-w-md mx-auto">
          Відправлення кожні 40–90 хвилин протягом дня
        </p>
      </motion.div>

      {/* Direction toggle */}
      <div className="flex justify-center mb-8">
        <div className="flex bg-brand-surface border border-brand-border rounded-xl p-1 gap-1">
          {[
            { id: 'skhidnytsia-lviv' as Direction, label: 'Східниця → Львів' },
            { id: 'lviv-skhidnytsia' as Direction, label: 'Львів → Східниця' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setDirection(id)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                direction === id
                  ? 'bg-brand-yellow text-brand-dark shadow-brand'
                  : 'text-brand-light hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Route stops visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="mb-8 overflow-x-auto no-scrollbar"
      >
        <div className="flex items-center justify-center gap-0 min-w-max mx-auto px-4">
          {(direction === 'skhidnytsia-lviv'
            ? ['Східниця', 'Борислав', 'Трускавець', 'Стебник', 'Львів']
            : ['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця']
          ).map((stop, i, arr) => (
            <div key={stop} className="flex items-center">
              <div className="flex flex-col items-center">
                <motion.div
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={`w-4 h-4 rounded-full border-2 ${
                    i === 0 || i === arr.length - 1
                      ? 'bg-brand-yellow border-brand-yellow shadow-brand'
                      : 'bg-brand-dark border-brand-yellow/50'
                  }`}
                />
                <span className={`text-xs mt-2 font-medium ${
                  i === 0 || i === arr.length - 1 ? 'text-brand-yellow' : 'text-brand-light'
                }`}>{stop}</span>
              </div>
              {i < arr.length - 1 && (
                <div className="w-16 md:w-24 h-0.5 bg-gradient-to-r from-brand-yellow/60 to-brand-yellow/20 mx-2 -mt-4" />
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Schedule table */}
      <div className="max-w-lg mx-auto">
        <div className="card overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-3 px-6 py-3 border-b border-brand-border bg-brand-surface">
            <div className="text-brand-muted text-xs uppercase tracking-wide font-medium">Відправлення</div>
            <div className="text-brand-muted text-xs uppercase tracking-wide font-medium text-center">
              <ArrowLeftRight size={12} className="inline mr-1" />
              Час
            </div>
            <div className="text-brand-muted text-xs uppercase tracking-wide font-medium text-right">Прибуття</div>
          </div>

          <AnimatePresence>
            {displayed.map((entry, idx) => {
              const isNext = idx === nextIndex;
              const isPast = nextIndex !== -1 && idx < nextIndex;
              return (
                <motion.div
                  key={entry.departure}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className={`grid grid-cols-3 px-6 py-3.5 border-b border-brand-border last:border-0 transition-all
                    ${isNext ? 'bg-brand-yellow/5' : ''}
                    ${isPast ? 'opacity-40' : ''}
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-display font-bold text-lg ${isNext ? 'text-brand-yellow' : isPast ? 'text-brand-muted' : 'text-white'}`}>
                      {entry.departure}
                    </span>
                    {isNext && (
                      <span className="bg-brand-yellow text-brand-dark text-xs font-bold px-2 py-0.5 rounded-full animate-pulse-slow">
                        Зараз
                      </span>
                    )}
                    {entry.isPopular && !isNext && (
                      <span className="bg-brand-yellow/10 text-brand-yellow text-xs px-1.5 py-0.5 rounded-full border border-brand-yellow/20">
                        ★
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center">
                    <div className="flex items-center gap-1 text-brand-muted text-xs">
                      <Clock size={11} />
                      ~2:20
                    </div>
                  </div>
                  <div className={`text-right font-display font-semibold text-base ${isNext ? 'text-brand-yellow' : isPast ? 'text-brand-muted' : 'text-brand-light'}`}>
                    {entry.arrival}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Show more */}
        {schedule.length > 8 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-border text-brand-light hover:text-brand-yellow hover:border-brand-yellow transition-all text-sm font-medium"
          >
            {expanded ? 'Сховати' : `Показати ще ${schedule.length - 8} рейси`}
            <ChevronDown
              size={16}
              className={`transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
            />
          </button>
        )}

        {/* Info */}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="card p-4 text-center">
            <div className="text-brand-yellow font-display font-bold text-2xl">{schedule.length}</div>
            <div className="text-brand-muted text-xs mt-1">рейсів щодня</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-brand-yellow font-display font-bold text-2xl">365</div>
            <div className="text-brand-muted text-xs mt-1">днів на рік</div>
          </div>
        </div>
      </div>
    </section>
  );
}
