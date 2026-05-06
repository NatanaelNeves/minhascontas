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
