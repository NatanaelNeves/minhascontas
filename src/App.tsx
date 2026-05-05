import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'
import { History } from '@/pages/History'

export default function App() {
  const { user, isLoading } = useAuth()
  const { currentPage } = useAppStore()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Login />
  if (currentPage === 'history') return <History userId={user.uid} />
  return <Dashboard userId={user.uid} />
}
