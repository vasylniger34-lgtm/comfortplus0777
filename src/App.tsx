import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/Hero';
import BookingForm from './components/booking/BookingForm';
import PaymentModal from './components/payment/PaymentModal';
import ScheduleBlock from './components/schedule/ScheduleBlock';
import ReviewsBlock from './components/reviews/ReviewsBlock';
import ChatWidget from './components/chat/ChatWidget';
import type { BookingData } from './components/booking/BookingForm';
import { motion } from 'framer-motion';
import { Shield, Clock, Star, Wifi } from 'lucide-react';

function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: 'Безпека та надійність',
      desc: 'Досвідчені водії, технічно справні Mercedes Sprinter з 2024 року',
    },
    {
      icon: Clock,
      title: 'Точний розклад',
      desc: 'Рейси щодня без вихідних. Точне відправлення за розкладом',
    },
    {
      icon: Star,
      title: 'Преміум комфорт',
      desc: 'просторий салон, клімат-контроль, м\'які сидіння та чистота',
    },
    {
      icon: Wifi,
      title: 'Онлайн бронювання',
      desc: 'Зручне бронювання онлайн з підтвердженням на телефон',
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

function App() {
  const [paymentData, setPaymentData] = useState<BookingData | null>(null);

  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      <Header onBookNow={scrollToBooking} />
      
      <main>
        <Hero onBookNow={scrollToBooking} />
        <FeaturesSection />
        <ScheduleBlock />
        <BookingForm onPay={setPaymentData} />
        <ReviewsBlock />
      </main>

      <Footer />

      {/* Floating chat widget */}
      <ChatWidget />

      {/* Payment modal */}
      <AnimatePresence>
        {paymentData && (
          <PaymentModal
            data={paymentData}
            onClose={() => setPaymentData(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
