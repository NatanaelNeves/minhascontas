import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { Conta } from '@/types'
import { formatBRL, getAlertaVencimento, getBillEmoji, getBillAvatarBg } from '@/lib/utils'

interface Props {
  conta: Conta
  onTogglePago: (id: string, pago: boolean) => void
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => void
}

const FORMA_LABEL: Record<string, string> = {
  pix: 'Pix',
  debito: 'Débito',
  boleto: 'Boleto',
  credito: 'Crédito',
}

export function BillItem({ conta, onTogglePago, onEdit, onDelete }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const alerta = getAlertaVencimento(conta.vencimento, conta.pago)
  const emoji = getBillEmoji(conta.nome)
  const avatarBg = getBillAvatarBg(conta.nome)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      className="group flex items-center gap-3 px-4 py-[12px] transition-colors"
      style={{
        borderBottom: '0.5px solid var(--divider)',
        cursor: 'default',
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Checkbox toggle — touch target 36×36, visual 18×18 */}
      <button
        onClick={() => onTogglePago(conta.id, !conta.pago)}
        className="w-9 h-9 flex-shrink-0 flex items-center justify-center"
      >
        <div
          className="w-[18px] h-[18px] rounded-[5px] flex items-center justify-center transition-all"
          style={
            conta.pago
              ? { background: '#10B981', border: '1.5px solid #10B981' }
              : { border: '1.5px solid rgba(255,255,255,0.15)', background: 'transparent' }
          }
        >
          {conta.pago && (
            <motion.svg
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              width="9"
              height="9"
              viewBox="0 0 9 9"
              fill="none"
            >
              <path
                d="M1.5 4.5l2 2L7.5 2.5"
                stroke="white"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </motion.svg>
          )}
        </div>
      </button>

      {/* Emoji avatar */}
      <div
        className="w-[32px] h-[32px] rounded-[9px] flex-shrink-0 flex items-center justify-center text-[14px]"
        style={{ background: avatarBg }}
      >
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate"
          style={
            conta.pago
              ? {
                  color: 'var(--text-subtle)',
                  textDecoration: 'line-through',
                  textDecorationColor: 'rgba(255,255,255,0.18)',
                }
              : { color: '#fff' }
          }
        >
          {conta.nome}
        </p>
        <p className="text-[11px] mt-[1px]" style={{ color: 'var(--text-subtle)' }}>
          {FORMA_LABEL[conta.formaPagamento]}
        </p>
      </div>

      {/* Right column */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className="text-[13px] font-semibold tabular-nums"
          style={conta.pago ? { color: 'var(--text-subtle)' } : { color: '#fff', letterSpacing: '-0.02em' }}
        >
          {formatBRL(conta.valor)}
        </span>

        <div className="flex items-center gap-1 flex-wrap justify-end">
          {conta.parcelas && (
            <span
              className="text-[10px] font-medium px-1.5 py-[2px] rounded-full"
              style={{
                background: 'rgba(124,114,216,0.12)',
                color: '#9D94E8',
                border: '0.5px solid rgba(124,114,216,0.22)',
                letterSpacing: '0.01em',
              }}
            >
              {conta.parcelas.atual}/{conta.parcelas.total}
            </span>
          )}

          {alerta === 'vencida' && !conta.pago && (
            <span
              className="text-[10px] font-medium px-1.5 py-[2px] rounded-full"
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#F87171',
                border: '0.5px solid rgba(239,68,68,0.2)',
              }}
            >
              Vencida
            </span>
          )}

          {alerta === 'vence_em_breve' && !conta.pago && (
            <span
              className="text-[10px] font-medium px-1.5 py-[2px] rounded-full"
              style={{
                background: 'rgba(245,158,11,0.1)',
                color: '#FBBF24',
                border: '0.5px solid rgba(245,158,11,0.2)',
              }}
            >
              Vence em breve
            </span>
          )}
        </div>
      </div>

      {/* Hover actions */}
      <AnimatePresence mode="wait">
        {confirmando ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-1 ml-1 flex-shrink-0"
          >
            <button
              onClick={() => { onDelete(conta.id); setConfirmando(false) }}
              className="text-[11px] font-medium px-3 py-2 rounded-md transition-colors"
              style={{
                background: 'rgba(239,68,68,0.12)',
                color: '#F87171',
                border: '0.5px solid rgba(239,68,68,0.22)',
                minHeight: 36,
              }}
            >
              Excluir
            </button>
            <button
              onClick={() => setConfirmando(false)}
              className="text-[11px] font-medium px-3 py-2 rounded-md"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-subtle)',
                border: '0.5px solid rgba(255,255,255,0.08)',
                minHeight: 36,
              }}
            >
              Não
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
          >
            <button
              onClick={() => onEdit(conta)}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-subtle)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-muted)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}
            >
              <Pencil className="w-3 h-3" />
            </button>
            <button
              onClick={() => setConfirmando(true)}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-subtle)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-subtle)')}
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
