import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  open: boolean
  tipo: 'editar' | 'excluir'
  nomeConta: string
  onSoEsteMes: () => void
  onTodosFuturos: () => void
  onClose: () => void
}

export function RecorrenteScopeModal({ open, tipo, nomeConta, onSoEsteMes, onTodosFuturos, onClose }: Props) {
  const titulo = tipo === 'editar' ? 'Alterar conta recorrente?' : 'Excluir conta recorrente?'
  const descricao = tipo === 'editar'
    ? `"${nomeConta}" é recorrente. Deseja alterar só este mês ou este e todos os meses futuros?`
    : `"${nomeConta}" é recorrente. Deseja excluir só este mês ou este e todos os meses futuros?`

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
          <div style={{
            position: 'fixed', inset: 0, zIndex: 61,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 16px', pointerEvents: 'none',
          }}>
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              style={{
                pointerEvents: 'auto',
                width: 'min(340px, 100%)',
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
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={() => { onTodosFuturos(); onClose() }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 10,
                    background: tipo === 'excluir' ? 'var(--red-muted)' : 'var(--text-primary)',
                    border: tipo === 'excluir' ? '1px solid rgba(239,68,68,0.3)' : 'none',
                    color: tipo === 'excluir' ? 'var(--red)' : 'var(--bg-base)',
                    fontSize: 13, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  Este e todos os meses futuros
                </button>
                <button
                  onClick={() => { onSoEsteMes(); onClose() }}
                  style={{
                    width: '100%', padding: '12px', borderRadius: 10,
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    color: 'var(--text-primary)', fontSize: 13, fontWeight: 500,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  Só este mês
                </button>
                <button
                  onClick={onClose}
                  style={{
                    width: '100%', padding: '10px', borderRadius: 10,
                    background: 'none', border: 'none',
                    color: 'var(--text-tertiary)', fontSize: 13, fontWeight: 500,
                    fontFamily: 'inherit', cursor: 'pointer',
                  }}
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body,
  )
}
