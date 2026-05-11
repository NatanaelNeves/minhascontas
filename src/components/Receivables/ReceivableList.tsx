import { useState, useEffect } from 'react'
import { AReceber, AReceberInput, BancoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'
import { ReceivableItem } from './ReceivableItem'
import { ReceivableModal } from './ReceivableModal'
import { SelectBancoModal } from '@/components/Modals/SelectBancoModal'

interface Props {
  recebiveis: AReceber[]
  bancos: BancoComSaldo[]
  onAdd: (data: AReceberInput) => void
  onUpdate: (id: string, data: Partial<AReceberInput>) => void
  onDelete: (id: string) => void
  onMarcarRecebido: (id: string, bancoId: string, data: string) => void
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

  useEffect(() => {
    function openAdd() { setEditando(null); setFormOpen(true) }
    document.addEventListener('fab-receber', openAdd)
    return () => document.removeEventListener('fab-receber', openAdd)
  }, [])

  function handleToggle(id: string) {
    const r = recebiveis.find(x => x.id === id)
    if (!r) return
    if (r.recebido) {
      onDesmarcarRecebido(id)
    } else {
      setSelectBancoId(id)
    }
  }

  function handleBancoSelect(bancoId: string, data: string) {
    if (selectBancoId) onMarcarRecebido(selectBancoId, bancoId, data)
    setSelectBancoId(null)
  }

  function handleSave(data: AReceberInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  const totalPendente = recebiveis.filter(r => !r.recebido).reduce((acc, r) => acc + r.valor, 0)

  return (
    <div className="flex flex-col gap-3">
      {recebiveis.length > 0 && (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
            Pendente a receber
          </span>
          <span className="text-lg font-bold tracking-tight" style={{ color: 'var(--amber)' }}>
            {formatBRL(totalPendente)}
          </span>
        </div>
      )}

      {recebiveis.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
            style={{ background: 'var(--bg-elevated)' }}
          >
            💰
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            Nenhum valor a receber cadastrado.
          </p>
        </div>
      )}

      {recebiveis.length > 0 && (
        <div
          className="rounded-xl overflow-hidden"
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
          }}
        >
          {recebiveis.map((r, i) => (
            <div
              key={r.id}
              style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
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
