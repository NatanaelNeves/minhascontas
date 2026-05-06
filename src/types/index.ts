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

// --- Expansão: Bancos, Transações, A Receber ---

export interface Banco {
  id: string
  nome: string
  saldoInicial: number
  criadoEm: Date
}

export interface BancoComSaldo extends Banco {
  gastos: number
  entradas: number
  saldoAtual: number
}

export interface AReceber {
  id: string
  nome: string
  valor: number
  recebido: boolean
  dataPrevista: string | null
  criadoEm: Date
}

export type TipoTransacao = 'gasto' | 'entrada'

export type CategoriaGasto =
  | 'alimentacao' | 'transporte' | 'saude' | 'lazer'
  | 'educacao' | 'moradia' | 'vestuario' | 'servicos'
  | 'despesaFixa' | 'outros'

export interface TransacaoOrigem {
  tipo: 'bill' | 'receivable'
  id: string
}

type TransacaoBase = {
  id: string
  data: string
  descricao: string
  bancoId: string
  valor: number
  despesaFixa: boolean
  observacao?: string
  origem?: TransacaoOrigem
  criadoEm: Date
}

type TransacaoGasto = TransacaoBase & {
  tipo: 'gasto'
  categoria: CategoriaGasto
}

type TransacaoEntrada = TransacaoBase & {
  tipo: 'entrada'
  categoria?: never
}

export type Transacao = TransacaoGasto | TransacaoEntrada
export type AbaAtiva = 'home' | 'contas' | 'gastos' | 'bancos' | 'receber'

export type TransacaoInput = Omit<Transacao, 'id' | 'criadoEm'>
export type BancoInput = Omit<Banco, 'id' | 'criadoEm'>
export type AReceberInput = Omit<AReceber, 'id' | 'criadoEm'>
