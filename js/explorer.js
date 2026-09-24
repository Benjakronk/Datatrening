/* Filutforsker */
const Explorer = (() => {
  const settings = {
    showExt: (() => { try { return JSON.parse(localStorage.getItem('dt-showext') || 'false'); } catch (e) { return false; } })(),
    view: localStorage.getItem('dt-view') || 'icons'
  };
  const Clip = { ids: [], cut: false };
  const views = [];
  const T = Icons.tools;

  function setShowExt(on, via) {
    settings.showExt = !!on;
    localStorage.setItem('dt-showext', JSON.stringify(settings.showExt));
    Bus.emit('show-ext', { on: settings.showExt, via });
    refreshAll();
  }
  function refreshAll() { views.forEach(v => Coalesce.schedule(v, () => v.render())); if (window.Desktop) Coalesce.schedule(Desktop, () => Desktop.render()); }

  /* ---------- Felles handlinger (brukes også av skrivebordet) ---------- */
  function doCopy(ids, via) {
    if (!ids.length) return;
    Clip.ids = ids.slice(); Clip.cut = false;
    Bus.emit('copy', { ids, names: ids.map(id => FS.get(id).name), via });
    refreshAll();
  }
  function doCut(ids, via) {
    if (!ids.length) return;
    Clip.ids = ids.slice(); Clip.cut = true;
    Bus.emit('cut', { ids, names: ids.map(id => FS.get(id).name), via });
    refreshAll();
  }
  function doPaste(folderId, via) {
    const ids = Clip.ids.filter(id => FS.get(id));
    if (!ids.length) return [];
    const out = [];
    const mode = Clip.cut ? 'cut' : 'copy';
    for (const id of ids) {
      const r = Clip.cut ? FS.move(id, folderId, { via: 'paste' }) : FS.copy(id, folderId, { via: 'paste' });
      if (r && r.error) { Toast.show(r.error); break; }
      if (r) out.push(r.id);
    }
    Bus.emit('paste', { mode, ids, names: ids.map(id => (FS.get(id) || {}).name), to: folderId, via });
    if (Clip.cut) { Clip.ids = []; Clip.cut = false; }
    refreshAll();
    return out;
  }
  function doDelete(ids, via) {
    ids = ids.filter(id => FS.get(id));
    if (!ids.length) return;
    const names = ids.map(id => FS.get(id).name);
    let n = 0;
    ids.forEach(id => { const r = FS.remove(id, { via }); if (r && r.error) Toast.show(r.error); else n++; });
    if (n) Toast.show(n === 1 ? `«${FS.displayName({ name: names[0], type: 'file' }, settings.showExt)}» ble flyttet til papirkurven.` : `${n} elementer ble flyttet til papirkurven.`);
    Bus.emit('delete-action', { ids, names, via });
  }
  const NEW_ITEMS = [
    { kind: 'folder', label: 'Mappe', icon: Icons.folder(16), name: 'Ny mappe' },
    '-',
    { kind: 'file', label: 'Tekstdokument', icon: Icons.file('txt', 16), name: 'Nytt tekstdokument.txt' },
    { kind: 'file', label: 'Microsoft Word-dokument', icon: Icons.file('docx', 16), name: 'Nytt Microsoft Word-dokument.docx' },
    { kind: 'file', label: 'Microsoft PowerPoint-presentasjon', icon: Icons.file('pptx', 16), name: 'Ny Microsoft PowerPoint-presentasjon.pptx' },
    { kind: 'file', label: 'Microsoft Excel-regneark', icon: Icons.file('xlsx', 16), name: 'Nytt Microsoft Excel-regneark.xlsx' }
  ];
  function newItems() {
    if (!window.Kode) return NEW_ITEMS;
    return NEW_ITEMS.concat(['-',
      { kind: 'file', label: 'Python-fil', icon: Icons.file('py', 16), name: 'ny.py' },
      { kind: 'file', label: 'PowerShell-skript', icon: Icons.file('ps1', 16), name: 'nytt-skript.ps1' }]);
  }
  function newMenu(folderId, via, then) {
    return newItems().map(it => it === '-' ? '-' : ({
      label: it.label, icon: it.icon,
      action: () => {
        const name = FS.uniqueName(folderId, it.name);
        const r = it.kind === 'folder' ? FS.createFolder(folderId, name, { via }) : FS.createFile(folderId, name, '', { via });
        if (r.error) { Toast.show(r.error); return; }
        Bus.emit('new-item', { kind: it.kind, id: r.id, folderId, via });
        if (then) then(r.id);
      }
    }));
  }

  /* Gi nytt navn direkte på ikonet */
  function inlineRename(nameEl, n, onDone) {
    const showExt = settings.showExt;
    const e = FS.ext(n.name);
    const full = n.type === 'file' && !showExt && e ? FS.base(n.name) : n.name;
    const input = el(`<input type="text" value="${esc(full)}">`);
    nameEl.innerHTML = ''; nameEl.appendChild(input);
    input.focus();
    const selEnd = (n.type === 'file' && showExt && e) ? full.length - e.length - 1 : full.length;
    input.setSelectionRange(0, selEnd);
    /* Noen ganger stjeler noe annet fokus rett etter at feltet ble laget (menyen som lukkes, vinduet som aktiveres). Prøv igjen. */
    setTimeout(() => { if (input.isConnected && document.activeElement !== input) { input.focus(); input.setSelectionRange(0, selEnd); } }, 40);
    Bus.emit('rename-start', { id: n.id, name: n.name });
    let finished = false;
    const finish = async commit => {
      Bus.emit('rename-finish', { id: n.id, commit: !!commit, value: input.value, already: finished, attached: input.isConnected });
      if (finished) return; finished = true;
      let v = input.value.trim();
      let renamed = false;
      if (commit && v && v !== full) {
        if (n.type === 'file' && !showExt && e) v = v + '.' + e;
        const r = FS.rename(n.id, v, { via: 'inline' });
        if (r.error) { await Dialog.alert('Gi nytt navn', r.error); } else renamed = true;
      }
      if (onDone) onDone();
      /* Ble mappen stående med standardnavnet? Fortell hvordan man gir nytt navn etterpå. */
      const cur = FS.get(n.id);
      if (!renamed && cur && /^(Ny mappe|Nytt tekstdokument|Nytt Microsoft|Ny Microsoft|ny\.py|nytt-skript)/i.test(cur.name)) {
        Toast.show((cur.type === 'folder' ? 'Mappen' : 'Filen') + ' heter fortsatt «' + FS.displayName(cur, showExt) + '». Gi nytt navn: klikk én gang på ' + (cur.type === 'folder' ? 'mappen' : 'filen') + ', trykk F2, skriv navnet og trykk Enter. (Eller høyreklikk → Gi nytt navn.)', 7000);
        Bus.emit('rename-skipped', { id: n.id, name: cur.name });
      }
    };
    input.addEventListener('keydown', ev => {
      ev.stopPropagation();
      if (ev.key === 'Enter') { ev.preventDefault(); finish(true); }
      else if (ev.key === 'Escape') { ev.preventDefault(); finish(false); }
    });
    input.addEventListener('blur', () => finish(true));
    input.addEventListener('pointerdown', ev => ev.stopPropagation());
    input.addEventListener('click', ev => ev.stopPropagation());
    input.addEventListener('dblclick', ev => ev.stopPropagation());
  }

  function itemMenu(n, ctx) {
    /* ctx: {ids (valgte), inBin, refresh, renameFn} */
    if (ctx.inBin) {
      return [
        { label: 'Gjenopprett', icon: T.restore, action: () => { ctx.ids.forEach(id => FS.restore(id)); Toast.show('Gjenopprettet.'); } },
        '-',
        { label: 'Slett permanent', icon: T.del, action: async () => { if (await Dialog.confirm('Slett fil', ctx.ids.length === 1 ? `Er du sikker på at du vil slette «${n.name}» for alltid?` : `Er du sikker på at du vil slette disse ${ctx.ids.length} elementene for alltid?`)) ctx.ids.forEach(id => FS.purge(id)); } },
        '-',
        { label: 'Egenskaper', icon: T.props, action: () => Dialog.properties(n) }
      ];
    }
    const e = FS.ext(n.name);
    const items = [{ label: 'Åpne', icon: T.open, kbd: 'Enter', action: () => Apps.openFile(n.id, { via: 'menu' }) }];
    if (n.type === 'folder') {
      items.push({ label: 'Åpne i nytt vindu', action: () => Explorer.open(n.id) });
    } else {
      const sub = [];
      if (['docx', 'doc', 'txt', 'md'].includes(e)) sub.push({ label: 'Skriv', icon: Icons.app('skriv', 16), action: () => Skriv.open(n.id) });
      sub.push({ label: Icons.program(n) + ' (simulert)', icon: Icons.app('viewer', 16), action: () => Viewer.open(n.id) });
      items.push({ label: 'Åpne med', sub });
      if (['jpg', 'jpeg', 'png'].includes(e)) items.push({ label: 'Angi som skrivebordsbakgrunn', action: () => Desktop.setBackground(n.name) });
      if (e === 'zip') items.push({ label: 'Pakk ut alle …', action: () => Toast.show('En ZIP-fil er en pakket mappe. På en ekte PC pakkes filene ut i en ny mappe her.') });
      if (['docx', 'doc', 'pdf', 'txt', 'pptx', 'xlsx'].includes(e)) items.push({ label: 'Skriv ut', action: () => Toast.show('«' + n.name + '» ble sendt til skriveren (simulert).') });
    }
    items.push('-',
      { label: 'Klipp ut', icon: T.cut, kbd: 'Ctrl+X', action: () => doCut(ctx.ids, 'menu') },
      { label: 'Kopier', icon: T.copy, kbd: 'Ctrl+C', action: () => doCopy(ctx.ids, 'menu') },
      { label: 'Kopier som bane', action: () => { if (navigator.clipboard) navigator.clipboard.writeText(FS.pathString(n.id)).catch(() => {}); Toast.show('Kopierte banen: ' + FS.pathString(n.id)); } },
      '-',
      { label: 'Del', action: () => Toast.show('På en ekte PC kan du dele filen med andre via OneDrive her.') },
      '-',
      { label: 'Gi nytt navn', icon: T.rename, kbd: 'F2', action: () => ctx.renameFn(n.id) },
      { label: 'Slett', icon: T.del, kbd: 'Delete', action: () => doDelete(ctx.ids, 'menu') },
      '-',
      { label: 'Egenskaper', icon: T.props, action: () => Dialog.properties(n) });
    return items;
  }
  function itemWhere(n) { return n.type === 'folder' ? 'folder' : 'file'; }
  function itemLabel(n) { return (n.type === 'folder' ? 'mappen «' : 'filen «') + FS.displayName(n, settings.showExt) + '»'; }
  function navMenu(n, view) {
    const R = FS.roots();
    const items = [
      { label: 'Åpne', icon: T.open, action: () => view.navigate(n.id) },
      { label: 'Åpne i nytt vindu', action: () => Explorer.open(n.id) },
      '-'
    ];
    if (n.id === R.bin) items.push({ label: 'Tøm papirkurv', icon: T.del, disabled: !FS.children(R.bin).length, action: () => emptyBin() });
    else items.push({ label: 'Lim inn', icon: T.paste, disabled: !Clip.ids.length, action: () => doPaste(n.id, 'menu') });
    items.push('-', { label: 'Egenskaper', icon: T.props, action: () => Dialog.properties(n) });
    return items;
  }
  function bgMenu(folderId, ctx) {
    /* ctx: {inBin, view, setView, sort, setSort, refresh, renameFn, via} */
    if (ctx.inBin) {
      return [
        { label: 'Tøm papirkurv', icon: T.del, disabled: !FS.children(folderId).length, action: () => emptyBin() },
        { label: 'Oppdater', action: ctx.refresh }
      ];
    }
    const items = [];
    if (ctx.setView) items.push({ label: 'Vis', icon: T.view, sub: viewMenu(ctx) });
    if (ctx.setSort) items.push({ label: 'Sorter etter', icon: T.sort, sub: sortMenu(ctx) });
    items.push({ label: 'Oppdater', action: ctx.refresh }, '-');
    items.push({ label: 'Lim inn', icon: T.paste, kbd: 'Ctrl+V', disabled: !Clip.ids.length, action: () => { const ids = doPaste(folderId, 'menu'); if (ctx.afterPaste) ctx.afterPaste(ids); } });
    if (FS.canUndo()) items.push({ label: 'Angre', kbd: 'Ctrl+Z', action: () => FS.undo() });
    items.push('-', { label: 'Ny', icon: T.newf, sub: newMenu(folderId, ctx.via, ctx.renameFn) });
    if (ctx.extra) items.push('-', ...ctx.extra);
    return items;
  }
  function viewMenu(ctx) {
    return [
      { label: 'Store ikoner', checked: ctx.view === 'icons', action: () => ctx.setView('icons') },
      { label: 'Detaljer', checked: ctx.view === 'details', action: () => ctx.setView('details') },
      '-',
      { label: 'Vis filendelser', checked: settings.showExt, action: () => setShowExt(!settings.showExt, 'menu') }
    ];
  }
  function sortMenu(ctx) {
    const s = ctx.sort;
    return [
      { label: 'Navn', checked: s.by === 'name', action: () => ctx.setSort('name') },
      { label: 'Endringsdato', checked: s.by === 'modified', action: () => ctx.setSort('modified') },
      { label: 'Type', checked: s.by === 'type', action: () => ctx.setSort('type') },
      { label: 'Størrelse', checked: s.by === 'size', action: () => ctx.setSort('size') },
      '-',
      { label: 'Stigende', checked: s.dir === 1, action: () => ctx.setSort(s.by, 1) },
      { label: 'Synkende', checked: s.dir === -1, action: () => ctx.setSort(s.by, -1) }
    ];
  }
  async function emptyBin() {
    const n = FS.children(FS.roots().bin).length;
    if (!n) return;
    if (await Dialog.confirm('Tøm papirkurv', `Er du sikker på at du vil slette ${n === 1 ? 'dette elementet' : 'disse ' + n + ' elementene'} for alltid?`)) FS.emptyBin();
  }
  function sortItems(list, by, dir) {
    const key = n => by === 'modified' ? n.modified : by === 'size' ? (n.size || 0) : by === 'type' ? Icons.typeName(n) : n.name;
    return list.slice().sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      const ka = key(a), kb = key(b);
      const c = typeof ka === 'string' ? ka.localeCompare(kb, 'nb', { numeric: true }) : ka - kb;
      return c * dir;
    });
  }

  /* ---------- Et Filutforsker-vindu ---------- */
  class View {
    constructor(folderId, opts = {}) {
      const R = FS.roots();
      this.cwd = folderId; this.hist = [folderId]; this.hi = 0;
      this.sel = new Set(); this.anchor = null;
      this.view = settings.view; this.sort = { by: 'name', dir: 1 };
      this.expanded = new Set([R.onedrive, R.pc]);
      this.query = '';
      this.root = el('<div class="ex"></div>');
      this.build();
      this.win = WM.create({ app: 'explorer', title: FS.get(folderId).name, body: this.root, width: 980, height: 600 });
      this.win.view = this;
      this.win.onKey = e => this.onKey(e);
      this.win.onClosed = () => { const i = views.indexOf(this); if (i >= 0) views.splice(i, 1); };
      views.push(this);
      this.navigate(folderId, false);
      if (opts.select) { this.sel.add(opts.select); this.renderContent(); }
    }
    get inBin() { return this.cwd === FS.roots().bin; }
    build() {
      this.root.innerHTML = `
        <div class="ex-toolbar"></div>
        <div class="ex-address"><button class="nav-btn back" title="Tilbake">←</button><button class="nav-btn fwd" title="Frem">→</button><button class="nav-btn up" title="Opp ett nivå">↑</button><div class="crumbs"></div><input class="ex-search" placeholder="Søk"></div>
        <div class="ex-main"><div class="ex-nav"></div><div class="ex-content" tabindex="-1"></div></div>
        <div class="ex-status"></div>`;
      this.root.querySelector('.back').addEventListener('click', () => this.back());
      this.root.querySelector('.fwd').addEventListener('click', () => this.fwd());
      this.root.querySelector('.up').addEventListener('click', () => this.up());
      const s = this.root.querySelector('.ex-search');
      let timer = null;
      s.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(() => this.setQuery(s.value), 300); });
      s.addEventListener('keydown', e => {
        e.stopPropagation();
        if (e.key === 'Enter') { clearTimeout(timer); this.setQuery(s.value, true); }
        if (e.key === 'Escape') { s.value = ''; this.setQuery(''); this.root.querySelector('.ex-content').focus(); }
      });
      const c = this.root.querySelector('.ex-content');
      c.addEventListener('click', e => { if (e.target === c || e.target.classList.contains('dt-head')) { this.select([]); } });
      c.addEventListener('contextmenu', e => {
        e.preventDefault();
        if (e.target.closest('.item, .row')) return;
        Ctx.show(e.clientX, e.clientY, bgMenu(this.cwd, this.bgCtx()), this.inBin ? 'bin-bg' : 'explorer', 'et tomt sted i mappen «' + FS.get(this.cwd).name + '»');
      });
      DnD.target(c, () => this.cwd, () => this.render(), () => !this.inBin && !this.query);
    }
    bgCtx() {
      return {
        inBin: this.inBin, view: this.view, sort: this.sort, via: 'explorer',
        setView: v => this.setView(v), setSort: (by, dir) => this.setSort(by, dir),
        refresh: () => this.render(), renameFn: id => this.startRename(id),
        afterPaste: ids => this.select(ids)
      };
    }
    /* Navigasjon */
    navigate(id, push = true) {
      if (!FS.get(id)) id = FS.roots().pc;
      this.cwd = id; this.query = ''; this.root.querySelector('.ex-search').value = '';
      this.sel.clear(); this.anchor = null;
      if (push) { this.hist = this.hist.slice(0, this.hi + 1); this.hist.push(id); this.hi = this.hist.length - 1; }
      FS.path(id).forEach(n => this.expanded.add(n.id));
      WM.setTitle(this.win, FS.get(id).name);
      Bus.emit('explorer-nav', { folderId: id, name: FS.get(id).name, path: FS.pathString(id) });
      this.render();
    }
    back() { if (this.hi > 0) { this.hi--; this.navigate(this.hist[this.hi], false); Bus.emit('explorer-back', { folderId: this.cwd }); } }
    fwd() { if (this.hi < this.hist.length - 1) { this.hi++; this.navigate(this.hist[this.hi], false); Bus.emit('explorer-fwd', { folderId: this.cwd }); } }
    up() { const p = FS.get(this.cwd).parent; if (p != null) { this.navigate(p); Bus.emit('explorer-up', { folderId: this.cwd }); } }
    setQuery(q, enter) {
      q = q.trim();
      if (q === this.query && !enter) return;
      this.query = q; this.sel.clear();
      if (q) Bus.emit('search', { query: q, folderId: this.cwd, name: FS.get(this.cwd).name });
      this.renderContent();
    }
    setView(v) { this.view = v; settings.view = v; localStorage.setItem('dt-view', v); Bus.emit('view', { view: v }); this.renderContent(); }
    setSort(by, dir) { this.sort = { by, dir: dir || (this.sort.by === by && dir == null ? this.sort.dir : 1) }; Bus.emit('sort', { by, dir: this.sort.dir }); this.renderContent(); }
    items() {
      let list = this.query ? FS.search(this.query, this.cwd) : FS.children(this.cwd);
      return sortItems(list, this.sort.by, this.sort.dir);
    }
    /* Tegning */
    render() {
      if (!FS.get(this.cwd)) { this.navigate(FS.roots().pc, false); return; }
      this.renderToolbar(); this.renderAddress(); this.renderNav(); this.renderContent();
    }
    renderToolbar() {
      const t = this.root.querySelector('.ex-toolbar'); t.innerHTML = '';
      const btn = (label, icon, action, disabled) => { const b = el(`<button class="tb"${disabled ? ' disabled' : ''}><span class="ico">${icon}</span>${esc(label)}</button>`); b.addEventListener('click', e => action(e, b)); t.appendChild(b); return b; };
      const menuAt = (b, items) => { const r = b.getBoundingClientRect(); Ctx.show(r.left, r.bottom + 2, items, 'toolbar'); };
      const has = this.sel.size > 0;
      if (this.inBin) {
        btn('Gjenopprett', T.restore, () => { [...this.sel].forEach(id => FS.restore(id)); Toast.show('Gjenopprettet.'); }, !has);
        btn('Slett permanent', T.del, async () => { if (await Dialog.confirm('Slett', 'Er du sikker på at du vil slette dette for alltid?')) [...this.sel].forEach(id => FS.purge(id)); }, !has);
        t.appendChild(el('<span class="vsep"></span>'));
        btn('Tøm papirkurv', T.del, () => emptyBin(), !FS.children(this.cwd).length);
        t.appendChild(el('<span class="vsep"></span>'));
      } else {
        btn('Ny ▾', T.newf, (e, b) => menuAt(b, newMenu(this.cwd, 'toolbar', id => this.startRename(id))), !!this.query);
        t.appendChild(el('<span class="vsep"></span>'));
        btn('Klipp ut', T.cut, () => doCut([...this.sel], 'toolbar'), !has);
        btn('Kopier', T.copy, () => doCopy([...this.sel], 'toolbar'), !has);
        btn('Lim inn', T.paste, () => this.select(doPaste(this.cwd, 'toolbar')), !Clip.ids.length || !!this.query);
        btn('Gi nytt navn', T.rename, () => this.startRename([...this.sel][0]), this.sel.size !== 1);
        btn('Slett', T.del, () => doDelete([...this.sel], 'toolbar'), !has);
        t.appendChild(el('<span class="vsep"></span>'));
      }
      btn('Sorter ▾', T.sort, (e, b) => menuAt(b, sortMenu(this.bgCtx())));
      btn('Vis ▾', T.view, (e, b) => menuAt(b, viewMenu(this.bgCtx())));
    }
    renderAddress() {
      const cr = this.root.querySelector('.crumbs'); cr.innerHTML = '';
      FS.path(this.cwd).forEach((n, i, arr) => {
        const c = el(`<span class="crumb">${i === 0 ? `<span class="ico" style="width:16px;height:16px;display:inline-flex">${Icons.navIcon(n)}</span>` : ''}${esc(n.name)}</span>`);
        c.addEventListener('click', () => this.navigate(n.id));
        DnD.target(c, n.id === FS.roots().bin ? 'bin' : n.id);
        cr.appendChild(c);
        if (i < arr.length - 1) cr.appendChild(el('<span class="crumb-sep">›</span>'));
      });
      this.root.querySelector('.back').disabled = this.hi <= 0;
      this.root.querySelector('.fwd').disabled = this.hi >= this.hist.length - 1;
      this.root.querySelector('.up').disabled = FS.get(this.cwd).parent == null;
      this.root.querySelector('.ex-search').placeholder = 'Søk i ' + FS.get(this.cwd).name;
    }
    renderNav() {
      NavTree.render(this.root.querySelector('.ex-nav'), {
        cwd: this.cwd, expanded: this.expanded, onNav: id => this.navigate(id), drop: true, onDropped: () => this.render(),
        onCtx: (n, e) => Ctx.show(e.clientX, e.clientY, navMenu(n, this), 'nav', '«' + n.name + '» i menyen til venstre')
      });
    }
    renderContent() {
      const c = this.root.querySelector('.ex-content');
      const list = this.items();
      const details = this.view === 'details' || !!this.query || this.inBin;
      const withLoc = !!this.query || this.inBin;
      c.className = 'ex-content ' + (details ? 'details' : 'icons');
      c.innerHTML = '';
      c._cwd = this.cwd;
      if (details) {
        const h = el(`<div class="dt-head${withLoc ? ' with-loc' : ''}"><span data-s="name">Navn</span>${withLoc ? `<span>${this.inBin ? 'Opprinnelig plassering' : 'Plassering'}</span>` : ''}<span data-s="modified">Endringsdato</span><span data-s="type">Type</span><span data-s="size">Størrelse</span></div>`);
        h.querySelectorAll('[data-s]').forEach(s => s.addEventListener('click', () => this.setSort(s.dataset.s, this.sort.by === s.dataset.s ? -this.sort.dir : 1)));
        c.appendChild(h);
      }
      if (!list.length) c.appendChild(el(`<div class="empty">${this.query ? 'Ingen treff på «' + esc(this.query) + '».' : this.inBin ? 'Papirkurven er tom.' : 'Denne mappen er tom.'}</div>`));
      list.forEach(n => c.appendChild(this.itemEl(n, details, withLoc)));
      this.renderStatus();
      this.renderToolbar();
    }
    itemEl(n, details, withLoc) {
      const isCut = Clip.cut && Clip.ids.includes(n.id);
      const nm = esc(FS.displayName(n, settings.showExt));
      let d;
      if (details) {
        const loc = withLoc ? `<div class="col">${esc(this.inBin ? (n.origParent != null && FS.get(n.origParent) ? FS.pathString(n.origParent) : 'Ukjent') : FS.pathString(n.parent))}</div>` : '';
        d = el(`<div class="row${withLoc ? ' with-loc' : ''}${this.sel.has(n.id) ? ' selected' : ''}${isCut ? ' cut' : ''}" data-id="${n.id}"><div class="name"><span class="ico">${Icons.node(n, 20)}</span><span class="nm">${nm}</span></div>${loc}<div class="col">${fmtDate(n.modified)}</div><div class="col">${esc(Icons.typeName(n))}</div><div class="col">${n.type === 'file' ? fmtSize(n.size) : ''}</div></div>`);
      } else {
        d = el(`<div class="item${this.sel.has(n.id) ? ' selected' : ''}${isCut ? ' cut' : ''}" data-id="${n.id}"><div class="ico">${Icons.node(n, 48)}</div><div class="name"><span class="nm">${nm}</span></div></div>`);
      }
      d.addEventListener('click', e => { e.stopPropagation(); this.clickSelect(n, e); });
      d.addEventListener('dblclick', e => { e.stopPropagation(); if (e.target.tagName === 'INPUT') return; this.open(n); });
      d.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation();
        if (!this.sel.has(n.id)) this.select([n.id]);
        Ctx.show(e.clientX, e.clientY, itemMenu(n, { ids: [...this.sel], inBin: this.inBin, renameFn: id => this.startRename(id) }), this.inBin ? 'bin-item' : itemWhere(n), itemLabel(n) + (this.inBin ? ' i papirkurven' : ''));
      });
      DnD.source(d, () => { if (!this.sel.has(n.id)) this.select([n.id]); return [...this.sel]; });
      if (n.type === 'folder' && !this.inBin) DnD.target(d, n.id, () => this.render());
      return d;
    }
    renderStatus() {
      const s = this.root.querySelector('.ex-status');
      const n = this.items().length;
      s.innerHTML = `<span>${n} element${n === 1 ? '' : 'er'}</span>${this.sel.size ? `<span>${this.sel.size} element${this.sel.size === 1 ? '' : 'er'} valgt</span>` : ''}${settings.showExt ? '' : '<span class="muted">Filendelser er skjult (Vis → Vis filendelser)</span>'}`;
    }
    /* Valg */
    select(ids) {
      this.sel = new Set(ids);
      this.root.querySelectorAll('.item, .row').forEach(x => x.classList.toggle('selected', this.sel.has(+x.dataset.id)));
      this.renderStatus(); this.renderToolbar();
      if (ids.length) Bus.emit('select', { ids: [...this.sel], names: [...this.sel].map(id => (FS.get(id) || {}).name) });
    }
    clickSelect(n, e) {
      const all = this.items().map(x => x.id);
      if (e.shiftKey && this.anchor != null) {
        const a = all.indexOf(this.anchor), b = all.indexOf(n.id);
        const [lo, hi] = a < b ? [a, b] : [b, a];
        this.select(all.slice(lo, hi + 1));
      } else if (e.ctrlKey) {
        const s = new Set(this.sel); if (s.has(n.id)) s.delete(n.id); else s.add(n.id);
        this.anchor = n.id; this.select([...s]);
      } else { this.anchor = n.id; this.select([n.id]); }
    }
    open(n) {
      if (this.inBin) { Toast.show('Gjenopprett filen først for å åpne den.'); return; }
      if (n.type === 'folder') this.navigate(n.id);
      else Apps.openFile(n.id, { via: 'explorer' });
    }
    startRename(id) {
      const n = FS.get(id); if (!n || this.inBin) return;
      this.select([id]);
      let d = this.root.querySelector(`[data-id="${id}"] .name`);
      /* Nyopprettet element er kanskje ikke tegnet ennå (tegning samles per skjermbilde): tegn nå */
      if (!d) { this.render(); this.select([id]); d = this.root.querySelector(`[data-id="${id}"] .name`); }
      if (!d) return;
      inlineRename(d, n, () => this.renderContent());
    }
    onKey(e) {
      /* Tastetrykk som gjentas fordi tasten holdes nede, ignoreres. Ellers kan Ctrl+V holdt nede lage hundrevis av kopier. */
      if (e.repeat) { if (e.ctrlKey || ['Delete', 'Enter', 'F2'].includes(e.key)) e.preventDefault(); return; }
      const k = e.key.toLowerCase();
      const ids = [...this.sel];
      if (e.ctrlKey && ['c', 'x', 'v', 'a', 'z', 'f', 'e', 's'].includes(k)) {
        e.preventDefault();
        Bus.emit('shortcut', { key: k, ctrl: true, app: 'explorer' });
        if (k === 'c') doCopy(ids, 'keyboard');
        else if (k === 'x') doCut(ids, 'keyboard');
        else if (k === 'v') { if (!this.inBin && !this.query) this.select(doPaste(this.cwd, 'keyboard')); }
        else if (k === 'a') this.select(this.items().map(x => x.id));
        else if (k === 'z') { if (FS.undo()) Toast.show('Angret.'); }
        else if (k === 'f' || k === 'e') this.root.querySelector('.ex-search').focus();
        return;
      }
      if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) {
        e.preventDefault();
        const id = ids[0];
        const elx = (id && this.root.querySelector(`[data-id="${id}"]`)) || this.root.querySelector('.ex-content');
        const r = elx.getBoundingClientRect();
        if (id) { const n = FS.get(id); Ctx.show(r.left + 40, r.top + r.height / 2, itemMenu(n, { ids, inBin: this.inBin, renameFn: x => this.startRename(x) }), this.inBin ? 'bin-item' : itemWhere(n), itemLabel(n)); }
        else Ctx.show(r.left + 60, r.top + 60, bgMenu(this.cwd, this.bgCtx()), this.inBin ? 'bin-bg' : 'explorer', 'et tomt sted i mappen «' + FS.get(this.cwd).name + '»');
        return;
      }
      if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); this.back(); return; }
      if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); this.up(); return; }
      if (e.key === 'Delete') { e.preventDefault(); Bus.emit('shortcut', { key: 'delete', app: 'explorer' }); if (this.inBin) { if (ids.length) Dialog.confirm('Slett', 'Slette for alltid?').then(ok => { if (ok) ids.forEach(id => FS.purge(id)); }); } else doDelete(ids, 'keyboard'); }
      else if (e.key === 'F2') { e.preventDefault(); Bus.emit('shortcut', { key: 'f2', app: 'explorer' }); if (ids.length === 1) this.startRename(ids[0]); }
      else if (e.key === 'Enter') { e.preventDefault(); if (ids.length === 1) this.open(FS.get(ids[0])); }
      else if (e.key === 'Backspace') { e.preventDefault(); this.back(); }
      else if (e.key === 'Escape') { this.select([]); }
      else if (e.key === 'F5') { e.preventDefault(); this.render(); }
    }
  }

  function open(folderId, opts = {}) { if (WM.full()) return null; return new View(folderId || FS.roots().pc, opts); }

  Bus.on((type, d) => {
    if (type === 'fs') {
      Clip.ids = Clip.ids.filter(id => FS.get(id));
      views.forEach(v => Coalesce.schedule(v, () => {
        if (!views.includes(v)) return;
        if (!FS.get(v.cwd)) v.navigate(FS.roots().pc, false);
        else { v.sel = new Set([...v.sel].filter(id => FS.get(id) && (FS.get(id).parent === v.cwd || v.query))); v.render(); }
      }));
    }
  });

  return { settings, Clip, open, views, setShowExt, doCopy, doCut, doPaste, doDelete, newMenu, inlineRename, itemMenu, itemWhere, itemLabel, navMenu, bgMenu, emptyBin, refreshAll, sortItems };
})();
