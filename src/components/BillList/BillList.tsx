import { AnimatePresence, motion } from 'framer-motion'
import { Conta } from '@/types'
import { BillItem } from '@/components/BillItem/BillItem'
import { formatBRL } from '@/lib/utils'

interface Props {
  contas: Conta[]
  onTogglePago: (id: string, pago: boolean) => void
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => void
}

const CATEGORIAS = [
  { key: 'fixo'   as const, label: 'Compromissos Fixos' },
  { key: 'cartao' as const, label: 'Cartões / Parcelas' },
  { key: 'extra'  as const, label: 'Extras do Mês'      },
]

export function BillList({ contas, onTogglePago, onEdit, onDelete }: Props) {
  if (contas.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <p className="text-lg">Nenhuma conta registrada</p>
        <p className="text-sm mt-1">Toque no + para adicionar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {CATEGORIAS.map(({ key, label }) => {
        const grupo = contas.filter(c => c.categoria === key)
        if (grupo.length === 0) return null

        const totalGrupo = grupo.reduce((sum, c) => sum + c.valor, 0)

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-300">{label}</h3>
              <span className="text-xs text-zinc-500">{formatBRL(totalGrupo)}</span>
            </div>
            <div className="px-4">
              <AnimatePresence>
                {grupo.map(conta => (
                  <BillItem
                    key={conta.id}
                    conta={conta}
                    onTogglePago={onTogglePago}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
