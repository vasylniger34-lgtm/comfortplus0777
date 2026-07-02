import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Menu, X, User } from 'lucide-react';
import { CONTACTS } from '../../data/routes';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onBookNow: () => void;
  onOpenCabinet: () => void;
}

export default function Header({ onBookNow, onOpenCabinet }: HeaderProps) {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Маршрути', href: '/#schedule' },
    { label: 'Тарифи', href: '/tariffs' },
    { label: 'Бронювання', href: '/#booking' },
    { label: 'Відгуки', href: '/#reviews' },
    { label: 'Контакти', href: '/#contacts' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'glass border-b border-brand-border shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img src="/logo.jpg" alt="Comfort Plus" className="w-12 h-12 rounded-xl object-cover shadow-brand" />
            <div>
              <div className="font-display font-bold text-white text-base leading-tight">
                Comfort Plus
              </div>
              <div className="text-brand-yellow text-xs font-medium">0777</div>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-brand-light hover:text-brand-yellow transition-colors duration-200 text-sm font-medium"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Phone + CTA */}
          <div className="hidden md:flex flex-col items-end gap-1">
            <a
              href={`tel:${CONTACTS.phone1}`}
              className="flex items-center gap-2 text-brand-yellow text-sm font-semibold hover:text-brand-gold transition-colors whitespace-nowrap"
            >
              <Phone size={14} />
              {CONTACTS.phone1Display}
            </a>
            <a
              href={`tel:${CONTACTS.phone2}`}
              className="flex items-center gap-2 text-brand-yellow text-sm font-semibold hover:text-brand-gold transition-colors whitespace-nowrap"
            >
              <Phone size={14} />
              {CONTACTS.phone2Display}
            </a>
          </div>

          <div className="hidden md:flex items-center gap-3 ml-4">
            <button
              onClick={onBookNow}
              className="btn-primary text-sm py-2.5 px-6"
            >
              Забронювати
            </button>
            <button
              onClick={onOpenCabinet}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                user 
                  ? 'bg-brand-yellow/10 border-brand-yellow/30 text-brand-yellow hover:bg-brand-yellow/20' 
                  : 'bg-brand-surface border-brand-border text-brand-light hover:border-brand-yellow hover:text-brand-yellow'
              }`}
            >
              <User size={16} />
              <span className="text-sm font-medium">{user ? 'Кабінет' : 'Увійти'}</span>
            </button>
          </div>

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden w-10 h-10 flex items-center justify-center rounded-xl border border-brand-border text-brand-light hover:text-brand-yellow hover:border-brand-yellow transition-all"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[80px] left-0 right-0 z-40 glass border-b border-brand-border px-4 py-4"
          >
            <nav className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 px-4 text-brand-light hover:text-brand-yellow hover:bg-brand-surface rounded-xl transition-all duration-200 font-medium"
                >
                  {link.label}
                </a>
              ))}
              <div className="mt-2 pt-2 border-t border-brand-border flex flex-col gap-2">
                <a
                  href={`tel:${CONTACTS.phone1}`}
                  className="flex items-center gap-2 py-3 px-4 text-brand-yellow font-semibold"
                >
                  <Phone size={16} />
                  {CONTACTS.phone1Display}
                </a>
                <a
                  href={`tel:${CONTACTS.phone2}`}
                  className="flex items-center gap-2 py-3 px-4 text-brand-yellow font-semibold"
                >
                  <Phone size={16} />
                  {CONTACTS.phone2Display}
                </a>
                <button
                  onClick={() => { onBookNow(); setMenuOpen(false); }}
                  className="btn-primary text-center"
                >
                  Забронювати місце
                </button>
                <button
                  onClick={() => { onOpenCabinet(); setMenuOpen(false); }}
                  className={`mt-2 py-3 rounded-xl border flex items-center justify-center gap-2 transition-colors ${
                    user 
                      ? 'bg-brand-yellow/10 border-brand-yellow/30 text-brand-yellow font-medium' 
                      : 'bg-brand-surface border-brand-border text-brand-light font-medium hover:border-brand-yellow hover:text-brand-yellow'
                  }`}
                >
                  <User size={18} />
                  {user ? 'Мій Кабінет' : 'Увійти'}
                </button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
