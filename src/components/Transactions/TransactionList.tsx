import { useMemo } from 'react'
import { Transacao, BancoComSaldo, Cartao } from '@/types'
import { TransactionItem } from './TransactionItem'
import { formatBRL } from '@/lib/utils'

interface Props {
  transacoes: Transacao[]
  bancos: BancoComSaldo[]
  cartoes?: Cartao[]
  onEdit: (t: Transacao) => void
  onDelete: (id: string) => void
}

function formatGroupDate(dateStr: string): string {
  const hoje = new Date().toISOString().split('T')[0]
  const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === hoje) return 'Hoje'
  if (dateStr === ontem) return 'Ontem'
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

export function TransactionList({ transacoes, bancos, cartoes = [], onEdit, onDelete }: Props) {
  const grupos = useMemo(() => {
    const map = new Map<string, Transacao[]>()
    transacoes.forEach(t => {
      const group = map.get(t.data) ?? []
      group.push(t)
      map.set(t.data, group)
    })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transacoes])

  if (transacoes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
          style={{ background: 'var(--bg-elevated)' }}
        >
          📊
        </div>
        <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
          Nenhum lançamento registrado.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {grupos.map(([data, txs]) => {
        const totalDia = txs.reduce(
          (s, t) => s + (t.tipo === 'gasto' ? -t.valor : t.valor),
          0,
        )
        return (
          <div key={data}>
            <div
              className="flex items-center justify-between py-1.5 text-xs font-semibold sticky top-0"
              style={{ color: 'var(--text-tertiary)', background: 'var(--bg-base)' }}
            >
              <span>{formatGroupDate(data)}</span>
              <span style={{ color: totalDia >= 0 ? 'var(--green)' : 'var(--red)' }}>
                {totalDia >= 0 ? '+' : ''}{formatBRL(Math.abs(totalDia))}
              </span>
            </div>
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border)',
              }}
            >
              {txs.map((t, i) => (
                <div
                  key={t.id}
                  style={i > 0 ? { borderTop: '1px solid var(--border)' } : {}}
                >
                  <TransactionItem
                    transacao={t}
                    bancos={bancos}
                    cartoes={cartoes}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
