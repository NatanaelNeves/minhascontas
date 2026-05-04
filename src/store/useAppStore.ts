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
