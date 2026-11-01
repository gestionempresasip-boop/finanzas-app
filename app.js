'use strict';
/* =====================================================================
   Mis Finanzas · app de finanzas personales (todo se guarda en el móvil)
   ===================================================================== */

/* ---------- utilidades ---------- */
const KEY = 'finanzas.v1';
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => ymd(new Date());
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const mk = s => s.slice(0, 7);
const addMonths = (key, n) => { const [y, m] = key.split('-').map(Number); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
const monthName = key => { const [y, m] = key.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }); };
const monthShort = key => { const [y, m] = key.split('-').map(Number); return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'short' }).replace('.', ''); };
const dShort = d => d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).replace(/\./g, '');
const f2 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const f0 = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, useGrouping: 'always' });
const fmt = n => f2.format(Math.round(n * 100) / 100);
const fmt0 = n => (Math.abs(n - Math.round(n)) < 0.005 ? f0 : f2).format(n);
const num = s => {
  s = String(s ?? '').trim().replace(/\s|€/g, '');
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '');
  const n = parseFloat(s.replace(',', '.'));
  return isNaN(n) ? 0 : Math.round(n * 100) / 100;
};
const TH = () => document.documentElement.dataset.theme || 'fun';
const isMin = () => TH() === 'min';
const inputNum = n => (n ? String(n).replace('.', ',') : '');

const ICONS = {
  left: '<path d="M15 6l-6 6 6 6"/>', chev: '<path d="M9 6l6 6-6 6"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="3"/><path d="M3 10h18M16 15h2"/>',
  tag: '<path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="8" cy="8" r="1.4"/>',
  repeat: '<path d="M17 2l3 3-3 3M3 11V9a4 4 0 0 1 4-4h13M7 22l-3-3 3-3M21 13v2a4 4 0 0 1-4 4H4"/>',
  gauge: '<path d="M4 18a9 9 0 1 1 16 0M12 13l4-4"/>',
  save: '<path d="M12 4v11M7 10l5 5 5-5M5 20h14"/>',
  upload: '<path d="M12 20V9M7 14l5-5 5 5M5 4h14"/>',
  palette: '<circle cx="12" cy="12" r="9"/><circle cx="8" cy="10" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  spark: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
};
const ic = n => `<svg viewBox="0 0 24 24" class="ic">${ICONS[n]}</svg>`;

/* ---------- datos ---------- */
const DEF_CATS = [
  ['comida', 'Comida', '🛒', '#12b886', 'expense'], ['resto', 'Restaurantes', '🍽️', '#ff6b4a', 'expense'],
  ['transp', 'Transporte', '🚌', '#2f9bff', 'expense'], ['viv', 'Vivienda', '🏠', '#7c4dff', 'expense'],
  ['fact', 'Facturas', '💡', '#ffa62b', 'expense'], ['ocio', 'Ocio', '🎬', '#ff5fa2', 'expense'],
  ['salud', 'Salud', '💊', '#00bcd4', 'expense'], ['ropa', 'Ropa', '👕', '#b04dff', 'expense'],
  ['compras', 'Compras', '🛍️', '#8bc34a', 'expense'], ['viajes', 'Viajes', '✈️', '#2f9bff', 'expense'],
  ['edu', 'Educación', '📚', '#ffa62b', 'expense'], ['regalos', 'Regalos', '🎁', '#ff5fa2', 'expense'],
  ['mascotas', 'Mascotas', '🐾', '#12b886', 'expense'], ['otros', 'Otros', '📦', '#8a80ad', 'expense'],
  ['nomina', 'Nómina', '💼', '#12b886', 'income'], ['extra', 'Extra', '💸', '#2f9bff', 'income'],
  ['regalo_i', 'Regalos', '🎁', '#ff5fa2', 'income'], ['otros_i', 'Otros ingresos', '✨', '#8a80ad', 'income'],
].map(([id, name, icon, color, type]) => ({ id, name, icon, color, type }));

const EMOJIS = ['🏠', '🚗', '✈️', '🏖️', '💻', '📱', '🎓', '💍', '👶', '🐶', '🎁', '🏥', '🛡️', '🎸', '📷', '🚲', '👟', '🎮', '🌴', '💰', '🏔️', '🛋️', '🎄', '⭐'];
const COLORS = ['#7c4dff', '#ff5fa2', '#12b886', '#ffa62b', '#2f9bff', '#ff6b4a', '#00bcd4', '#8bc34a'];

const blankDB = () => ({
  v: 1,
  settings: { name: '', onboarded: false, lastBackup: 0 },
  accounts: [{ id: 'cta', name: 'Cuenta', icon: '🏦', balance0: 0 }, { id: 'efe', name: 'Efectivo', icon: '💶', balance0: 0 }],
  categories: JSON.parse(JSON.stringify(DEF_CATS)),
  tx: [], budgets: {}, goals: [], rec: [],
});

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const d = JSON.parse(raw); const b = blankDB(); return Object.assign(b, d, { settings: Object.assign(b.settings, d.settings) }); }
  } catch (e) { console.warn(e); }
  return blankDB();
}
let db = load();
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { toast('No se pudo guardar: sin espacio'); }
}

/* ---------- estado de la interfaz ---------- */
const ui = { tab: 'home', month: mk(today()), filter: 'all', q: '' };
let draft = {};

/* ---------- cálculos ---------- */
const catOf = id => db.categories.find(c => c.id === id) || { id, name: 'Sin categoría', icon: '❔', color: '#999', type: 'expense' };
const accOf = id => db.accounts.find(a => a.id === id) || { id, name: '—', icon: '🏦' };
const firstCat = type => (db.categories.find(c => c.type === type) || {}).id;
const monthTx = key => db.tx.filter(t => t.date.startsWith(key));
const totals = key => {
  const t = monthTx(key);
  return { inc: sum(t.filter(x => x.type === 'income'), x => x.amount), exp: sum(t.filter(x => x.type === 'expense'), x => x.amount) };
};
const accBalance = a => a.balance0 + sum(db.tx.filter(t => t.acc === a.id), t => (t.type === 'income' ? t.amount : -t.amount));
const savedIn = g => sum(g.contribs, c => c.amount);
const spentBy = (key, cat) => sum(monthTx(key).filter(t => t.type === 'expense' && t.cat === cat), t => t.amount);
const sortedTx = list => [...list].sort((a, b) => b.date.localeCompare(a.date) || (b.ts || 0) - (a.ts || 0));

function planInfo(g) {
  const saved = savedIn(g), left = Math.max(0, g.target - saved), now = new Date();
  const o = { saved, left, pct: g.target > 0 ? Math.min(1, Math.max(0, saved / g.target)) : 0 };
  if (g.deadline) {
    const dl = parse(g.deadline);
    const days = Math.ceil((dl - now) / 864e5);
    o.days = days;
    o.perMonth = left / Math.max(1, Math.ceil(days / 30.44));
    o.perWeek = left / Math.max(1, Math.ceil(days / 7));
    const start = parse(g.created);
    const total = Math.max(1, (dl - start) / 864e5);
    const el = Math.min(total, Math.max(0, (now - start) / 864e5));
    o.ideal = g.target * el / total;
    o.diff = saved - o.ideal;
  }
  if (g.contribs.length && saved > 0 && left > 0) {
    const first = parse(g.contribs.reduce((m, c) => (c.date < m ? c.date : m), g.contribs[0].date));
    const perDay = saved / Math.max(14, (now - first) / 864e5);
    if (perDay > 0) o.eta = new Date(now.getTime() + left / perDay * 864e5);
  }
  return o;
}
const timeLeft = d => (d < 0 ? 'plazo vencido' : d === 0 ? 'vence hoy' : d < 45 ? `${d} días` : `${Math.round(d / 30.44)} meses`);

function applyRec() {
  const nowKey = mk(today()), td = new Date().getDate();
  let changed = false;
  db.rec.forEach(r => {
    let k = addMonths(r.last, 1);
    while (k <= nowKey) {
      const [y, m] = k.split('-').map(Number);
      const day = Math.min(r.day, new Date(y, m, 0).getDate());
      if (k < nowKey || day <= td) {
        db.tx.push({ id: uid(), ts: Date.now(), type: r.type, amount: r.amount, cat: r.cat, acc: r.acc, date: `${k}-${pad(day)}`, note: r.note, rec: r.id, ...(r.type === 'income' ? { cobrado: false } : {}) });
        r.last = k; changed = true;
        k = addMonths(k, 1);
      } else break;
    }
  });
  if (changed) save();
}

