import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Transacao, TransacaoInput, BancoComSaldo, Cartao, GastoRecorrenteInput, TransferenciaInput } from '@/types'
import { TransactionList } from '@/components/Transactions/TransactionList'
import { TransactionModal } from '@/components/Transactions/TransactionModal'
import { isCartaoCredito } from '@/lib/cartoes'

interface Props {
  transacoes: Transacao[]
  bancos: BancoComSaldo[]
  cartoes: Cartao[]
  onAdd: (data: TransacaoInput) => Promise<void>
  onAddTransferencia: (data: TransferenciaInput) => Promise<void>
  onUpdate: (id: string, data: Partial<TransacaoInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onUpdateCartao: (id: string, data: Partial<Cartao>) => Promise<void>
  onAddRecorrente: (input: GastoRecorrenteInput) => Promise<string>
  onCancelarRecorrente: (id: string) => Promise<void>
}

export function GastosTab({ transacoes, bancos, cartoes, onAdd, onAddTransferencia, onUpdate, onDelete, onUpdateCartao, onAddRecorrente, onCancelarRecorrente }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Transacao | null>(null)
  const [busca, setBusca] = useState('')

  const transacoesPorId = useMemo(() => new Map(transacoes.map(t => [t.id, t])), [transacoes])

  useEffect(() => {
    function openAdd() { setEditando(null); setModalOpen(true) }
    document.addEventListener('fab-gastos', openAdd)
    return () => document.removeEventListener('fab-gastos', openAdd)
  }, [])

  function getCartaoBeneficio(cartaoId?: string) {
    if (!cartaoId) return null
    const cartao = cartoes.find(c => c.id === cartaoId)
    if (!cartao || isCartaoCredito(cartao)) return null
    return cartao
  }

  async function ajustarSaldoCartao(cartaoId: string, delta: number) {
    const cartao = getCartaoBeneficio(cartaoId)
    if (!cartao) return
    await onUpdateCartao(cartaoId, { saldoAtual: Math.max(0, cartao.saldoAtual + delta) })
  }

  async function handleSave(data: TransacaoInput, isRecorrente?: boolean) {
    const anterior = editando ? transacoesPorId.get(editando.id) ?? editando : null
    const cartaoAnterior = anterior ? getCartaoBeneficio(anterior.cartaoId) : null
    const cartaoNovo = getCartaoBeneficio(data.cartaoId)

    if (anterior?.tipo === 'gasto' && cartaoAnterior) {
      await ajustarSaldoCartao(cartaoAnterior.id, anterior.valor)
    }

    if (data.tipo === 'gasto' && cartaoNovo) {
      await ajustarSaldoCartao(cartaoNovo.id, -data.valor)
    }

    if (isRecorrente && !editando && data.tipo === 'gasto' && data.cartaoId) {
      const gastoData = data as { tipo: 'gasto'; categoria: string; cartaoId: string; descricao: string; valor: number }
      const recorrenteId = await onAddRecorrente({
        cartaoId: gastoData.cartaoId,
        descricao: gastoData.descricao,
        valor: gastoData.valor,
        categoria: gastoData.categoria,
        ativo: true,
      })
      await onAdd({ ...data, recorrenteId })
    } else if (editando) {
      await onUpdate(editando.id, data)
    } else {
      await onAdd(data)
    }

    setEditando(null)
  }

  async function handleDelete(id: string) {
    const transacao = transacoesPorId.get(id)
    const cartao = transacao ? getCartaoBeneficio(transacao.cartaoId) : null
    if (transacao?.tipo === 'gasto' && cartao) {
      await ajustarSaldoCartao(cartao.id, transacao.valor)
    }
    await onDelete(id)
  }

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    const visíveis = transacoes.filter(t => !(t.tipo === 'entrada' && t.origem?.tipo === 'transferencia'))
    if (!q) return visíveis
    return visíveis.filter(t => t.descricao.toLowerCase().includes(q))
  }, [transacoes, busca])

  return (
    <div className="flex flex-col gap-3">
      <div style={{ position: 'relative' }}>
        <Search
          size={13}
          style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-tertiary)', pointerEvents: 'none',
          }}
        />
        <input
          value={busca}
          onChange={e => setBusca(e.target.value)}
          placeholder="Buscar lançamentos..."
          style={{
            width: '100%',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '9px 12px 9px 32px',
            fontSize: 13,
            color: 'var(--text-primary)',
            outline: 'none',
            fontFamily: 'inherit',
            letterSpacing: '-0.01em',
            transition: 'border-color .15s',
          }}
          onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')}
          onBlur={e => (e.target.style.borderColor = 'var(--border)')}
        />
      </div>

      <TransactionList
        transacoes={filtradas}
        bancos={bancos}
        cartoes={cartoes}
        onEdit={t => {
          setEditando(t)
          setModalOpen(true)
        }}
        onDelete={handleDelete}
        onCancelarRecorrente={onCancelarRecorrente}
      />
      <TransactionModal
        open={modalOpen}
        editando={editando}
        bancos={bancos}
        cartoes={cartoes}
        onSave={handleSave}
        onSaveTransferencia={async (data) => {
          await onAddTransferencia(data)
        }}
        onClose={() => {
          setModalOpen(false)
          setEditando(null)
        }}
      />
    </div>
  )
}
