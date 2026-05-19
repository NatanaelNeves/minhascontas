# Reestruturação Financeira — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Separar claramente patrimônio real (bancos + benefícios) vs. balanço do mês vs. a receber; corrigir lógica de cartão de crédito no saldo bancário; adicionar propagação automática de parcelas entre meses; adicionar data de pagamento em contas; reorganizar HomeTab visualmente.

**Architecture:** Alterações na camada de dados primeiro (types, hooks), depois novos componentes UI (SaldoPatrimonial, HomeResumoMes, PagarContaModal, ConfirmDeleteParcelaModal), depois reestruturação do HomeTab e adições na ContasTab. Sem novas bibliotecas. Todo o estado vive no Firestore com a estrutura existente mais campos novos no documento de conta.

**Tech Stack:** React 18 + TypeScript + Framer Motion + Firebase Firestore. Tokens em `src/styles/tokens.css`. Side-sheet pattern: `createPortal(document.body)` + `AnimatePresence` + `motion.div`. Modais centrados: `position: fixed`, `left: 50%`, `top: 50%`, `transform: translate(-50%, -50%)`. Zero `any`, zero `window.confirm`, zero cores hardcoded, zero novas libs.

---

## File Structure

**Criados:**
- `src/components/Dashboard/SaldoPatrimonial.tsx` — Bloco 1: bancos (conta corrente) + benefícios (vale_*) + total disponível
- `src/components/Dashboard/HomeResumoMes.tsx` — Bloco 2: receita − contas fixas − gastos variáveis = sobra estimada
- `src/components/Modals/PagarContaModal.tsx` — Modal centrado: data de pagamento + seleção de banco (substitui SelectBancoModal no ContasTab)
- `src/components/Modals/ConfirmDeleteParcelaModal.tsx` — Modal 3 botões: Cancelar | Só esta | Esta e as próximas

**Modificados:**
- `src/types/index.ts` — Adiciona `pagamento?: { data: string; bancoId: string }` e `parcelamentoId?: string` em Conta
- `src/hooks/useBanks.ts` — Exclui transações com `cartaoId` do cálculo de saldo bancário
- `src/hooks/useBills.ts` — Adiciona `dataPagamento: string` em `togglePagoComBanco`; limpa campo `pagamento` em `desfazerPagamento`
- `src/hooks/useMonth.ts` — Adiciona `criarContaComParcelas` (cria conta em N meses futuros) e `excluirParcelamentosRestantes` (deleta a partir de parcelaAtual); `copiarFixos` pula contas com `parcelamentoId`
- `src/components/Modals/BillModal.tsx` — Lógica de parcelas inteligente: campo valorTotal + auto-cálculo valorParcela; prop `onSaveParcelada?` para criação em múltiplos meses
- `src/components/BillItem/BillItem.tsx` — Badge "Pago em DD/MM"; ConfirmDeleteParcelaModal para contas com `parcelamentoId`; prop `onDeleteParcelamento?`
- `src/components/BillList/BillList.tsx` — Thread prop `onDeleteParcelamento?`
- `src/components/Dashboard/ResumoCards.tsx` — Remove hero "Sobra do mês"; mantém apenas barra de progresso + strip de 3 métricas (Total, Pago, Pendente)
- `src/components/Dashboard/IndicadoresRapidos.tsx` — Remove row "Saldo Real (incl. A Receber)"
- `src/pages/HomeTab.tsx` — Adiciona prop `cartoesComSaldo`; remove `totalSaldo`, `totalEntradas`; reordena: SaldoPatrimonial → HomeResumoMes → ResumoCards(progress+strip) → AReceber → ComparacaoMeses → charts
- `src/pages/ContasTab.tsx` — Adiciona strip de resumo; substitui SelectBancoModal por PagarContaModal para pagamento de contas; threads `onDeleteParcelamento` e `onSaveParcelada`
- `src/pages/Dashboard.tsx` — Passa `cartoesComSaldo` para HomeTab; adiciona `criarContaComParcelas` e `excluirParcelamentosRestantes` do useMonth; threads para ContasTab

---

## Task 1: Extensão de tipos em Conta

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Adicionar campos a Conta**

Localizar a interface `Conta` (linha 11) e adicionar dois campos opcionais:

```ts
export interface Conta {
  id: string
  nome: string
  valor: number
  categoria: Categoria
  formaPagamento: FormaPagamento
  vencimento: string | null
  pago: boolean
  parcelas: Parcelas | null
  parcelamentoId?: string          // UUID compartilhado entre parcelas do mesmo parcelamento
  pagamento?: { data: string; bancoId: string }  // registrado quando marcado como pago
  criadoEm: Date
}
```

`ContaInput = Omit<Conta, "id" | "criadoEm">` já inclui os novos campos automaticamente — sem mudança.

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sem output (zero erros).

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add parcelamentoId and pagamento fields to Conta"
```

---

## Task 2: useBanks — excluir transações de cartão do saldo bancário

**Files:**
- Modify: `src/hooks/useBanks.ts:65-78`

**Contexto:** Quando usuário lança gasto com cartão de crédito ou benefício, a transação tem `cartaoId` definido. O saldo bancário NÃO deve ser afetado no momento do gasto — só quando a fatura é paga. Atualmente useBanks conta essas transações como débito bancário, o que está errado.

- [ ] **Step 1: Corrigir cálculo de gastos por banco**

No useMemo de `bancos` (linha 65), alterar o filtro de gastos:

```ts
const bancos = useMemo<BancoComSaldo[]>(
  () =>
    bancosRaw.map(b => {
      const txs = porBanco[b.id] ?? []
      const gastos = txs
        .filter(t => t.tipo === 'gasto' && !t.cartaoId)   // ← exclui compras em cartão
        .reduce((s, t) => s + t.valor, 0)
      const entradas = txs
        .filter(t => t.tipo === 'entrada')
        .reduce((s, t) => s + t.valor, 0)
      return { ...b, gastos, entradas, saldoAtual: b.saldoInicial + entradas - gastos }
    }),
  [bancosRaw, porBanco],
)
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useBanks.ts
git commit -m "fix(useBanks): exclude cartaoId transactions from bank balance calculation"
```

---

## Task 3: useBills — data de pagamento em togglePagoComBanco

**Files:**
- Modify: `src/hooks/useBills.ts`

**Contexto:** Quando usuário marca conta como paga, precisa informar a data real do pagamento (não apenas o vencimento). Salvar em `conta.pagamento = { data, bancoId }`. A transação no banco deve usar a data selecionada pelo usuário, não o vencimento.

- [ ] **Step 1: Adicionar import deleteField e atualizar togglePagoComBanco**

```ts
import { writeBatch, doc, serverTimestamp, deleteField } from 'firebase/firestore'
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
    contaData: { nome: string; valor: number; vencimento: string | null },
    dataPagamento: string,
  ) => Promise<void>
  desfazerPagamento: (id: string) => Promise<void>
}
```

- [ ] **Step 2: Reescrever togglePagoComBanco e desfazerPagamento**

```ts
async function togglePagoComBanco(
  id: string,
  bancoId: string,
  contaData: { nome: string; valor: number; vencimento: string | null },
  dataPagamento: string,
) {
  const batch = writeBatch(db)
  batch.update(doc(db, billPath, id), {
    pago: true,
    pagamento: { data: dataPagamento, bancoId },
  })
  batch.set(doc(db, txPath, `bill_${id}`), {
    tipo: 'gasto',
    categoria: 'despesaFixa',
    bancoId,
    valor: contaData.valor,
    descricao: contaData.nome,
    data: dataPagamento,
    despesaFixa: true,
    origem: { tipo: 'bill', id },
    criadoEm: serverTimestamp(),
  })
  await batch.commit()
}

