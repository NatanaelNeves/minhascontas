import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
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

    if (conta.categoria === 'fixo') {
      const monthsSnap = await getDocs(collection(db, `users/${userId}/months`))
      const futureMeses = monthsSnap.docs
        .map(d => d.id)
        .filter(id => id > mesId)
        .sort()

      for (let i = 0; i < futureMeses.length; i++) {
        const offset = i + 1
        if (conta.parcelas && conta.parcelas.atual + offset > conta.parcelas.total) continue
        const novaParcelas = conta.parcelas
          ? { atual: conta.parcelas.atual + offset, total: conta.parcelas.total }
          : null
        await addDoc(collection(db, `users/${userId}/months/${futureMeses[i]}/bills`), {
          nome: conta.nome,
          valor: conta.valor,
          categoria: conta.categoria,
          formaPagamento: conta.formaPagamento,
          vencimento: conta.vencimento ?? null,
          parcelas: novaParcelas,
          pago: false,
          criadoEm: serverTimestamp(),
        })
      }
    }
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
