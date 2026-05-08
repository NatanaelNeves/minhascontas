import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Conta, ContaInput } from '@/types'

function docToConta(snapshot: QueryDocumentSnapshot<DocumentData>): Conta {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    nome: data.nome,
    valor: data.valor,
    categoria: data.categoria,
    formaPagamento: data.formaPagamento,
    vencimento: data.vencimento ?? null,
    pago: data.pago,
    parcelas: data.parcelas ?? null,
    parcelamentoId: data.parcelamentoId ?? undefined,
    cartaoId: data.cartaoId ?? undefined,
    pagamento: data.pagamento ?? undefined,
    recorrente: data.recorrente ?? undefined,
    criadoEm: data.criadoEm?.toDate() ?? new Date(),
  }
}

interface UseFirestoreReturn {
  contas: Conta[]
  isLoading: boolean
  addConta: (conta: ContaInput) => Promise<void>
  updateConta: (id: string, data: Partial<ContaInput>) => Promise<void>
  deleteConta: (id: string) => Promise<void>
}

export function useFirestore(userId: string, mesId: string): UseFirestoreReturn {
  const [contas, setContas] = useState<Conta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId || !mesId) return

    setIsLoading(true)
    const billsPath = `users/${userId}/months/${mesId}/bills`
    const colRef = collection(db, billsPath)

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(docToConta)
      data.sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())
      setContas(data)
      setIsLoading(false)
    })

    return unsubscribe
  }, [userId, mesId])

  async function addConta(conta: ContaInput) {
    const billsPath = `users/${userId}/months/${mesId}/bills`
    const colRef = collection(db, billsPath)
    await addDoc(colRef, { ...conta, criadoEm: serverTimestamp() })
  }

  async function updateConta(id: string, data: Partial<ContaInput>) {
    const billsPath = `users/${userId}/months/${mesId}/bills`
    await updateDoc(doc(db, billsPath, id), data)
  }

  async function deleteConta(id: string) {
    const billsPath = `users/${userId}/months/${mesId}/bills`
    await deleteDoc(doc(db, billsPath, id))
  }

  return { contas, isLoading, addConta, updateConta, deleteConta }
}
