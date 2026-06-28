// ============================================================
// HAVA DURUMU İZLEYİCİ — FRONTEND
// Backend proxy üzerinden çalışır; API key tarayıcıya hiç gelmez.
// ============================================================

const BACKEND_URL = 'http://localhost:3000';

const statusEl = document.getElementById('status');
const weatherDataEl = document.getElementById('weatherData');
const cityInputEl = document.getElementById('cityInput');
const savedCitiesEl = document.getElementById('savedCities');

// ------------------------------------------------------------
// HAVA DURUMU SORGULAMA
// ------------------------------------------------------------

async function fetchWeather(params) {
  const response = await fetch(`${BACKEND_URL}/api/weather?${params}`);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Hava durumu verisi alınamadı.');
  }
  return data;
}

async function showWeatherByCoords(lat, lon) {
  try {
    const data = await fetchWeather(`lat=${lat}&lon=${lon}`);
    displayWeather(data, { allowSave: true });
  } catch (e) {
    showError(e.message);
  }
}

async function showWeatherByCity(city) {
  setStatus('Yükleniyor...');
  try {
    const data = await fetchWeather(`city=${encodeURIComponent(city)}`);
    displayWeather(data, { allowSave: true });
  } catch (e) {
    showError(e.message);
  }
}

// ------------------------------------------------------------
// GÖRÜNTÜLEME
// ------------------------------------------------------------

function setStatus(text) {
  statusEl.innerText = text;
  statusEl.className = '';
}

function showError(msg) {
  weatherDataEl.innerHTML = '';
  statusEl.innerText = msg;
  statusEl.className = 'weather-error';
}

function displayWeather(d, { allowSave }) {
  statusEl.innerText = `${d.name}, ${d.sys.country}`;
  statusEl.className = '';

  weatherDataEl.innerHTML = `
    <div class="temp">${Math.round(d.main.temp)}°C</div>
    <div class="desc">${d.weather[0].description}</div>
    <div class="minmax">Min: ${Math.round(d.main.temp_min)}°C | Maks: ${Math.round(d.main.temp_max)}°C</div>
    ${allowSave ? `<button id="saveBtn" type="button">Bu şehri kaydet</button>` : ''}
  `;

  const saveBtn = document.getElementById('saveBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', () => saveCity(d));
  }
}

// ------------------------------------------------------------
// KAYITLI ŞEHİRLER — CRUD
// ------------------------------------------------------------

async function saveCity(data) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/cities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        country: data.sys.country,
        temperature: data.main.temp
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Şehir kaydedilemedi.');
    }
    await listSavedCities();
  } catch (e) {
    showError(e.message);
  }
}

async function listSavedCities() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/cities`);
    const cities = await res.json();

    savedCitiesEl.innerHTML = '';

    if (cities.length === 0) {
      savedCitiesEl.innerHTML = '<li class="empty">Henüz kayıtlı şehir yok.</li>';
      return;
    }

    cities.forEach(city => {
      const li = document.createElement('li');
      li.innerHTML = `
        <span>${city.name} (${city.country}) — ${Math.round(city.temperature)}°C</span>
        <button type="button" data-id="${city.id}" class="delete-btn">Sil</button>
      `;
      savedCitiesEl.appendChild(li);
    });
  } catch (e) {
    savedCitiesEl.innerHTML = '<li class="empty">Kayıtlı şehirler yüklenemedi.</li>';
  }
}

async function deleteCity(id) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/cities/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Silme işlemi başarısız.');
    await listSavedCities();
  } catch (e) {
    showError(e.message);
  }
}

// Liste içindeki sil butonlarını tek bir delegasyon ile dinle
savedCitiesEl.addEventListener('click', (e) => {
  if (e.target.classList.contains('delete-btn')) {
    deleteCity(e.target.dataset.id);
  }
});

// ------------------------------------------------------------
// GİRİŞ VE BAŞLANGIÇ
// ------------------------------------------------------------

cityInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const city = cityInputEl.value.trim();
    if (!city) {
      showError('Lütfen şehir adı girin.');
      return;
    }
    showWeatherByCity(city);
    cityInputEl.value = '';
  }
});

if ('geolocation' in navigator) {
  navigator.geolocation.getCurrentPosition(
    (pos) => showWeatherByCoords(pos.coords.latitude, pos.coords.longitude),
    () => setStatus('Konum bulunamadı. Şehir adı girerek arayabilirsiniz.')
  );
} else {
  setStatus('Tarayıcı konum desteklemiyor. Şehir adı girerek arayabilirsiniz.');
}

listSavedCities();
