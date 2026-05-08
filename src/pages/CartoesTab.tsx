import { CartaoComSaldo, CartaoInput, Conta, FaturaCartao, BancoComSaldo } from '@/types'
import { CartoesList } from '@/components/Cartoes/CartoesList'

interface Props {
  cartoes: CartaoComSaldo[]
  contas: Conta[]
  faturas: FaturaCartao[]
  bancos: BancoComSaldo[]
  onAdd: (data: CartaoInput) => void
  onUpdate: (id: string, data: Partial<CartaoInput>) => void
  onDelete: (id: string) => void
  onMarcarFaturaPaga: (faturaId: string, bancoId: string) => void
  onNavigateToBancos: () => void
}

export function CartoesTab(props: Props) {
  return <CartoesList {...props} />
}
