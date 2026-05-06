import { useState } from 'react'
import { AReceber, AReceberInput, BancoComSaldo } from '@/types'
import { ReceivableItem } from './ReceivableItem'
import { ReceivableModal } from './ReceivableModal'
import { SelectBancoModal } from '@/components/Modals/SelectBancoModal'

interface Props {
  recebiveis: AReceber[]
  bancos: BancoComSaldo[]
  onAdd: (data: AReceberInput) => void
  onUpdate: (id: string, data: Partial<AReceberInput>) => void
  onDelete: (id: string) => void
  onMarcarRecebido: (id: string, bancoId: string) => void
  onDesmarcarRecebido: (id: string) => void
  onNavigateToBancos: () => void
}

export function ReceivableList({
  recebiveis,
  bancos,
  onAdd,
  onUpdate,
  onDelete,
  onMarcarRecebido,
  onDesmarcarRecebido,
  onNavigateToBancos,
}: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<AReceber | null>(null)
  const [selectBancoId, setSelectBancoId] = useState<string | null>(null)

  function handleToggle(id: string) {
    const r = recebiveis.find(x => x.id === id)
    if (!r) return
    if (r.recebido) {
      onDesmarcarRecebido(id)
    } else {
      setSelectBancoId(id)
    }
  }

  function handleBancoSelect(bancoId: string) {
    if (selectBancoId) onMarcarRecebido(selectBancoId, bancoId)
    setSelectBancoId(null)
  }

  function handleSave(data: AReceberInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {recebiveis.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-subtle)' }}>
          Nenhum valor a receber cadastrado.
        </p>
      )}

      {recebiveis.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {recebiveis.map((r, i) => (
            <div
              key={r.id}
              style={i > 0 ? { borderTop: '1px solid var(--border-subtle)' } : {}}
            >
              <ReceivableItem
                recebivel={r}
                onToggle={handleToggle}
                onEdit={x => {
                  setEditando(x)
                  setFormOpen(true)
                }}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}

      <ReceivableModal
        open={formOpen}
        editando={editando}
        onSave={handleSave}
        onClose={() => {
          setFormOpen(false)
          setEditando(null)
        }}
      />

      <SelectBancoModal
        open={selectBancoId !== null}
        bancos={bancos}
        onSelect={handleBancoSelect}
        onClose={() => setSelectBancoId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />
    </div>
  )
}
