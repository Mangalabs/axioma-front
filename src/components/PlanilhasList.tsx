import PlanilhaItem from './PlanilhaItem'

interface Planilha {
  id: number
  nome: string
  arquivo: File | null
}

interface PlanilhasListProps {
  planilhas: Planilha[]
  onRemover: (id: number) => void
  onAtualizarArquivo: (id: number, arquivo: File) => void
  onAdicionar: () => void
}

export default function PlanilhasList({ planilhas, onRemover, onAtualizarArquivo, onAdicionar }: PlanilhasListProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-800">
          Planilhas ({planilhas.length})
        </h2>
        <button
          onClick={onAdicionar}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
        >
          Adicionar Planilha
        </button>
      </div>

      {planilhas.length === 0 ? (
        <p className="text-gray-500 text-center py-8">
          Nenhuma planilha adicionada. Clique em "Adicionar Planilha" para começar.
        </p>
      ) : (
        <div className="space-y-4">
          {planilhas.map((planilha) => (
            <PlanilhaItem
              key={planilha.id}
              id={planilha.id}
              nome={planilha.nome}
              arquivo={planilha.arquivo}
              onRemover={onRemover}
              onAtualizarArquivo={onAtualizarArquivo}
            />
          ))}
        </div>
      )}
    </div>
  )
}