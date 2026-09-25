/* Skrivebordet og oppstart */
const Desktop = (() => {
  let sel = new Set();
  const root = () => document.getElementById('desktop-icons');

  function render() {
    const R = FS.roots(); const c = root(); c.innerHTML = '';
    const specials = [
      { id: R.pc, name: 'Denne PC-en', icon: Icons.app('pc', 48) },
      { id: R.bin, name: 'Papirkurv', icon: Icons.app('papirkurv', 48) }
    ];
    specials.forEach(s => {
      const d = el(`<div class="dicon" data-id="${s.id}"><div class="ico">${s.icon}</div><div class="name"><span class="nm">${esc(s.name)}</span></div></div>`);
      d.addEventListener('click', e => { e.stopPropagation(); select([s.id]); });
      d.addEventListener('dblclick', e => { e.stopPropagation(); Bus.emit('desktop-open', { name: s.name }); Explorer.open(s.id); });
      d.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation(); select([s.id]);
        const items = [{ label: 'Åpne', icon: Icons.tools.open, action: () => Explorer.open(s.id) }];
        if (s.id === R.bin) items.push('-', { label: 'Tøm papirkurv', icon: Icons.tools.del, disabled: !FS.children(R.bin).length, action: () => Explorer.emptyBin() });
        items.push('-', { label: 'Egenskaper', icon: Icons.tools.props, action: () => Dialog.properties(FS.get(s.id)) });
        Ctx.show(e.clientX, e.clientY, items, s.id === R.bin ? 'bin-icon' : 'pc-icon', s.name + '-ikonet på skrivebordet');
      });
      if (s.id === R.bin) DnD.target(d, 'bin', render);
      c.appendChild(d);
    });
    Explorer.sortItems(FS.children(R.desktop), 'name', 1).forEach(n => {
      const isCut = Explorer.Clip.cut && Explorer.Clip.ids.includes(n.id);
      const d = el(`<div class="dicon${sel.has(n.id) ? ' selected' : ''}${isCut ? ' cut' : ''}" data-id="${n.id}"><div class="ico">${Icons.node(n, 48)}</div><div class="name"><span class="nm">${esc(FS.displayName(n, Explorer.settings.showExt))}</span></div></div>`);
      d.addEventListener('click', e => { e.stopPropagation(); if (e.ctrlKey) { const s = new Set(sel); s.has(n.id) ? s.delete(n.id) : s.add(n.id); select([...s]); } else select([n.id]); });
      d.addEventListener('dblclick', e => { e.stopPropagation(); if (e.target.tagName === 'INPUT') return; if (n.type === 'folder') Explorer.open(n.id); else Apps.openFile(n.id, { via: 'desktop' }); });
      d.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation();
        if (!sel.has(n.id)) select([n.id]);
        Ctx.show(e.clientX, e.clientY, Explorer.itemMenu(n, { ids: [...sel], inBin: false, renameFn: startRename }), Explorer.itemWhere(n), Explorer.itemLabel(n) + ' på skrivebordet');
      });
      DnD.source(d, () => { if (!sel.has(n.id)) select([n.id]); return [...sel]; });
      if (n.type === 'folder') DnD.target(d, n.id, render);
      c.appendChild(d);
    });
  }
  function select(ids) {
    sel = new Set(ids.filter(id => FS.get(id)));
    root().querySelectorAll('.dicon').forEach(x => x.classList.toggle('selected', sel.has(+x.dataset.id)));
    if (ids.length) Bus.emit('select', { ids: [...sel], names: [...sel].map(id => FS.get(id).name), where: 'desktop' });
  }
  function startRename(id) {
    const n = FS.get(id); if (!n || n.system) return;
    select([id]);
    let d = root().querySelector(`[data-id="${id}"] .name`);
    if (!d) { render(); select([id]); d = root().querySelector(`[data-id="${id}"] .name`); }
    if (d) Explorer.inlineRename(d, n, render);
  }
  function onKey(e) {
    if (e.repeat) { if (e.ctrlKey || ['Delete', 'Enter', 'F2'].includes(e.key)) e.preventDefault(); return; }
    const k = e.key.toLowerCase();
    const ids = [...sel].filter(id => FS.get(id) && !FS.get(id).system);
    if (e.ctrlKey && ['c', 'x', 'v', 'a', 'z'].includes(k)) {
      e.preventDefault();
      Bus.emit('shortcut', { key: k, ctrl: true, app: 'desktop' });
      if (k === 'c') Explorer.doCopy(ids, 'keyboard');
      else if (k === 'x') Explorer.doCut(ids, 'keyboard');
      else if (k === 'v') select(Explorer.doPaste(FS.roots().desktop, 'keyboard'));
      else if (k === 'a') select(FS.children(FS.roots().desktop).map(x => x.id));
      else if (k === 'z') { if (FS.undo()) Toast.show('Angret.'); }
      return;
    }
    if (e.key === 'Delete') { e.preventDefault(); Bus.emit('shortcut', { key: 'delete', app: 'desktop' }); Explorer.doDelete(ids, 'keyboard'); }
    else if (e.key === 'F2') { e.preventDefault(); if (ids.length === 1) startRename(ids[0]); }
    else if (e.key === 'Enter') { if (ids.length === 1) { const n = FS.get(ids[0]); if (n.type === 'folder') Explorer.open(n.id); else Apps.openFile(n.id, { via: 'desktop' }); } }
    else if (e.key === 'Escape') select([]);
  }
  function init() {
    const desk = document.getElementById('desktop');
    const overUi = e => e.target.closest('.win, #taskbar, #startmenu, #modal-layer, .dicon, #ctxmenu, #toasts');
    desk.addEventListener('contextmenu', e => {
      if (overUi(e)) return;
      e.preventDefault();
      Ctx.show(e.clientX, e.clientY, Explorer.bgMenu(FS.roots().desktop, {
        inBin: false, via: 'desktop', refresh: render, renameFn: startRename, afterPaste: select,
        extra: [
          { label: 'Skjerminnstillinger', icon: Icons.app('innstillinger', 16), action: () => Apps.launch('innstillinger') },
          { label: 'Tilpass', sub: [{ label: 'Standard bakgrunn', action: () => setBackground(null) }, { label: 'Velg et bilde …', action: () => Toast.show('Høyreklikk på et bilde i Filutforsker og velg «Angi som skrivebordsbakgrunn».') }] }
        ]
      }), 'desktop', 'skrivebordet (bakgrunnen)');
    });
    desk.addEventListener('pointerdown', e => {
      if (e.target.closest('#startmenu, #ctxmenu')) return;
      if (!e.target.closest('#taskbar')) WM.hideStart();
      if (overUi(e)) return;
      select([]);
      WM.deactivate();
    });
    DnD.target(desk, () => FS.roots().desktop, render, e => !e.target.closest('.win, #taskbar, #startmenu, #modal-layer, .dicon'));
    const bg = localStorage.getItem('dt-bg');
    if (bg) setBackground(bg, true);
    render();
  }
  /* Skrivebordsbakgrunn: fargen utledes av bildets navn, slik at «Angi som bakgrunn» gir synlig effekt */
  function setBackground(name, quiet) {
    const desk = document.getElementById('desktop');
    if (!name) { desk.style.background = ''; localStorage.removeItem('dt-bg'); if (!quiet) Toast.show('Bakgrunnen er tilbakestilt.'); return; }
    const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    desk.style.background = `radial-gradient(ellipse at 20% 20%, hsl(${hue},70%,75%) 0%, hsl(${hue},55%,45%) 40%, hsl(${hue},50%,22%) 100%)`;
    localStorage.setItem('dt-bg', name);
    if (!quiet) { Bus.emit('set-background', { name }); Toast.show('«' + name + '» er nå skrivebordsbakgrunn.'); }
  }
  return { init, render, select, startRename, onKey, setBackground };
})();

