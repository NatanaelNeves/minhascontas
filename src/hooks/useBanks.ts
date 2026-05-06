import { useEffect, useState, useMemo } from 'react'
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
import { Banco, BancoInput, BancoComSaldo, Transacao } from '@/types'

function docToBanco(snap: QueryDocumentSnapshot<DocumentData>): Banco {
  const d = snap.data()
  return {
    id: snap.id,
    nome: d.nome,
    saldoInicial: d.saldoInicial,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
}

export interface UseBanksReturn {
  bancos: BancoComSaldo[]
  totalSaldo: number
  isLoading: boolean
  addBanco: (b: BancoInput) => Promise<void>
  updateBanco: (id: string, data: Partial<BancoInput>) => Promise<void>
  deleteBanco: (id: string) => Promise<string | null>
}

export function useBanks(
  userId: string,
  mesId: string,
  transacoes: Transacao[],
): UseBanksReturn {
  const [bancosRaw, setBancosRaw] = useState<Banco[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const path = `users/${userId}/months/${mesId}/banks`

  useEffect(() => {
    if (!userId || !mesId) return
    setIsLoading(true)
    const unsub = onSnapshot(collection(db, path), (snap) => {
      setBancosRaw(snap.docs.map(docToBanco))
      setIsLoading(false)
    })
    return unsub
  }, [userId, mesId])

  const porBanco = useMemo(() => {
    const map: Record<string, Transacao[]> = {}
    transacoes.forEach(t => {
      if (!map[t.bancoId]) map[t.bancoId] = []
      map[t.bancoId].push(t)
    })
    return map
  }, [transacoes])

  const bancos = useMemo<BancoComSaldo[]>(
    () =>
      bancosRaw.map(b => {
        const txs = porBanco[b.id] ?? []
        const gastos = txs
          .filter(t => t.tipo === 'gasto')
          .reduce((s, t) => s + t.valor, 0)
        const entradas = txs
          .filter(t => t.tipo === 'entrada')
          .reduce((s, t) => s + t.valor, 0)
        return { ...b, gastos, entradas, saldoAtual: b.saldoInicial + entradas - gastos }
      }),
    [bancosRaw, porBanco],
  )

  const totalSaldo = useMemo(
    () => bancos.reduce((s, b) => s + b.saldoAtual, 0),
    [bancos],
  )

  async function addBanco(b: BancoInput) {
    await addDoc(collection(db, path), { ...b, criadoEm: serverTimestamp() })
  }

  async function updateBanco(id: string, data: Partial<BancoInput>) {
    await updateDoc(doc(db, path, id), data)
  }

  async function deleteBanco(id: string): Promise<string | null> {
    const linked = transacoes.some(t => t.bancoId === id)
    if (linked) return 'Banco possui lançamentos — remova-os antes de deletar.'
    await deleteDoc(doc(db, path, id))
    return null
  }

  return { bancos, totalSaldo, isLoading, addBanco, updateBanco, deleteBanco }
}
