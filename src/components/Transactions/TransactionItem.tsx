import { Pencil, Trash2 } from 'lucide-react'
import { Transacao, BancoComSaldo, CategoriaGasto } from '@/types'
import { formatBRL } from '@/lib/utils'

const CATEGORIA_EMOJI: Record<CategoriaGasto, string> = {
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
  const emoji = t.tipo === 'gasto' ? CATEGORIA_EMOJI[t.categoria] : '💰'

  return (
    <div className="flex items-center gap-3 py-2.5 px-4">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
        style={{ background: 'var(--bg-elevated)' }}
      >
        {emoji}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
          {t.descricao}
        </p>
        {banco && (
          <span
            className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-0.5"
            style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
          >
            {banco.nome}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-sm font-semibold"
          style={{ color: t.tipo === 'gasto' ? 'var(--red)' : 'var(--green)' }}
        >
          {t.tipo === 'gasto' ? '-' : '+'}{formatBRL(t.valor)}
        </span>
        {!isReadOnly && (
          <>
            <button onClick={() => onEdit(t)} style={{ color: 'var(--text-tertiary)' }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(t.id)} style={{ color: 'var(--text-tertiary)' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
