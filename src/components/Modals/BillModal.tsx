import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Conta, ContaInput, Categoria, FormaPagamento, Cartao, CartaoCredito, BancoComSaldo } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { formatMesLabel, centavosToDisplay, valorToCentStr, formatBRL, mesIdAddMeses, mesesEntreMesIds, mesIdToShortLabel } from '@/lib/utils'

interface Pagamento {
  bancoId?: string
  cartaoId?: string
  data: string
}

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ContaInput, pagamento?: Pagamento) => void
  onSaveParcelada?: (data: ContaInput, parcelaTotal: number, parcelaInicialAtual: number) => void
  editando?: Conta | null
  cartoes: Cartao[]
  bancos: BancoComSaldo[]
  onNavigateToCartoes?: () => void
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

const TIPO_LABEL: Record<string, string> = {
  credito: 'Crédito',
  vale_alimentacao: 'Vale Alim.',
  vale_combustivel: 'Vale Comb.',
  vale_refeicao: 'Vale Ref.',
  outros_beneficios: 'Benefício',
}

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
        position: 'relative', cursor: 'pointer',
        border: 'none', padding: 0, flexShrink: 0, transition: 'background .2s',
      }}
    >
      <motion.div
        animate={{ x: on ? 20 : 3 }}
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        style={{
          width: 16, height: 16, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 3, left: 0,
          boxShadow: '0 1px 4px rgba(0,0,0,0.35)',
        }}
      />
    </button>
  )
}

