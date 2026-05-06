import { writeBatch, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useFirestore } from './useFirestore'
import { calcResumo } from '@/lib/utils'
import { Conta, ContaInput, ResumoMes } from '@/types'

interface UseBillsReturn {
  contas: Conta[]
  resumo: ResumoMes
  isLoading: boolean
  addConta: (conta: ContaInput) => Promise<void>
  updateConta: (id: string, data: Partial<ContaInput>) => Promise<void>
  deleteConta: (id: string) => Promise<void>
  togglePago: (id: string, pago: boolean) => Promise<void>
  togglePagoComBanco: (
    id: string,
    bancoId: string,
    contaData: { nome: string; valor: number; vencimento: string | null },
  ) => Promise<void>
  desfazerPagamento: (id: string) => Promise<void>
}

export function useBills(
  userId: string,
  mesId: string,
  receita: number,
): UseBillsReturn {
  const { contas, isLoading, addConta, updateConta, deleteConta } =
    useFirestore(userId, mesId)

  const resumo = calcResumo(contas, receita)

  const billPath = `users/${userId}/months/${mesId}/bills`
  const txPath = `users/${userId}/months/${mesId}/transactions`

  async function togglePago(id: string, pago: boolean) {
    await updateConta(id, { pago })
  }

  async function togglePagoComBanco(
    id: string,
    bancoId: string,
    contaData: { nome: string; valor: number; vencimento: string | null },
  ) {
    const hoje = new Date().toISOString().split('T')[0]
    const batch = writeBatch(db)
    batch.update(doc(db, billPath, id), { pago: true })
    batch.set(doc(db, txPath, `bill_${id}`), {
      tipo: 'gasto',
      categoria: 'despesaFixa',
      bancoId,
      valor: contaData.valor,
      descricao: contaData.nome,
      data: contaData.vencimento ?? hoje,
      despesaFixa: true,
      origem: { tipo: 'bill', id },
      criadoEm: serverTimestamp(),
    })
    await batch.commit()
  }

  async function desfazerPagamento(id: string) {
    const batch = writeBatch(db)
    batch.update(doc(db, billPath, id), { pago: false })
    batch.delete(doc(db, txPath, `bill_${id}`))
    await batch.commit()
  }

  return {
    contas,
    resumo,
    isLoading,
    addConta,
    updateConta,
    deleteConta,
    togglePago,
    togglePagoComBanco,
    desfazerPagamento,
  }
}
