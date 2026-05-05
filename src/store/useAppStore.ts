import { create } from 'zustand'

type CurrentPage = 'dashboard' | 'history'

interface AppState {
  mesAtivo: string
  isLoading: boolean
  currentPage: CurrentPage
  setMesAtivo: (mes: string) => void
  setIsLoading: (loading: boolean) => void
  setCurrentPage: (page: CurrentPage) => void
}

function getMesAtual(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export const useAppStore = create<AppState>((set) => ({
  mesAtivo: getMesAtual(),
  isLoading: false,
  currentPage: 'dashboard',
  setMesAtivo: (mes) => set({ mesAtivo: mes }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setCurrentPage: (page) => set({ currentPage: page }),
}))
