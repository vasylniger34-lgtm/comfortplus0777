import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { dbQuery } from './db.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Логгер запитів
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Список авторизованих адміністраторів для Telegram Webhook
const AUTHORIZED_ADMINS = [8472692319, 8618558820];
const TELEGRAM_BOT_TOKEN = '8615069227:AAEiCjdj66e469JqarZxWSlfzFQs1jGkr4M';

// Хелпери для визначення екіпажів та напрямків
const isLvivToSkhidnytsia = (from, to) => {
  const lvivRoute = ['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'];
  const fromIdx = lvivRoute.indexOf(from);
  const toIdx = lvivRoute.indexOf(to);
  return fromIdx !== -1 && toIdx !== -1 && fromIdx < toIdx;
};

const getCrewByTime = (time, fromCity, toCity) => {
  const isLvivDeparture = isLvivToSkhidnytsia(fromCity, toCity);
  if (isLvivDeparture) {
    const mapping = {
      '09:00': '06:20', '14:50': '06:20',
      '10:15': '07:10', '16:10': '07:10',
      '11:10': '08:15', '18:20': '08:15',
      '12:20': '09:30', '19:20': '09:30',
      '13:10': '10:35', '20:00': '10:35',
      '14:10': '11:10', '20:40': '11:10',
    };
    return mapping[time] || '';
  } else {
    const mapping = {
      '06:20': '06:20', '12:00': '06:20',
      '07:10': '07:10', '13:20': '07:10',
      '08:15': '08:15', '15:30': '08:15',
      '09:30': '09:30', '16:20': '09:30',
      '10:35': '10:35', '17:00': '10:35',
      '11:10': '11:10', '17:40': '11:10',
    };
    return mapping[time] || '';
  }
};


// ==========================================
// 1. АВТОРИЗАЦІЯ (AUTH)
// ==========================================

