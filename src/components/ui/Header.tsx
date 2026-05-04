import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

function formatMes(mesId: string): string {
  const [year, month] = mesId.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function prevMes(mesId: string): string {
  const [year, month] = mesId.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMes(mesId: string): string {
  const [year, month] = mesId.split('-').map(Number)
  const d = new Date(year, month, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function Header() {
  const { user, logout } = useAuth()
  const { mesAtivo, setMesAtivo } = useAppStore()

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMesAtivo(prevMes(mesAtivo))}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-white font-semibold capitalize min-w-[160px] text-center text-sm">
            {formatMes(mesAtivo)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMesAtivo(nextMes(mesAtivo))}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
              className="w-7 h-7 rounded-full"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-zinc-400 hover:text-red-400"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
