/* Programmer på øvings-PC-en: Skriv, Nettleser, Innleveringer, filvisning og Innstillinger */

const Apps = (() => {
  function launch(app, args = {}) {
    WM.setLaunchVia(args.via || null);
    switch (app) {
      case 'explorer': return Explorer.open(args.folderId || FS.roots().pc, args);
      case 'papirkurv': return Explorer.open(FS.roots().bin);
      case 'skriv': return Skriv.open(args.nodeId);
      case 'nettleser': return Nettleser.open();
      case 'innlevering': return Innlevering.open();
      case 'innstillinger': return Innstillinger.open();
      case 'taskmgr': return TaskMgr.open();
      case 'bilder': return args.nodeId ? Viewer.open(args.nodeId) : Explorer.open(FS.roots().pictures);
      default: WM.setLaunchVia(null);
    }
  }
  function openFile(id, opts = {}) {
    const n = FS.get(id); if (!n) return;
    if (n.type === 'folder') return Explorer.open(id);
    const e = FS.ext(n.name);
    Bus.emit('open-file', { id, name: n.name, ext: e, via: opts.via });
    if (['txt', 'docx', 'doc', 'md'].includes(e)) return Skriv.open(id);
    return Viewer.open(id);
  }
  return { launch, openFile };
})();

