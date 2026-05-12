import React from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import { prevMesId, nextMesId, formatMesLabel } from '@/lib/utils'

function ChevronBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-6 h-6 flex items-center justify-center transition-colors rounded-md"
      style={{ color: 'var(--text-tertiary)' }}
      onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
    >
      {children}
    </button>
  )
}

export function Header() {
  const { user, logout } = useAuth()
  const { mesAtivo, setMesAtivo, currentPage, setCurrentPage, abaAtiva } = useAppStore()

  return (
    <header
      className="sticky top-0 z-20 backdrop-blur-xl"
      style={{
        background: 'var(--header-bg)',
        borderBottom: '0.5px solid var(--border)',
      }}
    >
      <div className="max-w-[480px] mx-auto px-4 h-[52px] flex items-center justify-between gap-3 w-full">

        {/* Logo */}
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="flex items-center gap-2.5 shrink-0"
        >
          <div
            className="w-[28px] h-[28px] rounded-[8px] flex items-center justify-center shrink-0"
            style={{
              background: 'var(--text-primary)',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="3" width="12" height="8" rx="2" fill="#09090b" />
              <path d="M3.5 6.5h7M3.5 9h4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <span
            className="text-[13px] font-semibold hidden sm:block"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Minhas Contas
          </span>
        </button>

        {/* Month nav pill — centered */}
        {currentPage === 'dashboard' ? (
          <div
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{
              background: 'var(--glass-bg)',
              border: '0.5px solid var(--border-strong)',
            }}
          >
            <ChevronBtn onClick={() => setMesAtivo(prevMesId(mesAtivo))}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ChevronBtn>
            <span
              className="text-[13px] font-medium capitalize min-w-[128px] text-center select-none"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.01em' }}
            >
              {formatMesLabel(mesAtivo)}
            </span>
            <ChevronBtn onClick={() => setMesAtivo(nextMesId(mesAtivo))}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 11l4-4-4-4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </ChevronBtn>
          </div>
        ) : (
          <span
            className="text-[13px] font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Histórico
          </span>
        )}

        {/* Right — pdf + history + avatar */}
        <div className="flex items-center gap-2 shrink-0">
          {currentPage === 'dashboard' && abaAtiva === 'home' && (
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('export-pdf'))}
              className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
              title="Exportar PDF"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="1" width="7" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 4h3M5 6.5h3M5 9h1.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
                <path d="M9 9l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <circle cx="11" cy="12" r="1.5" fill="currentColor" />
              </svg>
            </button>
          )}
          <button
            onClick={() => setCurrentPage(currentPage === 'history' ? 'dashboard' : 'history')}
            className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors"
            title={currentPage === 'history' ? 'Dashboard' : 'Histórico'}
            style={{ color: 'var(--text-tertiary)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-tertiary)')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M7 4.5V7.2l1.4 1.4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </button>

          {user?.photoURL ? (
            <button
              onClick={logout}
              title="Sair"
              className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center"
              style={{ border: '1.5px solid var(--border-medium)' }}
            >
              <img
                src={user.photoURL}
                alt={user.displayName ?? ''}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover block"
              />
            </button>
          ) : (
            <button
              onClick={logout}
              title="Sair"
              className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold text-white"
              style={{
                background: 'rgba(124,114,216,0.3)',
                border: '1.5px solid rgba(124,114,216,0.4)',
                letterSpacing: '0.02em',
              }}
            >
              {user?.displayName?.slice(0, 2).toUpperCase() ?? 'MC'}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
