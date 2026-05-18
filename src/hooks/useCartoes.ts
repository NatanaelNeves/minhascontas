import { useEffect, useState, useRef } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  deleteField,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Cartao, CartaoInput, CartaoCredito, CartaoBeneficio } from '@/types'
import { isTipoBeneficio } from '@/lib/cartoes'

function docToCartao(snap: QueryDocumentSnapshot<DocumentData>): Cartao {
  const d = snap.data()
  const tipo = d.tipo as Cartao['tipo']

  if (isTipoBeneficio(tipo)) {
    return {
      id: snap.id,
      nome: d.nome,
      tipo,
      saldoAtual: typeof d.saldoAtual === 'number' ? d.saldoAtual : (typeof d.limite === 'number' ? d.limite : 0),
      operadora: d.operadora ?? undefined,
      recargaMensal: typeof d.recargaMensal === 'number' ? d.recargaMensal : undefined,
      diaRecarga: typeof d.diaRecarga === 'number' ? d.diaRecarga : null,
      cor: d.cor,
      criadoEm: d.criadoEm?.toDate() ?? new Date(),
    } satisfies CartaoBeneficio
  }

  return {
    id: snap.id,
    nome: d.nome,
    tipo: 'credito',
    limite: typeof d.limite === 'number' ? d.limite : 0,
    diaFechamento: typeof d.diaFechamento === 'number' ? d.diaFechamento : 1,
    diaVencimento: typeof d.diaVencimento === 'number' ? d.diaVencimento : 10,
    gastoAtual: typeof d.gastoAtual === 'number' ? d.gastoAtual : undefined,
    cor: d.cor,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  } satisfies CartaoCredito
}

function serializeCartaoInput(c: CartaoInput) {
  if (c.tipo === 'credito') {
    return {
      nome: c.nome,
      tipo: c.tipo,
      limite: c.limite,
      diaFechamento: c.diaFechamento,
      diaVencimento: c.diaVencimento,
      cor: c.cor,
      ...(typeof c.gastoAtual === 'number' && c.gastoAtual > 0 ? { gastoAtual: c.gastoAtual } : {}),
    }
  }

  return {
    nome: c.nome,
    tipo: c.tipo,
    saldoAtual: c.saldoAtual,
    cor: c.cor,
    ...(c.operadora ? { operadora: c.operadora } : {}),
    ...(typeof c.recargaMensal === 'number' ? { recargaMensal: c.recargaMensal } : {}),
    ...(typeof c.diaRecarga === 'number' || c.diaRecarga === null ? { diaRecarga: c.diaRecarga } : {}),
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
  const migrationRan = useRef(false)

  const path = `users/${userId}/cartoes`

  // One-time migration: benefit cards may have 'limite' instead of 'saldoAtual'
  useEffect(() => {
    if (!userId || migrationRan.current) return
    migrationRan.current = true
    async function runMigration() {
      const snap = await getDocs(collection(db, path))
      for (const docSnap of snap.docs) {
        const data = docSnap.data()
        if (isTipoBeneficio(data.tipo) && typeof data.saldoAtual !== 'number') {
          const saldoAtual = typeof data.limite === 'number' ? data.limite : 0
          await updateDoc(doc(db, path, docSnap.id), {
            saldoAtual,
            limite: deleteField(),
            diaFechamento: deleteField(),
            diaVencimento: deleteField(),
          })
        }
      }
    }
    runMigration()
  }, [userId])

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
    await addDoc(collection(db, path), { ...serializeCartaoInput(c), criadoEm: serverTimestamp() })
  }

  async function updateCartao(id: string, data: Partial<CartaoInput>) {
    await updateDoc(doc(db, path, id), data.tipo === 'credito'
      ? {
          ...data,
          limite: data.limite,
          diaFechamento: data.diaFechamento,
          diaVencimento: data.diaVencimento,
          gastoAtual: typeof data.gastoAtual === 'number' && data.gastoAtual > 0 ? data.gastoAtual : deleteField(),
          saldoAtual: deleteField(),
          operadora: deleteField(),
          recargaMensal: deleteField(),
          diaRecarga: deleteField(),
        }
      : data.tipo
        ? {
            ...data,
            saldoAtual: data.saldoAtual,
            operadora: data.operadora ?? null,
            recargaMensal: data.recargaMensal ?? null,
            diaRecarga: data.diaRecarga ?? null,
            limite: deleteField(),
            diaFechamento: deleteField(),
            diaVencimento: deleteField(),
          }
        : data)
  }

  async function deleteCartao(id: string) {
    await deleteDoc(doc(db, path, id))
  }

  return { cartoes, isLoading, addCartao, updateCartao, deleteCartao }
}
