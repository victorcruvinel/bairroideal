// Bairro Ideal · compartilhar uma maquete: arte para o WhatsApp, QR Code, link, baixar e QR em tela cheia
import qrcode from '../vendor/qrcode.js';
import { el, esc, janela, aviso, confirmar, carregando } from './ui.js';
import { estado, api, salvar, podeEditar } from './dados.js';
import { indexar, desenhar, enquadrar } from './motor.js';
import { analisar } from './termometro.js';
import { calcular, fmt } from './matematica.js';

const TIPO = { ideal: ['🌳', 'Bairro ideal', '#d8f3dc', '#1f6f50'], carente: ['🏚️', 'Bairro carente', '#fde2d0', '#b45309'], livre: ['✏️', 'Maquete livre', '#ede9fe', '#6d28d9'] };
const corNota = (n) => (n == null ? '#9a907e' : n >= 7 ? '#2f9e44' : n >= 4.5 ? '#e8a400' : '#e5484d');

export const linkDa = (m) => (estado.nuvem ? `${location.origin}/v/${m.id}` : `${location.origin}/#/m/${m.id}`);
export const linkSite = () => location.origin + '/';

// ---------------- arte 1200 × 630 (o tamanho que o WhatsApp mostra grande)
function quebrar(ctx, texto, larg) { const ps = texto.split(' '), ls = []; let l = ''; for (const p of ps) { const t = l ? l + ' ' + p : p; if (ctx.measureText(t).width > larg && l) { ls.push(l); l = p; } else l = t; } if (l) ls.push(l); return ls; }
export async function gerarArte(m) {
  try { await document.fonts.load('700 60px Fredoka'); await document.fonts.load('800 20px Nunito'); } catch { /* */ }
  const W = 1200, H = 630, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const ctx = cv.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#5ec8f8'); g.addColorStop(.6, '#bfeaff'); g.addColorStop(1, '#eef9ff'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.85)'; [[860, 70, 1], [1080, 140, .8], [600, 40, .7]].forEach(([x, y, e]) => [[0, 0, 26], [28, -10, 32], [60, 0, 24]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(x + dx * e, y + dy * e, r * e, 0, 7); ctx.fill(); }));
  // a maquete do lado direito
  const ix = indexar(m); ctx.save(); ctx.translate(440, 60); desenhar(ctx, ix, enquadrar(ix, 760, 560, 0, false, .96), 760, 560, {}); ctx.restore();
  // cartão do lado esquerdo
  const a = analisar(m), M = calcular(m, a), [em, tipo, fundo, cor] = TIPO[m.tipo] || TIPO.livre;
  ctx.fillStyle = 'rgba(255,255,255,.94)'; ctx.beginPath(); ctx.roundRect(40, 40, 470, 550, 34); ctx.fill();
  ctx.fillStyle = '#1f6f50'; ctx.font = '700 30px Fredoka, sans-serif'; ctx.textBaseline = 'alphabetic'; ctx.fillText('🏘️ Bairro Ideal', 74, 98);
  ctx.font = '700 54px Fredoka, sans-serif'; ctx.fillStyle = '#2b2a33'; const linhas = quebrar(ctx, m.nome || 'Maquete', 400).slice(0, 3);
  linhas.forEach((l, i) => ctx.fillText(l, 72, 172 + i * 60)); let y = 172 + (linhas.length - 1) * 60 + 50;
  ctx.font = '800 22px Nunito, sans-serif'; const tl = `${em} ${tipo}`, tw = ctx.measureText(tl).width + 28; ctx.fillStyle = fundo; ctx.beginPath(); ctx.roundRect(72, y - 26, tw, 38, 19); ctx.fill(); ctx.fillStyle = cor; ctx.fillText(tl, 86, y);
  y += 70;
  if (a.nota != null) { ctx.fillStyle = corNota(a.nota); ctx.font = '700 84px Fredoka, sans-serif'; const nt = a.nota.toLocaleString('pt-BR', { minimumFractionDigits: 1 }); ctx.fillText(nt, 72, y + 40); const nw = ctx.measureText(nt).width; ctx.font = '800 20px Nunito, sans-serif'; ctx.fillStyle = '#6b6457'; ctx.fillText('nota do', 86 + nw, y + 8); ctx.fillText('bairro', 86 + nw, y + 34); y += 80; }
  ctx.font = '800 21px Nunito, sans-serif'; ctx.fillStyle = '#4b463c';
  const info = [`🏠 ${a.contagem.casas + a.contagem.predios + a.contagem.barracos} construções   🌳 ${a.contagem.arvores} árvores`, `📏 ${fmt(M.area)} m²${M.moradores ? `   👨‍👩‍👧 ~${fmt(M.moradores)} moradores` : ''}`];
  info.forEach((t, i) => ctx.fillText(t, 72, y + i * 34));
  ctx.fillStyle = '#1f6f50'; ctx.beginPath(); ctx.roundRect(72, 520, 406, 46, 23); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = '800 20px Nunito, sans-serif'; ctx.fillText('👆 Toque para ver em 3D e passear', 96, 550);
  ctx.fillStyle = 'rgba(20,81,58,.85)'; ctx.font = '700 22px Fredoka, sans-serif'; ctx.textAlign = 'right'; ctx.fillText('por Elaine Freitas Muniz', W - 36, H - 26); ctx.textAlign = 'left';
  return cv;
}

