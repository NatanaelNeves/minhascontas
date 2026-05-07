import { motion } from 'framer-motion'
import { Home, Receipt, TrendingDown, Building2, TrendingUp, Wallet } from 'lucide-react'
import { AbaAtiva } from '@/types'

interface Tab {
  id: AbaAtiva
  label: string
  icon: React.ElementType
}

const TABS: Tab[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'contas', label: 'Contas', icon: Receipt },
  { id: 'gastos', label: 'Gastos', icon: TrendingDown },
  { id: 'bancos', label: 'Bancos', icon: Building2 },
  { id: 'receber', label: 'A Receber', icon: TrendingUp },
  { id: 'cartoes', label: 'Cartões', icon: Wallet },
]

interface Props {
  ativa: AbaAtiva
  onChange: (aba: AbaAtiva) => void
}

export function BottomNav({ ativa, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-50"
      style={{
        background: 'var(--bg-surface)',
        borderTop: '0.5px solid var(--border)',
        height: 56,
        paddingBottom: 'env(safe-area-inset-bottom)',
        overflowX: 'auto',
        scrollbarWidth: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          minWidth: 'max-content',
          height: '100%',
          paddingLeft: 4,
          paddingRight: 4,
        }}
      >
        {TABS.map(tab => {
          const isActive = tab.id === ativa
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '6px 12px', position: 'relative',
                color: isActive ? 'var(--text-primary)' : 'var(--text-tertiary)',
                minWidth: 56, flex: '1 0 56px',
                border: 'none', background: 'transparent', cursor: 'pointer',
                transition: 'color .15s',
              }}
            >
              <Icon style={{ width: 18, height: 18 }} />
              <span style={{ fontSize: 9, fontWeight: 500, lineHeight: 1, letterSpacing: '0.01em' }}>
                {tab.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="tab-dot"
                  style={{
                    position: 'absolute', bottom: -1,
                    width: 4, height: 4, borderRadius: '50%',
                    background: 'var(--green)',
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
