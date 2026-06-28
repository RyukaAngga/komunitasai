import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FileText, Clock, CheckCircle2,
  XCircle, RefreshCw, ChevronLeft, ChevronRight,
  MessageSquare, Filter, AlertTriangle, Search,
  Loader2, TrendingUp, Eye, ChevronDown,
  Shield, LogOut, Activity, Plus, Trash2,
  Globe, Phone, Mail, MapPin, ExternalLink,
  BookOpen, FileSpreadsheet, X, Menu
} from 'lucide-react'
import { 
  adminService, 
  CitizenReport, 
  DashboardStats, 
  PublicService, 
  ClaimVerification, 
  DocumentSummary, 
  ChatHistorySession 
} from '@/services/api'
import { authService } from '@/services/auth'
import { cn } from '@/lib/utils'
import { ReportMap } from '@/components/admin/ReportMap'

// ─── Animation presets ──────────────────────────────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  Menunggu:  { color: 'text-amber-400',  bg: 'bg-amber-950/40 border border-amber-900/30',  dot: 'bg-amber-500',  icon: Clock },
  Diproses:  { color: 'text-blue-400',   bg: 'bg-blue-950/40 border border-blue-900/30',    dot: 'bg-blue-500',   icon: Activity },
  Selesai:   { color: 'text-emerald-400',bg: 'bg-emerald-950/40 border border-emerald-900/30', dot: 'bg-emerald-500', icon: CheckCircle2 },
  Ditolak:   { color: 'text-rose-400',    bg: 'bg-rose-950/40 border border-rose-900/30',       dot: 'bg-rose-500',    icon: XCircle },
} as const

const CATEGORY_LABELS: Record<string, string> = {
  darurat:    'Darurat',
  layanan:    'Layanan Publik',
  hoaks:      'Hoaks/Misinformasi',
  infrastruktur: 'Infrastruktur',
  sosial:     'Sosial',
  lainnya:    'Lainnya',
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, colorClass }: {
  icon: React.ElementType; label: string; value: number | string; sub?: string; colorClass: string
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 p-5 hover:border-zinc-700 transition duration-200"
    >
      <div className="flex items-start justify-between">
        <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800', colorClass)}>
          <Icon className="h-4.5 w-4.5" />
        </div>
        <TrendingUp className="h-4 w-4 text-zinc-500" />
      </div>
      <div className="mt-4">
        <div className="text-2xl font-bold tracking-tight text-zinc-100">{value}</div>
        <div className="mt-0.5 text-xs font-semibold text-zinc-400 uppercase tracking-wider text-[9px]">{label}</div>
        {sub && <div className="mt-1 text-[10px] text-zinc-500 font-normal leading-normal">{sub}</div>}
      </div>
    </motion.div>
  )
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: keyof typeof STATUS_CONFIG }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.Menunggu
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase', cfg.bg, cfg.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {status}
    </span>
  )
}

