import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Loader2, AlertCircle, Lock, Mail, User, CreditCard, Calendar, Phone } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useToast } from '@/components/ui/toast'

export function Register() {
  const [formData, setForm] = useState({
    email: '',
    password: '',
    konfirmasiPassword: '',
    nik: '',
    nama_lengkap: '',
    nama_panggilan: '',
    tanggal_lahir: '',
    nomor_telepon: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirmPass, setShowConfirmPass] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const { register, isLoading, error: storeError, clearError, isAuthenticated } = useAuthStore()
  const navigate = useNavigate()
  const { toast } = useToast()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
    return () => {
      clearError()
    }
  }, [isAuthenticated, navigate, clearError])

  const validateField = (name: string, value: string) => {
    let errorMsg = ''

    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!value) {
        errorMsg = 'Email wajib diisi'
      } else if (!emailRegex.test(value)) {
        errorMsg = 'Format email tidak valid'
      }
    }

    if (name === 'password') {
      if (!value) {
        errorMsg = 'Password wajib diisi'
      } else if (value.length < 8) {
        errorMsg = 'Password minimal harus 8 karakter'
      }
    }

    if (name === 'konfirmasiPassword') {
      if (!value) {
        errorMsg = 'Konfirmasi password wajib diisi'
      } else if (value !== formData.password) {
        errorMsg = 'Konfirmasi password tidak cocok'
      }
    }

    if (name === 'nik') {
      if (!value) {
        errorMsg = 'NIK wajib diisi'
      } else if (value.length !== 16) {
        errorMsg = 'NIK harus tepat 16 digit'
      } else if (!/^\d+$/.test(value)) {
        errorMsg = 'NIK harus berupa angka saja'
      }
    }

    if (name === 'nama_lengkap') {
      if (!value.trim()) {
        errorMsg = 'Nama lengkap wajib diisi sesuai KTP'
      }
    }

    if (name === 'nama_panggilan') {
      if (!value.trim()) {
        errorMsg = 'Nama panggilan wajib diisi'
      }
    }

    if (name === 'tanggal_lahir') {
      if (!value) {
        errorMsg = 'Tanggal lahir wajib diisi'
      } else if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        errorMsg = 'Format tanggal lahir harus YYYY-MM-DD'
      }
    }

    if (name === 'nomor_telepon') {
      const phoneRegex = /^\+62\d{10,13}$/
      if (!value) {
        errorMsg = 'Nomor telepon wajib diisi'
      } else if (!value.startsWith('+62')) {
        errorMsg = 'Nomor telepon harus diawali dengan +62'
      } else if (!phoneRegex.test(value)) {
        errorMsg = 'Format nomor telepon tidak valid (+62 diikuti 10-13 digit angka)'
      }
    }

    setErrors(prev => ({
      ...prev,
      [name]: errorMsg
    }))

    return errorMsg === ''
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => {
      const updated = { ...prev, [name]: value }
      
      // If password changed, re-validate konfirmasiPassword if it was already filled
      if (name === 'password' && updated.konfirmasiPassword) {
        let confirmErrorMsg = ''
        if (updated.konfirmasiPassword !== value) {
          confirmErrorMsg = 'Konfirmasi password tidak cocok'
        }
        setErrors(errs => ({ ...errs, konfirmasiPassword: confirmErrorMsg }))
      }
      
      return updated
    })
    
    // Clear global store error when user edits
    if (storeError) {
      clearError()
    }
    setLocalError(null)

    // Inline validation
    validateField(name, value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)
    setSuccessMsg(null)

    // Validate all fields before submission
    let isValid = true
    Object.keys(formData).forEach(key => {
      const isFieldValid = validateField(key, formData[key as keyof typeof formData])
      if (!isFieldValid) {
        isValid = false
      }
    })

    if (!isValid) {
      setLocalError('Silakan lengkapi semua isian formulir dengan benar.')
      return
    }

    if (formData.password !== formData.konfirmasiPassword) {
      setLocalError('Konfirmasi password tidak cocok dengan password.')
      return
    }

    try {
      await register({
        email: formData.email.trim(),
        password: formData.password,
        nik: formData.nik.trim(),
        nama_lengkap: formData.nama_lengkap.trim(),
        nama_panggilan: formData.nama_panggilan.trim(),
        tanggal_lahir: formData.tanggal_lahir,
        nomor_telepon: formData.nomor_telepon.trim(),
      })

      // Show Toast Notification
      toast({
        title: "Registrasi Berhasil",
        description: "Akun warga Anda telah berhasil dibuat. Silakan masuk.",
        type: "success",
      })

      setSuccessMsg('Registrasi berhasil! Akun Anda telah dibuat. Mengalihkan ke halaman masuk...')
      
      // Auto redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login')
      }, 3000)

    } catch (err: any) {
      setLocalError(err.message || 'Gagal mendaftarkan akun. Silakan coba kembali.')
    }
  }

  return (
    <div className="relative flex min-h-[100dvh] bg-zinc-950 overflow-hidden text-zinc-100 font-sans">
      
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
            <span className="block text-[9px] font-semibold uppercase tracking-wider text-zinc-500 leading-none mt-0.5">Portal Warga</span>
          </div>
        </div>

        {/* System Integrity & Description */}
        <div className="space-y-6 max-w-sm relative z-10">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-mono font-semibold">Layanan Premium Aktif</span>
            <h2 className="text-4xl font-extrabold tracking-tighter text-zinc-100 leading-none">Daftar Akun</h2>
            <p className="text-xs text-zinc-500 font-mono mt-1">Platform Komunitas Digital Terpadu</p>
          </div>
          <p className="text-zinc-400 text-xs leading-relaxed font-light">
            Daftarkan diri Anda sebagai warga terverifikasi untuk menyampaikan laporan kendala publik, berkonsultasi langsung dengan petugas daerah, memvalidasi berita bohong, serta memantau statistik aktivitas wilayah secara transparan.
          </p>
          
          <div className="pt-6 space-y-2 border-t border-zinc-900">
            <div className="flex items-center justify-between text-[11px] py-2 border-b border-zinc-900/40 font-mono">
              <span className="text-zinc-400">Verifikasi NIK Terintegrasi</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[8px]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aman</span>
            </div>
            <div className="flex items-center justify-between text-[11px] py-2 border-b border-zinc-900/40 font-mono">
              <span className="text-zinc-400">Diskusi Chat Dua Arah</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[8px]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Realtime</span>
            </div>
            <div className="flex items-center justify-between text-[11px] py-2 border-b border-zinc-900/40 font-mono">
              <span className="text-zinc-400">Akses Asisten AI</span>
              <span className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase tracking-wider text-[8px]"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Aktif</span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="text-[10px] text-zinc-600 font-mono select-none relative z-10">
          Copyright &copy; 2026 KOMUNITAS. Keamanan data terenkripsi SSL.
        </div>
      </div>

      {/* ─── RIGHT PANEL: REGISTER FORM (DESKTOP & MOBILE) ────────────────── */}
      <div className="w-full md:w-1/2 flex flex-col justify-center items-center p-6 md:p-8 bg-zinc-950 relative overflow-y-auto md:h-[100dvh] py-16 bg-dot-pattern bg-noise md:bg-none">
        {/* Background ambient glow for mobile */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-zinc-900/20 blur-3xl md:hidden" />
        
        {/* Mobile Header Logo */}
        <div className="mb-6 flex flex-col items-center gap-3 md:hidden">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900 shadow-sm overflow-hidden p-2">
            <img src="/assets/logo/komunitas.png" alt="KOMUNITAS Logo" className="h-full w-full object-contain" />
          </div>
          <div className="text-center">
            <h1 className="text-md font-bold text-zinc-100 uppercase tracking-wider">KOMUNITAS</h1>
            <p className="mt-0.5 text-[10px] text-zinc-500 uppercase tracking-widest font-semibold">Portal Warga</p>
          </div>
        </div>

        <motion.div
          variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}
          initial="hidden"
          animate="show"
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative w-full max-w-lg"
        >
          {/* Glassmorphic Card */}
          <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/60 backdrop-blur-xl shadow-xl transition-all duration-300">
            <div className="border-b border-zinc-800/80 bg-zinc-950/40 p-6">
              <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">
                Pendaftaran Warga Baru
              </h2>
              <p className="mt-1 text-xs text-zinc-500 font-light leading-relaxed">
                Silakan lengkapi formulir pendaftaran di bawah ini untuk membuat akun warga Anda.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5 p-6">
              {/* Messages wrapper */}
              <AnimatePresence>
                {(localError || storeError) && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-2.5 rounded-lg border border-red-900/30 bg-red-950/20 p-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-red-400" />
                    <p className="text-xs leading-relaxed text-red-400 font-medium">{localError || storeError}</p>
                  </motion.div>
                )}

                {successMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-start gap-2.5 rounded-lg border border-emerald-900/30 bg-emerald-950/20 p-3 text-emerald-450"
                  >
                    <div className="mt-0.5 h-4 w-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-xs select-none">✓</div>
                    <p className="text-xs leading-relaxed text-emerald-450 font-medium">{successMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Two Column Grid for larger displays */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ─── KREDENSIAL AKUN ─── */}
                <div className="space-y-4 md:col-span-2">
                  <h3 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase border-b border-zinc-800/60 pb-1">Kredensial Akun</h3>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Alamat Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="nama@email.com"
                      autoComplete="email"
                      required
                      disabled={isLoading || !!successMsg}
                      className={`h-10 w-full rounded-lg border bg-zinc-950/50 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:bg-zinc-950 disabled:opacity-50 ${
                        errors.email ? 'border-red-900/50 focus:border-red-500/40' : 'border-zinc-800 focus:border-zinc-700'
                      }`}
                    />
                  </div>
                  {errors.email && <p className="text-[10px] text-red-400 font-medium mt-1">{errors.email}</p>}
                </div>

                <div className="hidden md:block" />

                {/* Password Input */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="password"
                      type={showPass ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Minimal 8 karakter"
                      autoComplete="new-password"
                      required
                      disabled={isLoading || !!successMsg}
                      className={`h-10 w-full rounded-lg border bg-zinc-950/50 pl-10 pr-10 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:bg-zinc-950 disabled:opacity-50 ${
                        errors.password ? 'border-red-900/50 focus:border-red-500/40' : 'border-zinc-800 focus:border-zinc-700'
                      }`}
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
                  {errors.password && <p className="text-[10px] text-red-400 font-medium mt-1">{errors.password}</p>}
                </div>

                {/* Konfirmasi Password Input */}
                <div className="space-y-2">
                  <label htmlFor="konfirmasiPassword" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="konfirmasiPassword"
                      type={showConfirmPass ? 'text' : 'password'}
                      name="konfirmasiPassword"
                      value={formData.konfirmasiPassword}
                      onChange={handleChange}
                      placeholder="Ulangi password"
                      autoComplete="new-password"
                      required
                      disabled={isLoading || !!successMsg}
                      className={`h-10 w-full rounded-lg border bg-zinc-950/50 pl-10 pr-10 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:bg-zinc-950 disabled:opacity-50 ${
                        errors.konfirmasiPassword ? 'border-red-900/50 focus:border-red-500/40' : 'border-zinc-800 focus:border-zinc-700'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(v => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showConfirmPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.konfirmasiPassword && <p className="text-[10px] text-red-400 font-medium mt-1">{errors.konfirmasiPassword}</p>}
                </div>

                {/* ─── DATA KEPENDUDUKAN ─── */}
                <div className="space-y-4 md:col-span-2 pt-2">
                  <h3 className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase border-b border-zinc-800/60 pb-1">Data Kependudukan</h3>
                </div>

                {/* NIK (KTP) */}
                <div className="space-y-2">
                  <label htmlFor="nik" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    NIK (Nomor Induk Kependudukan)
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="nik"
                      type="text"
                      name="nik"
                      value={formData.nik}
                      onChange={handleChange}
                      maxLength={16}
                      placeholder="16 digit angka KTP"
                      required
                      disabled={isLoading || !!successMsg}
                      className={`h-10 w-full rounded-lg border bg-zinc-950/50 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:bg-zinc-950 disabled:opacity-50 ${
                        errors.nik ? 'border-red-900/50 focus:border-red-500/40' : 'border-zinc-800 focus:border-zinc-700'
                      }`}
                    />
                  </div>
                  {errors.nik ? (
                    <p className="text-[10px] text-red-400 font-medium mt-1">{errors.nik}</p>
                  ) : (
                    <p className="text-[9px] text-zinc-600 font-mono mt-0.5">NIK harus tepat 16 digit angka.</p>
                  )}
                </div>

                {/* Nama Lengkap */}
                <div className="space-y-2">
                  <label htmlFor="nama_lengkap" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Nama Lengkap (sesuai KTP)
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="nama_lengkap"
                      type="text"
                      name="nama_lengkap"
                      value={formData.nama_lengkap}
                      onChange={handleChange}
                      placeholder="Sesuai kartu identitas"
                      required
                      disabled={isLoading || !!successMsg}
                      className={`h-10 w-full rounded-lg border bg-zinc-950/50 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:bg-zinc-950 disabled:opacity-50 ${
                        errors.nama_lengkap ? 'border-red-900/50 focus:border-red-500/40' : 'border-zinc-800 focus:border-zinc-700'
                      }`}
                    />
                  </div>
                  {errors.nama_lengkap && <p className="text-[10px] text-red-400 font-medium mt-1">{errors.nama_lengkap}</p>}
                </div>

                {/* Nama Panggilan */}
                <div className="space-y-2">
                  <label htmlFor="nama_panggilan" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Nama Panggilan
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="nama_panggilan"
                      type="text"
                      name="nama_panggilan"
                      value={formData.nama_panggilan}
                      onChange={handleChange}
                      placeholder="Nama sapaan akrab"
                      required
                      disabled={isLoading || !!successMsg}
                      className={`h-10 w-full rounded-lg border bg-zinc-950/50 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:bg-zinc-950 disabled:opacity-50 ${
                        errors.nama_panggilan ? 'border-red-900/50 focus:border-red-500/40' : 'border-zinc-800 focus:border-zinc-700'
                      }`}
                    />
                  </div>
                  {errors.nama_panggilan && <p className="text-[10px] text-red-400 font-medium mt-1">{errors.nama_panggilan}</p>}
                </div>

                {/* Tanggal Lahir */}
                <div className="space-y-2">
                  <label htmlFor="tanggal_lahir" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Tanggal Lahir
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="tanggal_lahir"
                      type="date"
                      name="tanggal_lahir"
                      value={formData.tanggal_lahir}
                      onChange={handleChange}
                      required
                      disabled={isLoading || !!successMsg}
                      className={`h-10 w-full rounded-lg border bg-zinc-950/50 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:bg-zinc-950 disabled:opacity-50 custom-calendar-dark ${
                        errors.tanggal_lahir ? 'border-red-900/50 focus:border-red-500/40' : 'border-zinc-800 focus:border-zinc-700'
                      }`}
                    />
                  </div>
                  {errors.tanggal_lahir && <p className="text-[10px] text-red-400 font-medium mt-1">{errors.tanggal_lahir}</p>}
                </div>

                {/* Nomor Telepon */}
                <div className="space-y-2 md:col-span-2">
                  <label htmlFor="nomor_telepon" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Nomor Telepon / Handphone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="nomor_telepon"
                      type="text"
                      name="nomor_telepon"
                      value={formData.nomor_telepon}
                      onChange={handleChange}
                      placeholder="+6281234567890"
                      required
                      disabled={isLoading || !!successMsg}
                      className={`h-10 w-full rounded-lg border bg-zinc-950/50 pl-10 pr-4 text-xs text-zinc-200 placeholder-zinc-700 outline-none transition focus:bg-zinc-950 disabled:opacity-50 ${
                        errors.nomor_telepon ? 'border-red-900/50 focus:border-red-500/40' : 'border-zinc-800 focus:border-zinc-700'
                      }`}
                    />
                  </div>
                  {errors.nomor_telepon ? (
                    <p className="text-[10px] text-red-400 font-medium mt-1">{errors.nomor_telepon}</p>
                  ) : (
                    <p className="text-[9px] text-zinc-600 font-mono mt-0.5">Wajib diawali +62 diikuti 10-13 digit angka.</p>
                  )}
                </div>

              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !!successMsg}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-zinc-100 text-xs font-bold text-zinc-950 hover:bg-zinc-200 active:scale-[0.98] transition-all disabled:opacity-55 cursor-pointer mt-6"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-950" />
                    Memproses Registrasi...
                  </>
                ) : (
                  'Daftarkan Akun Baru'
                )}
              </button>
            </form>

            {/* Login page redirect link */}
            <div className="border-t border-zinc-800/80 bg-zinc-950/20 px-6 py-4 text-center">
              <p className="text-xs text-zinc-500">
                Sudah memiliki akun warga?{' '}
                <Link 
                  to="/login" 
                  className="font-bold text-zinc-300 hover:text-zinc-100 transition-colors underline decoration-zinc-800 underline-offset-4"
                >
                  Masuk Sekarang
                </Link>
              </p>
            </div>
          </div>

          {/* Footer Back Button */}
          <div className="mt-6 text-center">
            <Link 
              to="/" 
              className="text-xs text-zinc-400 hover:text-zinc-200 underline underline-offset-4 decoration-zinc-800 transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
