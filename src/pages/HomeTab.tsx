import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { SaldoPatrimonial } from '@/components/Dashboard/SaldoPatrimonial'
import { HomeResumoMes } from '@/components/Dashboard/HomeResumoMes'
import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { ComparacaoMeses } from '@/components/Dashboard/ComparacaoMeses'
import { Conta, ResumoMes, BancoComSaldo, CartaoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface Props {
  resumo: ResumoMes
  receita: number
  contas: Conta[]
  bancos: BancoComSaldo[]
  cartoesComSaldo: CartaoComSaldo[]
  totalGastosVariaveis: number
  totalGastosBeneficios: number
  totalPendente: number
  nRecebiveis: number
  onEditReceita: () => void
}

export function HomeTab({
  resumo,
  receita,
  contas,
  bancos,
  cartoesComSaldo,
  totalGastosVariaveis,
  totalGastosBeneficios,
  totalPendente,
  nRecebiveis,
  onEditReceita,
}: Props) {
  const { mesAtivo, setAbaAtiva } = useAppStore()

  const totalSaldoBancos = useMemo(
    () => bancos.filter(b => b.tipo === 'corrente').reduce((s, b) => s + b.saldoAtual, 0),
    [bancos],
  )

  const contasParceladas = useMemo(() => contas.filter(c => c.parcelas), [contas])
  const totalParcelasMes = useMemo(
    () => contasParceladas.reduce((s, c) => s + c.valor, 0),
    [contasParceladas],
  )
  const pctParcelas = receita > 0 ? totalParcelasMes / receita : 0

  const diaAtual = new Date().getDate()
  const mesAtualEhMesCorrente =
    mesAtivo ===
    `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const exibirComparativo = !mesAtualEhMesCorrente || diaAtual >= 10

  return (
    <div className="flex flex-col gap-4">
      <SaldoPatrimonial
        bancos={bancos}
        cartoesComSaldo={cartoesComSaldo}
      />

      <HomeResumoMes
        resumo={resumo}
        receita={receita}
        totalSaldoBancos={totalSaldoBancos}
        totalGastosVariaveis={totalGastosVariaveis}
        totalGastosBeneficios={totalGastosBeneficios}
        onEditReceita={onEditReceita}
      />

      <ResumoCards
        resumo={resumo}
        semContas={contas.length === 0}
        nPagas={contas.filter(c => c.pago).length}
        nTotal={contas.length}
      />

      {totalPendente > 0 && (
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--amber)', letterSpacing: '-0.01em', paddingLeft: 2 }}>
          💰 {formatBRL(totalPendente)} a receber
          {nRecebiveis > 0 && ` de ${nRecebiveis} ${nRecebiveis === 1 ? 'pessoa' : 'pessoas'}`}
        </p>
      )}

      {exibirComparativo && <ComparacaoMeses resumoAtual={resumo} />}

      {receita > 0 && pctParcelas > 0.3 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--amber-muted)',
            border: '0.5px solid rgba(245,158,11,0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}
        >
          <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--amber)', letterSpacing: '-0.01em' }}>
              {formatBRL(totalParcelasMes)}/mês comprometido em parcelas ({Math.round(pctParcelas * 100)}% da receita)
            </p>
            <button
              onClick={() => setAbaAtiva('cartoes')}
              style={{
                fontSize: 11, color: 'rgba(245,158,11,0.7)', background: 'none',
                border: 'none', cursor: 'pointer', padding: 0, marginTop: 3,
                fontFamily: 'inherit', letterSpacing: '-0.01em',
              }}
            >
              Ver parcelamentos →
            </button>
          </div>
        </motion.div>
      )}
    </div>
  )
}
