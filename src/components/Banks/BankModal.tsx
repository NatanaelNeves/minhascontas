import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Banco, BancoInput } from '@/types'

interface Props {
  open: boolean
  editando: Banco | null
  onSave: (data: BancoInput) => void
  onClose: () => void
}

export function BankModal({ open, editando, onSave, onClose }: Props) {
  const [nome, setNome] = useState('')
  const [saldoInicial, setSaldoInicial] = useState('')

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setSaldoInicial(String(editando.saldoInicial))
    } else {
      setNome('')
      setSaldoInicial('')
    }
  }, [editando, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ nome: nome.trim(), saldoInicial: parseFloat(saldoInicial) || 0 })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar banco' : 'Novo banco'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-subtle)' }}>Nome</label>
            <input
              className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
              style={{ border: '1px solid var(--border-subtle)' }}
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Nubank"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-subtle)' }}>Saldo inicial (R$)</label>
            <input
              className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
              style={{ border: '1px solid var(--border-subtle)' }}
              type="number"
              min="0"
              step="0.01"
              value={saldoInicial}
              onChange={e => setSaldoInicial(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <Button type="submit" className="w-full mt-2">
            {editando ? 'Salvar' : 'Adicionar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
