import { useEffect, useState, useMemo } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AReceber, AReceberInput } from '@/types'

function docToRecebivel(snap: QueryDocumentSnapshot<DocumentData>): AReceber {
  const d = snap.data()
  return {
    id: snap.id,
    nome: d.nome,
    valor: d.valor,
    recebido: d.recebido,
    dataPrevista: d.dataPrevista ?? null,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
}

export interface UseReceivablesReturn {
  recebiveis: AReceber[]
  totalPendente: number
  isLoading: boolean
  addRecebivel: (r: AReceberInput) => Promise<void>
  updateRecebivel: (id: string, data: Partial<AReceberInput>) => Promise<void>
  deleteRecebivel: (id: string) => Promise<void>
  marcarRecebido: (id: string, bancoId: string) => Promise<void>
  desmarcarRecebido: (id: string) => Promise<void>
}

export function useReceivables(userId: string, mesId: string): UseReceivablesReturn {
  const [recebiveis, setRecebiveis] = useState<AReceber[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const recPath = `users/${userId}/months/${mesId}/receivables`
  const txPath = `users/${userId}/months/${mesId}/transactions`

  useEffect(() => {
    if (!userId || !mesId) return
    setIsLoading(true)
    const unsub = onSnapshot(collection(db, recPath), (snap) => {
      setRecebiveis(snap.docs.map(docToRecebivel))
      setIsLoading(false)
    })
    return unsub
  }, [userId, mesId])

  const totalPendente = useMemo(
    () => recebiveis.filter(r => !r.recebido).reduce((s, r) => s + r.valor, 0),
    [recebiveis],
  )

  async function addRecebivel(r: AReceberInput) {
    await addDoc(collection(db, recPath), { ...r, criadoEm: serverTimestamp() })
  }

  async function updateRecebivel(id: string, data: Partial<AReceberInput>) {
    await updateDoc(doc(db, recPath, id), data)
  }

  async function deleteRecebivel(id: string) {
    const batch = writeBatch(db)
    batch.delete(doc(db, recPath, id))
    batch.delete(doc(db, txPath, `receivable_${id}`))
    await batch.commit()
  }

  async function marcarRecebido(id: string, bancoId: string) {
    const recebivel = recebiveis.find(r => r.id === id)
    if (!recebivel) return
    const hoje = new Date().toISOString().split('T')[0]
    const batch = writeBatch(db)
    batch.update(doc(db, recPath, id), { recebido: true })
    batch.set(doc(db, txPath, `receivable_${id}`), {
      tipo: 'entrada',
      bancoId,
      valor: recebivel.valor,
      descricao: recebivel.nome,
      data: recebivel.dataPrevista ?? hoje,
      despesaFixa: false,
      origem: { tipo: 'receivable', id },
      criadoEm: serverTimestamp(),
    })
    await batch.commit()
  }

  async function desmarcarRecebido(id: string) {
    const batch = writeBatch(db)
    batch.update(doc(db, recPath, id), { recebido: false })
    batch.delete(doc(db, txPath, `receivable_${id}`))
    await batch.commit()
  }

  return {
    recebiveis,
    totalPendente,
    isLoading,
    addRecebivel,
    updateRecebivel,
    deleteRecebivel,
    marcarRecebido,
    desmarcarRecebido,
  }
}
