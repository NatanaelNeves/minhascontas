import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBills } from '@/hooks/useBills'
import { useMonth } from '@/hooks/useMonth'
import { useTransactions } from '@/hooks/useTransactions'
import { useBanks } from '@/hooks/useBanks'
import { useReceivables } from '@/hooks/useReceivables'
import { useCartoes } from '@/hooks/useCartoes'
import { useFaturas } from '@/hooks/useFaturas'
import { useGastosRecorrentes } from '@/hooks/useGastosRecorrentes'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/ui/Header'
import { BottomNav } from '@/components/BottomNav/BottomNav'
import { ReceitaModal } from '@/components/Modals/ReceitaModal'
import { HomeTab } from './HomeTab'
import { ContasTab } from './ContasTab'
import { GastosTab } from './GastosTab'
import { BancosTab } from './BancosTab'
import { ReceberTab } from './ReceberTab'
import { CartoesTab } from './CartoesTab'
import { AbaAtiva, CartaoComSaldo, ContaInput } from '@/types'
import { prevMesId } from '@/lib/utils'
import { recargaEmBreve } from '@/lib/cartoes'
import { db } from '@/lib/firebase'
import { doc, deleteDoc } from 'firebase/firestore'

export function Dashboard({ userId }: { userId: string }) {
  const { mesAtivo, abaAtiva, setAbaAtiva } = useAppStore()

  const {
    mesInfo,
    isLoading: isMonthLoading,
    setReceita,
    criarMes,
    copiarContasRecorrentes,
    mesExiste,
    propagarSaldosBancos,
    propagarFaturasNaoPagas,
    criarContaComParcelas,
    excluirParcelamentosRestantes,
  } = useMonth(userId)

  const {
    contas,
    resumo,
    addConta,
    updateConta,
    deleteConta,
    togglePago,
    togglePagoComBanco,
    desfazerPagamento,
  } = useBills(userId, mesAtivo, mesInfo?.receita ?? 0)

  const {
    transacoes,
    totalGastosVariaveis,
    totalGastosBeneficios,
    addTransacao,
    updateTransacao,
    deleteTransacao,
  } = useTransactions(userId, mesAtivo)

  const { bancos, addBanco, updateBanco, deleteBanco } = useBanks(
    userId,
    transacoes,
    mesInfo?.saldosIniciais,
  )

  const {
    recebiveis,
    totalPendente,
    addRecebivel,
    updateRecebivel,
    deleteRecebivel,
    marcarRecebido,
    desmarcarRecebido,
  } = useReceivables(userId, mesAtivo)

  const { cartoes, addCartao, updateCartao, deleteCartao } = useCartoes(userId)
  const { faturas, marcarFaturaPaga, desmarcarFaturaPaga } = useFaturas(userId, mesAtivo, cartoes, transacoes, contas)
  const { addRecorrente, cancelarRecorrente, criarTransacoesParaMes, gastosRecorrentes } = useGastosRecorrentes(userId)

  const cartoesComSaldo = useMemo<CartaoComSaldo[]>(() => {
    return cartoes.map(cartao => {
      if (cartao.tipo !== 'credito') {
        return {
          ...cartao,
          totalUsado: 0,
          limiteDisponivel: cartao.saldoAtual,
          percentualUsado: 0,
          recargaEmBreve: recargaEmBreve(cartao.diaRecarga),
        }
      }

      const totalDeTx = transacoes
        .filter(t => t.cartaoId === cartao.id && t.tipo === 'gasto')
        .reduce((sum, t) => sum + t.valor, 0)
      const totalDeContas = contas
        .filter(c => c.cartaoId === cartao.id && !c.pago)
        .reduce((sum, c) => {
          if (c.parcelas) {
            return sum + c.valor * (c.parcelas.total - c.parcelas.atual + 1)
          }
          return sum + c.valor
        }, 0)
      const totalUsado = totalDeTx + totalDeContas
      const limiteDisponivel = cartao.limite - totalUsado
      const percentualUsado = cartao.limite > 0 ? (totalUsado / cartao.limite) * 100 : 0
      return { ...cartao, totalUsado, limiteDisponivel, percentualUsado, recargaEmBreve: false }
    })
  }, [cartoes, transacoes, contas])

  const [receitaModalOpen, setReceitaModalOpen] = useState(false)
  const [inicializando, setInicializando] = useState(false)
  const inicializadoRef = useRef<Set<string>>(new Set())
  const prevMesAtivoRef = useRef(mesAtivo)

  async function inicializarMesSeNecessario(novoMesId: string, mesAnteriorId: string) {
    const jaExiste = await mesExiste(novoMesId)
    if (jaExiste) return

    setInicializando(true)
    try {
      await criarMes(novoMesId, 0)
      const anteriorExiste = await mesExiste(mesAnteriorId)
      if (anteriorExiste) {
        await propagarSaldosBancos(mesAnteriorId, novoMesId)
        await copiarContasRecorrentes(mesAnteriorId, novoMesId)
        await propagarFaturasNaoPagas(mesAnteriorId, novoMesId)
      }
      await criarTransacoesParaMes(novoMesId)
    } catch (err) {
      console.error('[inicializar mês]', err)
    } finally {
      setInicializando(false)
    }
  }

  useEffect(() => {
    const mesAnterior = prevMesAtivoRef.current
    prevMesAtivoRef.current = mesAtivo

    const avancando = mesAtivo >= mesAnterior
    if (!avancando) return
    if (isMonthLoading || mesInfo !== null) return
    if (inicializadoRef.current.has(mesAtivo)) return
    inicializadoRef.current.add(mesAtivo)

    inicializarMesSeNecessario(mesAtivo, prevMesId(mesAtivo))
  }, [mesAtivo, mesInfo, isMonthLoading])

  // Clean up orphaned receivable transactions whose receivable was deleted
  useEffect(() => {
    if (!userId || !mesAtivo || transacoes.length === 0) return
    const receivableIds = new Set(recebiveis.map(r => r.id))
    const txPath = `users/${userId}/months/${mesAtivo}/transactions`
    transacoes.forEach(t => {
      if (t.origem?.tipo === 'receivable' && t.origem.id && !receivableIds.has(t.origem.id)) {
        deleteDoc(doc(db, txPath, t.id))
      }
    })
  }, [transacoes, recebiveis, userId, mesAtivo])

  async function handleSaveParcelada(data: ContaInput, parcelaTotal: number, parcelaInicialAtual: number) {
    await criarContaComParcelas(data, parcelaTotal, mesAtivo, parcelaInicialAtual)
  }

  async function handleDeleteParcelamento(
    parcelamentoId: string,
    parcelaAtualFrom: number,
    parcelaTotal: number,
  ) {
    await excluirParcelamentosRestantes(parcelamentoId, parcelaAtualFrom, parcelaTotal, mesAtivo)
  }

  useEffect(() => {
    async function exportarPDF() {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ])
      const el = document.getElementById('tab-content')
      if (!el) return
      const canvas = await html2canvas(el, { backgroundColor: '#0c0c0e', scale: 2 })
      const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(
        canvas.toDataURL('image/png'),
        'PNG',
        0,
        0,
        canvas.width / 2,
        canvas.height / 2,
      )
      pdf.save(`minhascontas-${mesAtivo}.pdf`)
    }

    document.addEventListener('export-pdf', exportarPDF)
    return () => document.removeEventListener('export-pdf', exportarPDF)
  }, [mesAtivo])

  const FAB_LABELS: Partial<Record<AbaAtiva, string>> = {
    contas: 'Adicionar conta',
    gastos: 'Novo lançamento',
    bancos: 'Novo banco',
    receber: 'Novo a receber',
    cartoes: 'Novo cartão',
  }

  function handleFAB() {
    document.dispatchEvent(new CustomEvent(`fab-${abaAtiva}`))
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Header />

      {inicializando && (
        <div style={{
          textAlign: 'center',
          padding: '4px 0',
          fontSize: 11,
          color: 'var(--text-tertiary)',
          background: 'var(--bg-surface)',
          borderBottom: '0.5px solid var(--border)',
        }}>
          Preparando mês...
        </div>
      )}

      <main
        id="tab-content"
        className="w-full max-w-[480px] mx-auto px-4 py-5 pb-40 flex flex-col gap-4"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={abaAtiva}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {abaAtiva === 'home' && (
              <HomeTab
                resumo={resumo}
                receita={mesInfo?.receita ?? 0}
                contas={contas}
                bancos={bancos}
                cartoesComSaldo={cartoesComSaldo}
                totalGastosVariaveis={totalGastosVariaveis}
                totalGastosBeneficios={totalGastosBeneficios}
                totalPendente={totalPendente}
                nRecebiveis={recebiveis.length}
                onEditReceita={() => setReceitaModalOpen(true)}
              />
            )}
            {abaAtiva === 'contas' && (
              <ContasTab
                contas={contas}
                bancos={bancos}
                faturas={faturas}
                cartoes={cartoes}
                onTogglePago={togglePago}
                onTogglePagoComBanco={togglePagoComBanco}
                onDesfazerPagamento={desfazerPagamento}
                onDelete={deleteConta}
                onAdd={addConta}
                onUpdate={updateConta}
                onSaveParcelada={handleSaveParcelada}
                onDeleteParcelamento={handleDeleteParcelamento}
                onNavigateToBancos={() => setAbaAtiva('bancos')}
                onNavigateToCartoes={() => setAbaAtiva('cartoes')}
                onMarcarFaturaPaga={marcarFaturaPaga}
                onDesmarcarFaturaPaga={desmarcarFaturaPaga}
              />
            )}
            {abaAtiva === 'gastos' && (
              <GastosTab
                transacoes={transacoes}
                bancos={bancos}
                cartoes={cartoes}
                onAdd={addTransacao}
                onUpdate={updateTransacao}
                onDelete={deleteTransacao}
                onUpdateCartao={updateCartao}
                onAddRecorrente={addRecorrente}
                onCancelarRecorrente={cancelarRecorrente}
              />
            )}
            {abaAtiva === 'bancos' && (
              <BancosTab
                bancos={bancos}
                onAdd={addBanco}
                onUpdate={updateBanco}
                onDelete={deleteBanco}
              />
            )}
            {abaAtiva === 'receber' && (
              <ReceberTab
                recebiveis={recebiveis}
                bancos={bancos}
                onAdd={addRecebivel}
                onUpdate={updateRecebivel}
                onDelete={deleteRecebivel}
                onMarcarRecebido={marcarRecebido}
                onDesmarcarRecebido={desmarcarRecebido}
                onNavigateToBancos={() => setAbaAtiva('bancos')}
              />
            )}
            {abaAtiva === 'cartoes' && (
              <CartoesTab
                cartoes={cartoesComSaldo}
                contas={contas}
                transacoes={transacoes}
                faturas={faturas}
                bancos={bancos}
                gastosRecorrentes={gastosRecorrentes}
                onAdd={addCartao}
                onUpdate={updateCartao}
                onDelete={deleteCartao}
                onMarcarFaturaPaga={marcarFaturaPaga}
                onCancelarRecorrente={cancelarRecorrente}
                onNavigateToBancos={() => setAbaAtiva('bancos')}
              />
            )}
          </motion.div>
        </AnimatePresence>

      </main>

      {abaAtiva !== 'home' && FAB_LABELS[abaAtiva] && (
        <div
          className="fixed bottom-16 inset-x-0 flex justify-center items-end pb-5 pt-16 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, var(--bg-base) 55%, transparent)',
            zIndex: 10,
          }}
        >
          <motion.button
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 22 }}
            onClick={handleFAB}
            className="pointer-events-auto flex items-center gap-2 rounded-full text-[13px] font-semibold"
            style={{
              background: 'var(--text-primary)',
              color: 'var(--bg-base)',
              padding: '12px 26px',
              letterSpacing: '-0.02em',
            }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <span style={{ fontSize: 20, fontWeight: 200, lineHeight: 1, marginTop: -1 }}>
              +
            </span>
            {FAB_LABELS[abaAtiva]}
          </motion.button>
        </div>
      )}

      <BottomNav ativa={abaAtiva} onChange={setAbaAtiva} />

      <ReceitaModal
        open={receitaModalOpen}
        valorAtual={mesInfo?.receita ?? 0}
        onSave={setReceita}
        onClose={() => setReceitaModalOpen(false)}
      />
    </div>
  )
}
