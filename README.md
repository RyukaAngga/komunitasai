# KOMUNITAS - AI Assistant & Valid Information Portal

> **Studi Kasus Komunitas - LKS EKKA National Competition 2026**

KOMUNITAS adalah platform komunitas digital yang dirancang untuk membantu warga mendapatkan informasi publik yang valid, memverifikasi berita hoaks menggunakan AI, meringkas dokumen birokrasi, serta melaporkan aduan darurat secara langsung ke dashboard admin.

---

## 🚀 Fitur Utama

1. **AI Chatbot (RAG Pipeline)**: Konsultasi informasi publik secara cerdas berbasis data real-time dari instansi seperti PMI, KPAI, Komnas HAM, dll.
2. **Klaim & Verifikasi Hoaks**: Sistem validasi berbasis Web Search Grounding untuk mengecek kredibilitas suatu berita/isu di internet.
3. **Ringkasan Dokumen**: Meringkas dokumen teks panjang menjadi ringkasan poin-poin penting serta menghasilkan diagram alir birokrasi menggunakan format `Mermaid.js`.
4. **Analisis Dokumen (OCR)**: Membaca teks langsung dari unggahan foto/gambar dokumen (KTP, Surat, dll).
5. **Laporan Aduan Warga**: Warga dapat mengirim laporan aduan darurat terintegrasi koordinat GPS langsung ke dashboard admin.
6. **Dashboard Admin**: Pengelolaan aduan warga (Menunggu, Diproses, Selesai, Ditolak) secara real-time.

---

## 🛠️ Stack Teknologi

### Frontend
- **Framework**: React 18 + Vite (TypeScript)
- **Styling**: TailwindCSS
- **State & Router**: React Router DOM v6, Axios
- **Ikon**: Lucide React

### Backend
- **Runtime**: Bun
- **Framework**: Hono
- **Database & Auth**: Supabase (PostgreSQL)
- **AI Integrasi**: OpenRouter API (Gemini / AI Model), OpenAI Embedding
- **Validasi Schema**: Zod

---

## 💻 Cara Menjalankan Proyek

### Prerequisites
Pastikan Anda sudah menginstal **Bun** pada komputer Anda.

### 1. Backend Setup
1. Masuk ke folder backend:
   ```bash
   cd backend
   ```
2. Instal dependensi:
   ```bash
   bun install
   ```
3. Salin dan konfigurasi file `.env` (isi dengan Supabase URL, Anon Key, OpenRouter API Key, dll):
   ```bash
   cp .env.example .env
   ```
4. Jalankan server backend:
   ```bash
   bun run dev
   ```
   Server akan berjalan di `http://localhost:3000`.

### 2. Frontend Setup
1. Masuk ke folder frontend:
   ```bash
   cd ../frontend
   ```
2. Instal dependensi:
   ```bash
   npm install
   ```
3. Jalankan aplikasi frontend:
   ```bash
   npm run dev
   ```
   Aplikasi dapat diakses di `http://localhost:5173`.

---

## 📄 Lisensi

Proyek ini dilisensikan di bawah **MIT License** - lihat file [LICENSE](LICENSE) untuk detail lebih lanjut.
