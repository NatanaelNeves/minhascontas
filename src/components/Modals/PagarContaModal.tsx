import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { BancoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  open: boolean
  bancos: BancoComSaldo[]
  contaNome: string
  contaValor: number
  onConfirm: (bancoId: string, data: string) => void
  onClose: () => void
  onNavigateToBancos?: () => void
}

export function PagarContaModal({
  open,
  bancos,
  contaNome,
  contaValor,
  onConfirm,
  onClose,
  onNavigateToBancos,
}: Props) {
  const [data, setData] = useState(new Date().toISOString().split('T')[0])
  const [bancoId, setBancoId] = useState(bancos[0]?.id ?? '')

  useEffect(() => {
    if (open) {
      setData(new Date().toISOString().split('T')[0])
      setBancoId(bancos[0]?.id ?? '')
    }
  }, [open, bancos])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const canConfirm = !!bancoId && !!data

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 50,
              background: 'rgba(0,0,0,0.65)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          <motion.div
            key="sheet"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              zIndex: 51,
              width: 'min(420px, 100vw)',
              background: 'var(--bg-elevated)',
              borderLeft: '0.5px solid var(--border)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '0.5px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
              }}
            >
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>
                  Registrar pagamento
                </p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                  {contaNome}
                </p>
                <p style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
                  {formatBRL(contaValor)}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32, height: 32, borderRadius: 99,
                  background: 'rgba(255,255,255,0.06)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Data */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Data do pagamento
                </p>
                <input
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    colorScheme: 'dark',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                  onBlur={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Banco */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Débitar de
                </p>
                {bancos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '24px 0' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>
                      Nenhum banco cadastrado.
                    </p>
                    {onNavigateToBancos && (
                      <button
                        onClick={() => { onClose(); onNavigateToBancos() }}
                        style={{
                          padding: '9px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                          background: 'var(--text-primary)', color: 'var(--bg-base)',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Ir para Bancos
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {bancos.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setBancoId(b.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '12px 14px', borderRadius: 10,
                          background: bancoId === b.id ? 'var(--text-primary)' : 'var(--bg-surface)',
                          border: bancoId === b.id ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all .15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {b.cor && (
                            <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.cor, flexShrink: 0 }} />
                          )}
                          <span style={{
                            fontSize: 14, fontWeight: 500,
                            color: bancoId === b.id ? 'var(--bg-base)' : 'var(--text-primary)',
                          }}>
                            {b.nome}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 13, fontVariantNumeric: 'tabular-nums',
                          color: bancoId === b.id ? 'var(--bg-base)' : 'var(--text-secondary)',
                        }}>
                          {formatBRL(b.saldoAtual)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              style={{
                padding: '16px 22px',
                borderTop: '0.5px solid var(--border)',
                display: 'flex',
                gap: 10,
                flexShrink: 0,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500,
                  fontFamily: 'inherit', cursor: 'pointer',
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => { if (canConfirm) { onConfirm(bancoId, data); onClose() } }}
                disabled={!canConfirm}
                style={{
                  flex: 2, padding: '12px', borderRadius: 10,
                  background: canConfirm ? 'var(--green)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: canConfirm ? '#fff' : 'var(--text-tertiary)',
                  fontSize: 14, fontWeight: 600,
                  fontFamily: 'inherit', cursor: canConfirm ? 'pointer' : 'not-allowed',
                  transition: 'all .2s', letterSpacing: '-0.01em',
                }}
              >
                Registrar pagamento
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
