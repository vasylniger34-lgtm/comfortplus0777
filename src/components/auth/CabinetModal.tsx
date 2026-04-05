import { motion } from 'framer-motion';
import { X, User, Phone, LogOut, Ticket, XCircle, Gift, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { STOPS } from '../../data/routes';

interface CabinetModalProps {
  onClose: () => void;
}

export default function CabinetModal({ onClose }: CabinetModalProps) {
  const { user, bookings, logout, cancelBooking } = useAuth();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getStopName = (id: string) => STOPS.find(s => s.id === id)?.name || id;

  const progressPercentage = (user.completedRides / 20) * 100;

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

        <div className="overflow-y-auto p-5 space-y-6 flex-1">
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

              {user.completedRides >= 20 && (
                <div className="mt-4 bg-green-500/20 border border-green-500/30 text-green-400 text-sm p-2 rounded-lg text-center font-semibold animate-pulse">
                  Ваша наступна поїздка безкоштовна!
                </div>
              )}
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
                {bookings.map(booking => (
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
                          <span className="px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">Актуально</span>
                        ) : booking.status === 'completed' ? (
                          <span className="px-2 py-0.5 rounded text-xs bg-green-500/10 text-green-400 font-medium border border-green-500/20 flex items-center gap-1">
                            <CheckCircle size={10} /> Завершено
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-xs bg-red-500/10 text-red-400 font-medium border border-red-500/20">Скасовано</span>
                        )}
                        <span className="text-xs text-brand-muted font-mono">
                          #{booking.id.includes('_') ? booking.id.split('_')[1] : booking.id.slice(0, 6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex md:flex-col items-center md:items-end justify-between gap-3 border-t md:border-t-0 md:border-l border-brand-border pt-3 md:pt-0 md:pl-4">
                      <div className="text-white font-bold">{booking.price === 0 ? 'Безкоштовно' : `${booking.price} грн`}</div>
                      {booking.status === 'active' && (
                        <button 
                          onClick={async () => {
                            if (window.confirm('Ви впевнені, що хочете скасувати поїздку?')) {
                              await cancelBooking(booking.id);
                            }
                          }}
                          className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors px-3 py-1.5 border border-red-500/30 rounded-lg hover:bg-red-500/10"
                        >
                          <XCircle size={14} /> Скасувати
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
