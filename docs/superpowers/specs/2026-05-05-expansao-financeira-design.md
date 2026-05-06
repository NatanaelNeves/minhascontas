# Design Spec — Expansão Financeira: Bancos, Gastos Diários, A Receber

**Data:** 2026-05-05  
**Status:** Aprovado  
**Fonte:** Migração de planilha CSV (Visão Geral, Gastos Diários, Dashboard)

---

## Contexto

App "Minhas Contas" tem contas fixas mensais com Firestore + Firebase Auth. A planilha do usuário tem três módulos adicionais — Bancos, Gastos Diários, A Receber — que o app não cobre. Este spec define a expansão para cobrir todos os módulos da planilha.

---

## Decisões de Arquitetura

### Navegação
- **Bottom tab bar** com 5 abas fixas: Home, Contas, Gastos, Bancos, A Receber
- Navegação via Zustand state (`abaAtiva`) — sem nova dependência de roteamento
- FAB muda por aba; Home não tem FAB

### Saldo de Bancos (Abordagem A — Computed)
- Bancos armazenam apenas `nome` e `saldoInicial` no Firestore
- `gastos`, `entradas` e `saldoAtual` são **calculados no hook** via `useMemo` sobre as transações
- Zero write duplicado; zero risco de dessincronização
- Deletar/editar transação atualiza saldo automaticamente

### Formulário de Transações
- Toggle **Gasto / Entrada** no topo do form
- Valor sempre positivo; `tipo` define se debita ou credita o banco
- Categoria ausente em entradas (discriminated union TypeScript)

---

## Modelo de Dados

### Firestore

```
users/{userId}/months/{monthId}/
  bills/{billId}        — contas fixas (existente, sem mudança)
  banks/{bankId}        — nome + saldoInicial apenas
  receivables/{id}      — a receber
  transactions/{id}     — todos os lançamentos diários
```

### Tipos TypeScript (`src/types/index.ts` — adições)

```ts
export interface Banco {
  id: string
  nome: string
  saldoInicial: number
  criadoEm: Date
}

export interface BancoComSaldo extends Banco {
  gastos: number
  entradas: number
  saldoAtual: number
}

export interface AReceber {
  id: string
  nome: string
  valor: number
  recebido: boolean
  dataPrevista: string | null  // "YYYY-MM-DD"
  criadoEm: Date
}

export type TipoTransacao = 'gasto' | 'entrada'

export type CategoriaGasto =
  | 'alimentacao' | 'transporte' | 'saude' | 'lazer'
  | 'educacao' | 'moradia' | 'vestuario' | 'servicos'
  | 'despesaFixa' | 'outros'

export interface TransacaoOrigem {
  tipo: 'bill' | 'receivable'
  id: string   // id do doc de origem (bill ou receivable)
}

type TransacaoBase = {
  id: string
  data: string           // "YYYY-MM-DD"
  descricao: string
  bancoId: string
  valor: number
  despesaFixa: boolean
  observacao: string
  origem?: TransacaoOrigem  // presente em transações geradas por bill/receivable toggle
  criadoEm: Date
}

type TransacaoGasto = TransacaoBase & {
  tipo: 'gasto'
  categoria: CategoriaGasto
}

type TransacaoEntrada = TransacaoBase & {
  tipo: 'entrada'
  categoria?: never
}

export type Transacao = TransacaoGasto | TransacaoEntrada

export type AbaAtiva = 'home' | 'contas' | 'gastos' | 'bancos' | 'receber'

// Nota: Omit em discriminated union preserva a union — TransacaoInput será
// (Omit<TransacaoGasto, 'id'|'criadoEm'>) | (Omit<TransacaoEntrada, 'id'|'criadoEm'>)
// TypeScript lida corretamente; sem necessidade de tipo manual.
export type TransacaoInput = Omit<Transacao, 'id' | 'criadoEm'>
export type BancoInput = Omit<Banco, 'id' | 'criadoEm'>
export type AReceberInput = Omit<AReceber, 'id' | 'criadoEm'>
```

---

## Hooks

### `useBanks(userId, mesId, transacoes: Transacao[])`

```ts
interface UseBanksReturn {
  bancos: BancoComSaldo[]
  totalSaldo: number
  isLoading: boolean
  addBanco: (b: BancoInput) => Promise<void>
  updateBanco: (id: string, data: Partial<BancoInput>) => Promise<void>
  deleteBanco: (id: string) => Promise<void>
}
```

- `onSnapshot` em `banks/`
- **Performance**: pré-agrupa transações por `bancoId` num único `useMemo(transacoes)` → `Record<string, Transacao[]>`. Cada banco lê só seu grupo. O(n) uma vez, não O(n×m).
- `BancoComSaldo[]` calculado via segundo `useMemo([bancosRaw, porBanco])` onde `porBanco` é o mapa acima
- `totalSaldo = bancos.reduce((acc, b) => acc + b.saldoAtual, 0)`

### `useTransactions(userId, mesId)`

