import { motion } from 'framer-motion';
import { Users, Phone } from 'lucide-react';
import { CONTACTS } from '../../data/routes';

export default function TransfersBlock() {
  return (
    <section className="bg-brand-dark py-16 border-t border-brand-border">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-yellow/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow text-sm font-medium mb-4">
                <Users size={16} />
                Індивідуальні Трансфери
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
                Оренда великих мікроавтобусів (20 місць)
              </h2>
              <p className="text-brand-muted mb-6 leading-relaxed">
                Шукаєте транспорт для великої групи? Ми пропонуємо комфортабельні мікроавтобуси MB Sprinter та VW Crafter на 20 місць для індивідуального бронювання. Ідеально підходить для екскурсій, корпоративних поїздок або святкових подій.
              </p>
              
              <ul className="space-y-3 mb-8">
                {['Лише за попереднім бронюванням', 'Досвідчений водій в комплекті', 'Клімат-контроль та м\'які сидіння'].map(item => (
                  <li key={item} className="flex items-center gap-3 text-brand-light">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-yellow" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-brand-dark rounded-2xl p-6 md:p-8 border border-brand-border text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-brand-yellow/10 flex items-center justify-center mb-4">
                <Phone size={24} className="text-brand-yellow" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Обговорити деталі</h3>
              <p className="text-brand-muted text-sm mb-6 max-w-sm">
                Зателефонуйте нам для індивідуального прорахунку вартості та підтвердження доступності транспорту на вашу дату.
              </p>
              
              <div className="w-full space-y-3">
                <a href={`tel:${CONTACTS.phone1}`} className="btn-primary w-full block py-4 text-lg">
                  {CONTACTS.phone1Display}
                </a>
                <a href={`tel:${CONTACTS.phone2}`} className="block w-full py-3 text-brand-light hover:text-white transition-colors border border-brand-border rounded-xl">
                  {CONTACTS.phone2Display}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
