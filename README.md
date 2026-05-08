# Toko Ar-Rahmah Orders

Toko Ar-Rahmah Orders adalah aplikasi pemesanan produk berbasis Vite, React, dan backend Node sederhana untuk autentikasi.

## Kebutuhan

- Node.js 20 LTS atau lebih baru
- npm

## Development

```bash
npm install
npm run build
ADMIN_EMAIL=admin@quickpick.com ADMIN_PASSWORD=AdminPass123 npm run server
```

Buka aplikasi di:

```text
http://localhost:8787
```

Untuk mode Vite dev, jalankan server auth dan dev server di dua terminal:

```bash
ADMIN_EMAIL=admin@quickpick.com ADMIN_PASSWORD=AdminPass123 npm run server
npm run dev
```

## Akun

- Akun admin dibuat dari environment `ADMIN_EMAIL` dan `ADMIN_PASSWORD`.
- Akun yang dibuat dari halaman daftar otomatis menjadi pelanggan.
- Password disimpan sebagai hash PBKDF2.
- Session memakai cookie `HttpOnly`.

## Production

```bash
npm ci
npm run build
NODE_ENV=production ADMIN_EMAIL=... ADMIN_PASSWORD=... npm start
```

Secara default aplikasi memakai file lokal `.data/auth.json`. Jika environment `DATABASE_URL` tersedia, aplikasi otomatis memakai PostgreSQL dan file JSON hanya menjadi fallback/migration source. Jangan commit folder `.data` atau file `.env`.

## PostgreSQL

Untuk Railway production, disarankan memakai PostgreSQL:

1. Tambahkan service PostgreSQL di project Railway yang sama.
2. Pastikan variable `DATABASE_URL` tersedia di service aplikasi.
3. Deploy ulang aplikasi.

Saat pertama kali berjalan dengan PostgreSQL kosong, aplikasi akan membuat tabel berikut otomatis:

- `users`
- `app_state`

Jika file lama `.data/auth.json` masih tersedia dan tabel PostgreSQL masih kosong, data lama akan dimigrasikan otomatis ke PostgreSQL. Setelah migrasi berhasil, data berikutnya disimpan di PostgreSQL.

## Docker Deploy

```bash
docker build -t quickpick-orders .
docker run -p 8787:8787 \
  -e NODE_ENV=production \
  -e ADMIN_EMAIL=admin@domainmu.com \
  -e ADMIN_PASSWORD=password-admin-kuat \
  quickpick-orders
```

Kalau pakai Render/Railway/VPS, pakai `Dockerfile` ini sebagai dasar. Pastikan storage persisten disiapkan untuk folder `.data`.

## Railway Free

Railway Free bisa dipakai untuk coba-coba dan testing kecil.

Setelah import repo:

1. Biarkan Railway memakai `Dockerfile` di root repo.
2. Set env:
   ```bash
   NODE_ENV=production
   ADMIN_EMAIL=admin@domainmu.com
   ADMIN_PASSWORD=password-admin-kuat
   ```
3. Untuk penyimpanan utama, tambahkan PostgreSQL service agar `DATABASE_URL` otomatis tersedia.
4. Opsional fallback/migrasi: tambahkan volume dan mount ke:
   ```text
   /app/.data
   ```
5. Set healthcheck path ke:
   ```text
   /health
   ```
6. Deploy dan buka domain Railway yang dibuat otomatis.

Kalau tidak memakai PostgreSQL, volume wajib ada supaya file `.data/auth.json` tetap persisten. Kalau volume dipasang di path lain, set `DATA_DIR` ke path mount volume itu.

## Quality Check

```bash
npm run lint
npm test
npm run build
```
