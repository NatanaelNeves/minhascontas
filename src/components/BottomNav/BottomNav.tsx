import { motion } from 'framer-motion'
import { Home, Receipt, CreditCard, Building2, TrendingUp } from 'lucide-react'
import { AbaAtiva } from '@/types'

interface Tab {
  id: AbaAtiva
  label: string
  icon: React.ElementType
}

const TABS: Tab[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'contas', label: 'Contas', icon: Receipt },
  { id: 'gastos', label: 'Gastos', icon: CreditCard },
  { id: 'bancos', label: 'Bancos', icon: Building2 },
  { id: 'receber', label: 'A Receber', icon: TrendingUp },
]

interface Props {
  ativa: AbaAtiva
  onChange: (aba: AbaAtiva) => void
}

export function BottomNav({ ativa, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 flex items-center justify-around z-50"
      style={{
        background: 'var(--bg-surface)',
        borderTop: '0.5px solid var(--border)',
        height: 56,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(tab => {
        const isActive = tab.id === ativa
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 relative"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)', minWidth: 60 }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="tab-dot"
                className="absolute -bottom-1 w-1 h-1 rounded-full"
              style={{ background: 'var(--green)' }}
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
