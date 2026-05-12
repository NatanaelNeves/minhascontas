import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { CartaoComSaldo, Conta, FaturaCalculada, GastoRecorrente, Transacao } from '@/types'
import { formatBRL, mesIdAddMeses, mesIdToShortLabel } from '@/lib/utils'
import { getLabelTipoCartao } from '@/lib/cartoes'
import { useAppStore } from '@/store/useAppStore'
import { ConfirmDeleteModal } from '@/components/Modals/ConfirmDeleteModal'

interface Props {
  open: boolean
  cartao: CartaoComSaldo | null
  contas: Conta[]
  fatura: FaturaCalculada | null
  gastosRecorrentes: GastoRecorrente[]
  transacoesBeneficio: Transacao[]
  onClose: () => void
  onPagarFatura: () => void
  onCancelarRecorrente: (id: string) => Promise<void>
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

export function CartaoDetailSheet({ open, cartao, contas, fatura, gastosRecorrentes, transacoesBeneficio, onClose, onPagarFatura, onCancelarRecorrente }: Props) {
  const { mesAtivo } = useAppStore()
  const [cancelarRecorrenteId, setCancelarRecorrenteId] = useState<string | null>(null)

  const parcelamentos = useMemo(() => {
    const seen = new Set<string>()
    return contas.filter(c => {
      if (!c.parcelamentoId) return false
      if (seen.has(c.parcelamentoId)) return false
      seen.add(c.parcelamentoId)
      return true
    })
  }, [contas])

  // For credit cards use fatura (transactions), for benefit cards use bills
  const creditAvulsos = useMemo(() => {
    if (!cartao || cartao.tipo !== 'credito') return []
    return fatura?.gastosAvulsos ?? []
  }, [cartao, fatura])

  const benefitAvulsos = useMemo(() => {
    if (!cartao || cartao.tipo === 'credito') return []
    return contas.filter(c => !c.parcelamentoId)
  }, [cartao, contas])

  const totalParcelamentos = parcelamentos.reduce((s, c) => s + c.valor, 0)
  const totalFatura = cartao?.tipo === 'credito'
    ? (fatura?.total ?? totalParcelamentos)
    : transacoesBeneficio.reduce((s, t) => s + t.valor, 0)

  const pct = cartao ? Math.min(cartao.percentualUsado, 100) : 0
  const barColor = pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'var(--green)'

  const sheet = createPortal(
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
                    {getLabelTipoCartao(cartao.tipo)}
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

              {/* Gastos avulsos — credit cards: transactions from fatura */}
              {cartao.tipo === 'credito' && creditAvulsos.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Gastos avulsos do mês
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {creditAvulsos.map(t => (
                      <div key={t.id} style={{
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.descricao}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>
                            {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            {t.tipo === 'gasto' ? ` · ${t.categoria}` : ''}
                          </p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          {formatBRL(t.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Gastos avulsos — benefit cards: bills */}
              {cartao.tipo !== 'credito' && benefitAvulsos.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Gastos avulsos do mês
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {benefitAvulsos.map(conta => (
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

              {/* Gastos benefício do mês — benefit cards only */}
              {cartao.tipo !== 'credito' && transacoesBeneficio.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Gastos do mês
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {transacoesBeneficio.map(t => (
                      <div key={t.id} style={{
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {t.descricao}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>
                            {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                            {t.tipo === 'gasto' ? ` · ${t.categoria}` : ''}
                          </p>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                          {formatBRL(t.valor)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recorrentes ativos */}
              {gastosRecorrentes.length > 0 && (
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                    Recorrentes ativos
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {gastosRecorrentes.map(r => (
                      <div key={r.id} style={{
                        padding: '10px 14px',
                        background: 'var(--bg-surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.descricao}
                          </p>
                          <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>
                            Todo mês · {r.categoria}
                          </p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                            {formatBRL(r.valor)}/mês
                          </span>
                          <button
                            onClick={() => setCancelarRecorrenteId(r.id)}
                            style={{
                              fontSize: 10, color: 'var(--text-tertiary)', background: 'none',
                              border: '1px solid var(--border)', borderRadius: 6,
                              padding: '3px 8px', cursor: 'pointer', fontFamily: 'inherit',
                              transition: 'color .15s, border-color .15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = 'var(--red)'; e.currentTarget.style.borderColor = 'var(--red)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-tertiary)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {parcelamentos.length === 0 && creditAvulsos.length === 0 && benefitAvulsos.length === 0 && transacoesBeneficio.length === 0 && gastosRecorrentes.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 8 }}>
                  <span style={{ fontSize: 32 }}>💳</span>
                  <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Nenhum gasto neste mês</p>
                </div>
              )}
            </div>

            {/* Footer: fatura resumo */}
            {(parcelamentos.length > 0 || creditAvulsos.length > 0 || benefitAvulsos.length > 0 || transacoesBeneficio.length > 0 || (fatura && fatura.total > 0)) && (
              <div style={{ borderTop: '0.5px solid var(--border)', padding: '16px 22px', flexShrink: 0 }}>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
                  {cartao.tipo === 'credito' ? 'Resumo da fatura' : 'Resumo do mês'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {cartao.tipo !== 'credito' && transacoesBeneficio.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Gastos ({transacoesBeneficio.length})
                      </span>
                      <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                        {formatBRL(transacoesBeneficio.reduce((s, t) => s + t.valor, 0))}
                      </span>
                    </div>
                  )}
                  {cartao.tipo === 'credito' && fatura && fatura.totalAvulso > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Gastos avulsos ({fatura.gastosAvulsos.length})
                      </span>
                      <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                        {formatBRL(fatura.totalAvulso)}
                      </span>
                    </div>
                  )}
                  {cartao.tipo === 'credito' && fatura && fatura.totalParcelas > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Parcelas do mês ({fatura.contasParceladas.length})
                      </span>
                      <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                        {formatBRL(fatura.totalParcelas)}
                      </span>
                    </div>
                  )}
                  {cartao.tipo === 'credito' && !fatura && parcelamentos.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        Parcelas do mês ({parcelamentos.length})
                      </span>
                      <span style={{ fontSize: 12, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                        {formatBRL(totalParcelamentos)}
                      </span>
                    </div>
                  )}
                  <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {cartao.tipo === 'credito' ? 'Total da fatura' : 'Total gasto'}
                    </span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                      {formatBRL(totalFatura)}
                    </span>
                  </div>
                  {cartao.tipo === 'credito' && (
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      Fecha dia {cartao.diaFechamento} · Vence dia {cartao.diaVencimento}
                    </p>
                  )}
                  {fatura && !fatura.pago && fatura.total > 0 && (
                    <button
                      onClick={onPagarFatura}
                      style={{
                        marginTop: 8, padding: '11px', borderRadius: 10,
                        background: 'var(--text-primary)', border: 'none',
                        color: 'var(--bg-base)', fontSize: 13, fontWeight: 600,
                        fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '-0.01em',
                        transition: 'opacity .15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                    >
                      Pagar fatura →
                    </button>
                  )}
                  {fatura?.pago && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
                      <span style={{ fontSize: 11, color: 'var(--green)', fontWeight: 500 }}>
                        Pago em {fatura.dataPagamento
                          ? new Date(fatura.dataPagamento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                          : '—'}
                      </span>
                    </div>
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

  return (
    <>
      {sheet}
      <ConfirmDeleteModal
        open={cancelarRecorrenteId !== null}
        titulo="Cancelar recorrência?"
        descricao="O lançamento deste mês permanece. Nos próximos meses ele não será criado automaticamente."
        onConfirm={() => {
          if (cancelarRecorrenteId) onCancelarRecorrente(cancelarRecorrenteId)
          setCancelarRecorrenteId(null)
        }}
        onClose={() => setCancelarRecorrenteId(null)}
      />
    </>
  )
}
