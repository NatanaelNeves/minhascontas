import { Banco, BancoComSaldo, Transacao } from '@/types'

export function computeBancoSaldo(banco: Banco, transacoes: Transacao[]): BancoComSaldo {
  const txs = transacoes.filter(t => t.bancoId === banco.id)
  const gastos = txs.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.valor, 0)
  const entradas = txs.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)
  return { ...banco, gastos, entradas, saldoAtual: banco.saldoInicial + entradas - gastos }
}

export function computeTotalSaldo(bancos: BancoComSaldo[]): number {
  return bancos.reduce((s, b) => s + b.saldoAtual, 0)
}
