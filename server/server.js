import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import { dbQuery } from './db.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../.env') });

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
app.use(express.urlencoded({ extended: true }));

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

const normalizeTime = (time) => {
  if (!time) return '';
  const trimmed = time.trim().replace('.', ':');
  const timeRegex = /^(\d{1,2}):(\d{2})$/;
  const match = trimmed.match(timeRegex);
  if (match) {
    const hours = match[1].padStart(2, '0');
    const minutes = match[2];
    return `${hours}:${minutes}`;
  }
  return trimmed;
};

const normalizeCrewName = (name) => {
  if (!name) return '';
  const trimmed = name.trim();
  const normalizedTime = normalizeTime(trimmed);
  if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
    return normalizedTime;
  }
  return trimmed;
};

const getCrewByTime = (time, fromCity, toCity) => {
  const isLvivDeparture = isLvivToSkhidnytsia(fromCity, toCity);
  const normTime = normalizeTime(time);
  if (isLvivDeparture) {
    const mapping = {
      '08:10': '05:50', '14:10': '05:50',
      '09:00': '06:20', '09:15': '06:20', '14:50': '06:20', '15:30': '06:20',
      '10:15': '07:10', '16:10': '07:10',
      '11:10': '08:15', '17:10': '08:15',
      '11:50': '08:50', '18:20': '08:50',
      '12:20': '09:30', '19:20': '09:30',
      '13:10': '10:35', '20:00': '10:35',
      '14:50': '12:00', '17:40': '12:00', '20:20': '12:00', '20:40': '12:00'
    };
    return mapping[normTime] || normTime || '06:20';
  } else {
    const mapping = {
      '05:50': '05:50', '11:10': '05:50',
      '06:20': '06:20', '12:00': '06:20', '12:40': '06:20',
      '07:10': '07:10', '13:20': '07:10',
      '08:15': '08:15', '14:10': '08:15',
      '08:50': '08:50', '15:30': '08:50',
      '09:30': '09:30', '16:20': '09:30',
      '10:35': '10:35', '17:00': '10:35',
      '11:10': '11:10', '17:40': '11:10',
      '12:00': '12:00'
    };
    return mapping[normTime] || normTime || '06:20';
  }
};

