import { motion } from 'framer-motion';
import { Bus, Clock, ShieldCheck, CreditCard, ChevronRight, HelpCircle, ArrowLeft, ArrowUpDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { STOPS, ROUTE_PRICES } from '../data/routes';

type TariffCard = {
  from: string;
  to: string;
  price: number;
  duration: string;
  features: string[];
};

export default function TariffsPage() {
  const navigate = useNavigate();

  const tariffs: TariffCard[] = [
    {
      from: 'Львів',
      to: 'Східниця',
      price: ROUTE_PRICES['lviv-skhidnytsia'] || 350,
      duration: '2 год 20 хв',
      features: ['Безкоштовний багаж', 'М\'які регульовані сидіння', 'Кондиціонер', 'Прямий рейс без пересадок']
    },
    {
      from: 'Львів',
      to: 'Борислав',
      price: ROUTE_PRICES['lviv-boryslav'] || 300,
      duration: '2 год 10 хв',
      features: ['Безкоштовний багаж', 'М\'які регульовані сидіння', 'Кондиціонер', 'Прямий рейс']
    },
    {
      from: 'Львів',
      to: 'Трускавець',
      price: ROUTE_PRICES['lviv-truskavets'] || 300,
      duration: '2 год 00 хв',
      features: ['Безкоштовний багаж', 'М\'які регульовані сидіння', 'Кондиціонер', 'Прямий рейс']
    },
    {
      from: 'Львів',
      to: 'Стебник',
      price: ROUTE_PRICES['lviv-stebnik'] || 250,
      duration: '1 год 45 хв',
      features: ['Безкоштовний багаж', 'М\'які регульовані сидіння', 'Кондиціонер', 'Зупинка біля залізничного вокзалу']
    }
  ];

  return (
    <div className="min-h-screen bg-brand-dark pt-28 pb-20 px-4 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-yellow/5 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[500px] rounded-full bg-brand-gold/5 blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => navigate('/')} 
            className="w-10 h-10 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-light hover:text-brand-yellow hover:border-brand-yellow transition-all"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black text-white">Наші тарифи та ціни</h1>
            <p className="text-xs text-brand-muted uppercase tracking-wider font-semibold">Прозора цінова політика Comfort Plus</p>
          </div>
        </div>

        {/* Introduction */}
        <div className="card p-6 md:p-8 mb-8 border-brand-border bg-brand-card/30 backdrop-blur-xl">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-brand-yellow/10 rounded-xl text-brand-yellow">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white mb-2">Гарантія чесної ціни</h2>
              <p className="text-sm text-brand-muted leading-relaxed">
                Усі ціни на квитки є остаточними, фіксованими та включають перевезення стандартного багажу. Жодних прихованих комісій чи доплат під час посадки. Ви можете ознайомитись з актуальними тарифами нижче та забронювати поїздку онлайн.
              </p>
            </div>
          </div>
        </div>

        {/* Tariffs Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {tariffs.map((tariff, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="card p-6 border-brand-border hover:border-brand-yellow/30 bg-brand-card/50 flex flex-col justify-between group transition-all duration-300"
            >
              <div>
                {/* Route Header */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black text-base">{tariff.from}</span>
                    <span className="text-brand-yellow font-black"><ArrowUpDown size={14} /></span>
                    <span className="text-white font-black text-base">{tariff.to}</span>
                  </div>
                  <div className="bg-brand-yellow/15 border border-brand-yellow/30 text-brand-yellow font-bold text-xs px-2 py-0.5 rounded">
                    В обидва боки
                  </div>
                </div>

                {/* Price Tag */}
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-display font-black text-brand-yellow">{tariff.price}</span>
                  <span className="text-brand-muted text-sm font-semibold">грн / місце</span>
                </div>

                {/* Details */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center gap-2 text-xs text-brand-light">
                    <Clock size={12} className="text-brand-yellow flex-shrink-0" />
                    <span>Час у дорозі: ~{tariff.duration}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="border-t border-brand-border/40 pt-4 mb-6 space-y-2">
                  {tariff.features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-[11px] text-brand-muted">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => navigate('/#booking')}
                className="w-full bg-brand-surface hover:bg-brand-yellow hover:text-brand-dark border border-brand-border hover:border-brand-yellow text-white py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 group-hover:scale-[1.01]"
              >
                Забронювати рейс
                <ChevronRight size={14} />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Pricing Policy Statement */}
        <div className="card p-6 md:p-8 border-brand-border bg-brand-card/20 space-y-6">
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2 border-b border-brand-border pb-3">
            <HelpCircle size={18} className="text-brand-yellow" /> Правила тарифів та оплати
          </h3>

          <div className="grid md:grid-cols-2 gap-6 text-xs text-brand-light leading-relaxed">
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white mb-1">💳 Способи оплати</h4>
                <p className="text-brand-muted">
                  Ви можете сплатити замовлення онлайн банківською карткою Visa, Mastercard або Prostir через сервіс безпечних платежів Portmone. Також доступна оплата з балансу особистого кабінету.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">💼 Багаж</h4>
                <p className="text-brand-muted">
                  У вартість кожного квитка входить одне місце ручної поклажі та одна стандартна валіза у багажному відділенні. Додатковий негабаритний багаж узгоджується за телефоном диспетчера.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white mb-1">🔄 Скасування та повернення</h4>
                <p className="text-brand-muted">
                  Скасувати бронь з повним поверненням коштів можна не пізніше ніж за 2 години до відправлення рейсу через особистий кабінет або зателефонувавши диспетчеру.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1">🏨 Готельний трансфер</h4>
                <p className="text-brand-muted">
                  Для максимального комфорту доступна послуга забору від дверей готелю або доставки безпосередньо до готелю в Трускавці чи Східниці з додатковою оплатою.
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-brand-border/40 pt-4 flex justify-between items-center opacity-60">
            <div className="flex items-center gap-3">
              <img src="https://upload.wikimedia.org/wikipedia/commons/5/5c/Visa_Inc._logo_(2021–present).svg" alt="Visa" className="h-3" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-4" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/c/c4/Portmone_logo.svg" alt="Portmone" className="h-4.5" />
            </div>
            <span className="text-[10px] text-brand-muted font-mono">PCI DSS Compliant Secure Payments</span>
          </div>
        </div>
      </div>
    </div>
  );
}
