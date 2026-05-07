import { motion } from 'framer-motion'
import { ResumoMes } from '@/types'
import { formatBRL, formatBRLShort } from '@/lib/utils'

interface Props {
  resumo: ResumoMes
  receita: number
  semContas: boolean
  onEditReceita?: () => void
}

const SAUDE = {
  verde: {
    label: 'Mês tranquilo',
    bg: 'var(--green-muted)',
    border: 'rgba(52,199,123,0.25)',
    dot: 'var(--green)',
    dotClass: 'pulse-dot',
    text: 'var(--green)',
  },
  amarelo: {
    label: 'Atenção',
    bg: 'var(--amber-muted)',
    border: 'rgba(245,158,11,0.25)',
    dot: 'var(--amber)',
    dotClass: 'pulse-dot-amber',
    text: 'var(--amber)',
  },
  vermelho: {
    label: 'Mês crítico',
    bg: 'var(--red-muted)',
    border: 'rgba(239,68,68,0.25)',
    dot: 'var(--red)',
    dotClass: 'pulse-dot-red',
    text: 'var(--red)',
  },
}

const METRICS = (resumo: ResumoMes) => [
  { label: 'Total', value: resumo.totalGeral, color: 'var(--text-primary)' },
  { label: 'Pago', value: resumo.totalPago, color: 'var(--green)' },
  { label: 'Pendente', value: resumo.totalPendente, color: 'var(--amber)' },
]

export function ResumoCards({ resumo, receita, semContas, onEditReceita }: Props) {
  const saude = SAUDE[resumo.saudePrimaria]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-[16px] overflow-hidden"
      style={{
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
      }}
    >
      {/* Hero: Sobra + health badge */}
      <div
        style={{
          padding: '20px 22px',
          borderBottom: '0.5px solid var(--divider)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p
              className="text-[10px] font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}
            >
              Sobra do mês
            </p>
            <p
              className="leading-none tabular-nums"
              style={{
                fontSize: 34,
                fontWeight: 700,
                color: resumo.sobra >= 0 ? 'var(--green)' : 'var(--red)',
                letterSpacing: '-0.05em',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {semContas ? '—' : formatBRL(resumo.sobra)}
            </p>
            {/* Receita secundária com edit */}
            <button
              onClick={onEditReceita}
              className="mt-2 flex items-center gap-1 transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1.5 8.5h7M6.5 1.5L8.5 3.5 4 8 2 8.5l.5-2 4-4z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.01em' }}>
                Receita: {receita > 0 ? formatBRL(receita) : 'não definida'}
              </span>
            </button>
          </div>

          {!semContas && (
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
              style={{
                background: saude.bg,
                border: `0.5px solid ${saude.border}`,
              }}
            >
              <div
                className={`w-[7px] h-[7px] rounded-full shrink-0 ${saude.dotClass}`}
                style={{ background: saude.dot }}
              />
              <span className="text-[11px] font-medium" style={{ color: saude.text }}>
                {saude.label}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Progress */}
      {!semContas && (
        <div
          style={{
            padding: '14px 22px',
            borderBottom: '0.5px solid var(--divider)',
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-[10px] font-semibold uppercase"
              style={{ color: 'var(--text-tertiary)', letterSpacing: '0.08em' }}
            >
              Progresso
            </p>
            <p
              className="text-[12px] font-medium tabular-nums"
              style={{ color: 'var(--text-secondary)' }}
            >
              {resumo.percentualPago.toFixed(0)}% pago
            </p>
          </div>
          <div
            className="h-[3px] rounded-full overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.07)' }}
          >
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(resumo.percentualPago, 100)}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
              className="h-full rounded-full"
              style={{ background: 'var(--green)' }}
            />
          </div>
        </div>
      )}

      {/* 3 metrics — horizontal strip with dividers */}
      <div className="grid grid-cols-3">
        {METRICS(resumo).map(({ label, value, color }, i) => (
          <div
            key={label}
            style={{
              padding: '14px 14px 16px',
              borderLeft: i > 0 ? '0.5px solid var(--divider)' : 'none',
            }}
          >
            <p
              className="text-[9px] font-semibold uppercase mb-1.5"
              style={{ color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}
            >
              {label}
            </p>
            <p
              className="text-[14px] font-semibold tabular-nums"
              style={{ color, letterSpacing: '-0.03em' }}
            >
              {formatBRLShort(value)}
            </p>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
