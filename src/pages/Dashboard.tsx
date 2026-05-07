import { useState, useEffect, useRef } from 'react'
import { FileDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBills } from '@/hooks/useBills'
import { useMonth } from '@/hooks/useMonth'
import { useTransactions } from '@/hooks/useTransactions'
import { useBanks } from '@/hooks/useBanks'
import { useReceivables } from '@/hooks/useReceivables'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/ui/Header'
import { BottomNav } from '@/components/BottomNav/BottomNav'
import { ReceitaModal } from '@/components/Modals/ReceitaModal'
import { CopiarFixosModal } from '@/components/Modals/CopiarFixosModal'
import { HomeTab } from './HomeTab'
import { ContasTab } from './ContasTab'
import { GastosTab } from './GastosTab'
import { BancosTab } from './BancosTab'
import { ReceberTab } from './ReceberTab'
import { AbaAtiva } from '@/types'
import { prevMesId } from '@/lib/utils'
import { db } from '@/lib/firebase'
import { doc, deleteDoc } from 'firebase/firestore'

export function Dashboard({ userId }: { userId: string }) {
  const { mesAtivo, abaAtiva, setAbaAtiva } = useAppStore()

  const {
    mesInfo,
    isLoading: isMonthLoading,
    setReceita,
    criarMes,
    copiarFixos,
    mesExiste,
  } = useMonth(userId)

  const {
    contas,
    resumo,
    addConta,
    updateConta,
    deleteConta,
    togglePagoComBanco,
    desfazerPagamento,
  } = useBills(userId, mesAtivo, mesInfo?.receita ?? 0)

  const {
    transacoes,
    totalGastos,
    totalEntradas,
    gastosPorCategoria,
    gastosPorDia,
    addTransacao,
    updateTransacao,
    deleteTransacao,
  } = useTransactions(userId, mesAtivo)

  const { bancos, totalSaldo, addBanco, updateBanco, deleteBanco } = useBanks(
    userId,
    mesAtivo,
    transacoes,
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

  const [receitaModalOpen, setReceitaModalOpen] = useState(false)
  const [copiarModalOpen, setCopiarModalOpen] = useState(false)
  const [mesOrigemId, setMesOrigemId] = useState('')
  const inicializadoRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (isMonthLoading || mesInfo !== null) return
    if (inicializadoRef.current.has(mesAtivo)) return
    inicializadoRef.current.add(mesAtivo)
    const prevId = prevMesId(mesAtivo)
    mesExiste(prevId).then(async (existe) => {
      if (existe) {
        setMesOrigemId(prevId)
        setCopiarModalOpen(true)
      } else {
        await criarMes(mesAtivo, 0)
      }
    })
  }, [mesAtivo, mesInfo, isMonthLoading])

  // Clean up orphaned receivable transactions whose receivable was deleted
  useEffect(() => {
    if (!userId || !mesAtivo || transacoes.length === 0) return
    const receivableIds = new Set(recebiveis.map(r => r.id))
    const txPath = `users/${userId}/months/${mesAtivo}/transactions`
    transacoes.forEach(t => {
      if (t.origem?.tipo === 'receivable' && !receivableIds.has(t.origem.id)) {
        deleteDoc(doc(db, txPath, t.id))
      }
    })
  }, [transacoes, recebiveis, userId, mesAtivo])

  async function handleCopiarFixos() {
    await criarMes(mesAtivo, 0)
    await copiarFixos(mesOrigemId, mesAtivo)
    setCopiarModalOpen(false)
  }

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

  const FAB_LABELS: Partial<Record<AbaAtiva, string>> = {
    contas: 'Adicionar conta',
    gastos: 'Novo lançamento',
    bancos: 'Novo banco',
    receber: 'Novo a receber',
  }

  function handleFAB() {
    document.dispatchEvent(new CustomEvent(`fab-${abaAtiva}`))
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Header />

      <main
        id="tab-content"
        className="max-w-2xl mx-auto px-5 py-5 pb-40 flex flex-col gap-4"
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
                totalSaldo={totalSaldo}
                totalGastos={totalGastos}
                totalEntradas={totalEntradas}
                totalPendente={totalPendente}
                gastosPorCategoria={gastosPorCategoria}
                gastosPorDia={gastosPorDia}
                onEditReceita={() => setReceitaModalOpen(true)}
              />
            )}
            {abaAtiva === 'contas' && (
              <ContasTab
                contas={contas}
                bancos={bancos}
                onTogglePagoComBanco={togglePagoComBanco}
                onDesfazerPagamento={desfazerPagamento}
                onDelete={deleteConta}
                onAdd={addConta}
                onUpdate={updateConta}
                onNavigateToBancos={() => setAbaAtiva('bancos')}
              />
            )}
            {abaAtiva === 'gastos' && (
              <GastosTab
                transacoes={transacoes}
                bancos={bancos}
                onAdd={addTransacao}
                onUpdate={updateTransacao}
                onDelete={deleteTransacao}
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
          </motion.div>
        </AnimatePresence>

        {abaAtiva === 'home' && contas.length > 0 && (
          <div className="flex justify-center py-2">
            <button
              onClick={exportarPDF}
              className="flex items-center gap-1.5 text-[12px] transition-colors"
              style={{ color: 'rgba(255,255,255,0.18)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
            >
              <FileDown className="w-3.5 h-3.5" />
              Exportar PDF
            </button>
          </div>
        )}
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
      <CopiarFixosModal
        open={copiarModalOpen}
        mesOrigemId={mesOrigemId}
        mesDestinoId={mesAtivo}
        onCopiar={handleCopiarFixos}
        onPular={async () => {
          await criarMes(mesAtivo, 0)
          setCopiarModalOpen(false)
        }}
      />
    </div>
  )
}