// ─── Status Dropdown ─────────────────────────────────────────────────────────
function StatusDropdown({ current, reportId, onUpdate }: {
  current: string; reportId: string; onUpdate: (id: string, status: string) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const statuses = ['Menunggu', 'Diproses', 'Selesai', 'Ditolak'] as const

  const handleSelect = async (status: string) => {
    setOpen(false)
    if (status === current) return
    setLoading(true)
    await onUpdate(reportId, status)
    setLoading(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        disabled={loading}
        className="flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-[10px] font-semibold text-zinc-300 hover:bg-zinc-900 hover:text-zinc-100 transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin text-zinc-400" /> : <ChevronDown className="h-3 w-3 text-zinc-400" />}
        Status
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{ duration: 0.1 }}
            className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded border border-zinc-800 bg-zinc-900 shadow-xl"
          >
            {statuses.map(s => {
              const cfg = STATUS_CONFIG[s]
              return (
                <button
                  key={s}
                  onClick={() => handleSelect(s)}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-[11px] font-semibold transition hover:bg-zinc-800',
                    s === current ? cfg.color : 'text-zinc-300'
                  )}
                >
                  <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
                  {s}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Report Detail Modal ──────────────────────────────────────────────────────
function ReportDetailModal({ report, onClose, onUpdate }: {
  report: CitizenReport; onClose: () => void; onUpdate: (id: string, status: string, note?: string) => Promise<void>
}) {
  const [adminNote, setAdminNote] = useState(report.admin_note || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async (status: string) => {
    setSaving(true)
    await onUpdate(report.id, status, adminNote)
    setSaving(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-lg overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl text-zinc-100"
      >
        {/* Header */}
        <div className="border-b border-zinc-800 bg-zinc-950/50 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-zinc-100">{report.reporter_name}</h3>
              <p className="mt-0.5 text-xs text-zinc-400">{report.reporter_contact}</p>
            </div>
            <StatusBadge status={report.status as keyof typeof STATUS_CONFIG} />
          </div>
        </div>

        {/* Body */}
        <div className="space-y-4 p-5 text-xs">
          <div>
            <div className="mb-1 font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Kategori</div>
            <div className="text-zinc-300">{CATEGORY_LABELS[report.category] || report.category}</div>
          </div>
          <div>
            <div className="mb-1 font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Deskripsi Laporan</div>
            <div className="rounded border border-zinc-800 bg-zinc-950 p-3.5 leading-relaxed text-zinc-300 whitespace-pre-wrap">
              {report.description.replace(/^\[\uD83D\uDCCD LOKASI GPS KOORDINAT:[^\]]+\]\s*/, '')}
            </div>
          </div>

          {/* Dedicated GPS coordinates display section */}
          {(() => {
            let lat = report.latitude;
            let lng = report.longitude;
            
            // Fallback for old coordinate formatting embedded in description
            if (lat === undefined || lat === null || lng === undefined || lng === null) {
              const match = report.description.match(/\[\uD83D\uDCCD LOKASI GPS KOORDINAT:\s*(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)\]/);
              if (match) {
                lat = parseFloat(match[1]);
                lng = parseFloat(match[2]);
              }
            }

            if (lat !== undefined && lat !== null && lng !== undefined && lng !== null) {
              return (
                <div>
                  <div className="mb-1 font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Lokasi Koordinat GPS</div>
                  <div className="flex items-center justify-between rounded border border-zinc-800 bg-zinc-950 p-3 text-zinc-300">
                    <span className="flex items-center gap-1.5 font-mono text-xs">
                      <MapPin className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                      {lat.toFixed(6)}, {lng.toFixed(6)}
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded bg-rose-950/40 border border-rose-900/60 px-2.5 py-1 text-[10px] text-rose-400 hover:bg-rose-900/40 transition-all font-medium"
                    >
                      Buka di Google Maps
                    </a>
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Photo attachment preview if exists */}
          {report.image_url && (
            <div>
              <div className="mb-1 font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Foto Lampiran Kejadian</div>
              <div className="rounded border border-zinc-800 bg-zinc-950 p-1.5 flex justify-center overflow-hidden max-h-[220px]">
                <img
                  src={report.image_url}
                  alt="Lampiran Kejadian"
                  className="object-contain max-h-[200px] w-full rounded"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1 font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Sesi ID</div>
              <div className="text-zinc-400 font-mono select-all truncate">{report.session_id || '-'}</div>
            </div>
            <div>
              <div className="mb-1 font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Tanggal Masuk</div>
              <div className="text-zinc-400">
                {new Date(report.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
              </div>
            </div>
          </div>
          <div>
            <div className="mb-2 font-semibold uppercase tracking-wider text-[10px] text-zinc-500">Catatan Penanganan Admin</div>
            <textarea
              rows={3}
              value={adminNote}
              onChange={e => setAdminNote(e.target.value)}
              placeholder="Tambahkan instruksi tindakan lapangan atau catatan progres..."
              className="w-full resize-none rounded border border-zinc-800 bg-zinc-950 px-3 py-2 text-zinc-200 placeholder-zinc-500 outline-none transition focus:border-zinc-700"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 border-t border-zinc-800 p-5 bg-zinc-950/50">
          {(['Diproses', 'Selesai', 'Ditolak'] as const).map(s => {
            const c = STATUS_CONFIG[s]
            return (
              <button
                key={s}
                onClick={() => handleSave(s)}
                disabled={saving}
                className={cn(
                  'flex flex-1 items-center justify-center gap-1.5 rounded border py-2 text-xs font-semibold transition active:scale-[0.98] disabled:opacity-50',
                  c.bg, c.color, 'hover:brightness-110'
                )}
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                {s}
              </button>
            )
          })}
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Service Detail Modal ──────────────────────────────────────────────────
function ServiceDetailModal({ service, onClose }: { service: PublicService; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl p-6 scrollbar-thin text-zinc-100"
      >
        {/* Header */}
        <div className="border-b border-zinc-800 pb-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
            {service.institution}
          </span>
          <h3 className="text-base font-bold text-zinc-100 mt-1">{service.name}</h3>
          <span className="mt-2 inline-block rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-400">
            {CATEGORY_LABELS[service.category] || service.category}
          </span>
        </div>

        {/* Body */}
        <div className="space-y-4 py-4 text-xs text-zinc-400">
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500 mb-1">Deskripsi Layanan</h4>
            <p className="leading-relaxed bg-zinc-950 border border-zinc-800 p-3 rounded-lg whitespace-pre-line text-zinc-300">
              {service.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500 mb-2">Persyaratan Dokumen</h4>
              {service.requirements.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">Tidak ada persyaratan khusus.</p>
              ) : (
                <ul className="space-y-1.5">
                  {service.requirements.map((req, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-zinc-400">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                      {req}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <h4 className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500 mb-2">Alur Prosedur Pengajuan</h4>
              {service.procedures.length === 0 ? (
                <p className="text-xs text-zinc-500 italic">Tidak ada alur khusus.</p>
              ) : (
                <ol className="space-y-2">
                  {service.procedures.map((proc, idx) => (
                    <li key={idx} className="flex gap-2 text-zinc-400">
                      <span className="flex h-4 w-4 items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 text-[9px] font-bold text-zinc-400 flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="mt-0.5">{proc}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Contact Details */}
          {(service.contactPhone || service.contactEmail || service.address || service.website) && (
            <div className="border-t border-zinc-800 pt-4">
              <h4 className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500 mb-3">Informasi Kontak & Lokasi</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-400">
                {service.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{service.contactPhone}</span>
                  </div>
                )}
                {service.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-zinc-500" />
                    <span>{service.contactEmail}</span>
                  </div>
                )}
                {service.address && (
                  <div className="flex items-start gap-2 sm:col-span-2">
                    <MapPin className="h-3.5 w-3.5 text-zinc-500 mt-0.5 flex-shrink-0" />
                    <span>{service.address}</span>
                  </div>
                )}
                {service.website && (
                  <div className="flex items-center gap-2 sm:col-span-2">
                    <Globe className="h-3.5 w-3.5 text-zinc-500" />
                    <a
                      href={service.website.startsWith('http') ? service.website : `https://${service.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline flex items-center gap-1"
                    >
                      {service.website}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 pt-4 flex justify-end">
          <button
            onClick={onClose}
            className="rounded border border-zinc-800 bg-zinc-950 px-4 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-zinc-900"
          >
            Tutup
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Summary Detail Modal ──────────────────────────────────────────────────
function SummaryDetailModal({ summary, onClose }: { summary: DocumentSummary; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl p-6 scrollbar-thin text-zinc-100 flex flex-col"
      >
        {/* Header */}
        <div className="border-b border-zinc-800 pb-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Detail Ringkasan Dokumen
            </span>
            <h3 className="text-sm font-bold text-zinc-200 mt-1 truncate max-w-lg font-mono" title={summary.original_hash}>
              Hash: {summary.original_hash}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 transition"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 py-4 text-xs text-zinc-400 overflow-y-auto flex-1 pr-1">
          <div>
            <h4 className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500 mb-2">Isi Ringkasan Dokumen</h4>
            <div className="leading-relaxed bg-zinc-950 border border-zinc-800 p-4 rounded-lg text-zinc-300 space-y-3">
              {renderFormattedContent(summary.summary)}
            </div>
          </div>

          <div>
            <h4 className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500 mb-2">Teks Asli (Original Text)</h4>
            <p className="leading-relaxed bg-zinc-950 border border-zinc-800 p-4 rounded-lg text-zinc-400 font-mono text-[11px] whitespace-pre-wrap max-h-48 overflow-y-auto">
              {summary.original_text}
            </p>
          </div>

          <div>
            <h4 className="font-semibold uppercase tracking-wider text-[10px] text-zinc-500 mb-2">Key Points & Metadata</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg">
                <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block mb-2">Key Points</span>
                {summary.key_points && summary.key_points.length > 0 ? (
                  <ul className="space-y-2">
                    {summary.key_points.map((pt, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[11.5px] text-zinc-300 leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-600 flex-shrink-0" />
                        <span>{parseMarkdownText(pt)}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-zinc-500 italic text-[11px]">Tidak ada key points.</span>
                )}
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-3 rounded-lg flex flex-col gap-4">
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">Tanggal Cache</span>
                  <span className="text-[11.5px] text-zinc-300 font-mono">
                    {new Date(summary.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">ID Data</span>
                  <span className="text-[10px] text-zinc-500 font-mono select-all break-all">{summary.id}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider font-bold block mb-1">Hash Dokumen</span>
                  <span className="text-[10px] text-zinc-500 font-mono select-all break-all">{summary.original_hash}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Claim Detail Modal ───────────────────────────────────────────────────────
function ClaimDetailModal({ claim, onClose }: { claim: ClaimVerification; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800">
              <Shield className="h-3.5 w-3.5 text-zinc-400" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block">Detail Verifikasi Klaim</span>
              <span className={cn(
                'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider mt-0.5',
                claim.is_credible
                  ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                  : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
              )}>
                {claim.is_credible ? 'KREDIBEL' : 'HOAKS / TIDAK KREDIBEL'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-6 w-6 items-center justify-center rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 transition"
          >
            <X className="h-3 w-3" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs text-zinc-400">
          {/* Claim Text */}
          <div>
            <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">Teks Klaim</span>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-zinc-100 font-medium text-[12.5px] leading-relaxed">
              {claim.claim_text}
            </div>
          </div>

          {/* Score + Category row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Confidence Score</span>
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold text-zinc-100 leading-none">{claim.confidence_score}</span>
                <span className="text-zinc-400 text-[11px] mb-0.5">/ 100</span>
              </div>
              <div className="mt-2 h-1 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', claim.is_credible ? 'bg-emerald-500' : 'bg-rose-500')}
                  style={{ width: `${claim.confidence_score}%` }}
                />
              </div>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3">
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Kategori</span>
              <span className="text-zinc-200 text-[12px] font-semibold">{claim.category || 'Umum'}</span>
              <div className="mt-2">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-1">Dicari</span>
                <span className="text-zinc-200 text-[12px] font-semibold font-mono">{claim.search_count ?? 0}x</span>
              </div>
            </div>
          </div>

          {/* Reasoning */}
          {claim.reasoning && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">Penjelasan / Reasoning</span>
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 text-zinc-300 text-[12px] leading-relaxed whitespace-pre-wrap">
                {claim.reasoning}
              </div>
            </div>
          )}

          {/* Sources */}
          {claim.sources && claim.sources.length > 0 && (
            <div>
              <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 block mb-2">Sumber Referensi</span>
              <div className="space-y-1.5">
                {claim.sources.map((src, i) => (
                  <a
                    key={i}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg bg-zinc-950 border border-zinc-800 px-3 py-2 text-indigo-400 hover:text-indigo-300 hover:border-indigo-900/50 transition text-[11px] font-medium truncate"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{src}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Meta */}
          <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3 text-[10px] text-zinc-600 font-mono">
            <span>{new Date(claim.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</span>
            <span className="truncate ml-4 select-all">{claim.id}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Add Service Modal ──────────────────────────────────────────────────────
function AddServiceModal({ onClose, onAdd }: { onClose: () => void; onAdd: (payload: any) => Promise<void> }) {
  const [formData, setFormData] = useState({
    name: '',
    institution: '',
    category: 'layanan',
    description: '',
    requirementsText: '',
    proceduresText: '',
    contactPhone: '',
    contactEmail: '',
    address: '',
    website: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim() || !formData.institution.trim() || !formData.description.trim()) {
      setError('Nama layanan, lembaga, dan deskripsi wajib diisi.')
      return
    }

    setLoading(true)
    try {
      const requirements = formData.requirementsText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)

      const procedures = formData.proceduresText
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)

      const payload = {
        name: formData.name.trim(),
        institution: formData.institution.trim(),
        category: formData.category,
        description: formData.description.trim(),
        requirements,
        procedures,
        contactPhone: formData.contactPhone.trim() || undefined,
        contactEmail: formData.contactEmail.trim() || undefined,
        address: formData.address.trim() || undefined,
        website: formData.website.trim() || undefined,
      }

      await onAdd(payload)
      onClose()
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan layanan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl p-6 scrollbar-thin text-left text-xs text-zinc-300"
      >
        <div className="border-b border-zinc-800 pb-3 mb-4">
          <h3 className="text-sm font-bold text-zinc-100">Tambah Layanan RAG Baru</h3>
          <p className="text-zinc-500 mt-0.5 text-[11px]">
            Data akan secara otomatis diproses semantiknya untuk menghasilkan embedding vektor di backend.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded border border-red-900/50 bg-red-955/50 p-3 text-red-400 font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-500 mb-1">Nama Layanan *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={e => setFormData(v => ({ ...v, name: e.target.value }))}
                placeholder="Contoh: Pembuatan KTP Baru"
                className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-3 text-zinc-200 outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Lembaga / Instansi *</label>
              <input
                type="text"
                required
                value={formData.institution}
                onChange={e => setFormData(v => ({ ...v, institution: e.target.value }))}
                placeholder="Contoh: Disdukcapil Kota"
                className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-3 text-zinc-200 outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-500 mb-1">Kategori *</label>
              <select
                value={formData.category}
                onChange={e => setFormData(v => ({ ...v, category: e.target.value }))}
                className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-2 text-zinc-300 outline-none focus:border-zinc-700"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k} className="bg-zinc-900 text-zinc-200">{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Website</label>
              <input
                type="text"
                value={formData.website}
                onChange={e => setFormData(v => ({ ...v, website: e.target.value }))}
                placeholder="Contoh: www.instansi.go.id"
                className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-3 text-zinc-200 outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-500 mb-1">Deskripsi Layanan *</label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={e => setFormData(v => ({ ...v, description: e.target.value }))}
              placeholder="Berikan penjelasan singkat mengenai fungsi dan detail layanan..."
              className="w-full resize-none rounded border border-zinc-800 bg-zinc-950 p-3 text-zinc-200 outline-none focus:border-zinc-700"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-500 mb-1">Persyaratan Dokumen (Satu per baris)</label>
              <textarea
                rows={4}
                value={formData.requirementsText}
                onChange={e => setFormData(v => ({ ...v, requirementsText: e.target.value }))}
                placeholder="Contoh:&#10;Kartu Keluarga Asli&#10;KTP Lama"
                className="w-full resize-none rounded border border-zinc-800 bg-zinc-950 p-3 text-zinc-200 outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Alur Prosedur (Satu per baris)</label>
              <textarea
                rows={4}
                value={formData.proceduresText}
                onChange={e => setFormData(v => ({ ...v, proceduresText: e.target.value }))}
                placeholder="Contoh:&#10;Isi Formulir&#10;Verifikasi di Loket"
                className="w-full resize-none rounded border border-zinc-800 bg-zinc-950 p-3 text-zinc-200 outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-500 mb-1">No Telepon</label>
              <input
                type="text"
                value={formData.contactPhone}
                onChange={e => setFormData(v => ({ ...v, contactPhone: e.target.value }))}
                placeholder="Contoh: 021-12345"
                className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-3 text-zinc-200 outline-none focus:border-zinc-700"
              />
            </div>
            <div>
              <label className="block text-zinc-500 mb-1">Email Kontak</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData(v => ({ ...v, contactEmail: e.target.value }))}
                placeholder="Contoh: info@instansi.go.id"
                className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-3 text-zinc-200 outline-none focus:border-zinc-700"
              />
            </div>
          </div>

          <div>
            <label className="block text-zinc-500 mb-1">Alamat Kantor Fungsional</label>
            <input
              type="text"
              value={formData.address}
              onChange={e => setFormData(v => ({ ...v, address: e.target.value }))}
              placeholder="Contoh: Jl. Merdeka No. 12, Kelurahan C"
              className="w-full h-9 rounded border border-zinc-800 bg-zinc-950 px-3 text-zinc-200 outline-none focus:border-zinc-700"
            />
          </div>

          <div className="border-t border-zinc-800 pt-4 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="h-9 rounded border border-zinc-800 bg-zinc-900 px-4 text-zinc-300 hover:bg-zinc-850 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-9 rounded bg-zinc-100 px-5 font-semibold text-zinc-950 shadow hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 transition"
            >
              {loading ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                  Memproses Vektor RAG...
                </>
              ) : (
                'Simpan & Embed'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Chat Transcript Modal ──────────────────────────────────────────────────
function ChatTranscriptModal({ session, onClose }: { session: ChatHistorySession; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col rounded-lg border border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden text-zinc-100"
      >
        <div className="border-b border-zinc-800 p-5 flex justify-between items-center bg-zinc-950/50">
          <div>
            <h3 className="text-sm font-bold text-zinc-100">Transkrip Sesi Chat</h3>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-mono">ID: {session.session_id}</p>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-950/40 text-xs scrollbar-thin">
          {session.messages.length === 0 ? (
            <p className="text-zinc-500 italic text-center py-8">Tidak ada riwayat pesan dalam sesi chat ini.</p>
          ) : (
            session.messages.map((m: any, idx: number) => {
              const isUser = m.role === 'user'
              let textContent = ''
              if (typeof m.content === 'string') {
                textContent = m.content
              } else if (Array.isArray(m.content)) {
                textContent = m.content.map((item: any) => item.text || '').join('\n')
              } else {
                textContent = JSON.stringify(m.content)
              }
              
              return (
                <div 
                  key={idx} 
                  className={cn(
                    "flex flex-col max-w-[85%] rounded-lg p-3.5 leading-relaxed border",
                    isUser 
                      ? "ml-auto bg-zinc-800 text-zinc-100 border-zinc-700 rounded-tr-none" 
                      : "mr-auto bg-zinc-900 text-zinc-200 border-zinc-800 rounded-tl-none"
                  )}
                >
                  <span className={cn("text-[9px] font-bold uppercase tracking-wider block mb-1", isUser ? "text-blue-400" : "text-emerald-400")}>
                    {isUser ? 'Warga / Pelapor' : 'Asisten AI'}
                  </span>
                  <div className="space-y-1">
                    {renderFormattedContent(textContent)}
                  </div>
                </div>
              )
            })
          )}
        </div>
        <div className="border-t border-zinc-800 p-4 flex justify-end bg-zinc-950/50">
          <button onClick={onClose} className="rounded border border-zinc-800 bg-zinc-950 px-5 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-900 transition active:scale-95">
            Tutup Transkrip
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ─── Inline Markdown & Formatting Parser for Summary Details ───────────────────
const parseLinks = (text: string) => {
  const parts = text.split(/(\[.*?\]\(.*?\))/g)
  return parts.map((part, i) => {
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/)
    if (linkMatch) {
      const linkText = linkMatch[1]
      const url = linkMatch[2]
      return (
        <a
          key={i}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-zinc-100 hover:text-white underline underline-offset-4 decoration-zinc-700 hover:decoration-zinc-400 font-medium transition-colors"
        >
          {linkText}
        </a>
      )
    }
    return part
  })
}

const parseItalics = (text: string) => {
  // Split only on single * not preceded or followed by another *
  const parts = text.split(/((?<!\*)\*(?!\*)[^*]+(?<!\*)\*(?!\*))/g)
  return parts.flatMap((part, i): any => {
    if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**') && part.length > 2) {
      return [
        <em key={i} className="italic text-zinc-350">
          {parseLinks(part.slice(1, -1))}
        </em>
      ]
    }
    return parseLinks(part)
  })
}

// Strip markdown symbols for plain-text previews in table cells
const stripMarkdown = (text: string): string => {
  if (!text) return ''
  return text
    .replace(/^\s*-->\s*/gm, '')        // Remove --> arrows
    .replace(/^\s*-{2,}>\s*/gm, '')     // Remove --> variants
    .replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1') // Remove **bold** and *italic*
    .replace(/^#{1,6}\s+/gm, '')        // Remove ## headers
    .replace(/^[-*+]\s+/gm, '')         // Remove bullet points
    .replace(/^\d+\.\s+/gm, '')         // Remove numbered lists
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove [text](url) links
    .replace(/\n+/g, ' ')               // Flatten newlines
    .trim()
}

const parseMarkdownText = (text: string) => {
  // Split on **bold** markers — simple approach without lookbehind
  const parts = text.split(/\*\*([^*]+)\*\*/g)
  return parts.flatMap((part, i): any => {
    // Odd-indexed parts are the bold content (inside **...** pairs)
    if (i % 2 === 1) {
      return [
        <strong key={`b-${i}`} className="font-semibold text-zinc-100">
          {parseItalics(part)}
        </strong>
      ]
    }
    return parseItalics(part)
  })
}

const renderFormattedContent = (text: string) => {
  if (!text) return null
  // Pre-process: strip noise lines and markdown arrows
  const cleaned = text
    .replace(/^\s*-->\s*/gm, '')       // Remove --> arrows at line starts
    .replace(/^\s*-{2,}>\s*/gm, '')    // Remove --> variants
  
  // Filter out code block contents (mermaid, graph TD, etc.)
  let inCodeBlock = false
  const filteredLines: string[] = []
  for (const line of cleaned.split('\n')) {
    if (line.trim().startsWith('```')) {
      inCodeBlock = !inCodeBlock
      continue  // skip ``` delimiters
    }
    if (inCodeBlock) continue  // skip everything inside code blocks
    // Skip common noise patterns
    const t = line.trim()
    if (
      t.startsWith('graph TD') ||
      t.startsWith('graph LR') ||
      t.startsWith('graph RL') ||
      t.startsWith('mermaid') ||
      t.startsWith('sequenceDiagram') ||
      t.startsWith('flowchart') ||
      /^[A-Z]+\s*-->/.test(t) ||           // mermaid node connections like A --> B
      /^[A-Z]+\[.*\]/.test(t)              // mermaid node definitions like A[label]
    ) continue
    filteredLines.push(line)
  }

  const lines = filteredLines
  const elements: React.ReactNode[] = []
  let inList = false
  let listItems: React.ReactNode[] = []

  lines.forEach((line, idx) => {
    const trimmed = line.trim()

    // Skip empty lines, but close list if open
    if (!trimmed) {
      if (inList) {
        elements.push(
          <ul key={`ul-${idx}`} className="list-disc pl-5 space-y-1 mb-4 text-zinc-300">
            {listItems}
          </ul>
        )
        inList = false
        listItems = []
      }
      elements.push(<div key={`empty-${idx}`} className="h-3" />)
      return
    }

    // Check list item (unordered list)
    const bulletMatch = line.match(/^(\s*)([*+-])\s+(.*)/)
    if (bulletMatch) {
      inList = true
      listItems.push(
        <li key={`li-${idx}`} className="text-zinc-300 text-[12px] leading-relaxed">
          {parseMarkdownText(bulletMatch[3])}
        </li>
      )
      return
    }

    // If it was in a list but current line is not a bullet item, close the list
    if (inList) {
      elements.push(
        <ul key={`ul-end-${idx}`} className="list-disc pl-5 space-y-1 mb-4 text-zinc-300">
          {listItems}
        </ul>
      )
      inList = false
      listItems = []
    }

    // Check ordered list item
    const numberMatch = line.match(/^(\s*)(\d+)\.\s+(.*)/)
    if (numberMatch) {
      elements.push(
        <div key={`ol-${idx}`} className="text-[12px] text-zinc-300 leading-relaxed mb-3 flex items-start gap-2">
          <span className="text-zinc-500 font-mono text-[11px] mt-0.5 min-w-[14px] text-right">{numberMatch[2]}.</span>
          <span className="flex-grow">{parseMarkdownText(numberMatch[3])}</span>
        </div>
      )
      return
    }

    // Headers
    if (trimmed.startsWith('#')) {
      const headerLevel = (trimmed.match(/^#+/) || ['#'])[0].length
      const cleanHeader = trimmed.replace(/^#+\s*/, '')
      const headerClass = headerLevel === 1 
        ? "text-[14px] font-bold text-zinc-100 mt-4 mb-2 tracking-tight" 
        : headerLevel === 2
        ? "text-[13px] font-bold text-zinc-100 mt-3.5 mb-1.5 tracking-tight"
        : "text-[12px] font-semibold text-zinc-200 mt-3 mb-1.5"
      elements.push(
        <div key={`h-${idx}`} className={headerClass}>
          {parseMarkdownText(cleanHeader)}
        </div>
      )
      return
    }

    // Paragraph
    elements.push(
      <p key={`p-${idx}`} className="text-[12.5px] text-zinc-300 leading-relaxed mb-3 font-normal font-sans">
        {parseMarkdownText(trimmed)}
      </p>
    )
  })

  // Close any trailing list
  if (inList && listItems.length > 0) {
    elements.push(
      <ul key="ul-trailing" className="list-disc pl-5 space-y-1 mb-4 text-zinc-300">
        {listItems}
      </ul>
    )
  }

  return elements
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function AdminDashboard() {
  const navigate = useNavigate()
  
  // ─── Active Tab ───────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'live_map' | 'services' | 'claims' | 'summaries' | 'histories'>('overview')

  // ─── Mobile Sidebar State ─────────────────────────────────────────────────
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // ─── Overview States ──────────────────────────────────────────────────────
  const [stats, setStats] = useState<DashboardStats | null>(null)

  // ─── Reports States ───────────────────────────────────────────────────────
  const [reports, setReports] = useState<CitizenReport[]>([])
  const [mapReports, setMapReports] = useState<CitizenReport[]>([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedReport, setSelectedReport] = useState<CitizenReport | null>(null)
  
  // ─── Services States ──────────────────────────────────────────────────────
  const [services, setServices] = useState<PublicService[]>([])
  const [serviceSearch, setServiceSearch] = useState('')
  const [serviceFilterCategory, setServiceFilterCategory] = useState('all')
  const [isAddServiceOpen, setIsAddServiceOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<PublicService | null>(null)

  // ─── Claims States ───────────────────────────────────────────────────────
  const [claims, setClaims] = useState<ClaimVerification[]>([])
  const [claimsTotal, setClaimsTotal] = useState(0)
  const [claimsTotalPages, setClaimsTotalPages] = useState(1)
  const [claimsPage, setClaimsPage] = useState(1)
  const [claimsSearch, setClaimsSearch] = useState('')
  const [selectedClaim, setSelectedClaim] = useState<ClaimVerification | null>(null)

  // ─── Summaries States ────────────────────────────────────────────────────
  const [summaries, setSummaries] = useState<DocumentSummary[]>([])
  const [summariesTotal, setSummariesTotal] = useState(0)
  const [summariesTotalPages, setSummariesTotalPages] = useState(1)
  const [summariesPage, setSummariesPage] = useState(1)
  const [summariesSearch, setSummariesSearch] = useState('')
  const [selectedSummary, setSelectedSummary] = useState<DocumentSummary | null>(null)

  // ─── Chat Histories States ───────────────────────────────────────────────
  const [histories, setHistories] = useState<ChatHistorySession[]>([])
  const [historiesTotal, setHistoriesTotal] = useState(0)
  const [historiesTotalPages, setHistoriesTotalPages] = useState(1)
  const [historiesPage, setHistoriesPage] = useState(1)
  const [historiesSearch, setHistoriesSearch] = useState('')
  const [selectedHistory, setSelectedHistory] = useState<ChatHistorySession | null>(null)

  // ─── Global States ────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const loadStats = useCallback(async () => {
    try {
      const data = await adminService.getDashboardStats()
      setStats(data)
    } catch {
      // Stats remain null
    }
  }, [])

  const loadReports = useCallback(async (p = page, status = filterStatus) => {
    try {
      const data = await adminService.getReports(status === 'all' ? undefined : status, p, 10)
      setReports(data.reports)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load reports:', err)
    }
  }, [page, filterStatus])

  const loadMapReports = useCallback(async (status = filterStatus) => {
    try {
      const data = await adminService.getReports(status === 'all' ? undefined : status, 1, 200)
      setMapReports(data.reports)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load map reports:', err)
    }
  }, [filterStatus])

  const loadServices = useCallback(async (category = serviceFilterCategory) => {
    try {
      const data = await adminService.getServices(category)
      setServices(data.services)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load services:', err)
    }
  }, [serviceFilterCategory])

  const loadClaims = useCallback(async (p = claimsPage) => {
    try {
      const data = await adminService.getClaims(p, 10)
      setClaims(data.claims)
      setClaimsTotal(data.total)
      setClaimsTotalPages(data.totalPages)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load claims:', err)
    }
  }, [claimsPage])

  const loadSummaries = useCallback(async (p = summariesPage) => {
    try {
      const data = await adminService.getSummaries(p, 10)
      setSummaries(data.summaries)
      setSummariesTotal(data.total)
      setSummariesTotalPages(data.totalPages)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load summaries:', err)
    }
  }, [summariesPage])

  const loadHistories = useCallback(async (p = historiesPage) => {
    try {
      const data = await adminService.getChatHistories(p, 10)
      setHistories(data.histories)
      setHistoriesTotal(data.total)
      setHistoriesTotalPages(data.totalPages)
      setLastUpdated(new Date())
    } catch (err) {
      console.error('Failed to load histories:', err)
    }
  }, [historiesPage])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    if (activeTab === 'overview') {
      await loadStats()
    } else if (activeTab === 'reports') {
      await Promise.all([loadStats(), loadReports(page, filterStatus)])
    } else if (activeTab === 'live_map') {
      await Promise.all([loadStats(), loadMapReports(filterStatus)])
    } else if (activeTab === 'services') {
      await loadServices(serviceFilterCategory)
    } else if (activeTab === 'claims') {
      await loadClaims(claimsPage)
    } else if (activeTab === 'summaries') {
      await loadSummaries(summariesPage)
    } else if (activeTab === 'histories') {
      await loadHistories(historiesPage)
    }
    setRefreshing(false)
  }, [
    loadStats, loadReports, page, filterStatus, activeTab, 
    loadServices, serviceFilterCategory, loadClaims, claimsPage, 
    loadSummaries, summariesPage, loadHistories, historiesPage,
    loadMapReports
  ])

  useEffect(() => {
    setLoading(true)
    if (activeTab === 'overview') {
      loadStats().finally(() => setLoading(false))
    } else if (activeTab === 'reports') {
      Promise.all([loadStats(), loadReports(1, filterStatus)]).finally(() => setLoading(false))
    } else if (activeTab === 'live_map') {
      Promise.all([loadStats(), loadMapReports(filterStatus)]).finally(() => setLoading(false))
    } else if (activeTab === 'services') {
      loadServices(serviceFilterCategory).finally(() => setLoading(false))
    } else if (activeTab === 'claims') {
      loadClaims(1).finally(() => setLoading(false))
    } else if (activeTab === 'summaries') {
      loadSummaries(1).finally(() => setLoading(false))
    } else if (activeTab === 'histories') {
      loadHistories(1).finally(() => setLoading(false))
    }
  }, [activeTab, filterStatus, serviceFilterCategory, loadMapReports])

  useEffect(() => {
    if (!loading) {
      if (activeTab === 'reports') {
        loadReports(page, filterStatus)
      } else if (activeTab === 'claims') {
        loadClaims(claimsPage)
      } else if (activeTab === 'summaries') {
        loadSummaries(summariesPage)
      } else if (activeTab === 'histories') {
        loadHistories(historiesPage)
      }
    }
  }, [page, claimsPage, summariesPage, historiesPage])

  const handleStatusUpdate = async (id: string, status: string, adminNote?: string) => {
    try {
      await adminService.updateReportStatus(id, status, adminNote)
      setReports(prev => prev.map(r => r.id === id ? { ...r, status: status as any, admin_note: adminNote ?? r.admin_note } : r))
      setMapReports(prev => prev.map(r => r.id === id ? { ...r, status: status as any, admin_note: adminNote ?? r.admin_note } : r))
      await loadStats()
    } catch (err) {
      console.error('Failed to update status:', err)
    }
  }

  const handleDeleteService = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus layanan RAG ini? Data representasi vektor akan terhapus secara permanen.')) {
      return
    }
    try {
      await adminService.deleteService(id)
      setServices(prev => prev.filter(s => s.id !== id))
    } catch (err: any) {
      alert('Gagal menghapus layanan: ' + err.message)
    }
  }

  const handleDeleteClaim = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data verifikasi klaim ini?')) return
    try {
      await adminService.deleteClaim(id)
      setClaims(prev => prev.filter(c => c.id !== id))
      setClaimsTotal(t => t - 1)
    } catch (err: any) {
      alert('Gagal menghapus klaim: ' + err.message)
    }
  }

  const handleDeleteSummary = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus ringkasan dokumen ini?')) return
    try {
      await adminService.deleteSummary(id)
      setSummaries(prev => prev.filter(s => s.id !== id))
      setSummariesTotal(t => t - 1)
    } catch (err: any) {
      alert('Gagal menghapus ringkasan: ' + err.message)
    }
  }

  const handleDeleteHistory = async (sessionId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus sesi riwayat chat warga ini?')) return
    try {
      await adminService.deleteChatHistory(sessionId)
      setHistories(prev => prev.filter(h => h.session_id !== sessionId))
      setHistoriesTotal(t => t - 1)
    } catch (err: any) {
      alert('Gagal menghapus riwayat chat: ' + err.message)
    }
  }

  // Filter local lists dynamically by search inputs
  const filteredReports = search.trim()
    ? reports.filter(r =>
        r.reporter_name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase())
      )
    : reports

  const filteredMapReports = search.trim()
    ? mapReports.filter(r =>
        r.reporter_name.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase()) ||
        r.category.toLowerCase().includes(search.toLowerCase())
      )
    : mapReports

  const filteredServices = serviceSearch.trim()
    ? services.filter(s =>
        s.name.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.institution.toLowerCase().includes(serviceSearch.toLowerCase()) ||
        s.description.toLowerCase().includes(serviceSearch.toLowerCase())
      )
    : services

  const filteredClaims = claimsSearch.trim()
    ? claims.filter(c =>
        c.claim_text.toLowerCase().includes(claimsSearch.toLowerCase()) ||
        c.reasoning.toLowerCase().includes(claimsSearch.toLowerCase()) ||
        c.category.toLowerCase().includes(claimsSearch.toLowerCase())
      )
    : claims

  const filteredSummaries = summariesSearch.trim()
    ? summaries.filter(s =>
        s.original_hash.toLowerCase().includes(summariesSearch.toLowerCase()) ||
        s.original_text.toLowerCase().includes(summariesSearch.toLowerCase()) ||
        s.summary.toLowerCase().includes(summariesSearch.toLowerCase())
      )
    : summaries

  const filteredHistories = historiesSearch.trim()
    ? histories.filter(h =>
        h.session_id.toLowerCase().includes(historiesSearch.toLowerCase())
      )
    : histories

  const statCards = stats ? [
    { icon: FileText,     label: 'Total Laporan',    value: stats.totalReports,                colorClass: 'text-purple-400', sub: 'Semua laporan masuk' },
    { icon: Clock,        label: 'Menunggu',          value: stats.statusCounts.Menunggu,        colorClass: 'text-amber-400',  sub: 'Belum ditindaklanjuti' },
    { icon: Activity,     label: 'Sedang Diproses',   value: stats.statusCounts.Diproses,        colorClass: 'text-blue-400',   sub: 'Dalam penanganan' },
    { icon: CheckCircle2, label: 'Terselesaikan',     value: stats.statusCounts.Selesai,         colorClass: 'text-emerald-400',sub: 'Laporan selesai' },
    { icon: MessageSquare,label: 'Sesi Chat Aktif',  value: stats.totalSessions,                colorClass: 'text-sky-400',    sub: 'Total percakapan AI' },
    { icon: XCircle,      label: 'Ditolak',           value: stats.statusCounts.Ditolak,         colorClass: 'text-rose-400',    sub: 'Tidak dapat diproses' },
  ] : []

  const navItems = [
    { id: 'overview',   label: 'Ringkasan',      icon: LayoutDashboard,  desc: 'Monitoring Overview' },
    { id: 'reports',    label: 'Tabel Laporan',  icon: FileText,         desc: 'Daftar Laporan Warga' },
    { id: 'live_map',   label: 'Peta Live GIS',  icon: Globe,            desc: 'Spasial Laporan Warga' },
    { id: 'services',   label: 'Direktori RAG',  icon: BookOpen,         desc: 'RAG Knowledge Directory' },
    { id: 'claims',     label: 'Cek Fakta',      icon: Shield,           desc: 'Fact Check & Claims' },
    { id: 'summaries',  label: 'Ringkasan Dok',  icon: FileSpreadsheet,  desc: 'Regulation Summaries' },
    { id: 'histories',  label: 'Riwayat Chat',   icon: MessageSquare,    desc: 'Chat History Logs' },
  ] as const

  return (
    <div className="flex min-h-screen bg-zinc-950 text-zinc-100 font-sans antialiased">
      {/* Backdrop for mobile */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 border-r border-zinc-800 bg-zinc-900 flex flex-col transition-transform duration-200 md:translate-x-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-14 items-center gap-3 px-5 border-b border-zinc-800 bg-zinc-950 shadow-sm">
          <img src="/assets/logo/komunitas.png" alt="KOMUNITAS Logo" className="h-5 w-5 object-contain flex-shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-bold text-zinc-100 uppercase tracking-wider truncate">KOMUNITAS</div>
            <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider leading-none mt-0.5 truncate">Admin Portal</div>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id as any)
                  setLoading(true)
                  setIsSidebarOpen(false)
                  setSearch('')
                  setFilterStatus('all')
                  setServiceSearch('')
                  setServiceFilterCategory('all')
                  setClaimsSearch('')
                  setSummariesSearch('')
                  setHistoriesSearch('')
                }}
                className={cn(
                  "w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left transition active:scale-[0.98]",
                  isActive
                    ? "bg-zinc-950 text-zinc-100 border border-zinc-800 shadow-md font-semibold"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200 border border-transparent"
                )}
              >
                <Icon className={cn("h-4 w-4 flex-shrink-0", isActive ? "text-zinc-100" : "text-zinc-500")} />
                <div className="flex flex-col">
                  <span className="text-xs leading-tight">{item.label}</span>
                  <span className="text-[9px] text-zinc-500 font-normal leading-normal mt-0.5">{item.desc}</span>
                </div>
              </button>
            )
          })}
        </nav>

        {/* Workspace Session info */}
        <div className="border-t border-zinc-800 p-4 bg-zinc-950/30 mt-auto">
          <div className="flex items-center justify-between gap-3 min-w-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-400">
                <Activity className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="text-[9px] text-zinc-500 uppercase tracking-wider font-semibold">Active Session</div>
                <div className="text-xs font-bold text-zinc-300 truncate">Administrator</div>
              </div>
            </div>
            <button
              onClick={async () => {
                await authService.logout()
                navigate('/admin/login', { replace: true })
              }}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-rose-400 hover:border-rose-900 transition active:scale-95"
              title="Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-md">
          <div className="flex h-14 items-center justify-between px-6">
            <div className="flex items-center gap-3">
              {/* Mobile hamburger menu toggle */}
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 md:hidden"
              >
                <Menu className="h-4.5 w-4.5" />
              </button>
              <div>
                <h1 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                  {activeTab === 'overview' && 'Overview Ringkasan Sistem'}
                  {activeTab === 'reports' && 'Tabel Laporan Warga'}
                  {activeTab === 'live_map' && 'Peta Live GIS Laporan Warga'}
                  {activeTab === 'services' && 'Basis Pengetahuan RAG (Layanan)'}
                  {activeTab === 'claims' && 'Data Verifikasi Klaim (Cek Hoaks)'}
                  {activeTab === 'summaries' && 'Cache Ringkasan Dokumen Perda'}
                  {activeTab === 'histories' && 'Pemantauan Riwayat Chat Warga'}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden text-right sm:block">
                <div className="text-[9px] text-zinc-500 uppercase tracking-wider leading-none">Last Updated</div>
                <div className="text-xs text-zinc-300 font-semibold mt-1">
                  {lastUpdated.toLocaleTimeString('id-ID')}
                </div>
              </div>
              <button
                onClick={refresh}
                disabled={refreshing}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 text-zinc-400 hover:text-zinc-100 disabled:opacity-50"
              >
                <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
              </button>
            </div>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-grow p-6 w-full overflow-x-hidden">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-7 w-7 animate-spin text-zinc-500" />
                <p className="text-xs text-zinc-400 font-medium">Memuat data panel...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Action Row */}
              {activeTab === 'services' && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setIsAddServiceOpen(true)}
                    className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-zinc-100 px-4 text-xs font-bold text-zinc-950 text-zinc-100 border border-zinc-800 shadow hover:bg-zinc-900 hover:text-zinc-100 active:scale-95 transition"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Layanan
                  </button>
                </div>
              )}

              {/* ─── TAB CONTENT: OVERVIEW ──────────────────────────────── */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {stats ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 animate-in fade-in duration-200">
                      {statCards.map(card => (
                        <StatCard key={card.label} {...card} />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-xs text-red-400">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p>Koneksi stats offline. Pastikan database Supabase terhubung dengan benar.</p>
                      </div>
                    </div>
                  )}
                  <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6 space-y-3">
                    <h3 className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 uppercase tracking-wider">
                      <Shield className="h-4 w-4 text-indigo-400" /> Petunjuk Monitoring Panel Admin
                    </h3>
                    <p className="text-xs leading-relaxed text-zinc-400 font-normal">
                      Portal admin KOMUNITAS dikembangkan khusus untuk mempermudah pemantauan isu warga secara terpusat.
                      Gunakan navigasi sidebar di sebelah kiri untuk berinteraksi dengan database real-time Supabase. 
                      Seluruh kolom dan struktur data yang disajikan di panel ini disinkronkan 100% dengan tabel Supabase 
                      tanpa ada nama properti yang diubah demi keaslian data.
                    </p>
                  </div>
                </div>
              )}

              {/* ─── TAB CONTENT: CITIZEN REPORTS ────────────────────────── */}
              {activeTab === 'reports' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Table Toolbar */}
                  <div className="flex flex-col gap-2 border border-zinc-800 bg-zinc-900 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-zinc-400" />
                      <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                        Tabel: citizen_reports
                      </h2>
                      <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-400 font-bold">
                        {total} Baris
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:flex-row">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                        <input
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Cari laporan..."
                          className="h-8 w-full rounded border border-zinc-800 bg-zinc-950 pl-8 pr-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 sm:w-48 placeholder-zinc-500"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Filter className="h-3.5 w-3.5 text-zinc-500" />
                        <select
                          value={filterStatus}
                          onChange={e => setFilterStatus(e.target.value)}
                          className="h-8 rounded border border-zinc-800 bg-zinc-950 px-2 text-zinc-300 outline-none focus:border-zinc-700"
                        >
                          <option value="all">Semua Status</option>
                          <option value="Menunggu">Menunggu</option>
                          <option value="Diproses">Diproses</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Ditolak">Ditolak</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Reports Table List */}
                  <div className="border border-zinc-800 bg-zinc-900 rounded-lg">
                    {filteredReports.length === 0 ? (
                      <div className="flex h-36 flex-col items-center justify-center gap-2">
                        <FileText className="h-6 w-6 text-zinc-500" />
                        <p className="text-xs text-zinc-500 italic">Tidak ada baris laporan warga ditemukan.</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View (lg and up) */}
                        <div className="hidden lg:block overflow-visible">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                                {[
                                  { key: 'id', width: 'w-24', className: 'hidden xl:table-cell' },
                                  { key: 'reporter_name', width: '', className: '' },
                                  { key: 'reporter_contact', width: 'w-36', className: 'hidden lg:table-cell' },
                                  { key: 'category', width: 'w-36', className: 'hidden sm:table-cell' },
                                  { key: 'description', width: 'w-48 max-w-[320px]', className: 'hidden xl:table-cell' },
                                  { key: 'status', width: 'w-28', className: '' },
                                  { key: 'created_at', width: 'w-28', className: 'hidden md:table-cell' },
                                  { key: 'Aksi', width: 'w-32', className: '' }
                                ].map(h => (
                                  <th key={h.key} className={cn("px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] whitespace-nowrap", h.width, h.className)}>
                                    {h.key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredReports.map(r => (
                                <tr key={r.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/10 transition">
                                  <td className="px-4 py-3.5 w-24 hidden xl:table-cell">
                                    <div className="truncate font-mono text-[10px] text-zinc-500 select-all" title={r.id}>
                                      {r.id}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 font-semibold text-zinc-200">
                                    <div>{r.reporter_name}</div>
                                    <div className="text-[10px] text-zinc-500 font-normal mt-0.5 sm:hidden">
                                      {CATEGORY_LABELS[r.category] || r.category}
                                    </div>
                                    <div className="text-[9px] text-zinc-500 font-mono mt-0.5 lg:hidden truncate max-w-[140px]">
                                      {r.reporter_contact}
                                    </div>
                                    <div className="text-xs text-zinc-400 mt-1 xl:hidden line-clamp-1 max-w-[200px]" title={r.description}>
                                      {r.description.replace(/^\[\uD83D\uDCCD LOKASI GPS KOORDINAT:[^\]]+\]\s*/, '')}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 text-zinc-400 w-36 whitespace-nowrap hidden lg:table-cell">{r.reporter_contact}</td>
                                  <td className="px-4 py-3.5 w-36 whitespace-nowrap hidden sm:table-cell">
                                    <span className="inline-flex items-center rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-300 font-semibold whitespace-nowrap">
                                      {CATEGORY_LABELS[r.category] || r.category}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 w-48 max-w-[320px] hidden xl:table-cell">
                                    <div className="flex flex-col gap-0.5">
                                      {r.description.startsWith('[\uD83D\uDCCD LOKASI GPS KOORDINAT:') && (
                                        <span className="inline-flex items-center gap-0.5 text-[9px] text-rose-400 font-bold whitespace-nowrap">
                                          <MapPin className="h-2.5 w-2.5" /> GPS Terlampir
                                        </span>
                                      )}
                                      <div className="truncate text-zinc-400" title={r.description.replace(/^\[\uD83D\uDCCD LOKASI GPS KOORDINAT:[^\]]+\]\s*/, '')}>
                                        {r.description.replace(/^\[\uD83D\uDCCD LOKASI GPS KOORDINAT:[^\]]+\]\s*/, '')}
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 w-28">
                                    <StatusBadge status={r.status as keyof typeof STATUS_CONFIG} />
                                  </td>
                                  <td className="px-4 py-3.5 text-zinc-400 w-28 whitespace-nowrap hidden md:table-cell">
                                    {new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                                  </td>
                                  <td className="px-4 py-3.5 w-32">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => setSelectedReport(r)}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition shadow-sm active:scale-95"
                                        title="Detail Laporan"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      <StatusDropdown
                                        current={r.status}
                                        reportId={r.id}
                                        onUpdate={handleStatusUpdate}
                                      />
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Grid/Card View (below lg) */}
                        <div className="block lg:hidden p-4 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredReports.map(r => (
                              <div key={r.id} className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 space-y-3 hover:border-zinc-700 transition">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <h3 className="font-semibold text-zinc-100">{r.reporter_name}</h3>
                                    <span className="text-[10px] text-zinc-500 font-mono select-all truncate block max-w-[150px]" title={r.id}>
                                      {r.id.substring(0, 8)}...
                                    </span>
                                  </div>
                                  <StatusBadge status={r.status as keyof typeof STATUS_CONFIG} />
                                </div>
                                
                                <div className="space-y-1.5 text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Kategori:</span>
                                    <span className="text-zinc-300 font-semibold">{CATEGORY_LABELS[r.category] || r.category}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Kontak:</span>
                                    <span className="text-zinc-300">{r.reporter_contact || '-'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-zinc-500">Tanggal:</span>
                                    <span className="text-zinc-400">{new Date(r.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}</span>
                                  </div>
                                  <div className="pt-2 border-t border-zinc-800/80">
                                    <span className="text-zinc-500 block mb-1">Deskripsi:</span>
                                    {r.description.startsWith('[\uD83D\uDCCD LOKASI GPS KOORDINAT:') && (
                                      <span className="inline-flex items-center gap-0.5 text-[9px] text-rose-400 font-bold mb-1">
                                        <MapPin className="h-2.5 w-2.5" /> GPS Terlampir
                                      </span>
                                    )}
                                    <p className="text-zinc-300 line-clamp-2 leading-relaxed">
                                      {r.description.replace(/^\[\uD83D\uDCCD LOKASI GPS KOORDINAT:[^\]]+\]\s*/, '')}
                                    </p>
                                  </div>
                                  {r.admin_note && (
                                    <div className="pt-2 border-t border-zinc-800/80">
                                      <span className="text-zinc-500 block mb-1">Catatan Admin:</span>
                                      <p className="text-zinc-400 italic line-clamp-2">{r.admin_note}</p>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
                                  <button
                                    onClick={() => setSelectedReport(r)}
                                    className="flex flex-1 items-center justify-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100 transition active:scale-[0.98]"
                                  >
                                    <Eye className="h-3.5 w-3.5" /> Detail
                                  </button>
                                  <StatusDropdown
                                    current={r.status}
                                    reportId={r.id}
                                    onUpdate={handleStatusUpdate}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3.5 bg-zinc-950/20">
                        <span className="text-[11px] text-zinc-500 font-semibold">
                          Halaman {page} dari {totalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 transition hover:bg-zinc-900 disabled:opacity-30"
                          >
                            <ChevronLeft className="h-3.5 w-3.5 text-zinc-400" />
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              onClick={() => setPage(p)}
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold border transition',
                                page === p
                                  ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow'
                                  : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
                              )}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 transition hover:bg-zinc-900 disabled:opacity-30"
                          >
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB CONTENT: GIS LIVE MAP ────────────────────────────── */}
              {activeTab === 'live_map' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Map Toolbar */}
                  <div className="flex flex-col gap-2 border border-zinc-800 bg-zinc-900 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-zinc-400" />
                      <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                        Monitor Spasial Laporan
                      </h2>
                      <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-400 font-bold">
                        {filteredMapReports.filter(r => r.description.includes('\uD83D\uDCCD LOKASI GPS KOORDINAT')).length} Terpetakan
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:flex-row">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                        <input
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          placeholder="Cari laporan..."
                          className="h-8 w-full rounded border border-zinc-800 bg-zinc-950 pl-8 pr-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 sm:w-48 placeholder-zinc-500"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Filter className="h-3.5 w-3.5 text-zinc-500" />
                        <select
                          value={filterStatus}
                          onChange={e => setFilterStatus(e.target.value)}
                          className="h-8 rounded border border-zinc-800 bg-zinc-950 px-2 text-zinc-300 outline-none focus:border-zinc-700"
                        >
                          <option value="all">Semua Status</option>
                          <option value="Menunggu">Menunggu</option>
                          <option value="Diproses">Diproses</option>
                          <option value="Selesai">Selesai</option>
                          <option value="Ditolak">Ditolak</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* GIS Live Map View (Full Width) */}
                  <div className="h-[600px] w-full border border-zinc-800 bg-zinc-900 rounded-lg overflow-hidden relative shadow-lg">
                    <ReportMap 
                      reports={filteredMapReports} 
                      onSelectReport={(r) => setSelectedReport(r)} 
                    />
                  </div>
                </div>
              )}

              {/* ─── TAB CONTENT: PUBLIC SERVICES (RAG DIRECTORY) ───────── */}
              {activeTab === 'services' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Table Toolbar */}
                  <div className="flex flex-col gap-2 border border-zinc-800 bg-zinc-900 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-indigo-400" />
                      <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Tabel: public_services</h2>
                      <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-400 font-semibold">
                        {services.length} Baris
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5 sm:flex-row">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                        <input
                          value={serviceSearch}
                          onChange={e => setServiceSearch(e.target.value)}
                          placeholder="Cari layanan/lembaga..."
                          className="h-8 w-full rounded border border-zinc-800 bg-zinc-955 bg-zinc-950 pl-8 pr-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 sm:w-48 placeholder-zinc-500"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                        <Filter className="h-3.5 w-3.5 text-zinc-500" />
                        <select
                          value={serviceFilterCategory}
                          onChange={e => setServiceFilterCategory(e.target.value)}
                          className="h-8 rounded border border-zinc-800 bg-zinc-950 px-2 text-zinc-300 outline-none focus:border-zinc-700"
                        >
                          <option value="all">Semua Kategori</option>
                          {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-hidden border border-zinc-800 bg-zinc-900 rounded-lg">
                    {filteredServices.length === 0 ? (
                      <div className="flex h-36 flex-col items-center justify-center gap-2">
                        <BookOpen className="h-6 w-6 text-zinc-750" />
                        <p className="text-xs text-zinc-500 italic">Tidak ada baris layanan terdaftar.</p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View (lg and up) */}
                        <div className="hidden lg:block overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-zinc-800 bg-zinc-950/50">
                                {[
                                  { key: 'Layanan & Instansi', width: '', className: '' },
                                  { key: 'kategori', width: 'w-36', className: '' },
                                  { key: 'Alur & Syarat', width: 'w-44', className: '' },
                                  { key: 'kontak', width: 'w-48', className: '' },
                                  { key: 'Aksi', width: 'w-24', className: '' }
                                ].map(h => (
                                  <th key={h.key} className={cn("px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] whitespace-nowrap", h.width, h.className)}>
                                    {h.key}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {filteredServices.map(s => (
                                <tr key={s.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/10 transition">
                                  <td className="px-4 py-3.5 font-semibold text-zinc-200">
                                    <div className="break-words font-semibold text-zinc-100">{s.name}</div>
                                    <div className="text-[10px] text-zinc-400 font-medium mt-0.5">
                                      {s.institution}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 w-36">
                                    <span className="inline-flex items-center rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-300 font-semibold whitespace-nowrap">
                                      {CATEGORY_LABELS[s.category] || s.category}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3.5 w-44">
                                    <div className="flex flex-col gap-1">
                                      <span className="text-zinc-400 text-[10.5px] font-medium">{s.requirements.length} Persyaratan</span>
                                      <span className="text-zinc-500 text-[10px]">{s.procedures.length} Langkah Alur</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 w-48 text-zinc-400">
                                    <div className="flex flex-col gap-0.5 font-mono text-[10px]">
                                      {s.contactPhone && <span className="flex items-center gap-1.5 whitespace-nowrap"><Phone className="h-3 w-3 text-zinc-500 flex-shrink-0" /> {s.contactPhone}</span>}
                                      {s.contactEmail && <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-zinc-500 flex-shrink-0" /> {s.contactEmail}</span>}
                                      {!s.contactPhone && !s.contactEmail && <span className="text-zinc-500">-</span>}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3.5 w-24">
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        onClick={() => setSelectedService(s)}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition shadow-sm active:scale-95"
                                        title="Lihat Detail"
                                      >
                                        <Eye className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteService(s.id)}
                                        className="flex h-7 w-7 items-center justify-center rounded-lg border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950 transition shadow-sm active:scale-95"
                                        title="Hapus Layanan"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Mobile Grid/Card View (below lg) */}
                        <div className="block lg:hidden p-4 space-y-4 max-h-[65vh] overflow-y-auto scrollbar-thin">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {filteredServices.map(s => (
                              <div key={s.id} className="bg-zinc-950/60 border border-zinc-800/80 rounded-lg p-4 space-y-3 hover:border-zinc-700 transition">
                                <div>
                                  <h3 className="font-bold text-zinc-100 text-sm leading-snug">{s.name}</h3>
                                  <p className="text-xs text-zinc-400 font-medium mt-1">{s.institution}</p>
                                </div>
                                
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  <span className="inline-flex items-center rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-300 font-semibold">
                                    {CATEGORY_LABELS[s.category] || s.category}
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-indigo-950/40 border border-indigo-900/30 px-2 py-0.5 text-[10px] text-indigo-450 font-semibold">
                                    {s.requirements.length} Dokumen
                                  </span>
                                  <span className="inline-flex items-center rounded-full bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 text-[10px] text-emerald-455 text-emerald-400 font-semibold">
                                    {s.procedures.length} Langkah
                                  </span>
                                </div>

                                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed bg-zinc-950 border border-zinc-800/60 p-2.5 rounded">
                                  {s.description}
                                </p>

                                {(s.contactPhone || s.contactEmail) && (
                                  <div className="flex flex-col gap-1 text-[11px] text-zinc-400 font-mono">
                                    {s.contactPhone && <span className="flex items-center gap-1.5"><Phone className="h-3 w-3 text-zinc-500" /> {s.contactPhone}</span>}
                                    {s.contactEmail && <span className="flex items-center gap-1.5"><Mail className="h-3 w-3 text-zinc-500" /> {s.contactEmail}</span>}
                                  </div>
                                )}

                                <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => setSelectedService(s)}
                                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 py-1.5 text-xs font-semibold text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100 transition active:scale-[0.98]"
                                  >
                                    <Eye className="h-3.5 w-3.5" /> Detail
                                  </button>
                                  <button
                                    onClick={() => handleDeleteService(s.id)}
                                    className="inline-flex h-8 w-8 items-center justify-center rounded border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950 transition active:scale-95"
                                    title="Hapus Layanan"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB CONTENT: CLAIM VERIFICATIONS (CEK FAKTA) ────────── */}
              {activeTab === 'claims' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Table Toolbar */}
                  <div className="flex flex-col gap-2 border border-zinc-800 bg-zinc-900 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-zinc-400" />
                      <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Tabel: claim_verifications</h2>
                      <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-400 font-bold">
                        {claimsTotal} Baris
                      </span>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-550 text-zinc-500" />
                      <input
                        value={claimsSearch}
                        onChange={e => setClaimsSearch(e.target.value)}
                        placeholder="Cari klaim/penjelasan..."
                        className="h-8 w-full rounded border border-zinc-800 bg-zinc-950 pl-8 pr-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 sm:w-48 placeholder-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-hidden border border-zinc-800 bg-zinc-900 rounded-lg">
                    {filteredClaims.length === 0 ? (
                      <div className="flex h-36 flex-col items-center justify-center gap-2">
                        <Shield className="h-6 w-6 text-zinc-500" />
                        <p className="text-xs text-zinc-500 italic">Tidak ada baris verifikasi klaim ditemukan.</p>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full table-fixed text-left text-xs border-collapse">
                          <colgroup>
                            <col className="w-[38%]" />
                            <col className="w-[15%] hidden sm:table-column" />
                            <col className="w-[10%] hidden sm:table-column" />
                            <col className="w-[13%] hidden lg:table-column" />
                            <col className="w-[12%] hidden lg:table-column" />
                            <col className="w-[12%]" />
                          </colgroup>
                          <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950/50">
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Klaim</th>
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Status</th>
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] hidden sm:table-cell">Skor</th>
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] hidden lg:table-cell">Kategori</th>
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] hidden lg:table-cell">Dibuat</th>
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredClaims.map(c => (
                              <tr key={c.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/10 transition">
                                <td className="px-4 py-3.5 text-zinc-200">
                                  <div className="truncate font-semibold text-[12px]" title={c.claim_text}>
                                    {c.claim_text}
                                  </div>
                                  <div className="mt-1 flex items-center gap-1.5 sm:hidden">
                                    <span className={cn(
                                      'inline-flex items-center gap-1 rounded px-2 py-0.5 text-[8px] font-bold border uppercase tracking-wider whitespace-nowrap',
                                      c.is_credible
                                        ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                                        : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                                    )}>
                                      {c.is_credible ? 'KREDIBEL' : 'HOAKS'}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-bold font-mono">{c.confidence_score}%</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 whitespace-nowrap hidden sm:table-cell">
                                  <span className={cn(
                                    'inline-flex items-center gap-1 rounded px-2.5 py-0.5 text-[9px] font-bold border uppercase tracking-wider whitespace-nowrap',
                                    c.is_credible
                                      ? 'bg-emerald-950/40 border-emerald-900/30 text-emerald-400'
                                      : 'bg-rose-950/40 border-rose-900/30 text-rose-400'
                                  )}>
                                    {c.is_credible ? 'KREDIBEL' : 'HOAKS'}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-zinc-300 font-bold font-mono text-[11px] whitespace-nowrap hidden sm:table-cell">{c.confidence_score}%</td>
                                <td className="px-4 py-3.5 text-zinc-400 whitespace-nowrap hidden lg:table-cell text-[11px]">{c.category || 'Umum'}</td>
                                <td className="px-4 py-3.5 text-zinc-500 whitespace-nowrap hidden lg:table-cell text-[11px]">
                                  {new Date(c.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedClaim(c)}
                                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 transition active:scale-95"
                                      title="Lihat Detail"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteClaim(c.id)}
                                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950 transition active:scale-95"
                                      title="Hapus"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {claimsTotalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3.5 bg-zinc-950/20">
                        <span className="text-[11px] text-zinc-500 font-semibold">
                          Halaman {claimsPage} dari {claimsTotalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setClaimsPage(p => Math.max(1, p - 1))}
                            disabled={claimsPage === 1}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 transition hover:bg-zinc-900 disabled:opacity-30"
                          >
                            <ChevronLeft className="h-3.5 w-3.5 text-zinc-400" />
                          </button>
                          {Array.from({ length: claimsTotalPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              onClick={() => setClaimsPage(p)}
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold border transition',
                                claimsPage === p
                                  ? 'bg-zinc-100 text-zinc-955 border-zinc-100 shadow'
                                  : 'border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
                              )}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setClaimsPage(p => Math.min(claimsTotalPages, p + 1))}
                            disabled={claimsPage === claimsTotalPages}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900 transition hover:bg-zinc-900 disabled:opacity-30"
                          >
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB CONTENT: DOCUMENT SUMMARIES ───────────────────────── */}
              {activeTab === 'summaries' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Table Toolbar */}
                  <div className="flex flex-col gap-2 border border-zinc-800 bg-zinc-900 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-zinc-400" />
                      <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Tabel: document_summaries</h2>
                      <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-400 font-semibold">
                        {summariesTotal} Baris
                      </span>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                      <input
                        value={summariesSearch}
                        onChange={e => setSummariesSearch(e.target.value)}
                        placeholder="Cari teks/ringkasan..."
                        className="h-8 w-full rounded border border-zinc-800 bg-zinc-900 pl-8 pr-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 sm:w-48 placeholder-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-hidden border border-zinc-800 bg-zinc-900 rounded-lg">
                    {filteredSummaries.length === 0 ? (
                      <div className="flex h-36 flex-col items-center justify-center gap-2">
                        <FileSpreadsheet className="h-6 w-6 text-zinc-500" />
                        <p className="text-xs text-zinc-500 italic">Tidak ada baris ringkasan dokumen ditemukan.</p>
                      </div>
                    ) : (
                      <div className="w-full overflow-x-auto">
                        <table className="w-full table-fixed text-left text-xs border-collapse">
                          <colgroup>
                            <col className="w-[40%]" />
                            <col className="w-[20%] hidden md:table-column" />
                            <col className="w-[20%] hidden lg:table-column" />
                            <col className="w-[20%]" />
                          </colgroup>
                          <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950/50">
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px]">Ringkasan</th>
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] hidden md:table-cell">Key Points</th>
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] hidden lg:table-cell">Dibuat</th>
                              <th className="px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredSummaries.map(s => (
                              <tr key={s.id} className="border-b border-zinc-800/60 hover:bg-zinc-800/10 transition">
                                <td className="px-4 py-3.5 text-zinc-200">
                                  <div
                                    className="truncate text-zinc-200 font-semibold text-[12px]"
                                    title={stripMarkdown(s.summary)}
                                  >
                                    {stripMarkdown(s.summary)}
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 text-[10px] text-zinc-500 font-mono md:hidden">
                                    <span>{s.key_points ? `${s.key_points.length} Poin` : '0 Poin'}</span>
                                    <span>·</span>
                                    <span>{new Date(s.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-zinc-400 font-mono text-[10px] whitespace-nowrap hidden md:table-cell">
                                  {s.key_points ? `${s.key_points.length} Poin` : '0 Poin'}
                                </td>
                                <td className="px-4 py-3.5 text-zinc-500 whitespace-nowrap hidden lg:table-cell text-[11px]">
                                  {new Date(s.created_at).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: '2-digit' })}
                                </td>
                                <td className="px-4 py-3.5">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <button
                                      onClick={() => setSelectedSummary(s)}
                                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 text-zinc-400 hover:text-zinc-100 transition active:scale-95"
                                      title="Lihat Detail"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSummary(s.id)}
                                      className="flex h-6 w-6 items-center justify-center rounded-lg border border-red-900/50 bg-red-950/20 text-red-400 hover:bg-red-950 transition active:scale-95"
                                      title="Hapus"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {summariesTotalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3.5 bg-zinc-950/20">
                        <span className="text-[11px] text-zinc-500 font-semibold">
                          Halaman {summariesPage} dari {summariesTotalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setSummariesPage(p => Math.max(1, p - 1))}
                            disabled={summariesPage === 1}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 transition hover:bg-zinc-900 disabled:opacity-30"
                          >
                            <ChevronLeft className="h-3.5 w-3.5 text-zinc-400" />
                          </button>
                          {Array.from({ length: summariesTotalPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              onClick={() => setSummariesPage(p)}
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-lg text-xs font-semibold border transition',
                                summariesPage === p
                                  ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow'
                                  : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900'
                              )}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setSummariesPage(p => Math.min(summariesTotalPages, p + 1))}
                            disabled={summariesPage === summariesTotalPages}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-800 bg-zinc-950 transition hover:bg-zinc-900 disabled:opacity-30"
                          >
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ─── TAB CONTENT: CHAT HISTORY SESSIONS ────────────────────── */}
              {activeTab === 'histories' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Table Toolbar */}
                  <div className="flex flex-col gap-2 border border-zinc-800 bg-zinc-900 rounded-lg p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-zinc-400" />
                      <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">Tabel: chat_history</h2>
                      <span className="rounded-full bg-zinc-950 border border-zinc-800 px-2.5 py-0.5 text-[10px] text-zinc-400 font-semibold">
                        {historiesTotal} Baris
                      </span>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
                      <input
                        value={historiesSearch}
                        onChange={e => setHistoriesSearch(e.target.value)}
                        placeholder="Cari Sesi ID..."
                        className="h-8 w-full rounded border border-zinc-800 bg-zinc-950 pl-8 pr-3 text-xs text-zinc-200 outline-none focus:border-zinc-700 sm:w-48 placeholder-zinc-500"
                      />
                    </div>
                  </div>

                  {/* Table Container */}
                  <div className="overflow-hidden border border-zinc-800 bg-zinc-900 rounded-lg">
                    {filteredHistories.length === 0 ? (
                      <div className="flex h-36 flex-col items-center justify-center gap-2">
                        <MessageSquare className="h-6 w-6 text-zinc-500" />
                        <p className="text-xs text-zinc-500 italic">Tidak ada sesi chat tersimpan.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-800 bg-zinc-950/50">
                              {[
                                { key: 'session_id', width: 'w-[180px] min-w-[180px]', className: '' },
                                { key: 'messages', width: 'w-[140px] min-w-[140px]', className: 'hidden sm:table-cell' },
                                { key: 'created_at', width: 'w-[130px] min-w-[130px]', className: 'hidden md:table-cell' },
                                { key: 'updated_at', width: 'w-[130px] min-w-[130px]', className: 'hidden lg:table-cell' },
                                { key: 'Aksi', width: 'w-[90px] min-w-[90px]', className: '' }
                              ].map(h => (
                                <th key={h.key} className={cn("px-4 py-3 font-semibold text-zinc-400 uppercase tracking-wider text-[10px] whitespace-nowrap", h.width, h.className)}>
                                  {h.key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {filteredHistories.map(h => (
                              <tr key={h.session_id} className="border-b border-zinc-800/60 hover:bg-zinc-800/10 transition">
                                <td className="px-4 py-3.5 font-mono text-[10px] text-zinc-200 font-semibold select-all">
                                  <div className="truncate" title={h.session_id}>
                                    {h.session_id}
                                  </div>
                                  <div className="mt-1 sm:hidden">
                                    <span className="px-2 py-0.5 bg-zinc-950 border border-zinc-800 rounded text-[9px] text-zinc-400 whitespace-nowrap">
                                      {h.messages ? `${h.messages.length} Pesan` : '0 Pesan'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-zinc-300 font-semibold text-[11px] min-w-[140px] whitespace-nowrap hidden sm:table-cell">
                                  <span className="px-2.5 py-0.5 bg-zinc-950 border border-zinc-800 rounded-lg text-zinc-300 whitespace-nowrap">
                                    {h.messages ? `${h.messages.length} Pesan` : '0 Pesan'}
                                  </span>
                                </td>
                                <td className="px-4 py-3.5 text-zinc-500 font-mono text-[10px] min-w-[130px] whitespace-nowrap hidden md:table-cell">
                                  {new Date(h.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                                <td className="px-4 py-3.5 text-zinc-500 font-mono text-[10px] min-w-[130px] whitespace-nowrap hidden lg:table-cell">
                                  {new Date(h.updated_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                </td>
                                <td className="px-4 py-3.5 min-w-[90px]">
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => setSelectedHistory(h)}
                                      className="flex h-6 w-6 items-center justify-center rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 transition shadow-sm active:scale-95"
                                    >
                                      <Eye className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteHistory(h.session_id)}
                                      className="flex h-6 w-6 items-center justify-center rounded border border-zinc-800 bg-zinc-950 text-zinc-400 hover:bg-zinc-900 transition active:scale-95"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Pagination */}
                    {historiesTotalPages > 1 && (
                      <div className="flex items-center justify-between border-t border-zinc-800 px-4 py-3.5 bg-zinc-955/20 bg-zinc-950/20">
                        <span className="text-[10px] text-[#787774] font-semibold">
                          Halaman {historiesPage} dari {historiesTotalPages}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setHistoriesPage(p => Math.max(1, p - 1))}
                            disabled={historiesPage === 1}
                            className="flex h-6.5 w-6.5 items-center justify-center rounded border border-zinc-800 bg-zinc-950 transition hover:bg-zinc-900 disabled:opacity-30"
                          >
                            <ChevronLeft className="h-3.5 w-3.5 text-zinc-400" />
                          </button>
                          {Array.from({ length: historiesTotalPages }, (_, i) => i + 1).map(p => (
                            <button
                              key={p}
                              onClick={() => setHistoriesPage(p)}
                              className={cn(
                                'flex h-6.5 w-6.5 items-center justify-center rounded text-xs font-semibold border transition',
                                historiesPage === p
                                  ? 'bg-zinc-100 text-zinc-950 border-zinc-100 shadow'
                                  : 'border border-zinc-800 bg-zinc-900 text-zinc-400 hover:bg-zinc-950'
                              )}
                            >
                              {p}
                            </button>
                          ))}
                          <button
                            onClick={() => setHistoriesPage(p => Math.min(historiesTotalPages, p + 1))}
                            disabled={historiesPage === historiesTotalPages}
                            className="flex h-6.5 w-6.5 items-center justify-center rounded border border-zinc-800 bg-zinc-950 transition hover:bg-zinc-900 disabled:opacity-30"
                          >
                            <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ─── Report Detail Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedReport && (
          <ReportDetailModal
            report={selectedReport}
            onClose={() => setSelectedReport(null)}
            onUpdate={async (id, status, note) => {
              await handleStatusUpdate(id, status, note)
              setSelectedReport(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Service Detail Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedService && (
          <ServiceDetailModal
            service={selectedService}
            onClose={() => setSelectedService(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Add Service Modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {isAddServiceOpen && (
          <AddServiceModal
            onClose={() => setIsAddServiceOpen(false)}
            onAdd={async (payload) => {
              await adminService.createService(payload)
              await loadServices(serviceFilterCategory)
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Chat Transcript Modal ───────────────────────────────────────── */}
      <AnimatePresence>
        {selectedHistory && (
          <ChatTranscriptModal
            session={selectedHistory}
            onClose={() => setSelectedHistory(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Summary Detail Modal ────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedSummary && (
          <SummaryDetailModal
            summary={selectedSummary}
            onClose={() => setSelectedSummary(null)}
          />
        )}
      </AnimatePresence>

      {/* ─── Claim Detail Modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedClaim && (
          <ClaimDetailModal
            claim={selectedClaim}
            onClose={() => setSelectedClaim(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
