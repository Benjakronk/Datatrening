/* Git i øvings-terminalen: init, config, status, add, commit, log, diff, restore og .gitignore.
   Et repo er en mappe på øvings-PC-en. Historikken lagres i localStorage (dt-git), ikke i en .git-mappe,
   så eleven ikke kan ødelegge den ved å rydde i Filutforsker. Utskriftene følger ekte Git så tett som mulig. */
const Git = (() => {
  const KEY = 'dt-git', CFG = 'dt-gitcfg';
  let db = null, cfg = null;
  function load() {
    if (db) return db;
    try { db = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { db = {}; }
    if (!db.repos) db.repos = {};
    return db;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) { /* full lagring: historikken mistes, ikke filene */ } }
  function config() { if (!cfg) { try { cfg = JSON.parse(localStorage.getItem(CFG) || '{}') || {}; } catch (e) { cfg = {}; } } return cfg; }
  function saveCfg() { try { localStorage.setItem(CFG, JSON.stringify(cfg)); } catch (e) { /* ignorer */ } }
  const MAX_COMMITS = 60;

  /* Repoet mappen ligger i (mappen selv eller en mappe over). Stien lagres også, så et repo
     ikke følger med hvis id-en senere blir brukt av en annen mappe (etter tilbakestilling). */
  function repoFor(folderId) {
    load();
    let n = FS.get(folderId);
    while (n) {
      const r = db.repos[n.id];
      if (r && r.path === FS.pathString(n.id)) return { id: n.id, r };
      n = n.parent != null ? FS.get(n.parent) : null;
    }
    return null;
  }
  const winPath = id => Terminal.pathOf({ id });
  const gitPath = id => winPath(id).replace(/\\/g, '/');
  /* Alle filer i arbeidsmappen, med sti relativt til repoet (a/b.py) */
  function workTree(rootId) {
    const out = {};
    const walk = (id, pre) => FS.children(id).forEach(c => {
      if (c.type === 'folder') walk(c.id, pre + c.name + '/');
      else out[pre + c.name] = c.content || '';
    });
    walk(rootId, '');
    return out;
  }
  function ignoreRules(work) {
    const src = work['.gitignore'];
    if (src == null) return [];
    return src.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#')).map(p => {
      const dir = p.endsWith('/'); const pat = p.replace(/\/$/, '').replace(/^\//, '');
      const rx = new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]') + '$', 'i');
      return { dir, rx, hasSlash: pat.includes('/') };
    });
  }
  /* Et mønster med / bak (mappe/) gjelder bare mapper. Et mønster med / inni sammenlignes med hele stien. */
  function ignored(path, rules) {
    const parts = path.split('/');
    const prefixes = parts.map((_, i) => parts.slice(0, i + 1).join('/'));
    return rules.some(r => (r.hasSlash ? prefixes : parts).some((p, i) => r.rx.test(p) && (i < parts.length - 1 || !r.dir)));
  }
  const head = r => r.commits.length ? r.commits[r.commits.length - 1].files : {};
  function hash() { let s = ''; for (let i = 0; i < 40; i++) s += '0123456789abcdef'[Math.floor(Math.random() * 16)]; return s; }

  /* Linjediff (LCS). Gir liste med [' ', linje] / ['-', linje] / ['+', linje] */
  function diffLines(a, b) {
    const A = a === '' ? [] : a.replace(/\n$/, '').split('\n'), B = b === '' ? [] : b.replace(/\n$/, '').split('\n');
    if (A.length * B.length > 250000) return A.map(l => ['-', l]).concat(B.map(l => ['+', l]));
    const m = A.length, n = B.length, L = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) L[i][j] = A[i] === B[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const res = []; let i = 0, j = 0;
    while (i < m && j < n) { if (A[i] === B[j]) { res.push([' ', A[i]]); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) res.push(['-', A[i++]]); else res.push(['+', B[j++]]); }
    while (i < m) res.push(['-', A[i++]]); while (j < n) res.push(['+', B[j++]]);
    return res;
  }
  function stat(a, b) { const d = diffLines(a, b); return { ins: d.filter(x => x[0] === '+').length, del: d.filter(x => x[0] === '-').length }; }

  /* Sammenligner arbeidsmappe, indeks (klar til commit) og siste commit */
  function status(rid, r) {
    const work = workTree(rid), rules = ignoreRules(work), H = head(r), I = r.index;
    const staged = [], unstaged = [], untracked = [];
    new Set([...Object.keys(H), ...Object.keys(I)]).forEach(p => {
      if (!(p in H)) staged.push(['new file', p]);
      else if (!(p in I)) staged.push(['deleted', p]);
      else if (H[p] !== I[p]) staged.push(['modified', p]);
    });
    Object.keys(I).forEach(p => { if (!(p in work)) unstaged.push(['deleted', p]); else if (work[p] !== I[p]) unstaged.push(['modified', p]); });
    Object.keys(work).forEach(p => { if (!(p in I) && !ignored(p, rules)) untracked.push(p); });
    [staged, unstaged].forEach(x => x.sort((a, b) => a[1].localeCompare(b[1])));
    untracked.sort();
    return { work, rules, staged, unstaged, untracked };
  }
  /* Untracked filer i en undermappe vises som mappen (som ekte git status) */
  function collapseUntracked(list, I) {
    const shown = new Set();
    list.forEach(p => {
      const parts = p.split('/');
      let cut = null;
      for (let i = 1; i < parts.length; i++) { const dir = parts.slice(0, i).join('/') + '/'; if (!Object.keys(I).some(k => k.startsWith(dir))) { cut = dir; break; } }
      shown.add(cut || p);
    });
    return [...shown].sort();
  }
  /* Sti relativ til repoet fra det eleven skrev (relativt til mappen terminalen står i) */
  function relPath(api, rid, p) {
    const cwdRel = (() => { const parts = []; let n = FS.get(api.cwd.id); while (n && n.id !== rid) { parts.unshift(n.name); n = FS.get(n.parent); } return parts; })();
    const segs = cwdRel.slice();
    p.replace(/\\/g, '/').split('/').forEach(s => { if (!s || s === '.') return; if (s === '..') segs.pop(); else segs.push(s); });
    return segs.join('/');
  }

  const NOT_REPO = 'fatal: not a git repository (or any of the parent directories): .git';
  function emit(cmd, data) { Bus.emit('git', Object.assign({ cmd }, data || {})); }

  async function git(api) {
    const { out, finish, fail } = api;
    if (window.Firmaportal && !Firmaportal.isInstalled('git')) {
      return fail("git: The term 'git' is not recognized as a name of a cmdlet, function, script file, or executable program.\nCheck the spelling of the name, or if a path was included, verify that the path is correct and try again.\n\n" + T('Tips: Git er ikke installert på denne PC-en. Åpne Firmaportalen og installer Git derfra.'));
    }
    const t = api.toks.slice();
    const sub = (t.shift() || '').toLowerCase();
    if (!sub || sub === '--help' || sub === 'help') {
      out('usage: git [--version] [--help] <command> [<args>]\n\n' + T('Vanlige kommandoer på øvings-PC-en:') + '\n   init       ' + T('Lag et nytt, tomt repo i mappen du står i') + '\n   status     ' + T('Vis hva som er endret') + '\n   add        ' + T('Legg endringer klar til neste commit') + '\n   commit     ' + T('Lagre en versjon (git commit -m "melding")') + '\n   log        ' + T('Vis historikken') + '\n   diff       ' + T('Vis hva som er endret i filene') + '\n   restore    ' + T('Angre endringer i en fil') + '\n   config     ' + T('Sett navn og e-post'));
      return finish(true);
    }
    if (sub === '--version' || sub === 'version') { out('git version 2.46.0.windows.1'); emit('version'); return finish(true); }
    if (sub === 'config') return cmdConfig(api, t);
    if (sub === 'clone') { emit('clone', { ok: false }); return fail(`Cloning into '${(t[0] || 'repo').split('/').pop().replace(/\.git$/, '')}'...\nfatal: unable to access '${t[0] || ''}': Could not resolve host: github.com\n` + T('[Øvings-PC: det er ikke internett her, så du kan ikke klone. På en ekte PC henter git clone et repo fra for eksempel GitHub.]')); }
    if (sub === 'init') {
      const cur = FS.get(api.cwd.id);
      if (!cur || api.cwd.virt) return fail(`fatal: cannot mkdir .git: Permission denied`);
      load();
      const existing = db.repos[cur.id] && db.repos[cur.id].path === FS.pathString(cur.id);
      if (existing) { out(`Reinitialized existing Git repository in ${gitPath(cur.id)}/.git/`); emit('init', { path: winPath(cur.id), again: true }); return finish(true); }
      const outer = repoFor(cur.id);
      db.repos[cur.id] = { path: FS.pathString(cur.id), branch: 'main', commits: [], index: {} };
      save();
      out(`Initialized empty Git repository in ${gitPath(cur.id)}/.git/`);
      if (outer) out(T('[Øvings-PC: denne mappen ligger allerede inni et annet repo ({0}). Repo inni repo er sjelden lurt.]', winPath(outer.id)), 'warn');
      emit('init', { path: winPath(cur.id), name: cur.name });
      return finish(true);
    }
    if (sub === 'push' || sub === 'pull' || sub === 'fetch') {
      if (!repoFor(api.cwd.id)) return fail(NOT_REPO);
      emit(sub, { ok: false });
      return fail(sub === 'push' ? 'fatal: No configured push destination.\nEither specify the URL from the command-line or configure a remote repository using\n\n    git remote add <name> <url>\n\nand then push using the remote name\n\n    git push <name>\n' : 'fatal: No remote repository specified.  Please, specify either a URL or a\nremote name from which new revisions should be fetched.');
    }
    const R = repoFor(api.cwd.id);
    if (!R) { emit(sub, { ok: false, notRepo: true }); return fail(NOT_REPO); }
    const { id: rid, r } = R;
    switch (sub) {
      case 'status': {
        const s = status(rid, r);
        out(`On branch ${r.branch}`);
        if (!r.commits.length) out('\nNo commits yet');
        if (s.staged.length) { out('\nChanges to be committed:\n  (use "git restore --staged <file>..." to unstage)'); s.staged.forEach(([k, p]) => out(`\t${(k + ':').padEnd(12)}${p}`, 'add')); }
        if (s.unstaged.length) { out('\nChanges not staged for commit:\n  (use "git add <file>..." to update what will be committed)\n  (use "git restore <file>..." to discard changes in working directory)'); s.unstaged.forEach(([k, p]) => out(`\t${(k + ':').padEnd(12)}${p}`, 'err')); }
        const un = collapseUntracked(s.untracked, r.index);
        if (un.length) { out('\nUntracked files:\n  (use "git add <file>..." to include in what will be committed)'); un.forEach(p => out('\t' + p, 'err')); }
        out('');
        if (!s.staged.length && !s.unstaged.length && !un.length) out(r.commits.length ? 'nothing to commit, working tree clean' : 'nothing to commit (create/copy files and use "git add" to track)');
        else if (!s.staged.length && s.unstaged.length) out('no changes added to commit (use "git add" and/or "git commit -a")');
        else if (!s.staged.length && un.length) out('nothing added to commit but untracked files present (use "git add" to track)');
        emit('status', { staged: s.staged.length, modified: s.unstaged.length, untracked: un.length, clean: !s.staged.length && !s.unstaged.length && !un.length });
        return finish(true);
      }
      case 'add': {
        const paths = t.filter(x => !/^-/.test(x) || x === '-A' || x === '--all');
        if (!paths.length) { out('Nothing specified, nothing added.\nhint: Maybe you wanted to say \'git add .\'?'); emit('add', { paths: [], ok: false }); return finish(false); }
        const s = status(rid, r);
        const added = [];
        for (const raw of paths) {
          const all = raw === '.' || raw === '-A' || raw === '--all' || raw === '*';
          const rp = all ? relPath(api, rid, '.') : relPath(api, rid, raw);
          const pre = rp ? rp + '/' : '';
          const inScope = p => all ? (!rp || p === rp || p.startsWith(pre)) : (p === rp || p.startsWith(rp + '/'));
          const matches = Object.keys(s.work).filter(p => inScope(p) && (p in r.index || !ignored(p, s.rules)));
          const gone = Object.keys(r.index).filter(p => inScope(p) && !(p in s.work));
          if (!all && !matches.length && !gone.length) {
            if (Object.keys(s.work).some(p => p === rp)) { out(`The following paths are ignored by one of your .gitignore files:\n${rp}\nhint: Use -f if you really want to add them.`); emit('add', { paths: [], ok: false, ignored: rp }); return finish(false); }
            emit('add', { paths: [], ok: false });
            return fail(`fatal: pathspec '${raw}' did not match any files`);
          }
          matches.forEach(p => { r.index[p] = s.work[p]; added.push(p); });
          gone.forEach(p => { delete r.index[p]; added.push(p); });
        }
        save();
        emit('add', { paths: added, ok: true, all: paths.some(x => x === '.' || x === '-A' || x === '--all') });
        return finish(true);
      }
      case 'commit': {
        let msg = null, all = false;
        for (let i = 0; i < t.length; i++) {
          if (t[i] === '-m' || t[i] === '--message') { msg = t[i + 1] != null ? t[i + 1] : ''; i++; }
          else if (t[i] === '-am') { all = true; msg = t[i + 1] != null ? t[i + 1] : ''; i++; }
          else if (t[i] === '-a' || t[i] === '--all') all = true;
        }
        const c = config();
        if (!c['user.name'] || !c['user.email']) {
          emit('commit', { ok: false, noIdentity: true });
          return fail('Author identity unknown\n\n*** Please tell me who you are.\n\nRun\n\n  git config --global user.email "you@example.com"\n  git config --global user.name "Your Name"\n\nto set your account\'s default identity.\nOmit --global to set the identity only in this repository.\n\n' + `fatal: unable to auto-detect email address (got '${T('Elev').toLowerCase()}@${T('Elev').toUpperCase()}-PC.(none)')`);
        }
        if (msg === null) { emit('commit', { ok: false, noMessage: true }); return fail(T('[Øvings-PC: uten -m åpner Git et redigeringsprogram for meldingen. Skriv meldingen direkte i stedet:  git commit -m "Hva du gjorde"]') + '\nAborting commit due to empty commit message.'); }
        if (!msg.trim()) { emit('commit', { ok: false, noMessage: true }); return fail('Aborting commit due to empty commit message.'); }
        if (all) { const s0 = status(rid, r); Object.keys(r.index).forEach(p => { if (p in s0.work) r.index[p] = s0.work[p]; else delete r.index[p]; }); }
        const s = status(rid, r);
        if (!s.staged.length) {
          out(`On branch ${r.branch}`);
          if (s.unstaged.length) { out('Changes not staged for commit:'); s.unstaged.forEach(([k, p]) => out(`\t${(k + ':').padEnd(12)}${p}`, 'err')); out('\nno changes added to commit (use "git add" and/or "git commit -a")'); }
          else if (s.untracked.length) { out('Untracked files:'); collapseUntracked(s.untracked, r.index).forEach(p => out('\t' + p, 'err')); out('\nnothing added to commit but untracked files present (use "git add" to track)'); }
          else out('nothing to commit, working tree clean');
          emit('commit', { ok: false, nothing: true });
          return finish(false);
        }
        const H = head(r);
        let ins = 0, del = 0;
        s.staged.forEach(([, p]) => { const st = stat(H[p] || '', r.index[p] || ''); ins += st.ins; del += st.del; });
        const h = hash(), root = !r.commits.length;
        r.commits.push({ h, msg: msg.trim(), author: c['user.name'], email: c['user.email'], date: Date.now(), files: Object.assign({}, r.index) });
        if (r.commits.length > MAX_COMMITS) { r.commits.splice(0, r.commits.length - MAX_COMMITS); }
        save();
        const n = s.staged.length;
        out(`[${r.branch}${root ? ' (root-commit)' : ''} ${h.slice(0, 7)}] ${msg.trim()}`);
        out(` ${n} file${n === 1 ? '' : 's'} changed${ins ? `, ${ins} insertion${ins === 1 ? '' : 's'}(+)` : ''}${del ? `, ${del} deletion${del === 1 ? '' : 's'}(-)` : ''}`);
        s.staged.forEach(([k, p]) => { if (k === 'new file') out(` create mode 100644 ${p}`); if (k === 'deleted') out(` delete mode 100644 ${p}`); });
        emit('commit', { ok: true, msg: msg.trim(), files: n, count: r.commits.length, hash: h.slice(0, 7) });
        return finish(true);
      }
      case 'log': {
        if (!r.commits.length) { emit('log', { count: 0 }); return fail(`fatal: your current branch '${r.branch}' does not have any commits yet`); }
        const oneline = t.includes('--oneline');
        const nIdx = t.findIndex(x => /^-\d+$/.test(x) || x === '-n');
        const max = nIdx < 0 ? Infinity : t[nIdx] === '-n' ? parseInt(t[nIdx + 1], 10) || Infinity : parseInt(t[nIdx].slice(1), 10);
        r.commits.slice().reverse().slice(0, max).forEach((c, i) => {
          const tag = i === 0 ? ` (HEAD -> ${r.branch})` : '';
          if (oneline) { out(`${c.h.slice(0, 7)}${tag} ${c.msg}`, i === 0 ? 'warn' : ''); return; }
          out(`commit ${c.h}${tag}`, 'warn');
          out(`Author: ${c.author} <${c.email}>`);
          out(`Date:   ${new Date(c.date).toString().replace(/ \(.*\)$/, '').replace(/GMT/, '')}`);
          out(`\n    ${c.msg}\n`);
        });
        emit('log', { count: r.commits.length, oneline });
        return finish(true);
      }
      case 'diff': {
        const staged = t.includes('--staged') || t.includes('--cached');
        const files = t.filter(x => !/^-/.test(x)).map(x => relPath(api, rid, x));
        const s = status(rid, r);
        const A = staged ? head(r) : r.index, B = staged ? r.index : s.work;
        const paths = [...new Set([...Object.keys(A), ...Object.keys(B)])].filter(p => (p in A) && (staged || (p in r.index)) && (!files.length || files.includes(p))).concat(staged ? Object.keys(B).filter(p => !(p in A)) : []).sort();
        let changed = 0;
        paths.forEach(p => {
          const a = A[p] != null ? A[p] : '', b = B[p] != null ? B[p] : '';
          if (p in A && p in B && a === b) return;
          changed++;
          out(`diff --git a/${p} b/${p}`, 'dim');
          if (!(p in A)) out('new file mode 100644', 'dim');
          if (!(p in B)) out('deleted file mode 100644', 'dim');
          out(`--- ${p in A ? 'a/' + p : '/dev/null'}`, 'dim');
          out(`+++ ${p in B ? 'b/' + p : '/dev/null'}`, 'dim');
          const d = diffLines(a, b);
          const na = d.filter(x => x[0] !== '+').length, nb = d.filter(x => x[0] !== '-').length;
          out(`@@ -1,${na} +1,${nb} @@`, 'dim');
          d.forEach(([k, l]) => out(k + l, k === '+' ? 'add' : k === '-' ? 'err' : ''));
        });
        emit('diff', { changed, staged });
        return finish(true);
      }
      case 'restore': case 'checkout': {
        let args = t.filter(x => x !== '--');
        const stagedOnly = args.includes('--staged') || args.includes('-S');
        args = args.filter(x => !/^-/.test(x));
        if (!args.length) { emit('restore', { ok: false }); return fail(sub === 'checkout' ? T('[Øvings-PC: grener (branch) er ikke med her. Bruk git restore <fil> for å angre endringer i en fil.]') : 'fatal: you must specify path(s) to restore'); }
        const s = status(rid, r);
        const H = head(r);
        for (const raw of args) {
          const all = raw === '.';
          const rp = all ? relPath(api, rid, '.') : relPath(api, rid, raw);
          const inScope = p => all ? (!rp || p.startsWith(rp + '/') || p === rp) : p === rp || p.startsWith(rp + '/');
          const known = Object.keys(stagedOnly ? Object.assign({}, H, r.index) : r.index).filter(inScope);
          if (!known.length) { emit('restore', { ok: false, file: raw }); return fail(`error: pathspec '${raw}' did not match any file(s) known to git`); }
          for (const p of known) {
            if (stagedOnly) { if (p in H) r.index[p] = H[p]; else delete r.index[p]; continue; }
            const want = r.index[p];
            if (s.work[p] === want) continue;
            const parts = p.split('/'); let pid = rid;
            for (const d of parts.slice(0, -1)) { let f = FS.children(pid).find(c => c.type === 'folder' && c.name === d); if (!f) { f = FS.createFolder(pid, d, { via: 'git' }); if (f.error) return fail('error: ' + f.error); } pid = f.id; }
            const ex = FS.children(pid).find(c => c.type === 'file' && c.name === parts[parts.length - 1]);
            const w = ex ? FS.write(ex.id, want) : FS.createFile(pid, parts[parts.length - 1], want, { via: 'git' });
            if (w && w.error) return fail('error: ' + w.error);
          }
          emit('restore', { ok: true, file: rp, staged: stagedOnly });
        }
        save();
        return finish(true);
      }
      case 'branch': out(`* ${r.branch}`, 'add'); emit('branch'); return finish(true);
      case 'remote': emit('remote'); return finish(true);
      case 'show': {
        const c = r.commits[r.commits.length - 1];
        if (!c) return fail("fatal: your current branch 'main' does not have any commits yet");
        out(`commit ${c.h} (HEAD -> ${r.branch})`, 'warn'); out(`Author: ${c.author} <${c.email}>`); out(`\n    ${c.msg}\n`);
        return finish(true);
      }
      default:
        emit(sub, { ok: false, unknown: true });
        return fail(`git: '${sub}' is not a git command. See 'git --help'.`);
    }
  }
  function cmdConfig(api, t) {
    const { out, finish, fail } = api;
    const c = config();
    const args = t.filter(x => x !== '--global' && x !== '--local');
    if (args[0] === '--list' || args[0] === '-l') { Object.keys(c).forEach(k => out(`${k}=${c[k]}`)); emit('config', { list: true }); return finish(true); }
    const key = (args[0] || '').toLowerCase();
    if (!key) return fail('usage: git config [<options>]');
    if (!['user.name', 'user.email', 'init.defaultbranch', 'core.editor'].includes(key)) { if (args.length < 2) return finish(false); c[key] = args.slice(1).join(' '); saveCfg(); return finish(true); }
    if (args.length < 2) { if (c[key]) { out(c[key]); return finish(true); } return finish(false); }
    c[key] = args.slice(1).join(' ');
    saveCfg();
    emit('config', { key, value: c[key] });
    return finish(true);
  }
  /* For oppdragene: repoet i en mappe, og navn/e-post */
  function repoAt(folderId) { const R = repoFor(folderId); return R ? { id: R.id, commits: R.r.commits.map(c => ({ msg: c.msg, files: Object.assign({}, c.files) })), index: Object.assign({}, R.r.index), status: (() => { const s = status(R.id, R.r); return { staged: s.staged.length, modified: s.unstaged.length, untracked: collapseUntracked(s.untracked, R.r.index).length }; })() } : null; }
  function removeRepo(folderId) { load(); delete db.repos[folderId]; save(); }
  /* Brukes i oppsettet til oppdrag som trenger et repo med én commit fra før */
  function seed(folderId, msg) {
    load();
    const files = workTree(folderId), c = config();
    db.repos[folderId] = { path: FS.pathString(folderId), branch: 'main', index: Object.assign({}, files), commits: [{ h: hash(), msg, author: c['user.name'] || T('Elev'), email: c['user.email'] || 'elev@skolen.no', date: Date.now(), files }] };
    save();
  }
  function isRepo(folderId) { load(); const r = db.repos[folderId]; return !!r && r.path === FS.pathString(folderId); }
  function resetConfig() { cfg = {}; saveCfg(); }
  return { git, repoAt, removeRepo, seed, isRepo, config: () => Object.assign({}, config()), resetConfig, diffLines };
})();
window.Git = Git;
window.TermExt = window.TermExt || {};
TermExt.git = api => Git.git(api);