```ts
interface UseTransactionsReturn {
  transacoes: Transacao[]
  totalGastos: number
  totalEntradas: number
  gastosPorCategoria: Record<CategoriaGasto, number>
  gastosPorDia: { data: string; total: number }[]
  isLoading: boolean
  addTransacao: (t: TransacaoInput) => Promise<void>
  updateTransacao: (id: string, data: Partial<TransacaoInput>) => Promise<void>
  deleteTransacao: (id: string) => Promise<void>
}
```

- `onSnapshot` em `transactions/`, ordenado por `data` desc
- Todos os totais calculados via `useMemo`
- `gastosPorDia` alimenta `ChartsLinhaDia`
- `gastosPorCategoria` alimenta `ChartsPizza` (migrado de bills para transações)

### `useReceivables(userId, mesId)`

```ts
interface UseReceivablesReturn {
  recebiveis: AReceber[]
  totalPendente: number
  isLoading: boolean
  addRecebivel: (r: AReceberInput) => Promise<void>
  updateRecebivel: (id: string, data: Partial<AReceberInput>) => Promise<void>
  deleteRecebivel: (id: string) => Promise<void>
  marcarRecebido: (id: string, bancoId: string) => Promise<void>
  desmarcarRecebido: (id: string) => Promise<void>
}
```

- `marcarRecebido` usa `writeBatch` internamente: `updateRecebivel + setDoc(novaTransacao)` em batch atômico
- `desmarcarRecebido` busca transação com `origem.tipo === 'receivable' && origem.id === id` → batch `updateRecebivel({ recebido: false }) + deleteDoc(transacaoEncontrada)`. Se transação não existir (deletada manualmente), apenas desmarca o receivable.
- `totalPendente = recebiveis.filter(r => !r.recebido).reduce(...)`

### Adições em `useBills`

`togglePago` existente trata apenas toggle simples (sem banco). Adicionar:

```ts
togglePagoComBanco: (id: string, pago: boolean, bancoId: string, contaData: { nome: string; valor: number }) => Promise<void>
desfazerPagamento: (id: string, transacoes: Transacao[]) => Promise<void>
```

- `togglePagoComBanco`: `writeBatch` → `update(billRef, { pago }) + set(novaTransacaoRef, { ...payload, origem: { tipo: 'bill', id } })`
- `desfazerPagamento`: encontra transação com `origem.tipo === 'bill' && origem.id === id` na lista de transacoes recebida como arg → `writeBatch` → `update(billRef, { pago: false }) + deleteDoc(transacaoRef)`. Sem transação → apenas desmarca.

Ambos precisam de acesso ao path `transactions/` — constroem via `users/${userId}/months/${mesId}/transactions`.

### Orquestração em `Dashboard.tsx`

```ts
const { transacoes, ...txActions } = useTransactions(userId, mesId)
const { bancos, totalSaldo, ...bankActions } = useBanks(userId, mesId, transacoes)
const { recebiveis, totalPendente, ...recActions } = useReceivables(userId, mesId)
const { contas, resumo, ...billActions } = useBills(userId, mesId, mesInfo?.receita ?? 0)
```

Um `onSnapshot` por coleção. Dados fluem top-down.

---

## Componentes

### Novos arquivos

```
src/
├── components/
│   ├── BottomNav/
│   │   └── BottomNav.tsx
│   ├── Banks/
│   │   ├── BankList.tsx
│   │   ├── BankCard.tsx
│   │   └── BankModal.tsx
│   ├── Receivables/
│   │   ├── ReceivableList.tsx
│   │   ├── ReceivableItem.tsx
│   │   └── ReceivableModal.tsx
│   ├── Transactions/
│   │   ├── TransactionList.tsx
│   │   ├── TransactionItem.tsx
│   │   └── TransactionModal.tsx
│   ├── Charts/
│   │   ├── ChartsPizza.tsx        — atualizado: usa gastosPorCategoria de transactions
│   │   ├── ChartsBarBancos.tsx    — NOVO
│   │   └── ChartsLinhaDia.tsx     — NOVO
│   └── Dashboard/
│       ├── ResumoCards.tsx        — existente, sem mudança
│       └── IndicadoresRapidos.tsx — NOVO: 6 indicadores + Saldo Real
│   └── Modals/
│       └── SelectBancoModal.tsx   — reutilizado em bill toggle + A Receber (path: src/components/Modals/)
└── pages/
    ├── Dashboard.tsx              — orquestrador + switch de aba
    ├── HomeTab.tsx
    ├── ContasTab.tsx
    ├── GastosTab.tsx
    ├── BancosTab.tsx
    └── ReceberTab.tsx
```

### IndicadoresRapidos — 6 cards

| Card | Fonte | Cor |
|---|---|---|
| Saldo Total | `totalSaldo` (bancos) | branco |
| Total Gastos | `totalGastos` (transactions) | `#EF4444` |
| Total Entradas | `totalEntradas` (transactions) | `#10B981` |
| Despesas Fixas | `resumo.totalGeral` (bills) | `#7C72D8` |
| A Receber | `totalPendente` (recebiveis) | `#F59E0B` |
| Fixas Pagas | `X de Y` de bills | verde/branco |

