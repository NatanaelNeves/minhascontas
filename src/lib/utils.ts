import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Conta, ResumoMes, AlertaVencimento, SaudeFinanceira } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function calcResumo(contas: Conta[], receita: number): ResumoMes {
  const totalPago = contas
    .filter(c => c.pago)
    .reduce((sum, c) => sum + c.valor, 0)
  const totalPendente = contas
    .filter(c => !c.pago)
    .reduce((sum, c) => sum + c.valor, 0)
  const totalGeral = totalPago + totalPendente
  const sobra = receita - totalGeral
  const percentualPago = totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0

  let saudePrimaria: SaudeFinanceira
  if (receita === 0) {
    saudePrimaria = 'vermelho'
  } else {
    const ratio = sobra / receita
    if (ratio >= 0.2) {
      saudePrimaria = 'verde'
    } else if (ratio >= 0) {
      saudePrimaria = 'amarelo'
    } else {
      saudePrimaria = 'vermelho'
    }
  }

  return { totalPago, totalPendente, totalGeral, sobra, percentualPago, saudePrimaria }
}

export function getAlertaVencimento(
  vencimento: string | null,
  pago: boolean
): AlertaVencimento {
  if (pago || !vencimento) return null

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataVenc = new Date(vencimento + 'T00:00:00')

  const diffMs = dataVenc.getTime() - hoje.getTime()
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDias <= 0) return 'vencida'
  if (diffDias <= 3) return 'vence_em_breve'
  return null
}
