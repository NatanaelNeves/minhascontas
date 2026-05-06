import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { IndicadoresRapidos } from '@/components/Dashboard/IndicadoresRapidos'
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
  totalSaldo,
  totalGastos,
  totalEntradas,
  totalPendente,
  onEditReceita,
  // gastosPorCategoria and gastosPorDia intentionally not destructured — used by charts in Task 14
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
    </div>
  )
}
