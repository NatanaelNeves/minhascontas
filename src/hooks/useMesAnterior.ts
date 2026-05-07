import { useEffect, useState } from 'react'
import { getDocs, collection, getDoc, doc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { prevMesId, calcResumo } from '@/lib/utils'
import { Conta } from '@/types'

export interface MesAnteriorData {
  receita: number
  totalGeral: number
  sobra: number
}

export function useMesAnterior(userId: string, mesAtivo: string): MesAnteriorData | null {
  const [data, setData] = useState<MesAnteriorData | null>(null)

  useEffect(() => {
    if (!userId || !mesAtivo) return
    const prevId = prevMesId(mesAtivo)

    async function fetch() {
      const infoDoc = await getDoc(doc(db, `users/${userId}/months/${prevId}`))
      if (!infoDoc.exists()) { setData(null); return }
      const receita: number = infoDoc.data()?.receita ?? 0

      const billsSnap = await getDocs(collection(db, `users/${userId}/months/${prevId}/bills`))
      const contas: Conta[] = billsSnap.docs.map(d => {
        const raw = d.data()
        return {
          id: d.id,
          nome: raw.nome,
          valor: raw.valor,
          categoria: raw.categoria,
          formaPagamento: raw.formaPagamento,
          vencimento: raw.vencimento ?? null,
          pago: raw.pago,
          parcelas: raw.parcelas ?? null,
          criadoEm: raw.criadoEm?.toDate() ?? new Date(),
        }
      })

      const resumo = calcResumo(contas, receita)
      setData({ receita, totalGeral: resumo.totalGeral, sobra: resumo.sobra })
    }

    fetch()
  }, [userId, mesAtivo])

  return data
}
