import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2, SlidersHorizontal } from 'lucide-react'
import { CartaoComSaldo, CartaoInput, Conta, FaturaCalculada } from '@/types'
import { formatBRL, centavosToDisplay, valorToCentStr } from '@/lib/utils'
import { ConfirmDeleteModal } from '@/components/Modals/ConfirmDeleteModal'
import { getLabelTipoCartao, recargaEmBreve } from '@/lib/cartoes'

interface Props {
  cartao: CartaoComSaldo
  contasDoCartao: Conta[]
  fatura?: FaturaCalculada
  onEdit: (c: CartaoComSaldo) => void
  onDelete: (id: string) => void
  onPagarFatura: (faturaId: string) => void
  onDetail: () => void
  onUpdate?: (id: string, data: Partial<CartaoInput>) => void
}

export function CartaoCard({ cartao, contasDoCartao, fatura, onEdit, onDelete, onPagarFatura, onDetail, onUpdate }: Props) {
  const [hovered, setHovered] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [editandoGasto, setEditandoGasto] = useState(false)
  const [gastoCentStr, setGastoCentStr] = useState('')

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

  function handleAbrirEdicaoGasto(e: React.MouseEvent) {
    e.stopPropagation()
    if (cartao.tipo !== 'credito') return
    setGastoCentStr(valorToCentStr((cartao as { gastoAtual?: number }).gastoAtual ?? 0))
    setEditandoGasto(true)
  }

  function handleConfirmarGasto(e: React.MouseEvent) {
    e.stopPropagation()
    const valor = parseInt(gastoCentStr || '0', 10) / 100
    onUpdate?.(cartao.id, { tipo: 'credito', gastoAtual: valor > 0 ? valor : 0 } as Partial<CartaoInput>)
    setEditandoGasto(false)
  }

  function handleCancelarGasto(e: React.MouseEvent) {
    e.stopPropagation()
    setEditandoGasto(false)
  }

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

            {/* Inline edit gastoAtual */}
            {editandoGasto ? (
              <div
                onClick={e => e.stopPropagation()}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 2 }}
              >
                <p style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 500 }}>
                  Comprometido manualmente (fatura)
                </p>
                <div style={{ position: 'relative' }}>
                  <span style={{
                    position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 14, fontWeight: 600, color: 'var(--text-tertiary)',
                    pointerEvents: 'none', userSelect: 'none',
                  }}>R$</span>
                  <input
                    autoFocus
                    value={centavosToDisplay(gastoCentStr)}
                    onChange={e => setGastoCentStr(e.target.value.replace(/\D/g, ''))}
                    inputMode="numeric"
                    placeholder="0,00"
                    onClick={e => e.stopPropagation()}
                    style={{
                      width: '100%', padding: '9px 10px 9px 36px', boxSizing: 'border-box',
                      background: 'var(--bg-elevated)', border: '1px solid var(--border-strong)',
                      borderRadius: 8, fontSize: 18, fontWeight: 700, color: '#fff',
                      outline: 'none', fontFamily: 'inherit', letterSpacing: '-0.03em',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={handleConfirmarGasto}
                    style={{
                      flex: 1, padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: 'var(--text-primary)', color: 'var(--bg-base)',
                      border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    ✓ Confirmar
                  </button>
                  <button
                    onClick={handleCancelarGasto}
                    style={{
                      flex: 1, padding: '9px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                      background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                      border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            ) : (
              onUpdate && (
                <button
                  onClick={handleAbrirEdicaoGasto}
                  style={{
                    alignSelf: 'flex-start',
                    padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                    background: 'var(--bg-elevated)', color: 'var(--text-tertiary)',
                    border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 5, letterSpacing: '-0.01em',
                    opacity: hovered ? 1 : 0, transition: 'opacity .15s, color .15s, border-color .15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <SlidersHorizontal size={10} strokeWidth={2.5} />
                  Ajustar comprometido
                </button>
              )
            )}
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
            onClick={e => { e.stopPropagation(); onPagarFatura(fatura.cartaoId) }}
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
