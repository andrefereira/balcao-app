import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles, ClipboardList, PackageSearch, Factory, Truck, Users,
  Check, X, Share2, ChevronLeft, PenLine, Inbox, RotateCcw, LogOut, Bot,
  PackagePlus, UserPlus, Plus, ImagePlus, Trash2,
} from "lucide-react";
import { supabase, configurado } from "./supabase.js";
import { parserLocal } from "./parserLocal.js";
import { CSS } from "./estilos.js";
import logoEducarte from "./assets/logo-educarte.webp";

/* ============ CONSTANTES ============ */

const EXEMPLO_WHATS =
  "Oi, bom dia! Tudo bem? Preciso de 1 caixa de papel A4, 10 canetas azuis, 20 cadernos e 5 pastas plásticas. Consegue mandar hoje à tarde? Obrigada!";

const PAPEIS = {
  admin:      { nome: "Admin",      abas: ["novo", "pedidos", "separacao", "fornecedores", "entrega", "cadastro", "equipe"] },
  atendente:  { nome: "Atendente",  abas: ["novo", "pedidos"] },
  separador:  { nome: "Separador",  abas: ["separacao", "fornecedores", "pedidos"] },
  entregador: { nome: "Entregador", abas: ["entrega", "pedidos"] },
};

const ABA_META = {
  novo:         { Icone: Sparkles,      nome: "Novo" },
  pedidos:      { Icone: ClipboardList, nome: "Pedidos" },
  separacao:    { Icone: PackageSearch, nome: "Separação" },
  fornecedores: { Icone: Factory,       nome: "Fornec." },
  entrega:      { Icone: Truck,         nome: "Entrega" },
  cadastro:     { Icone: PackagePlus,   nome: "Cadastro" },
  equipe:       { Icone: Users,         nome: "Equipe" },
};

const STATUS_META = {
  pendente:   { rotulo: "A separar",             cls: "chip-pend" },
  separado:   { rotulo: "Separado",              cls: "chip-sep" },
  aguardando: { rotulo: "Aguardando fornecedor", cls: "chip-wait" },
  entregue:   { rotulo: "Entregue",              cls: "chip-ok" },
};

const fmt = (d) => new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

/* ============ AUXILIARES ============ */

function Chip({ status, extra }) {
  const m = STATUS_META[status];
  return <span className={`chip ${m.cls}`}>{m.rotulo}{extra ? ` · ${extra}` : ""}</span>;
}

function statusPedido(p) {
  const s = p.itens.map((i) => i.status);
  if (s.every((x) => x === "entregue")) return { rotulo: "Finalizado", cls: "ped-fim" };
  if (s.some((x) => x === "entregue")) return { rotulo: "Parcialmente entregue", cls: "ped-parc" };
  if (s.some((x) => x === "separado")) return { rotulo: "Pronto p/ entrega", cls: "ped-sep" };
  if (s.every((x) => x === "aguardando")) return { rotulo: "Aguardando fornecedor", cls: "ped-wait" };
  return { rotulo: "Em separação", cls: "ped-aberto" };
}

function gerarRelatorio(p) {
  const ent = p.itens.filter((i) => i.status === "entregue");
  const ag  = p.itens.filter((i) => i.status === "aguardando");
  const out = p.itens.filter((i) => i.status === "pendente" || i.status === "separado");
  const nomeCliente = p.cliente_nome.split(" (")[0];
  let msg = `Olá, ${nomeCliente}! Atualização do seu pedido de ${fmt(p.criado_em)}:\n`;
  if (ent.length) msg += `\n✅ *Entregue:*\n` + ent.map((i) => `• ${i.qtd}x ${i.nome}`).join("\n");
  if (out.length) msg += `\n\n📦 *Em preparação na loja:*\n` + out.map((i) => `• ${i.qtd}x ${i.nome}`).join("\n");
  if (ag.length)  msg += `\n\n⏳ *Aguardando fornecedor:*\n` + ag.map((i) => `• ${i.qtd}x ${i.nome} (${i.fornecedor})`).join("\n");
  msg += `\n\nQualquer dúvida é só chamar! 😊`;
  return msg;
}

/* ============ ASSINATURA ============ */