/* ---------- Skriv (enkel tekstbehandler) ---------- */
const Skriv = (() => {
  let count = 0;
  const inst = [];
  function open(nodeId) {
    if (WM.full()) return null;
    count++;
    const st = { nodeId: nodeId && FS.get(nodeId) ? nodeId : null, dirty: false, docName: 'Dokument' + count };
    const root = el(`<div class="skriv">
      <div class="menubar"><button data-a="new">Ny</button><button data-a="open">Åpne</button><button data-a="save">Lagre</button><button data-a="saveas">Lagre som</button><span class="spacer"></span><span class="hint"><kbd>Ctrl</kbd>+<kbd>S</kbd> lagrer</span></div>
      <textarea spellcheck="false" placeholder="Skriv her …" maxlength="${FS.LIMITS.content}"></textarea>
      <div class="sk-status"><span class="words">0 ord</span><span class="where"></span></div>
    </div>`);
    const ta = root.querySelector('textarea');
    if (st.nodeId) ta.value = FS.get(st.nodeId).content || '';

    const title = () => st.nodeId && FS.get(st.nodeId) ? FS.displayName(FS.get(st.nodeId), Explorer.settings.showExt) : st.docName;
    const win = WM.create({
      app: 'skriv', title: '', body: root, width: 780, height: 520,
      onClose: async () => {
        if (!st.dirty) return true;
        const r = await Dialog.saveChanges(title());
        Bus.emit('save-dialog', { choice: r, name: title() });
        if (r === 'cancel') return false;
        if (r === 'save') return !!(await save('dialog'));
        return true;
      }
    });
    win.onClosed = () => { const i = inst.findIndex(x => x.win === win); if (i >= 0) inst.splice(i, 1); };
    win.onKey = e => { if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); Bus.emit('shortcut', { key: 's', ctrl: true, app: 'skriv' }); save('shortcut'); } };

    function updTitle() {
      WM.setTitle(win, (st.dirty ? '*' : '') + title() + ' - Skriv');
      const w = ta.value.trim() ? ta.value.trim().split(/\s+/).length : 0;
      root.querySelector('.words').textContent = w + (w === 1 ? ' ord' : ' ord');
      root.querySelector('.where').textContent = st.nodeId && FS.get(st.nodeId) ? 'Lagret i: ' + FS.pathString(FS.get(st.nodeId).parent) : 'Ikke lagret ennå';
    }
    ta.addEventListener('input', () => { st.dirty = true; updTitle(); Bus.emit('editor-input', { text: ta.value }); });
    ta.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (e.ctrlKey && !e.altKey) {
        Bus.emit('shortcut', { key: k, ctrl: true, app: 'skriv', shift: e.shiftKey });
        if (k === 's') { e.preventDefault(); save('shortcut'); }
      }
      if (e.key === 'Escape') e.stopPropagation();
    });
    ta.addEventListener('paste', () => Bus.emit('editor-paste', {}));
    /* Egen høyreklikkmeny for teksten, slik Word og Notisblokk har */
    ta.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      const hasSel = ta.selectionStart !== ta.selectionEnd;
      const insert = t => { ta.setRangeText(t, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input')); };
      const act = cmd => {
        ta.focus();
        Bus.emit('editor-menu', { action: cmd });
        if (cmd === 'paste') {
          if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(insert).catch(() => Toast.show('Nettleseren tillater ikke liming fra menyen her. Bruk Ctrl+V.'));
          else Toast.show('Bruk Ctrl+V for å lime inn.');
        }
        else if (cmd === 'selectall') ta.select();
        else if (cmd === 'delete') insert('');
        else document.execCommand(cmd);
      };
      Ctx.show(e.clientX, e.clientY, [
        { label: 'Angre', kbd: 'Ctrl+Z', action: () => act('undo') },
        '-',
        { label: 'Klipp ut', icon: Icons.tools.cut, kbd: 'Ctrl+X', disabled: !hasSel, action: () => act('cut') },
        { label: 'Kopier', icon: Icons.tools.copy, kbd: 'Ctrl+C', disabled: !hasSel, action: () => act('copy') },
        { label: 'Lim inn', icon: Icons.tools.paste, kbd: 'Ctrl+V', action: () => act('paste') },
        { label: 'Slett', kbd: 'Delete', disabled: !hasSel, action: () => act('delete') },
        '-',
        { label: 'Merk alt', kbd: 'Ctrl+A', action: () => act('selectall') }
      ], 'editor', 'teksten i Skriv');
    });

    async function save(via) {
      if (!st.nodeId || !FS.get(st.nodeId)) { st.nodeId = null; return saveAs(via); }
      const n = FS.get(st.nodeId);
      const w = FS.write(n.id, ta.value);
      if (w && w.error) { await Dialog.alert('Kunne ikke lagre', w.error); return false; }
      st.dirty = false; updTitle();
      Bus.emit('save', { id: n.id, name: n.name, folderId: n.parent, via, isNew: false });
      Toast.show('Lagret: ' + n.name);
      return true;
    }
    async function saveAs(via) {
      const cur = st.nodeId ? FS.get(st.nodeId) : null;
      const r = await Dialog.fileChooser({
        mode: 'save', title: 'Lagre som',
        name: cur ? FS.base(cur.name) : st.docName,
        types: [{ label: 'Word-dokument (*.docx)', ext: 'docx' }, { label: 'Tekstdokument (*.txt)', ext: 'txt' }],
        start: cur ? cur.parent : FS.roots().documents
      });
      if (!r) return false;
      let n = FS.children(r.folderId).find(c => c.name.toLowerCase() === r.name.toLowerCase());
      if (n) { const w = FS.write(n.id, ta.value); if (w && w.error) { await Dialog.alert('Kunne ikke lagre', w.error); return false; } }
      else {
        n = FS.createFile(r.folderId, r.name, ta.value, { via: 'skriv' });
        if (n.error) { await Dialog.alert('Kunne ikke lagre', n.error); return false; }
      }
      st.nodeId = n.id; st.dirty = false; updTitle();
      Bus.emit('save', { id: n.id, name: n.name, folderId: r.folderId, via, isNew: true });
      Toast.show('Lagret «' + n.name + '» i ' + FS.get(r.folderId).name);
      return true;
    }
    async function openDoc() {
      const r = await Dialog.fileChooser({ mode: 'open', title: 'Åpne', types: [{ label: 'Dokumenter (*.docx, *.txt)', ext: 'docx,txt' }, { label: 'Alle filer (*.*)', ext: '' }], start: FS.roots().documents });
      if (!r) return;
      Apps.openFile(r.nodeId, { via: 'skriv' });
    }
    root.querySelector('.menubar').addEventListener('click', e => {
      const a = e.target.dataset.a; if (!a) return;
      Bus.emit('skriv-menu', { action: a });
      if (a === 'new') open();
      else if (a === 'open') openDoc();
      else if (a === 'save') save('menu');
      else if (a === 'saveas') saveAs('menu');
    });
    updTitle();
    setTimeout(() => ta.focus(), 50);
    inst.push({ win, st, ta });
    return win;
  }
  function activeText() {
    const a = WM.getActive();
    let i = inst.find(x => x.win === a);
    if (!i) i = inst[inst.length - 1];
    return i ? i.ta.value : '';
  }
  return { open, activeText, count: () => inst.length };
})();

