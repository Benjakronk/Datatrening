/* ZIP-filer: komprimerte (zippede) mapper, slik Filutforsker viser dem.
   En ZIP-fil på øvings-PC-en er en vanlig fil der innholdet er «ZIP:» fulgt av en liste med filer
   ({ p: 'mappe/fil.txt', c: 'innhold' }, mapper som { p: 'mappe/', d: 1 }).
   Det viktigste eleven skal lære: filer inne i en ZIP-fil må pakkes ut før du jobber med dem. */
const Zip = (() => {
  const PREFIX = 'ZIP:';
  const MAX_ENTRIES = 150;

  function make(entries) { return PREFIX + JSON.stringify(entries); }
  function isZip(n) { return !!n && n.type === 'file' && FS.ext(n.name) === 'zip'; }
  /* Gir null hvis filen ikke er en gyldig ZIP-fil (f.eks. en tekstfil som har fått .zip bak navnet) */
  function entries(n) {
    const c = (n && n.content) || '';
    if (!c.startsWith(PREFIX)) return null;
    try { const e = JSON.parse(c.slice(PREFIX.length)); return Array.isArray(e) ? e.filter(x => x && typeof x.p === 'string') : null; } catch (e) { return null; }
  }
  function invalid(n) {
    Bus.emit('zip-invalid', { name: n.name });
    Dialog.alert(T('Komprimerte (zippede) mapper'), T('Windows kan ikke åpne mappen.\n\nDen komprimerte (zippede) mappen «{0}» er ugyldig.', n.name));
  }

  /* ---------- Vise innholdet ---------- */
  let views = [];
  function open(id) {
    const n = FS.get(id); if (!n) return null;
    const list = entries(n);
    if (!list) { invalid(n); return null; }
    if (WM.full()) return null;
    let cwd = '';
    const root = el(`<div class="ex zipv">
      <div class="zip-bar"><span class="zip-tag">${T('Komprimerte mappeverktøy')}</span><button class="btn small primary zip-ex">${T('Pakk ut alle')}</button></div>
      <div class="ex-address"><button class="nav-btn up" title="${T('Opp ett nivå')}">↑</button><div class="crumbs"></div></div>
      <div class="zip-warn">${T('Du ser <b>inni</b> en ZIP-fil. Filene her er ikke pakket ut ennå. Klikk <b>Pakk ut alle</b> før du jobber med dem.')}</div>
      <div class="ex-content icons"></div>
      <div class="ex-status"></div>
    </div>`);
    const win = WM.create({ app: 'explorer', title: n.name, body: root, width: 820, height: 520 });
    const view = { win, id };
    views.push(view);
    win.onClosed = () => { views = views.filter(v => v !== view); };
    root.querySelector('.zip-ex').addEventListener('click', () => extractDialog(id));
    root.querySelector('.up').addEventListener('click', () => { if (cwd) { cwd = cwd.replace(/[^/]+\/$/, ''); render(); } });
    root.querySelector('.ex-content').addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      Ctx.show(e.clientX, e.clientY, [{ label: T('Pakk ut alle …'), action: () => extractDialog(id) }], 'zip', T('innholdet i ZIP-filen «{0}»', n.name));
    });
    function children() {
      const cur = entries(FS.get(id)) || [];
      const seen = new Map();
      cur.forEach(x => {
        if (!x.p.startsWith(cwd) || x.p === cwd) return;
        const rest = x.p.slice(cwd.length);
        const i = rest.indexOf('/');
        if (i >= 0 && i < rest.length - 1) { const d = rest.slice(0, i + 1); if (!seen.has(d)) seen.set(d, { p: cwd + d, d: 1, name: d.slice(0, -1) }); }
        else if (i === rest.length - 1) { if (!seen.has(rest)) seen.set(rest, { p: x.p, d: 1, name: rest.slice(0, -1) }); }
        else seen.set(rest, { p: x.p, c: x.c || '', name: rest });
      });
      return [...seen.values()].sort((a, b) => (b.d ? 1 : 0) - (a.d ? 1 : 0) || a.name.localeCompare(b.name, 'nb'));
    }
    function render() {
      if (!FS.get(id)) { WM.close(win, 'gone'); return; }
      const crumbs = root.querySelector('.crumbs');
      crumbs.textContent = [FS.get(id).name].concat(cwd ? cwd.slice(0, -1).split('/') : []).join(' › ');
      const c = root.querySelector('.ex-content'); c.innerHTML = '';
      const items = children();
      if (!items.length) c.appendChild(el(`<div class="empty">${T('Denne mappen er tom.')}</div>`));
      items.forEach(x => {
        const shown = x.d || Explorer.settings.showExt ? x.name : FS.base(x.name);
        const d = el(`<div class="item"><div class="ico">${x.d ? Icons.folder(48) : Icons.file(FS.ext(x.name), 48)}</div><div class="name"><span class="nm">${esc(shown)}</span></div></div>`);
        d.addEventListener('click', () => { c.querySelectorAll('.item').forEach(i => i.classList.remove('selected')); d.classList.add('selected'); });
        d.addEventListener('dblclick', () => { if (x.d) { cwd = x.p.endsWith('/') ? x.p : x.p + '/'; render(); } else openInside(id, x); });
        d.addEventListener('contextmenu', e => {
          e.preventDefault(); e.stopPropagation();
          Ctx.show(e.clientX, e.clientY, [
            { label: T('Åpne'), action: () => { if (x.d) { cwd = x.p; render(); } else openInside(id, x); } },
            '-',
            { label: T('Pakk ut alle …'), action: () => extractDialog(id) }
          ], 'zip-item', T('«{0}» inni ZIP-filen', x.name));
        });
        c.appendChild(d);
      });
      root.querySelector('.ex-status').textContent = items.length === 1 ? T('{0} element', 1) : T('{0} elementer', items.length);
    }
    render();
    Bus.emit('zip-open', { name: n.name, count: list.length });
    return win;
  }
  /* Å åpne en fil rett fra ZIP-filen gir en skrivebeskyttet kopi. Det er her mange mister arbeidet sitt. */
  async function openInside(zipId, x) {
    const z = FS.get(zipId); if (!z) return;
    Bus.emit('zip-open-inside', { zip: z.name, name: x.name });
    const r = await Dialog.show({
      title: T('Filen ligger i en ZIP-fil'),
      body: `<p>${esc(T('«{0}» ligger fortsatt inni ZIP-filen «{1}». Åpner du den herfra, får du en midlertidig, skrivebeskyttet kopi. Det du skriver i den, blir ikke lagret.', x.name, z.name))}</p><p>${esc(T('Pakk ut alle filene først, så kan du jobbe med dem som vanlig.'))}</p>`,
      buttons: [{ label: T('Pakk ut alle'), value: 'extract', primary: true }, { label: T('Åpne skrivebeskyttet'), value: 'ro' }, { label: T('Avbryt'), value: null }]
    });
    if (r === 'extract') { extractDialog(zipId); return; }
    if (r !== 'ro' || WM.full()) return;
    const body = el(`<div class="viewer"><div class="v-head"><span class="ico">${Icons.file(FS.ext(x.name), 24)}</span><b>${esc(x.name)}</b><span class="muted">${T('Skrivebeskyttet · midlertidig kopi fra {0}', esc(z.name))}</span></div><div class="v-body"><div class="v-paper">${esc(x.c || '')}</div></div><div class="v-info">${T('Denne kopien forsvinner når du lukker vinduet. Pakk ut ZIP-filen for å jobbe med filen.')}</div></div>`);
    WM.create({ app: 'viewer', title: T('{0} (skrivebeskyttet)', x.name), body, width: 680, height: 480 });
  }

  /* ---------- Pakk ut ---------- */
  async function extractDialog(id) {
    const n = FS.get(id); if (!n) return;
    const list = entries(n);
    if (!list) { invalid(n); return; }
    let target = n.parent;
    const body = el(`<div class="zip-dlg">
      <p>${T('Velg et mål, og pakk ut filene')}</p>
      <label>${T('Filene blir pakket ut i denne mappen:')}</label>
      <div class="zip-row"><input class="txt zip-path" readonly><button class="btn small zip-browse">${T('Bla gjennom …')}</button></div>
      <label class="zip-show"><input type="checkbox" checked> ${T('Vis utpakkede filer når de er ferdige')}</label>
    </div>`);
    const folderName = FS.base(n.name);
    const upd = () => { body.querySelector('.zip-path').value = FS.pathString(target) + ' > ' + folderName; };
    upd();
    body.querySelector('.zip-browse').addEventListener('click', async () => {
      const r = await Dialog.fileChooser({ mode: 'folder', title: T('Velg et mål'), start: target });
      if (r && FS.get(r.folderId)) { target = r.folderId; upd(); Bus.emit('zip-target', { folderId: target, name: FS.get(target).name, path: FS.pathString(target) }); }
    });
    Bus.emit('zip-extract-dialog', { name: n.name });
    const ok = await Dialog.show({ title: T('Pakk ut komprimerte (zippede) mapper'), body, buttons: [{ label: T('Pakk ut'), value: true, primary: true }, { label: T('Avbryt'), value: null }] });
    if (!ok || !FS.get(id) || !FS.get(target)) return;
    const show = body.querySelector('.zip-show input').checked;
    const res = extract(id, target);
    if (res.error) { Dialog.alert(T('Pakk ut'), res.error); return; }
    Toast.show(T('Pakket ut {0} filer til «{1}».', res.count, FS.get(res.folderId).name));
    if (show) Explorer.open(res.folderId);
  }
  /* Lager en mappe med samme navn som ZIP-filen og legger alt inni den. Finnes mappen, brukes den. */
  function extract(id, target) {
    const n = FS.get(id); const list = entries(n);
    if (!list) return { error: T('ZIP-filen er ugyldig.') };
    const name = FS.base(n.name);
    let folder = FS.children(target).find(c => c.type === 'folder' && c.name.toLowerCase() === name.toLowerCase());
    if (!folder) { const r = FS.createFolder(target, name, { via: 'zip' }); if (r.error) return { error: r.error }; folder = r; }
    let count = 0;
    for (const x of list.slice(0, MAX_ENTRIES)) {
      const parts = x.p.split('/').filter(Boolean);
      if (!parts.length) continue;
      const isDir = !!x.d || x.p.endsWith('/');
      let pid = folder.id;
      const dirs = isDir ? parts : parts.slice(0, -1);
      for (const d of dirs) {
        let f = FS.children(pid).find(c => c.type === 'folder' && c.name.toLowerCase() === d.toLowerCase());
        if (!f) { const r = FS.createFolder(pid, d, { via: 'zip' }); if (r.error) return { error: r.error, folderId: folder.id, count }; f = r; }
        pid = f.id;
      }
      if (isDir) continue;
      const fname = parts[parts.length - 1];
      const ex = FS.children(pid).find(c => c.type === 'file' && c.name.toLowerCase() === fname.toLowerCase());
      const r = ex ? (FS.write(ex.id, x.c || '') || ex) : FS.createFile(pid, fname, x.c || '', { via: 'zip' });
      if (r && r.error) return { error: r.error, folderId: folder.id, count };
      count++;
    }
    Bus.emit('zip-extract', { name: n.name, folderId: folder.id, folder: folder.name, target, targetName: FS.get(target).name, path: FS.pathString(folder.id), count });
    return { folderId: folder.id, count };
  }

  /* ---------- Komprimer ---------- */
  function collect(id, prefix, out) {
    const n = FS.get(id); if (!n) return;
    if (out.length > MAX_ENTRIES) return;
    if (n.type === 'folder') {
      out.push({ p: prefix + n.name + '/', d: 1 });
      FS.children(id).forEach(c => collect(c.id, prefix + n.name + '/', out));
    } else out.push({ p: prefix + n.name, c: n.content || '' });
  }
  function compress(ids, parentId, renameFn) {
    ids = (ids || []).filter(id => FS.get(id));
    if (!ids.length) return null;
    const list = [];
    ids.forEach(id => collect(id, '', list));
    if (list.length > MAX_ENTRIES) { Toast.show(T('Det er for mange filer til å komprimere her (maks {0}).', MAX_ENTRIES)); return null; }
    const first = FS.get(ids[0]);
    const base = first.type === 'folder' ? first.name : FS.base(first.name);
    const name = FS.uniqueName(parentId, base + '.zip');
    const r = FS.createFile(parentId, name, make(list), { via: 'zip' });
    if (r.error) { Toast.show(r.error); return null; }
    r.size = Math.max(1024, Math.round(list.reduce((s, x) => s + (x.c || '').length, 0) * 0.6) + 600);
    FS.notify();
    Bus.emit('zip-create', { name: r.name, id: r.id, count: list.filter(x => !x.d).length, names: ids.map(i => FS.get(i).name), folderId: parentId });
    if (renameFn) setTimeout(() => renameFn(r.id), 0);
    return r;
  }

  Bus.on(type => { if (type === 'fs') views.slice().forEach(v => { if (!FS.get(v.id)) WM.close(v.win, 'gone'); }); });

  return { make, entries, isZip, open, extractDialog, extract, compress };
})();
window.Zip = Zip;
