import { motion } from 'framer-motion'
import { Trash2, Pencil } from 'lucide-react'
import { Conta } from '@/types'
import { formatBRL, getAlertaVencimento } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface Props {
  conta: Conta
  onTogglePago: (id: string, pago: boolean) => void
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => void
}

const FORMA_LABEL: Record<string, string> = {
  pix: 'PIX',
  debito: 'Débito',
  boleto: 'Boleto',
  credito: 'Crédito',
}

export function BillItem({ conta, onTogglePago, onEdit, onDelete }: Props) {
  const alerta = getAlertaVencimento(conta.vencimento, conta.pago)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0"
    >
      <Checkbox
        checked={conta.pago}
        onCheckedChange={(checked) => onTogglePago(conta.id, !!checked)}
        className="border-zinc-600"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium truncate ${
              conta.pago ? 'text-zinc-500 line-through' : 'text-white'
            }`}
          >
            {conta.nome}
          </span>
          {conta.parcelas && (
            <span className="text-xs text-zinc-500">
              {conta.parcelas.atual}/{conta.parcelas.total}
            </span>
          )}
          {alerta === 'vencida' && (
            <Badge variant="destructive" className="text-xs py-0 h-4">
              Vencida
            </Badge>
          )}
          {alerta === 'vence_em_breve' && (
            <Badge className="text-xs py-0 h-4 bg-yellow-900 text-yellow-400 hover:bg-yellow-900">
              Vence em breve
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-500">{FORMA_LABEL[conta.formaPagamento]}</span>
          {conta.vencimento && (
            <span
              className={`text-xs ${
                alerta === 'vencida'
                  ? 'text-red-400'
                  : alerta === 'vence_em_breve'
                  ? 'text-yellow-400'
                  : 'text-zinc-500'
              }`}
            >
              vence {new Date(conta.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      <span
        className={`text-sm font-semibold whitespace-nowrap ${
          conta.pago ? 'text-green-400' : 'text-zinc-300'
        }`}
      >
        {formatBRL(conta.valor)}
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(conta)}
          className="h-7 w-7 text-zinc-500 hover:text-white"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(conta.id)}
          className="h-7 w-7 text-zinc-500 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}
