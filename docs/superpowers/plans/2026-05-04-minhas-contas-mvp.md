# Minhas Contas MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build MVP of Minhas Contas — personal monthly finance tracker with Firebase auth, Firestore real-time sync, and full bill management dashboard.

**Architecture:** Single-page React app with Firebase Auth (Google OAuth) and Firestore real-time sync. Auth guard renders Login or Dashboard. Data flows Firestore → hooks → Zustand → components. No React Router — conditional render based on auth state.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Firebase, Zustand, Vitest, lucide-react

---

## File Map

| File | Responsibility |
|------|---------------|
| `src/lib/firebase.ts` | Firebase init — Auth + Firestore exports |
| `src/lib/utils.ts` | formatBRL, calcResumo, getAlertaVencimento |
| `src/types/index.ts` | Conta, Mes, ResumoMes, Categoria, FormaPagamento, AlertaVencimento |
| `src/store/useAppStore.ts` | Zustand: mesAtivo, tema, isLoading |
| `src/hooks/useAuth.ts` | Google OAuth login/logout/user state |
| `src/hooks/useFirestore.ts` | onSnapshot + addDoc + updateDoc + deleteDoc abstraction |
| `src/hooks/useBills.ts` | CRUD facade + ResumoMes calculado |
| `src/hooks/useMonth.ts` | mesInfo, setReceita, criarMes, copiarFixos |
| `src/pages/Login.tsx` | Tela de login Google |
| `src/pages/Dashboard.tsx` | Layout principal — orquestra todos os componentes |
| `src/components/UI/Header.tsx` | Header com navegação de mês e logout |
| `src/components/Dashboard/ResumoCards.tsx` | 4 cards de resumo + semáforo + barra de progresso |
| `src/components/BillList/BillList.tsx` | Lista agrupada por categoria (fixo/cartao/extra) |
| `src/components/BillItem/BillItem.tsx` | Item individual com checkbox, badges, editar/excluir |
| `src/components/Modals/BillModal.tsx` | Modal add/edit conta |
| `src/components/Modals/ReceitaModal.tsx` | Modal para definir receita do mês |
| `src/App.tsx` | Auth guard — Login ou Dashboard |
| `src/main.tsx` | Entry point |
| `src/index.css` | Tailwind + CSS vars shadcn dark theme |
| `src/test-setup.ts` | Vitest setup com jest-dom |
| `vitest.config.ts` | Config vitest com jsdom |
| `.env.local` | Credenciais Firebase (gitignored) |
| `.gitignore` | Ignora node_modules, dist, .env.local |

---

## Task 1: Vite Scaffold + Dependencies

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, `src/App.tsx`

- [ ] **Step 1: Scaffold Vite project**

```powershell
cd c:\Users\TECNOLOGIA\minhascontas
npm create vite@latest . -- --template react-ts
```

When prompted "Current directory is not empty. Remove existing files and continue?" → select **Yes**.

Expected output: files created including `package.json`, `vite.config.ts`, `src/main.tsx`.

- [ ] **Step 2: Install all dependencies at once**

```powershell
npm install
npm install firebase zustand framer-motion lucide-react
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom @types/node
```

Expected: no errors, `node_modules/` created.

- [ ] **Step 3: Verify dev server starts**

```powershell
npm run dev
```

Expected: `Local: http://localhost:5173/` — browser shows Vite default template. Press Ctrl+C to stop.

- [ ] **Step 4: Init git and commit**

```powershell
git init
git add package.json package-lock.json vite.config.ts tsconfig.json tsconfig.node.json index.html src/ public/
git commit -m "chore: scaffold vite react-ts project"
```

---

## Task 2: Tailwind CSS + shadcn/ui Setup

**Files:**
- Create: `tailwind.config.js`, `postcss.config.js`, `components.json`
- Modify: `src/index.css`, `vite.config.ts`, `tsconfig.json`

- [ ] **Step 1: Install Tailwind**

```powershell
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Expected: `tailwind.config.js` and `postcss.config.js` created.

- [ ] **Step 2: Write tailwind.config.js**

Replace entire `tailwind.config.js` with:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Write src/index.css**

Replace entire `src/index.css` with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 240 10% 3.9%;
    --foreground: 0 0% 98%;
    --card: 240 10% 3.9%;
    --card-foreground: 0 0% 98%;
    --border: 240 3.7% 15.9%;
    --input: 240 3.7% 15.9%;
    --primary: 0 0% 98%;
    --primary-foreground: 240 5.9% 10%;
    --secondary: 240 3.7% 15.9%;
    --secondary-foreground: 0 0% 98%;
    --muted: 240 3.7% 15.9%;
    --muted-foreground: 240 5% 64.9%;
    --accent: 240 3.7% 15.9%;
    --accent-foreground: 0 0% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 0 0% 98%;
    --ring: 240 4.9% 83.9%;
    --radius: 0.5rem;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 4: Add path alias to vite.config.ts**

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 5: Add path alias to tsconfig.json**

Open `tsconfig.json`. Inside `"compilerOptions"`, add:

```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

- [ ] **Step 6: Init shadcn/ui**

```powershell
npx shadcn-ui@latest init
```

When prompted:
- Style: **Default**
- Base color: **Zinc**
- CSS variables: **Yes**

- [ ] **Step 7: Add shadcn components**

