export const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

:root {
  --paper: #F6F3EC;
  --card: #FFFFFF;
  --ink: #1F2A44;
  --ink-soft: #6A7183;
  --line: #E7E1D3;
  --blue: #2B59C3;
  --blue-esc: #1E4094;
}

* { box-sizing: border-box; margin: 0; }
.app {
  min-height: 100vh;
  background: var(--paper);
  color: var(--ink);
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 14.5px;
  padding-bottom: 76px;
  max-width: 560px;
  margin: 0 auto;
}

.topo {
  background:
    linear-gradient(#E9EFFA 1px, transparent 1px),
    linear-gradient(90deg, #E9EFFA 1px, transparent 1px),
    #FDFCF9;
  background-size: 20px 20px, 20px 20px, auto;
  border-bottom: 2px solid var(--line);
  padding: 16px 18px 14px;
  position: relative;
}
.topo::before {
  content: '';
  position: absolute; top: 0; bottom: 0; left: 44px;
  width: 1.5px; background: #E8A0A0;
}
.marca { display: flex; align-items: center; gap: 12px; padding-left: 40px; }
.marca-ico { font-size: 26px; }
.marca-logo { height: 34px; width: auto; display: block; }
.marca h1 { font-family: 'Outfit', sans-serif; font-size: 22px; font-weight: 700; letter-spacing: -0.3px; }
.marca p { font-size: 12px; color: var(--ink-soft); margin-top: -2px; }
.topo-dir { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); display: flex; align-items: center; gap: 8px; }
.papel-tag { font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .5px; background: #DEE8FB; color: #1E4094; padding: 3px 9px; border-radius: 99px; }
.btn-sair { background: none; border: 1.5px solid var(--line); border-radius: 8px; padding: 5px 8px; cursor: pointer; color: var(--ink-soft); display: inline-flex; }

.conteudo { padding: 18px 16px; }
.titulo-sec { font-family: 'Outfit', sans-serif; font-size: 19px; font-weight: 600; margin-bottom: 4px; }
.mut { color: var(--ink-soft); font-size: 13px; margin-bottom: 12px; }
.mini { font-size: 12px; margin-bottom: 6px; }

.cartao {
  background: var(--card);
  border: 1px solid var(--line);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  width: 100%;
  text-align: left;
  box-shadow: 0 1px 2px rgba(31,42,68,0.04);
}
.clicavel { cursor: pointer; font: inherit; color: inherit; transition: transform .08s; }
.clicavel:active { transform: scale(0.985); }

.ped-topo { display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
.forn-nome { display: inline-flex; align-items: center; gap: 6px; }

.barra { height: 5px; background: #EFEBE0; border-radius: 99px; margin-top: 8px; overflow: hidden; }
.barra-cheia { height: 100%; background: #1B7B43; border-radius: 99px; transition: width .4s; }

.item-linha { display: flex; align-items: center; gap: 8px; padding: 7px 0; border-bottom: 1px dashed var(--line); flex-wrap: wrap; }
.item-linha:last-of-type { border-bottom: 0; }
.qtd-fixa { font-weight: 600; color: var(--blue); min-width: 34px; }
.nome-item { flex: 1; min-width: 140px; }

.chip {
  font-size: 11px; font-weight: 600; padding: 3px 9px;
  border-radius: 99px; white-space: nowrap; letter-spacing: .2px;
}
.chip-ok   { background: #DCF3E4; color: #1B7B43; }
.chip-wait { background: #FFF3C4; color: #8A6D00; }
.chip-sep  { background: #DEE8FB; color: #1E4094; }
.chip-pend { background: #EEECE4; color: #6A7183; }

.selo { font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 99px; white-space: nowrap; }
.ped-fim   { background: #DCF3E4; color: #1B7B43; }
.ped-parc  { background: #FFE9CC; color: #9A5B00; }
.ped-sep   { background: #DEE8FB; color: #1E4094; }
.ped-wait  { background: #FFF3C4; color: #8A6D00; }
.ped-aberto{ background: #EEECE4; color: #6A7183; }

.rotulo { display: block; font-size: 12px; font-weight: 600; color: var(--ink-soft); margin: 12px 0 4px; text-transform: uppercase; letter-spacing: .4px; }
.campo {
  width: 100%; padding: 10px 12px; border: 1.5px solid var(--line);
  border-radius: 10px; font: inherit; background: var(--card); color: var(--ink);
}
.campo:focus { outline: 2px solid var(--blue); outline-offset: 1px; }
.area { resize: vertical; }
.compacto { padding: 7px 10px; font-size: 13px; }
.link-exemplo { background: none; border: none; color: var(--blue); font-size: 12.5px; cursor: pointer; padding: 6px 0 12px; text-decoration: underline; }

.linha-manual { display: flex; gap: 8px; align-items: flex-start; margin-bottom: 10px; }
.busca-produto { position: relative; flex: 1; }
.manual-qtd { width: 58px; flex-shrink: 0; padding: 10px 7px; border: 1.5px solid var(--line); border-radius: 10px; font: inherit; text-align: center; }
.sugestoes {
  position: absolute; top: calc(100% + 4px); left: 0; right: 0; z-index: 20;
  background: var(--card); border: 1.5px solid var(--line); border-radius: 10px;
  box-shadow: 0 6px 20px rgba(31,42,68,.14); max-height: 220px; overflow-y: auto;
}
.sugestao-item {
  display: block; width: 100%; text-align: left; background: none; border: none;
  padding: 9px 12px; font: inherit; font-size: 13.5px; color: var(--ink); cursor: pointer;
  border-bottom: 1px dashed var(--line);
}
.sugestao-item:last-child { border-bottom: none; }
.sugestao-item:hover { background: #F6F3EC; }
.sugestao-vazia { padding: 10px 12px; font-size: 12.5px; color: var(--ink-soft); }

.btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 6px;
  padding: 10px 14px; border-radius: 10px; border: none; font: inherit;
  font-weight: 600; font-size: 13.5px; cursor: pointer; transition: filter .1s;
}
.btn:active { filter: brightness(.93); }
.btn:disabled { opacity: .45; cursor: default; }
.primario { background: var(--blue); color: #fff; }
.ok       { background: #1B7B43; color: #fff; flex: 1; }
.alerta   { background: #FFF3C4; color: #8A6D00; flex: 1; }
.whats    { background: #25D366; color: #fff; }
.fantasma { background: transparent; border: 1.5px solid var(--line); color: var(--ink); }
.perigo   { background: #B03A3A; color: #fff; }
.largo { width: 100%; margin-top: 10px; }
.linha-btns { display: flex; gap: 8px; margin-top: 10px; flex-wrap: wrap; }

.btn-x { background: none; border: none; color: var(--ink-soft); cursor: pointer; padding: 4px; }

.ia-pensando { display: flex; align-items: center; gap: 10px; margin-top: 14px; color: var(--ink-soft); font-size: 13px; }
.pontinhos { display: flex; gap: 4px; }
.pontinhos span { width: 7px; height: 7px; border-radius: 50%; background: var(--blue); animation: pulsa 1s infinite; }
.pontinhos span:nth-child(2) { animation-delay: .18s; }
.pontinhos span:nth-child(3) { animation-delay: .36s; }
@keyframes pulsa { 0%,100% { opacity: .25; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .pontinhos span { animation: none; } }

.rascunho { margin-top: 14px; }
.rascunho h3 { font-family: 'Outfit', sans-serif; font-size: 15px; margin-bottom: 8px; }
.item-rasc { display: flex; align-items: center; gap: 8px; padding: 8px 0; border-bottom: 1px dashed var(--line); flex-wrap: wrap; }
.item-rasc .qtd { width: 58px; padding: 7px; border: 1.5px solid var(--line); border-radius: 8px; font: inherit; text-align: center; }
.amb { background: #FFFBEA; border-radius: 8px; padding: 8px; }
.amb-bloco { flex: 1; min-width: 200px; }
.amb-linha { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
.amb-aviso { display: block; font-size: 12px; color: #8A6D00; margin-bottom: 5px; font-weight: 600; }

.origem-ia { font-size: 11.5px; color: var(--ink-soft); margin-top: 8px; display: flex; align-items: center; gap: 5px; }

.relatorio pre {
  white-space: pre-wrap; font-family: inherit; font-size: 13px;
  background: #FBFAF6; border: 1px dashed var(--line); border-radius: 10px;
  padding: 12px; color: var(--ink); line-height: 1.5;
}
.relatorio h3 { font-family: 'Outfit', sans-serif; font-size: 15px; margin-bottom: 8px; }

.volta { background: none; border: none; color: var(--blue); font: inherit; font-weight: 600; display: inline-flex; align-items: center; gap: 2px; cursor: pointer; padding: 0 0 10px; }

.vazio { text-align: center; color: var(--ink-soft); padding: 44px 0; display: flex; flex-direction: column; align-items: center; gap: 8px; }

.modal-fundo { position: fixed; inset: 0; background: rgba(31,42,68,.45); display: flex; align-items: flex-end; justify-content: center; z-index: 50; }
.modal {
  background: var(--card); border-radius: 18px 18px 0 0; padding: 20px 18px 26px;
  width: 100%; max-width: 560px; box-shadow: 0 -6px 30px rgba(0,0,0,.15);
  max-height: 85vh; overflow-y: auto;
}
.modal h3 { font-family: 'Outfit', sans-serif; font-size: 17px; margin-bottom: 4px; }
.canvas-assin {
  width: 100%; height: 180px; border: 1.5px dashed var(--line);
  border-radius: 12px; background:
    repeating-linear-gradient(transparent, transparent 34px, #F0EDE4 35px);
  margin-top: 10px;
}
.check-linha { display: flex; align-items: flex-start; gap: 10px; padding: 9px 0; border-bottom: 1px dashed var(--line); cursor: pointer; }
.check-linha input { width: 18px; height: 18px; accent-color: var(--blue); margin-top: 1px; }

.toast {
  position: fixed; bottom: 84px; left: 50%; transform: translateX(-50%);
  background: var(--ink); color: #fff; padding: 10px 18px; border-radius: 99px;
  font-size: 13px; font-weight: 500; box-shadow: 0 4px 16px rgba(0,0,0,.2); z-index: 60;
  animation: sobe .25s ease; max-width: 90vw; text-align: center;
}
@keyframes sobe { from { opacity: 0; transform: translate(-50%, 8px); } to { opacity: 1; transform: translate(-50%, 0); } }

.abas {
  position: fixed; bottom: 0; left: 50%; transform: translateX(-50%);
  width: 100%; max-width: 560px;
  display: flex; background: var(--card); border-top: 1.5px solid var(--line);
  padding: 6px 4px calc(8px + env(safe-area-inset-bottom));
}
.aba {
  flex: 1; background: none; border: none; font: inherit; font-size: 10.5px; font-weight: 600;
  color: var(--ink-soft); display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 5px 0; cursor: pointer; border-radius: 10px;
}
.aba.ativa { color: var(--blue); }
.aba:focus-visible { outline: 2px solid var(--blue); }
.aba-ico { position: relative; display: inline-flex; }
.pontinho {
  position: absolute; top: -5px; right: -9px;
  background: #D64545; color: #fff; font-size: 9.5px; font-weight: 700;
  min-width: 15px; height: 15px; border-radius: 99px;
  display: flex; align-items: center; justify-content: center; padding: 0 3px;
}

/* ---- login ---- */
.login-tela {
  min-height: 100vh; display: flex; align-items: center; justify-content: center;
  background: var(--paper); padding: 20px;
  font-family: 'Inter', system-ui, sans-serif;
}
.login-caixa {
  background: var(--card); border: 1px solid var(--line); border-radius: 16px;
  padding: 28px 24px; width: 100%; max-width: 380px;
  box-shadow: 0 4px 24px rgba(31,42,68,.07);
}
.login-caixa .marca { padding-left: 0; margin-bottom: 18px; }
.login-msg-ok {
  background: #DCF3E4; color: #1B7B43; border-radius: 10px; padding: 12px;
  font-size: 13.5px; margin-top: 12px; line-height: 1.45;
}
.login-msg-erro {
  background: #FBE3E3; color: #B03A3A; border-radius: 10px; padding: 12px;
  font-size: 13.5px; margin-top: 12px;
}

/* ---- anexo de foto (novo pedido) ---- */
.anexo-label { cursor: pointer; }
.anexo-preview {
  position: relative; margin-top: 10px; border-radius: 12px; overflow: hidden;
  border: 1.5px solid var(--line); max-height: 260px;
}
.anexo-preview img { display: block; width: 100%; max-height: 260px; object-fit: cover; }
.anexo-remover {
  position: absolute; top: 6px; right: 6px; background: rgba(31,42,68,.65);
  color: #fff; border-radius: 99px; padding: 5px;
}
.foto-pedido-grande { width: 100%; border-radius: 10px; margin-top: 10px; display: block; }

/* ---- cadastro ---- */
.subabas { display: flex; gap: 6px; margin-bottom: 14px; flex-wrap: wrap; }
.subaba {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--card); border: 1.5px solid var(--line); border-radius: 99px;
  padding: 6px 12px; font: inherit; font-size: 12.5px; font-weight: 600;
  color: var(--ink-soft); cursor: pointer;
}
.subaba.ativa { background: var(--blue); border-color: var(--blue); color: #fff; }

/* ---- equipe ---- */
.membro-linha { display: flex; align-items: center; gap: 10px; padding: 10px 0; border-bottom: 1px dashed var(--line); flex-wrap: wrap; }
.membro-nome { flex: 1; min-width: 130px; }
.membro-nome strong { display: block; }
.membro-nome span { font-size: 12px; color: var(--ink-soft); word-break: break-all; }

/* ---- carregando ---- */
.tela-cheia { min-height: 100vh; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 12px; color: var(--ink-soft); background: var(--paper); font-family: 'Inter', system-ui, sans-serif; }
`;
