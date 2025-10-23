import PlanilhasList from "./components/PlanilhasList";
import { usePlanilhas } from "./hooks/usePlanilhas";
import { read, utils } from "xlsx";
import { saveAs } from "file-saver";

interface LinhaPlanilha {
  "CNPJ / Série SAT": string;
  "Razão Social": string;
  Empresa: string;
  "Simples Nacional": string;
  "Nome do Serviço": string;
  "Nota Fiscal": string;
  "Data Emissão": string;
  "Valor Total": string;
  "Valor Desconto": string;
  PIS?: string;
  COFINS?: string;
  CSLL?: string;
  "TOTAL \nCSRF"?: string;
  IRRF?: string;
  INSS?: string;
  ISS?: string;
  "Valor Líquido": string;
  "CNPJ Tomador": string;
  "Razão Social Tomador": string;
  "Periodo Inicio": string;
  "Periodo Fim": string;
  UF: string;
  Cidade: string;
  CEP: string | number;
  Telefone: string | number;
  "Código de Serviço": string;
  CC: string | number;
  "Regime de Lucro": string;
}

interface Planilha {
  id: number;
  nome: string;
  arquivo: File | null;
}

interface Tomador {
  cnpj: string;
  razao: string;
  uf: string;
  cidade: string;
  cep: string;
  tel: string;
  periodoInicio: string;
  periodoFim: string;
}

interface Participante {
  codPart: string;
  nome: string;
  cpfCnpj: string;
}

function recuperaTomador(rows: LinhaPlanilha[]): Tomador {
  return {
    cnpj: String(rows[0]["CNPJ Tomador"])
      .replace(/[^\d]/g, "")
      .padStart(14, "0"),
    razao: rows[0]["Razão Social Tomador"],
    uf: rows[0]["UF"],
    cidade: rows[0]["Cidade"],
    cep: rows[0]["CEP"].toString(),
    tel: rows[0]["Telefone"].toString(),
    periodoInicio: rows[0]["Periodo Inicio"].split("/").join(""),
    periodoFim: rows[0]["Periodo Fim"].split("/").join(""),
  };
}

function recuperaServicosUnicos(rows: LinhaPlanilha[]) {
  const servicosUnicosMap = new Map<string, string>();
  rows.forEach((linha: LinhaPlanilha) => {
    const codigo = linha["Código de Serviço"];
    const descricao = linha["Nome do Serviço"];
    if (codigo && descricao && !servicosUnicosMap.has(codigo)) {
      servicosUnicosMap.set(codigo, descricao.toUpperCase());
    }
  });

  return servicosUnicosMap;
}

function recuperaParticipantes(rows: LinhaPlanilha[]) {
  const participantesMap: {
    [key: string]: Participante;
  } = {};

  rows.forEach((row) => {
    const cnpjParticipante = String(row["CNPJ / Série SAT"])
      .replace(/[^\d]/g, "")
      .padStart(14, "0");
    const codPart = cnpjParticipante;

    if (!participantesMap[cnpjParticipante]) {
      participantesMap[cnpjParticipante] = {
        codPart,
        nome: row["Razão Social"],
        cpfCnpj: cnpjParticipante,
      };
    }
  });

  return participantesMap;
}

function formatAllDatesFromExceltoString(rows: LinhaPlanilha[]) {
  rows.forEach((row) => {
    let periodoInicio;
    let periodoFim;

    if (typeof row["Periodo Inicio"] === "number") {
      periodoInicio = excelDateToJSDate(row["Periodo Inicio"]);

      row["Periodo Inicio"] = excelDateToJSDate(
        row["Periodo Inicio"]
      ).toLocaleDateString("pt-BR");
    }
    if (typeof row["Periodo Fim"] === "number") {
      periodoFim = excelDateToJSDate(row["Periodo Fim"]);

      row["Periodo Fim"] = excelDateToJSDate(
        row["Periodo Fim"]
      ).toLocaleDateString("pt-BR");
    }

    if (typeof row["Data Emissão"] === "number") {
      let emissao = excelDateToJSDate(row["Data Emissão"]);

      if (periodoInicio && emissao < periodoInicio) {
        emissao = periodoInicio;
      }
      if (periodoFim && emissao > periodoFim) {
        emissao = periodoFim;
      }

      row["Data Emissão"] = emissao.toLocaleDateString("pt-BR");
    }
  });
}

