import { useState, useEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { BillList } from '@/components/BillList/BillList'
import { BillModal } from '@/components/Modals/BillModal'
import { PagarContaModal } from '@/components/Modals/PagarContaModal'
import { SelectBancoModal } from '@/components/Modals/SelectBancoModal'
import { ConfirmDeleteModal } from '@/components/Modals/ConfirmDeleteModal'
import { Conta, ContaInput, BancoComSaldo, FaturaCalculada, Cartao } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  contas: Conta[]
  bancos: BancoComSaldo[]
  faturas: FaturaCalculada[]
  cartoes: Cartao[]
  onTogglePago: (id: string, pago: boolean) => Promise<void>
  onTogglePagoComBanco: (
    id: string,
    bancoId: string,
    contaData: { nome: string; valor: number; vencimento: string | null },
    dataPagamento: string,
  ) => Promise<void>
  onDesfazerPagamento: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAdd: (data: ContaInput) => Promise<void>
  onUpdate: (id: string, data: Partial<ContaInput>) => Promise<void>
  onSaveParcelada?: (data: ContaInput, parcelaTotal: number, parcelaInicialAtual: number) => Promise<void>
  onDeleteParcelamento?: (parcelamentoId: string, parcelaAtualFrom: number, parcelaTotal: number) => Promise<void>
  onNavigateToBancos: () => void
  onNavigateToCartoes: () => void
  onMarcarFaturaPaga: (cartaoId: string, bancoId: string, dataPagamento: string) => Promise<void>
  onDesmarcarFaturaPaga: (cartaoId: string) => Promise<void>
}

