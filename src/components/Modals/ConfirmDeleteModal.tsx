import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  open: boolean
  titulo?: string
  descricao?: string
  onConfirm: () => void
  onClose: () => void
}

export function ConfirmDeleteModal({
  open,
  titulo = 'Excluir item?',
  descricao = 'Esta ação não pode ser desfeita.',
  onConfirm,
  onClose,
}: Props) {
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 61,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '0 16px', pointerEvents: 'none',
            }}
          >
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              pointerEvents: 'auto',
              width: 'min(320px, 100%)',
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '22px 22px 18px' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                {titulo}
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {descricao}
              </p>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                  fontFamily: 'inherit', cursor: 'pointer', transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                Cancelar
              </button>
              <button
                onClick={() => { onConfirm(); onClose() }}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: 'var(--red-muted)', border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--red)', fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit', cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--red)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--red-muted)'
                  e.currentTarget.style.color = 'var(--red)'
                }}
              >
                Excluir
              </button>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
