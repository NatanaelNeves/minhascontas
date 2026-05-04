import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  valorAtual: number
  onSave: (valor: number) => void
  onClose: () => void
}

export function ReceitaModal({ open, valorAtual, onSave, onClose }: Props) {
  const [valorStr, setValorStr] = useState('')

  useEffect(() => {
    if (open) {
      setValorStr(valorAtual > 0 ? valorAtual.toFixed(2).replace('.', ',') : '')
    }
  }, [open, valorAtual])

  function handleSave() {
    const valor = parseFloat(valorStr.replace(',', '.')) || 0
    if (valor > 0) onSave(valor)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xs">
        <DialogHeader>
          <DialogTitle>Receita do mês</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-zinc-400">Valor (R$)</Label>
            <Input
              value={valorStr}
              onChange={e => setValorStr(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
              placeholder="0,00"
              inputMode="decimal"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-700 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-white text-zinc-900 hover:bg-zinc-100"
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
