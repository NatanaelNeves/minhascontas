import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BancoComSaldo } from '@/types'
import { formatBRL, centavosToDisplay } from '@/lib/utils'

interface Props {
  open: boolean
  bancos: BancoComSaldo[]
  valorInicial?: number
  onSelect: (bancoId: string, data: string, valor?: number) => void
  onClose: () => void
  onNavigateToBancos?: () => void
}

export function SelectBancoModal({ open, bancos, valorInicial, onSelect, onClose, onNavigateToBancos }: Props) {
  const [data, setData] = useState(() => new Date().toISOString().split('T')[0])
  const [valorCents, setValorCents] = useState(0)

  useEffect(() => {
    if (open) {
      setData(new Date().toISOString().split('T')[0])
      setValorCents(valorInicial !== undefined ? Math.round(valorInicial * 100) : 0)
    }
  }, [open, valorInicial])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>Selecionar banco</DialogTitle>
        </DialogHeader>

        {valorInicial !== undefined && (
          <div>
            <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>
              Valor a pagar
            </p>
            <input
              type="text"
              inputMode="numeric"
              value={centavosToDisplay(valorCents.toString())}
              onChange={e => {
                const raw = e.target.value.replace(/\D/g, '')
                setValorCents(parseInt(raw || '0', 10))
              }}
              style={{
                width: '100%',
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '9px 12px',
                fontSize: 14,
                color: 'var(--text-primary)',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
          </div>
        )}

        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>
            Data do pagamento
          </p>
          <input
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            style={{
              width: '100%',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 14,
              color: 'var(--text-primary)',
              outline: 'none',
              fontFamily: 'inherit',
              colorScheme: 'dark',
            } as React.CSSProperties}
          />
        </div>

        {bancos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Nenhum banco cadastrado. Adicione um banco primeiro.
            </p>
            {onNavigateToBancos && (
              <button
                onClick={() => { onClose(); onNavigateToBancos() }}
                className="px-4 py-2 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
                style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
              >
                Ir para Bancos
              </button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-2 py-2">
            {bancos.map(b => (
              <li key={b.id}>
                <button
                  onClick={() => onSelect(b.id, data, valorInicial !== undefined ? valorCents / 100 : undefined)}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-left transition-colors"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-surface)')}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{b.nome}</span>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    {formatBRL(b.saldoAtual)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
