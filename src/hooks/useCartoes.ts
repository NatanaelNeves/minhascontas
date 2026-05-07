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
import { Cartao, CartaoInput } from '@/types'

function docToCartao(snap: QueryDocumentSnapshot<DocumentData>): Cartao {
  const d = snap.data()
  return {
    id: snap.id,
    nome: d.nome,
    tipo: d.tipo,
    limite: d.limite,
    diaFechamento: d.diaFechamento,
    diaVencimento: d.diaVencimento,
    cor: d.cor,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
}

export interface UseCartoesReturn {
  cartoes: Cartao[]
  isLoading: boolean
  addCartao: (c: CartaoInput) => Promise<void>
  updateCartao: (id: string, data: Partial<CartaoInput>) => Promise<void>
  deleteCartao: (id: string) => Promise<void>
}

export function useCartoes(userId: string): UseCartoesReturn {
  const [cartoes, setCartoes] = useState<Cartao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const path = `users/${userId}/cartoes`

  useEffect(() => {
    if (!userId) return
    setIsLoading(true)
    const unsub = onSnapshot(collection(db, path), snap => {
      setCartoes(snap.docs.map(docToCartao))
      setIsLoading(false)
    })
    return unsub
  }, [userId])

  async function addCartao(c: CartaoInput) {
    await addDoc(collection(db, path), { ...c, criadoEm: serverTimestamp() })
  }

  async function updateCartao(id: string, data: Partial<CartaoInput>) {
    await updateDoc(doc(db, path, id), data)
  }

  async function deleteCartao(id: string) {
    await deleteDoc(doc(db, path, id))
  }

  return { cartoes, isLoading, addCartao, updateCartao, deleteCartao }
}
