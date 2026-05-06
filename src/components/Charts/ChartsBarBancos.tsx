import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { BancoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  bancos: BancoComSaldo[]
}

export function ChartsBarBancos({ bancos }: Props) {
  if (bancos.length === 0) return null

  const data = bancos.map(b => ({
    name: b.nome,
    saldo: b.saldoAtual,
    gastos: b.gastos,
    entradas: b.entradas,
  }))

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
    >
      <p className="text-sm font-semibold mb-3">Saldo por banco</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="35%">
          <XAxis
            dataKey="name"
            tick={{ fontSize: 11, fill: 'var(--text-subtle)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={(v: any) => formatBRL(v as number)}
            contentStyle={{
              background: 'var(--surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 8,
              fontSize: 12,
            }}
          />
          <Bar dataKey="saldo" fill="#7C72D8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
