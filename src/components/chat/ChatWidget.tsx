import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

type Message = {
  id: string;
  text: string;
  from: 'user' | 'bot';
  ts: Date;
};

const BOT_REPLIES: Record<string, string> = {
  default: 'Добрий день! Я бот підтримки Comfort Plus 0777. Чим можу допомогти?\n\nЗапитайте мене про:\n• Розклад рейсів\n• Ціни на квитки\n• Маршрути\n• Бронювання',
  ціна: 'Ціна залежить від маршруту:\n🚌 Львів → Стебник — 200 грн\n🚌 Львів → Трускавець — 230 грн\n🚌 Львів → Борислав — 250 грн\n🚌 Львів → Східниця — 350 грн',
  розклад: 'Рейси відправляються щодня з Східниці починаючи з 05:50. Останній рейс о 20:40. З Львова — відповідно після прибуття. Перевірте блок "Розклад" на сторінці!',
  маршрут: 'Наш маршрут: Львів ↔ Стебник ↔ Трускавець ↔ Борислав ↔ Східниця. Зупинки по запиту!',
  бронювання: 'Забронювати місце можна прямо на сайті! Прокрутіть до блоку "Бронювання" або зателефонуйте:\n📞 098 00 119 00\n📞 097 00 119 00',
  привіт: 'Вітаю! 👋 Я бот підтримки Comfort Plus 0777. Запитайте про розклад, ціни або бронювання!',
  дякую: 'Радий допомогти! Гарної подорожі! 🚌✨',
};

// Список ID адміністраторів в Telegram
const ADMIN_CHAT_IDS = ['8472692319', '8618558820']; 

function getBotReply(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('ціна') || lower.includes('скільки') || lower.includes('коштує')) return BOT_REPLIES.ціна;
  if (lower.includes('розклад') || lower.includes('коли') || lower.includes('час')) return BOT_REPLIES.розклад;
  if (lower.includes('маршрут') || lower.includes('зупинк')) return BOT_REPLIES.маршрут;
  if (lower.includes('бронювання') || lower.includes('замовит') || lower.includes('купит')) return BOT_REPLIES.бронювання;
  if (lower.includes('привіт') || lower.includes('добрий') || lower.includes('вітаю') || lower.includes('hello')) return BOT_REPLIES.привіт;
  if (lower.includes('дякую') || lower.includes('дякуємо')) return BOT_REPLIES.дякую;
  return 'Ваше повідомлення надіслано диспетчеру ✅\n\nЯкщо вам потрібно зателефонувати вкажіть ваш номер або @нікнейм, і ми швидко звʼяжемося з вами!';
}

