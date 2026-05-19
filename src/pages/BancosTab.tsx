import { BancoComSaldo, BancoInput } from '@/types'
import { BankList } from '@/components/Banks/BankList'

interface Props {
  bancos: BancoComSaldo[]
  onAdd: (data: BancoInput) => Promise<void>
  onUpdate: (id: string, data: Partial<BancoInput>) => Promise<void>
  onDelete: (id: string) => Promise<string | null>
}

export function BancosTab({ bancos, onAdd, onUpdate, onDelete }: Props) {
  return (
    <BankList
      bancos={bancos}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  )
}
