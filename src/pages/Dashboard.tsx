import { useState, useEffect, useRef } from 'react'
import { FileDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBills } from '@/hooks/useBills'
import { useMonth } from '@/hooks/useMonth'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/ui/Header'
import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { BillList } from '@/components/BillList/BillList'
import { BillModal } from '@/components/Modals/BillModal'
import { ReceitaModal } from '@/components/Modals/ReceitaModal'
import { CopiarFixosModal } from '@/components/Modals/CopiarFixosModal'
import { ChartsPizza } from '@/components/Charts/ChartsPizza'
import { Conta, ContaInput } from '@/types'
import { prevMesId } from '@/lib/utils'

export function Dashboard({ userId }: { userId: string }) {
  const { mesAtivo } = useAppStore()
  const {
    mesInfo,
    isLoading: isMonthLoading,
    setReceita,
    criarMes,
    copiarFixos,
    mesExiste,
  } = useMonth(userId)
  const { contas, resumo, addConta, updateConta, deleteConta, togglePago } = useBills(
    userId,
    mesAtivo,
    mesInfo?.receita ?? 0,
  )

  const [billModalOpen, setBillModalOpen] = useState(false)
  const [receitaModalOpen, setReceitaModalOpen] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)
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

  async function handleCopiarFixos() {
    await criarMes(mesAtivo, 0)
    await copiarFixos(mesOrigemId, mesAtivo)
    setCopiarModalOpen(false)
  }

  async function handlePularCopia() {
    await criarMes(mesAtivo, 0)
    setCopiarModalOpen(false)
  }

  function handleSaveBill(data: ContaInput) {
    if (editando) {
      updateConta(editando.id, data)
    } else {
      addConta(data)
    }
    setEditando(null)
  }

  function handleEdit(conta: Conta) {
    setEditando(conta)
    setBillModalOpen(true)
  }

  function handleOpenNew() {
    setEditando(null)
    setBillModalOpen(true)
  }

  async function exportarPDF() {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf'),
    ])
    const el = document.getElementById('dashboard-content')
    if (!el) return
    const canvas = await html2canvas(el, { backgroundColor: '#09090b', scale: 2 })
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save(`minhascontas-${mesAtivo}.pdf`)
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <Header />

      <main
        id="dashboard-content"
        className="max-w-2xl mx-auto px-5 py-5 pb-28 flex flex-col gap-4"
      >
        <ResumoCards
          resumo={resumo}
          receita={mesInfo?.receita ?? 0}
          semContas={contas.length === 0}
          onEditReceita={() => setReceitaModalOpen(true)}
        />

        <BillList
          contas={contas}
          onTogglePago={togglePago}
          onEdit={handleEdit}
          onDelete={deleteConta}
          onAdd={handleOpenNew}
        />

        {contas.length > 0 && <ChartsPizza contas={contas} />}

        {contas.length > 0 && (
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

      {/* FAB — pill centered, with fade gradient */}
      <div
        className="fixed bottom-0 inset-x-0 flex justify-center items-end pb-5 pt-16 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, #09090b 55%, transparent)',
          zIndex: 10,
        }}
      >
        <motion.button
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 280, damping: 22 }}
          onClick={handleOpenNew}
          className="pointer-events-auto flex items-center gap-2 rounded-full text-[13px] font-semibold"
          style={{
            background: '#ffffff',
            color: '#09090b',
            padding: '12px 26px',
            letterSpacing: '-0.02em',
            boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span
            style={{
              fontSize: 20,
              fontWeight: 200,
              lineHeight: 1,
              marginTop: -1,
            }}
          >
            +
          </span>
          Adicionar conta
        </motion.button>
      </div>

      <BillModal
        open={billModalOpen}
        onClose={() => { setBillModalOpen(false); setEditando(null) }}
        onSave={handleSaveBill}
        editando={editando}
      />
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
        onPular={handlePularCopia}
      />
    </div>
  )
}