**Saldo Real** = `totalSaldo + totalPendente` — card secundário abaixo dos 6.

---

## Regras de Negócio

### Fluxo 1 — Lançar gasto diário
1. `TransactionModal` com toggle **Gasto**
2. Campos: data, descrição, categoria, banco, valor, observação
3. `addTransacao(input)` → `transactions/`
4. `useBanks` recalcula via `useMemo` — sem write extra

### Fluxo 2 — Lançar entrada diária
1. Toggle **Entrada** no `TransactionModal`
2. Campos: data, descrição, banco, valor, observação (sem categoria)
3. `addTransacao({ tipo: 'entrada', ... })` — campo `categoria` omitido

### Edge case — SelectBancoModal sem bancos cadastrados
Se `bancos.length === 0`, modal exibe estado vazio: "Nenhum banco cadastrado. Adicione um banco primeiro." com botão que navega para aba Bancos. Toggle não é confirmado.

### Fluxo 3 — Marcar conta fixa como paga
1. Toggle em `BillItem`
2. `pago: true` → abre `SelectBancoModal` antes de confirmar
3. Usuário seleciona banco → confirma
4. **`writeBatch` atômico** (um commit):
   - `update(billRef, { pago: true })`
   - `set(novaTransacaoRef, { tipo: 'gasto', despesaFixa: true, bancoId, valor: conta.valor, descricao: conta.nome, data: hoje, categoria: 'despesaFixa', observacao: '', origem: { tipo: 'bill', id: conta.id } })`
5. Fechar modal sem confirmar → bill não marcada como paga

**Desmarcar (pago → false):** chama `desfazerPagamento(id, transacoes)` → batch atômico: desmarca bill + deleta transação vinculada (se existir). Se usuário deletou a transação manualmente, apenas desmarca.

### Fluxo 4 — Marcar A Receber como recebido
1. Toggle em `ReceivableItem`
2. `SelectBancoModal`
3. **`writeBatch` atômico**:
   - `update(recebivelRef, { recebido: true })`
   - `set(novaTransacaoRef, { tipo: 'entrada', bancoId, valor: recebivel.valor, descricao: recebivel.nome, data: hoje, observacao: '', origem: { tipo: 'receivable', id: recebivel.id } })`

**Desmarcar:** `desmarcarRecebido(id)` → batch atômico: desmarca receivable + deleta transação vinculada (se existir).

---

## UI/UX

### BottomNav
- Fundo: `var(--surface)`, `border-top: 0.5px solid var(--border-subtle)`
- Altura: `64px` + `padding-bottom: env(safe-area-inset-bottom)`
- Aba ativa: ícone + label brancos + dot indicator animado (`layoutId` Framer Motion)
- Abas inativas: `var(--text-subtle)`

### BankCard
- Layout: nome | saldo atual grande | entradas↑ verde | gastos↓ vermelho
- Lista horizontal scroll em mobile, wrap em `md:`
- Framer Motion: `staggerChildren` 0.05s no mount

### TransactionList
- Agrupado por data: `"Hoje"` / `"Ontem"` / `"DD/MM"`
- Header do grupo: data + total do dia à direita
- Item: ícone categoria + descrição + badge banco + valor (vermelho=gasto, verde=entrada)

### TransactionModal
- Toggle pill **Gasto / Entrada** no topo
- Campos mudam conforme tipo (categoria aparece só em Gasto)

### ReceivableItem
- Avatar circular com inicial do nome
- Nome + data prevista + valor
- Toggle switch direita → abre `SelectBancoModal`
- `recebido: true` → item riscado + `opacity: 0.5`

### Animações
- Entrada de cards/items: `initial={{ opacity:0, y:8 }}` → `animate={{ opacity:1, y:0 }}`
- Dot da tab bar: `layoutId` para transição fluida
- Modais: padrão existente (Dialog shadcn/ui)

---

## Zustand — mudanças em `useAppStore`

Adicionar (usar o tipo `AbaAtiva` exportado em `types/index.ts`):
```ts
abaAtiva: AbaAtiva
setAbaAtiva: (aba: AbaAtiva) => void
```

---

## Semáforo de Saúde

Sem mudança — permanece baseado em contas fixas vs receita declarada.

---

## Ordem de Implementação Sugerida

1. Tipos TypeScript (adições em `index.ts`)
2. Zustand: campo `abaAtiva`
3. `useTransactions` hook
4. `useBanks` hook (depende de Transacao[])
5. `useReceivables` hook
6. `BottomNav` componente
7. Refatorar `Dashboard.tsx` em orquestrador + `*Tab.tsx`
8. `HomeTab` + `IndicadoresRapidos`
9. `BancosTab` + `BankCard` + `BankModal`
10. `GastosTab` + `TransactionList` + `TransactionModal`
11. `ReceberTab` + `ReceivableList` + `ReceivableModal`
12. `SelectBancoModal` + integração nos fluxos 3 e 4
13. Atualizar `ChartsPizza` para usar `gastosPorCategoria`
14. `ChartsBarBancos` + `ChartsLinhaDia`
15. Testes de integração dos fluxos críticos
