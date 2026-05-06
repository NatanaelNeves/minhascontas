import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CategoriaGasto } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  gastosPorCategoria: Record<CategoriaGasto, number>
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

const CATEGORIA_LABEL: Record<CategoriaGasto, string> = {
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
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-300 font-medium">{payload[0].name}</p>
      <p className="text-white font-bold">{formatBRL(payload[0].value)}</p>
    </div>
  )
}

export function ChartsPizza({ gastosPorCategoria }: Props) {
  const data = Object.entries(gastosPorCategoria)
    .filter(([, v]) => v > 0)
    .map(([cat, valor]) => ({
      name: CATEGORIA_LABEL[cat as CategoriaGasto] ?? cat,
      value: valor,
      color: CATEGORIA_COLORS[cat] ?? '#94A3B8',
    }))

  if (data.length === 0) return null

  return (
    <div className="bg-zinc-900 border border-zinc-800/80 rounded-2xl p-4">
      <p className="text-zinc-500 text-xs uppercase tracking-widest font-medium mb-4">
        Por categoria
      </p>
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