function parseDate(dateStr: string): string {
  if (!dateStr) return "";
  const [dia, mes, ano] = dateStr.split("/");
  return `${dia}${mes}${ano}`;
}

function excelDateToJSDate(serial: number) {
  const utc_days = Math.floor(serial - 25568);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  const fractional_day = serial - Math.floor(serial) + 0.0000001;

  let total_seconds = Math.floor(86400 * fractional_day);
  const seconds = total_seconds % 60;
  total_seconds -= seconds;
  const hours = Math.floor(total_seconds / 3600);
  const minutes = Math.floor((total_seconds - hours * 3600) / 60);

  date_info.setHours(hours);
  date_info.setMinutes(minutes);
  date_info.setSeconds(seconds);

  return date_info;
}

function gerarRegistro0000(linhas: string[], tomador: Tomador) {
  linhas.push(
    `|0000|019|0|${tomador.periodoInicio}|${tomador.periodoFim}|${tomador.razao}|${tomador.cnpj}||${tomador.uf}|||||A|1|`
  );
}

function gerarRegistro0001(linhas: string[]) {
  linhas.push(`|0001|0|`);
}

function gerarRegistro0005(linhas: string[], tomador: Tomador) {
  linhas.push(
    `|0005|${tomador.razao}|${tomador.tel}||${tomador.cidade}|${tomador.uf}|${tomador.cep}||`
  );
}

function gerarRegistro0100(linhas: string[]) {
  linhas.push(
    `|0100|EDUARDO MESQUITA AMARAL|08955291817|222140|08267412000102|03031040||435||Canindé|1111331304|1111331304|eduardo@contabilaxioma.com.br|3550308|`
  );
}

function gerarBloco150(linhas: string[], rows: LinhaPlanilha[]) {
  const participantesMap = recuperaParticipantes(rows);
  Object.values(participantesMap).forEach((participant) => {
    linhas.push(
      `|0150|${participant.codPart}|${participant.nome}|${participant.cpfCnpj}|||`
    );
  });
}

function gerarRegistro0190(linhas: string[]) {
  linhas.push("|0190|UN|UNIDADE|");
}

function gerarBloco200(linhas: string[], rows: LinhaPlanilha[]) {
  const servicosUnicosMap = recuperaServicosUnicos(rows);

  servicosUnicosMap.forEach((descricao, codigo) => {
    linhas.push(`|0200|${codigo}|${descricao}|||UN|09|00000000||00||||`);
  });
}

function gerarRegistro9990(linhas: string[]) {
  linhas.push(`|9990|${linhas.length}|`);
}

function gerarRegistroA100(linhas: string[], row: LinhaPlanilha) {
  const numero = row["Nota Fiscal"];
  const CC = row["CC"];
  const emissao = parseDate(row["Data Emissão"]);

  const PIS = row.PIS ? parseFloat(row.PIS).toFixed(2).replace(".", ",") : 0;
  const COFINS = row.COFINS
    ? parseFloat(row.COFINS).toFixed(2).replace(".", ",")
    : 0;
  const CSLL = row.CSLL ? parseFloat(row.CSLL).toFixed(2).replace(".", ",") : 0;
  const IRRF = row.IRRF ? parseFloat(row.IRRF).toFixed(2).replace(".", ",") : 0;
  const INSS = row.INSS ? parseFloat(row.INSS).toFixed(2).replace(".", ",") : 0;
  const ISS = row.ISS ? parseFloat(row.ISS).toFixed(2).replace(".", ",") : 0;
  const ValorTotal = row["Valor Total"]
    ? parseFloat(row["Valor Total"]).toFixed(2).replace(".", ",")
    : 0;
  const ValorDesconto = row["Valor Desconto"]
    ? parseFloat(row["Valor Desconto"]).toFixed(2).replace(".", ",")
    : 0;

  const geraCredito = row["Regime de Lucro"] === "Lucro Real" ? 1 : 0;

  const junta_darf = IRRF ? 1 : 0;
  const cod_darf = junta_darf ? 1 : "";

  const valorTotalPIS = row.PIS
    ? parseFloat(row.PIS) - parseFloat(row["Valor Desconto"])
    : 0;
  const valorTotalCOFINS = row.COFINS
    ? parseFloat(row.COFINS) - parseFloat(row["Valor Desconto"])
    : 0;

  linhas.push(
    `|A100|0|1|${String(row["CNPJ / Série SAT"])
      .replace(/[^\d]/g, "")
      .padStart(
        14,
        "0"
      )}|00|||${numero}||${emissao}|${emissao}|${ValorTotal}||${ValorDesconto}|${PIS}|${valorTotalPIS}|${COFINS}|${valorTotalCOFINS}|||${ISS}|||||||NFSE||${CC}|||||||${IRRF}|${CSLL}|${INSS}|||||${geraCredito}|||||${junta_darf}|${cod_darf}|`
  );
}