async function desfazerPagamento(id: string) {
  const batch = writeBatch(db)
  batch.update(doc(db, billPath, id), { pago: false, pagamento: deleteField() })
  batch.delete(doc(db, txPath, `bill_${id}`))
  await batch.commit()
}
```

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sem output. Erros de type em ContasTab/Dashboard por assinatura mudada serão corrigidos nas próximas tasks.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useBills.ts
git commit -m "feat(useBills): add dataPagamento param to togglePagoComBanco, clear pagamento on undo"
```

---

## Task 4: useMonth — criarContaComParcelas e excluirParcelamentosRestantes

**Files:**
- Modify: `src/hooks/useMonth.ts`

**Contexto:** Quando usuário cria conta com múltiplas parcelas, o sistema deve criar automaticamente bills nos meses futuros. `copiarFixos` deve pular contas que já têm `parcelamentoId` (já foram pré-criadas). Quando usuário exclui uma parcela, pode excluir "só esta" ou "esta e todas as próximas".

- [ ] **Step 1: Adicionar imports**

```ts
import { useState, useEffect } from 'react'
import {
  doc,
  getDoc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
  addDoc,
  query,
  where,
  deleteDoc,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MesInfo, ContaInput } from '@/types'
import { useAppStore } from '@/store/useAppStore'
import { nextMesId } from '@/lib/utils'
```

- [ ] **Step 2: Atualizar interface UseMonthReturn**

```ts
interface UseMonthReturn {
  mesInfo: MesInfo | null
  isLoading: boolean
  setReceita: (valor: number) => Promise<void>
  criarMes: (mesId: string, receita: number) => Promise<void>
  copiarFixos: (mesOrigemId: string, mesDestinoId: string) => Promise<void>
  mesExiste: (mesId: string) => Promise<boolean>
  criarContaComParcelas: (
    conta: ContaInput,
    parcelaTotal: number,
    mesInicialId: string,
  ) => Promise<void>
  excluirParcelamentosRestantes: (
    parcelamentoId: string,
    parcelaAtualFrom: number,
    parcelaTotal: number,
    mesAtualId: string,
  ) => Promise<void>
}
```

- [ ] **Step 3: Atualizar copiarFixos para pular parcelamentoId**

Dentro de `copiarFixos`, adicionar condição antes de criar a conta no mês destino:

```ts
async function copiarFixos(mesOrigemId: string, mesDestinoId: string) {
  const billsOrigemCol = collection(db, `users/${userId}/months/${mesOrigemId}/bills`)
  const snap = await getDocs(billsOrigemCol)
  const destCol = collection(db, `users/${userId}/months/${mesDestinoId}/bills`)

  for (const docSnap of snap.docs) {
    const data = docSnap.data()
    if (data.categoria !== 'fixo') continue
    if (data.parcelamentoId) continue                                       // ← NOVO: já pré-criado
    if (data.parcelas && data.parcelas.atual >= data.parcelas.total) continue

    const novaParcelas = data.parcelas
      ? { atual: data.parcelas.atual + 1, total: data.parcelas.total }
      : null

    await addDoc(destCol, {
      nome: data.nome,
      valor: data.valor,
      categoria: data.categoria,
      formaPagamento: data.formaPagamento,
      vencimento: data.vencimento ?? null,
      parcelas: novaParcelas,
      pago: false,
      criadoEm: serverTimestamp(),
    })
  }
}
```

- [ ] **Step 4: Implementar criarContaComParcelas**

```ts
async function criarContaComParcelas(
  conta: ContaInput,
  parcelaTotal: number,
  mesInicialId: string,
): Promise<void> {
  const parcelamentoId = crypto.randomUUID()
  let currentMes = mesInicialId

  for (let atual = 1; atual <= parcelaTotal; atual++) {
    const destCol = collection(db, `users/${userId}/months/${currentMes}/bills`)
    await addDoc(destCol, {
      nome: conta.nome,
      valor: conta.valor,
      categoria: conta.categoria,
      formaPagamento: conta.formaPagamento,
      vencimento: conta.vencimento ?? null,
      pago: false,
      parcelas: { atual, total: parcelaTotal },
      parcelamentoId,
      criadoEm: serverTimestamp(),
    })
    currentMes = nextMesId(currentMes)
  }
}
```

- [ ] **Step 5: Implementar excluirParcelamentosRestantes**

```ts
async function excluirParcelamentosRestantes(
  parcelamentoId: string,
  parcelaAtualFrom: number,
  parcelaTotal: number,
  mesAtualId: string,
): Promise<void> {
  let currentMes = mesAtualId

  for (let i = parcelaAtualFrom; i <= parcelaTotal; i++) {
    const billsCol = collection(db, `users/${userId}/months/${currentMes}/bills`)
    const snap = await getDocs(
      query(billsCol, where('parcelamentoId', '==', parcelamentoId)),
    )
    for (const docSnap of snap.docs) {
      await deleteDoc(docSnap.ref)
    }
    currentMes = nextMesId(currentMes)
  }
}
```

- [ ] **Step 6: Adicionar ao return do hook**

```ts
return {
  mesInfo,
  isLoading,
  setReceita,
  criarMes,
  copiarFixos,
  mesExiste,
  criarContaComParcelas,
  excluirParcelamentosRestantes,
}
```

