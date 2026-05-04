import { describe, it, expect } from 'vitest'
import { formatBRL, calcResumo, getAlertaVencimento } from './utils'
import { Conta } from '@/types'

const makeConta = (overrides: Partial<Conta> = {}): Conta => ({
  id: '1',
  nome: 'Teste',
  valor: 100,
  categoria: 'fixo',
  formaPagamento: 'pix',
  vencimento: null,
  pago: false,
  parcelas: null,
  criadoEm: new Date(),
  ...overrides,
})

describe('formatBRL', () => {
  it('formats number as Brazilian currency', () => {
    expect(formatBRL(1500)).toMatch(/1\.500,00/)
  })

  it('formats zero', () => {
    expect(formatBRL(0)).toMatch(/0,00/)
  })

  it('formats decimal values', () => {
    expect(formatBRL(99.90)).toMatch(/99,90/)
  })
})

describe('calcResumo', () => {
  it('calculates totais correctly', () => {
    const contas = [
      makeConta({ valor: 1000, pago: true }),
      makeConta({ id: '2', valor: 500, pago: false }),
    ]
    const result = calcResumo(contas, 2000)
    expect(result.totalPago).toBe(1000)
    expect(result.totalPendente).toBe(500)
    expect(result.totalGeral).toBe(1500)
    expect(result.sobra).toBe(500)
  })

  it('returns verde when sobra >= 20% receita', () => {
    const contas = [makeConta({ valor: 1500, pago: true })]
    expect(calcResumo(contas, 2000).saudePrimaria).toBe('verde')
  })

  it('returns amarelo when sobra between 0% and 20%', () => {
    const contas = [makeConta({ valor: 1700, pago: true })]
    expect(calcResumo(contas, 2000).saudePrimaria).toBe('amarelo')
  })

  it('returns vermelho when sobra negativa', () => {
    const contas = [makeConta({ valor: 2500, pago: true })]
    expect(calcResumo(contas, 2000).saudePrimaria).toBe('vermelho')
  })

  it('calculates percentualPago correctly', () => {
    const contas = [
      makeConta({ valor: 500, pago: true }),
      makeConta({ id: '2', valor: 500, pago: false }),
    ]
    expect(calcResumo(contas, 2000).percentualPago).toBe(50)
  })
})

describe('getAlertaVencimento', () => {
  it('returns null when pago', () => {
    expect(getAlertaVencimento('2020-01-01', true)).toBeNull()
  })

  it('returns null when vencimento is null', () => {
    expect(getAlertaVencimento(null, false)).toBeNull()
  })

  it('returns vencida when past due', () => {
    expect(getAlertaVencimento('2020-01-01', false)).toBe('vencida')
  })

  it('returns vence_em_breve when due within 3 days', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    expect(getAlertaVencimento(dateStr, false)).toBe('vence_em_breve')
  })

  it('returns null when due in more than 3 days', () => {
    expect(getAlertaVencimento('2030-12-31', false)).toBeNull()
  })
})
