# Fragments - Anonymous Stories Platform

Platform cerita anonim dan chat real-time. Share your story. Find your voice. Stay anonymous.

![Fragments](https://fragments-v2.vercel.app/preview.png)

## ✨ Fitur

| Fitur | Deskripsi |
|-------|-----------|
| **📖 Stories** | Posting cerita anonim dengan kategori (Mimpi, Ketakutan, Harapan, Pengalaman) |
| **💬 Quick Chat** | Chat real-time menggunakan BroadcastChannel (multi-tab) |
| **🔒 Anonymous** | Tanpa login, tanpa data pribadi |
| **📱 Mobile Friendly** | Tampilan responsive untuk semua perangkat |
| **⚡ Fast** | Loading cepat, UI smooth |

## 🛠️ Tech Stack

- **Frontend:** Vanilla HTML, CSS, JavaScript
- **Real-time Chat:** BroadcastChannel API (gratis, no server needed!)
- **Storage:** LocalStorage
- **Deployment:** Vercel

## 🚀 Cara Deploy

### Deploy ke Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Atau via GitHub
1. Push kode ke GitHub
2. Buka https://vercel.com
3. Import repository
4. Deploy!

**Live Demo:** https://fragments-v2.vercel.app

## 📝 Cara Pakai

### Stories
1. Klik tab **Write**
2. Tulis cerita kamu
3. Pilih kategori (opsional)
4. Klik **Publikasikan**
5. Cerita akan muncul di tab **Stories**

### Quick Chat
1. Klik tab **Chat**
2. Pilih mood emoji
3. Ketik pesan
4. Tekan Enter atau klik kirim
5. **Buka di tab baru** untuk chat bareng!

> 💡 Tips: Chat работает di multiple tabs pada device yang sama!

## 🔧 Konfigurasi Tambahan (Optional)

### Untuk Real-time Chat Lintas Device
Bisa gunakan PartyKit atau WebSocket server:

```bash
# Install PartyKit
npm install partykit

# Deploy PartyKit server
npx partykit deploy party/server.ts
```

Lalu update `app.js` untuk menggunakan PartySocket.

## 📁 Struktur File

```
fragments/
├── index.html          # Halaman utama
├── styles.css          # Styling
├── app.js              # Logika aplikasi
├── party/
│   ├── server.ts       # PartyKit server (optional)
│   └── partykit.json   # Konfigurasi PartyKit
├── package.json        # Dependencies
└── README.md           # Dokumentasi
```

## 🎨 Preview

### Stories Tab
- Tampilan grid cerita
- Kategori dengan emoji
- Info username & waktu

### Write Tab
- Textarea dengan character counter
- Pilihan kategori
- Tombol publikasi

### Chat Tab
- Pesan real-time (via BroadcastChannel)
- Mood selector
- Tampilan responsive

## 📄 Lisensi

MIT License - Bebas digunakan dan dimodifikasi

---

Dibuat dengan 💜 oleh [mail-eth](https://github.com/mail-eth)