- [ ] **Step 7: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sem output (erros em Dashboard serão corrigidos na task final).

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useMonth.ts
git commit -m "feat(useMonth): add criarContaComParcelas + excluirParcelamentosRestantes; copiarFixos skips parcelamentoId"
```

---

## Task 5: ConfirmDeleteParcelaModal — modal com 3 opções

**Files:**
- Create: `src/components/Modals/ConfirmDeleteParcelaModal.tsx`

**Contexto:** Quando usuário exclui uma conta com `parcelamentoId`, deve escolher entre excluir só esta parcela ou esta + todas as próximas. Modal centrado (não side-sheet), usando o mesmo padrão visual do ConfirmDeleteModal existente.

- [ ] **Step 1: Criar o arquivo**

```tsx
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface Props {
  open: boolean
  parcelaAtual: number
  parcelaTotal: number
  onDeleteSo: () => void
  onDeleteRestantes: () => void
  onClose: () => void
}

export function ConfirmDeleteParcelaModal({
  open,
  parcelaAtual,
  parcelaTotal,
  onDeleteSo,
  onDeleteRestantes,
  onClose,
}: Props) {
  const restantes = parcelaTotal - parcelaAtual

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed', zIndex: 61,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(340px, calc(100vw - 32px))',
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '22px 22px 18px' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 6 }}>
                Excluir parcela {parcelaAtual}/{parcelaTotal}?
              </p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {restantes > 0
                  ? `Há ${restantes} parcela${restantes > 1 ? 's' : ''} restante${restantes > 1 ? 's' : ''} em meses futuros.`
                  : 'Esta é a última parcela.'}
              </p>
            </div>
            <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                onClick={onClose}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                  fontFamily: 'inherit', cursor: 'pointer', transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                Cancelar
              </button>
              <button
                onClick={() => { onDeleteSo(); onClose() }}
                style={{
                  width: '100%', padding: '11px', borderRadius: 10,
                  background: 'var(--red-muted)', border: '1px solid rgba(239,68,68,0.3)',
                  color: 'var(--red)', fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit', cursor: 'pointer', transition: 'all .15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'var(--red)'
                  e.currentTarget.style.color = '#fff'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'var(--red-muted)'
                  e.currentTarget.style.color = 'var(--red)'
                }}
              >
                Excluir só esta parcela
              </button>
              {restantes > 0 && (
                <button
                  onClick={() => { onDeleteRestantes(); onClose() }}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 10,
                    background: 'var(--red)', border: 'none',
                    color: '#fff', fontSize: 13, fontWeight: 600,
                    fontFamily: 'inherit', cursor: 'pointer', transition: 'opacity .15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  Excluir esta + {restantes} próxima{restantes > 1 ? 's' : ''}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add src/components/Modals/ConfirmDeleteParcelaModal.tsx
git commit -m "feat(ui): add ConfirmDeleteParcelaModal with 3 options"
```

---

## Task 6: PagarContaModal — data de pagamento + banco

**Files:**
- Create: `src/components/Modals/PagarContaModal.tsx`

**Contexto:** Quando usuário clica no checkbox de uma conta não paga, em vez do SelectBancoModal abrimos um modal centrado que pede a data de pagamento (default: hoje) e o banco. Ao confirmar, chama `onConfirm(bancoId, data)`.

- [ ] **Step 1: Criar o arquivo**

```tsx
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { BancoComSaldo } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  open: boolean
  bancos: BancoComSaldo[]
  contaNome: string
  contaValor: number
  onConfirm: (bancoId: string, data: string) => void
  onClose: () => void
  onNavigateToBancos?: () => void
}

export function PagarContaModal({
  open,
  bancos,
  contaNome,
  contaValor,
  onConfirm,
  onClose,
  onNavigateToBancos,
}: Props) {
  const hoje = new Date().toISOString().split('T')[0]
  const [data, setData] = useState(hoje)
  const [bancoId, setBancoId] = useState(bancos[0]?.id ?? '')

  // Reset quando modal abre
  useState(() => {
    if (open) {
      setData(hoje)
      setBancoId(bancos[0]?.id ?? '')
    }
  })

  const canConfirm = !!bancoId && !!data

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 60,
              background: 'rgba(0,0,0,0.7)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            style={{
              position: 'fixed', zIndex: 61,
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(360px, calc(100vw - 32px))',
              background: 'var(--bg-elevated)',
              border: '0.5px solid var(--border)',
              borderRadius: 16,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{ padding: '20px 20px 16px', borderBottom: '0.5px solid var(--border)' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 4 }}>
                Registrar pagamento
              </p>
              <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 2 }}>
                {contaNome}
              </p>
              <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(contaValor)}
              </p>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Data */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Data do pagamento
                </p>
                <input
                  type="date"
                  value={data}
                  onChange={e => setData(e.target.value)}
                  style={{
                    width: '100%',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    fontSize: 14,
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontFamily: 'inherit',
                    colorScheme: 'dark',
                    transition: 'border-color .15s',
                  }}
                  onFocus={e => (e.target.style.borderColor = 'var(--border-strong)')}
                  onBlur={e => (e.target.style.borderColor = 'var(--border)')}
                />
              </div>

              {/* Banco */}
              <div>
                <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Débitar de
                </p>
                {bancos.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '12px 0' }}>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10 }}>
                      Nenhum banco cadastrado.
                    </p>
                    {onNavigateToBancos && (
                      <button
                        onClick={() => { onClose(); onNavigateToBancos() }}
                        style={{
                          padding: '8px 18px', borderRadius: 99, fontSize: 13, fontWeight: 600,
                          background: 'var(--text-primary)', color: 'var(--bg-base)',
                          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Ir para Bancos
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {bancos.map(b => (
                      <button
                        key={b.id}
                        onClick={() => setBancoId(b.id)}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '10px 14px', borderRadius: 10,
                          background: bancoId === b.id ? 'var(--text-primary)' : 'var(--bg-surface)',
                          border: bancoId === b.id ? '1px solid var(--text-primary)' : '1px solid var(--border)',
                          cursor: 'pointer', fontFamily: 'inherit',
                          transition: 'all .15s',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {b.cor && (
                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: b.cor, flexShrink: 0 }} />
                          )}
                          <span style={{
                            fontSize: 13, fontWeight: 500,
                            color: bancoId === b.id ? 'var(--bg-base)' : 'var(--text-primary)',
                          }}>
                            {b.nome}
                          </span>
                        </div>
                        <span style={{
                          fontSize: 13, fontVariantNumeric: 'tabular-nums',
                          color: bancoId === b.id ? 'var(--bg-base)' : 'var(--text-secondary)',
                        }}>
                          {formatBRL(b.saldoAtual)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: '0 16px 16px', display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
                style={{
                  flex: 1, padding: '11px', borderRadius: 10,
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
                  fontFamily: 'inherit', cursor: 'pointer', transition: 'color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
              >
                Cancelar
              </button>
              <button
                onClick={() => { if (canConfirm) { onConfirm(bancoId, data); onClose() } }}
                disabled={!canConfirm}
                style={{
                  flex: 2, padding: '11px', borderRadius: 10,
                  background: canConfirm ? 'var(--green)' : 'rgba(255,255,255,0.06)',
                  border: 'none',
                  color: canConfirm ? '#fff' : 'var(--text-tertiary)',
                  fontSize: 13, fontWeight: 600,
                  fontFamily: 'inherit', cursor: canConfirm ? 'pointer' : 'not-allowed',
                  transition: 'all .2s', letterSpacing: '-0.01em',
                }}
              >
                Registrar pagamento
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add src/components/Modals/PagarContaModal.tsx
git commit -m "feat(ui): add PagarContaModal with date picker + bank selection"
```

---

## Task 7: BillModal — smart parcelas calculation

**Files:**
- Modify: `src/components/Modals/BillModal.tsx`

**Contexto:** Quando `temParcelas = true`:
- O campo principal (`centStr`) = valor de cada parcela
- Novo campo `parcelasTotal` = número de parcelas (default 2)
- Campo somente-leitura mostrando o total calculado (= valor × N)
- Nova prop opcional `onSaveParcelada?(data: ContaInput, parcelaTotal: number): void` — usada para criar nos meses futuros
- Se `onSaveParcelada` não for fornecida, cai no `onSave` normal (para edição de parcela existente)

**Atenção:** Remover os campos "Parcela atual" e "Total" do modo atual (números brutos). Substituir por "Número de parcelas" (quantidade, de 2 em diante) e exibir valorTotal calculado.

- [ ] **Step 1: Atualizar interface Props e adicionar onSaveParcelada**

Substituir a interface Props de:
```ts
interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ContaInput) => void
  editando?: Conta | null
}
```
Para:
```ts
interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ContaInput) => void
  onSaveParcelada?: (data: ContaInput, parcelaTotal: number) => void
  editando?: Conta | null
}
```

- [ ] **Step 2: Adicionar estado parcelasTotal**

Dentro da função `BillModal`, após o estado `temParcelas`:

```ts
const [parcelasTotal, setParcelasTotal] = useState(2)
```

No `useEffect` que popula form ao editar, resetar `parcelasTotal`:
```ts
// dentro do if (editando):
setParcelasTotal(editando.parcelas?.total ?? 2)
// dentro do else:
setParcelasTotal(2)
```

- [ ] **Step 3: Atualizar handleSave**

```ts
function handleSave() {
  if (!form.nome.trim() || getCents() <= 0) return
  const data: ContaInput = {
    ...form,
    valor: getCents() / 100,
    parcelas: temParcelas ? { atual: 1, total: parcelasTotal } : null,
  }
  if (temParcelas && parcelasTotal > 1 && !editando && onSaveParcelada) {
    onSaveParcelada(data, parcelasTotal)
  } else {
    onSave({ ...data, parcelas: editando?.parcelas ?? (temParcelas ? { atual: 1, total: parcelasTotal } : null) })
  }
  onClose()
}
```

- [ ] **Step 4: Substituir seção de parcelas no JSX**

Localizar o bloco `<AnimatePresence>` das parcelas (que exibe "Parcela atual" e "Total") e substituir por:

```tsx
<AnimatePresence>
  {temParcelas && (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      style={{ overflow: 'hidden' }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div>
          <Label>Número de parcelas</Label>
          <input
            type="number"
            min={2}
            max={120}
            value={parcelasTotal}
            onChange={e => setParcelasTotal(Math.max(2, Number(e.target.value)))}
            style={{ ...baseInput, textAlign: 'center', fontSize: 20, fontWeight: 700 }}
          />
        </div>
        {getCents() > 0 && parcelasTotal >= 2 && (
          <div
            style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
            }}
          >
            <p style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 2 }}>
              Total do parcelamento
            </p>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((getCents() / 100) * parcelasTotal)}
            </p>
          </div>
        )}
        {!editando && (
          <p style={{ fontSize: 11, color: 'var(--text-tertiary)', lineHeight: 1.5 }}>
            As {parcelasTotal} parcelas serão criadas automaticamente nos próximos meses.
          </p>
        )}
      </div>
    </motion.div>
  )}
