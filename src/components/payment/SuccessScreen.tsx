import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, MessageSquare, Bus, Phone, FileText, Gift, Lock, X } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { BookingData } from '../booking/BookingForm';
import { useAuth } from '../../context/AuthContext';
import { STOPS, CONTACTS } from '../../data/routes';

interface SuccessScreenProps {
  data: BookingData;
  onClose: () => void;
}

export default function SuccessScreen({ data, onClose }: SuccessScreenProps) {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [ticketNumber] = useState(`CP${Date.now().toString().slice(-6)}`);
  
  const { user, register, addBooking } = useAuth();
  const [password, setPassword] = useState('');
  const [registered, setRegistered] = useState(false);
  const [hasSavedBooking, setHasSavedBooking] = useState(false);

  const fromStop = STOPS.find(s => s.id === data.from);
  const toStop = STOPS.find(s => s.id === data.to);

  useEffect(() => {
    if (user && !hasSavedBooking) {
      const save = async () => {
        await addBooking(data);
        setHasSavedBooking(true);
      };
      save();
    }
  }, [user, data, addBooking, hasSavedBooking]);

  const handleRegister = async () => {
    if (password.length >= 4) {
      const newUser = await register(data.name, data.phone, password);
      if (newUser) {
        setRegistered(true);
        await addBooking(data);
        setHasSavedBooking(true);
      }
    }
  };

  const handleDownloadPDF = async () => {
    if (!ticketRef.current || isGenerating) return;
    
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale: 2,
        backgroundColor: '#1C1C1C',
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [canvas.width, canvas.height]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`comfortplus-ticket-${ticketNumber}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, type: 'spring' }}
      className="flex flex-col"
    >
      <div className="flex justify-center pt-3 md:hidden">
        <div className="w-10 h-1 bg-brand-border rounded-full" />
      </div>
      
      {/* Absolute close button for the modal (visible mainly on desktop or positioned top-right) */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-xl bg-brand-surface/50 border border-brand-border text-brand-muted hover:text-white hover:border-brand-yellow hover:bg-brand-surface transition-all"
      >
        <X size={18} />
      </button>

      <div className="px-6 pb-6 pt-4">
        <div className="flex flex-col items-center text-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 300 }}
            className="w-20 h-20 bg-green-500/10 border-2 border-green-500/40 rounded-full flex items-center justify-center mb-4"
          >
            <CheckCircle size={40} className="text-green-400" />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <h2 className="text-white font-display font-bold text-2xl mb-1">Вас заброньовано!</h2>
            <p className="text-brand-muted text-sm">Квиток успішно оплачено</p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-5"
        >
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <MessageSquare size={16} className="text-green-400" />
          </div>
          <div>
            <div className="text-green-400 text-sm font-semibold">SMS підтвердження надіслано</div>
            <div className="text-brand-muted text-xs">на номер {data.phone}</div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          ref={ticketRef}
          className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden mb-5 p-px"
        >
          <div className="bg-brand-yellow/10 border-b border-brand-border px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bus size={16} className="text-brand-yellow" />
              <span className="text-brand-yellow font-bold text-sm">COMFORT PLUS 0777</span>
            </div>
            <span className="text-brand-muted text-xs font-mono">#{ticketNumber}</span>
          </div>

          <div className="px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-center">
                <div className="text-white font-display font-bold text-xl">{fromStop?.name}</div>
                <div className="text-brand-yellow text-sm font-semibold">{data.departureTime}</div>
              </div>
              <div className="flex-1 mx-4 flex flex-col items-center">
                <div className="flex w-full items-center gap-1">
                  <div className="h-0.5 flex-1 bg-brand-yellow/30" />
                  <Bus size={16} className="text-brand-yellow" />
                  <div className="h-0.5 flex-1 bg-brand-yellow/30" />
                </div>
                <div className="text-brand-muted text-xs mt-0.5">~2 год</div>
              </div>
              <div className="text-center">
                <div className="text-white font-display font-bold text-xl">{toStop?.name}</div>
                <div className="text-brand-muted text-[10px]">MB Sprinter/VW Crafter</div>
              </div>
            </div>

            <div className="border-t border-dashed border-brand-border pt-3 grid grid-cols-2 gap-2">
              <div>
                <div className="text-brand-muted text-xs">Пасажир</div>
                <div className="text-white text-sm font-medium">{data.name}</div>
              </div>
              <div>
                <div className="text-brand-muted text-xs">Дата</div>
                <div className="text-white text-sm font-medium">
                  {data.date.toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                </div>
              </div>
              <div>
                <div className="text-brand-muted text-xs">Місць</div>
                <div className="text-white text-sm font-medium">{data.seats}</div>
              </div>
              <div>
                <div className="text-brand-muted text-xs">Сплачено</div>
                <div className="text-brand-yellow text-sm font-bold">{data.price} грн</div>
              </div>
            </div>
          </div>

          {/* Decorative cut-out */}
          <div className="relative flex items-center mx-5">
            <div className="absolute -left-5 w-4 h-4 rounded-r-full bg-brand-card border-r border-t border-b border-brand-border" />
            <div className="flex-1 border-t-2 border-dashed border-brand-border" />
            <div className="absolute -right-5 w-4 h-4 rounded-l-full bg-brand-card border-l border-t border-b border-brand-border" />
          </div>

          <div className="px-5 py-3 flex items-center justify-between">
            <div className="text-brand-muted text-xs">Пред'явіть квиток водію</div>
            <div className="flex gap-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <div key={i} className={`w-1 h-6 rounded-sm ${i % 3 === 0 ? 'bg-brand-yellow' : i % 2 === 0 ? 'bg-white' : 'bg-brand-border'}`} />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {!user && !registered && (
            <div className="bg-brand-yellow/10 border border-brand-yellow/30 p-4 rounded-xl mb-4 text-left relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-20"><Gift size={64} className="text-brand-yellow" /></div>
              <h4 className="text-brand-yellow font-bold text-sm mb-1">Збирайте безкоштовні поїздки!</h4>
              <p className="text-brand-muted text-xs mb-3">
                Створіть пароль для кабінету. Всі ваші дані вже збережені. Кожна 20-та поїздка за наш рахунок!
              </p>
              <div className="flex gap-2 relative z-10">
                <div className="relative flex-1">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Придумайте пароль" 
                    className="w-full bg-brand-dark border border-brand-border rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-brand-yellow/50 focus:outline-none"
                  />
                </div>
                <button onClick={handleRegister} className="bg-brand-yellow text-brand-dark px-4 py-2 rounded-lg font-bold text-sm hover:bg-brand-gold transition-colors">
                  Зберегти
                </button>
              </div>
            </div>
          )}

          {registered && (
            <div className="bg-green-500/10 border border-green-500/30 p-3 flex items-center justify-center gap-2 rounded-xl mb-4 text-green-400 text-sm font-medium">
              <CheckCircle size={16} /> Акаунт створено!
            </div>
          )}

          <button
            onClick={handleDownloadPDF}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-border/30 hover:bg-brand-border/50 text-white transition-all text-sm font-medium disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="w-5 h-5 border-2 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin" />
            ) : (
              <FileText size={18} className="text-brand-yellow" />
            )}
            Завантажити квиток (PDF)
          </button>
          <a
            href={`tel:${CONTACTS.phone1}`}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-brand-border text-brand-light hover:border-brand-yellow hover:text-brand-yellow transition-all text-sm font-medium"
          >
            <Phone size={16} />
            {CONTACTS.phone1Display}
          </a>
          <button
            onClick={onClose}
            className="btn-primary w-full py-3 text-sm"
          >
            Чудово, дякую!
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
}
