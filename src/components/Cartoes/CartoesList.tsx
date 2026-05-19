import { useState, useEffect } from 'react'
import { CartaoComSaldo, CartaoInput, Conta, FaturaCalculada, BancoComSaldo, Cartao, GastoRecorrente, Transacao } from '@/types'
import { formatBRL } from '@/lib/utils'
import { CartaoCard } from './CartaoCard'
import { CartaoModal } from './CartaoModal'
import { CartaoDetailSheet } from './CartaoDetailSheet'
import { SelectBancoModal } from '@/components/Modals/SelectBancoModal'

interface Props {
  cartoes: CartaoComSaldo[]
  contas: Conta[]
  transacoes: Transacao[]
  faturas: FaturaCalculada[]
  bancos: BancoComSaldo[]
  gastosRecorrentes: GastoRecorrente[]
  onAdd: (data: CartaoInput) => void
  onUpdate: (id: string, data: Partial<CartaoInput>) => void
  onDelete: (id: string) => void
  onMarcarFaturaPaga: (faturaId: string, bancoId: string, dataPagamento: string, valorCustom?: number) => void
  onCancelarRecorrente: (id: string) => Promise<void>
  onNavigateToBancos: () => void
}

export function CartoesList({
  cartoes,
  contas,
  transacoes,
  faturas,
  bancos,
  gastosRecorrentes,
  onAdd,
  onUpdate,
  onDelete,
  onMarcarFaturaPaga,
  onCancelarRecorrente,
  onNavigateToBancos,
}: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cartao | null>(null)
  const [pagarFaturaId, setPagarFaturaId] = useState<string | null>(null)
  const [detailCartao, setDetailCartao] = useState<CartaoComSaldo | null>(null)

  useEffect(() => {
    function openAdd() { setEditando(null); setModalOpen(true) }
    document.addEventListener('fab-cartoes', openAdd)
    return () => document.removeEventListener('fab-cartoes', openAdd)
  }, [])

  function handleSave(data: CartaoInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  function handleBancoSelect(bancoId: string, dataPagamento: string, valor?: number) {
    if (pagarFaturaId) onMarcarFaturaPaga(pagarFaturaId, bancoId, dataPagamento, valor)
    setPagarFaturaId(null)
  }

  const creditCards = cartoes.filter(c => c.tipo === 'credito')
  const totalLimite = creditCards.reduce((s, c) => s + (c.tipo === 'credito' ? c.limite : 0), 0)
  const totalUsado = creditCards.reduce((s, c) => s + c.totalUsado, 0)
  const totalLimiteDisponivel = creditCards.reduce((s, c) => s + c.limiteDisponivel, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {creditCards.length > 0 && (
        <div
          style={{
            borderRadius: 12, padding: '14px 16px',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
          }}
        >
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12 }}>
            Resumo de crédito
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3 }}>Limite total</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(totalLimite)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3 }}>Comprometido</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: totalUsado > 0 ? '#f87171' : 'var(--text-secondary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(totalUsado)}
              </p>
            </div>
            <div>
              <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 3 }}>Disponível</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: '#34c77b', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(totalLimiteDisponivel)}
              </p>
            </div>
          </div>
          {totalLimite > 0 && (
            <div style={{ marginTop: 12, height: 4, borderRadius: 99, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 99, background: '#f87171', width: `${Math.min(100, (totalUsado / totalLimite) * 100)}%`, transition: 'width .3s' }} />
            </div>
          )}
        </div>
      )}

      {cartoes.length === 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 0', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
            💳
          </div>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Nenhum cartão cadastrado</p>
          <button
            onClick={() => { setEditando(null); setModalOpen(true) }}
            style={{
              padding: '10px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              background: 'var(--text-primary)', color: 'var(--bg-base)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              letterSpacing: '-0.01em',
            }}
          >
            ＋ Adicionar primeiro cartão
          </button>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cartoes.map(c => (
          <CartaoCard
            key={c.id}
            cartao={c}
            contasDoCartao={contas.filter(conta => conta.cartaoId === c.id)}
            fatura={faturas.find(f => f.cartaoId === c.id)}
            onEdit={setEditando}
            onDelete={onDelete}
            onPagarFatura={faturaId => setPagarFaturaId(faturaId)}
            onDetail={() => setDetailCartao(c)}
          />
        ))}
      </div>

      <CartaoModal
        open={modalOpen || editando !== null}
        editando={editando}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditando(null) }}
      />

      <SelectBancoModal
        open={pagarFaturaId !== null}
        bancos={bancos}
        valorInicial={faturas.find(f => f.cartaoId === pagarFaturaId)?.total}
        onSelect={handleBancoSelect}
        onClose={() => setPagarFaturaId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />

      <CartaoDetailSheet
        open={detailCartao !== null}
        cartao={detailCartao}
        contas={detailCartao ? contas.filter(c => c.cartaoId === detailCartao.id) : []}
        transacoesBeneficio={detailCartao ? transacoes.filter(t => t.cartaoId === detailCartao.id && t.tipo === 'gasto') : []}
        fatura={detailCartao ? (faturas.find(f => f.cartaoId === detailCartao.id) ?? null) : null}
        gastosRecorrentes={detailCartao ? gastosRecorrentes.filter(r => r.cartaoId === detailCartao.id && r.ativo) : []}
        onClose={() => setDetailCartao(null)}
        onPagarFatura={() => {
          if (detailCartao) { setPagarFaturaId(detailCartao.id); setDetailCartao(null) }
        }}
        onCancelarRecorrente={onCancelarRecorrente}
      />
    </div>
  )
}
