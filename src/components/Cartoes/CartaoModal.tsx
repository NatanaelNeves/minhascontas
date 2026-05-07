import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Cartao, CartaoInput, TipoCartao } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { formatMesLabel, centavosToDisplay, valorToCentStr } from '@/lib/utils'

const TIPOS: { value: TipoCartao; label: string }[] = [
  { value: 'credito', label: 'Crédito' },
  { value: 'vale_alimentacao', label: 'Alimentação' },
  { value: 'vale_combustivel', label: 'Combustível' },
  { value: 'vale_refeicao', label: 'Refeição' },
  { value: 'outros_beneficios', label: 'Outros' },
]

const CORES_CARTAO = ['#34c77b', '#a78bfa', '#f59e0b', '#f87171', '#60a5fa', '#e2e8f0']

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>
      {children}
    </p>
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
  editando: Cartao | null
  onSave: (data: CartaoInput) => void
  onClose: () => void
}

export function CartaoModal({ open, editando, onSave, onClose }: Props) {
  const { mesAtivo } = useAppStore()
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState<TipoCartao>('credito')
  const [limiteCentStr, setLimiteCentStr] = useState('')
  const [diaFechamento, setDiaFechamento] = useState(1)
  const [diaVencimento, setDiaVencimento] = useState(10)
  const [cor, setCor] = useState(CORES_CARTAO[0])

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setTipo(editando.tipo)
      setLimiteCentStr(valorToCentStr(editando.limite))
      setDiaFechamento(editando.diaFechamento)
      setDiaVencimento(editando.diaVencimento)
      setCor(editando.cor)
    } else {
      setNome('')
      setTipo('credito')
      setLimiteCentStr('')
      setDiaFechamento(1)
      setDiaVencimento(10)
      setCor(CORES_CARTAO[0])
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

  function getCents() { return parseInt(limiteCentStr || '0', 10) }

  function handleSave() {
    if (!nome.trim() || getCents() <= 0) return
    onSave({
      nome: nome.trim(),
      tipo,
      limite: getCents() / 100,
      diaFechamento,
      diaVencimento,
      cor,
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
                  {editando ? 'Editar cartão' : 'Novo cartão'}
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
                <Label>Nome</Label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="ex: Nubank, VR, Alelo..."
                  autoFocus
                  style={baseInput}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              {/* Tipo — chips */}
              <div>
                <Label>Tipo</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {TIPOS.map(t => {
                    const sel = tipo === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setTipo(t.value)}
                        style={{
                          padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500,
                          cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', letterSpacing: '-0.01em',
                          border: sel ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                          background: sel ? 'var(--text-primary)' : 'var(--bg-surface)',
                          color: sel ? 'var(--bg-base)' : 'var(--text-secondary)',
                        }}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Limite */}
              <div>
                <Label>Limite (R$)</Label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 600, color: 'var(--text-tertiary)', pointerEvents: 'none', userSelect: 'none' }}>
                    R$
                  </span>
                  <input
                    value={centavosToDisplay(limiteCentStr)}
                    onChange={e => setLimiteCentStr(e.target.value.replace(/\D/g, ''))}
                    placeholder="0,00"
                    inputMode="numeric"
                    style={{ ...baseInput, paddingLeft: 46, fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', height: 58 }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
              </div>

              {/* Dia de fechamento + vencimento */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <Label>Fecha todo dia</Label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={diaFechamento}
                    onChange={e => setDiaFechamento(Math.min(31, Math.max(1, Number(e.target.value))))}
                    style={{ ...baseInput, textAlign: 'center', fontSize: 20, fontWeight: 700 }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <Label>Vence todo dia</Label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={diaVencimento}
                    onChange={e => setDiaVencimento(Math.min(31, Math.max(1, Number(e.target.value))))}
                    style={{ ...baseInput, textAlign: 'center', fontSize: 20, fontWeight: 700 }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
              </div>

              {/* Cor */}
              <div>
                <Label>Cor de identificação</Label>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  {CORES_CARTAO.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCor(c)}
                      style={{
                        width: 28, height: 28, borderRadius: '50%', background: c,
                        border: cor === c ? '2.5px solid var(--text-primary)' : '2px solid transparent',
                        cursor: 'pointer', padding: 0,
                        boxShadow: cor === c ? '0 0 0 2px var(--bg-elevated)' : 'none',
                        transition: 'box-shadow .15s, border .15s',
                        outline: 'none',
                      }}
                    />
                  ))}
                </div>
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
                {editando ? 'Salvar alterações' : 'Adicionar cartão'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
