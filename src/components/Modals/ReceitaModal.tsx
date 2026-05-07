import { useState, useEffect } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useAppStore } from '@/store/useAppStore'
import { formatMesLabel, centavosToDisplay, valorToCentStr } from '@/lib/utils'

interface Props {
  open: boolean
  valorAtual: number
  onSave: (valor: number) => void
  onClose: () => void
}

export function ReceitaModal({ open, valorAtual, onSave, onClose }: Props) {
  const { mesAtivo } = useAppStore()
  const [centStr, setCentStr] = useState('')

  useEffect(() => {
    if (open) {
      setCentStr(valorAtual > 0 ? valorToCentStr(valorAtual) : '')
    }
  }, [open, valorAtual])

  function getCents(): number { return parseInt(centStr || '0', 10) }

  function handleSave() {
    const valor = getCents() / 100
    if (valor > 0) onSave(valor)
    onClose()
  }

  const canSave = getCents() > 0

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent
        className="p-0 gap-0 max-w-xs overflow-hidden"
        style={{
          background: 'var(--bg-elevated)',
          border: '0.5px solid var(--border)',
          borderRadius: 18,
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '0.5px solid var(--divider)' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
            {formatMesLabel(mesAtivo)}
          </p>
          <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Receita do mês
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px' }}>
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 7 }}>
            Valor (R$)
          </p>
          <div style={{ position: 'relative' }}>
            <span style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              fontSize: 18,
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              pointerEvents: 'none',
            }}>R$</span>
            <input
              value={centavosToDisplay(centStr)}
              onChange={e => setCentStr(e.target.value.replace(/\D/g, ''))}
              placeholder="0,00"
              inputMode="numeric"
              autoFocus
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 14px 14px 48px',
                fontSize: 26,
                fontWeight: 600,
                color: 'var(--text-primary)',
                letterSpacing: '-0.03em',
                outline: 'none',
                fontFamily: 'inherit',
                transition: 'border-color .15s',
              }}
              onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')}
              onBlur={e => (e.target.style.borderColor = 'var(--border)')}
            />
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: 13,
              borderRadius: 10,
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              color: 'var(--text-secondary)',
              fontSize: 13,
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!canSave}
            style={{
              flex: 2,
              padding: 13,
              borderRadius: 10,
              background: canSave ? 'var(--text-primary)' : 'var(--bg-surface)',
              border: canSave ? 'none' : '1px solid var(--border)',
              color: canSave ? 'var(--bg-base)' : 'var(--text-tertiary)',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'all .2s',
            }}
          >
            Salvar
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
