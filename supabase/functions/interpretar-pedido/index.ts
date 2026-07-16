// Edge Function: interpretar-pedido
// Recebe { texto } e devolve { itens: [{ produto_id, qtd, alternativas: [ids] }] }
// usando a API do Claude com o catálogo real da loja como contexto.
//
// Deploy:  supabase functions deploy interpretar-pedido
// Secret:  supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    const { texto } = await req.json();
    if (!texto?.trim()) {
      return new Response(JSON.stringify({ erro: "Texto vazio" }), {
        status: 400,
        headers: { ...cors, "content-type": "application/json" },
      });
    }

    // Catálogo atual da loja
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: produtos, error } = await supabase
      .from("produtos")
      .select("id, nome")
      .eq("ativo", true);
    if (error) throw error;

    const catalogo = produtos.map((p) => `${p.id}: ${p.nome}`).join("\n");

    const prompt = `Você é o interpretador de pedidos de uma papelaria. Um cliente enviou a mensagem abaixo pelo WhatsApp. Identifique os produtos pedidos e as quantidades, usando SOMENTE o catálogo fornecido.

CATÁLOGO (id: nome):
${catalogo}

MENSAGEM DO CLIENTE:
"""
${texto}
"""

Regras:
- Ignore saudações, agradecimentos e conversa que não seja pedido de produto.
- Se a quantidade não for informada, use 1.
- Se a mensagem for ambígua entre produtos parecidos (ex.: "caderno" sem dizer qual), escolha o mais provável em "produto_id" e liste os demais candidatos em "alternativas" para o atendente confirmar.
- Se o item pedido não existir no catálogo, não o inclua.

Responda APENAS com JSON válido, sem markdown e sem texto extra, no formato:
{"itens":[{"produto_id":número,"qtd":número,"alternativas":[números]}]}`;

    const resposta = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": Deno.env.get("ANTHROPIC_API_KEY")!,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001", // rápido e barato; troque por claude-sonnet-4-6 se quiser mais precisão
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!resposta.ok) {
      const detalhe = await resposta.text();
      throw new Error(`API Anthropic ${resposta.status}: ${detalhe}`);
    }

    const dados = await resposta.json();
    const textoIA = dados.content
      .map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : ""))
      .join("")
      .replace(/```json|```/g, "")
      .trim();

    const parsed = JSON.parse(textoIA);

    return new Response(JSON.stringify(parsed), {
      headers: { ...cors, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ erro: String(e) }), {
      status: 500,
      headers: { ...cors, "content-type": "application/json" },
    });
  }
});
