import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SaldoPatrimonial } from '@/components/Dashboard/SaldoPatrimonial'
import { HomeResumoMes } from '@/components/Dashboard/HomeResumoMes'
import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { ComparacaoMeses } from '@/components/Dashboard/ComparacaoMeses'
import { ChartsPizza } from '@/components/Charts/ChartsPizza'
import { ChartsBarBancos } from '@/components/Charts/ChartsBarBancos'
import { ChartsLinhaDia } from '@/components/Charts/ChartsLinhaDia'
import { Conta, ResumoMes, BancoComSaldo, CartaoComSaldo } from '@/types'
import { formatBRL, mesIdAddMeses, mesIdToShortLabel } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface Props {
  userId: string
  resumo: ResumoMes
  receita: number
  contas: Conta[]
  bancos: BancoComSaldo[]
  cartoesComSaldo: CartaoComSaldo[]
  totalGastosVariaveis: number
  totalPendente: number
  nRecebiveis: number
  gastosPorCategoria: Record<string, number>
  gastosPorDia: { data: string; total: number }[]
  onEditReceita: () => void
  onNavigateToBancos: () => void
  onNavigateToCartoes: () => void
}

export function HomeTab({
  userId,
  resumo,
  receita,
  contas,
  bancos,
  cartoesComSaldo,
  totalGastosVariaveis,
  totalPendente,
  nRecebiveis,
  gastosPorCategoria,
  gastosPorDia,
  onEditReceita,
  onNavigateToBancos,
  onNavigateToCartoes,
}: Props) {
  const { mesAtivo } = useAppStore()
  const [parcelamentosAberto, setParcelamentosAberto] = useState(false)

  const contasParceladas = useMemo(() => contas.filter(c => c.parcelas), [contas])
  const totalParcelasMes = useMemo(
    () => contasParceladas.reduce((s, c) => s + c.valor, 0),
    [contasParceladas],
  )
  const pctParcelas = receita > 0 ? totalParcelasMes / receita : 0

  return (
    <div className="flex flex-col gap-4">
      <SaldoPatrimonial
        bancos={bancos}
        cartoesComSaldo={cartoesComSaldo}
        onNavigateToBancos={onNavigateToBancos}
      />

      <HomeResumoMes
        resumo={resumo}
        receita={receita}
        totalGastosVariaveis={totalGastosVariaveis}
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

      <ComparacaoMeses userId={userId} resumoAtual={resumo} />

      {/* Alerta: parcelas comprometem > 30% da receita */}
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
              onClick={onNavigateToCartoes}
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

      {/* Parcelamentos ativos — colapsável */}
      {contasParceladas.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '0.5px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          overflow: 'hidden',
        }}>
          <button
            onClick={() => setParcelamentosAberto(v => !v)}
            style={{
              width: '100%', padding: '12px 14px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase' }}>
                Parcelamentos ativos
              </span>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 99,
                background: 'var(--bg-elevated)', color: 'var(--text-tertiary)',
              }}>
                {contasParceladas.length}
              </span>
            </div>
            <span style={{
              fontSize: 11, color: 'var(--text-tertiary)',
              transform: parcelamentosAberto ? 'rotate(180deg)' : 'none',
              transition: 'transform .2s', display: 'inline-block',
            }}>▾</span>
          </button>

          <AnimatePresence initial={false}>
            {parcelamentosAberto && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{ overflow: 'hidden' }}
              >
                <div style={{ borderTop: '0.5px solid var(--border)' }}>
                  {contasParceladas.map(conta => {
                    if (!conta.parcelas) return null
                    const mr = conta.parcelas.total - conta.parcelas.atual
                    const mesTermina = mesIdAddMeses(mesAtivo, mr)
                    const cartao = cartoesComSaldo.find(c => c.id === conta.cartaoId)
                    const cor = mr > 6 ? 'var(--green)' : mr >= 3 ? 'var(--amber)' : 'var(--red)'
                    return (
                      <div key={conta.id} style={{
                        padding: '10px 14px',
                        borderBottom: '0.5px solid var(--divider)',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {conta.nome}
                          </p>
                          {cartao && (
                            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', marginTop: 1 }}>
                              {cartao.nome}
                            </p>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
                            {formatBRL(conta.valor)}/mês
                          </span>
                          <span style={{ fontSize: 10, color: cor }}>
                            {conta.parcelas.atual}/{conta.parcelas.total} · {mesIdToShortLabel(mesTermina)}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>
                      Total · {formatBRL(totalParcelasMes)}/mês
                    </span>
                    <button
                      onClick={onNavigateToCartoes}
                      style={{
                        fontSize: 11, color: 'var(--text-tertiary)', background: 'none',
                        border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
                    >
                      Ver tudo →
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {Object.keys(gastosPorCategoria).length > 0 && (
        <ChartsPizza gastosPorCategoria={gastosPorCategoria} />
      )}
      <ChartsBarBancos bancos={bancos} />
      <ChartsLinhaDia gastosPorDia={gastosPorDia} />
    </div>
  )
}