function Stepper({
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
  const atMin = value <= min
  const atMax = value >= max
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
        {label}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={atMin}
          style={{
            width: 52, height: 52, border: 'none', background: 'transparent',
            color: atMin ? 'rgba(255,255,255,0.15)' : 'var(--text-primary)',
            fontSize: 24, fontWeight: 300, cursor: atMin ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRight: '1px solid var(--border)', flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
          onPointerDown={e => { if (!atMin) (e.currentTarget.style.background = 'rgba(255,255,255,0.06)') }}
          onPointerUp={e => { (e.currentTarget.style.background = 'transparent') }}
          onPointerLeave={e => { (e.currentTarget.style.background = 'transparent') }}
        >
          −
        </button>
        <span style={{
          minWidth: 48, textAlign: 'center',
          fontSize: 22, fontWeight: 700, color: '#fff',
          letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
          padding: '0 4px',
        }}>
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={atMax}
          style={{
            width: 52, height: 52, border: 'none', background: 'transparent',
            color: atMax ? 'rgba(255,255,255,0.15)' : 'var(--text-primary)',
            fontSize: 24, fontWeight: 300, cursor: atMax ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderLeft: '1px solid var(--border)', flexShrink: 0,
            WebkitTapHighlightColor: 'transparent',
          }}
          onPointerDown={e => { if (!atMax) (e.currentTarget.style.background = 'rgba(255,255,255,0.06)') }}
          onPointerUp={e => { (e.currentTarget.style.background = 'transparent') }}
          onPointerLeave={e => { (e.currentTarget.style.background = 'transparent') }}
        >
          +
        </button>
      </div>
    </div>
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

export function BillModal({ open, onClose, onSave, onSaveParcelada, editando, cartoes, bancos, onNavigateToCartoes }: Props) {
  const { mesAtivo } = useAppStore()

  const [form, setForm] = useState<ContaInput>(DEFAULT_FORM)
  const [cartaoId, setCartaoId] = useState('')

  // Main valor (when !temParcelas)
  const [centStr, setCentStr] = useState('')

  // Parcelamento
  const [temParcelas, setTemParcelas] = useState(false)
  const [valorTotalCentStr, setValorTotalCentStr] = useState('')
  const [parcelasTotal, setParcelasTotal] = useState(2)
  const [parcelaAtual, setParcelaAtual] = useState(1)
  const [mesInicio, setMesInicio] = useState('')
  const [recorrente, setRecorrente] = useState(true)
  const [selectedBancoId, setSelectedBancoId] = useState('')
  const [selectedCartaoId, setSelectedCartaoId] = useState('')
  const [dataPagamento, setDataPagamento] = useState(() => new Date().toISOString().split('T')[0])

  const bancosCorrente = useMemo(() => bancos.filter(b => b.tipo === 'corrente'), [bancos])

  const mesOptions = useMemo(() => {
    const opts: string[] = []
    for (let i = 60; i >= 0; i--) opts.push(mesIdAddMeses(mesAtivo, -i))
    return opts
  }, [mesAtivo])

  const creditCards = cartoes.filter((c): c is CartaoCredito => c.tipo === 'credito')

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
      setCartaoId(editando.cartaoId ?? '')
      setCentStr(valorToCentStr(editando.valor))
      setRecorrente(editando.recorrente ?? false)
      const hasParcelas = !!editando.parcelas
      setTemParcelas(hasParcelas)
      if (hasParcelas && editando.parcelas) {
        setParcelasTotal(editando.parcelas.total)
        setParcelaAtual(editando.parcelas.atual)
        setValorTotalCentStr(valorToCentStr(editando.valor * editando.parcelas.total))
      } else {
        setParcelasTotal(2)
        setParcelaAtual(1)
        setValorTotalCentStr('')
      }
    } else {
      setForm(DEFAULT_FORM)
      setCartaoId('')
      setCentStr('')
      setTemParcelas(false)
      setParcelasTotal(2)
      setParcelaAtual(1)
      setValorTotalCentStr('')
      setMesInicio('')
      setRecorrente(true)
      setSelectedBancoId(bancosCorrente[0]?.id ?? '')
      setSelectedCartaoId('')
      setDataPagamento(new Date().toISOString().split('T')[0])
    }
  }, [editando, open])

  useEffect(() => {
    if (!mesInicio || !mesAtivo) return
    const diff = mesesEntreMesIds(mesInicio, mesAtivo)
    setParcelaAtual(Math.max(1, diff + 1))
  }, [mesInicio, mesAtivo])

  useEffect(() => {
    // If category is cartao, payment is always credit when a card is chosen
    if (form.categoria === 'cartao' && cartaoId) {
      setForm(f => ({ ...f, formaPagamento: 'credito' }))
      return
    }

    // If parcelado with no card selected, avoid leaving forma as credito
    if (temParcelas && !cartaoId) {
      setForm(f => f.formaPagamento === 'credito' ? { ...f, formaPagamento: 'pix' } : f)
    }
  }, [temParcelas, cartaoId, form.categoria])

  // Auto-fill vencimento for new card purchases (não em edição)
  useEffect(() => {
    if (!mesAtivo) return
    if (editando) return
    if (form.categoria !== 'cartao') return
    if (!cartaoId) return
    if (temParcelas) return
    const c = creditCards.find(c => c.id === cartaoId)
    if (!c) return
    const dia = c.diaVencimento as number | undefined
    if (!dia) return
    const dayStr = String(Math.max(1, Math.min(28, dia))).padStart(2, '0')
    setForm(f => ({ ...f, vencimento: `${mesAtivo}-${dayStr}` }))
  }, [cartaoId, form.categoria, temParcelas, mesAtivo, cartoes, editando])

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

  function getValorTotalCents(): number {
    return parseInt(valorTotalCentStr || '0', 10)
  }

  function getParcelaCents(): number {
    const total = getValorTotalCents()
    return parcelasTotal > 0 ? Math.round(total / parcelasTotal) : 0
  }

  function getCents(): number {
    if (!temParcelas) return parseInt(centStr || '0', 10)
    if (form.categoria === 'fixo') return parseInt(centStr || '0', 10)
    return getParcelaCents()
  }

  const valorTotalReais = getValorTotalCents() / 100
  const valorParcelaReais = getParcelaCents() / 100
  const divergencia = valorTotalCentStr && parcelasTotal > 0
    ? Math.abs(valorTotalReais - valorParcelaReais * parcelasTotal) > valorTotalReais * 0.01
    : false

  const mostrarForma = form.categoria !== 'cartao' && !(temParcelas && !!cartaoId)
  const formasFiltradas = (temParcelas && !cartaoId)
    ? FORMAS.filter(f => f.value !== 'credito')
    : FORMAS

  function handleSave() {
    if (!form.nome.trim() || getCents() <= 0) return
    const data: ContaInput = {
      ...form,
      valor: getCents() / 100,
      parcelas: temParcelas ? { atual: parcelaAtual, total: parcelasTotal } : null,
      ...(cartaoId ? { cartaoId } : {}),
      recorrente: form.categoria === 'fixo' && !temParcelas ? recorrente : false,
    }
    if (temParcelas && parcelasTotal > 1 && !editando && onSaveParcelada) {
      onSaveParcelada(data, parcelasTotal, parcelaAtual)
    } else {
      const parcelas = editando?.parcelas ?? (temParcelas ? { atual: parcelaAtual, total: parcelasTotal } : null)
      const pagamento: Pagamento | undefined = (() => {
        if (!data.pago || editando) return undefined
        const isCreditoSemCartao = form.formaPagamento === 'credito' && !cartaoId
        if (isCreditoSemCartao && selectedCartaoId) return { cartaoId: selectedCartaoId, data: dataPagamento }
        if (form.formaPagamento !== 'credito' && selectedBancoId) return { bancoId: selectedBancoId, data: dataPagamento }
        return undefined
      })()
      onSave({ ...data, parcelas }, pagamento)
    }
    onClose()
  }

  const canSave = (() => {
    if (!form.nome.trim()) return false
    if (getCents() <= 0) return false
    if (form.categoria === 'cartao' && !cartaoId) return false
    if (form.categoria === 'extra' && form.formaPagamento === 'credito' && !cartaoId) return false
    if (form.pago && !editando) {
      const isCreditoSemCartao = form.formaPagamento === 'credito' && !cartaoId
      if (isCreditoSemCartao && creditCards.length > 0 && !selectedCartaoId) return false
      if (form.formaPagamento !== 'credito' && bancosCorrente.length > 0 && !selectedBancoId) return false
    }
    return true
  })()

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
              display: 'flex', flexDirection: 'column', overflowY: 'auto', overscrollBehavior: 'contain',
            }}
          >
            {/* Header */}
            <div style={{ padding: '18px 22px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0, position: 'sticky', top: 0, zIndex: 2, background: 'var(--bg-elevated)' }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 3 }}>
                  {formatMesLabel(mesAtivo)}
                </p>
                <p style={{ fontSize: 18, fontWeight: 600, color: '#fff', letterSpacing: '-0.03em' }}>
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
                  color: 'var(--text-tertiary)',
                  transition: 'background .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="no-scrollbar" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: 20, scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              {/* Nome */}
              <div>
                <Label>Nome</Label>
                <input
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder={form.categoria === 'fixo' ? 'ex: Internet, Faculdade, Empréstimo Caixa...' : 'ex: Netflix, Aluguel, Fatura...'}
                  autoFocus
                  style={baseInput}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              {/* Categoria */}
              <div>
                <Label>Categoria</Label>
                <div style={{ display: 'flex', gap: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
                  {CATEGORIAS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setForm(f => ({ ...f, categoria: opt.value }))
                        if (opt.value !== 'cartao') setCartaoId('')
                      }}
                      style={{
                        flex: 1, padding: '8px 6px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                        textAlign: 'center', cursor: 'pointer', border: 'none', fontFamily: 'inherit',
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
                {/* Descriptive hint under category selector */}
                {!form.nome.trim() && (
                  <p style={{ marginTop: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                    {form.categoria === 'fixo' ? '💡 Conta recorrente mensal — internet, faculdade, seguro' :
                      form.categoria === 'cartao' ? '💳 Compra no cartão — à vista ou parcelada' : '🎯 Gasto pontual — presente, viagem, consulta'}
                  </p>
                )}
              </div>

              {/* Cartão picker — aparece para 'cartao' (obrigatório) ou quando forma é crédito em 'extra'/'fixo' */}
              <AnimatePresence>
                {(form.categoria === 'cartao' || ((form.categoria === 'extra' || form.categoria === 'fixo') && form.formaPagamento === 'credito')) && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <Label>Qual cartão?</Label>
                        {creditCards.length === 0 ? (
                          <div style={{
                            padding: '14px', borderRadius: 10,
                            background: 'var(--bg-surface)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          }}>
                            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
                              Nenhum cartão de crédito cadastrado.
                            </p>
                            {onNavigateToCartoes && (
                              <button
                                type="button"
                                onClick={() => { onClose(); onNavigateToCartoes() }}
                                style={{
                                  padding: '6px 14px', borderRadius: 99, fontSize: 12, fontWeight: 600,
                                  background: 'var(--text-primary)', color: 'var(--bg-base)',
                                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                                }}
                              >
                                Ir para Cartões
                              </button>
                            )}
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            {creditCards.map(c => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setCartaoId(c.id)}
                                style={{
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                  padding: '11px 14px', borderRadius: 10,
                                  background: cartaoId === c.id ? 'var(--text-primary)' : 'var(--bg-surface)',
                                  border: cartaoId === c.id ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                                  cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
                                  <span style={{ fontSize: 14, fontWeight: 500, color: cartaoId === c.id ? 'var(--bg-base)' : 'var(--text-primary)' }}>
                                    {c.nome}
                                  </span>
                                </div>
                                <span style={{
                                  fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99,
                                  background: cartaoId === c.id ? 'rgba(0,0,0,0.15)' : 'var(--bg-elevated)',
                                  color: cartaoId === c.id ? 'var(--bg-base)' : 'var(--text-tertiary)',
                                  letterSpacing: '0.02em',
                                }}>
                                  {TIPO_LABEL[c.tipo] ?? c.tipo}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Inline error */}
                      {creditCards.length > 0 && !cartaoId && (
                        <p style={{ fontSize: 12, color: 'var(--red)', letterSpacing: '-0.01em' }}>
                          Selecione o cartão para continuar
                        </p>
                      )}

                      {/* Info: parcela debitada do limite */}
                      {temParcelas && !!cartaoId && valorParcelaReais > 0 && (
                        <div style={{
                          padding: '10px 14px', borderRadius: 10,
                          background: 'rgba(52,199,123,0.08)', border: '1px solid rgba(52,199,123,0.2)',
                        }}>
                          <p style={{ fontSize: 12, color: 'var(--green)', lineHeight: 1.4 }}>
                            💳 Será debitado {formatBRL(valorParcelaReais)} do limite mensalmente
                          </p>
                        </div>
                      )}

                      {/* Info: inclusão na fatura — compra à vista no cartão */}
                      {!temParcelas && !!cartaoId && (
                        (() => {
                          const c = creditCards.find(x => x.id === cartaoId)
                          const dia = c?.diaFechamento as number | undefined
                          const hoje = new Date().getDate()
                          const mesRef = dia && hoje > dia ? mesIdAddMeses(mesAtivo, 1) : mesAtivo
                          return (
                            <div style={{
                              padding: '10px 14px', borderRadius: 10,
                              background: 'var(--bg-surface)', border: '1px solid var(--border)',
                            }}>
                              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', lineHeight: 1.4 }}>
                                💳 Será incluído na fatura de {mesIdToShortLabel(mesRef)}
                              </p>
                            </div>
                          )
                        })()
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Valor — só quando !temParcelas */}
              {!temParcelas && (
                <div>
                  <Label>Valor</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{
                      position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                      fontSize: 16, fontWeight: 600, color: 'var(--text-tertiary)',
                      pointerEvents: 'none', letterSpacing: '-0.02em', userSelect: 'none',
                    }}>
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
              )}

              {/* Parcelamento fields — quando temParcelas */}
              <AnimatePresence>
                {temParcelas && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    {form.categoria === 'fixo' ? (
                      // Fixo parcelado: financiamento/empréstimo — valor mensal direto
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <Label>Valor da parcela</Label>
                          <div style={{ position: 'relative' }}>
                            <span style={{
                              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                              fontSize: 16, fontWeight: 600, color: 'var(--text-tertiary)',
                              pointerEvents: 'none', userSelect: 'none',
                            }}>
                              R$
                            </span>
                            <input
                              value={centavosToDisplay(centStr)}
                              onChange={e => setCentStr(e.target.value.replace(/\D/g, ''))}
                              placeholder="0,00"
                              inputMode="numeric"
                              style={{ ...baseInput, paddingLeft: 46, fontSize: 28, fontWeight: 700, letterSpacing: '-0.05em', height: 58 }}
                              onFocus={focusInput}
                              onBlur={blurInput}
                            />
                          </div>
                        </div>

                        {!editando && (
                          <div>
                            <Label>Começou em qual mês?</Label>
                            <select
                              value={mesInicio}
                              onChange={e => setMesInicio(e.target.value)}
                              style={{ ...baseInput, colorScheme: 'dark' }}
                            >
                              <option value="">Mês atual (parcela 1)</option>
                              {mesOptions.slice(0, -1).reverse().map(m => (
                                <option key={m} value={m}>{mesIdToShortLabel(m)}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
                          <Stepper
                            label="Parcela atual"
                            value={parcelaAtual}
                            min={1}
                            max={parcelasTotal}
                            onChange={setParcelaAtual}
                          />
                          <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', fontWeight: 300, paddingBottom: 14 }}>/</span>
                          <Stepper
                            label="Total de parcelas"
                            value={parcelasTotal}
                            min={Math.max(2, parcelaAtual)}
                            max={480}
                            onChange={setParcelasTotal}
                          />
                        </div>

                        {getCents() > 0 && parcelasTotal >= 2 && (
                          <div style={{
                            padding: '12px 14px', borderRadius: 10,
                            background: 'var(--bg-surface)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                          }}>
                            <div>
                              <p style={{ fontSize: 12, color: 'var(--text-tertiary)', marginBottom: 2 }}>
                                Total restante
                              </p>
                              <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                                Termina {mesIdToShortLabel(mesIdAddMeses(mesAtivo, parcelasTotal - parcelaAtual))}
                              </p>
                            </div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                              {formatBRL((parcelasTotal - parcelaAtual + 1) * (getCents() / 100))}
                            </p>
                          </div>
                        )}

                        {!editando && getCents() > 0 && (
                          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                            {parcelasTotal - parcelaAtual + 1} parcelas serão criadas automaticamente.
                          </p>
                        )}
                      </div>
                    ) : (
                      // Cartão parcelado: valor total do bem → deriva valor da parcela
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div>
                          <Label>Valor total do bem</Label>
                          <div style={{ position: 'relative' }}>
                            <span style={{
                              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                              fontSize: 16, fontWeight: 600, color: 'var(--text-tertiary)',
                              pointerEvents: 'none', userSelect: 'none',
                            }}>
                              R$
                            </span>
                            <input
                              value={centavosToDisplay(valorTotalCentStr)}
                              onChange={e => setValorTotalCentStr(e.target.value.replace(/\D/g, ''))}
                              placeholder="0,00"
                              inputMode="numeric"
                              style={{ ...baseInput, paddingLeft: 46, fontSize: 28, fontWeight: 700, letterSpacing: '-0.05em', height: 58 }}
                              onFocus={focusInput}
                              onBlur={blurInput}
                            />
                          </div>
                        </div>

                        {!editando && (
                          <div>
                            <Label>Começou em qual mês?</Label>
                            <select
                              value={mesInicio}
                              onChange={e => setMesInicio(e.target.value)}
                              style={{ ...baseInput, colorScheme: 'dark' }}
                            >
                              <option value="">Mês atual (parcela 1)</option>
                              {mesOptions.slice(0, -1).reverse().map(m => (
                                <option key={m} value={m}>{mesIdToShortLabel(m)}</option>
                              ))}
                            </select>
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 12 }}>
                          <Stepper
                            label="Parcela atual"
                            value={parcelaAtual}
                            min={1}
                            max={parcelasTotal}
                            onChange={setParcelaAtual}
                          />
                          <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.2)', fontWeight: 300, paddingBottom: 14 }}>/</span>
                          <Stepper
                            label="Total de parcelas"
                            value={parcelasTotal}
                            min={Math.max(2, parcelaAtual)}
                            max={120}
                            onChange={setParcelasTotal}
                          />
                        </div>

                        {getValorTotalCents() > 0 && parcelasTotal >= 2 && (
                          <div style={{
                            padding: '12px 14px', borderRadius: 10,
                            background: 'var(--bg-surface)', border: '1px solid var(--border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          }}>
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                              Valor de cada parcela
                            </p>
                            <p style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                              {formatBRL(valorParcelaReais)}
                            </p>
                          </div>
                        )}

                        {divergencia && (
                          <div style={{
                            padding: '10px 14px', borderRadius: 10,
                            background: 'var(--amber-muted)', border: '1px solid rgba(245,158,11,0.25)',
                          }}>
                            <p style={{ fontSize: 12, color: 'var(--amber)', lineHeight: 1.4 }}>
                              Atenção: valor total ÷ parcelas ≠ valor da parcela (diferença de centavos por arredondamento)
                            </p>
                          </div>
                        )}

                        {!editando && (
                          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
                            {parcelasTotal - parcelaAtual + 1} parcelas serão criadas automaticamente a partir do mês atual.
                          </p>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Vencimento */}
              {!(form.categoria === 'cartao' && temParcelas) && (
                <div>
                  <Label>Vencimento (opcional)</Label>
                  <input
                    type="date"
                    value={form.vencimento ?? ''}
                    onChange={e => setForm(f => ({ ...f, vencimento: e.target.value || null }))}
                    style={{ ...baseInput, color: form.vencimento ? 'var(--text-primary)' : 'var(--text-tertiary)', colorScheme: 'dark' }}
                    onFocus={focusInput}
                    onBlur={blurInput}
                  />
                </div>
              )}

              {/* Forma de pagamento — oculta quando parcelado + cartão selecionado */}
              {mostrarForma && (
                <div>
                  <Label>Forma de pagamento</Label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {formasFiltradas.map(opt => {
                      const selected = form.formaPagamento === opt.value
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setForm(f => ({ ...f, formaPagamento: opt.value }))}
                          style={{
                            padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                            display: 'flex', alignItems: 'center', gap: 5,
                            border: selected ? '1px solid var(--text-primary)' : '1px solid var(--border)',
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
              )}

              {/* Parcelado — toggle (cartão ou fixo) */}
              {(form.categoria === 'cartao' || form.categoria === 'fixo') && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', background: 'var(--bg-surface)',
                  border: '1px solid var(--border)', borderRadius: 10,
                }}>
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
              )}

              {/* Repete todo mês — toggle */}
              {form.categoria === 'fixo' && !temParcelas && !editando?.parcelamentoId && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 14px', background: 'var(--bg-surface)',
                  border: '1px solid var(--border)', borderRadius: 10,
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      Repete todo mês
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>
                      Copiado automaticamente ao criar novo mês
                    </p>
                  </div>
                  <Toggle on={recorrente} onToggle={() => setRecorrente(v => !v)} />
                </div>
              )}

              {/* Pago — toggle */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 14px', background: 'var(--bg-surface)',
                border: '1px solid var(--border)', borderRadius: 10,
              }}>
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

              {/* Banco/cartão e data — aparece quando pago=true em nova conta */}
              <AnimatePresence>
                {form.pago && !editando && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div>
                        <Label>Data do pagamento</Label>
                        <input
                          type="date"
                          value={dataPagamento}
                          onChange={e => setDataPagamento(e.target.value)}
                          style={{ ...baseInput, colorScheme: 'dark' }}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        />
                      </div>

                      {form.formaPagamento === 'credito' ? (!cartaoId ? (
                        <div>
                          <Label>Cartão de crédito</Label>
                          {creditCards.length === 0 ? (
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                              Nenhum cartão de crédito cadastrado.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {creditCards.map(c => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setSelectedCartaoId(c.id)}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '11px 14px', borderRadius: 10,
                                    background: selectedCartaoId === c.id ? 'var(--text-primary)' : 'var(--bg-surface)',
                                    border: selectedCartaoId === c.id ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.cor, flexShrink: 0 }} />
                                    <span style={{ fontSize: 14, fontWeight: 500, color: selectedCartaoId === c.id ? 'var(--bg-base)' : 'var(--text-primary)' }}>
                                      {c.nome}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: 10, fontWeight: 500, padding: '2px 8px', borderRadius: 99, background: selectedCartaoId === c.id ? 'rgba(0,0,0,0.15)' : 'var(--bg-elevated)', color: selectedCartaoId === c.id ? 'var(--bg-base)' : 'var(--text-tertiary)' }}>
                                    Crédito
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : null) : (
                        <div>
                          <Label>Débitar de</Label>
                          {bancosCorrente.length === 0 ? (
                            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
                              Nenhum banco cadastrado.
                            </p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {bancosCorrente.map(b => (
                                <button
                                  key={b.id}
                                  type="button"
                                  onClick={() => setSelectedBancoId(b.id)}
                                  style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '11px 14px', borderRadius: 10,
                                    background: selectedBancoId === b.id ? 'var(--text-primary)' : 'var(--bg-surface)',
                                    border: selectedBancoId === b.id ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                                    cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {b.cor && <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.cor, flexShrink: 0 }} />}
                                    <span style={{ fontSize: 14, fontWeight: 500, color: selectedBancoId === b.id ? 'var(--bg-base)' : 'var(--text-primary)' }}>
                                      {b.nome}
                                    </span>
                                  </div>
                                  <span style={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: selectedBancoId === b.id ? 'var(--bg-base)' : 'var(--text-secondary)' }}>
                                    {formatBRL(b.saldoAtual)}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            <div style={{ padding: '14px 22px', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 8, flexShrink: 0, position: 'sticky', bottom: 0, zIndex: 2, background: 'var(--bg-elevated)' }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                  fontFamily: 'inherit', cursor: 'pointer', letterSpacing: '-0.01em', transition: 'color .15s',
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
                  flex: 2, padding: '12px', borderRadius: 10,
                  background: canSave ? 'var(--text-primary)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: canSave ? 'var(--bg-base)' : 'var(--text-tertiary)',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit', cursor: canSave ? 'pointer' : 'not-allowed',
                  transition: 'all .2s', letterSpacing: '-0.01em',
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
