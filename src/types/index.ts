export type Categoria = "fixo" | "cartao" | "extra"
export type FormaPagamento = "pix" | "debito" | "boleto" | "credito"
export type SaudeFinanceira = "verde" | "amarelo" | "vermelho"
export type AlertaVencimento = "vencida" | "vence_em_breve" | null

export interface Parcelas {
  atual: number
  total: number
}

export interface ContaOrigem {
  tipo: 'fatura_propagada'
  mesOrigem: string
  cartaoId: string
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
  parcelamentoId?: string
  cartaoId?: string
  pagamento?: { data: string; bancoId: string }
  recorrente?: boolean
  origem?: ContaOrigem
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

export type TipoBanco = 'corrente' | 'investimento'

export interface Banco {
  id: string
  nome: string
  tipo: TipoBanco
  saldoInicial: number
  cor?: string
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
  recorrente?: boolean
  criadoEm: Date
}

export type TipoTransacao = 'gasto' | 'entrada'
export type FormaPagamentoTransacao = FormaPagamento | TipoCartao

export type CategoriaGasto = string

export const CATEGORIAS_FIXAS = [
  'alimentacao', 'transporte', 'saude', 'lazer',
  'educacao', 'moradia', 'vestuario', 'servicos',
  'despesaFixa', 'outros',
] as const

export interface TransacaoOrigem {
  tipo: 'bill' | 'receivable' | 'pagamento_fatura'
  id?: string
}

type TransacaoBase = {
  id: string
  data: string
  descricao: string
  bancoId?: string
  valor: number
  despesaFixa: boolean
  observacao?: string
  cartaoId?: string
  formaPagamento?: FormaPagamentoTransacao
  origem?: TransacaoOrigem
  recorrenteId?: string
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
export type AbaAtiva = 'home' | 'contas' | 'gastos' | 'bancos' | 'receber' | 'cartoes'

export type TransacaoInput = Omit<Transacao, 'id' | 'criadoEm'>
export type BancoInput = Omit<Banco, 'id' | 'criadoEm'>
export type AReceberInput = Omit<AReceber, 'id' | 'criadoEm'>

// --- Cartões de Crédito e Benefícios ---

export type TipoBeneficio = 'vale_alimentacao' | 'vale_combustivel' | 'vale_refeicao' | 'outros_beneficios'

export type TipoCartao = 'credito' | TipoBeneficio

export const TIPOS_BENEFICIO: TipoBeneficio[] = [
  'vale_alimentacao',
  'vale_combustivel',
  'vale_refeicao',
  'outros_beneficios',
]

export interface CartaoBase {
  id: string
  nome: string
  tipo: TipoCartao
  cor: string
  criadoEm: Date
}

export interface CartaoCredito extends CartaoBase {
  tipo: 'credito'
  limite: number
  diaFechamento: number
  diaVencimento: number
  saldoAtual?: never
  operadora?: never
  recargaMensal?: never
  diaRecarga?: never
}

export interface CartaoBeneficio extends CartaoBase {
  tipo: TipoBeneficio
  saldoAtual: number
  operadora?: string
  recargaMensal?: number
  diaRecarga?: number | null
  limite?: never
  diaFechamento?: never
  diaVencimento?: never
}

export type Cartao = CartaoCredito | CartaoBeneficio

export type CartaoInput = Omit<Cartao, 'id' | 'criadoEm'>

export type CartaoComSaldo =
  | (CartaoCredito & {
      totalUsado: number
      limiteDisponivel: number
      percentualUsado: number
      recargaEmBreve: boolean
    })
  | (CartaoBeneficio & {
      totalUsado: number
      limiteDisponivel: number
      percentualUsado: number
      recargaEmBreve: boolean
    })

export interface GastoRecorrente {
  id: string
  cartaoId: string
  descricao: string
  valor: number
  categoria: string
  ativo: boolean
  criadoEm: Date
}

export type GastoRecorrenteInput = Omit<GastoRecorrente, 'id' | 'criadoEm'>

export interface FaturaCartao {
  id: string
  cartaoId: string
  mesReferencia: string
  mesVencimento: string
  total: number
  pago: boolean
  criadoEm: Date
}

export interface FaturaCalculada {
  cartaoId: string
  cartaoNome: string
  cartaoCor: string
  diaVencimento: number
  totalAvulso: number
  totalParcelas: number
  total: number
  gastosAvulsos: Transacao[]
  contasParceladas: Conta[]
  pago: boolean
  dataPagamento: string | null
  bancoId?: string
  transacaoId?: string
}
