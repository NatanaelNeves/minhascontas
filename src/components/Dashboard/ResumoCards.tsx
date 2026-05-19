import { motion } from 'framer-motion'
import { ResumoMes } from '@/types'
import { formatBRLShort } from '@/lib/utils'

interface Props {
  resumo: ResumoMes
  semContas: boolean
  nPagas: number
  nTotal: number
}

export function ResumoCards({ resumo, semContas, nPagas, nTotal }: Props) {
  if (semContas) return null

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '14px 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Contas pagas
        </p>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
          {nPagas}/{nTotal}
        </p>
      </div>

      <div style={{ height: 3, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.07)', marginBottom: 8 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(resumo.percentualPago, 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
          style={{ height: '100%', borderRadius: 99, background: 'var(--green)' }}
        />
      </div>

      <p style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '-0.01em' }}>
        {nPagas} de {nTotal} {nTotal === 1 ? 'conta paga' : 'contas pagas'}
        {resumo.totalPendente > 0 && (
          <span style={{ color: 'var(--amber)' }}>
            {' · '}{formatBRLShort(resumo.totalPendente)} pendente
          </span>
        )}
      </p>
    </div>
  )
}