// Реєстрація
app.post('/api/auth/register', async (req, res) => {
  const { name, phone, password } = req.body;
  if (!name || !phone || !password) {
    return res.status(400).json({ error: 'Заповніть всі обов\'язкові поля' });
  }

  try {
    const existing = await dbQuery.get('SELECT id FROM profiles WHERE phone = ?', [phone]);
    if (existing) {
      return res.status(400).json({ error: 'Користувач з таким номером телефону вже існує' });
    }

    const id = 'usr_' + Date.now() + Math.random().toString(36).substr(2, 4);
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    await dbQuery.run(
      'INSERT INTO profiles (id, name, phone, password_hash, completed_rides, balance) VALUES (?, ?, ?, ?, 0, 0.0)',
      [id, name, phone, passwordHash]
    );

    const user = await dbQuery.get('SELECT id, name, phone, password_hash, completed_rides, balance FROM profiles WHERE id = ?', [id]);
    res.status(201).json(user);
  } catch (err) {
    console.error('Помилка реєстрації:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Вхід
app.post('/api/auth/login', async (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json({ error: 'Вкажіть номер телефону та пароль' });
  }

  try {
    const rawPhone = phone.replace(/\D/g, '').slice(-9); // Останні 9 цифр
    const user = await dbQuery.get(
      'SELECT id, name, phone, password_hash, completed_rides, balance FROM profiles WHERE phone LIKE ?',
      [`%${rawPhone}`]
    );

    if (!user) {
      return res.status(400).json({ error: 'Невірний номер телефону або пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Невірний номер телефону або пароль' });
    }

    res.json(user);
  } catch (err) {
    console.error('Помилка входу:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Профіль
app.get('/api/auth/profile/:id', async (req, res) => {
  try {
    const user = await dbQuery.get(
      'SELECT id, name, phone, password_hash, completed_rides, balance FROM profiles WHERE id = ?',
      [req.params.id]
    );
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Оновити баланс
app.post('/api/auth/update-balance', async (req, res) => {
  const { userId, amount } = req.body;
  if (!userId || amount === undefined) {
    return res.status(400).json({ error: 'Вкажіть userId та суму' });
  }

  try {
    const user = await dbQuery.get('SELECT balance FROM profiles WHERE id = ?', [userId]);
    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    const newBalance = user.balance + amount;
    await dbQuery.run('UPDATE profiles SET balance = ? WHERE id = ?', [newBalance, userId]);

    res.json({ balance: newBalance });
  } catch (err) {
    console.error('Помилка оновлення балансу:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ==========================================
// 2. БРОНЮВАННЯ (BOOKINGS)
// ==========================================

// Отримати список відновлених бронювань з підтримкою обох моделей
app.get('/api/bookings', async (req, res) => {
  const { user_id, date, crew } = req.query;

  try {
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (user_id) {
      sql += ' AND user_id = ?';
      params.push(user_id);
    }
    if (date) {
      sql += ' AND bus_date = ?';
      params.push(date);
    }
    if (crew) {
      sql += ' AND crew = ?';
      params.push(crew);
    }

    sql += ' ORDER BY departure_time ASC, created_at DESC';
    const rows = await dbQuery.all(sql, params);
    
    // Відображаємо обидва набори назв властивостей для сумісності з обома Supabase-схемами
    const mapped = rows.map(row => ({
      ...row,
      from: row.bus_from,
      to: row.bus_to,
      date: row.bus_date,
      name: row.passenger_name,
      phone: row.passenger_phone
    }));

    res.json(mapped);
  } catch (err) {
    console.error('Помилка отримання бронювань:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Створити бронювання
app.post('/api/bookings', async (req, res) => {
  const {
    user_id,
    bus_from,
    bus_to,
    bus_date,
    departure_time,
    seats,
    price,
    passenger_name,
    passenger_phone,
    pickup_location,
    crew,
    status,
    updated_by,
    // також сумісні поля
    from,
    to,
    date,
    name,
    phone
  } = req.body;

  const f_from = bus_from || from;
  const f_to = bus_to || to;
  const f_date = bus_date || date;
  const f_name = passenger_name || name;
  const f_phone = passenger_phone || phone;

  // Автоматичне вирахування екіпажу якщо поле пусте
  let finalCrew = crew;
  if (!finalCrew) {
    finalCrew = getCrewByTime(departure_time, f_from, f_to);
  }

  try {
    const id = 'bk_' + Date.now() + Math.random().toString(36).substr(2, 4);
    await dbQuery.run(
      `INSERT INTO bookings (
        id, user_id, bus_from, bus_to, bus_date, departure_time, 
        seats, price, status, passenger_name, passenger_phone, 
        pickup_location, crew, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, user_id, f_from, f_to, f_date, departure_time,
        seats, price, status || 'active', f_name, f_phone,
        pickup_location, finalCrew, updated_by || 'Клієнт'
      ]
    );

    // Лояльність: оновити completed_rides
    if (user_id) {
      const user = await dbQuery.get('SELECT completed_rides FROM profiles WHERE id = ?', [user_id]);
      if (user) {
        let newCompletedRides = user.completed_rides;
        if (price === 0) {
          newCompletedRides = 0;
        } else {
          newCompletedRides += 1;
        }
        await dbQuery.run('UPDATE profiles SET completed_rides = ? WHERE id = ?', [newCompletedRides, user_id]);
      }
    }

    const row = await dbQuery.get('SELECT * FROM bookings WHERE id = ?', [id]);
    const mapped = {
      ...row,
      from: row.bus_from,
      to: row.bus_to,
      date: row.bus_date,
      name: row.passenger_name,
      phone: row.passenger_phone
    };
    
    // Сповіщення в реалтаймі
    io.emit('bookings_changed');
    
    res.status(201).json(mapped);
  } catch (err) {
    console.error('Помилка створення бронювання:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Редагувати / скасувати бронювання
app.put('/api/bookings/:id', async (req, res) => {
  const { 
    status, 
    pickup_location, 
    seats, 
    price, 
    departure_time, 
    crew,
    from,
    to,
    date,
    name,
    phone,
    updated_by
  } = req.body;
  const id = req.params.id;

  try {
    const booking = await dbQuery.get('SELECT * FROM bookings WHERE id = ?', [id]);
    if (!booking) {
      return res.status(404).json({ error: 'Бронювання не знайдено' });
    }

    const updatedStatus = status !== undefined ? status : booking.status;
    const updatedPickup = pickup_location !== undefined ? pickup_location : booking.pickup_location;
    const updatedSeats = seats !== undefined ? seats : booking.seats;
    const updatedPrice = price !== undefined ? price : booking.price;
    const updatedTime = departure_time !== undefined ? departure_time : booking.departure_time;
    const updatedCrew = crew !== undefined ? crew : booking.crew;
    
    const updatedFrom = from !== undefined ? from : booking.bus_from;
    const updatedTo = to !== undefined ? to : booking.bus_to;
    const updatedDate = date !== undefined ? date : booking.bus_date;
    const updatedName = name !== undefined ? name : booking.passenger_name;
    const updatedPhone = phone !== undefined ? phone : booking.passenger_phone;
    const updatedBy = updated_by !== undefined ? updated_by : booking.updated_by;

    await dbQuery.run(
      `UPDATE bookings SET 
        status = ?, pickup_location = ?, seats = ?, price = ?, 
        departure_time = ?, crew = ?, bus_from = ?, bus_to = ?,
        bus_date = ?, passenger_name = ?, passenger_phone = ?,
        updated_by = ?
      WHERE id = ?`,
      [
        updatedStatus, updatedPickup, updatedSeats, updatedPrice, 
        updatedTime, updatedCrew, updatedFrom, updatedTo, 
        updatedDate, updatedName, updatedPhone, updatedBy, id
      ]
    );

    // Якщо це скасування платного квитка, повертаємо кошти на баланс користувача
    if (booking.user_id && updatedStatus === 'cancelled' && booking.status === 'active' && booking.price > 0) {
      const user = await dbQuery.get('SELECT balance FROM profiles WHERE id = ?', [booking.user_id]);
      if (user) {
        const newBalance = user.balance + booking.price;
        await dbQuery.run('UPDATE profiles SET balance = ? WHERE id = ?', [newBalance, booking.user_id]);
      }
    }

    const row = await dbQuery.get('SELECT * FROM bookings WHERE id = ?', [id]);
    const mapped = {
      ...row,
      from: row.bus_from,
      to: row.bus_to,
      date: row.bus_date,
      name: row.passenger_name,
      phone: row.passenger_phone
    };
    
    // Сповіщення в реалтаймі
    io.emit('bookings_changed');

    res.json(mapped);
  } catch (err) {
    console.error('Помилка оновлення бронювання:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Видалити бронювання
app.delete('/api/bookings/:id', async (req, res) => {
  try {
    await dbQuery.run('DELETE FROM bookings WHERE id = ?', [req.params.id]);
    io.emit('bookings_changed');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ==========================================
// 2A. РОЗКЛАД ЕКІПАЖІВ (CREW SCHEDULES)
// ==========================================

// Отримати розклад на день
app.get('/api/schedules', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Вкажіть дату (date)' });
  }

  try {
    const rows = await dbQuery.all(
      'SELECT * FROM crew_schedules WHERE date = ? ORDER BY created_at ASC',
      [date]
    );
    res.json(rows);
  } catch (err) {
    console.error('Помилка отримання розкладу:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Створити розклад
app.post('/api/schedules', async (req, res) => {
  const {
    date,
    crew_name,
    driver_id,
    car,
    run1_time,
    run2_time,
    run3_time,
    run4_time
  } = req.body;

  if (!date || !crew_name || !run1_time || !run2_time || !run3_time || !run4_time) {
    return res.status(400).json({ error: 'Заповніть всі обов\'язкові поля' });
  }

  try {
    const id = 'sch_' + Date.now() + Math.random().toString(36).substr(2, 4);
    await dbQuery.run(
      `INSERT INTO crew_schedules (
        id, date, crew_name, driver_id, car, 
        run1_time, run2_time, run3_time, run4_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, date, crew_name, driver_id || null, car || null,
        run1_time, run2_time, run3_time, run4_time
      ]
    );

    const row = await dbQuery.get('SELECT * FROM crew_schedules WHERE id = ?', [id]);
    io.emit('schedules_changed');
    res.status(201).json(row);
  } catch (err) {
    console.error('Помилка створення розкладу:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Оновити розклад
app.put('/api/schedules/:id', async (req, res) => {
  const {
    driver_id,
    car,
    run1_time,
    run2_time,
    run3_time,
    run4_time,
    crew_name
  } = req.body;
  const id = req.params.id;

  try {
    const schedule = await dbQuery.get('SELECT * FROM crew_schedules WHERE id = ?', [id]);
    if (!schedule) {
      return res.status(404).json({ error: 'Розклад не знайдено' });
    }

    const updatedDriverId = driver_id !== undefined ? driver_id : schedule.driver_id;
    const updatedCar = car !== undefined ? car : schedule.car;
    const updatedRun1 = run1_time !== undefined ? run1_time : schedule.run1_time;
    const updatedRun2 = run2_time !== undefined ? run2_time : schedule.run2_time;
    const updatedRun3 = run3_time !== undefined ? run3_time : schedule.run3_time;
    const updatedRun4 = run4_time !== undefined ? run4_time : schedule.run4_time;
    const updatedCrewName = crew_name !== undefined ? crew_name : schedule.crew_name;

    await dbQuery.run(
      `UPDATE crew_schedules SET 
        driver_id = ?, car = ?, run1_time = ?, run2_time = ?, 
        run3_time = ?, run4_time = ?, crew_name = ?
      WHERE id = ?`,
      [
        updatedDriverId, updatedCar, updatedRun1, updatedRun2,
        updatedRun3, updatedRun4, updatedCrewName, id
      ]
    );

    const row = await dbQuery.get('SELECT * FROM crew_schedules WHERE id = ?', [id]);
    io.emit('schedules_changed');
    res.json(row);
  } catch (err) {
    console.error('Помилка оновлення розкладу:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Видалити розклад
app.delete('/api/schedules/:id', async (req, res) => {
  try {
    await dbQuery.run('DELETE FROM crew_schedules WHERE id = ?', [req.params.id]);
    io.emit('schedules_changed');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ==========================================
// 3. ВОДІЇ (DRIVERS)
// ==========================================

app.get('/api/drivers', async (req, res) => {
  try {
    const drivers = await dbQuery.all('SELECT * FROM driver_profiles ORDER BY name ASC');
    res.json(drivers);
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.post('/api/drivers', async (req, res) => {
  const { name, phone, pin_code } = req.body;
  try {
    const id = 'drv_' + Date.now();
    await dbQuery.run(
      'INSERT INTO driver_profiles (id, name, phone, pin_code) VALUES (?, ?, ?, ?)',
      [id, name, phone, pin_code]
    );
    const newDriver = await dbQuery.get('SELECT * FROM driver_profiles WHERE id = ?', [id]);
    io.emit('assignments_changed');
    res.json(newDriver);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      if (err.message.includes('pin_code')) {
        return res.status(400).json({ error: 'Водій з таким PIN-кодом вже існує в базі даних' });
      }
      if (err.message.includes('phone')) {
        return res.status(400).json({ error: 'Водій з таким телефоном вже існує в базі даних' });
      }
      return res.status(400).json({ error: 'Водій з такими даними вже існує в базі даних' });
    }
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.delete('/api/drivers/:id', async (req, res) => {
  try {
    await dbQuery.run('DELETE FROM driver_profiles WHERE id = ?', [req.params.id]);
    // Видаляємо призначення водія
    await dbQuery.run('DELETE FROM driver_assignments WHERE driver_id = ?', [req.params.id]);
    io.emit('assignments_changed');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.get('/api/drivers/by-pin/:pin', async (req, res) => {
  try {
    const driver = await dbQuery.get('SELECT * FROM driver_profiles WHERE pin_code = ?', [req.params.pin]);
    res.json(driver || null);
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ==========================================
// 4. ПРИЗНАЧЕННЯ (ASSIGNMENTS)
// ==========================================

app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await dbQuery.all('SELECT * FROM driver_assignments WHERE date = ?', [req.query.date]);
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.post('/api/assignments', async (req, res) => {
  const { driver_id, car, crew, date } = req.body;
  try {
    if (!driver_id && !car) {
      await dbQuery.run('DELETE FROM driver_assignments WHERE crew = ? AND date = ?', [crew, date]);
    } else {
      const existing = await dbQuery.get('SELECT id FROM driver_assignments WHERE crew = ? AND date = ?', [crew, date]);
      if (existing) {
        await dbQuery.run(
          'UPDATE driver_assignments SET driver_id = ?, car = ? WHERE id = ?',
          [driver_id, car, existing.id]
        );
      } else {
        const id = 'asg_' + Date.now();
        await dbQuery.run(
          'INSERT INTO driver_assignments (id, driver_id, car, crew, date) VALUES (?, ?, ?, ?, ?)',
          [id, driver_id, car, crew, date]
        );
      }
    }
    io.emit('assignments_changed');
    res.json({ success: true });
  } catch (err) {
    console.error('Помилка призначення:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ==========================================
// 5. ЧАТ ТА TELEGRAM WEBHOOK
// ==========================================

// Отримати повідомлення чату
app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const messages = await dbQuery.all(
      'SELECT * FROM chat_messages WHERE session_id = ? ORDER BY created_at ASC',
      [req.params.sessionId]
    );
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Відправити повідомлення
app.post('/api/chat', async (req, res) => {
  const { session_id, text, is_bot_reply } = req.body;
  try {
    const id = 'msg_' + Date.now();
    const isBot = is_bot_reply ? 1 : 0;
    
    await dbQuery.run(
      'INSERT INTO chat_messages (id, session_id, text, is_bot_reply) VALUES (?, ?, ?, ?)',
      [id, session_id, text, isBot]
    );

    const message = await dbQuery.get('SELECT * FROM chat_messages WHERE id = ?', [id]);
    
    // Сповіщення через сокети в конкретну кімнату сесії
    io.to(session_id).emit('chat_message', message);
    // Також сповіщаємо глобально, якщо диспетчер дивиться
    io.emit('global_chat_message', message);

    res.json(message);
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Telegram Webhook
app.post('/api/telegram/webhook', async (req, res) => {
  try {
    const update = req.body;
    console.log('Отримано оновлення Telegram Webhook:', JSON.stringify(update));

    // Команда /myid
    if (update.message && update.message.text === '/myid') {
      const chatId = update.message.chat.id;
      
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: `Ваш Telegram ID: ${chatId}\n\nПовідомте цей ID розробнику, щоб отримати доступ.`
        })
      });
      return res.json({ ok: true });
    }

    // Перевірка відповіді від адміністратора
    if (update.message && update.message.text && update.message.reply_to_message) {
      const senderId = update.message.from.id;
      
      if (!AUTHORIZED_ADMINS.includes(senderId)) {
        console.warn(`Неавторизований адмін намагається відповісти. ID: ${senderId}`);
        return res.json({ ok: true });
      }

      const replyTo = update.message.reply_to_message.text;
      const sessionMatch = replyTo.match(/\[ID: ([a-zA-Z0-9_-]+)\]/);
      
      if (sessionMatch) {
        const sessionId = sessionMatch[1];
        const text = update.message.text;
        const id = 'msg_' + Date.now();

        await dbQuery.run(
          'INSERT INTO chat_messages (id, session_id, text, is_bot_reply) VALUES (?, ?, ?, 1)',
          [id, sessionId, text]
        );

        const message = await dbQuery.get('SELECT * FROM chat_messages WHERE id = ?', [id]);
        
        // Відправляємо в реалтаймі клієнту через Сокети
        io.to(sessionId).emit('chat_message', message);
        io.emit('global_chat_message', message);
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Помилка обробника Telegram Webhook:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ==========================================
// SOCKET.IO КЛІЄНТСЬКІ КІМНАТИ
// ==========================================
io.on('connection', (socket) => {
  console.log('Нове підключення Socket.io:', socket.id);
  
  socket.on('join_chat', (sessionId) => {
    socket.join(sessionId);
    console.log(`Клієнт ${socket.id} приєднався до кімнати чату: ${sessionId}`);
  });

  socket.on('disconnect', () => {
    console.log('Клієнт від\'єднався:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Сервер Comfort Plus працює на порту ${PORT}`);
});
