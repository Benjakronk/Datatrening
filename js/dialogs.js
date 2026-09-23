/* Dialoger: meldinger, spørsmål, «Lagre som» / «Åpne» og Egenskaper */
const Dialog = (() => {
  let openCount = 0;

  function show(o) {
    return new Promise(res => {
      const layer = document.getElementById('modal-layer');
      const dlg = el(`<div class="dlg${o.cls ? ' ' + o.cls : ''}"><div class="dlg-title">${esc(o.title || '')}</div><div class="dlg-body"></div><div class="dlg-btns"></div></div>`);
      const body = dlg.querySelector('.dlg-body');
      if (typeof o.body === 'string') body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
      const btns = dlg.querySelector('.dlg-btns');
      let finished = false;
      const done = v => {
        if (finished) return; finished = true;
        dlg.remove(); openCount--;
        if (openCount <= 0) { openCount = 0; layer.classList.add('hidden'); }
        document.removeEventListener('keydown', onKey, true);
        Bus.emit('dialog-close', { title: o.title, value: v });
        res(v);
      };
      const buttons = o.buttons || [{ label: 'OK', value: true, primary: true }];
      let primaryBtn = null;
      buttons.forEach(b => {
        const bt = el(`<button class="btn${b.primary ? ' primary' : ''}">${esc(b.label)}</button>`);
        bt.addEventListener('click', async () => {
          let v = b.value;
          if (o.validate && b.value !== null && b.value !== 'cancel') {
            const r = await o.validate(v);
            if (r === false) return;
            if (r !== undefined) v = r;
          }
          done(v);
        });
        if (b.primary) primaryBtn = bt;
        btns.appendChild(bt);
      });
      const onKey = e => {
        if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); done(o.escapeValue !== undefined ? o.escapeValue : null); }
        else if (e.key === 'Enter' && primaryBtn && e.target.tagName !== 'TEXTAREA' && !e.target.closest('.fc-list') && !e.target.closest('.fc-nav')) { e.preventDefault(); e.stopPropagation(); primaryBtn.click(); }
      };
      document.addEventListener('keydown', onKey, true);
      if (body.firstElementChild) body.firstElementChild.submitDialog = () => primaryBtn && primaryBtn.click();
      layer.appendChild(dlg);
      layer.classList.remove('hidden');
      openCount++;
      Bus.emit('dialog-open', { title: o.title });
      setTimeout(() => { const f = dlg.querySelector('[autofocus]') || primaryBtn; if (f) { f.focus(); if (f.select && o.selectText !== false) f.select(); } }, 0);
    });
  }
  const isOpen = () => openCount > 0;

  function alert(title, msg) { return show({ title, body: `<p>${esc(msg)}</p>`, buttons: [{ label: 'OK', value: true, primary: true }], escapeValue: true }); }
  function confirm(title, msg, yes = 'Ja', no = 'Nei') {
    return show({ title, body: `<p>${esc(msg)}</p>`, buttons: [{ label: yes, value: true, primary: true }, { label: no, value: false }], escapeValue: false });
  }
  function prompt(title, label, value = '', validate) {
    const body = el(`<div><label>${esc(label)}</label><input class="txt" autofocus value="${esc(value)}"><div class="dlg-err"></div></div>`);
    return show({
      title, body,
      buttons: [{ label: 'OK', value: 'ok', primary: true }, { label: 'Avbryt', value: null }],
      validate: () => {
        const val = body.querySelector('input').value;
        const err = validate ? validate(val) : FS.validate(val);
        if (err) { body.querySelector('.dlg-err').textContent = err; return false; }
        return val.trim();
      }
    });
  }
  function saveChanges(name) {
    return show({
      title: 'Skriv',
      body: `<p><b>Vil du lagre endringene i «${esc(name)}»?</b></p><p class="muted">Hvis du ikke lagrer, forsvinner det du har skrevet.</p>`,
      buttons: [{ label: 'Lagre', value: 'save', primary: true }, { label: 'Ikke lagre', value: 'discard' }, { label: 'Avbryt', value: 'cancel' }],
      escapeValue: 'cancel'
    });
  }

  /* ---------- Filvelger («Lagre som» / «Åpne») ---------- */
  function fileChooser(o) {
    const mode = o.mode || 'open';
    const R = FS.roots();
    const types = o.types || [{ label: 'Alle filer (*.*)', ext: '' }];
    let cwd = o.start && FS.get(o.start) ? o.start : R.documents;
    const hist = [cwd];
    let selected = null;
    const expanded = new Set([R.onedrive, R.pc]);
    FS.path(cwd).forEach(n => expanded.add(n.id));

    const body = el(`<div class="fc">
      <div class="fc-top"><button class="nav-btn back" title="Tilbake">←</button><button class="nav-btn up" title="Opp ett nivå">↑</button><div class="crumbs"></div><button class="tb newf">${Icons.folder(16)} Ny mappe</button></div>
      <div class="fc-main"><div class="fc-nav"></div><div class="fc-list"></div></div>
      <div class="fc-bottom"><label>Filnavn:</label><input class="txt fname" autofocus><select class="txt ftype"></select><span></span><div class="dlg-err"></div></div>
    </div>`);
    const nameIn = body.querySelector('.fname'), typeSel = body.querySelector('.ftype'), err = body.querySelector('.dlg-err');
    nameIn.value = o.name || '';
    if (mode === 'folder') { nameIn.placeholder = 'Velg en mappe i listen, eller stå i mappen du vil bruke'; nameIn.readOnly = true; typeSel.classList.add('hidden'); }
    types.forEach((t, i) => typeSel.appendChild(el(`<option value="${i}">${esc(t.label)}</option>`)));
    typeSel.addEventListener('change', renderList);

    function curExts() { const t = types[+typeSel.value] || types[0]; return t.ext ? t.ext.split(',').map(s => s.trim().toLowerCase()) : []; }
    function navigate(id, push = true) {
      if (!FS.get(id)) return;
      cwd = id; selected = null;
      if (push) hist.push(id);
      FS.path(cwd).forEach(n => expanded.add(n.id));
      Bus.emit('dialog-nav', { folderId: id, name: FS.get(id).name, mode });
      render();
    }
    function render() {
      NavTree.render(body.querySelector('.fc-nav'), { cwd, expanded, onNav: id => navigate(id) });
      const cr = body.querySelector('.crumbs'); cr.innerHTML = '';
      FS.path(cwd).forEach((n, i, arr) => {
        const c = el(`<span class="crumb">${esc(n.name)}</span>`);
        c.addEventListener('click', () => navigate(n.id));
        cr.appendChild(c);
        if (i < arr.length - 1) cr.appendChild(el('<span class="crumb-sep">›</span>'));
      });
      body.querySelector('.back').disabled = hist.length < 2;
      body.querySelector('.up').disabled = FS.get(cwd).parent == null;
      renderList();
    }
    function renderList() {
      const list = body.querySelector('.fc-list'); list.innerHTML = '';
      list.className = 'fc-list ex-content details';
      list.appendChild(el(`<div class="dt-head"><span>Navn</span><span>Endringsdato</span><span>Type</span><span>Størrelse</span></div>`));
      const exts = curExts();
      let items = FS.children(cwd).filter(n => n.type === 'folder' || !exts.length || exts.includes(FS.ext(n.name)));
      items.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name, 'nb') : a.type === 'folder' ? -1 : 1));
      if (!items.length) list.appendChild(el('<div class="empty">Ingen elementer samsvarer med søket.</div>'));
      items.forEach(n => {
        const r = el(`<div class="row${selected === n.id ? ' selected' : ''}"><div class="name"><span class="ico">${Icons.node(n, 20)}</span><span>${esc(FS.displayName(n, Explorer.settings.showExt))}</span></div><div class="col">${fmtDate(n.modified)}</div><div class="col">${esc(Icons.typeName(n))}</div><div class="col">${n.type === 'file' ? fmtSize(n.size) : ''}</div></div>`);
        r.addEventListener('click', () => {
          selected = n.id;
          list.querySelectorAll('.row').forEach(x => x.classList.toggle('selected', x === r));
          if (n.type === 'file') nameIn.value = mode === 'save' ? FS.base(n.name) : n.name;
          if (mode === 'folder') nameIn.value = n.type === 'folder' ? n.name : '';
        });
        r.addEventListener('dblclick', () => {
          if (n.type === 'folder') navigate(n.id);
          else { selected = n.id; nameIn.value = n.name; body.submitDialog && body.submitDialog(); }
        });
        list.appendChild(r);
      });
    }
    body.querySelector('.back').addEventListener('click', () => { if (hist.length > 1) { hist.pop(); navigate(hist[hist.length - 1], false); } });
    body.querySelector('.up').addEventListener('click', () => { const p = FS.get(cwd).parent; if (p != null) navigate(p); });
    body.querySelector('.newf').addEventListener('click', async () => {
      const name = await prompt('Ny mappe', 'Navn på mappen:', 'Ny mappe', v => FS.validate(v) || (FS.hasChild(cwd, v.trim()) ? 'Det finnes allerede en mappe med dette navnet.' : null));
      if (name) { const r = FS.createFolder(cwd, name, { via: 'dialog' }); if (r.error) Toast.show(r.error); else navigate(r.id); }
    });
    nameIn.addEventListener('input', () => { err.textContent = ''; });

    render();
    return show({
      title: o.title || (mode === 'save' ? 'Lagre som' : 'Åpne'),
      body, cls: 'dlg-fc',
      buttons: [{ label: mode === 'save' ? 'Lagre' : mode === 'folder' ? 'Velg mappe' : 'Åpne', value: 'ok', primary: true }, { label: 'Avbryt', value: null }],
      validate: async () => {
        let name = nameIn.value.trim();
        if (mode === 'folder') {
          const sel = selected ? FS.get(selected) : null;
          const fid = sel && sel.type === 'folder' ? sel.id : cwd;
          Bus.emit('dialog-open-folder', { folderId: fid, name: FS.get(fid).name });
          return { folderId: fid, name: FS.get(fid).name };
        }
        if (mode === 'save') {
          const v = FS.validate(name); if (v) { err.textContent = v; return false; }
          const exts = curExts();
          if (exts.length && !exts.includes(FS.ext(name))) name += '.' + exts[0];
          const ex = FS.children(cwd).find(c => c.name.toLowerCase() === name.toLowerCase());
          if (ex && ex.type === 'folder') { err.textContent = 'Det finnes en mappe med dette navnet.'; return false; }
          if (ex) { const ok = await confirm('Bekreft Lagre som', `«${name}» finnes allerede. Vil du erstatte den?`); if (!ok) return false; }
          Bus.emit('dialog-save', { folderId: cwd, name });
          return { folderId: cwd, name };
        }
        let n = selected ? FS.get(selected) : null;
        if (!n || n.type !== 'file') n = FS.children(cwd).find(c => c.type === 'file' && (c.name.toLowerCase() === name.toLowerCase() || FS.base(c.name).toLowerCase() === name.toLowerCase())) || null;
        if (!n) { err.textContent = name ? `Finner ikke filen «${name}» i denne mappen.` : 'Velg en fil først.'; return false; }
        Bus.emit('dialog-open-file', { nodeId: n.id, name: n.name, folderId: cwd });
        return { nodeId: n.id, name: n.name };
      }
    });
  }

  function properties(n) {
    const kids = n.type === 'folder' ? FS.findAll(() => true).filter(c => FS.isDesc(c.id, n.id) && c.id !== n.id) : [];
    const rows = [
      ['Navn', n.name], ['Type', Icons.typeName(n)],
      ['Plassering', FS.pathString(n.parent != null ? n.parent : n.id)],
      n.type === 'file' ? ['Størrelse', fmtSize(n.size)] : ['Inneholder', `${kids.filter(k => k.type === 'file').length} filer, ${kids.filter(k => k.type === 'folder').length} mapper`],
      ['Endret', fmtDate(n.modified)]
    ];
    if (n.type === 'file' && FS.ext(n.name)) rows.push(['Åpnes med', Icons.program(n)]);
    Bus.emit('properties', { id: n.id, name: n.name });
    return show({
      title: 'Egenskaper for ' + FS.displayName(n, Explorer.settings.showExt),
      body: `<div class="prop-head">${Icons.bigIcon(n, 32)} ${esc(n.name)}</div><table class="prop-table">${rows.map(r => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</table>`,
      buttons: [{ label: 'OK', value: true, primary: true }], escapeValue: true
    });
  }

  return { show, isOpen, alert, confirm, prompt, saveChanges, fileChooser, properties };
})();
