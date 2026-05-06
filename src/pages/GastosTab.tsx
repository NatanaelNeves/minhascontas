import { useState } from 'react'
import { Transacao, TransacaoInput, BancoComSaldo } from '@/types'
import { TransactionList } from '@/components/Transactions/TransactionList'
import { TransactionModal } from '@/components/Transactions/TransactionModal'

interface Props {
  transacoes: Transacao[]
  bancos: BancoComSaldo[]
  onAdd: (data: TransacaoInput) => Promise<void>
  onUpdate: (id: string, data: Partial<TransacaoInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function GastosTab({ transacoes, bancos, onAdd, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Transacao | null>(null)

  function handleSave(data: TransacaoInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <TransactionList
        transacoes={transacoes}
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
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false)
          setEditando(null)
        }}
      />
    </div>
  )
}
