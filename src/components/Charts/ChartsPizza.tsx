import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Conta } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  contas: Conta[]
}

const CATEGORIAS = [
  { key: 'fixo', label: 'Fixos', color: '#60a5fa' },
  { key: 'cartao', label: 'Cartões', color: '#a78bfa' },
  { key: 'extra', label: 'Extras', color: '#fbbf24' },
] as const

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-300 font-medium">{payload[0].name}</p>
      <p className="text-white font-bold">{formatBRL(payload[0].value)}</p>
    </div>
  )
}

export function ChartsPizza({ contas }: Props) {
  const data = CATEGORIAS.map(cat => ({
    name: cat.label,
    value: contas.filter(c => c.categoria === cat.key).reduce((s, c) => s + c.valor, 0),
    color: cat.color,
  })).filter(d => d.value > 0)

  if (data.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4">
      <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium mb-4">Por categoria</p>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.color} stroke="transparent" />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-zinc-400 text-xs">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
