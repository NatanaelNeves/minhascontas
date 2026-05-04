# Minhas Contas — MVP Design

**Date:** 2026-05-04  
**Scope:** MVP funcional (auth + CRUD + dashboard)  
**Stack:** React 18 + TypeScript + Vite + Tailwind + shadcn/ui + Firebase + Zustand

---

## Architecture

Single-page app com roteamento simples (login → dashboard). Dados em Firestore com sync em tempo real via `onSnapshot`. Auth Google OAuth via Firebase Auth.

```
Login → [Google OAuth] → Dashboard
                          ├── Header (mês ativo, troca mês, logout)
                          ├── ResumoCards (total pago, pendente, sobra, semáforo)
                          ├── BillList (agrupado: fixo | cartão | extra)
                          │   └── BillItem (checkbox pago, badge vencimento, editar/excluir)
                          └── FAB → Modal add/edit conta
```

---

## Data Flow

```
Firestore (onSnapshot)
  → useFirestore (abstração)
    → useBills (CRUD + totais calculados)
    → useMonth (mês ativo, copiar fixos)
  → Zustand (mesAtivo, tema, loading)
  → Componentes (só renderizam)
```

---

## Phases

### Fase 1 — Infraestrutura
- Vite scaffold com React + TypeScript
- Tailwind CSS + shadcn/ui
- `.env.local` com credenciais Firebase
- `src/lib/firebase.ts` — inicialização Auth + Firestore

### Fase 2 — Auth
- `src/hooks/useAuth.ts` — login/logout/estado Google OAuth
- `src/pages/Login.tsx` — botão Google, dark theme
- Guard de rota — não autenticado → Login

### Fase 3 — Data Layer
- `src/types/index.ts` — Conta, Mes, ResumoMes, Categoria, FormaPagamento
- `src/hooks/useFirestore.ts` — onSnapshot, add, update, delete
- `src/hooks/useBills.ts` — CRUD + cálculo de totais + semáforo
- `src/hooks/useMonth.ts` — mês ativo, criar mês, copiar fixos
- `src/store/useAppStore.ts` — Zustand: mesAtivo, tema, isLoading
- `src/lib/utils.ts` — formatBRL, calcResumo, alertaVencimento

### Fase 4 — UI
- `src/pages/Dashboard.tsx` — layout principal
- `src/components/Dashboard/ResumoCards.tsx` — 4 cards + semáforo
- `src/components/BillList/BillList.tsx` — 3 grupos por categoria
- `src/components/BillItem/BillItem.tsx` — linha com checkbox, badges, ações
- `src/components/Modals/BillModal.tsx` — form add/edit com validação

---

## Business Rules

**Semáforo:**
- sobra ≥ 20% receita → verde
- sobra 0–20% → amarelo
- sobra negativa → vermelho

**Alertas vencimento:**
- venceu + não pago → badge vermelho "Vencida"
- vence em ≤ 3 dias + não pago → badge amarelo "Vence em breve"

**Cálculos:**
- `totalPago` = soma contas com `pago: true`
- `totalPendente` = soma contas com `pago: false`
- `sobra` = receita − totalGeral

---

## Key Decisions

- Firestore path: `users/{userId}/months/{YYYY-MM}/bills/{billId}`
- Sem React Router — condicional simples (isAuthenticated ? Dashboard : Login)
- Framer Motion para entrada de cards e check animation
- Tema escuro por padrão, preferência em localStorage
- Nomes de domínio em PT-BR, infraestrutura em inglês

---

## Out of Scope (MVP)

- Gráficos (Recharts)
- Histórico de meses
- Export PDF
- PWA / service worker
- Parcelas automáticas na virada de mês
