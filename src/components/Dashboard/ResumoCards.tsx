import { motion } from 'framer-motion'
import { ResumoMes } from '@/types'
import { formatBRLShort } from '@/lib/utils'

interface Props {
  resumo: ResumoMes
  semContas: boolean
}

const METRICS = (resumo: ResumoMes) => [
  { label: 'Total', value: resumo.totalGeral, color: 'var(--text-primary)' },
  { label: 'Pago', value: resumo.totalPago, color: 'var(--green)' },
  { label: 'Pendente', value: resumo.totalPendente, color: 'var(--amber)' },
]

export function ResumoCards({ resumo, semContas }: Props) {
  if (semContas) return null

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Progress */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--divider)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Contas pagas
          </p>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {resumo.percentualPago.toFixed(0)}%
          </p>
        </div>
        <div style={{ height: 3, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(resumo.percentualPago, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            style={{ height: '100%', borderRadius: 99, background: 'var(--green)' }}
          />
        </div>
      </div>

      {/* 3 metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {METRICS(resumo).map(({ label, value, color }, i) => (
          <div
            key={label}
            style={{
              padding: '12px 14px 14px',
              borderLeft: i > 0 ? '0.5px solid var(--divider)' : 'none',
            }}
          >
            <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
              {label}
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
              {formatBRLShort(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
