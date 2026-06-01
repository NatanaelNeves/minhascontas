import { useEffect, useState, useMemo } from 'react'
import {
  collection,
  onSnapshot,
  doc,
  writeBatch,
  serverTimestamp,
  deleteField,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { FaturaCalculada, Cartao, CartaoCredito, Transacao, Conta } from '@/types'

interface FaturaFirestore {
  pago: boolean
  dataPagamento?: string | null
  bancoId?: string
  transacaoId?: string
  contasIds?: string[]
}

export interface UseFaturasReturn {
  faturas: FaturaCalculada[]
  isLoading: boolean
  marcarFaturaPaga: (cartaoId: string, bancoId: string, dataPagamento: string, valorCustom?: number) => Promise<void>
  desmarcarFaturaPaga: (cartaoId: string) => Promise<void>
}

export function useFaturas(
  userId: string,
  mesId: string,
  cartoes: Cartao[],
  transacoes: Transacao[],
  contas: Conta[],
): UseFaturasReturn {
  const [faturasSalvas, setFaturasSalvas] = useState<Record<string, FaturaFirestore>>({})
  const [isLoading, setIsLoading] = useState(true)

  const faturasPath = `users/${userId}/months/${mesId}/faturas`
  const txPath = `users/${userId}/months/${mesId}/transactions`
  const billPath = `users/${userId}/months/${mesId}/bills`

  useEffect(() => {
    if (!userId || !mesId) return
    setIsLoading(true)
    const unsub = onSnapshot(collection(db, faturasPath), snap => {
      const map: Record<string, FaturaFirestore> = {}
      snap.docs.forEach(d => { map[d.id] = d.data() as FaturaFirestore })
      setFaturasSalvas(map)
      setIsLoading(false)
    })
    return unsub
  }, [userId, mesId])

  const faturas = useMemo<FaturaCalculada[]>(() => {
    return cartoes
      .filter((c): c is CartaoCredito => c.tipo === 'credito')
      .map(cartao => {
        const gastosAvulsos = transacoes.filter(
          t => t.cartaoId === cartao.id && t.tipo === 'gasto',
        )
        const saved = faturasSalvas[cartao.id]

        // When paid, reconstruct parceladas from saved IDs so total is preserved
        const contasParceladas: Conta[] = saved?.pago && saved.contasIds
          ? saved.contasIds
              .map(id => contas.find(c => c.id === id))
              .filter((c): c is Conta => c !== undefined)
          : contas.filter(c => c.cartaoId === cartao.id && !c.pago)

        const totalAvulso = gastosAvulsos.reduce((s, t) => s + t.valor, 0)
        const totalParcelas = contasParceladas.reduce((s, c) => s + c.valor, 0)
        const gastoAtual = cartao.gastoAtual ?? 0

        return {
          cartaoId: cartao.id,
          cartaoNome: cartao.nome,
          cartaoCor: cartao.cor,
          diaVencimento: cartao.diaVencimento,
          totalAvulso,
          totalParcelas,
          gastoAtual,
          total: totalAvulso + totalParcelas + gastoAtual,
          gastosAvulsos,
          contasParceladas,
          pago: saved?.pago ?? false,
          dataPagamento: saved?.dataPagamento ?? null,
          bancoId: saved?.bancoId,
          transacaoId: saved?.transacaoId,
        }
      })
      .filter(f => f.total > 0)
  }, [cartoes, transacoes, contas, faturasSalvas])

  async function marcarFaturaPaga(cartaoId: string, bancoId: string, dataPagamento: string, valorCustom?: number) {
    const fatura = faturas.find(f => f.cartaoId === cartaoId)
    if (!fatura) return

    const valorFinal = valorCustom ?? fatura.total
    const batch = writeBatch(db)

    // Single payment transaction (no cartaoId → bank balance decreases)
    const txRef = doc(collection(db, txPath))
    batch.set(txRef, {
      tipo: 'gasto',
      categoria: 'despesaFixa',
      bancoId,
      valor: valorFinal,
      descricao: `Fatura ${fatura.cartaoNome}`,
      data: dataPagamento,
      despesaFixa: false,
      observacao: `${fatura.gastosAvulsos.length} gastos + ${fatura.contasParceladas.length} parcelas`,
      origem: { tipo: 'pagamento_fatura' },
      criadoEm: serverTimestamp(),
    })

    // Save fatura state with contasIds for reliable revert
    batch.set(doc(db, faturasPath, cartaoId), {
      pago: true,
      dataPagamento,
      bancoId,
      transacaoId: txRef.id,
      contasIds: fatura.contasParceladas.map(c => c.id),
    })

    // Mark all parceladas as paid
    fatura.contasParceladas.forEach(conta => {
      batch.update(doc(db, billPath, conta.id), {
        pago: true,
        pagamento: { data: dataPagamento, bancoId },
      })
    })

    // Clear manual commitment so the new cycle starts fresh
    const cartaoRef = doc(db, `users/${userId}/cartoes`, cartaoId)
    batch.update(cartaoRef, { gastoAtual: deleteField() })

    await batch.commit()
  }

  async function desmarcarFaturaPaga(cartaoId: string) {
    const saved = faturasSalvas[cartaoId]
    if (!saved?.pago) return

    const batch = writeBatch(db)

    if (saved.transacaoId) {
      batch.delete(doc(db, txPath, saved.transacaoId))
    }

    batch.delete(doc(db, faturasPath, cartaoId))

    const contasIds = saved.contasIds ?? []
    contasIds.forEach(id => {
      batch.update(doc(db, billPath, id), {
        pago: false,
        pagamento: deleteField(),
      })
    })

    await batch.commit()
  }

  return { faturas, isLoading, marcarFaturaPaga, desmarcarFaturaPaga }
}
