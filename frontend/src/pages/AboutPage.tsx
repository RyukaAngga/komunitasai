import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Target,
  Shield,
  FileText,
  BookOpen,
  HelpCircle,
  Scale,
  ChevronDown,
  MessageSquare,
  Camera,
  ArrowRight
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Footer4Col from '@/components/ui/footer-column'
import { useChatStore } from '@/store/chatStore'

// ─── TABS DEFINITION ─────────────────────────────────────────────────────────
const tabs = [
  { id: 'visi', label: 'Visi & Misi', icon: Target },
  { id: 'panduan', label: 'Panduan Pengguna', icon: BookOpen },
  { id: 'faq', label: 'Tanya Jawab', icon: HelpCircle },
  { id: 'kebijakan', label: 'Kebijakan Privasi', icon: Shield },
  { id: 'syarat', label: 'Syarat Layanan', icon: Scale },
]

// ─── USER GUIDE STEPS ────────────────────────────────────────────────────────
const guideSteps = [
  {
    icon: MessageSquare,
    title: 'Konsultasi Asisten AI',
    description: 'Buka halaman obrolan utama untuk menanyakan informasi birokrasi, hukum, bantuan sosial, atau administrasi daerah.',
    tips: [
      'Gunakan bahasa sehari-hari yang mudah dipahami',
      'Sebutkan nama daerah Anda agar AI memberikan jawaban lebih akurat',
      'Asisten AI kami aktif selama 24 jam penuh setiap hari'
    ]
  },
  {
    icon: Shield,
    title: 'Verifikasi Kebenaran Berita',
    description: 'Gunakan alat cek hoaks di halaman depan untuk memeriksa kebenaran pesan berantai WhatsApp atau klaim berita yang beredar.',
    tips: [
      'Salin teks berita mencurigakan secara utuh',
      'Sistem mencocokkan informasi dengan basis data rujukan resmi',
      'Hindari menyebarkan berita yang belum terverifikasi kebenarannya'
    ]
  },
  {
    icon: FileText,
    title: 'Meringkas Dokumen Birokrasi',
    description: 'Punya dokumen peraturan daerah atau instruksi kerja yang panjang? Tempel teks ke modul ringkasan untuk memotong kata yang bertele-tele.',
    tips: [
      'Masukkan dokumen penting yang ingin Anda pelajari poin pentingnya',
      'Sistem akan merender diagram alir jika dokumen memuat alur proses',
      'Hemat waktu membaca hingga 90% dibanding membaca manual'
    ]
  },
  {
    icon: Camera,
    title: 'Kirim Laporan Aduan',
    description: 'Laporkan masalah sarana publik di lingkungan sekitar Anda secara resmi untuk diteruskan ke instansi terkait.',
    tips: [
      'Nyalakan izin lokasi GPS di browser Anda agar koordinat terdeteksi otomatis',
      'Ambil foto atau unggah gambar sebagai bukti visual aduan',
      'Tulis deskripsi kronologi kejadian dengan singkat dan jelas'
    ]
  }
]

// ─── FAQS ───────────────────────────────────────────────────────────────────
const faqs = [
  {
    q: 'Bagaimana cara menggunakan layanan KOMUNITAS?',
    a: 'Semua fitur di platform ini disediakan gratis untuk warga Indonesia. Anda bisa langsung menggunakan alat verifikasi di halaman utama atau masuk ke halaman obrolan untuk mulai bertanya kepada asisten AI.'
  },
  {
    q: 'Apakah data laporan aduan saya aman?',
    a: 'Ya. Seluruh data pribadi Anda, termasuk nomor telepon, foto lampiran aduan, dan titik lokasi GPS dilindungi dengan sistem enkripsi aman dan hanya dapat diakses oleh administrator resmi dari instansi terkait.'
  },
  {
    q: 'Mengapa saya wajib mengaktifkan GPS saat mengirimkan aduan?',
    a: 'Lokasi koordinat GPS diperlukan agar tim penanganan reaksi cepat di lapangan dapat mengetahui lokasi persis sarana fisik yang rusak atau tempat kejadian laporan tanpa terjadi kekeliruan lokasi.'
  },
  {
    q: 'Apakah jawaban dari asisten AI selalu akurat?',
    a: 'Asisten AI kami merujuk pada basis data informasi resmi instansi pemerintah. Namun, jawaban AI sebaiknya digunakan sebagai panduan awal. Untuk keputusan hukum atau administratif penting, kami menyarankan tetap melakukan konfirmasi ke instansi terkait.'
  },
  {
    q: 'Apakah diagram alir ringkasan dokumen dapat disimpan?',
    a: 'Diagram alir Mermaid.js dirender dalam format gambar SVG interaktif. Anda dapat mengambil tangkapan layar (screenshot) untuk dilampirkan pada materi presentasi atau laporan kerja Anda.'
  }
]

