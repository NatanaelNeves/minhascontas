import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { BancoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  banco: BancoComSaldo
  onEdit: (banco: BancoComSaldo) => void
  onDelete: (id: string) => void
}

export function BankCard({ banco, onEdit, onDelete }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{banco.nome}</span>
        <div className="flex gap-2">
          <button onClick={() => onEdit(banco)} style={{ color: 'var(--text-tertiary)' }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(banco.id)} style={{ color: 'var(--text-tertiary)' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ color: banco.saldoAtual >= 0 ? 'var(--text-primary)' : 'var(--red)' }}
      >
        {formatBRL(banco.saldoAtual)}
      </span>
      <div className="flex gap-4 text-xs">
        <span style={{ color: 'var(--green)' }}>↑ {formatBRL(banco.entradas)}</span>
        <span style={{ color: 'var(--red)' }}>↓ {formatBRL(banco.gastos)}</span>
      </div>
    </motion.div>
  )
}
