import { useState, useEffect } from 'react'
import { useChatStore } from '@/store/chatStore'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { AlertTriangle, Plus, MessageSquare, Trash2, MoreHorizontal, Edit3 } from 'lucide-react'
import { cn, formatDate } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'

interface ChatSidebarProps {
  onOpenReportModal?: () => void
}

export function ChatSidebar({ onOpenReportModal }: ChatSidebarProps) {
  const { 
    sessions, 
    currentSessionId, 
    createSession, 
    setCurrentSession, 
    deleteSession,
    renameSession 
  } = useChatStore()

  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null)
  const [deleteConfirmSessionId, setDeleteConfirmSessionId] = useState<string | null>(null)

  // Close menu on click outside
  useEffect(() => {
    if (!activeMenuSessionId) return
    const handleOutsideClick = () => {
      setActiveMenuSessionId(null)
    }
    // Listen on document
    document.addEventListener('click', handleOutsideClick)
    return () => {
      document.removeEventListener('click', handleOutsideClick)
    }
  }, [activeMenuSessionId])

  return (
    <div className="w-full h-full flex flex-col bg-zinc-900 border-r border-zinc-800 text-zinc-100">

      {/* ── Brand ─── */}
      <div className="h-[60px] px-4 flex items-center gap-2.5 border-b border-zinc-800 shrink-0">
        <img src="/assets/logo/komunitas.png" alt="KOMUNITAS Logo" className="h-6 w-6 object-contain rounded-md" />
        <span className="font-semibold text-[14px] text-zinc-100 tracking-[-0.02em]">KOMUNITAS</span>
      </div>

      {/* ── Actions ─── */}
      <div className="p-3 space-y-2 border-b border-zinc-800 shrink-0">
        <Button
          className="w-full gap-2 h-9 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 font-medium text-[12px] rounded-md transition-all active:scale-[0.98] tracking-[-0.01em]"
          onClick={() => createSession()}
        >
          <Plus className="w-3.5 h-3.5" />
          Chat Baru
        </Button>

        {onOpenReportModal && (
          <Button
            variant="outline"
            className="w-full gap-2 h-9 border-zinc-700 text-zinc-400 hover:text-zinc-100 hover:border-zinc-600 hover:bg-zinc-800 bg-transparent transition-all rounded-md text-[12px] tracking-[-0.01em]"
            onClick={onOpenReportModal}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            Lapor Warga
          </Button>
        )}
      </div>

      {/* ── History list ─── */}
      <ScrollArea className="flex-1 px-2 py-3">
        {sessions.length === 0 ? (
          <div className="text-center py-14 px-4 space-y-2">
            <MessageSquare className="w-7 h-7 mx-auto text-zinc-700" />
            <p className="text-[12px] text-zinc-500 font-medium">Belum ada percakapan</p>
            <p className="text-[11px] text-zinc-600 leading-relaxed">Mulai dengan menekan "Chat Baru"</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((session) => {
              const isActive = currentSessionId === session.id
              const isEditing = editingSessionId === session.id

              return (
                <div
                  key={session.id}
                  className={cn(
                    'group relative flex items-center gap-2.5 pl-3 pr-8 py-2.5 rounded-md cursor-pointer transition-all duration-150',
                    isActive
                      ? 'bg-zinc-800 text-zinc-100'
                      : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/50'
                  )}
                  onClick={() => {
                    if (!isEditing) {
                      setCurrentSession(session.id)
                    }
                  }}
                >
                  <MessageSquare className={cn('w-3.5 h-3.5 flex-shrink-0', isActive ? 'text-zinc-300' : 'text-zinc-600 group-hover:text-zinc-400')} />
                  
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.stopPropagation()
                            if (editTitle.trim()) {
                              renameSession(session.id, editTitle.trim())
                            }
                            setEditingSessionId(null)
                          } else if (e.key === 'Escape') {
                            e.stopPropagation()
                            setEditingSessionId(null)
                          }
                        }}
                        onBlur={() => {
                          if (editTitle.trim()) {
                            renameSession(session.id, editTitle.trim())
                          }
                          setEditingSessionId(null)
                        }}
                        autoFocus
                        className="w-full bg-zinc-950 border border-zinc-700 rounded px-1.5 py-0.5 text-[11.5px] text-zinc-200 focus:outline-none focus:border-zinc-500"
                      />
                    ) : (
                      <>
                        <div className="text-[12px] font-medium truncate tracking-[-0.01em]">
                          {session.title || 'Percakapan baru'}
                        </div>
                        <div className="text-[9.5px] text-zinc-600 mt-0.5 font-mono">
                          {formatDate(session.updatedAt)}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Three dots actions menu */}
                  {!isEditing && (
                    <div 
                      className={cn(
                        "absolute right-1 top-1/2 -translate-y-1/2 z-10 transition-all duration-150 flex items-center pl-5 rounded-r-md",
                        "opacity-0 group-hover:opacity-100",
                        (isActive || activeMenuSessionId === session.id) && "opacity-100",
                        isActive 
                          ? "bg-gradient-to-l from-zinc-800 via-zinc-800/95 to-transparent" 
                          : "bg-gradient-to-l from-zinc-900 via-zinc-900/95 to-transparent group-hover:from-zinc-800/50 group-hover:via-zinc-800/40"
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className={cn(
                          "p-1 text-zinc-500 hover:text-zinc-300 rounded transition-all cursor-pointer",
                          isActive ? "bg-zinc-800" : "bg-zinc-900 group-hover:bg-zinc-800/50"
                        )}
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveMenuSessionId(activeMenuSessionId === session.id ? null : session.id)
                        }}
                        aria-label="Aksi obrolan"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
 
                      {activeMenuSessionId === session.id && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl z-20 py-1 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                          <button
                            className="w-full text-left px-3 py-1.5 text-[11.5px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditingSessionId(session.id)
                              setEditTitle(session.title)
                              setActiveMenuSessionId(null)
                            }}
                          >
                            <Edit3 className="w-3 h-3 text-zinc-500" />
                            Ubah Nama
                          </button>
                          <button
                            className="w-full text-left px-3 py-1.5 text-[11.5px] text-rose-400 hover:bg-rose-950/50 hover:text-rose-300 flex items-center gap-1.5 transition-colors whitespace-nowrap cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteConfirmSessionId(session.id)
                              setActiveMenuSessionId(null)
                            }}
                          >
                            <Trash2 className="w-3 h-3" />
                            Hapus
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirmSessionId !== null} 
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmSessionId(null)
        }}
      >
        <DialogContent className="sm:max-w-[420px] bg-zinc-900 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-zinc-100 font-semibold text-[15px] tracking-tight">Hapus Riwayat Chat</DialogTitle>
            <DialogDescription className="text-zinc-400 text-[12.5px] leading-relaxed pt-2">
              Apakah Anda yakin ingin menghapus riwayat percakapan ini? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmSessionId(null)}
              className="bg-transparent border-zinc-700 text-zinc-300 hover:bg-zinc-850 hover:text-zinc-100 text-[12px] h-9"
            >
              Batal
            </Button>
            <Button
              onClick={() => {
                if (deleteConfirmSessionId) {
                  deleteSession(deleteConfirmSessionId)
                  setDeleteConfirmSessionId(null)
                }
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white border-none text-[12px] h-9"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
