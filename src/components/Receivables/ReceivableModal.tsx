import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AReceber, AReceberInput } from '@/types'

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
  editando: AReceber | null
  onSave: (data: AReceberInput) => void
  onClose: () => void
}

export function ReceivableModal({ open, editando, onSave, onClose }: Props) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setValor(String(editando.valor))
      setDataPrevista(editando.dataPrevista ?? '')
    } else {
      setNome('')
      setValor('')
      setDataPrevista('')
    }
  }, [editando, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      nome: nome.trim(),
      valor: parseFloat(valor),
      recebido: editando?.recebido ?? false,
      dataPrevista: dataPrevista || null,
    })
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
            {editando ? 'Editar' : 'Novo a receber'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          <input
            style={inputStyle}
            placeholder="Nome / descrição"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
          <input
            style={inputStyle}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Valor"
            value={valor}
            onChange={e => setValor(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Data prevista (opcional)
            </label>
            <input
              style={inputStyle}
              type="date"
              value={dataPrevista}
              onChange={e => setDataPrevista(e.target.value)}
            />
          </div>
          <div className="flex gap-2 mt-1">
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
