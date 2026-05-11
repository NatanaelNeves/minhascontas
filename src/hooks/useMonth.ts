import { useState, useEffect } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  addDoc,
  deleteDoc,
  query,
  where,
  writeBatch,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { ContaInput, MesInfo } from '@/types'
import { nextMesId, mesIdToShortLabel } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'

interface UseMonthReturn {
  mesInfo: MesInfo | null
  isLoading: boolean
  setReceita: (valor: number) => Promise<void>
  criarMes: (mesId: string, receita: number) => Promise<void>
  copiarFixos: (mesOrigemId: string, mesDestinoId: string) => Promise<void>
  mesExiste: (mesId: string) => Promise<boolean>
  propagarSaldosBancos: (mesAnteriorId: string) => Promise<void>
  propagarFaturasNaoPagas: (mesAnteriorId: string, mesDestinoId: string) => Promise<void>
  criarContaComParcelas: (
    conta: ContaInput,
    parcelaTotal: number,
    mesInicialId: string,
    parcelaInicialAtual?: number,
  ) => Promise<void>
  excluirParcelamentosRestantes: (
    parcelamentoId: string,
    parcelaAtualFrom: number,
    parcelaTotal: number,
    mesAtualId: string,
  ) => Promise<void>
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
    await setDoc(infoRef, { receita, criadoEm: serverTimestamp(), mesInicializado: true })
  }

  async function mesExiste(mesId: string): Promise<boolean> {
    const infoRef = doc(db, `users/${userId}/months/${mesId}`)
    const snap = await getDoc(infoRef)
    return snap.exists()
  }

  function atualizarDataParaMes(dataOriginal: string | null, novoMesId: string): string | null {
    if (!dataOriginal) return null
    const [, , diaStr] = dataOriginal.split('-')
    const dia = Number(diaStr)
    const [anoStr, mesStr] = novoMesId.split('-')
    const ano = Number(anoStr)
    const mes = Number(mesStr)
    const ultimoDia = new Date(ano, mes, 0).getDate()
    const diaFinal = Math.min(dia, ultimoDia)
    return `${anoStr}-${mesStr}-${String(diaFinal).padStart(2, '0')}`
  }

  async function copiarFixos(mesOrigemId: string, mesDestinoId: string) {
    const billsOrigemCol = collection(db, `users/${userId}/months/${mesOrigemId}/bills`)
    const snap = await getDocs(billsOrigemCol)

    const destCol = collection(db, `users/${userId}/months/${mesDestinoId}/bills`)

    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      const devecopiar = data.recorrente === true || data.categoria === 'fixo'
      if (!devecopiar) continue
      if (data.parcelamentoId) continue   // already pre-created, skip
      if (data.parcelas && data.parcelas.atual >= data.parcelas.total) continue

      const novaParcelas = data.parcelas
        ? { atual: data.parcelas.atual + 1, total: data.parcelas.total }
        : null

      await addDoc(destCol, {
        nome: data.nome,
        valor: data.valor,
        categoria: data.categoria,
        formaPagamento: data.formaPagamento,
        vencimento: atualizarDataParaMes(data.vencimento ?? null, mesDestinoId),
        parcelas: novaParcelas,
        pago: false,
        ...(data.recorrente ? { recorrente: true } : {}),
        criadoEm: serverTimestamp(),
      })
    }
  }

  async function propagarSaldosBancos(mesAnteriorId: string): Promise<void> {
    const [txsSnap, bancosSnap] = await Promise.all([
      getDocs(collection(db, `users/${userId}/months/${mesAnteriorId}/transactions`)),
      getDocs(collection(db, `users/${userId}/banks`)),
    ])

    const txs = txsSnap.docs.map(d => d.data())
    const batch = writeBatch(db)

    bancosSnap.docs.forEach(bancoDoc => {
      const banco = bancoDoc.data()
      if ((banco.tipo as string) === 'investimento') return

      const gastos = txs
        .filter(t => t.bancoId === bancoDoc.id && (t.tipo as string) === 'gasto' && !t.cartaoId)
        .reduce((sum, t) => sum + (t.valor as number), 0)

      const entradas = txs
        .filter(t => t.bancoId === bancoDoc.id && (t.tipo as string) === 'entrada')
        .reduce((sum, t) => sum + (t.valor as number), 0)

      batch.update(doc(db, `users/${userId}/banks/${bancoDoc.id}`), {
        saldoInicial: (banco.saldoInicial as number) + entradas - gastos,
      })
    })

    await batch.commit()
  }

  async function criarContaComParcelas(
    conta: ContaInput,
    parcelaTotal: number,
    mesInicialId: string,
    parcelaInicialAtual = 1,
  ): Promise<void> {
    const parcelamentoId = crypto.randomUUID()
    const batch = writeBatch(db)
    let currentMes = mesInicialId

    for (let atual = parcelaInicialAtual; atual <= parcelaTotal; atual++) {
      const billRef = doc(collection(db, `users/${userId}/months/${currentMes}/bills`))
      const payload: Record<string, unknown> = {
        nome: conta.nome,
        valor: conta.valor,
        categoria: conta.categoria,
        formaPagamento: conta.formaPagamento,
        vencimento: conta.vencimento ?? null,
        pago: false,
        parcelas: { atual, total: parcelaTotal },
        parcelamentoId,
        criadoEm: serverTimestamp(),
      }
      if (conta.cartaoId) payload.cartaoId = conta.cartaoId
      batch.set(billRef, payload)
      currentMes = nextMesId(currentMes)
    }

    await batch.commit()
  }

  async function excluirParcelamentosRestantes(
    parcelamentoId: string,
    parcelaAtualFrom: number,
    parcelaTotal: number,
    mesAtualId: string,
  ): Promise<void> {
    let currentMes = mesAtualId

    for (let i = parcelaAtualFrom; i <= parcelaTotal; i++) {
      const billsCol = collection(db, `users/${userId}/months/${currentMes}/bills`)
      const snap = await getDocs(
        query(billsCol, where('parcelamentoId', '==', parcelamentoId)),
      )
      for (const docSnap of snap.docs) {
        await deleteDoc(docSnap.ref)
      }
      currentMes = nextMesId(currentMes)
    }
  }

  async function propagarFaturasNaoPagas(mesAnteriorId: string, mesDestinoId: string): Promise<void> {
    const cartoesSnap = await getDocs(collection(db, `users/${userId}/cartoes`))
    const cartoesCredito = cartoesSnap.docs.filter(d => d.data().tipo === 'credito')
    if (cartoesCredito.length === 0) return

    const txsSnap = await getDocs(collection(db, `users/${userId}/months/${mesAnteriorId}/transactions`))
    const billsDestinoSnap = await getDocs(collection(db, `users/${userId}/months/${mesDestinoId}/bills`))

    for (const cartaoDoc of cartoesCredito) {
      const cartao = cartaoDoc.data()
      const cartaoId = cartaoDoc.id

      const faturaSnap = await getDoc(doc(db, `users/${userId}/months/${mesAnteriorId}/faturas/${cartaoId}`))
      if (faturaSnap.exists() && faturaSnap.data()?.pago === true) continue

      const totalAvulso = txsSnap.docs.reduce((sum, d) => {
        const data = d.data()
        if (data.cartaoId === cartaoId && data.tipo === 'gasto') return sum + (data.valor as number)
        return sum
      }, 0)
      if (totalAvulso <= 0) continue

      const jaExiste = billsDestinoSnap.docs.some(d => {
        const data = d.data()
        return data.origem?.tipo === 'fatura_propagada' && data.origem?.mesOrigem === mesAnteriorId && data.cartaoId === cartaoId
      })
      if (jaExiste) continue

      const mesLabel = mesIdToShortLabel(mesAnteriorId)
      await addDoc(collection(db, `users/${userId}/months/${mesDestinoId}/bills`), {
        nome: `Fatura ${cartao.nome} (${mesLabel})`,
        valor: totalAvulso,
        categoria: 'cartao',
        formaPagamento: 'credito',
        vencimento: null,
        pago: false,
        parcelas: null,
        cartaoId,
        origem: { tipo: 'fatura_propagada', mesOrigem: mesAnteriorId, cartaoId },
        criadoEm: serverTimestamp(),
      })
    }
  }

  return { mesInfo, isLoading, setReceita, criarMes, copiarFixos, mesExiste, propagarSaldosBancos, propagarFaturasNaoPagas, criarContaComParcelas, excluirParcelamentosRestantes }
}
