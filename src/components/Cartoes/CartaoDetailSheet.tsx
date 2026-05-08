import { useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CartaoComSaldo, Conta } from '@/types'
import { formatBRL, mesIdAddMeses, mesIdToShortLabel } from '@/lib/utils'

const TIPO_LABEL: Record<string, string> = {
  credito: 'Crédito',
  vale_alimentacao: 'Vale Alim.',
  vale_combustivel: 'Vale Comb.',
  vale_refeicao: 'Vale Ref.',
  outros_beneficios: 'Benefício',
}

interface Props {
  open: boolean
  cartao: CartaoComSaldo | null
  contas: Conta[]
  mesAtivo: string
  onClose: () => void
}

function parcelaCor(mr: number) {
  if (mr > 6) return 'var(--green)'
  if (mr >= 3) return 'var(--amber)'
  return 'var(--red)'
}
function parcelaCorMuted(mr: number) {
  if (mr > 6) return 'var(--green-muted)'
  if (mr >= 3) return 'var(--amber-muted)'
  return 'var(--red-muted)'
}
function parcelaCorBorder(mr: number) {
  if (mr > 6) return 'rgba(52,199,123,0.25)'
  if (mr >= 3) return 'rgba(245,158,11,0.25)'
  return 'rgba(239,68,68,0.25)'
}

export function CartaoDetailSheet({ open, cartao, contas, mesAtivo, onClose }: Props) {
  const parcelamentos = useMemo(() => {
    const seen = new Set<string>()
    return contas.filter(c => {
      if (!c.parcelamentoId) return false
      if (seen.has(c.parcelamentoId)) return false
      seen.add(c.parcelamentoId)
      return true
    })
  }, [contas])

  const avulsos = useMemo(() => contas.filter(c => !c.parcelamentoId), [contas])

  const totalParcelamentos = parcelamentos.reduce((s, c) => s + c.valor, 0)
  const totalAvulsos = avulsos.reduce((s, c) => s + c.valor, 0)
  const totalFatura = totalParcelamentos + totalAvulsos

  const pct = cartao ? Math.min(cartao.percentualUsado, 100) : 0
  const barColor = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'var(--green)'

  return createPortal(
    <AnimatePresence>
      {open && cartao && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 50,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          <motion.div
            key="sheet"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 51,
              width: 'min(420px, 100vw)',
              background: 'var(--bg-elevated)',
              borderLeft: '0.5px solid var(--border)',
              display: 'grid', gridTemplateRows: 'auto 1fr auto', overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: '0.5px solid var(--border)',
              borderTop: `3px solid ${cartao.cor}`,
              display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
              flexShrink: 0,
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>
                    {cartao.nome}
                  </p>
                  <span style={{
                    fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                    background: 'var(--bg-surface)', color: 'var(--text-tertiary)',
                    letterSpacing: '0.02em', flexShrink: 0,
                  }}>
                    {TIPO_LABEL[cartao.tipo]}
                  </span>
                </div>
                {cartao.tipo === 'credito' && cartao.limite > 0 && (
                  <>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 99, overflow: 'hidden', marginBottom: 4 }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
                        style={{ height: '100%', borderRadius: 99, background: barColor }}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      {formatBRL(cartao.limiteDisponivel)} disponível · Limite {formatBRL(cartao.limite)}
                    </p>
                  </>
                )}
                {cartao.tipo !== 'credito' && cartao.saldoAtual > 0 && (
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                    Saldo: {formatBRL(cartao.limiteDisponivel)} de {formatBRL(cartao.saldoAtual)}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="no-scrollbar" style={{ overflowY: 'auto', minHeight: 0, padding: '22px', display: 'flex', flexDirection: 'column', gap: 24, scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              {/* Parcelamentos ativos */}
              {parcelamentos.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Parcelamentos ativos
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {parcelamentos.map(conta => {
                      if (!conta.parcelas) return null
                      const mr = conta.parcelas.total - conta.parcelas.atual
                      const mesTermina = mesIdAddMeses(mesAtivo, mr)
                      const totalRestante = conta.valor * (mr + 1)
                      const cor = parcelaCor(mr)
                      const corMuted = parcelaCorMuted(mr)
                      const corBorder = parcelaCorBorder(mr)

                      return (
                        <div key={conta.id} style={{
                          padding: '12px 14px',
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          display: 'flex', flexDirection: 'column', gap: 7,
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {conta.nome}
                            </p>
                            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                              {formatBRL(conta.valor)}<span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-tertiary)' }}>/mês</span>
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99,
                                background: corMuted, color: cor, border: `0.5px solid ${corBorder}`,
                              }}>
                                {conta.parcelas.atual}/{conta.parcelas.total}
                              </span>
                              <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                Termina {mesIdToShortLabel(mesTermina)}
                              </span>
                            </div>
                            <span style={{ fontSize: 11, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                              Faltam {formatBRL(totalRestante)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Gastos avulsos */}
              {avulsos.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Gastos avulsos do mês
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {avulsos.map(conta => (
                      <div key={conta.id} style={{
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {conta.nome}
                        </p>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          {formatBRL(conta.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {parcelamentos.length === 0 && avulsos.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 8 }}>
                  <span style={{ fontSize: 32 }}>💳</span>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Nenhum gasto neste mês</p>
                </div>
              )}
            </div>

            {/* Footer: fatura resumo */}
            {(parcelamentos.length > 0 || avulsos.length > 0) && (
              <div style={{ borderTop: '0.5px solid var(--border)', padding: '16px 22px', flexShrink: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                  Resumo da fatura
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {parcelamentos.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Parcelamentos ({parcelamentos.length})
                      </span>
                      <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                        {formatBRL(totalParcelamentos)}
                      </span>
                    </div>
                  )}
                  {avulsos.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Avulsos ({avulsos.length})
                      </span>
                      <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                        {formatBRL(totalAvulsos)}
                      </span>
                    </div>
                  )}
                  <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Total</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                      {formatBRL(totalFatura)}
                    </span>
                  </div>
                  {cartao.tipo === 'credito' && (
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      Fecha dia {cartao.diaFechamento} · Vence dia {cartao.diaVencimento}
                    </p>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
