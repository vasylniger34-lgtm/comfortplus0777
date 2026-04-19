import { motion } from 'framer-motion';
import { ArrowRight, ChevronDown, Zap, Bus, Thermometer, Wifi, ArrowLeftRight, Phone } from 'lucide-react';
import { CONTACTS } from '../data/routes';

import { useState } from 'react';

interface HeroProps {
  onBookNow: () => void;
}

export default function Hero({ onBookNow }: HeroProps) {
  const [isHovered, setIsHovered] = useState(false);
  const comfortFeatures = [
    { icon: Bus, label: 'Mercedes Sprinter & Volkswagen Crafter', desc: 'Сучасний таксопарк' },
    { icon: Thermometer, label: 'Клімат-контроль', desc: 'Кондиціонери та додаткові обігрівачі' },
    { icon: Wifi, label: 'Wi-Fi & USB', desc: 'Завжди на зв\'язку' },
    { icon: Zap, label: 'щодня', desc: 'з 5 50 до 20 40 без вихідних' },
  ];

  const nextDepartureTime = (() => {
    const now = new Date();
    // All departure times from both directions combined
    const times = ['05:50','06:20','07:10','08:10','08:50','09:00','09:30','10:15','10:35','11:05','11:10','11:50','12:00','12:20','12:40','13:10','13:20','14:10','14:50','15:30','16:10','16:20','17:00','17:40','18:20','19:20','20:00','20:40'];
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const next = times.find(t => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m > currentMins;
    });
    return next || '05:50';
  })();

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-dark via-brand-dark to-brand-surface" />
      
      {/* Decorative orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-yellow/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-brand-yellow/3 rounded-full blur-3xl pointer-events-none" />

      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #F5A623 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-12 w-full">
        {/* Top badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-6"
        >
          <div className="inline-flex items-center gap-2 bg-brand-yellow/10 border border-brand-yellow/20 rounded-full px-4 py-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-brand-yellow text-sm font-medium">найближчий вільний водій о {nextDepartureTime}</span>
          </div>
        </motion.div>

        {/* Main heading (Interactive) */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-center mb-10 flex flex-col items-center"
        >
          <div 
            className="relative cursor-pointer group flex flex-col items-center mb-6"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={() => setIsHovered(!isHovered)}
          >
            <h1 className="font-display font-bold text-4xl md:text-6xl text-white leading-tight flex items-center justify-center gap-3 md:gap-4 transition-transform duration-300">
              <span className="relative z-10 bg-brand-dark px-1">Львів</span>
              <div className="relative flex items-center justify-center">
                <ArrowLeftRight size={32} className={`text-brand-yellow transition-all duration-300 ${isHovered ? 'opacity-0 scale-50' : 'opacity-100 scale-100'}`} />
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-0.5 bg-brand-yellow transition-all duration-300 ease-out ${isHovered ? 'w-32 md:w-48 opacity-50' : 'w-0 opacity-0'}`} />
              </div>
              <span className="relative z-10 bg-brand-dark px-1">Східниця</span>
            </h1>
            
            <div className="absolute -bottom-8 w-full flex justify-center">
              <div className={`transition-all duration-300 ease-out flex items-center justify-center gap-2 md:gap-4 text-xs md:text-sm font-semibold tracking-wide uppercase text-white/80 ${isHovered ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                <span className="shrink-0 text-brand-yellow">Стебник</span>
                <span className="w-1 h-1 rounded-full bg-brand-muted shrink-0" />
                <span className="shrink-0 text-brand-yellow">Трускавець</span>
                <span className="w-1 h-1 rounded-full bg-brand-muted shrink-0" />
                <span className="shrink-0 text-brand-yellow">Борислав</span>
              </div>
            </div>
          </div>
          
          <p className="text-brand-light text-lg md:text-xl max-w-xl mx-auto leading-relaxed mt-4">
            Комфортні пасажирські перевезення
            <br />
            <span className="text-brand-yellow font-medium italic">щодня</span>
          </p>
        </motion.div>

        {/* CTA Block — the main booking trigger */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl mx-auto mb-10"
        >
          <div className="card p-6 md:p-8 bg-brand-surface/40 backdrop-blur-xl border-brand-yellow/20 shadow-2xl relative overflow-hidden group">
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-yellow/10 rounded-full blur-3xl group-hover:bg-brand-yellow/20 transition-colors duration-700" />
            
            <div className="relative z-10">
              {/* Route visualization */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-brand-yellow rounded-full animate-pulse" />
                  <div className="text-brand-muted text-[10px] uppercase tracking-[0.2em] font-black">Напрямок</div>
                </div>
                <div className="bg-brand-yellow/10 px-3 py-1 rounded-full border border-brand-yellow/20">
                  <span className="text-brand-yellow text-[10px] font-bold uppercase tracking-tighter">Live Розклад</span>
                </div>
              </div>
              
              {/* Compact route */}
              <div className="flex items-center justify-between gap-2 mb-6">
                {['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'].map((stop, idx, arr) => (
                  <div key={stop} className="flex items-center gap-2 flex-1">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full border-2 z-10 ${
                        idx === 0 || idx === arr.length - 1
                          ? 'bg-brand-yellow border-brand-yellow shadow-brand'
                          : 'bg-brand-dark border-brand-border'
                      }`} />
                      <div className={`font-display font-black text-[9px] sm:text-[10px] mt-1 uppercase tracking-tight ${
                        idx === 0 || idx === arr.length - 1 ? 'text-brand-yellow' : 'text-white/70'
                      }`}>
                        {stop}
                      </div>
                    </div>
                    {idx < arr.length - 1 && (
                      <div className="h-[2px] flex-1 bg-brand-border min-w-2" />
                    )}
                  </div>
                ))}
              </div>

              {/* Final CTA Button ONLY */}
              <div className="flex justify-center pt-4 border-t border-brand-border/50">
                <button
                  onClick={onBookNow}
                  className="btn-primary w-full px-10 py-4 text-dark font-black flex items-center justify-center gap-3 group/btn shadow-brand-lg text-lg"
                >
                  ЗАБРОНЮВАТИ
                  <ArrowRight size={20} className="group-hover/btn:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comfort features — bottom strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto"
        >
          {comfortFeatures.map(({ icon: Icon, label, desc }, idx) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + idx * 0.1 }}
              className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-3 hover:border-brand-yellow/20 transition-colors group"
            >
              <div className="w-9 h-9 bg-brand-yellow/10 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-brand-yellow/20 transition-colors">
                <Icon size={18} className="text-brand-yellow" />
              </div>
              <div>
                <div className="text-white text-[11px] font-bold leading-tight">{label}</div>
                <div className="text-brand-muted text-[9px] leading-tight">{desc}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Phone numbers section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center gap-4 mt-12"
        >
          <p className="text-brand-light font-bold text-base md:text-lg mb-2">Бронюйте за номером телефону або оберіть напрямок</p>
          <div className="flex flex-col md:flex-row justify-center gap-8 md:gap-16">
            <a href={`tel:${CONTACTS.phone1}`} className="hover:text-brand-yellow transition-all flex items-center gap-4 group scale-105 md:scale-110">
              <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center group-hover:bg-brand-yellow/80 shadow-brand group-hover:scale-110 transition-all">
                <Phone size={20} className="text-brand-dark" />
              </div>
              <span className="text-white font-display font-black text-xl md:text-2xl tracking-tight">{CONTACTS.phone1Display}</span>
            </a>
            <a href={`tel:${CONTACTS.phone2}`} className="hover:text-brand-yellow transition-all flex items-center gap-4 group scale-105 md:scale-110">
              <div className="w-10 h-10 bg-brand-yellow rounded-full flex items-center justify-center group-hover:bg-brand-yellow/80 shadow-brand group-hover:scale-110 transition-all">
                <Phone size={20} className="text-brand-dark" />
              </div>
              <span className="text-white font-display font-black text-xl md:text-2xl tracking-tight">{CONTACTS.phone2Display}</span>
            </a>
          </div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex flex-col items-center gap-2 mt-10"
        >
          <span className="text-brand-muted text-xs">Оберіть маршрут та забронюйте</span>
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
