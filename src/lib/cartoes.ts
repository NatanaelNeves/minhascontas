import { Cartao, CartaoComSaldo, CartaoCredito, CartaoBeneficio, TipoBeneficio, TIPOS_BENEFICIO } from '@/types'

export const OPERADORAS_BENEFICIO = ['VR', 'Ticket', 'Alelo', 'Flash', 'Sodexo', 'Outros'] as const

export function isTipoBeneficio(tipo: Cartao['tipo']): tipo is TipoBeneficio {
  return (TIPOS_BENEFICIO as readonly TipoBeneficio[]).includes(tipo as TipoBeneficio)
}

export function isCartaoCredito(cartao: Cartao | CartaoComSaldo): cartao is CartaoCredito {
  return cartao.tipo === 'credito'
}

export function isCartaoBeneficio(cartao: Cartao | CartaoComSaldo): cartao is CartaoBeneficio {
  return cartao.tipo !== 'credito'
}

export function getGrupoBeneficio(tipo: TipoBeneficio): 'alimentacao' | 'combustivel' | 'outros' {
  if (tipo === 'vale_combustivel') return 'combustivel'
  if (tipo === 'outros_beneficios') return 'outros'
  return 'alimentacao'
}

export function getLabelTipoCartao(tipo: Cartao['tipo']): string {
  if (tipo === 'credito') return 'Crédito'
  if (tipo === 'vale_alimentacao') return 'Vale Alim.'
  if (tipo === 'vale_refeicao') return 'Vale Ref.'
  if (tipo === 'vale_combustivel') return 'Vale Comb.'
  return 'Benefício'
}

export function getLabelGrupoBeneficio(tipo: TipoBeneficio): string {
  const grupo = getGrupoBeneficio(tipo)
  if (grupo === 'alimentacao') return 'Alimentação/Refeição'
  if (grupo === 'combustivel') return 'Combustível'
  return 'Benefícios'
}

export function recargaEmBreve(diaRecarga?: number | null): boolean {
  if (!diaRecarga) return false
  const hoje = new Date()
  const diaHoje = hoje.getDate()
  return diaRecarga === diaHoje || diaRecarga === diaHoje + 1
}

export function cartaoSaldoDisponivel(cartao: CartaoComSaldo): number {
  return cartao.limiteDisponivel
}
