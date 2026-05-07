import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  open: boolean
  parcelaAtual: number
  parcelaTotal: number
  onDeleteSo: () => void
  onDeleteRestantes: () => void
  onClose: () => void
}

export function ConfirmDeleteParcelaModal({
  open,
  parcelaAtual,
  parcelaTotal,
  onDeleteSo,
  onDeleteRestantes,
  onClose,
}: Props) {
  const restantes = parcelaTotal - parcelaAtual

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
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed', zIndex: 61,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(340px, calc(100vw - 32px))',
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '22px 22px 18px' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                Excluir parcela {parcelaAtual}/{parcelaTotal}?
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {restantes > 0
                  ? `Há ${restantes} parcela${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''} em meses futuros.`
                  : 'Esta é a última parcela.'}
              </p>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
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
                onClick={() => { onDeleteSo(); onClose() }}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
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
                Excluir só esta parcela
              </button>
              {restantes > 0 && (
                <button
                  onClick={() => { onDeleteRestantes(); onClose() }}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 10,
                    background: 'var(--red)', border: 'none',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer', transition: 'opacity .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Excluir esta + {restantes} próxima{restantes > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
