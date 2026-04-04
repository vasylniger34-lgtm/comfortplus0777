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
              className="text-brand-light text-lg leading-relaxed mb-6"
            >
              Львів ↔ Стебник ↔ Трускавець ↔ Борислав ↔ Східниця
              <br />
              <span className="text-brand-muted text-base">Mercedes Sprinter · 18 місць · Клімат-контроль</span>
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap gap-3 mb-8"
            >
              <button
                onClick={onBookNow}
                className="btn-primary flex items-center gap-2 text-base"
              >
                Забронювати місце
                <ArrowRight size={18} />
              </button>
              <a
                href={`tel:${CONTACTS.phone1}`}
                className="btn-ghost flex items-center gap-2 text-base"
              >
                Зателефонувати
              </a>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex gap-6"
            >
              {stats.map(({ label, value }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-brand-yellow font-display font-bold text-2xl">{value}</span>
                  <span className="text-brand-muted text-xs">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: Route visualization */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Bus illustration */}
              <div className="card p-8 relative overflow-hidden">
                {/* Shimmer effect */}
                <div className="absolute inset-0 shimmer-bg pointer-events-none rounded-2xl" />
                
                {/* Route stops */}
                <div className="relative z-10">
                  <div className="text-brand-muted text-xs uppercase tracking-widest mb-6 font-medium">
                    Маршрут сьогодні
                  </div>
                  
                  {['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'].map((stop, idx, arr) => (
                    <div key={stop} className="flex items-center gap-4 group hover:bg-brand-dark/50 p-2 -mx-2 rounded-xl cursor-default transition-all duration-300">
                      <div className="flex flex-col items-center">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.5 + idx * 0.1 }}
                          className={`w-4 h-4 rounded-full border-2 transition-all duration-300 group-hover:bg-brand-gold group-hover:border-brand-gold group-hover:shadow-brand ${
                            idx === 0 || idx === arr.length - 1
                              ? 'bg-brand-yellow border-brand-yellow shadow-brand'
                              : 'bg-brand-dark border-brand-yellow/50'
                          }`}
                        />
                        {idx < arr.length - 1 && (
                          <div className="w-0.5 h-8 bg-gradient-to-b from-brand-yellow/60 to-brand-yellow/20 my-1" />
                        )}
                      </div>
                      <div className="py-2 transform group-hover:translate-x-2 transition-transform duration-300">
                        <div className={`font-semibold transition-colors duration-300 group-hover:text-brand-gold ${
                          idx === 0 || idx === arr.length - 1 ? 'text-brand-yellow text-base' : 'text-white text-sm'
                        }`}>
                          {stop}
                        </div>
                        {idx < arr.length - 1 && (
                          <div className="text-brand-muted text-xs">
                            {idx === 0 ? '~25 хв' : idx === 1 ? '~10 хв' : idx === 2 ? '~8 хв' : '~15 хв'}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  <div className="mt-6 pt-6 border-t border-brand-border">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-brand-muted text-xs">Ціна від</div>
                        <div className="text-brand-yellow font-display font-bold text-2xl">50 грн</div>
                      </div>
                      <div>
                        <div className="text-brand-muted text-xs">Наступний рейс</div>
                        <div className="text-white font-semibold text-lg">
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
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badge */}
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 bg-brand-yellow text-brand-dark rounded-2xl px-4 py-2 font-display font-bold text-sm shadow-brand-lg"
              >
                Mercedes Sprinter
              </motion.div>
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