function AssinaturaPad({ onConfirmar, onCancelar, cliente, salvando }) {
  const ref = useRef(null);
  const desenhando = useRef(false);
  const [temTraco, setTemTraco] = useState(false);

  useEffect(() => {
    const c = ref.current;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.offsetWidth * dpr;
    c.height = 180 * dpr;
    const ctx = c.getContext("2d");
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#1F2A44";
  }, []);

  const pos = (e) => {
    const r = ref.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e) => {
    e.preventDefault();
    ref.current.setPointerCapture(e.pointerId);
    desenhando.current = true;
    const ctx = ref.current.getContext("2d");
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  };
  const move = (e) => {
    if (!desenhando.current) return;
    const ctx = ref.current.getContext("2d");
    const p = pos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setTemTraco(true);
  };
  const up = () => { desenhando.current = false; };
  const limpar = () => {
    const c = ref.current;
    c.getContext("2d").clearRect(0, 0, c.width, c.height);
    setTemTraco(false);
  };

  return (
    <div className="modal-fundo">
      <div className="modal">
        <h3>Assinatura de recebimento</h3>
        <p className="mut">{cliente} — confirme o recebimento assinando abaixo.</p>
        <canvas
          ref={ref}
          className="canvas-assin"
          style={{ touchAction: "none" }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
        />
        <div className="linha-btns">
          <button className="btn fantasma" onClick={limpar}><RotateCcw size={15}/> Limpar</button>
          <button className="btn fantasma" onClick={onCancelar}>Cancelar</button>
          <button
            className="btn primario"
            disabled={!temTraco || salvando}
            onClick={() => onConfirmar(ref.current.toDataURL("image/png"))}
          >
            <Check size={16}/>{salvando ? "Salvando…" : "Confirmar entrega"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ============ LOGIN (magic link) ============ */

function TelaLogin() {
  const [email, setEmail] = useState("");
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const entrar = async () => {
    setEnviando(true);
    setErro(null);
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + import.meta.env.BASE_URL },
    });
    setEnviando(false);
    if (error) setErro(error.message);
    else setEnviado(true);
  };

  return (
    <div className="login-tela">
      <style>{CSS}</style>
      <div className="login-caixa">
        <div className="marca">
          <img src={logoEducarte} alt="Educarte" className="marca-logo" />
          <div>
            <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 22, fontWeight: 700 }}>Educarte</h1>
            <p style={{ fontSize: 12, color: "var(--ink-soft)" }}>Balcão — do pedido à entrega</p>
          </div>
        </div>
        <label className="rotulo">Seu e-mail</label>
        <input
          className="campo"
          type="email"
          placeholder="voce@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && email.includes("@") && entrar()}
        />
        <button
          className="btn primario largo"
          disabled={!email.includes("@") || enviando}
          onClick={entrar}
        >
          {enviando ? "Enviando…" : "Receber link de acesso"}
        </button>
        {enviado && (
          <div className="login-msg-ok">
            📬 Link enviado! Abra seu e-mail e toque no link para entrar — sem senha.
          </div>
        )}
        {erro && <div className="login-msg-erro">{erro}</div>}
      </div>
    </div>
  );
}

/* ============ TELA DE CONFIGURAÇÃO PENDENTE ============ */

function TelaConfiguracao() {
  return (
    <div className="login-tela">
      <style>{CSS}</style>
      <div className="login-caixa">
        <h2 style={{ fontFamily: "'Outfit', sans-serif", marginBottom: 8 }}>Configuração pendente</h2>
        <p className="mut" style={{ lineHeight: 1.5 }}>
          As variáveis <code>VITE_SUPABASE_URL</code> e <code>VITE_SUPABASE_ANON_KEY</code> não
          foram definidas. Crie um arquivo <code>.env</code> na raiz do projeto (veja o{" "}
          <code>.env.example</code>) ou configure os secrets no GitHub. O passo a passo completo
          está no README.
        </p>
      </div>
    </div>
  );
}

/* ============ APP ============ */

