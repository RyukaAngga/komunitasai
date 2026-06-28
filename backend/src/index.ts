/**
 * Entry point utama aplikasi backend
 * Setup server Hono dengan semua middleware dan routes
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import chatRoutes from './routes/chat';
import { 
  createReportController,
  getReportsController,
  updateReportStatusController,
  getDashboardStatsController,
  createServiceController,
  getServicesController,
  deleteServiceController,
  getClaimsController,
  deleteClaimController,
  getSummariesController,
  deleteSummaryController,
  getChatHistoriesController,
  deleteHistoryController,
} from './controllers/chatController';

// --- Inisialisasi App ---
const app = new Hono();

// --- Middleware ---

/**
 * Logger Middleware
 * Mencatat semua request yang masuk
 */
app.use('*', logger());

/**
 * CORS Middleware
 * Mengizinkan akses dari frontend
 */
app.use('*', cors({
  origin: (origin) => origin,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposeHeaders: ['Content-Length', 'X-Requested-With'],
  maxAge: 86400, // 24 hours cache untuk preflight
}));

// --- Routes ---

/**
 * Registrasi semua route chat
 * Semua endpoint di bawah /api/chat
 */
app.route('/api/chat', chatRoutes);

/**
 * Registrasi aduan warga (reports)
 * POST   /api/reports - Buat laporan baru
 * GET    /api/reports - Ambil semua laporan (Admin)
 * PATCH  /api/reports/:id - Update status laporan (Admin)
 * GET    /api/admin/stats - Statistik dashboard admin
 */
app.post('/api/reports', createReportController);
app.get('/api/reports', getReportsController);
app.patch('/api/reports/:id', updateReportStatusController);
app.get('/api/admin/stats', getDashboardStatsController);

/**
 * Registrasi layanan RAG (services)
 * POST   /api/services - Tambah layanan (Admin)
 * GET    /api/services - Ambil semua layanan (Admin/Umum)
 * DELETE /api/services/:id - Hapus layanan (Admin)
 */
app.post('/api/services', createServiceController);
app.get('/api/services', getServicesController);
app.delete('/api/services/:id', deleteServiceController);

/**
 * Registrasi manajemen data tambahan (Admin)
 */
app.get('/api/claims', getClaimsController);
app.delete('/api/claims/:id', deleteClaimController);
app.get('/api/summaries', getSummariesController);
app.delete('/api/summaries/:id', deleteSummaryController);
app.get('/api/histories', getChatHistoriesController);
app.delete('/api/histories/:sessionId', deleteHistoryController);

// --- Utility Endpoints ---

/**
 * Health Check Endpoint
 * Untuk monitoring dan testing
 * GET /health
 */
