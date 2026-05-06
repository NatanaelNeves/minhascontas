import { Pencil, Trash2 } from 'lucide-react'
import { Transacao, BancoComSaldo, CategoriaGasto } from '@/types'
import { formatBRL } from '@/lib/utils'

const CATEGORIA_LABEL: Record<CategoriaGasto, string> = {
  alimentacao: '🍔',
  transporte: '🚗',
  saude: '💊',
  lazer: '🎮',
  educacao: '📚',
  moradia: '🏠',
  vestuario: '👕',
  servicos: '⚡',
  despesaFixa: '📋',
  outros: '📦',
}

interface Props {
  transacao: Transacao
  bancos: BancoComSaldo[]
  onEdit: (t: Transacao) => void
  onDelete: (id: string) => void
}

export function TransactionItem({ transacao: t, bancos, onEdit, onDelete }: Props) {
  const banco = bancos.find(b => b.id === t.bancoId)
  const isReadOnly = !!t.origem

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-xl leading-none">
        {t.tipo === 'gasto' ? CATEGORIA_LABEL[t.categoria] : '💰'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{t.descricao}</p>
        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
          {banco?.nome ?? '—'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-sm font-semibold"
          style={{ color: t.tipo === 'gasto' ? '#EF4444' : '#10B981' }}
        >
          {t.tipo === 'gasto' ? '-' : '+'}{formatBRL(t.valor)}
        </span>
        {!isReadOnly && (
          <>
            <button onClick={() => onEdit(t)} style={{ color: 'var(--text-subtle)' }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(t.id)} style={{ color: 'var(--text-subtle)' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
