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
}

export function useBills(
  userId: string,
  mesId: string,
  receita: number
): UseBillsReturn {
  const { contas, isLoading, addConta, updateConta, deleteConta } =
    useFirestore(userId, mesId)

  const resumo = calcResumo(contas, receita)

  async function togglePago(id: string, pago: boolean) {
    await updateConta(id, { pago })
  }

  return { contas, resumo, isLoading, addConta, updateConta, deleteConta, togglePago }
}