```powershell
npx shadcn-ui@latest add button card badge dialog input label select checkbox
```

- [ ] **Step 8: Verify build succeeds**

```powershell
npm run build
```

Expected: `dist/` created, zero TypeScript errors, zero Vite errors.

- [ ] **Step 9: Commit**

```powershell
git add -A
git commit -m "chore: add tailwind css and shadcn/ui"
```

---

## Task 3: Firebase Init + Environment

**Files:**
- Create: `src/lib/firebase.ts`, `.env.local`, `.gitignore`

- [ ] **Step 1: Create .gitignore**

```
node_modules/
dist/
.env.local
*.local
```

- [ ] **Step 2: Create .env.local**

```env
VITE_FIREBASE_API_KEY=AIzaSyAVwKOsbfDV1MJADU3BHQDHHUgDK_LzIKo
VITE_FIREBASE_AUTH_DOMAIN=minhas-contas-831fb.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=minhas-contas-831fb
VITE_FIREBASE_STORAGE_BUCKET=minhas-contas-831fb.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=792300446486
VITE_FIREBASE_APP_ID=1:792300446486:web:4b901464c2171707ec2637
VITE_FIREBASE_MEASUREMENT_ID=G-C3K3XG36VN
```

- [ ] **Step 3: Create src/lib/firebase.ts**

```ts
import { initializeApp } from "firebase/app"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
import { getFirestore } from "firebase/firestore"

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
```

- [ ] **Step 4: Commit (exclude .env.local)**

```powershell
git add src/lib/firebase.ts .gitignore
git commit -m "chore: add firebase initialization"
```

---

## Task 4: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Create src/types/index.ts**

```ts
export type Categoria = "fixo" | "cartao" | "extra"
export type FormaPagamento = "pix" | "debito" | "boleto" | "credito"
export type SaudeFinanceira = "verde" | "amarelo" | "vermelho"
export type AlertaVencimento = "vencida" | "vence_em_breve" | null

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
  id: string
  info: MesInfo
  contas: Conta[]
}

export interface ResumoMes {
  totalPago: number
  totalPendente: number
  totalGeral: number
  sobra: number
  percentualPago: number
  saudePrimaria: SaudeFinanceira
}

export type ContaInput = Omit<Conta, "id" | "criadoEm">
```

- [ ] **Step 2: Commit**

```powershell
git add src/types/index.ts
git commit -m "feat: add typescript types"
```

---

## Task 5: Utils + Tests (TDD)

**Files:**
- Create: `vitest.config.ts`, `src/test-setup.ts`, `src/lib/utils.ts`, `src/lib/utils.test.ts`

- [ ] **Step 1: Create vitest.config.ts**

```ts
import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

- [ ] **Step 2: Create src/test-setup.ts**

```ts
import '@testing-library/jest-dom'
```

- [ ] **Step 3: Write failing tests — create src/lib/utils.test.ts**

```ts
import { describe, it, expect } from 'vitest'
import { formatBRL, calcResumo, getAlertaVencimento } from './utils'
import { Conta } from '@/types'

const makeConta = (overrides: Partial<Conta> = {}): Conta => ({
  id: '1',
  nome: 'Teste',
  valor: 100,
  categoria: 'fixo',
  formaPagamento: 'pix',
  vencimento: null,
  pago: false,
  parcelas: null,
  criadoEm: new Date(),
  ...overrides,
})

describe('formatBRL', () => {
  it('formats number as Brazilian currency', () => {
    expect(formatBRL(1500)).toMatch(/1\.500,00/)
  })

  it('formats zero', () => {
    expect(formatBRL(0)).toMatch(/0,00/)
  })

  it('formats decimal values', () => {
    expect(formatBRL(99.90)).toMatch(/99,90/)
  })
})

describe('calcResumo', () => {
  it('calculates totais correctly', () => {
    const contas = [
      makeConta({ valor: 1000, pago: true }),
      makeConta({ id: '2', valor: 500, pago: false }),
    ]
    const result = calcResumo(contas, 2000)
    expect(result.totalPago).toBe(1000)
    expect(result.totalPendente).toBe(500)
    expect(result.totalGeral).toBe(1500)
    expect(result.sobra).toBe(500)
  })

  it('returns verde when sobra >= 20% receita', () => {
    // sobra=500, 500/2000=25% >= 20%
    const contas = [makeConta({ valor: 1500, pago: true })]
    expect(calcResumo(contas, 2000).saudePrimaria).toBe('verde')
  })

  it('returns amarelo when sobra between 0% and 20%', () => {
    // sobra=300, 300/2000=15%
    const contas = [makeConta({ valor: 1700, pago: true })]
    expect(calcResumo(contas, 2000).saudePrimaria).toBe('amarelo')
  })

  it('returns vermelho when sobra negativa', () => {
    const contas = [makeConta({ valor: 2500, pago: true })]
    expect(calcResumo(contas, 2000).saudePrimaria).toBe('vermelho')
  })

  it('calculates percentualPago correctly', () => {
    const contas = [
      makeConta({ valor: 500, pago: true }),
      makeConta({ id: '2', valor: 500, pago: false }),
    ]
    expect(calcResumo(contas, 2000).percentualPago).toBe(50)
  })
})

