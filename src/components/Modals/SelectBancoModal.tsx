import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Selecionar banco</DialogTitle>
        </DialogHeader>

        {bancos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
              Nenhum banco cadastrado. Adicione um banco primeiro.
            </p>
            {onNavigateToBancos && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose()
                  onNavigateToBancos()
                }}
              >
                Ir para Bancos
              </Button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-2 py-2">
            {bancos.map(b => (
              <li key={b.id}>
                <button
                  onClick={() => onSelect(b.id)}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5"
                  style={{ border: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-sm font-medium">{b.nome}</span>
                  <span className="text-sm" style={{ color: 'var(--text-subtle)' }}>
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
