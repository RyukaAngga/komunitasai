import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, Lock, Mail } from 'lucide-react'
import { authService } from '@/services/auth'

export function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Jika sudah login, redirect langsung ke dashboard
  useEffect(() => {
    authService.getSession().then(session => {
      if (session) navigate('/admin', { replace: true })
    })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!email.trim() || !password.trim()) {
      setError('Email dan password tidak boleh kosong.')
      return
    }

    setLoading(true)
    try {
      await authService.login(email.trim(), password)
      navigate('/admin', { replace: true })
    } catch (err: any) {
      // Translate common Supabase error messages to Indonesian
      const msg = err.message || ''
      if (msg.includes('Invalid login credentials')) {
        setError('Email atau password salah. Periksa kembali kredensial Anda.')
      } else if (msg.includes('Email not confirmed')) {
        setError('Email belum dikonfirmasi. Periksa inbox email Anda.')
      } else if (msg.includes('Too many requests')) {
        setError('Terlalu banyak percobaan login. Coba lagi beberapa menit kemudian.')
      } else {
        setError(msg || 'Terjadi kesalahan. Silakan coba lagi.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] bg-zinc-950 overflow-hidden text-zinc-100">
      
      {/* ─── LEFT PANEL: BRAND & INTEGRITY STATS (DESKTOP ONLY) ────────── */}
      <div className="hidden md:flex md:w-1/2 flex-col justify-between p-12 bg-zinc-950 border-r border-zinc-900 relative bg-dot-pattern bg-noise overflow-hidden">
        {/* Ambient glow top-left */}
        <div className="pointer-events-none absolute -left-12 -top-12 h-64 w-64 rounded-full bg-zinc-900/30 blur-3xl" />
        
        {/* Header brand */}
        <div className="flex items-center gap-3 relative z-10 select-none">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm overflow-hidden p-1.5">
            <img src="/assets/logo/komunitas.png" alt="KOMUNITAS Logo" className="h-full w-full object-contain" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-100">KOMUNITAS</span>
            <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-500 leading-none mt-0.5">Admin Portal</span>
          </div>
        </div>

        {/* System Integrity & Description */}
        <div className="space-y-6 max-w-sm relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-semibold">Security System Active</span>
            <h2 className="text-4xl font-extrabold tracking-tighter text-zinc-100 leading-none">KOMUNITAS</h2>
            <p className="text-xs text-zinc-500 font-mono mt-1">Console v1.0.4 // SSL Enforced</p>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed font-light">
            Selamat datang di Portal Administrasi KOMUNITAS. Sistem ini dirancang untuk memproses aduan warga, memperbarui informasi layanan masyarakat, serta memantau operasional pelayanan publik secara real-time. Hak akses dibatasi bagi pengguna terdaftar.
          </p>
          
          <div className="pt-6 space-y-2 border-t border-zinc-900">
            <div className="flex items-center justify-between text-[11px] py-2 border-b border-zinc-900/40 font-mono">
              <span className="text-zinc-400">Pengaduan Warga</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[8px]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktif</span>
            </div>
            <div className="flex items-center justify-between text-[11px] py-2 border-b border-zinc-900/40 font-mono">
              <span className="text-zinc-400">Direktori Layanan</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[8px]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sinkron</span>
            </div>
            <div className="flex items-center justify-between text-[11px] py-2 border-b border-zinc-900/40 font-mono">
              <span className="text-zinc-400">Verifikasi Informasi</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[8px]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktif</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-zinc-600 font-mono select-none relative z-10">
          Copyright &copy; 2026 KOMUNITAS. Secure Administration Console.
        </div>
      </div>

      {/* ─── RIGHT PANEL: LOGIN FORM (DESKTOP & MOBILE) ────────────────── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-8 bg-zinc-950 relative overflow-hidden bg-dot-pattern bg-noise md:bg-none">
        {/* Background ambient glow for mobile */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900/20 blur-3xl md:hidden" />
        
        {/* Mobile Header Logo */}
        <div className="mb-8 flex flex-col items-center gap-3 md:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm overflow-hidden p-2">
            <img src="/assets/logo/komunitas.png" alt="KOMUNITAS Logo" className="h-full w-full object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-md font-bold text-zinc-100 uppercase tracking-wider">Admin KOMUNITAS</h1>
            <p className="mt-0.5 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Portal Manajemen Internal</p>
          </div>
        </div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-sm"
        >
          {/* Glassmorphic Card */}
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-xl">
            <div className="border-b border-zinc-800/80 bg-zinc-950/40 p-6">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Masuk ke Dashboard</h2>
              <p className="mt-1 text-xs text-zinc-500 font-light leading-relaxed">
                Gunakan kredensial admin terdaftar untuk membuka kunci konsol manajemen.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Error Alert */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-2.5 rounded-lg border border-red-900/30 bg-red-950/20 p-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <p className="text-xs leading-relaxed text-red-400 font-medium">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Email Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Email Admin
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-650 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="admin@komunitas.id"
                    autoComplete="email"
                    disabled={loading}
                    className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950/50 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:border-zinc-700 focus:bg-zinc-950 disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-650 text-zinc-500" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={loading}
                    className="h-10 w-full rounded-lg border border-zinc-800 bg-zinc-950/50 pl-10 pr-10 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:border-zinc-700 focus:bg-zinc-950 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(v => !v)}
                    tabIndex={-1}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 text-xs font-bold text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-55"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                    Memverifikasi...
                  </>
                ) : (
                  'Masuk ke Dashboard'
                )}
              </button>
            </form>
          </div>

          {/* Footer Back Button */}
          <div className="mt-6 text-center">
            <a 
              href="/" 
              className="text-xs text-zinc-550 text-zinc-400 hover:text-zinc-200 underline underline-offset-4 decoration-zinc-800 transition-colors"
            >
              Kembali ke Beranda
            </a>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
