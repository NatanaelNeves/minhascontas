import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { AReceber } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  recebivel: AReceber
  onToggle: (id: string) => void
  onEdit: (r: AReceber) => void
  onDelete: (id: string) => void
}

export function ReceivableItem({ recebivel: r, onToggle, onEdit, onDelete }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3"
      style={{ opacity: r.recebido ? 0.5 : 1 }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: '#7C72D820', color: '#7C72D8' }}
      >
        {r.nome[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{ textDecoration: r.recebido ? 'line-through' : 'none' }}
        >
          {r.nome}
        </p>
        {r.dataPrevista && (
          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
            Previsto: {r.dataPrevista.split('-').reverse().join('/')}
          </p>
        )}
      </div>
      <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
        {formatBRL(r.valor)}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {!r.recebido && (
          <>
            <button onClick={() => onEdit(r)} style={{ color: 'var(--text-subtle)' }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(r.id)} style={{ color: 'var(--text-subtle)' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        <button
          onClick={() => onToggle(r.id)}
          className="w-9 h-5 rounded-full transition-colors relative"
          style={{ background: r.recebido ? '#10B981' : 'var(--border-subtle)' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
            style={{ transform: r.recebido ? 'translateX(18px)' : 'translateX(2px)' }}
          />
        </button>
      </div>
    </motion.div>
  )
}
