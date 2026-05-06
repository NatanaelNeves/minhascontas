import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BancoComSaldo, BancoInput, Banco } from '@/types'
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

  return (
    <div className="flex flex-col gap-3">
      {erroDelete && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: '#EF444420', color: '#EF4444' }}
        >
          {erroDelete}
          <button className="ml-2 underline" onClick={() => setErroDelete(null)}>
            fechar
          </button>
        </div>
      )}

      {bancos.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-subtle)' }}>
          Nenhum banco cadastrado.
        </p>
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
