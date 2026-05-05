import { Phone, MapPin, Bus, Clock, ExternalLink, ShieldCheck, FileText, RefreshCcw } from 'lucide-react';
import { CONTACTS, LEGAL_INFO } from '../../data/routes';
import PaymentLogos from '../payment/PaymentLogos';

interface FooterProps {
  onOpenLegal?: (type: 'privacy' | 'terms' | 'refund') => void;
}

export default function Footer({ onOpenLegal }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="contacts" className="bg-brand-surface border-t border-brand-border mt-20">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Legal Info */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center">
                <Bus size={20} className="text-brand-dark" />
              </div>
              <div>
                <div className="font-display font-bold text-white text-lg">{LEGAL_INFO.companyName}</div>
                <div className="text-brand-yellow text-xs">0777</div>
              </div>
            </div>
            <div className="text-brand-muted text-[11px] space-y-1 mb-4">
              <p>{LEGAL_INFO.legalName}</p>
              <p>ЄДРПОУ: {LEGAL_INFO.taxId}</p>
              <p>{LEGAL_INFO.legalAddress}</p>
              <p>{LEGAL_INFO.taxGroup}</p>
            </div>
            <PaymentLogos variant="footer" className="mt-6" />
          </div>

          {/* Contacts */}
          <div>
            <h3 className="text-white font-semibold mb-4">Контакти</h3>
            <div className="space-y-3">
              <a href={`tel:${CONTACTS.phone1}`} className="flex items-center gap-3 text-brand-light hover:text-brand-yellow transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                  <Phone size={14} className="text-brand-yellow" />
                </div>
                <span className="font-medium text-sm">{CONTACTS.phone1Display}</span>
              </a>
              <a href={`tel:${CONTACTS.phone2}`} className="flex items-center gap-3 text-brand-light hover:text-brand-yellow transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                  <Phone size={14} className="text-brand-yellow" />
                </div>
                <span className="font-medium text-sm">{CONTACTS.phone2Display}</span>
              </a>
              <a href={`mailto:${LEGAL_INFO.email}`} className="flex items-center gap-3 text-brand-light hover:text-brand-yellow transition-colors group">
                <div className="w-8 h-8 rounded-lg bg-brand-yellow/10 flex items-center justify-center group-hover:bg-brand-yellow/20 transition-colors">
                  <ExternalLink size={14} className="text-brand-yellow" />
                </div>
                <span className="font-medium text-sm">{LEGAL_INFO.email}</span>
              </a>
            </div>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Документи</h3>
            <div className="space-y-3">
              <button 
                onClick={() => onOpenLegal?.('terms')}
                className="flex items-center gap-3 text-brand-muted hover:text-brand-yellow transition-colors text-sm group"
              >
                <FileText size={14} className="group-hover:text-brand-yellow" />
                <span>Договір оферти</span>
              </button>
              <button 
                onClick={() => onOpenLegal?.('privacy')}
                className="flex items-center gap-3 text-brand-muted hover:text-brand-yellow transition-colors text-sm group"
              >
                <ShieldCheck size={14} className="group-hover:text-brand-yellow" />
                <span>Політика конфіденційності</span>
              </button>
              <button 
                onClick={() => onOpenLegal?.('refund')}
                className="flex items-center gap-3 text-brand-muted hover:text-brand-yellow transition-colors text-sm group"
              >
                <RefreshCcw size={14} className="group-hover:text-brand-yellow" />
                <span>Повернення та оплата</span>
              </button>
            </div>
          </div>

          {/* Info */}
          <div>
            <h3 className="text-white font-semibold mb-4">Напрямок</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-brand-muted text-sm">
                <MapPin size={16} className="text-brand-yellow mt-0.5 flex-shrink-0" />
                <span>Львів ↔ Стебник ↔ Трускавець ↔ Борислав ↔ Східниця</span>
              </div>
              <div className="flex items-center gap-3 text-brand-muted text-sm">
                <Clock size={16} className="text-brand-yellow flex-shrink-0" />
                <span>Відправлення щодня</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-brand-border flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-brand-muted text-[10px] uppercase tracking-wider">
            © {currentYear} {LEGAL_INFO.companyName}. Всі права захищено.
          </p>
          <div className="flex items-center gap-4 text-brand-muted text-[10px] uppercase tracking-wider">
            <span>Powered by Portmone.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