</AnimatePresence>
```

- [ ] **Step 5: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sem output.

- [ ] **Step 6: Commit**

```bash
git add src/components/Modals/BillModal.tsx
git commit -m "feat(BillModal): smart parcelas — total field + onSaveParcelada prop"
```

---

## Task 8: BillItem — badge "Pago em" + delete parcela

**Files:**
- Modify: `src/components/BillItem/BillItem.tsx`

**Contexto:** 
1. Quando `conta.pagamento` existe, mostrar badge "Pago em DD/MM" abaixo do nome.
2. Quando `conta.parcelamentoId` existe e usuário clica em excluir, usar `ConfirmDeleteParcelaModal` em vez do inline confirm.
3. Nova prop opcional `onDeleteParcelamento?` para escalar exclusão de todas.

- [ ] **Step 1: Atualizar interface Props**

```ts
interface Props {
  conta: Conta
  onTogglePago: (id: string, pago: boolean) => void
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => void
  onDeleteParcelamento?: (parcelamentoId: string, parcelaAtualFrom: number, parcelaTotal: number) => void
}
```

- [ ] **Step 2: Adicionar import ConfirmDeleteParcelaModal**

```ts
import { ConfirmDeleteParcelaModal } from '@/components/Modals/ConfirmDeleteParcelaModal'
```

- [ ] **Step 3: Adicionar estado confirmParcelaOpen**

No topo do componente BillItem:
```ts
const [confirmParcelaOpen, setConfirmParcelaOpen] = useState(false)
```

- [ ] **Step 4: Adicionar badge "Pago em DD/MM"**

Dentro do bloco `{/* Info */}`, após o nome da conta, adicionar:

```tsx
{conta.pagamento && (
  <p style={{ fontSize: 10, color: 'var(--green)', marginTop: 1, letterSpacing: '-0.01em' }}>
    Pago em {new Date(conta.pagamento.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
  </p>
)}
```

- [ ] **Step 5: Atualizar lógica de delete no hover**

Substituir o botão de trash no bloco de ações (dentro do `key="actions"`) para usar `ConfirmDeleteParcelaModal` quando há `parcelamentoId`:

```tsx
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
```

- [ ] **Step 6: Adicionar ConfirmDeleteParcelaModal ao return**

Dentro do return, após o `</motion.div>` principal, adicionar:

```tsx
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
```

- [ ] **Step 7: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sem output (erros em BillList/ContasTab resolvidos na próxima task).

- [ ] **Step 8: Commit**

```bash
git add src/components/BillItem/BillItem.tsx
git commit -m "feat(BillItem): pagamento badge, ConfirmDeleteParcelaModal for parcelamentoId items"
```

---

## Task 9: BillList — thread onDeleteParcelamento

**Files:**
- Modify: `src/components/BillList/BillList.tsx`

- [ ] **Step 1: Atualizar interface Props e passar para BillItem**

```tsx
interface Props {
  contas: Conta[]
  onTogglePago: (id: string, pago: boolean) => void
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => void
  onAdd: () => void
  onDeleteParcelamento?: (parcelamentoId: string, parcelaAtualFrom: number, parcelaTotal: number) => void
}

export function BillList({ contas, onTogglePago, onEdit, onDelete, onAdd, onDeleteParcelamento }: Props) {
```

No map que renderiza `BillItem`:

```tsx
<BillItem
  key={conta.id}
  conta={conta}
  onTogglePago={onTogglePago}
  onEdit={onEdit}
  onDelete={onDelete}
  onDeleteParcelamento={onDeleteParcelamento}
/>
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```
Expected: sem output.

- [ ] **Step 3: Commit**

```bash
git add src/components/BillList/BillList.tsx
git commit -m "feat(BillList): thread onDeleteParcelamento to BillItem"
```

---

## Task 10: SaldoPatrimonial — Bloco 1 do HomeTab

**Files:**
- Create: `src/components/Dashboard/SaldoPatrimonial.tsx`

**Contexto:** Bloco hero do HomeTab. Mostra separadamente:
- "Em bancos" = `totalSaldo` (somente contas correntes/poupança — benefícios NÃO incluídos aqui)
- "Em benefícios" = soma de `cartoesComSaldo.limiteDisponivel` onde tipo in `['vale_alimentacao', 'vale_refeicao', 'vale_combustivel']`
- "Total disponível" = soma dos dois

**Design:** Card com fundo levemente diferente (`--bg-surface`), borda sutil. Dois sub-itens com linha de separação, total em verde grande. Animação de entrada suave.

- [ ] **Step 1: Criar o arquivo**

```tsx
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
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard/SaldoPatrimonial.tsx
git commit -m "feat(ui): add SaldoPatrimonial component — bancos + benefícios + total"
```

---

## Task 11: HomeResumoMes — Bloco 2 do HomeTab

**Files:**
- Create: `src/components/Dashboard/HomeResumoMes.tsx`

**Contexto:** Bloco ledger-style mostrando: receita → (−) contas fixas → (−) gastos variáveis → sobra estimada. Não é o mesmo que `ResumoCards`. Esta é a "estimativa financeira do mês", separada do saldo real bancário.

Definições:
- `totalContas` = `resumo.totalGeral` (todas as contas cadastradas, pagas ou não)
- `totalGastosVar` = total de transações tipo 'gasto' no mês
- `sobra` = `receita − totalContas − totalGastosVar`

- [ ] **Step 1: Criar o arquivo**

```tsx
import { motion } from 'framer-motion'
import { ResumoMes } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  resumo: ResumoMes
  receita: number
  totalGastos: number
  onEditReceita: () => void
}

function Row({ label, value, color, sign }: { label: string; value: number; color: string; sign?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)', letterSpacing: '-0.01em' }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 600, color,
        letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
      }}>
        {sign}{formatBRL(value)}
      </span>
    </div>
  )
}

