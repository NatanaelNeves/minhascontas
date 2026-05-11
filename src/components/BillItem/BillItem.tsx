import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { Conta } from '@/types'
import { formatBRL, getAlertaVencimento, getBillEmoji, getBillAvatarBg, mesIdAddMeses, mesIdToShortLabel } from '@/lib/utils'
import { useAppStore } from '@/store/useAppStore'
import { ConfirmDeleteParcelaModal } from '@/components/Modals/ConfirmDeleteParcelaModal'

interface Props {
  conta: Conta
  onTogglePago: (id: string, pago: boolean) => void
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => void
  onDeleteParcelamento?: (parcelamentoId: string, parcelaAtualFrom: number, parcelaTotal: number) => void
  cartaoCor?: string
}

const FORMA_LABEL: Record<string, string> = {
  pix: 'Pix',
  debito: 'Débito',
  boleto: 'Boleto',
  credito: 'Crédito',
}

export function BillItem({ conta, onTogglePago, onEdit, onDelete, onDeleteParcelamento, cartaoCor }: Props) {
  const [confirmando, setConfirmando] = useState(false)
  const [confirmParcelaOpen, setConfirmParcelaOpen] = useState(false)
  const { mesAtivo } = useAppStore()
  const alerta = getAlertaVencimento(conta.vencimento, conta.pago)
  const emoji = getBillEmoji(conta.nome)
  const avatarBg = getBillAvatarBg(conta.nome)

  const parcelasInfo = conta.parcelas ? (() => {
    const mr = conta.parcelas.total - conta.parcelas.atual
    const cor = mr > 6 ? 'var(--green)' : mr >= 3 ? 'var(--amber)' : 'var(--red)'
    const corMuted = mr > 6 ? 'var(--green-muted)' : mr >= 3 ? 'var(--amber-muted)' : 'var(--red-muted)'
    const corBorder = mr > 6 ? 'rgba(52,199,123,0.22)' : mr >= 3 ? 'rgba(245,158,11,0.22)' : 'rgba(239,68,68,0.22)'
    const mesTermina = mesIdAddMeses(mesAtivo, mr)
    const totalRestante = conta.valor * (mr + 1)
    return { mr, cor, corMuted, corBorder, mesTermina, totalRestante }
  })() : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 6 }}
      className="group flex items-center gap-3 px-4 py-[12px] transition-colors"
      style={{
        borderBottom: '0.5px solid var(--divider)',
        cursor: 'default',
        ...(conta.origem?.tipo === 'fatura_propagada' && cartaoCor
          ? { borderLeft: `2.5px solid ${cartaoCor}` }
          : {}),
      }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.025)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {/* Checkbox toggle */}
      <button
        onClick={() => onTogglePago(conta.id, conta.pago)}
        className="w-[18px] h-[18px] rounded-[5px] flex-shrink-0 flex items-center justify-center transition-all"
        style={
          conta.pago
            ? {
                background: 'var(--green)',
                border: '1.5px solid var(--green)',
              }
            : {
                border: '1.5px solid rgba(255,255,255,0.15)',
                background: 'transparent',
              }
        }
      >
        {conta.pago && (
          <motion.svg
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            width="9"
            height="9"
            viewBox="0 0 9 9"
            fill="none"
          >
            <path
              d="M1.5 4.5l2 2L7.5 2.5"
              stroke="white"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </button>

      {/* Emoji avatar */}
      <div
        className="w-[32px] h-[32px] rounded-[9px] flex-shrink-0 flex items-center justify-center text-[14px]"
        style={{ background: avatarBg }}
      >
        {emoji}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-medium truncate"
          style={
            conta.pago
              ? {
                  color: 'var(--text-tertiary)',
                  textDecoration: 'line-through',
                  textDecorationColor: 'rgba(255,255,255,0.18)',
                }
              : { color: '#fff' }
          }
        >
          {conta.nome}
        </p>
        {conta.pagamento && (
          <p style={{ fontSize: 10, color: 'var(--green)', marginTop: 1, letterSpacing: '-0.01em' }}>
            Pago em {new Date(conta.pagamento.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </p>
        )}
        <p className="text-[11px] mt-[1px]" style={{ color: 'var(--text-tertiary)' }}>
          {FORMA_LABEL[conta.formaPagamento]}
        </p>
      </div>

      {/* Right column */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className="text-[13px] font-semibold tabular-nums"
          style={conta.pago ? { color: 'var(--text-tertiary)' } : { color: '#fff', letterSpacing: '-0.02em' }}
        >
          {formatBRL(conta.valor)}
        </span>

        <div className="flex items-center gap-1 flex-wrap justify-end">
          {parcelasInfo && (
            <span
              className="text-[10px] font-medium px-1.5 py-[2px] rounded-full"
              style={{
                background: parcelasInfo.corMuted,
                color: parcelasInfo.cor,
                border: `0.5px solid ${parcelasInfo.corBorder}`,
                letterSpacing: '0.01em',
              }}
            >
              {conta.parcelas!.atual}/{conta.parcelas!.total}
            </span>
          )}

          {alerta === 'vencida' && !conta.pago && (
            <span
              className="text-[10px] font-medium px-1.5 py-[2px] rounded-full"
              style={{
                background: 'var(--red-muted)',
                color: 'var(--red)',
                border: '0.5px solid rgba(239,68,68,0.2)',
              }}
            >
              Vencida
            </span>
          )}

          {alerta === 'vence_em_breve' && !conta.pago && (
            <span
              className="text-[10px] font-medium px-1.5 py-[2px] rounded-full"
              style={{
                background: 'var(--amber-muted)',
                color: 'var(--amber)',
                border: '0.5px solid rgba(245,158,11,0.2)',
              }}
            >
              Vence em breve
            </span>
          )}

          {conta.origem?.tipo === 'fatura_propagada' && (
            <span
              className="text-[10px] font-medium px-1.5 py-[2px] rounded-full"
              style={{
                background: 'var(--amber-muted)',
                color: 'var(--amber)',
                border: '0.5px solid rgba(245,158,11,0.2)',
              }}
            >
              Fatura anterior
            </span>
          )}
        </div>

        {parcelasInfo && (
          <p style={{ fontSize: 9, color: parcelasInfo.cor, letterSpacing: '-0.01em', textAlign: 'right' }}>
            {mesIdToShortLabel(parcelasInfo.mesTermina)} · {formatBRL(parcelasInfo.totalRestante)}
          </p>
        )}
      </div>

      {/* Hover actions */}
      <AnimatePresence mode="wait">
        {confirmando ? (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.1 }}
            className="flex items-center gap-1 ml-1 flex-shrink-0"
          >
            <button
              onClick={() => { onDelete(conta.id); setConfirmando(false) }}
              className="text-[11px] font-medium px-2 py-[3px] rounded-md transition-colors"
              style={{
                background: 'var(--red-muted)',
                color: 'var(--red)',
                border: '0.5px solid rgba(239,68,68,0.22)',
              }}
            >
              Excluir
            </button>
            <button
              onClick={() => setConfirmando(false)}
              className="text-[11px] font-medium px-2 py-[3px] rounded-md"
              style={{
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-tertiary)',
                border: '0.5px solid rgba(255,255,255,0.08)',
              }}
            >
              Não
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="actions"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
          >
            <button
              onClick={() => onEdit(conta)}
              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <Pencil className="w-[11px] h-[11px]" />
            </button>
            <button
              onClick={() => {
                if (conta.parcelamentoId) {
                  setConfirmParcelaOpen(true)
                } else {
                  setConfirmando(true)
                }
              }}
              className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <Trash2 className="w-[11px] h-[11px]" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {conta.parcelamentoId && (
        <ConfirmDeleteParcelaModal
          open={confirmParcelaOpen}
          parcelaAtual={conta.parcelas?.atual ?? 1}
          parcelaTotal={conta.parcelas?.total ?? 1}
          onDeleteSo={() => { onDelete(conta.id); setConfirmParcelaOpen(false) }}
          onDeleteRestantes={() => {
            if (onDeleteParcelamento && conta.parcelamentoId && conta.parcelas) {
              onDeleteParcelamento(conta.parcelamentoId, conta.parcelas.atual, conta.parcelas.total)
            }
            setConfirmParcelaOpen(false)
          }}
          onClose={() => setConfirmParcelaOpen(false)}
        />
      )}
    </motion.div>
  )
}