// ---------------- QR Code
export function qrCanvas(texto, tam = 280, cor = '#14513a') {
  const q = qrcode(0, 'M'); q.addData(texto); q.make(); const n = q.getModuleCount(), borda = 2, cel = Math.floor(tam / (n + borda * 2)), lado = cel * (n + borda * 2);
  const cv = document.createElement('canvas'); cv.width = cv.height = lado; const ctx = cv.getContext('2d'); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, lado, lado); ctx.fillStyle = cor;
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) ctx.fillRect((c + borda) * cel, (r + borda) * cel, cel, cel);
  return cv;
}
function baixar(cv, nome, tipo = 'image/png', q) { const a = document.createElement('a'); a.download = nome; a.href = cv.toDataURL(tipo, q); document.body.append(a); a.click(); a.remove(); }
const nomeArquivo = (m) => (m.nome || 'maquete').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\w]+/g, '-').toLowerCase();

export function qrTelaCheia(link, titulo) {
  const t = el(`<div class="qr-cheio"><button class="redondo" aria-label="Fechar">✕</button><h2>${esc(titulo)}</h2><div class="qr-cheio-c"></div><p>Aponte a câmera do celular 📱</p><small>${esc(link.replace(/^https?:\/\//, ''))}</small></div>`);
  t.querySelector('.qr-cheio-c').append(qrCanvas(link, Math.min(innerWidth, innerHeight) * .62));
  const sair = () => { t.remove(); document.removeEventListener('keydown', tecla); }; const tecla = (e) => { if (e.key === 'Escape') sair(); };
  t.querySelector('button').onclick = sair; document.addEventListener('keydown', tecla); document.body.append(t);
}

async function copiar(texto) { try { await navigator.clipboard.writeText(texto); return true; } catch { return false; } }

