import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useChat } from '@/hooks/useChat'
import { useChatStore } from '@/store/chatStore'
import { ChatMessage } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ChatHeader } from './ChatHeader'
import { ChatSidebar } from './ChatSidebar'
import { CitizenReportModal } from './CitizenReportModal'
import { SearchResultsSidebar } from './SearchResultsSidebar'
import { Button } from '@/components/ui/button'
import { Home, Menu, X, FileText, Activity, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

// Suggested prompts for empty state
const SUGGESTED = [
  { icon: Users,    text: 'Bagaimana cara melapor kekerasan anak ke KPAI?',    label: 'Perlindungan Anak' },
  { icon: FileText, text: 'Apa saja syarat mendaftar bantuan sosial PKH?',      label: 'Bansos & PKH' },
  { icon: Activity, text: 'Kontak darurat ambulans PMI di daerah saya',          label: 'Kesehatan Darurat' },
]

export function ChatInterface() {
  const { 
    messages, 
    isLoading, 
    sendMessage, 
    error, 
    clearError,
    searchPhase,
    streamingMessageId
  } = useChat()

  const { isSidebarOpen, toggleSidebar, sessions, currentSessionId, createSession, setCurrentSession } = useChatStore()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isReportModalOpen, setIsReportModalOpen] = useState(false)
  const [isSearchSidebarOpen, setIsSearchSidebarOpen] = useState(false)
  const [activeSearchResults, setActiveSearchResults] = useState<any[]>([])
  const [sidebarWidth, setSidebarWidth] = useState(260)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true)
  const lastMessageCountRef = useRef(messages.length)
  const isResizingRef = useRef(false)
  const navigate = useNavigate()

  const handleOpenSearchResults = useCallback((results: any[]) => {
    setActiveSearchResults(results)
    setIsSearchSidebarOpen(true)
  }, [])

  const handleScroll = useCallback(() => {
    const container = scrollContainerRef.current
    if (!container) return
    
    const threshold = 150
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight <= threshold
    
    setShouldAutoScroll(isAtBottom)
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isResizingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return
      
      const newWidth = e.clientX
      const minWidth = 200
      const maxWidth = Math.max(280, window.innerWidth * 0.25) // Max 25% area
      
      if (newWidth >= minWidth && newWidth <= maxWidth) {
         setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [])

  useEffect(() => {
    if (!currentSessionId) {
      if (sessions.length > 0) {
        setCurrentSession(sessions[0].id)
      } else {
        const id = createSession()
        setCurrentSession(id)
      }
    }
  }, [currentSessionId, sessions, createSession, setCurrentSession])

  useEffect(() => {
    if (messages.length > lastMessageCountRef.current) {
      const lastMsg = messages[messages.length - 1]
      if (lastMsg && lastMsg.role === 'user') {
        setShouldAutoScroll(true)
      }
    }
    lastMessageCountRef.current = messages.length
  }, [messages])

  useEffect(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isLoading, shouldAutoScroll])

  useEffect(() => {
    if (error) {
      const t = setTimeout(clearError, 5000)
      return () => clearTimeout(t)
    }
  }, [error, clearError])

  useEffect(() => {
    setIsSearchSidebarOpen(false)
  }, [currentSessionId])

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative">

      {/* ── Desktop Sidebar ────────────────────────────────────────────────── */}
      <div 
        style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }}
        className={cn(
          'hidden lg:block shrink-0 overflow-hidden'
        )}
      >
        <ChatSidebar onOpenReportModal={() => setIsReportModalOpen(true)} />
      </div>

      {/* Drag Handle Divider */}
      {isSidebarOpen && (
        <div
          onMouseDown={handleMouseDown}
          className="hidden lg:block w-1 h-full hover:bg-zinc-700 active:bg-indigo-600 cursor-col-resize shrink-0 transition-colors duration-150 relative z-30"
          title="Geser untuk mengubah ukuran sidebar"
        >
          <div className="absolute inset-y-0 left-[1px] w-[1px] bg-zinc-800/50" />
        </div>
      )}

      {/* ── Mobile Sidebar Overlay ────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="lg:hidden fixed top-0 left-0 h-full w-64 z-50 shadow-xl"
            >
              <ChatSidebar onOpenReportModal={() => { setIsReportModalOpen(true); setIsMobileSidebarOpen(false) }} />
              <button
                className="absolute top-3.5 right-3 text-zinc-400 hover:text-zinc-100 transition-colors"
                onClick={() => setIsMobileSidebarOpen(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main Chat Area ────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">

        {/* Header */}
        <ChatHeader>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md"
            onClick={toggleSidebar}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-md"
            onClick={() => navigate('/')}
          >
            <Home className="w-4 h-4" />
          </Button>
        </ChatHeader>

        {/* Error toast */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mx-4 mt-3 p-3 rounded-lg border border-rose-800 bg-rose-950/50 text-rose-400 text-[12px] text-center"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              className="h-full flex flex-col items-center justify-center px-4 text-center select-none"
            >
              {/* Icon */}
              <img src="/assets/logo/komunitas.png" alt="KOMUNITAS Logo" className="w-10 h-10 object-contain rounded-md mb-5" />

              {/* Copy */}
              <h3 className="text-[17px] font-semibold text-zinc-100 tracking-[-0.03em] mb-2">
                Selamat datang di KOMUNITAS
              </h3>
              <p className="text-[13px] text-zinc-500 leading-relaxed max-w-xs mb-8">
                Tanyakan apa saja seputar layanan publik, perlindungan sosial, atau validasi informasi.
              </p>

              {/* Suggestions */}
              <div className="flex flex-col gap-2 w-full max-w-sm">
                {SUGGESTED.map((s, i) => {
                  const Icon = s.icon
                  return (
                    <motion.button
                      key={i}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.08 + 0.2, duration: 0.3 }}
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 hover:border-zinc-700 text-left transition-all duration-200"
                      onClick={() => sendMessage(s.text)}
                    >
                      <div className="w-7 h-7 rounded-lg bg-zinc-800 border border-zinc-700 group-hover:border-zinc-600 flex items-center justify-center shrink-0 transition-colors">
                        <Icon className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-colors" />
                      </div>
                      <div>
                        <p className="text-[11px] text-zinc-500 font-medium tracking-wide mb-0.5">{s.label}</p>
                        <p className="text-[12px] text-zinc-300 leading-snug">{s.text}</p>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </motion.div>
          ) : (
            <div className="max-w-5xl mx-auto w-full py-4 pb-32 px-4 md:px-6">
              {messages.map((message, index) => (
                <ChatMessage 
                  key={message.id || index} 
                  message={message} 
                  isStreaming={message.id === streamingMessageId}
                  searchPhase={message.id === streamingMessageId ? searchPhase : null}
                  onOpenSearchResults={handleOpenSearchResults}
                />
              ))}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-zinc-800 bg-gradient-to-t from-zinc-950 via-zinc-950/98 to-transparent pt-2 pb-4 px-4 md:px-6 w-full max-w-5xl mx-auto z-10">
          <ChatInput onSend={sendMessage} isLoading={isLoading} />
        </div>
      </div>

      {/* Search Results Sidebar */}
      <AnimatePresence>
        {isSearchSidebarOpen && (
          <SearchResultsSidebar 
            isOpen={isSearchSidebarOpen} 
            onClose={() => setIsSearchSidebarOpen(false)} 
            results={activeSearchResults}
          />
        )}
      </AnimatePresence>

      {/* Report Modal */}
      <CitizenReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} />
    </div>
  )
}

export default ChatInterface
