import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2, Check } from 'lucide-react'
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
      animate={{ opacity: r.recebido ? 0.5 : 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3"
    >
      {/* Checkbox */}
      <motion.button
        onClick={() => onToggle(r.id)}
        className="shrink-0 flex items-center justify-center rounded-md"
        style={{
          width: 18,
          height: 18,
          background: r.recebido ? 'var(--green)' : 'transparent',
          border: r.recebido ? 'none' : '1.5px solid var(--border-strong)',
        }}
        whileTap={{ scale: 0.85 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <AnimatePresence>
          {r.recebido && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            >
              <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
        style={{ background: 'var(--bg-elevated)', color: 'var(--text-secondary)' }}
      >
        {r.nome[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-sm font-medium truncate"
          style={{
            textDecoration: r.recebido ? 'line-through' : 'none',
            color: r.recebido ? 'var(--text-tertiary)' : 'var(--text-primary)',
          }}
        >
          {r.nome}
        </p>
        {r.dataPrevista && (
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Previsto: {r.dataPrevista.split('-').reverse().join('/')}
          </p>
        )}
      </div>

      <span className="text-sm font-semibold" style={{ color: r.recebido ? 'var(--text-tertiary)' : 'var(--amber)' }}>
        {formatBRL(r.valor)}
      </span>

      {!r.recebido && (
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => onEdit(r)} style={{ color: 'var(--text-tertiary)' }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(r.id)} style={{ color: 'var(--text-tertiary)' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  )
}
