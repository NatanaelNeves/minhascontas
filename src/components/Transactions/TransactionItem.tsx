import { useState } from 'react'
import { Pencil, Trash2, RefreshCw, ArrowRightLeft } from 'lucide-react'
import { Transacao, BancoComSaldo, CategoriaGasto, Cartao } from '@/types'
import { formatBRL } from '@/lib/utils'
import { ConfirmDeleteModal } from '@/components/Modals/ConfirmDeleteModal'
import { getLabelTipoCartao, isCartaoCredito } from '@/lib/cartoes'

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
  cartoes: Cartao[]
  onEdit: (t: Transacao) => void
  onDelete: (id: string) => void
  onCancelarRecorrente?: (recorrenteId: string) => void
}

export function TransactionItem({ transacao: t, bancos, cartoes, onEdit, onDelete, onCancelarRecorrente }: Props) {
  const [hovered, setHovered] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmCancelRec, setConfirmCancelRec] = useState(false)
  const isTransferencia = t.origem?.tipo === 'transferencia'
  const banco = bancos.find(b => b.id === t.bancoId)
  const bancoDest = isTransferencia && t.transferDestBancoId ? bancos.find(b => b.id === t.transferDestBancoId) : null
  const cartao = t.cartaoId ? cartoes.find(c => c.id === t.cartaoId) ?? null : null
  const labelOrigem = isTransferencia
    ? banco && bancoDest ? `${banco.nome} → ${bancoDest.nome}` : banco?.nome
    : cartao
      ? `${cartao.nome}${isCartaoCredito(cartao) ? ' · Crédito' : ` · ${getLabelTipoCartao(cartao.tipo)}`}`
      : banco?.nome
  const isReadOnly = !!t.origem && !isTransferencia
  const emoji = t.tipo === 'gasto' ? CATEGORIA_EMOJI[t.categoria] ?? '📦' : '💰'

  return (
    <>
      <div
        className="flex items-center gap-3 py-2.5 px-4 group"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0"
          style={{ background: isTransferencia ? 'rgba(99,102,241,0.12)' : 'var(--bg-elevated)' }}
        >
          {isTransferencia
            ? <ArrowRightLeft size={15} style={{ color: 'rgba(129,140,248,1)' }} />
            : emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {t.descricao}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            {labelOrigem && (
              <span
                className="inline-block text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'var(--bg-elevated)', color: 'var(--text-tertiary)' }}
              >
                {labelOrigem}
              </span>
            )}
            {t.recorrenteId && (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(52,199,123,0.12)', color: 'var(--green)' }}
              >
                <RefreshCw className="w-2.5 h-2.5" />
                Recorrente
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
            style={{
              color: isTransferencia
                ? 'rgba(129,140,248,0.85)'
                : t.tipo === 'gasto' ? 'var(--red)' : 'var(--green)',
            }}
          >
            {isTransferencia ? '' : t.tipo === 'gasto' ? '-' : '+'}{formatBRL(t.valor)}
          </span>
          <div
            className="flex items-center gap-1"
            style={{
              opacity: hovered ? 1 : 0,
              transition: 'opacity .15s',
            }}
          >
            {t.recorrenteId && onCancelarRecorrente && (
              <button
                onClick={() => setConfirmCancelRec(true)}
                className="w-6 h-6 flex items-center justify-center rounded"
                style={{ color: 'var(--text-tertiary)', transition: 'color .12s' }}
                title="Cancelar recorrência"
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--amber)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            {!isReadOnly && (
              <>
                {!isTransferencia && (
                  <button
                    onClick={() => onEdit(t)}
                    className="w-6 h-6 flex items-center justify-center rounded"
                    style={{ color: 'var(--text-tertiary)', transition: 'color .12s' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  onClick={() => setConfirmOpen(true)}
                  className="w-6 h-6 flex items-center justify-center rounded"
                  style={{ color: 'var(--text-tertiary)', transition: 'color .12s' }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal
        open={confirmOpen}
        titulo={isTransferencia ? 'Excluir transferência?' : 'Excluir lançamento?'}
        descricao={isTransferencia ? 'A transferência será removida de ambos os bancos.' : 'Este lançamento será removido permanentemente.'}
        onConfirm={() => onDelete(t.id)}
        onClose={() => setConfirmOpen(false)}
      />
      <ConfirmDeleteModal
        open={confirmCancelRec}
        titulo="Cancelar recorrência?"
        descricao="Este lançamento permanece. Nos próximos meses ele não será criado automaticamente."
        onConfirm={() => {
          if (t.recorrenteId && onCancelarRecorrente) onCancelarRecorrente(t.recorrenteId)
          setConfirmCancelRec(false)
        }}
        onClose={() => setConfirmCancelRec(false)}
      />
    </>
  )
}
