
const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());


app.post('/api/buyurtmalar', (req, res) => {
  const { tavsif, manzil, muammoTuri } = req.body;

  if (!tavsif || !manzil || !muammoTuri) {
    return res.status(400).json({ xato: 'Barcha maydonlar to\'ldirilishi kerak' });
  }

 
  var ustaTop = db.prepare(
    "SELECT * FROM ustalar WHERE turi = ? AND holat = 'bosh' LIMIT 1"
  ).get(muammoTuri);

  
  if (!ustaTop) {
    ustaTop = db.prepare("SELECT * FROM ustalar WHERE holat = 'bosh' LIMIT 1").get();
  }

  if (!ustaTop) {
    return res.status(404).json({ xato: 'Hozircha bo\'sh usta yo\'q, biroz kuting' });
  }

  const natija = db.prepare(
    'INSERT INTO buyurtmalar (tavsif, manzil, muammo_turi, usta_id, holat) VALUES (?, ?, ?, ?, ?)'
  ).run(tavsif, manzil, muammoTuri, ustaTop.id, 'yolda');


  db.prepare("UPDATE ustalar SET holat = 'band' WHERE id = ?").run(ustaTop.id);


  res.json({
    buyurtmaId: natija.lastInsertRowid,
    usta: {
      ism: ustaTop.ism,
      turi: ustaTop.turi,
      reyting: ustaTop.reyting,
      ishlarSoni: ustaTop.ishlar_soni
    },
   
    daqiqa: 8 + Math.floor(Math.random() * 10)
  });
});


app.post('/api/buyurtmalar/:id/tugatish', (req, res) => {
  const buyurtmaId = req.params.id;

  const buyurtma = db.prepare('SELECT * FROM buyurtmalar WHERE id = ?').get(buyurtmaId);

  if (!buyurtma) {
    return res.status(404).json({ xato: 'Bunday buyurtma topilmadi' });
  }

  db.prepare("UPDATE buyurtmalar SET holat = 'bajarildi' WHERE id = ?").run(buyurtmaId);
  db.prepare("UPDATE ustalar SET holat = 'bosh', ishlar_soni = ishlar_soni + 1 WHERE id = ?").run(buyurtma.usta_id);

  res.json({ xabar: 'Buyurtma yakunlandi' });
});




app.get('/api/statistika', (req, res) => {
  const bugungiBuyurtmalar = db.prepare(
    "SELECT COUNT(*) as soni FROM buyurtmalar WHERE date(yaratilgan_vaqt) = date('now')"
  ).get();

  const faolUstalar = db.prepare('SELECT COUNT(*) as soni FROM ustalar').get();
  const bandUstalar = db.prepare("SELECT COUNT(*) as soni FROM ustalar WHERE holat = 'band'").get();
  const boshUstalar = db.prepare("SELECT COUNT(*) as soni FROM ustalar WHERE holat = 'bosh'").get();

  res.json({
    bugungiBuyurtmalar: bugungiBuyurtmalar.soni,
    faolUstalar: faolUstalar.soni,
    bandUstalar: bandUstalar.soni,
    boshUstalar: boshUstalar.soni
  });
});


app.get('/api/buyurtmalar', (req, res) => {
  const buyurtmalar = db.prepare(`
    SELECT buyurtmalar.*, ustalar.ism as usta_ism
    FROM buyurtmalar
    LEFT JOIN ustalar ON buyurtmalar.usta_id = ustalar.id
    ORDER BY buyurtmalar.yaratilgan_vaqt DESC
    LIMIT 20
  `).all();

  res.json(buyurtmalar);
});

app.get('/api/ustalar', (req, res) => {
  const ustalar = db.prepare('SELECT * FROM ustalar').all();
  res.json(ustalar);
});

app.post('/api/ustalar', (req, res) => {
  const { ism, turi, telefon } = req.body;

  if (!ism || !turi) {
    return res.status(400).json({ xato: 'Ism va turi kerak' });
  }

  const natija = db.prepare(
    'INSERT INTO ustalar (ism, turi, telefon) VALUES (?, ?, ?)'
  ).run(ism, turi, telefon || '');

  res.json({ id: natija.lastInsertRowid, xabar: 'Usta qo\'shildi' });
});

app.listen(PORT, () => {
  console.log('server ishga tushdi, port: ' + PORT);
});