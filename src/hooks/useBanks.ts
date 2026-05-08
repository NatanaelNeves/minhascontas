import { useEffect, useState, useMemo } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc,
  getDocs,
  setDoc,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Banco, BancoInput, BancoComSaldo, TipoBanco, Transacao } from '@/types'

function docToBanco(snap: QueryDocumentSnapshot<DocumentData>): Banco {
  const d = snap.data()
  return {
    id: snap.id,
    nome: d.nome,
    tipo: (d.tipo as TipoBanco) ?? 'corrente',
    saldoInicial: d.saldoInicial,
    cor: d.cor ?? undefined,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
}

export interface UseBanksReturn {
  bancos: BancoComSaldo[]
  totalSaldo: number
  totalInvestido: number
  bancosPorTipo: { corrente: BancoComSaldo[]; investimento: BancoComSaldo[] }
  isLoading: boolean
  addBanco: (b: BancoInput) => Promise<void>
  updateBanco: (id: string, data: Partial<BancoInput>) => Promise<void>
  deleteBanco: (id: string) => Promise<string | null>
}

export function useBanks(
  userId: string,
  transacoes: Transacao[],
): UseBanksReturn {
  const [bancosRaw, setBancosRaw] = useState<Banco[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const path = `users/${userId}/banks`

  useEffect(() => {
    if (!userId) return
    setIsLoading(true)
    const unsub = onSnapshot(collection(db, path), (snap) => {
      setBancosRaw(snap.docs.map(docToBanco))
      setIsLoading(false)
    })
    return unsub
  }, [userId])

  // One-time migration: move per-month banks to global
  useEffect(() => {
    if (!userId) return
    const userRef = doc(db, `users/${userId}`)
    getDoc(userRef).then(async (snap) => {
      if (snap.exists() && snap.data()?.bancosMigrado) return
      const monthsSnap = await getDocs(collection(db, `users/${userId}/months`))
      const bancosByName = new Map<string, Omit<Banco, 'id' | 'criadoEm'>>()
      for (const monthDoc of monthsSnap.docs) {
        const banksSnap = await getDocs(
          collection(db, `users/${userId}/months/${monthDoc.id}/banks`)
        )
        for (const bankDoc of banksSnap.docs) {
          const d = bankDoc.data()
          if (!bancosByName.has(d.nome)) {
            bancosByName.set(d.nome, { nome: d.nome, tipo: 'corrente', saldoInicial: d.saldoInicial, cor: d.cor })
          }
        }
      }
      const existingSnap = await getDocs(collection(db, path))
      if (existingSnap.empty && bancosByName.size > 0) {
        for (const [, banco] of bancosByName) {
          await addDoc(collection(db, path), { ...banco, criadoEm: serverTimestamp() })
        }
      }
      await setDoc(userRef, { bancosMigrado: true }, { merge: true })
    })
  }, [userId])

  const porBanco = useMemo(() => {
    const map: Record<string, Transacao[]> = {}
    transacoes.forEach(t => {
      if (!t.bancoId) return
      if (!map[t.bancoId]) map[t.bancoId] = []
      map[t.bancoId].push(t)
    })
    return map
  }, [transacoes])

  const bancos = useMemo<BancoComSaldo[]>(
    () =>
      bancosRaw.map(b => {
        if (b.tipo === 'investimento') {
          return { ...b, gastos: 0, entradas: 0, saldoAtual: b.saldoInicial }
        }
        const txs = porBanco[b.id] ?? []
        const gastos = txs
          .filter(t => t.tipo === 'gasto' && !t.cartaoId)
          .reduce((s, t) => s + t.valor, 0)
        const entradas = txs
          .filter(t => t.tipo === 'entrada')
          .reduce((s, t) => s + t.valor, 0)
        return { ...b, gastos, entradas, saldoAtual: b.saldoInicial + entradas - gastos }
      }),
    [bancosRaw, porBanco],
  )

  const totalSaldo = useMemo(
    () => bancos.filter(b => b.tipo === 'corrente').reduce((s, b) => s + b.saldoAtual, 0),
    [bancos],
  )

  const totalInvestido = useMemo(
    () => bancos.filter(b => b.tipo === 'investimento').reduce((s, b) => s + b.saldoAtual, 0),
    [bancos],
  )

  const bancosPorTipo = useMemo(() => ({
    corrente: bancos.filter(b => b.tipo === 'corrente'),
    investimento: bancos.filter(b => b.tipo === 'investimento'),
  }), [bancos])

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

  return { bancos, totalSaldo, totalInvestido, bancosPorTipo, isLoading, addBanco, updateBanco, deleteBanco }
}
