/* Felles hjelpefunksjoner: hendelsesbuss, HTML-hjelpere, kontekstmeny, dra-og-slipp, varsler, mappetre */

const Bus = {
  log: [],
  handlers: [],
  emit(type, data = {}) {
    this.log.push({ type, data, t: Date.now() });
    if (this.log.length > 5000) this.log.splice(0, 1000);
    this.handlers.forEach(h => { try { h(type, data); } catch (e) { console.error(e); } });
  },
  on(h) { this.handlers.push(h); }
};

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}
function fmtDate(ts) {
  const d = new Date(ts);
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}
function fmtSize(b) {
  if (b == null) return '';
  if (b < 1024) return b + ' B';
  if (b < 1024 * 1024) return Math.max(1, Math.round(b / 1024)) + ' kB';
  return (b / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
}

/* ---------- Kontekstmeny ---------- */
const Ctx = {
  el: null,
  /* where: kort kode for hva som ble høyreklikket (desktop, file, folder, taskbar …).
     label: lesbar beskrivelse som brukes i oppdrag («filen «Dikt.docx»»). */
  show(x, y, items, where, label) {
    this.hide();
    const m = document.createElement('div');
    m.id = 'ctxmenu';
    this.build(m, items);
    document.body.appendChild(m);
    const r = m.getBoundingClientRect();
    if (x + r.width > window.innerWidth) x = window.innerWidth - r.width - 4;
    if (y + r.height > window.innerHeight) y = window.innerHeight - r.height - 4;
    m.style.left = x + 'px';
    m.style.top = y + 'px';
    this.el = m;
    this._out = e => { if (!m.contains(e.target)) Ctx.hide('outside'); };
    this._key = e => { if (e.key === 'Escape') { e.stopPropagation(); Ctx.hide('esc'); } };
    setTimeout(() => {
      document.addEventListener('pointerdown', this._out, true);
      document.addEventListener('keydown', this._key, true);
    }, 0);
    Bus.emit('ctxmenu', { where: where || '', label: label || '' });
  },
  build(m, items) {
    items.forEach(it => {
      if (it === '-') { m.appendChild(el('<div class="cm-sep"></div>')); return; }
      if (!it) return;
      const d = el(`<div class="cm-item"><span class="ico">${it.icon || ''}</span><span>${esc(it.label)}</span>${it.kbd ? `<span class="kbd">${esc(it.kbd)}</span>` : ''}${it.sub ? '<span class="arrow">›</span>' : ''}</div>`);
      if (it.checked != null) d.querySelector('.ico').textContent = it.checked ? '✓' : '';
      if (it.disabled) d.classList.add('disabled');
      if (it.sub) {
        const s = document.createElement('div');
        s.className = 'submenu';
        this.build(s, it.sub);
        d.appendChild(s);
      } else {
        d.addEventListener('click', e => { e.stopPropagation(); Ctx.hide('item'); if (it.action) it.action(); });
      }
      m.appendChild(d);
    });
  },
  hide(via) {
    if (this.el) {
      this.el.remove(); this.el = null;
      if (via) Bus.emit('ctxmenu-close', { via });
    }
    if (this._out) document.removeEventListener('pointerdown', this._out, true);
    if (this._key) document.removeEventListener('keydown', this._key, true);
  }
};

/* ---------- Dra og slipp ---------- */
const DnD = {
  ids: [],
  source(elm, getIds) {
    elm.draggable = true;
    elm.addEventListener('dragstart', e => {
      DnD.ids = getIds();
      if (!DnD.ids.length) { e.preventDefault(); return; }
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', DnD.ids.join(','));
      Bus.emit('dragstart', { ids: DnD.ids.slice() });
    });
    elm.addEventListener('dragend', () => { DnD.ids = []; document.querySelectorAll('.drop-hover').forEach(x => x.classList.remove('drop-hover')); });
  },
  /* folderId: mappe-id eller 'bin'. filter(e) kan avvise (f.eks. når man drar over et vindu på skrivebordet). */
  target(elm, target, after, filter) {
    const fid = () => typeof target === 'function' ? target() : target;
    elm.addEventListener('dragover', e => {
      if (!DnD.ids.length) return;
      if (filter && !filter(e)) return;
      const folderId = fid();
      if (folderId !== 'bin' && DnD.ids.some(id => id === folderId || FS.isDesc(folderId, id))) return;
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'move';
      elm.classList.add('drop-hover');
    });
    elm.addEventListener('dragleave', () => elm.classList.remove('drop-hover'));
    elm.addEventListener('drop', e => {
      if (filter && !filter(e)) return;
      e.preventDefault();
      e.stopPropagation();
      elm.classList.remove('drop-hover');
      const folderId = fid();
      const ids = DnD.ids.slice();
      DnD.ids = [];
      if (!ids.length) return;
      const names = ids.map(id => (FS.get(id) || {}).name);
      ids.forEach(id => {
        if (!FS.get(id)) return;
        if (folderId === 'bin') { const r = FS.remove(id, { via: 'drag' }); if (r && r.error) Toast.show(r.error); }
        else { const r = FS.move(id, folderId, { via: 'drag' }); if (r && r.error) Toast.show(r.error); }
      });
      Bus.emit('drop', { ids, names, target: folderId });
      if (after) after();
    });
  }
};

/* ---------- Varsler nede til høyre ---------- */
const Toast = {
  show(msg, ms = 3200) {
    const box = document.getElementById('toasts');
    const t = el(`<div class="toast">${esc(msg)}</div>`);
    box.appendChild(t);
    setTimeout(() => t.remove(), ms);
  }
};

/* ---------- Mappetre (brukes i Filutforsker og i Lagre som/Åpne) ---------- */
const NavTree = {
  render(container, st) {
    const R = FS.roots();
    container.innerHTML = '';
    const quick = [R.desktop, R.downloads, R.documents, R.pictures];
    quick.forEach(id => container.appendChild(item(FS.get(id), 0, false, false)));
    container.appendChild(el('<div class="nav-gap"></div>'));
    tree(R.onedrive, 0);
    tree(R.pc, 0);
    container.appendChild(el('<div class="nav-gap"></div>'));
    container.appendChild(item(FS.get(R.bin), 0, false, false));

    function tree(id, depth) {
      const n = FS.get(id);
      const kids = FS.children(id).filter(c => c.type === 'folder');
      const exp = st.expanded.has(id);
      container.appendChild(item(n, depth, kids.length > 0, exp));
      if (exp) kids.sort((a, b) => a.name.localeCompare(b.name, 'nb')).forEach(k => tree(k.id, depth + 1));
    }
    function item(n, depth, hasKids, exp) {
      const d = el(`<div class="nav-item${n.id === st.cwd ? ' active' : ''}" data-id="${n.id}"><span class="tw">${hasKids ? (exp ? '▾' : '▸') : ''}</span><span class="ico">${Icons.navIcon(n)}</span><span class="lbl">${esc(n.name)}</span></div>`);
      d.style.paddingLeft = (8 + depth * 14) + 'px';
      d.querySelector('.tw').addEventListener('click', e => {
        e.stopPropagation();
        if (!hasKids) return;
        if (exp) st.expanded.delete(n.id); else st.expanded.add(n.id);
        Bus.emit('nav-expand', { name: n.name, open: !exp });
        NavTree.render(container, st);
      });
      d.addEventListener('click', () => st.onNav(n.id));
      if (st.onCtx) d.addEventListener('contextmenu', e => { e.preventDefault(); e.stopPropagation(); st.onCtx(n, e); });
      if (st.drop) DnD.target(d, n.id === FS.roots().bin ? 'bin' : n.id, st.onDropped);
      return d;
    }
  }
};
