import { useState } from 'react'
import { BillList } from '@/components/BillList/BillList'
import { BillModal } from '@/components/Modals/BillModal'
import { SelectBancoModal } from '@/components/Modals/SelectBancoModal'
import { Conta, ContaInput, BancoComSaldo } from '@/types'

interface Props {
  contas: Conta[]
  bancos: BancoComSaldo[]
  onTogglePagoComBanco: (
    id: string,
    bancoId: string,
    contaData: { nome: string; valor: number; vencimento: string | null },
  ) => Promise<void>
  onDesfazerPagamento: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAdd: (data: ContaInput) => Promise<void>
  onUpdate: (id: string, data: Partial<ContaInput>) => Promise<void>
  onNavigateToBancos: () => void
}

export function ContasTab({
  contas,
  bancos,
  onTogglePagoComBanco,
  onDesfazerPagamento,
  onDelete,
  onAdd,
  onUpdate,
  onNavigateToBancos,
}: Props) {
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)

  function handleToggle(id: string, pago: boolean) {
    if (pago) {
      onDesfazerPagamento(id)
    } else {
      setPendingToggleId(id)
    }
  }

  function handleBancoSelect(bancoId: string) {
    if (!pendingToggleId) return
    const conta = contas.find(c => c.id === pendingToggleId)
    if (conta) {
      onTogglePagoComBanco(pendingToggleId, bancoId, {
        nome: conta.nome,
        valor: conta.valor,
        vencimento: conta.vencimento,
      })
    }
    setPendingToggleId(null)
  }

  function handleSave(data: ContaInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <BillList
        contas={contas}
        onTogglePago={handleToggle}
        onEdit={c => {
          setEditando(c)
          setBillModalOpen(true)
        }}
        onDelete={onDelete}
        onAdd={() => {
          setEditando(null)
          setBillModalOpen(true)
        }}
      />

      <BillModal
        open={billModalOpen}
        onClose={() => {
          setBillModalOpen(false)
          setEditando(null)
        }}
        onSave={handleSave}
        editando={editando}
      />

      <SelectBancoModal
        open={pendingToggleId !== null}
        bancos={bancos}
        onSelect={handleBancoSelect}
        onClose={() => setPendingToggleId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />
    </div>
  )
}
