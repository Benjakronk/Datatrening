/* Notater: en forenklet OneNote. Notatblokk → inndeling → side.
   Lagres i localStorage (notatblokken ligger «i OneDrive», som i OneNote). */
const Notater = (() => {
  const KEY = 'dt-notes';
  const COLORS = ['#7719aa', '#c239b3', '#e3008c', '#d13438', '#ca5010', '#986f0b', '#498205', '#00b294', '#0078d4', '#4f6bed'];
  let data = null, win = null, root = null;

  function seed() {
    return {
      book: 'Skolen min',
      sections: [
        { id: 1, name: 'Norsk', color: COLORS[0], pages: [{ id: 1, title: 'Velkommen', html: '<div>Dette er en <b>side</b> i notatblokken din.</div><div><br></div><div>Til venstre ser du <b>inndelinger</b> (ett fag hver). I midten ser du <b>sidene</b> i inndelingen du har valgt.</div>', modified: Date.now() - 86400000 }] },
        { id: 2, name: 'Matte', color: COLORS[6], pages: [{ id: 2, title: 'Brøk', html: '<div>Forkorte brøk: del teller og nevner på det samme tallet.</div>', modified: Date.now() - 172800000 }] }
      ],
      curSec: 1, curPage: 1, nextId: 3
    };
  }
  function load() {
    if (data) return data;
    try { const s = localStorage.getItem(KEY); if (s) { const d = JSON.parse(s); if (d && Array.isArray(d.sections)) { data = d; return data; } } } catch (e) { /* ignorer */ }
    data = seed(); save(); return data;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignorer */ } }
  function sec(id) { return data.sections.find(s => s.id === id) || null; }
  function curSec() { return sec(data.curSec) || data.sections[0] || null; }
  function curPage() { const s = curSec(); return s ? (s.pages.find(p => p.id === data.curPage) || s.pages[0] || null) : null; }
  function pageOf(id) { for (const s of data.sections) { const p = s.pages.find(x => x.id === id); if (p) return { s, p }; } return null; }
  function plain(html) { const d = document.createElement('div'); d.innerHTML = html || ''; return d.innerText.replace(/ /g, ' '); }

  function open() {
    if (win) { WM.focus(win, 'open'); return win; }
    if (WM.full()) return null;
    load();
    root = el(`<div class="note">
      <div class="note-top"><span class="note-book">📓 <b class="bn"></b></span><span class="note-loc"></span><span class="spacer"></span><input class="note-search txt" placeholder="Søk i notatblokken"></div>
      <div class="note-body">
        <div class="note-secs"><div class="secs"></div><button class="note-add" data-a="newsec">+ Ny inndeling</button></div>
        <div class="note-pages"><div class="pages"></div><button class="note-add" data-a="newpage">+ Ny side</button></div>
        <div class="note-main">
          <input class="note-title" placeholder="Sidetittel">
          <div class="note-tools"><button data-c="bold" title="Fet (Ctrl+B)"><b>F</b></button><button data-c="italic" title="Kursiv (Ctrl+I)"><i>K</i></button><button data-c="insertUnorderedList" title="Punktliste">• liste</button><button data-c="todo" title="Avkryssingsboks">☐ huskeliste</button></div>
          <div class="note-page" contenteditable="true" spellcheck="false"></div>
          <div class="note-status"></div>
        </div>
      </div>
    </div>`);
    win = WM.create({ app: 'notater', title: 'Notater', body: root, width: 960, height: 620 });
    win.onClosed = () => { win = null; root = null; };
    win.onKey = e => { if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); Toast.show('Notater lagrer av seg selv. Du trenger ikke trykke Ctrl+S.'); } };
    const pageEl = root.querySelector('.note-page'), titleEl = root.querySelector('.note-title');

    root.querySelector('[data-a="newsec"]').addEventListener('click', () => newSection());
    root.querySelector('[data-a="newpage"]').addEventListener('click', () => newPage());
    root.querySelector('.note-tools').addEventListener('mousedown', e => e.preventDefault());
    root.querySelector('.note-tools').addEventListener('click', e => {
      const c = e.target.closest('button') && e.target.closest('button').dataset.c; if (!c) return;
      pageEl.focus();
      if (c === 'todo') document.execCommand('insertHTML', false, '<div><input type="checkbox"> </div>');
      else document.execCommand(c, false, null);
      onEdit();
    });
    pageEl.addEventListener('input', onEdit);
    pageEl.addEventListener('keydown', e => {
      if (e.ctrlKey && ['b', 'i', 'u'].includes(e.key.toLowerCase())) { e.preventDefault(); document.execCommand(e.key.toLowerCase() === 'b' ? 'bold' : e.key.toLowerCase() === 'i' ? 'italic' : 'underline'); onEdit(); }
      if (e.key === 'Escape') e.stopPropagation();
    });
    pageEl.addEventListener('click', e => { if (e.target.type === 'checkbox') { e.target.toggleAttribute('checked', e.target.checked); onEdit(); Bus.emit('notes-check', { on: e.target.checked }); } });
    titleEl.addEventListener('input', () => { const p = curPage(); if (!p) return; p.title = titleEl.value; p.modified = Date.now(); save(); renderPages(); Bus.emit('notes-title', { title: p.title }); });
    const srch = root.querySelector('.note-search');
    srch.addEventListener('keydown', e => e.stopPropagation());
    let st = null;
    srch.addEventListener('input', () => { clearTimeout(st); st = setTimeout(() => doSearch(srch.value), 250); });
    root.addEventListener('contextmenu', e => { if (!e.target.closest('.sec-row, .page-row, .note-page')) { e.preventDefault(); e.stopPropagation(); Ctx.show(e.clientX, e.clientY, [{ label: 'Ny inndeling', action: newSection }, { label: 'Ny side', action: newPage }], 'notater', 'notatblokken'); } });

    function onEdit() { const p = curPage(); if (!p) return; p.html = pageEl.innerHTML; p.modified = Date.now(); save(); status(); Bus.emit('notes-edit', { page: p.title, text: plain(p.html) }); }
    function status() { const p = curPage(); root.querySelector('.note-status').textContent = p ? 'Lagres automatisk · sist endret ' + fmtDate(p.modified) : ''; }

    function render() { renderSecs(); renderPages(); renderPage(); root.querySelector('.bn').textContent = data.book; }
    function renderSecs() {
      const box = root.querySelector('.secs'); box.innerHTML = '';
      data.sections.forEach(s => {
        const r = el(`<div class="sec-row${s.id === data.curSec ? ' active' : ''}"><span class="dot" style="background:${s.color}"></span><span class="nm">${esc(s.name)}</span><span class="cnt">${s.pages.length}</span></div>`);
        r.addEventListener('click', () => { data.curSec = s.id; const p = s.pages[0]; data.curPage = p ? p.id : 0; save(); render(); Bus.emit('notes-open-section', { name: s.name }); });
        r.addEventListener('contextmenu', e => {
          e.preventDefault(); e.stopPropagation();
          Ctx.show(e.clientX, e.clientY, [
            { label: 'Ny side i denne inndelingen', action: () => { data.curSec = s.id; newPage(); } },
            '-',
            { label: 'Gi nytt navn …', action: async () => { const v = await Dialog.prompt('Gi nytt navn', 'Nytt navn på inndelingen:', s.name, x => x.trim() ? null : 'Skriv et navn.'); if (v) { const old = s.name; s.name = v; save(); render(); Bus.emit('notes-rename-section', { old, name: v }); } } },
            { label: 'Endre farge', sub: COLORS.map((c, i) => ({ label: 'Farge ' + (i + 1), icon: `<span style="display:inline-block;width:12px;height:12px;border-radius:2px;background:${c}"></span>`, action: () => { s.color = c; save(); render(); } })) },
            '-',
            { label: 'Slett inndelingen', action: async () => { if (data.sections.length < 2) { Toast.show('Notatblokken må ha minst én inndeling.'); return; } if (await Dialog.confirm('Slett inndeling', `Slette «${s.name}» med ${s.pages.length} side(r)? Dette kan ikke angres.`)) { data.sections = data.sections.filter(x => x !== s); data.curSec = data.sections[0].id; data.curPage = data.sections[0].pages[0] ? data.sections[0].pages[0].id : 0; save(); render(); Bus.emit('notes-delete-section', { name: s.name }); } } }
          ], 'notater-sec', 'inndelingen «' + s.name + '»');
        });
        box.appendChild(r);
      });
    }
    function renderPages() {
      const box = root.querySelector('.pages'); box.innerHTML = '';
      const s = curSec(); if (!s) return;
      root.querySelector('.note-loc').textContent = s.name + (curPage() ? ' › ' + curPage().title : '');
      s.pages.forEach(p => {
        const r = el(`<div class="page-row${p.id === data.curPage ? ' active' : ''}"><span class="nm">${esc(p.title || 'Uten tittel')}</span><span class="dt">${esc(fmtDate(p.modified).split(' ')[0])}</span></div>`);
        r.addEventListener('click', () => { data.curPage = p.id; save(); render(); Bus.emit('notes-open-page', { title: p.title, section: s.name }); });
        r.addEventListener('contextmenu', e => {
          e.preventDefault(); e.stopPropagation();
          Ctx.show(e.clientX, e.clientY, [
            { label: 'Gi nytt navn …', action: async () => { const v = await Dialog.prompt('Gi nytt navn', 'Ny tittel på siden:', p.title, x => x.trim() ? null : 'Skriv en tittel.'); if (v) { const old = p.title; p.title = v; save(); render(); Bus.emit('notes-title', { old, title: v }); } } },
            { label: 'Flytt til inndeling', sub: data.sections.filter(x => x !== s).map(x => ({ label: x.name, action: () => { s.pages = s.pages.filter(y => y !== p); x.pages.push(p); data.curSec = x.id; data.curPage = p.id; save(); render(); Toast.show(`«${p.title}» ble flyttet til ${x.name}.`); Bus.emit('notes-move', { title: p.title, from: s.name, to: x.name }); } })) },
            '-',
            { label: 'Slett siden', action: async () => { if (await Dialog.confirm('Slett side', `Slette «${p.title}»? Dette kan ikke angres.`)) { s.pages = s.pages.filter(x => x !== p); data.curPage = s.pages[0] ? s.pages[0].id : 0; save(); render(); Bus.emit('notes-delete-page', { title: p.title }); } } }
          ], 'notater-page', 'siden «' + p.title + '»');
        });
        box.appendChild(r);
      });
      if (!s.pages.length) box.appendChild(el('<div class="note-empty">Ingen sider ennå.<br>Klikk «Ny side».</div>'));
    }
    function renderPage() {
      const p = curPage();
      root.querySelector('.note-main').classList.toggle('empty', !p);
      titleEl.value = p ? p.title : '';
      pageEl.innerHTML = p ? (p.html || '') : '';
      titleEl.disabled = !p; pageEl.setAttribute('contenteditable', p ? 'true' : 'false');
      status();
    }
    async function newSection() {
      const v = await Dialog.prompt('Ny inndeling', 'Navn på inndelingen (for eksempel et fag):', '', x => x.trim() ? null : 'Skriv et navn.');
      if (!v) return;
      if (data.sections.length >= 20) { Toast.show('Notatblokken kan ha maks 20 inndelinger.'); return; }
      const s = { id: data.nextId++, name: v, color: COLORS[data.sections.length % COLORS.length], pages: [] };
      data.sections.push(s); data.curSec = s.id; data.curPage = 0; save(); render();
      Bus.emit('notes-new-section', { name: v });
    }
    async function newPage() {
      const s = curSec(); if (!s) { Toast.show('Lag en inndeling først.'); return; }
      if (s.pages.length >= 50) { Toast.show('En inndeling kan ha maks 50 sider.'); return; }
      const v = await Dialog.prompt('Ny side', 'Tittel på siden:', '', x => x.trim() ? null : 'Skriv en tittel.');
      if (!v) return;
      const p = { id: data.nextId++, title: v, html: '', modified: Date.now() };
      s.pages.push(p); data.curPage = p.id; save(); render();
      setTimeout(() => pageEl.focus(), 30);
      Bus.emit('notes-new-page', { title: v, section: s.name });
    }
    function doSearch(q) {
      q = (q || '').trim();
      const box = root.querySelector('.pages');
      if (!q) { renderPages(); return; }
      Bus.emit('notes-search', { query: q });
      const hits = [];
      data.sections.forEach(s => s.pages.forEach(p => { if ((p.title + ' ' + plain(p.html)).toLowerCase().includes(q.toLowerCase())) hits.push({ s, p }); }));
      box.innerHTML = '';
      root.querySelector('.note-loc').textContent = `Søk: «${q}» · ${hits.length} treff`;
      if (!hits.length) { box.appendChild(el('<div class="note-empty">Ingen treff.</div>')); return; }
      hits.forEach(({ s, p }) => {
        const r = el(`<div class="page-row"><span class="nm">${esc(p.title)}</span><span class="dt">${esc(s.name)}</span></div>`);
        r.addEventListener('click', () => { data.curSec = s.id; data.curPage = p.id; save(); srch.value = ''; render(); Bus.emit('notes-open-page', { title: p.title, section: s.name, via: 'search' }); });
        box.appendChild(r);
      });
    }
    win.render = render;
    render();
    setTimeout(() => pageEl.focus(), 50);
    Bus.emit('notes-app-open', {});
    return win;
  }

  /* Lesbar tilstand for oppdragene */
  function state() {
    load();
    return {
      book: data.book,
      sections: data.sections.map(s => s.name),
      pages: data.sections.flatMap(s => s.pages.map(p => ({ title: p.title, section: s.name, text: plain(p.html), html: p.html || '' })))
    };
  }
  function reset() { data = seed(); save(); if (win && win.render) win.render(); }
  return { open, state, reset };
})();
window.Notater = Notater;
