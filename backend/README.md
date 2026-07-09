# ⚙️ KOMUNITAS — Backend API Server & AI Engine

> **Server Backend & Mesin Pemrosesan Kecerdasan Buatan (AI Engine).**
>
> Proyek API Server berbasis Bun & Hono teroptimasi penuh untuk **LKS EKKA National Competition 2026**.

---

## 📌 Rumusan Masalah (Backend Challenges)

Dalam membangun server API yang melayani jutaan transaksi data dan integrasi kecerdasan buatan, kami mengidentifikasi beberapa masalah backend yang krusial:
1. **Keamanan & Kredensial Pengguna**: Menjamin data pribadi warga tidak bocor ke pihak luar saat berkonsultasi dengan kecerdasan buatan, dan mencegah eksploitasi penggunaan API token (LLM) gratisan dari spam bot.
2. **Keterbatasan Akurasi AI (Halusinasi)**: Model LLM generatif standar sering kali salah memberikan data/prosedur hukum atau membuat-buat data non-eksak (halusinasi) yang berisiko menyesatkan informasi publik bagi warga.
3. **Latensi Koneksi & Bottleneck Streaming**: Mengirimkan seluruh respon teks birokrasi yang panjang secara sekaligus dapat memicu latensi tinggi (Time-to-First-Token) yang mengganggu pengalaman pengguna.
4. **Klasifikasi Cepat & Skalabilitas Aduan**: Backend harus memproses ratusan keluhan warga yang masuk tiap menit, mengekstrak data esensial, menentukan titik darurat (Urgensi), tanpa memblokir thread proses server utama (*non-blocking event loops*).

---

## 💡 Solusi yang Diterapkan (Backend Solutions)

Kami mengatasi seluruh permasalahan di atas dengan mengimplementasikan teknologi backend modern yang efisien:

* **Bun & Hono Framework (Kinerja Ekstrim)**: Menggunakan Bun runtime yang memiliki mesin eksekusi JavaScript super cepat, dipadukan dengan framework router Hono.js yang minimalis dan efisien dalam konsumsi memori.
* **Responsible AI — PII Redactor & Guardrail**:
  * Kami membangun pembersih konten PII (*Personally Identifiable Information*) otomatis yang menggunakan regular expression (Regex) di backend untuk menyensor data NIK, No. HP, dan Email warga sebelum dikirim ke API OpenRouter.
  * Modul guardrails kami menepis konten provokatif SARA, politik radikal, dan toxic secara instan tanpa perlu mengeluarkan kuota komputasi LLM.
* **Hybrid Search & RAG (Reciprocal Rank Fusion)**:
  * Kami menulis fungsi pencarian gabungan (*Hybrid Search*) di PostgreSQL. Saat warga bertanya, backend mengeksekusi pencarian vektor semantik (`pgvector` cosine similarity) dan pencarian teks penuh (*Full-Text Search*) secara bersamaan.
  * Hasil dari kedua pencarian ini disinkronkan dan dihitung ulang bobotnya menggunakan algoritma **RRF** sebelum diumpankan sebagai basis data akurat bagi AI.
* **Streaming Server-Sent Events (SSE)**: Respon AI dialirkan secara bertahap menggunakan protokol SSE (`ReadableStream`), memberikan interaksi instan bagi warga (time-to-first-token kurang dari 200ms).
* **Asynchronous Urgency Scoring**: Proses analisis urgensi aduan didelegasikan secara asinkron ke background service sehingga warga mendapatkan respon pengiriman laporan instan tanpa menunggu proses evaluasi AI selesai.

---

## 🗄️ Skema Prosedur Database RPC (Supabase SQL Editor)

Pencarian hibrida didukung oleh fungsi database PostgreSQL khusus berikut:

```sql
-- Mengaktifkan ekstensi vector di Supabase
create extension if not exists vector;

-- Fungsi RPC untuk pencarian hibrida (RRF)
create or replace function hybrid_search_services(
  query_text text,
  query_embedding vector(1536),
  match_count int
)
returns table (
  id uuid,
  name varchar,
  institution varchar,
  category varchar,
  description text,
  requirements text,
  steps text,
  contact_info text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  with vector_search as (
    select s.id, (1 - (s.embedding <=> query_embedding))::float as similarity
    from public_services s
    order by s.embedding <=> query_embedding
    limit match_count * 2
  ),
  text_search as (
    select s.id, ts_rank_cd(to_tsvector('indonesian', s.name || ' ' || s.description), plainto_tsquery('indonesian', query_text))::float as text_rank
    from public_services s
    where to_tsvector('indonesian', s.name || ' ' || s.description) @@ plainto_tsquery('indonesian', query_text)
    limit match_count * 2
  )
  select 
    s.id, s.name, s.institution, s.category, s.description, s.requirements, s.steps, s.contact_info,
    coalesce(v.similarity, 0.0) as similarity
  from public_services s
  left join vector_search v on s.id = v.id
  left join text_search t on s.id = t.id
  where v.id is not null or t.id is not null
  order by (coalesce(v.similarity, 0.0) * 0.7 + coalesce(t.text_rank, 0.0) * 0.3) desc
  limit match_count;
end;
$$;
```

---

## 🚀 Panduan Instalasi & Pengembangan (Local Setup)

### 1. Prasyarat
Pastikan Anda sudah menginstal **Bun (v1.1+)** di komputer Anda.

### 2. Klon & Install Dependensi
```bash
bun install
```

### 3. Konfigurasi Lingkungan (`.env`)
Salin file `.env.example` menjadi `.env` di direktori `/backend`, lalu lengkapi isinya:
```env
PORT=3000
NODE_ENV=production

# Supabase Database Key
SUPABASE_URL=https://proyek-anda.supabase.co
SUPABASE_SERVICE_ROLE_KEY=kunci-service-role-supabase-anda

# OpenRouter AI Credentials
OPENROUTER_API_KEY=kunci-openrouter-anda
DEFAULT_MODEL=google/gemini-2.5-flash
EMBEDDING_MODEL=openai/text-embedding-3-small
```

### 4. Menjalankan Server Utama
```bash
bun dev
```
*Server API kini aktif di `http://localhost:3000`.*

---

## 📄 Lisensi (License)

Platform backend ini dirilis di bawah lisensi **MIT License**.

---

*Dikembangkan dengan penuh dedikasi oleh **Tim Pencari Berkah**.*
