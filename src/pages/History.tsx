import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowRight } from 'lucide-react'
import { useHistorico } from '@/hooks/useHistorico'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/ui/Header'
import { formatBRL, formatMesLabel } from '@/lib/utils'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'

interface Props {
  userId: string
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ name: string; value: number; fill: string }>
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-xl space-y-1"
      style={{ background: 'rgba(30,30,40,0.95)', border: '0.5px solid rgba(255,255,255,0.1)' }}
    >
      <p className="text-white/40 capitalize">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill }} className="font-semibold">
          {p.name}: {formatBRL(p.value)}
        </p>
      ))}
    </div>
  )
}

export function History({ userId }: Props) {
  const { meses, isLoading } = useHistorico(userId)
  const { setMesAtivo, setCurrentPage } = useAppStore()

  function irParaMes(mesId: string) {
    setMesAtivo(mesId)
    setCurrentPage('dashboard')
  }

  const chartData = [...meses].reverse().slice(-6).map(m => ({
    name: formatMesLabel(m.id).split(' ')[0].slice(0, 3),
    Receita: m.receita,
    Gastos: m.totalGeral,
  }))

  return (
    <div className="min-h-screen relative" style={{ background: 'var(--app-bg)' }}>
      <div
        className="absolute top-[-80px] left-[-60px] w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'var(--orb-purple)', filter: 'blur(80px)', zIndex: 0 }}
      />
      <div
        className="absolute top-[100px] right-[-40px] w-[200px] h-[200px] rounded-full pointer-events-none"
        style={{ background: 'var(--orb-green)', filter: 'blur(80px)', zIndex: 0 }}
      />

      <div className="relative" style={{ zIndex: 1 }}>
        <Header />

        <main className="max-w-2xl mx-auto px-5 py-5 space-y-4 pb-24">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="rounded-[16px] h-20 animate-pulse"
                  style={{ background: 'var(--metric-bg)' }}
                />
              ))}
            </div>
          ) : meses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <div
                className="w-16 h-16 rounded-[18px] flex items-center justify-center text-3xl"
                style={{ background: 'rgba(127,119,221,0.1)', border: '0.5px solid rgba(127,119,221,0.15)' }}
              >
                📅
              </div>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Nenhum mês registrado ainda
              </p>
            </div>
          ) : (
            <>
              {chartData.length >= 2 && (
                <div
                  className="rounded-[16px] p-4"
                  style={{ background: 'var(--card-bg)', border: '0.5px solid var(--card-border)' }}
                >
                  <p
                    className="text-[11px] font-medium uppercase mb-4"
                    style={{ color: 'var(--text-subtle)', letterSpacing: '0.08em' }}
                  >
                    Últimos meses
                  </p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={chartData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                        width={30}
                      />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                      <Bar dataKey="Receita" fill="#1D9E75" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Gastos" fill="#7F77DD" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="space-y-2">
                {meses.map((mes, i) => (
                  <motion.button
                    key={mes.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => irParaMes(mes.id)}
                    className="w-full rounded-[16px] p-4 text-left group transition-all"
                    style={{
                      background: 'var(--card-bg)',
                      border: '0.5px solid var(--card-border)',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--card-bg)')}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-medium capitalize text-[14px]" style={{ color: 'var(--text-primary)' }}>{formatMesLabel(mes.id)}</p>
                        <p className="text-[12px] mt-0.5" style={{ color: 'var(--text-subtle)' }}>
                          {mes.qtdContas} contas
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-[14px] font-semibold"
                          style={{ color: mes.sobra >= 0 ? '#1D9E75' : '#EF4444' }}
                        >
                          {formatBRL(mes.sobra)}
                        </span>
                        <ArrowRight className="w-4 h-4" style={{ color: 'var(--text-subtle)' }} />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'Receita', value: mes.receita, color: 'var(--text-muted)' as string, Icon: null },
                        { label: 'Pago', value: mes.totalPago, color: '#1D9E75', Icon: TrendingUp },
                        { label: 'Pendente', value: mes.totalPendente, color: '#EF9F27', Icon: TrendingDown },
                      ].map(({ label, value, color, Icon }) => (
                        <div key={label}>
                          <p className="text-[11px] mb-0.5 flex items-center gap-1" style={{ color: 'var(--text-subtle)' }}>
                            {Icon && <Icon className="w-3 h-3" style={{ color }} />}
                            {label}
                          </p>
                          <p className="text-[12px] font-medium tabular-nums" style={{ color }}>
                            {formatBRL(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.button>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  )
}
