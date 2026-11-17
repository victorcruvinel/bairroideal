// Um "Google de mentira" para rodar o apps-script/Codigo.gs no Node (planilha, cache, Gmail, etc.)
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import crypto from 'node:crypto'; import { fileURLToPath } from 'node:url';
const arquivo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'apps-script', 'Codigo.gs');

class Aba {
  constructor(nome) { this.nome = nome; this.dados = []; this.maxCol = 26; }
  _garante(r, c) { while (this.dados.length < r) this.dados.push([]); if (c > this.maxCol) throw new Error(`Coluna ${c} além do limite (${this.maxCol}) da aba ${this.nome}`); }
  getLastRow() { let n = this.dados.length; while (n && this.dados[n - 1].every((v) => v === '' || v == null)) n--; return n; }
  getLastColumn() { return Math.max(0, ...this.dados.map((r) => r.length)); }
  getMaxColumns() { return this.maxCol; }
  insertColumnsAfter(_d, n) { this.maxCol += n; }
  setFrozenRows() { return this; }
  appendRow(v) { this._garante(this.getLastRow() + 1, v.length); this.dados.splice(this.getLastRow(), 0, [...v]); if (this.dados.length > this.getLastRow()) this.dados.length = this.getLastRow(); return this; }
  deleteRow(r) { this.dados.splice(r - 1, 1); }
  getRange(r, c, nr = 1, nc = 1) {
    const aba = this;
    const rg = {
      getValues() { const out = []; for (let i = 0; i < nr; i++) { const l = aba.dados[r - 1 + i] || []; const row = []; for (let j = 0; j < nc; j++) row.push(l[c - 1 + j] ?? ''); out.push(row); } return out; },
      getValue() { return rg.getValues()[0][0]; },
      setValues(v) { aba._garante(r + nr - 1, c + nc - 1); if (v.length !== nr || v[0].length !== nc) throw new Error('tamanho errado em setValues'); for (let i = 0; i < nr; i++) { const l = aba.dados[r - 1 + i]; for (let j = 0; j < nc; j++) { const x = v[i][j]; if (typeof x === 'string' && x.length > 50000) throw new Error('célula com mais de 50 mil letras'); l[c - 1 + j] = typeof x === 'string' && x.startsWith('=') ? '#FORMULA' : x; } } return rg; },
      setValue(x) { return rg.setValues([[x]]); },
      clearContent() { for (let i = 0; i < nr; i++) { const l = aba.dados[r - 1 + i]; if (l) for (let j = 0; j < nc; j++) l[c - 1 + j] = ''; } return rg; },
      setFontWeight() { return rg; },
    };
    return rg;
  }
}

export function criarGas({ token = null } = {}) {
  const abas = new Map(); const cache = new Map(); const emails = []; const props = new Map(token ? [['BAIRRO_TOKEN', token]] : []);
  let agora = null; let aliases = ['noreply@victorcruvinel.dev'];
  const ss = { getSheetByName: (n) => abas.get(n) || null, insertSheet: (n) => { const a = new Aba(n); abas.set(n, a); return a; } };
  const ctx = {
    SpreadsheetApp: { getActiveSpreadsheet: () => ss },
    CacheService: { getScriptCache: () => ({ get: (k) => { const v = cache.get(k); return v && v.ate > Date.now() ? v.v : null; }, put: (k, v, s) => cache.set(k, { v: String(v), ate: Date.now() + s * 1000 }), remove: (k) => cache.delete(k) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props.get(k) ?? null, setProperty: (k, v) => props.set(k, v) }) },
    Utilities: { DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' }, getUuid: () => crypto.randomUUID(), computeDigest: (_a, t) => [...crypto.createHash('sha256').update(String(t), 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b)) },
    GmailApp: { getAliases: () => aliases, sendEmail: (para, assunto, texto, opc) => { if (/[\u{10000}-\u{10FFFF}]/u.test(assunto + opc.htmlBody)) throw new Error('emoji de 4 bytes no e-mail'); emails.push({ para, assunto, texto, html: opc.htmlBody, de: opc.from || 'dono@gmail.com' }); } },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (t) => ({ setMimeType() { return this; }, getContent: () => t }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => 'dono@gmail.com' }) },
    Logger: { log() {} }, Date, JSON, Math, String, Number, Object, Array, RegExp, Error,
  };
  vm.createContext(ctx); vm.runInContext(fs.readFileSync(arquivo, 'utf8'), ctx, { filename: 'Codigo.gs' });
  const post = (corpo) => ctx.doPost({ postData: { contents: typeof corpo === 'string' ? corpo : JSON.stringify(corpo) } }).getContent();
  return {
    ctx, abas, emails, props, post, chamar: (d) => JSON.parse(post(d)),
    ultimoCodigo: (email) => { const e = [...emails].reverse().find((x) => x.para === email && /código/.test(x.assunto)); return e && e.assunto.match(/(\d{6})/)[1]; },
    semAlias() { aliases = []; }, void: agora,
  };
}
