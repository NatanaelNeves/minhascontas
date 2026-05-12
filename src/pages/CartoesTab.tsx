import { CartaoComSaldo, CartaoInput, Conta, FaturaCalculada, BancoComSaldo, GastoRecorrente, Transacao } from '@/types'
import { CartoesList } from '@/components/Cartoes/CartoesList'

interface Props {
  cartoes: CartaoComSaldo[]
  contas: Conta[]
  transacoes: Transacao[]
  faturas: FaturaCalculada[]
  bancos: BancoComSaldo[]
  gastosRecorrentes: GastoRecorrente[]
  onAdd: (data: CartaoInput) => void
  onUpdate: (id: string, data: Partial<CartaoInput>) => void
  onDelete: (id: string) => void
  onMarcarFaturaPaga: (faturaId: string, bancoId: string, dataPagamento: string) => void
  onCancelarRecorrente: (id: string) => Promise<void>
  onNavigateToBancos: () => void
}

export function CartoesTab(props: Props) {
  return <CartoesList {...props} />
}