/* ---------- Nettleser (simulert skoleportal) ---------- */
const Nettleser = (() => {
  const downloads = [];
  const LINKS = [
    { fag: 'Matte', title: 'Oppgaveark om brøk', desc: 'Ukens oppgaver, 3 sider', file: 'Oppgaveark-brøk.pdf', content: 'Oppgaveark: Brøk\n\n1) Forkort 6/8\n2) Regn ut 1/2 + 1/4\n3) Hva er 3/5 av 40?' },
    { fag: 'Naturfag', title: 'Mal for rapport', desc: 'Bruk denne når du skriver labrapport', file: 'Mal-rapport.docx', content: 'RAPPORT\n\nTittel:\nHensikt:\nUtstyr:\nFremgangsmåte:\nResultat:\nKonklusjon:' },
    { fag: 'Norsk', title: 'Bilde til fortellingen', desc: 'Skogen om høsten', file: 'Skogen.jpg', content: '' },
    { fag: 'Samfunnsfag', title: 'Presentasjon om demokrati', desc: 'Lysbildene fra timen', file: 'Demokrati.pptx', content: 'Demokrati\nFolkestyre – alle over 18 år kan stemme.' }
  ];
  function open() {
    if (WM.full()) return null;
    const root = el(`<div class="browser">
      <div class="br-tabs"><span class="br-tab">🏫 Skoleportalen</span></div>
      <div class="br-addr"><button class="nav-btn">←</button><button class="nav-btn">→</button><button class="nav-btn">⟳</button><div class="url">ovings-pc.simulering/skoleportalen/8a/oppgaver</div><button class="nav-btn dlb" title="Nedlastinger">⭳</button></div>
      <div class="br-page">
        <div class="site-head">Skoleportalen <small>8A · Ukeplan og oppgaver · Dette er en øvingsside i Datatrening, ikke en ekte nettside</small></div>
        <div class="site-body"><h2>Filer fra lærerne</h2><div class="cards"></div><p class="muted">Klikk «Last ned» for å hente en fil. Filen havner i mappen <b>Nedlastinger</b> på PC-en.</p></div>
        <div class="dl-flyout hidden"></div>
      </div>
    </div>`);
    const cards = root.querySelector('.cards');
    LINKS.forEach(l => {
      const c = el(`<div class="card"><span class="ico">${Icons.file(FS.ext(l.file), 36)}</span><div class="ct"><b>${esc(l.title)}</b><span>${esc(l.desc)} · ${esc(l.file)}</span></div><span class="fag">${esc(l.fag)}</span><button class="btn small primary">Last ned</button></div>`);
      c.querySelector('button').addEventListener('click', () => download(l));
      c.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation();
        Ctx.show(e.clientX, e.clientY, [
          { label: 'Åpne lenke i ny fane', action: () => Toast.show('På en ekte PC åpnes lenken i en ny fane.') },
          '-',
          { label: 'Lagre lenke som …', action: () => saveLinkAs(l) },
          { label: 'Kopier lenke', action: () => { if (navigator.clipboard) navigator.clipboard.writeText('ovings-pc.simulering/skoleportalen/filer/' + l.file).catch(() => {}); Toast.show('Lenken er kopiert.'); } }
        ], 'link', 'nedlastingslenken «' + l.title + '»');
      });
      cards.appendChild(c);
    });
    const win = WM.create({ app: 'nettleser', title: 'Skoleportalen – Nettleser', body: root, width: 900, height: 600 });
    const fly = root.querySelector('.dl-flyout');
    root.querySelector('.br-page').addEventListener('contextmenu', e => {
      if (e.target.closest('.card, .dl-flyout')) return;
      e.preventDefault();
      Ctx.show(e.clientX, e.clientY, [
        { label: 'Tilbake', kbd: 'Alt+←', disabled: true },
        { label: 'Frem', kbd: 'Alt+→', disabled: true },
        { label: 'Oppdater', kbd: 'F5', action: () => Toast.show('Siden ble lastet på nytt.') },
        '-',
        { label: 'Lagre som …', kbd: 'Ctrl+S', action: () => Toast.show('Dette lagrer hele nettsiden som en fil. Det trenger du sjelden.') },
        { label: 'Skriv ut …', kbd: 'Ctrl+P', action: () => Toast.show('Utskrift av nettsiden (simulert).') },
        '-',
        { label: 'Vis sidekilde', action: () => Toast.show('Sidekilden er koden bak nettsiden (HTML).') }
      ], 'browser', 'nettsiden');
    });
    async function saveLinkAs(l) {
      const ext = FS.ext(l.file);
      const r = await Dialog.fileChooser({ mode: 'save', title: 'Lagre som', name: FS.base(l.file), types: [{ label: Icons.typeName({ type: 'file', name: l.file }) + ' (*.' + ext + ')', ext }], start: FS.roots().downloads });
      if (!r) return;
      let n = FS.children(r.folderId).find(c => c.name.toLowerCase() === r.name.toLowerCase());
      if (n) { const w = FS.write(n.id, l.content); if (w && w.error) { Toast.show(w.error); return; } }
      else { n = FS.createFile(r.folderId, r.name, l.content, { via: 'download' }); if (n.error) { Toast.show(n.error); return; } }
      downloads.unshift({ id: n.id, name: n.name });
      if (downloads.length > 20) downloads.length = 20;
      Bus.emit('download', { id: n.id, name: n.name, base: l.file, via: 'saveas', folderId: r.folderId });
      Toast.show('Lagret «' + n.name + '» i ' + FS.get(r.folderId).name);
      fly.classList.remove('hidden'); renderFly();
    }
    root.querySelector('.dlb').addEventListener('click', () => { fly.classList.toggle('hidden'); renderFly(); });
    root.querySelector('.br-page').addEventListener('click', e => { if (!e.target.closest('.dl-flyout') && !fly.classList.contains('hidden')) fly.classList.add('hidden'); });

    function download(l) {
      const dl = FS.roots().downloads;
      const name = FS.uniqueName(dl, l.file);
      const n = FS.createFile(dl, name, l.content, { via: 'download' });
      if (n.error) { Toast.show(n.error); return; }
      downloads.unshift({ id: n.id, name: n.name });
      if (downloads.length > 20) downloads.length = 20;
      Bus.emit('download', { id: n.id, name: n.name, base: l.file });
      fly.classList.remove('hidden');
      renderFly();
    }
    function renderFly() {
      fly.innerHTML = '<h4>Nedlastinger</h4>';
      if (!downloads.length) { fly.appendChild(el('<div class="dl-empty">Ingen nedlastinger ennå.</div>')); return; }
      downloads.forEach(d => {
        const n = FS.get(d.id);
        const row = el(`<div class="dl-row"><span class="ico">${Icons.file(FS.ext(d.name), 28)}</span><div class="ct"><b>${esc(d.name)}</b>${n ? 'Ferdig · lagret i Nedlastinger<br><a class="op">Åpne fil</a><a class="sh">Vis i mappe</a>' : '<span class="muted">Filen er flyttet eller slettet</span>'}</div></div>`);
        if (n) {
          row.querySelector('.op').addEventListener('click', () => { Bus.emit('download-open', { name: d.name }); Apps.openFile(d.id, { via: 'download' }); });
          row.querySelector('.sh').addEventListener('click', () => { Bus.emit('download-showinfolder', { name: d.name }); Explorer.open(FS.roots().downloads, { select: d.id }); });
        }
        fly.appendChild(row);
      });
    }
    return win;
  }
  return { open, LINKS };
})();

