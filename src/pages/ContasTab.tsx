import { useState, useEffect, useMemo } from 'react'
import { BillList } from '@/components/BillList/BillList'
import { BillModal } from '@/components/Modals/BillModal'
import { PagarContaModal } from '@/components/Modals/PagarContaModal'
import { SelectBancoModal } from '@/components/Modals/SelectBancoModal'
import { Conta, ContaInput, BancoComSaldo, FaturaCartao, Cartao } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  contas: Conta[]
  bancos: BancoComSaldo[]
  faturas: FaturaCartao[]
  cartoes: Cartao[]
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
  onSaveParcelada?: (data: ContaInput, parcelaTotal: number) => Promise<void>
  onDeleteParcelamento?: (parcelamentoId: string, parcelaAtualFrom: number, parcelaTotal: number) => Promise<void>
  onNavigateToBancos: () => void
  onMarcarFaturaPaga: (faturaId: string, bancoId: string) => Promise<void>
  onDesmarcarFaturaPaga: (faturaId: string) => Promise<void>
}

export function ContasTab({
  contas,
  bancos,
  faturas,
  cartoes,
  onTogglePagoComBanco,
  onDesfazerPagamento,
  onDelete,
  onAdd,
  onUpdate,
  onSaveParcelada,
  onDeleteParcelamento,
  onNavigateToBancos,
  onMarcarFaturaPaga,
  onDesmarcarFaturaPaga,
}: Props) {
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  const [pendingFaturaId, setPendingFaturaId] = useState<string | null>(null)

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

  function handleFaturaBancoSelect(bancoId: string) {
    if (!pendingFaturaId) return
    onMarcarFaturaPaga(pendingFaturaId, bancoId)
    setPendingFaturaId(null)
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

      {/* Faturas de cartão */}
      {faturas.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
            Faturas de cartão
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faturas.map(fatura => {
              const cartao = cartoes.find(c => c.id === fatura.cartaoId)
              if (!cartao) return null
              return (
                <div
                  key={fatura.id}
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    borderLeft: `3px solid ${cartao.cor}`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 2 }}>
                      {cartao.nome}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      Fatura · vence dia {cartao.diaVencimento}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                      {formatBRL(fatura.total)}
                    </span>
                    {fatura.pago ? (
                      <button
                        onClick={() => onDesmarcarFaturaPaga(fatura.id)}
                        style={{
                          padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: 'var(--green-muted)', color: 'var(--green)',
                          border: '1px solid rgba(52,199,123,0.25)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        ✓ Paga
                      </button>
                    ) : (
                      <button
                        onClick={() => setPendingFaturaId(fatura.id)}
                        style={{
                          padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: 'var(--amber-muted)', color: 'var(--amber)',
                          border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Pagar
                      </button>
                    )}
                  </div>
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
        open={pendingFaturaId !== null}
        bancos={bancos}
        onSelect={handleFaturaBancoSelect}
        onClose={() => setPendingFaturaId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />
    </div>
  )
}
