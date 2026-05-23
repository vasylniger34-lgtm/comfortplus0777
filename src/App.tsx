import { useState } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
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
import { PrivacyPolicy, PublicOffer, RefundPolicy } from './components/legal/PolicyContent';

function HomePage({ 
  scrollToBooking, 
  setPaymentData 
}: { 
  scrollToBooking: () => void; 
  setPaymentData: (data: BookingData | null) => void 
}) {
  return (
    <main>
      <Hero onBookNow={scrollToBooking} />
      <BookingForm onPay={setPaymentData} />
      <TransfersBlock />
      <ReviewsBlock />
    </main>
  );
}

function LegalPage({ content: Content, title }: { content: React.FC, title: string }) {
  return (
    <main className="pt-32 pb-20 max-w-4xl mx-auto px-4">
      <div className="bg-brand-surface border border-brand-border rounded-3xl p-8 md:p-12 shadow-2xl">
        <Content />
      </div>
    </main>
  );
}

function MainApp() {
  const [paymentData, setPaymentData] = useState<BookingData | null>(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCabinetOpen, setIsCabinetOpen] = useState(false);
  const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' | 'refund' }>({
    isOpen: false,
    type: 'privacy'
  });
  
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = location.pathname === '/admin';

  const scrollToBooking = () => {
    const bookingElement = document.getElementById('booking');
    if (bookingElement) {
      bookingElement.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.location.href = '/#booking';
    }
  };

  const openLegal = (type: 'privacy' | 'terms' | 'refund') => {
    setLegalModal({ isOpen: true, type });
  };

  return (
    <div className="min-h-screen bg-brand-dark">
      {!isAdmin && (
        <Header 
          onBookNow={scrollToBooking} 
          onOpenCabinet={() => user ? setIsCabinetOpen(true) : setIsAuthOpen(true)}
        />
      )}
      
      <Routes>
        <Route path="/" element={<HomePage scrollToBooking={scrollToBooking} setPaymentData={setPaymentData} />} />
        <Route path="/oferta" element={<LegalPage content={PublicOffer} title="Договір оферти" />} />
        <Route path="/konfidenciinist" element={<LegalPage content={PrivacyPolicy} title="Політика конфіденційності" />} />
        <Route path="/povernenya" element={<LegalPage content={RefundPolicy} title="Повернення та оплата" />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>

      {!isAdmin && <Footer onOpenLegal={openLegal} />}

      <ChatWidget />

      <AnimatePresence>
        {paymentData && (
          <PaymentModal
            data={paymentData}
            onClose={() => setPaymentData(null)}
            onOpenLegal={openLegal}
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
    <BrowserRouter>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

