import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { BancoComSaldo, CartaoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  bancos: BancoComSaldo[]
  cartoesComSaldo: CartaoComSaldo[]
  onNavigateToBancos: () => void
}

export function SaldoPatrimonial({ bancos, cartoesComSaldo, onNavigateToBancos }: Props) {
  const corrente = useMemo(() => bancos.filter(b => b.tipo === 'corrente'), [bancos])
  const investimento = useMemo(() => bancos.filter(b => b.tipo === 'investimento'), [bancos])

  const totalCorrente = useMemo(() => corrente.reduce((s, b) => s + b.saldoAtual, 0), [corrente])
  const totalInvestido = useMemo(() => investimento.reduce((s, b) => s + b.saldoAtual, 0), [investimento])

  const beneficioAlim = useMemo(() =>
    cartoesComSaldo
      .filter(c => c.tipo === 'vale_alimentacao' || c.tipo === 'vale_refeicao')
      .reduce((s, c) => s + c.limiteDisponivel, 0),
    [cartoesComSaldo],
  )
  const beneficioComb = useMemo(() =>
    cartoesComSaldo
      .filter(c => c.tipo === 'vale_combustivel')
      .reduce((s, c) => s + c.limiteDisponivel, 0),
    [cartoesComSaldo],
  )
  const temBeneficios = beneficioAlim > 0 || beneficioComb > 0
  const semBancos = corrente.length === 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Bloco A: Dinheiro disponível */}
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
        <div style={{ padding: '20px 20px 14px' }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)',
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6,
          }}>
            Dinheiro disponível
          </p>
          <motion.span
            key={totalCorrente}
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.25 }}
            style={{
              display: 'block',
              fontSize: 32, fontWeight: 600,
              color: semBancos ? 'var(--text-tertiary)' : totalCorrente >= 0 ? 'var(--green)' : 'var(--red)',
              letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums',
              lineHeight: 1.1,
            }}
          >
            {semBancos ? '—' : formatBRL(totalCorrente)}
          </motion.span>
        </div>

        <div style={{ borderTop: '0.5px solid var(--divider)', padding: '10px 20px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {semBancos ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🏦 Em bancos</span>
              <button
                onClick={onNavigateToBancos}
                style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--text-tertiary)',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  textDecoration: 'underline', textUnderlineOffset: 2,
                  fontFamily: 'inherit',
                }}
              >
                Cadastrar bancos
              </button>
            </div>
          ) : (
            corrente.slice(0, 3).map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {b.cor && <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.cor, display: 'inline-block', flexShrink: 0 }} />}
                  {b.nome}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: b.saldoAtual >= 0 ? 'var(--text-secondary)' : 'var(--red)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(b.saldoAtual)}
                </span>
              </div>
            ))
          )}
          {corrente.length > 3 && (
            <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
              + {corrente.length - 3} outro{corrente.length - 3 > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </motion.div>

      {/* Bloco B: Benefícios */}
      {temBeneficios && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 20px',
          }}
        >
          <p style={{
            fontSize: 10, fontWeight: 700, color: 'var(--text-tertiary)',
            letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
          }}>
            Benefícios
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {beneficioAlim > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>🍽️ Alimentação/Refeição</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(beneficioAlim)}
                </span>
              </div>
            )}
            {beneficioComb > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>⛽ Combustível</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(beneficioComb)}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Bloco C: Investimentos */}
      {investimento.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid rgba(124,114,216,0.2)',
            borderRadius: 'var(--radius-lg)',
            padding: '14px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p style={{
              fontSize: 10, fontWeight: 700, color: 'var(--purple)',
              letterSpacing: '0.12em', textTransform: 'uppercase',
            }}>
              Investimentos
            </p>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--purple)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
              {formatBRL(totalInvestido)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {investimento.map(b => (
              <div key={b.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {b.cor && <span style={{ width: 6, height: 6, borderRadius: '50%', background: b.cor, display: 'inline-block', flexShrink: 0 }} />}
                  {b.nome}
                </span>
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(124,114,216,0.8)', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
                  {formatBRL(b.saldoAtual)}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
