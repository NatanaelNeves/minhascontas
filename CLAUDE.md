# CLAUDE.md — Minhas Contas

Este arquivo guia o Claude Code em todas as decisões do projeto. Leia antes de qualquer ação.

---

## 🧭 Visão geral do projeto

**Minhas Contas** é um app web de controle financeiro mensal pessoal.
O usuário registra suas contas, marca o que pagou, acompanha o que falta e visualiza quanto vai sobrar no mês.
O app sincroniza entre dispositivos via Firebase e é instalável como PWA.

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Animações | Framer Motion |
| Gráficos | Recharts |
| Estado global | Zustand |
| Auth | Firebase Auth (Google OAuth) |
| Banco de dados | Firestore (tempo real) |
| PWA | vite-plugin-pwa |
| Exportar PDF | jsPDF + html2canvas |
| Linting | ESLint + Prettier |

---

## 📁 Estrutura de pastas

```
src/
├── components/
│   ├── Dashboard/         # Cards de resumo, barra de progresso, semáforo
│   ├── BillList/          # Lista de contas agrupadas por categoria
│   ├── BillItem/          # Item individual de conta com checkbox e ações
│   ├── Charts/            # Gráfico pizza (categorias) e barras (histórico)
│   ├── History/           # Histórico de meses anteriores
│   ├── Modals/            # Modal de adicionar/editar conta, confirmação de exclusão
│   └── UI/                # Componentes reutilizáveis (Button, Card, Badge, etc.)
├── hooks/
│   ├── useAuth.ts         # Login, logout, estado do usuário
│   ├── useBills.ts        # CRUD de contas, totais calculados
│   ├── useMonth.ts        # Mês ativo, troca de mês, copiar fixos
│   └── useFirestore.ts    # Abstração da comunicação com Firestore
├── store/
│   └── useAppStore.ts     # Zustand: estado global (mês ativo, tema, loading)
├── types/
│   └── index.ts           # Todos os tipos TypeScript do projeto
├── lib/
│   ├── firebase.ts        # Inicialização do Firebase
│   └── utils.ts           # Formatação de moeda, datas, cálculos
└── pages/
    ├── Login.tsx           # Tela de login com Google
    ├── Dashboard.tsx       # Tela principal
    └── History.tsx         # Tela de histórico
```

---

## 🗄️ Estrutura do Firestore

```
users/{userId}/
  months/{monthId}/           # ex: "2025-05"
    info:
      receita: number
      criadoEm: timestamp
    bills/{billId}:
      nome: string
      valor: number
      categoria: "fixo" | "cartao" | "extra"
      formaPagamento: "pix" | "debito" | "boleto" | "credito"
      vencimento: string | null     # "YYYY-MM-DD"
      pago: boolean
      parcelas: {
        atual: number
        total: number
      } | null
      criadoEm: timestamp
```

**Regras de segurança:** cada usuário acessa apenas `users/{seu próprio userId}`.

---

## 🧩 Tipos TypeScript

```ts
// src/types/index.ts

export type Categoria = "fixo" | "cartao" | "extra"
export type FormaPagamento = "pix" | "debito" | "boleto" | "credito"

export interface Parcelas {
  atual: number
  total: number
}

export interface Conta {
  id: string
  nome: string
  valor: number
  categoria: Categoria
  formaPagamento: FormaPagamento
  vencimento: string | null
  pago: boolean
  parcelas: Parcelas | null
  criadoEm: Date
}

export interface MesInfo {
  receita: number
  criadoEm: Date
}

export interface Mes {
  id: string           // "YYYY-MM"
  info: MesInfo
  contas: Conta[]
}

export interface ResumoMes {
  totalPago: number
  totalPendente: number
  totalGeral: number
  sobra: number
  percentualPago: number
  saudePrimaria: "verde" | "amarelo" | "vermelho"
}
```

---

## 🧮 Regras de negócio

### Semáforo de saúde financeira
- 🟢 Verde: sobra >= 20% da receita
- 🟡 Amarelo: sobra entre 0% e 20% da receita
- 🔴 Vermelho: sobra negativa (contas > receita)

