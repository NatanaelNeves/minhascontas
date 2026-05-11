import { writeBatch, doc, serverTimestamp, deleteField } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useFirestore } from './useFirestore'
import { calcResumo } from '@/lib/utils'
import { Conta, ContaInput, ResumoMes, ContaOrigem } from '@/types'

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
    dataPagamento: string,
    origem?: ContaOrigem,
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
    dataPagamento: string,
    origem?: ContaOrigem,
  ) {
    const batch = writeBatch(db)
    batch.update(doc(db, billPath, id), {
      pago: true,
      pagamento: { data: dataPagamento, bancoId },
    })
    batch.set(doc(db, txPath, `bill_${id}`), {
      tipo: 'gasto',
      categoria: 'despesaFixa',
      bancoId,
      valor: contaData.valor,
      descricao: contaData.nome,
      data: dataPagamento,
      despesaFixa: true,
      origem: { tipo: 'bill', id },
      criadoEm: serverTimestamp(),
    })
    if (origem?.tipo === 'fatura_propagada') {
      batch.set(
        doc(db, `users/${userId}/months/${origem.mesOrigem}/faturas/${origem.cartaoId}`),
        { pago: true, dataPagamento, bancoId },
      )
    }
    await batch.commit()
  }

  async function desfazerPagamento(id: string) {
    const batch = writeBatch(db)
    batch.update(doc(db, billPath, id), { pago: false, pagamento: deleteField() })
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
