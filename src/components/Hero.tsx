import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown } from 'lucide-react';
import { CONTACTS } from '../data/routes';

interface HeroProps {
  onBookNow: () => void;
}

export default function Hero({ onBookNow }: HeroProps) {
  const stats = [
    { label: 'Роки роботи', value: '5+' },
    { label: 'Задоволених клієнтів', value: '10k+' },
    { label: 'Безпечних рейсів', value: '99%' },
  ];


  return (
    <section className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-dark to-brand-surface" />
      
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-brand-yellow/8 rounded-full blur-2xl pointer-events-none" />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #F5A623 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-brand-yellow/10 border border-brand-yellow/30 rounded-full px-4 py-2 mb-6"
            >
              <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse" />
              <span className="text-brand-yellow text-sm font-medium">Щоденні рейси</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="font-display font-bold text-4xl md:text-5xl lg:text-6xl text-white leading-tight mb-4"
            >
              Комфортні
              <br />
              <span className="gradient-text">пасажирські</span>
              <br />
              перевезення
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-brand-light text-lg leading-relaxed mb-8"
            >
              Щоденні пасажирські перевезення сучасними мікроавтобусами.
              <br />
              <span className="text-brand-muted text-base italic opacity-80">MB Sprinter та VW Crafter · Клімат-контроль · Wi-Fi</span>
            </motion.p>

            {/* NEW: Prominent Route Card at the Top */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mb-8 relative"
            >
              <div className="card p-6 md:p-8 bg-brand-surface/40 backdrop-blur-xl border-brand-yellow/20 shadow-2xl relative overflow-hidden group">
                {/* Decorative glow */}
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-yellow/10 rounded-full blur-3xl group-hover:bg-brand-yellow/20 transition-colors duration-700" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse" />
                      <div className="text-brand-muted text-[10px] uppercase tracking-[0.2em] font-black">
                        Маршрут сьогодні
                      </div>
                    </div>
                    <div className="bg-brand-yellow/10 px-3 py-1 rounded-full border border-brand-yellow/20">
                      <span className="text-brand-yellow text-[10px] font-bold uppercase tracking-tighter">Live Розклад</span>
                    </div>
                  </div>
                  
                  {/* Horizontal Route Visualization for Desktop, Vertical for Mobile */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative">
                    {/* Background Line */}
                    <div className="absolute left-[7px] sm:left-0 sm:top-[7px] w-0.5 h-full sm:w-full sm:h-0.5 bg-brand-border -z-10" />
                    
                    {['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'].map((stop, idx, arr) => (
                      <div key={stop} className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 flex-1 group/stop">
                        <div className={`w-4 h-4 rounded-full border-2 z-10 transition-all duration-300 ${
                          idx === 0 || idx === arr.length - 1
                            ? 'bg-brand-yellow border-brand-yellow shadow-brand scale-110'
                            : 'bg-brand-dark border-brand-border group-hover/stop:border-brand-yellow'
                        }`} />
                        <div className="flex flex-col sm:items-center">
                          <div className={`font-display font-black text-xs sm:text-[11px] uppercase tracking-tighter ${
                            idx === 0 || idx === arr.length - 1 ? 'text-brand-yellow' : 'text-white/90'
                          }`}>
                            {stop}
                          </div>
                          {idx < arr.length - 1 && (
                            <div className="text-[9px] font-bold text-brand-muted opacity-60 sm:mt-1">
                              {idx === 0 ? '~25 хв' : idx === 1 ? '~10 хв' : idx === 2 ? '~8 хв' : '~15 хв'}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-10 pt-6 border-t border-brand-border/50 flex flex-wrap justify-between items-end gap-6">
                    <div className="flex gap-8">
                      <div>
                        <div className="text-brand-muted text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">Ціна від</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-brand-yellow font-display font-black text-3xl">50</span>
                          <span className="text-brand-yellow text-sm font-bold uppercase">грн</span>
                        </div>
                      </div>
                      <div>
                        <div className="text-brand-muted text-[10px] uppercase font-bold tracking-widest mb-1 opacity-50">Наступний рейс</div>
                        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
                          <span className="text-white font-display font-black text-xl">
                            {(() => {
                              const now = new Date();
                              const times = ['05:50','06:20','07:10','08:15','08:50','09:30','10:35','11:10','12:00','12:40','13:20','14:10','15:30','16:20','17:00','17:40'];
                              const currentMins = now.getHours() * 60 + now.getMinutes();
                              const next = times.find(t => {
                                const [h, m] = t.split(':').map(Number);
                                return h * 60 + m > currentMins;
                              });
                              return next || '05:50';
                            })()}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={onBookNow}
                      className="btn-primary px-8 py-4 text-dark font-black flex items-center gap-3 group/btn shadow-brand-lg"
                    >
                      ЗАБРОНЮВАТИ ЗАРАЗ
                      <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"
            >
              {stats.map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-brand-yellow font-display font-extrabold text-xl">{value}</span>
                  <span className="text-brand-muted text-[10px] uppercase tracking-tighter">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right Column: Modern Sprinter Badge */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:flex justify-center"
          >
            <div className="relative group">
               <div className="absolute inset-0 bg-brand-yellow/5 rounded-full blur-3xl group-hover:bg-brand-yellow/10 transition-colors duration-1000" />
               <div className="relative z-10 card p-1 scale-110 border-brand-yellow/20 overflow-hidden rotate-2 group-hover:rotate-0 transition-transform duration-700">
                  <div className="bg-brand-dark p-6 rounded-[14px]">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-48 h-32 bg-brand-surface/40 rounded-xl flex items-center justify-center border border-white/5">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-24 h-24 text-brand-yellow/40">
                          <path d="M3 9l2-2h14l2 2" />
                          <path d="M5 7L3 18h18l-2-11" />
                          <circle cx="7" cy="18" r="2" />
                          <circle cx="17" cy="18" r="2" />
                        </svg>
                      </div>
                      <div className="text-center">
                        <div className="text-brand-yellow font-display font-black text-lg">VIP ПЕРЕВЕЗЕННЯ</div>
                        <div className="text-brand-muted text-xs">MB Sprinter 2024</div>
                      </div>
                    </div>
                  </div>
               </div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-brand-muted text-xs">Гортайте вниз</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronDown size={20} className="text-brand-yellow" />
          </motion.div>
        </motion.div>
      </div>

    </section>
  );
}
