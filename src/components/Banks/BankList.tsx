import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BancoComSaldo, BancoInput, Banco } from '@/types'
import { formatBRL } from '@/lib/utils'
import { BankCard } from './BankCard'
import { BankModal } from './BankModal'

interface Props {
  bancos: BancoComSaldo[]
  onAdd: (data: BancoInput) => void
  onUpdate: (id: string, data: Partial<BancoInput>) => void
  onDelete: (id: string) => Promise<string | null>
}

export function BankList({ bancos, onAdd, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Banco | null>(null)
  const [erroDelete, setErroDelete] = useState<string | null>(null)

  useEffect(() => {
    function openAdd() { setEditando(null); setModalOpen(true) }
    document.addEventListener('fab-bancos', openAdd)
    return () => document.removeEventListener('fab-bancos', openAdd)
  }, [])

  function handleEdit(banco: BancoComSaldo) {
    setEditando(banco)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    const erro = await onDelete(id)
    if (erro) setErroDelete(erro)
  }

  function handleSave(data: BancoInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  const totalSaldo = bancos.reduce((acc, b) => acc + b.saldoAtual, 0)

  return (
    <div className="flex flex-col gap-3">
      {erroDelete && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: 'var(--red-muted)', color: 'var(--red)' }}
        >
          {erroDelete}
          <button className="ml-2 underline" onClick={() => setErroDelete(null)}>
            fechar
          </button>
        </div>
      )}

      {bancos.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Saldo total
          </span>
          <span
            className="text-lg font-bold tracking-tight"
            style={{ color: totalSaldo >= 0 ? 'var(--green)' : 'var(--red)' }}
          >
            {formatBRL(totalSaldo)}
          </span>
        </div>
      )}

      {bancos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'var(--bg-elevated)' }}
          >
            🏦
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Nenhum banco cadastrado.
          </p>
        </div>
      )}

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {bancos.map(b => (
          <BankCard key={b.id} banco={b} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </motion.div>

      <BankModal
        open={modalOpen}
        editando={editando}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false)
          setEditando(null)
        }}
      />
    </div>
  )
}
