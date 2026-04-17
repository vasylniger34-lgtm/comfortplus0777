import { Phone, MapPin, Bus, Clock, ExternalLink } from 'lucide-react';
import { CONTACTS } from '../../data/routes';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contacts" className="bg-brand-surface border-t border-brand-border mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center">
                <Bus size={20} className="text-brand-dark" />
              </div>
              <div>
                <div className="font-display font-bold text-white text-lg">Comfort Plus</div>
                <div className="text-brand-yellow text-xs">0777</div>
              </div>
            </div>
            <p className="text-brand-muted text-sm leading-relaxed">
              Преміум перевезення на напрямку Львів–Стебник–Трускавець–Борислав–Східниця. 
              Щоденні рейси. Комфорт та безпека.
            </p>
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-white font-semibold mb-4">Контакти</h3>
            <div className="space-y-3">
              <a href={`tel:${CONTACTS.phone1}`} className="flex items-center gap-3 text-brand-light hover:text-brand-yellow transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                  <Phone size={14} className="text-brand-yellow" />
                </div>
                <span className="font-medium">{CONTACTS.phone1Display}</span>
              </a>
              <a href={`tel:${CONTACTS.phone2}`} className="flex items-center gap-3 text-brand-light hover:text-brand-yellow transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                  <Phone size={14} className="text-brand-yellow" />
                </div>
                <span className="font-medium">{CONTACTS.phone2Display}</span>
              </a>
              <a href={CONTACTS.instagram} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-brand-light hover:text-brand-yellow transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                  <ExternalLink size={14} className="text-brand-yellow" />
                </div>
                <span className="font-medium">{CONTACTS.instagramHandle}</span>
              </a>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Інформація</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-brand-muted text-sm">
                <MapPin size={16} className="text-brand-yellow mt-0.5 flex-shrink-0" />
                <span>Маршрут: Львів — Стебник — Трускавець — Борислав — Східниця</span>
              </div>
              <div className="flex items-center gap-3 text-brand-muted text-sm">
                <Clock size={16} className="text-brand-yellow flex-shrink-0" />
                <span>Щоденні рейси з 05:50 до 17:40</span>
              </div>
              <div className="flex items-center gap-3 text-brand-muted text-sm">
                <Bus size={16} className="text-brand-yellow flex-shrink-0" />
                <span>MB Sprinter та VW Crafter • по 12 місць</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-brand-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-brand-muted text-xs">
            © {currentYear} Comfort Plus 0777. Всі права захищено.
          </p>
        </div>
      </div>
    </footer>
  );
}
