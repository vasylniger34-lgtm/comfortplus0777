const sqlite3 = require('sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'comfort_plus.db');
const backupPath = path.join(__dirname, `comfort_plus_backup_${Date.now()}.db`);

// 1. Back up database file
console.log(`[Backup] Copying database from ${dbPath} to ${backupPath}...`);
try {
  fs.copyFileSync(dbPath, backupPath);
  console.log(`[Backup] Database backup completed successfully: ${backupPath}`);
} catch (err) {
  console.error('[Backup] Backup failed. Aborting database normalization!', err);
  process.exit(1);
}

// Helper functions
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

// 2. Open database and perform migrations
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database for normalization:', err);
    process.exit(1);
  }
  console.log('Database opened successfully for normalization.');
  runNormalization();
});

function runNormalization() {
  db.serialize(() => {
    db.run("BEGIN TRANSACTION;");

    // A. Normalize bookings
    db.all("SELECT id, departure_time, crew FROM bookings", [], (err, rows) => {
      if (err) {
        console.error("Error reading bookings:", err);
        db.run("ROLLBACK;");
        db.close();
        process.exit(1);
      }

      console.log(`Found ${rows.length} bookings to normalize.`);
      let updatedCount = 0;
      const stmt = db.prepare("UPDATE bookings SET departure_time = ?, crew = ? WHERE id = ?");
      
      rows.forEach((row) => {
        const normTime = normalizeTime(row.departure_time);
        const normCrew = normalizeCrewName(row.crew);
        if (normTime !== row.departure_time || normCrew !== row.crew) {
          stmt.run(normTime, normCrew, row.id);
          updatedCount++;
        }
      });
      stmt.finalize();
      console.log(`Normalized ${updatedCount} bookings.`);
      
      // B. Normalize crew_schedules
      normalizeCrewSchedules();
    });
  });
}

function normalizeCrewSchedules() {
  db.all("SELECT * FROM crew_schedules", [], (err, rows) => {
    if (err) {
      console.error("Error reading crew_schedules:", err);
      db.run("ROLLBACK;");
      db.close();
      process.exit(1);
    }

    console.log(`Found ${rows.length} schedules to normalize.`);
    let updatedCount = 0;
    
    rows.forEach((row) => {
      const normCrew = normalizeCrewName(row.crew_name);
      const times = {};
      let changed = (normCrew !== row.crew_name);
      
      for (let i = 1; i <= 10; i++) {
        const field = `run${i}_time`;
        const val = row[field] || '';
        const normVal = normalizeTime(val);
        times[field] = normVal;
        if (normVal !== val) {
          changed = true;
        }
      }
      
      if (changed) {
        db.run(
          `UPDATE crew_schedules SET 
            crew_name = ?,
            run1_time = ?, run2_time = ?, run3_time = ?, run4_time = ?, run5_time = ?,
            run6_time = ?, run7_time = ?, run8_time = ?, run9_time = ?, run10_time = ?
           WHERE id = ?`,
          [
            normCrew,
            times.run1_time, times.run2_time, times.run3_time, times.run4_time, times.run5_time,
            times.run6_time, times.run7_time, times.run8_time, times.run9_time, times.run10_time,
            row.id
          ]
        );
        updatedCount++;
      }
    });

    console.log(`Normalized ${updatedCount} schedules.`);
    
    // C. Normalize driver_assignments
    normalizeDriverAssignments();
  });
}

function normalizeDriverAssignments() {
  db.all("SELECT id, crew FROM driver_assignments", [], (err, rows) => {
    if (err) {
      console.error("Error reading driver_assignments:", err);
      db.run("ROLLBACK;");
      db.close();
      process.exit(1);
    }

    console.log(`Found ${rows.length} driver assignments to normalize.`);
    let updatedCount = 0;
    const stmt = db.prepare("UPDATE driver_assignments SET crew = ? WHERE id = ?");
    
    rows.forEach((row) => {
      const normCrew = normalizeCrewName(row.crew);
      if (normCrew !== row.crew) {
        stmt.run(normCrew, row.id);
        updatedCount++;
      }
    });
    stmt.finalize();
    console.log(`Normalized ${updatedCount} driver assignments.`);
    
    // D. Normalize crew_templates
    normalizeCrewTemplates();
  });
}

function normalizeCrewTemplates() {
  db.all("SELECT * FROM crew_templates", [], (err, rows) => {
    if (err) {
      console.error("Error reading crew_templates:", err);
      db.run("ROLLBACK;");
      db.close();
      process.exit(1);
    }

    console.log(`Found ${rows.length} templates to normalize.`);
    let updatedCount = 0;
    
    rows.forEach((row) => {
      const normName = normalizeCrewName(row.name);
      const times = {};
      let changed = (normName !== row.name);
      
      for (let i = 1; i <= 10; i++) {
        const field = `run${i}_time`;
        const val = row[field] || '';
        const normVal = normalizeTime(val);
        times[field] = normVal;
        if (normVal !== val) {
          changed = true;
        }
      }
      
      if (changed) {
        db.run(
          `UPDATE crew_templates SET 
            name = ?,
            run1_time = ?, run2_time = ?, run3_time = ?, run4_time = ?, run5_time = ?,
            run6_time = ?, run7_time = ?, run8_time = ?, run9_time = ?, run10_time = ?
           WHERE id = ?`,
          [
            normName,
            times.run1_time, times.run2_time, times.run3_time, times.run4_time, times.run5_time,
            times.run6_time, times.run7_time, times.run8_time, times.run9_time, times.run10_time,
            row.id
          ]
        );
        updatedCount++;
      }
    });

    console.log(`Normalized ${updatedCount} templates.`);
    
    // Commit transaction
    db.run("COMMIT;", (err) => {
      if (err) {
        console.error("Transaction commit failed, rolling back:", err);
        db.run("ROLLBACK;");
        db.close();
        process.exit(1);
      }
      console.log("Database normalization completed and committed successfully!");
      db.close();
    });
  });
}
