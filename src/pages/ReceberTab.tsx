import { AReceber, AReceberInput, BancoComSaldo } from '@/types'
import { ReceivableList } from '@/components/Receivables/ReceivableList'

interface Props {
  recebiveis: AReceber[]
  bancos: BancoComSaldo[]
  onAdd: (data: AReceberInput) => Promise<void>
  onUpdate: (id: string, data: Partial<AReceberInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMarcarRecebido: (id: string, bancoId: string) => Promise<void>
  onDesmarcarRecebido: (id: string) => Promise<void>
  onNavigateToBancos: () => void
}

export function ReceberTab(props: Props) {
  return <ReceivableList {...props} />
}
