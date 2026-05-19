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
        color: 'var(--text-subtle)',
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
        background: on ? '#10B981' : 'rgba(255,255,255,0.1)',
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

function ParcelasStepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (v: number) => void
}) {
  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    width: 44,
    height: 44,
    borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: disabled ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.07)',
    color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
    fontSize: 22,
    fontWeight: 300,
    cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    userSelect: 'none',
    WebkitUserSelect: 'none',
    transition: 'background .15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <p
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--text-subtle)',
          letterSpacing: '0.09em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          type="button"
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
          style={btnStyle(value <= min)}
        >
          −
        </button>
        <span
          style={{
            minWidth: 36,
            textAlign: 'center',
            fontSize: 28,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.04em',
          }}
        >
          {value}
        </span>
        <button
          type="button"
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
          style={btnStyle(value >= max)}
        >
          +
        </button>
      </div>
    </div>
  )
}

const baseInput = {
  width: '100%',
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
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
    e.target.style.borderColor = 'rgba(124,114,216,0.55)'
    e.target.style.background = 'rgba(255,255,255,0.06)'
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'rgba(255,255,255,0.08)'
    e.target.style.background = 'rgba(255,255,255,0.04)'
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
              background: '#111113',
              borderLeft: '0.5px solid rgba(255,255,255,0.08)',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Sheet header */}
            <div
              style={{
                padding: '18px 22px',
                borderBottom: '0.5px solid rgba(255,255,255,0.06)',
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
                    color: 'var(--text-subtle)',
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
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.06)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                <X size={16} />
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
                      color: 'var(--text-subtle)',
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
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
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
                        background: form.categoria === opt.value ? 'rgba(255,255,255,0.92)' : 'transparent',
                        color: form.categoria === opt.value ? '#09090b' : 'var(--text-muted)',
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
                            ? '1px solid rgba(255,255,255,0.85)'
                            : '1px solid rgba(255,255,255,0.09)',
                          background: selected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.04)',
                          color: selected ? '#09090b' : 'var(--text-muted)',
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
                    color: form.vencimento ? '#fff' : 'var(--text-subtle)',
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
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
                    Parcelado
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>
                    Dividido em várias parcelas
                  </p>
                </div>
                <Toggle
                  on={temParcelas}
                  onToggle={() => {
                    const next = !temParcelas
                    setTemParcelas(next)
                    if (next && !form.parcelas) {
                      setForm(f => ({ ...f, parcelas: { atual: 1, total: 1 } }))
                    }
                  }}
                />
              </div>

              <AnimatePresence>
                {temParcelas && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 16,
                        padding: '14px 0 2px',
                      }}
                    >
                      <ParcelasStepper
                        label="Parcela atual"
                        value={form.parcelas?.atual ?? 1}
                        min={1}
                        max={form.parcelas?.total ?? 1}
                        onChange={v =>
                          setForm(f => ({
                            ...f,
                            parcelas: { atual: v, total: f.parcelas?.total ?? 1 },
                          }))
                        }
                      />
                      <div style={{ color: 'rgba(255,255,255,0.18)', fontSize: 22, fontWeight: 300, paddingTop: 18 }}>/</div>
                      <ParcelasStepper
                        label="Total"
                        value={form.parcelas?.total ?? 1}
                        min={form.parcelas?.atual ?? 1}
                        max={999}
                        onChange={v =>
                          setForm(f => ({
                            ...f,
                            parcelas: { atual: f.parcelas?.atual ?? 1, total: v },
                          }))
                        }
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
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 500, color: '#fff', letterSpacing: '-0.01em' }}>
                    Já foi pago
                  </p>
                  <p style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2 }}>
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
                borderTop: '0.5px solid rgba(255,255,255,0.06)',
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
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-muted)',
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
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
                  background: canSave ? 'rgba(255,255,255,0.94)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: canSave ? '#09090b' : 'var(--text-subtle)',
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
