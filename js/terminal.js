/* Terminal: PowerShell-simulering mot det virtuelle filsystemet.
   Mappene vises med engelske navn slik en ekte Windows-PC gjør i terminalen
   (Dokumenter = Documents, Skrivebord = Desktop osv.). */
const Terminal = (() => {
  const HOME = 'C:\\Users\\Elev';
  const VIRT = {
    'C:': [['Program Files', 'd'], ['Users', 'd'], ['Windows', 'd']],
    'C:\\Users': [['Elev', 'd'], ['Public', 'd']],
    'C:\\Windows': [['System32', 'd'], ['explorer.exe', 'f'], ['notepad.exe', 'f']],
    'C:\\Program Files': [['Microsoft Office', 'd'], ['PowerShell', 'd'], ['Python312', 'd']],
    'C:\\Users\\Public': [], 'C:\\Windows\\System32': [], 'C:\\Program Files\\Microsoft Office': [], 'C:\\Program Files\\PowerShell': [], 'C:\\Program Files\\Python312': [['python.exe', 'f']]
  };
  const ALIASES = {
    cd: 'Set-Location', chdir: 'Set-Location', sl: 'Set-Location', pwd: 'Get-Location', gl: 'Get-Location',
    ls: 'Get-ChildItem', dir: 'Get-ChildItem', gci: 'Get-ChildItem', ni: 'New-Item', mkdir: 'mkdir', md: 'mkdir',
    rm: 'Remove-Item', del: 'Remove-Item', ri: 'Remove-Item', rmdir: 'Remove-Item', rd: 'Remove-Item', erase: 'Remove-Item',
    mv: 'Move-Item', move: 'Move-Item', mi: 'Move-Item', cp: 'Copy-Item', copy: 'Copy-Item', cpi: 'Copy-Item',
    ren: 'Rename-Item', rni: 'Rename-Item', cat: 'Get-Content', type: 'Get-Content', gc: 'Get-Content',
    sc: 'Set-Content', ac: 'Add-Content', echo: 'Write-Output', write: 'Write-Output', cls: 'Clear-Host', clear: 'Clear-Host',
    help: 'Get-Help', man: 'Get-Help', gal: 'Get-Alias', gcm: 'Get-Command', sls: 'Select-String', measure: 'Measure-Object',
    py: 'python', python3: 'python', more: 'more'
  };
  const HELP = {
    'Get-Location': 'Get-Location (pwd)\n  Viser hvilken mappe du står i.',
    'Set-Location': 'Set-Location (cd) <sti>\n  Bytter mappe.\n  cd Documents      gå inn i Documents\n  cd ..             ett nivå opp\n  cd ~              hjem (C:\\Users\\Elev)\n  cd "Min mappe"    navn med mellomrom må ha anførselstegn',
    'Get-ChildItem': 'Get-ChildItem (ls, dir) [sti]\n  Lister filer og mapper.\n  ls                mappen du står i\n  ls Documents      en annen mappe\n  ls *.py           bare Python-filer\n  ls -Name          bare navnene\n  ls -Recurse       også undermapper',
    'New-Item': 'New-Item (ni) <navn>\n  Lager en ny fil.\n  New-Item hei.py\n  New-Item -ItemType Directory Kode   lager en mappe (eller bruk mkdir Kode)',
    mkdir: 'mkdir <navn>\n  Lager en ny mappe.',
    'Remove-Item': 'Remove-Item (rm, del) <sti>\n  Sletter en fil eller mappe. NB: i terminalen går det IKKE via papirkurven.\n  rm gammel.txt\n  rm -Recurse mappe    sletter mappen med alt innhold',
    'Move-Item': 'Move-Item (mv) <fra> <til>\n  Flytter (eller gir nytt navn).\n  mv hei.py Kode\\       flytt inn i mappen Kode\n  mv hei.py hallo.py    nytt navn',
    'Copy-Item': 'Copy-Item (cp) <fra> <til>\n  Kopierer.\n  cp hei.py kopi.py\n  cp -Recurse Kode Kode2   kopier en hel mappe',
    'Rename-Item': 'Rename-Item (ren) <sti> <nytt navn>\n  Gir nytt navn.',
    'Get-Content': 'Get-Content (cat, type) <fil>\n  Viser innholdet i en fil.',
    'Set-Content': 'Set-Content <fil> <tekst>\n  Skriver tekst til en fil (erstatter innholdet).',
    'Add-Content': 'Add-Content <fil> <tekst>\n  Legger til tekst nederst i en fil.',
    'Write-Output': 'Write-Output (echo) <tekst>\n  Skriver tekst til skjermen. Med > kan du sende den til en fil:\n  echo "hei" > fil.txt',
    'Write-Host': 'Write-Host <tekst>\n  Skriver tekst til skjermen (brukes i skript).',
    'Clear-Host': 'Clear-Host (cls, clear)\n  Tømmer skjermen.',
    'Get-Help': 'Get-Help (help) <kommando>\n  Viser hjelp for en kommando.',
    'Get-Alias': 'Get-Alias (gal) [alias]\n  Viser hvilke kommandoer et kortnavn står for. ls = Get-ChildItem osv.',
    'Get-Command': 'Get-Command\n  Lister kommandoene som finnes.',
    python: 'python <fil.py>\n  Kjører et Python-program.\n  python --version   viser versjonen',
    code: 'code <mappe eller fil>\n  Åpner Kode-editoren.\n  code .        åpner mappen du står i\n  code hei.py   åpner en fil',
    explorer: 'explorer <mappe>\n  Åpner Filutforsker.\n  explorer .    mappen du står i',
    tree: 'tree\n  Tegner mappestrukturen som et tre.',
    'Test-Path': 'Test-Path <sti>\n  Svarer True hvis stien finnes, ellers False.',
    'Select-String': 'Select-String (sls) <tekst> <fil>\n  Søker etter tekst i filer. Kan også brukes etter |:\n  ls | Select-String py',
    'Measure-Object': 'Measure-Object (measure)\n  Teller. ls | measure   teller elementer',
    'Get-Date': 'Get-Date\n  Viser dato og klokkeslett.',
    exit: 'exit\n  Lukker terminalen.'
  };
  const COMMANDS = Object.keys(HELP).concat(['whoami', 'hostname', 'notepad', 'Get-Item', 'Get-History', 'history']);

  const R = () => FS.roots();
  function termName(n) { const r = R(); return n.id === r.desktop ? 'Desktop' : n.id === r.documents ? 'Documents' : n.id === r.downloads ? 'Downloads' : n.id === r.pictures ? 'Pictures' : n.id === r.onedrive ? 'OneDrive' : n.name; }
  function pathOf(loc) {
    if (loc.virt) return loc.virt === 'C:' ? 'C:\\' : loc.virt;
    const r = R(); const parts = []; let n = FS.get(loc.id);
    while (n && n.id !== r.pc) { parts.unshift(termName(n)); n = n.parent != null ? FS.get(n.parent) : null; }
    return HOME + (parts.length ? '\\' + parts.join('\\') : '');
  }
  function parentOf(loc) {
    const r = R();
    if (loc.virt) { if (loc.virt === 'C:') return loc; const i = loc.virt.lastIndexOf('\\'); return { virt: i <= 2 ? 'C:' : loc.virt.slice(0, i) }; }
    if (loc.id === r.pc) return { virt: 'C:\\Users' };
    if (loc.id === r.onedrive) return { id: r.pc };
    const n = FS.get(loc.id); return n && n.parent != null ? { id: n.parent } : { id: r.pc };
  }
  function childOf(loc, name) {
    const r = R(); const l = name.toLowerCase();
    if (loc.virt) {
      if (loc.virt === 'C:\\Users' && l === 'elev') return { id: r.pc };
      const list = VIRT[loc.virt] || [];
      const hit = list.find(e => e[0].toLowerCase() === l);
      if (!hit) return null;
      const p = loc.virt === 'C:' ? 'C:\\' + hit[0] : loc.virt + '\\' + hit[0];
      return hit[1] === 'd' ? { virt: p } : { virt: p, file: true };
    }
    const n = FS.get(loc.id); if (!n || n.type !== 'folder') return null;
    if (loc.id === r.pc && l === 'onedrive') return { id: r.onedrive };
    const c = FS.children(loc.id).find(x => termName(x).toLowerCase() === l);
    return c ? { id: c.id } : null;
  }
  function isDir(loc) { if (!loc) return false; if (loc.virt) return !loc.file; const n = FS.get(loc.id); return !!n && n.type === 'folder'; }
  function isFile(loc) { if (!loc) return false; if (loc.virt) return !!loc.file; const n = FS.get(loc.id); return !!n && n.type === 'file'; }
  function clean(p) { return (p || '').trim().replace(/\//g, '\\'); }
  function resolve(cwd, p) {
    p = clean(p);
    let base, segs;
    if (/^[a-zA-Z]:/.test(p)) { if (p[0].toUpperCase() !== 'C') return null; base = { virt: 'C:' }; segs = p.slice(2).split('\\'); }
    else if (p === '~' || p.startsWith('~\\')) { base = { id: R().pc }; segs = p.slice(1).split('\\'); }
    else if (p.startsWith('\\')) { base = { virt: 'C:' }; segs = p.split('\\'); }
    else { base = cwd; segs = p.split('\\'); }
    let cur = base;
    for (const s of segs) { if (s === '' || s === '.') continue; if (s === '..') cur = parentOf(cur); else { if (!isDir(cur)) return null; cur = childOf(cur, s); } if (!cur) return null; }
    return cur;
  }
  /* For kommandoer som lager noe: finn foreldremappen og navnet på det nye elementet */
  function resolveParent(cwd, p) {
    p = clean(p).replace(/\\+$/, '');
    const i = p.lastIndexOf('\\');
    const dir = i < 0 ? '.' : (i === 0 ? '\\' : (i === 2 && /^[a-zA-Z]:/.test(p) ? p.slice(0, 3) : p.slice(0, i)));
    const name = i < 0 ? p : p.slice(i + 1);
    const parent = resolve(cwd, dir);
    return { parent, name };
  }
  function listing(loc) {
    if (loc.virt) return (VIRT[loc.virt] || []).map(e => ({ name: e[0], type: e[1] === 'd' ? 'folder' : 'file', modified: Date.now() - 86400000 * 30, size: e[1] === 'd' ? 0 : 200000 }));
    const r = R();
    let kids = FS.children(loc.id).map(n => ({ name: termName(n), type: n.type, modified: n.modified, size: fileSize(n), node: n }));
    if (loc.id === r.pc) kids.push({ name: 'OneDrive', type: 'folder', modified: FS.get(r.onedrive).modified, size: 0, node: FS.get(r.onedrive) });
    return kids.sort((a, b) => a.type === b.type ? a.name.localeCompare(b.name, 'en') : a.type === 'folder' ? -1 : 1);
  }
  /* Tekstfiler viser ekte lengde i byte; andre filer (bilder, dokumenter) bruker den simulerte størrelsen */
  const TEXT_EXT = new Set(['py', 'ps1', 'txt', 'md', 'json', 'csv', 'html', 'css', 'js']);
  function fileSize(n) { if (n.type !== 'file') return 0; if (TEXT_EXT.has(FS.ext(n.name))) return new TextEncoder().encode(n.content || '').length; return n.size; }
  const pad = (s, n) => String(s).padEnd(n);
  const lpad = (s, n) => String(s).padStart(n);
  function fmtDate(ts) { const d = new Date(ts); const p = x => String(x).padStart(2, '0'); return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}     ${p(d.getHours())}:${p(d.getMinutes())}`; }
  function table(items, dirPath) {
    const out = ['', '    Directory: ' + dirPath, '', 'Mode                 LastWriteTime         Length Name', '----                 -------------         ------ ----'];
    items.forEach(it => out.push(pad(it.type === 'folder' ? 'd-----' : '-a----', 12) + lpad(fmtDate(it.modified), 27) + lpad(it.type === 'folder' ? '' : it.size, 15) + ' ' + it.name));
    out.push('');
    return out;
  }
  function wildcardToRegex(w) { return new RegExp('^' + w.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i'); }

  /* Deler en kommandolinje i tokens: håndterer '...' og "..." og $variabler */
  function tokenizeLine(line, vars) {
    const toks = []; let i = 0, cur = '', inTok = false, quoted = false;
    const expand = s => s.replace(/\$env:(\w+)|\$(\w+)/g, (m, envv, v) => envv ? (envv.toUpperCase() === 'USERNAME' ? 'Elev' : envv.toUpperCase() === 'USERPROFILE' ? HOME : '') : (v.toLowerCase() === 'home' ? HOME : v.toLowerCase() === 'pwd' ? vars.__pwd : (vars[v] !== undefined ? String(vars[v]) : '')));
    while (i < line.length) {
      const c = line[i];
      if (c === "'" || c === '"') {
        let j = i + 1, s = '';
        while (j < line.length && line[j] !== c) { s += line[j]; j++; }
        if (j >= line.length) return { error: 'The string is missing the terminator: ' + c + '.' };
        cur += c === '"' ? expand(s) : s; inTok = true; quoted = true; i = j + 1; continue;
      }
      if (c === ' ' || c === '\t') { if (inTok) { toks.push({ v: cur, q: quoted }); cur = ''; inTok = false; quoted = false; } i++; continue; }
      if (c === '|' || c === ';' || (c === '>' && !quoted)) {
        if (inTok) { toks.push({ v: cur, q: quoted }); cur = ''; inTok = false; quoted = false; }
        if (c === '>' && line[i + 1] === '>') { toks.push({ op: '>>' }); i += 2; continue; }
        if (c === '&' ) { i++; continue; }
        toks.push({ op: c }); i++; continue;
      }
      if (c === '&' && line[i + 1] === '&') { if (inTok) { toks.push({ v: cur, q: quoted }); cur = ''; inTok = false; quoted = false; } toks.push({ op: ';' }); i += 2; continue; }
      if (c === '$' && !quoted) { const m = /^\$(env:\w+|\w+)/.exec(line.slice(i)); if (m) { cur += expand(m[0]); inTok = true; i += m[0].length; continue; } }
      cur += c; inTok = true; i++;
    }
    if (inTok) toks.push({ v: cur, q: quoted });
    return { toks };
  }
  const VALUE_OPTS = new Set(['itemtype', 'name', 'path', 'destination', 'newname', 'value', 'pattern', 'literalpath', 'filter', 'prompt', 'foregroundcolor', 'backgroundcolor', 'include', 'exclude', 'encoding', 'first', 'last', 'head', 'tail', 'depth']);
  function parseArgs(toks) {
    const args = [], opts = {};
    for (let i = 0; i < toks.length; i++) {
      const t = toks[i];
      if (!t.q && /^-[A-Za-z]/.test(t.v)) {
        const key = t.v.slice(1).toLowerCase().replace(/:$/, '');
        if (VALUE_OPTS.has(key) && i + 1 < toks.length && !(/^-[A-Za-z]/.test(toks[i + 1].v) && !toks[i + 1].q)) { opts[key] = toks[++i].v; }
        else opts[key] = true;
      } else args.push(t.v);
    }
    return { args, opts };
  }

  /* ---------------- Terminalvinduet ---------------- */
  const instances = [];
  class Term {
    constructor(startId) {
      this.cwd = { id: startId && FS.get(startId) ? startId : R().pc };
      this.history = []; this.hi = 0; this.vars = {}; this.running = null; this.lineCount = 0; this.tabState = null;
      this.root = el(`<div class="term"><div class="term-out"></div><div class="term-line"><span class="term-prompt"></span><input class="term-in" spellcheck="false" autocomplete="off"></div></div>`);
      this.out = this.root.querySelector('.term-out'); this.input = this.root.querySelector('.term-in'); this.promptEl = this.root.querySelector('.term-prompt');
      this.win = WM.create({ app: 'terminal', title: 'PowerShell 7 – Elev', body: this.root, width: 900, height: 520, onClose: () => { if (this.running) this.abort(); return true; } });
      this.win.onClosed = () => { const i = instances.indexOf(this); if (i >= 0) instances.splice(i, 1); };
      this.win.term = this;
      instances.push(this);
      this.root.addEventListener('mousedown', e => { if (e.target !== this.input && !window.getSelection().toString()) setTimeout(() => this.input.focus(), 0); });
      this.root.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation();
        const sel = window.getSelection().toString();
        Ctx.show(e.clientX, e.clientY, [
          { label: 'Kopier', kbd: 'Ctrl+Shift+C', disabled: !sel, action: () => { if (navigator.clipboard) navigator.clipboard.writeText(sel).catch(() => {}); } },
          { label: 'Lim inn', kbd: 'Ctrl+Shift+V', action: () => { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => { this.input.value += t.split('\n')[0]; this.input.focus(); }).catch(() => Toast.show('Bruk Ctrl+V for å lime inn.')); } },
          '-',
          { label: 'Tøm skjermen', kbd: 'cls', action: () => this.clear() },
          { label: 'Hjelp (help)', action: () => this.submit('help') }
        ], 'terminal', 'terminalen');
      });
      this.input.addEventListener('keydown', e => this.onKey(e));
      this.print('PowerShell 7.4.2 (øvings-terminal)\nSkriv help for å se kommandoene du kan bruke.\n', 'dim');
      this.updatePrompt();
      setTimeout(() => this.input.focus(), 50);
      Bus.emit('term-open', { cwd: pathOf(this.cwd) });
    }
    get cwdPath() { return pathOf(this.cwd); }
    updatePrompt() { this.promptEl.textContent = this.reading ? this.reading.prompt : 'PS ' + this.cwdPath + '> '; this.vars.__pwd = this.cwdPath; }
    print(text, cls) {
      if (text === '' || text == null) return;
      const parts = String(text).split('\n');
      parts.forEach((p, i) => {
        if (i === parts.length - 1 && p === '') return;
        const last = this.out.lastElementChild;
        if (i === 0 && last && last.dataset.open === '1') { last.textContent += p; if (parts.length > 1) last.dataset.open = '0'; return; }
        const d = document.createElement('div'); d.className = 'term-l ' + (cls || ''); d.textContent = p;
        if (i === parts.length - 1 && !text.endsWith('\n')) d.dataset.open = '1';
        this.out.appendChild(d); this.lineCount++;
      });
      while (this.out.children.length > 3000) this.out.firstChild.remove();
      this.root.scrollTop = this.root.scrollHeight;
    }
    printLines(lines, cls) { this.print(lines.join('\n') + '\n', cls); }
    clear() { this.out.innerHTML = ''; Bus.emit('term-clear', {}); }
    focus() { this.input.focus(); }
    onKey(e) {
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && !e.shiftKey) {
        e.preventDefault();
        if (this.running) { this.abort(); Bus.emit('term-ctrlc', { running: true }); return; }
        if (this.reading) { this.reading.reject(new Error('interrupt')); this.reading = null; this.updatePrompt(); }
        this.print(this.promptEl.textContent + this.input.value + '^C\n'); this.input.value = ''; Bus.emit('term-ctrlc', { running: false }); return;
      }
      if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); this.clear(); return; }
      if (e.key === 'Enter') { e.preventDefault(); const v = this.input.value; this.input.value = ''; this.tabState = null; if (this.reading) { const r = this.reading; this.reading = null; this.print(r.prompt + v + '\n'); this.updatePrompt(); r.resolve(v); } else this.submit(v); return; }
      if (e.key === 'Tab') { e.preventDefault(); if (!this.reading && !this.running) this.complete(); return; }
      if (e.key === 'ArrowUp') { e.preventDefault(); if (this.reading || !this.history.length) return; this.hi = Math.max(0, this.hi - 1); this.input.value = this.history[this.hi] || ''; Bus.emit('term-history', { dir: 'up' }); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); if (this.reading) return; this.hi = Math.min(this.history.length, this.hi + 1); this.input.value = this.history[this.hi] || ''; return; }
      if (e.key === 'Escape') { this.input.value = ''; return; }
      if (e.key !== 'Tab') this.tabState = null;
      e.stopPropagation();
    }
    readLine(prompt) {
      return new Promise((resolve, reject) => { this.reading = { prompt, resolve, reject }; this.updatePrompt(); this.input.focus(); });
    }
    abort() { if (this.running) this.running.abort = true; if (this.reading) { this.reading.reject(new Error('interrupt')); this.reading = null; } }

    /* Tab-fullføring av kommandoer og stier */
    complete() {
      const v = this.input.value;
      if (!this.tabState || this.tabState.base !== v) {
        const m = /(^|\s)("?)([^"\s]*)$/.exec(v);
        if (!m) return;
        const before = v.slice(0, m.index + m[1].length), partial = m[3];
        const isCmd = before.trim() === '';
        let cands = [];
        if (isCmd && !/[\\\/.]/.test(partial)) cands = COMMANDS.concat(Object.keys(ALIASES)).filter(c => c.toLowerCase().startsWith(partial.toLowerCase())).sort();
        else {
          const p = clean(partial); const i = p.lastIndexOf('\\');
          const dirPart = i < 0 ? '' : p.slice(0, i + 1), namePart = i < 0 ? p.replace(/^\.\\/, '') : p.slice(i + 1);
          const dirLoc = dirPart ? resolve(this.cwd, dirPart) : this.cwd;
          if (!isDir(dirLoc)) return;
          const prefix = isCmd && !dirPart ? '.\\' : dirPart;
          cands = listing(dirLoc).filter(x => x.name.toLowerCase().startsWith(namePart.toLowerCase())).map(x => { let s = prefix + x.name + (x.type === 'folder' ? '\\' : ''); return s; });
        }
        if (!cands.length) return;
        this.tabState = { before, cands, idx: 0, base: null };
      } else this.tabState.idx = (this.tabState.idx + 1) % this.tabState.cands.length;
      let c = this.tabState.cands[this.tabState.idx];
      if (/\s/.test(c)) c = '"' + c.replace(/\\$/, '') + '\\"';
      this.input.value = this.tabState.before + c;
      this.tabState.base = this.input.value;
      Bus.emit('term-tab', { completed: c, count: this.tabState.cands.length });
    }

    async submit(line) {
      this.print(this.promptEl.textContent + line + '\n', 'cmdline');
      if (line.trim()) { this.history.push(line); if (this.history.length > 200) this.history.shift(); }
      this.hi = this.history.length;
      if (!line.trim()) return;
      this.running = { abort: false };
      try { await this.execLine(line); }
      catch (e) { if (!(e && e.message === 'interrupt')) { console.error(e); this.print('Internal error: ' + (e && e.message) + '\n', 'err'); } }
      this.running = null; this.reading = null;
      this.updatePrompt();
      this.root.scrollTop = this.root.scrollHeight;
    }
    async execLine(line, fromScript) {
      const t = tokenizeLine(line, this.vars);
      if (t.error) { this.print('ParserError: ' + t.error + '\n', 'err'); Bus.emit('term-cmd', { name: '?', raw: line, ok: false, error: t.error }); return false; }
      /* del opp i kommandoer (;) og rør (|) */
      const cmds = []; let cur = { segs: [[]], redirect: null };
      t.toks.forEach(tok => {
        if (tok.op === ';') { cmds.push(cur); cur = { segs: [[]], redirect: null }; }
        else if (tok.op === '|') cur.segs.push([]);
        else if (tok.op === '>' || tok.op === '>>') cur.redirect = { op: tok.op, target: null, pending: true };
        else if (cur.redirect && cur.redirect.pending) { cur.redirect.target = tok.v; cur.redirect.pending = false; }
        else cur.segs[cur.segs.length - 1].push(tok);
      });
      cmds.push(cur);
      let lastOk = true;
      for (const c of cmds) {
        if (!c.segs[0].length) continue;
        let piped = null, ok = true;
        for (let i = 0; i < c.segs.length; i++) {
          const seg = c.segs[i];
          const r = await this.runCommand(seg, piped, i < c.segs.length - 1 || !!c.redirect, fromScript);
          ok = r.ok; piped = r.lines;
          if (!ok) break;
        }
        if (ok && c.redirect) {
          if (!c.redirect.target) { this.print('ParserError: Missing file specification after redirection operator.\n', 'err'); ok = false; }
          else {
            const text = (piped || []).map(l => l.text).join('\n') + ((piped || []).length ? '\n' : '');
            const rr = this.writeFile(c.redirect.target, text, c.redirect.op === '>>');
            if (rr.error) { this.print(rr.error + '\n', 'err'); ok = false; }
            else Bus.emit('term-redirect', { file: rr.name, append: c.redirect.op === '>>', text });
          }
        }
        lastOk = ok;
      }
      return lastOk;
    }
    writeFile(path, text, append) {
      const { parent, name } = resolveParent(this.cwd, path);
      if (!parent || parent.virt) return { error: 'out-file: Could not find a part of the path \'' + clean(path) + '\'.' };
      const ex = childOf(parent, name);
      if (ex && isDir(ex)) return { error: 'out-file: Access to the path \'' + pathOf(ex) + '\' is denied.' };
      if (ex) { const n = FS.get(ex.id); const r = FS.write(n.id, (append ? n.content : '') + text); if (r && r.error) return { error: 'out-file: ' + r.error }; return { name: n.name }; }
      const r = FS.createFile(parent.id, name, text, { via: 'terminal' });
      if (r.error) return { error: 'out-file: ' + r.error };
      return { name: r.name };
    }
    err(name, msg) { return { ok: false, lines: [], error: name + ': ' + msg }; }

    async runCommand(seg, piped, capture, fromScript) {
      const first = seg[0].v;
      const rest = seg.slice(1);
      const { args, opts } = parseArgs(rest);
      const lines = [];
      const out = (text, cls) => { (Array.isArray(text) ? text : String(text).split('\n')).forEach(l => lines.push({ text: l, cls })); };
      let name = first, canonical = null;
      const lower = first.toLowerCase();
      /* variabel-tilordning: $x = ... */
      if (/^\$\w+$/.test(first) && rest.length && rest[0].v === '=' ) { /* håndtert av tokenizer-ekspansjon? nei: første token ekspandert. */ }
      if (/^\$[A-Za-z_]\w*\s*=/.test(line0(seg))) { /* aldri – tokenizer har ekspandert */ }
      const known = COMMANDS.find(c => c.toLowerCase() === lower);
      if (known) canonical = known; else if (ALIASES[lower]) canonical = ALIASES[lower];
      const finish = ok => {
        if (!capture) lines.forEach(l => this.print(l.text + '\n', l.cls));
        Bus.emit('term-cmd', { name: canonical || first, alias: first, args, opts, raw: seg.map(t => t.v).join(' '), cwd: this.cwdPath, ok, lines: lines.length });
        return { ok, lines };
      };
      const fail = msg => { this.print(msg + '\n', 'err'); Bus.emit('term-cmd', { name: canonical || first, alias: first, args, opts, raw: seg.map(t => t.v).join(' '), cwd: this.cwdPath, ok: false, error: msg }); return { ok: false, lines: [] }; };
      const pathErr = (cmd, p) => fail(`${cmd}: Cannot find path '${absStr(this.cwd, p)}' because it does not exist.`);
      const r = R();

      /* Skript og programmer i gjeldende mappe */
      if (/^\.[\\/]/.test(first) || /^[a-zA-Z]:\\|^\\/.test(first) || /^~[\\/]/.test(first)) {
        const loc = resolve(this.cwd, first);
        if (!loc || loc.virt) return fail(`${first}: The term '${first}' is not recognized as a name of a cmdlet, function, script file, or executable program.\nCheck the spelling of the name, or if a path was included, verify that the path is correct and try again.`);
        const n = FS.get(loc.id);
        if (n.type === 'folder') return fail(`${first}: The term '${first}' is not recognized as a name of a cmdlet, function, script file, or executable program.`);
        if (FS.ext(n.name) === 'ps1') { const ok = await this.runPs1(n, args); return finish(ok); }
        if (FS.ext(n.name) === 'py') { this.print(`Tips: Python-filer kjøres med:  python ${n.name}\n`, 'dim'); return finish(false); }
        return fail(`${first}: Program '${n.name}' failed to run: The file is not a program or script. Åpne den med: code ${n.name}`);
      }
      if (!canonical) {
        /* filnavn uten .\ i gjeldende mappe: PowerShell sin klassiske melding */
        const here = childOf(this.cwd, first);
        let msg = `${first}: The term '${first}' is not recognized as a name of a cmdlet, function, script file, or executable program.\nCheck the spelling of the name, or if a path was included, verify that the path is correct and try again.`;
        if (here && isFile(here)) msg += `\n\nSuggestion [3,General]: The command ${first} was not found, but does exist in the current location. PowerShell does not load commands from the current location by default. If you trust this command, instead type: ".\\${first}". See "get-help about_Command_Precedence" for more details.`;
        return fail(msg);
      }

      switch (canonical) {
        case 'Get-Location': out('\nPath\n----\n' + this.cwdPath + '\n'); return finish(true);
        case 'Set-Location': {
          const target = args[0] !== undefined ? args[0] : (opts.path || '~');
          const loc = resolve(this.cwd, target);
          if (!loc) return pathErr('Set-Location', target);
          if (!isDir(loc)) return fail(`Set-Location: Cannot find path '${absStr(this.cwd, target)}' because it is a file, not a directory.`);
          this.cwd = loc; this.updatePrompt();
          Bus.emit('term-cd', { path: this.cwdPath, arg: target });
          return finish(true);
        }
        case 'Get-ChildItem': {
          let target = args[0] || opts.path || '.'; let filter = opts.filter || null;
          let loc = resolve(this.cwd, target);
          if (!loc && /[*?]/.test(target)) { const { parent, name } = resolveParent(this.cwd, target); loc = parent; filter = name; }
          if (!loc) return pathErr('Get-ChildItem', target);
          if (isFile(loc)) { const n = loc.virt ? null : FS.get(loc.id); out(table([{ name: n ? termName(n) : loc.virt.split('\\').pop(), type: 'file', modified: n ? n.modified : Date.now(), size: n ? n.size : 0 }], pathOf(parentOf(loc)))); return finish(true); }
          const rx = filter ? wildcardToRegex(filter) : null;
          const emitDir = (l, depth) => {
            let items = listing(l).filter(x => !rx || rx.test(x.name));
            if (opts.name) items.forEach(x => out((depth ? pathOf(l).slice(this.cwdPath.length + 1) + '\\' : '') + x.name));
            else if (items.length) out(table(items, pathOf(l)));
            if (opts.recurse && depth < 6) listing(l).filter(x => x.type === 'folder' && x.node).forEach(x => emitDir({ id: x.node.id }, depth + 1));
          };
          emitDir(loc, 0);
          if (!lines.length && !opts.name) out('');
          return finish(true);
        }
        case 'New-Item': case 'mkdir': {
          const isDirItem = canonical === 'mkdir' || (opts.itemtype && /^d/i.test(opts.itemtype)) || opts.type === 'd';
          const p = opts.name ? (opts.path ? clean(opts.path).replace(/\\$/, '') + '\\' + opts.name : opts.name) : (args[0] || opts.path);
          if (!p) return fail(`${canonical}: Cannot process command because of one or more missing mandatory parameters: Path.`);
          const { parent, name } = resolveParent(this.cwd, p);
          if (!parent || parent.virt) return fail(`${canonical}: Could not find a part of the path '${absStr(this.cwd, p)}'.`);
          if (childOf(parent, name)) return fail(`${canonical}: An item with the specified name ${absStr(this.cwd, p)} already exists.`);
          const rr = isDirItem ? FS.createFolder(parent.id, name, { via: 'terminal' }) : FS.createFile(parent.id, name, opts.value || '', { via: 'terminal' });
          if (rr.error) return fail(`${canonical}: ${rr.error}`);
          out(table([{ name: rr.name, type: rr.type, modified: rr.modified, size: fileSize(rr) }], pathOf(parent)));
          Bus.emit('term-new', { kind: rr.type, name: rr.name, path: pathOf({ id: rr.id }) });
          return finish(true);
        }
        case 'Remove-Item': {
          const p = args[0] || opts.path;
          if (!p) return fail('Remove-Item: Cannot process command because of one or more missing mandatory parameters: Path.');
          const loc = resolve(this.cwd, p);
          if (!loc) return pathErr('Remove-Item', p);
          if (loc.virt) return fail(`Remove-Item: Access to the path '${pathOf(loc)}' is denied.`);
          const n = FS.get(loc.id);
          if (n.system) return fail(`Remove-Item: Access to the path '${pathOf(loc)}' is denied. Denne mappen hører til systemet.`);
          if (n.type === 'folder' && FS.children(n.id).length && !opts.recurse) {
            this.print(`\nConfirm\nThe item at ${pathOf(loc)} has children and the Recurse parameter was not specified. If you continue, all children will be removed with the item. Are you sure you want to continue?\n`);
            let ans; try { ans = await this.readLine('[Y] Yes  [A] Yes to All  [N] No  [L] No to All  [S] Suspend  [?] Help (default is "Y"): '); } catch (e) { return finish(false); }
            if (ans.trim() && !/^[ya]/i.test(ans.trim())) return finish(false);
          }
          const nm = n.name; FS.purge(n.id);
          Bus.emit('term-rm', { name: nm, kind: n.type });
          return finish(true);
        }
        case 'Move-Item': case 'Copy-Item': case 'Rename-Item': {
          const src = args[0] || opts.path; const dst = args[1] || opts.destination || opts.newname;
          if (!src || !dst) return fail(`${canonical}: Cannot process command because of one or more missing mandatory parameters: ${!src ? 'Path' : canonical === 'Rename-Item' ? 'NewName' : 'Destination'}.`);
          const sloc = resolve(this.cwd, src);
          if (!sloc) return pathErr(canonical, src);
          if (sloc.virt) return fail(`${canonical}: Access to the path '${pathOf(sloc)}' is denied.`);
          const sn = FS.get(sloc.id);
          if (sn.system) return fail(`${canonical}: Access to the path '${pathOf(sloc)}' is denied.`);
          let rr;
          if (canonical === 'Rename-Item') {
            if (/[\\/]/.test(dst)) return fail(`Rename-Item: Cannot rename because the target specified represents a path or device name.`);
            rr = FS.rename(sn.id, dst, { via: 'terminal' });
          } else {
            let dloc = resolve(this.cwd, dst);
            if (dloc && isDir(dloc)) {
              if (dloc.virt) return fail(`${canonical}: Access to the path '${pathOf(dloc)}' is denied.`);
              if (canonical === 'Copy-Item' && sn.type === 'folder' && !opts.recurse) { this.print(`${canonical}: Mappen «${sn.name}» ble kopiert uten innhold. Bruk -Recurse for å ta med filene i den.\n`, 'warn'); const c = FS.createFolder(dloc.id, FS.uniqueName(dloc.id, sn.name), { via: 'terminal' }); rr = c; }
              else rr = canonical === 'Move-Item' ? FS.move(sn.id, dloc.id, { via: 'terminal' }) : FS.copy(sn.id, dloc.id, { via: 'terminal' });
            } else {
              const { parent, name } = resolveParent(this.cwd, dst);
              if (!parent || parent.virt) return fail(`${canonical}: Could not find a part of the path '${absStr(this.cwd, dst)}'.`);
              if (childOf(parent, name)) return fail(`${canonical}: An item with the specified name ${absStr(this.cwd, dst)} already exists.`);
              if (canonical === 'Move-Item') { rr = parent.id === sn.parent ? FS.rename(sn.id, name, { via: 'terminal' }) : FS.move(sn.id, parent.id, { via: 'terminal' }); if (!rr.error && rr.name !== name) rr = FS.rename(rr.id, name, { via: 'terminal' }); }
              else { rr = FS.copy(sn.id, parent.id, { via: 'terminal' }); if (!rr.error && rr.name !== name) rr = FS.rename(rr.id, name, { via: 'terminal' }); }
            }
          }
          if (rr && rr.error) return fail(`${canonical}: ${rr.error}`);
          Bus.emit('term-' + canonical.split('-')[0].toLowerCase(), { src: sn.name, dst, kind: sn.type });
          return finish(true);
        }
        case 'Get-Content': {
          const p = args[0] || opts.path;
          if (!p) return fail('Get-Content: Cannot process command because of one or more missing mandatory parameters: Path.');
          const loc = resolve(this.cwd, p);
          if (!loc) return pathErr('Get-Content', p);
          if (isDir(loc)) return fail(`Get-Content: Access to the path '${pathOf(loc)}' is denied. Det er en mappe, ikke en fil.`);
          if (loc.virt) return fail(`Get-Content: Access to the path '${pathOf(loc)}' is denied.`);
          const n = FS.get(loc.id);
          if (n.content) out(n.content.replace(/\n$/, ''));
          Bus.emit('term-cat', { name: n.name });
          return finish(true);
        }
        case 'Set-Content': case 'Add-Content': {
          const p = args[0] || opts.path; const val = opts.value !== undefined ? opts.value : args.slice(1).join(' ');
          if (!p) return fail(`${canonical}: Cannot process command because of one or more missing mandatory parameters: Path.`);
          const rr = this.writeFile(p, val + '\n', canonical === 'Add-Content');
          if (rr.error) return fail(rr.error.replace('out-file', canonical));
          Bus.emit('term-redirect', { file: rr.name, append: canonical === 'Add-Content', text: val + '\n' });
          return finish(true);
        }
        case 'Write-Output': case 'Write-Host': out(args.join(' ')); return finish(true);
        case 'Clear-Host': this.clear(); return finish(true);
        case 'Get-Help': {
          const topic = args[0] || opts.name;
          if (!topic) { out('Øvings-terminalen (PowerShell)\n\nNavigasjon:   pwd, cd, ls, tree, explorer .\nFiler:        mkdir, New-Item, Remove-Item, Move-Item, Copy-Item, Rename-Item, Get-Content, Set-Content, echo "tekst" > fil\nProgrammer:   python fil.py, code ., .\\skript.ps1, notepad fil.txt\nAnnet:        Get-Help <kommando>, Get-Alias, cls, exit\n\nTips: Tab fullfører navn. Pil opp henter forrige kommando. Ctrl+C stopper et program som kjører.'); }
          else { const c = COMMANDS.find(x => x.toLowerCase() === topic.toLowerCase()) || ALIASES[topic.toLowerCase()]; if (c && HELP[c]) out('\n' + HELP[c] + '\n'); else out(`Get-Help: Fant ingen hjelp for «${topic}». Skriv help for en oversikt.`); Bus.emit('term-help', { topic: c || topic }); }
          return finish(true);
        }
        case 'Get-Alias': {
          const a = args[0] || opts.name;
          const rows = Object.entries(ALIASES).filter(([k]) => !a || k.toLowerCase() === a.toLowerCase() || wildcardToRegex(a).test(k));
          if (!rows.length) return fail(`Get-Alias: This command cannot find a matching alias because an alias with the name '${a}' does not exist.`);
          out('\nCommandType     Name\n-----------     ----'); rows.forEach(([k, v]) => out(pad('Alias', 16) + k + ' -> ' + v)); out('');
          return finish(true);
        }
        case 'Get-Command': out('\nName\n----'); COMMANDS.slice().sort().forEach(c => out(c)); out(''); return finish(true);
        case 'Get-Date': out(new Date().toString()); return finish(true);
        case 'whoami': out('elev-pc\\elev'); return finish(true);
        case 'hostname': out('ELEV-PC'); return finish(true);
        case 'history': case 'Get-History': this.history.forEach((h, i) => out(lpad(i + 1, 4) + '  ' + h)); return finish(true);
        case 'exit': finish(true); WM.close(this.win, 'exit'); return { ok: true, lines: [] };
        case 'Test-Path': { const loc = resolve(this.cwd, args[0] || opts.path || ''); out(loc ? 'True' : 'False'); return finish(true); }
        case 'Get-Item': { const loc = resolve(this.cwd, args[0] || opts.path || '.'); if (!loc) return pathErr('Get-Item', args[0]); const n = loc.virt ? null : FS.get(loc.id); out(table([{ name: n ? termName(n) : loc.virt, type: isDir(loc) ? 'folder' : 'file', modified: n ? n.modified : Date.now(), size: n ? n.size : 0 }], pathOf(parentOf(loc)))); return finish(true); }
        case 'tree': {
          const loc = resolve(this.cwd, args[0] || '.'); if (!loc || !isDir(loc)) return pathErr('tree', args[0] || '.');
          out(pathOf(loc));
          const walk = (l, prefix, depth) => { const items = listing(l).filter(x => opts.f || opts.files || x.type === 'folder' || true); items.forEach((x, i) => { const last = i === items.length - 1; out(prefix + (last ? '└── ' : '├── ') + x.name); if (x.type === 'folder' && x.node && depth < 8) walk({ id: x.node.id }, prefix + (last ? '    ' : '│   '), depth + 1); }); };
          walk(loc, '', 0); Bus.emit('term-tree', {}); return finish(true);
        }
        case 'Select-String': {
          const pat = opts.pattern || args[0]; if (!pat) return fail('Select-String: Cannot process command because of one or more missing mandatory parameters: Pattern.');
          const rx = new RegExp(pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*'), 'i');
          if (piped) { piped.filter(l => rx.test(l.text)).forEach(l => out(l.text)); return finish(true); }
          const files = args.slice(1).concat(opts.path ? [opts.path] : []);
          if (!files.length) return fail('Select-String: Angi en fil å søke i, eller bruk kommandoen etter | (f.eks. ls | Select-String py).');
          files.forEach(f => { const loc = resolve(this.cwd, f); if (!loc || !isFile(loc) || loc.virt) { this.print(`Select-String: Cannot find path '${absStr(this.cwd, f)}' because it does not exist.\n`, 'err'); return; } const n = FS.get(loc.id); (n.content || '').split('\n').forEach((l, i) => { if (rx.test(l)) out(`${n.name}:${i + 1}:${l}`); }); });
          return finish(true);
        }
        case 'findstr': { const pat = args[0]; if (!pat) return fail('FINDSTR: Bad command line'); const rx = new RegExp(pat.replace(/[.+^${}()|[\]\\]/g, '\\$&'), 'i'); (piped || []).filter(l => rx.test(l.text)).forEach(l => out(l.text)); return finish(true); }
        case 'Measure-Object': { const n = (piped || []).filter(l => l.text.trim() && !/^(Mode|----|\s+Directory)/.test(l.text)).length; out('\nCount    : ' + n + '\n'); return finish(true); }
        case 'more': (piped || []).forEach(l => out(l.text, l.cls)); return finish(true);
        case 'python': {
          if (!args.length) { out('Python 3.12.4 (øvings-PC)\nInteraktiv modus støttes ikke her. Kjør en fil:  python fil.py'); return finish(true); }
          if (args[0] === '--version' || args[0] === '-V') { out('Python 3.12.4'); return finish(true); }
          const loc = resolve(this.cwd, args[0]);
          if (!loc || loc.virt || !isFile(loc)) return fail(`python: can't open file '${absStr(this.cwd, args[0])}': [Errno 2] No such file or directory`);
          const n = FS.get(loc.id);
          /* Ved | eller > samles programmets utskrift i stedet for å vises (feilmeldinger vises alltid) */
          let captured = '';
          const res = await this.runPython(n, args.slice(1), capture ? text => { captured += text; } : null);
          if (capture && captured) captured.replace(/\n$/, '').split('\n').forEach(l => lines.push({ text: l }));
          return finish(res.ok);
        }
        case 'code': {
          if (!window.Kode) return fail("code: The term 'code' is not recognized. Kode-editoren finnes bare på programmeringssiden.");
          const p = args[0] || '.'; const loc = resolve(this.cwd, p);
          if (!loc) { const { parent, name } = resolveParent(this.cwd, p); if (parent && !parent.virt && name) { const rr = FS.createFile(parent.id, name, '', { via: 'terminal' }); if (rr.error) return fail('code: ' + rr.error); Kode.open({ fileId: rr.id, via: 'terminal' }); return finish(true); } return pathErr('code', p); }
          if (loc.virt) return fail(`code: Access to the path '${pathOf(loc)}' is denied.`);
          if (isDir(loc)) Kode.open({ folderId: loc.id, via: 'terminal' }); else Kode.open({ fileId: loc.id, via: 'terminal' });
          return finish(true);
        }
        case 'notepad': { const p = args[0]; if (!p) { Skriv.open(); return finish(true); } const loc = resolve(this.cwd, p); if (!loc || loc.virt || !isFile(loc)) return pathErr('notepad', p); Skriv.open(loc.id); return finish(true); }
        case 'explorer': { const loc = resolve(this.cwd, args[0] || '.'); if (!loc || loc.virt || !isDir(loc)) return pathErr('explorer', args[0] || '.'); Explorer.open(loc.id); return finish(true); }
        default: return fail(`${first}: The term '${first}' is not recognized.`);
      }
    }

    /* ---------------- Python ---------------- */
    pyFs() {
      return {
        open: (path, mode) => {
          const loc = resolve(this.cwd, path);
          if (mode.includes('r') || (!mode.includes('w') && !mode.includes('a'))) {
            if (!loc || loc.virt || !isFile(loc)) return { error: `[Errno 2] No such file or directory: '${path}'`, errorType: 'FileNotFoundError' };
            return { content: FS.get(loc.id).content || '' };
          }
          if (loc && isDir(loc)) return { error: `[Errno 13] Permission denied: '${path}'`, errorType: 'PermissionError' };
          if (loc && !loc.virt) return { content: FS.get(loc.id).content || '' };
          const { parent, name } = resolveParent(this.cwd, path);
          if (!parent || parent.virt) return { error: `[Errno 2] No such file or directory: '${path}'`, errorType: 'FileNotFoundError' };
          const rr = FS.createFile(parent.id, name, '', { via: 'python' });
          if (rr.error) return { error: rr.error, errorType: 'OSError' };
          return { content: '' };
        },
        write: (path, content) => { const loc = resolve(this.cwd, path); if (!loc || loc.virt) return { error: 'cannot write ' + path }; const r = FS.write(loc.id, content); return r && r.error ? { error: r.error } : {}; }
      };
    }
    async runPython(node, argv, sink) {
      const gen = Pyth.run(node.content || '', node.name, this.pyFs());
      const emit = (text, err) => { if (err || !sink) this.print(text, err ? 'err' : ''); else sink(text); };
      const run = this.running || (this.running = { abort: false });
      const output = []; let outLines = 0, steps = 0, usedInput = false;
      const t0 = Date.now();
      let res = gen.next();
      while (!res.done) {
        const y = res.value;
        if (run.abort) { run.abort = false; res = gen.throw(Pyth.interrupt()); continue; }
        if (y.type === 'step') {
          if (++steps % 4000 === 0) { await new Promise(r => setTimeout(r, 0)); }
          if (steps > 5000000) { this.print('\n[Øvings-PC: programmet ble stoppet etter 5 millioner steg. Har du en løkke som aldri slutter?]\n', 'warn'); res = gen.throw(Pyth.interrupt()); continue; }
          res = gen.next(); continue;
        }
        if (y.type === 'out') {
          emit(y.text, y.err); output.push(y.text);
          outLines += (y.text.match(/\n/g) || []).length;
          if (outLines > 200 && outLines % 20 === 0) await new Promise(r => setTimeout(r, 30));
          if (outLines > 5000) { this.print('\n[Øvings-PC: programmet skrev ut mer enn 5000 linjer og ble stoppet. Bruk Ctrl+C for å stoppe programmer som kjører evig.]\n', 'warn'); res = gen.throw(Pyth.interrupt()); continue; }
          res = gen.next(); continue;
        }
        if (y.type === 'input') {
          usedInput = true;
          let line;
          try { line = await this.readLine(y.prompt); } catch (e) { res = gen.throw(Pyth.interrupt()); continue; }
          output.push(line + '\n');
          res = gen.next(line); continue;
        }
        if (y.type === 'sleep') { await new Promise(r => setTimeout(r, y.ms)); res = gen.next(); continue; }
        res = gen.next();
      }
      const result = res.value || { ok: false };
      const rec = { file: node.name, path: pathOf({ id: node.id }), ok: !!result.ok, error: result.error || null, line: result.line || null, output: output.join(''), usedInput, ms: Date.now() - t0, source: node.content || '' };
      Terminal.lastRun = rec;
      Bus.emit('py-run', rec);
      return result;
    }

    /* ---------------- PowerShell-skript (.ps1) ---------------- */
    async runPs1(node, argv) {
      const lines = (node.content || '').split('\n');
      let ok = true;
      for (let i = 0; i < lines.length; i++) {
        if (this.running && this.running.abort) { this.print('^C\n'); ok = false; break; }
        let line = lines[i].trim();
        if (!line || line.startsWith('#')) continue;
        const m = /^\$([A-Za-z_]\w*)\s*=\s*(.+)$/.exec(line);
        if (m) {
          const rhs = m[2].trim();
          const rh = /^Read-Host(?:\s+(?:-Prompt\s+)?(.+))?$/i.exec(rhs);
          if (rh) { const p = rh[1] ? unquote(rh[1], this.vars) : ''; try { this.vars[m[1]] = await this.readLine(p ? p + ': ' : ''); } catch (e) { ok = false; break; } continue; }
          const t = tokenizeLine(rhs, this.vars);
          if (t.error) { this.print('ParserError: ' + t.error + '\n', 'err'); ok = false; break; }
          const v = t.toks.filter(x => x.v !== undefined).map(x => x.v).join(' ');
          this.vars[m[1]] = /^-?\d+(\.\d+)?$/.test(v) && !t.toks[0].q ? Number(v) : v;
          continue;
        }
        const rh = /^Read-Host(?:\s+(?:-Prompt\s+)?(.+))?$/i.exec(line);
        if (rh) { try { await this.readLine(rh[1] ? unquote(rh[1], this.vars) + ': ' : ''); } catch (e) { ok = false; break; } continue; }
        if (/^(if|while|foreach|for|function|switch|try)\b/i.test(line) || /^[{}]/.test(line)) { this.print(`${node.name}: linje ${i + 1}: «${line.split(' ')[0]}» støttes ikke i øvings-terminalen. Bruk Write-Host, Read-Host, variabler og vanlige kommandoer.\n`, 'warn'); continue; }
        const r = await this.execLine(line, true);
        if (!r) { ok = false; break; }
      }
      Bus.emit('ps1-run', { file: node.name, ok, source: node.content || '' });
      return ok;
    }
  }
  function unquote(s, vars) { const t = tokenizeLine(s, vars); return t.toks && t.toks.length ? t.toks.map(x => x.v).join(' ') : s; }
  function line0(seg) { return seg.map(t => t.v).join(' '); }
  function absStr(cwd, p) { const loc = resolve(cwd, p); if (loc) return pathOf(loc); const { parent, name } = resolveParent(cwd, p); return parent ? pathOf(parent).replace(/\\$/, '') + '\\' + name : clean(p); }

  function open(startId) { if (WM.full()) return null; return new Term(startId); }
  function active() { const a = WM.getActive(); if (a && a.term) return a.term; return instances[instances.length - 1] || null; }
  /* Brukes av Kode-editoren: kjør en fil i (en) terminal */
  async function runFile(nodeId) {
    const n = FS.get(nodeId); if (!n) return;
    let t = active(); if (!t) t = open(n.parent); if (!t) return;
    WM.focus(t.win, 'run');
    if (t.running) { Toast.show('Terminalen kjører allerede et program. Stopp det med Ctrl+C først.'); return; }
    if (t.cwd.id !== n.parent) { await t.submit('cd "' + pathOf({ id: n.parent }) + '"'); }
    const e = FS.ext(n.name);
    await t.submit(e === 'ps1' ? '.\\' + n.name : 'python ' + (/\s/.test(n.name) ? '"' + n.name + '"' : n.name));
  }
  return { open, active, runFile, pathOf, resolve, instances, lastRun: null, HOME, termName };
})();
window.Terminal = Terminal;
