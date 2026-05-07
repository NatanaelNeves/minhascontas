import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
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
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed', zIndex: 61,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(360px, calc(100vw - 32px))',
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '0.5px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>
                Registrar pagamento
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                {contaNome}
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(contaValor)}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                      Nenhum banco cadastrado.
                    </p>
                    {onNavigateToBancos && (
                      <button
                        onClick={() => { onClose(); onNavigateToBancos() }}
                        style={{
                          padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                          background: 'var(--text-primary)', color: 'var(--bg-base)',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Ir para Bancos
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {bancos.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setBancoId(b.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 10,
                          background: bancoId === b.id ? 'var(--text-primary)' : 'var(--bg-surface)',
                          border: bancoId === b.id ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all .15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {b.cor && (
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.cor, flexShrink: 0 }} />
                          )}
                          <span style={{
                            fontSize: 13, fontWeight: 500,
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
                onClick={() => { if (canConfirm) { onConfirm(bancoId, data); onClose() } }}
                disabled={!canConfirm}
                style={{
                  flex: 2, padding: '11px', borderRadius: 10,
                  background: canConfirm ? 'var(--green)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: canConfirm ? '#fff' : 'var(--text-tertiary)',
                  fontSize: 13, fontWeight: 600,
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
