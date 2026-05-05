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
import LegalModal from './components/legal/LegalModal';

function MainApp() {
  const [paymentData, setPaymentData] = useState<BookingData | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' | 'refund' }>({
    isOpen: false,
    type: 'privacy'
  });
  
  const { user } = useAuth();

  const scrollToBooking = () => {
    document.getElementById('booking')?.scrollIntoView({ behavior: 'smooth' });
  };

  const openLegal = (type: 'privacy' | 'terms' | 'refund') => {
    setLegalModal({ isOpen: true, type });
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

      <Footer onOpenLegal={openLegal} />

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
        <LegalModal 
          isOpen={legalModal.isOpen} 
          type={legalModal.type} 
          onClose={() => setLegalModal(prev => ({ ...prev, isOpen: false }))} 
        />
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
