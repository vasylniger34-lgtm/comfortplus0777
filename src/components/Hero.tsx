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
    { icon: Bus, label: 'Mercedes Sprinter & Volkswagen Crafter', desc: 'Сучасний автопарк' },
    { icon: Thermometer, label: 'Кондиціонери та додаткові обігрівачі', desc: 'Комфорт у будь-яку погоду' },
    { icon: Wifi, label: 'Wi-Fi & USB', desc: 'Завжди на зв\'язку' },
    { icon: Zap, label: 'щодня з 05:50 до 20:40', desc: 'Без вихідних' },
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
            <span className="text-brand-yellow text-sm font-medium">Найближчий вільний водій {nextDepartureTime}</span>
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
            <span className="text-brand-yellow font-medium italic">щоденно · в обох напрямках</span>
          </p>
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
              key={idx}
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col items-center mt-12"
        >
          <p className="text-brand-muted text-sm font-medium mb-4 italic">
            Бронюйте за номером телефону або оберіть напрямок
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-6 sm:gap-12">
            <a href={`tel:${CONTACTS.phone1}`} className="group flex items-center gap-3 text-brand-light hover:text-brand-yellow transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                <Phone size={24} className="text-brand-yellow" />
              </div>
              <span className="text-lg font-bold tracking-wide">{CONTACTS.phone1Display}</span>
            </a>
            <a href={`tel:${CONTACTS.phone2}`} className="group flex items-center gap-3 text-brand-light hover:text-brand-yellow transition-all duration-300">
              <div className="w-10 h-10 rounded-full bg-brand-yellow/10 flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                <Phone size={24} className="text-brand-yellow" />
              </div>
              <span className="text-lg font-bold tracking-wide">{CONTACTS.phone2Display}</span>
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
          <span className="text-brand-muted text-xs">Оберіть напрямок та забронюйте</span>
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
