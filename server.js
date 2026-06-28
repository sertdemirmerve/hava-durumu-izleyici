// ============================================================
// HAVA DURUMU İZLEYİCİ — BACKEND SUNUCU
// Express + SQLite + OpenWeatherMap API Proxy
// ============================================================

require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.OPENWEATHER_API_KEY;
const API_URL = 'https://api.openweathermap.org/data/2.5/weather';

if (!API_KEY) {
  console.error('HATA: OPENWEATHER_API_KEY tanımlı değil. .env dosyasını kontrol edin.');
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ------------------------------------------------------------
// VERİTABANI
// ------------------------------------------------------------

const db = new sqlite3.Database('./cities.db', (err) => {
  if (err) return console.error('Veritabanı bağlantı hatası:', err.message);
  console.log('Veritabanına bağlanıldı.');
});

db.run(`
  CREATE TABLE IF NOT EXISTS cities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    country TEXT,
    temperature REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ------------------------------------------------------------
// HAVA DURUMU PROXY — API key burada kalır, frontend'e gitmez
// ------------------------------------------------------------

app.get('/api/weather', async (req, res) => {
  const { city, lat, lon } = req.query;

  if (!city && !(lat && lon)) {
    return res.status(400).json({ error: 'Şehir adı veya konum bilgisi gerekli.' });
  }

  const query = city
    ? `q=${encodeURIComponent(city)}`
    : `lat=${lat}&lon=${lon}`;

  try {
    const response = await fetch(
      `${API_URL}?${query}&units=metric&lang=tr&appid=${API_KEY}`
    );
    const data = await response.json();

    if (!response.ok) {
      // OpenWeatherMap'in kendi hata mesajını kullanıcıya iletir
      return res.status(response.status).json({
        error: data.message || 'Hava durumu verisi alınamadı.'
      });
    }

    res.json(data);
  } catch (err) {
    console.error('Hava durumu API hatası:', err.message);
    res.status(502).json({ error: 'Hava durumu servisine erişilemedi.' });
  }
});

// ------------------------------------------------------------
// CRUD — KAYITLI ŞEHİRLER
// ------------------------------------------------------------

app.post('/api/cities', (req, res) => {
  const { name, country, temperature } = req.body;

  if (!name || temperature === undefined) {
    return res.status(400).json({ error: 'Şehir adı ve sıcaklık bilgisi gerekli.' });
  }

  db.run(
    'INSERT INTO cities (name, country, temperature) VALUES (?, ?, ?)',
    [name, country || '', temperature],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: this.lastID, name, country, temperature });
    }
  );
});

app.get('/api/cities', (req, res) => {
  db.all('SELECT * FROM cities ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.delete('/api/cities/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM cities WHERE id = ?', id, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Kayıt bulunamadı.' });
    }
    res.json({ deletedId: Number(id) });
  });
});

app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
