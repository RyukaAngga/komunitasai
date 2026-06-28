-- =========================================================================
-- DATABASE SCHEMA: SahabatLKS - AI Assistant & Valid Information Portal
-- For LKS EKKA National Competition 2026 (Komunitas Case Study)
-- Database Engine: PostgreSQL (Supabase)
-- =========================================================================

-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";

-- =========================================================================
-- 1. TABLE: public_services
-- Directory of public service institutions (e.g. PMI, KPAI, Komnas HAM, Social Services)
-- Helps citizens find verify details, categories, requirements, and steps.
-- =========================================================================
drop table if exists public_services cascade;
create table public_services (
    id uuid default uuid_generate_v4() primary key,
    name varchar(255) not null,
    institution varchar(255) not null, -- e.g., "Komisi Perlindungan Anak Indonesia"
    category varchar(100) not null,   -- e.g., "Perlindungan Anak", "Layanan Kesehatan", "Bantuan Sosial", "Kebencanaan"
    description text not null,
    requirements jsonb default '[]'::jsonb, -- List of required documents/criteria
    procedures jsonb default '[]'::jsonb,   -- Step-by-step procedures
    contact_phone varchar(50),
    contact_email varchar(100),
    address text,
    website varchar(255),
    embedding vector(1536),           -- Vector representation for semantic search (RAG)
    is_active boolean default true not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexing for search performance on name, institution, and category
create index idx_public_services_category on public_services(category);
create index idx_public_services_name_inst on public_services(name, institution);

-- HNSW vector index for high-speed similarity searches (RAG)
create index idx_public_services_embedding on public_services using hnsw (embedding vector_cosine_ops);

-- =========================================================================
-- 2. TABLE: chat_history
-- Stores chat messages between users and AI assistant.
-- =========================================================================
drop table if exists chat_history cascade;
create table chat_history (
    session_id text primary key,
    messages jsonb not null default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexing for performance
create index idx_chat_history_updated_at on chat_history(updated_at desc);

-- =========================================================================
-- 3. TABLE: claim_verifications
-- Stores information, claims, or hoaxes submitted by citizens for verification.
-- =========================================================================
drop table if exists claim_verifications cascade;
create table claim_verifications (
    id uuid default uuid_generate_v4() primary key,
    claim_text text not null,
    is_credible boolean default false not null,
    confidence_score numeric(5,2) default 0.00 not null, -- Credibility percentage (e.g., 85.50%)
    reasoning text not null,
    sources jsonb default '[]'::jsonb, -- Array of verification sources/urls
    category varchar(100) default 'Umum'::varchar,
    search_count integer default 1 not null, -- How many times this claim has been checked
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexing to quickly find similar claims and order by popular checks
create index idx_claim_verifications_search_count on claim_verifications(search_count desc);

-- =========================================================================
-- 4. TABLE: document_summaries
-- Caches summarized procedures and documents to save LLM tokens and latency.
-- =========================================================================
drop table if exists document_summaries cascade;
create table document_summaries (
    id uuid default uuid_generate_v4() primary key,
    original_hash varchar(64) unique not null, -- SHA256 of original text to prevent duplicate summaries
    original_text text not null,
    summary text not null,
    key_points jsonb default '[]'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- 5. TABLE: citizen_reports
-- Allows citizens to report issues, seek official help, or log specific incidents
-- directly to community leaders or volunteer networks.
-- =========================================================================
drop table if exists citizen_reports cascade;
create table citizen_reports (
    id uuid default uuid_generate_v4() primary key,
    session_id text references chat_history(session_id) on delete set null,
    reporter_name varchar(100) default 'Anonim'::varchar not null,
    reporter_contact varchar(100), -- Phone/Email for follow-up
    category varchar(100) not null, -- e.g., "Darurat", "Kesehatan", "Kekerasan Anak", "Sosial"
    description text not null,
    status varchar(50) default 'Menunggu'::varchar not null, -- "Menunggu", "Diproses", "Selesai", "Ditolak"
    admin_note text, -- Catatan tindak lanjut dari admin/operator
    latitude double precision, -- Koordinat GPS Latitude
    longitude double precision, -- Koordinat GPS Longitude
    image_url text, -- Base64 data atau URL foto lampiran aduan
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for managing reports status
create index idx_citizen_reports_status on citizen_reports(status);
create index idx_citizen_reports_created_at on citizen_reports(created_at desc);

-- =========================================================================
-- VECTOR MATCHING FUNCTION (RPC)
-- Cosine similarity search for public service procedures (RAG grounding)
-- =========================================================================
create or replace function match_services (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  name varchar(255),
  institution varchar(255),
  category varchar(100),
  description text,
  requirements jsonb,
  procedures jsonb,
  contact_phone varchar(50),
  contact_email varchar(100),
  address text,
  website text,
  similarity float
)
language sql stable
as $$
  select
    public_services.id,
    public_services.name,
    public_services.institution,
    public_services.category,
    public_services.description,
    public_services.requirements,
    public_services.procedures,
    public_services.contact_phone,
    public_services.contact_email,
    public_services.address,
    public_services.website::text, -- Cast website to text for compatibility
    1 - (public_services.embedding <=> query_embedding) as similarity
  from public_services
  where 1 - (public_services.embedding <=> query_embedding) > match_threshold
  order by public_services.embedding <=> query_embedding
  limit match_count;
$$;

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling RLS to secure endpoints
-- =========================================================================

-- Enable RLS on all tables
alter table public_services enable row level security;
alter table chat_history enable row level security;
alter table claim_verifications enable row level security;
alter table document_summaries enable row level security;
alter table citizen_reports enable row level security;

-- Public read-only policy for public services (everyone can read)
create policy "Allow public read on public_services" 
on public_services for select using (true);

-- Anonymous CRUD policies for chat history (sessions are temporary/unauthenticated)
create policy "Allow all operations on chat_history for anonymous users"
on chat_history for all using (true) with check (true);

-- Anonymous read & insert policies for claim verifications
create policy "Allow read/write on claim_verifications"
on claim_verifications for all using (true) with check (true);

-- Anonymous read & insert policies for document summaries
create policy "Allow read/write on document_summaries"
on document_summaries for all using (true) with check (true);

-- Anonymous insert & read reports
create policy "Allow read/write on citizen_reports"
on citizen_reports for all using (true) with check (true);

-- =========================================================================
-- SEED DATA (INITIAL DATA FOR DEMO/TESTING)
-- Prepopulating directory for KPAI, PMI, and Komnas HAM
-- =========================================================================

insert into public_services (name, institution, category, description, requirements, procedures, contact_phone, contact_email, address, website)
values 
(
    'Pengaduan Kekerasan dan Hak Anak',
    'Komisi Perlindungan Anak Indonesia (KPAI)',
    'Perlindungan Anak',
    'Layanan pengaduan resmi bagi masyarakat yang menyaksikan atau menjadi korban pelanggaran hak anak, kekerasan, eksploitasi, maupun penelantaran anak.',
    '["KTP/Identitas Pelapor", "Kronologi Kejadian (Tertulis)", "Bukti Pendukung (Foto/Video jika ada)", "Nama & Usia Anak"]'::jsonb,
    '["Masyarakat mengirimkan laporan via form online atau datang langsung", "KPAI melakukan verifikasi awal laporan", "KPAI mengadakan mediasi atau koordinasi dengan lembaga hukum/dinas sosial jika ada unsur pidana", "Tindak lanjut pengawasan kasus hingga selesai"]'::jsonb,
    '021-31901556',
    'pengaduan@kpai.go.id',
    'Jl. Teuku Umar No. 10, Gondangdia, Menteng, Jakarta Pusat',
    'https://www.kpai.go.id'
),
(
    'Layanan Ambulans Gawat Darurat dan Donor Darah',
    'Palang Merah Indonesia (PMI)',
    'Layanan Kesehatan',
    'Penyediaan unit ambulans gratis untuk evakuasi darurat, stok kantong darah, penanganan bencana alam tingkat nasional, dan pelatihan pertolongan pertama.',
    '["Surat Permintaan Kebutuhan Darah (untuk donor darah)", "Kartu Identitas (untuk donor darah)", "Panggilan Darurat bebas dokumen (untuk Ambulans)"]'::jsonb,
    '["Untuk donor darah: datang ke Unit Transfusi Darah (UTD) terdekat, isi kuesioner medis, lakukan cek HB dan tensi, proses donor darah.", "Untuk bencana/ambulans: Hubungi call center PMI di 112 atau nomor wilayah setempat, tim evakuasi segera meluncur ke lokasi."]'::jsonb,
    '021-7992325',
    'pmi@pmi.or.id',
    'Jl. Jenderal Gatot Subroto Kav. 96, Jakarta Selatan',
    'https://www.pmi.or.id'
),
(
    'Pengaduan Pelanggaran Hak Asasi Manusia',
    'Komisi Nasional Hak Asasi Manusia (Komnas HAM)',
    'Perlindungan Hukum',
    'Menerima pengaduan masyarakat atas dugaan pelanggaran Hak Asasi Manusia yang dilakukan oleh aparatur negara maupun pihak swasta.',
    '["KTP/Paspor Pelapor", "Uraian kronologis pelanggaran HAM", "Identitas korban dan pihak terlapor", "Dokumen bukti permulaan (surat keputusan, foto, dll)"]'::jsonb,
    '["Pengadu menyampaikan berkas pengaduan secara tertulis maupun daring", "Komnas HAM memeriksa kelengkapan berkas", "Analisis materiil untuk menentukan apakah ada pelanggaran HAM", "Mediasi, rekomendasi kepada aparat penegak hukum, atau penyelidikan lapangan jika diperlukan"]'::jsonb,
    '021-3925230',
    'pengaduan@komnasham.go.id',
    'Jl. Latuharhary No. 4B, Menteng, Jakarta Pusat',
    'https://www.komnasham.go.id'
);

-- =========================================================================
-- MIGRATION: RUN THIS IN THE SUPABASE SQL EDITOR TO UPDATE EXISTING TABLES
-- =========================================================================
-- ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS latitude double precision;
-- ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS longitude double precision;
-- ALTER TABLE citizen_reports ADD COLUMN IF NOT EXISTS image_url text;

