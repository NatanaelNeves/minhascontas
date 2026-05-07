import { motion } from 'framer-motion'
import { SaldoPatrimonial } from '@/components/Dashboard/SaldoPatrimonial'
import { HomeResumoMes } from '@/components/Dashboard/HomeResumoMes'
import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { ComparacaoMeses } from '@/components/Dashboard/ComparacaoMeses'
import { ChartsPizza } from '@/components/Charts/ChartsPizza'
import { ChartsBarBancos } from '@/components/Charts/ChartsBarBancos'
import { ChartsLinhaDia } from '@/components/Charts/ChartsLinhaDia'
import { Conta, ResumoMes, BancoComSaldo, CartaoComSaldo, CategoriaGasto } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  userId: string
  resumo: ResumoMes
  receita: number
  contas: Conta[]
  bancos: BancoComSaldo[]
  cartoesComSaldo: CartaoComSaldo[]
  totalSaldo: number
  totalGastos: number
  totalPendente: number
  gastosPorCategoria: Record<CategoriaGasto, number>
  gastosPorDia: { data: string; total: number }[]
  onEditReceita: () => void
  onNavigateToBancos: () => void
}

export function HomeTab({
  userId,
  resumo,
  receita,
  contas,
  bancos,
  cartoesComSaldo,
  totalSaldo,
  totalGastos,
  totalPendente,
  gastosPorCategoria,
  gastosPorDia,
  onEditReceita,
  onNavigateToBancos,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      <SaldoPatrimonial
        totalSaldo={totalSaldo}
        cartoesComSaldo={cartoesComSaldo}
        onNavigateToBancos={onNavigateToBancos}
        semBancos={bancos.length === 0}
      />

      <HomeResumoMes
        resumo={resumo}
        receita={receita}
        totalGastos={totalGastos}
        onEditReceita={onEditReceita}
      />

      <ResumoCards
        resumo={resumo}
        semContas={contas.length === 0}
      />

      {totalPendente > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--amber-muted)',
            border: '0.5px solid rgba(245,158,11,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', letterSpacing: '-0.01em' }}>
              {formatBRL(totalPendente)} a receber
            </p>
            <p style={{ fontSize: 10, color: 'rgba(245,158,11,0.65)', marginTop: 2 }}>
              Não contabilizado no saldo disponível
            </p>
          </div>
          <span style={{ fontSize: 18 }}>📥</span>
        </motion.div>
      )}

      <ComparacaoMeses userId={userId} resumoAtual={resumo} />

      {Object.keys(gastosPorCategoria).length > 0 && (
        <ChartsPizza gastosPorCategoria={gastosPorCategoria} />
      )}
      <ChartsBarBancos bancos={bancos} />
      <ChartsLinhaDia gastosPorDia={gastosPorDia} />
    </div>
  )
}
