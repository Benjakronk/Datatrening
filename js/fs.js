/* Virtuelt filsystem for øvings-PC-en. Lagres i localStorage. */
const FS = (() => {
  let nodes = {}, nextId = 1, roots = {};
  const INVALID = /[\\/:*?"<>|]/;
  let silent = false;
  const undoStack = [];

  function now() { return Date.now(); }
  function mk(name, type, parent, extra = {}) {
    const n = {
      id: nextId++, name, type, parent: parent == null ? null : parent,
      children: type === 'folder' ? [] : undefined,
      content: extra.content || '',
      size: extra.size != null ? extra.size : (type === 'file' ? 14 * 1024 + Math.floor(Math.random() * 900 * 1024) : 0),
      modified: extra.modified || (now() - Math.floor(Math.random() * 20) * 86400000),
      system: !!extra.system, origParent: null
    };
    nodes[n.id] = n;
    if (parent != null) nodes[parent].children.push(n.id);
    return n;
  }
  function get(id) { return nodes[id] || null; }
  function children(id) { const n = nodes[id]; return n && n.children ? n.children.map(c => nodes[c]).filter(Boolean) : []; }
  function path(id) { const arr = []; let n = nodes[id]; while (n) { arr.unshift(n); n = n.parent != null ? nodes[n.parent] : null; } return arr; }
  function pathString(id) { return path(id).map(n => n.name).join(' > '); }
  function ext(name) { const i = name.lastIndexOf('.'); return i > 0 ? name.slice(i + 1).toLowerCase() : ''; }
  function base(name) { const i = name.lastIndexOf('.'); return i > 0 ? name.slice(0, i) : name; }
  function displayName(n, showExt) { return (n.type === 'file' && !showExt && ext(n.name)) ? base(n.name) : n.name; }
  function validate(name) {
    name = (name || '').trim();
    if (!name) return 'Du må skrive inn et navn.';
    if (INVALID.test(name)) return 'Et navn kan ikke inneholde disse tegnene:  \\ / : * ? " < > |';
    return null;
  }
  function hasChild(pid, name, except) { return children(pid).some(c => c.id !== except && c.name.toLowerCase() === name.toLowerCase()); }
  function uniqueName(pid, name, copy) {
    if (!hasChild(pid, name)) return name;
    const b = base(name), e = ext(name), s = e ? '.' + e : '';
    if (copy) {
      if (!hasChild(pid, b + ' - Kopi' + s)) return b + ' - Kopi' + s;
      let i = 2; while (hasChild(pid, b + ' - Kopi (' + i + ')' + s)) i++;
      return b + ' - Kopi (' + i + ')' + s;
    }
    let i = 2; while (hasChild(pid, b + ' (' + i + ')' + s)) i++;
    return b + ' (' + i + ')' + s;
  }
  function emit(op, data) { save(); if (silent) return; Bus.emit('fs', Object.assign({ op }, data)); }
  function isDesc(id, anc) { let n = nodes[id]; while (n) { if (n.id === anc) return true; n = n.parent != null ? nodes[n.parent] : null; } return false; }
  function inBin(id) { return isDesc(id, roots.bin); }
  function touch(id) { if (nodes[id]) nodes[id].modified = now(); }
  function detach(id) { const n = nodes[id]; const p = nodes[n.parent]; if (p) p.children = p.children.filter(c => c !== id); n.parent = null; }
  function attach(id, pid) { nodes[id].parent = pid; nodes[pid].children.push(id); }

  function createFolder(pid, name, opts = {}) {
    const err = validate(name); if (err) return { error: err };
    name = name.trim();
    if (hasChild(pid, name)) return { error: 'Det finnes allerede en mappe eller fil med navnet «' + name + '» her.' };
    const n = mk(name, 'folder', pid, { modified: now() });
    touch(pid);
    undoStack.push({ type: 'create', id: n.id });
    emit('create', { id: n.id, name, parent: pid, kind: 'folder', via: opts.via });
    return n;
  }
  function createFile(pid, name, content = '', opts = {}) {
    const err = validate(name); if (err) return { error: err };
    name = name.trim();
    if (hasChild(pid, name)) return { error: 'Det finnes allerede en fil med navnet «' + name + '» her.' };
    const n = mk(name, 'file', pid, { content, size: Math.max(1024, content.length * 12), modified: now() });
    touch(pid);
    undoStack.push({ type: 'create', id: n.id });
    emit('create', { id: n.id, name, parent: pid, kind: 'file', via: opts.via });
    return n;
  }
  function write(id, content) {
    const n = nodes[id]; if (!n) return;
    n.content = content; n.size = Math.max(1024, content.length * 12); n.modified = now();
    emit('write', { id, name: n.name });
  }
  function rename(id, newName, opts = {}) {
    const n = nodes[id];
    const err = validate(newName); if (err) return { error: err };
    newName = newName.trim();
    if (newName === n.name) return n;
    if (n.system) return { error: 'Denne mappen kan ikke få nytt navn.' };
    if (hasChild(n.parent, newName, id)) return { error: 'Det finnes allerede en fil eller mappe med navnet «' + newName + '» her.' };
    const old = n.name; n.name = newName; n.modified = now();
    undoStack.push({ type: 'rename', id, old });
    emit('rename', { id, old, name: newName, parent: n.parent, kind: n.type, via: opts.via });
    return n;
  }
  function move(id, pid, opts = {}) {
    const n = nodes[id];
    if (!n || !nodes[pid]) return { error: 'Fant ikke mappen.' };
    if (n.parent === pid) return n;
    if (id === pid || isDesc(pid, id)) return { error: 'Du kan ikke flytte en mappe inn i seg selv.' };
    if (n.system) return { error: 'Denne mappen kan ikke flyttes.' };
    if (pid === roots.bin) return remove(id, opts);
    const from = n.parent;
    detach(id); n.name = uniqueName(pid, n.name); attach(id, pid);
    if (inBin(from)) n.origParent = null;
    touch(from); touch(pid);
    undoStack.push({ type: 'move', id, from });
    emit('move', { id, name: n.name, from, to: pid, kind: n.type, via: opts.via });
    return n;
  }
  function clone(id, pid, name) {
    const n = nodes[id];
    const c = mk(name || n.name, n.type, pid, { content: n.content, size: n.size, modified: now() });
    if (n.type === 'folder') n.children.forEach(ch => clone(ch, c.id));
    return c;
  }
  function copy(id, pid, opts = {}) {
    const n = nodes[id];
    if (!n || !nodes[pid]) return { error: 'Fant ikke mappen.' };
    if (id === pid || isDesc(pid, id)) return { error: 'Du kan ikke kopiere en mappe inn i seg selv.' };
    const nm = uniqueName(pid, n.name, n.parent === pid);
    const c = clone(id, pid, nm);
    touch(pid);
    undoStack.push({ type: 'create', id: c.id });
    emit('copy', { id: c.id, source: id, name: c.name, to: pid, kind: c.type, via: opts.via });
    return c;
  }
  function remove(id, opts = {}) {
    const n = nodes[id];
    if (!n) return { error: 'Fant ikke filen.' };
    if (n.system) return { error: 'Denne mappen kan ikke slettes.' };
    if (inBin(id)) return purge(id);
    const from = n.parent;
    n.origParent = from;
    detach(id); n.name = uniqueName(roots.bin, n.name); attach(id, roots.bin);
    touch(from);
    undoStack.push({ type: 'delete', id });
    emit('delete', { id, name: n.name, from, kind: n.type, via: opts.via });
    return n;
  }
  function restore(id) {
    const n = nodes[id];
    if (!n) return;
    let t = n.origParent;
    if (t == null || !nodes[t] || inBin(t)) t = roots.documents;
    detach(id); n.name = uniqueName(t, n.name); attach(id, t);
    n.origParent = null; touch(t);
    emit('restore', { id, name: n.name, to: t, kind: n.type });
    return n;
  }
  function purge(id) {
    const n = nodes[id]; if (!n) return;
    detach(id);
    (function del(x) { const m = nodes[x]; if (!m) return; if (m.children) m.children.forEach(del); delete nodes[x]; })(id);
    emit('purge', { id, name: n.name, kind: n.type });
  }
  function emptyBin() {
    const ids = children(roots.bin).map(c => c.id);
    const was = silent; silent = true;
    ids.forEach(purge);
    silent = was;
    emit('empty-bin', { count: ids.length });
  }
  function undo() {
    const u = undoStack.pop();
    if (!u) return false;
    const n = nodes[u.id];
    if (!n) return undo();
    const was = silent; silent = true;
    try {
      if (u.type === 'create') { detach(u.id); delete nodes[u.id]; }
      else if (u.type === 'rename') { n.name = uniqueName(n.parent, u.old); }
      else if (u.type === 'move') { if (nodes[u.from]) { detach(u.id); n.name = uniqueName(u.from, n.name); attach(u.id, u.from); } }
      else if (u.type === 'delete') { const t = nodes[n.origParent] ? n.origParent : roots.documents; detach(u.id); n.name = uniqueName(t, n.name); attach(u.id, t); n.origParent = null; }
    } finally { silent = was; }
    emit('undo', { what: u.type, id: u.id, name: n.name });
    return true;
  }

  function search(q, rootId) {
    q = q.toLowerCase(); const out = [];
    (function walk(id) { children(id).forEach(c => { if (c.name.toLowerCase().includes(q)) out.push(c); if (c.type === 'folder') walk(c.id); }); })(rootId);
    return out;
  }
  function findAll(pred, opts = {}) {
    const out = [];
    const rs = [roots.pc, roots.onedrive].concat(opts.includeBin ? [roots.bin] : []);
    rs.forEach(r => (function walk(id) { children(id).forEach(c => { if (pred(c)) out.push(c); if (c.type === 'folder') walk(c.id); }); })(r));
    return out;
  }
  function findByName(name, type, opts) {
    const l = name.toLowerCase();
    return findAll(c => c.name.toLowerCase() === l && (!type || c.type === type), opts)[0] || null;
  }
  function findInBin(name) { const l = name.toLowerCase(); return children(roots.bin).find(c => c.name.toLowerCase() === l) || null; }
  function resolve(names) {
    let cur = Object.values(roots).map(id => nodes[id]).find(n => n && n.name.toLowerCase() === names[0].toLowerCase());
    if (!cur) return null;
    for (let i = 1; i < names.length; i++) {
      cur = children(cur.id).find(c => c.name.toLowerCase() === names[i].toLowerCase());
      if (!cur) return null;
    }
    return cur;
  }
  /* Hjelpere for oppdrag-oppsett (lager ting stille, uten hendelser) */
  function ensureFolder(names) {
    let cur = resolve([names[0]]);
    for (let i = 1; i < names.length; i++) {
      let nx = children(cur.id).find(c => c.type === 'folder' && c.name.toLowerCase() === names[i].toLowerCase());
      if (!nx) nx = mk(names[i], 'folder', cur.id, { modified: now() });
      cur = nx;
    }
    save();
    return cur;
  }
  function ensureFile(names, name, content) {
    const f = findByName(name, 'file');
    if (f) return f;
    const folder = ensureFolder(names);
    const n = mk(name, 'file', folder.id, { content: content || '' });
    save();
    return n;
  }
  function ensureFileAt(names, name, content) {
    const folder = ensureFolder(names);
    let f = findByName(name, 'file') || findInBin(name);
    if (f) {
      if (f.parent !== folder.id) { detach(f.id); f.name = uniqueName(folder.id, name); attach(f.id, folder.id); f.origParent = null; }
      save();
      return f;
    }
    const n = mk(name, 'file', folder.id, { content: content || '' });
    save();
    return n;
  }
  function silentRemoveAll(name) {
    findAll(c => c.name.toLowerCase() === name.toLowerCase(), { includeBin: true }).forEach(c => {
      detach(c.id);
      (function del(x) { const m = nodes[x]; if (!m) return; if (m.children) m.children.forEach(del); delete nodes[x]; })(c.id);
    });
    save();
  }
  function silentRename(id, name) { const n = nodes[id]; if (n) { n.name = uniqueName(n.parent, name); save(); } }
  function notify() { save(); Bus.emit('fs', { op: 'refresh' }); }

  function serialize() { return JSON.stringify({ nodes, nextId, roots }); }
  function save() { try { localStorage.setItem('dt-fs', serialize()); } catch (e) { /* ignorer */ } }
  function load() {
    try {
      const s = localStorage.getItem('dt-fs'); if (!s) return false;
      const d = JSON.parse(s);
      if (!d.nodes || !d.roots || !d.roots.pc) return false;
      nodes = d.nodes; nextId = d.nextId; roots = d.roots;
      return true;
    } catch (e) { return false; }
  }
  function reset() { nodes = {}; nextId = 1; roots = {}; undoStack.length = 0; seed(); save(); Bus.emit('fs', { op: 'reset' }); }

  function seed() {
    const pc = mk('Denne PC-en', 'folder', null, { system: true }); roots.pc = pc.id;
    const desk = mk('Skrivebord', 'folder', pc.id, { system: true }); roots.desktop = desk.id;
    const docs = mk('Dokumenter', 'folder', pc.id, { system: true }); roots.documents = docs.id;
    const dl = mk('Nedlastinger', 'folder', pc.id, { system: true }); roots.downloads = dl.id;
    const pics = mk('Bilder', 'folder', pc.id, { system: true }); roots.pictures = pics.id;
    const od = mk('OneDrive', 'folder', null, { system: true }); roots.onedrive = od.id;
    mk('Skole', 'folder', od.id);
    const bin = mk('Papirkurv', 'folder', null, { system: true }); roots.bin = bin.id;

    const gml = mk('Gammelt', 'folder', docs.id);
    const pr = mk('Prosjekter', 'folder', gml.id);
    const kt = mk('Klassetur', 'folder', pr.id);
    mk('Klassetur-budsjett.xlsx', 'file', kt.id);
    mk('Sommerprosjekt.docx', 'file', pr.id, { content: 'Sommerprosjekt – planter i skolegården\n\nVi plantet solsikker og målte hvor fort de vokste.' });
    mk('Leksjon-1.pptx', 'file', gml.id);
    mk('Notater-7-trinn.txt', 'file', gml.id, { content: 'Husk: gymtøy på tirsdager.\nInnlevering naturfag fredag.' });
    mk('Dokument (3).docx', 'file', docs.id, { content: 'Analyse av diktet «Nordlys»\n\nDiktet handler om lyset som danser over himmelen om vinteren. Dikteren bruker mange bilder ...' });
    mk('Fotosyntese.pptx', 'file', docs.id);
    mk('Matteprøve.pdf', 'file', docs.id);
    mk('gammel-liste.txt', 'file', docs.id, { content: 'melk\nbrød\nost\nepler' });
    mk('IMG_2031.jpg', 'file', dl.id);
    mk('skjema.pdf', 'file', dl.id);
    mk('Klassebilde.jpg', 'file', pics.id);
    mk('Tur-til-fjellet.jpg', 'file', pics.id);
  }
  function init() { if (!load()) { seed(); save(); } }

  return {
    init, reset, roots: () => roots, get, children, path, pathString, ext, base, displayName, validate, hasChild, uniqueName,
    isDesc, inBin, createFolder, createFile, write, rename, move, copy, remove, restore, purge, emptyBin, undo,
    search, findAll, findByName, findInBin, resolve, ensureFolder, ensureFile, ensureFileAt, silentRemoveAll, silentRename, notify,
    canUndo: () => undoStack.length > 0
  };
})();
