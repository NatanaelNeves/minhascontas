import { useState, useEffect, useMemo } from 'react'
import { Search } from 'lucide-react'
import { Transacao, TransacaoInput, BancoComSaldo, Cartao } from '@/types'
import { TransactionList } from '@/components/Transactions/TransactionList'
import { TransactionModal } from '@/components/Transactions/TransactionModal'

interface Props {
  transacoes: Transacao[]
  bancos: BancoComSaldo[]
  cartoes: Cartao[]
  onAdd: (data: TransacaoInput) => Promise<void>
  onUpdate: (id: string, data: Partial<TransacaoInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function GastosTab({ transacoes, bancos, cartoes, onAdd, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Transacao | null>(null)
  const [busca, setBusca] = useState('')

  useEffect(() => {
    function openAdd() { setEditando(null); setModalOpen(true) }
    document.addEventListener('fab-gastos', openAdd)
    return () => document.removeEventListener('fab-gastos', openAdd)
  }, [])

  function handleSave(data: TransacaoInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase()
    if (!q) return transacoes
    return transacoes.filter(t => t.descricao.toLowerCase().includes(q))
  }, [transacoes, busca])

  return (
    <div className="flex flex-col gap-3">
      {/* Search bar */}
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
        onEdit={t => {
          setEditando(t)
          setModalOpen(true)
        }}
        onDelete={onDelete}
      />
      <TransactionModal
        open={modalOpen}
        editando={editando}
        bancos={bancos}
        cartoes={cartoes}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false)
          setEditando(null)
        }}
      />
    </div>
  )
}