export function ContasTab({
  contas,
  bancos,
  faturas,
  cartoes,
  onTogglePago,
  onTogglePagoComBanco,
  onDesfazerPagamento,
  onDelete,
  onAdd,
  onUpdate,
  onSaveParcelada,
  onDeleteParcelamento,
  onNavigateToBancos,
  onNavigateToCartoes,
  onMarcarFaturaPaga,
  onDesmarcarFaturaPaga,
}: Props) {
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  const [pendingFaturaCartaoId, setPendingFaturaCartaoId] = useState<string | null>(null)
  const [confirmDesmarcarId, setConfirmDesmarcarId] = useState<string | null>(null)
  const [expandedFaturaId, setExpandedFaturaId] = useState<string | null>(null)

  useEffect(() => {
    function openAdd() { setEditando(null); setBillModalOpen(true) }
    document.addEventListener('fab-contas', openAdd)
    return () => document.removeEventListener('fab-contas', openAdd)
  }, [])

  const pendingConta = pendingToggleId ? contas.find(c => c.id === pendingToggleId) ?? null : null

  function handleToggle(id: string, pago: boolean) {
    if (pago) {
      onDesfazerPagamento(id)
    } else {
      const conta = contas.find(c => c.id === id)
      if (conta?.cartaoId) {
        const cartao = cartoes.find(c => c.id === conta.cartaoId)
        if (cartao && cartao.tipo !== 'credito') {
          onTogglePago(id, true)
          return
        }
      }
      setPendingToggleId(id)
    }
  }

  function handlePagarConfirm(bancoId: string, data: string) {
    if (!pendingConta) return
    onTogglePagoComBanco(pendingConta.id, bancoId, {
      nome: pendingConta.nome,
      valor: pendingConta.valor,
      vencimento: pendingConta.vencimento,
    }, data)
    setPendingToggleId(null)
  }

  function handleFaturaBancoSelect(bancoId: string, dataPagamento: string) {
    if (!pendingFaturaCartaoId) return
    onMarcarFaturaPaga(pendingFaturaCartaoId, bancoId, dataPagamento)
    setPendingFaturaCartaoId(null)
  }

  function handleSave(data: ContaInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  const pagas = contas.filter(c => c.pago).length
  const total = contas.length
  const pendente = contas.filter(c => !c.pago).reduce((s, c) => s + c.valor, 0)
  const proxVenc = useMemo(() => {
    return contas
      .filter(c => !c.pago && c.vencimento)
      .sort((a, b) => a.vencimento!.localeCompare(b.vencimento!))[0] ?? null
  }, [contas])

  return (
    <div className="flex flex-col gap-4">
      {/* Strip de resumo */}
      {total > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: pagas === total ? 'var(--green)' : 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {pagas} de {total} pagas
          </span>
          {pendente > 0 && (
            <>
              <span style={{ fontSize: 11, color: 'var(--border-strong)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--amber)', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(pendente)} pendente
              </span>
            </>
          )}
          {proxVenc && (
            <>
              <span style={{ fontSize: 11, color: 'var(--border-strong)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '-0.01em' }}>
                próximo: {proxVenc.nome} dia {proxVenc.vencimento!.split('-')[2]}
              </span>
            </>
          )}
        </div>
      )}

      {/* Faturas do mês */}
      {faturas.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
            Faturas do mês
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faturas.map(fatura => {
              const expanded = expandedFaturaId === fatura.cartaoId
              const isPago = fatura.pago
              const nItens = fatura.gastosAvulsos.length + fatura.contasParceladas.length
              const textColor = isPago ? 'var(--text-disabled)' : 'var(--text-primary)'
              const subColor = isPago ? 'var(--text-disabled)' : 'var(--text-tertiary)'

              return (
                <div
                  key={fatura.cartaoId}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderLeft: `3px solid ${fatura.cartaoCor}`,
                    borderRadius: 'var(--radius-lg)',
                    overflow: 'hidden',
                  }}
                >
                  {/* Header row */}
                  <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* Chevron */}
                    <button
                      onClick={() => setExpandedFaturaId(expanded ? null : fatura.cartaoId)}
                      style={{
                        width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)',
                        flexShrink: 0, transition: 'transform .2s',
                        transform: expanded ? 'rotate(180deg)' : 'none',
                      }}
                    >
                      <ChevronDown size={14} />
                    </button>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 500, color: textColor, letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {fatura.cartaoNome}
                      </p>
                      <p style={{ fontSize: 11, color: subColor, marginTop: 2 }}>
                        {isPago
                          ? `Pago em ${fatura.dataPagamento ? new Date(fatura.dataPagamento + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : '—'}`
                          : `Vence dia ${fatura.diaVencimento} · ${nItens} ${nItens === 1 ? 'item' : 'itens'}`
                        }
                      </p>
                    </div>

                    {/* Total + action */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: textColor, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                        {formatBRL(fatura.total)}
                      </span>
                      {isPago ? (
                        <button
                          onClick={() => setConfirmDesmarcarId(fatura.cartaoId)}
                          style={{
                            padding: '5px 11px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: 'var(--green-muted)', color: 'var(--green)',
                            border: '1px solid rgba(52,199,123,0.25)', cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          ✓ Paga
                        </button>
                      ) : (
                        <button
                          onClick={() => setPendingFaturaCartaoId(fatura.cartaoId)}
                          style={{
                            padding: '5px 11px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                            background: 'var(--amber-muted)', color: 'var(--amber)',
                            border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer', fontFamily: 'inherit',
                          }}
                        >
                          Pagar
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded detail */}
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: 'auto' }}
                        exit={{ height: 0 }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div style={{ borderTop: '0.5px solid var(--divider)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                          {/* Gastos avulsos */}
                          {fatura.gastosAvulsos.length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                                Gastos avulsos
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {fatura.gastosAvulsos.map(t => (
                                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {t.descricao}
                                    </span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                        {new Date(t.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                      </span>
                                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                                        {formatBRL(t.valor)}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Parcelas */}
                          {fatura.contasParceladas.length > 0 && (
                            <div>
                              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
                                Parcelas
                              </p>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                {fatura.contasParceladas.map(c => (
                                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {c.nome}{c.parcelas ? ` ${c.parcelas.atual}/${c.parcelas.total}` : ''}
                                    </span>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                                      {formatBRL(c.valor)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Total line */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '0.5px solid var(--divider)', paddingTop: 8 }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Total</span>
                            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                              {formatBRL(fatura.total)}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <BillList
        contas={contas}
        onTogglePago={handleToggle}
        onEdit={c => { setEditando(c); setBillModalOpen(true) }}
        onDelete={onDelete}
        onAdd={() => { setEditando(null); setBillModalOpen(true) }}
        onDeleteParcelamento={onDeleteParcelamento}
      />

      <BillModal
        open={billModalOpen}
        onClose={() => { setBillModalOpen(false); setEditando(null) }}
        onSave={handleSave}
        onSaveParcelada={editando ? undefined : onSaveParcelada}
        editando={editando}
        cartoes={cartoes}
        onNavigateToCartoes={onNavigateToCartoes}
      />

      <PagarContaModal
        open={pendingToggleId !== null}
        bancos={bancos}
        contaNome={pendingConta?.nome ?? ''}
        contaValor={pendingConta?.valor ?? 0}
        onConfirm={handlePagarConfirm}
        onClose={() => setPendingToggleId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />

      <SelectBancoModal
        open={pendingFaturaCartaoId !== null}
        bancos={bancos}
        onSelect={handleFaturaBancoSelect}
        onClose={() => setPendingFaturaCartaoId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />

      <ConfirmDeleteModal
        open={confirmDesmarcarId !== null}
        titulo="Reverter pagamento?"
        descricao="A transação bancária será removida e as parcelas voltarão como não pagas."
        onConfirm={() => {
          if (confirmDesmarcarId) onDesmarcarFaturaPaga(confirmDesmarcarId)
        }}
        onClose={() => setConfirmDesmarcarId(null)}
      />
    </div>
  )
}
