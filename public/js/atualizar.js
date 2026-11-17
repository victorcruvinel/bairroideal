// Bairro Ideal · atualização forçada: ninguém fica preso numa versão velha.
// 1) O /sw.js muda a cada publicação (leva o id do deploy). 2) A cada minuto, ao voltar para o app e ao abrir,
// pergunta a versão ao servidor (/versao.json, nunca vem do cache). 3) Se mudou: salva o que estiver aberto,
// mostra "Atualizando…", troca o service worker, apaga os caches velhos e recarrega.
import { carregando } from './ui.js';

let versaoAtual = null, atualizando = false, antesDeAtualizar = async () => {};
export const aoAtualizar = (fn) => { antesDeAtualizar = fn; };

async function versaoServidor() {
  try { const r = await fetch('/versao.json?t=' + Date.now(), { cache: 'no-store' }); if (!r.ok) return null; return (await r.json()).versao; } catch { return null; }
}
export async function atualizarAgora() {
  if (atualizando) return; atualizando = true;
  const c = carregando('Atualizando o Bairro Ideal…', { atraso: 0 });
  try { await antesDeAtualizar(); } catch { /* */ }
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) { await reg.update().catch(() => {}); if (reg.waiting) reg.waiting.postMessage('pular-espera'); }
    if (window.caches) { const ks = await caches.keys(); await Promise.all(ks.filter((k) => !k.endsWith('-fontes')).map((k) => caches.delete(k))); }
  } catch { /* */ }
  c.texto('Pronto! Abrindo a versão nova…');
  setTimeout(() => location.reload(), 500);
}
async function conferir() {
  if (atualizando || !navigator.onLine) return;
  const v = await versaoServidor(); if (!v) return;
  if (versaoAtual === null) { versaoAtual = v; return; }
  if (v !== versaoAtual) atualizarAgora();
}
export function iniciarAtualizacoes() {
  if ('serviceWorker' in navigator && !['localhost', '127.0.0.1'].includes(location.hostname)) {
    navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' }).then((reg) => {
      reg.update().catch(() => {});
      reg.addEventListener('updatefound', () => { const w = reg.installing; w && w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) atualizarAgora(); }); });
    }).catch(() => {});
  }
  conferir(); setInterval(conferir, 60_000);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') conferir(); });
  addEventListener('online', conferir);
}
