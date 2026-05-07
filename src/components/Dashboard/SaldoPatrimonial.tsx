import { motion } from 'framer-motion'
import { CartaoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

const BENEFIT_TIPOS = ['vale_alimentacao', 'vale_refeicao', 'vale_combustivel'] as const

interface Props {
  totalSaldo: number
  cartoesComSaldo: CartaoComSaldo[]
  onNavigateToBancos: () => void
  semBancos: boolean
}

export function SaldoPatrimonial({
  totalSaldo,
  cartoesComSaldo,
  onNavigateToBancos,
  semBancos,
}: Props) {
  const saldoBeneficios = cartoesComSaldo
    .filter(c => (BENEFIT_TIPOS as ReadonlyArray<string>).includes(c.tipo))
    .reduce((s, c) => s + c.limiteDisponivel, 0)

  const totalDisponivel = totalSaldo + saldoBeneficios

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header label */}
      <div style={{ padding: '16px 20px 0' }}>
        <p style={{
          fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          Disponível agora
        </p>
      </div>

      {/* Sub-itens */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {/* Bancos */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
            Em bancos
          </span>
          {semBancos ? (
            <button
              onClick={onNavigateToBancos}
              style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                textDecoration: 'underline', textUnderlineOffset: 2, letterSpacing: '-0.01em',
              }}
            >
              Adicionar banco
            </button>
          ) : (
            <span style={{
              fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
              letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
            }}>
              {formatBRL(totalSaldo)}
            </span>
          )}
        </div>

        {/* Benefícios (só mostra se há cartões benefício) */}
        {saldoBeneficios > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
              Em benefícios
            </span>
            <span style={{
              fontSize: 14, fontWeight: 600, color: 'var(--text-primary)',
              letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
            }}>
              {formatBRL(saldoBeneficios)}
            </span>
          </div>
        )}
      </div>

      {/* Separator */}
      <div style={{ height: '0.5px', background: 'var(--divider)', margin: '0 20px' }} />

      {/* Total */}
      <div style={{ padding: '14px 20px 18px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
          letterSpacing: '0.09em', textTransform: 'uppercase',
        }}>
          Total disponível
        </span>
        <motion.span
          key={totalDisponivel}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            fontSize: 28, fontWeight: 700,
            color: totalDisponivel >= 0 ? 'var(--green)' : 'var(--red)',
            letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums',
          }}
        >
          {semBancos ? '—' : formatBRL(totalDisponivel)}
        </motion.span>
      </div>
    </motion.div>
  )
}