describe('getAlertaVencimento', () => {
  it('returns null when pago', () => {
    expect(getAlertaVencimento('2020-01-01', true)).toBeNull()
  })

  it('returns null when vencimento is null', () => {
    expect(getAlertaVencimento(null, false)).toBeNull()
  })

  it('returns vencida when past due', () => {
    expect(getAlertaVencimento('2020-01-01', false)).toBe('vencida')
  })

  it('returns vence_em_breve when due within 3 days', () => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateStr = tomorrow.toISOString().split('T')[0]
    expect(getAlertaVencimento(dateStr, false)).toBe('vence_em_breve')
  })

  it('returns null when due in more than 3 days', () => {
    expect(getAlertaVencimento('2030-12-31', false)).toBeNull()
  })
})
```

- [ ] **Step 4: Run tests — confirm they fail**

```powershell
npx vitest run src/lib/utils.test.ts
```

Expected: FAIL with `Cannot find module './utils'`

- [ ] **Step 5: Create src/lib/utils.ts**

```ts
import { Conta, ResumoMes, AlertaVencimento, SaudeFinanceira } from "@/types"

export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function calcResumo(contas: Conta[], receita: number): ResumoMes {
  const totalPago = contas
    .filter(c => c.pago)
    .reduce((sum, c) => sum + c.valor, 0)
  const totalPendente = contas
    .filter(c => !c.pago)
    .reduce((sum, c) => sum + c.valor, 0)
  const totalGeral = totalPago + totalPendente
  const sobra = receita - totalGeral
  const percentualPago = totalGeral > 0 ? (totalPago / totalGeral) * 100 : 0

  let saudePrimaria: SaudeFinanceira
  if (receita === 0) {
    saudePrimaria = 'vermelho'
  } else {
    const ratio = sobra / receita
    if (ratio >= 0.2) {
      saudePrimaria = 'verde'
    } else if (ratio >= 0) {
      saudePrimaria = 'amarelo'
    } else {
      saudePrimaria = 'vermelho'
    }
  }

  return { totalPago, totalPendente, totalGeral, sobra, percentualPago, saudePrimaria }
}

export function getAlertaVencimento(
  vencimento: string | null,
  pago: boolean
): AlertaVencimento {
  if (pago || !vencimento) return null

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const dataVenc = new Date(vencimento + 'T00:00:00')

  const diffMs = dataVenc.getTime() - hoje.getTime()
  const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDias <= 0) return 'vencida'
  if (diffDias <= 3) return 'vence_em_breve'
  return null
}
```

- [ ] **Step 6: Run tests — confirm they pass**

```powershell
npx vitest run src/lib/utils.test.ts
```

Expected: all tests PASS, `Test Files 1 passed`

- [ ] **Step 7: Commit**

```powershell
git add src/lib/utils.ts src/lib/utils.test.ts src/test-setup.ts vitest.config.ts
git commit -m "feat: add utility functions with tests"
```

---

## Task 6: Zustand Store

**Files:**
- Create: `src/store/useAppStore.ts`

- [ ] **Step 1: Create src/store/useAppStore.ts**

```ts
import { create } from 'zustand'

interface AppState {
  mesAtivo: string
  tema: 'dark' | 'light'
  isLoading: boolean
  setMesAtivo: (mes: string) => void
  setTema: (tema: 'dark' | 'light') => void
  setIsLoading: (loading: boolean) => void
}

