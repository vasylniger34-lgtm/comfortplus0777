import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://knfqgqursiflyxfefthr.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_KatvO28-6LIwQdZeX0uIFA_gUwnPnHE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Список авторизованих адміністраторів
const AUTHORIZED_ADMINS = [8472692319, 8618558820];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    const botToken = '8615069227:AAEiCjdj66e469JqarZxWSlfzFQs1jGkr4M';
    
    // Команда /myid для отримання ID чату
    if (update.message && update.message.text === '/myid') {
      const chatId = update.message.chat.id;
      
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Ваш Telegram ID: ${chatId}\n\nБудь ласка, повідомте цей ID адміністратору, щоб отримати доступ до чату.`
        })
      });
      return res.status(200).json({ ok: true });
    }
    
    // Перевіряємо чи це повідомлення від адміністратора і чи є там ID сесії
    if (update.message && update.message.text && update.message.reply_to_message) {
      const senderId = update.message.from.id;
      
      // Перевірка прав доступу (тільки адміни можуть відповідати)
      if (!AUTHORIZED_ADMINS.includes(senderId)) {
          console.warn(`Unauthorized reply attempt from ID: ${senderId}`);
          return res.status(200).json({ ok: true }); // Ігноруємо
      }

      const replyTo = update.message.reply_to_message.text;
      
      // Шукаємо "[ID: session_id]" у тексті
      const sessionMatch = replyTo.match(/\[ID: ([a-zA-Z0-9]+)\]/);
      
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        const text = update.message.text;
        
        // Записуємо відповідь адміністратора у базу даних Supabase
        const { error } = await supabase
          .from('chat_messages')
          .insert([
            { session_id: sessionId, text: text, is_bot_reply: true }
          ]);
          
        if (error) {
          console.error('Supabase insert error', error);
          return res.status(500).json({ error: 'DB Error' });
        }
      }
    }
    
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telegram Handler Error', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
