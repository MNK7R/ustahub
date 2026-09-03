
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'ustahub.db'));


db.exec(`
  CREATE TABLE IF NOT EXISTS ustalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ism TEXT NOT NULL,
    turi TEXT NOT NULL,
    telefon TEXT,
    reyting REAL DEFAULT 5.0,
    ishlar_soni INTEGER DEFAULT 0,
    holat TEXT DEFAULT 'bosh'
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS buyurtmalar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tavsif TEXT NOT NULL,
    manzil TEXT NOT NULL,
    muammo_turi TEXT NOT NULL,
    usta_id INTEGER,
    holat TEXT DEFAULT 'kutilmoqda',
    yaratilgan_vaqt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usta_id) REFERENCES ustalar(id)
  )
`);


const ustalarSoni = db.prepare('SELECT COUNT(*) as soni FROM ustalar').get();

if (ustalarSoni.soni === 0) {
  const qoshish = db.prepare(
    'INSERT INTO ustalar (ism, turi, telefon, reyting, ishlar_soni, holat) VALUES (?, ?, ?, ?, ?, ?)'
  );

  qoshish.run('Aziz Rahimov', 'Santexnik', '+998901112233', 4.9, 312, 'bosh');
  qoshish.run('Bekzod Tursunov', 'Elektrik', '+998902223344', 4.8, 198, 'bosh');
  qoshish.run('Sardor Yusupov', 'Konditsioner', '+998903334455', 4.7, 145, 'bosh');
  qoshish.run('Farrux Nazarov', 'Boshqa', '+998904445566', 4.6, 89, 'bosh');

  console.log('boshlang\'ich ustalar qo\'shildi');
}

module.exports = db;