// ---------------- janela de compartilhar uma maquete
export async function compartilhar(m, aoMudar) {
  if (estado.nuvem && m.publica === false) {
    if (!podeEditar(m)) return aviso('Essa maquete não está na exposição.', 'erro');
    if (!(await confirmar('Colocar na exposição?', 'Para outras pessoas abrirem o link, a maquete precisa aparecer na <b>exposição</b> (modo visitante). Pode colocar?', 'Sim, colocar', 'bt--sol'))) return;
    m.publica = true; await salvar(m); aoMudar && aoMudar();
  }
  const c = carregando('Preparando a arte…', { atraso: 0 });
  const arte = await gerarArte(m); const link = linkDa(m); c.fechar();
  // a arte vai para a planilha (é ela que aparece no WhatsApp)
  if (estado.nuvem && estado.sessao && podeEditar(m)) {
    const b64 = arte.toDataURL('image/jpeg', .8).split(',')[1];
    api('arte.salvar', { id: m.id, arte: b64 }).then((r) => { if (!r.ok && r.erro !== 'nao_achou') console.warn('arte', r.erro); });
  }
  const texto = `Olha a maquete "${m.nome}" no Bairro Ideal 🏘️ Dá para ver em 3D, passear por dentro e conhecer a história:`;
  const corpo = el(`<div class="comp">
    <div class="comp-arte"><img alt="Arte da maquete" src="${arte.toDataURL('image/jpeg', .85)}"><small>É assim que aparece no WhatsApp ✨</small></div>
    <div class="comp-lado"><div class="comp-qr"></div>
      <div class="comp-link"><input readonly value="${esc(link)}" aria-label="Link"><button class="bt" data-c="copiar">📋 Copiar</button></div>
      ${estado.nuvem ? '' : '<p class="comp-aviso">⚠️ A planilha ainda não está ligada: este link só abre neste aparelho.</p>'}
      <div class="comp-bts">
        <a class="bt comp-whats" data-c="whats" target="_blank" rel="noopener" href="https://api.whatsapp.com/send?text=${encodeURIComponent(texto + '\n' + link)}"><svg viewBox="0 0 24 24" width="20" height="20"><path fill="#fff" d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm5.4 14.1c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.1-4.5-3.9-4.7-4.1-.1-.2-1.1-1.5-1.1-2.8s.7-2 1-2.3c.2-.3.5-.3.7-.3h.5c.2 0 .4 0 .6.5l.8 2c.1.2.1.4 0 .5l-.3.5-.4.4c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.1 1 2.1 1.3 2.4 1.5.3.1.5.1.6-.1l.9-1.1c.2-.3.4-.2.6-.1l1.9.9c.3.1.5.2.5.3.1.2.1.7-.1 1.4z"/></svg> WhatsApp</a>
        ${navigator.share ? '<button class="bt" data-c="nativo">📤 Mais opções</button>' : ''}
        <button class="bt" data-c="tela">🔳 QR em tela cheia</button>
        <button class="bt" data-c="qr">⬇️ Baixar QR</button><button class="bt" data-c="arte">⬇️ Baixar arte</button></div></div></div>`);
  corpo.querySelector('.comp-qr').append(qrCanvas(link, 220));
  corpo.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-c]')?.dataset.c; if (!a) return;
    if (a === 'copiar') aviso(await copiar(link) ? 'Link copiado! 📋' : 'Não deu para copiar. Segure no link para copiar.', 'ok');
    if (a === 'tela') qrTelaCheia(link, m.nome);
    if (a === 'qr') baixar(qrCanvas(link, 900), `qr-${nomeArquivo(m)}.png`);
    if (a === 'arte') baixar(arte, `bairro-ideal-${nomeArquivo(m)}.jpg`, 'image/jpeg', .9);
    if (a === 'nativo') {
      try {
        const blob = await new Promise((ok) => arte.toBlob(ok, 'image/jpeg', .88)); const arquivo = new File([blob], `bairro-ideal-${nomeArquivo(m)}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [arquivo] })) await navigator.share({ files: [arquivo], title: m.nome, text: texto + '\n' + link });
        else await navigator.share({ title: m.nome, text: texto, url: link });
      } catch { /* cancelou */ }
    }
  });
  janela({ titulo: `📤 Compartilhar “${esc(m.nome)}”`, corpo, classe: 'janela--larga janela--comp', botoes: [{ texto: 'Fechar', valor: true }] });
}

// compartilhar a exposição inteira (link do site)
export function compartilharSite() {
  const link = linkSite(); const texto = 'Venha ver a exposição de maquetes do Bairro Ideal 🏘️';
  const corpo = el(`<div class="comp comp--site"><div class="comp-qr"></div><div class="comp-lado"><p>Mostre o QR Code na tela ou mande o link: quem abrir entra direto na <b>exposição</b> como visitante.</p>
    <div class="comp-link"><input readonly value="${esc(link)}" aria-label="Link"><button class="bt" data-c="copiar">📋 Copiar</button></div>
    <div class="comp-bts"><a class="bt comp-whats" target="_blank" rel="noopener" href="https://api.whatsapp.com/send?text=${encodeURIComponent(texto + '\n' + link)}">WhatsApp</a><button class="bt" data-c="tela">🔳 QR em tela cheia</button><button class="bt" data-c="qr">⬇️ Baixar QR</button></div></div></div>`);
  corpo.querySelector('.comp-qr').append(qrCanvas(link, 220));
  corpo.addEventListener('click', async (e) => {
    const a = e.target.closest('[data-c]')?.dataset.c;
    if (a === 'copiar') aviso(await copiar(link) ? 'Link copiado! 📋' : 'Não deu para copiar.', 'ok');
    if (a === 'tela') qrTelaCheia(link, 'Exposição Bairro Ideal'); if (a === 'qr') baixar(qrCanvas(link, 900), 'qr-bairro-ideal.png');
  });
  janela({ titulo: '🏛️ Compartilhar a exposição', corpo, classe: 'janela--larga', botoes: [{ texto: 'Fechar', valor: true }] });
}