/* ---------- Fullskjerm ---------- */
const Fullscreen = {
  on: () => !!document.fullscreenElement,
  enter() {
    const p = document.documentElement.requestFullscreen ? document.documentElement.requestFullscreen({ navigationUI: 'hide' }) : Promise.reject(new Error('unsupported'));
    return Promise.resolve(p).then(() => Bus.emit('fullscreen', { on: true }))
      .catch(() => Toast.show('Nettleseren tillot ikke fullskjerm her. Trykk F11 for å slå på fullskjerm.', 5000));
  },
  exit() { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); },
  toggle() { this.on() ? this.exit() : this.enter(); },
  /* Nettlesere krever et klikk fra brukeren før fullskjerm kan slås på. Startbildet dekker hele siden
     og ett klikk hvor som helst starter fullskjerm. Deretter kjøres done(), som viser introduksjonen. */
  overlay(done) {
    if (document.fullscreenElement) { if (done) done(); return; }
    const o = el(`<div id="fs-overlay"><div class="fso-box"><div class="fso-logo">💻</div><h1>Datatrening</h1><p class="fso-sub">Øvings-PC for skolen. Dette er en simulering i nettleseren, ikke en ekte PC.</p><p>Klikk hvor som helst for å starte i fullskjerm.</p><p class="fso-tip">Tips: <kbd>F11</kbd> slår fullskjerm av og på. <kbd>Esc</kbd> avslutter fullskjerm.</p></div></div>`);
    o.addEventListener('click', () => {
      o.remove();
      /* Noen nettlesere bruker tid på å svare på fullskjerm-forespørselen, og enkelte svarer aldri.
         Introduksjonen skal komme uansett, så vi venter maks et halvt sekund på svaret. */
      let fired = false;
      const go = () => { if (fired) return; fired = true; if (done) done(); };
      setTimeout(go, 500);
      Promise.resolve(Fullscreen.enter()).catch(() => {}).then(go);
    });
    document.body.appendChild(o);
  }
};
/* Toppnivå-const er ikke egenskaper på window; eksporter det andre filer sjekker med window.X */
window.Desktop = Desktop;
window.Fullscreen = Fullscreen;
document.addEventListener('fullscreenchange', () => {
  const b = document.querySelector('.fs-btn');
  if (b) b.title = document.fullscreenElement ? 'Avslutt fullskjerm (Esc eller F11)' : 'Fullskjerm (F11)';
  Bus.emit('fullscreen', { on: !!document.fullscreenElement });
});