function getMesAtual(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getTemaInicial(): 'dark' | 'light' {
  return localStorage.getItem('tema') === 'light' ? 'light' : 'dark'
}

export const useAppStore = create<AppState>((set) => ({
  mesAtivo: getMesAtual(),
  tema: getTemaInicial(),
  isLoading: false,
  setMesAtivo: (mes) => set({ mesAtivo: mes }),
  setTema: (tema) => {
    localStorage.setItem('tema', tema)
    set({ tema })
  },
  setIsLoading: (loading) => set({ isLoading: loading }),
}))
```

- [ ] **Step 2: Commit**

```powershell
git add src/store/useAppStore.ts
git commit -m "feat: add zustand store"
```

---

## Task 7: useAuth Hook

**Files:**
- Create: `src/hooks/useAuth.ts`

- [ ] **Step 1: Create src/hooks/useAuth.ts**

```ts
import { useState, useEffect } from 'react'
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth'
import { auth, googleProvider } from '@/lib/firebase'

interface UseAuthReturn {
  user: User | null
  isLoading: boolean
  login: () => Promise<void>
  logout: () => Promise<void>
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      setIsLoading(false)
    })
    return unsubscribe
  }, [])

  async function login() {
    await signInWithPopup(auth, googleProvider)
  }

  async function logout() {
    await signOut(auth)
  }

  return { user, isLoading, login, logout }
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/hooks/useAuth.ts
git commit -m "feat: add useAuth hook with google oauth"
```

---

## Task 8: Login Page + App Routing

**Files:**
- Create: `src/pages/Login.tsx`, `src/pages/Dashboard.tsx` (stub)
- Modify: `src/App.tsx`, `src/main.tsx`

- [ ] **Step 1: Create src/pages/Login.tsx**

```tsx
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export function Login() {
  const { login, isLoading } = useAuth()

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 w-full max-w-sm text-center space-y-6"
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Minhas Contas</h1>
          <p className="text-zinc-400 text-sm">Controle financeiro mensal</p>
        </div>

        <Button
          onClick={login}
          disabled={isLoading}
          className="w-full bg-white text-zinc-900 hover:bg-zinc-100 font-medium"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Entrar com Google
        </Button>
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 2: Create stub src/pages/Dashboard.tsx**

```tsx
export function Dashboard() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
      <p className="text-zinc-400">Dashboard — em construção</p>
    </div>
  )
}
```

- [ ] **Step 3: Replace src/App.tsx**

```tsx
import { useAuth } from '@/hooks/useAuth'
import { Login } from '@/pages/Login'
import { Dashboard } from '@/pages/Dashboard'

export default function App() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  return user ? <Dashboard /> : <Login />
}
```

- [ ] **Step 4: Replace src/main.tsx**

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

- [ ] **Step 5: Test login flow in browser**

```powershell
npm run dev
```

Open `http://localhost:5173`. Verify:
- Login page appears with Google button
- Click button → Google OAuth popup opens
- After login → Dashboard stub appears ("em construção")
- Press Ctrl+C to stop.

- [ ] **Step 6: Commit**

```powershell
git add src/pages/Login.tsx src/pages/Dashboard.tsx src/App.tsx src/main.tsx
git commit -m "feat: add login page and auth routing"
```

---

## Task 9: useFirestore Hook

**Files:**
- Create: `src/hooks/useFirestore.ts`

- [ ] **Step 1: Create src/hooks/useFirestore.ts**

```ts
import { useEffect, useState } from 'react'
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Conta, ContaInput } from '@/types'

function docToConta(snapshot: QueryDocumentSnapshot<DocumentData>): Conta {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    nome: data.nome,
    valor: data.valor,
    categoria: data.categoria,
    formaPagamento: data.formaPagamento,
    vencimento: data.vencimento ?? null,
    pago: data.pago,
    parcelas: data.parcelas ?? null,
    criadoEm: data.criadoEm?.toDate() ?? new Date(),
  }
}

interface UseFirestoreReturn {
  contas: Conta[]
  isLoading: boolean
  addConta: (conta: ContaInput) => Promise<void>
  updateConta: (id: string, data: Partial<ContaInput>) => Promise<void>
  deleteConta: (id: string) => Promise<void>
}

export function useFirestore(userId: string, mesId: string): UseFirestoreReturn {
  const [contas, setContas] = useState<Conta[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId || !mesId) return

    setIsLoading(true)
    const billsPath = `users/${userId}/months/${mesId}/bills`
    const colRef = collection(db, billsPath)

    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const data = snapshot.docs.map(docToConta)
      data.sort((a, b) => a.criadoEm.getTime() - b.criadoEm.getTime())
      setContas(data)
      setIsLoading(false)
    })

    return unsubscribe
  }, [userId, mesId])

  async function addConta(conta: ContaInput) {
    const billsPath = `users/${userId}/months/${mesId}/bills`
    const colRef = collection(db, billsPath)
    await addDoc(colRef, { ...conta, criadoEm: serverTimestamp() })
  }

  async function updateConta(id: string, data: Partial<ContaInput>) {
    const billsPath = `users/${userId}/months/${mesId}/bills`
    await updateDoc(doc(db, billsPath, id), data)
  }

  async function deleteConta(id: string) {
    const billsPath = `users/${userId}/months/${mesId}/bills`
    await deleteDoc(doc(db, billsPath, id))
  }

  return { contas, isLoading, addConta, updateConta, deleteConta }
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/hooks/useFirestore.ts
git commit -m "feat: add useFirestore hook with real-time sync"
```

---

## Task 10: useBills Hook

**Files:**
- Create: `src/hooks/useBills.ts`

- [ ] **Step 1: Create src/hooks/useBills.ts**

```ts
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
}

export function useBills(
  userId: string,
  mesId: string,
  receita: number
): UseBillsReturn {
  const { contas, isLoading, addConta, updateConta, deleteConta } =
    useFirestore(userId, mesId)

  const resumo = calcResumo(contas, receita)

  async function togglePago(id: string, pago: boolean) {
    await updateConta(id, { pago })
  }

  return { contas, resumo, isLoading, addConta, updateConta, deleteConta, togglePago }
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/hooks/useBills.ts
git commit -m "feat: add useBills hook"
```

---

## Task 11: useMonth Hook

**Files:**
- Create: `src/hooks/useMonth.ts`

- [ ] **Step 1: Create src/hooks/useMonth.ts**

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
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { MesInfo } from '@/types'
import { useAppStore } from '@/store/useAppStore'

interface UseMonthReturn {
  mesInfo: MesInfo | null
  isLoading: boolean
  setReceita: (valor: number) => Promise<void>
  criarMes: (mesId: string, receita: number) => Promise<void>
  copiarFixos: (mesOrigemId: string, mesDestinoId: string) => Promise<void>
  mesExiste: (mesId: string) => Promise<boolean>
}

export function useMonth(userId: string): UseMonthReturn {
  const mesAtivo = useAppStore(s => s.mesAtivo)
  const [mesInfo, setMesInfo] = useState<MesInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!userId || !mesAtivo) return

    setIsLoading(true)
    const infoRef = doc(db, `users/${userId}/months/${mesAtivo}`)
    getDoc(infoRef).then((snap) => {
      if (snap.exists()) {
        const data = snap.data()
        setMesInfo({
          receita: data.receita,
          criadoEm: data.criadoEm?.toDate() ?? new Date(),
        })
      } else {
        setMesInfo(null)
      }
      setIsLoading(false)
    })
  }, [userId, mesAtivo])

  async function setReceita(valor: number) {
    const infoRef = doc(db, `users/${userId}/months/${mesAtivo}`)
    await setDoc(infoRef, { receita: valor, criadoEm: serverTimestamp() }, { merge: true })
    setMesInfo(prev =>
      prev ? { ...prev, receita: valor } : { receita: valor, criadoEm: new Date() }
    )
  }

  async function criarMes(mesId: string, receita: number) {
    const infoRef = doc(db, `users/${userId}/months/${mesId}`)
    await setDoc(infoRef, { receita, criadoEm: serverTimestamp() })
  }

  async function mesExiste(mesId: string): Promise<boolean> {
    const infoRef = doc(db, `users/${userId}/months/${mesId}`)
    const snap = await getDoc(infoRef)
    return snap.exists()
  }

  async function copiarFixos(mesOrigemId: string, mesDestinoId: string) {
    const billsOrigemCol = collection(db, `users/${userId}/months/${mesOrigemId}/bills`)
    const snap = await getDocs(billsOrigemCol)

    const destCol = collection(db, `users/${userId}/months/${mesDestinoId}/bills`)

    for (const docSnap of snap.docs) {
      const data = docSnap.data()
      if (data.categoria !== 'fixo') continue
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

  return { mesInfo, isLoading, setReceita, criarMes, copiarFixos, mesExiste }
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/hooks/useMonth.ts
git commit -m "feat: add useMonth hook with copiar fixos"
```

---

## Task 12: Header Component

**Files:**
- Create: `src/components/UI/Header.tsx`

- [ ] **Step 1: Create src/components/UI/Header.tsx**

```tsx
import { useAuth } from '@/hooks/useAuth'
import { useAppStore } from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'

function formatMes(mesId: string): string {
  const [year, month] = mesId.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
}

function prevMes(mesId: string): string {
  const [year, month] = mesId.split('-').map(Number)
  const d = new Date(year, month - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function nextMes(mesId: string): string {
  const [year, month] = mesId.split('-').map(Number)
  const d = new Date(year, month, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export function Header() {
  const { user, logout } = useAuth()
  const { mesAtivo, setMesAtivo } = useAppStore()

  return (
    <header className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 sticky top-0 z-10">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMesAtivo(prevMes(mesAtivo))}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <span className="text-white font-semibold capitalize min-w-[160px] text-center text-sm">
            {formatMes(mesAtivo)}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMesAtivo(nextMes(mesAtivo))}
            className="text-zinc-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {user?.photoURL && (
            <img
              src={user.photoURL}
              alt={user.displayName ?? ''}
              className="w-7 h-7 rounded-full"
            />
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={logout}
            className="text-zinc-400 hover:text-red-400"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/UI/Header.tsx
git commit -m "feat: add header with month navigation"
```

---

## Task 13: ResumoCards Component

**Files:**
- Create: `src/components/Dashboard/ResumoCards.tsx`

- [ ] **Step 1: Create src/components/Dashboard/ResumoCards.tsx**

```tsx
import { motion } from 'framer-motion'
import { ResumoMes } from '@/types'
import { formatBRL } from '@/lib/utils'

interface Props {
  resumo: ResumoMes
  receita: number
}

function Semaforo({ saude }: { saude: ResumoMes['saudePrimaria'] }) {
  const config = {
    verde:    { symbol: '🟢', label: 'Saudável',  color: 'text-green-400' },
    amarelo:  { symbol: '🟡', label: 'Atenção',   color: 'text-yellow-400' },
    vermelho: { symbol: '🔴', label: 'Crítico',   color: 'text-red-400' },
  }
  const { symbol, label, color } = config[saude]
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${color}`}>
      {symbol} {label}
    </span>
  )
}

function SummaryCard({
  label,
  value,
  color = 'text-white',
  delay = 0,
}: {
  label: string
  value: string
  color?: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4"
    >
      <p className="text-zinc-400 text-xs uppercase tracking-wide mb-1">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </motion.div>
  )
}

export function ResumoCards({ resumo, receita }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-zinc-400 text-sm uppercase tracking-wide">Resumo do mês</h2>
        <Semaforo saude={resumo.saudePrimaria} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard label="Receita"  value={formatBRL(receita)} delay={0} />
        <SummaryCard
          label="Sobra"
          value={formatBRL(resumo.sobra)}
          color={resumo.sobra >= 0 ? 'text-green-400' : 'text-red-400'}
          delay={0.05}
        />
        <SummaryCard label="Pago"     value={formatBRL(resumo.totalPago)}     color="text-green-400"  delay={0.1} />
        <SummaryCard label="Pendente" value={formatBRL(resumo.totalPendente)} color="text-yellow-400" delay={0.15} />
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="flex justify-between text-xs text-zinc-400 mb-2">
          <span>Progresso</span>
          <span>{resumo.percentualPago.toFixed(0)}% pago</span>
        </div>
        <div className="w-full bg-zinc-800 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(resumo.percentualPago, 100)}%` }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-green-500 h-2 rounded-full"
          />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/Dashboard/ResumoCards.tsx
git commit -m "feat: add resumo cards with semaforo"
```

---

## Task 14: BillItem Component

**Files:**
- Create: `src/components/BillItem/BillItem.tsx`

- [ ] **Step 1: Create src/components/BillItem/BillItem.tsx**

```tsx
import { motion } from 'framer-motion'
import { Trash2, Pencil } from 'lucide-react'
import { Conta } from '@/types'
import { formatBRL, getAlertaVencimento } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface Props {
  conta: Conta
  onTogglePago: (id: string, pago: boolean) => void
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => void
}

const FORMA_LABEL: Record<string, string> = {
  pix: 'PIX',
  debito: 'Débito',
  boleto: 'Boleto',
  credito: 'Crédito',
}

export function BillItem({ conta, onTogglePago, onEdit, onDelete }: Props) {
  const alerta = getAlertaVencimento(conta.vencimento, conta.pago)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      className="flex items-center gap-3 py-3 border-b border-zinc-800 last:border-0"
    >
      <Checkbox
        checked={conta.pago}
        onCheckedChange={(checked) => onTogglePago(conta.id, !!checked)}
        className="border-zinc-600"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-sm font-medium truncate ${
              conta.pago ? 'text-zinc-500 line-through' : 'text-white'
            }`}
          >
            {conta.nome}
          </span>
          {conta.parcelas && (
            <span className="text-xs text-zinc-500">
              {conta.parcelas.atual}/{conta.parcelas.total}
            </span>
          )}
          {alerta === 'vencida' && (
            <Badge variant="destructive" className="text-xs py-0 h-4">
              Vencida
            </Badge>
          )}
          {alerta === 'vence_em_breve' && (
            <Badge className="text-xs py-0 h-4 bg-yellow-900 text-yellow-400 hover:bg-yellow-900">
              Vence em breve
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs text-zinc-500">{FORMA_LABEL[conta.formaPagamento]}</span>
          {conta.vencimento && (
            <span
              className={`text-xs ${
                alerta === 'vencida'
                  ? 'text-red-400'
                  : alerta === 'vence_em_breve'
                  ? 'text-yellow-400'
                  : 'text-zinc-500'
              }`}
            >
              vence {new Date(conta.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      </div>

      <span
        className={`text-sm font-semibold whitespace-nowrap ${
          conta.pago ? 'text-green-400' : 'text-zinc-300'
        }`}
      >
        {formatBRL(conta.valor)}
      </span>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onEdit(conta)}
          className="h-7 w-7 text-zinc-500 hover:text-white"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(conta.id)}
          className="h-7 w-7 text-zinc-500 hover:text-red-400"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/BillItem/BillItem.tsx
git commit -m "feat: add bill item with checkbox and vencimento badges"
```

---

## Task 15: BillList Component

**Files:**
- Create: `src/components/BillList/BillList.tsx`

- [ ] **Step 1: Create src/components/BillList/BillList.tsx**

```tsx
import { AnimatePresence, motion } from 'framer-motion'
import { Conta } from '@/types'
import { BillItem } from '@/components/BillItem/BillItem'
import { formatBRL } from '@/lib/utils'

interface Props {
  contas: Conta[]
  onTogglePago: (id: string, pago: boolean) => void
  onEdit: (conta: Conta) => void
  onDelete: (id: string) => void
}

const CATEGORIAS = [
  { key: 'fixo'   as const, label: 'Compromissos Fixos' },
  { key: 'cartao' as const, label: 'Cartões / Parcelas' },
  { key: 'extra'  as const, label: 'Extras do Mês'      },
]

export function BillList({ contas, onTogglePago, onEdit, onDelete }: Props) {
  if (contas.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <p className="text-lg">Nenhuma conta registrada</p>
        <p className="text-sm mt-1">Toque no + para adicionar</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {CATEGORIAS.map(({ key, label }) => {
        const grupo = contas.filter(c => c.categoria === key)
        if (grupo.length === 0) return null

        const totalGrupo = grupo.reduce((sum, c) => sum + c.valor, 0)

        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-300">{label}</h3>
              <span className="text-xs text-zinc-500">{formatBRL(totalGrupo)}</span>
            </div>
            <div className="px-4">
              <AnimatePresence>
                {grupo.map(conta => (
                  <BillItem
                    key={conta.id}
                    conta={conta}
                    onTogglePago={onTogglePago}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/BillList/BillList.tsx
git commit -m "feat: add bill list grouped by category"
```

---

## Task 16: BillModal Component

**Files:**
- Create: `src/components/Modals/BillModal.tsx`

- [ ] **Step 1: Create src/components/Modals/BillModal.tsx**

```tsx
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Conta, ContaInput, Categoria, FormaPagamento } from '@/types'

interface Props {
  open: boolean
  onClose: () => void
  onSave: (data: ContaInput) => void
  editando?: Conta | null
}

const DEFAULT_FORM: ContaInput = {
  nome: '',
  valor: 0,
  categoria: 'fixo',
  formaPagamento: 'pix',
  vencimento: null,
  pago: false,
  parcelas: null,
}

export function BillModal({ open, onClose, onSave, editando }: Props) {
  const [form, setForm] = useState<ContaInput>(DEFAULT_FORM)
  const [valorStr, setValorStr] = useState('')
  const [temParcelas, setTemParcelas] = useState(false)

  useEffect(() => {
    if (editando) {
      setForm({
        nome: editando.nome,
        valor: editando.valor,
        categoria: editando.categoria,
        formaPagamento: editando.formaPagamento,
        vencimento: editando.vencimento,
        pago: editando.pago,
        parcelas: editando.parcelas,
      })
      setValorStr(editando.valor.toFixed(2).replace('.', ','))
      setTemParcelas(!!editando.parcelas)
    } else {
      setForm(DEFAULT_FORM)
      setValorStr('')
      setTemParcelas(false)
    }
  }, [editando, open])

  function parseValor(str: string): number {
    return parseFloat(str.replace(',', '.')) || 0
  }

  function handleSave() {
    if (!form.nome.trim() || parseValor(valorStr) <= 0) return
    onSave({
      ...form,
      valor: parseValor(valorStr),
      parcelas: temParcelas && form.parcelas ? form.parcelas : null,
    })
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-sm">
        <DialogHeader>
          <DialogTitle>{editando ? 'Editar conta' : 'Nova conta'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-zinc-400">Nome</Label>
            <Input
              value={form.nome}
              onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
              className="bg-zinc-800 border-zinc-700"
              placeholder="ex: Aluguel"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400">Valor (R$)</Label>
            <Input
              value={valorStr}
              onChange={e => setValorStr(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
              placeholder="0,00"
              inputMode="decimal"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-zinc-400">Categoria</Label>
              <Select
                value={form.categoria}
                onValueChange={v => setForm(f => ({ ...f, categoria: v as Categoria }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="fixo">Fixo</SelectItem>
                  <SelectItem value="cartao">Cartão</SelectItem>
                  <SelectItem value="extra">Extra</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-zinc-400">Pagamento</Label>
              <Select
                value={form.formaPagamento}
                onValueChange={v => setForm(f => ({ ...f, formaPagamento: v as FormaPagamento }))}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="pix">PIX</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                  <SelectItem value="boleto">Boleto</SelectItem>
                  <SelectItem value="credito">Crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-zinc-400">Vencimento (opcional)</Label>
            <Input
              type="date"
              value={form.vencimento ?? ''}
              onChange={e => setForm(f => ({ ...f, vencimento: e.target.value || null }))}
              className="bg-zinc-800 border-zinc-700 text-white"
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              checked={temParcelas}
              onCheckedChange={v => setTemParcelas(!!v)}
              id="parcelas-check"
            />
            <Label htmlFor="parcelas-check" className="text-zinc-400 cursor-pointer">
              Tem parcelas
            </Label>
          </div>

          {temParcelas && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-zinc-400">Parcela atual</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.parcelas?.atual ?? 1}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      parcelas: { atual: Number(e.target.value), total: f.parcelas?.total ?? 1 },
                    }))
                  }
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-zinc-400">Total parcelas</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.parcelas?.total ?? 1}
                  onChange={e =>
                    setForm(f => ({
                      ...f,
                      parcelas: { atual: f.parcelas?.atual ?? 1, total: Number(e.target.value) },
                    }))
                  }
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Checkbox
              checked={form.pago}
              onCheckedChange={v => setForm(f => ({ ...f, pago: !!v }))}
              id="pago-check"
            />
            <Label htmlFor="pago-check" className="text-zinc-400 cursor-pointer">
              Já foi pago
            </Label>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-700 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-white text-zinc-900 hover:bg-zinc-100"
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Commit**

```powershell
git add src/components/Modals/BillModal.tsx
git commit -m "feat: add bill modal for add/edit"
```

---

## Task 17: ReceitaModal + Dashboard Assembly

**Files:**
- Create: `src/components/Modals/ReceitaModal.tsx`
- Modify: `src/pages/Dashboard.tsx` (replace stub with full implementation)

- [ ] **Step 1: Create src/components/Modals/ReceitaModal.tsx**

```tsx
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  open: boolean
  valorAtual: number
  onSave: (valor: number) => void
  onClose: () => void
}

export function ReceitaModal({ open, valorAtual, onSave, onClose }: Props) {
  const [valorStr, setValorStr] = useState('')

  useEffect(() => {
    if (open) {
      setValorStr(valorAtual > 0 ? valorAtual.toFixed(2).replace('.', ',') : '')
    }
  }, [open, valorAtual])

  function handleSave() {
    const valor = parseFloat(valorStr.replace(',', '.')) || 0
    if (valor > 0) onSave(valor)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-xs">
        <DialogHeader>
          <DialogTitle>Receita do mês</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-zinc-400">Valor (R$)</Label>
            <Input
              value={valorStr}
              onChange={e => setValorStr(e.target.value)}
              className="bg-zinc-800 border-zinc-700"
              placeholder="0,00"
              inputMode="decimal"
              autoFocus
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-700 text-zinc-300"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-white text-zinc-900 hover:bg-zinc-100"
            >
              Salvar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Replace src/pages/Dashboard.tsx with full implementation**

```tsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'
import { useBills } from '@/hooks/useBills'
import { useMonth } from '@/hooks/useMonth'
import { useAppStore } from '@/store/useAppStore'
import { Header } from '@/components/UI/Header'
import { ResumoCards } from '@/components/Dashboard/ResumoCards'
import { BillList } from '@/components/BillList/BillList'
import { BillModal } from '@/components/Modals/BillModal'
import { ReceitaModal } from '@/components/Modals/ReceitaModal'
import { Button } from '@/components/ui/button'
import { Conta, ContaInput } from '@/types'
import { formatBRL } from '@/lib/utils'

export function Dashboard() {
  const { user } = useAuth()
  const { mesAtivo } = useAppStore()
  const { mesInfo, setReceita } = useMonth(user!.uid)
  const { contas, resumo, addConta, updateConta, deleteConta, togglePago } = useBills(
    user!.uid,
    mesAtivo,
    mesInfo?.receita ?? 0,
  )

  const [billModalOpen, setBillModalOpen] = useState(false)
  const [receitaModalOpen, setReceitaModalOpen] = useState(false)
  const [editando, setEditando] = useState<Conta | null>(null)

  function handleSaveBill(data: ContaInput) {
    if (editando) {
      updateConta(editando.id, data)
    } else {
      addConta(data)
    }
    setEditando(null)
  }

  function handleEdit(conta: Conta) {
    setEditando(conta)
    setBillModalOpen(true)
  }

  function handleOpenNew() {
    setEditando(null)
    setBillModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      <Header />

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6 pb-24">
        <div className="flex items-center justify-between">
          <span className="text-zinc-400 text-sm">
            Receita:{' '}
            <button
              onClick={() => setReceitaModalOpen(true)}
              className="text-white font-medium underline underline-offset-2 hover:text-zinc-300"
            >
              {mesInfo?.receita ? formatBRL(mesInfo.receita) : 'Definir'}
            </button>
          </span>
        </div>

        <ResumoCards resumo={resumo} receita={mesInfo?.receita ?? 0} />

        <BillList
          contas={contas}
          onTogglePago={togglePago}
          onEdit={handleEdit}
          onDelete={deleteConta}
        />
      </main>

      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3 }}
        className="fixed bottom-6 right-6"
      >
        <Button
          onClick={handleOpenNew}
          size="icon"
          className="w-14 h-14 rounded-full bg-white text-zinc-900 hover:bg-zinc-100 shadow-xl"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      <BillModal
        open={billModalOpen}
        onClose={() => { setBillModalOpen(false); setEditando(null) }}
        onSave={handleSaveBill}
        editando={editando}
      />

      <ReceitaModal
        open={receitaModalOpen}
        valorAtual={mesInfo?.receita ?? 0}
        onSave={setReceita}
        onClose={() => setReceitaModalOpen(false)}
      />
    </div>
  )
}
```

- [ ] **Step 3: Run build to verify zero TS errors**

```powershell
npm run build
```

Expected: `dist/` built successfully, zero errors.

- [ ] **Step 4: Run dev server and test full golden path**

```powershell
npm run dev
```

Test checklist:
1. Login with Google → Dashboard appears
2. Click "Definir" → ReceitaModal opens → enter `3000` → save → "R$ 3.000,00" shows
3. Click + → BillModal opens → fill name "Aluguel", valor "1500", categoria "Fixo" → Salvar
4. Conta appears in "Compromissos Fixos"
5. Click checkbox → conta marked pago, value turns green, semáforo updates
6. Click pencil → BillModal opens pre-filled → change name → Salvar → updates
7. Click trash → conta removed
8. Navigate months with < > arrows → contas change (empty for other months)
9. Click logout → Login page appears

Press Ctrl+C to stop.

- [ ] **Step 5: Commit**

```powershell
git add src/pages/Dashboard.tsx src/components/Modals/ReceitaModal.tsx
git commit -m "feat: assemble full dashboard with bill management"
```

---

## Self-Review

**Spec coverage:**
| Requirement | Task |
|-------------|------|
| Vite + React + TS + Tailwind + shadcn | Task 1-2 |
| Firebase Auth + Firestore | Task 3, 7 |
| TypeScript types (Conta, Mes, ResumoMes) | Task 4 |
| formatBRL com Intl.NumberFormat | Task 5 |
| Semáforo verde/amarelo/vermelho | Task 5 utils + Task 13 |
| Alertas vencida/vence_em_breve | Task 5 utils + Task 14 |
| Zustand: mesAtivo, tema, isLoading | Task 6 |
| Google OAuth login/logout | Task 7-8 |
| onSnapshot real-time sync | Task 9 |
| CRUD de contas | Task 10 |
| Copiar fixos na virada de mês | Task 11 |
| Header com navegação de mês | Task 12 |
| Cards resumo + barra progresso | Task 13 |
| BillItem com checkbox + badges | Task 14 |
| BillList agrupado por categoria | Task 15 |
| Modal add/edit conta | Task 16 |
| Dashboard completo | Task 17 |
| Framer Motion animações | Task 13, 14, 17 |
| Tema escuro padrão + localStorage | Task 2, 6 |

**Out of scope (MVP):** Gráficos Recharts, Histórico, Export PDF, PWA, service worker.

**Type consistency:** `ContaInput`, `Conta`, `ResumoMes`, `AlertaVencimento`, `SaudeFinanceira` definidos em Task 4 e usados consistentemente Tasks 5-17. `billsPath` string pattern `users/${userId}/months/${mesId}/bills` usado uniformemente em Tasks 9 e 11.
