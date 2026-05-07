import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  writeBatch,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FaturaCartao, Cartao } from '@/types'

function docToFatura(snap: QueryDocumentSnapshot<DocumentData>): FaturaCartao {
  const d = snap.data()
  return {
    id: snap.id,
    cartaoId: d.cartaoId,
    mesReferencia: d.mesReferencia,
    mesVencimento: d.mesVencimento,
    total: d.total,
    pago: d.pago ?? false,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
}

export interface UseFaturasReturn {
  faturas: FaturaCartao[]
  isLoading: boolean
  criarFatura: (cartaoId: string, mesReferencia: string, mesVencimento: string, total: number) => Promise<void>
  marcarFaturaPaga: (faturaId: string, bancoId: string) => Promise<void>
  desmarcarFaturaPaga: (faturaId: string) => Promise<void>
}

export function useFaturas(
  userId: string,
  mesId: string,
  cartoes: Cartao[],
): UseFaturasReturn {
  const [faturas, setFaturas] = useState<FaturaCartao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const faturasPath = `users/${userId}/months/${mesId}/faturas`
  const txPath = `users/${userId}/months/${mesId}/transactions`

  useEffect(() => {
    if (!userId || !mesId) return
    setIsLoading(true)
    const unsub = onSnapshot(collection(db, faturasPath), snap => {
      setFaturas(snap.docs.map(docToFatura))
      setIsLoading(false)
    })
    return unsub
  }, [userId, mesId])

  async function criarFatura(
    cartaoId: string,
    mesReferencia: string,
    mesVencimento: string,
    total: number,
  ) {
    await setDoc(doc(db, faturasPath, cartaoId), {
      cartaoId,
      mesReferencia,
      mesVencimento,
      total,
      pago: false,
      criadoEm: serverTimestamp(),
    })
  }

  async function marcarFaturaPaga(faturaId: string, bancoId: string) {
    const fatura = faturas.find(f => f.id === faturaId)
    if (!fatura) return
    const cartao = cartoes.find(c => c.id === fatura.cartaoId)
    const hoje = new Date().toISOString().split('T')[0]
    const txId = `fatura_${faturaId}`
    const batch = writeBatch(db)
    batch.set(doc(db, txPath, txId), {
      tipo: 'gasto',
      categoria: 'despesaFixa',
      bancoId,
      valor: fatura.total,
      descricao: `Fatura ${cartao?.nome ?? 'Cartão'} ${fatura.mesReferencia}`,
      data: hoje,
      despesaFixa: false,
      criadoEm: serverTimestamp(),
    })
    batch.update(doc(db, faturasPath, faturaId), { pago: true })
    await batch.commit()
  }

  async function desmarcarFaturaPaga(faturaId: string) {
    const txId = `fatura_${faturaId}`
    const batch = writeBatch(db)
    batch.delete(doc(db, txPath, txId))
    batch.update(doc(db, faturasPath, faturaId), { pago: false })
    await batch.commit()
  }

  return { faturas, isLoading, criarFatura, marcarFaturaPaga, desmarcarFaturaPaga }
}
