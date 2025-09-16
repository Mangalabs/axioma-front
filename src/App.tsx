import PlanilhasList from './components/PlanilhasList'
import { usePlanilhas } from './hooks/usePlanilhas'

function App() {
  const { planilhas, adicionarPlanilha, removerPlanilha, atualizarArquivo } = usePlanilhas()

  const gerarSped = () => {
    if (planilhas.length === 0) {
      alert('Adicione pelo menos uma planilha')
      return
    }
    
    alert(`Gerando SPED com ${planilhas.length} planilha(s)...`)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Gerador de Documento SPED
        </h1>
        
        <PlanilhasList
          planilhas={planilhas}
          onAdicionar={adicionarPlanilha}
          onRemover={removerPlanilha}
          onAtualizarArquivo={atualizarArquivo}
        />

        <div className="text-center">
          <button
            onClick={gerarSped}
            disabled={planilhas.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-md font-medium text-lg transition-colors"
          >
            Gerar SPED
          </button>
        </div>
      </div>
    </div>
  )
}

export default App