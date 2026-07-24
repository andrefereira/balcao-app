// Edge Function: interpretar-pedido
// Recebe { texto, imagem } — imagem é opcional, uma data URL base64 (ex.: foto de um
// pedido manuscrito) — e devolve { itens: [{ produto_id, qtd, alternativas: [ids] }] }
// usando a API do Claude (com visão) e o catálogo real da loja como contexto.
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
    const { texto, imagem } = await req.json();
    const temTexto = !!texto?.trim();
    const temImagem = !!imagem;
    if (!temTexto && !temImagem) {
      return new Response(JSON.stringify({ erro: "Nem texto nem imagem foram enviados" }), {
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

    const prompt = `Você é o interpretador de pedidos de uma papelaria. ${
      temImagem
        ? "Você vai receber uma FOTO de um pedido (pode ser manuscrito à mão) e, opcionalmente, também uma mensagem digitada complementar."
        : "Um cliente enviou a mensagem abaixo pelo WhatsApp."
    } Identifique os produtos pedidos e as quantidades, usando SOMENTE o catálogo fornecido.

CATÁLOGO (id: nome):
${catalogo}
${temTexto ? `\nMENSAGEM DIGITADA:\n"""\n${texto}\n"""` : ""}

Regras:
${temImagem ? "- Leia com atenção o texto da imagem, incluindo letra manuscrita, mesmo que a caligrafia não seja perfeita.\n" : ""}- Ignore saudações, agradecimentos e conversa que não seja pedido de produto.
- Se a quantidade não for informada, use 1.
- Se a mensagem for ambígua entre produtos parecidos (ex.: "caderno" sem dizer qual), escolha o mais provável em "produto_id" e liste os demais candidatos em "alternativas" para o atendente confirmar.
- Se o item pedido não existir no catálogo, não o inclua.

Responda APENAS com JSON válido, sem markdown e sem texto extra, no formato:
{"itens":[{"produto_id":número,"qtd":número,"alternativas":[números]}]}`;

    const content: Record<string, unknown>[] = [];
    if (temImagem) {
      const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imagem);
      if (!match) throw new Error("Formato de imagem inválido");
      content.push({
        type: "image",
        source: { type: "base64", media_type: match[1], data: match[2] },
      });
    }
    content.push({ type: "text", text: prompt });

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
        messages: [{ role: "user", content }],
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
