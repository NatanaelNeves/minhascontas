import { useState } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useBills } from '@/hooks/useBills'
import { useMonth } from '@/hooks/useMonth'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/ui/Header'
import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { BillList } from '@/components/BillList/BillList'
import { BillModal } from '@/components/Modals/BillModal'
import { ReceitaModal } from '@/components/Modals/ReceitaModal'
import { Button } from '@/components/ui/button'
import { Conta, ContaInput } from '@/types'
import { formatBRL } from '@/lib/utils'

export function Dashboard({ userId }: { userId: string }) {
  const { mesAtivo } = useAppStore()
  const { mesInfo, setReceita } = useMonth(userId)
  const { contas, resumo, addConta, updateConta, deleteConta, togglePago } = useBills(
    userId,
    mesAtivo,
    mesInfo?.receita ?? 0,
  )

  const [billModalOpen, setBillModalOpen] = useState(false)
  const [receitaModalOpen, setReceitaModalOpen] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)

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

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 text-sm">
            Receita:{' '}
            <button
              onClick={() => setReceitaModalOpen(true)}
              className="text-white font-medium underline underline-offset-2 hover:text-zinc-300"
            >
              {mesInfo?.receita ? formatBRL(mesInfo.receita) : 'Definir'}
            </button>
          </span>
        </div>

        <ResumoCards resumo={resumo} receita={mesInfo?.receita ?? 0} />

        <BillList
          contas={contas}
          onTogglePago={togglePago}
          onEdit={handleEdit}
          onDelete={deleteConta}
        />
      </main>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-6 right-6"
      >
        <Button
          onClick={handleOpenNew}
          size="icon"
          className="w-14 h-14 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 shadow-xl"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

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
    </div>
  )
}
