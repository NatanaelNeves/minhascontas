import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBills } from '@/hooks/useBills'
import { useMonth } from '@/hooks/useMonth'
import { useTransactions } from '@/hooks/useTransactions'
import { useTransacoesAnteriores } from '@/hooks/useTransacoesAnteriores'
import { useBanks } from '@/hooks/useBanks'
import { useReceivables } from '@/hooks/useReceivables'
import { useCartoes } from '@/hooks/useCartoes'
import { useFaturas } from '@/hooks/useFaturas'
import { useGastosRecorrentes } from '@/hooks/useGastosRecorrentes'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/ui/Header'
import { BottomNav } from '@/components/BottomNav/BottomNav'
import { ReceitaModal } from '@/components/Modals/ReceitaModal'
import { RecorrenteScopeModal } from '@/components/Modals/RecorrenteScopeModal'
import { HomeTab } from './HomeTab'
import { ContasTab } from './ContasTab'
import { GastosTab } from './GastosTab'
import { BancosTab } from './BancosTab'
import { ReceberTab } from './ReceberTab'
import { CartoesTab } from './CartoesTab'
import { AbaAtiva, CartaoComSaldo, Conta, ContaInput, TransacaoInput } from '@/types'
import { prevMesId } from '@/lib/utils'
import { recargaEmBreve } from '@/lib/cartoes'
import { db } from '@/lib/firebase'
import { doc, deleteDoc, getDocs, collection, query, where, writeBatch } from 'firebase/firestore'