export function HomeResumoMes({ resumo, receita, totalGastos, onEditReceita }: Props) {
  const sobra = receita - resumo.totalGeral - totalGastos
  const saude = sobra >= receita * 0.2 ? 'verde' : sobra >= 0 ? 'amarelo' : 'vermelho'
  const saudeColor = saude === 'verde' ? 'var(--green)' : saude === 'amarelo' ? 'var(--amber)' : 'var(--red)'

  return (
    <div style={{
      background: 'var(--bg-surface)',
      border: '0.5px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '14px 20px 0' }}>
        <p style={{
          fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)',
          letterSpacing: '0.12em', textTransform: 'uppercase',
        }}>
          Balanço do mês
        </p>
      </div>

      {/* Rows */}
      <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Receita — editável */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button
            onClick={onEditReceita}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              background: 'none', border: 'none', padding: 0, cursor: 'pointer',
              color: 'var(--text-secondary)', fontSize: 12, letterSpacing: '-0.01em',
              fontFamily: 'inherit',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1.5 8.5h7M6.5 1.5L8.5 3.5 4 8 2 8.5l.5-2 4-4z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Receita
          </button>
          <span style={{
            fontSize: 13, fontWeight: 600, color: 'var(--text-primary)',
            letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums',
          }}>
            {receita > 0 ? formatBRL(receita) : '—'}
          </span>
        </div>

        {resumo.totalGeral > 0 && (
          <Row label="(-) Contas cadastradas" value={resumo.totalGeral} color="var(--text-secondary)" sign="−" />
        )}

        {totalGastos > 0 && (
          <Row label="(-) Gastos variáveis" value={totalGastos} color="var(--text-secondary)" sign="−" />
        )}
      </div>

      {/* Separator */}
      <div style={{ height: '0.5px', background: 'var(--divider)', margin: '0 20px' }} />

      {/* Sobra */}
      <div style={{ padding: '14px 20px 18px', display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)',
          letterSpacing: '0.09em', textTransform: 'uppercase',
        }}>
          Sobra estimada
        </span>
        <motion.span
          key={sobra}
          initial={{ scale: 0.96, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          style={{
            fontSize: 24, fontWeight: 700, color: saudeColor,
            letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums',
          }}
        >
          {receita > 0 ? formatBRL(sobra) : '—'}
        </motion.span>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Dashboard/HomeResumoMes.tsx
git commit -m "feat(ui): add HomeResumoMes — ledger-style month balance with sobra estimada"
```

---

## Task 12: ResumoCards e IndicadoresRapidos — simplificar

**Files:**
- Modify: `src/components/Dashboard/ResumoCards.tsx`
- Modify: `src/components/Dashboard/IndicadoresRapidos.tsx`

**Contexto:** `ResumoCards` perde o hero "Sobra do mês" (que vai para HomeResumoMes). Mantém apenas a barra de progresso das contas + strip com 3 métricas compactas. `IndicadoresRapidos` perde o row "Saldo Real (incl. A Receber)" — esse conceito some com a nova arquitetura.

- [ ] **Step 1: Simplificar ResumoCards**

Substituir o conteúdo completo de `src/components/Dashboard/ResumoCards.tsx`:

```tsx
import { motion } from 'framer-motion'
import { ResumoMes } from '@/types'
import { formatBRLShort } from '@/lib/utils'

interface Props {
  resumo: ResumoMes
  semContas: boolean
}

const METRICS = (resumo: ResumoMes) => [
  { label: 'Total', value: resumo.totalGeral, color: 'var(--text-primary)' },
  { label: 'Pago', value: resumo.totalPago, color: 'var(--green)' },
  { label: 'Pendente', value: resumo.totalPendente, color: 'var(--amber)' },
]

export function ResumoCards({ resumo, semContas }: Props) {
  if (semContas) return null

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '0.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
      }}
    >
      {/* Progress */}
      <div style={{ padding: '14px 20px', borderBottom: '0.5px solid var(--divider)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-tertiary)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            Contas pagas
          </p>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
            {resumo.percentualPago.toFixed(0)}%
          </p>
        </div>
        <div style={{ height: 3, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.07)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(resumo.percentualPago, 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.1 }}
            style={{ height: '100%', borderRadius: 99, background: 'var(--green)' }}
          />
        </div>
      </div>

      {/* 3 metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {METRICS(resumo).map(({ label, value, color }, i) => (
          <div
            key={label}
            style={{
              padding: '12px 14px 14px',
              borderLeft: i > 0 ? '0.5px solid var(--divider)' : 'none',
            }}
          >
            <p style={{ fontSize: 9, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 5 }}>
              {label}
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
              {formatBRLShort(value)}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Remover "Saldo Real" de IndicadoresRapidos**

Em `src/components/Dashboard/IndicadoresRapidos.tsx`, remover o bloco final:

```tsx
// REMOVER este bloco inteiro:
<div
  className="rounded-xl px-4 py-3 flex items-center justify-between"
  style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
>
  <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-tertiary)' }}>
    Saldo Real (incl. A Receber)
  </span>
  <span className="text-lg font-bold tracking-tight" style={{ color: saldoReal >= 0 ? 'var(--green)' : 'var(--red)' }}>
    {formatBRL(saldoReal)}
  </span>
</div>
```

E remover a linha `const saldoReal = totalSaldo + totalPendente` e o prop `totalSaldo` se não for mais usado. IndicadoresRapidos pode ser removido do HomeTab completamente (as métricas agora estão em SaldoPatrimonial + HomeResumoMes + ResumoCards). Se mantiver, remover só o bloco "Saldo Real".

- [ ] **Step 3: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/components/Dashboard/ResumoCards.tsx src/components/Dashboard/IndicadoresRapidos.tsx
git commit -m "refactor(dashboard): simplify ResumoCards to progress+strip; remove 'Saldo Real' from IndicadoresRapidos"
```

---

## Task 13: HomeTab — reestruturação completa

**Files:**
- Modify: `src/pages/HomeTab.tsx`

**Contexto:** Nova ordem de cima pra baixo:
1. Banner banco ausente (já existe, manter)
2. `SaldoPatrimonial` (novo Bloco 1)
3. `HomeResumoMes` (novo Bloco 2)
4. `ResumoCards` (apenas progress + 3 métricas, sem hero)
5. Card "A Receber" — condicional, só se `totalPendente > 0`
6. `ComparacaoMeses` (já existe)
7. `ChartsPizza` (já existe)
8. `ChartsBarBancos` (já existe)
9. `ChartsLinhaDia` (já existe)

Remover `IndicadoresRapidos` (substituído por SaldoPatrimonial).
Adicionar prop `cartoesComSaldo: CartaoComSaldo[]`.
Remover props não mais usados diretamente: `totalSaldo` permanece (passa para SaldoPatrimonial), `totalEntradas` (remover se não usado).

- [ ] **Step 1: Reescrever HomeTab**

```tsx
import { motion } from 'framer-motion'
import { SaldoPatrimonial } from '@/components/Dashboard/SaldoPatrimonial'
import { HomeResumoMes } from '@/components/Dashboard/HomeResumoMes'
import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { ComparacaoMeses } from '@/components/Dashboard/ComparacaoMeses'
import { ChartsPizza } from '@/components/Charts/ChartsPizza'
import { ChartsBarBancos } from '@/components/Charts/ChartsBarBancos'
import { ChartsLinhaDia } from '@/components/Charts/ChartsLinhaDia'
import { Conta, ResumoMes, BancoComSaldo, CartaoComSaldo, CategoriaGasto } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  userId: string
  resumo: ResumoMes
  receita: number
  contas: Conta[]
  bancos: BancoComSaldo[]
  cartoesComSaldo: CartaoComSaldo[]
  totalSaldo: number
  totalGastos: number
  totalPendente: number
  gastosPorCategoria: Record<CategoriaGasto, number>
  gastosPorDia: { data: string; total: number }[]
  onEditReceita: () => void
  onNavigateToBancos: () => void
}

export function HomeTab({
  userId,
  resumo,
  receita,
  contas,
  bancos,
  cartoesComSaldo,
  totalSaldo,
  totalGastos,
  totalPendente,
  gastosPorCategoria,
  gastosPorDia,
  onEditReceita,
  onNavigateToBancos,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* Bloco 1: Patrimônio disponível */}
      <SaldoPatrimonial
        totalSaldo={totalSaldo}
        cartoesComSaldo={cartoesComSaldo}
        onNavigateToBancos={onNavigateToBancos}
        semBancos={bancos.length === 0}
      />

      {/* Bloco 2: Balanço do mês */}
      <HomeResumoMes
        resumo={resumo}
        receita={receita}
        totalGastos={totalGastos}
        onEditReceita={onEditReceita}
      />

      {/* Barra de progresso + métricas */}
      <ResumoCards
        resumo={resumo}
        semContas={contas.length === 0}
      />

      {/* Bloco 3: A Receber — condicional */}
      {totalPendente > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'var(--amber-muted)',
            border: '0.5px solid rgba(245,158,11,0.2)',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--amber)', letterSpacing: '-0.01em' }}>
              {formatBRL(totalPendente)} a receber
            </p>
            <p style={{ fontSize: 10, color: 'rgba(245,158,11,0.65)', marginTop: 2 }}>
              Não contabilizado no saldo disponível
            </p>
          </div>
          <span style={{ fontSize: 18 }}>📥</span>
        </motion.div>
      )}

      <ComparacaoMeses userId={userId} resumoAtual={resumo} />

      {Object.keys(gastosPorCategoria).length > 0 && (
        <ChartsPizza gastosPorCategoria={gastosPorCategoria} />
      )}
      <ChartsBarBancos bancos={bancos} />
      <ChartsLinhaDia gastosPorDia={gastosPorDia} />
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/HomeTab.tsx
git commit -m "refactor(HomeTab): restructure with SaldoPatrimonial + HomeResumoMes + AReceber bloco"
```

---

## Task 14: ContasTab — strip + PagarContaModal + onDeleteParcelamento + onSaveParcelada

**Files:**
- Modify: `src/pages/ContasTab.tsx`

**Contexto:**
1. Substituir `SelectBancoModal` de pagamento de conta por `PagarContaModal`
2. Adicionar strip de resumo no topo (antes das faturas)
3. Thread `onDeleteParcelamento` para BillList
4. Thread `onSaveParcelada` para BillModal

- [ ] **Step 1: Reescrever ContasTab**

```tsx
import { useState, useEffect, useMemo } from 'react'
import { BillList } from '@/components/BillList/BillList'
import { BillModal } from '@/components/Modals/BillModal'
import { PagarContaModal } from '@/components/Modals/PagarContaModal'
import { SelectBancoModal } from '@/components/Modals/SelectBancoModal'
import { Conta, ContaInput, BancoComSaldo, FaturaCartao, Cartao } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  contas: Conta[]
  bancos: BancoComSaldo[]
  faturas: FaturaCartao[]
  cartoes: Cartao[]
  onTogglePagoComBanco: (
    id: string,
    bancoId: string,
    contaData: { nome: string; valor: number; vencimento: string | null },
    dataPagamento: string,
  ) => Promise<void>
  onDesfazerPagamento: (id: string) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onAdd: (data: ContaInput) => Promise<void>
  onUpdate: (id: string, data: Partial<ContaInput>) => Promise<void>
  onSaveParcelada?: (data: ContaInput, parcelaTotal: number) => Promise<void>
  onDeleteParcelamento?: (parcelamentoId: string, parcelaAtualFrom: number, parcelaTotal: number) => Promise<void>
  onNavigateToBancos: () => void
  onMarcarFaturaPaga: (faturaId: string, bancoId: string) => Promise<void>
  onDesmarcarFaturaPaga: (faturaId: string) => Promise<void>
}

export function ContasTab({
  contas,
  bancos,
  faturas,
  cartoes,
  onTogglePagoComBanco,
  onDesfazerPagamento,
  onDelete,
  onAdd,
  onUpdate,
  onSaveParcelada,
  onDeleteParcelamento,
  onNavigateToBancos,
  onMarcarFaturaPaga,
  onDesmarcarFaturaPaga,
}: Props) {
  const [billModalOpen, setBillModalOpen] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)
  const [pendingToggleId, setPendingToggleId] = useState<string | null>(null)
  const [pendingFaturaId, setPendingFaturaId] = useState<string | null>(null)

  useEffect(() => {
    function openAdd() { setEditando(null); setBillModalOpen(true) }
    document.addEventListener('fab-contas', openAdd)
    return () => document.removeEventListener('fab-contas', openAdd)
  }, [])

  const pendingConta = pendingToggleId ? contas.find(c => c.id === pendingToggleId) ?? null : null

  function handleToggle(id: string, pago: boolean) {
    if (pago) {
      onDesfazerPagamento(id)
    } else {
      setPendingToggleId(id)
    }
  }

  function handlePagarConfirm(bancoId: string, data: string) {
    if (!pendingConta) return
    onTogglePagoComBanco(pendingConta.id, bancoId, {
      nome: pendingConta.nome,
      valor: pendingConta.valor,
      vencimento: pendingConta.vencimento,
    }, data)
    setPendingToggleId(null)
  }

  function handleFaturaBancoSelect(bancoId: string) {
    if (!pendingFaturaId) return
    onMarcarFaturaPaga(pendingFaturaId, bancoId)
    setPendingFaturaId(null)
  }

  function handleSave(data: ContaInput) {
    if (editando) onUpdate(editando.id, data)
    else onAdd(data)
    setEditando(null)
  }

  // Strip de resumo
  const pagas = contas.filter(c => c.pago).length
  const total = contas.length
  const pendente = contas.filter(c => !c.pago).reduce((s, c) => s + c.valor, 0)
  const proxVenc = useMemo(() => {
    return contas
      .filter(c => !c.pago && c.vencimento)
      .sort((a, b) => a.vencimento!.localeCompare(b.vencimento!))[0] ?? null
  }, [contas])

  return (
    <div className="flex flex-col gap-4">
      {/* Strip de resumo */}
      {total > 0 && (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '0.5px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '11px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 500, color: pagas === total ? 'var(--green)' : 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            {pagas} de {total} pagas
          </span>
          {pendente > 0 && (
            <>
              <span style={{ fontSize: 11, color: 'var(--border-strong)' }}>·</span>
              <span style={{ fontSize: 12, color: 'var(--amber)', letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums' }}>
                {formatBRL(pendente)} pendente
              </span>
            </>
          )}
          {proxVenc && (
            <>
              <span style={{ fontSize: 11, color: 'var(--border-strong)' }}>·</span>
              <span style={{ fontSize: 11, color: 'var(--text-tertiary)', letterSpacing: '-0.01em' }}>
                próximo: {proxVenc.nome} dia {proxVenc.vencimento!.split('-')[2]}
              </span>
            </>
          )}
        </div>
      )}

      {/* Faturas de cartão */}
      {faturas.length > 0 && (
        <div>
          <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', letterSpacing: '0.09em', textTransform: 'uppercase', marginBottom: 10 }}>
            Faturas de cartão
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {faturas.map(fatura => {
              const cartao = cartoes.find(c => c.id === fatura.cartaoId)
              if (!cartao) return null
              return (
                <div
                  key={fatura.id}
                  style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)', padding: '12px 14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                    borderLeft: `3px solid ${cartao.cor}`,
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', letterSpacing: '-0.01em', marginBottom: 2 }}>
                      {cartao.nome}
                    </p>
                    <p style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>
                      Fatura · vence dia {cartao.diaVencimento}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums' }}>
                      {formatBRL(fatura.total)}
                    </span>
                    {fatura.pago ? (
                      <button
                        onClick={() => onDesmarcarFaturaPaga(fatura.id)}
                        style={{
                          padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: 'var(--green-muted)', color: 'var(--green)',
                          border: '1px solid rgba(52,199,123,0.25)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        ✓ Paga
                      </button>
                    ) : (
                      <button
                        onClick={() => setPendingFaturaId(fatura.id)}
                        style={{
                          padding: '6px 12px', borderRadius: 99, fontSize: 11, fontWeight: 600,
                          background: 'var(--amber-muted)', color: 'var(--amber)',
                          border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        Pagar
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <BillList
        contas={contas}
        onTogglePago={handleToggle}
        onEdit={c => { setEditando(c); setBillModalOpen(true) }}
        onDelete={onDelete}
        onAdd={() => { setEditando(null); setBillModalOpen(true) }}
        onDeleteParcelamento={onDeleteParcelamento}
      />

      <BillModal
        open={billModalOpen}
        onClose={() => { setBillModalOpen(false); setEditando(null) }}
        onSave={handleSave}
        onSaveParcelada={editando ? undefined : onSaveParcelada}
        editando={editando}
      />

      <PagarContaModal
        open={pendingToggleId !== null}
        bancos={bancos}
        contaNome={pendingConta?.nome ?? ''}
        contaValor={pendingConta?.valor ?? 0}
        onConfirm={handlePagarConfirm}
        onClose={() => setPendingToggleId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />

      <SelectBancoModal
        open={pendingFaturaId !== null}
        bancos={bancos}
        onSelect={handleFaturaBancoSelect}
        onClose={() => setPendingFaturaId(null)}
        onNavigateToBancos={onNavigateToBancos}
      />
    </div>
  )
}
```

- [ ] **Step 2: Verificar TypeScript**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/ContasTab.tsx
git commit -m "feat(ContasTab): strip resumo + PagarContaModal + onDeleteParcelamento thread"
```

---

## Task 15: Dashboard — wiring final

**Files:**
- Modify: `src/pages/Dashboard.tsx`

**Contexto:** Conectar todas as novas features ao Dashboard (orchestrator):
1. Extrair `criarContaComParcelas` e `excluirParcelamentosRestantes` do `useMonth`
2. Criar handlers `handleSaveParcelada` e `handleDeleteParcelamento`
3. Passar `cartoesComSaldo` para HomeTab
4. Atualizar assinatura de `togglePagoComBanco` (agora 4 params)
5. Passar `onSaveParcelada` e `onDeleteParcelamento` para ContasTab
6. Remover `totalEntradas` de HomeTab (não mais usado)

- [ ] **Step 1: Atualizar destructuring de useMonth**

```ts
const {
  mesInfo,
  isLoading: isMonthLoading,
  setReceita,
  criarMes,
  copiarFixos,
  mesExiste,
  criarContaComParcelas,
  excluirParcelamentosRestantes,
} = useMonth(userId)
```

- [ ] **Step 2: Adicionar handlers parcelamento**

Após o bloco de hooks existentes:

```ts
async function handleSaveParcelada(data: ContaInput, parcelaTotal: number) {
  await criarContaComParcelas(data, parcelaTotal, mesAtivo)
}

async function handleDeleteParcelamento(
  parcelamentoId: string,
  parcelaAtualFrom: number,
  parcelaTotal: number,
) {
  await excluirParcelamentosRestantes(parcelamentoId, parcelaAtualFrom, parcelaTotal, mesAtivo)
}
```

- [ ] **Step 3: Atualizar chamada de HomeTab — adicionar cartoesComSaldo, remover totalEntradas**

```tsx
{abaAtiva === 'home' && (
  <HomeTab
    userId={userId}
    resumo={resumo}
    receita={mesInfo?.receita ?? 0}
    contas={contas}
    bancos={bancos}
    cartoesComSaldo={cartoesComSaldo}
    totalSaldo={totalSaldo}
    totalGastos={totalGastos}
    totalPendente={totalPendente}
    gastosPorCategoria={gastosPorCategoria}
    gastosPorDia={gastosPorDia}
    onEditReceita={() => setReceitaModalOpen(true)}
    onNavigateToBancos={() => setAbaAtiva('bancos')}
  />
)}
```

- [ ] **Step 4: Atualizar chamada de ContasTab — novos props + assinatura corrigida**

```tsx
{abaAtiva === 'contas' && (
  <ContasTab
    contas={contas}
    bancos={bancos}
    faturas={faturas}
    cartoes={cartoes}
    onTogglePagoComBanco={togglePagoComBanco}
    onDesfazerPagamento={desfazerPagamento}
    onDelete={deleteConta}
    onAdd={addConta}
    onUpdate={updateConta}
    onSaveParcelada={handleSaveParcelada}
    onDeleteParcelamento={handleDeleteParcelamento}
    onNavigateToBancos={() => setAbaAtiva('bancos')}
    onMarcarFaturaPaga={marcarFaturaPaga}
    onDesmarcarFaturaPaga={desmarcarFaturaPaga}
  />
)}
```

- [ ] **Step 5: Verificar TypeScript (zero erros)**

```bash
npx tsc --noEmit
```
Expected: sem output absoluto.

- [ ] **Step 6: Build de produção**

```bash
npm run build
```
Expected: build bem-sucedido sem erros.

- [ ] **Step 7: Commit final**

```bash
git add src/pages/Dashboard.tsx
git commit -m "feat(Dashboard): wire criarContaComParcelas + excluirParcelamentosRestantes + cartoesComSaldo to HomeTab"
```

---

## Self-Review

### 1. Spec coverage

| Requisito | Task |
|---|---|
| Bloco 1 — O que eu tenho (bancos + benefícios + total) | Task 10, 13 |
| Bloco 2 — Como foi o mês (receita − contas − gastos) | Task 11 |
| Bloco 3 — A Receber condicional | Task 13 |
| A Receber nunca somado ao saldo | Task 13 (SaldoPatrimonial não inclui) |
| Crédito ≠ saldo bancário | Task 2 (useBanks exclui cartaoId txs) |
| Benefícios = saldo real no Bloco 1 | Task 10 (SaldoPatrimonial) |
| Gastos com crédito não deduzem banco | Task 2 |
| Parcelas auto-propagação entre meses | Task 4, 7 |
| Exclusão parcela: "só esta" ou "todas próximas" | Task 5, 8, 9 |
| Pagamento com data + banco | Task 3, 6, 14 |
| Badge "Pago em DD/MM" | Task 8 |
| HomeTab reordenada | Task 13 |
| Remover "Saldo Real (incl. A Receber)" | Task 12 |
| Strip ContasTab | Task 14 |

### 2. Placeholder scan

Nenhum TBD, TODO, ou "similar à task N" no plano.

### 3. Type consistency

- `togglePagoComBanco` em `useBills`: 4 params `(id, bancoId, contaData, dataPagamento)` — usado com 4 params em ContasTab Task 14 ✓
- `criarContaComParcelas(data, parcelaTotal, mesInicialId)` — chamado em `handleSaveParcelada` com os mesmos 3 params ✓
- `excluirParcelamentosRestantes(parcelamentoId, parcelaAtualFrom, parcelaTotal, mesAtualId)` — chamado em `handleDeleteParcelamento` com 4 params + `mesAtivo` ✓
- `SaldoPatrimonial` recebe `cartoesComSaldo: CartaoComSaldo[]` — tipo definido em types/index.ts ✓
- `HomeResumoMes` recebe `totalGastos: number` — vem de `useTransactions` via Dashboard ✓
- `PagarContaModal.onConfirm: (bancoId: string, data: string)` — consumido em `handlePagarConfirm` com mesma assinatura ✓