/* ---------- Nødhjelp: nullstilling og nødstripe ---------- */
const Recovery = {
  keys: ['dt-fs', 'dt-innlev', 'dt-pinned', 'dt-bg', 'dt-view', 'dt-showext'],
  /* Sletter filene på øvings-PC-en (og valgfritt fremdriften) og laster siden på nytt */
  hardReset(all) {
    try { this.keys.forEach(k => localStorage.removeItem(k)); if (all) localStorage.removeItem('dt-progress'); } catch (e) { /* ignorer */ }
    location.href = location.pathname;
  },
  bar(msg) {
    if (document.getElementById('recovery')) return;
    const b = el(`<div id="recovery"><span>${esc(msg)}</span><button class="btn small">Nullstill øvings-PC-en</button></div>`);
    b.querySelector('button').addEventListener('click', () => Recovery.hardReset(false));
    document.body.appendChild(b);
  }
};

/* ---------- Oppstart ---------- */
(function main() {
  /* index.html?nullstill sletter filene, index.html?nullstill=alt sletter også fremdriften */
  try {
    const q = new URLSearchParams(location.search);
    if (q.has('nullstill') || q.has('reset')) {
      Recovery.keys.forEach(k => localStorage.removeItem(k));
      if (q.get('nullstill') === 'alt' || q.get('reset') === 'all') localStorage.removeItem('dt-progress');
      history.replaceState(null, '', location.pathname);
    }
  } catch (e) { /* ignorer */ }

  let errors = 0;
  window.addEventListener('error', () => { if (++errors === 8) Recovery.bar('Siden har fått flere feil. Hvis den henger, nullstill øvings-PC-en.'); });

  try {
    FS.init();
    WM.renderTaskbar();
    Desktop.init();
  } catch (e) {
    console.error(e);
    Recovery.bar('Noe gikk galt under oppstart. Nullstill øvings-PC-en for å komme i gang igjen.');
    return;
  }

  function clock() {
    const d = new Date();
    const p = n => String(n).padStart(2, '0');
    document.getElementById('clock').innerHTML = `${p(d.getHours())}:${p(d.getMinutes())}<br>${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
  }
  clock(); setInterval(clock, 15000);

  Bus.on((type, d) => {
    if (type === 'fs') Coalesce.schedule(Desktop, () => Desktop.render());
  });

  document.addEventListener('keydown', e => {
    if (Dialog.isOpen() || Ctx.el) return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (e.key === 'Escape' && !document.getElementById('startmenu').classList.contains('hidden')) { WM.hideStart(); return; }
    const w = WM.getActive();
    if (w && !w.minimized) { if (w.onKey) w.onKey(e); return; }
    if (!t || !t.closest || !t.closest('#coach')) Desktop.onKey(e);
  });
  /* Hindre at nettleseren selv reagerer på Ctrl+S / Ctrl+P når fokus er på skrivebordet */
  document.addEventListener('keydown', e => { if (e.ctrlKey && ['s', 'p'].includes(e.key.toLowerCase()) && !(e.target.closest && e.target.closest('#coach'))) e.preventDefault(); });

  try { Coach.init(); } catch (e) { console.error(e); Recovery.bar('Veilederen kunne ikke starte. Nullstill øvings-PC-en for å komme i gang igjen.'); }
  /* Introduksjonen kommer etter at fullskjerm er satt i gang, så den ikke havner bak startbildet */
  const start = () => { try { if (window.Intro) Intro.auto(); } catch (e) { console.error(e); } };
  if (!window.__noFullscreenOverlay) Fullscreen.overlay(start); else start();
})();
