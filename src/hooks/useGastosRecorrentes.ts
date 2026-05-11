import { useState, useEffect } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { GastoRecorrente, GastoRecorrenteInput } from '@/types'

export interface UseGastosRecorrentesReturn {
  gastosRecorrentes: GastoRecorrente[]
  isLoading: boolean
  addRecorrente: (input: GastoRecorrenteInput) => Promise<string>
  cancelarRecorrente: (id: string) => Promise<void>
  criarTransacoesParaMes: (mesId: string) => Promise<void>
}

export function useGastosRecorrentes(userId: string): UseGastosRecorrentesReturn {
  const [gastosRecorrentes, setGastosRecorrentes] = useState<GastoRecorrente[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const recPath = `users/${userId}/gastosRecorrentes`

  useEffect(() => {
    if (!userId) return
    const unsub = onSnapshot(collection(db, recPath), snap => {
      const items: GastoRecorrente[] = snap.docs.map(d => ({
        id: d.id,
        cartaoId: d.data().cartaoId as string,
        descricao: d.data().descricao as string,
        valor: d.data().valor as number,
        categoria: d.data().categoria as string,
        ativo: d.data().ativo as boolean,
        criadoEm: d.data().criadoEm?.toDate() ?? new Date(),
      }))
      setGastosRecorrentes(items)
      setIsLoading(false)
    })
    return unsub
  }, [userId])

  async function addRecorrente(input: GastoRecorrenteInput): Promise<string> {
    const id = crypto.randomUUID()
    await setDoc(doc(db, recPath, id), {
      ...input,
      criadoEm: serverTimestamp(),
    })
    return id
  }

  async function cancelarRecorrente(id: string): Promise<void> {
    await updateDoc(doc(db, recPath, id), { ativo: false })
  }

  async function criarTransacoesParaMes(mesId: string): Promise<void> {
    const ativos = gastosRecorrentes.filter(r => r.ativo)
    if (ativos.length === 0) return
    const [anoStr, mesStr] = mesId.split('-')
    const data = `${anoStr}-${mesStr}-01`
    const batch = writeBatch(db)
    const txPath = `users/${userId}/months/${mesId}/transactions`
    ativos.forEach(r => {
      const txRef = doc(collection(db, txPath))
      batch.set(txRef, {
        tipo: 'gasto',
        categoria: r.categoria,
        cartaoId: r.cartaoId,
        valor: r.valor,
        descricao: r.descricao,
        data,
        despesaFixa: false,
        recorrenteId: r.id,
        criadoEm: serverTimestamp(),
      })
    })
    await batch.commit()
  }

  return { gastosRecorrentes, isLoading, addRecorrente, cancelarRecorrente, criarTransacoesParaMes }
}