app.get('/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

/**
 * Root Endpoint
 * Informasi dasar API
 * GET /
 */
/**
 * /**
 * Root Endpoint
 * Dokumentasi API Sederhana (Bootstrap 5 - Downgraded/Lazy Style)
 * GET /
 */
app.get('/', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>KOMUNITAS API Documentation</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <style>
    body {
      font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, "Liberation Mono", monospace;
      background-color: #ffffff;
      color: #111827;
      padding: 30px 15px;
      font-size: 13px;
    }
    .title-area {
      margin-bottom: 25px;
    }
    .title-area h1 {
      font-size: 20px;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.02em;
      margin-bottom: 2px;
    }
    .title-area p {
      color: #6b7280;
      font-size: 12px;
      margin-bottom: 5px;
    }
    .license-link {
      color: #10b981;
      text-decoration: none;
      font-weight: 600;
    }
    .license-link:hover {
      text-decoration: underline;
    }
    .group-section {
      margin-top: 30px;
    }
    .group-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #111827;
      padding-bottom: 4px;
      margin-bottom: 12px;
    }
    .group-title {
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .group-desc {
      font-weight: 400;
      color: #6b7280;
      text-transform: none;
    }
    .group-actions {
      font-size: 11px;
      color: #6b7280;
    }
    .group-actions span {
      cursor: pointer;
      font-weight: 600;
    }
    .group-actions span:hover {
      color: #111827;
    }
    .api-row {
      display: flex;
      align-items: center;
      padding: 6px 12px;
      cursor: pointer;
      border-radius: 0px !important;
      margin-bottom: 6px;
      transition: background-color 0.1s ease;
      border: 1px solid;
      user-select: none;
    }
    .api-method {
      font-size: 10px;
      font-weight: 800;
      padding: 2px 6px;
      color: #ffffff;
      min-width: 60px;
      text-align: center;
      margin-right: 12px;
    }
    .api-path {
      font-weight: 600;
      font-size: 12px;
      flex-grow: 1;
    }
    .api-operation {
      font-size: 11px;
      color: #6b7280;
    }

    /* GET */
    .api-row-get {
      background-color: #f8fafc;
      border-color: #cbd5e1;
      color: #1e293b;
    }
    .api-row-get:hover {
      background-color: #f1f5f9;
    }
    .api-row-get .api-method {
      background-color: #0284c7;
    }
    .api-row-get .api-path {
      color: #0f172a;
    }

    /* POST */
    .api-row-post {
      background-color: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }
    .api-row-post:hover {
      background-color: #dcfce7;
    }
    .api-row-post .api-method {
      background-color: #16a34a;
    }
    .api-row-post .api-path {
      color: #14532d;
    }

    /* DELETE */
    .api-row-delete {
      background-color: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }
    .api-row-delete:hover {
      background-color: #fee2e2;
    }
    .api-row-delete .api-method {
      background-color: #dc2626;
    }
    .api-row-delete .api-path {
      color: #7f1d1d;
    }

    /* PATCH */
    .api-row-patch {
      background-color: #fffbeb;
      border-color: #fef3c7;
      color: #92400e;
    }
    .api-row-patch:hover {
      background-color: #fef3c7;
    }
    .api-row-patch .api-method {
      background-color: #d97706;
    }
    .api-row-patch .api-path {
      color: #78350f;
    }

    .api-details {
      border: 1px solid #e5e7eb;
      border-top: none;
      background-color: #ffffff;
      padding: 12px;
      margin-bottom: 12px;
      margin-top: -6px;
    }
    .api-details pre {
      margin: 0;
      padding: 8px;
      background-color: #f9fafb;
      color: #111827;
      border: 1px solid #e5e7eb !important;
      border-radius: 0px !important;
      font-size: 11px;
    }
    .footer-info {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 30px;
      border-top: 1px solid #e5e7eb;
      padding-top: 10px;
    }
  </style>
</head>
<body>
  <div class="container" style="max-width: 900px;">
    <!-- Minimal Header -->
    <div class="title-area">
      <h1>Api Documentation</h1>
      <p>Api Documentation</p>
      <a href="http://apache.org/licenses/LICENSE-2.0.html" target="_blank" class="license-link">Apache 2.0</a>
    </div>

    <!-- Group 1: chat-controller -->
    <div class="group-section">
      <div class="group-header">
        <h2 class="group-title">
          chat-controller <span class="group-desc">: AI & Chat Assistant Controller</span>
        </h2>
        <div class="group-actions">
          <span onclick="toggleGroup('chat')">Show/Hide</span> | 
          <span onclick="toggleGroup('chat')">List Operations</span> | 
          <span onclick="toggleGroup('chat')">Expand Operations</span>
        </div>
      </div>

      <div id="group-chat">
        <!-- POST /api/chat -->
        <div>
          <div class="api-row api-row-post" data-bs-toggle="collapse" data-bs-target="#collapse-chat" aria-expanded="false">
            <span class="api-method">POST</span>
            <span class="api-path">/api/chat</span>
            <span class="api-operation">chatController</span>
          </div>
          <div class="collapse" id="collapse-chat">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Mengirim pesan chat asisten AI dengan pencarian semantik (RAG) di database public_services.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Body:</span>
                  <pre>{
  "message": "bagaimana cara melapor ke KPAI?",
  "sessionId": "session_xxx" // opsional
}</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "content": "Langkah melapor ke KPAI adalah...",
  "sessionId": "session_xxx",
  "timestamp": "2026-06-23T12:00:05.000Z"
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- POST /api/chat/ocr -->
        <div>
          <div class="api-row api-row-post" data-bs-toggle="collapse" data-bs-target="#collapse-chat-ocr" aria-expanded="false">
            <span class="api-method">POST</span>
            <span class="api-path">/api/chat/ocr</span>
            <span class="api-operation">ocrController</span>
          </div>
          <div class="collapse" id="collapse-chat-ocr">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> OCR Vision Dokumen. Mengekstrak teks dari gambar berkas fisik menggunakan AI Vision.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request (JSON/Multipart):</span>
                  <pre>Multipart Form-data:
- file: Berkas Gambar (png, jpeg, dll.)

Atau JSON:
{
  "image": "data:image/png;base64,iVBOR...",
  "mimeType": "image/png"
}</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "text": "[Hasil Ekstraksi Teks]",
  "content": "[Hasil Ekstraksi Teks]",
  "timestamp": "2026-06-23T12:00:10.000Z"
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- POST /api/chat/validate -->
        <div>
          <div class="api-row api-row-post" data-bs-toggle="collapse" data-bs-target="#collapse-chat-validate" aria-expanded="false">
            <span class="api-method">POST</span>
            <span class="api-path">/api/chat/validate</span>
            <span class="api-operation">validateClaimController</span>
          </div>
          <div class="collapse" id="collapse-chat-validate">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Verifikasi klaim berita/hoaks menggunakan pencarian internet Google Serper API.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Body:</span>
                  <pre>{
  "claim": "Pemerintah bagikan bansos 5 juta rupiah lewat WhatsApp"
}</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "isValid": false,
  "explanation": "Klaim tersebut tidak benar/hoaks...",
  "source": "TurnBackHoax.id",
  "confidence": 95
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- POST /api/chat/summarize -->
        <div>
          <div class="api-row api-row-post" data-bs-toggle="collapse" data-bs-target="#collapse-chat-summarize" aria-expanded="false">
            <span class="api-method">POST</span>
            <span class="api-path">/api/chat/summarize</span>
            <span class="api-operation">summarizeController</span>
          </div>
          <div class="collapse" id="collapse-chat-summarize">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Meringkas naskah prosedur panjang birokrasi menjadi ringkasan poin dan flowchart Mermaid.js.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Body:</span>
                  <pre>{
  "text": "Salinan aturan birokrasi..."
}</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "summary": "1. Poin Ringkasan...\\n\\n\`\`\`mermaid\\ngraph TD;\\n...\\n\`\`\`",
  "timestamp": "2026-06-23T12:00:15.000Z"
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GET /api/chat/history/:sessionId -->
        <div>
          <div class="api-row api-row-get" data-bs-toggle="collapse" data-bs-target="#collapse-chat-history" aria-expanded="false">
            <span class="api-method">GET</span>
            <span class="api-path">/api/chat/history/:sessionId</span>
            <span class="api-operation">getHistoryController</span>
          </div>
          <div class="collapse" id="collapse-chat-history">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Mengambil semua riwayat obrolan sesi tertentu berdasarkan sessionId.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Params:</span>
                  <pre>Path: sessionId (string)</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ],
  "messages": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DELETE /api/chat/history/:sessionId -->
        <div>
          <div class="api-row api-row-delete" data-bs-toggle="collapse" data-bs-target="#collapse-chat-history-delete" aria-expanded="false">
            <span class="api-method">DELETE</span>
            <span class="api-path">/api/chat/history/:sessionId</span>
            <span class="api-operation">deleteHistoryController</span>
          </div>
          <div class="collapse" id="collapse-chat-history-delete">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Menghapus riwayat sesi chat tertentu dari database Supabase.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Params:</span>
                  <pre>Path: sessionId (string)</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "success": true,
  "message": "Riwayat chat berhasil dihapus."
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Group 2: report-controller -->
    <div class="group-section">
      <div class="group-header">
        <h2 class="group-title">
          report-controller <span class="group-desc">: Citizen Report Controller</span>
        </h2>
        <div class="group-actions">
          <span onclick="toggleGroup('report')">Show/Hide</span> | 
          <span onclick="toggleGroup('report')">List Operations</span> | 
          <span onclick="toggleGroup('report')">Expand Operations</span>
        </div>
      </div>

      <div id="group-report">
        <!-- POST /api/reports -->
        <div>
          <div class="api-row api-row-post" data-bs-toggle="collapse" data-bs-target="#collapse-report-post" aria-expanded="false">
            <span class="api-method">POST</span>
            <span class="api-path">/api/reports</span>
            <span class="api-operation">createReportController</span>
          </div>
          <div class="collapse" id="collapse-report-post">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Kirim aduan darurat warga dengan lokasi koordinat GPS.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Body:</span>
                  <pre>{
  "reporterName": "Budi",
  "reporterContact": "08123456789",
  "category": "Keamanan / Kriminalitas",
  "description": "Terjadi pencurian sepeda motor...",
  "latitude": -6.2088, // opsional
  "longitude": 106.8456 // opsional
}</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "id": "report-uuid",
  "status": "Menunggu",
  "message": "Laporan Anda berhasil disimpan dan sedang diverifikasi."
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GET /api/reports -->
        <div>
          <div class="api-row api-row-get" data-bs-toggle="collapse" data-bs-target="#collapse-report-get" aria-expanded="false">
            <span class="api-method">GET</span>
            <span class="api-path">/api/reports</span>
            <span class="api-operation">getReportsController</span>
          </div>
          <div class="collapse" id="collapse-report-get">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Mengambil semua daftar laporan warga dengan filter status aduan serta pagination (Admin).</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Query Params:</span>
                  <pre>?status=Menunggu&page=1&limit=20</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "reports": [
    {
      "id": "report-uuid",
      "reporter_name": "Budi",
      "status": "Menunggu",
      ...
    }
  ],
  "total": 12,
  "totalPages": 1
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- PATCH /api/reports/:id -->
        <div>
          <div class="api-row api-row-patch" data-bs-toggle="collapse" data-bs-target="#collapse-report-patch" aria-expanded="false">
            <span class="api-method">PATCH</span>
            <span class="api-path">/api/reports/:id</span>
            <span class="api-operation">updateReportStatusController</span>
          </div>
          <div class="collapse" id="collapse-report-patch">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Mengubah status laporan pengaduan warga serta menambahkan catatan admin.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Body:</span>
                  <pre>{
  "status": "Diproses",
  "adminNote": "Laporan diteruskan ke polsek terdekat"
}</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "report": { ... },
  "message": "Status laporan berhasil diubah ke \"Diproses\""
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GET /api/admin/stats -->
        <div>
          <div class="api-row api-row-get" data-bs-toggle="collapse" data-bs-target="#collapse-report-stats" aria-expanded="false">
            <span class="api-method">GET</span>
            <span class="api-path">/api/admin/stats</span>
            <span class="api-operation">getDashboardStatsController</span>
          </div>
          <div class="collapse" id="collapse-report-stats">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Menghitung total laporan, total sesi obrolan, serta pembagian jumlah laporan berdasarkan masing-masing status untuk dasbor admin.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request:</span>
                  <pre>None</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "totalReports": 24,
  "totalSessions": 56,
  "statusCounts": {
    "Menunggu": 4,
    "Diproses": 10,
    "Selesai": 10,
    "Ditolak": 0
  }
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Group 3: service-controller -->
    <div class="group-section">
      <div class="group-header">
        <h2 class="group-title">
          service-controller <span class="group-desc">: Public Services RAG Controller</span>
        </h2>
        <div class="group-actions">
          <span onclick="toggleGroup('service')">Show/Hide</span> | 
          <span onclick="toggleGroup('service')">List Operations</span> | 
          <span onclick="toggleGroup('service')">Expand Operations</span>
        </div>
      </div>

      <div id="group-service">
        <!-- POST /api/services -->
        <div>
          <div class="api-row api-row-post" data-bs-toggle="collapse" data-bs-target="#collapse-service-post" aria-expanded="false">
            <span class="api-method">POST</span>
            <span class="api-path">/api/services</span>
            <span class="api-operation">createServiceController</span>
          </div>
          <div class="collapse" id="collapse-service-post">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Menambahkan data layanan publik. Server otomatis memproses text embedding untuk pgvector.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Body:</span>
                  <pre>{
  "name": "Pendaftaran Layanan BPJS",
  "institution": "BPJS Kesehatan",
  "category": "Kesehatan",
  "description": "Prosedur pendaftaran BPJS Mandiri...",
  "requirements": ["KTP", "Kartu Keluarga"],
  "procedures": ["Buka aplikasi Mobile JKN", "Pilih menu daftar"]
}</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "id": "service-uuid",
  "message": "Layanan publik berhasil ditambahkan dan di-index ke vektor."
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GET /api/services -->
        <div>
          <div class="api-row api-row-get" data-bs-toggle="collapse" data-bs-target="#collapse-service-get" aria-expanded="false">
            <span class="api-method">GET</span>
            <span class="api-path">/api/services</span>
            <span class="api-operation">getServicesController</span>
          </div>
          <div class="collapse" id="collapse-service-get">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Mengambil daftar semua instansi panduan layanan publik yang tersimpan di Supabase.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Query Params:</span>
                  <pre>?category=Kesehatan // opsional</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "services": [
    {
      "id": "service-uuid",
      "name": "Pendaftaran Layanan BPJS",
      "institution": "BPJS Kesehatan",
      ...
    }
  ]
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DELETE /api/services/:id -->
        <div>
          <div class="api-row api-row-delete" data-bs-toggle="collapse" data-bs-target="#collapse-service-delete" aria-expanded="false">
            <span class="api-method">DELETE</span>
            <span class="api-path">/api/services/:id</span>
            <span class="api-operation">deleteServiceController</span>
          </div>
          <div class="collapse" id="collapse-service-delete">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Menghapus data panduan layanan publik serta embedding vektor keserupaannya dari Supabase.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Params:</span>
                  <pre>Path: id (string)</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "success": true,
  "message": "Layanan publik berhasil dihapus."
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Group 4: audit-controller -->
    <div class="group-section">
      <div class="group-header">
        <h2 class="group-title">
          audit-controller <span class="group-desc">: Admin Audit Logs Controller</span>
        </h2>
        <div class="group-actions">
          <span onclick="toggleGroup('audit')">Show/Hide</span> | 
          <span onclick="toggleGroup('audit')">List Operations</span> | 
          <span onclick="toggleGroup('audit')">Expand Operations</span>
        </div>
      </div>

      <div id="group-audit">
        <!-- GET /api/claims -->
        <div>
          <div class="api-row api-row-get" data-bs-toggle="collapse" data-bs-target="#collapse-audit-claims" aria-expanded="false">
            <span class="api-method">GET</span>
            <span class="api-path">/api/claims</span>
            <span class="api-operation">getClaimsController</span>
          </div>
          <div class="collapse" id="collapse-audit-claims">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Mengambil log verifikasi klaim berita/hoaks warga guna keperluan audit admin.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Query Params:</span>
                  <pre>?page=1&limit=20</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "claims": [
    {
      "id": "claim-uuid",
      "claim_text": "Pemerintah bagikan bansos...",
      "is_credible": false,
      ...
    }
  ],
  "total": 5
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DELETE /api/claims/:id -->
        <div>
          <div class="api-row api-row-delete" data-bs-toggle="collapse" data-bs-target="#collapse-audit-claims-delete" aria-expanded="false">
            <span class="api-method">DELETE</span>
            <span class="api-path">/api/claims/:id</span>
            <span class="api-operation">deleteClaimController</span>
          </div>
          <div class="collapse" id="collapse-audit-claims-delete">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Menghapus logs riwayat cek fakta tertentu dari database.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Params:</span>
                  <pre>Path: id (string)</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "success": true,
  "message": "Data verifikasi klaim berhasil dihapus."
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GET /api/summaries -->
        <div>
          <div class="api-row api-row-get" data-bs-toggle="collapse" data-bs-target="#collapse-audit-summaries" aria-expanded="false">
            <span class="api-method">GET</span>
            <span class="api-path">/api/summaries</span>
            <span class="api-operation">getSummariesController</span>
          </div>
          <div class="collapse" id="collapse-audit-summaries">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Mengambil riwayat log ringkasan berkas birokrasi warga yang tersimpan di Supabase.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Query Params:</span>
                  <pre>?page=1&limit=20</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "summaries": [
    {
      "id": "summary-uuid",
      "input_text": "Salinan aturan birokrasi...",
      "summary_text": "1. Poin Ringkasan...",
      ...
    }
  ],
  "total": 3
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DELETE /api/summaries/:id -->
        <div>
          <div class="api-row api-row-delete" data-bs-toggle="collapse" data-bs-target="#collapse-audit-summaries-delete" aria-expanded="false">
            <span class="api-method">DELETE</span>
            <span class="api-path">/api/summaries/:id</span>
            <span class="api-operation">deleteSummaryController</span>
          </div>
          <div class="collapse" id="collapse-audit-summaries-delete">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Menghapus logs data ringkasan birokrasi warga tertentu.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Params:</span>
                  <pre>Path: id (string)</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "success": true,
  "message": "Data ringkasan dokumen berhasil dihapus."
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- GET /api/histories -->
        <div>
          <div class="api-row api-row-get" data-bs-toggle="collapse" data-bs-target="#collapse-audit-histories" aria-expanded="false">
            <span class="api-method">GET</span>
            <span class="api-path">/api/histories</span>
            <span class="api-operation">getChatHistoriesController</span>
          </div>
          <div class="collapse" id="collapse-audit-histories">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Mengambil semua log identitas sesi obrolan (chat history sessionId) warga untuk audit admin.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Query Params:</span>
                  <pre>?page=1&limit=20</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "histories": [
    {
      "session_id": "session-uuid",
      "created_at": "2026-06-23T12:00:00Z"
    }
  ],
  "total": 10
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- DELETE /api/histories/:sessionId -->
        <div>
          <div class="api-row api-row-delete" data-bs-toggle="collapse" data-bs-target="#collapse-audit-histories-delete" aria-expanded="false">
            <span class="api-method">DELETE</span>
            <span class="api-path">/api/histories/:sessionId</span>
            <span class="api-operation">deleteHistoryController</span>
          </div>
          <div class="collapse" id="collapse-audit-histories-delete">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Menghapus data sesi percakapan chat warga beserta seluruh pesan di dalamnya dari database.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request Params:</span>
                  <pre>Path: sessionId (string)</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "success": true,
  "message": "Riwayat chat berhasil dihapus."
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Group 5: utility-controller -->
    <div class="group-section">
      <div class="group-header">
        <h2 class="group-title">
          utility-controller <span class="group-desc">: Health & Utility Controller</span>
        </h2>
        <div class="group-actions">
          <span onclick="toggleGroup('utility')">Show/Hide</span> | 
          <span onclick="toggleGroup('utility')">List Operations</span> | 
          <span onclick="toggleGroup('utility')">Expand Operations</span>
        </div>
      </div>

      <div id="group-utility">
        <!-- GET /health -->
        <div>
          <div class="api-row api-row-get" data-bs-toggle="collapse" data-bs-target="#collapse-utility-health" aria-expanded="false">
            <span class="api-method">GET</span>
            <span class="api-path">/health</span>
            <span class="api-operation">healthCheck</span>
          </div>
          <div class="collapse" id="collapse-utility-health">
            <div class="api-details">
              <p class="mb-2"><strong>Deskripsi:</strong> Mengecek status keaktifan dan runtime server backend.</p>
              <div class="row g-2">
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Request:</span>
                  <pre>None</pre>
                </div>
                <div class="col-md-6">
                  <span class="d-block fw-bold mb-1" style="font-size: 11px;">Response (200 OK):</span>
                  <pre>{
  "status": "ok",
  "timestamp": "2026-06-23T12:00:00.000Z",
  "uptime": 120.45,
  "version": "1.0.0"
}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer info -->
    <div class="footer-info">
      [ BASE URL: / , API VERSION: 1.0 ]
    </div>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
  <script>
    function toggleGroup(groupId) {
      const el = document.getElementById('group-' + groupId);
      if (el) {
        if (el.style.display === 'none') {
          el.style.display = 'block';
        } else {
          el.style.display = 'none';
        }
      }
    }
  </script>
