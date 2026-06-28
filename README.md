# Hava Durumu İzleyici

![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat&logo=sqlite&logoColor=white)

## Proje Özeti

Kullanıcının konumuna veya girdiği şehir adına göre anlık hava durumu
gösteren, sorgulanan şehirleri SQLite veritabanında saklayıp
listeleyen/silebilen bir web uygulaması. OpenWeatherMap API'sine
yapılan tüm istekler backend üzerinden proxy'lenir; API anahtarı
hiçbir zaman tarayıcıya gönderilmez.

---

## Özellikler

- Tarayıcı konumuna göre otomatik hava durumu gösterimi
- Şehir adıyla manuel arama
- Sorgulanan şehri tek tıkla kaydetme
- Kayıtlı şehirleri listeleme ve silme (CRUD)
- API anahtarının sadece backend'de tutulması (proxy mimarisi)
- Anlamlı hata mesajları (boş giriş, geçersiz şehir, ağ hatası)

---

## Mimari

```
Tarayıcı (public/)
    ↓ fetch('/api/weather'), fetch('/api/cities')
Express Sunucu (server.js)
    ↓ API key burada kalır
OpenWeatherMap API
    ↓
SQLite (cities.db)
```

Frontend, OpenWeatherMap'e doğrudan istek atmaz — her istek kendi
backend'ine gider, backend de API anahtarını ekleyip dış servise
yönlendirir. Bu sayede anahtar tarayıcı geliştirici konsolunda
görünmez.

---

## Klasör Yapısı

```
hava-durumu-izleyici/
├── public/
│   ├── index.html
│   ├── app.js
│   └── style.css
├── server.js
├── package.json
├── .env.example
└── .gitignore
```

---

## Kurulum

```bash
npm install
cp .env.example .env
```

`.env` dosyasını açıp kendi OpenWeatherMap API anahtarınızı yazın:

```
OPENWEATHER_API_KEY=kendi_api_keyiniz
PORT=3000
```

[OpenWeatherMap](https://openweathermap.org/api) üzerinden ücretsiz
bir anahtar alabilirsiniz.

```bash
npm start
```

Tarayıcıda `http://localhost:3000` adresini açın.

---

## API Uç Noktaları

| Metod | Yol | Açıklama |
|---|---|---|
| GET | `/api/weather?city=İstanbul` | Şehir adına göre hava durumu |
| GET | `/api/weather?lat=41.01&lon=28.97` | Koordinata göre hava durumu |
| GET | `/api/cities` | Kayıtlı şehirleri listele |
| POST | `/api/cities` | Yeni şehir kaydet |
| DELETE | `/api/cities/:id` | Kayıtlı şehri sil |

---

## Kullanılan Teknolojiler

| Teknoloji | Kullanım Amacı |
|---|---|
| Node.js + Express | Backend sunucu, API proxy, CRUD |
| SQLite | Kayıtlı şehirlerin saklanması |
| dotenv | API anahtarının ortam değişkeni olarak yönetimi |
| OpenWeatherMap API | Hava durumu verisi |
| Vanilla JavaScript | Frontend mantığı (framework yok) |

---

*Bu proje Web Programlama dersi final ödevi kapsamında
geliştirilmiş, ardından güvenlik ve kod kalitesi açısından
güncellenmiştir.*
