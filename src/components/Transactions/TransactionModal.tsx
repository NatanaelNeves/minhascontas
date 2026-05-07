import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { Transacao, TransacaoInput, BancoComSaldo, CategoriaGasto, TipoTransacao, Cartao } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { formatMesLabel, centavosToDisplay, valorToCentStr } from '@/lib/utils'

const CATEGORIAS: { value: CategoriaGasto; label: string; emoji: string }[] = [
  { value: 'alimentacao', label: 'Alimentação', emoji: '🍔' },
  { value: 'transporte', label: 'Transporte', emoji: '🚗' },
  { value: 'saude', label: 'Saúde', emoji: '💊' },
  { value: 'lazer', label: 'Lazer', emoji: '🎮' },
  { value: 'educacao', label: 'Educação', emoji: '📚' },
  { value: 'moradia', label: 'Moradia', emoji: '🏠' },
  { value: 'vestuario', label: 'Vestuário', emoji: '👕' },
  { value: 'servicos', label: 'Serviços', emoji: '⚡' },
  { value: 'despesaFixa', label: 'Despesa Fixa', emoji: '📋' },
  { value: 'outros', label: 'Outros', emoji: '📦' },
]

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
  editando: Transacao | null
  bancos: BancoComSaldo[]
  cartoes?: Cartao[]
  onSave: (data: TransacaoInput) => void
  onClose: () => void
}

export function TransactionModal({ open, editando, bancos, cartoes = [], onSave, onClose }: Props) {
  const { mesAtivo } = useAppStore()
  const hoje = new Date().toISOString().split('T')[0]
  const [tipo, setTipo] = useState<TipoTransacao>('gasto')
  const [descricao, setDescricao] = useState('')
  const [centStr, setCentStr] = useState('')
  const [bancoId, setBancoId] = useState('')
  const [cartaoId, setCartaoId] = useState<string | undefined>(undefined)
  const [categoria, setCategoria] = useState<CategoriaGasto>('outros')
  const [data, setData] = useState(hoje)
  const [observacao, setObservacao] = useState('')

  const creditCartoes = cartoes.filter(c => c.tipo === 'credito')

  useEffect(() => {
    if (editando) {
      setTipo(editando.tipo)
      setDescricao(editando.descricao)
      setCentStr(valorToCentStr(editando.valor))
      setBancoId(editando.bancoId)
      setCartaoId(editando.cartaoId)
      setData(editando.data)
      setObservacao(editando.observacao ?? '')
      if (editando.tipo === 'gasto') setCategoria(editando.categoria)
    } else {
      setTipo('gasto')
      setDescricao('')
      setCentStr('')
      setBancoId(bancos[0]?.id ?? '')
      setCartaoId(undefined)
      setCategoria('outros')
      setData(hoje)
      setObservacao('')
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
    if (!descricao.trim() || getCents() <= 0 || !bancoId) return
    const base = {
      descricao: descricao.trim(),
      valor: getCents() / 100,
      bancoId,
      data,
      despesaFixa: false,
      ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
    }
    const input: TransacaoInput =
      tipo === 'gasto'
        ? { ...base, tipo: 'gasto', categoria, ...(cartaoId ? { cartaoId } : {}) }
        : { ...base, tipo: 'entrada' }
    onSave(input)
    onClose()
  }

  const canSave = descricao.trim().length > 0 && getCents() > 0 && !!bancoId

  function focusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = 'var(--border-strong)'
    e.target.style.background = 'var(--bg-elevated)'
  }
  function blurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
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
                  {editando ? 'Editar lançamento' : 'Novo lançamento'}
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

              {/* Tipo — segmented control, white active */}
              <div>
                <Label>Tipo</Label>
                <div style={{ display: 'flex', gap: 3, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 3 }}>
                  {(['gasto', 'entrada'] as TipoTransacao[]).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTipo(t)}
                      style={{
                        flex: 1, padding: '8px 6px', borderRadius: 7, fontSize: 13, fontWeight: 500,
                        cursor: 'pointer', border: 'none', fontFamily: 'inherit', transition: 'all .15s',
                        background: tipo === t ? 'var(--text-primary)' : 'transparent',
                        color: tipo === t ? 'var(--bg-base)' : 'var(--text-secondary)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {t === 'gasto' ? 'Gasto' : 'Entrada'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Descrição */}
              <div>
                <Label>Descrição</Label>
                <input
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="ex: Supermercado, Salário..."
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

              {/* Banco — chips */}
              {bancos.length > 0 && (
                <div>
                  <Label>Banco</Label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {bancos.map(b => {
                      const sel = bancoId === b.id
                      return (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setBancoId(b.id)}
                          style={{
                            padding: '7px 14px', borderRadius: 99, fontSize: 13, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', letterSpacing: '-0.01em',
                            border: sel ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                            background: sel ? 'var(--text-primary)' : 'var(--bg-surface)',
                            color: sel ? 'var(--bg-base)' : 'var(--text-secondary)',
                          }}
                        >
                          {b.nome}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Categoria — chips (gastos only) */}
              {tipo === 'gasto' && (
                <div>
                  <Label>Categoria</Label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {CATEGORIAS.map(c => {
                      const sel = categoria === c.value
                      return (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setCategoria(c.value)}
                          style={{
                            padding: '7px 12px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', letterSpacing: '-0.01em',
                            display: 'flex', alignItems: 'center', gap: 5,
                            border: sel ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                            background: sel ? 'var(--text-primary)' : 'var(--bg-surface)',
                            color: sel ? 'var(--bg-base)' : 'var(--text-secondary)',
                          }}
                        >
                          <span style={{ fontSize: 11 }}>{c.emoji}</span>
                          {c.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Cartão (gastos only, only credit cartoes) */}
              {tipo === 'gasto' && creditCartoes.length > 0 && (
                <div>
                  <Label>Cartão (opcional)</Label>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setCartaoId(undefined)}
                      style={{
                        padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', letterSpacing: '-0.01em',
                        border: !cartaoId ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                        background: !cartaoId ? 'var(--text-primary)' : 'var(--bg-surface)',
                        color: !cartaoId ? 'var(--bg-base)' : 'var(--text-secondary)',
                      }}
                    >
                      Nenhum
                    </button>
                    {creditCartoes.map(c => {
                      const sel = cartaoId === c.id
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCartaoId(c.id)}
                          style={{
                            padding: '7px 14px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all .15s', letterSpacing: '-0.01em',
                            display: 'flex', alignItems: 'center', gap: 6,
                            border: sel ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                            background: sel ? 'var(--text-primary)' : 'var(--bg-surface)',
                            color: sel ? 'var(--bg-base)' : 'var(--text-secondary)',
                          }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: sel ? 'var(--bg-base)' : c.cor, flexShrink: 0 }} />
                          {c.nome}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Data */}
              <div>
                <Label>Data</Label>
                <input
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  style={{ ...baseInput, colorScheme: 'dark', color: data ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
              </div>

              {/* Observação */}
              <div>
                <Label>Observação (opcional)</Label>
                <textarea
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  placeholder="Anotações adicionais..."
                  rows={2}
                  style={{ ...baseInput, resize: 'none', lineHeight: 1.5 }}
                  onFocus={focusInput}
                  onBlur={blurInput}
                />
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
                {editando ? 'Salvar alterações' : 'Adicionar lançamento'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
