import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Clock, Star, Wifi } from 'lucide-react';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/Hero';
import BookingFormMockup from './components/booking/BookingFormMockup';
import PaymentModal from './components/payment/PaymentModal';
import ScheduleBlockMockup from './components/schedule/ScheduleBlockMockup';
import ReviewsBlock from './components/reviews/ReviewsBlock';
import ChatWidget from './components/chat/ChatWidget';
import TransfersBlock from './components/transfers/TransfersBlock';

import type { BookingData } from './components/booking/BookingForm';

import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import CabinetModal from './components/auth/CabinetModal';

function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: 'Безпека та надійність',
      desc: 'Досвідчені водії, технічно справні MB Sprinter та VW Crafter з 2024 року',
    },
    {
      icon: Clock,
      title: 'Гнучкий час',
      desc: 'Відсутність жорстких графіків — ми підберемо найближче вільне вікно для вас',
    },
    {
      icon: Star,
      title: 'Консьєрж-сервіс',
      desc: 'персональний підбір авто, клімат-контроль та комфорт бізнес-класу',
    },
    {
      icon: Wifi,
      title: 'Миттєве підтвердження',
      desc: 'Бронюйте вільне авто онлайн за лічені секунди',
    },
  ];

  return (
    <section className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map(({ icon: Icon, title, desc }, idx) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="card-hover p-5 group"
          >
            <div className="w-11 h-11 bg-brand-yellow/10 border border-brand-yellow/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-brand-yellow/20 transition-colors">
              <Icon size={22} className="text-brand-yellow" />
            </div>
            <h3 className="text-white font-semibold mb-2 text-sm">{title}</h3>
            <p className="text-brand-muted text-xs leading-relaxed">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function MainAppMockup() {
  const [paymentData, setPaymentData] = useState<BookingData | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const { user } = useAuth();

  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header 
        onBookNow={scrollToBooking} 
        onOpenCabinet={() => user ? setIsCabinetOpen(true) : setIsAuthOpen(true)}
      />
      
      <main>
        <Hero onBookNow={scrollToBooking} />
        <BookingFormMockup onPay={setPaymentData} />
        <TransfersBlock />
        <ReviewsBlock />
        <FeaturesSection />
        <ScheduleBlockMockup />
      </main>

      <Footer />

      <ChatWidget />

      <AnimatePresence>
        {paymentData && (
          <PaymentModal
            data={paymentData}
            onClose={() => setPaymentData(null)}
          />
        )}
        {isAuthOpen && <AuthModal onClose={() => setIsAuthOpen(false)} />}
        {isCabinetOpen && <CabinetModal onClose={() => setIsCabinetOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}

export default function MockupApp() {
  return (
    <AuthProvider>
      <MainAppMockup />
    </AuthProvider>
  );
}
