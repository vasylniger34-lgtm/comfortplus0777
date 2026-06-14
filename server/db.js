import sqlite3 from 'sqlite3';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = join(__dirname, 'comfort_plus.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Помилка відкриття бази даних:', err);
  } else {
    console.log('База даних SQLite успішно підключена за шляхом:', dbPath);
  }
});

// Обертка для промісів
export const dbQuery = {
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID, changes: this.changes });
      });
    });
  },
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.get(sql, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  },
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });
  }
};

// Ініціалізація таблиць
db.serialize(() => {
  // 1. Профілі користувачів
  db.run(`
    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      completed_rides INTEGER DEFAULT 0,
      balance REAL DEFAULT 0.0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 2. Бронювання (квитки)
  db.run(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      bus_from TEXT NOT NULL,
      bus_to TEXT NOT NULL,
      bus_date TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      seats INTEGER NOT NULL,
      price REAL NOT NULL,
      status TEXT DEFAULT 'active',
      passenger_name TEXT NOT NULL,
      passenger_phone TEXT NOT NULL,
      pickup_location TEXT,
      crew TEXT NOT NULL,
      updated_by TEXT DEFAULT 'Клієнт',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 3. Профілі водіїв
  db.run(`
    CREATE TABLE IF NOT EXISTS driver_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      pin_code TEXT UNIQUE NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 4. Призначення водіїв та машин на екіпажі
  db.run(`
    CREATE TABLE IF NOT EXISTS driver_assignments (
      id TEXT PRIMARY KEY,
      driver_id TEXT,
      car TEXT,
      crew TEXT NOT NULL,
      date TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 5. Чат-повідомлення
  db.run(`
    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      text TEXT NOT NULL,
      is_bot_reply INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 6. Розклад рейсів екіпажів (динамічна сітка)
  db.run(`
    CREATE TABLE IF NOT EXISTS crew_schedules (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      crew_name TEXT NOT NULL,
      driver_id TEXT,
      car TEXT,
      run1_time TEXT NOT NULL,
      run2_time TEXT NOT NULL,
      run3_time TEXT NOT NULL,
      run4_time TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // Міграції: додаємо updated_by у bookings якщо її немає
  db.run("ALTER TABLE bookings ADD COLUMN updated_by TEXT", (err) => {
    // Ігноруємо помилку, якщо колонка вже існує
  });

  console.log('Ініціалізація таблиць бази даних завершена.');
});

export default db;
