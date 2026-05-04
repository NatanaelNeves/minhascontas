import { useState, useEffect } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  addDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MesInfo } from '@/types'
import { useAppStore } from '@/store/useAppStore'

interface UseMonthReturn {
  mesInfo: MesInfo | null
  isLoading: boolean
  setReceita: (valor: number) => Promise<void>
  criarMes: (mesId: string, receita: number) => Promise<void>
  copiarFixos: (mesOrigemId: string, mesDestinoId: string) => Promise<void>
  mesExiste: (mesId: string) => Promise<boolean>
}

export function useMonth(userId: string): UseMonthReturn {
  const mesAtivo = useAppStore(s => s.mesAtivo)
  const [mesInfo, setMesInfo] = useState<MesInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId || !mesAtivo) return

    setIsLoading(true)
    const infoRef = doc(db, `users/${userId}/months/${mesAtivo}`)
    getDoc(infoRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setMesInfo({
          receita: data.receita,
          criadoEm: data.criadoEm?.toDate() ?? new Date(),
        })
      } else {
        setMesInfo(null)
      }
      setIsLoading(false)
    })
  }, [userId, mesAtivo])

  async function setReceita(valor: number) {
    const infoRef = doc(db, `users/${userId}/months/${mesAtivo}`)
    await setDoc(infoRef, { receita: valor, criadoEm: serverTimestamp() }, { merge: true })
    setMesInfo(prev =>
      prev ? { ...prev, receita: valor } : { receita: valor, criadoEm: new Date() }
    )
  }

  async function criarMes(mesId: string, receita: number) {
    const infoRef = doc(db, `users/${userId}/months/${mesId}`)
    await setDoc(infoRef, { receita, criadoEm: serverTimestamp() })
  }

  async function mesExiste(mesId: string): Promise<boolean> {
    const infoRef = doc(db, `users/${userId}/months/${mesId}`)
    const snap = await getDoc(infoRef)
    return snap.exists()
  }

  async function copiarFixos(mesOrigemId: string, mesDestinoId: string) {
    const billsOrigemCol = collection(db, `users/${userId}/months/${mesOrigemId}/bills`)
    const snap = await getDocs(billsOrigemCol)

    const destCol = collection(db, `users/${userId}/months/${mesDestinoId}/bills`)

    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      if (data.categoria !== 'fixo') continue
      if (data.parcelas && data.parcelas.atual >= data.parcelas.total) continue

      const novaParcelas = data.parcelas
        ? { atual: data.parcelas.atual + 1, total: data.parcelas.total }
        : null

      await addDoc(destCol, {
        nome: data.nome,
        valor: data.valor,
        categoria: data.categoria,
        formaPagamento: data.formaPagamento,
        vencimento: data.vencimento ?? null,
        parcelas: novaParcelas,
        pago: false,
        criadoEm: serverTimestamp(),
      })
    }
  }

  return { mesInfo, isLoading, setReceita, criarMes, copiarFixos, mesExiste }
}