/* ---------- Innleveringer (Teams-lignende oppgaveliste) ---------- */
const Innlevering = (() => {
  const ASSIGN = [
    { id: 'norsk-dikt', fag: 'Norsk', title: 'Dikt-analyse', due: 'fredag 25. september', desc: 'Lever dikt-analysen din som et Word-dokument. Husk å gi filen et tydelig navn.' },
    { id: 'matte-brok', fag: 'Matte', title: 'Brøk-oppgaver', due: 'mandag 28. september', desc: 'Lever det utfylte oppgavearket om brøk (PDF).' },
    { id: 'naturfag-rapport', fag: 'Naturfag', title: 'Rapport: Fotosyntese', due: 'onsdag 30. september', desc: 'Lever labrapporten din. Bruk malen fra Skoleportalen.' }
  ];
  let state = {};
  try { state = JSON.parse(localStorage.getItem('dt-innlev') || '{}'); } catch (e) { state = {}; }
  function save() { localStorage.setItem('dt-innlev', JSON.stringify(state)); }
  function reset(id) { if (id) delete state[id]; else state = {}; save(); }
  function st(id) { return state[id] || (state[id] = { files: [], submitted: null }); }

  function open() {
    if (WM.full()) return null;
    let cur = null;
    const root = el(`<div class="teams"><div class="tm-side"><h3>Oppgaver</h3><div class="tm-list"></div></div><div class="tm-main"></div></div>`);
    const win = WM.create({ app: 'innlevering', title: 'Innleveringer', body: root, width: 900, height: 580 });
    function renderList() {
      const l = root.querySelector('.tm-list'); l.innerHTML = '';
      ASSIGN.forEach(a => {
        const s = st(a.id);
        const d = el(`<div class="tm-item${cur === a.id ? ' active' : ''}"><b>${esc(a.fag)}: ${esc(a.title)}</b><span>Frist: ${esc(a.due)}</span>${s.submitted ? '<div class="st">✓ Levert</div>' : ''}</div>`);
        d.addEventListener('click', () => { cur = a.id; Bus.emit('assignment-open', { id: a.id }); render(); });
        l.appendChild(d);
      });
    }
    function render() {
      renderList();
      const m = root.querySelector('.tm-main'); m.innerHTML = '';
      const a = ASSIGN.find(x => x.id === cur);
      if (!a) { m.appendChild(el('<div class="tm-empty">Velg en oppgave i listen til venstre.</div>')); return; }
      const s = st(a.id);
      m.appendChild(el(`<h2>${esc(a.title)}</h2><div class="tm-meta">${esc(a.fag)} · Frist: ${esc(a.due)}</div><div class="tm-desc">${esc(a.desc)}</div>`));
      const w = el(`<div class="tm-work"><h4>Mitt arbeid</h4><div class="files"></div><div class="tm-actions"></div></div>`);
      const files = w.querySelector('.files');
      if (!s.files.length) files.appendChild(el('<div class="muted">Ingen filer lagt til ennå.</div>'));
      s.files.forEach((f, i) => {
        const row = el(`<div class="tm-file"><span class="ico">${Icons.file(FS.ext(f.name), 24)}</span><span>${esc(f.name)}</span>${s.submitted ? '' : '<button class="rm">Fjern</button>'}</div>`);
        const rm = row.querySelector('.rm');
        if (rm) rm.addEventListener('click', () => { s.files.splice(i, 1); save(); render(); });
        files.appendChild(row);
      });
      const act = w.querySelector('.tm-actions');
      if (s.submitted) {
        act.appendChild(el(`<span class="tm-submitted">✓ Levert ${fmtDate(s.submitted)}</span>`));
        const undo = el('<button class="btn small">Angre innlevering</button>');
        undo.addEventListener('click', () => { s.submitted = null; save(); render(); });
        act.appendChild(undo);
      } else {
        const add = el('<button class="btn">+ Legg til arbeid</button>');
        add.addEventListener('click', async () => {
          Bus.emit('attach-start', { assignment: a.id });
          const r = await Dialog.fileChooser({ mode: 'open', title: 'Legg til arbeid – velg en fil', types: [{ label: 'Alle filer (*.*)', ext: '' }], start: FS.roots().onedrive });
          if (!r) return;
          if (s.files.some(f => f.nodeId === r.nodeId)) { Toast.show('Filen er allerede lagt til.'); return; }
          if (s.files.length >= 10) { Toast.show('Du kan legge ved maks 10 filer per oppgave.'); return; }
          s.files.push({ nodeId: r.nodeId, name: r.name }); save();
          Bus.emit('attach', { assignment: a.id, name: r.name, nodeId: r.nodeId });
          render();
        });
        const sub = el(`<button class="btn teams"${s.files.length ? '' : ' disabled'}>Lever inn</button>`);
        sub.addEventListener('click', () => {
          if (!s.files.length) return;
          s.submitted = Date.now(); save();
          Bus.emit('submit', { assignment: a.id, files: s.files.map(f => f.name) });
          Toast.show('Innlevert! Læreren kan nå se arbeidet ditt.');
          render();
        });
        act.appendChild(add); act.appendChild(sub);
      }
      m.appendChild(w);
    }
    render();
    return win;
  }
  return { open, reset, ASSIGN, state: () => state };
})();

