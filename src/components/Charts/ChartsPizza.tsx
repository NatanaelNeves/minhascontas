import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { formatBRL } from '@/lib/utils'

interface Props {
  gastosPorCategoria: Record<string, number>
}

const CATEGORIA_COLORS: Record<string, string> = {
  alimentacao: '#EF4444',
  transporte: '#F59E0B',
  saude: '#10B981',
  lazer: '#6366F1',
  educacao: '#8B5CF6',
  moradia: '#EC4899',
  vestuario: '#14B8A6',
  servicos: '#F97316',
  despesaFixa: '#7C72D8',
  outros: '#94A3B8',
}

const CATEGORIA_LABEL: Record<string, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  saude: 'Saúde',
  lazer: 'Lazer',
  educacao: 'Educação',
  moradia: 'Moradia',
  vestuario: 'Vestuário',
  servicos: 'Serviços',
  despesaFixa: 'Despesa Fixa',
  outros: 'Outros',
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: Array<{ name: string; value: number }>
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-lg px-3 py-2 text-xs"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
    >
      <p style={{ color: 'var(--text-secondary)' }} className="font-medium">{payload[0].name}</p>
      <p style={{ color: 'var(--text-primary)' }} className="font-bold">{formatBRL(payload[0].value)}</p>
    </div>
  )
}

export function ChartsPizza({ gastosPorCategoria }: Props) {
  const data = Object.entries(gastosPorCategoria)
    .filter(([, v]) => v > 0)
    .map(([cat, valor]) => ({
      name: CATEGORIA_LABEL[cat] ?? cat,
      value: valor,
      color: CATEGORIA_COLORS[cat] ?? '#94A3B8',
    }))
    .sort((a, b) => b.value - a.value)

  if (data.length === 0) return null

  const total = data.reduce((s, d) => s + d.value, 0)

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <p className="text-xs uppercase tracking-widest font-medium mb-4" style={{ color: 'var(--text-tertiary)' }}>
        Por categoria
      </p>
      <ResponsiveContainer width="100%" height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={46}
            outerRadius={70}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {/* Custom legend with value + percentage */}
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map(item => (
          <div key={item.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 6, height: 6, borderRadius: '50%',
                background: item.color, flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', flex: 1, letterSpacing: '-0.01em' }}>
              {item.name}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em' }}>
              {formatBRL(item.value)}
            </span>
            <span
              style={{
                fontSize: 10, color: 'var(--text-disabled)',
                minWidth: 32, textAlign: 'right', fontVariantNumeric: 'tabular-nums',
              }}
            >
              {((item.value / total) * 100).toFixed(0)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
