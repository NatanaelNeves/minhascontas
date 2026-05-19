import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Conta, ResumoMes, AlertaVencimento, SaudeFinanceira } from "@/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function centavosToDisplay(centStr: string): string {
  if (!centStr) return ''
  const cents = parseInt(centStr, 10)
  if (isNaN(cents)) return ''
  return (cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function valorToCentStr(valor: number): string {
  return Math.round(valor * 100).toString()
}

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatBRLShort(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(value))
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

export function prevMesId(mesId: string): string {
  const [year, month] = mesId.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function nextMesId(mesId: string): string {
  const [year, month] = mesId.split('-').map(Number)
  const d = new Date(year, month, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function formatMesLabel(mesId: string): string {
  const [year, month] = mesId.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

const AVATAR_BG = [
  'rgba(127,119,221,0.15)',
  'rgba(29,158,117,0.12)',
  'rgba(55,138,221,0.12)',
  'rgba(239,159,39,0.12)',
  'rgba(212,83,126,0.12)',
]

export function getBillAvatarBg(nome: string): string {
  const hash = nome.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return AVATAR_BG[hash % AVATAR_BG.length]
}

export function getBillEmoji(nome: string): string {
  const l = nome.toLowerCase()
  if (/faculdade|escola|curso|facul/.test(l)) return '🎓'
  if (/celular|iphone|samsung|telefon/.test(l)) return '📱'
  if (/internet|wifi|banda|fibra|vivo|claro|tim/.test(l)) return '📡'
  if (/seguro/.test(l)) return '🛡️'
  if (/nubank|picpay|neon|inter|itaú|bradesco|fatura|cartão|cartao/.test(l)) return '💳'
  if (/emprestimo|empréstimo|financiamento/.test(l)) return '📊'
  if (/aluguel|condom|iptu/.test(l)) return '🏠'
  if (/mercado|shopee|amazon|magalu/.test(l)) return '🛍️'
  if (/formatura|festa|evento|aniversar/.test(l)) return '🎉'
  if (/depilação|depilacao|estetica|estética|salão|salon|beleza|cabelo|dandara/.test(l)) return '✨'
  if (/academia|gym|fitness/.test(l)) return '💪'
  if (/gas|água|agua|luz|energia|eletric/.test(l)) return '⚡'
  if (/netflix|spotify|prime|disney|stream/.test(l)) return '🎬'
  if (/combustivel|gasolina|uber|99|ifood/.test(l)) return '🚗'
  if (/farmacia|remedio|médico|medico|saude|plano/.test(l)) return '💊'
  if (/shopee|aliexpress/.test(l)) return '📦'
  return '📄'
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

const MESES_CURTOS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

export function mesIdToShortLabel(mesId: string): string {
  const [year, month] = mesId.split('-').map(Number)
  return `${MESES_CURTOS[month - 1]}/${year}`
}

export function mesIdAddMeses(mesId: string, n: number): string {
  const [year, month] = mesId.split('-').map(Number)
  const d = new Date(year, month - 1 + n, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function mesesEntreMesIds(de: string, ate: string): number {
  const [y1, m1] = de.split('-').map(Number)
  const [y2, m2] = ate.split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1)
}
