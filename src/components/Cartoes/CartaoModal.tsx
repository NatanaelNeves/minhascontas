import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Cartao, CartaoComSaldo, CartaoInput, TipoCartao } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { formatMesLabel, centavosToDisplay, valorToCentStr, formatBRL } from '@/lib/utils'
import { OPERADORAS_BENEFICIO } from '@/lib/cartoes'

const TIPOS: { value: TipoCartao; label: string }[] = [
  { value: 'credito', label: 'Crédito' },
  { value: 'vale_alimentacao', label: 'Alimentação' },
  { value: 'vale_combustivel', label: 'Combustível' },
  { value: 'vale_refeicao', label: 'Refeição' },
  { value: 'outros_beneficios', label: 'Outros' },
]

const CORES_CARTAO = ['#34c77b', '#a78bfa', '#f59e0b', '#f87171', '#60a5fa', '#e2e8f0']

function DayGrid({ value, onChange }: { value: number; onChange: (d: number) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 5 }}>
      {Array.from({ length: 31 }, (_, i) => i + 1).map(day => {
        const sel = value === day
        return (
          <button
            key={day}
            type="button"
            onClick={() => onChange(day)}
            style={{
              padding: '9px 0',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: sel ? 700 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'all .12s',
              border: sel ? '1px solid var(--text-primary)' : '1px solid var(--border)',
              background: sel ? 'var(--text-primary)' : 'var(--bg-surface)',
              color: sel ? 'var(--bg-base)' : 'var(--text-secondary)',
              textAlign: 'center',
            }}
          >
            {day}
          </button>
        )
      })}
    </div>
  )
}

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
  const [gastoAtualCentStr, setGastoAtualCentStr] = useState('')
  const [saldoAtualCentStr, setSaldoAtualCentStr] = useState('')
  const [recargaMensalCentStr, setRecargaMensalCentStr] = useState('')
  const [diaRecarga, setDiaRecarga] = useState<number | ''>('')
  const [operadora, setOperadora] = useState('')
  const [cor, setCor] = useState(CORES_CARTAO[0])
  const [disponivelCentStr, setDisponivelCentStr] = useState('')
  const [disponivelAlterado, setDisponivelAlterado] = useState(false)
  const [rastrearDetalhado, setRastrearDetalhado] = useState(true)

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setTipo(editando.tipo)
      setCor(editando.cor)
      if (editando.tipo === 'credito') {
        setLimiteCentStr(valorToCentStr(editando.limite))
        const dispAtual = Math.max(0, (editando as CartaoComSaldo).limiteDisponivel ?? editando.limite)
        setDisponivelCentStr(valorToCentStr(dispAtual))
        setDisponivelAlterado(false)
        setDiaFechamento(editando.diaFechamento)
        setDiaVencimento(editando.diaVencimento)
        setGastoAtualCentStr(editando.gastoAtual ? valorToCentStr(editando.gastoAtual) : '')
        setRastrearDetalhado(editando.rastrearDetalhado ?? true)
        setSaldoAtualCentStr('')
        setRecargaMensalCentStr('')
        setDiaRecarga('')
        setOperadora('')
      } else {
        setLimiteCentStr('')
        setDiaFechamento(1)
        setDiaVencimento(10)
        setSaldoAtualCentStr(valorToCentStr(editando.saldoAtual))
        setRecargaMensalCentStr(valorToCentStr(editando.recargaMensal ?? 0))
        setDiaRecarga(editando.diaRecarga ?? '')
        setOperadora(editando.operadora ?? '')
      }
    } else {
      setNome('')
      setTipo('credito')
      setLimiteCentStr('')
      setDiaFechamento(1)
      setDiaVencimento(10)
      setGastoAtualCentStr('')
      setDisponivelCentStr('')
      setDisponivelAlterado(false)
      setSaldoAtualCentStr('')
      setRecargaMensalCentStr('')
      setDiaRecarga('')
      setOperadora('')
      setCor(CORES_CARTAO[0])
      setRastrearDetalhado(true)
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
  function getGastoCents() { return parseInt(gastoAtualCentStr || '0', 10) }
  function getSaldoCents() { return parseInt(saldoAtualCentStr || '0', 10) }
  function getRecargaCents() { return parseInt(recargaMensalCentStr || '0', 10) }

  function handleSave() {
    if (!nome.trim()) return

    if (tipo === 'credito') {
      if (getCents() <= 0) return
      const limiteParaSalvar = getCents() / 100

      let gastoAtualParaSalvar: number | undefined
      if (editando && editando.tipo === 'credito' && disponivelAlterado) {
        // Usuário editou "Disponível agora": retrocomputa gastoAtual
        const dispCents = parseInt(disponivelCentStr || '0', 10)
        const gastoAtualAtual = editando.gastoAtual ?? 0
        const totalDeTxContas = Math.max(0, ((editando as CartaoComSaldo).totalUsado ?? 0) - gastoAtualAtual)
        const novoGastoAtual = Math.max(0, limiteParaSalvar - dispCents / 100 - totalDeTxContas)
        gastoAtualParaSalvar = novoGastoAtual > 0 ? novoGastoAtual : undefined
      } else if (editando && editando.tipo === 'credito') {
        // Limite mudou mas disponível não foi tocado: preserva gastoAtual existente
        gastoAtualParaSalvar = editando.gastoAtual
      } else {
        // Novo cartão: usa o campo "Já gastei"
        gastoAtualParaSalvar = getGastoCents() > 0 ? getGastoCents() / 100 : undefined
      }

      onSave({
        nome: nome.trim(),
        tipo,
        limite: limiteParaSalvar,
        diaFechamento,
        diaVencimento,
        cor,
        rastrearDetalhado,
        ...(gastoAtualParaSalvar !== undefined ? { gastoAtual: gastoAtualParaSalvar } : {}),
      })
    } else {
      if (getSaldoCents() <= 0) return
      onSave({
        nome: nome.trim(),
        tipo,
        saldoAtual: getSaldoCents() / 100,
        operadora: tipo === 'outros_beneficios' ? undefined : operadora.trim() || undefined,
        recargaMensal: tipo === 'outros_beneficios' ? undefined : getRecargaCents() / 100,
        diaRecarga: tipo === 'outros_beneficios' ? undefined : (diaRecarga === '' ? null : diaRecarga),
        cor,
      })
    }

    onClose()
  }

  const canSave = (() => {
    if (!nome.trim()) return false
    if (tipo === 'credito') return getCents() > 0
    if (getSaldoCents() <= 0) return false
    if (tipo !== 'outros_beneficios' && !operadora.trim()) return false
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
              display: 'grid', gridTemplateRows: 'auto 1fr auto', overflow: 'hidden',
            }}
          >
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

            <div className="no-scrollbar" style={{ overflowY: 'auto', minHeight: 0, padding: '22px', display: 'flex', flexDirection: 'column', gap: 20, scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>
              <div>
                <Label>Nome</Label>
                <input
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder={tipo === 'credito' ? 'ex: Nubank, Inter, C6...' : 'ex: VR, Ticket, Alelo...'}
                  autoFocus
                  style={baseInput}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

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

              {tipo === 'credito' && (
                <>
                  {/* Campo 1: Limite total do cartão */}
                  <div>
                    <Label>Limite do cartão</Label>
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

                  {/* Campo 2: Disponível agora (só em edição) */}
                  {editando && (
                    <div>
                      <Label>Disponível agora</Label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 600, color: 'var(--text-tertiary)', pointerEvents: 'none', userSelect: 'none' }}>
                          R$
                        </span>
                        <input
                          value={centavosToDisplay(disponivelCentStr)}
                          onChange={e => {
                            setDisponivelCentStr(e.target.value.replace(/\D/g, ''))
                            setDisponivelAlterado(true)
                          }}
                          placeholder="0,00"
                          inputMode="numeric"
                          style={{ ...baseInput, paddingLeft: 46, fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', height: 58 }}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        />
                      </div>
                      {/* Preview do comprometido que será salvo */}
                      {disponivelAlterado && getCents() > 0 && parseInt(disponivelCentStr || '0') >= 0 && editando.tipo === 'credito' && (() => {
                        const gastoAtualAtual = editando.gastoAtual ?? 0
                        const totalDeTxContas = Math.max(0, ((editando as CartaoComSaldo).totalUsado ?? 0) - gastoAtualAtual)
                        const novoGastoAtual = Math.max(0, getCents() / 100 - parseInt(disponivelCentStr || '0') / 100 - totalDeTxContas)
                        return novoGastoAtual > 0 ? (
                          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                            Comprometido calculado:{' '}
                            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{formatBRL(novoGastoAtual)}</span>
                          </p>
                        ) : null
                      })()}
                    </div>
                  )}

                  {/* Já gastei — só para cartão novo */}
                  {!editando && (
                    <div>
                      <Label>Já gastei neste cartão (opcional)</Label>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 14, fontWeight: 600, color: 'var(--text-tertiary)', pointerEvents: 'none', userSelect: 'none' }}>
                          R$
                        </span>
                        <input
                          value={centavosToDisplay(gastoAtualCentStr)}
                          onChange={e => setGastoAtualCentStr(e.target.value.replace(/\D/g, ''))}
                          placeholder="0,00"
                          inputMode="numeric"
                          style={{ ...baseInput, paddingLeft: 42, fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', height: 50 }}
                          onFocus={focusInput}
                          onBlur={blurInput}
                        />
                      </div>
                      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                        Valor já comprometido que ainda não foi cadastrado conta por conta.
                      </p>
                    </div>
                  )}

                  <div>
                    <Label>Dia de fechamento</Label>
                    <DayGrid value={diaFechamento} onChange={setDiaFechamento} />
                  </div>

                  <div>
                    <Label>Dia de vencimento</Label>
                    <DayGrid value={diaVencimento} onChange={setDiaVencimento} />
                  </div>

                  {/* Toggle como registrar gastos */}
                  <div>
                    <Label>Como registrar gastos</Label>
                    <div style={{ display: 'flex', gap: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
                      {([
                        { value: false, label: 'Simples', desc: 'Adiciono a fatura como uma conta' },
                        { value: true, label: 'Detalhado', desc: 'Rastreio cada gasto individual' },
                      ] as const).map(opt => (
                        <button
                          key={String(opt.value)}
                          type="button"
                          onClick={() => setRastrearDetalhado(opt.value)}
                          style={{
                            flex: 1, padding: '8px 6px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .15s',
                            background: rastrearDetalhado === opt.value ? 'var(--text-primary)' : 'transparent',
                            color: rastrearDetalhado === opt.value ? 'var(--bg-base)' : 'var(--text-secondary)',
                            letterSpacing: '-0.01em',
                          }}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                      {rastrearDetalhado
                        ? 'Rastreio cada gasto individual — seção "Faturas do mês" aparece na aba Contas'
                        : 'Adiciono a fatura como uma conta no BillList — seção automática fica oculta'}
                    </p>
                  </div>
                </>
              )}

              {tipo !== 'credito' && tipo !== 'outros_beneficios' && (
                <div>
                  <Label>Operadora</Label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {OPERADORAS_BENEFICIO.map(op => {
                      const sel = operadora === op
                      return (
                        <button
                          key={op}
                          type="button"
                          onClick={() => setOperadora(op)}
                          style={{
                            padding: '7px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', letterSpacing: '-0.01em',
                            border: sel ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                            background: sel ? 'var(--text-primary)' : 'var(--bg-surface)',
                            color: sel ? 'var(--bg-base)' : 'var(--text-secondary)',
                          }}
                        >
                          {op}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {tipo !== 'credito' && (
                <>
                  <div>
                    <Label>Saldo atual</Label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 600, color: 'var(--text-tertiary)', pointerEvents: 'none', userSelect: 'none' }}>
                        R$
                      </span>
                      <input
                        value={centavosToDisplay(saldoAtualCentStr)}
                        onChange={e => setSaldoAtualCentStr(e.target.value.replace(/\D/g, ''))}
                        placeholder="0,00"
                        inputMode="numeric"
                        style={{ ...baseInput, paddingLeft: 46, fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', height: 58 }}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Recarga mensal</Label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 600, color: 'var(--text-tertiary)', pointerEvents: 'none', userSelect: 'none' }}>
                        R$
                      </span>
                      <input
                        value={centavosToDisplay(recargaMensalCentStr)}
                        onChange={e => setRecargaMensalCentStr(e.target.value.replace(/\D/g, ''))}
                        placeholder="0,00"
                        inputMode="numeric"
                        style={{ ...baseInput, paddingLeft: 46, fontSize: 18, fontWeight: 700, letterSpacing: '-0.03em', height: 54 }}
                        onFocus={focusInput}
                        onBlur={blurInput}
                      />
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 6 }}>
                      Pode ser 0 se o valor variar.
                    </p>
                  </div>

                  <div>
                    <Label>Dia da recarga</Label>
                    <input
                      type="number"
                      min={1}
                      max={31}
                      value={diaRecarga}
                      onChange={e => setDiaRecarga(e.target.value ? Math.min(31, Math.max(1, Number(e.target.value))) : '')}
                      placeholder="Cai todo dia X"
                      style={{ ...baseInput, textAlign: 'center', fontSize: 18, fontWeight: 700 }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>
                </>
              )}

              {tipo === 'outros_beneficios' && (
                <div>
                  <Label>Saldo atual</Label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, fontWeight: 600, color: 'var(--text-tertiary)', pointerEvents: 'none', userSelect: 'none' }}>
                      R$
                    </span>
                    <input
                      value={centavosToDisplay(saldoAtualCentStr)}
                      onChange={e => setSaldoAtualCentStr(e.target.value.replace(/\D/g, ''))}
                      placeholder="0,00"
                      inputMode="numeric"
                      style={{ ...baseInput, paddingLeft: 46, fontSize: 24, fontWeight: 700, letterSpacing: '-0.04em', height: 58 }}
                      onFocus={focusInput}
                      onBlur={blurInput}
                    />
                  </div>
                </div>
              )}

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
