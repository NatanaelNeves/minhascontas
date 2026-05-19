# Expansão Financeira Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Banks, Daily Transactions, and Receivables modules to "Minhas Contas", migrating from CSV spreadsheet to full Firestore-backed app with bottom tab navigation.

**Architecture:** Five-tab layout (Home, Contas, Gastos, Bancos, A Receber) orchestrated by Dashboard.tsx; computed balances via useMemo (no write duplication); atomic writes (writeBatch) for bill/receivable toggles that generate deterministic transaction IDs.

**Tech Stack:** React 18 + TypeScript, Zustand, Firebase/Firestore (writeBatch, setDoc, deleteDoc), Vitest, shadcn/ui Dialog, Framer Motion, Recharts.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Modify | `src/types/index.ts` | Add Banco, AReceber, Transacao, AbaAtiva types |
| Modify | `src/store/useAppStore.ts` | Add `abaAtiva` field |
| Create | `src/hooks/useTransactions.ts` | Firestore CRUD + computed totals for transactions |
| Create | `src/hooks/useBanks.ts` | Firestore CRUD + computed saldo via useMemo |
| Create | `src/hooks/useReceivables.ts` | Firestore CRUD + marcarRecebido/desmarcarRecebido |
| Modify | `src/hooks/useBills.ts` | Add togglePagoComBanco + desfazerPagamento |
| Create | `src/components/BottomNav/BottomNav.tsx` | Five-tab nav bar with Framer Motion dot indicator |
| Modify | `src/pages/Dashboard.tsx` | Orchestrator: all hooks + tab switch |
| Create | `src/pages/HomeTab.tsx` | Home tab: ResumoCards + IndicadoresRapidos + charts |
| Create | `src/pages/ContasTab.tsx` | Bills tab: BillList + BillModal |
| Create | `src/pages/GastosTab.tsx` | Transactions tab: TransactionList |
| Create | `src/pages/BancosTab.tsx` | Banks tab: BankList |
| Create | `src/pages/ReceberTab.tsx` | Receivables tab: ReceivableList |
| Create | `src/components/Dashboard/IndicadoresRapidos.tsx` | 6 indicator cards + Saldo Real |
| Create | `src/components/Banks/BankCard.tsx` | Bank card: saldo atual + entradas/gastos |
| Create | `src/components/Banks/BankList.tsx` | Bank list + empty state |
| Create | `src/components/Banks/BankModal.tsx` | Add/edit bank modal |
| Create | `src/components/Transactions/TransactionItem.tsx` | Transaction row with category icon |
| Create | `src/components/Transactions/TransactionList.tsx` | Grouped by date with day totals |
| Create | `src/components/Transactions/TransactionModal.tsx` | Add/edit modal with Gasto/Entrada toggle |
| Create | `src/components/Receivables/ReceivableItem.tsx` | Toggle + avatar + date |
| Create | `src/components/Receivables/ReceivableList.tsx` | List + empty state |
| Create | `src/components/Receivables/ReceivableModal.tsx` | Add/edit receivable modal |
| Create | `src/components/Modals/SelectBancoModal.tsx` | Bank picker dialog, used by bill + receivable toggles |
| Modify | `src/components/Charts/ChartsPizza.tsx` | Accept `gastosPorCategoria` instead of `contas` |
| Create | `src/components/Charts/ChartsBarBancos.tsx` | Bar chart: saldo por banco |
| Create | `src/components/Charts/ChartsLinhaDia.tsx` | Line chart: gastos por dia |
| Create | `firestore.indexes.json` | Composite index for (bancoId, data desc) |
| Create | `src/lib/calcBancos.test.ts` | Unit tests for bank computed logic |
| Create | `src/lib/calcBancos.ts` | Pure functions for computed bank saldos |

---

## Task 1: TypeScript Types

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add types**

Replace the end of `src/types/index.ts` (after `ContaInput`) with:

```ts
// --- Expansão: Bancos, Transações, A Receber ---

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
  dataPrevista: string | null
  criadoEm: Date
}

export type TipoTransacao = 'gasto' | 'entrada'

export type CategoriaGasto =
  | 'alimentacao' | 'transporte' | 'saude' | 'lazer'
  | 'educacao' | 'moradia' | 'vestuario' | 'servicos'
  | 'despesaFixa' | 'outros'

export interface TransacaoOrigem {
  tipo: 'bill' | 'receivable'
  id: string
}

type TransacaoBase = {
  id: string
  data: string
  descricao: string
  bancoId: string
  valor: number
  despesaFixa: boolean
  observacao?: string
  origem?: TransacaoOrigem
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

export type TransacaoInput = Omit<Transacao, 'id' | 'criadoEm'>
export type BancoInput = Omit<Banco, 'id' | 'criadoEm'>
export type AReceberInput = Omit<AReceber, 'id' | 'criadoEm'>
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npm run build 2>&1 | head -30`
Expected: no type errors

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add Banco, Transacao, AReceber, AbaAtiva types"
```

---

## Task 2: Zustand Store — `abaAtiva`

**Files:**
- Modify: `src/store/useAppStore.ts`

- [ ] **Step 1: Add `abaAtiva` to store**

Replace the full file content:

```ts
import { create } from 'zustand'
import { AbaAtiva } from '@/types'

type CurrentPage = 'dashboard' | 'history'

interface AppState {
  mesAtivo: string
  isLoading: boolean
  currentPage: CurrentPage
  abaAtiva: AbaAtiva
  setMesAtivo: (mes: string) => void
  setIsLoading: (loading: boolean) => void
  setCurrentPage: (page: CurrentPage) => void
  setAbaAtiva: (aba: AbaAtiva) => void
}