export function Dashboard({ userId }: { userId: string }) {
  const { mesAtivo, abaAtiva, setAbaAtiva } = useAppStore()

  const {
    mesInfo,
    isLoading: isMonthLoading,
    setReceita,
    criarMes,
    copiarContasRecorrentes,
    propagarRecorrenteParaMesesFuturos,
    mesExiste,
    propagarFaturasNaoPagas,
    criarContaComParcelas,
    excluirParcelamentosRestantes,
    atualizarRecorrenteParaMesesFuturos,
    excluirRecorrenteParaMesesFuturos,
    sincronizarFaturaPropagada,
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
    totalGastosBeneficios,
    gastosPorCategoria,
    addTransacao,
    addTransferencia,
    updateTransacao,
    deleteTransacao,
  } = useTransactions(userId, mesAtivo)

  const { transacoes: transacoesAnteriores } = useTransacoesAnteriores(userId, mesAtivo)

  const { bancos, addBanco, updateBanco, deleteBanco } = useBanks(
    userId,
    transacoes,
    transacoesAnteriores,
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

  const { cartoes, addCartao, updateCartao, setGastoAtual, deleteCartao } = useCartoes(userId)
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

      const faturaAtual = faturas.find(f => f.cartaoId === cartao.id)
      const faturaPaga = faturaAtual?.pago ?? false
      // Quando a fatura é paga, as transações avulsas daquele ciclo não reduzem mais o limite
      const txIdsDaFatura = faturaPaga
        ? new Set(faturaAtual!.gastosAvulsos.map(t => t.id))
        : new Set<string>()

      const totalDeTx = transacoes
        .filter(t => t.cartaoId === cartao.id && t.tipo === 'gasto' && !txIdsDaFatura.has(t.id))
        .reduce((sum, t) => sum + t.valor, 0)
      const totalDeContas = contas
        .filter(c => c.cartaoId === cartao.id && !c.pago)
        .reduce((sum, c) => {
          if (c.parcelas) {
            return sum + c.valor * (c.parcelas.total - c.parcelas.atual + 1)
          }
          return sum + c.valor
        }, 0)
      // gastoAtual é limpo no Firestore ao pagar a fatura (marcarFaturaPaga)
      const gastoAtualEfetivo = cartao.gastoAtual ?? 0
      const totalUsado = totalDeTx + totalDeContas + gastoAtualEfetivo
      const limiteDisponivel = cartao.limite - totalUsado
      const percentualUsado = cartao.limite > 0 ? (totalUsado / cartao.limite) * 100 : 0
      return { ...cartao, totalUsado, limiteDisponivel, percentualUsado, recargaEmBreve: false }
    })
  }, [cartoes, transacoes, contas, faturas])

  type PendingPropagacao =
    | { tipo: 'editar'; conta: Conta; updates: Partial<ContaInput> }
    | { tipo: 'excluir'; conta: Conta }

  const [receitaModalOpen, setReceitaModalOpen] = useState(false)
  const [pendingPropagacao, setPendingPropagacao] = useState<PendingPropagacao | null>(null)
  const [inicializando, setInicializando] = useState(false)
  const inicializadoRef = useRef<Set<string>>(new Set())
  const inicializandoRef = useRef(false)
  const prevMesAtivoRef = useRef(mesAtivo)
  const migracaoRecorrenteRan = useRef(false)

  async function encontrarMesAnteriorExistente(mesId: string): Promise<string | null> {
    let current = mesId
    for (let i = 0; i < 24; i++) {
      if (await mesExiste(current)) return current
      current = prevMesId(current)
    }
    return null
  }

  async function inicializarMesSeNecessario(novoMesId: string, mesAnteriorId: string): Promise<boolean> {
    if (inicializandoRef.current) return false
    inicializandoRef.current = true

    try {
      const jaExiste = await mesExiste(novoMesId)
      setInicializando(true)
      if (!jaExiste) {
        await criarMes(novoMesId, 0)
        const mesBase = await encontrarMesAnteriorExistente(mesAnteriorId)
        if (mesBase) {
          await copiarContasRecorrentes(mesBase, novoMesId)
          await propagarFaturasNaoPagas(mesBase, novoMesId)
        }
      }
      await criarTransacoesParaMes(novoMesId)
      return true
    } catch (err) {
      console.error('[inicializar mês]', err)
      return false
    } finally {
      inicializandoRef.current = false
      setInicializando(false)
    }
  }

  useEffect(() => {
    const mesAnterior = prevMesAtivoRef.current
    prevMesAtivoRef.current = mesAtivo

    const avancando = mesAtivo >= mesAnterior
    if (!avancando) return
    if (isMonthLoading) return
    if (inicializadoRef.current.has(mesAtivo)) return
    inicializarMesSeNecessario(mesAtivo, prevMesId(mesAtivo)).then((didInit) => {
      if (didInit) inicializadoRef.current.add(mesAtivo)
    })
  }, [mesAtivo, mesInfo, isMonthLoading])

  // One-time migration: set recorrente=true on fixo bills that lack it
  useEffect(() => {
    if (!userId || migracaoRecorrenteRan.current) return
    migracaoRecorrenteRan.current = true

    async function run() {
      const monthsSnap = await getDocs(collection(db, `users/${userId}/months`))
      const batch = writeBatch(db)
      let count = 0

      for (const monthDoc of monthsSnap.docs) {
        const billsSnap = await getDocs(
          query(
            collection(db, `users/${userId}/months/${monthDoc.id}/bills`),
            where('categoria', '==', 'fixo'),
          ),
        )
        for (const billDoc of billsSnap.docs) {
          const data = billDoc.data()
          if (data.recorrente === true) continue
          if (data.parcelamentoId) continue
          batch.update(billDoc.ref, { recorrente: true })
          count++
        }
      }

      if (count > 0) {
        await batch.commit()
        // Propagate recorrente bills to future initialized months
        const meses = monthsSnap.docs.map(d => d.id).sort()
        for (let i = 0; i < meses.length - 1; i++) {
          await propagarRecorrenteParaMesesFuturos(meses[i])
        }
      }
    }

    run().catch(console.error)
  }, [userId])

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

  async function handleAddConta(data: ContaInput): Promise<string> {
    const id = await addConta(data)
    if (data.recorrente === true) {
      await propagarRecorrenteParaMesesFuturos(mesAtivo)
    }
    return id
  }

  async function handleSaveParcelada(data: ContaInput, parcelaTotal: number, parcelaInicialAtual: number) {
    await criarContaComParcelas(data, parcelaTotal, mesAtivo, parcelaInicialAtual)
  }

  async function handleUpdateConta(id: string, data: Partial<ContaInput>) {
    await updateConta(id, data)
    const conta = contas.find(c => c.id === id)
    if (conta?.recorrente && !conta.parcelamentoId) {
      setPendingPropagacao({ tipo: 'editar', conta, updates: data })
    }
  }

  async function handleDeleteConta(id: string) {
    const conta = contas.find(c => c.id === id)
    await deleteConta(id)
    if (conta?.recorrente && !conta.parcelamentoId) {
      setPendingPropagacao({ tipo: 'excluir', conta })
    }
  }

  async function handlePropagacaoTodosFuturos() {
    if (!pendingPropagacao) return
    if (pendingPropagacao.tipo === 'editar') {
      const { conta, updates } = pendingPropagacao
      if (updates.recorrente === false) {
        await excluirRecorrenteParaMesesFuturos(mesAtivo, conta)
      } else {
        await atualizarRecorrenteParaMesesFuturos(mesAtivo, conta, updates)
      }
    } else {
      await excluirRecorrenteParaMesesFuturos(mesAtivo, pendingPropagacao.conta)
    }
    setPendingPropagacao(null)
  }

  async function handleAddTransacao(data: TransacaoInput) {
    await addTransacao(data)
    if (data.cartaoId && data.tipo === 'gasto') {
      await sincronizarFaturaPropagada(mesAtivo)
    }
  }

  async function handleUpdateTransacao(id: string, data: Partial<TransacaoInput>) {
    const tx = transacoes.find(t => t.id === id)
    await updateTransacao(id, data)
    if (tx?.cartaoId) {
      await sincronizarFaturaPropagada(mesAtivo)
    }
  }

  async function handleDeleteTransacao(id: string) {
    const tx = transacoes.find(t => t.id === id)
    await deleteTransacao(id)
    if (tx?.cartaoId && tx.tipo === 'gasto') {
      await sincronizarFaturaPropagada(mesAtivo)
    }
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
                totalGastosBeneficios={totalGastosBeneficios}
                gastosPorCategoria={gastosPorCategoria}
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
                onDelete={handleDeleteConta}
                onAdd={handleAddConta}
                onUpdate={handleUpdateConta}
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
                onAdd={handleAddTransacao}
                onAddTransferencia={addTransferencia}
                onUpdate={handleUpdateTransacao}
                onDelete={handleDeleteTransacao}
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
                onSetGastoAtual={setGastoAtual}
                onDelete={deleteCartao}
                onMarcarFaturaPaga={marcarFaturaPaga}
                onCancelarRecorrente={cancelarRecorrente}
                onNavigateToBancos={() => setAbaAtiva('bancos')}
                onAddTransacao={handleAddTransacao}
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

      <RecorrenteScopeModal
        open={pendingPropagacao !== null}
        tipo={pendingPropagacao?.tipo ?? 'editar'}
        nomeConta={pendingPropagacao?.conta.nome ?? ''}
        onSoEsteMes={() => setPendingPropagacao(null)}
        onTodosFuturos={handlePropagacaoTodosFuturos}
        onClose={() => setPendingPropagacao(null)}
      />

      <ReceitaModal
        open={receitaModalOpen}
        valorAtual={mesInfo?.receita ?? 0}
        onSave={setReceita}
        onClose={() => setReceitaModalOpen(false)}
      />
    </div>
  )
}
