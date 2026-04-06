import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, LogOut, Ticket, XCircle, Gift, FileText, Bus, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STOPS } from '../../data/routes';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

interface CabinetModalProps {
  onClose: () => void;
}

export default function CabinetModal({ onClose }: CabinetModalProps) {
  const { user, bookings, logout, cancelBooking } = useAuth();
  const [viewingTicket, setViewingTicket] = useState<any | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getStopName = (id: string) => STOPS.find(s => s.id === id)?.name || id;

  const progressPercentage = (user.completedRides / 20) * 100;

  // Перевірка чи час відправлення вже минув
  const isPastDeparture = (bookingDate: string | Date, departureTime: string) => {
    const now = new Date();
    const [hours, minutes] = departureTime.split(':').map(Number);
    const dDate = new Date(bookingDate);
    dDate.setHours(hours, minutes, 0, 0);
    return dDate < now;
  };

  const handleDownloadPDF = async (ticketId: string) => {
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
      pdf.save(`comfortplus-ticket-${ticketId.slice(0, 8)}.pdf`);
    } catch (error) {
      console.error('Error generating PDF', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-brand-surface border border-brand-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col z-10 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-brand-border bg-brand-card">
          <h3 className="text-white font-display font-bold text-xl flex items-center gap-2">
            <User size={22} className="text-brand-yellow" />
            Мій Кабінет
          </h3>
          <button onClick={onClose} className="text-brand-muted hover:text-white transition-colors bg-brand-dark p-2 rounded-lg">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-5 space-y-6 flex-1 no-scrollbar">
          {/* User Info & Loyalty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-brand-dark rounded-xl p-4 border border-brand-border">
              <div className="text-brand-muted text-xs mb-1">Особисті дані</div>
              <div className="font-semibold text-white text-lg">{user.name}</div>
              <div className="flex items-center gap-2 text-brand-light mt-1 text-sm">
                <Phone size={14} className="text-brand-yellow" />
                {user.phone}
              </div>
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold">
                Баланс: {user.balance || 0} грн
              </div>
              <button onClick={handleLogout} className="mt-4 text-xs flex items-center gap-1 text-red-400 hover:text-red-300 transition-colors">
                <LogOut size={12} />
                Вийти з акаунта
              </button>
            </div>

            <div className="bg-brand-yellow/10 rounded-xl p-4 border border-brand-yellow/30 relative overflow-hidden">
              <div className="text-brand-yellow text-xs font-semibold mb-1 uppercase tracking-wider flex items-center gap-1">
                <Gift size={14} /> 
                Програма Лояльності
              </div>
              <div className="text-white font-medium text-sm my-2">
                Кожна 20-та поїздка — <span className="text-brand-yellow font-bold">БЕЗКОШТОВНО</span>
              </div>
              
              <div className="mt-3">
                <div className="flex justify-between text-xs text-brand-light mb-1.5 font-medium">
                  <span>{user.completedRides} поїздок</span>
                  <span>20 поїздок</span>
                </div>
                <div className="h-3 w-full bg-brand-dark rounded-full overflow-hidden border border-brand-border">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className="h-full bg-brand-yellow rounded-full relative"
                  >
                    <div className="absolute inset-0 bg-white/20 w-full h-full animate-pulse" />
                  </motion.div>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div>
            <h4 className="text-white font-medium mb-3 flex items-center gap-2">
              <Ticket size={18} className="text-brand-muted" />
              Мої Квитки
            </h4>
            
            {bookings.length === 0 ? (
              <div className="bg-brand-dark rounded-xl p-8 text-center border border-brand-border border-dashed">
                <div className="text-brand-muted text-sm">У вас ще немає квитків</div>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.map(booking => {
                  const past = isPastDeparture(booking.date, booking.departureTime);
                  return (
                    <div key={booking.id} className="bg-brand-dark border border-brand-border rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-brand-yellow font-semibold">{getStopName(booking.from)}</span>
                          <span className="text-brand-muted">→</span>
                          <span className="text-brand-yellow font-semibold">{getStopName(booking.to)}</span>
                        </div>
                        <div className="text-sm text-brand-light mb-2">
                          {new Date(booking.date).toLocaleDateString('uk-UA')} о {booking.departureTime} • {booking.seats} місць
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {booking.status === 'active' ? (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${past ? 'bg-brand-muted/10 text-brand-muted border-brand-border' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                              {past ? 'Час минув' : 'Актуально'}
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded text-xs font-medium border ${booking.status === 'completed' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                              {booking.status === 'completed' ? 'Завершено' : 'Скасовано'}
                            </span>
                          )}
                          <span className="text-xs text-brand-muted font-mono uppercase">
                            #{booking.id.slice(0, 6)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-2 border-t md:border-t-0 md:border-l border-brand-border pt-3 md:pt-0 md:pl-4">
                        <div className="text-white font-bold">{booking.price === 0 ? 'Безкоштовно' : `${booking.price} грн`}</div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setViewingTicket(booking)}
                            className="p-2 text-brand-yellow hover:bg-brand-yellow/10 rounded-lg border border-brand-yellow/20 transition-colors"
                            title="Переглянути квиток"
                          >
                            <FileText size={16} />
                          </button>
                          {booking.status === 'active' && !past && (
                            <button 
                              onClick={async () => {
                                if (window.confirm('Ви впевнені, що хочете скасувати поїздку?')) {
                                  await cancelBooking(booking.id);
                                }
                              }}
                              className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg border border-red-500/20 transition-colors"
                              title="Скасувати"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Ticket Modal Overlay */}
      <AnimatePresence>
        {viewingTicket && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setViewingTicket(null)} 
              className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg z-10"
            >
              <div className="bg-brand-surface border border-brand-border rounded-2xl overflow-hidden shadow-2xl">
                {/* Visual Ticket Content */}
                <div ref={ticketRef} className="bg-brand-surface p-px">
                  <div className="bg-brand-yellow/10 border-b border-brand-border px-5 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bus size={18} className="text-brand-yellow" />
                      <span className="text-brand-yellow font-bold">COMFORT PLUS 0777</span>
                    </div>
                    <span className="text-brand-muted text-xs font-mono uppercase">#{viewingTicket.id.slice(0, 8)}</span>
                  </div>
                  
                  <div className="px-6 py-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-center">
                        <div className="text-white font-display font-bold text-2xl">{getStopName(viewingTicket.from)}</div>
                        <div className="text-brand-yellow text-sm font-semibold">{viewingTicket.departureTime}</div>
                      </div>
                      <div className="flex-1 mx-4 flex flex-col items-center">
                        <Bus size={20} className="text-brand-yellow mb-1" />
                        <div className="h-0.5 w-full bg-brand-yellow/30 relative">
                             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-brand-yellow rounded-full" />
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-white font-display font-bold text-2xl">{getStopName(viewingTicket.to)}</div>
                        <div className="text-brand-muted text-[10px]">~2 год у дорозі</div>
                      </div>
                    </div>

                    <div className="border-t border-dashed border-brand-border pt-4 grid grid-cols-2 gap-y-4 gap-x-2">
                      <div>
                        <div className="text-brand-muted text-xs uppercase tracking-wider mb-0.5">Пасажир</div>
                        <div className="text-white font-medium">{viewingTicket.name}</div>
                      </div>
                      <div>
                        <div className="text-brand-muted text-xs uppercase tracking-wider mb-0.5">Дата</div>
                        <div className="text-white font-medium">
                          {new Date(viewingTicket.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' })}
                        </div>
                      </div>
                      <div>
                        <div className="text-brand-muted text-xs uppercase tracking-wider mb-0.5">Місць</div>
                        <div className="text-white font-medium">{viewingTicket.seats}</div>
                      </div>
                      <div>
                        <div className="text-brand-muted text-xs uppercase tracking-wider mb-0.5">Статус</div>
                        <div className="text-brand-yellow font-bold uppercase text-xs tracking-widest">{viewingTicket.status}</div>
                      </div>
                    </div>
                  </div>

                  <div className="relative flex items-center mx-6 my-2">
                    <div className="absolute -left-8 w-6 h-6 rounded-r-full bg-black/80 border-r border-brand-border" />
                    <div className="flex-1 border-t-2 border-dashed border-brand-border" />
                    <div className="absolute -right-8 w-6 h-6 rounded-l-full bg-black/80 border-l border-brand-border" />
                  </div>

                  <div className="px-6 py-4 flex items-center justify-between">
                    <div className="text-brand-muted text-[10px]">Квиток дійсний при пред'явленні водію</div>
                    <div className="flex gap-1 opacity-40">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div key={i} className={`w-1 h-6 rounded-sm ${i % 3 === 0 ? 'bg-brand-yellow' : 'bg-white'}`} />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modal Actions */}
                <div className="p-4 bg-brand-dark/50 flex gap-3">
                  <button 
                    onClick={() => handleDownloadPDF(viewingTicket.id)}
                    disabled={isGenerating}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-surface border border-brand-border py-3 rounded-xl text-white hover:bg-brand-yellow/10 hover:border-brand-yellow transition-all disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <div className="w-4 h-4 border-2 border-brand-yellow/30 border-t-brand-yellow rounded-full animate-spin" />
                    ) : (
                      <Download size={18} className="text-brand-yellow" />
                    )}
                    Скачати PDF
                  </button>
                  <button 
                    onClick={() => setViewingTicket(null)}
                    className="px-6 py-3 bg-brand-yellow text-brand-dark rounded-xl font-bold hover:bg-brand-gold transition-colors"
                  >
                    Закрити
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
