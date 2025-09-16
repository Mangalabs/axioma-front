import { useState, useCallback } from 'react'

interface Planilha {
  id: number
  nome: string
  arquivo: File | null
}

export function usePlanilhas() {
  const [planilhas, setPlanilhas] = useState<Planilha[]>([])
  const [proximoId, setProximoId] = useState(1)

  const adicionarPlanilha = useCallback(() => {
    const novaPlanilha: Planilha = {
      id: proximoId,
      nome: `Planilha ${planilhas.length + 1}`,
      arquivo: null
    }
    setPlanilhas(prev => [...prev, novaPlanilha])
    setProximoId(prev => prev + 1)
  }, [proximoId, planilhas.length])

  const removerPlanilha = useCallback((id: number) => {
    setPlanilhas(prev => {
      const novasPlanilhas = prev.filter(p => p.id !== id)
      return novasPlanilhas.map((planilha, index) => ({
        ...planilha,
        nome: `Planilha ${index + 1}`
      }))
    })
  }, [])

  const atualizarArquivo = useCallback((id: number, arquivo: File) => {
    setPlanilhas(prev => prev.map(p => 
      p.id === id ? { ...p, arquivo } : p
    ))
  }, [])

  return {
    planilhas,
    adicionarPlanilha,
    removerPlanilha,
    atualizarArquivo
  }
}