export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [isIdentified, setIsIdentified] = useState(false);
  const [idForm, setIdForm] = useState({ name: '', phone: '' });

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
  const [sessionId, setSessionId] = useState<string>('');

  useEffect(() => {
    // Авто-заповнення якщо користувач авторизований
    if (user) {
        setIsIdentified(true);
        setIdForm({ name: user.name || '', phone: user.phone || '' });
    } else {
        const savedName = localStorage.getItem('chat_user_name');
        const savedPhone = localStorage.getItem('chat_user_phone');
        if (savedName && savedPhone) {
            setIsIdentified(true);
            setIdForm({ name: savedName, phone: savedPhone });
        }
    }

    let sId = localStorage.getItem('chat_session_id');
    if (!sId) {
      sId = Math.random().toString(36).substring(2, 12);
      localStorage.setItem('chat_session_id', sId);
    }
    setSessionId(sId);

    const loadHistory = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('session_id', sId)
        .order('created_at', { ascending: true });

      if (data && !error) {
        const history: Message[] = data.map(m => ({
          id: m.id,
          text: m.text,
          from: m.is_bot_reply ? 'bot' : 'user',
          ts: new Date(m.created_at)
        }));
        setMessages(prev => [...prev, ...history]);
      }
    };

    loadHistory();

    const channel = supabase
      .channel('chat_messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'chat_messages',
        filter: `session_id=eq.${sId}`
      }, (payload) => {
        const newMsg = payload.new;
        if (newMsg.is_bot_reply) {
          setMessages(prev => {
            if (prev.find(m => m.id === newMsg.id)) return prev;
            return [...prev, {
              id: newMsg.id,
              text: newMsg.text,
              from: 'bot',
              ts: new Date(newMsg.created_at)
            }];
          });
          if (!open) setUnread(u => u + 1);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (open) {
      setUnread(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [open, messages]);

  const handleIdentify = (e: React.FormEvent) => {
      e.preventDefault();
      if (idForm.name.trim() && idForm.phone.trim()) {
          setIsIdentified(true);
          localStorage.setItem('chat_user_name', idForm.name);
          localStorage.setItem('chat_user_phone', idForm.phone);
      }
  };

  const sendMessage = async () => {
    if (!input.trim() || !isIdentified) return;
    
    const text = input;
    const tempId = Date.now().toString();
    
    const userMsg: Message = {
      id: tempId,
      text: text,
      from: 'user',
      ts: new Date(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);

    await supabase
      .from('chat_messages')
      .insert([
        { session_id: sessionId, text: text, is_bot_reply: false }
      ]);

    // Відправка в Telegram всім адмінам
    try {
      const botToken = '8615069227:AAEiCjdj66e469JqarZxWSlfzFQs1jGkr4M';
      const adminText = `📩 Нове звернення з сайту [ID: ${sessionId}]:\n👤 Ім'я: ${idForm.name}\n📞 Тел: ${idForm.phone}\n\n💬 ${text}`;
      
      for (const adminId of ADMIN_CHAT_IDS) {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            chat_id: adminId,
            text: adminText
          })
        });
      }
    } catch (e) {
      console.error('Telegram error', e);
    }

    setTimeout(() => {
      const replyText = getBotReply(text);
      if (replyText !== BOT_REPLIES.default) {
        const alreadyNotified = messages.some(m => m.text.includes('надіслано диспетчеру'));
        
        if (replyText.includes('надіслано диспетчеру') && alreadyNotified) {
            setTyping(false);
            return;
        }

        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: replyText,
          from: 'bot',
          ts: new Date(),
        };
        setMessages(prev => [...prev, botMsg]);
      }
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
            style={{ maxHeight: '520px' }}
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

            <div className="flex-1 flex flex-col relative overflow-hidden">
              {!isIdentified ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-12 h-12 bg-brand-yellow/10 rounded-full flex items-center justify-center mb-4">
                    <User size={24} className="text-brand-yellow" />
                  </div>
                  <h3 className="text-white font-bold mb-2">Представтеся, будь ласка</h3>
                  <p className="text-brand-muted text-xs mb-6">
                    Залиште ваші контакти, щоб диспетчер міг зв'язатися з вами для уточнення деталей.
                  </p>
                  
                  <form onSubmit={handleIdentify} className="w-full space-y-4">
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                      <input
                        required
                        type="text"
                        placeholder="Ваше ім'я"
                        value={idForm.name}
                        onChange={e => setIdForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full bg-brand-surface border border-brand-border rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-yellow"
                      />
                    </div>
                    <div className="relative">
                      <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                      <input
                        required
                        type="tel"
                        placeholder="Номер телефону"
                        value={idForm.phone}
                        onChange={e => setIdForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full bg-brand-surface border border-brand-border rounded-xl pl-10 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-brand-yellow"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-brand-yellow text-brand-dark font-bold py-3 rounded-xl hover:bg-brand-gold transition-colors"
                    >
                      Почати чат
                    </button>
                  </form>
                </div>
              ) : (
                <>
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
                  <div className="px-3 pt-2 pb-1 flex gap-2 no-scrollbar overflow-x-auto border-t border-brand-border/50 bg-brand-surface/20">
                    {quickReplies.map(qr => (
                      <button
                        key={qr}
                        onClick={() => {
                          setInput(qr);
                          setTimeout(() => {
                              const btn = document.getElementById('chat-send-btn');
                              btn?.click();
                          }, 10);
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
                        id="chat-send-btn"
                        onClick={sendMessage}
                        className="w-10 h-10 bg-brand-yellow rounded-xl flex items-center justify-center hover:bg-brand-gold transition-colors flex-shrink-0"
                      >
                        <Send size={16} className="text-brand-dark" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
