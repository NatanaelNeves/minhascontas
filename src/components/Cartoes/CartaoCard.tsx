import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { CartaoComSaldo, Conta, FaturaCartao } from '@/types'
import { formatBRL } from '@/lib/utils'
import { ConfirmDeleteModal } from '@/components/Modals/ConfirmDeleteModal'
import { getLabelTipoCartao, recargaEmBreve } from '@/lib/cartoes'

interface Props {
  cartao: CartaoComSaldo
  contasDoCartao: Conta[]
  fatura?: FaturaCartao
  onEdit: (c: CartaoComSaldo) => void
  onDelete: (id: string) => void
  onPagarFatura: (faturaId: string) => void
  onDetail: () => void
}

export function CartaoCard({ cartao, contasDoCartao, fatura, onEdit, onDelete, onPagarFatura, onDetail }: Props) {
  const [hovered, setHovered] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const nParcelamentos = useMemo(() => {
    const ids = new Set(contasDoCartao.filter(c => c.parcelamentoId).map(c => c.parcelamentoId!))
    return ids.size
  }, [contasDoCartao])

  const totalParcelamentosMes = useMemo(
    () => contasDoCartao.filter(c => c.parcelamentoId).reduce((s, c) => s + c.valor, 0),
    [contasDoCartao],
  )

  const pct = Math.min(cartao.percentualUsado, 100)
  const barColor =
    pct >= 90 ? 'var(--red)' :
    pct >= 70 ? 'var(--amber)' :
    'var(--green)'
  const isCredito = cartao.tipo === 'credito'
  const recargaBadge = !isCredito && recargaEmBreve(cartao.diaRecarga) && (cartao.recargaMensal ?? 0) > 0

  return (
    <>
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={onDetail}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderTop: `3px solid ${cartao.cor}`,
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          position: 'relative',
          cursor: 'pointer',
        }}
      >
        {/* Linha 1: nome + tipo + ações */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {cartao.nome}
            </span>
            <span
              style={{
                fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                background: 'var(--bg-elevated)', color: 'var(--text-tertiary)',
                letterSpacing: '0.02em', flexShrink: 0,
              }}
            >
              {getLabelTipoCartao(cartao.tipo)}
            </span>
            {recargaBadge && (
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                background: 'var(--green-muted)', color: 'var(--green)',
                letterSpacing: '0.02em', flexShrink: 0,
              }}>
                Recarga em breve
              </span>
            )}
          </div>
          <div
            style={{ display: 'flex', gap: 4, opacity: hovered ? 1 : 0.45, transition: 'opacity .15s', flexShrink: 0 }}
          >
            <button
              onClick={e => { e.stopPropagation(); onEdit(cartao) }}
              style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text-tertiary)', cursor: 'pointer', border: 'none', background: 'transparent', transition: 'color .12s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <Pencil size={13} />
            </button>
            <button
              onClick={e => { e.stopPropagation(); setConfirmOpen(true) }}
              style={{ width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'var(--text-tertiary)', cursor: 'pointer', border: 'none', background: 'transparent', transition: 'color .12s' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* Parcelamentos summary */}
        {nParcelamentos > 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: -6 }}>
            {nParcelamentos} parcelamento{nParcelamentos > 1 ? 's' : ''} ativo{nParcelamentos > 1 ? 's' : ''} · {formatBRL(totalParcelamentosMes)}/mês
          </p>
        )}

        {/* Linha 2: crédito */}
        {isCredito && cartao.limite > 0 && (
          <>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
                Limite disponível
              </p>
              <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(cartao.limiteDisponivel)}
              </p>
            </div>

            {/* Barra de progresso */}
            <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                style={{ height: '100%', borderRadius: 99, background: barColor, transition: 'background .3s' }}
              />
            </div>

            {/* Linha 3: usado / limite / fecha */}
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
              Usado: {formatBRL(cartao.totalUsado)} de {formatBRL(cartao.limite)} · Fecha dia {cartao.diaFechamento}
            </p>
          </>
        )}

        {/* Benefícios: saldo sem barra */}
        {!isCredito && (
          <div>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              Saldo disponível
            </p>
            <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
              {formatBRL(cartao.limiteDisponivel)}
            </p>
            {(cartao.recargaMensal ?? 0) > 0 && (
              <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                Recarga de {formatBRL(cartao.recargaMensal ?? 0)}
                {cartao.diaRecarga ? ` · Todo dia ${cartao.diaRecarga}` : ''}
              </p>
            )}
          </div>
        )}

        {/* Linha 4: fatura aberta */}
        {fatura && !fatura.pago && (
          <button
            onClick={e => { e.stopPropagation(); onPagarFatura(fatura.id) }}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: 8,
              background: 'var(--amber-muted)', border: '1px solid rgba(245,158,11,0.2)',
              cursor: 'pointer', width: '100%', textAlign: 'left' as const,
              transition: 'opacity .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            <span style={{ fontSize: 11, color: 'var(--amber)', fontWeight: 500 }}>
              Fatura aberta: {formatBRL(fatura.total)} · Vence dia {cartao.diaVencimento}
            </span>
            <span style={{ fontSize: 10, color: 'var(--amber)', fontWeight: 600 }}>Pagar →</span>
          </button>
        )}

        {isCredito && fatura && fatura.pago && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>
              Fatura paga · {formatBRL(fatura.total)}
            </span>
          </div>
        )}
      </motion.div>

      <ConfirmDeleteModal
        open={confirmOpen}
        titulo="Excluir cartão?"
        descricao="O cartão e todas as faturas associadas serão removidos."
        onConfirm={() => onDelete(cartao.id)}
        onClose={() => setConfirmOpen(false)}
      />
    </>
  )
}
