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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Conta, ContaInput, Categoria, FormaPagamento } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ContaInput) => void
  editando?: Conta | null
}

const DEFAULT_FORM: ContaInput = {
  nome: '',
  valor: 0,
  categoria: 'fixo',
  formaPagamento: 'pix',
  vencimento: null,
  pago: false,
  parcelas: null,
}

export function BillModal({ open, onClose, onSave, editando }: Props) {
  const [form, setForm] = useState<ContaInput>(DEFAULT_FORM)
  const [valorStr, setValorStr] = useState('')
  const [temParcelas, setTemParcelas] = useState(false)

  useEffect(() => {
    if (editando) {
      setForm({
        nome: editando.nome,
        valor: editando.valor,
        categoria: editando.categoria,
        formaPagamento: editando.formaPagamento,
        vencimento: editando.vencimento,
        pago: editando.pago,
        parcelas: editando.parcelas,
      })
      setValorStr(editando.valor.toFixed(2).replace('.', ','))
      setTemParcelas(!!editando.parcelas)
    } else {
      setForm(DEFAULT_FORM)
      setValorStr('')
      setTemParcelas(false)
    }
  }, [editando, open])

  function parseValor(str: string): number {
    return parseFloat(str.replace(',', '.')) || 0
  }

  function handleSave() {
    if (!form.nome.trim() || parseValor(valorStr) <= 0) return
    onSave({
      ...form,
      valor: parseValor(valorStr),
      parcelas: temParcelas && form.parcelas ? form.parcelas : null,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar conta' : 'Nova conta'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-zinc-400">Nome</Label>
            <Input
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="ex: Aluguel"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400">Valor (R$)</Label>
            <Input
              value={valorStr}
              onChange={e => setValorStr(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-zinc-400">Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={v => setForm(f => ({ ...f, categoria: v as Categoria }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="fixo">Fixo</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="extra">Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-zinc-400">Pagamento</Label>
              <Select
                value={form.formaPagamento}
                onValueChange={v => setForm(f => ({ ...f, formaPagamento: v as FormaPagamento }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400">Vencimento (opcional)</Label>
            <Input
              type="date"
              value={form.vencimento ?? ''}
              onChange={e => setForm(f => ({ ...f, vencimento: e.target.value || null }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={temParcelas}
              onCheckedChange={v => setTemParcelas(!!v)}
              id="parcelas-check"
            />
            <Label htmlFor="parcelas-check" className="text-zinc-400 cursor-pointer">
              Tem parcelas
            </Label>
          </div>

          {temParcelas && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-zinc-400">Parcela atual</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.parcelas?.atual ?? 1}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      parcelas: { atual: Number(e.target.value), total: f.parcelas?.total ?? 1 },
                    }))
                  }
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-400">Total parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.parcelas?.total ?? 1}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      parcelas: { atual: f.parcelas?.atual ?? 1, total: Number(e.target.value) },
                    }))
                  }
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              checked={form.pago}
              onCheckedChange={v => setForm(f => ({ ...f, pago: !!v }))}
              id="pago-check"
            />
            <Label htmlFor="pago-check" className="text-zinc-400 cursor-pointer">
              Já foi pago
            </Label>
          </div>

          <div className="flex gap-2 pt-2">
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
