import { AnimatePresence, motion } from 'framer-motion'
import { Conta } from '@/types'
import { BillItem } from '@/components/BillItem/BillItem'
import { formatBRL } from '@/lib/utils'

interface Props {
  contas: Conta[]
  onTogglePago: (id: string, pago: boolean) => void
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => void
  onAdd: () => void
}

const CATEGORIAS = [
  { key: 'fixo' as const, label: 'Compromissos fixos' },
  { key: 'cartao' as const, label: 'Cartões / Parcelas' },
  { key: 'extra' as const, label: 'Extras do mês' },
]

export function BillList({ contas, onTogglePago, onEdit, onDelete, onAdd }: Props) {
  if (contas.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 text-center space-y-5"
      >
        <div
          className="w-16 h-16 rounded-[18px] flex items-center justify-center text-3xl"
          style={{ background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.15)' }}
        >
          📋
        </div>
        <div className="space-y-1.5">
          <p className="font-medium text-[15px]" style={{ color: 'var(--text-primary)' }}>Nenhuma conta cadastrada</p>
          <p className="text-[13px] max-w-[220px] mx-auto leading-relaxed" style={{ color: 'var(--text-subtle)' }}>
            Registre suas despesas e acompanhe o que falta pagar
          </p>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-5 h-10 rounded-[14px] text-[14px] font-medium text-white transition-opacity hover:opacity-80"
          style={{
            background: 'linear-gradient(135deg, #7F77DD, #534AB7)',
            boxShadow: '0 6px 24px rgba(127,119,221,0.3)',
          }}
        >
          + Adicionar primeira conta
        </button>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {CATEGORIAS.map(({ key, label }) => {
        const grupo = contas.filter(c => c.categoria === key)
        if (grupo.length === 0) return null

        const totalGrupo = grupo.reduce((sum, c) => sum + c.valor, 0)

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Section header — flat, above card */}
            <div className="flex items-center justify-between mb-2 px-[2px]">
              <div className="flex items-center gap-2">
                <span
                  className="text-[11px] font-medium uppercase"
                  style={{ color: 'var(--text-muted)', letterSpacing: '0.08em' }}
                >
                  {label}
                </span>
                <span
                  className="text-[10px] px-2 py-[2px] rounded-full"
                  style={{ background: 'var(--glass-bg)', color: 'var(--text-muted)' }}
                >
                  {grupo.length}
                </span>
              </div>
              <span className="text-[13px] font-medium" style={{ color: 'var(--text-muted)' }}>
                {formatBRL(totalGrupo)}
              </span>
            </div>

            {/* Bills card */}
            <div
              className="rounded-[16px] overflow-hidden"
              style={{
                background: 'var(--bills-bg)',
                border: '0.5px solid var(--bills-border)',
              }}
            >
              <AnimatePresence>
                {grupo.map(conta => (
                  <BillItem
                    key={conta.id}
                    conta={conta}
                    onTogglePago={onTogglePago}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
