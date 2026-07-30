const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'comfort_plus.db');
const backupPath = path.join(__dirname, `comfort_plus_backup_realign_${Date.now()}.db`);

// 1. Back up database file
console.log(`[Backup] Copying database from ${dbPath} to ${backupPath}...`);
try {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`[Backup] Database backup completed successfully: ${backupPath}`);
} catch (err) {
  console.error('[Backup] Backup failed. Aborting!', err);
  process.exit(1);
}

// Helpers
function normalizeTime(time) {
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
}

function normalizeCrewName(name) {
  if (!name) return '';
  const trimmed = name.trim();
  const normalizedTime = normalizeTime(trimmed);
  if (/^\d{2}:\d{2}$/.test(normalizedTime)) {
    return normalizedTime;
  }
  return trimmed;
}

const lvivRoute = ['Львів', 'Стебник', 'Трускавець', 'Борислав', 'Східниця'];

function getNormalizedCityName(cityName) {
  if (!cityName) return '';
  const nameLower = cityName.toLowerCase();
  if (nameLower.includes('львів') || nameLower === 'lviv') return 'Львів';
  if (nameLower.includes('стебник') || nameLower === 'stebnik') return 'Стебник';
  if (nameLower.includes('трускавець') || nameLower === 'truskavets') return 'Трускавець';
  if (nameLower.includes('борислав') || nameLower === 'boryslav') return 'Борислав';
  if (nameLower.includes('східниця') || nameLower === 'skhidnytsia') return 'Східниця';
  return cityName;
}

function isLvivToSkhidnytsia(fromCity, toCity) {
  const f = fromCity.toLowerCase();
  const t = toCity.toLowerCase();
  if (f.includes('львів') || f.includes('lviv')) return true;
  if (t.includes('львів') || t.includes('lviv') || t.includes('пустомити')) return false;
  
  const fromIdx = lvivRoute.indexOf(getNormalizedCityName(fromCity));
  const toIdx = lvivRoute.indexOf(getNormalizedCityName(toCity));
  if (fromIdx !== -1 && toIdx !== -1) {
    return fromIdx < toIdx;
  }
  return true;
}

const getCrewByTime = (time, isLvivDeparture) => {
  const normTime = normalizeTime(time);
  if (isLvivDeparture) {
    const mapping = {
      '09:00': '06:20', '14:50': '06:20',
      '10:15': '07:10', '16:10': '07:10',
      '11:10': '08:15', '18:20': '08:15',
      '12:20': '09:30', '19:20': '09:30',
      '13:10': '10:35', '20:00': '10:35',
      '14:10': '11:10', '20:40': '11:10',
    };
    return normalizeCrewName(mapping[normTime] || '');
  } else {
    const mapping = {
      '06:20': '06:20', '12:00': '06:20',
      '07:10': '07:10', '13:20': '07:10',
      '08:15': '08:15', '15:30': '08:15',
      '09:30': '09:30', '16:20': '09:30',
      '10:35': '10:35', '17:00': '10:35',
      '11:10': '11:10', '17:40': '11:10',
    };
    return normalizeCrewName(mapping[normTime] || '');
  }
};

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  realignCrews();
});

function realignCrews() {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");

    // Get all bookings
    db.all("SELECT * FROM bookings WHERE status = 'active'", [], (err, bookings) => {
      if (err) {
        console.error("Error reading bookings:", err);
        db.run("ROLLBACK;");
        db.close();
        process.exit(1);
      }

      // Get all schedules
      db.all("SELECT * FROM crew_schedules", [], (err, schedules) => {
        if (err) {
          console.error("Error reading schedules:", err);
          db.run("ROLLBACK;");
          db.close();
          process.exit(1);
        }

        console.log(`Analyzing ${bookings.length} active bookings...`);
        let correctedCount = 0;

        bookings.forEach((b) => {
          const cleanTime = normalizeTime(b.departure_time);
          const isLviv = isLvivToSkhidnytsia(b.bus_from, b.bus_to);

          // Find crew from schedules of that day
          const daySchedules = schedules.filter(s => s.date === b.bus_date);
          let correctCrew = '';

          const foundSchedule = daySchedules.find(s => {
            const runs = isLviv
              ? [s.run2_time, s.run4_time, s.run6_time, s.run8_time, s.run10_time]
              : [s.run1_time, s.run3_time, s.run5_time, s.run7_time, s.run9_time];
            return runs.map(r => normalizeTime(r)).includes(cleanTime);
          });

          if (foundSchedule) {
            correctCrew = normalizeCrewName(foundSchedule.crew_name);
          } else {
            correctCrew = normalizeCrewName(getCrewByTime(cleanTime, isLviv) || 'Екіпаж 1');
          }

          const currentCrewNorm = normalizeCrewName(b.crew);
          if (currentCrewNorm !== correctCrew) {
            console.log(`[Correcting] Booking ID ${b.id} (${b.passenger_name}, ${b.bus_date} ${cleanTime}): ${b.crew} -> ${correctCrew}`);
            db.run("UPDATE bookings SET crew = ? WHERE id = ?", [correctCrew, b.id]);
            correctedCount++;
          }
        });

        db.run("COMMIT;", (err) => {
          if (err) {
            console.error("Commit failed, rolling back:", err);
            db.run("ROLLBACK;");
          } else {
            console.log(`Successfully updated ${correctedCount} bookings to match correct crew assignments!`);
          }
          db.close();
        });
      });
    });
  });
}