function gerarRegistroA170(
  linhas: string[],
  row: LinhaPlanilha,
  index: number
) {
  const PIS = row.PIS ? parseFloat(row.PIS).toFixed(2).replace(".", ",") : 0;
  const COFINS = row.COFINS
    ? parseFloat(row.COFINS).toFixed(2).replace(".", ",")
    : 0;
  const CSLL = row.CSLL ? parseFloat(row.CSLL).toFixed(2).replace(".", ",") : 0;
  const IRRF = row.IRRF ? parseFloat(row.IRRF).toFixed(2).replace(".", ",") : 0;
  const INSS = row.INSS ? parseFloat(row.INSS).toFixed(2).replace(".", ",") : 0;
  const ISS = row.ISS ? parseFloat(row.ISS).toFixed(2).replace(".", ",") : 0;
  const ValorTotal = row["Valor Total"]
    ? parseFloat(row["Valor Total"]).toFixed(2).replace(".", ",")
    : 0;
  const ValorLiquido = row["Valor Líquido"]
    ? parseFloat(row["Valor Líquido"]).toFixed(2).replace(".", ",")
    : 0;

  linhas.push(
    `|A170|${index + 1}|${row["Código de Serviço"]}|${
      row["Nome do Serviço"]
    }|${ValorTotal}|${PIS}|${COFINS}|${CSLL}|${IRRF}|${INSS}|${ISS}|0|0|${ValorLiquido}|`
  );
}

function gerarRegistroA990(linhas: string[]) {
  const linhasBlocoA = linhas.filter(
    (l) => l.startsWith("|A") && !l.startsWith("|A990")
  );
  const totalBlocoA = linhasBlocoA.length;
  linhas.push(`|A990|${totalBlocoA}|`);
}

function gerarBlocoA(linhas: string[], rows: LinhaPlanilha[]) {
  linhas.push(`|A001|0|`);
  rows.forEach((row, index) => {
    gerarRegistroA100(linhas, row);
    gerarRegistroA170(linhas, row, index);
  });
  gerarRegistroA990(linhas);
}

function gerarRegistro9999(linhas: string[]) {
  linhas.push(`|9999|${linhas.length + 1}|`);
}

function gerarSpedDePlanilha(file: File | null, onFinish?: () => void) {
  if(!file) {
    return
  }
  
  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = read(data, { type: "array" });

    const sheet = workbook.Sheets["principal"];
    if (!sheet) {
      alert(`A planilha ${file.name} não possui aba "principal"`);
      return;
    }

    const rows = utils.sheet_to_json<LinhaPlanilha>(sheet).filter((row) => {
      return row["Nota Fiscal"] && row["CNPJ / Série SAT"];
    });

    if (rows.length === 0) {
      alert(`A planilha ${file.name} está vazia`);
      return;
    }

    formatAllDatesFromExceltoString(rows);

    const tomador = recuperaTomador(rows);

    const linhas: string[] = [];

    gerarRegistro0000(linhas, tomador);
    gerarRegistro0001(linhas);
    gerarRegistro0005(linhas, tomador);
    gerarRegistro0100(linhas);
    gerarBloco150(linhas, rows);
    gerarRegistro0190(linhas);
    gerarBloco200(linhas, rows);
    gerarRegistro9990(linhas);
    gerarBlocoA(linhas, rows);
    gerarRegistro9999(linhas);

    const blob = new Blob([linhas.join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const nomeArquivo = file.name.replace(/\.[^/.]+$/, "") + "_SPED.txt";
    saveAs(blob, nomeArquivo);

    if (onFinish) onFinish();
  };

  reader.readAsArrayBuffer(file);
}

function App() {
  const { planilhas, adicionarPlanilha, removerPlanilha, atualizarArquivo } =
    usePlanilhas();

  const gerarSped = () => {
    if (planilhas.length === 0) {
      alert("Nenhuma planilha carregada");
      return;
    }

    planilhas.forEach((planilha: Planilha) => {
      gerarSpedDePlanilha(planilha.arquivo);
    });
  };

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
  );
}

export default App;
