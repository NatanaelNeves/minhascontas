import { motion } from 'framer-motion'
import { ResumoMes } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  resumo: ResumoMes
  receita: number
}

function Semaforo({ saude }: { saude: ResumoMes['saudePrimaria'] }) {
  const config = {
    verde:    { symbol: '🟢', label: 'Saudável',  color: 'text-green-400' },
    amarelo:  { symbol: '🟡', label: 'Atenção',   color: 'text-yellow-400' },
    vermelho: { symbol: '🔴', label: 'Crítico',   color: 'text-red-400' },
  }
  const { symbol, label, color } = config[saude]
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${color}`}>
      {symbol} {label}
    </span>
  )
}

function SummaryCard({
  label,
  value,
  color = 'text-white',
  delay = 0,
}: {
  label: string
  value: string
  color?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
    >
      <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </motion.div>
  )
}

export function ResumoCards({ resumo, receita }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-zinc-400 text-sm uppercase tracking-wide">Resumo do mês</h2>
        <Semaforo saude={resumo.saudePrimaria} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Receita"  value={formatBRL(receita)} delay={0} />
        <SummaryCard
          label="Sobra"
          value={formatBRL(resumo.sobra)}
          color={resumo.sobra >= 0 ? 'text-green-400' : 'text-red-400'}
          delay={0.05}
        />
        <SummaryCard label="Pago"     value={formatBRL(resumo.totalPago)}     color="text-green-400"  delay={0.1} />
        <SummaryCard label="Pendente" value={formatBRL(resumo.totalPendente)} color="text-yellow-400" delay={0.15} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex justify-between text-xs text-zinc-400 mb-2">
          <span>Progresso</span>
          <span>{resumo.percentualPago.toFixed(0)}% pago</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(resumo.percentualPago, 100)}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-green-500 h-2 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}
