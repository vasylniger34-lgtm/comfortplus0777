import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Star, FileText } from 'lucide-react';
import type { Review } from './ReviewsBlock';

interface ReviewModalProps {
  onClose: () => void;
  onSubmit: (review: Omit<Review, 'id' | 'verified' | 'date'>) => void;
}

export default function ReviewModal({ onClose, onSubmit }: ReviewModalProps) {
  const [author, setAuthor] = useState('');
  const [text, setText] = useState('');
  const [rating, setRating] = useState(5);
  const [receiptCode, setReceiptCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!author.trim() || !text.trim() || !receiptCode.trim()) {
      setError('Будь ласка, заповніть всі поля');
      return;
    }

    // Mock Validation: simple check if it looks like a valid code
    // In the future this should call a backend/Firebase function
    const upperCode = receiptCode.trim().toUpperCase();
    if (!upperCode.startsWith('CP') || upperCode.length < 5) {
      setError('Недійсний код квитанції. Введіть код у форматі CPXXXXXX з вашого PDF-квитка.');
      return;
    }

    onSubmit({
      author,
      text,
      rating,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md overflow-hidden z-10"
      >
        <div className="flex items-center justify-between p-4 border-b border-brand-border bg-brand-card">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <FileText size={18} className="text-brand-yellow" />
            Залишити відгук
          </h3>
          <button 
            onClick={onClose}
            className="text-brand-muted hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 text-sm p-3 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-brand-muted text-sm mb-1.5">Код квитанції (з PDF-квитка)*</label>
            <input
              type="text"
              value={receiptCode}
              onChange={(e) => setReceiptCode(e.target.value)}
              placeholder="Наприклад: CP123456"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-yellow/50 transition-colors placeholder:text-brand-muted/50"
            />
            <p className="text-xs text-brand-muted mt-1">Цей код знаходиться у верхньому правому куті вашого квитка.</p>
          </div>

          <div>
            <label className="block text-brand-muted text-sm mb-1.5">Ваше ім'я*</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Ім'я"
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-yellow/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-brand-muted text-sm mb-1.5">Оцінка</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    size={28}
                    className={star <= rating ? "text-brand-yellow fill-brand-yellow" : "text-brand-border"}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-brand-muted text-sm mb-1.5">Ваш відгук*</label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Напишіть ваші враження від поїздки..."
              rows={4}
              className="w-full bg-brand-dark border border-brand-border rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-yellow/50 transition-colors resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="btn-primary w-full py-3"
            >
              Відправити відгук
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
