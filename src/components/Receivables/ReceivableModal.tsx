import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { AReceber, AReceberInput } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { formatMesLabel, centavosToDisplay, valorToCentStr } from '@/lib/utils'

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </p>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        width: 40, height: 22, borderRadius: 99,
        background: on ? 'var(--green)' : 'rgba(255,255,255,0.1)',
        position: 'relative', cursor: 'pointer', border: 'none', padding: 0,
        flexShrink: 0, transition: 'background .2s',
      }}
    >
      <motion.div
        animate={{ x: on ? 20 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        style={{ width: 16, height: 16, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: 0, boxShadow: '0 1px 4px rgba(0,0,0,0.35)' }}
      />
    </button>
  )
}

const baseInput = {
  width: '100%',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  padding: '11px 14px',
  fontSize: 14,
  color: '#fff',
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color .15s, background .15s',
  letterSpacing: '-0.01em',
} as const

interface Props {
  open: boolean
  editando: AReceber | null
  onSave: (data: AReceberInput) => void
  onClose: () => void
}

export function ReceivableModal({ open, editando, onSave, onClose }: Props) {
  const { mesAtivo } = useAppStore()
  const [nome, setNome] = useState('')
  const [centStr, setCentStr] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')
  const [recebido, setRecebido] = useState(false)

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setCentStr(valorToCentStr(editando.valor))
      setDataPrevista(editando.dataPrevista ?? '')
      setRecebido(editando.recebido)
    } else {
      setNome('')
      setCentStr('')
      setDataPrevista('')
      setRecebido(false)
    }
  }, [editando, open])

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

  function getCents(): number { return parseInt(centStr || '0', 10) }

  function handleSave() {
    if (!nome.trim() || getCents() <= 0) return
    onSave({
      nome: nome.trim(),
      valor: getCents() / 100,
      dataPrevista: dataPrevista || null,
      recebido,
    })
    onClose()
  }

  const canSave = nome.trim().length > 0 && getCents() > 0

  function focusInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'var(--border-strong)'
    e.target.style.background = 'var(--bg-elevated)'
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'var(--border)'
    e.target.style.background = 'var(--bg-surface)'
  }

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
              position: 'fixed', inset: 0, zIndex: 50,
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
              position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 51,
              width: 'min(420px, 100vw)',
              background: 'var(--bg-elevated)',
              borderLeft: '0.5px solid var(--border)',
              display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 22px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 3 }}>
                  {formatMesLabel(mesAtivo)}
                </p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>
                  {editando ? 'Editar a receber' : 'Novo a receber'}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-surface)', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)', transition: 'background .15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '22px', display: 'flex', flexDirection: 'column', gap: 20 }}>

              {/* Nome */}
              <div>
                <Label>Nome / Descrição</Label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="ex: Freelance, Venda, Devolução..."
                  autoFocus
                  style={baseInput}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              {/* Valor */}
              <div>
                <Label>Valor</Label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 600, color: 'var(--text-tertiary)', pointerEvents: 'none', userSelect: 'none' }}>
                    R$
                  </span>
                  <input
                    value={centavosToDisplay(centStr)}
                    onChange={e => setCentStr(e.target.value.replace(/\D/g, ''))}
                    placeholder="0,00"
                    inputMode="numeric"
                    style={{ ...baseInput, paddingLeft: 46, fontSize: 30, fontWeight: 700, letterSpacing: '-0.05em', height: 62 }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
              </div>

              {/* Data prevista */}
              <div>
                <Label>Data prevista (opcional)</Label>
                <input
                  type="date"
                  value={dataPrevista}
                  onChange={e => setDataPrevista(e.target.value)}
                  style={{ ...baseInput, colorScheme: 'dark', color: dataPrevista ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              {/* Já recebido — toggle */}
              <div
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    Já foi recebido
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Marcar como recebido agora
                  </p>
                </div>
                <Toggle on={recebido} onToggle={() => setRecebido(v => !v)} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 22px', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0 }}>
              <button
                onClick={onClose}
                style={{ flex: 1, padding: '12px', borderRadius: 10, background: 'var(--bg-surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500, fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '-0.01em', transition: 'color .15s' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                style={{ flex: 2, padding: '12px', borderRadius: 10, background: canSave ? 'var(--text-primary)' : 'rgba(255,255,255,0.06)', border: 'none', color: canSave ? 'var(--bg-base)' : 'var(--text-tertiary)', fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: canSave ? 'pointer' : 'not-allowed', transition: 'all .2s', letterSpacing: '-0.01em' }}
              >
                {editando ? 'Salvar alterações' : 'Adicionar a receber'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
