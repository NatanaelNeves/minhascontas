export type Categoria = "fixo" | "cartao" | "extra"
export type FormaPagamento = "pix" | "debito" | "boleto" | "credito"
export type SaudeFinanceira = "verde" | "amarelo" | "vermelho"
export type AlertaVencimento = "vencida" | "vence_em_breve" | null

export interface Parcelas {
  atual: number
  total: number
}

export interface Conta {
  id: string
  nome: string
  valor: number
  categoria: Categoria
  formaPagamento: FormaPagamento
  vencimento: string | null
  pago: boolean
  parcelas: Parcelas | null
  criadoEm: Date
}

export interface MesInfo {
  receita: number
  criadoEm: Date
}

export interface Mes {
  id: string
  info: MesInfo
  contas: Conta[]
}

export interface ResumoMes {
  totalPago: number
  totalPendente: number
  totalGeral: number
  sobra: number
  percentualPago: number
  saudePrimaria: SaudeFinanceira
}

export type ContaInput = Omit<Conta, "id" | "criadoEm">
