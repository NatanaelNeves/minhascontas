import { useAppStore } from '@/store/useAppStore'
import { useMesAnterior } from '@/hooks/useMesAnterior'
import { formatBRLShort, prevMesId, formatMesLabel } from '@/lib/utils'
import { ResumoMes } from '@/types'

interface Props {
  userId: string
  resumoAtual: ResumoMes
}

function Delta({ atual, anterior, inverted = false }: { atual: number; anterior: number; inverted?: boolean }) {
  if (anterior === 0) return null
  const diff = atual - anterior
  const pct = Math.abs((diff / anterior) * 100).toFixed(0)
  const up = diff > 0
  const good = inverted ? !up : up

  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 500,
        color: diff === 0 ? 'var(--text-disabled)' : good ? 'var(--green)' : 'var(--red)',
        display: 'flex',
        alignItems: 'center',
        gap: 2,
      }}
    >
      {diff === 0 ? '=' : up ? '↑' : '↓'} {pct}%
    </span>
  )
}

export function ComparacaoMeses({ userId, resumoAtual }: Props) {
  const { mesAtivo } = useAppStore()
  const anterior = useMesAnterior(userId, mesAtivo)

  if (!anterior) return null

  const prevLabel = formatMesLabel(prevMesId(mesAtivo))

  const metrics = [
    {
      label: 'Gastos',
      atual: resumoAtual.totalGeral,
      ant: anterior.totalGeral,
      inverted: true,
    },
    {
      label: 'Sobra',
      atual: resumoAtual.sobra,
      ant: anterior.sobra,
      inverted: false,
    },
  ]

  return (
    <div
      style={{
        borderRadius: 14,
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
        padding: '14px 16px',
      }}
    >
      <p
        style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
          letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 12,
        }}
      >
        Vs. {prevLabel}
      </p>

      <div style={{ display: 'flex', gap: 0 }}>
        {metrics.map(({ label, atual, ant }, i) => (
          <div
            key={label}
            style={{
              flex: 1,
              paddingLeft: i > 0 ? 14 : 0,
              borderLeft: i > 0 ? '0.5px solid var(--divider)' : 'none',
              marginLeft: i > 0 ? 14 : 0,
            }}
          >
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginBottom: 4, letterSpacing: '-0.01em' }}>
              {label}
            </p>
            <p
              style={{
                fontSize: 16, fontWeight: 700, letterSpacing: '-0.03em',
                color: label === 'Sobra' ? (atual >= 0 ? 'var(--green)' : 'var(--red)') : 'var(--text-primary)',
                marginBottom: 3,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatBRLShort(atual)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 10, color: 'var(--text-disabled)' }}>
                {formatBRLShort(ant)}
              </span>
              <Delta atual={atual} anterior={ant} inverted={label === 'Gastos'} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
