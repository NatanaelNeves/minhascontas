import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
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
  const [centStr, setCentStr] = useState('')

  function handleAtualizarSaldo() {
    setEditandoSaldo(true)
    setCentStr(valorToCentStr(banco.saldoInicial))
  }

  function handleConfirmarSaldo() {
    const novoSaldo = parseInt(centStr || '0', 10) / 100
    onUpdate?.(banco.id, { saldoInicial: novoSaldo })
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
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
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
                style={{
                  width: '100%', paddingLeft: 36, padding: '8px 10px 8px 36px',
                  background: 'var(--bg-elevated)', border: '1px solid var(--purple)',
                  borderRadius: 8, fontSize: 18, fontWeight: 700, color: '#fff',
                  outline: 'none', fontFamily: 'inherit', letterSpacing: '-0.03em',
                }}
              />
            </div>
            <button
              onClick={handleConfirmarSaldo}
              style={{
                padding: '8px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: 'var(--purple)', color: '#fff',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              }}
            >
              OK
            </button>
            <button
              onClick={() => setEditandoSaldo(false)}
              style={{
                padding: '8px 10px', borderRadius: 8, fontSize: 12,
                background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)', cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              ×
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.04em', color: 'var(--purple)', fontVariantNumeric: 'tabular-nums' }}>
              {formatBRL(banco.saldoAtual)}
            </span>
            {onUpdate && (
              <button
                onClick={handleAtualizarSaldo}
                style={{
                  padding: '5px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                  background: 'var(--purple-muted)', color: 'var(--purple)',
                  border: '1px solid rgba(124,114,216,0.25)', cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Atualizar
              </button>
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
      <div className="flex gap-4 text-xs">
        <span style={{ color: 'var(--green)' }}>↑ {formatBRL(banco.entradas)}</span>
        <span style={{ color: 'var(--red)' }}>↓ {formatBRL(banco.gastos)}</span>
      </div>
    </motion.div>
  )
}
