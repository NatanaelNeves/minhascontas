import { useAuth } from '@/hooks/useAuth'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'

export default function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return user ? <Dashboard userId={user.uid} /> : <Login />
}
