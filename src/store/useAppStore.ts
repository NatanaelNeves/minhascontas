import { create } from 'zustand'
import { AbaAtiva } from '@/types'

type CurrentPage = 'dashboard' | 'history'

interface AppState {
  mesAtivo: string
  currentPage: CurrentPage
  abaAtiva: AbaAtiva
  setMesAtivo: (mes: string) => void
  setCurrentPage: (page: CurrentPage) => void
  setAbaAtiva: (aba: AbaAtiva) => void
}

function getMesAtual(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const useAppStore = create<AppState>((set) => ({
  mesAtivo: getMesAtual(),
  currentPage: 'dashboard',
  abaAtiva: 'home',
  setMesAtivo: (mes) => set({ mesAtivo: mes }),
  setCurrentPage: (page) => set({ currentPage: page }),
  setAbaAtiva: (aba) => set({ abaAtiva: aba }),
}))
