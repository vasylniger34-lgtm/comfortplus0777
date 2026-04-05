import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://knfqgqursiflyxfefthr.supabase.co';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || 'sb_publishable_KatvO28-6LIwQdZeX0uIFA_gUwnPnHE';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    // Перевіряємо чи це повідомлення від адміністратора і чи є там ID сесії
    if (update.message && update.message.text && update.message.reply_to_message) {
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
