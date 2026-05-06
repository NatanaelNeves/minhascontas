import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { IndicadoresRapidos } from '@/components/Dashboard/IndicadoresRapidos'
import { ChartsPizza } from '@/components/Charts/ChartsPizza'
import { ChartsBarBancos } from '@/components/Charts/ChartsBarBancos'
import { ChartsLinhaDia } from '@/components/Charts/ChartsLinhaDia'
import { Conta, ResumoMes, BancoComSaldo, CategoriaGasto } from '@/types'

interface Props {
  resumo: ResumoMes
  receita: number
  contas: Conta[]
  bancos: BancoComSaldo[]
  totalSaldo: number
  totalGastos: number
  totalEntradas: number
  totalPendente: number
  gastosPorCategoria: Record<CategoriaGasto, number>
  gastosPorDia: { data: string; total: number }[]
  onEditReceita: () => void
}

export function HomeTab({
  resumo,
  receita,
  contas,
  bancos,
  totalSaldo,
  totalGastos,
  totalEntradas,
  totalPendente,
  gastosPorCategoria,
  gastosPorDia,
  onEditReceita,
}: Props) {
  const fixasPagas = contas.filter(c => c.categoria === 'fixo' && c.pago).length
  const fixasTotal = contas.filter(c => c.categoria === 'fixo').length

  return (
    <div className="flex flex-col gap-4">
      <ResumoCards
        resumo={resumo}
        receita={receita}
        semContas={contas.length === 0}
        onEditReceita={onEditReceita}
      />
      <IndicadoresRapidos
        totalSaldo={totalSaldo}
        totalGastos={totalGastos}
        totalEntradas={totalEntradas}
        totalFixas={resumo.totalGeral}
        totalPendente={totalPendente}
        fixasPagas={fixasPagas}
        fixasTotal={fixasTotal}
      />
      {Object.keys(gastosPorCategoria).length > 0 && (
        <ChartsPizza gastosPorCategoria={gastosPorCategoria} />
      )}
      <ChartsBarBancos bancos={bancos} />
      <ChartsLinhaDia gastosPorDia={gastosPorDia} />
    </div>
  )
}