### Alertas de vencimento
- Vence hoje ou já venceu e não foi pago → badge vermelho "Vencida"
- Vence em até 3 dias e não foi pago → badge amarelo "Vence em breve"

### Parcelas
- Ao virar o mês e copiar contas fixas, incrementar `parcelas.atual` automaticamente
- Se `parcelas.atual === parcelas.total`, não copiar a conta pro próximo mês

### Novo mês
- Ao criar um novo mês, oferecer modal perguntando se quer copiar as contas da categoria `"fixo"`
- Contas copiadas chegam com `pago: false`

---

## 🎨 Design

- **Tema padrão:** escuro
- **Troca de tema:** salvar preferência no `localStorage`
- **Mobile-first:** breakpoints Tailwind `sm:` e `md:`
- **Cores por status:**
  - Pago → `text-green-400`
  - Vencida → `text-red-400`
  - Vence em breve → `text-yellow-400`
  - Pendente normal → `text-zinc-400`
- **Animações:** usar Framer Motion para entrada de cards, check ao marcar pago e abertura de modais

---

## ✅ Padrões de código

- **Zero `any`** — TypeScript estrito em tudo
- **Hooks para lógica** — componentes só renderizam, hooks calculam
- **Componentes pequenos** — máximo ~150 linhas por arquivo
- **Zustand só para estado global** — estado local fica em `useState`
- **Firestore via `onSnapshot`** — sincronização em tempo real
- **Nomes em português** para variáveis de domínio (`conta`, `mes`, `receita`), inglês para infraestrutura (`handleSubmit`, `isLoading`)
- **Formatação de moeda:** sempre usar `Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })`

---

## 📦 Dados iniciais — Maio 2025

Popular via seed ou direto na UI ao primeiro acesso:

**Compromissos Fixos:**
| Nome | Valor | Pagamento | Pago |
|---|---|---|---|
| Faculdade | R$ 315,00 | Pix | ✅ |
| Plano de Internet | R$ 48,00 | Pix | ✅ |
| Celular | R$ 284,00 | Pix | ✅ — parcela 4/12 |
| Seguro | R$ 110,00 | Pix | ⏳ |

**Cartões / Parcelas:**
| Nome | Valor | Pagamento | Pago |
|---|---|---|---|
| Fatura Nubank | R$ 277,08 | — | ✅ |
| Fatura PicPay | R$ 221,28 | — | ✅ |
| Fatura NEON | R$ 427,49 | — | ✅ |
| Empréstimo 1 | R$ 157,28 | Pix | ✅ |
| Empréstimo 2 | R$ 172,00 | Pix | ✅ |
| Shopee | R$ 76,95 | Pix | ✅ |
| Mercado Livre | R$ 83,50 | — | ✅ |

**Extras do mês:**
| Nome | Valor | Pagamento | Pago |
|---|---|---|---|
| Depilação Dandara | R$ 93,60 | Pix | ✅ |
| Formatura | R$ 350,00 | — | ⏳ |

---

## 🚀 Scripts

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run preview      # Preview do build
npm run lint         # ESLint
npm run format       # Prettier
```

---

## 🔐 Variáveis de ambiente

Criar `.env.local` na raiz com as credenciais do Firebase:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Nunca commitar o `.env.local`. Adicionar ao `.gitignore`.

---

## 📋 Ordem de implementação sugerida

1. Setup do projeto (Vite + React + TS + Tailwind + shadcn)
2. Configuração do Firebase (Auth + Firestore)
3. Tela de Login
4. Tipos TypeScript e estrutura do Firestore
5. Hooks (`useAuth`, `useFirestore`, `useBills`, `useMonth`)
6. Zustand store
7. Dashboard — cards de resumo
8. Lista de contas com categorias
9. Modal de adicionar/editar conta
10. Marcar como pago com animação
11. Alertas de vencimento
12. Gráficos (Recharts)
13. Histórico de meses
14. Exportar PDF
15. PWA (manifest + service worker)
16. Tema claro/escuro
17. Polish final (animações, responsividade, edge cases)