export default function App() {
  const [sessao, setSessao] = useState(undefined); // undefined = carregando
  const [perfil, setPerfil] = useState(null);

  const [aba, setAba] = useState("pedidos");
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [produtos, setProdutos] = useState([]);
  const [fornecedores, setFornecedores] = useState([]);
  const [equipe, setEquipe] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [detalhe, setDetalhe] = useState(null);

  // cadastro (clientes / produtos / fornecedores)
  const [subCadastro, setSubCadastro] = useState("clientes");
  const [novoClienteNome, setNovoClienteNome] = useState("");
  const [novoClienteTel, setNovoClienteTel] = useState("");
  const [novoFornecedorNome, setNovoFornecedorNome] = useState("");
  const [novoProdutoNome, setNovoProdutoNome] = useState("");
  const [novoProdutoChaves, setNovoProdutoChaves] = useState("");
  const [novoProdutoModificador, setNovoProdutoModificador] = useState("");
  const [novoProdutoFornecedorId, setNovoProdutoFornecedorId] = useState(null);
  const [salvandoCadastro, setSalvandoCadastro] = useState(false);

  // novo pedido
  const [texto, setTexto] = useState("");
  const [clienteId, setClienteId] = useState(null);
  const [interpretando, setInterpretando] = useState(false);
  const [rascunho, setRascunho] = useState(null);
  const [origemIA, setOrigemIA] = useState(null); // 'claude' | 'local'
  const [erroInterpretacao, setErroInterpretacao] = useState(null);
  const [imagemArquivo, setImagemArquivo] = useState(null);
  const [imagemPreview, setImagemPreview] = useState(null);
  const [produtoManualId, setProdutoManualId] = useState(null);
  const [qtdManual, setQtdManual] = useState(1);

  // foto do pedido (visualização)
  const [fotoUrlVendo, setFotoUrlVendo] = useState(null);
  const [carregandoFoto, setCarregandoFoto] = useState(false);

  // exclusão de pedido
  const [excluindo, setExcluindo] = useState(null);
  const [excluindoSalvando, setExcluindoSalvando] = useState(false);

  // fluxos
  const [recebendoDe, setRecebendoDe] = useState(null);
  const [marcados, setMarcados] = useState({});
  const [assinando, setAssinando] = useState(null);
  const [salvandoEntrega, setSalvandoEntrega] = useState(false);
  const [toast, setToast] = useState(null);

  const avisar = (m) => { setToast(m); setTimeout(() => setToast(null), 2800); };

  /* --- sessão --- */
  useEffect(() => {
    if (!configurado) return;
    supabase.auth.getSession().then(({ data }) => setSessao(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_ev, s) => setSessao(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  /* --- carregar dados --- */
  const carregarTudo = useCallback(async () => {
    setCarregando(true);
    const [{ data: perf }, { data: peds, error: erroPeds }, { data: clis }, { data: prods }, { data: forns }] = await Promise.all([
      supabase.from("perfis").select("*").eq("id", sessao.user.id).single(),
      supabase
        .from("pedidos")
        .select("id, criado_em, cliente_id, foto_pedido_path, clientes(nome), itens_pedido(*)")
        .order("criado_em", { ascending: false }),
      supabase.from("clientes").select("*").order("nome"),
      supabase.from("produtos").select("*, fornecedores(nome)").eq("ativo", true).order("nome"),
      supabase.from("fornecedores").select("*").order("nome"),
    ]);
    if (erroPeds) avisar("Erro ao carregar pedidos: " + erroPeds.message);
    setPerfil(perf);
    setPedidos(
      (peds || []).map((p) => ({
        ...p,
        cliente_nome: p.clientes?.nome || "Cliente",
        itens: (p.itens_pedido || []).sort((a, b) => a.id - b.id),
      })),
    );
    setClientes(clis || []);
    setProdutos(
      (prods || []).map((p) => ({ ...p, fornecedor_nome: p.fornecedores?.nome || "—" })),
    );
    setFornecedores(forns || []);
    if ((clis || []).length && clienteId == null) setClienteId(clis[0].id);
    if ((forns || []).length && novoProdutoFornecedorId == null) setNovoProdutoFornecedorId(forns[0].id);
    if ((prods || []).length && produtoManualId == null) setProdutoManualId(prods[0].id);
    setCarregando(false);
  }, [sessao, clienteId, novoProdutoFornecedorId, produtoManualId]);

  useEffect(() => { if (sessao) carregarTudo(); }, [sessao]); // eslint-disable-line

  const carregarEquipe = useCallback(async () => {
    const { data } = await supabase.from("perfis").select("*").order("criado_em");
    setEquipe(data || []);
  }, []);
  useEffect(() => { if (aba === "equipe" && perfil?.papel === "admin") carregarEquipe(); }, [aba, perfil, carregarEquipe]);

  /* --- imagem anexada (foto do pedido) --- */
  const selecionarImagem = (e) => {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setImagemArquivo(arquivo);
    const leitor = new FileReader();
    leitor.onload = () => setImagemPreview(leitor.result);
    leitor.readAsDataURL(arquivo);
  };
  const removerImagem = () => { setImagemArquivo(null); setImagemPreview(null); };

  const verFotoPedido = async (caminho) => {
    setCarregandoFoto(true);
    const { data, error } = await supabase.storage.from("fotos-pedido").createSignedUrl(caminho, 120);
    setCarregandoFoto(false);
    if (error) return avisar("Erro ao abrir foto: " + error.message);
    setFotoUrlVendo(data.signedUrl);
  };

  /* --- interpretação: dois métodos independentes, escolhidos pelo atendente --- */
  const definirRascunhoDeItens = (itens) => {
    const porId = Object.fromEntries(produtos.map((p) => [p.id, p]));
    setRascunho(
      (itens || [])
        .filter((i) => porId[i.produto_id])
        .map((i, idx) => ({
          key: `r${idx}-${Date.now()}`,
          qtd: i.qtd || 1,
          escolhido: i.produto_id,
          opcoes: [i.produto_id, ...(i.alternativas || []).filter((a) => porId[a])],
          ambiguo: (i.alternativas || []).filter((a) => porId[a]).length > 0,
        })),
    );
  };

  const interpretarComIA = async () => {
    setInterpretando(true);
    setErroInterpretacao(null);
    try {
      const { data, error } = await supabase.functions.invoke("interpretar-pedido", {
        body: { texto, imagem: imagemPreview },
      });
      if (error || data?.erro) throw new Error(data?.erro || error.message);
      setOrigemIA("claude");
      definirRascunhoDeItens(data.itens);
    } catch (e) {
      setErroInterpretacao(
        "Não foi possível interpretar com a IA (" + (e.message || e) + "). Tente de novo ou use o Parser local / adicione os itens manualmente.",
      );
    }
    setInterpretando(false);
  };

  const interpretarComParserLocal = () => {
    setErroInterpretacao(null);
    setOrigemIA("local");
    definirRascunhoDeItens(parserLocal(texto, produtos));
  };

  const adicionarItemManual = () => {
    if (!produtoManualId) return;
    setRascunho((atual) => [
      ...(atual || []),
      { key: `m${Date.now()}`, qtd: qtdManual || 1, escolhido: produtoManualId, opcoes: [produtoManualId], ambiguo: false },
    ]);
    setQtdManual(1);
  };

  const criarPedido = async () => {
    const { data: ped, error } = await supabase
      .from("pedidos")
      .insert({ cliente_id: clienteId, criado_por: sessao.user.id })
      .select()
      .single();
    if (error) return avisar("Erro ao criar pedido: " + error.message);

    const porId = Object.fromEntries(produtos.map((p) => [p.id, p]));
    const itens = rascunho.map((r) => {
      const pr = porId[r.escolhido];
      return {
        pedido_id: ped.id,
        produto_id: pr.id,
        nome: pr.nome,
        qtd: r.qtd,
        status: "pendente",
        fornecedor: pr.fornecedor_nome,
      };
    });
    const { error: e2 } = await supabase.from("itens_pedido").insert(itens);
    if (e2) return avisar("Erro nos itens: " + e2.message);

    if (imagemArquivo) {
      const ext = imagemArquivo.name.split(".").pop() || "jpg";
      const caminho = `pedido-${ped.id}-${Date.now()}.${ext}`;
      const { error: eFoto } = await supabase.storage
        .from("fotos-pedido")
        .upload(caminho, imagemArquivo, { contentType: imagemArquivo.type });
      if (eFoto) avisar("Pedido criado, mas a foto não pôde ser salva: " + eFoto.message);
      else await supabase.from("pedidos").update({ foto_pedido_path: caminho }).eq("id", ped.id);
    }

    setTexto(""); setRascunho(null); setImagemArquivo(null); setImagemPreview(null); setErroInterpretacao(null);
    await carregarTudo();
    setAba(perfil.papel === "atendente" ? "pedidos" : "separacao");
    avisar("Pedido criado ✓");
  };

  const mudarItem = async (itemId, patch) => {
    const { error } = await supabase.from("itens_pedido").update(patch).eq("id", itemId);
    if (error) return avisar("Erro: " + error.message);
    await carregarTudo();
  };

  /* --- derivados --- */
  const itensSeparacao = pedidos.flatMap((p) =>
    p.itens.filter((i) => i.status === "pendente").map((i) => ({ ...i, pedido: p })));
  const itensAguardando = pedidos.flatMap((p) =>
    p.itens.filter((i) => i.status === "aguardando").map((i) => ({ ...i, pedido: p })));
  const porFornecedor = itensAguardando.reduce((acc, it) => {
    (acc[it.fornecedor || "Sem fornecedor"] ||= []).push(it);
    return acc;
  }, {});
  const pedidosEntrega = pedidos.filter((p) => p.itens.some((i) => i.status === "separado"));

  const confirmarRecebimento = async () => {
    const ids = Object.keys(marcados).filter((k) => marcados[k]).map(Number);
    const { error } = await supabase
      .from("itens_pedido")
      .update({ status: "pendente" })
      .in("id", ids);
    if (error) return avisar("Erro: " + error.message);
    setRecebendoDe(null); setMarcados({});
    await carregarTudo();
    avisar("Itens liberados para separação ✓");
  };

  const confirmarEntrega = async (assinaturaDataUrl) => {
    setSalvandoEntrega(true);
    const p = assinando;
    let caminho = null;
    try {
      const blob = await (await fetch(assinaturaDataUrl)).blob();
      caminho = `pedido-${p.id}-${Date.now()}.png`;
      const { error: eUp } = await supabase.storage
        .from("assinaturas")
        .upload(caminho, blob, { contentType: "image/png" });
      if (eUp) throw eUp;
    } catch (e) {
      setSalvandoEntrega(false);
      return avisar("Erro ao salvar assinatura: " + (e.message || e));
    }

    const idsSeparados = p.itens.filter((i) => i.status === "separado").map((i) => i.id);
    await supabase.from("entregas").insert({
      pedido_id: p.id,
      assinatura_path: caminho,
      entregue_por: sessao.user.id,
    });
    const { error } = await supabase
      .from("itens_pedido")
      .update({ status: "entregue", entregue_em: new Date().toISOString() })
      .in("id", idsSeparados);
    setSalvandoEntrega(false);
    if (error) return avisar("Erro: " + error.message);

    setAssinando(null);
    await carregarTudo();
    setDetalhe(p.id);
    setAba("pedidos");
    avisar("Entrega registrada com assinatura ✓");
  };

  const criarCliente = async () => {
    if (!novoClienteNome.trim()) return;
    setSalvandoCadastro(true);
    const { error } = await supabase
      .from("clientes")
      .insert({ nome: novoClienteNome.trim(), telefone: novoClienteTel.trim() || null });
    setSalvandoCadastro(false);
    if (error) return avisar("Erro ao cadastrar cliente: " + error.message);
    setNovoClienteNome(""); setNovoClienteTel("");
    await carregarTudo();
    avisar("Cliente cadastrado ✓");
  };

  const criarFornecedor = async () => {
    if (!novoFornecedorNome.trim()) return;
    setSalvandoCadastro(true);
    const { error } = await supabase
      .from("fornecedores")
      .insert({ nome: novoFornecedorNome.trim() });
    setSalvandoCadastro(false);
    if (error) return avisar("Erro ao cadastrar fornecedor: " + error.message);
    setNovoFornecedorNome("");
    await carregarTudo();
    avisar("Fornecedor cadastrado ✓");
  };

  const criarProduto = async () => {
    if (!novoProdutoNome.trim()) return;
    setSalvandoCadastro(true);
    const chaves = novoProdutoChaves
      .split(",")
      .map((c) => c.trim().toLowerCase())
      .filter(Boolean);
    const { error } = await supabase.from("produtos").insert({
      nome: novoProdutoNome.trim(),
      chaves,
      modificador: novoProdutoModificador.trim() || null,
      fornecedor_id: novoProdutoFornecedorId,
      ativo: true,
    });
    setSalvandoCadastro(false);
    if (error) return avisar("Erro ao cadastrar produto: " + error.message);
    setNovoProdutoNome(""); setNovoProdutoChaves(""); setNovoProdutoModificador("");
    await carregarTudo();
    avisar("Produto cadastrado ✓");
  };

  const mudarPapel = async (id, papel) => {
    const { error } = await supabase.from("perfis").update({ papel }).eq("id", id);
    if (error) return avisar("Erro: " + error.message);
    await carregarEquipe();
    avisar("Papel atualizado ✓");
  };

  const compartilhar = (p) => {
    const url = "https://wa.me/?text=" + encodeURIComponent(gerarRelatorio(p));
    window.open(url, "_blank");
  };

  const excluirPedido = async () => {
    if (!excluindo) return;
    setExcluindoSalvando(true);
    const { error } = await supabase.from("pedidos").delete().eq("id", excluindo.id);
    setExcluindoSalvando(false);
    if (error) return avisar("Erro ao excluir pedido: " + error.message);
    setExcluindo(null);
    setDetalhe(null);
    await carregarTudo();
    avisar("Pedido excluído ✓");
  };

  const sair = () => supabase.auth.signOut();

  /* --- guardas de tela --- */
  if (!configurado) return <TelaConfiguracao/>;
  if (sessao === undefined) {
    return <div className="tela-cheia"><style>{CSS}</style>Carregando…</div>;
  }
  if (!sessao) return <TelaLogin/>;
  if (carregando || !perfil) {
    return <div className="tela-cheia"><style>{CSS}</style>Carregando seus dados…</div>;
  }

  const abasVisiveis = PAPEIS[perfil.papel]?.abas || ["pedidos"];
  const abaAtual = abasVisiveis.includes(aba) ? aba : abasVisiveis[0];
  const badge = {
    separacao: itensSeparacao.length,
    fornecedores: itensAguardando.length,
    entrega: pedidosEntrega.length,
  };
  const pedidoDetalhe = pedidos.find((p) => p.id === detalhe);

  return (
    <div className="app">
      <style>{CSS}</style>

      <header className="topo">
        <div className="marca">
          <img src={logoEducarte} alt="Educarte" className="marca-logo" />
          <div>
            <h1>Educarte</h1>
            <p>{perfil.nome || perfil.email}</p>
          </div>
        </div>
        <div className="topo-dir">
          <span className="papel-tag">{PAPEIS[perfil.papel]?.nome}</span>
          <button className="btn-sair" onClick={sair} title="Sair"><LogOut size={15}/></button>
        </div>
      </header>

      <main className="conteudo">
        {/* ============ NOVO PEDIDO ============ */}
        {abaAtual === "novo" && (
          <section>
            <h2 className="titulo-sec">Novo pedido</h2>
            <p className="mut">Cole a mensagem do WhatsApp, anexe uma foto, ou monte a lista manualmente.</p>

            <label className="rotulo">Cliente</label>
            <select className="campo" value={clienteId ?? ""} onChange={(e) => setClienteId(Number(e.target.value))}>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>

            <label className="rotulo">Mensagem recebida</label>
            <textarea
              className="campo area"
              rows={5}
              placeholder="Cole aqui o texto do WhatsApp…"
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
            />
            <button className="link-exemplo" onClick={() => setTexto(EXEMPLO_WHATS)}>
              Usar mensagem de exemplo
            </button>

            <label className="rotulo">Ou anexe uma foto do pedido (manuscrito)</label>
            {!imagemPreview ? (
              <label className="btn fantasma largo anexo-label">
                <ImagePlus size={16}/> Escolher foto
                <input type="file" accept="image/*" onChange={selecionarImagem} style={{ display: "none" }}/>
              </label>
            ) : (
              <div className="anexo-preview">
                <img src={imagemPreview} alt="Pré-visualização do pedido anexado"/>
                <button className="btn-x anexo-remover" onClick={removerImagem}><X size={15}/></button>
              </div>
            )}

            <div className="linha-btns">
              <button
                className="btn primario"
                style={{ flex: 1 }}
                disabled={(!texto.trim() && !imagemArquivo) || interpretando}
                onClick={interpretarComIA}
              >
                <Sparkles size={16}/>{interpretando ? "Interpretando…" : "Interpretar com IA"}
              </button>
              <button
                className="btn fantasma"
                style={{ flex: 1 }}
                disabled={!texto.trim() || interpretando}
                onClick={interpretarComParserLocal}
              >
                <PackageSearch size={16}/> Parser local
              </button>
            </div>

            {interpretando && (
              <div className="ia-pensando">
                <div className="pontinhos"><span/><span/><span/></div>
                Lendo {imagemArquivo ? "a foto" : "a mensagem"} e identificando produtos e quantidades…
              </div>
            )}

            {erroInterpretacao && !interpretando && (
              <p className="mut mini" style={{ color: "#B03A3A", marginTop: 8 }}>{erroInterpretacao}</p>
            )}

            <label className="rotulo">Ou adicione um item da lista manualmente</label>
            <div className="linha-manual">
              <select className="campo" value={produtoManualId ?? ""} onChange={(e) => setProdutoManualId(Number(e.target.value))}>
                {produtos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
              </select>
              <input
                type="number" min={1} className="manual-qtd"
                value={qtdManual}
                onChange={(e) => setQtdManual(+e.target.value || 1)}
              />
              <button className="btn fantasma" disabled={!produtoManualId} onClick={adicionarItemManual}>
                <Plus size={16}/> Adicionar
              </button>
            </div>

            {rascunho && !interpretando && (
              <div className="cartao rascunho">
                <h3>Itens identificados</h3>
                {rascunho.length === 0 && <p className="mut">Nenhum produto do catálogo foi identificado no texto.</p>}
                {rascunho.map((r) => {
                  const porId = Object.fromEntries(produtos.map((p) => [p.id, p]));
                  return (
                    <div key={r.key} className={`item-rasc ${r.ambiguo ? "amb" : ""}`}>
                      <input
                        type="number" min={1} className="qtd"
                        value={r.qtd}
                        onChange={(e) => setRascunho((rs) => rs.map((x) => x.key === r.key ? { ...x, qtd: +e.target.value || 1 } : x))}
                      />
                      {r.ambiguo ? (
                        <div className="amb-bloco">
                          <span className="amb-aviso">⚠️ Qual destes o cliente quis dizer?</span>
                          <select
                            className="campo compacto"
                            value={r.escolhido}
                            onChange={(e) => setRascunho((rs) => rs.map((x) => x.key === r.key ? { ...x, escolhido: Number(e.target.value), ambiguo: false } : x))}
                          >
                            {r.opcoes.map((o) => <option key={o} value={o}>{porId[o]?.nome}</option>)}
                          </select>
                        </div>
                      ) : (
                        <span className="nome-item">{porId[r.escolhido]?.nome}</span>
                      )}
                      <button className="btn-x" onClick={() => setRascunho((rs) => rs.filter((x) => x.key !== r.key))}><X size={15}/></button>
                    </div>
                  );
                })}
                {rascunho.length > 0 && (
                  <>
                    <button
                      className="btn primario largo"
                      disabled={rascunho.some((r) => r.ambiguo)}
                      onClick={criarPedido}
                    >
                      <Check size={16}/> Confirmar e criar pedido
                    </button>
                    {rascunho.some((r) => r.ambiguo) && (
                      <p className="mut mini" style={{ marginTop: 8 }}>Resolva os itens marcados com ⚠️ antes de confirmar.</p>
                    )}
                  </>
                )}
                <div className="origem-ia">
                  <Bot size={13}/>
                  {origemIA === "claude"
                    ? "Interpretado pela API do Claude"
                    : "Interpretado pelo parser local (Edge Function não publicada — veja o README)"}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ============ PEDIDOS ============ */}
        {abaAtual === "pedidos" && !pedidoDetalhe && (
          <section>
            <h2 className="titulo-sec">Pedidos</h2>
            {pedidos.length === 0 && (
              <div className="vazio"><Inbox size={28}/><p>Nenhum pedido ainda. Crie o primeiro na aba Novo.</p></div>
            )}
            {pedidos.map((p) => {
              const st = statusPedido(p);
              const ent = p.itens.filter((i) => i.status === "entregue").length;
              return (
                <button key={p.id} className="cartao clicavel" onClick={() => setDetalhe(p.id)}>
                  <div className="ped-topo">
                    <strong>#{p.id} · {p.cliente_nome}</strong>
                    <span className={`selo ${st.cls}`}>{st.rotulo}</span>
                  </div>
                  <p className="mut mini">
                    Criado em {fmt(p.criado_em)} · {ent}/{p.itens.length} itens entregues
                  </p>
                  {p.itens.length > 0 && (
                    <div className="barra"><div className="barra-cheia" style={{ width: `${(ent / p.itens.length) * 100}%` }}/></div>
                  )}
                </button>
              );
            })}
          </section>
        )}

        {abaAtual === "pedidos" && pedidoDetalhe && (
          <section>
            <button className="volta" onClick={() => setDetalhe(null)}><ChevronLeft size={16}/> Todos os pedidos</button>
            <div className="ped-topo">
              <h2 className="titulo-sec">#{pedidoDetalhe.id} · {pedidoDetalhe.cliente_nome}</h2>
            </div>
            <span className={`selo ${statusPedido(pedidoDetalhe).cls}`}>{statusPedido(pedidoDetalhe).rotulo}</span>

            {pedidoDetalhe.foto_pedido_path && (
              <button
                className="btn fantasma"
                style={{ marginTop: 10 }}
                disabled={carregandoFoto}
                onClick={() => verFotoPedido(pedidoDetalhe.foto_pedido_path)}
              >
                <ImagePlus size={15}/> {carregandoFoto ? "Abrindo…" : "Ver foto do pedido"}
              </button>
            )}

            <div className="cartao" style={{ marginTop: 12 }}>
              {pedidoDetalhe.itens.map((i) => (
                <div key={i.id} className="item-linha">
                  <span className="qtd-fixa">{i.qtd}x</span>
                  <span className="nome-item">{i.nome}</span>
                  <Chip status={i.status} extra={i.status === "entregue" && i.entregue_em ? fmt(i.entregue_em) : i.status === "aguardando" ? i.fornecedor : null}/>
                </div>
              ))}
            </div>

            <div className="cartao relatorio">
              <h3>Relatório para o cliente</h3>
              <pre>{gerarRelatorio(pedidoDetalhe)}</pre>
              <button className="btn whats largo" onClick={() => compartilhar(pedidoDetalhe)}>
                <Share2 size={16}/> Compartilhar no WhatsApp
              </button>
            </div>

            {perfil.papel === "admin" && (
              <button className="btn perigo largo" onClick={() => setExcluindo(pedidoDetalhe)}>
                <Trash2 size={16}/> Excluir pedido
              </button>
            )}
          </section>
        )}

        {/* ============ SEPARAÇÃO ============ */}
        {abaAtual === "separacao" && (
          <section>
            <h2 className="titulo-sec">Separação</h2>
            <p className="mut">Marque cada item conforme for separando no estoque.</p>
            {itensSeparacao.length === 0 && (
              <div className="vazio"><Inbox size={28}/><p>Nada para separar agora. 👌</p></div>
            )}
            {itensSeparacao.map((it) => (
              <div key={it.id} className="cartao">
                <p className="mut mini">Pedido #{it.pedido.id} · {it.pedido.cliente_nome}</p>
                <div className="item-linha">
                  <span className="qtd-fixa">{it.qtd}x</span>
                  <span className="nome-item">{it.nome}</span>
                </div>
                <div className="linha-btns">
                  <button className="btn ok" onClick={() => { mudarItem(it.id, { status: "separado" }); avisar("Item separado ✓"); }}>
                    <Check size={15}/> Separado
                  </button>
                  <button className="btn alerta" onClick={() => { mudarItem(it.id, { status: "aguardando" }); avisar(`Enviado para a lista: ${it.fornecedor}`); }}>
                    <X size={15}/> Sem estoque
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ============ FORNECEDORES ============ */}
        {abaAtual === "fornecedores" && (
          <section>
            <h2 className="titulo-sec">Fornecedores</h2>
            <p className="mut">Itens sem estoque, agrupados para o próximo pedido de compra.</p>
            {Object.keys(porFornecedor).length === 0 && (
              <div className="vazio"><Factory size={28}/><p>Nenhum item aguardando fornecedor.</p></div>
            )}
            {Object.entries(porFornecedor).map(([forn, itens]) => (
              <div key={forn} className="cartao">
                <div className="ped-topo">
                  <strong className="forn-nome"><Factory size={15}/> {forn}</strong>
                  <span className="selo ped-wait">{itens.length} {itens.length === 1 ? "item" : "itens"}</span>
                </div>
                {itens.map((it) => (
                  <div key={it.id} className="item-linha">
                    <span className="qtd-fixa">{it.qtd}x</span>
                    <span className="nome-item">{it.nome}</span>
                    <span className="mut mini">p/ {it.pedido.cliente_nome.split(" (")[0]}</span>
                  </div>
                ))}
                <button className="btn primario largo" onClick={() => { setRecebendoDe(forn); setMarcados({}); }}>
                  <PackageSearch size={16}/> Mercadoria recebida
                </button>
              </div>
            ))}
          </section>
        )}

        {/* ============ ENTREGA ============ */}
        {abaAtual === "entrega" && (
          <section>
            <h2 className="titulo-sec">Entregas</h2>
            <p className="mut">Pedidos com itens separados, prontos para sair.</p>
            {pedidosEntrega.length === 0 && (
              <div className="vazio"><Truck size={28}/><p>Nenhuma entrega pendente.</p></div>
            )}
            {pedidosEntrega.map((p) => (
              <div key={p.id} className="cartao">
                <div className="ped-topo">
                  <strong>#{p.id} · {p.cliente_nome}</strong>
                </div>
                {p.itens.filter((i) => i.status === "separado").map((i) => (
                  <div key={i.id} className="item-linha">
                    <span className="qtd-fixa">{i.qtd}x</span>
                    <span className="nome-item">{i.nome}</span>
                  </div>
                ))}
                <button className="btn primario largo" onClick={() => setAssinando(p)}>
                  <PenLine size={16}/> Registrar entrega c/ assinatura
                </button>
              </div>
            ))}
          </section>
        )}

        {/* ============ CADASTRO (admin) ============ */}
        {abaAtual === "cadastro" && (
          <section>
            <h2 className="titulo-sec">Cadastro</h2>
            <p className="mut">Clientes, produtos e fornecedores usados nos pedidos.</p>

            <div className="subabas">
              <button className={`subaba ${subCadastro === "clientes" ? "ativa" : ""}`} onClick={() => setSubCadastro("clientes")}>
                <UserPlus size={14}/> Clientes
              </button>
              <button className={`subaba ${subCadastro === "produtos" ? "ativa" : ""}`} onClick={() => setSubCadastro("produtos")}>
                <PackagePlus size={14}/> Produtos
              </button>
              <button className={`subaba ${subCadastro === "fornecedores" ? "ativa" : ""}`} onClick={() => setSubCadastro("fornecedores")}>
                <Factory size={14}/> Fornecedores
              </button>
            </div>

            {subCadastro === "clientes" && (
              <>
                <div className="cartao">
                  <label className="rotulo">Nome</label>
                  <input className="campo" value={novoClienteNome} onChange={(e) => setNovoClienteNome(e.target.value)} placeholder="Nome do cliente"/>
                  <label className="rotulo">Telefone (opcional)</label>
                  <input className="campo" value={novoClienteTel} onChange={(e) => setNovoClienteTel(e.target.value)} placeholder="(11) 99999-9999"/>
                  <button className="btn primario largo" disabled={!novoClienteNome.trim() || salvandoCadastro} onClick={criarCliente}>
                    <Plus size={16}/> {salvandoCadastro ? "Salvando…" : "Cadastrar cliente"}
                  </button>
                </div>
                {clientes.map((c) => (
                  <div key={c.id} className="item-linha">
                    <span className="nome-item">{c.nome}</span>
                    {c.telefone && <span className="mut mini">{c.telefone}</span>}
                  </div>
                ))}
              </>
            )}

            {subCadastro === "fornecedores" && (
              <>
                <div className="cartao">
                  <label className="rotulo">Nome</label>
                  <input className="campo" value={novoFornecedorNome} onChange={(e) => setNovoFornecedorNome(e.target.value)} placeholder="Nome do fornecedor"/>
                  <button className="btn primario largo" disabled={!novoFornecedorNome.trim() || salvandoCadastro} onClick={criarFornecedor}>
                    <Plus size={16}/> {salvandoCadastro ? "Salvando…" : "Cadastrar fornecedor"}
                  </button>
                </div>
                {fornecedores.map((f) => (
                  <div key={f.id} className="item-linha">
                    <span className="nome-item">{f.nome}</span>
                  </div>
                ))}
              </>
            )}

            {subCadastro === "produtos" && (
              <>
                <div className="cartao">
                  <label className="rotulo">Nome</label>
                  <input className="campo" value={novoProdutoNome} onChange={(e) => setNovoProdutoNome(e.target.value)} placeholder="Ex.: Caderno 96 folhas Jandaia"/>
                  <label className="rotulo">Palavras-chave (separadas por vírgula)</label>
                  <input className="campo" value={novoProdutoChaves} onChange={(e) => setNovoProdutoChaves(e.target.value)} placeholder="caderno, 96 folhas"/>
                  <label className="rotulo">Modificador (opcional, p/ desempate)</label>
                  <input className="campo" value={novoProdutoModificador} onChange={(e) => setNovoProdutoModificador(e.target.value)} placeholder="Ex.: azul, 96"/>
                  <label className="rotulo">Fornecedor</label>
                  <select
                    className="campo"
                    value={novoProdutoFornecedorId ?? ""}
                    onChange={(e) => setNovoProdutoFornecedorId(Number(e.target.value))}
                  >
                    {fornecedores.map((f) => <option key={f.id} value={f.id}>{f.nome}</option>)}
                  </select>
                  <button className="btn primario largo" disabled={!novoProdutoNome.trim() || !fornecedores.length || salvandoCadastro} onClick={criarProduto}>
                    <Plus size={16}/> {salvandoCadastro ? "Salvando…" : "Cadastrar produto"}
                  </button>
                  {!fornecedores.length && <p className="mut mini" style={{ marginTop: 8 }}>Cadastre um fornecedor antes de criar produtos.</p>}
                </div>
                {produtos.map((p) => (
                  <div key={p.id} className="item-linha">
                    <span className="nome-item">{p.nome}</span>
                    <span className="mut mini">{p.fornecedor_nome}</span>
                  </div>
                ))}
              </>
            )}
          </section>
        )}

        {/* ============ EQUIPE (admin) ============ */}
        {abaAtual === "equipe" && perfil.papel === "admin" && (
          <section>
            <h2 className="titulo-sec">Equipe</h2>
            <p className="mut">
              Quem entra pela primeira vez começa como Atendente — ajuste o papel aqui.
              Cada papel vê apenas as suas telas.
            </p>
            <div className="cartao">
              {equipe.map((m) => (
                <div key={m.id} className="membro-linha">
                  <div className="membro-nome">
                    <strong>{m.nome || "—"}</strong>
                    <span>{m.email}</span>
                  </div>
                  <select
                    className="campo compacto"
                    style={{ width: "auto" }}
                    value={m.papel}
                    disabled={m.id === perfil.id}
                    onChange={(e) => mudarPapel(m.id, e.target.value)}
                  >
                    {Object.entries(PAPEIS).map(([k, v]) => <option key={k} value={k}>{v.nome}</option>)}
                  </select>
                </div>
              ))}
            </div>
            <p className="mut mini">Você não pode alterar o próprio papel (para não se trancar fora do admin).</p>
          </section>
        )}
      </main>

      {/* ============ MODAIS ============ */}
      {recebendoDe && (
        <div className="modal-fundo">
          <div className="modal">
            <h3>Mercadoria da {recebendoDe}</h3>
            <p className="mut">Marque o que chegou. Os itens voltam para a fila de separação.</p>
            {(porFornecedor[recebendoDe] || []).map((it) => (
              <label key={it.id} className="check-linha">
                <input type="checkbox" checked={!!marcados[it.id]} onChange={(e) => setMarcados((m) => ({ ...m, [it.id]: e.target.checked }))}/>
                <span>{it.qtd}x {it.nome} <span className="mut mini">— {it.pedido.cliente_nome.split(" (")[0]}</span></span>
              </label>
            ))}
            <div className="linha-btns">
              <button className="btn fantasma" onClick={() => setRecebendoDe(null)}>Cancelar</button>
              <button className="btn primario" disabled={!Object.values(marcados).some(Boolean)} onClick={confirmarRecebimento}>
                <Check size={16}/> Liberar p/ separação
              </button>
            </div>
          </div>
        </div>
      )}

      {excluindo && (
        <div className="modal-fundo" onClick={() => !excluindoSalvando && setExcluindo(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Excluir pedido #{excluindo.id}?</h3>
            <p className="mut">
              O pedido de {excluindo.cliente_nome} e todos os seus itens serão apagados
              definitivamente. Essa ação não pode ser desfeita.
            </p>
            <div className="linha-btns">
              <button className="btn fantasma" disabled={excluindoSalvando} onClick={() => setExcluindo(null)}>Cancelar</button>
              <button className="btn perigo" disabled={excluindoSalvando} onClick={excluirPedido}>
                <Trash2 size={15}/> {excluindoSalvando ? "Excluindo…" : "Excluir definitivamente"}
              </button>
            </div>
          </div>
        </div>
      )}

      {fotoUrlVendo && (
        <div className="modal-fundo" onClick={() => setFotoUrlVendo(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Foto do pedido</h3>
            <img src={fotoUrlVendo} alt="Foto do pedido anexada" className="foto-pedido-grande"/>
            <button className="btn fantasma largo" style={{ marginTop: 10 }} onClick={() => setFotoUrlVendo(null)}>Fechar</button>
          </div>
        </div>
      )}

      {assinando && (
        <AssinaturaPad
          cliente={assinando.cliente_nome}
          salvando={salvandoEntrega}
          onCancelar={() => setAssinando(null)}
          onConfirmar={confirmarEntrega}
        />
      )}

      {toast && <div className="toast">{toast}</div>}

      {/* ============ NAVEGAÇÃO ============ */}
      <nav className="abas">
        {abasVisiveis.map((k) => {
          const { Icone, nome } = ABA_META[k];
          return (
            <button key={k} className={`aba ${abaAtual === k ? "ativa" : ""}`} onClick={() => { setAba(k); setDetalhe(null); }}>
              <span className="aba-ico">
                <Icone size={19}/>
                {badge[k] > 0 && <span className="pontinho">{badge[k]}</span>}
              </span>
              {nome}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
