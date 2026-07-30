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
    // Вмикаємо WAL-режим для уникнення блокувань при паралельних запитах таbusy_timeout
    db.run('PRAGMA journal_mode=WAL;');
    db.run('PRAGMA synchronous=NORMAL;');
    db.run('PRAGMA busy_timeout=5000;');
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
      driver_name TEXT,
      driver_id TEXT,
      updated_by TEXT DEFAULT 'Клієнт',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  db.run(`ALTER TABLE bookings ADD COLUMN driver_name TEXT`, () => {});
  db.run(`ALTER TABLE bookings ADD COLUMN driver_id TEXT`, () => {});

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
      run5_time TEXT DEFAULT '',
      run6_time TEXT DEFAULT '',
      run7_time TEXT DEFAULT '',
      run8_time TEXT DEFAULT '',
      run9_time TEXT DEFAULT '',
      run10_time TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);

  // 7. Диспетчери (для авторизації та керування диспетчерами)
  db.run(`
    CREATE TABLE IF NOT EXISTS dispatchers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      pin_code TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'junior_dispatcher',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `, () => {
    // Вставимо дефолтних диспетчерів, якщо таблиця порожня
    db.get("SELECT COUNT(*) as count FROM dispatchers", (err, row) => {
      if (!err && row && row.count === 0) {
        db.run("INSERT INTO dispatchers (id, name, pin_code, role) VALUES ('disp-1', 'Головний диспетчер', '3110', 'dispatcher')");
        db.run("INSERT INTO dispatchers (id, name, pin_code, role) VALUES ('disp-2', 'Молодший диспетчер 1', '8255', 'junior_dispatcher')");
        db.run("INSERT INTO dispatchers (id, name, pin_code, role) VALUES ('disp-3', 'Молодший диспетчер 2', '4321', 'junior_dispatcher')");
      }
    });
  });

  // 8. Шаблони екіпажів (presets)
  db.run(`
    CREATE TABLE IF NOT EXISTS crew_templates (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      run1_time TEXT NOT NULL,
      run2_time TEXT NOT NULL,
      run3_time TEXT NOT NULL,
      run4_time TEXT NOT NULL,
      run5_time TEXT DEFAULT '',
      run6_time TEXT DEFAULT '',
      run7_time TEXT DEFAULT '',
      run8_time TEXT DEFAULT '',
      run9_time TEXT DEFAULT '',
      run10_time TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `, () => {
    // Вставимо дефолтні шаблони, якщо таблиця порожня
    db.get("SELECT COUNT(*) as count FROM crew_templates", (err, row) => {
      if (!err && row && row.count === 0) {
        const defaultTemplates = [
          ['temp-1', 'Екіпаж 1', '06:20', '09:00', '12:00', '14:50', '', '', '', '', '', ''],
          ['temp-2', 'Екіпаж 2', '07:10', '10:15', '13:20', '16:10', '', '', '', '', '', ''],
          ['temp-3', 'Екіпаж 3', '08:15', '11:10', '15:30', '18:20', '', '', '', '', '', ''],
          ['temp-4', 'Екіпаж 4', '09:30', '12:20', '16:20', '19:20', '', '', '', '', '', ''],
          ['temp-5', 'Екіпаж 5', '10:35', '13:10', '17:00', '20:00', '', '', '', '', '', ''],
          ['temp-6', 'Екіпаж 6', '11:10', '14:10', '17:40', '20:40', '', '', '', '', '', '']
        ];
        defaultTemplates.forEach(([id, name, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10]) => {
          db.run("INSERT INTO crew_templates (id, name, run1_time, run2_time, run3_time, run4_time, run5_time, run6_time, run7_time, run8_time, run9_time, run10_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, name, r1, r2, r3, r4, r5, r6, r7, r8, r9, r10]);
        });
      }
    });
  });

  // 9. Автомобілі (cars)
  db.run(`
    CREATE TABLE IF NOT EXISTS cars (
      plate TEXT PRIMARY KEY,
      seats INTEGER NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      model TEXT NOT NULL DEFAULT '',
      color_name TEXT NOT NULL DEFAULT '',
      color_hex TEXT NOT NULL DEFAULT ''
    )
  `, () => {
    // Вставимо дефолтні машини, якщо таблиця порожня
    db.get("SELECT COUNT(*) as count FROM cars", (err, row) => {
      if (!err && row && row.count === 0) {
        const defaultCars = [
          ['ВС 0777 ОІ', 12, 'білий мерседес', 'Mercedes Sprinter', 'білий', '#FFFFFF'],
          ['НС 0700 МО', 12, 'синій мерседес', 'Mercedes Sprinter', 'синій', '#1E40AF'],
          ['ВС 1020 ХЕ', 12, 'сірий мерседес', 'Mercedes Sprinter', 'сірий', '#6B7280'],
          ['ВС 1030 ХВ', 11, 'білий крафтер', 'Volkswagen Crafter', 'білий', '#FFFFFF'],
          ['ВС 1040 ХВ', 9, 'білий мерседес', 'Mercedes Sprinter', 'білий', '#FFFFFF'],
          ['ВС 1070 ХВ', 12, 'вишневий крафтер', 'Volkswagen Crafter', 'вишневий', '#7A0016'],
          ['ВС 1090 ХС', 9, 'білий крафтер', 'Volkswagen Crafter', 'білий', '#FFFFFF'],
          ['ВС 1080 ХВ', 12, 'білий крафтер', 'Volkswagen Crafter', 'білий', '#FFFFFF'],
          ['ВС 1060 ХВ', 12, 'білий мерседес', 'Mercedes Sprinter', 'білий', '#FFFFFF']
        ];
        defaultCars.forEach(([plate, seats, desc, model, colorName, colorHex]) => {
          db.run("INSERT INTO cars (plate, seats, description, model, color_name, color_hex) VALUES (?, ?, ?, ?, ?, ?)", [plate, seats, desc, model, colorName, colorHex]);
        });
      }
    });
  });

  // Міграції: додаємо updated_by у bookings якщо її немає
  db.run("ALTER TABLE bookings ADD COLUMN updated_by TEXT", (err) => {
    // Ігноруємо помилку, якщо колонка вже існує
  });

  // Міграції: додаємо is_paid_online у bookings якщо її немає
  db.run("ALTER TABLE bookings ADD COLUMN is_paid_online INTEGER DEFAULT 0", (err) => {
    // Ігноруємо помилку, якщо колонка вже існує
  });

  // Міграції: додаємо run5_time через run10_time якщо їх немає
  for (let i = 5; i <= 10; i++) {
    db.run(`ALTER TABLE crew_schedules ADD COLUMN run${i}_time TEXT DEFAULT ''`, (err) => {
      // Ігноруємо помилку, якщо колонка вже існує
    });
    db.run(`ALTER TABLE crew_templates ADD COLUMN run${i}_time TEXT DEFAULT ''`, (err) => {
      // Ігноруємо помилку, якщо колонка вже існує
    });
  }

  console.log('Ініціалізація таблиць бази даних завершена.');
});

export default db;