/* ---------- Filvisning for bilder, PDF, PowerPoint, Excel osv. ---------- */
const Viewer = (() => {
  function scene(name) {
    const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return `<svg class="v-img" viewBox="0 0 520 340" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,75%)"/><stop offset="1" stop-color="hsl(${hue},60%,92%)"/></linearGradient></defs><rect width="520" height="340" fill="url(#sky)"/><circle cx="420" cy="70" r="36" fill="#ffd166"/><path d="M0 340L120 190l90 90 70-120 120 140 120-90v130z" fill="hsl(${(hue + 120) % 360},40%,40%)"/><path d="M0 340l160-110 110 110z" fill="hsl(${(hue + 120) % 360},45%,30%)"/><text x="16" y="326" font-size="13" fill="#fff" font-family="Segoe UI, sans-serif">${esc(name)}</text></svg>`;
  }
  function open(id) {
    const n = FS.get(id); if (!n) return null;
    if (WM.full()) return null;
    const e = FS.ext(n.name);
    let inner, app = 'viewer';
    if (['jpg', 'jpeg', 'png'].includes(e)) { inner = scene(n.name); app = 'bilder'; }
    else if (e === 'pdf') inner = `<div class="v-paper"><b style="font-size:18px">${esc(FS.base(n.name))}</b>\n\n${esc(n.content || 'Dette er en PDF-fil. En PDF ser lik ut på alle enheter og kan vanligvis ikke redigeres.')}</div>`;
    else if (e === 'pptx') inner = `<div class="v-slide"><h1>${esc(FS.base(n.name))}</h1><p>${esc((n.content || 'Lysbilde 1 av 12').split('\n')[0])}</p></div>`;
    else if (e === 'xlsx') inner = `<table class="v-sheet"><tr><th></th><th>A</th><th>B</th><th>C</th></tr><tr><th>1</th><td><b>Post</b></td><td><b>Beløp</b></td><td></td></tr><tr><th>2</th><td>Buss</td><td>4 500</td><td></td></tr><tr><th>3</th><td>Overnatting</td><td>12 000</td><td></td></tr><tr><th>4</th><td>Mat</td><td>3 200</td><td></td></tr><tr><th>5</th><td><b>Sum</b></td><td><b>19 700</b></td><td></td></tr></table>`;
    else inner = `<div class="v-generic"><div class="ico">${Icons.file(e, 96)}</div><b>${esc(n.name)}</b><p>${esc(Icons.typeName(n))}</p></div>`;
    const root = el(`<div class="viewer"><div class="v-head"><span class="ico">${Icons.file(e, 24)}</span><b>${esc(n.name)}</b><span class="muted">${esc(Icons.typeName(n))}</span></div><div class="v-body">${inner}</div><div class="v-info"><b>Plassering:</b> ${esc(FS.pathString(n.parent))} · <b>Størrelse:</b> ${fmtSize(n.size)}<br>På en ekte PC åpnes denne filtypen (.${esc(e)}) i <b>${esc(Icons.program(n))}</b>.</div></div>`);
    return WM.create({ app, title: n.name, body: root, width: 720, height: 540 });
  }
  return { open };
})();

