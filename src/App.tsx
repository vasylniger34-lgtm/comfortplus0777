import { useState } from 'react';
import { AnimatePresence } from 'framer-motion';

import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Hero from './components/Hero';
import BookingForm from './components/booking/BookingForm';
import PaymentModal from './components/payment/PaymentModal';
import ReviewsBlock from './components/reviews/ReviewsBlock';
import ChatWidget from './components/chat/ChatWidget';
import TransfersBlock from './components/transfers/TransfersBlock';

import type { BookingData } from './components/booking/BookingForm';

import { AuthProvider, useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import CabinetModal from './components/auth/CabinetModal';

function MainApp() {
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
        <BookingForm onPay={setPaymentData} />
        <TransfersBlock />
        <ReviewsBlock />
      </main>

      <Footer />

      {/* Floating chat widget */}
      <ChatWidget />

      {/* Modals */}
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

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
