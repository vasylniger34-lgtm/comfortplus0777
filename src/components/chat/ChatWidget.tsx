import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

type Message = {
  id: string;
  text: string;
  from: 'user' | 'bot';
  ts: Date;
};

const BOT_REPLIES: Record<string, string> = {
  default: 'Добрий день! Я бот підтримки Comfort Plus 0777. Чим можу допомогти?\n\nЗапитайте мене про:\n• Розклад рейсів\n• Ціни на квитки\n• Маршрути\n• Бронювання',
  ціна: 'Ціна залежить від маршруту:\n🚌 Львів → Стебник — 200 грн\n🚌 Львів → Трускавець — 230 грн\n🚌 Львів → Борислав — 250 грн\n🚌 Львів → Східниця — 350 грн',
  розклад: 'Рейси відправляються щодня з Східниці починаючи з 05:50. Останній рейс о 17:40. З Львова — відповідно після прибуття. Перевірте блок "Розклад" на сторінці!',
  маршрут: 'Наш маршрут: Львів ↔ Стебник ↔ Трускавець ↔ Борислав ↔ Східниця. Зупинки по запиту!',
  бронювання: 'Забронювати місце можна прямо на сайті! Прокрутіть до блоку "Бронювання" або зателефонуйте:\n📞 098 00 119 00\n📞 097 00 119 00',
  привіт: 'Вітаю! 👋 Я бот підтримки Comfort Plus 0777. Запитайте про розклад, ціни або бронювання!',
  дякую: 'Радий допомогти! Гарної подорожі! 🚌✨',
};

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('ціна') || lower.includes('скільки') || lower.includes('коштує')) return BOT_REPLIES.ціна;
  if (lower.includes('розклад') || lower.includes('коли') || lower.includes('час')) return BOT_REPLIES.розклад;
  if (lower.includes('маршрут') || lower.includes('зупинк')) return BOT_REPLIES.маршрут;
  if (lower.includes('бронювання') || lower.includes('замовит') || lower.includes('купит')) return BOT_REPLIES.бронювання;
  if (lower.includes('привіт') || lower.includes('добрий') || lower.includes('вітаю') || lower.includes('hello')) return BOT_REPLIES.привіт;
  if (lower.includes('дякую') || lower.includes('дякуємо')) return BOT_REPLIES.дякую;
  return 'Чудове запитання! Для детальної інформації зверніться до нас:\n📞 098 00 119 00\n📞 097 00 119 00\n\nАбо напишіть у Instagram: @comfortplus0777';
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: BOT_REPLIES.default,
      from: 'bot',
      ts: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const [unread, setUnread] = useState(1);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setUnread(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      from: 'user',
      ts: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotReply(input),
        from: 'bot',
        ts: new Date(),
      };
      setMessages(prev => [...prev, botMsg]);
      setTyping(false);
    }, 1200);
  };

  const quickReplies = ['Розклад', 'Ціни', 'Маршрут', 'Бронювання'];

  return (
    <div className="fixed bottom-6 left-6 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-16 left-0 w-[320px] sm:w-[360px] card shadow-card-hover flex flex-col overflow-hidden"
            style={{ maxHeight: '480px' }}
          >
            {/* Chat header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-brand-yellow/10 border-b border-brand-border">
              <div className="w-9 h-9 bg-brand-yellow rounded-xl flex items-center justify-center flex-shrink-0">
                <Bot size={18} className="text-brand-dark" />
              </div>
              <div className="flex-1">
                <div className="text-white font-semibold text-sm">Comfort Plus Bot</div>
                <div className="flex items-center gap-1 text-brand-muted text-xs">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  Онлайн
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-brand-muted hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.from === 'bot' && (
                    <div className="w-6 h-6 bg-brand-yellow rounded-lg flex items-center justify-center mr-2 mt-1 flex-shrink-0">
                      <Bot size={12} className="text-brand-dark" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.from === 'user'
                        ? 'bg-brand-yellow text-brand-dark rounded-br-sm font-medium'
                        : 'bg-brand-surface border border-brand-border text-white rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              ))}

              {typing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="w-6 h-6 bg-brand-yellow rounded-lg flex items-center justify-center mr-2 mt-1">
                    <Bot size={12} className="text-brand-dark" />
                  </div>
                  <div className="bg-brand-surface border border-brand-border px-3 py-3 rounded-2xl rounded-bl-sm">
                    <div className="flex gap-1">
                      {[0, 1, 2].map(i => (
                        <motion.div
                          key={i}
                          animate={{ y: [0, -4, 0] }}
                          transition={{ delay: i * 0.15, duration: 0.6, repeat: Infinity }}
                          className="w-1.5 h-1.5 bg-brand-muted rounded-full"
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick replies */}
            <div className="px-3 pt-2 pb-1 flex gap-2 no-scrollbar overflow-x-auto">
              {quickReplies.map(qr => (
                <button
                  key={qr}
                  onClick={() => {
                    setInput(qr);
                    setTimeout(() => sendMessage(), 50);
                  }}
                  className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full border border-brand-yellow/30 text-brand-yellow hover:bg-brand-yellow/10 transition-all"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-brand-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Напишіть повідомлення..."
                  className="flex-1 bg-brand-surface border border-brand-border rounded-xl px-3 py-2.5 text-sm text-white placeholder-brand-muted focus:outline-none focus:border-brand-yellow transition-colors"
                />
                <button
                  onClick={sendMessage}
                  className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center hover:bg-brand-gold transition-colors flex-shrink-0"
                >
                  <Send size={16} className="text-brand-dark" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-brand-yellow rounded-2xl flex items-center justify-center shadow-brand-lg hover:bg-brand-gold transition-colors relative"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} className="text-brand-dark" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={24} className="text-brand-dark" />
            </motion.div>
          )}
        </AnimatePresence>

        {unread > 0 && !open && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold"
          >
            {unread}
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
