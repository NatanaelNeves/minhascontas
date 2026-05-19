import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2, TrendingUp, RefreshCw } from 'lucide-react'
import { BancoComSaldo, BancoInput } from '@/types'
import { centavosToDisplay, valorToCentStr } from '@/lib/utils'
import { formatBRL } from '@/lib/utils'

interface Props {
  banco: BancoComSaldo
  onEdit: (banco: BancoComSaldo) => void
  onDelete: (id: string) => void
  onUpdate?: (id: string, data: Partial<BancoInput>) => void
}

export function BankCard({ banco, onEdit, onDelete, onUpdate }: Props) {
  const [editandoSaldo, setEditandoSaldo] = useState(false)
  const [modoEdicao, setModoEdicao] = useState<'substituir' | 'adicionar'>('substituir')
  const [centStr, setCentStr] = useState('')

  function handleAtualizarSaldo() {
    setEditandoSaldo(true)
    setModoEdicao('substituir')
    // Usar saldoAtual para mostrar o saldo atual e não apenas o inicial
    setCentStr(valorToCentStr(banco.saldoAtual))
  }

  function handleAdicionarRendimento() {
    setEditandoSaldo(true)
    setModoEdicao('adicionar')
    // Começar vazio para o usuário digitar apenas o valor a adicionar
    setCentStr('')
  }

  function handleConfirmarSaldo() {
    const valor = parseInt(centStr || '0', 10) / 100
    if (valor <= 0) {
      setEditandoSaldo(false)
      return
    }

    let novoSaldoInicial: number
    if (modoEdicao === 'substituir') {
      // Substituir: calcula a diferença com o saldo atual
      const diferenca = valor - banco.saldoAtual
      novoSaldoInicial = banco.saldoInicial + diferenca
    } else {
      // Adicionar: acrescenta ao saldo inicial
      novoSaldoInicial = banco.saldoInicial + valor
    }

    onUpdate?.(banco.id, { saldoInicial: novoSaldoInicial })
    setEditandoSaldo(false)
  }

  if (banco.tipo === 'investimento') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl p-4 flex flex-col gap-3"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderTop: '3px solid var(--purple)',
          overflow: 'hidden',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {banco.cor && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: banco.cor, flexShrink: 0 }} />
            )}
            <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
              {banco.nome}
            </span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(banco)} style={{ color: 'var(--text-tertiary)' }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(banco.id)} style={{ color: 'var(--text-tertiary)' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {editandoSaldo ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 6, fontWeight: 500 }}>
                {modoEdicao === 'substituir' ? 'Novo saldo total' : 'Valor a adicionar'}
              </p>
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 14, fontWeight: 600, color: 'var(--purple)',
                  pointerEvents: 'none', userSelect: 'none',
                }}>R$</span>
                <input
                  autoFocus
                  value={centavosToDisplay(centStr)}
                  onChange={e => setCentStr(e.target.value.replace(/\D/g, ''))}
                  inputMode="numeric"
                  placeholder={modoEdicao === 'substituir' ? '0,00' : 'ex: 10,00'}
                  style={{
                    width: '100%', paddingLeft: 36, padding: '10px 10px 10px 36px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--purple)',
                    borderRadius: 8, fontSize: 20, fontWeight: 700, color: '#fff',
                    outline: 'none', fontFamily: 'inherit', letterSpacing: '-0.03em', boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <motion.button
                onClick={handleConfirmarSaldo}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: 'linear-gradient(135deg, var(--purple) 0%, rgba(124,114,216,0.8) 100%)',
                  color: '#fff',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.opacity = '0.9'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.opacity = '1'
                }}
              >
                ✓ Confirmar
              </motion.button>
              <motion.button
                onClick={() => setEditandoSaldo(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  flex: 1, padding: '12px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1.5px solid var(--border)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  letterSpacing: '-0.01em',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--text-tertiary)'
                  e.currentTarget.style.background = 'var(--bg-surface)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border)'
                  e.currentTarget.style.background = 'var(--bg-elevated)'
                }}
              >
                ✕ Cancelar
              </motion.button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--purple)', fontVariantNumeric: 'tabular-nums' }}>
              {formatBRL(banco.saldoAtual)}
            </span>
            {onUpdate && (
              <div
                className="flex flex-wrap sm:flex-nowrap items-center"
                style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}
              >
                <motion.button
                  onClick={handleAtualizarSaldo}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-9 sm:h-10 px-3 sm:px-4 w-auto sm:flex-1 min-w-0"
                  style={{
                    boxSizing: 'border-box',
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: 'linear-gradient(135deg, rgba(124,114,216,0.15) 0%, rgba(124,114,216,0.08) 100%)',
                    color: 'var(--purple)',
                    border: '1.5px solid rgba(124,114,216,0.35)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,114,216,0.25) 0%, rgba(124,114,216,0.15) 100%)'
                    e.currentTarget.style.borderColor = 'rgba(124,114,216,0.5)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(124,114,216,0.15) 0%, rgba(124,114,216,0.08) 100%)'
                    e.currentTarget.style.borderColor = 'rgba(124,114,216,0.35)'
                  }}
                >
                  <RefreshCw className="w-4 h-4" style={{ strokeWidth: 2.5 }} />
                  <span>Atualizar</span>
                </motion.button>
                <motion.button
                  onClick={handleAdicionarRendimento}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="h-9 sm:h-10 px-3 sm:px-4 w-auto sm:flex-1 min-w-0"
                  style={{
                    boxSizing: 'border-box',
                    borderRadius: 8, fontSize: 12, fontWeight: 600,
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.1) 100%)',
                    color: 'var(--green)',
                    border: '1.5px solid rgba(34,197,94,0.4)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0.2) 100%)'
                    e.currentTarget.style.borderColor = 'rgba(34,197,94,0.6)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(34,197,94,0.2) 0%, rgba(34,197,94,0.1) 100%)'
                    e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'
                  }}
                >
                  <TrendingUp className="w-4 h-4" style={{ strokeWidth: 2.5 }} />
                  <span>Rendimento</span>
                </motion.button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    )
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {banco.cor && (
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: banco.cor, flexShrink: 0 }} />
          )}
          <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>{banco.nome}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(banco)} style={{ color: 'var(--text-tertiary)' }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(banco.id)} style={{ color: 'var(--text-tertiary)' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ color: banco.saldoAtual >= 0 ? 'var(--text-primary)' : 'var(--red)' }}
      >
        {formatBRL(banco.saldoAtual)}
      </span>
      {(banco.entradas > 0 || banco.gastos > 0) && (
        <div className="flex gap-4 text-xs">
          {banco.entradas > 0 && <span style={{ color: 'var(--green)' }}>↑ {formatBRL(banco.entradas)}</span>}
          {banco.gastos > 0 && <span style={{ color: 'var(--red)' }}>↓ {formatBRL(banco.gastos)}</span>}
        </div>
      )}
    </motion.div>
  )
}
