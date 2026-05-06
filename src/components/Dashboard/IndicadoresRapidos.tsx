import { formatBRL } from '@/lib/utils'

interface Props {
  totalSaldo: number
  totalGastos: number
  totalEntradas: number
  totalFixas: number
  totalPendente: number
  fixasPagas: number
  fixasTotal: number
}

interface IndicadorProps {
  label: string
  value: string
  color: string
}

function Indicador({ label, value, color }: IndicadorProps) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-xl px-3 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
    >
      <span
        className="text-[10px] uppercase tracking-wide"
        style={{ color: 'var(--text-subtle)' }}
      >
        {label}
      </span>
      <span className="text-base font-bold tracking-tight" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

export function IndicadoresRapidos({
  totalSaldo,
  totalGastos,
  totalEntradas,
  totalFixas,
  totalPendente,
  fixasPagas,
  fixasTotal,
}: Props) {
  const saldoReal = totalSaldo + totalPendente

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Indicador label="Saldo Total" value={formatBRL(totalSaldo)} color="#ffffff" />
        <Indicador label="Total Gastos" value={formatBRL(totalGastos)} color="#EF4444" />
        <Indicador label="Total Entradas" value={formatBRL(totalEntradas)} color="#10B981" />
        <Indicador label="Despesas Fixas" value={formatBRL(totalFixas)} color="#7C72D8" />
        <Indicador label="A Receber" value={formatBRL(totalPendente)} color="#F59E0B" />
        <Indicador
          label="Fixas Pagas"
          value={`${fixasPagas} de ${fixasTotal}`}
          color={fixasPagas === fixasTotal && fixasTotal > 0 ? '#10B981' : '#ffffff'}
        />
      </div>

      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
      >
        <span
          className="text-xs uppercase tracking-wide"
          style={{ color: 'var(--text-subtle)' }}
        >
          Saldo Real (incl. A Receber)
        </span>
        <span
          className="text-lg font-bold tracking-tight"
          style={{ color: saldoReal >= 0 ? '#10B981' : '#EF4444' }}
        >
          {formatBRL(saldoReal)}
        </span>
      </div>
    </div>
  )
}
