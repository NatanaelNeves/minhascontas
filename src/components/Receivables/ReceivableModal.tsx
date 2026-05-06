import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AReceber, AReceberInput } from '@/types'

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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar' : 'Novo a receber'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          <input
            className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--border-subtle)' }}
            placeholder="Nome / descrição"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
          <input
            className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--border-subtle)' }}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Valor"
            value={valor}
            onChange={e => setValor(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-subtle)' }}>
              Data prevista (opcional)
            </label>
            <input
              className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
              style={{ border: '1px solid var(--border-subtle)' }}
              type="date"
              value={dataPrevista}
              onChange={e => setDataPrevista(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full mt-1">
            {editando ? 'Salvar' : 'Adicionar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
