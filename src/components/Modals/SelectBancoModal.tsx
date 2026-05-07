import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BancoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  open: boolean
  bancos: BancoComSaldo[]
  onSelect: (bancoId: string) => void
  onClose: () => void
  onNavigateToBancos?: () => void
}

export function SelectBancoModal({ open, bancos, onSelect, onClose, onNavigateToBancos }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>Selecionar banco</DialogTitle>
        </DialogHeader>

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
                  onClick={() => onSelect(b.id)}
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
