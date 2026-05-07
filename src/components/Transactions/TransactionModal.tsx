import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Transacao, TransacaoInput, BancoComSaldo, CategoriaGasto, TipoTransacao } from '@/types'

const CATEGORIAS: { value: CategoriaGasto; label: string }[] = [
  { value: 'alimentacao', label: 'Alimentação' },
  { value: 'transporte', label: 'Transporte' },
  { value: 'saude', label: 'Saúde' },
  { value: 'lazer', label: 'Lazer' },
  { value: 'educacao', label: 'Educação' },
  { value: 'moradia', label: 'Moradia' },
  { value: 'vestuario', label: 'Vestuário' },
  { value: 'servicos', label: 'Serviços' },
  { value: 'despesaFixa', label: 'Despesa Fixa' },
  { value: 'outros', label: 'Outros' },
]

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 14,
  color: 'var(--text-primary)',
  outline: 'none',
  width: '100%',
}

interface Props {
  open: boolean
  editando: Transacao | null
  bancos: BancoComSaldo[]
  onSave: (data: TransacaoInput) => void
  onClose: () => void
}

export function TransactionModal({ open, editando, bancos, onSave, onClose }: Props) {
  const hoje = new Date().toISOString().split('T')[0]
  const [tipo, setTipo] = useState<TipoTransacao>('gasto')
  const [descricao, setDescricao] = useState('')
  const [valor, setValor] = useState('')
  const [bancoId, setBancoId] = useState('')
  const [categoria, setCategoria] = useState<CategoriaGasto>('outros')
  const [data, setData] = useState(hoje)
  const [observacao, setObservacao] = useState('')

  useEffect(() => {
    if (editando) {
      setTipo(editando.tipo)
      setDescricao(editando.descricao)
      setValor(String(editando.valor))
      setBancoId(editando.bancoId)
      setData(editando.data)
      setObservacao(editando.observacao ?? '')
      if (editando.tipo === 'gasto') setCategoria(editando.categoria)
    } else {
      setTipo('gasto')
      setDescricao('')
      setValor('')
      setBancoId(bancos[0]?.id ?? '')
      setCategoria('outros')
      setData(hoje)
      setObservacao('')
    }
  }, [editando, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const base = {
      descricao: descricao.trim(),
      valor: parseFloat(valor),
      bancoId,
      data,
      despesaFixa: false,
      ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
    }
    const input: TransacaoInput =
      tipo === 'gasto'
        ? { ...base, tipo: 'gasto', categoria }
        : { ...base, tipo: 'entrada' }
    onSave(input)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm"
        style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--text-primary)' }}>
            {editando ? 'Editar lançamento' : 'Novo lançamento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--border)', background: 'var(--bg-surface)' }}
          >
            {(['gasto', 'entrada'] as TipoTransacao[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className="flex-1 py-2 text-sm font-medium capitalize transition-colors"
                style={{
                  background: tipo === t
                    ? (t === 'gasto' ? 'var(--red)' : 'var(--green)')
                    : 'transparent',
                  color: tipo === t ? '#fff' : 'var(--text-tertiary)',
                }}
              >
                {t === 'gasto' ? 'Gasto' : 'Entrada'}
              </button>
            ))}
          </div>

          <input
            style={inputStyle}
            placeholder="Descrição"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            required
          />

          <input
            style={inputStyle}
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Valor"
            value={valor}
            onChange={e => setValor(e.target.value)}
            required
          />

          <select
            style={{ ...inputStyle }}
            value={bancoId}
            onChange={e => setBancoId(e.target.value)}
            required
          >
            {bancos.map(b => (
              <option key={b.id} value={b.id} style={{ background: 'var(--bg-elevated)' }}>
                {b.nome}
              </option>
            ))}
          </select>

          {tipo === 'gasto' && (
            <select
              style={{ ...inputStyle }}
              value={categoria}
              onChange={e => setCategoria(e.target.value as CategoriaGasto)}
            >
              {CATEGORIAS.map(c => (
                <option key={c.value} value={c.value} style={{ background: 'var(--bg-elevated)' }}>
                  {c.label}
                </option>
              ))}
            </select>
          )}

          <input
            style={inputStyle}
            type="date"
            value={data}
            onChange={e => setData(e.target.value)}
            required
          />

          <input
            style={inputStyle}
            placeholder="Observação (opcional)"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />

          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 h-10 rounded-full text-sm font-medium transition-opacity hover:opacity-80"
              style={{ background: 'var(--text-primary)', color: 'var(--bg-base)' }}
            >
              {editando ? 'Salvar' : 'Adicionar'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