/* ---------- Innstillinger ---------- */
const Innstillinger = (() => {
  function open() {
    if (WM.full()) return null;
    const root = el(`<div class="settings">
      <h3>Innstillinger</h3>
      <div class="opt"><input type="checkbox" id="set-ext"${Explorer.settings.showExt ? ' checked' : ''}><div class="desc"><label for="set-ext">Vis filendelser i Filutforsker</label><small>Viser .docx, .pdf osv. bak filnavnet.</small></div></div>
      <div class="opt"><div class="desc">Tilbakestill øvings-PC-en<small>Sletter alle filer og mapper du har laget, og legger tilbake de opprinnelige filene. Fremdriften din beholdes.</small></div><button class="btn small reset-fs">Tilbakestill</button></div>
      <div class="opt"><div class="desc">Nullstill fremdrift<small>Fjerner alle fullførte oppdrag og starter fra begynnelsen.</small></div><button class="btn small reset-p">Nullstill</button></div>
    </div>`);
    root.querySelector('#set-ext').addEventListener('change', e => Explorer.setShowExt(e.target.checked, 'settings'));
    root.querySelector('.reset-fs').addEventListener('click', async () => { if (await Dialog.confirm('Tilbakestill', 'Er du sikker? Alle filer og mapper du har laget blir borte.')) { WM.list('explorer').forEach(w => WM.close(w)); FS.reset(); Toast.show('Øvings-PC-en er tilbakestilt.'); } });
    root.querySelector('.reset-p').addEventListener('click', async () => { if (await Dialog.confirm('Nullstill fremdrift', 'Er du sikker? All fremdrift blir slettet.')) Coach.resetProgress(); });
    return WM.create({ app: 'innstillinger', title: 'Innstillinger', body: root, width: 620, height: 400 });
  }
  return { open };
})();