// ─── ACCORDION ITEM COMPONENT ────────────────────────────────────────────────
function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <div className="border-b border-zinc-800/60 py-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left py-3.5 text-[13.5px] font-medium text-zinc-200 hover:text-white transition-colors duration-200 cursor-pointer"
      >
        <span>{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="shrink-0 ml-4"
        >
          <ChevronDown className="w-4 h-4 text-zinc-500" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-[12.5px] text-zinc-400 leading-relaxed pb-4 font-light">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
export function AboutPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tabParam = searchParams.get('tab')
  const [activeTab, setActiveTab] = useState('visi')
  const { createSession, setCurrentSession } = useChatStore()

  useEffect(() => {
    if (tabParam && ['visi', 'panduan', 'faq', 'kebijakan', 'syarat'].includes(tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  const handleTabChange = (id: string) => {
    setActiveTab(id)
    setSearchParams({ tab: id })
  }

  const handleStartChat = () => {
    const id = createSession()
    setCurrentSession(id)
    navigate('/chat')
  }

  // Content animation variants
  const contentVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
    exit: { opacity: 0, y: -10, transition: { duration: 0.2, ease: 'easeIn' as const } }
  }

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-100 flex flex-col relative overflow-x-hidden bg-noise">
      
      {/* ── Header ── */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="fixed top-0 left-0 right-0 z-50 h-[60px] px-6 md:px-10 flex items-center justify-between border-b border-zinc-800/80 bg-zinc-950/85 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
      >
        {/* Brand logo & name */}
        <div 
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 select-none cursor-pointer group"
        >
          <img src="/assets/logo/komunitas.png" alt="KOMUNITAS Logo" className="h-7 w-7 object-contain rounded-md transition-opacity group-hover:opacity-85" />
          <span className="font-semibold text-[15px] tracking-[-0.02em] text-zinc-100">KOMUNITAS</span>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-7">
          <button
            className="text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors tracking-[-0.01em] cursor-pointer"
            onClick={() => {
              navigate('/')
              setTimeout(() => {
                document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
          >
            Layanan
          </button>
          <button
            className="text-[13px] text-zinc-400 hover:text-zinc-100 transition-colors tracking-[-0.01em] cursor-pointer"
            onClick={() => {
              navigate('/')
              setTimeout(() => {
                document.getElementById('tools-section')?.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
          >
            Verifikasi
          </button>
          <button
            className="text-[13px] text-zinc-100 font-semibold transition-colors tracking-[-0.01em] cursor-pointer"
            onClick={() => handleTabChange('visi')}
          >
            Tentang
          </button>
        </nav>

        {/* Action button */}
        <Button
          onClick={handleStartChat}
          className="h-8 px-4 text-[12px] font-medium rounded-md tracking-[-0.01em] transition-all active:scale-[0.97] bg-white hover:bg-zinc-100 text-zinc-900 shadow-none cursor-pointer"
        >
          Mulai Percakapan
        </Button>
      </motion.header>

      {/* ── Main Content Container ── */}
      <main className="relative z-10 flex-1 max-w-4xl w-full mx-auto px-6 pt-24 pb-28 flex flex-col gap-10">
        
        {/* ── Hero Section ── */}
        <section className="text-center space-y-4 max-w-2xl mx-auto pt-4">
          <h1 className="text-[28px] md:text-[36px] font-bold text-zinc-100 tracking-[-0.03em] leading-tight">
            Tentang KOMUNITAS
          </h1>
          <p className="text-[13.5px] text-zinc-400 font-light leading-relaxed">
            Platform pelayanan publik dan asisten AI terpadu untuk warga Indonesia. Temukan panduan lengkap penggunaan, visi misi kami, serta jawaban atas pertanyaan umum Anda.
          </p>
        </section>

        {/* ── Tabs Navigation Row ── */}
        <section className="w-full">
          <div className="w-full overflow-x-auto scrollbar-none border border-zinc-800/80 p-1 bg-zinc-900/30 backdrop-blur-sm rounded-xl">
            <div className="flex flex-nowrap gap-1 w-full">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center justify-center gap-2 py-2 px-3.5 text-[12.5px] font-medium rounded-lg transition-all duration-150 cursor-pointer whitespace-nowrap flex-1 min-w-max ${
                      isActive
                        ? 'bg-zinc-800 text-zinc-100 border border-zinc-700/50 shadow-sm'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/20'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Tab Content Box ── */}
        <section className="w-full min-h-[460px] bg-zinc-900/10 border border-zinc-800/80 rounded-xl p-6 md:p-10 backdrop-blur-sm">
          <AnimatePresence mode="wait">
            
            {/* ── Tab VISI & MISI ── */}
            {activeTab === 'visi' && (
              <motion.div
                key="visi"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
                className="space-y-8"
              >
                <div className="space-y-2.5">
                  <h2 className="text-[16px] font-semibold text-zinc-100 flex items-center gap-2">
                    <Target className="w-4 h-4 text-zinc-400" />
                    Visi & Misi Kami
                  </h2>
                  <p className="text-[12.5px] text-zinc-400 leading-relaxed font-light">
                    Misi kami adalah mendemokrasikan informasi publik dan mempermudah interaksi warga dengan prosedur birokrasi pemerintahan Indonesia secara merdeka dan bebas dari hoaks.
                  </p>
                </div>

                <div className="bg-zinc-900/20 border border-zinc-800/60 rounded-xl p-8 space-y-3 relative overflow-hidden">
                  <span className="text-[9.5px] font-semibold text-zinc-500 uppercase tracking-wider block">Visi Utama</span>
                  <p className="text-[16px] md:text-[18px] text-zinc-200 leading-relaxed font-light tracking-[-0.015em] max-w-3xl">
                    "Menyediakan akses informasi publik yang cepat, transparan, dan terpercaya untuk seluruh warga Indonesia melalui bantuan teknologi kecerdasan buatan."
                  </p>
                  <span className="text-[9px] text-zinc-650 font-mono tracking-wider block pt-2">KOMUNITAS VISI 2026</span>
                </div>

                <div className="space-y-4">
                  <span className="text-[9.5px] font-semibold text-zinc-500 uppercase tracking-wider block">Misi Operasional</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      'Membantu warga mendapatkan jawaban cepat seputar syarat administrasi daerah.',
                      'Melakukan klarifikasi otomatis atas hoaks dan berita bohong di internet.',
                      'Menyederhanakan naskah peraturan hukum menjadi poin yang mudah dibaca.',
                      'Menyediakan sistem laporan masalah sarana publik dengan titik koordinat presisi.'
                    ].map((m, idx) => (
                      <div 
                        key={idx} 
                        className="bg-zinc-900/10 border border-zinc-850 hover:border-zinc-800/80 transition-colors p-4 rounded-xl flex items-start gap-3.5"
                      >
                        <div className="w-5 h-5 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 shrink-0 font-mono mt-0.5">
                          {idx + 1}
                        </div>
                        <p className="text-[12.5px] text-zinc-400 leading-relaxed font-light">
                          {m}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── Tab PANDUAN PENGGUNA ── */}
            {activeTab === 'panduan' && (
              <motion.div
                key="panduan"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
                className="space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-[16px] font-semibold text-zinc-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-zinc-400" />
                    Panduan Pengguna
                  </h2>
                  <p className="text-[12.5px] text-zinc-400 leading-relaxed font-light">
                    Pelajari langkah mudah menggunakan fitur-fitur unggulan yang tersedia di platform kami.
                  </p>
                </div>

                <div className="relative border-l border-zinc-800 pl-6 ml-4 space-y-8 py-2">
                  {guideSteps.map((step, idx) => {
                    const StepIcon = step.icon
                    return (
                      <div 
                        key={idx}
                        className="relative group transition-all duration-300"
                      >
                        {/* Bullet step number indicator */}
                        <div className="absolute -left-[35px] top-1.5 w-6 h-6 rounded-full bg-[#060608] border border-zinc-800 flex items-center justify-center group-hover:border-zinc-700 transition-colors shrink-0">
                          <span className="text-[11px] font-bold text-zinc-400 group-hover:text-zinc-200">{idx + 1}</span>
                        </div>

                        <div className="space-y-3">
                          <div className="flex items-center gap-3">
                            <StepIcon className="w-4 h-4 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                            <h3 className="text-[14px] font-semibold text-zinc-200 tracking-[-0.01em]">
                              {step.title}
                            </h3>
                          </div>
                          <p className="text-[12.5px] text-zinc-400 leading-relaxed font-light max-w-2xl">
                            {step.description}
                          </p>
                          <div className="flex flex-wrap gap-2 pt-1.5">
                            {step.tips.map((tip, tipIdx) => (
                              <div key={tipIdx} className="bg-zinc-900/40 border border-zinc-850 rounded px-2.5 py-1 text-[11px] text-zinc-500 hover:text-zinc-400 hover:border-zinc-800 transition-colors flex items-center gap-1.5 font-light">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-650" />
                                <span>{tip}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* ── Tab FAQ ── */}
            {activeTab === 'faq' && (
              <motion.div
                key="faq"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <h2 className="text-[16px] font-semibold text-zinc-100 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-zinc-400" />
                    Pertanyaan yang Sering Diajukan (FAQ)
                  </h2>
                  <p className="text-[12.5px] text-zinc-400 leading-relaxed font-light">
                    Temukan jawaban atas kendala dan informasi dasar yang sering ditanyakan oleh para pengguna platform kami.
                  </p>
                </div>

                <div className="space-y-1 pt-2 max-w-3xl">
                  {faqs.map((faq, idx) => (
                    <FAQItem key={idx} question={faq.q} answer={faq.a} />
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Tab KEBIJAKAN PRIVASI ── */}
            {activeTab === 'kebijakan' && (
              <motion.div
                key="kebijakan"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <h2 className="text-[16px] font-semibold text-zinc-100 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-zinc-400" />
                    Kebijakan Privasi
                  </h2>
                  <p className="text-[11px] text-zinc-550 font-mono uppercase tracking-wider">
                    Pembaruan Terakhir: 24 Juni 2026
                  </p>
                  <p className="text-[12.5px] text-zinc-400 leading-relaxed font-light max-w-2xl">
                    Kebijakan Privasi ini menjelaskan bagaimana platform KOMUNITAS mengumpulkan, melindungi, dan menggunakan informasi Anda saat menggunakan layanan kami. Kami berkomitmen menjaga keamanan data pribadi warga sesuai dengan undang-undang perlindungan data yang berlaku di Indonesia.
                  </p>
                </div>

                <div className="h-px bg-zinc-800/80" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {[
                    {
                      title: 'Pengumpulan Data',
                      desc: 'Kami hanya mengumpulkan data yang Anda berikan secara sadar dan sukarela, seperti nomor telepon, gambar visual aduan, serta koordinat lokasi GPS saat menggunakan fitur Laporan Warga.'
                    },
                    {
                      title: 'Penggunaan Data',
                      desc: 'Data yang masuk digunakan sepenuhnya untuk memvalidasi laporan aduan Anda, memetakannya pada GIS Admin daerah, dan memberikan respon asisten AI yang akurat.'
                    },
                    {
                      title: 'Perlindungan & Kerahasiaan',
                      desc: 'Semua berkas aduan dan informasi warga disimpan dalam database aman terenkripsi di server kami. Kami tidak pernah menjual atau membagikan data Anda kepada pihak ketiga tanpa izin resmi.'
                    },
                    {
                      title: 'Izin Perangkat',
                      desc: 'Fitur pelaporan membutuhkan izin akses kamera browser untuk mengambil foto asli kejadian dan izin lokasi GPS untuk memetakan pin koordinat laporan secara presisi.'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-2 pl-3.5 border-l border-zinc-800 hover:border-zinc-700 transition-colors">
                      <h3 className="text-[13px] font-semibold text-zinc-200">
                        {item.title}
                      </h3>
                      <p className="text-[12px] text-zinc-400 leading-relaxed font-light">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Tab SYARAT LAYANAN ── */}
            {activeTab === 'syarat' && (
              <motion.div
                key="syarat"
                initial="hidden"
                animate="visible"
                exit="exit"
                variants={contentVariants}
                className="space-y-8"
              >
                <div className="space-y-3">
                  <h2 className="text-[16px] font-semibold text-zinc-100 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-zinc-400" />
                    Syarat Ketentuan Layanan
                  </h2>
                  <p className="text-[11px] text-zinc-550 font-mono uppercase tracking-wider">
                    Pembaruan Terakhir: 24 Juni 2026
                  </p>
                  <p className="text-[12.5px] text-zinc-400 leading-relaxed font-light max-w-2xl">
                    Dengan accessing dan menggunakan platform KOMUNITAS, Anda setuju untuk terikat oleh Syarat Ketentuan Layanan ini. Harap baca seluruh aturan berikut dengan bijak.
                  </p>
                </div>

                <div className="h-px bg-zinc-800/80" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {[
                    {
                      title: 'Kelayakan Layanan',
                      desc: 'Layanan ini disediakan gratis untuk warga Indonesia. Setiap pengguna wajib menyampaikan informasi yang benar dan tidak bermaksud merusak ketertiban umum.'
                    },
                    {
                      title: 'Batasan Penggunaan',
                      desc: 'Dilarang keras menyebarkan berita bohong (hoaks) yang disengaja, konten fitnah, pornografi, kebencian bermuansa SARA, atau ancaman kekerasan melalui layanan aduan.'
                    },
                    {
                      title: 'Tanggung Jawab Jawaban AI',
                      desc: 'Jawaban dari asisten AI diproses otomatis berdasarkan rujukan data pemerintah. Jawaban ini digunakan sebagai panduan awal dan bukan pengganti saran resmi perundang-undangan.'
                    },
                    {
                      title: 'Penangguhan Layanan',
                      desc: 'Kami berhak menonaktifkan akun atau memblokir akses pengguna yang menyalahgunakan layanan ini secara berulang untuk kepentingan yang melanggar hukum.'
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="space-y-2 pl-3.5 border-l border-zinc-800 hover:border-zinc-700 transition-colors">
                      <h3 className="text-[13px] font-semibold text-zinc-200">
                        {item.title}
                      </h3>
                      <p className="text-[12px] text-zinc-400 leading-relaxed font-light">
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </section>

        {/* ── Call To Action Box ── */}
        <section className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-7 flex flex-col sm:flex-row items-center justify-between gap-5 hover:border-zinc-850 transition-all duration-300">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="text-[14px] font-semibold text-zinc-100 tracking-[-0.02em]">Butuh Bantuan Langsung?</h3>
            <p className="text-[12px] text-zinc-500 font-light leading-relaxed">
              Mulai konsultasi langsung dengan asisten AI kami mengenai berbagai prosedur birokrasi.
            </p>
          </div>
          <button
            onClick={() => navigate('/chat')}
            className="flex items-center gap-2 bg-zinc-100 hover:bg-white text-zinc-900 text-[12px] font-medium px-5 py-2.5 rounded-md tracking-[-0.01em] transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            Mulai Obrolan AI
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </section>

      </main>

      {/* ── Footer ── */}
      <Footer4Col />
    </div>
  )
}

export default AboutPage