</body>
</html>`);
});

// --- Error Handling ---

/**
 * Global Error Handler
 * Menangani semua error yang tidak terhandle
 */
app.onError((err, c) => {
  console.error('🔥 Global error:', err);
  
  // Log error untuk debugging
  console.error('Unhandled error:', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });
  
  return c.json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Terjadi kesalahan pada server',
    timestamp: new Date().toISOString(),
  }, 500);
});

// --- Start Server ---

const port = parseInt(process.env.PORT || '3000');

console.log('=' .repeat(60));
console.log('🚀 KOMUNITAS AI API Server');
console.log('=' .repeat(60));
console.log(`📡 Server running on: http://localhost:${port}`);
console.log(`🔍 Health check: http://localhost:${port}/health`);
console.log(`📚 API documentation: http://localhost:${port}/`);
console.log('=' .repeat(60));
console.log(`✨ Environment: ${process.env.NODE_ENV || 'development'}`);
console.log(`🤖 AI Model: ${process.env.DEFAULT_MODEL || 'google/gemini-2.5-flash'}`);
console.log(`🧠 Embedding Model: ${process.env.EMBEDDING_MODEL || 'openai/text-embedding-3-small'}`);
console.log(`🔍 Search Grounding: ${process.env.SERPER_API_KEY ? 'Serper.dev Enabled' : 'Disabled (LLM Fallback)'}`);
console.log(`💾 Database: ${process.env.SUPABASE_URL ? 'Connected' : 'Disconnected'}`);
console.log('=' .repeat(60));

export default {
  port,
  hostname: '0.0.0.0',
  fetch: app.fetch,
};
