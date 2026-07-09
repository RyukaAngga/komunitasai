# 💻 KOMUNITAS — Frontend Web Client Application

> **Aplikasi Antarmuka Warga & Dashboard Administrasi Pelayanan Publik.**
>
> Proyek frontend React 18 teroptimasi penuh untuk **LKS EKKA National Competition 2026**.

---

## 📌 Rumusan Masalah (Frontend Bottlenecks)

Dalam merancang portal pelayanan publik berskala nasional, tim pengembang menghadapi tantangan teknis frontend berikut:
1. **Kompleksitas Visualisasi Prosedur**: Teks birokrasi yang panjang sangat membosankan dan membingungkan jika hanya ditampilkan sebagai paragraf teks biasa. Kami membutuhkan alat yang mampu menerjemahkan alur teks tersebut menjadi diagram grafis interaktif secara instan di browser klien tanpa membebani performa.
2. **Kinerja Rendah pada Peta Spasial (GIS)**: Memuat ratusan titik aduan warga secara real-time pada peta digital interaktif sering kali menyebabkan kelambatan rendering (frame drops) dan penggunaan memori yang besar di perangkat handphone warga kelas menengah ke bawah.
3. **Sinkronisasi State Real-time**: Mengelola pembaruan pesan obrolan antara warga dan petugas secara instan, pemantauan progress pencarian data (Web Grounding), dan pembaruan notifikasi status tanpa overhead library state management yang berat (seperti Redux).
4. **Keamanan Rute (Route Guarding)**: Mengamankan halaman dashboard admin dan petugas agar sama sekali tidak dapat diakses atau diintip oleh warga biasa yang tidak berwenang melalui manipulasi rute URL client-side.

---

## 💡 Solusi yang Diterapkan (Frontend Solutions)

Untuk mengatasi permasalahan di atas, kami merancang frontend dengan arsitektur web modern berkinerja tinggi:

* **Penerjemah Alur Visual (Mermaid.js Integrator)**: Kami membuat komponen khusus `<MermaidDiagram />` yang secara dinamis menangkap output sintaks Mermaid hasil ekstraksi AI dan langsung mengompilasinya menjadi diagram alir SVG interaktif yang bersih, responsif, dan dapat di-zoom/pan oleh pengguna.
* **Peta Cerdas Spasial Terkluster (Leaflet.js + Nominatim)**: Integrasi peta Leaflet dengan OpenStreetMap API yang teroptimasi. Kami menggunakan rendering layer berbasis canvas dan geocoding dinamis di sisi klien untuk mengubah koordinat GPS secara instan menjadi alamat detail regional (Provinsi, Kota/Kabupaten, Kecamatan) sehingga warga tidak perlu mengetik alamat secara manual.
* **State Management Ultra Ringan (Zustand)**: Menggantikan Redux dengan Zustand store yang sangat minimalis namun tangguh. Zustand mengelola state autentikasi, chat session, kuota limit harian, serta data statistik pengaduan secara terpusat dengan mekanisme reaktivitas tinggi.
* **Otentikasi & Proteksi Rute Berlapis**: Kami merancang komponen pembungkus `<ProtectedRoute />` dan `<AdminGuard />` yang menyaring status sesi autentikasi JWT Supabase dan klaim peran (*role claims*) pengguna sebelum merender halaman administratif secara ketat.

---

## 🛠️ Tech Stack & Dependensi Utama
* **Runtime / Compiler**: Node.js & Vite (Next-generation build tool)
* **Framework**: React 18 (TypeScript)
* **Styling**: TailwindCSS (Utility-First CSS) & Framer Motion (untuk animasi transisi micro-interaction)
* **Peta (GIS)**: Leaflet.js & React Leaflet
* **State Management**: Zustand
* **Router**: React Router DOM (v6)

---

## 🚀 Panduan Instalasi & Pengembangan (Local Setup)

### 1. Prasyarat
Pastikan Anda sudah menginstal **Node.js (v18+)** dan **npm** di komputer Anda.

### 2. Pemasangan Dependensi
Arahkan terminal ke direktori frontend, lalu jalankan perintah:
```bash
npm install
```

### 3. Konfigurasi Lingkungan (`.env`)
Buat berkas `.env` di root folder direktori `/frontend` dan lengkapi nilainya:
```env
# URL API Backend produksi/lokal
VITE_API_BASE_URL=http://localhost:3000

# Kredensial Akses Klien Supabase (Samakan dengan Backend)
VITE_SUPABASE_URL=https://proyek-anda.supabase.co
VITE_SUPABASE_ANON_KEY=kunci-anon-supabase-anda
```

### 4. Menjalankan Server Pengembangan
Jalankan perintah berikut untuk mengaktifkan hot-reloading server pengembangan lokal:
```bash
npm run dev
```
*Aplikasi kini berjalan di `http://localhost:5173`.*

### 5. Build Produksi (Production Build Compilation)
Untuk mengompilasi dan mengoptimalkan aset untuk siap di-deploy ke server produksi:
```bash
npm run build
```
Hasil kompilasi akan berada di folder `/dist` dalam bentuk SPA HTML/CSS/JS statis yang siap di-serve oleh Nginx atau layanan hosting statis.

---

## 📄 Lisensi (License)

Platform frontend ini dirilis di bawah lisensi **MIT License**.

---

*Dikembangkan dengan penuh dedikasi oleh **Tim Pencari Berkah**.*
