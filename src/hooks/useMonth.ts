import { useState, useEffect } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
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
  copiarContasRecorrentes: (mesOrigemId: string, mesDestinoId: string) => Promise<void>
  propagarRecorrenteParaMesesFuturos: (mesOrigemId: string) => Promise<void>
  mesExiste: (mesId: string) => Promise<boolean>
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
    const unsubscribe = onSnapshot(infoRef, (snap) => {
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
    return () => unsubscribe()
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

  async function copiarContasRecorrentes(mesOrigemId: string, mesDestinoId: string) {
    const destCol = collection(db, `users/${userId}/months/${mesDestinoId}/bills`)
    const existingSnap = await getDocs(query(destCol, where('recorrente', '==', true)))
    const existingKeys = new Set(
      existingSnap.docs.map(d => {
        const data = d.data()
        const cartaoId = data.cartaoId ?? ''
        const parcelasTotal = data.parcelas?.total ?? 0
        return [
          data.nome ?? '',
          data.categoria ?? '',
          data.formaPagamento ?? '',
          data.vencimento ?? '',
          cartaoId,
          parcelasTotal,
        ].join('|')
      }),
    )

    const snap = await getDocs(collection(db, `users/${userId}/months/${mesOrigemId}/bills`))
    const batch = writeBatch(db)

    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      if (data.recorrente !== true) continue
      if (data.parcelamentoId) continue
      if (data.parcelas && (data.parcelas.atual as number) >= (data.parcelas.total as number)) continue

      const vencimentoDestino = atualizarDataParaMes(data.vencimento ?? null, mesDestinoId) ?? ''
      const key = [
        data.nome ?? '',
        data.categoria ?? '',
        data.formaPagamento ?? '',
        vencimentoDestino,
        data.cartaoId ?? '',
        data.parcelas?.total ?? 0,
      ].join('|')
      if (existingKeys.has(key)) continue

      const novaParcelas = data.parcelas
        ? { atual: (data.parcelas.atual as number) + 1, total: data.parcelas.total as number }
        : null

      const payload: Record<string, unknown> = {
        nome: data.nome,
        valor: data.valor,
        categoria: data.categoria,
        formaPagamento: data.formaPagamento,
        vencimento: vencimentoDestino || null,
        parcelas: novaParcelas,
        pago: false,
        recorrente: true,
        criadoEm: serverTimestamp(),
      }
      if (data.cartaoId) payload.cartaoId = data.cartaoId
      batch.set(doc(destCol), payload)
    }

    await batch.commit()
  }

  async function propagarRecorrenteParaMesesFuturos(mesOrigemId: string): Promise<void> {
    const monthsSnap = await getDocs(collection(db, `users/${userId}/months`))
    const mesesFuturos = monthsSnap.docs
      .map(d => d.id)
      .filter(id => id > mesOrigemId)
      .sort()

    let anterior = mesOrigemId
    for (const mesFuturo of mesesFuturos) {
      await copiarContasRecorrentes(anterior, mesFuturo)
      anterior = mesFuturo
    }
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
        vencimento: atualizarDataParaMes(conta.vencimento ?? null, currentMes),
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

      // Per-cartaoId query ensures concurrent calls don't bypass dedup via stale snapshot
      const existingSnap = await getDocs(
        query(
          collection(db, `users/${userId}/months/${mesDestinoId}/bills`),
          where('origem.tipo', '==', 'fatura_propagada'),
          where('origem.mesOrigem', '==', mesAnteriorId),
          where('cartaoId', '==', cartaoId),
        ),
      )
      if (!existingSnap.empty) continue

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

  return { mesInfo, isLoading, setReceita, criarMes, copiarContasRecorrentes, propagarRecorrenteParaMesesFuturos, mesExiste, propagarFaturasNaoPagas, criarContaComParcelas, excluirParcelamentosRestantes }
}
