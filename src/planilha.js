// Cadastro de produtos em lote por planilha (.xlsx) — modelo pra download e leitura do
// arquivo preenchido pelo usuário.

// xlsx é uma lib pesada usada só na aba Cadastro (Admin) — import dinâmico evita que
// todo mundo baixe esse peso extra só pra abrir a tela de login.
const COLUNAS = ["Nome", "Palavras-chave", "Modificador", "Fornecedor", "Estoque", "Ativo"];

export async function baixarModeloPlanilha(fornecedores) {
  const XLSX = await import("xlsx");
  const wb = XLSX.utils.book_new();

  const exemploFornecedor = fornecedores[0]?.nome || "Nome do fornecedor";
  const linhas = [
    COLUNAS,
    ["Caderno 96 folhas Jandaia", "caderno, 96 folhas", "96", exemploFornecedor, 10, "sim"],
  ];
  const wsProdutos = XLSX.utils.aoa_to_sheet(linhas);
  wsProdutos["!cols"] = [{ wch: 34 }, { wch: 28 }, { wch: 16 }, { wch: 22 }, { wch: 10 }, { wch: 8 }];
  XLSX.utils.book_append_sheet(wb, wsProdutos, "Produtos");

  const linhasFornecedores = [
    ["Fornecedores já cadastrados — use o nome exatamente assim na coluna Fornecedor"],
    ...fornecedores.map((f) => [f.nome]),
  ];
  const wsFornecedores = XLSX.utils.aoa_to_sheet(linhasFornecedores);
  wsFornecedores["!cols"] = [{ wch: 45 }];
  XLSX.utils.book_append_sheet(wb, wsFornecedores, "Fornecedores");

  XLSX.writeFile(wb, "modelo-produtos-educarte.xlsx");
}

const VERDADEIROS = new Set(["sim", "s", "true", "1", "ativo", "verdadeiro"]);
const FALSOS = new Set(["não", "nao", "n", "false", "0", "inativo", "falso"]);

function paraAtivo(valor) {
  if (typeof valor === "boolean") return valor;
  const s = String(valor ?? "").trim().toLowerCase();
  if (!s) return true;
  if (FALSOS.has(s)) return false;
  if (VERDADEIROS.has(s)) return true;
  return true;
}

export async function processarPlanilhaProdutos(arquivo, fornecedores) {
  const XLSX = await import("xlsx");
  const buffer = await arquivo.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array" });
  const primeiraAba = wb.SheetNames[0];
  const linhas = XLSX.utils.sheet_to_json(wb.Sheets[primeiraAba], { defval: "" });

  const porNomeFornecedor = new Map(fornecedores.map((f) => [f.nome.trim().toLowerCase(), f]));

  const validos = [];
  const erros = [];

  linhas.forEach((linha, idx) => {
    const numeroLinha = idx + 2; // linha 1 é o cabeçalho
    const nome = String(linha["Nome"] ?? "").trim();
    if (!nome) return; // linha em branco — ignora sem contar como erro

    const fornecedorNome = String(linha["Fornecedor"] ?? "").trim();
    if (!fornecedorNome) {
      erros.push({ linha: numeroLinha, nome, motivo: "Fornecedor não informado" });
      return;
    }
    const fornecedor = porNomeFornecedor.get(fornecedorNome.toLowerCase());
    if (!fornecedor) {
      erros.push({ linha: numeroLinha, nome, motivo: `Fornecedor "${fornecedorNome}" não encontrado` });
      return;
    }

    const chaves = String(linha["Palavras-chave"] ?? "")
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);

    const estoqueNum = Number(linha["Estoque"]);
    const estoque = Number.isFinite(estoqueNum) && estoqueNum > 0 ? Math.floor(estoqueNum) : 0;

    validos.push({
      nome,
      chaves,
      modificador: String(linha["Modificador"] ?? "").trim() || null,
      fornecedor_id: fornecedor.id,
      estoque,
      ativo: paraAtivo(linha["Ativo"]),
    });
  });

  return { validos, erros };
}
