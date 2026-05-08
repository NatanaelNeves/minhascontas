import { motion } from 'framer-motion'
import { CartaoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

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
  const saldoAlimentacaoRefeicao = cartoesComSaldo
    .filter(c => c.tipo === 'vale_alimentacao' || c.tipo === 'vale_refeicao')
    .reduce((s, c) => s + c.limiteDisponivel, 0)

  const saldoCombustivel = cartoesComSaldo
    .filter(c => c.tipo === 'vale_combustivel')
    .reduce((s, c) => s + c.limiteDisponivel, 0)

  const totalDisponivel = totalSaldo + saldoAlimentacaoRefeicao + saldoCombustivel

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Header: label + THE number */}
      <div style={{ padding: '20px 20px 16px' }}>
        <p style={{
          fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)',
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
        }}>
          Disponível agora
        </p>
        <motion.span
          key={totalDisponivel}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            display: 'block',
            fontSize: 32, fontWeight: 600,
            color: semBancos ? 'var(--text-tertiary)' : totalDisponivel >= 0 ? 'var(--green)' : 'var(--red)',
            letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.1,
          }}
        >
          {semBancos ? '—' : formatBRL(totalDisponivel)}
        </motion.span>
      </div>

      {/* Breakdown lines */}
      <div style={{ borderTop: '0.5px solid var(--divider)', padding: '12px 20px 16px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
            🏦 Em bancos
          </span>
          {semBancos ? (
            <button
              onClick={onNavigateToBancos}
              style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                textDecoration: 'underline', textUnderlineOffset: 2, letterSpacing: '-0.01em',
                fontFamily: 'inherit',
              }}
            >
              Cadastrar bancos
            </button>
          ) : (
            <span style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            }}>
              {formatBRL(totalSaldo)}
            </span>
          )}
        </div>

        {saldoAlimentacaoRefeicao > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
              🍽️ Alimentação/Refeição
            </span>
            <span style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            }}>
              {formatBRL(saldoAlimentacaoRefeicao)}
            </span>
          </div>
        )}

        {saldoCombustivel > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
              ⛽ Combustível
            </span>
            <span style={{
              fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)',
              letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums',
            }}>
              {formatBRL(saldoCombustivel)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  )
}
