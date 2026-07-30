import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Star, MessageSquareQuote, ShieldCheck } from 'lucide-react';
import ReviewModal from './ReviewModal';

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  text: string;
  verified: boolean;
}

const MOCK_REVIEWS: Review[] = [
  {
    id: 'rev-1',
    author: 'Максим',
    rating: 5,
    date: '2026-03-15',
    text: 'Дуже комфортна поїздка! Водій ввічливий, мікроавтобус новий та чистий. Прибули точно за розкладом.',
    verified: true,
  },
  {
    id: 'rev-2',
    author: 'Олена',
    rating: 5,
    date: '2026-03-20',
    text: 'Дякую за гарний сервіс. Було зручно забронювати квиток онлайн, і ціна приємна. Буду звертатись ще!',
    verified: true,
  },
  {
    id: 'rev-3',
    author: 'Ігор',
    rating: 4,
    date: '2026-03-28',
    text: 'Все супер, їхали швидко і з комфортом. Єдиний мінус – була невелика тягнучка на виїзді зі Львова, але доїхали все одно майже вчасно.',
    verified: true,
  }
];

export default function ReviewsBlock() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // Load reviews from LocalStorage + merge with mock
    const saved = localStorage.getItem('comfort_plus_reviews');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setReviews([...parsed, ...MOCK_REVIEWS]);
      } catch (e) {
        setReviews(MOCK_REVIEWS);
      }
    } else {
      setReviews(MOCK_REVIEWS);
    }
  }, []);

  const handleAddReview = (newReview: Omit<Review, 'id' | 'verified' | 'date'>) => {
    const review: Review = {
      ...newReview,
      id: `rev-${Date.now()}`,
      verified: true,
      date: new Date().toISOString().split('T')[0],
    };
    
    // Save to LocalStorage
    const saved = localStorage.getItem('comfort_plus_reviews');
    let updated = [review];
    if (saved) {
      try {
        updated = [review, ...JSON.parse(saved)];
      } catch (e) {}
    }
    localStorage.setItem('comfort_plus_reviews', JSON.stringify(updated));
    
    // Update State
    setReviews([review, ...reviews]);
    setIsModalOpen(false);
  };

  return (
    <section id="reviews" className="py-20 bg-brand-surface relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 text-brand-yellow font-semibold mb-3 tracking-wide text-sm uppercase"
          >
            <MessageSquareQuote size={16} />
            <span>Відгуки</span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-4xl font-display font-bold text-white mb-4"
          >
            Що кажуть наші клієнти
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-brand-muted max-w-2xl mx-auto"
          >
            Ми цінуємо кожного пасажира. Залиште свій відгук за номером квитанції, щоб допомогти нам стати краще.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {reviews.slice(0, 6).map((review, idx) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="bg-brand-card border border-brand-border rounded-2xl p-6 relative group hover:border-brand-yellow/30 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="font-semibold text-white">{review.author}</div>
                {review.verified && (
                  <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-md">
                    <ShieldCheck size={12} />
                    <span>Перевірено</span>
                  </div>
                )}
              </div>
              <div className="flex gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < review.rating ? "text-brand-yellow fill-brand-yellow" : "text-brand-border"}
                  />
                ))}
              </div>
              <p className="text-brand-light text-sm leading-relaxed mb-4">"{review.text}"</p>
              <div className="text-brand-muted text-xs">
                {new Date(review.date).toLocaleDateString('uk-UA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex justify-center"
        >
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary"
          >
            Залишити відгук
          </button>
        </motion.div>
      </div>

      {isModalOpen && (
        <ReviewModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddReview}
        />
      )}
    </section>
  );
}
