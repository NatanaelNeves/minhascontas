import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Banco, BancoInput } from '@/types'

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  color: 'var(--text-primary)',
  outline: 'none',
  width: '100%',
}

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
      <DialogContent
        className="max-w-sm"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            {editando ? 'Editar banco' : 'Novo banco'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Nome</label>
            <input
              style={inputStyle}
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Nubank"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>Saldo inicial (R$)</label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              step="0.01"
              value={saldoInicial}
              onChange={e => setSaldoInicial(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
            >
              {editando ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
