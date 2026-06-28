import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { authService } from '@/services/auth'

interface AdminGuardProps {
  children: React.ReactNode
}

/**
 * Komponen guard yang melindungi route /admin
 * Redirect ke /admin/login jika user belum login
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')

  useEffect(() => {
    authService.getSession().then(session => {
      setStatus(session ? 'authenticated' : 'unauthenticated')
    })

    // Listen perubahan auth state (login/logout)
    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      setStatus(session ? 'authenticated' : 'unauthenticated')
    })

    return () => subscription.unsubscribe()
  }, [])

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#080808]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-white/20" />
          <p className="text-sm text-white/30">Memeriksa sesi...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
