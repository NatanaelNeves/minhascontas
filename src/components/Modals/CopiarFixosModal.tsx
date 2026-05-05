import { useState } from 'react'
import { motion } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Copy } from 'lucide-react'
import { formatMesLabel } from '@/lib/utils'

interface Props {
  open: boolean
  mesOrigemId: string
  mesDestinoId: string
  onCopiar: () => Promise<void>
  onPular: () => void
}

export function CopiarFixosModal({ open, mesOrigemId, mesDestinoId, onCopiar, onPular }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleCopiar() {
    setLoading(true)
    try {
      await onCopiar()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onPular()}>
      <DialogContent
        className="p-0 gap-0 max-w-sm overflow-hidden"
        style={{
          background: 'var(--modal-bg)',
          border: '0.5px solid var(--modal-border)',
          borderRadius: 18,
        }}
      >
        {/* Header */}
        <div style={{ padding: '22px 24px 18px', borderBottom: '0.5px solid var(--divider)' }}>
          <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-subtle)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
            {formatMesLabel(mesDestinoId)}
          </p>
          <p style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            Novo mês
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'rgba(127,119,221,0.12)',
              border: '0.5px solid rgba(127,119,221,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Copy style={{ width: 20, height: 20, color: '#7F77DD' }} />
          </motion.div>

          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>
              Copiar contas fixas de{' '}
              <span style={{ color: '#7F77DD' }} className="capitalize">{formatMesLabel(mesOrigemId)}</span>?
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.6 }}>
              Contas da categoria <span style={{ color: 'var(--text-primary)' }}>Fixo</span> serão copiadas para{' '}
              <span style={{ color: 'var(--text-primary)' }} className="capitalize">{formatMesLabel(mesDestinoId)}</span> como não pagas.
              Parcelas serão incrementadas automaticamente.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0 24px 20px', display: 'flex', gap: 8 }}>
          <button
            onClick={onPular}
            disabled={loading}
            style={{
              flex: 1,
              padding: 13,
              borderRadius: 10,
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              color: 'var(--text-muted)',
              fontSize: 12,
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Começar do zero
          </button>
          <button
            onClick={handleCopiar}
            disabled={loading}
            style={{
              flex: 2,
              padding: 13,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #7F77DD, #534AB7)',
              border: 'none',
              color: '#fff',
              fontSize: 13,
              fontWeight: 600,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              boxShadow: '0 4px 16px rgba(127,119,221,0.35)',
              transition: 'opacity .15s',
            }}
          >
            <Copy style={{ width: 14, height: 14 }} />
            {loading ? 'Copiando...' : 'Sim, copiar'}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
