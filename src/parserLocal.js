// Parser local por palavras-chave — fallback quando a Edge Function
// "interpretar-pedido" (API do Claude) não está disponível.

const NUM_PALAVRA = {
  um: 1, uma: 1, dois: 2, duas: 2, três: 3, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10, vinte: 20, trinta: 30,
  cinquenta: 50, cem: 100,
};

export function parserLocal(texto, produtos) {
  let t = texto.toLowerCase();
  Object.entries(NUM_PALAVRA).forEach(([w, n]) => {
    t = t.replace(new RegExp(`\\b${w}\\b`, "g"), String(n));
  });

  const segmentos = t
    .split(/[,\n;]|\be\b|\btambém\b/g)
    .map((s) => s.trim())
    .filter(Boolean);

  const itens = [];
  segmentos.forEach((seg) => {
    const numMatch = seg.match(/(\d+)/);
    const qtd = numMatch ? parseInt(numMatch[1], 10) : 1;

    const candidatos = produtos.filter((p) =>
      (p.chaves || []).some((k) => seg.includes(k)),
    );
    if (candidatos.length === 0) return;

    const comMod = candidatos.filter((p) => p.modificador && seg.includes(p.modificador));
    if (comMod.length === 1) {
      itens.push({ produto_id: comMod[0].id, qtd, alternativas: [] });
    } else if (candidatos.length === 1) {
      itens.push({ produto_id: candidatos[0].id, qtd, alternativas: [] });
    } else {
      itens.push({
        produto_id: candidatos[0].id,
        qtd,
        alternativas: candidatos.slice(1).map((c) => c.id),
      });
    }
  });
  return itens;
}
