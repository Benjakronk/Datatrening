/* Kode: en enkel VS Code-lignende editor med filtre, faner, linjenumre, syntaksfarger og Kjør-knapp */
const Kode = (() => {
  const instances = [];
  const LANG = { py: 'Python', ps1: 'PowerShell', js: 'JavaScript', html: 'HTML', css: 'CSS', json: 'JSON', md: 'Markdown', txt: 'Ren tekst', csv: 'CSV' };
  const PY_KW = 'False|None|True|and|as|assert|break|class|continue|def|del|elif|else|except|finally|for|from|global|if|import|in|is|lambda|not|or|pass|raise|return|try|while|with|yield';
  const PY_BI = 'print|input|int|str|float|len|range|list|dict|set|tuple|open|abs|round|min|max|sum|sorted|enumerate|type|bool|chr|ord|zip|reversed|isinstance|exit|quit';
  const RX = {
    py: new RegExp(`(#.*)|(f?"(?:[^"\\\\]|\\\\.)*"|f?'(?:[^'\\\\]|\\\\.)*')|\\b(\\d+(?:\\.\\d+)?)\\b|\\b(${PY_KW})\\b|\\b(${PY_BI})(?=\\()|(?<=\\bdef\\s+)([A-Za-z_]\\w*)`, 'g'),
    ps1: /(#.*)|("(?:[^"\\]|\\.)*"|'[^']*')|(\$\w+|\$env:\w+)|\b(\d+(?:\.\d+)?)\b|\b(if|else|elseif|foreach|for|while|function|return|param|switch|try|catch|do|until)\b|\b([A-Z][a-z]+-[A-Z]\w+)\b|(\s-[A-Za-z]+)/g,
    js: /(\/\/.*)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`)|\b(\d+(?:\.\d+)?)\b|\b(const|let|var|function|return|if|else|for|while|true|false|null|new|class|import|export)\b|\b(console|document|window)\b/g
  };
  const CLS = ['k-c', 'k-s', 'k-n', 'k-k', 'k-b', 'k-f', 'k-p'];
  function highlight(text, ext) {
    const rx = ext === 'py' ? RX.py : ext === 'ps1' ? RX.ps1 : ext === 'js' ? RX.js : null;
    if (!rx) return esc(text) + '\n';
    let out = '', last = 0;
    for (const m of text.matchAll(rx)) {
      out += esc(text.slice(last, m.index));
      let cls = 'k-p';
      if (ext === 'ps1') cls = m[1] ? 'k-c' : m[2] ? 'k-s' : m[3] ? 'k-v' : m[4] ? 'k-n' : m[5] ? 'k-k' : m[6] ? 'k-f' : 'k-o';
      else if (ext === 'js') cls = m[1] ? 'k-c' : m[2] ? 'k-s' : m[3] ? 'k-n' : m[4] ? 'k-k' : 'k-b';
      else { for (let i = 1; i < m.length; i++) if (m[i] !== undefined) { cls = CLS[i - 1]; break; } }
      out += `<span class="${cls}">${esc(m[0])}</span>`;
      last = m.index + m[0].length;
    }
    return out + esc(text.slice(last)) + '\n';
  }

  class Editor {
    constructor() {
      this.folderId = null; this.tabs = []; this.cur = null; this.expanded = new Set();
      this.root = el(`<div class="kode">
        <div class="k-menu"><button data-a="new">Ny fil</button><button data-a="openfolder">Åpne mappe</button><button data-a="save">Lagre</button><span class="k-spacer"></span><span class="k-hint"><kbd>Ctrl</kbd>+<kbd>S</kbd> lagrer · <kbd>Tab</kbd> = 4 mellomrom</span><button class="k-run" data-a="run" title="Kjør filen i terminalen">▶ Kjør</button></div>
        <div class="k-body">
          <div class="k-side"><div class="k-side-h"><span>UTFORSKER</span><span class="k-side-btns"><button data-a="newfile" title="Ny fil">＋</button><button data-a="newfolder" title="Ny mappe">🗀</button></span></div><div class="k-tree"></div></div>
          <div class="k-main">
            <div class="k-tabs"></div>
            <div class="k-editor"><div class="k-gutter"></div><div class="k-wrap"><pre class="k-hl"></pre><textarea class="k-ta" spellcheck="false" autocomplete="off" autocapitalize="off"></textarea></div><div class="k-empty">Åpne en mappe med <code>code .</code> i terminalen, eller lag en ny fil.</div></div>
            <div class="k-status"><span class="k-file"></span><span class="k-spacer"></span><span class="k-pos">Ln 1, Col 1</span><span class="k-lang"></span></div>
          </div>
        </div>
      </div>`);
      this.ta = this.root.querySelector('.k-ta'); this.hl = this.root.querySelector('.k-hl'); this.gutter = this.root.querySelector('.k-gutter');
      this.win = WM.create({ app: 'kode', title: 'Kode', body: this.root, width: 1000, height: 640, onClose: () => this.closeAll() });
      this.win.onClosed = () => { const i = instances.indexOf(this); if (i >= 0) instances.splice(i, 1); };
      this.win.kode = this;
      this.win.onKey = e => { if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); this.save('shortcut'); } };
      instances.push(this);
      this.root.querySelector('.k-menu').addEventListener('click', e => { const a = e.target.dataset.a; if (a) this.action(a); });
      this.root.querySelector('.k-side-h').addEventListener('click', e => { const a = e.target.dataset.a; if (a === 'newfile') this.action('new'); if (a === 'newfolder') this.newFolder(this.folderId); });
      this.ta.addEventListener('input', () => { const t = this.curTab(); if (!t) return; t.content = this.ta.value; if (!t.dirty) { t.dirty = true; this.renderTabs(); } this.renderHl(); Bus.emit('kode-input', { name: this.nodeName(t), text: this.ta.value }); });
      this.ta.addEventListener('scroll', () => { this.hl.parentElement.scrollTop = 0; this.hl.style.transform = `translate(${-this.ta.scrollLeft}px, ${-this.ta.scrollTop}px)`; this.gutter.style.transform = `translateY(${-this.ta.scrollTop}px)`; });
      this.ta.addEventListener('keydown', e => this.onKey(e));
      this.ta.addEventListener('keyup', () => this.renderStatus()); this.ta.addEventListener('click', () => this.renderStatus());
      this.ta.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation();
        const hasSel = this.ta.selectionStart !== this.ta.selectionEnd;
        Ctx.show(e.clientX, e.clientY, [
          { label: 'Klipp ut', kbd: 'Ctrl+X', disabled: !hasSel, action: () => { this.ta.focus(); document.execCommand('cut'); } },
          { label: 'Kopier', kbd: 'Ctrl+C', disabled: !hasSel, action: () => { this.ta.focus(); document.execCommand('copy'); } },
          { label: 'Lim inn', kbd: 'Ctrl+V', action: () => { this.ta.focus(); if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => { this.ta.setRangeText(t, this.ta.selectionStart, this.ta.selectionEnd, 'end'); this.ta.dispatchEvent(new Event('input')); }).catch(() => Toast.show('Bruk Ctrl+V for å lime inn.')); } },
          '-',
          { label: 'Kommenter ut / inn', kbd: 'Ctrl+/', action: () => this.toggleComment() },
          { label: 'Merk alt', kbd: 'Ctrl+A', action: () => { this.ta.focus(); this.ta.select(); } },
          '-',
          { label: 'Kjør filen', kbd: 'F5', action: () => this.action('run') }
        ], 'editor', 'koden i Kode');
      });
      this.fsHandler = (type, d) => { if (type === 'fs') Coalesce.schedule(this, () => this.onFs()); };
      Bus.on(this.fsHandler);
      this.render();
    }
    curTab() { return this.tabs.find(t => t.id === this.cur) || null; }
    nodeName(t) { const n = FS.get(t.id); return n ? n.name : t.name; }
    ext(t) { return FS.ext(this.nodeName(t)); }
    onFs() {
      if (!instances.includes(this)) return;
      this.tabs = this.tabs.filter(t => FS.get(t.id));
      if (this.cur != null && !this.tabs.find(t => t.id === this.cur)) this.cur = this.tabs.length ? this.tabs[this.tabs.length - 1].id : null;
      if (this.folderId != null && !FS.get(this.folderId)) this.folderId = null;
      this.render();
    }
    /* ----- åpne ----- */
    openFolder(id) {
      if (!FS.get(id)) return;
      this.folderId = id; this.expanded.add(id);
      WM.setTitle(this.win, FS.get(id).name + ' - Kode');
      this.render();
    }
    openFile(id) {
      const n = FS.get(id); if (!n || n.type !== 'file') return;
      if (this.folderId == null || !FS.isDesc(id, this.folderId)) { if (this.folderId == null) this.openFolder(n.parent); }
      let t = this.tabs.find(x => x.id === id);
      if (!t) { t = { id, name: n.name, content: n.content || '', dirty: false }; this.tabs.push(t); if (this.tabs.length > 12) { const old = this.tabs.find(x => !x.dirty && x.id !== id); if (old) this.tabs.splice(this.tabs.indexOf(old), 1); } }
      this.cur = id;
      this.render();
      setTimeout(() => this.ta.focus(), 30);
    }
    async closeTab(id) {
      const t = this.tabs.find(x => x.id === id); if (!t) return true;
      if (t.dirty) {
        const r = await Dialog.saveChanges(this.nodeName(t));
        Bus.emit('save-dialog', { choice: r, name: this.nodeName(t), app: 'kode' });
        if (r === 'cancel') return false;
        if (r === 'save') { const ok = this.saveTab(t, 'dialog'); if (!ok) return false; }
      }
      this.tabs.splice(this.tabs.indexOf(t), 1);
      if (this.cur === id) this.cur = this.tabs.length ? this.tabs[this.tabs.length - 1].id : null;
      this.render();
      return true;
    }
    async closeAll() { for (const t of this.tabs.slice()) { const ok = await this.closeTab(t.id); if (!ok) return false; } Bus.off && Bus.off(this.fsHandler); const i = Bus.handlers.indexOf(this.fsHandler); if (i >= 0) Bus.handlers.splice(i, 1); return true; }
    /* ----- lagre / kjøre ----- */
    saveTab(t, via) {
      const n = FS.get(t.id); if (!n) { Toast.show('Filen finnes ikke lenger.'); return false; }
      const r = FS.write(n.id, t.content);
      if (r && r.error) { Dialog.alert('Kunne ikke lagre', r.error); return false; }
      t.dirty = false; this.renderTabs(); this.renderStatus();
      Bus.emit('kode-save', { id: n.id, name: n.name, content: t.content, via });
      return true;
    }
    save(via) { const t = this.curTab(); if (!t) return false; const ok = this.saveTab(t, via); if (ok) Toast.show('Lagret: ' + this.nodeName(t)); return ok; }
    async action(a) {
      if (a === 'new') return this.newFile(this.folderId);
      if (a === 'save') return this.save('menu');
      if (a === 'openfolder') { const r = await Dialog.fileChooser({ mode: 'folder', title: 'Åpne mappe', start: this.folderId || FS.roots().documents }); if (r && r.folderId) { this.openFolder(r.folderId); Bus.emit('kode-open', { folderId: r.folderId, name: FS.get(r.folderId).name, via: 'dialog' }); } return; }
      if (a === 'run') {
        const t = this.curTab(); if (!t) { Toast.show('Åpne en fil først.'); return; }
        const e = this.ext(t);
        if (!['py', 'ps1'].includes(e)) { Toast.show('Bare .py og .ps1 kan kjøres. Filen er .' + e); return; }
        if (t.dirty && !this.saveTab(t, 'run')) return;
        Bus.emit('kode-run', { id: t.id, name: this.nodeName(t) });
        if (window.Terminal) Terminal.runFile(t.id);
      }
    }
    async newFile(folderId) {
      if (folderId == null) { const r = await Dialog.fileChooser({ mode: 'folder', title: 'Velg mappe for den nye filen', start: FS.roots().documents }); if (!r) return; folderId = r.folderId; this.openFolder(folderId); }
      const name = await Dialog.prompt('Ny fil', 'Filnavn (for eksempel hei.py):', '', v => FS.validate(v) || (FS.hasChild(folderId, v.trim()) ? 'Det finnes allerede en fil med dette navnet.' : null) || (!FS.ext(v.trim()) ? 'Ta med filendelsen, for eksempel .py' : null));
      if (!name) return;
      const r = FS.createFile(folderId, name, '', { via: 'kode' });
      if (r.error) { Toast.show(r.error); return; }
      this.expanded.add(folderId);
      Bus.emit('kode-new-file', { id: r.id, name: r.name, folderId });
      this.openFile(r.id);
    }
    async newFolder(folderId) {
      if (folderId == null) { Toast.show('Åpne en mappe først.'); return; }
      const name = await Dialog.prompt('Ny mappe', 'Mappenavn:', '', v => FS.validate(v) || (FS.hasChild(folderId, v.trim()) ? 'Det finnes allerede en mappe med dette navnet.' : null));
      if (!name) return;
      const r = FS.createFolder(folderId, name, { via: 'kode' });
      if (r.error) { Toast.show(r.error); return; }
      this.expanded.add(folderId); this.render();
    }
    /* ----- tastatur ----- */
    onKey(e) {
      const ta = this.ta;
      if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); e.stopPropagation(); this.save('shortcut'); Bus.emit('shortcut', { key: 's', ctrl: true, app: 'kode' }); return; }
      if (e.key === 'F5') { e.preventDefault(); this.action('run'); return; }
      if (e.ctrlKey && e.key === '/') { e.preventDefault(); this.toggleComment(); return; }
      if (e.key === 'Tab') {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd, v = ta.value;
        if (s !== en && v.slice(s, en).includes('\n')) {
          const ls = v.lastIndexOf('\n', s - 1) + 1;
          const block = v.slice(ls, en);
          const nb = e.shiftKey ? block.replace(/^ {1,4}/gm, '') : block.replace(/^/gm, '    ');
          ta.setRangeText(nb, ls, en, 'select');
        } else if (e.shiftKey) {
          const ls = v.lastIndexOf('\n', s - 1) + 1; const m = /^ {1,4}/.exec(v.slice(ls)); if (m) { ta.setRangeText('', ls, ls + m[0].length, 'end'); ta.setSelectionRange(Math.max(ls, s - m[0].length), Math.max(ls, s - m[0].length)); }
        } else ta.setRangeText('    ', s, en, 'end');
        ta.dispatchEvent(new Event('input')); return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        const s = ta.selectionStart, v = ta.value;
        const ls = v.lastIndexOf('\n', s - 1) + 1; const line = v.slice(ls, s);
        let ind = (/^\s*/.exec(line) || [''])[0];
        const ext = this.curTab() ? this.ext(this.curTab()) : '';
        if ((ext === 'py' && /:\s*$/.test(line)) || (ext !== 'py' && /[{(\[]\s*$/.test(line))) ind += '    ';
        ta.setRangeText('\n' + ind, s, ta.selectionEnd, 'end');
        ta.dispatchEvent(new Event('input')); return;
      }
      if (e.key === 'Escape') e.stopPropagation();
    }
    toggleComment() {
      const ta = this.ta, v = ta.value, s = ta.selectionStart, en = ta.selectionEnd;
      const ls = v.lastIndexOf('\n', s - 1) + 1; const le = v.indexOf('\n', en) < 0 ? v.length : v.indexOf('\n', en);
      const block = v.slice(ls, le);
      const ext = this.curTab() ? this.ext(this.curTab()) : 'py'; const c = ext === 'js' ? '//' : '#';
      const allC = block.split('\n').every(l => !l.trim() || l.trim().startsWith(c));
      const nb = block.split('\n').map(l => !l.trim() ? l : allC ? l.replace(new RegExp('^(\\s*)' + c.replace('/', '\\/') + ' ?'), '$1') : l.replace(/^(\s*)/, '$1' + c + ' ')).join('\n');
      ta.setRangeText(nb, ls, le, 'select'); ta.dispatchEvent(new Event('input'));
    }
    /* ----- tegning ----- */
    render() { this.renderTree(); this.renderTabs(); this.renderEditor(); }
    renderTree() {
      const tree = this.root.querySelector('.k-tree'); tree.innerHTML = '';
      if (this.folderId == null) { tree.appendChild(el('<div class="k-tree-empty">Ingen mappe er åpnet.<br><br>Skriv <code>code .</code> i terminalen, eller klikk «Åpne mappe».</div>')); return; }
      const rootN = FS.get(this.folderId);
      const head = el(`<div class="k-tree-root">${esc(rootN.name.toUpperCase())}</div>`);
      head.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); this.folderMenu(e, rootN.id); });
      tree.appendChild(head);
      const walk = (id, depth) => {
        const kids = FS.children(id).slice().sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name, 'nb') : a.type === 'folder' ? -1 : 1);
        kids.forEach(n => {
          const open = this.expanded.has(n.id);
          const row = el(`<div class="k-row${n.type === 'file' && n.id === this.cur ? ' active' : ''}" style="padding-left:${8 + depth * 12}px"><span class="k-tw">${n.type === 'folder' ? (open ? '▾' : '▸') : ''}</span><span class="k-ico">${n.type === 'folder' ? '' : Icons.file(FS.ext(n.name), 14)}</span><span class="k-nm">${esc(n.name)}</span>${this.tabs.find(t => t.id === n.id && t.dirty) ? '<span class="k-dot">●</span>' : ''}</div>`);
          row.addEventListener('click', () => { if (n.type === 'folder') { if (open) this.expanded.delete(n.id); else this.expanded.add(n.id); this.renderTree(); } else this.openFile(n.id); });
          row.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); if (n.type === 'folder') this.folderMenu(e, n.id); else this.fileMenu(e, n); });
          tree.appendChild(row);
          if (n.type === 'folder' && open && depth < 10) walk(n.id, depth + 1);
        });
      };
      walk(rootN.id, 1);
    }
    folderMenu(e, id) {
      Ctx.show(e.clientX, e.clientY, [
        { label: 'Ny fil …', action: () => this.newFile(id) },
        { label: 'Ny mappe …', action: () => this.newFolder(id) },
        '-',
        { label: 'Åpne i terminal', action: () => { if (window.Terminal) { const t = Terminal.active() || Terminal.open(id); if (t) { WM.focus(t.win); t.submit('cd "' + Terminal.pathOf({ id }) + '"'); } } } },
        { label: 'Vis i Filutforsker', action: () => Explorer.open(id) },
        '-',
        { label: 'Gi nytt navn …', disabled: id === this.folderId, action: async () => { const n = FS.get(id); const v = await Dialog.prompt('Gi nytt navn', 'Nytt navn:', n.name); if (v) { const r = FS.rename(id, v, { via: 'kode' }); if (r.error) Toast.show(r.error); } } },
        { label: 'Slett', disabled: id === this.folderId, action: async () => { const n = FS.get(id); if (await Dialog.confirm('Slett', `Flytte mappen «${n.name}» til papirkurven?`)) { const r = FS.remove(id, { via: 'kode' }); if (r && r.error) Toast.show(r.error); } } }
      ], 'kode-folder', 'mappen i Kode-utforskeren');
    }
    fileMenu(e, n) {
      const runnable = ['py', 'ps1'].includes(FS.ext(n.name));
      Ctx.show(e.clientX, e.clientY, [
        { label: 'Åpne', action: () => this.openFile(n.id) },
        { label: 'Kjør i terminalen', disabled: !runnable, action: () => { const t = this.tabs.find(x => x.id === n.id); if (t && t.dirty) this.saveTab(t, 'run'); Bus.emit('kode-run', { id: n.id, name: n.name }); if (window.Terminal) Terminal.runFile(n.id); } },
        '-',
        { label: 'Vis i Filutforsker', action: () => Explorer.open(n.parent, { select: n.id }) },
        { label: 'Kopier sti', action: () => { const p = window.Terminal ? Terminal.pathOf({ id: n.id }) : FS.pathString(n.id); if (navigator.clipboard) navigator.clipboard.writeText(p).catch(() => {}); Toast.show('Kopierte: ' + p); } },
        '-',
        { label: 'Gi nytt navn …', action: async () => { const v = await Dialog.prompt('Gi nytt navn', 'Nytt navn:', n.name); if (v) { const r = FS.rename(n.id, v, { via: 'kode' }); if (r.error) Toast.show(r.error); } } },
        { label: 'Slett', action: async () => { if (await Dialog.confirm('Slett', `Flytte «${n.name}» til papirkurven?`)) { const t = this.tabs.find(x => x.id === n.id); if (t) { this.tabs.splice(this.tabs.indexOf(t), 1); if (this.cur === n.id) this.cur = null; } const r = FS.remove(n.id, { via: 'kode' }); if (r && r.error) Toast.show(r.error); } } }
      ], 'kode-file', 'filen i Kode-utforskeren');
    }
    renderTabs() {
      const tabs = this.root.querySelector('.k-tabs'); tabs.innerHTML = '';
      this.tabs.forEach(t => {
        const d = el(`<div class="k-tab${t.id === this.cur ? ' active' : ''}"><span class="k-ico">${Icons.file(this.ext(t), 14)}</span><span>${esc(this.nodeName(t))}</span><span class="k-close" title="Lukk">${t.dirty ? '●' : '✕'}</span></div>`);
        d.addEventListener('click', e => { if (e.target.classList.contains('k-close')) { this.closeTab(t.id); return; } this.cur = t.id; this.render(); });
        d.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); Ctx.show(e.clientX, e.clientY, [{ label: 'Lukk', action: () => this.closeTab(t.id) }, { label: 'Lukk alle', action: async () => { for (const x of this.tabs.slice()) { if (!(await this.closeTab(x.id))) break; } } }, '-', { label: 'Lagre', kbd: 'Ctrl+S', action: () => this.saveTab(t, 'menu') }], 'kode-tab', 'fanen i Kode'); });
        tabs.appendChild(d);
      });
    }
    renderEditor() {
      const t = this.curTab();
      this.root.querySelector('.k-empty').classList.toggle('hidden', !!t);
      this.root.querySelector('.k-editor').classList.toggle('has-file', !!t);
      if (!t) { this.ta.value = ''; this.hl.innerHTML = ''; this.gutter.innerHTML = ''; this.root.querySelector('.k-file').textContent = ''; this.root.querySelector('.k-lang').textContent = ''; return; }
      if (this.ta.value !== t.content) this.ta.value = t.content;
      this.renderHl(); this.renderStatus();
    }
    renderHl() {
      const t = this.curTab(); if (!t) return;
      const ext = this.ext(t);
      this.hl.innerHTML = highlight(this.ta.value, ext);
      const n = this.ta.value.split('\n').length;
      let g = ''; for (let i = 1; i <= n; i++) g += i + '\n';
      this.gutter.textContent = g;
      this.hl.style.transform = `translate(${-this.ta.scrollLeft}px, ${-this.ta.scrollTop}px)`;
      this.gutter.style.transform = `translateY(${-this.ta.scrollTop}px)`;
    }
    renderStatus() {
      const t = this.curTab(); if (!t) return;
      const v = this.ta.value.slice(0, this.ta.selectionStart); const ln = v.split('\n').length; const col = v.length - v.lastIndexOf('\n');
      this.root.querySelector('.k-pos').textContent = `Ln ${ln}, Col ${col}`;
      this.root.querySelector('.k-lang').textContent = LANG[this.ext(t)] || this.ext(t).toUpperCase();
      this.root.querySelector('.k-file').textContent = (t.dirty ? '● ' : '') + (window.Terminal ? Terminal.pathOf({ id: t.id }) : FS.pathString(t.id));
    }
  }

  function open(o = {}) {
    let k = instances[0];
    if (!k) { if (WM.full()) return null; k = new Editor(); }
    if (o.folderId != null) k.openFolder(o.folderId);
    if (o.fileId != null) k.openFile(o.fileId);
    WM.focus(k.win, o.via || 'open');
    Bus.emit('kode-open', { folderId: k.folderId, name: k.folderId != null && FS.get(k.folderId) ? FS.get(k.folderId).name : null, fileId: o.fileId != null ? o.fileId : null, fileName: o.fileId != null && FS.get(o.fileId) ? FS.get(o.fileId).name : null, via: o.via });
    return k;
  }
  function activeText() { const k = instances[0]; if (!k) return ''; return k.ta.value; }
  function activeFile() { const k = instances[0]; const t = k && k.curTab(); return t ? k.nodeName(t) : ''; }
  return { open, activeText, activeFile, highlight, instances };
})();
window.Kode = Kode;
