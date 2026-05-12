import { useEffect, useState, useMemo, useRef } from 'react'
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
    saldoInicial: d.saldoInicial ?? 0,
    cor: d.cor ?? undefined,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
}

export interface UseBanksReturn {
  bancos: BancoComSaldo[]
  isLoading: boolean
  addBanco: (b: BancoInput) => Promise<void>
  updateBanco: (id: string, data: Partial<BancoInput>) => Promise<void>
  deleteBanco: (id: string) => Promise<string | null>
}

export function useBanks(
  userId: string,
  transacoes: Transacao[],
  transacoesAnteriores: Transacao[],
): UseBanksReturn {
  const [bancosRaw, setBancosRaw] = useState<Banco[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const migrationRan = useRef(false)

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

  // One-time migration: move per-month banks to global collection
  useEffect(() => {
    if (!userId || migrationRan.current) return
    migrationRan.current = true
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

  const bancos = useMemo<BancoComSaldo[]>(
    () =>
      bancosRaw.map(b => {
        if (b.tipo === 'investimento') {
          return { ...b, gastos: 0, entradas: 0, saldoAtual: b.saldoInicial }
        }

        const entradasAnt = transacoesAnteriores
          .filter(t => t.bancoId === b.id && t.tipo === 'entrada')
          .reduce((s, t) => s + t.valor, 0)
        const gastosAnt = transacoesAnteriores
          .filter(t => t.bancoId === b.id && t.tipo === 'gasto' && !t.cartaoId)
          .reduce((s, t) => s + t.valor, 0)
        const saldoBase = b.saldoInicial + entradasAnt - gastosAnt

        const gastos = transacoes
          .filter(t => t.bancoId === b.id && t.tipo === 'gasto' && !t.cartaoId)
          .reduce((s, t) => s + t.valor, 0)
        const entradas = transacoes
          .filter(t => t.bancoId === b.id && t.tipo === 'entrada')
          .reduce((s, t) => s + t.valor, 0)

        return { ...b, gastos, entradas, saldoAtual: saldoBase + entradas - gastos }
      }),
    [bancosRaw, transacoes, transacoesAnteriores],
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

  return { bancos, isLoading, addBanco, updateBanco, deleteBanco }
}
