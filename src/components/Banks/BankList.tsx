import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BancoComSaldo, BancoInput, Banco } from '@/types'
import { formatBRL } from '@/lib/utils'
import { BankCard } from './BankCard'
import { BankModal } from './BankModal'

interface Props {
  bancos: BancoComSaldo[]
  onAdd: (data: BancoInput) => void
  onUpdate: (id: string, data: Partial<BancoInput>) => void
  onDelete: (id: string) => Promise<string | null>
}

export function BankList({ bancos, onAdd, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Banco | null>(null)
  const [erroDelete, setErroDelete] = useState<string | null>(null)

  useEffect(() => {
    function openAdd() { setEditando(null); setModalOpen(true) }
    document.addEventListener('fab-bancos', openAdd)
    return () => document.removeEventListener('fab-bancos', openAdd)
  }, [])

  function handleEdit(banco: BancoComSaldo) {
    setEditando(banco)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    const erro = await onDelete(id)
    if (erro) setErroDelete(erro)
  }

  function handleSave(data: BancoInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  const corrente = bancos.filter(b => b.tipo === 'corrente')
  const investimento = bancos.filter(b => b.tipo === 'investimento')
  const totalCorrente = corrente.reduce((s, b) => s + b.saldoAtual, 0)
  const totalInvestido = investimento.reduce((s, b) => s + b.saldoAtual, 0)

  return (
    <div className="flex flex-col gap-4">
      {erroDelete && (
        <div
          className="rounded-lg px-4 py-3 text-sm"
          style={{ background: 'var(--red-muted)', color: 'var(--red)' }}
        >
          {erroDelete}
          <button className="ml-2 underline" onClick={() => setErroDelete(null)}>fechar</button>
        </div>
      )}

      {/* Totais header */}
      {bancos.length > 0 && (
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--border)',
          borderRadius: 12, padding: '12px 16px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
        }}>
          <div>
            <p style={{ fontSize: 10, color: 'var(--text-tertiary)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>
              Disponível em contas
            </p>
            <p style={{ fontSize: 17, fontWeight: 700, color: totalCorrente >= 0 ? 'var(--text-primary)' : 'var(--red)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
              {formatBRL(totalCorrente)}
            </p>
          </div>
          {investimento.length > 0 && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: 'var(--purple)', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2, opacity: 0.8 }}>
                Total investido
              </p>
              <p style={{ fontSize: 17, fontWeight: 700, color: 'var(--purple)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(totalInvestido)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {bancos.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: 'var(--bg-elevated)' }}>
            🏦
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Nenhum banco cadastrado</p>
          <button
            onClick={() => { setEditando(null); setModalOpen(true) }}
            style={{
              padding: '10px 20px', borderRadius: 99, fontSize: 13, fontWeight: 600,
              background: 'var(--text-primary)', color: 'var(--bg-base)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '-0.01em',
            }}
          >
            ＋ Adicionar primeiro banco
          </button>
        </div>
      )}

      {/* Contas correntes */}
      {corrente.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
            Contas
          </p>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {corrente.map(b => (
              <BankCard key={b.id} banco={b} onEdit={handleEdit} onDelete={handleDelete} onUpdate={onUpdate} />
            ))}
          </motion.div>
        </div>
      )}

      {/* Investimentos */}
      {investimento.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--purple)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10, opacity: 0.8 }}>
            Investimentos
          </p>
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
          >
            {investimento.map(b => (
              <BankCard key={b.id} banco={b} onEdit={handleEdit} onDelete={handleDelete} onUpdate={onUpdate} />
            ))}
          </motion.div>
        </div>
      )}

      <BankModal
        open={modalOpen}
        editando={editando}
        onSave={handleSave}
        onClose={() => {
          setModalOpen(false)
          setEditando(null)
        }}
      />
    </div>
  )
}
