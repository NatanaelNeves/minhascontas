import { describe, it, expect } from 'vitest'
import { computeBancoSaldo, computeTotalSaldo } from './calcBancos'
import { Banco, Transacao } from '@/types'

const makeBanco = (overrides: Partial<Banco> = {}): Banco => ({
  id: 'b1',
  nome: 'Nubank',
  tipo: 'corrente',
  saldoInicial: 1000,
  criadoEm: new Date(),
  ...overrides,
})

const makeTx = (overrides: Partial<Transacao> = {}): Transacao => ({
  id: 't1',
  data: '2026-05-01',
  descricao: 'Compra',
  bancoId: 'b1',
  valor: 100,
  tipo: 'gasto',
  categoria: 'alimentacao',
  despesaFixa: false,
  criadoEm: new Date(),
  ...overrides,
} as Transacao)

describe('computeBancoSaldo', () => {
  it('no transactions returns saldoInicial', () => {
    const result = computeBancoSaldo(makeBanco(), [])
    expect(result.saldoAtual).toBe(1000)
    expect(result.gastos).toBe(0)
    expect(result.entradas).toBe(0)
  })

  it('gastos reduce saldo', () => {
    const result = computeBancoSaldo(makeBanco(), [makeTx({ valor: 300 })])
    expect(result.gastos).toBe(300)
    expect(result.saldoAtual).toBe(700)
  })

  it('entradas increase saldo', () => {
    const result = computeBancoSaldo(
      makeBanco(),
      [makeTx({ id: 't2', tipo: 'entrada', valor: 500 }) as Transacao],
    )
    expect(result.entradas).toBe(500)
    expect(result.saldoAtual).toBe(1500)
  })

  it('ignores transactions for other banks', () => {
    const result = computeBancoSaldo(
      makeBanco({ id: 'b1' }),
      [makeTx({ bancoId: 'b2', valor: 999 })],
    )
    expect(result.gastos).toBe(0)
    expect(result.saldoAtual).toBe(1000)
  })

  it('multiple transactions combined correctly', () => {
    const txs: Transacao[] = [
      makeTx({ id: 't1', tipo: 'gasto', categoria: 'alimentacao', valor: 200 }),
      makeTx({ id: 't2', tipo: 'entrada', valor: 400 }) as Transacao,
      makeTx({ id: 't3', tipo: 'gasto', categoria: 'transporte', valor: 50 }),
    ]
    const result = computeBancoSaldo(makeBanco(), txs)
    expect(result.gastos).toBe(250)
    expect(result.entradas).toBe(400)
    expect(result.saldoAtual).toBe(1150)
  })
})

describe('computeTotalSaldo', () => {
  it('sums saldoAtual across all banks', () => {
    const bancos = [
      { ...makeBanco({ id: 'b1' }), gastos: 0, entradas: 0, saldoAtual: 500 },
      { ...makeBanco({ id: 'b2' }), gastos: 0, entradas: 0, saldoAtual: 300 },
    ]
    expect(computeTotalSaldo(bancos)).toBe(800)
  })

  it('returns 0 for empty list', () => {
    expect(computeTotalSaldo([])).toBe(0)
  })
})
