import { motion } from 'framer-motion'
import { ResumoMes } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  resumo: ResumoMes
  receita: number
  totalGastos: number
  onEditReceita: () => void
}

function Row({ label, value, color, sign }: { label: string; value: number; color: string; sign?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 600, color,
        letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
      }}>
        {sign}{formatBRL(value)}
      </span>
    </div>
  )
}

export function HomeResumoMes({ resumo, receita, totalGastos, onEditReceita }: Props) {
  const sobra = receita - resumo.totalGeral - totalGastos
  const saude = sobra >= receita * 0.2 ? 'verde' : sobra >= 0 ? 'amarelo' : 'vermelho'
  const saudeColor = saude === 'verde' ? 'var(--green)' : saude === 'amarelo' ? 'var(--amber)' : 'var(--red)'

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '14px 20px 0' }}>
        <p style={{
          fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          Balanço do mês
        </p>
      </div>

      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onEditReceita}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: 12, letterSpacing: '-0.01em',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 8.5h7M6.5 1.5L8.5 3.5 4 8 2 8.5l.5-2 4-4z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Receita
          </button>
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
          }}>
            {receita > 0 ? formatBRL(receita) : '—'}
          </span>
        </div>

        {resumo.totalGeral > 0 && (
          <Row label="(-) Contas cadastradas" value={resumo.totalGeral} color="var(--text-secondary)" sign="−" />
        )}

        {totalGastos > 0 && (
          <Row label="(-) Gastos variáveis" value={totalGastos} color="var(--text-secondary)" sign="−" />
        )}
      </div>

      <div style={{ height: '0.5px', background: 'var(--divider)', margin: '0 20px' }} />

      <div style={{ padding: '14px 20px 18px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
          letterSpacing: '0.09em', textTransform: 'uppercase',
        }}>
          Sobra estimada
        </span>
        <motion.span
          key={sobra}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            fontSize: 24, fontWeight: 700, color: saudeColor,
            letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums',
          }}
        >
          {receita > 0 ? formatBRL(sobra) : '—'}
        </motion.span>
      </div>
    </div>
  )
}
