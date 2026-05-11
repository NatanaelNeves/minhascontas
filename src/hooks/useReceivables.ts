import { useEffect, useState, useMemo } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
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
    recebido: d.recebido ?? false,
    dataPrevista: d.dataPrevista ?? null,
    recorrente: d.recorrente ?? false,
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
  marcarRecebido: (id: string, bancoId: string, data: string) => Promise<void>
  desmarcarRecebido: (id: string) => Promise<void>
}

export function useReceivables(userId: string, mesId: string): UseReceivablesReturn {
  const [globalRecebiveis, setGlobalRecebiveis] = useState<AReceber[]>([])
  const [monthlyRecebiveis, setMonthlyRecebiveis] = useState<AReceber[]>([])
  const [globalStatus, setGlobalStatus] = useState<Map<string, boolean>>(new Map())
  const [isLoading, setIsLoading] = useState(true)

  const globalRecPath = `users/${userId}/receivables`
  const recPath = `users/${userId}/months/${mesId}/receivables`
  const globalStatusPath = `users/${userId}/months/${mesId}/receivablesStatus`
  const txPath = `users/${userId}/months/${mesId}/transactions`

  useEffect(() => {
    if (!userId) return
    const unsub = onSnapshot(collection(db, globalRecPath), (snap) => {
      setGlobalRecebiveis(snap.docs.map(docToRecebivel))
    })
    return unsub
  }, [userId])

  useEffect(() => {
    if (!userId || !mesId) return
    setIsLoading(true)
    const unsub = onSnapshot(collection(db, recPath), (snap) => {
      setMonthlyRecebiveis(snap.docs.map(docToRecebivel))
      setIsLoading(false)
    })
    return unsub
  }, [userId, mesId])

  useEffect(() => {
    if (!userId || !mesId) return
    const unsub = onSnapshot(collection(db, globalStatusPath), (snap) => {
      const m = new Map<string, boolean>()
      snap.docs.forEach(d => m.set(d.id, d.data().recebido ?? false))
      setGlobalStatus(m)
    })
    return unsub
  }, [userId, mesId])

  const recebiveis = useMemo(() => {
    const global = globalRecebiveis.map(r => ({
      ...r,
      recebido: globalStatus.get(r.id) ?? false,
    }))
    return [...global, ...monthlyRecebiveis]
  }, [globalRecebiveis, globalStatus, monthlyRecebiveis])

  const totalPendente = useMemo(
    () => recebiveis.filter(r => !r.recebido).reduce((s, r) => s + r.valor, 0),
    [recebiveis],
  )

  async function addRecebivel(r: AReceberInput) {
    if (r.recorrente) {
      await addDoc(collection(db, globalRecPath), { ...r, criadoEm: serverTimestamp() })
    } else {
      await addDoc(collection(db, recPath), { ...r, criadoEm: serverTimestamp() })
    }
  }

  async function updateRecebivel(id: string, data: Partial<AReceberInput>) {
    const isGlobal = globalRecebiveis.some(r => r.id === id)
    await updateDoc(doc(db, isGlobal ? globalRecPath : recPath, id), data)
  }

  async function deleteRecebivel(id: string) {
    const isGlobal = globalRecebiveis.some(r => r.id === id)
    const batch = writeBatch(db)
    batch.delete(doc(db, isGlobal ? globalRecPath : recPath, id))
    if (isGlobal) {
      batch.delete(doc(db, globalStatusPath, id))
    }
    batch.delete(doc(db, txPath, `receivable_${id}`))
    await batch.commit()
  }

  async function marcarRecebido(id: string, bancoId: string, data: string) {
    const recebivel = recebiveis.find(r => r.id === id)
    if (!recebivel) return
    const isGlobal = globalRecebiveis.some(r => r.id === id)
    const batch = writeBatch(db)
    if (isGlobal) {
      batch.set(doc(db, globalStatusPath, id), { recebido: true })
    } else {
      batch.update(doc(db, recPath, id), { recebido: true })
    }
    batch.set(doc(db, txPath, `receivable_${id}`), {
      tipo: 'entrada',
      bancoId,
      valor: recebivel.valor,
      descricao: recebivel.nome,
      data,
      despesaFixa: false,
      origem: { tipo: 'receivable', id },
      criadoEm: serverTimestamp(),
    })
    await batch.commit()
  }

  async function desmarcarRecebido(id: string) {
    const isGlobal = globalRecebiveis.some(r => r.id === id)
    const batch = writeBatch(db)
    if (isGlobal) {
      batch.delete(doc(db, globalStatusPath, id))
    } else {
      batch.update(doc(db, recPath, id), { recebido: false })
    }
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
