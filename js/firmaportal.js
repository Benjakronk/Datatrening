/* Firmaportalen: skolens app-butikk (Intune Company Portal).
   Her installerer eleven godkjente programmer selv, i stedet for å laste ned fra nettet.
   Installasjonen tar tid, og ett av programmene feiler første gang, slik det gjør i virkeligheten. */
const Firmaportal = (() => {
  const KEY = 'dt-apps';
  const CATALOG = [
    { id: 'vscode', name: 'Visual Studio Code', note: 'Heter «Kode» her på øvings-PC-en', pub: 'Microsoft', size: '92 MB', cat: 'Programmering', icon: 'kode', desc: 'Program for å skrive kode. Brukes i programmeringsfaget.' },
    { id: 'python', name: 'Python 3.12', pub: 'Python Software Foundation', size: '27 MB', cat: 'Programmering', icon: 'terminal', desc: 'Programmeringsspråket Python, så du kan kjøre .py-filer.', preinstalled: true },
    { id: 'teams', name: 'Microsoft Teams', pub: 'Microsoft', size: '145 MB', cat: 'Skole', icon: 'innlevering', desc: 'Klasserom, meldinger og innleveringer.', preinstalled: true },
    { id: 'onenote', name: 'Microsoft OneNote', pub: 'Microsoft', size: '110 MB', cat: 'Skole', icon: 'notater', desc: 'Digital notatblokk med inndelinger og sider.', preinstalled: true },
    { id: 'office', name: 'Microsoft 365 (Word, Excel, PowerPoint)', pub: 'Microsoft', size: '3,2 GB', cat: 'Skole', icon: 'skriv', desc: 'Skriveprogram, regneark og presentasjoner.', preinstalled: true },
    { id: 'geogebra', name: 'GeoGebra Klassisk', pub: 'GeoGebra GmbH', size: '68 MB', cat: 'Skole', icon: 'viewer', desc: 'Geometri, algebra og grafer. Brukes i matte.', failFirst: true },
    { id: 'notepadpp', name: 'Notepad++', pub: 'Don Ho', size: '4 MB', cat: 'Programmering', icon: 'skriv', desc: 'Enkel teksteditor med fargekoding.' },
    { id: 'acrobat', name: 'Adobe Acrobat Reader', pub: 'Adobe', size: '210 MB', cat: 'Skole', icon: 'viewer', desc: 'Leser PDF-filer.' }
  ];
  let state = null, win = null;

  function load() {
    if (state) return state;
    try { const s = localStorage.getItem(KEY); if (s) { state = JSON.parse(s); } } catch (e) { /* ignorer */ }
    if (!state || typeof state !== 'object') {
      state = { st: {}, tries: {} };
      CATALOG.forEach(a => { state.st[a.id] = a.preinstalled ? 'installed' : 'available'; });
      /* Elever som allerede er i gang med editor-kursene skal ikke miste programmet */
      try {
        const p = JSON.parse(localStorage.getItem('dt-progress-prog') || '{}');
        if (p.done && ['p4o1', 'p4o2', 'p5o1', 'p5o2', 'p6o1', 'p7o1'].some(k => p.done[k])) state.st.vscode = 'installed';
      } catch (e) { /* ignorer */ }
      save();
    }
    return state;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignorer */ } }
  function isInstalled(id) { load(); return state.st[id] === 'installed'; }
  function statusOf(id) { load(); return state.st[id] || 'available'; }
  function app(id) { return CATALOG.find(a => a.id === id); }
  function installedCount() { load(); return CATALOG.filter(a => state.st[a.id] === 'installed').length; }

  /* Installasjon i flere trinn, slik at eleven må vente og se på statusen */
  const timers = {};
  function install(id, onUpdate) {
    load();
    const a = app(id); if (!a) return;
    if (state.st[id] === 'installed' || state.st[id] === 'installing') return;
    state.tries[id] = (state.tries[id] || 0) + 1;
    state.st[id] = 'installing';
    save();
    Bus.emit('install-start', { id, name: a.name, tries: state.tries[id] });
    const willFail = a.failFirst && state.tries[id] === 1;
    const steps = [
      { t: 700, p: 0, txt: 'I kø …' },
      { t: 900, p: 25, txt: 'Laster ned …' },
      { t: 900, p: 60, txt: 'Laster ned …' },
      { t: 900, p: 85, txt: 'Installerer …' },
      { t: 800, p: 100, txt: willFail ? 'Mislyktes' : 'Installert' }
    ];
    let i = 0;
    const next = () => {
      if (state.st[id] !== 'installing') return;
      const s = steps[i];
      state.prog = state.prog || {};
      state.prog[id] = { p: s.p, txt: s.txt };
      if (onUpdate) onUpdate();
      i++;
      if (i < steps.length) { timers[id] = setTimeout(next, steps[i].t); return; }
      delete state.prog[id];
      if (willFail) {
        state.st[id] = 'failed';
        save();
        Bus.emit('install-failed', { id, name: a.name, code: '0x87D1041C' });
        Toast.show('Installasjonen av ' + a.name + ' mislyktes. Prøv igjen.', 5000);
      } else {
        state.st[id] = 'installed';
        save();
        Bus.emit('install-done', { id, name: a.name, tries: state.tries[id] });
        Toast.show(a.name + ' er installert. Du finner programmet i Start-menyen.', 6000);
        WM.renderTaskbar();
      }
      if (onUpdate) onUpdate();
    };
    timers[id] = setTimeout(next, steps[0].t);
  }

  function open(highlight) {
    if (win) { WM.focus(win, 'open'); if (highlight) { win.el.querySelector('.fp-search').value = highlight; win.render(); } return win; }
    if (WM.full()) return null;
    load();
    let filter = 'Alle', q = '';
    const root = el(`<div class="fp">
      <div class="fp-top"><span class="fp-logo">🏢</span><div><b>Firmaportalen</b><div class="fp-sub">Skolens godkjente programmer · pålogget som elev@skolen.no</div></div><span class="spacer"></span><input class="fp-search txt" placeholder="Søk etter et program"></div>
      <div class="fp-body"><div class="fp-cats"></div><div class="fp-list"></div></div>
      <div class="fp-foot">Programmer herfra er godkjent av skolen. Last aldri ned programmer fra nettet på skole-PC-en.</div>
    </div>`);
    win = WM.create({ app: 'firmaportal', title: 'Firmaportalen', body: root, width: 900, height: 600 });
    win.onClosed = () => { win = null; };
    const srch = root.querySelector('.fp-search');
    srch.addEventListener('keydown', e => e.stopPropagation());
    let t = null;
    srch.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { q = srch.value.trim(); if (q) Bus.emit('fp-search', { query: q }); render(); }, 250); });

    function render() {
      const cats = root.querySelector('.fp-cats'); cats.innerHTML = '';
      ['Alle', 'Skole', 'Programmering', 'Installert'].forEach(c => {
        const n = c === 'Alle' ? CATALOG.length : c === 'Installert' ? installedCount() : CATALOG.filter(a => a.cat === c).length;
        const d = el(`<div class="fp-cat${filter === c ? ' active' : ''}">${esc(c)}<span class="cnt">${n}</span></div>`);
        d.addEventListener('click', () => { filter = c; Bus.emit('fp-filter', { filter: c }); render(); });
        cats.appendChild(d);
      });
      const list = root.querySelector('.fp-list'); list.innerHTML = '';
      let items = CATALOG.filter(a => filter === 'Alle' || (filter === 'Installert' ? state.st[a.id] === 'installed' : a.cat === filter));
      /* Søket leter i navnet og hos produsenten, slik en ekte portal gjør. Da må eleven
         lære at programmet heter det produsenten kaller det, ikke det vi kaller det til daglig. */
      if (q) items = items.filter(a => (a.name + ' ' + a.pub).toLowerCase().includes(q.toLowerCase()));
      if (!items.length) { list.appendChild(el(`<div class="fp-empty">Fant ingen programmer${q ? ' som passer med «' + esc(q) + '»' : ''}.<br><span class="muted">Husk at et program heter det produsenten kaller det, ikke det vi kaller det til daglig. Prøv et kortere søkeord, eller bla i kategoriene til venstre.</span></div>`)); return; }
      items.forEach(a => {
        const st = state.st[a.id];
        const pr = (state.prog || {})[a.id];
        const card = el(`<div class="fp-app" data-id="${a.id}">
          <span class="ico">${Icons.app(a.icon, 40)}</span>
          <div class="ct"><b>${esc(a.name)}</b>${a.note ? `<span class="note">${esc(a.note)}</span>` : ''}<span class="meta">${esc(a.pub)} · ${esc(a.size)}</span><span class="desc">${esc(a.desc)}</span></div>
          <div class="act"></div>
        </div>`);
        const act = card.querySelector('.act');
        if (st === 'installed') act.appendChild(el('<span class="fp-state ok">✓ Installert</span>'));
        else if (st === 'installing') {
          act.appendChild(el(`<div class="fp-progress"><div class="pb"><div style="width:${pr ? pr.p : 0}%"></div></div><span class="muted">${esc(pr ? pr.txt : 'Starter …')}</span></div>`));
        } else if (st === 'failed') {
          act.appendChild(el('<span class="fp-state bad">✕ Mislyktes<br><span class="muted">Feilkode 0x87D1041C</span></span>'));
          const b = el('<button class="btn small primary">Prøv igjen</button>');
          b.addEventListener('click', () => { state.st[a.id] = 'available'; install(a.id, render); render(); });
          act.appendChild(b);
        } else {
          const b = el('<button class="btn small primary">Installer</button>');
          b.addEventListener('click', () => { install(a.id, render); render(); });
          act.appendChild(b);
        }
        list.appendChild(card);
      });
    }
    win.render = render;
    if (highlight) { srch.value = highlight; q = highlight; }
    render();
    Bus.emit('fp-open', {});
    return win;
  }
  function reset() {
    Object.values(timers).forEach(clearTimeout);
    state = null;
    try { localStorage.removeItem(KEY); } catch (e) { /* ignorer */ }
    load();
    if (win) win.render();
    WM.renderTaskbar();
  }
  return { open, isInstalled, statusOf, install, reset, CATALOG, installedCount };
})();
window.Firmaportal = Firmaportal;
