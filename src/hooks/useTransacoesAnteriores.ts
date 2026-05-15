import { useEffect, useState } from 'react'
import {
  collection,
  getDocs,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Transacao } from '@/types'

function docToTransacao(snap: QueryDocumentSnapshot<DocumentData>): Transacao {
  const d = snap.data()
  const base = {
    id: snap.id,
    data: d.data,
    descricao: d.descricao,
    bancoId: d.bancoId,
    valor: d.valor,
    despesaFixa: d.despesaFixa ?? false,
    observacao: d.observacao,
    cartaoId: d.cartaoId ?? undefined,
    formaPagamento: d.formaPagamento ?? undefined,
    origem: d.origem,
    recorrenteId: d.recorrenteId ?? undefined,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
  if (d.tipo === 'gasto') {
    return { ...base, tipo: 'gasto', categoria: d.categoria }
  }
  return { ...base, tipo: 'entrada' }
}

export function useTransacoesAnteriores(userId: string, mesId: string) {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])

  useEffect(() => {
    if (!userId || !mesId) return
    let active = true

    async function fetch() {
      const mesesSnap = await getDocs(collection(db, `users/${userId}/months`))
      const mesesAnteriores = mesesSnap.docs
        .map(d => d.id)
        .filter(id => id < mesId)

      const all: Transacao[] = []
      for (const id of mesesAnteriores) {
        const txSnap = await getDocs(collection(db, `users/${userId}/months/${id}/transactions`))
        all.push(...txSnap.docs.map(docToTransacao))
      }

      if (active) setTransacoes(all)
    }

    fetch()
    return () => { active = false }
  }, [userId, mesId])

  return { transacoes }
}