/* ---------- Oppgavebehandling (liste over åpne programmer) ---------- */
const TaskMgr = (() => {
  function open() {
    if (WM.full()) return null;
    const root = el(`<div class="taskmgr"><h3>Prosesser</h3><div class="tk-rows"></div><p class="muted">På en ekte PC åpner du Oppgavebehandling med <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Esc</kbd>, eller ved å høyreklikke på oppgavelinjen. Her kan du avslutte programmer som har hengt seg.</p></div>`);
    const win = WM.create({ app: 'taskmgr', title: 'Oppgavebehandling', body: root, width: 600, height: 440 });
    function render() {
      const r = root.querySelector('.tk-rows'); r.innerHTML = '';
      WM.list().filter(w => w !== win).forEach(w => {
        const row = el(`<div class="tkr"><span class="ico">${Icons.app(w.app, 20)}</span><span class="t">${esc(w.title || WM.appName(w.app))}</span><span class="muted">${esc(WM.appName(w.app))}</span><button class="btn small">Avslutt oppgave</button></div>`);
        row.querySelector('button').addEventListener('click', () => { Bus.emit('end-task', { app: w.app }); WM.close(w, 'taskmgr'); });
        r.appendChild(row);
      });
      if (!r.children.length) r.appendChild(el('<div class="muted" style="padding:12px">Ingen andre programmer kjører.</div>'));
    }
    render();
    const h = t => { if (t.startsWith('window-')) render(); };
    Bus.on(h);
    win.onClosed = () => { const i = Bus.handlers.indexOf(h); if (i >= 0) Bus.handlers.splice(i, 1); };
    return win;
  }
  return { open };
})();
