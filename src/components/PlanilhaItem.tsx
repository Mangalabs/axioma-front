interface PlanilhaItemProps {
  id: number
  nome: string
  arquivo: File | null
  onRemover: (id: number) => void
  onAtualizarArquivo: (id: number, arquivo: File) => void
}

export default function PlanilhaItem({ id, nome, arquivo, onRemover, onAtualizarArquivo }: PlanilhaItemProps) {
  return (
    <div className="border border-gray-200 rounded-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-gray-900">{nome}</h3>
        <button
          onClick={() => onRemover(id)}
          className="text-red-600 hover:text-red-800 text-sm font-medium"
        >
          Remover
        </button>
      </div>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          if (arquivo) onAtualizarArquivo(id, arquivo)
        }}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
      />
      {arquivo && (
        <p className="text-sm text-green-600 mt-2">
          ✓ {arquivo.name}
        </p>
      )}
    </div>
  )
}