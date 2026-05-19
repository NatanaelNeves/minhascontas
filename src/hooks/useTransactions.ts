import { useEffect, useState, useMemo } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Transacao, TransacaoInput, TIPOS_BENEFICIO, TipoBeneficio } from '@/types'

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

export interface UseTransactionsReturn {
  transacoes: Transacao[]
  totalGastos: number
  totalGastosVariaveis: number
  totalGastosBeneficios: number
  totalEntradas: number
  gastosPorCategoria: Record<string, number>
  gastosPorDia: { data: string; total: number }[]
  isLoading: boolean
  addTransacao: (t: TransacaoInput) => Promise<void>
  updateTransacao: (id: string, data: Partial<TransacaoInput>) => Promise<void>
  deleteTransacao: (id: string) => Promise<void>
}

export function useTransactions(userId: string, mesId: string): UseTransactionsReturn {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const path = `users/${userId}/months/${mesId}/transactions`

  useEffect(() => {
    if (!userId || !mesId) return
    setIsLoading(true)
    const q = query(collection(db, path), orderBy('data', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setTransacoes(snap.docs.map(docToTransacao))
      setIsLoading(false)
    })
    return unsub
  }, [userId, mesId])

  const totalGastos = useMemo(
    () => transacoes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.valor, 0),
    [transacoes],
  )

  const totalGastosVariaveis = useMemo(
    () => transacoes
      .filter(t =>
        t.tipo === 'gasto' &&
        t.origem?.tipo !== 'pagamento_fatura' &&
        t.origem?.tipo !== 'bill' &&
        (t.formaPagamento == null || !TIPOS_BENEFICIO.includes(t.formaPagamento as TipoBeneficio))
      )
      .reduce((s, t) => s + t.valor, 0),
    [transacoes],
  )

  const totalGastosBeneficios = useMemo(
    () => transacoes
      .filter(t =>
        t.tipo === 'gasto' &&
        t.formaPagamento != null &&
        TIPOS_BENEFICIO.includes(t.formaPagamento as TipoBeneficio)
      )
      .reduce((s, t) => s + t.valor, 0),
    [transacoes],
  )

  const totalEntradas = useMemo(
    () => transacoes.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0),
    [transacoes],
  )

  const gastosPorCategoria = useMemo(() => {
    const acc = {} as Record<string, number>
    transacoes.forEach(t => {
      if (t.tipo === 'gasto') {
        acc[t.categoria] = (acc[t.categoria] ?? 0) + t.valor
      }
    })
    return acc
  }, [transacoes])

  const gastosPorDia = useMemo(() => {
    const map = new Map<string, number>()
    transacoes.forEach(t => {
      if (t.tipo === 'gasto') {
        map.set(t.data, (map.get(t.data) ?? 0) + t.valor)
      }
    })
    return Array.from(map.entries())
      .map(([data, total]) => ({ data, total }))
      .sort((a, b) => a.data.localeCompare(b.data))
  }, [transacoes])

  async function addTransacao(t: TransacaoInput) {
    await addDoc(collection(db, path), { ...t, criadoEm: serverTimestamp() })
  }

  async function updateTransacao(id: string, data: Partial<TransacaoInput>) {
    await updateDoc(doc(db, path, id), data)
  }

  async function deleteTransacao(id: string) {
    await deleteDoc(doc(db, path, id))
  }

  return {
    transacoes,
    totalGastos,
    totalGastosVariaveis,
    totalGastosBeneficios,
    totalEntradas,
    gastosPorCategoria,
    gastosPorDia,
    isLoading,
    addTransacao,
    updateTransacao,
    deleteTransacao,
  }
}