async function splitBookingIfMultiple(bookingId) {
  try {
    const booking = await dbQuery.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) return;

    if (booking.seats > 1 && booking.status === 'active') {
      const N = booking.seats;
      const basePrice = Math.floor(booking.price / N);
      const remainder = booking.price - (basePrice * N);

      const baseName = booking.passenger_name.replace(/\s*\(Місце\s*\d+\)$/, '');
      const firstPrice = basePrice + remainder;
      const firstPassengerName = `${baseName} (Місце 1)`;

      // Update the first booking (this one) to have 1 seat
      await dbQuery.run(
        `UPDATE bookings SET seats = 1, price = ?, passenger_name = ? WHERE id = ?`,
        [firstPrice, firstPassengerName, bookingId]
      );

      // Insert N - 1 new bookings of 1 seat each
      for (let i = 2; i <= N; i++) {
        const newId = `${bookingId}_${i}`;
        const newPassengerName = `${baseName} (Місце ${i})`;
        
        await dbQuery.run(
          `INSERT INTO bookings (
            id, user_id, bus_from, bus_to, bus_date, departure_time, 
            seats, price, status, passenger_name, passenger_phone, 
            pickup_location, crew, updated_by, is_paid_online, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            newId,
            booking.user_id,
            booking.bus_from,
            booking.bus_to,
            booking.bus_date,
            booking.departure_time,
            1,
            basePrice,
            booking.status,
            newPassengerName,
            booking.passenger_phone,
            booking.pickup_location,
            booking.crew,
            booking.updated_by,
            booking.is_paid_online,
            booking.created_at
          ]
        );

        // Update loyalty completed_rides for additional seats
        if (booking.user_id) {
          const user = await dbQuery.get('SELECT completed_rides FROM profiles WHERE id = ?', [booking.user_id]);
          if (user) {
            let newCompletedRides = user.completed_rides;
            if (basePrice === 0) {
              newCompletedRides = 0;
            } else {
              newCompletedRides += 1;
            }
            await dbQuery.run('UPDATE profiles SET completed_rides = ? WHERE id = ?', [newCompletedRides, booking.user_id]);
          }
        }
      }
      
      console.log(`[Split Booking] Booking ${bookingId} split into ${N} individual bookings.`);
    }
  } catch (err) {
    console.error(`[Split Booking] Error splitting booking ${bookingId}:`, err);
  }
}


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

// Отримати список бронювань з підтримкою обох форматів дат та всіх статусів
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
      let altDate = date;
      if (date.includes('-')) {
        const parts = date.split('-');
        if (parts.length === 3) {
          altDate = `${parts[2]}.${parts[1]}.${parts[0]}`;
        }
      } else if (date.includes('.')) {
        const parts = date.split('.');
        if (parts.length === 3) {
          altDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
      }
      sql += ' AND (bus_date = ? OR bus_date = ?)';
      params.push(date, altDate);
    }

    if (crew) {
      sql += ' AND (crew = ? OR crew = ?)';
      params.push(crew, normalizeCrewName(crew));
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

// Отримати одне бронювання
app.get('/api/bookings/:id', async (req, res) => {
  try {
    const booking = await dbQuery.get('SELECT * FROM bookings WHERE id = ?', [req.params.id]);
    if (!booking) {
      return res.status(404).json({ error: 'Бронювання не знайдено' });
    }
    const mapped = {
      ...booking,
      from: booking.bus_from,
      to: booking.bus_to,
      date: booking.bus_date,
      name: booking.passenger_name,
      phone: booking.passenger_phone
    };
    res.json(mapped);
  } catch (err) {
    console.error('Помилка отримання бронювання:', err);
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
    is_paid_online,
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

  const finalTime = normalizeTime(departure_time);

  // Автоматичне вирахування екіпажу якщо поле пусте
  let finalCrew = crew;
  if (!finalCrew) {
    finalCrew = getCrewByTime(finalTime, f_from, f_to);
  }
  const finalCrewNorm = normalizeCrewName(finalCrew);

  try {
    const finalStatus = status || 'active';
    const id = 'bk_' + Date.now() + Math.random().toString(36).substr(2, 4);
    const f_driver_name = req.body.driver_name || null;
    const f_driver_id = req.body.driver_id || null;

    await dbQuery.run(
      `INSERT INTO bookings (
        id, user_id, bus_from, bus_to, bus_date, departure_time, 
        seats, price, status, passenger_name, passenger_phone, 
        pickup_location, crew, updated_by, is_paid_online,
        driver_name, driver_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, user_id, f_from, f_to, f_date, finalTime,
        seats, price, finalStatus, f_name, f_phone,
        pickup_location, finalCrewNorm, updated_by || 'Клієнт', is_paid_online || 0,
        f_driver_name, f_driver_id
      ]
    );

    // Лояльність: оновити completed_rides
    if (user_id && finalStatus === 'active') {
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
    
    if (finalStatus === 'active') {
      await splitBookingIfMultiple(id);
    }

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
    updated_by,
    user_id,
    is_paid_online
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
    const updatedUserId = user_id !== undefined ? user_id : booking.user_id;
    const updatedIsPaidOnline = is_paid_online !== undefined ? is_paid_online : booking.is_paid_online;

    const updatedDriverName = req.body.driver_name !== undefined ? req.body.driver_name : booking.driver_name;
    const updatedDriverId = req.body.driver_id !== undefined ? req.body.driver_id : booking.driver_id;

    const normTime = normalizeTime(updatedTime);
    const normCrew = normalizeCrewName(updatedCrew);

    await dbQuery.run(
      `UPDATE bookings SET 
        status = ?, pickup_location = ?, seats = ?, price = ?, 
        departure_time = ?, crew = ?, bus_from = ?, bus_to = ?,
        bus_date = ?, passenger_name = ?, passenger_phone = ?,
        updated_by = ?, user_id = ?, is_paid_online = ?,
        driver_name = ?, driver_id = ?
      WHERE id = ?`,
      [
        updatedStatus, updatedPickup, updatedSeats, updatedPrice, 
        normTime, normCrew, updatedFrom, updatedTo, 
        updatedDate, updatedName, updatedPhone, updatedBy, updatedUserId, updatedIsPaidOnline,
        updatedDriverName, updatedDriverId, id
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

    if (updatedStatus === 'active') {
      await splitBookingIfMultiple(id);
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

// Внутрішній ендпоінт для очищення кешу та примусового оновлення через сокети (лише локально)
app.post('/api/internal/trigger-reload', (req, res) => {
  const ip = req.socket.remoteAddress;
  const isLocal = ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
  if (!isLocal) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  io.emit('bookings_changed');
  io.emit('schedules_changed');
  io.emit('assignments_changed');
  res.json({ success: true });
});


const DEFAULT_CREW_SCHEDULES = [
  { crew_name: '05:50', car: 'Мерседес 1', run1_time: '05:50', run2_time: '08:10', run3_time: '11:10', run4_time: '14:10', run5_time: '17:10', run6_time: '20:20' },
  { crew_name: '06:20', car: 'Мерседес 2', run1_time: '06:20', run2_time: '09:15', run3_time: '12:00', run4_time: '14:50', run5_time: '17:40', run6_time: '20:40' },
  { crew_name: '07:10', car: 'Мерседес 3', run1_time: '07:10', run2_time: '10:15', run3_time: '13:20', run4_time: '16:10', run5_time: '19:20' },
  { crew_name: '08:15', car: 'Мерседес 4', run1_time: '08:15', run2_time: '11:10', run3_time: '14:10', run4_time: '17:10', run5_time: '20:00' },
  { crew_name: '08:50', car: 'Мерседес 5', run1_time: '08:50', run2_time: '11:50', run3_time: '15:30', run4_time: '18:20' },
  { crew_name: '09:30', car: 'Мерседес 6', run1_time: '09:30', run2_time: '12:20', run3_time: '16:20', run4_time: '19:20' },
  { crew_name: '10:35', car: 'Мерседес 7', run1_time: '10:35', run2_time: '13:10', run3_time: '17:00', run4_time: '20:00' },
  { crew_name: '12:00', car: 'Мерседес 8', run1_time: '12:00', run2_time: '14:50', run3_time: '17:40', run4_time: '20:20' }
];

// Отримати розклад на день
app.get('/api/schedules', async (req, res) => {
  const { date } = req.query;
  if (!date) {
    return res.status(400).json({ error: 'Вкажіть дату (date)' });
  }

  try {
    let rows = await dbQuery.all(
      'SELECT * FROM crew_schedules WHERE date = ? ORDER BY created_at ASC',
      [date]
    );

    if (rows.length === 0) {
      const isSunday = (() => {
        let d;
        if (date.includes('.')) {
          const [day, month, year] = date.split('.').map(Number);
          d = new Date(year, month - 1, day);
        } else {
          d = new Date(date);
        }
        return d.getDay() === 0;
      })();

      for (const def of DEFAULT_CREW_SCHEDULES) {
        const id = 'sch_' + Date.now() + Math.random().toString(36).substr(2, 4);
        let r5 = def.run5_time || '';
        let r6 = def.run6_time || '';
        let r7 = '';

        if (isSunday) {
          if (def.crew_name === '12:00') {
            r5 = '18:15';
            r6 = '20:20';
            r7 = '21:00';
          }
        }

        await dbQuery.run(
          `INSERT INTO crew_schedules (
            id, date, crew_name, driver_id, car, 
            run1_time, run2_time, run3_time, run4_time, run5_time, run6_time, run7_time
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            id, date, def.crew_name, 'drv_default', def.car,
            def.run1_time, def.run2_time, def.run3_time, def.run4_time, r5, r6, r7
          ]
        );
      }
      rows = await dbQuery.all(
        'SELECT * FROM crew_schedules WHERE date = ? ORDER BY created_at ASC',
        [date]
      );
    }

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
    run4_time,
    run5_time = '',
    run6_time = '',
    run7_time = '',
    run8_time = '',
    run9_time = '',
    run10_time = ''
  } = req.body;

  const normCrewName = normalizeCrewName(crew_name);
  const normRun1 = normalizeTime(run1_time);
  const normRun2 = normalizeTime(run2_time);
  const normRun3 = normalizeTime(run3_time);
  const normRun4 = normalizeTime(run4_time);
  const normRun5 = normalizeTime(run5_time);
  const normRun6 = normalizeTime(run6_time);
  const normRun7 = normalizeTime(run7_time);
  const normRun8 = normalizeTime(run8_time);
  const normRun9 = normalizeTime(run9_time);
  const normRun10 = normalizeTime(run10_time);

  if (!date || !normCrewName || !driver_id || !car || !normRun1 || !normRun2 || !normRun3 || !normRun4) {
    return res.status(400).json({ error: 'Заповніть всі обов\'язкові поля (включаючи водія та автомобіль)' });
  }

  try {
    const id = 'sch_' + Date.now() + Math.random().toString(36).substr(2, 4);
    await dbQuery.run(
      `INSERT INTO crew_schedules (
        id, date, crew_name, driver_id, car, 
        run1_time, run2_time, run3_time, run4_time,
        run5_time, run6_time, run7_time, run8_time, run9_time, run10_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, date, normCrewName, driver_id, car,
        normRun1, normRun2, normRun3, normRun4,
        normRun5, normRun6, normRun7, normRun8, normRun9, normRun10
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
    run5_time,
    run6_time,
    run7_time,
    run8_time,
    run9_time,
    run10_time,
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
    const updatedRun5 = run5_time !== undefined ? run5_time : (schedule.run5_time || '');
    const updatedRun6 = run6_time !== undefined ? run6_time : (schedule.run6_time || '');
    const updatedRun7 = run7_time !== undefined ? run7_time : (schedule.run7_time || '');
    const updatedRun8 = run8_time !== undefined ? run8_time : (schedule.run8_time || '');
    const updatedRun9 = run9_time !== undefined ? run9_time : (schedule.run9_time || '');
    const updatedRun10 = run10_time !== undefined ? run10_time : (schedule.run10_time || '');
    const updatedCrewName = crew_name !== undefined ? crew_name : schedule.crew_name;

    if (!updatedDriverId || !updatedCar) {
      return res.status(400).json({ error: 'Водій та автомобіль є обов\'язковими для збереження рейсу' });
    }

    const normDriverId = updatedDriverId;
    const normCar = updatedCar;
    const normRun1 = normalizeTime(updatedRun1);
    const normRun2 = normalizeTime(updatedRun2);
    const normRun3 = normalizeTime(updatedRun3);
    const normRun4 = normalizeTime(updatedRun4);
    const normRun5 = normalizeTime(updatedRun5);
    const normRun6 = normalizeTime(updatedRun6);
    const normRun7 = normalizeTime(updatedRun7);
    const normRun8 = normalizeTime(updatedRun8);
    const normRun9 = normalizeTime(updatedRun9);
    const normRun10 = normalizeTime(updatedRun10);
    const normCrewName = normalizeCrewName(updatedCrewName);

    await dbQuery.run(
      `UPDATE crew_schedules SET 
        driver_id = ?, car = ?, run1_time = ?, run2_time = ?, 
        run3_time = ?, run4_time = ?, run5_time = ?, run6_time = ?,
        run7_time = ?, run8_time = ?, run9_time = ?, run10_time = ?, crew_name = ?
      WHERE id = ?`,
      [
        normDriverId, normCar, normRun1, normRun2,
        normRun3, normRun4, normRun5, normRun6,
        normRun7, normRun8, normRun9, normRun10, normCrewName, id
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
// ДИСПЕТЧЕРИ (DISPATCHERS)
// ==========================================

// Авторизація диспетчера за PIN-кодом
app.post('/api/dispatchers/login', async (req, res) => {
  const { pin_code } = req.body;
  if (!pin_code) {
    return res.status(400).json({ error: 'Введіть PIN-код' });
  }
  try {
    const dispatcher = await dbQuery.get('SELECT id, name, role FROM dispatchers WHERE pin_code = ?', [pin_code]);
    if (dispatcher) {
      return res.json(dispatcher);
    }
    res.status(404).json({ error: 'Диспетчера з таким кодом не знайдено' });
  } catch (err) {
    console.error('Помилка входу диспетчера:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.get('/api/dispatchers', async (req, res) => {
  try {
    const dispatchers = await dbQuery.all('SELECT id, name, pin_code, role, created_at FROM dispatchers ORDER BY name ASC');
    res.json(dispatchers);
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.post('/api/dispatchers', async (req, res) => {
  const { name, pin_code, role } = req.body;
  if (!name || !pin_code) {
    return res.status(400).json({ error: 'Заповніть обов\'язкові поля' });
  }
  try {
    const existing = await dbQuery.get('SELECT id FROM dispatchers WHERE pin_code = ?', [pin_code]);
    if (existing) {
      return res.status(400).json({ error: 'Диспетчер з таким PIN-кодом вже існує' });
    }
    
    const existingDriver = await dbQuery.get('SELECT id FROM driver_profiles WHERE pin_code = ?', [pin_code]);
    if (existingDriver) {
      return res.status(400).json({ error: 'Цей PIN-код вже використовується водієм' });
    }

    const id = 'disp_' + Date.now();
    await dbQuery.run(
      'INSERT INTO dispatchers (id, name, pin_code, role) VALUES (?, ?, ?, ?)',
      [id, name, pin_code, role || 'junior_dispatcher']
    );
    const row = await dbQuery.get('SELECT * FROM dispatchers WHERE id = ?', [id]);
    io.emit('dispatchers_changed');
    res.status(201).json(row);
  } catch (err) {
    console.error('Помилка створення диспетчера:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.delete('/api/dispatchers/:id', async (req, res) => {
  const id = req.params.id;
  if (id === 'disp-1') {
    return res.status(400).json({ error: 'Неможливо видалити головного диспетчера' });
  }
  try {
    await dbQuery.run('DELETE FROM dispatchers WHERE id = ?', [id]);
    io.emit('dispatchers_changed');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// ==========================================
// ШАБЛОНИ ЕКІПАЖІВ (CREW TEMPLATES)
// ==========================================

app.get('/api/templates', async (req, res) => {
  try {
    const templates = await dbQuery.all('SELECT * FROM crew_templates ORDER BY name ASC');
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.post('/api/templates', async (req, res) => {
  const {
    name,
    run1_time,
    run2_time,
    run3_time,
    run4_time,
    run5_time = '',
    run6_time = '',
    run7_time = '',
    run8_time = '',
    run9_time = '',
    run10_time = ''
  } = req.body;
  if (!name || !run1_time || !run2_time || !run3_time || !run4_time) {
    return res.status(400).json({ error: 'Заповніть обов\'язкові поля' });
  }
  try {
    const existing = await dbQuery.get('SELECT id FROM crew_templates WHERE name = ?', [name]);
    if (existing) {
      return res.status(400).json({ error: 'Шаблон з такою назвою вже існує' });
    }

    const id = 'temp_' + Date.now();
    await dbQuery.run(
      `INSERT INTO crew_templates (
        id, name, run1_time, run2_time, run3_time, run4_time,
        run5_time, run6_time, run7_time, run8_time, run9_time, run10_time
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, name, run1_time, run2_time, run3_time, run4_time,
        run5_time, run6_time, run7_time, run8_time, run9_time, run10_time
      ]
    );
    const row = await dbQuery.get('SELECT * FROM crew_templates WHERE id = ?', [id]);
    io.emit('templates_changed');
    res.status(201).json(row);
  } catch (err) {
    console.error('Помилка створення шаблону:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.put('/api/templates/:id', async (req, res) => {
  const id = req.params.id;
  const {
    name,
    run1_time,
    run2_time,
    run3_time,
    run4_time,
    run5_time,
    run6_time,
    run7_time,
    run8_time,
    run9_time,
    run10_time
  } = req.body;
  try {
    const template = await dbQuery.get('SELECT * FROM crew_templates WHERE id = ?', [id]);
    if (!template) {
      return res.status(404).json({ error: 'Шаблон не знайдено' });
    }

    const updatedName = name !== undefined ? name : template.name;
    const updatedRun1 = run1_time !== undefined ? run1_time : template.run1_time;
    const updatedRun2 = run2_time !== undefined ? run2_time : template.run2_time;
    const updatedRun3 = run3_time !== undefined ? run3_time : template.run3_time;
    const updatedRun4 = run4_time !== undefined ? run4_time : template.run4_time;
    const updatedRun5 = run5_time !== undefined ? run5_time : (template.run5_time || '');
    const updatedRun6 = run6_time !== undefined ? run6_time : (template.run6_time || '');
    const updatedRun7 = run7_time !== undefined ? run7_time : (template.run7_time || '');
    const updatedRun8 = run8_time !== undefined ? run8_time : (template.run8_time || '');
    const updatedRun9 = run9_time !== undefined ? run9_time : (template.run9_time || '');
    const updatedRun10 = run10_time !== undefined ? run10_time : (template.run10_time || '');

    if (updatedName !== template.name) {
      const existing = await dbQuery.get('SELECT id FROM crew_templates WHERE name = ?', [updatedName]);
      if (existing) {
        return res.status(400).json({ error: 'Шаблон з такою назвою вже існує' });
      }
    }

    await dbQuery.run(
      `UPDATE crew_templates SET 
        name = ?, run1_time = ?, run2_time = ?, run3_time = ?, run4_time = ?,
        run5_time = ?, run6_time = ?, run7_time = ?, run8_time = ?, run9_time = ?, run10_time = ?
      WHERE id = ?`,
      [
        updatedName, updatedRun1, updatedRun2, updatedRun3, updatedRun4,
        updatedRun5, updatedRun6, updatedRun7, updatedRun8, updatedRun9, updatedRun10,
        id
      ]
    );
    const row = await dbQuery.get('SELECT * FROM crew_templates WHERE id = ?', [id]);
    io.emit('templates_changed');
    res.json(row);
  } catch (err) {
    console.error('Помилка оновлення шаблону:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.delete('/api/templates/:id', async (req, res) => {
  try {
    await dbQuery.run('DELETE FROM crew_templates WHERE id = ?', [req.params.id]);
    io.emit('templates_changed');
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

// ==========================================
// МАШИНИ (CARS)
// ==========================================

app.get('/api/cars', async (req, res) => {
  try {
    const cars = await dbQuery.all('SELECT * FROM cars ORDER BY plate ASC');
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.post('/api/cars', async (req, res) => {
  const { plate, seats, description, model, colorName, colorHex } = req.body;
  try {
    if (!plate || !seats) {
      return res.status(400).json({ error: 'Номер машини та кількість місць є обов\'язковими' });
    }
    await dbQuery.run(
      'INSERT INTO cars (plate, seats, description, model, color_name, color_hex) VALUES (?, ?, ?, ?, ?, ?)',
      [plate.trim().toUpperCase(), parseInt(seats), description || '', model || '', colorName || '', colorHex || '']
    );
    const newCar = await dbQuery.get('SELECT * FROM cars WHERE plate = ?', [plate.trim().toUpperCase()]);
    io.emit('assignments_changed');
    res.json(newCar);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'Машина з таким номером вже існує в базі даних' });
    }
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

app.delete('/api/cars/:plate', async (req, res) => {
  try {
    const plate = req.params.plate;
    await dbQuery.run('DELETE FROM cars WHERE plate = ?', [plate]);
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
  const normCrew = normalizeCrewName(crew);
  try {
    if (!driver_id && !car) {
      await dbQuery.run('DELETE FROM driver_assignments WHERE crew = ? AND date = ?', [normCrew, date]);
    } else {
      const existing = await dbQuery.get('SELECT id FROM driver_assignments WHERE crew = ? AND date = ?', [normCrew, date]);
      if (existing) {
        await dbQuery.run(
          'UPDATE driver_assignments SET driver_id = ?, car = ? WHERE id = ?',
          [driver_id, car, existing.id]
        );
      } else {
        const id = 'asg_' + Date.now();
        await dbQuery.run(
          'INSERT INTO driver_assignments (id, driver_id, car, crew, date) VALUES (?, ?, ?, ?, ?)',
          [id, driver_id, car, normCrew, date]
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
// PORTMONE PAYMENT INTEGRATION
// ==========================================

// Обчислення підпису Portmone
function getPortmoneSignature(payeeId, shopOrderNumber, billAmount, dt, secretKey) {
  if (!secretKey) return '';
  const hexOrder = Buffer.from(shopOrderNumber, 'utf8').toString('hex');
  const login = process.env.PORTMONE_LOGIN || '';
  const hexLogin = Buffer.from(login, 'utf8').toString('hex');
  
  let str = payeeId + dt + hexOrder + billAmount;
  str = str.toUpperCase() + hexLogin.toUpperCase();
  
  return crypto.createHmac('sha256', secretKey)
    .update(str)
    .digest('hex')
    .toUpperCase();
}

// Загальна функція обробки успішного платежу
async function processPayment(bookingId, amount, status) {
  try {
    const booking = await dbQuery.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      console.warn(`[Portmone Callback] Booking not found: ${bookingId}`);
      return false;
    }

    if (booking.status === 'active') {
      console.log(`[Portmone Callback] Booking ${bookingId} already processed (active).`);
      return true;
    }

    // Оновлюємо статус бронювання у базі
    await dbQuery.run("UPDATE bookings SET status = 'active', is_paid_online = 1 WHERE id = ?", [bookingId]);
    console.log(`[Portmone Callback] Booking ${bookingId} status updated to active and is_paid_online set to 1.`);

    // Оновлення лояльності користувача
    if (booking.user_id) {
      const user = await dbQuery.get('SELECT completed_rides FROM profiles WHERE id = ?', [booking.user_id]);
      if (user) {
        let newCompletedRides = user.completed_rides;
        if (booking.price === 0) {
          newCompletedRides = 0;
        } else {
          newCompletedRides += 1;
        }
        await dbQuery.run('UPDATE profiles SET completed_rides = ? WHERE id = ?', [newCompletedRides, booking.user_id]);
        console.log(`[Portmone Callback] Updated user loyalty completed_rides to ${newCompletedRides} for user ${booking.user_id}`);
      }
    }

    // Надсилаємо дані у Google Таблиці
    const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxd8ZIMLZdgaOKw7YBmbTK72mCUvy8rmRcOUvqQ2W3vZifJy3wTVbh_q-ikWL1FarXk/exec';
    const pricePerSeat = booking.price / booking.seats;
    const googlePayload = {
      from: booking.bus_from + (booking.pickup_location ? ` (${booking.pickup_location})` : ''),
      to: booking.bus_to,
      date: booking.bus_date,
      name: booking.passenger_name,
      phone: booking.passenger_phone,
      seats: booking.seats,
      departureTime: booking.departure_time,
      price: pricePerSeat
    };

    fetch(SCRIPT_URL, {
      method: 'POST',
      redirect: 'follow',
      cache: 'no-cache',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(googlePayload)
    }).catch(err => console.error('[Portmone Callback] Error writing to Google Sheets:', err));

    // Надсилаємо сповіщення у Telegram
    const botToken = '8615069227:AAEiCjdj66e469JqarZxWSlfzFQs1jGkr4M';
    const ADMIN_CHAT_IDS = ['8472692319', '8618558820'];
    
    const isHotelPickup = booking.pickup_location && booking.pickup_location.includes('ЗАБРАТИ З ГОТЕЛЮ');
    const isHotelDropoff = booking.pickup_location && booking.pickup_location.includes('ДОСТАВИТИ ДО ГОТЕЛЮ');
    const isHotelTrip = isHotelPickup || isHotelDropoff;

    const adminText = `🔔 Нова онлайн-оплата Portmone!\n\n👤 Клієнт: ${booking.passenger_name}\n📞 Телефон: ${booking.passenger_phone}\nМаршрут: ${booking.bus_from} → ${booking.bus_to}\n🚏 Посадка: ${booking.pickup_location || 'Стандартна'}\n📅 Дата: ${booking.bus_date}\n🕒 Час: ${booking.departure_time}\n👥 Місць: ${booking.seats}\n💰 Оплачено: ${booking.price} грн${isHotelTrip ? ' (+ додаткова оплата за готель)' : ''}\n💳 Статус: ОПЛАЧЕНО`;
    
    for (const adminId of ADMIN_CHAT_IDS) {
      fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: adminId, text: adminText })
      }).catch(err => console.error('[Portmone Callback] Error sending Telegram message:', err));
    }

    if (isHotelTrip) {
      const hotelText = `🏨 УВАГА! Забір/доставка з готелю (ОПЛАЧЕНО)\n\n👤 Клієнт: ${booking.passenger_name}\n📞 Телефон: ${booking.passenger_phone}\nМаршрут: ${booking.bus_from} → ${booking.bus_to}\n🚏 Посадка: ${booking.pickup_location || 'Стандартна'}\n📅 Дата: ${booking.bus_date}\n🕒 Час: ${booking.departure_time}\n👥 Місць: ${booking.seats}\n💰 Оплачено: ${booking.price} грн\n\n⚠️ Клієнт замовив готельний трансфер. Зв'яжіться для узгодження доплати!`;
      for (const adminId of ADMIN_CHAT_IDS) {
        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: adminId, text: hotelText })
        }).catch(err => console.error('[Portmone Callback] Error sending hotel Telegram message:', err));
      }
    }

    // Розділяємо бронювання, якщо куплено більше 1 місця
    await splitBookingIfMultiple(bookingId);

    // Повідомляємо диспетчерську панель по Socket.io
    io.emit('bookings_changed');

    return true;
  } catch (err) {
    console.error(`[Portmone Callback] Error in processPayment for ${bookingId}:`, err);
    return false;
  }
}

// Ініціація платежу Portmone
app.post('/api/payments/portmone/initiate', async (req, res) => {
  const { bookingId } = req.body;
  if (!bookingId) {
    return res.status(400).json({ error: 'Вкажіть bookingId' });
  }

  try {
    const booking = await dbQuery.get('SELECT * FROM bookings WHERE id = ?', [bookingId]);
    if (!booking) {
      return res.status(404).json({ error: 'Бронювання не знайдено' });
    }

    const payeeId = process.env.PORTMONE_PAYEE_ID || '1185';
    const secretKey = process.env.PORTMONE_SECRET_KEY || '';
    const siteUrl = process.env.VITE_API_URL || 'https://comfortplus0777.com.ua';

    // Дата у форматі YYYYMMDDHHMMSS
    const now = new Date();
    const dt = now.getFullYear() +
      String(now.getMonth() + 1).padStart(2, '0') +
      String(now.getDate()).padStart(2, '0') +
      String(now.getHours()).padStart(2, '0') +
      String(now.getMinutes()).padStart(2, '0') +
      String(now.getSeconds()).padStart(2, '0');

    const amount = Number(booking.price).toFixed(2);
    const description = `Квиток ${booking.bus_from} - ${booking.bus_to}, ${booking.bus_date}`;
    
    const successUrl = `${siteUrl}/api/payments/portmone/return`;
    const failureUrl = `${siteUrl}/api/payments/portmone/return`;

    const params = {
      payee_id: payeeId,
      shop_order_number: booking.id,
      bill_amount: amount,
      description: description,
      success_url: successUrl,
      failure_url: failureUrl,
      lang: 'uk',
      dt: dt
    };

    if (secretKey) {
      params.signature = getPortmoneSignature(payeeId, booking.id, amount, dt, secretKey);
    }

    res.json({
      action: 'https://www.portmone.com.ua/gateway/',
      params: params
    });
  } catch (err) {
    console.error('Помилка ініціації оплати Portmone:', err);
    res.status(500).json({ error: 'Внутрішня помилка сервера' });
  }
});

// Callback від Portmone (сервер-сервер)
app.post('/api/payments/portmone/callback', async (req, res) => {
  console.log('[Portmone Callback received POST]:', req.body);
  
  const shopOrderNumber = req.body.SHOPORDERNUMBER || req.body.shop_order_number;
  const statusVal = req.body.RESULT || req.body.status;
  const billAmount = req.body.BILLAMOUNT || req.body.bill_amount;

  if (!shopOrderNumber || statusVal === undefined) {
    return res.status(400).send('Missing SHOPORDERNUMBER or RESULT');
  }

  const isSuccess = (statusVal === 'PAYED' || statusVal === '0' || statusVal === 0 || statusVal === 'success');

  if (isSuccess) {
    const success = await processPayment(shopOrderNumber, billAmount, 'PAYED');
    if (success) {
      return res.send('OK');
    } else {
      return res.status(500).send('Error processing payment');
    }
  }

  res.send('NOT_PAYED');
});

// Клієнтський редирект від Portmone після оплати (POST)
app.post('/api/payments/portmone/return', async (req, res) => {
  console.log('[Portmone Return received POST]:', req.body);
  
  const shopOrderNumber = req.body.SHOPORDERNUMBER || req.body.shop_order_number;
  const statusVal = req.body.RESULT || req.body.status;
  const billAmount = req.body.BILLAMOUNT || req.body.bill_amount;
  
  const siteUrl = process.env.VITE_API_URL || 'https://comfortplus0777.com.ua';

  if (!shopOrderNumber) {
    return res.redirect(`${siteUrl}/payment?failure=true`);
  }

  const isSuccess = (statusVal === 'PAYED' || statusVal === '0' || statusVal === 0 || statusVal === 'success');

  if (isSuccess) {
    await processPayment(shopOrderNumber, billAmount, 'PAYED');
    return res.redirect(`${siteUrl}/payment?success=true&booking_id=${shopOrderNumber}`);
  } else {
    return res.redirect(`${siteUrl}/payment?failure=true&booking_id=${shopOrderNumber}`);
  }
});

// Додатковий обробник для GET на випадок, якщо Portmone робить GET редирект
app.get('/api/payments/portmone/return', async (req, res) => {
  console.log('[Portmone Return received GET]:', req.query);
  
  const shopOrderNumber = req.query.SHOPORDERNUMBER || req.query.shop_order_number;
  const statusVal = req.query.RESULT || req.query.status;
  const billAmount = req.query.BILLAMOUNT || req.query.bill_amount;
  
  const siteUrl = process.env.VITE_API_URL || 'https://comfortplus0777.com.ua';

  if (!shopOrderNumber) {
    return res.redirect(`${siteUrl}/payment?failure=true`);
  }

  const isSuccess = (statusVal === 'PAYED' || statusVal === '0' || statusVal === 0 || statusVal === 'success');

  if (isSuccess) {
    await processPayment(shopOrderNumber, billAmount, 'PAYED');
    return res.redirect(`${siteUrl}/payment?success=true&booking_id=${shopOrderNumber}`);
  } else {
    return res.redirect(`${siteUrl}/payment?failure=true&booking_id=${shopOrderNumber}`);
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

// Глобальні обробники помилок для стабільності процесу
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[UNHANDLED REJECTION]:', reason);
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Сервер Comfort Plus працює на порту ${PORT}`);
});
