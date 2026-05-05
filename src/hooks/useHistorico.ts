import { useState, useEffect } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { calcResumo } from '@/lib/utils'
import { Conta } from '@/types'

export interface MesResumo {
  id: string
  receita: number
  totalGeral: number
  totalPago: number
  totalPendente: number
  sobra: number
  qtdContas: number
}

function docToConta(id: string, data: Record<string, unknown>): Conta {
  return {
    id,
    nome: data.nome as string,
    valor: data.valor as number,
    categoria: data.categoria as Conta['categoria'],
    formaPagamento: data.formaPagamento as Conta['formaPagamento'],
    vencimento: (data.vencimento as string) ?? null,
    pago: data.pago as boolean,
    parcelas: (data.parcelas as Conta['parcelas']) ?? null,
    criadoEm: (data.criadoEm as { toDate?: () => Date } | null)?.toDate?.() ?? new Date(),
  }
}

export function useHistorico(userId: string) {
  const [meses, setMeses] = useState<MesResumo[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId) return
    setIsLoading(true)

    async function fetch() {
      const mesesCol = collection(db, `users/${userId}/months`)
      const mesesSnap = await getDocs(mesesCol)

      const results: MesResumo[] = []

      for (const mesDoc of mesesSnap.docs) {
        const mesData = mesDoc.data()
        const receita: number = mesData.receita ?? 0

        const billsCol = collection(db, `users/${userId}/months/${mesDoc.id}/bills`)
        const billsSnap = await getDocs(billsCol)
        const contas = billsSnap.docs.map(d => docToConta(d.id, d.data()))

        const resumo = calcResumo(contas, receita)

        results.push({
          id: mesDoc.id,
          receita,
          totalGeral: resumo.totalGeral,
          totalPago: resumo.totalPago,
          totalPendente: resumo.totalPendente,
          sobra: resumo.sobra,
          qtdContas: contas.length,
        })
      }

      results.sort((a, b) => b.id.localeCompare(a.id))
      setMeses(results)
      setIsLoading(false)
    }

    fetch()
  }, [userId])

  return { meses, isLoading }
}
