import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'

export function Login() {
  const { login, isLoading } = useAuth()

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: '#09090b' }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[340px] flex flex-col items-center gap-10"
      >
        {/* Logo mark */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center gap-5"
        >
          <div
            className="w-[56px] h-[56px] rounded-[16px] flex items-center justify-center"
            style={{ background: '#ffffff' }}
          >
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="2" y="6" width="22" height="14" rx="3.5" fill="#09090b" />
              <path d="M6.5 12h13M6.5 17h8" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>

          <div className="text-center">
            <h1
              className="text-[26px] font-bold text-white"
              style={{ letterSpacing: '-0.05em' }}
            >
              Minhas Contas
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.32)', marginTop: 5, letterSpacing: '-0.01em' }}>
              Controle financeiro mensal
            </p>
          </div>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18, duration: 0.38 }}
          className="w-full rounded-[16px] overflow-hidden"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '0.5px solid rgba(255,255,255,0.08)',
          }}
        >
          <div style={{ padding: '22px 22px 16px' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', lineHeight: 1.65, letterSpacing: '-0.005em' }}>
              Faça login com sua conta Google para acessar seu controle financeiro de forma segura e sincronizada.
            </p>
          </div>

          <div style={{ padding: '0 22px 22px' }}>
            <button
              onClick={login}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 rounded-[11px] transition-opacity"
              style={{
                padding: '13px 16px',
                background: isLoading ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.95)',
                color: '#111',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: isLoading ? 'not-allowed' : 'pointer',
                border: 'none',
                opacity: isLoading ? 0.7 : 1,
                letterSpacing: '-0.02em',
              }}
            >
              {isLoading ? (
                <div
                  className="w-4 h-4 rounded-full border-2 animate-spin"
                  style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#333' }}
                />
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              )}
              {isLoading ? 'Entrando...' : 'Entrar com Google'}
            </button>
          </div>
        </motion.div>

        <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.14)', textAlign: 'center', letterSpacing: '0.01em' }}>
          Seus dados ficam salvos somente na sua conta
        </p>
      </motion.div>
    </div>
  )
}
