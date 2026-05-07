import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Transacao, BancoComSaldo, CategoriaGasto } from '@/types'
import { formatBRL } from '@/lib/utils'
import { ConfirmDeleteModal } from '@/components/Modals/ConfirmDeleteModal'

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
  const [hovered, setHovered] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const banco = bancos.find(b => b.id === t.bancoId)
  const isReadOnly = !!t.origem
  const emoji = t.tipo === 'gasto' ? CATEGORIA_EMOJI[t.categoria] : '💰'

  return (
    <>
      <div
        className="flex items-center gap-3 py-2.5 px-4 group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
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
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {banco && (
              <span
                className="inline-block text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
              >
                {banco.nome}
              </span>
            )}
            <span
              className="inline-block text-[10px]"
              style={{ color: 'var(--text-disabled)' }}
            >
              {t.data}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: t.tipo === 'gasto' ? 'var(--red)' : 'var(--green)' }}
          >
            {t.tipo === 'gasto' ? '-' : '+'}{formatBRL(t.valor)}
          </span>
          {!isReadOnly && (
            <div
              className="flex items-center gap-1"
              style={{
                opacity: hovered ? 1 : 0,
                transition: 'opacity .15s',
              }}
            >
              <button
                onClick={() => onEdit(t)}
                className="w-6 h-6 flex items-center justify-center rounded"
                style={{ color: 'var(--text-tertiary)', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="w-6 h-6 flex items-center justify-center rounded"
                style={{ color: 'var(--text-tertiary)', transition: 'color .12s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmOpen}
        titulo="Excluir lançamento?"
        descricao="Este lançamento será removido permanentemente."
        onConfirm={() => onDelete(t.id)}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}