/* ---------- visuales de metas ---------- */
function ring(p, size, color, inner, stroke = 5) {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<div class="ringwrap" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="${stroke}"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${c * p} ${c}"/></svg>
    <div class="mid">${inner}</div></div>`;
}
function jar(g, p, size) {
  const id = 'j' + g.id, y = 114 - 90 * p, col = g.color;
  const d = 'M30 22H70V30C82 34 84 42 84 54V100C84 108 78 114 70 114H30C22 114 16 108 16 100V54C16 42 18 34 30 30Z';
  return `<svg class="jar" viewBox="0 0 100 124" width="${size}" height="${Math.round(size * 1.24)}" aria-hidden="true">
    <defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs>
    <g clip-path="url(#${id})"><rect width="100" height="124" fill="var(--card)" opacity=".6"/>
    <g transform="translate(0 ${y})"><path class="wave" d="M-50 4q12.5-5 25 0t25 0t25 0t25 0t25 0t25 0t25 0t25 0V130H-50Z" fill="${col}" opacity=".92"/></g></g>
    <path d="${d}" fill="none" stroke="${col}" stroke-width="3.2"/>
    <rect x="25" y="9" width="50" height="13" rx="6" fill="${col}"/>
    <path d="M26 44v36" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".5"/>
    <text x="52" y="86" text-anchor="middle" font-size="32">${g.icon}</text></svg>`;
}
function goalVisual(g, size) {
  const p = planInfo(g).pct;
  if (isMin()) return ring(p, size, p >= 1 ? 'var(--pos)' : 'var(--ink)', `<span style="font-size:${Math.round(size * .36)}px">${g.icon}</span>`, size > 100 ? 6 : 4);
  return jar(g, p, Math.round(size * .78));
}

/* ---------- interacción: sheet, toast, confeti ---------- */
function openSheet(html, keepScroll) {
  const panel = $('#sheet .panel'), top = keepScroll ? panel.scrollTop : 0;
  $('#sheet-body').innerHTML = html;
  $('#sheet').classList.add('open');
  document.body.classList.add('lock');
  panel.scrollTop = top;
}
function closeSheet() { $('#sheet').classList.remove('open'); document.body.classList.remove('lock'); }
let toastT;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2400);
}
function confetti() {
  const cols = isMin() ? ['#111', '#777', '#bbb', '#1f7a5a'] : [...(PALS.find(p => p[0] === curPal()) || PALS[0]).slice(2), '#ffa62b', '#12b886', '#2f9bff'];
  for (let i = 0; i < (isMin() ? 36 : 70); i++) {
    const e = document.createElement('i');
    e.className = 'cf';
    e.style.cssText = `left:${Math.random() * 100}vw;background:${cols[i % cols.length]};--x:${(Math.random() - .5) * 160}px;--r:${Math.random() * 720}deg;animation-delay:${Math.random() * .4}s;border-radius:${Math.random() > .5 ? '50%' : '2px'}`;
    document.body.appendChild(e); setTimeout(() => e.remove(), 2600);
  }
  if (navigator.vibrate) navigator.vibrate(40);
}

/* ---------- vistas ---------- */
const bubble = (icon, color) => `<span class="bubble" style="--c:${color}">${icon}</span>`;
const monthNav = () => `<div class="mnav"><button class="icon" data-a="m-prev" aria-label="Mes anterior">${ic('left')}</button><b>${cap(monthName(ui.month))}</b><button class="icon" data-a="m-next" ${ui.month >= mk(today()) ? 'disabled' : ''} aria-label="Mes siguiente">${ic('chev')}</button></div>`;

function dayLabel(s) {
  if (s === today()) return 'Hoy';
  const y = new Date(); y.setDate(y.getDate() - 1);
  if (s === ymd(y)) return 'Ayer';
  return cap(parse(s).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', ''));
}
function txRow(t) {
  const c = catOf(t.cat), inc = t.type === 'income';
  return `<button class="row" data-a="tx-edit" data-id="${t.id}">${bubble(c.icon, c.color)}
    <span class="grow"><b>${esc(t.note || c.name)}</b><small>${esc(c.name)} · ${esc(accOf(t.acc).name)}${t.rec ? ' · fijo' : ''}</small></span>
    <span class="amt ${inc ? 'pos' : ''}">${inc ? '+' : '−'}${fmt(t.amount)}</span></button>`;
}

function goalMini(g) {
  const pi = planInfo(g);
  return `<button class="card mini" data-a="goal-open" data-id="${g.id}">${goalVisual(g, 96)}<b>${esc(g.name)}</b>
    <small>${fmt0(pi.saved)} · ${Math.round(pi.pct * 100)}%</small></button>`;
}
function goalHint(g, pi) {
  if (pi.left <= 0) return '¡Conseguida! 🎉';
  const p = g.plan || { type: 'none' };
  if (p.type === 'date' && g.deadline) return `Ahorra ${fmt0(pi.perMonth)}/mes · ${timeLeft(pi.days)}`;
  if (p.type === 'weeks') return `Reto 52 semanas · ${g.contribs.filter(c => c.wk).length}/52`;
  if (g.deadline) return `Faltan ${fmt0(pi.left)} · ${timeLeft(pi.days)}`;
  return `Faltan ${fmt0(pi.left)}`;
}
function goalCard(g) {
  const pi = planInfo(g);
  return `<button class="card gcard" data-a="goal-open" data-id="${g.id}">${goalVisual(g, 84)}
    <span class="grow"><b>${esc(g.name)}</b><small>${fmt0(pi.saved)} de ${fmt0(g.target)}</small>
    <span class="bar" style="--c:${isMin() ? 'var(--ink)' : g.color}"><i style="width:${pi.pct * 100}%"></i></span>
    <small>${goalHint(g, pi)}</small></span><span class="pct">${Math.round(pi.pct * 100)}%</span></button>`;
}

/* fijos de este mes que aún no han llegado a su día (applyRec los apunta ese día) */
function pendingRec() {
  const [y, m] = nowYM(), key = mk(today()), td = new Date().getDate(), dim = new Date(y, m + 1, 0).getDate();
  return db.rec.filter(r => r.last < key).map(r => ({ r, d: new Date(y, m, Math.min(r.day, dim)) }))
    .filter(({ d }) => d.getDate() > td).sort((a, b) => a.d - b.d);
}

function forecastHtml(key, tt, bal) {
  if (!db.rec.length) {
    return db.tx.length ? `<button class="card gcard" data-a="recs"><span class="bubble" style="--c:#12b886">🔁</span><span class="grow"><b>Prevé tu mes</b><small>Añade tus gastos e ingresos fijos y verás aquí cómo acabará el mes.</small></span>${ic('chev')}</button>` : '';
  }
  const pend = pendingRec(), pi = sum(pend.filter(p => p.r.type === 'income'), p => p.r.amount), pe = sum(pend.filter(p => p.r.type !== 'income'), p => p.r.amount);
  const sg = n => (n < 0 ? '−' : '+') + fmt(Math.abs(n)), cl = n => (n < 0 ? 'neg' : 'pos');
  const now = tt.inc - tt.exp, rest = pi - pe;
  const row = (l, a, b, c, cls = '') => `<div class="fcr ${cls}"><span>${l}</span><span>${a}</span><span>${b.replace(/>[+−]0,00\s€</, '>—<')}</span><span>${c}</span></div>`;
  return `<div class="sec"><h3>Previsión de ${new Date().toLocaleDateString('es-ES', { month: 'long' })}</h3><button data-a="recs">Fijos</button></div>
    <div class="card fc"><div class="fcr head"><span></span><span>Hasta hoy</span><span>Falta</span><span>Previsto</span></div>
      ${row('Ingresos', `<b class="pos">+${fmt(tt.inc)}</b>`, `<span class="pos">+${fmt(pi)}</span>`, `<b class="pos">+${fmt(tt.inc + pi)}</b>`)}
      ${row('Gastos', `<b class="neg">−${fmt(tt.exp)}</b>`, `<span class="neg">−${fmt(pe)}</span>`, `<b class="neg">−${fmt(tt.exp + pe)}</b>`)}
      ${row('Balance', `<b class="${cl(now)}">${sg(now)}</b>`, `<span class="${cl(rest)}">${sg(rest)}</span>`, `<b class="${cl(now + rest)}">${sg(now + rest)}</b>`, 'tot')}
      <p class="note" style="margin:10px 0 0">Saldo previsto a fin de mes: <b style="color:var(--ink)">${fmt(bal + rest)}</b>${pend.length ? '' : ' · ya no quedan fijos pendientes'}. Los gastos que apuntes de aquí a final de mes irán restando.</p>
      ${pend.length ? `<div class="list" style="margin-top:6px">${pend.map(({ r, d }) => { const c = catOf(r.cat); return `<div class="row">${bubble(c.icon, c.color)}<span class="grow"><b>${esc(r.note || c.name)}</b><small>${cap(d.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' }).replace('.', ''))}</small></span><span class="amt ${r.type === 'income' ? 'pos' : ''}">${r.type === 'income' ? '+' : '−'}${fmt(r.amount)}</span></div>`; }).join('')}</div>` : ''}</div>`;
}

function viewHome() {
  const key = mk(today()), tt = totals(key);
  const bal = sum(db.accounts, accBalance), reserved = sum(db.goals, savedIn), free = bal - reserved;
  const h = new Date().getHours();
  const hi = h < 6 ? 'Buenas noches' : h < 14 ? 'Buenos días' : h < 21 ? 'Buenas tardes' : 'Buenas noches';
  const nm = db.settings.name ? ', ' + esc(db.settings.name) : '';
  let html = `<div class="top"><div><small>${cap(new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }))}</small>
    <h1>${hi}${nm} <span class="only-fun">👋</span></h1></div></div>`;

  html += `<div class="card hero"><small>Saldo total</small><div class="big">${fmt(bal)}</div>
    <div class="sub2"><span><span class="only-fun">🎯 </span>En metas <b>${fmt(reserved)}</b></span><span><span class="only-fun">✨ </span>Libre <b>${fmt(free)}</b></span></div>
    <div class="split"><div><small>Ingresos de ${monthShort(key)}</small><b class="pos">+${fmt(tt.inc)}</b></div><div><small>Gastos de ${monthShort(key)}</small><b class="neg">−${fmt(tt.exp)}</b></div></div></div>`;

  if (!db.tx.length && !db.goals.length) {
    html += `<div class="card empty"><div class="e">🌱</div><b>Todo listo para empezar</b>
      <p>Añade tu primer movimiento con el botón + o crea una meta de ahorro. Si prefieres curiosear, carga datos de ejemplo.</p>
      <button class="btn block" data-a="goal-new">Crear mi primera meta</button>
      <button class="btn ghost block" data-a="demo">Ver con datos de ejemplo</button></div>`;
  }

  html += forecastHtml(key, tt, bal) + cobrosHtml(key);

  if (db.goals.length) {
    html += `<div class="sec"><h3>Mis metas</h3><button data-a="tab" data-v="goals">Ver todas</button></div>
      <div class="strip">${db.goals.map(goalMini).join('')}<button class="card mini add" data-a="goal-new"><span style="font-size:30px">＋</span>Nueva meta</button></div>`;
  } else if (db.tx.length) {
    html += `<button class="card gcard" data-a="goal-new"><span class="bubble" style="--c:#7c4dff">🎯</span><span class="grow"><b>Crea tu primera meta</b><small>Viaje, coche, fondo de emergencia…</small></span>${ic('chev')}</button>`;
  }

  if (db.tx.length > 10 && Date.now() - (db.settings.lastBackup || 0) > 30 * 864e5) {
    html += `<button class="card gcard" data-a="export"><span class="bubble" style="--c:#ffa62b">💾</span><span class="grow"><b>Haz una copia de seguridad</b><small>Tus datos solo viven en este móvil. Guárdalos en Archivos o iCloud.</small></span></button>`;
  }

  const buds = db.categories.filter(c => c.type === 'expense' && db.budgets[c.id] > 0)
    .map(c => ({ c, spent: spentBy(key, c.id), lim: db.budgets[c.id] })).sort((a, b) => b.spent / b.lim - a.spent / a.lim).slice(0, 3);
  if (buds.length) html += `<div class="sec"><h3>Presupuestos del mes</h3><button data-a="budgets">Editar</button></div><div class="card">${buds.map(budRow).join('')}</div>`;

  const rec = sortedTx(db.tx).slice(0, 5);
  if (rec.length) html += `<div class="sec"><h3>Últimos movimientos</h3><button data-a="tab" data-v="tx">Ver todos</button></div><div class="card list">${rec.map(txRow).join('')}</div>`;
  return html;
}
const nowYM = () => { const n = new Date(); return [n.getFullYear(), n.getMonth()]; };

function budRow({ c, spent, lim }) {
  const r = spent / lim, cls = r >= 1 ? 'over' : r >= .8 ? 'warn' : '';
  return `<div class="brow"><div class="head"><span>${c.icon} <b>${esc(c.name)}</b></span><small>${fmt0(spent)} de ${fmt0(lim)}</small></div>
    <div class="bar ${cls}" style="--c:${isMin() ? 'var(--ink)' : c.color}"><i style="width:${Math.min(100, r * 100)}%"></i></div></div>`;
}

function txListHtml() {
  let list = monthTx(ui.month);
  if (ui.filter !== 'all') list = list.filter(t => t.type === ui.filter);
  const q = ui.q.trim().toLowerCase();
  if (q) list = list.filter(t => (t.note || '').toLowerCase().includes(q) || catOf(t.cat).name.toLowerCase().includes(q));
  list = sortedTx(list);
  if (!list.length) return `<div class="card empty"><div class="e">🧾</div><b>Sin movimientos</b><p>${q ? 'Nada coincide con tu búsqueda.' : 'Pulsa + para añadir el primero de este mes.'}</p></div>`;
  const groups = {};
  list.forEach(t => (groups[t.date] = groups[t.date] || []).push(t));
  return Object.keys(groups).sort().reverse().map(d => {
    const net = sum(groups[d], t => (t.type === 'income' ? t.amount : -t.amount));
    return `<div class="day"><span>${dayLabel(d)}</span><span>${net > 0 ? '+' : '−'}${fmt(Math.abs(net))}</span></div><div class="card list">${groups[d].map(txRow).join('')}</div>`;
  }).join('');
}
/* checklist de cobros: ingresos del mes + fijos que aún no han llegado (solo mes actual) */
function cobrosHtml(key) {
  const items = monthTx(key).filter(t => t.type === 'income').map(t => ({ a: 'cobro', id: t.id, date: t.date, name: t.note || catOf(t.cat).name, cat: t.cat, amount: t.amount, done: t.cobrado !== false }));
  if (key === mk(today())) pendingRec().filter(p => p.r.type === 'income').forEach(({ r, d }) =>
    items.push({ a: 'cobro-rec', id: r.id, date: ymd(d), name: r.note || catOf(r.cat).name, cat: r.cat, amount: r.amount, done: false, exp: true }));
  if (!items.length) return '';
  items.sort((a, b) => a.date.localeCompare(b.date));
  const open = items.filter(i => !i.done), n = items.length - open.length;
  const rows = items.map(i => {
    const c = catOf(i.cat), when = parse(i.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', '');
    return `<div class="row ${i.done ? 'cobrado' : ''}"><button class="chk ${i.done ? 'on' : ''}" data-a="${i.a}" data-id="${i.id}" aria-label="${i.done ? 'Marcar como no cobrado' : 'Marcar como cobrado'}">${i.done ? '✓' : ''}</button>
      ${bubble(c.icon, c.color)}<span class="grow"><b>${esc(i.name)}</b><small>${i.exp ? 'Esperado el ' + when : (i.done ? 'Cobrado · ' : 'Sin confirmar · ') + when}</small></span><span class="amt ${i.done ? 'pos' : ''}">+${fmt(i.amount)}</span></div>`;
  }).join('');
  return `<div class="sec"><h3>Cobros de ${monthName(key).split(' ')[0]}</h3><span class="mute" style="font-size:13px;font-weight:600">${n} de ${items.length}</span></div>
    <div class="card cobros"><div class="list">${rows}</div>
    <p class="note" style="margin:8px 0 0">${open.length ? `Por cobrar: <b style="color:var(--ink)">${fmt(sum(open, i => i.amount))}</b>. Marca cada ingreso cuando lo veas en tu cuenta.` : '✅ Todo cobrado este mes.'}</p></div>`;
}

function viewTx() {
  const tt = totals(ui.month);
  return `<div class="top"><h1>Movimientos</h1></div>${monthNav()}${cobrosHtml(ui.month)}
    <div class="stats" style="margin-bottom:14px"><div class="card flat"><small>Ingresos</small><b class="pos">+${fmt(tt.inc)}</b></div><div class="card flat"><small>Gastos</small><b class="neg">−${fmt(tt.exp)}</b></div></div>
    <input id="q" class="search" type="search" placeholder="Buscar…" value="${esc(ui.q)}" autocomplete="off">
    <div class="chips">${[['all', 'Todos'], ['expense', 'Gastos'], ['income', 'Ingresos']].map(([v, l]) => `<button class="chip ${ui.filter === v ? 'on' : ''}" data-a="filter" data-v="${v}">${l}</button>`).join('')}</div>
    <div id="txlist">${txListHtml()}</div>`;
}

function viewGoals() {
  const tot = sum(db.goals, savedIn), target = sum(db.goals, g => g.target);
  let html = `<div class="top"><div><small>${db.goals.length} ${db.goals.length === 1 ? 'meta' : 'metas'} activas</small><h1>Mis metas</h1></div><button class="btn" data-a="goal-new" style="padding:11px 16px">＋ Nueva</button></div>`;
  if (!db.goals.length) return html + `<div class="card empty"><div class="e">🎯</div><b>Aún no tienes metas</b><p>Ponle nombre a eso que quieres conseguir y mira cómo se va llenando.</p><button class="btn block" data-a="goal-new">Crear mi primera meta</button></div>`;
  html += `<div class="card"><small>Llevas ahorrado en total</small><div class="big">${fmt(tot)}</div><div class="bar" style="margin-top:12px;--c:${isMin() ? 'var(--ink)' : 'var(--accent)'}"><i style="width:${target ? Math.min(100, tot / target * 100) : 0}%"></i></div><small>de ${fmt0(target)} entre todas tus metas</small></div>`;
  return html + db.goals.map(goalCard).join('');
}

function donut(data, total) {
  const r = 62, c = 2 * Math.PI * r;
  let off = 0, segs = '';
  data.forEach(d => { const len = d.v / total * c; segs += `<circle cx="100" cy="100" r="${r}" fill="none" stroke="${d.color}" stroke-width="${isMin() ? 16 : 26}" stroke-dasharray="${Math.max(0, len - (data.length > 1 ? 2 : 0))} ${c}" stroke-dashoffset="${-off}" transform="rotate(-90 100 100)"/>`; off += len; });
  return `<svg width="200" height="200" viewBox="0 0 200 200"><circle cx="100" cy="100" r="${r}" fill="none" stroke="var(--line)" stroke-width="${isMin() ? 16 : 26}"/>${segs}</svg>`;
}
const GREYS = ['#111', '#3d3d3a', '#6b6b66', '#999993', '#bdbdb7', '#d6d6d0'];
function viewReports() {
  const key = ui.month, tt = totals(key), prev = totals(addMonths(key, -1));
  const ex = monthTx(key).filter(t => t.type === 'expense');
  const by = {}; ex.forEach(t => (by[t.cat] = (by[t.cat] || 0) + t.amount));
  const arr = Object.entries(by).map(([id, v]) => ({ c: catOf(id), v })).sort((a, b) => b.v - a.v);
  arr.forEach((d, i) => (d.color = isMin() ? GREYS[Math.min(i, GREYS.length - 1)] : d.c.color));
  const isCur = key === mk(today());
  const [y, m] = key.split('-').map(Number);
  const days = isCur ? new Date().getDate() : new Date(y, m, 0).getDate();
  const rate = tt.inc > 0 ? Math.round((tt.inc - tt.exp) / tt.inc * 100) : null;

  let html = `<div class="top"><h1>Informes</h1></div>${monthNav()}`;
  if (!arr.length && !tt.inc) return html + `<div class="card empty"><div class="e">📊</div><b>Sin datos este mes</b><p>Cuando registres movimientos verás aquí tus gráficos.</p></div>`;

  html += `<div class="stats" style="margin-bottom:12px"><div class="card flat"><small>Ahorro del mes</small><b class="${tt.inc - tt.exp >= 0 ? 'pos' : 'neg'}">${tt.inc - tt.exp >= 0 ? '+' : '−'}${fmt0(Math.abs(tt.inc - tt.exp))}</b></div>
    <div class="card flat"><small>Tasa de ahorro</small><b>${rate === null ? '—' : rate + '%'}</b></div>
    <div class="card flat"><small>Gasto medio al día</small><b>${fmt(tt.exp / days)}</b></div>
    <div class="card flat"><small>Movimientos</small><b>${monthTx(key).length}</b></div></div>`;

  if (prev.exp > 0 && tt.exp > 0) {
    const ch = Math.round((tt.exp - prev.exp) / prev.exp * 100);
    html += `<div class="card"><span class="only-fun">${ch <= 0 ? '🎉' : '👀'} </span><span class="note">${ch === 0 ? 'Has gastado lo mismo' : `Has gastado un <b style="color:var(--ink)">${Math.abs(ch)}% ${ch < 0 ? 'menos' : 'más'}</b>`} que en ${monthShort(addMonths(key, -1))} (${fmt0(prev.exp)}).</span></div>`;
  }

  if (arr.length) {
    html += `<h3>En qué gastas</h3><div class="card"><div class="donutwrap">${donut(arr, tt.exp)}<div class="mid"><small>Gastado</small><b>${fmt0(tt.exp)}</b></div></div>
      <div class="legend">${arr.map(d => `<div class="row"><span class="dot" style="background:${d.color}"></span><span class="grow"><b>${d.c.icon} ${esc(d.c.name)}</b></span><span class="amt">${fmt(d.v)}</span><small style="width:42px;text-align:right">${Math.round(d.v / tt.exp * 100)}%</small></div>`).join('')}</div></div>`;
  }

  const months = [5, 4, 3, 2, 1, 0].map(i => addMonths(key, -i)), vals = months.map(totals);
  const mx = Math.max(1, ...vals.flatMap(v => [v.inc, v.exp]));
  html += `<h3>Últimos 6 meses</h3><div class="card"><div class="bars">${months.map((mo, i) => `<div class="bcol ${mo === key ? 'cur' : ''}"><div class="pair"><i class="inc" style="height:${vals[i].inc / mx * 100}%"></i><i class="exp" style="height:${vals[i].exp / mx * 100}%"></i></div>${monthShort(mo)}</div>`).join('')}</div>
    <div style="display:flex;gap:16px;margin-top:12px"><small><span class="dot" style="display:inline-block;background:${isMin() ? 'var(--ink)' : 'var(--pos)'}"></span> Ingresos</small><small><span class="dot" style="display:inline-block;background:${isMin() ? 'var(--line)' : 'var(--neg)'}"></span> Gastos</small></div></div>`;

  const top = [...ex].sort((a, b) => b.amount - a.amount).slice(0, 3);
  if (top.length) html += `<h3>Tus mayores gastos</h3><div class="card list">${top.map(txRow).join('')}</div>`;
  return html;
}

function viewMore() {
  const link = (a, icon, label, extra = '') => `<button class="linkrow" data-a="${a}">${ic(icon)}<span>${label}</span><small>${extra}</small></button>`;
  return `<div class="top"><h1>Más</h1></div>
    <div class="card"><label class="field" style="margin:0"><span>Tu nombre</span><input id="set-name" value="${esc(db.settings.name)}" placeholder="Opcional" autocomplete="off"></label></div>
    <h3>Tu dinero</h3><div class="card">
      ${link('budgets', 'gauge', 'Presupuestos por categoría', `${Object.values(db.budgets).filter(v => v > 0).length} activos`)}
      ${link('accounts', 'wallet', 'Cuentas', `${db.accounts.length}`)}
      ${link('recs', 'repeat', 'Gastos e ingresos fijos', `${db.rec.length}`)}
      ${link('cats', 'tag', 'Categorías', `${db.categories.length}`)}</div>
    <h3>Apariencia</h3><div class="card"><div class="seg" style="margin:0"><button class="${isMin() ? '' : 'on'}" data-a="theme" data-v="fun">🎨 Colorido</button><button class="${isMin() ? 'on' : ''}" data-a="theme" data-v="min">◻︎ Minimalista</button></div>
      ${isMin() ? '' : `<span class="pal-l">Colores</span><div class="pals">${PALS.map(([id, nm, a, b]) => `<button class="pal ${curPal() === id ? 'on' : ''}" style="background:linear-gradient(135deg,${a},${b})" data-a="pal" data-v="${id}" aria-label="${nm}" title="${nm}"></button>`).join('')}</div>`}</div>
    <h3>Tus datos</h3><div class="card">
      ${link('export', 'save', 'Guardar copia de seguridad', db.settings.lastBackup ? 'hace ' + Math.max(0, Math.round((Date.now() - db.settings.lastBackup) / 864e5)) + ' d' : 'nunca')}
      ${link('import', 'upload', 'Restaurar copia')}
      ${link('demo', 'spark', 'Cargar datos de ejemplo')}
      ${link('welcome', 'spark', 'Volver a la configuración inicial', 'nombre y estilo')}
      ${link('help', 'help', 'Cómo instalarla en el iPhone')}
      <button class="linkrow" data-a="reset" style="color:var(--neg)">${ic('trash')}<span>Borrar todos los datos</span></button></div>
    <p class="note" style="text-align:center;margin-top:18px">Tus datos se guardan solo en este teléfono.<br>Nada se envía a ningún servidor.</p>`;
}

function render() {
  const views = { home: viewHome, tx: viewTx, goals: viewGoals, rep: viewReports, more: viewMore };
  $('#view').innerHTML = views[ui.tab]();
  $$('.tab').forEach(t => t.classList.toggle('on', t.dataset.v === ui.tab));
  const fab = $('#fab');
  fab.style.display = ui.tab === 'more' ? 'none' : '';
  fab.dataset.a = ui.tab === 'goals' ? 'goal-new' : 'add';
  const meta = document.querySelector('meta[name=theme-color]');
  if (meta) meta.content = isMin() ? '#fafaf8' : '#f4efff';
}

/* ---------- hojas: movimientos ---------- */
const catGrid = type => db.categories.filter(c => c.type === type).map(c => `<button type="button" class="cg ${c.id === draft.cat ? 'on' : ''}" data-a="pick-cat" data-id="${c.id}"><span class="e">${c.icon}</span>${esc(c.name)}</button>`).join('');
const txSeg = () => `<button class="${draft.type === 'expense' ? 'on' : ''}" data-a="tx-type" data-v="expense">Gasto</button><button class="${draft.type === 'income' ? 'on' : ''}" data-a="tx-type" data-v="income">Ingreso</button>`;

function txSheet(id) {
  const t = id && db.tx.find(x => x.id === id);
  draft = { id: t ? t.id : null, type: t ? t.type : 'expense', cat: t ? t.cat : null };
  if (!draft.cat) draft.cat = firstCat(draft.type);
  openSheet(`<h2>${t ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
    <div class="seg" id="tseg">${txSeg()}</div>
    <input id="f-amt" class="bigamt" inputmode="decimal" placeholder="0,00 €" autocomplete="off" value="${t ? inputNum(t.amount) : ''}">
    <div class="cgrid" id="catgrid">${catGrid(draft.type)}</div>
    <div class="two"><label class="field"><span>Fecha</span><input type="date" id="f-date" value="${t ? t.date : today()}"></label>
    <label class="field"><span>Cuenta</span><select id="f-acc">${db.accounts.map(a => `<option value="${a.id}" ${t && t.acc === a.id ? 'selected' : ''}>${a.icon} ${esc(a.name)}</option>`).join('')}</select></label></div>
    <label class="field"><span>Nota (opcional)</span><input id="f-note" placeholder="Ej. Compra del súper" value="${esc(t ? t.note : '')}" autocomplete="off"></label>
    <label class="repeat" id="f-cob-wrap" ${draft.type === 'income' ? '' : 'hidden'}><input type="checkbox" id="f-cob" ${t && t.cobrado === false ? '' : 'checked'}><span><b>✅ Ya cobrado</b><small>Desmárcalo si aún no lo has recibido; lo verás en la lista de cobros del mes.</small></span></label>
    ${t ? '' : '<label class="repeat"><input type="checkbox" id="f-rep"><span><b>🔁 Repetir cada mes</b><small>Se añade solo el mismo día de cada mes (alquiler, suscripciones, nómina…)</small></span></label>'}
    <button class="btn block" data-a="tx-save">${t ? 'Guardar cambios' : 'Guardar'}</button>
    ${t ? '<button class="btn danger block" data-a="tx-del">Eliminar</button>' : ''}`);
  if (!t) setTimeout(() => $('#f-amt') && $('#f-amt').focus(), 320);
}

/* ---------- hojas: metas ---------- */
const emojiPicker = sel => `<div class="emojis">${EMOJIS.map(e => `<button type="button" class="em ${e === sel ? 'on' : ''}" data-a="pick-emoji" data-v="${e}">${e}</button>`).join('')}</div>`;
const colorPicker = sel => `<div class="swatches">${COLORS.map(c => `<button type="button" class="sw ${c === sel ? 'on' : ''}" style="background:${c}" data-a="pick-color" data-v="${c}" aria-label="Color"></button>`).join('')}</div>`;

function goalSheet(id) {
  const g = id && db.goals.find(x => x.id === id);
  draft = { id: g ? g.id : null, color: g ? g.color : COLORS[db.goals.length % COLORS.length] };
  openSheet(`<h2>${g ? 'Editar meta' : 'Nueva meta'}</h2>
    <label class="field"><span>¿Qué quieres conseguir?</span><input id="g-name" placeholder="Ej. Viaje a Japón" value="${esc(g ? g.name : '')}" autocomplete="off"></label>
    <div class="field"><span>Icono</span>${emojiPicker(g ? g.icon : '')}<input id="g-icon" maxlength="4" placeholder="…o escribe un emoji" value="${esc(g ? g.icon : '🎯')}" style="width:100%;padding:12px 14px;border-radius:13px;border:1px solid var(--line);background:var(--card)"></div>
    <div class="field"><span>Color</span>${colorPicker(draft.color)}</div>
    <div class="two"><label class="field"><span>Objetivo (€)</span><input id="g-target" inputmode="decimal" placeholder="3000" value="${g ? inputNum(g.target) : ''}"></label>
    <label class="field"><span>${g ? 'Llevo ahorrado (€)' : 'Ya tengo (€)'}</span><input id="g-init" inputmode="decimal" placeholder="0" value="${g ? inputNum(Math.round(savedIn(g) * 100) / 100) : ''}"></label></div>
    ${g ? '<p class="note" style="margin:-4px 0 12px">Si cambias lo que llevas ahorrado, se anota un ajuste en el historial por la diferencia.</p>' : ''}
    <label class="field"><span>Fecha límite (opcional)</span><input type="date" id="g-date" value="${g && g.deadline ? g.deadline : ''}"></label>
    <button class="btn block" data-a="goal-save">${g ? 'Guardar cambios' : 'Crear meta'}</button>
    ${g ? `<button class="btn ghost block" data-a="goal-open" data-id="${g.id}">Cancelar</button><button class="btn danger block" data-a="goal-del" data-id="${g.id}">Eliminar meta</button>` : ''}`);
}

function planHtml(g) {
  const p = g.plan || { type: 'none' }, pi = planInfo(g);
  let h = `<div class="seg">${[['none', 'Libre'], ['date', 'Por fecha'], ['weeks', '52 semanas']].map(([v, l]) => `<button class="${p.type === v ? 'on' : ''}" data-a="plan-set" data-id="${g.id}" data-v="${v}">${l}</button>`).join('')}</div>`;
  if (pi.left <= 0) return h + `<p>🎉 <b>¡Objetivo conseguido!</b> Ya tienes todo el dinero de esta meta.</p>`;
  const eta = pi.eta ? `<p class="note">A tu ritmo actual llegarías hacia el <b style="color:var(--ink)">${dShort(pi.eta)}</b>.</p>` : '';
  if (p.type === 'none') return h + `<p class="note">Sin presión: aporta cuando puedas. Si quieres un plan, elige una fecha o prueba el reto de las 52 semanas.</p>${eta}`;
  if (p.type === 'date') {
    if (!g.deadline) return h + `<p>Pon una <b>fecha límite</b> a la meta y calculo cuánto ahorrar cada mes.</p><button class="btn ghost block" data-a="goal-edit" data-id="${g.id}">Elegir fecha</button>`;
    if (pi.days < 0) return h + `<p class="neg"><b>La fecha límite ya pasó.</b> Edita la meta para ponerle una nueva.</p>`;
    const quota = Math.min(pi.left, Math.ceil(pi.perMonth * 100) / 100);
    const ahead = pi.diff >= 0;
    return h + `<div class="num">${fmt(pi.perMonth)} <small>/ mes</small></div><p class="note">o ${fmt(pi.perWeek)} a la semana · quedan ${timeLeft(pi.days)}</p>
      <p>${ahead ? '<span class="only-fun">👏 </span>' : '<span class="only-fun">⏳ </span>'}${ahead ? `Vas <b>${fmt0(pi.diff)}</b> por delante del plan.` : `Te faltan <b>${fmt0(-pi.diff)}</b> para ir al día con el plan.`}</p>${eta}
      <button class="btn block" data-a="quota" data-id="${g.id}" data-v="${quota}">Registrar cuota (${fmt(quota)})</button>`;
  }
  const step = p.step || 1, done = g.contribs.filter(c => c.wk), n = done.length;
  const steps = [1, 2, 5, 10];
  let cells = '';
  for (let w = 1; w <= 52; w++) cells += `<button class="wk ${done.some(c => c.wk === w) ? 'done' : ''}" data-a="wk" data-id="${g.id}" data-n="${w}" title="${fmt(w * step)}">${w * step}</button>`;
  return h + `<p>Cada semana ahorras tantos euros como su número × <b>${step} €</b>. Total del reto: <b>${fmt0(1378 * step)}</b>.</p>
    <div class="seg" style="margin:8px 0 0">${steps.map(s => `<button class="${step === s ? 'on' : ''}" ${n ? 'disabled' : ''} data-a="wk-step" data-id="${g.id}" data-v="${s}">${s} €</button>`).join('')}</div>
    <p class="note">${n ? `Llevas ${n} de 52 semanas (${fmt0(sum(done, c => c.amount))}). Toca una casilla para marcarla.` : 'Elige el paso y toca las casillas según vayas ahorrando.'}</p>
    <div class="wk-grid">${cells}</div>`;
}

function goalDetail(id, keep) {
  const g = db.goals.find(x => x.id === id);
  if (!g) return closeSheet();
  const pi = planInfo(g), pct = Math.round(pi.pct * 100);
  const miles = [25, 50, 75, 100].map(m => `<span class="${pct >= m ? 'ok' : ''}">${m}%</span>`).join('');
  const hist = [...g.contribs].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);
  openSheet(`<div class="gd"><div class="vis">${goalVisual(g, 150)}</div><h2>${esc(g.name)}</h2>
    <div class="big">${fmt(pi.saved)}</div><small>de ${fmt(g.target)} · ${pct}%${g.deadline ? ' · ' + (pi.days >= 0 ? 'quedan ' + timeLeft(pi.days) : 'plazo vencido') : ''}</small>
    <div class="miles">${miles}</div></div>
    <div class="btnrow"><button class="btn" data-a="contrib-new" data-id="${g.id}">＋ Aportar</button><button class="btn ghost" data-a="contrib-new" data-id="${g.id}" data-w="1">Retirar</button><button class="btn ghost" data-a="goal-edit" data-id="${g.id}">Editar</button></div>
    <h3>Plan de ahorro</h3><div class="plan">${planHtml(g)}</div>
    ${hist.length ? `<h3>Historial</h3><div class="card list">${hist.map(c => `<div class="row"><span class="grow"><b>${c.amount >= 0 ? 'Aportación' : 'Retirada'}${c.wk ? ' · semana ' + c.wk : ''}</b><small>${dayLabel(c.date)}${c.note ? ' · ' + esc(c.note) : ''}</small></span><span class="amt ${c.amount >= 0 ? 'pos' : 'neg'}">${c.amount >= 0 ? '+' : '−'}${fmt(Math.abs(c.amount))}</span><button class="icon" data-a="contrib-del" data-id="${g.id}" data-c="${c.id}" aria-label="Borrar" style="width:34px;height:34px">${ic('trash')}</button></div>`).join('')}</div>` : ''}`, keep);
}

function contribSheet(id, withdraw) {
  const g = db.goals.find(x => x.id === id);
  draft = { id, w: !!withdraw };
  openSheet(`<h2>${withdraw ? 'Retirar de' : 'Aportar a'} ${esc(g.name)}</h2>
    <input id="c-amt" class="bigamt" inputmode="decimal" placeholder="0,00 €" autocomplete="off">
    <div class="two"><label class="field"><span>Fecha</span><input type="date" id="c-date" value="${today()}"></label><label class="field"><span>Nota</span><input id="c-note" placeholder="Opcional" autocomplete="off"></label></div>
    <button class="btn block" data-a="contrib-save">${withdraw ? 'Retirar' : 'Aportar'}</button><button class="btn ghost block" data-a="goal-open" data-id="${id}">Cancelar</button>`);
  setTimeout(() => $('#c-amt') && $('#c-amt').focus(), 320);
}

function addContrib(id, amount, opts = {}) {
  const g = db.goals.find(x => x.id === id);
  const before = planInfo(g).pct;
  g.contribs.push({ id: uid(), date: opts.date || today(), amount, note: opts.note || '', ...(opts.wk ? { wk: opts.wk } : {}) });
  const after = planInfo(g).pct;
  save(); render();
  if (amount > 0 && before < 1 && after >= 1) { confetti(); toast('¡Meta conseguida! 🎉'); }
  else if (amount > 0) {
    const hit = [.75, .5, .25].find(m => before < m && after >= m);
    toast(hit ? `¡${hit * 100}% de tu meta! ${isMin() ? '' : '🚀'}` : 'Aportación guardada ✓');
  }
}

/* ---------- hojas: ajustes y listas ---------- */
function budgetsSheet() {
  const ex = db.categories.filter(c => c.type === 'expense');
  openSheet(`<h2>Presupuestos</h2><p class="note" style="margin:-6px 0 14px">Límite mensual por categoría. Te aviso al llegar al 80%. Déjalo vacío si no quieres límite.</p>
    ${ex.map(c => `<label class="field" style="display:flex;align-items:center;gap:12px;margin-bottom:8px">${bubble(c.icon, c.color)}<span style="flex:1;margin:0;font-size:16px;color:var(--ink)">${esc(c.name)}</span><input data-bud="${c.id}" inputmode="decimal" placeholder="—" value="${inputNum(db.budgets[c.id])}" style="width:110px;text-align:right"></label>`).join('')}
    <button class="btn block" data-a="bud-save">Guardar</button>`);
}
function accountsSheet() {
  openSheet(`<h2>Cuentas</h2><div class="card list">${db.accounts.map(a => `<button class="row" data-a="acc-edit" data-id="${a.id}">${bubble(a.icon, '#7c4dff')}<span class="grow"><b>${esc(a.name)}</b></span><span class="amt">${fmt(accBalance(a))}</span></button>`).join('')}</div>
    <button class="btn block" data-a="acc-edit">＋ Nueva cuenta</button>`);
}
function accSheet(id) {
  const a = id && db.accounts.find(x => x.id === id);
  draft = { id: a ? a.id : null };
  openSheet(`<h2>${a ? 'Editar cuenta' : 'Nueva cuenta'}</h2>
    <label class="field"><span>Nombre</span><input id="a-name" placeholder="Ej. Ahorro, Tarjeta…" value="${esc(a ? a.name : '')}" autocomplete="off"></label>
    <label class="field"><span>Icono</span><input id="a-icon" maxlength="4" value="${esc(a ? a.icon : '🏦')}"></label>
    <label class="field"><span>Saldo inicial (lo que tenías al empezar)</span><input id="a-bal" inputmode="decimal" placeholder="0" value="${a ? inputNum(a.balance0) : ''}"></label>
    <button class="btn block" data-a="acc-save">Guardar</button><button class="btn ghost block" data-a="accounts">Cancelar</button>
    ${a ? '<button class="btn danger block" data-a="acc-del">Eliminar cuenta</button>' : ''}`);
}
function catsSheet() {
  const block = (type, title) => `<h3>${title}</h3><div class="card list">${db.categories.filter(c => c.type === type).map(c => `<button class="row" data-a="cat-edit" data-id="${c.id}">${bubble(c.icon, c.color)}<span class="grow"><b>${esc(c.name)}</b></span>${ic('chev')}</button>`).join('')}</div>`;
  openSheet(`<h2>Categorías</h2>${block('expense', 'Gastos')}${block('income', 'Ingresos')}
    <button class="btn block" data-a="cat-edit" data-t="expense">＋ Nueva de gastos</button><button class="btn ghost block" data-a="cat-edit" data-t="income">＋ Nueva de ingresos</button>`);
}
function catSheet(id, type) {
  const c = id && db.categories.find(x => x.id === id);
  draft = { id: c ? c.id : null, type: c ? c.type : type, color: c ? c.color : COLORS[0] };
  openSheet(`<h2>${c ? 'Editar categoría' : 'Nueva categoría'}</h2>
    <label class="field"><span>Nombre</span><input id="k-name" value="${esc(c ? c.name : '')}" autocomplete="off"></label>
    <div class="field"><span>Icono</span>${emojiPicker(c ? c.icon : '')}<input id="g-icon" maxlength="4" value="${esc(c ? c.icon : '📦')}" style="width:100%;padding:12px 14px;border-radius:13px;border:1px solid var(--line);background:var(--card)"></div>
    <div class="field"><span>Color</span>${colorPicker(draft.color)}</div>
    <button class="btn block" data-a="cat-save">Guardar</button><button class="btn ghost block" data-a="cats">Cancelar</button>
    ${c ? '<button class="btn danger block" data-a="cat-del">Eliminar categoría</button>' : ''}`);
}
function recsSheet() {
  openSheet(`<h2>Gastos e ingresos fijos</h2><p class="note" style="margin:-6px 0 14px">Alquiler, suscripciones, nómina… Se añaden solos cada mes el día que elijas.</p>
    ${db.rec.length ? `<div class="card list">${db.rec.map(r => { const c = catOf(r.cat); return `<button class="row" data-a="rec-edit" data-id="${r.id}">${bubble(c.icon, c.color)}<span class="grow"><b>${esc(r.note || c.name)}</b><small>Día ${r.day} de cada mes</small></span><span class="amt ${r.type === 'income' ? 'pos' : ''}">${r.type === 'income' ? '+' : '−'}${fmt(r.amount)}</span></button>`; }).join('')}</div>` : ''}
    <button class="btn block" data-a="rec-edit">＋ Añadir fijo</button>`);
}
function recSheet(id) {
  const r = id && db.rec.find(x => x.id === id);
  draft = { id: r ? r.id : null, type: r ? r.type : 'expense', cat: r ? r.cat : null };
  if (!draft.cat) draft.cat = firstCat(draft.type);
  openSheet(`<h2>${r ? 'Editar fijo' : 'Nuevo fijo'}</h2>
    <div class="seg" id="tseg">${txSeg()}</div>
    <input id="f-amt" class="bigamt" inputmode="decimal" placeholder="0,00 €" autocomplete="off" value="${r ? inputNum(r.amount) : ''}">
    <div class="cgrid" id="catgrid">${catGrid(draft.type)}</div>
    <div class="two"><label class="field"><span>Día del mes</span><input id="r-day" type="number" min="1" max="31" inputmode="numeric" value="${r ? r.day : new Date().getDate()}"></label>
    <label class="field"><span>Cuenta</span><select id="f-acc">${db.accounts.map(a => `<option value="${a.id}" ${r && r.acc === a.id ? 'selected' : ''}>${a.icon} ${esc(a.name)}</option>`).join('')}</select></label></div>
    <label class="field"><span>Nombre</span><input id="f-note" placeholder="Ej. Alquiler, Spotify…" value="${esc(r ? r.note : '')}" autocomplete="off"></label>
    <button class="btn block" data-a="rec-save">Guardar</button><button class="btn ghost block" data-a="recs">Cancelar</button>
    ${r ? '<button class="btn danger block" data-a="rec-del">Eliminar</button>' : ''}`);
}
function helpSheet() {
  openSheet(`<h2>Instalar en el iPhone</h2>
    <div class="card"><p><b>1.</b> Abre la dirección de la app en <b>Safari</b>.</p><p style="margin-top:10px"><b>2.</b> Pulsa el botón de compartir <span style="font-size:18px">⬆︎</span>.</p><p style="margin-top:10px"><b>3.</b> Elige <b>“Añadir a pantalla de inicio”</b>.</p><p style="margin-top:10px"><b>4.</b> Ábrela desde el icono: funciona sin conexión y como app a pantalla completa.</p></div>
    <p class="note">Importante: guarda una copia de seguridad de vez en cuando (Más → Guardar copia). Si borras los datos de Safari o cambias de móvil, la copia te permite recuperarlo todo.</p>
    <button class="btn block" data-a="close">Entendido</button>`);
}
function welcomeSheet(again) {
  openSheet(`<h2>${again ? 'Configuración inicial' : '¡Hola! 👋'}</h2><p class="note" style="margin:-6px 0 16px">${again ? 'Cambia tu nombre o el estilo de la app. Tus datos no se tocan.' : 'Vamos a dejar la app a tu gusto. Podrás cambiarlo cuando quieras en Más → Apariencia.'}</p>
    <label class="field"><span>¿Cómo te llamas? (opcional)</span><input id="w-name" autocomplete="off" value="${esc(db.settings.name)}"></label>
    <div class="field"><span>Elige tu estilo</span></div>
    <div class="opts"><button class="opt ${isMin() ? '' : 'on'}" data-a="theme-w" data-v="fun"><div class="pv" style="background:linear-gradient(135deg,#7c4dff,#ff5fa2);color:#fff;font-size:34px">🫙</div>Colorido y divertido</button>
    <button class="opt ${isMin() ? 'on' : ''}" data-a="theme-w" data-v="min"><div class="pv" style="background:#fafaf8;border:1px solid #e8e8e3;color:#111;font-size:34px;font-weight:300">◯</div>Minimalista</button></div>
    <button class="btn block" data-a="welcome-ok">${again ? 'Guardar' : 'Empezar'}</button>${again ? '' : '<button class="btn ghost block" data-a="demo-w">Probar con datos de ejemplo</button>'}`);
}

/* ---------- datos de ejemplo ---------- */
function demoDB() {
  const d = blankDB();
  d.settings = { ...db.settings, onboarded: true, lastBackup: Date.now() };
  d.accounts[0].balance0 = 5200; d.accounts[1].balance0 = 140;
  let s = 42; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const r2 = (a, b) => Math.round((a + rnd() * (b - a)) * 100) / 100;
  const now = new Date(), nowKey = mk(today());
  const add = (date, type, cat, amount, note, acc = 'cta') => d.tx.push({ id: uid(), ts: date.getTime(), date: ymd(date), type, cat, amount, note, acc });
  for (let i = 100; i >= 0; i--) {
    const dt = new Date(now); dt.setDate(now.getDate() - i);
    const day = dt.getDate(), dow = dt.getDay();
    if (day === 1) add(dt, 'expense', 'viv', 650, 'Alquiler');
    if (day === 5) add(dt, 'expense', 'fact', r2(38, 62), 'Luz y agua');
    if (day === 12) add(dt, 'expense', 'ocio', 10.99, 'Spotify');
    if (day === 28) add(dt, 'income', 'nomina', 2150, 'Nómina');
    if (rnd() < .45) add(dt, 'expense', 'comida', r2(8, 55), ['Mercadona', 'Frutería', 'Carrefour', 'Panadería'][Math.floor(rnd() * 4)], rnd() < .3 ? 'efe' : 'cta');
    if (rnd() < .3) add(dt, 'expense', 'transp', r2(2, 18), ['Metro', 'Gasolina', 'Taxi'][Math.floor(rnd() * 3)]);
    if (dow === 5 || dow === 6) if (rnd() < .6) add(dt, 'expense', 'resto', r2(14, 48), 'Cena con amigos');
    if (rnd() < .1) add(dt, 'expense', 'ocio', r2(8, 30), 'Cine');
    if (rnd() < .06) add(dt, 'expense', 'ropa', r2(20, 70), 'Ropa');
    if (rnd() < .05) add(dt, 'income', 'extra', r2(20, 90), 'Venta segunda mano');
  }
  d.budgets = { comida: 300, resto: 120, ocio: 60, transp: 80, ropa: 50 };
  d.rec = [
    { id: uid(), type: 'expense', amount: 650, cat: 'viv', acc: 'cta', day: 1, note: 'Alquiler', last: nowKey },
    { id: uid(), type: 'expense', amount: 10.99, cat: 'ocio', acc: 'cta', day: 12, note: 'Spotify', last: nowKey },
    { id: uid(), type: 'expense', amount: 29.9, cat: 'salud', acc: 'cta', day: 20, note: 'Gimnasio', last: nowKey },
  ];
  const ago = n => { const x = new Date(now); x.setDate(x.getDate() - n); return ymd(x); };
  const inMonths = n => { const x = new Date(now); x.setMonth(x.getMonth() + n); return ymd(x); };
  const c = (date, amount, note = '', wk) => ({ id: uid(), date, amount, note, ...(wk ? { wk } : {}) });
  d.goals = [
    { id: uid(), name: 'Viaje a Japón', icon: '🌴', color: '#ff5fa2', target: 3000, deadline: inMonths(10), created: ago(95), plan: { type: 'date' }, contribs: [c(ago(90), 300), c(ago(60), 250), c(ago(30), 300), c(ago(5), 250)] },
    { id: uid(), name: 'Fondo de emergencia', icon: '🛡️', color: '#12b886', target: 6000, deadline: '', created: ago(95), plan: { type: 'none' }, contribs: [c(ago(80), 1500), c(ago(40), 600), c(ago(10), 400)] },
    { id: uid(), name: 'Portátil nuevo', icon: '💻', color: '#7c4dff', target: 1378, deadline: '', created: ago(60), plan: { type: 'weeks', step: 1 }, contribs: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(w => c(ago(70 - w * 5), w, 'Reto', w)) },
  ];
  return d;
}
function loadDemo() {
  if (db.tx.length && !confirm('Esto reemplaza tus datos actuales por datos de ejemplo. ¿Continuar?')) return false;
  db = demoDB(); save(); return true;
}

/* ---------- copia de seguridad ---------- */
async function exportData() {
  const name = `finanzas-${today()}.json`;
  const blob = new Blob([JSON.stringify(db, null, 1)], { type: 'application/json' });
  db.settings.lastBackup = Date.now(); save();
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Copia de Mis Finanzas' }); render(); return; }
  } catch (e) { if (e.name === 'AbortError') return; }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  toast('Copia guardada'); render();
}
function importData(file) {
  const rd = new FileReader();
  rd.onload = () => {
    try {
      const d = JSON.parse(rd.result);
      if (!Array.isArray(d.tx) || !Array.isArray(d.accounts) || !Array.isArray(d.categories)) throw new Error('formato');
      if (!confirm(`Se reemplazarán tus datos actuales por la copia (${d.tx.length} movimientos, ${(d.goals || []).length} metas). ¿Continuar?`)) return;
      const b = blankDB();
      db = Object.assign(b, d, { settings: Object.assign(b.settings, d.settings, { onboarded: true }) });
      save(); render(); toast('Copia restaurada ✓');
    } catch (e) { toast('Ese archivo no es una copia válida'); }
  };
  rd.readAsText(file);
}

/* ---------- acciones ---------- */
const mark = (el, sel) => { $$(sel, el.parentElement).forEach(x => x.classList.remove('on')); el.classList.add('on'); };
const PALS = [['violeta', 'Violeta', '#7c4dff', '#ff5fa2'], ['oceano', 'Océano', '#1e6bff', '#00c9b7'], ['menta', 'Menta', '#0e9f6e', '#9be15d'],
  ['atardecer', 'Atardecer', '#ff8a1f', '#ff3d8b'], ['frambuesa', 'Frambuesa', '#c2185b', '#ff7a9c']];
const curPal = () => document.documentElement.dataset.pal || 'violeta';
function setPal(p, rerender = true) {
  document.documentElement.dataset.pal = p;
  try { localStorage.setItem('finanzas.pal', p); } catch (e) { }
  if (rerender) render();
}
function setTheme(t, rerender = true) {
  document.documentElement.dataset.theme = t;
  try { localStorage.setItem('finanzas.theme', t); } catch (e) { }
  if (rerender) render();
}
function syncTypeSheet() {
  $('#tseg').innerHTML = txSeg();
  $('#catgrid').innerHTML = catGrid(draft.type);
  const cw = $('#f-cob-wrap'); if (cw) cw.hidden = draft.type !== 'income';
}
function budgetAlert(t) {
  if (t.type !== 'expense' || mk(t.date) !== mk(today())) return;
  const lim = db.budgets[t.cat]; if (!(lim > 0)) return;
  const r = spentBy(mk(today()), t.cat) / lim, c = catOf(t.cat);
  if (r >= 1) toast(`Te has pasado del presupuesto de ${c.name} ${isMin() ? '' : '😬'}`);
  else if (r >= .8) toast(`Vas por el ${Math.round(r * 100)}% de ${c.name}`);
}

const A = {
  tab(el) { ui.tab = el.dataset.v; ui.q = ''; render(); window.scrollTo(0, 0); },
  close() { closeSheet(); },
  'm-prev'() { ui.month = addMonths(ui.month, -1); render(); },
  'm-next'() { if (ui.month < mk(today())) { ui.month = addMonths(ui.month, 1); render(); } },
  filter(el) { ui.filter = el.dataset.v; render(); },
  theme(el) { setTheme(el.dataset.v); },
  pal(el) { setPal(el.dataset.v); },
  'theme-w'(el) { setTheme(el.dataset.v, false); mark(el, '.opt'); render(); },
  add() { txSheet(); },

  'tx-edit'(el) { txSheet(el.dataset.id); },
  'tx-type'(el) { draft.type = el.dataset.v; draft.cat = firstCat(draft.type); syncTypeSheet(); },
  'pick-cat'(el) { draft.cat = el.dataset.id; mark(el, '.cg'); },
  'pick-emoji'(el) { $('#g-icon').value = el.dataset.v; mark(el, '.em'); },
  'pick-color'(el) { draft.color = el.dataset.v; mark(el, '.sw'); },
  'tx-save'() {
    const amount = num($('#f-amt').value);
    if (amount <= 0) return toast('Escribe un importe');
    const rec = { type: draft.type, amount, cat: draft.cat, acc: $('#f-acc').value, date: $('#f-date').value || today(), note: $('#f-note').value.trim() };
    if (draft.type === 'income' && $('#f-cob') && !$('#f-cob').checked) rec.cobrado = false;
    let t, repeated = false;
    if (draft.id) { t = db.tx.find(x => x.id === draft.id); delete t.cobrado; Object.assign(t, rec); }
    else {
      t = { id: uid(), ts: Date.now(), ...rec }; db.tx.push(t);
      if ($('#f-rep') && $('#f-rep').checked) {
        const r = { id: uid(), type: rec.type, amount, cat: rec.cat, acc: rec.acc, note: rec.note, day: +rec.date.slice(8, 10), last: mk(rec.date) };
        db.rec.push(r); t.rec = r.id; repeated = true;
      }
    }
    save(); closeSheet(); render();
    if (draft.id) toast('Cambios guardados ✓'); else if (repeated) toast('Añadido y se repetirá cada mes 🔁'); else { toast('Movimiento añadido ✓'); setTimeout(() => budgetAlert(t), 1500); }
  },
  cobro(el) { const t = db.tx.find(x => x.id === el.dataset.id); if (!t) return; t.cobrado = t.cobrado === false; save(); render(); if (t.cobrado) toast('Cobro confirmado ✓'); },
  'cobro-rec'(el) {
    const r = db.rec.find(x => x.id === el.dataset.id); if (!r) return;
    db.tx.push({ id: uid(), ts: Date.now(), type: 'income', amount: r.amount, cat: r.cat, acc: r.acc, date: today(), note: r.note, rec: r.id, cobrado: true });
    r.last = mk(today()); save(); render(); toast('Cobro confirmado ✓');
  },
  'tx-del'() { if (!confirm('¿Eliminar este movimiento?')) return; db.tx = db.tx.filter(x => x.id !== draft.id); save(); closeSheet(); render(); toast('Eliminado'); },

  'goal-new'() { goalSheet(); },
  'goal-edit'(el) { goalSheet(el.dataset.id); },
  'goal-open'(el) { goalDetail(el.dataset.id); },
  'goal-save'() {
    const name = $('#g-name').value.trim(), target = num($('#g-target').value);
    if (!name) return toast('Ponle un nombre a tu meta');
    if (target <= 0) return toast('Indica el objetivo en euros');
    const icon = ($('#g-icon').value.trim() || '🎯'), deadline = $('#g-date').value || '';
    if (draft.id) {
      const g = db.goals.find(x => x.id === draft.id), raw = $('#g-init').value.trim();
      Object.assign(g, { name, target, icon, deadline, color: draft.color });
      if (raw !== '') {
        const diff = Math.round((num(raw) - savedIn(g)) * 100) / 100;
        if (diff !== 0) g.contribs.push({ id: uid(), date: today(), amount: diff, note: 'Ajuste de lo ahorrado' });
      }
      save(); render(); goalDetail(draft.id); toast('Meta actualizada ✓');
    } else {
      const g = { id: uid(), name, icon, color: draft.color, target, deadline, created: today(), plan: { type: deadline ? 'date' : 'none' }, contribs: [] };
      const init = num(($('#g-init') || {}).value);
      if (init > 0) g.contribs.push({ id: uid(), date: today(), amount: init, note: 'Saldo inicial' });
      db.goals.push(g); save(); ui.tab = 'goals'; render(); goalDetail(g.id); toast('¡Meta creada! 🎯');
    }
  },
  'goal-del'(el) { if (!confirm('¿Eliminar esta meta y su historial?')) return; db.goals = db.goals.filter(x => x.id !== el.dataset.id); save(); closeSheet(); render(); toast('Meta eliminada'); },
  'contrib-new'(el) { contribSheet(el.dataset.id, !!el.dataset.w); },
  'contrib-save'() {
    const a = num($('#c-amt').value);
    if (a <= 0) return toast('Escribe un importe');
    addContrib(draft.id, draft.w ? -a : a, { date: $('#c-date').value || today(), note: $('#c-note').value.trim() });
    goalDetail(draft.id);
  },
  'contrib-del'(el) {
    const g = db.goals.find(x => x.id === el.dataset.id);
    g.contribs = g.contribs.filter(c => c.id !== el.dataset.c); save(); render(); goalDetail(g.id, true);
  },
  'plan-set'(el) { const g = db.goals.find(x => x.id === el.dataset.id); g.plan = { ...(g.plan || {}), type: el.dataset.v, step: (g.plan || {}).step || 1 }; save(); goalDetail(g.id, true); },
  quota(el) { addContrib(el.dataset.id, num(el.dataset.v) || 0, { note: 'Cuota del plan' }); goalDetail(el.dataset.id, true); },
  'wk-step'(el) { const g = db.goals.find(x => x.id === el.dataset.id); g.plan.step = +el.dataset.v; save(); goalDetail(g.id, true); },
  wk(el) {
    const g = db.goals.find(x => x.id === el.dataset.id), n = +el.dataset.n, ex = g.contribs.find(c => c.wk === n);
    if (ex) { g.contribs = g.contribs.filter(c => c !== ex); save(); render(); }
    else addContrib(g.id, n * (g.plan.step || 1), { note: 'Reto 52 semanas', wk: n });
    goalDetail(g.id, true);
  },

  budgets() { budgetsSheet(); },
  'bud-save'() {
    db.budgets = {};
    $$('[data-bud]').forEach(i => { const v = num(i.value); if (v > 0) db.budgets[i.dataset.bud] = v; });
    save(); closeSheet(); render(); toast('Presupuestos guardados ✓');
  },
  accounts() { accountsSheet(); },
  'acc-edit'(el) { accSheet(el.dataset.id); },
  'acc-save'() {
    const name = $('#a-name').value.trim(); if (!name) return toast('Ponle un nombre');
    const rec = { name, icon: $('#a-icon').value.trim() || '🏦', balance0: num($('#a-bal').value) };
    if (draft.id) Object.assign(db.accounts.find(x => x.id === draft.id), rec); else db.accounts.push({ id: uid(), ...rec });
    save(); render(); accountsSheet();
  },
  'acc-del'() {
    if (db.accounts.length < 2) return toast('Debe quedar al menos una cuenta');
    if (db.tx.some(t => t.acc === draft.id)) return toast('Esta cuenta tiene movimientos; no se puede borrar');
    if (!confirm('¿Eliminar esta cuenta?')) return;
    db.accounts = db.accounts.filter(x => x.id !== draft.id); save(); render(); accountsSheet();
  },
  cats() { catsSheet(); },
  'cat-edit'(el) { catSheet(el.dataset.id, el.dataset.t); },
  'cat-save'() {
    const name = $('#k-name').value.trim(); if (!name) return toast('Ponle un nombre');
    const rec = { name, icon: $('#g-icon').value.trim() || '📦', color: draft.color };
    if (draft.id) Object.assign(db.categories.find(x => x.id === draft.id), rec); else db.categories.push({ id: uid(), type: draft.type, ...rec });
    save(); render(); catsSheet();
  },
  'cat-del'() {
    if (db.tx.some(t => t.cat === draft.id) || db.rec.some(r => r.cat === draft.id)) return toast('Hay movimientos con esta categoría; no se puede borrar');
    if (!confirm('¿Eliminar esta categoría?')) return;
    db.categories = db.categories.filter(x => x.id !== draft.id); delete db.budgets[draft.id]; save(); render(); catsSheet();
  },
  recs() { recsSheet(); },
  'rec-edit'(el) { recSheet(el.dataset.id); },
  'rec-save'() {
    const amount = num($('#f-amt').value); if (amount <= 0) return toast('Escribe un importe');
    const day = Math.min(31, Math.max(1, parseInt($('#r-day').value) || 1));
    const rec = { type: draft.type, amount, cat: draft.cat, acc: $('#f-acc').value, day, note: $('#f-note').value.trim() };
    if (draft.id) Object.assign(db.rec.find(x => x.id === draft.id), rec);
    else db.rec.push({ id: uid(), last: day <= new Date().getDate() ? mk(today()) : addMonths(mk(today()), -1), ...rec });
    applyRec(); save(); render(); recsSheet();
  },
  'rec-del'() { if (!confirm('¿Eliminar este fijo? Los movimientos ya creados se mantienen.')) return; db.rec = db.rec.filter(x => x.id !== draft.id); save(); render(); recsSheet(); },

  export() { exportData(); },
  import() { $('#importer').click(); },
  help() { helpSheet(); },
  demo() { if (loadDemo()) { closeSheet(); ui.tab = 'home'; render(); toast('Datos de ejemplo cargados'); } },
  'demo-w'() { db = demoDB(); save(); closeSheet(); ui.tab = 'home'; render(); },
  reset() { if (confirm('Se borrará todo (movimientos, metas, ajustes). Esto no se puede deshacer. ¿Seguro?')) { db = blankDB(); db.settings.onboarded = true; save(); render(); toast('Datos borrados'); } },
  welcome() { welcomeSheet(true); },
  'welcome-ok'() { db.settings.name = $('#w-name').value.trim(); db.settings.onboarded = true; save(); closeSheet(); render(); },
};

document.addEventListener('click', e => {
  const el = e.target.closest('[data-a]');
  if (!el || el.disabled) return;
  const f = A[el.dataset.a];
  if (f) { e.preventDefault(); f(el, e); }
});
document.addEventListener('input', e => {
  if (e.target.id === 'q') { ui.q = e.target.value; $('#txlist').innerHTML = txListHtml(); }
});
document.addEventListener('change', e => {
  if (e.target.id === 'set-name') { db.settings.name = e.target.value.trim(); save(); }
  if (e.target.id === 'importer' && e.target.files[0]) { importData(e.target.files[0]); e.target.value = ''; }
});

/* ---------- arranque ---------- */
applyRec();
try { const t = localStorage.getItem('finanzas.theme'); if (t) setTheme(t, false); } catch (e) { }
try { const p = localStorage.getItem('finanzas.pal'); if (p && PALS.some(x => x[0] === p)) setPal(p, false); } catch (e) { }
render();
if (!db.settings.onboarded) welcomeSheet();
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => { });
if ('serviceWorker' in navigator && location.protocol.startsWith('http') && location.hostname !== 'localhost') navigator.serviceWorker.register('sw.js').catch(() => { });
