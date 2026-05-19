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
      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
    >
      <span
        className="text-[10px] uppercase tracking-wide"
        style={{ color: 'var(--text-tertiary)' }}
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
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Indicador label="Saldo Total" value={formatBRL(totalSaldo)} color="var(--text-primary)" />
        <Indicador label="Total Gastos" value={formatBRL(totalGastos)} color="var(--red)" />
        <Indicador label="Total Entradas" value={formatBRL(totalEntradas)} color="var(--green)" />
        <Indicador label="Despesas Fixas" value={formatBRL(totalFixas)} color="var(--purple)" />
        <Indicador label="A Receber" value={formatBRL(totalPendente)} color="var(--amber)" />
        <Indicador
          label="Fixas Pagas"
          value={`${fixasPagas} de ${fixasTotal}`}
          color={fixasPagas === fixasTotal && fixasTotal > 0 ? 'var(--green)' : 'var(--text-primary)'}
        />
      </div>
    </div>
  )
}