function getMesAtual(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const useAppStore = create<AppState>((set) => ({
  mesAtivo: getMesAtual(),
  isLoading: false,
  currentPage: 'dashboard',
  abaAtiva: 'home',
  setMesAtivo: (mes) => set({ mesAtivo: mes }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setAbaAtiva: (aba) => set({ abaAtiva: aba }),
}))
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/store/useAppStore.ts
git commit -m "feat(store): add abaAtiva field to Zustand store"
```

---

## Task 3: `useTransactions` Hook

**Files:**
- Create: `src/hooks/useTransactions.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useEffect, useState, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, query, orderBy,
  QueryDocumentSnapshot, DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import {
  Transacao, TransacaoInput, CategoriaGasto,
} from '@/types'

function docToTransacao(snap: QueryDocumentSnapshot<DocumentData>): Transacao {
  const d = snap.data()
  const base = {
    id: snap.id,
    data: d.data,
    descricao: d.descricao,
    bancoId: d.bancoId,
    valor: d.valor,
    despesaFixa: d.despesaFixa ?? false,
    observacao: d.observacao,
    origem: d.origem,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
  if (d.tipo === 'gasto') {
    return { ...base, tipo: 'gasto', categoria: d.categoria }
  }
  return { ...base, tipo: 'entrada' }
}

export interface UseTransactionsReturn {
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

export function useTransactions(userId: string, mesId: string): UseTransactionsReturn {
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const path = `users/${userId}/months/${mesId}/transactions`

  useEffect(() => {
    if (!userId || !mesId) return
    setIsLoading(true)
    const q = query(collection(db, path), orderBy('data', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setTransacoes(snap.docs.map(docToTransacao))
      setIsLoading(false)
    })
    return unsub
  }, [userId, mesId])

  const totalGastos = useMemo(
    () => transacoes.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.valor, 0),
    [transacoes]
  )

  const totalEntradas = useMemo(
    () => transacoes.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0),
    [transacoes]
  )

  const gastosPorCategoria = useMemo(() => {
    const acc = {} as Record<CategoriaGasto, number>
    transacoes.forEach(t => {
      if (t.tipo === 'gasto') {
        acc[t.categoria] = (acc[t.categoria] ?? 0) + t.valor
      }
    })
    return acc
  }, [transacoes])

  const gastosPorDia = useMemo(() => {
    const map = new Map<string, number>()
    transacoes.forEach(t => {
      if (t.tipo === 'gasto') {
        map.set(t.data, (map.get(t.data) ?? 0) + t.valor)
      }
    })
    return Array.from(map.entries())
      .map(([data, total]) => ({ data, total }))
      .sort((a, b) => a.data.localeCompare(b.data))
  }, [transacoes])

  async function addTransacao(t: TransacaoInput) {
    await addDoc(collection(db, path), { ...t, criadoEm: serverTimestamp() })
  }

  async function updateTransacao(id: string, data: Partial<TransacaoInput>) {
    await updateDoc(doc(db, path, id), data)
  }

  async function deleteTransacao(id: string) {
    await deleteDoc(doc(db, path, id))
  }

  return {
    transacoes, totalGastos, totalEntradas,
    gastosPorCategoria, gastosPorDia, isLoading,
    addTransacao, updateTransacao, deleteTransacao,
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useTransactions.ts
git commit -m "feat(hooks): add useTransactions with computed totals"
```

---

## Task 4: `useBanks` Hook

**Files:**
- Create: `src/hooks/useBanks.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useEffect, useState, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp,
  QueryDocumentSnapshot, DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Banco, BancoInput, BancoComSaldo, Transacao } from '@/types'

function docToBanco(snap: QueryDocumentSnapshot<DocumentData>): Banco {
  const d = snap.data()
  return {
    id: snap.id,
    nome: d.nome,
    saldoInicial: d.saldoInicial,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
}

export interface UseBanksReturn {
  bancos: BancoComSaldo[]
  totalSaldo: number
  isLoading: boolean
  addBanco: (b: BancoInput) => Promise<void>
  updateBanco: (id: string, data: Partial<BancoInput>) => Promise<void>
  deleteBanco: (id: string) => Promise<string | null>
}

export function useBanks(
  userId: string,
  mesId: string,
  transacoes: Transacao[]
): UseBanksReturn {
  const [bancosRaw, setBancosRaw] = useState<Banco[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const path = `users/${userId}/months/${mesId}/banks`

  useEffect(() => {
    if (!userId || !mesId) return
    setIsLoading(true)
    const unsub = onSnapshot(collection(db, path), (snap) => {
      setBancosRaw(snap.docs.map(docToBanco))
      setIsLoading(false)
    })
    return unsub
  }, [userId, mesId])

  const porBanco = useMemo(() => {
    const map: Record<string, Transacao[]> = {}
    transacoes.forEach(t => {
      if (!map[t.bancoId]) map[t.bancoId] = []
      map[t.bancoId].push(t)
    })
    return map
  }, [transacoes])

  const bancos = useMemo<BancoComSaldo[]>(() =>
    bancosRaw.map(b => {
      const txs = porBanco[b.id] ?? []
      const gastos = txs.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.valor, 0)
      const entradas = txs.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)
      return { ...b, gastos, entradas, saldoAtual: b.saldoInicial + entradas - gastos }
    }),
    [bancosRaw, porBanco]
  )

  const totalSaldo = useMemo(
    () => bancos.reduce((s, b) => s + b.saldoAtual, 0),
    [bancos]
  )

  async function addBanco(b: BancoInput) {
    await addDoc(collection(db, path), { ...b, criadoEm: serverTimestamp() })
  }

  async function updateBanco(id: string, data: Partial<BancoInput>) {
    await updateDoc(doc(db, path, id), data)
  }

  async function deleteBanco(id: string): Promise<string | null> {
    const linked = transacoes.some(t => t.bancoId === id)
    if (linked) return 'Banco possui lançamentos — remova-os antes de deletar.'
    await deleteDoc(doc(db, path, id))
    return null
  }

  return { bancos, totalSaldo, isLoading, addBanco, updateBanco, deleteBanco }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBanks.ts
git commit -m "feat(hooks): add useBanks with computed saldos via useMemo"
```

---

## Task 5: `useReceivables` Hook

**Files:**
- Create: `src/hooks/useReceivables.ts`

- [ ] **Step 1: Write the hook**

```ts
import { useEffect, useState, useMemo } from 'react'
import {
  collection, onSnapshot, addDoc, updateDoc,
  deleteDoc, doc, serverTimestamp, writeBatch,
  QueryDocumentSnapshot, DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { AReceber, AReceberInput } from '@/types'

function docToRecebivel(snap: QueryDocumentSnapshot<DocumentData>): AReceber {
  const d = snap.data()
  return {
    id: snap.id,
    nome: d.nome,
    valor: d.valor,
    recebido: d.recebido,
    dataPrevista: d.dataPrevista ?? null,
    criadoEm: d.criadoEm?.toDate() ?? new Date(),
  }
}

export interface UseReceivablesReturn {
  recebiveis: AReceber[]
  totalPendente: number
  isLoading: boolean
  addRecebivel: (r: AReceberInput) => Promise<void>
  updateRecebivel: (id: string, data: Partial<AReceberInput>) => Promise<void>
  deleteRecebivel: (id: string) => Promise<void>
  marcarRecebido: (id: string, bancoId: string) => Promise<void>
  desmarcarRecebido: (id: string) => Promise<void>
}

export function useReceivables(userId: string, mesId: string): UseReceivablesReturn {
  const [recebiveis, setRecebiveis] = useState<AReceber[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const recPath = `users/${userId}/months/${mesId}/receivables`
  const txPath = `users/${userId}/months/${mesId}/transactions`

  useEffect(() => {
    if (!userId || !mesId) return
    setIsLoading(true)
    const unsub = onSnapshot(collection(db, recPath), (snap) => {
      setRecebiveis(snap.docs.map(docToRecebivel))
      setIsLoading(false)
    })
    return unsub
  }, [userId, mesId])

  const totalPendente = useMemo(
    () => recebiveis.filter(r => !r.recebido).reduce((s, r) => s + r.valor, 0),
    [recebiveis]
  )

  async function addRecebivel(r: AReceberInput) {
    await addDoc(collection(db, recPath), { ...r, criadoEm: serverTimestamp() })
  }

  async function updateRecebivel(id: string, data: Partial<AReceberInput>) {
    await updateDoc(doc(db, recPath, id), data)
  }

  async function deleteRecebivel(id: string) {
    await deleteDoc(doc(db, recPath, id))
  }

  async function marcarRecebido(id: string, bancoId: string) {
    const recebivel = recebiveis.find(r => r.id === id)
    if (!recebivel) return
    const hoje = new Date().toISOString().split('T')[0]
    const batch = writeBatch(db)
    batch.update(doc(db, recPath, id), { recebido: true })
    batch.set(doc(db, txPath, `receivable_${id}`), {
      tipo: 'entrada',
      bancoId,
      valor: recebivel.valor,
      descricao: recebivel.nome,
      data: recebivel.dataPrevista ?? hoje,
      despesaFixa: false,
      origem: { tipo: 'receivable', id },
      criadoEm: serverTimestamp(),
    })
    await batch.commit()
  }

  async function desmarcarRecebido(id: string) {
    const batch = writeBatch(db)
    batch.update(doc(db, recPath, id), { recebido: false })
    batch.delete(doc(db, txPath, `receivable_${id}`))
    await batch.commit()
  }

  return {
    recebiveis, totalPendente, isLoading,
    addRecebivel, updateRecebivel, deleteRecebivel,
    marcarRecebido, desmarcarRecebido,
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useReceivables.ts
git commit -m "feat(hooks): add useReceivables with atomic writeBatch toggle"
```

---

## Task 6: Update `useBills` — Add Bank Toggle Methods

**Files:**
- Modify: `src/hooks/useBills.ts`

- [ ] **Step 1: Add imports and new methods**

Replace `src/hooks/useBills.ts` with:

```ts
import { writeBatch, doc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useFirestore } from './useFirestore'
import { calcResumo } from '@/lib/utils'
import { Conta, ContaInput, ResumoMes } from '@/types'

interface UseBillsReturn {
  contas: Conta[]
  resumo: ResumoMes
  isLoading: boolean
  addConta: (conta: ContaInput) => Promise<void>
  updateConta: (id: string, data: Partial<ContaInput>) => Promise<void>
  deleteConta: (id: string) => Promise<void>
  togglePago: (id: string, pago: boolean) => Promise<void>
  togglePagoComBanco: (
    id: string,
    bancoId: string,
    contaData: { nome: string; valor: number; vencimento: string | null }
  ) => Promise<void>
  desfazerPagamento: (id: string) => Promise<void>
}

export function useBills(
  userId: string,
  mesId: string,
  receita: number
): UseBillsReturn {
  const { contas, isLoading, addConta, updateConta, deleteConta } =
    useFirestore(userId, mesId)

  const resumo = calcResumo(contas, receita)

  const billPath = `users/${userId}/months/${mesId}/bills`
  const txPath = `users/${userId}/months/${mesId}/transactions`

  async function togglePago(id: string, pago: boolean) {
    await updateConta(id, { pago })
  }

  async function togglePagoComBanco(
    id: string,
    bancoId: string,
    contaData: { nome: string; valor: number; vencimento: string | null }
  ) {
    const hoje = new Date().toISOString().split('T')[0]
    const batch = writeBatch(db)
    batch.update(doc(db, billPath, id), { pago: true })
    batch.set(doc(db, txPath, `bill_${id}`), {
      tipo: 'gasto',
      categoria: 'despesaFixa',
      bancoId,
      valor: contaData.valor,
      descricao: contaData.nome,
      data: contaData.vencimento ?? hoje,
      despesaFixa: true,
      origem: { tipo: 'bill', id },
      criadoEm: serverTimestamp(),
    })
    await batch.commit()
  }

  async function desfazerPagamento(id: string) {
    const batch = writeBatch(db)
    batch.update(doc(db, billPath, id), { pago: false })
    batch.delete(doc(db, txPath, `bill_${id}`))
    await batch.commit()
  }

  return {
    contas, resumo, isLoading, addConta, updateConta, deleteConta,
    togglePago, togglePagoComBanco, desfazerPagamento,
  }
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBills.ts
git commit -m "feat(hooks): add togglePagoComBanco and desfazerPagamento with writeBatch"
```

---

## Task 7: `SelectBancoModal` Component

**Files:**
- Create: `src/components/Modals/SelectBancoModal.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { BancoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  open: boolean
  bancos: BancoComSaldo[]
  onSelect: (bancoId: string) => void
  onClose: () => void
  onNavigateToBancos?: () => void
}

export function SelectBancoModal({ open, bancos, onSelect, onClose, onNavigateToBancos }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Selecionar banco</DialogTitle>
        </DialogHeader>

        {bancos.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <p className="text-sm" style={{ color: 'var(--text-subtle)' }}>
              Nenhum banco cadastrado. Adicione um banco primeiro.
            </p>
            {onNavigateToBancos && (
              <Button variant="outline" size="sm" onClick={() => { onClose(); onNavigateToBancos() }}>
                Ir para Bancos
              </Button>
            )}
          </div>
        ) : (
          <ul className="flex flex-col gap-2 py-2">
            {bancos.map(b => (
              <li key={b.id}>
                <button
                  onClick={() => onSelect(b.id)}
                  className="w-full flex items-center justify-between rounded-lg px-4 py-3 text-left transition-colors hover:bg-white/5"
                  style={{ border: '1px solid var(--border-subtle)' }}
                >
                  <span className="text-sm font-medium">{b.nome}</span>
                  <span className="text-sm" style={{ color: 'var(--text-subtle)' }}>
                    {formatBRL(b.saldoAtual)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/Modals/SelectBancoModal.tsx
git commit -m "feat(ui): add SelectBancoModal for bank selection in toggles"
```

---

## Task 8: `BottomNav` Component

**Files:**
- Create: `src/components/BottomNav/BottomNav.tsx`

- [ ] **Step 1: Write the component**

```tsx
import { motion } from 'framer-motion'
import { Home, Receipt, CreditCard, Building2, TrendingUp } from 'lucide-react'
import { AbaAtiva } from '@/types'

interface Tab {
  id: AbaAtiva
  label: string
  icon: React.ElementType
}

const TABS: Tab[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'contas', label: 'Contas', icon: Receipt },
  { id: 'gastos', label: 'Gastos', icon: CreditCard },
  { id: 'bancos', label: 'Bancos', icon: Building2 },
  { id: 'receber', label: 'A Receber', icon: TrendingUp },
]

interface Props {
  ativa: AbaAtiva
  onChange: (aba: AbaAtiva) => void
}

export function BottomNav({ ativa, onChange }: Props) {
  return (
    <nav
      className="fixed bottom-0 inset-x-0 flex items-center justify-around z-50"
      style={{
        background: 'var(--surface)',
        borderTop: '0.5px solid var(--border-subtle)',
        height: 64,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {TABS.map(tab => {
        const isActive = tab.id === ativa
        const Icon = tab.icon
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className="flex flex-col items-center gap-0.5 px-3 py-2 relative"
            style={{ color: isActive ? '#ffffff' : 'var(--text-subtle)', minWidth: 60 }}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium leading-none">{tab.label}</span>
            {isActive && (
              <motion.div
                layoutId="tab-dot"
                className="absolute -bottom-1 w-1 h-1 rounded-full bg-white"
              />
            )}
          </button>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/components/BottomNav/BottomNav.tsx
git commit -m "feat(ui): add BottomNav with Framer Motion tab indicator"
```

---

## Task 9: `BankModal` + `BankCard` + `BankList`

**Files:**
- Create: `src/components/Banks/BankModal.tsx`
- Create: `src/components/Banks/BankCard.tsx`
- Create: `src/components/Banks/BankList.tsx`

- [ ] **Step 1: Write BankModal**

```tsx
// src/components/Banks/BankModal.tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Banco, BancoInput } from '@/types'

interface Props {
  open: boolean
  editando: Banco | null
  onSave: (data: BancoInput) => void
  onClose: () => void
}

export function BankModal({ open, editando, onSave, onClose }: Props) {
  const [nome, setNome] = useState('')
  const [saldoInicial, setSaldoInicial] = useState('')

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setSaldoInicial(String(editando.saldoInicial))
    } else {
      setNome('')
      setSaldoInicial('')
    }
  }, [editando, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({ nome: nome.trim(), saldoInicial: parseFloat(saldoInicial) || 0 })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar banco' : 'Novo banco'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 pt-2">
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-subtle)' }}>Nome</label>
            <input
              className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
              style={{ border: '1px solid var(--border-subtle)' }}
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Ex: Nubank"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-subtle)' }}>Saldo inicial (R$)</label>
            <input
              className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
              style={{ border: '1px solid var(--border-subtle)' }}
              type="number"
              min="0"
              step="0.01"
              value={saldoInicial}
              onChange={e => setSaldoInicial(e.target.value)}
              placeholder="0,00"
            />
          </div>
          <Button type="submit" className="w-full mt-2">
            {editando ? 'Salvar' : 'Adicionar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Write BankCard**

```tsx
// src/components/Banks/BankCard.tsx
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { BancoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  banco: BancoComSaldo
  onEdit: (banco: BancoComSaldo) => void
  onDelete: (id: string) => void
}

export function BankCard({ banco, onEdit, onDelete }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex flex-col gap-2"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{banco.nome}</span>
        <div className="flex gap-2">
          <button onClick={() => onEdit(banco)} style={{ color: 'var(--text-subtle)' }}>
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(banco.id)} style={{ color: 'var(--text-subtle)' }}>
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <span className="text-2xl font-bold tracking-tight">{formatBRL(banco.saldoAtual)}</span>
      <div className="flex gap-4 text-xs">
        <span style={{ color: '#10B981' }}>↑ {formatBRL(banco.entradas)}</span>
        <span style={{ color: '#EF4444' }}>↓ {formatBRL(banco.gastos)}</span>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 3: Write BankList**

```tsx
// src/components/Banks/BankList.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { BancoComSaldo, BancoInput, Banco } from '@/types'
import { BankCard } from './BankCard'
import { BankModal } from './BankModal'

interface Props {
  bancos: BancoComSaldo[]
  onAdd: (data: BancoInput) => void
  onUpdate: (id: string, data: Partial<BancoInput>) => void
  onDelete: (id: string) => Promise<string | null>
}

export function BankList({ bancos, onAdd, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Banco | null>(null)
  const [erroDelete, setErroDelete] = useState<string | null>(null)

  function handleEdit(banco: BancoComSaldo) {
    setEditando(banco)
    setModalOpen(true)
  }

  async function handleDelete(id: string) {
    const erro = await onDelete(id)
    if (erro) setErroDelete(erro)
  }

  function handleSave(data: BancoInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {erroDelete && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: '#EF444420', color: '#EF4444' }}>
          {erroDelete}
          <button className="ml-2 underline" onClick={() => setErroDelete(null)}>fechar</button>
        </div>
      )}

      {bancos.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-subtle)' }}>
          Nenhum banco cadastrado.
        </p>
      )}

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 gap-3"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.05 } } }}
      >
        {bancos.map(b => (
          <BankCard key={b.id} banco={b} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </motion.div>

      <BankModal
        open={modalOpen}
        editando={editando}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditando(null) }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/Banks/
git commit -m "feat(ui): add BankModal, BankCard, BankList components"
```

---

## Task 10: Transaction Components

**Files:**
- Create: `src/components/Transactions/TransactionItem.tsx`
- Create: `src/components/Transactions/TransactionList.tsx`
- Create: `src/components/Transactions/TransactionModal.tsx`

- [ ] **Step 1: Write TransactionItem**

```tsx
// src/components/Transactions/TransactionItem.tsx
import { Pencil, Trash2 } from 'lucide-react'
import { Transacao, BancoComSaldo, CategoriaGasto } from '@/types'
import { formatBRL } from '@/lib/utils'

const CATEGORIA_LABEL: Record<CategoriaGasto, string> = {
  alimentacao: '🍔', transporte: '🚗', saude: '💊', lazer: '🎮',
  educacao: '📚', moradia: '🏠', vestuario: '👕', servicos: '⚡',
  despesaFixa: '📋', outros: '📦',
}

interface Props {
  transacao: Transacao
  bancos: BancoComSaldo[]
  onEdit: (t: Transacao) => void
  onDelete: (id: string) => void
}

export function TransactionItem({ transacao: t, bancos, onEdit, onDelete }: Props) {
  const banco = bancos.find(b => b.id === t.bancoId)
  const isReadOnly = !!t.origem

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="text-xl leading-none">
        {t.tipo === 'gasto' ? CATEGORIA_LABEL[t.categoria] : '💰'}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{t.descricao}</p>
        <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
          {banco?.nome ?? '—'}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className="text-sm font-semibold"
          style={{ color: t.tipo === 'gasto' ? '#EF4444' : '#10B981' }}
        >
          {t.tipo === 'gasto' ? '-' : '+'}{formatBRL(t.valor)}
        </span>
        {!isReadOnly && (
          <>
            <button onClick={() => onEdit(t)} style={{ color: 'var(--text-subtle)' }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(t.id)} style={{ color: 'var(--text-subtle)' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Write TransactionList**

```tsx
// src/components/Transactions/TransactionList.tsx
import { useMemo } from 'react'
import { Transacao, BancoComSaldo } from '@/types'
import { TransactionItem } from './TransactionItem'
import { formatBRL } from '@/lib/utils'

interface Props {
  transacoes: Transacao[]
  bancos: BancoComSaldo[]
  onEdit: (t: Transacao) => void
  onDelete: (id: string) => void
}

function formatGroupDate(dateStr: string): string {
  const hoje = new Date().toISOString().split('T')[0]
  const ontem = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === hoje) return 'Hoje'
  if (dateStr === ontem) return 'Ontem'
  const [, m, d] = dateStr.split('-')
  return `${d}/${m}`
}

export function TransactionList({ transacoes, bancos, onEdit, onDelete }: Props) {
  const grupos = useMemo(() => {
    const map = new Map<string, Transacao[]>()
    transacoes.forEach(t => {
      const group = map.get(t.data) ?? []
      group.push(t)
      map.set(t.data, group)
    })
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }, [transacoes])

  if (transacoes.length === 0) {
    return (
      <p className="text-sm text-center py-8" style={{ color: 'var(--text-subtle)' }}>
        Nenhum lançamento registrado.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {grupos.map(([data, txs]) => {
        const totalDia = txs.reduce((s, t) => s + (t.tipo === 'gasto' ? -t.valor : t.valor), 0)
        return (
          <div key={data}>
            <div
              className="flex items-center justify-between py-1.5 text-xs font-semibold sticky top-0"
              style={{ color: 'var(--text-subtle)', background: 'var(--app-bg)' }}
            >
              <span>{formatGroupDate(data)}</span>
              <span style={{ color: totalDia >= 0 ? '#10B981' : '#EF4444' }}>
                {totalDia >= 0 ? '+' : ''}{formatBRL(Math.abs(totalDia))}
              </span>
            </div>
            <div
              className="rounded-xl divide-y"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border-subtle)',
                divideColor: 'var(--border-subtle)',
              }}
            >
              {txs.map(t => (
                <div key={t.id} className="px-4">
                  <TransactionItem transacao={t} bancos={bancos} onEdit={onEdit} onDelete={onDelete} />
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Write TransactionModal**

```tsx
// src/components/Transactions/TransactionModal.tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
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
      setTipo('gasto'); setDescricao(''); setValor('')
      setBancoId(bancos[0]?.id ?? ''); setCategoria('outros')
      setData(hoje); setObservacao('')
    }
  }, [editando, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const base = {
      descricao: descricao.trim(), valor: parseFloat(valor),
      bancoId, data, despesaFixa: false,
      ...(observacao.trim() ? { observacao: observacao.trim() } : {}),
    }
    const input: TransacaoInput = tipo === 'gasto'
      ? { ...base, tipo: 'gasto', categoria }
      : { ...base, tipo: 'entrada' }
    onSave(input)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          {/* Toggle Gasto/Entrada */}
          <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--border-subtle)' }}>
            {(['gasto', 'entrada'] as TipoTransacao[]).map(t => (
              <button
                key={t} type="button"
                onClick={() => setTipo(t)}
                className="flex-1 py-2 text-sm font-medium capitalize transition-colors"
                style={{
                  background: tipo === t ? (t === 'gasto' ? '#EF4444' : '#10B981') : 'transparent',
                  color: tipo === t ? '#fff' : 'var(--text-subtle)',
                }}
              >
                {t === 'gasto' ? 'Gasto' : 'Entrada'}
              </button>
            ))}
          </div>

          <input
            className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--border-subtle)' }}
            placeholder="Descrição"
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            required
          />

          <input
            className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--border-subtle)' }}
            type="number" min="0.01" step="0.01"
            placeholder="Valor"
            value={valor}
            onChange={e => setValor(e.target.value)}
            required
          />

          <select
            className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface)' }}
            value={bancoId}
            onChange={e => setBancoId(e.target.value)}
            required
          >
            {bancos.map(b => <option key={b.id} value={b.id}>{b.nome}</option>)}
          </select>

          {tipo === 'gasto' && (
            <select
              className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
              style={{ border: '1px solid var(--border-subtle)', background: 'var(--surface)' }}
              value={categoria}
              onChange={e => setCategoria(e.target.value as CategoriaGasto)}
            >
              {CATEGORIAS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          )}

          <input
            className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--border-subtle)' }}
            type="date" value={data}
            onChange={e => setData(e.target.value)}
            required
          />

          <input
            className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--border-subtle)' }}
            placeholder="Observação (opcional)"
            value={observacao}
            onChange={e => setObservacao(e.target.value)}
          />

          <Button type="submit" className="w-full mt-1">
            {editando ? 'Salvar' : 'Adicionar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/Transactions/
git commit -m "feat(ui): add TransactionItem, TransactionList, TransactionModal"
```

---

## Task 11: Receivable Components

**Files:**
- Create: `src/components/Receivables/ReceivableItem.tsx`
- Create: `src/components/Receivables/ReceivableList.tsx`
- Create: `src/components/Receivables/ReceivableModal.tsx`

- [ ] **Step 1: Write ReceivableItem**

```tsx
// src/components/Receivables/ReceivableItem.tsx
import { motion } from 'framer-motion'
import { Pencil, Trash2 } from 'lucide-react'
import { AReceber } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  recebivel: AReceber
  onToggle: (id: string) => void
  onEdit: (r: AReceber) => void
  onDelete: (id: string) => void
}

export function ReceivableItem({ recebivel: r, onToggle, onEdit, onDelete }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 px-4 py-3"
      style={{ opacity: r.recebido ? 0.5 : 1 }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: '#7C72D820', color: '#7C72D8' }}
      >
        {r.nome[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ textDecoration: r.recebido ? 'line-through' : 'none' }}>
          {r.nome}
        </p>
        {r.dataPrevista && (
          <p className="text-xs" style={{ color: 'var(--text-subtle)' }}>
            Previsto: {r.dataPrevista.split('-').reverse().join('/')}
          </p>
        )}
      </div>
      <span className="text-sm font-semibold" style={{ color: '#F59E0B' }}>
        {formatBRL(r.valor)}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        {!r.recebido && (
          <>
            <button onClick={() => onEdit(r)} style={{ color: 'var(--text-subtle)' }}>
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => onDelete(r.id)} style={{ color: 'var(--text-subtle)' }}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
        <button
          onClick={() => onToggle(r.id)}
          className="w-9 h-5 rounded-full transition-colors relative"
          style={{ background: r.recebido ? '#10B981' : 'var(--border-subtle)' }}
        >
          <div
            className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
            style={{ transform: r.recebido ? 'translateX(18px)' : 'translateX(2px)' }}
          />
        </button>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Write ReceivableList**

```tsx
// src/components/Receivables/ReceivableList.tsx
import { useState } from 'react'
import { AReceber, AReceberInput, BancoComSaldo } from '@/types'
import { ReceivableItem } from './ReceivableItem'
import { ReceivableModal } from './ReceivableModal'
import { SelectBancoModal } from '@/components/Modals/SelectBancoModal'

interface Props {
  recebiveis: AReceber[]
  bancos: BancoComSaldo[]
  onAdd: (data: AReceberInput) => void
  onUpdate: (id: string, data: Partial<AReceberInput>) => void
  onDelete: (id: string) => void
  onMarcarRecebido: (id: string, bancoId: string) => void
  onDesmarcarRecebido: (id: string) => void
  onNavigateToBancos: () => void
}

export function ReceivableList({
  recebiveis, bancos, onAdd, onUpdate, onDelete,
  onMarcarRecebido, onDesmarcarRecebido, onNavigateToBancos,
}: Props) {
  const [formOpen, setFormOpen] = useState(false)
  const [editando, setEditando] = useState<AReceber | null>(null)
  const [selectBancoId, setSelectBancoId] = useState<string | null>(null)

  function handleToggle(id: string) {
    const r = recebiveis.find(x => x.id === id)
    if (!r) return
    if (r.recebido) {
      onDesmarcarRecebido(id)
    } else {
      setSelectBancoId(id)
    }
  }

  function handleBancoSelect(bancoId: string) {
    if (selectBancoId) onMarcarRecebido(selectBancoId, bancoId)
    setSelectBancoId(null)
  }

  function handleSave(data: AReceberInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  return (
    <div className="flex flex-col gap-3">
      {recebiveis.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--text-subtle)' }}>
          Nenhum valor a receber cadastrado.
        </p>
      )}

      {recebiveis.length > 0 && (
        <div className="rounded-xl divide-y overflow-hidden"
          style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
          {recebiveis.map(r => (
            <ReceivableItem
              key={r.id} recebivel={r}
              onToggle={handleToggle}
              onEdit={x => { setEditando(x); setFormOpen(true) }}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      <ReceivableModal
        open={formOpen} editando={editando}
        onSave={handleSave}
        onClose={() => { setFormOpen(false); setEditando(null) }}
      />

      <SelectBancoModal
        open={selectBancoId !== null}
        bancos={bancos}
        onSelect={handleBancoSelect}
        onClose={() => setSelectBancoId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />
    </div>
  )
}
```

- [ ] **Step 3: Write ReceivableModal**

```tsx
// src/components/Receivables/ReceivableModal.tsx
import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AReceber, AReceberInput } from '@/types'

interface Props {
  open: boolean
  editando: AReceber | null
  onSave: (data: AReceberInput) => void
  onClose: () => void
}

export function ReceivableModal({ open, editando, onSave, onClose }: Props) {
  const [nome, setNome] = useState('')
  const [valor, setValor] = useState('')
  const [dataPrevista, setDataPrevista] = useState('')

  useEffect(() => {
    if (editando) {
      setNome(editando.nome)
      setValor(String(editando.valor))
      setDataPrevista(editando.dataPrevista ?? '')
    } else {
      setNome(''); setValor(''); setDataPrevista('')
    }
  }, [editando, open])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onSave({
      nome: nome.trim(),
      valor: parseFloat(valor),
      recebido: editando?.recebido ?? false,
      dataPrevista: dataPrevista || null,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar' : 'Novo a receber'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 pt-2">
          <input
            className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--border-subtle)' }}
            placeholder="Nome / descrição"
            value={nome}
            onChange={e => setNome(e.target.value)}
            required
          />
          <input
            className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
            style={{ border: '1px solid var(--border-subtle)' }}
            type="number" min="0.01" step="0.01"
            placeholder="Valor"
            value={valor}
            onChange={e => setValor(e.target.value)}
            required
          />
          <div className="flex flex-col gap-1">
            <label className="text-xs" style={{ color: 'var(--text-subtle)' }}>Data prevista (opcional)</label>
            <input
              className="rounded-md px-3 py-2 text-sm bg-transparent outline-none"
              style={{ border: '1px solid var(--border-subtle)' }}
              type="date" value={dataPrevista}
              onChange={e => setDataPrevista(e.target.value)}
            />
          </div>
          <Button type="submit" className="w-full mt-1">
            {editando ? 'Salvar' : 'Adicionar'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/Receivables/
git commit -m "feat(ui): add ReceivableItem, ReceivableList, ReceivableModal"
```

---

## Task 12: `IndicadoresRapidos` Component

**Files:**
- Create: `src/components/Dashboard/IndicadoresRapidos.tsx`

- [ ] **Step 1: Write the component**

```tsx
// src/components/Dashboard/IndicadoresRapidos.tsx
import { formatBRL } from '@/lib/utils'

interface Props {
  totalSaldo: number
  totalGastos: number
  totalEntradas: number
  totalFixas: number
  totalPendente: number
  fixasPagas: number
  fixasTotal: number
}

interface IndicadorProps {
  label: string
  value: string
  color: string
}

function Indicador({ label, value, color }: IndicadorProps) {
  return (
    <div
      className="flex flex-col gap-0.5 rounded-xl px-3 py-3"
      style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
    >
      <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>
        {label}
      </span>
      <span className="text-base font-bold tracking-tight" style={{ color }}>
        {value}
      </span>
    </div>
  )
}

export function IndicadoresRapidos({
  totalSaldo, totalGastos, totalEntradas,
  totalFixas, totalPendente, fixasPagas, fixasTotal,
}: Props) {
  const saldoReal = totalSaldo + totalPendente

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Indicador label="Saldo Total" value={formatBRL(totalSaldo)} color="#ffffff" />
        <Indicador label="Total Gastos" value={formatBRL(totalGastos)} color="#EF4444" />
        <Indicador label="Total Entradas" value={formatBRL(totalEntradas)} color="#10B981" />
        <Indicador label="Despesas Fixas" value={formatBRL(totalFixas)} color="#7C72D8" />
        <Indicador label="A Receber" value={formatBRL(totalPendente)} color="#F59E0B" />
        <Indicador
          label="Fixas Pagas"
          value={`${fixasPagas} de ${fixasTotal}`}
          color={fixasPagas === fixasTotal ? '#10B981' : '#ffffff'}
        />
      </div>

      <div
        className="rounded-xl px-4 py-3 flex items-center justify-between"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
      >
        <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-subtle)' }}>
          Saldo Real (incl. A Receber)
        </span>
        <span
          className="text-lg font-bold tracking-tight"
          style={{ color: saldoReal >= 0 ? '#10B981' : '#EF4444' }}
        >
          {formatBRL(saldoReal)}
        </span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/Dashboard/IndicadoresRapidos.tsx
git commit -m "feat(ui): add IndicadoresRapidos with 6 indicator cards and Saldo Real"
```

---

## Task 13: Tab Pages + Dashboard Orchestrator

**Files:**
- Create: `src/pages/HomeTab.tsx`
- Create: `src/pages/ContasTab.tsx`
- Create: `src/pages/GastosTab.tsx`
- Create: `src/pages/BancosTab.tsx`
- Create: `src/pages/ReceberTab.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Write HomeTab**

```tsx
// src/pages/HomeTab.tsx
import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { IndicadoresRapidos } from '@/components/Dashboard/IndicadoresRapidos'
import { ChartsPizza } from '@/components/Charts/ChartsPizza'
import { ResumoMes, BancoComSaldo, Transacao, AReceber, CategoriaGasto, Conta } from '@/types'

interface Props {
  resumo: ResumoMes
  receita: number
  contas: Conta[]
  bancos: BancoComSaldo[]
  totalSaldo: number
  totalGastos: number
  totalEntradas: number
  totalPendente: number
  gastosPorCategoria: Record<CategoriaGasto, number>
  onEditReceita: () => void
}

export function HomeTab({
  resumo, receita, contas, bancos,
  totalSaldo, totalGastos, totalEntradas, totalPendente,
  gastosPorCategoria, onEditReceita,
}: Props) {
  const fixasPagas = contas.filter(c => c.categoria === 'fixo' && c.pago).length
  const fixasTotal = contas.filter(c => c.categoria === 'fixo').length

  return (
    <div className="flex flex-col gap-4">
      <ResumoCards
        resumo={resumo}
        receita={receita}
        semContas={contas.length === 0}
        onEditReceita={onEditReceita}
      />
      <IndicadoresRapidos
        totalSaldo={totalSaldo}
        totalGastos={totalGastos}
        totalEntradas={totalEntradas}
        totalFixas={resumo.totalGeral}
        totalPendente={totalPendente}
        fixasPagas={fixasPagas}
        fixasTotal={fixasTotal}
      />
      {Object.keys(gastosPorCategoria).length > 0 && (
        <ChartsPizza gastosPorCategoria={gastosPorCategoria} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Write ContasTab**

```tsx
// src/pages/ContasTab.tsx
import { useState } from 'react'
import { BillList } from '@/components/BillList/BillList'
import { BillModal } from '@/components/Modals/BillModal'
import { SelectBancoModal } from '@/components/Modals/SelectBancoModal'
import { Conta, ContaInput, BancoComSaldo } from '@/types'

interface Props {
  contas: Conta[]
  bancos: BancoComSaldo[]
  onTogglePago: (id: string, pago: boolean) => Promise<void>
  onTogglePagoComBanco: (id: string, bancoId: string, contaData: { nome: string; valor: number; vencimento: string | null }) => Promise<void>
  onDesfazerPagamento: (id: string) => Promise<void>
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => Promise<void>
  onAdd: (data: ContaInput) => Promise<void>
  onUpdate: (id: string, data: Partial<ContaInput>) => Promise<void>
  onNavigateToBancos: () => void
}

export function ContasTab({
  contas, bancos,
  onTogglePagoComBanco, onDesfazerPagamento,
  onDelete, onAdd, onUpdate, onNavigateToBancos,
}: Props) {
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)

  function handleToggle(id: string, pago: boolean) {
    const conta = contas.find(c => c.id === id)
    if (!conta) return
    if (pago) {
      onDesfazerPagamento(id)
    } else {
      setPendingToggleId(id)
    }
  }

  function handleBancoSelect(bancoId: string) {
    if (!pendingToggleId) return
    const conta = contas.find(c => c.id === pendingToggleId)
    if (conta) {
      onTogglePagoComBanco(pendingToggleId, bancoId, {
        nome: conta.nome, valor: conta.valor, vencimento: conta.vencimento,
      })
    }
    setPendingToggleId(null)
  }

  function handleSave(data: ContaInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <BillList
        contas={contas}
        onTogglePago={handleToggle}
        onEdit={c => { setEditando(c); setBillModalOpen(true) }}
        onDelete={onDelete}
        onAdd={() => { setEditando(null); setBillModalOpen(true) }}
      />

      <BillModal
        open={billModalOpen}
        onClose={() => { setBillModalOpen(false); setEditando(null) }}
        onSave={handleSave}
        editando={editando}
      />

      <SelectBancoModal
        open={pendingToggleId !== null}
        bancos={bancos}
        onSelect={handleBancoSelect}
        onClose={() => setPendingToggleId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />
    </div>
  )
}
```

- [ ] **Step 3: Write GastosTab**

```tsx
// src/pages/GastosTab.tsx
import { useState } from 'react'
import { Transacao, TransacaoInput, BancoComSaldo } from '@/types'
import { TransactionList } from '@/components/Transactions/TransactionList'
import { TransactionModal } from '@/components/Transactions/TransactionModal'

interface Props {
  transacoes: Transacao[]
  bancos: BancoComSaldo[]
  onAdd: (data: TransacaoInput) => Promise<void>
  onUpdate: (id: string, data: Partial<TransacaoInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
}

export function GastosTab({ transacoes, bancos, onAdd, onUpdate, onDelete }: Props) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Transacao | null>(null)

  function handleSave(data: TransacaoInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  return (
    <div className="flex flex-col gap-4">
      <TransactionList
        transacoes={transacoes}
        bancos={bancos}
        onEdit={t => { setEditando(t); setModalOpen(true) }}
        onDelete={onDelete}
      />
      <TransactionModal
        open={modalOpen}
        editando={editando}
        bancos={bancos}
        onSave={handleSave}
        onClose={() => { setModalOpen(false); setEditando(null) }}
      />
    </div>
  )
}
```

- [ ] **Step 4: Write BancosTab**

```tsx
// src/pages/BancosTab.tsx
import { BancoComSaldo, BancoInput, Transacao } from '@/types'
import { BankList } from '@/components/Banks/BankList'

interface Props {
  bancos: BancoComSaldo[]
  onAdd: (data: BancoInput) => Promise<void>
  onUpdate: (id: string, data: Partial<BancoInput>) => Promise<void>
  onDelete: (id: string) => Promise<string | null>
}

export function BancosTab({ bancos, onAdd, onUpdate, onDelete }: Props) {
  return (
    <BankList
      bancos={bancos}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onDelete={onDelete}
    />
  )
}
```

- [ ] **Step 5: Write ReceberTab**

```tsx
// src/pages/ReceberTab.tsx
import { AReceber, AReceberInput, BancoComSaldo } from '@/types'
import { ReceivableList } from '@/components/Receivables/ReceivableList'

interface Props {
  recebiveis: AReceber[]
  bancos: BancoComSaldo[]
  onAdd: (data: AReceberInput) => Promise<void>
  onUpdate: (id: string, data: Partial<AReceberInput>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onMarcarRecebido: (id: string, bancoId: string) => Promise<void>
  onDesmarcarRecebido: (id: string) => Promise<void>
  onNavigateToBancos: () => void
}

export function ReceberTab(props: Props) {
  return <ReceivableList {...props} />
}
```

- [ ] **Step 6: Rewrite Dashboard.tsx as orchestrator**

Replace `src/pages/Dashboard.tsx` with:

```tsx
import { useState, useEffect, useRef } from 'react'
import { FileDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useBills } from '@/hooks/useBills'
import { useMonth } from '@/hooks/useMonth'
import { useTransactions } from '@/hooks/useTransactions'
import { useBanks } from '@/hooks/useBanks'
import { useReceivables } from '@/hooks/useReceivables'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/ui/Header'
import { BottomNav } from '@/components/BottomNav/BottomNav'
import { ReceitaModal } from '@/components/Modals/ReceitaModal'
import { CopiarFixosModal } from '@/components/Modals/CopiarFixosModal'
import { HomeTab } from './HomeTab'
import { ContasTab } from './ContasTab'
import { GastosTab } from './GastosTab'
import { BancosTab } from './BancosTab'
import { ReceberTab } from './ReceberTab'
import { AbaAtiva } from '@/types'
import { prevMesId } from '@/lib/utils'

export function Dashboard({ userId }: { userId: string }) {
  const { mesAtivo, abaAtiva, setAbaAtiva } = useAppStore()

  const { mesInfo, isLoading: isMonthLoading, setReceita, criarMes, copiarFixos, mesExiste } = useMonth(userId)
  const { contas, resumo, addConta, updateConta, deleteConta, togglePago, togglePagoComBanco, desfazerPagamento } =
    useBills(userId, mesAtivo, mesInfo?.receita ?? 0)
  const { transacoes, totalGastos, totalEntradas, gastosPorCategoria, gastosPorDia, addTransacao, updateTransacao, deleteTransacao } =
    useTransactions(userId, mesAtivo)
  const { bancos, totalSaldo, addBanco, updateBanco, deleteBanco } = useBanks(userId, mesAtivo, transacoes)
  const { recebiveis, totalPendente, addRecebivel, updateRecebivel, deleteRecebivel, marcarRecebido, desmarcarRecebido } =
    useReceivables(userId, mesAtivo)

  const [receitaModalOpen, setReceitaModalOpen] = useState(false)
  const [copiarModalOpen, setCopiarModalOpen] = useState(false)
  const [mesOrigemId, setMesOrigemId] = useState('')
  const inicializadoRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (isMonthLoading || mesInfo !== null) return
    if (inicializadoRef.current.has(mesAtivo)) return
    inicializadoRef.current.add(mesAtivo)
    const prevId = prevMesId(mesAtivo)
    mesExiste(prevId).then(async (existe) => {
      if (existe) { setMesOrigemId(prevId); setCopiarModalOpen(true) }
      else await criarMes(mesAtivo, 0)
    })
  }, [mesAtivo, mesInfo, isMonthLoading])

  async function handleCopiarFixos() {
    await criarMes(mesAtivo, 0)
    await copiarFixos(mesOrigemId, mesAtivo)
    setCopiarModalOpen(false)
  }

  async function exportarPDF() {
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'), import('jspdf'),
    ])
    const el = document.getElementById('tab-content')
    if (!el) return
    const canvas = await html2canvas(el, { backgroundColor: '#09090b', scale: 2 })
    const pdf = new jsPDF({ unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
    pdf.save(`minhascontas-${mesAtivo}.pdf`)
  }

  function renderFAB() {
    if (abaAtiva === 'home') return null
    const labels: Partial<Record<AbaAtiva, string>> = {
      contas: 'Adicionar conta',
      gastos: 'Novo lançamento',
      bancos: 'Novo banco',
      receber: 'Novo a receber',
    }
    return (
      <div
        className="fixed bottom-16 inset-x-0 flex justify-center items-end pb-5 pt-16 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #09090b 55%, transparent)', zIndex: 10 }}
      >
        <motion.button
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 280, damping: 22 }}
          onClick={() => {
            // FAB triggers add action per tab via event
            document.dispatchEvent(new CustomEvent(`fab-${abaAtiva}`))
          }}
          className="pointer-events-auto flex items-center gap-2 rounded-full text-[13px] font-semibold"
          style={{ background: '#ffffff', color: '#09090b', padding: '12px 26px', boxShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <span style={{ fontSize: 20, fontWeight: 200, lineHeight: 1, marginTop: -1 }}>+</span>
          {labels[abaAtiva]}
        </motion.button>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--app-bg)' }}>
      <Header />

      <main id="tab-content" className="max-w-2xl mx-auto px-5 py-5 pb-40 flex flex-col gap-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={abaAtiva}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
          >
            {abaAtiva === 'home' && (
              <HomeTab
                resumo={resumo}
                receita={mesInfo?.receita ?? 0}
                contas={contas}
                bancos={bancos}
                totalSaldo={totalSaldo}
                totalGastos={totalGastos}
                totalEntradas={totalEntradas}
                totalPendente={totalPendente}
                gastosPorCategoria={gastosPorCategoria}
                onEditReceita={() => setReceitaModalOpen(true)}
              />
            )}
            {abaAtiva === 'contas' && (
              <ContasTab
                contas={contas}
                bancos={bancos}
                onTogglePago={togglePago}
                onTogglePagoComBanco={togglePagoComBanco}
                onDesfazerPagamento={desfazerPagamento}
                onEdit={() => {}}
                onDelete={deleteConta}
                onAdd={addConta}
                onUpdate={updateConta}
                onNavigateToBancos={() => setAbaAtiva('bancos')}
              />
            )}
            {abaAtiva === 'gastos' && (
              <GastosTab
                transacoes={transacoes}
                bancos={bancos}
                onAdd={addTransacao}
                onUpdate={updateTransacao}
                onDelete={deleteTransacao}
              />
            )}
            {abaAtiva === 'bancos' && (
              <BancosTab
                bancos={bancos}
                onAdd={addBanco}
                onUpdate={updateBanco}
                onDelete={deleteBanco}
              />
            )}
            {abaAtiva === 'receber' && (
              <ReceberTab
                recebiveis={recebiveis}
                bancos={bancos}
                onAdd={addRecebivel}
                onUpdate={updateRecebivel}
                onDelete={deleteRecebivel}
                onMarcarRecebido={marcarRecebido}
                onDesmarcarRecebido={desmarcarRecebido}
                onNavigateToBancos={() => setAbaAtiva('bancos')}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {abaAtiva === 'home' && contas.length > 0 && (
          <div className="flex justify-center py-2">
            <button
              onClick={exportarPDF}
              className="flex items-center gap-1.5 text-[12px] transition-colors"
              style={{ color: 'rgba(255,255,255,0.18)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.18)')}
            >
              <FileDown className="w-3.5 h-3.5" />
              Exportar PDF
            </button>
          </div>
        )}
      </main>

      {renderFAB()}

      <BottomNav ativa={abaAtiva} onChange={setAbaAtiva} />

      <ReceitaModal
        open={receitaModalOpen}
        valorAtual={mesInfo?.receita ?? 0}
        onSave={setReceita}
        onClose={() => setReceitaModalOpen(false)}
      />
      <CopiarFixosModal
        open={copiarModalOpen}
        mesOrigemId={mesOrigemId}
        mesDestinoId={mesAtivo}
        onCopiar={handleCopiarFixos}
        onPular={async () => { await criarMes(mesAtivo, 0); setCopiarModalOpen(false) }}
      />
    </div>
  )
}
```

- [ ] **Step 7: Verify build**

Run: `npm run build 2>&1 | head -30`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
git add src/pages/
git commit -m "feat: refactor Dashboard to tab orchestrator, add HomeTab/ContasTab/GastosTab/BancosTab/ReceberTab"
```

---

## Task 14: Update `ChartsPizza` for Transactions

**Files:**
- Modify: `src/components/Charts/ChartsPizza.tsx`

- [ ] **Step 1: Read current ChartsPizza signature**

Read `src/components/Charts/ChartsPizza.tsx` to see the current props. The component currently accepts `contas: Conta[]`. We need to change it to accept `gastosPorCategoria: Record<CategoriaGasto, number>`.

- [ ] **Step 2: Update component props and data source**

Change the component to accept `gastosPorCategoria` directly. Replace the import of `Conta` types and internal data derivation with:

```tsx
import { CategoriaGasto } from '@/types'
import { formatBRL } from '@/lib/utils'

const CATEGORIA_COLORS: Record<string, string> = {
  alimentacao: '#EF4444', transporte: '#F59E0B', saude: '#10B981',
  lazer: '#6366F1', educacao: '#8B5CF6', moradia: '#EC4899',
  vestuario: '#14B8A6', servicos: '#F97316', despesaFixa: '#7C72D8', outros: '#94A3B8',
}

const CATEGORIA_LABEL: Record<CategoriaGasto, string> = {
  alimentacao: 'Alimentação', transporte: 'Transporte', saude: 'Saúde',
  lazer: 'Lazer', educacao: 'Educação', moradia: 'Moradia',
  vestuario: 'Vestuário', servicos: 'Serviços', despesaFixa: 'Despesa Fixa', outros: 'Outros',
}

interface Props {
  gastosPorCategoria: Record<CategoriaGasto, number>
}
```

The chart data becomes:
```tsx
const data = Object.entries(gastosPorCategoria).map(([cat, valor]) => ({
  name: CATEGORIA_LABEL[cat as CategoriaGasto] ?? cat,
  value: valor,
  color: CATEGORIA_COLORS[cat] ?? '#94A3B8',
}))
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/components/Charts/ChartsPizza.tsx
git commit -m "feat(charts): update ChartsPizza to use gastosPorCategoria from transactions"
```

---

## Task 15: `ChartsBarBancos` + `ChartsLinhaDia`

**Files:**
- Create: `src/components/Charts/ChartsBarBancos.tsx`
- Create: `src/components/Charts/ChartsLinhaDia.tsx`

- [ ] **Step 1: Write ChartsBarBancos**

```tsx
// src/components/Charts/ChartsBarBancos.tsx
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { BancoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  bancos: BancoComSaldo[]
}

export function ChartsBarBancos({ bancos }: Props) {
  if (bancos.length === 0) return null

  const data = bancos.map(b => ({
    name: b.nome,
    saldo: b.saldoAtual,
    gastos: b.gastos,
    entradas: b.entradas,
  }))

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-sm font-semibold mb-3">Saldo por banco</p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="35%">
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(v: number) => formatBRL(v)}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
          />
          <Bar dataKey="saldo" fill="#7C72D8" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 2: Write ChartsLinhaDia**

```tsx
// src/components/Charts/ChartsLinhaDia.tsx
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts'
import { formatBRL } from '@/lib/utils'

interface Props {
  gastosPorDia: { data: string; total: number }[]
}

export function ChartsLinhaDia({ gastosPorDia }: Props) {
  if (gastosPorDia.length === 0) return null

  const data = gastosPorDia.map(d => ({
    dia: d.data.split('-')[2],
    total: d.total,
  }))

  return (
    <div className="rounded-xl p-4" style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}>
      <p className="text-sm font-semibold mb-3">Gastos por dia</p>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={data}>
          <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'var(--text-subtle)' }} axisLine={false} tickLine={false} />
          <YAxis hide />
          <Tooltip
            formatter={(v: number) => formatBRL(v)}
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)', borderRadius: 8, fontSize: 12 }}
          />
          <Line type="monotone" dataKey="total" stroke="#EF4444" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
```

- [ ] **Step 3: Add charts to HomeTab**

In `src/pages/HomeTab.tsx`, import and add `ChartsBarBancos` and `ChartsLinhaDia`:

```tsx
import { ChartsBarBancos } from '@/components/Charts/ChartsBarBancos'
import { ChartsLinhaDia } from '@/components/Charts/ChartsLinhaDia'
```

Add to Props:
```tsx
gastosPorDia: { data: string; total: number }[]
```

Add to the JSX after ChartsPizza:
```tsx
<ChartsBarBancos bancos={bancos} />
<ChartsLinhaDia gastosPorDia={gastosPorDia} />
```

Update Dashboard.tsx to pass `gastosPorDia` to HomeTab.

- [ ] **Step 4: Verify build**

Run: `npm run build 2>&1 | head -20`
Expected: no errors

- [ ] **Step 5: Commit**

```bash
git add src/components/Charts/ChartsBarBancos.tsx src/components/Charts/ChartsLinhaDia.tsx src/pages/HomeTab.tsx src/pages/Dashboard.tsx
git commit -m "feat(charts): add ChartsBarBancos and ChartsLinhaDia"
```

---

## Task 16: Firestore Index

**Files:**
- Create: `firestore.indexes.json`

- [ ] **Step 1: Create index file**

```json
{
  "indexes": [
    {
      "collectionGroup": "transactions",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "bancoId", "order": "ASCENDING" },
        { "fieldPath": "data", "order": "DESCENDING" }
      ]
    }
  ],
  "fieldOverrides": []
}
```

- [ ] **Step 2: Commit**

```bash
git add firestore.indexes.json
git commit -m "feat(firestore): add composite index for (bancoId, data desc)"
```

---

## Task 17: Unit Tests for Bank Computed Logic

**Files:**
- Create: `src/lib/calcBancos.ts`
- Create: `src/lib/calcBancos.test.ts`

- [ ] **Step 1: Write pure helper function**

```ts
// src/lib/calcBancos.ts
import { Banco, BancoComSaldo, Transacao } from '@/types'

export function computeBancoSaldo(banco: Banco, transacoes: Transacao[]): BancoComSaldo {
  const txs = transacoes.filter(t => t.bancoId === banco.id)
  const gastos = txs.filter(t => t.tipo === 'gasto').reduce((s, t) => s + t.valor, 0)
  const entradas = txs.filter(t => t.tipo === 'entrada').reduce((s, t) => s + t.valor, 0)
  return { ...banco, gastos, entradas, saldoAtual: banco.saldoInicial + entradas - gastos }
}

export function computeTotalSaldo(bancos: BancoComSaldo[]): number {
  return bancos.reduce((s, b) => s + b.saldoAtual, 0)
}
```

- [ ] **Step 2: Write failing tests**

```ts
// src/lib/calcBancos.test.ts
import { describe, it, expect } from 'vitest'
import { computeBancoSaldo, computeTotalSaldo } from './calcBancos'
import { Banco, Transacao } from '@/types'

const makeBanco = (overrides: Partial<Banco> = {}): Banco => ({
  id: 'b1', nome: 'Nubank', saldoInicial: 1000, criadoEm: new Date(), ...overrides,
})

const makeTx = (overrides: Partial<Transacao> = {}): Transacao => ({
  id: 't1', data: '2026-05-01', descricao: 'Compra', bancoId: 'b1',
  valor: 100, tipo: 'gasto', categoria: 'alimentacao',
  despesaFixa: false, criadoEm: new Date(), ...overrides,
} as Transacao)

describe('computeBancoSaldo', () => {
  it('no transactions returns saldoInicial', () => {
    const result = computeBancoSaldo(makeBanco(), [])
    expect(result.saldoAtual).toBe(1000)
    expect(result.gastos).toBe(0)
    expect(result.entradas).toBe(0)
  })

  it('gastos reduce saldo', () => {
    const result = computeBancoSaldo(makeBanco(), [makeTx({ valor: 300 })])
    expect(result.gastos).toBe(300)
    expect(result.saldoAtual).toBe(700)
  })

  it('entradas increase saldo', () => {
    const result = computeBancoSaldo(
      makeBanco(),
      [makeTx({ id: 't2', tipo: 'entrada', valor: 500, categoria: undefined as never })]
    )
    expect(result.entradas).toBe(500)
    expect(result.saldoAtual).toBe(1500)
  })

  it('ignores transactions for other banks', () => {
    const result = computeBancoSaldo(
      makeBanco({ id: 'b1' }),
      [makeTx({ bancoId: 'b2', valor: 999 })]
    )
    expect(result.gastos).toBe(0)
    expect(result.saldoAtual).toBe(1000)
  })

  it('multiple transactions combined correctly', () => {
    const txs: Transacao[] = [
      makeTx({ id: 't1', tipo: 'gasto', categoria: 'alimentacao', valor: 200 }),
      makeTx({ id: 't2', tipo: 'entrada', valor: 400 } as Transacao),
      makeTx({ id: 't3', tipo: 'gasto', categoria: 'transporte', valor: 50 }),
    ]
    const result = computeBancoSaldo(makeBanco(), txs)
    expect(result.gastos).toBe(250)
    expect(result.entradas).toBe(400)
    expect(result.saldoAtual).toBe(1150)
  })
})

describe('computeTotalSaldo', () => {
  it('sums saldoAtual across all banks', () => {
    const bancos = [
      { ...makeBanco({ id: 'b1' }), gastos: 0, entradas: 0, saldoAtual: 500 },
      { ...makeBanco({ id: 'b2' }), gastos: 0, entradas: 0, saldoAtual: 300 },
    ]
    expect(computeTotalSaldo(bancos)).toBe(800)
  })

  it('returns 0 for empty list', () => {
    expect(computeTotalSaldo([])).toBe(0)
  })
})
```

- [ ] **Step 3: Run tests and verify they pass**

Run: `npm run test -- --run src/lib/calcBancos.test.ts`
Expected: all tests PASS

- [ ] **Step 4: Commit**

```bash
git add src/lib/calcBancos.ts src/lib/calcBancos.test.ts
git commit -m "test: add unit tests for computeBancoSaldo and computeTotalSaldo"
```

---

## Task 18: Final Verification

- [ ] **Step 1: Run all tests**

Run: `npm run test -- --run`
Expected: all tests pass

- [ ] **Step 2: Full build check**

Run: `npm run build`
Expected: build succeeds, no TypeScript errors

- [ ] **Step 3: Dev server smoke test**

Run: `npm run dev` and manually verify:
- Bottom nav renders with 5 tabs
- Tab switching works
- Home tab shows IndicadoresRapidos
- Bancos tab: add a bank, see computed saldo = saldoInicial
- Gastos tab: add a transaction, bank saldo updates automatically
- A Receber tab: toggle receivable, SelectBancoModal appears
- Contas tab: mark bill as paid, SelectBancoModal appears, transaction created in Gastos tab

- [ ] **Step 4: Commit if any fixes needed**

```bash
git add -p
git commit -m "fix: final smoke test corrections"
```
