import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Conta, ContaInput, Categoria, FormaPagamento } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { formatMesLabel } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ContaInput) => void
  editando?: Conta | null
}

const DEFAULT_FORM: ContaInput = {
  nome: '',
  valor: 0,
  categoria: 'fixo',
  formaPagamento: 'pix',
  vencimento: null,
  pago: false,
  parcelas: null,
}

const CATEGORIAS: { value: Categoria; label: string }[] = [
  { value: 'fixo', label: 'Fixo' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'extra', label: 'Extra' },
]

const FORMAS: { value: FormaPagamento; label: string; icon: string }[] = [
  { value: 'pix', label: 'Pix', icon: '⚡' },
  { value: 'debito', label: 'Débito', icon: '💳' },
  { value: 'boleto', label: 'Boleto', icon: '📄' },
  { value: 'credito', label: 'Crédito', icon: '🏦' },
]

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--text-tertiary)',
        letterSpacing: '0.09em',
        textTransform: 'uppercase',
        marginBottom: 8,
      }}
    >
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
        width: 40,
        height: 22,
        borderRadius: 99,
        background: on ? 'var(--green)' : 'rgba(255,255,255,0.1)',
        position: 'relative',
        cursor: 'pointer',
        border: 'none',
        padding: 0,
        flexShrink: 0,
        transition: 'background .2s',
      }}
    >
      <motion.div
        animate={{ x: on ? 20 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        style={{
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: '#fff',
          position: 'absolute',
          top: 3,
          left: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
        }}
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

export function BillModal({ open, onClose, onSave, editando }: Props) {
  const { mesAtivo } = useAppStore()
  const [form, setForm] = useState<ContaInput>(DEFAULT_FORM)
  const [valorStr, setValorStr] = useState('')
  const [temParcelas, setTemParcelas] = useState(false)

  useEffect(() => {
    if (editando) {
      setForm({
        nome: editando.nome,
        valor: editando.valor,
        categoria: editando.categoria,
        formaPagamento: editando.formaPagamento,
        vencimento: editando.vencimento,
        pago: editando.pago,
        parcelas: editando.parcelas,
      })
      setValorStr(editando.valor.toFixed(2).replace('.', ','))
      setTemParcelas(!!editando.parcelas)
    } else {
      setForm(DEFAULT_FORM)
      setValorStr('')
      setTemParcelas(false)
    }
  }, [editando, open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  function parseValor(str: string): number {
    return parseFloat(str.replace(',', '.')) || 0
  }

  function handleSave() {
    if (!form.nome.trim() || parseValor(valorStr) <= 0) return
    onSave({
      ...form,
      valor: parseValor(valorStr),
      parcelas: temParcelas && form.parcelas ? form.parcelas : null,
    })
    onClose()
  }

  const canSave = form.nome.trim().length > 0 && parseValor(valorStr) > 0

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
          {/* Backdrop */}
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

          {/* Side sheet */}
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
            {/* Sheet header */}
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
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    letterSpacing: '0.09em',
                    textTransform: 'uppercase',
                    marginBottom: 3,
                  }}
                >
                  {formatMesLabel(mesAtivo)}
                </p>
                <p
                  style={{
                    fontSize: 18,
                    fontWeight: 600,
                    color: '#fff',
                    letterSpacing: '-0.03em',
                  }}
                >
                  {editando ? 'Editar conta' : 'Nova conta'}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 8,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-tertiary)',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              >
                <X size={14} />
              </button>
            </div>

            {/* Sheet body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '22px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {/* Nome */}
              <div>
                <Label>Nome</Label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="ex: Netflix, Aluguel, Fatura..."
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
                  <span
                    style={{
                      position: 'absolute',
                      left: 14,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: 16,
                      fontWeight: 600,
                      color: 'var(--text-tertiary)',
                      pointerEvents: 'none',
                      letterSpacing: '-0.02em',
                      userSelect: 'none',
                    }}
                  >
                    R$
                  </span>
                  <input
                    value={valorStr}
                    onChange={e => setValorStr(e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                    style={{
                      ...baseInput,
                      paddingLeft: 46,
                      fontSize: 30,
                      fontWeight: 700,
                      letterSpacing: '-0.05em',
                      height: 62,
                    }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
              </div>

              {/* Categoria — segmented control */}
              <div>
                <Label>Categoria</Label>
                <div
                  style={{
                    display: 'flex',
                    gap: 3,
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: 3,
                  }}
                >
                  {CATEGORIAS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, categoria: opt.value }))}
                      style={{
                        flex: 1,
                        padding: '8px 6px',
                        borderRadius: 7,
                        fontSize: 13,
                        fontWeight: 500,
                        textAlign: 'center',
                        cursor: 'pointer',
                        border: 'none',
                        fontFamily: 'inherit',
                        transition: 'all .15s',
                        background: form.categoria === opt.value ? 'var(--text-primary)' : 'transparent',
                        color: form.categoria === opt.value ? 'var(--bg-base)' : 'var(--text-secondary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Forma de pagamento — chips arredondados */}
              <div>
                <Label>Forma de pagamento</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {FORMAS.map(opt => {
                    const selected = form.formaPagamento === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, formaPagamento: opt.value }))}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 99,
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          transition: 'all .15s',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          border: selected
                            ? '1px solid var(--text-primary)'
                            : '1px solid var(--border)',
                          background: selected ? 'var(--text-primary)' : 'var(--bg-surface)',
                          color: selected ? 'var(--bg-base)' : 'var(--text-secondary)',
                          letterSpacing: '-0.01em',
                        }}
                      >
                        <span style={{ fontSize: 13 }}>{opt.icon}</span>
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Vencimento */}
              <div>
                <Label>Vencimento (opcional)</Label>
                <input
                  type="date"
                  value={form.vencimento ?? ''}
                  onChange={e => setForm(f => ({ ...f, vencimento: e.target.value || null }))}
                  style={{
                    ...baseInput,
                    color: form.vencimento ? 'var(--text-primary)' : 'var(--text-tertiary)',
                    colorScheme: 'dark',
                  }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              {/* Parcelado — toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    Parcelado
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Dividido em várias parcelas
                  </p>
                </div>
                <Toggle on={temParcelas} onToggle={() => setTemParcelas(v => !v)} />
              </div>

              <AnimatePresence>
                {temParcelas && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ display: 'flex', gap: 12, overflow: 'hidden' }}
                  >
                    <div style={{ flex: 1 }}>
                      <Label>Parcela atual</Label>
                      <input
                        type="number"
                        min={1}
                        value={form.parcelas?.atual ?? 1}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            parcelas: { atual: Number(e.target.value), total: f.parcelas?.total ?? 1 },
                          }))
                        }
                        style={{ ...baseInput, textAlign: 'center', fontSize: 18, fontWeight: 600 }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Label>Total</Label>
                      <input
                        type="number"
                        min={1}
                        value={form.parcelas?.total ?? 1}
                        onChange={e =>
                          setForm(f => ({
                            ...f,
                            parcelas: { atual: f.parcelas?.atual ?? 1, total: Number(e.target.value) },
                          }))
                        }
                        style={{ ...baseInput, textAlign: 'center', fontSize: 18, fontWeight: 600 }}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Pago — toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                    Já foi pago
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                    Marcar como pago agora
                  </p>
                </div>
                <Toggle on={form.pago} onToggle={() => setForm(f => ({ ...f, pago: !f.pago }))} />
              </div>
            </div>

            {/* Sheet footer */}
            <div
              style={{
                padding: '14px 22px',
                borderTop: '0.5px solid var(--border)',
                display: 'flex',
                gap: 8,
                flexShrink: 0,
              }}
            >
              <button
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 10,
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave}
                style={{
                  flex: 2,
                  padding: '12px',
                  borderRadius: 10,
                  background: canSave ? 'var(--text-primary)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: canSave ? 'var(--bg-base)' : 'var(--text-tertiary)',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  cursor: canSave ? 'pointer' : 'not-allowed',
                  transition: 'all .2s',
                  letterSpacing: '-0.01em',
                }}
              >
                {editando ? 'Salvar alterações' : 'Adicionar conta'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
