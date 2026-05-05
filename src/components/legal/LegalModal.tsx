import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { PrivacyPolicy, PublicOffer, RefundPolicy } from './PolicyContent';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms' | 'refund';
}

export default function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
          onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl max-h-[80vh] bg-brand-card border border-brand-border rounded-3xl overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface/50">
              <div className="font-display font-bold text-white text-lg">
                {type === 'privacy' && 'Політика конфіденційності'}
                {type === 'terms' && 'Договір оферти'}
                {type === 'refund' && 'Повернення та оплата'}
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 flex items-center justify-center rounded-xl border border-brand-border text-brand-muted hover:text-white hover:border-brand-yellow transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              {type === 'privacy' && <PrivacyPolicy />}
              {type === 'terms' && <PublicOffer />}
              {type === 'refund' && <RefundPolicy />}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-brand-border bg-brand-surface/30 flex justify-end">
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-brand-yellow text-brand-dark font-bold hover:shadow-brand transition-all"
              >
                Зрозуміло
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
