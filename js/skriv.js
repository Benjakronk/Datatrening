/* Skriv: en enkel tekstbehandler (Word-lite) med formatering:
   skrifttype, størrelse, fet/kursiv/understreket, tekstfarge, stiler (overskrifter), justering og lister.
   .docx-filer lagres som HTML i det virtuelle filsystemet, .txt-filer som ren tekst. */
const Skriv = (() => {
  let count = 0;
  const inst = [];
  const FONTS = ['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Comic Sans MS'];
  const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48];
  const COLORS = [['#000000', T('Svart')], ['#c00000', T('Rød')], ['#0070c0', T('Blå')], ['#00b050', T('Grønn')], ['#7030a0', T('Lilla')], ['#ff8c00', T('Oransje')]];
  const isHtml = s => /<(div|p|br|span|b|i|u|strong|em|h[1-6]|ul|ol|li|font)[\s>\/]/i.test(s || '');
  const textToHtml = t => (t || '').split('\n').map(l => '<div>' + (esc(l) || '<br>') + '</div>').join('');
  function htmlToText(html) { const d = document.createElement('div'); d.innerHTML = html; return d.innerText.replace(/ /g, ' '); }
  function plainText(content) { return isHtml(content) ? htmlToText(content) : (content || ''); }
  const ico = {
    left: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 3h12M2 6h8M2 9h12M2 12h8" stroke="#333" stroke-width="1.6"/></svg>',
    center: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 3h12M4 6h8M2 9h12M4 12h8" stroke="#333" stroke-width="1.6"/></svg>',
    right: '<svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 3h12M6 6h8M2 9h12M6 12h8" stroke="#333" stroke-width="1.6"/></svg>',
    ul: '<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="3" cy="4" r="1.3" fill="#333"/><circle cx="3" cy="8" r="1.3" fill="#333"/><circle cx="3" cy="12" r="1.3" fill="#333"/><path d="M6 4h8M6 8h8M6 12h8" stroke="#333" stroke-width="1.6"/></svg>',
    ol: '<svg viewBox="0 0 16 16" width="16" height="16"><text x="1" y="6" font-size="5" fill="#333" font-family="Arial">1</text><text x="1" y="10.5" font-size="5" fill="#333" font-family="Arial">2</text><text x="1" y="15" font-size="5" fill="#333" font-family="Arial">3</text><path d="M6 4h8M6 8h8M6 12h8" stroke="#333" stroke-width="1.6"/></svg>'
  };

  function open(nodeId) {
    if (WM.full()) return null;
    count++;
    const node0 = nodeId && FS.get(nodeId) ? FS.get(nodeId) : null;
    const st = { nodeId: node0 ? node0.id : null, dirty: false, docName: T('Dokument{0}', count), plain: node0 ? FS.ext(node0.name) === 'txt' : false };
    const root = el(`<div class="skriv">
      <div class="menubar"><button data-a="new">${T('Ny')}</button><button data-a="open">${T('Åpne')}</button><button data-a="save">${T('Lagre')}</button><button data-a="saveas">${T('Lagre som')}</button><button data-a="print">${T('Skriv ut')}</button><span class="spacer"></span><span class="hint">${T('<kbd>Ctrl</kbd>+<kbd>S</kbd> lagre · <kbd>Ctrl</kbd>+<kbd>B</kbd> fet · <kbd>Ctrl</kbd>+<kbd>P</kbd> skriv ut')}</span></div>
      <div class="sk-tools">
        <select class="sk-font" title="${T('Skrifttype')}">${FONTS.map(f => `<option value="${f}" style="font-family:'${f}'">${f}</option>`).join('')}</select>
        <select class="sk-size" title="${T('Skriftstørrelse (punkt)')}">${SIZES.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
        <span class="vsep"></span>
        <button class="sk-b" data-cmd="bold" title="${T('Fet (Ctrl+B)')}"><b>${T('Fet')[0]}</b></button>
        <button class="sk-b" data-cmd="italic" title="${T('Kursiv (Ctrl+I)')}"><i>${T('Kursiv')[0]}</i></button>
        <button class="sk-b" data-cmd="underline" title="${T('Understreket (Ctrl+U)')}"><u>U</u></button>
        <span class="vsep"></span>
        <select class="sk-color" title="${T('Tekstfarge')}">${COLORS.map(c => `<option value="${c[0]}" style="color:${c[0]}">${c[1]}</option>`).join('')}</select>
        <span class="vsep"></span>
        <select class="sk-style" title="${T('Stil')}"><option value="div">${T('Normal')}</option><option value="h1">${T('Overskrift 1')}</option><option value="h2">${T('Overskrift 2')}</option></select>
        <span class="vsep"></span>
        <button class="sk-b" data-cmd="justifyLeft" title="${T('Venstrejuster')}">${ico.left}</button><button class="sk-b" data-cmd="justifyCenter" title="${T('Midtstill')}">${ico.center}</button><button class="sk-b" data-cmd="justifyRight" title="${T('Høyrejuster')}">${ico.right}</button>
        <span class="vsep"></span>
        <button class="sk-b" data-cmd="insertUnorderedList" title="${T('Punktliste')}">${ico.ul}</button><button class="sk-b" data-cmd="insertOrderedList" title="${T('Nummerert liste')}">${ico.ol}</button>
      </div>
      <div class="sk-scroll"><div class="sk-page" contenteditable="true" spellcheck="false"></div></div>
      <div class="sk-status"><span class="words">${T('{0} ord', 0)}</span><span class="where"></span><span class="auto"></span><span class="spacer"></span><span class="zoom"></span><span class="fmt"></span></div>
    </div>`);
    const ed = root.querySelector('.sk-page'), tools = root.querySelector('.sk-tools');
    const fontSel = root.querySelector('.sk-font'), sizeSel = root.querySelector('.sk-size'), colorSel = root.querySelector('.sk-color'), styleSel = root.querySelector('.sk-style');

    function setPlain(p) { st.plain = p; ed.setAttribute('contenteditable', p ? 'plaintext-only' : 'true'); tools.classList.toggle('disabled', p); }
    function getValue() { return st.plain ? ed.innerText.replace(/ /g, ' ').replace(/\n$/, '') : ed.innerHTML; }
    function setValue(v) { if (st.plain) ed.innerText = v || ''; else ed.innerHTML = isHtml(v) ? v : textToHtml(v); }
    function text() { return ed.innerText.replace(/ /g, ' '); }
    setPlain(st.plain);
    if (node0) setValue(node0.content || '');

    const title = () => st.nodeId && FS.get(st.nodeId) ? FS.displayName(FS.get(st.nodeId), Explorer.settings.showExt) : st.docName;
    const win = WM.create({
      app: 'skriv', title: '', body: root, width: 860, height: 600,
      onClose: async () => {
        if (!st.dirty) return true;
        const r = await Dialog.saveChanges(title());
        Bus.emit('save-dialog', { choice: r, name: title() });
        if (r === 'cancel') return false;
        if (r === 'save') return !!(await save('dialog'));
        return true;
      }
    });
    win.onClosed = () => { const i = inst.findIndex(x => x.win === win); if (i >= 0) inst.splice(i, 1); document.removeEventListener('selectionchange', onSel); };
    win.onKey = e => { if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); Bus.emit('shortcut', { key: 's', ctrl: true, app: 'skriv' }); save('shortcut'); } };

    /* Autolagring: filer i OneDrive lagres av seg selv, som i Word. Lokale filer må lagres med Ctrl+S. */
    function inOneDrive() { const n = st.nodeId && FS.get(st.nodeId); return !!n && FS.isDesc(n.id, FS.roots().onedrive); }
    let autoTimer = null;
    function updTitle() {
      WM.setTitle(win, (st.dirty ? '*' : '') + title() + ' - ' + T('Skriv'));
      const t = text().trim();
      const w = t ? t.split(/\s+/).length : 0;
      root.querySelector('.words').textContent = w === 1 ? T('1 ord') : T('{0} ord', w);
      root.querySelector('.where').textContent = st.nodeId && FS.get(st.nodeId) ? T('Lagret i: {0}', FS.pathString(FS.get(st.nodeId).parent)) : T('Ikke lagret ennå');
      const a = root.querySelector('.auto');
      if (!st.nodeId) { a.textContent = ''; a.className = 'auto'; }
      else if (inOneDrive()) { a.textContent = st.dirty ? T('🔄 Autolagrer …') : T('☁ Autolagret i OneDrive'); a.className = 'auto on'; }
      else { a.textContent = st.dirty ? T('⚠ Ikke lagret (Ctrl+S)') : T('💾 Lagret lokalt · ingen autolagring'); a.className = 'auto off'; }
      root.querySelector('.zoom').textContent = st.zoom && st.zoom !== 100 ? st.zoom + ' %' : '';
    }
    function onInput() {
      st.dirty = true; updTitle(); Bus.emit('editor-input', { text: text() });
      if (autoTimer) clearTimeout(autoTimer);
      if (inOneDrive()) autoTimer = setTimeout(() => { if (st.dirty && inOneDrive()) { const n = FS.get(st.nodeId); const w = FS.write(n.id, getValue()); if (!(w && w.error)) { st.dirty = false; updTitle(); Bus.emit('save', { id: n.id, name: n.name, folderId: n.parent, via: 'auto', isNew: false }); Bus.emit('autosave', { name: n.name }); } } }, 1500);
    }
    ed.addEventListener('input', onInput);
    /* Zoom med Ctrl og rullehjul, som i Word */
    st.zoom = 100;
    root.querySelector('.sk-scroll').addEventListener('wheel', e => {
      if (!e.ctrlKey) return;
      e.preventDefault();
      st.zoom = Math.max(50, Math.min(250, st.zoom + (e.deltaY < 0 ? 10 : -10)));
      ed.style.zoom = st.zoom / 100;
      updTitle();
      Bus.emit('zoom', { app: 'skriv', level: st.zoom });
    }, { passive: false });

    /* ---- markering og formatering ---- */
    let savedRange = null;
    function onSel() {
      const s = window.getSelection();
      if (s.rangeCount && ed.contains(s.anchorNode)) { savedRange = s.getRangeAt(0).cloneRange(); updateToolbar(); }
    }
    document.addEventListener('selectionchange', onSel);
    function restore() {
      ed.focus();
      const s = window.getSelection();
      if (savedRange) { s.removeAllRanges(); s.addRange(savedRange); }
    }
    function exec(cmd, val, via) {
      if (st.plain) return;
      restore();
      document.execCommand('styleWithCSS', false, cmd === 'fontName' || cmd === 'foreColor');
      document.execCommand(cmd, false, val == null ? null : val);
      onInput();
      Bus.emit('format', { cmd, value: val == null ? null : val, via, selected: savedRange ? savedRange.toString() : '' });
      updateToolbar();
    }
    function setSize(pt, via) {
      if (st.plain) return;
      restore();
      document.execCommand('styleWithCSS', false, false);
      document.execCommand('fontSize', false, '7');
      ed.querySelectorAll('font[size="7"]').forEach(f => { const s = document.createElement('span'); s.style.fontSize = pt + 'pt'; while (f.firstChild) s.appendChild(f.firstChild); f.replaceWith(s); });
      onInput();
      Bus.emit('format', { cmd: 'fontSize', value: pt, via, selected: savedRange ? savedRange.toString() : '' });
      updateToolbar();
    }
    function updateToolbar() {
      if (st.plain) return;
      try {
        tools.querySelectorAll('.sk-b[data-cmd]').forEach(b => { const c = b.dataset.cmd; b.classList.toggle('active', document.queryCommandState(c)); });
        const fn = (document.queryCommandValue('fontName') || '').replace(/["']/g, '').split(',')[0].trim();
        const fi = FONTS.findIndex(f => f.toLowerCase() === fn.toLowerCase()); if (fi >= 0) fontSel.selectedIndex = fi;
        const s = window.getSelection(); const node = s.anchorNode && (s.anchorNode.nodeType === 3 ? s.anchorNode.parentElement : s.anchorNode);
        if (node && ed.contains(node)) {
          const pt = Math.round(parseFloat(getComputedStyle(node).fontSize) * 0.75);
          const si = SIZES.indexOf(pt); if (si >= 0) sizeSel.selectedIndex = si;
          const h = node.closest('h1,h2'); styleSel.value = h ? h.tagName.toLowerCase() : 'div';
          root.querySelector('.fmt').textContent = fn + ' ' + pt + ' pt';
        }
      } catch (e) { /* ignorer */ }
    }
    tools.querySelectorAll('.sk-b').forEach(b => {
      b.addEventListener('mousedown', e => e.preventDefault());
      b.addEventListener('click', () => exec(b.dataset.cmd, null, 'toolbar'));
    });
    fontSel.addEventListener('change', () => exec('fontName', fontSel.value, 'toolbar'));
    sizeSel.addEventListener('change', () => setSize(+sizeSel.value, 'toolbar'));
    colorSel.addEventListener('change', () => exec('foreColor', colorSel.value, 'toolbar'));
    styleSel.addEventListener('change', () => exec('formatBlock', styleSel.value, 'toolbar'));

    ed.addEventListener('keydown', e => {
      const k = e.key.toLowerCase();
      if (e.ctrlKey && !e.altKey) {
        Bus.emit('shortcut', { key: k, ctrl: true, app: 'skriv', shift: e.shiftKey });
        if (k === 's') { e.preventDefault(); save('shortcut'); return; }
        if (k === 'p') { e.preventDefault(); print('shortcut'); return; }
        if (k === '0') { e.preventDefault(); st.zoom = 100; ed.style.zoom = 1; updTitle(); Bus.emit('zoom', { app: 'skriv', level: 100 }); return; }
        if (k === 'b' || k === 'i' || k === 'u') { e.preventDefault(); if (!st.plain) exec(k === 'b' ? 'bold' : k === 'i' ? 'italic' : 'underline', null, 'shortcut'); return; }
      }
      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '\t'); return; }
      if (e.key === 'Escape') { e.stopPropagation(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && text().length >= FS.LIMITS.content && window.getSelection().isCollapsed) { e.preventDefault(); Toast.show(T('Dokumentet er fullt (maks {0} tegn).', FS.LIMITS.content)); }
    });
    ed.addEventListener('paste', e => {
      e.preventDefault();
      const t = (e.clipboardData || window.clipboardData).getData('text/plain').slice(0, FS.LIMITS.content);
      document.execCommand('insertText', false, t);
      Bus.emit('editor-paste', {});
    });
    ed.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      const hasSel = !window.getSelection().isCollapsed;
      const act = cmd => {
        ed.focus();
        Bus.emit('editor-menu', { action: cmd });
        if (cmd === 'paste') {
          if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => { restore(); document.execCommand('insertText', false, t); }).catch(() => Toast.show(T('Nettleseren tillater ikke liming fra menyen her. Bruk Ctrl+V.')));
          else Toast.show(T('Bruk Ctrl+V for å lime inn.'));
        }
        else if (cmd === 'selectall') { restore(); document.execCommand('selectAll'); }
        else { restore(); document.execCommand(cmd); onInput(); }
      };
      const items = [
        { label: T('Angre'), kbd: 'Ctrl+Z', action: () => act('undo') },
        '-',
        { label: T('Klipp ut'), icon: Icons.tools.cut, kbd: 'Ctrl+X', disabled: !hasSel, action: () => act('cut') },
        { label: T('Kopier'), icon: Icons.tools.copy, kbd: 'Ctrl+C', disabled: !hasSel, action: () => act('copy') },
        { label: T('Lim inn'), icon: Icons.tools.paste, kbd: 'Ctrl+V', action: () => act('paste') },
        { label: T('Slett'), kbd: 'Delete', disabled: !hasSel, action: () => act('delete') },
        '-',
        { label: T('Merk alt'), kbd: 'Ctrl+A', action: () => act('selectall') }
      ];
      if (!st.plain) items.push('-', { label: T('Formatering'), sub: [
        { label: T('Fet'), kbd: 'Ctrl+B', action: () => exec('bold', null, 'menu') },
        { label: T('Kursiv'), kbd: 'Ctrl+I', action: () => exec('italic', null, 'menu') },
        { label: T('Understreket'), kbd: 'Ctrl+U', action: () => exec('underline', null, 'menu') }
      ] });
      Ctx.show(e.clientX, e.clientY, items, 'editor', T('teksten i Skriv'));
    });

    /* ---- lagring ---- */
    async function save(via) {
      if (!st.nodeId || !FS.get(st.nodeId)) { st.nodeId = null; return saveAs(via); }
      const n = FS.get(st.nodeId);
      const w = FS.write(n.id, getValue());
      if (w && w.error) { await Dialog.alert(T('Kunne ikke lagre'), w.error); return false; }
      st.dirty = false; updTitle();
      Bus.emit('save', { id: n.id, name: n.name, folderId: n.parent, via, isNew: false });
      Toast.show(T('Lagret: {0}', n.name));
      return true;
    }
    async function saveAs(via) {
      const cur = st.nodeId ? FS.get(st.nodeId) : null;
      const r = await Dialog.fileChooser({
        mode: 'save', title: T('Lagre som'),
        name: cur ? FS.base(cur.name) : st.docName,
        types: [{ label: T('Word-dokument (*.docx)'), ext: 'docx' }, { label: T('Tekstdokument (*.txt)'), ext: 'txt' }],
        start: cur ? cur.parent : FS.roots().documents
      });
      if (!r) return false;
      const plain = FS.ext(r.name) === 'txt';
      const value = plain ? text().replace(/\n$/, '') : getValue();
      let n = FS.children(r.folderId).find(c => c.name.toLowerCase() === r.name.toLowerCase());
      if (n) { const w = FS.write(n.id, value); if (w && w.error) { await Dialog.alert(T('Kunne ikke lagre'), w.error); return false; } }
      else {
        n = FS.createFile(r.folderId, r.name, value, { via: 'skriv' });
        if (n.error) { await Dialog.alert(T('Kunne ikke lagre'), n.error); return false; }
      }
      if (plain !== st.plain) { setPlain(plain); setValue(value); }
      st.nodeId = n.id; st.dirty = false; updTitle();
      Bus.emit('save', { id: n.id, name: n.name, folderId: r.folderId, via, isNew: true });
      Toast.show(T('Lagret «{0}» i {1}', n.name, FS.get(r.folderId).name));
      return true;
    }
    /* Skriv ut: velg skriver eller lag en PDF-fil */
    async function print(via) {
      const pages = Math.max(1, Math.ceil(text().length / 1800));
      const body = el(`<div class="print-dlg">
        <div class="pd-left"><label>${T('Skriver:')}</label>
          <select class="txt pd-target"><option value="skriver">${T('Skolens skriver (Kopirom 2. etasje)')}</option><option value="pdf">${T('Microsoft Print to PDF (lag PDF-fil)')}</option></select>
          <label>${T('Eksemplarer:')}</label><input class="txt pd-copies" type="number" value="1" min="1" max="5">
          <div class="muted">${pages === 1 ? T('Dokumentet er på 1 side.') : T('Dokumentet er på {0} sider.', pages)}</div>
          <div class="muted">${T('Velger du «Print to PDF», lages det en PDF-fil på PC-en i stedet for papir. PDF ser lik ut overalt og kan ikke redigeres.')}</div>
        </div>
        <div class="pd-prev"><div class="pd-paper">${st.plain ? esc(text()).replace(/\n/g, '<br>') : getValue()}</div></div>
      </div>`);
      Bus.emit('print-dialog', { pages });
      const r = await Dialog.show({ title: T('Skriv ut'), body, buttons: [{ label: T('Skriv ut'), value: 'ok', primary: true }, { label: T('Avbryt'), value: null }], validate: () => ({ target: body.querySelector('.pd-target').value, copies: +body.querySelector('.pd-copies').value }) });
      if (!r) return;
      if (r.target === 'skriver') { Toast.show(r.copies === 1 ? T('Sendt til skriveren (1 eksemplar). Hent utskriften i kopirommet.') : T('Sendt til skriveren ({0} eksemplarer). Hent utskriften i kopirommet.', r.copies)); Bus.emit('print', { target: 'skriver', copies: r.copies, via }); return; }
      const cur = st.nodeId ? FS.get(st.nodeId) : null;
      const s = await Dialog.fileChooser({ mode: 'save', title: T('Lagre PDF som'), name: cur ? FS.base(cur.name) : st.docName, types: [{ label: T('PDF-dokument (*.pdf)'), ext: 'pdf' }], start: cur ? cur.parent : FS.roots().documents });
      if (!s) return;
      let n = FS.children(s.folderId).find(c => c.name.toLowerCase() === s.name.toLowerCase());
      if (n) { const w = FS.write(n.id, text()); if (w && w.error) { Toast.show(w.error); return; } }
      else { n = FS.createFile(s.folderId, s.name, text(), { via: 'print' }); if (n.error) { Toast.show(n.error); return; } }
      Toast.show(T('PDF-filen «{0}» ble lagret i {1}.', n.name, FS.get(s.folderId).name));
      Bus.emit('print', { target: 'pdf', name: n.name, folderId: s.folderId, via });
    }
    /* Samskriving: en delt fil får en medelev som skriver i den mens du ser på */
    function maybeCoEdit() {
      const n = st.nodeId && FS.get(st.nodeId);
      if (!n || !n.shared || st.plain || st.coEdit) return;
      st.coEdit = setTimeout(() => {
        if (!inst.some(x => x.win === win) || !FS.get(st.nodeId)) return;
        const line = el('<div><span style="background:#fff2b8">' + T('Kari (skriver nå): Jeg la til et avsnitt om kildene våre her.') + '</span></div>');
        ed.appendChild(line);
        onInput();
        Toast.show(T('Kari redigerer dokumentet samtidig som deg. Dere ser endringene til hverandre med én gang.'), 6000);
        Bus.emit('coedit', { name: n.name });
      }, 3500);
    }
    async function openDoc() {
      const r = await Dialog.fileChooser({ mode: 'open', title: T('Åpne'), types: [{ label: T('Dokumenter (*.docx, *.txt)'), ext: 'docx,txt' }, { label: T('Alle filer (*.*)'), ext: '' }], start: FS.roots().documents });
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
      else if (a === 'print') print('menu');
    });

    /* Leser av formateringen i dokumentet, brukt av oppdragene */
    function inspect() {
      const out = { text: text(), bold: false, italic: false, underline: false, fonts: new Set(), sizes: new Set(), headings: new Set(), lists: new Set(), aligns: new Set(), colors: new Set(), listItems: ed.querySelectorAll('li').length };
      const walker = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.textContent.trim()) continue;
        const p = n.parentElement; const cs = getComputedStyle(p);
        if (parseInt(cs.fontWeight, 10) >= 600 || cs.fontWeight === 'bold') out.bold = true;
        if (cs.fontStyle === 'italic') out.italic = true;
        let a = p; while (a && a !== ed) { if (a.tagName === 'U' || (getComputedStyle(a).textDecorationLine || '').includes('underline')) { out.underline = true; break; } a = a.parentElement; }
        out.fonts.add(cs.fontFamily.split(',')[0].replace(/["']/g, '').trim());
        out.sizes.add(Math.round(parseFloat(cs.fontSize) * 0.75));
        out.colors.add(cs.color);
        const h = p.closest('h1,h2,h3'); if (h) out.headings.add(h.tagName.toLowerCase());
        const li = p.closest('li'); if (li) out.lists.add(li.closest('ol') ? 'ol' : 'ul');
        const blk = p.closest('div,p,h1,h2,h3,li') || p; out.aligns.add(getComputedStyle(blk).textAlign);
      }
      ['fonts', 'sizes', 'headings', 'lists', 'aligns', 'colors'].forEach(k => { out[k] = [...out[k]]; });
      return out;
    }
    /* Enkelt grensesnitt for tester og andre programmer */
    /* Finner tekstnode og forskyvning for en tegnposisjon i hele dokumentet */
    function posToNode(pos) {
      const w = document.createTreeWalker(ed, NodeFilter.SHOW_TEXT); let n, acc = 0, last = null;
      while ((n = w.nextNode())) { last = n; if (pos <= acc + n.length) return [n, pos - acc]; acc += n.length; }
      return last ? [last, last.length] : null;
    }
    const api = {
      el: ed,
      get value() { return getValue(); },
      set value(v) { setValue(v); },
      text, inspect, exec, setSize,
      focus: () => ed.focus(),
      select: () => { ed.focus(); document.execCommand('selectAll'); onSel(); },
      dispatchEvent: e => ed.dispatchEvent(e),
      setSelectionRange: (a, b) => { const A = posToNode(a), B = posToNode(b); if (!A || !B) return; const r = document.createRange(); r.setStart(A[0], A[1]); r.setEnd(B[0], B[1]); const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); savedRange = r.cloneRange(); }
    };
    updTitle();
    setTimeout(() => { ed.focus(); updateToolbar(); }, 50);
    inst.push({ win, st, api });
    maybeCoEdit();
    return win;
  }
  function active() { const a = WM.getActive(); let i = inst.find(x => x.win === a); if (!i) i = inst[inst.length - 1]; return i || null; }
  function activeText() { const i = active(); return i ? i.api.text() : ''; }
  function inspectActive() { const i = active(); return i ? i.api.inspect() : { text: '', bold: false, italic: false, underline: false, fonts: [], sizes: [], headings: [], lists: [], aligns: [], colors: [], listItems: 0 }; }
  function api(win) { const i = inst.find(x => x.win === win); return i ? i.api : null; }
  return { open, activeText, inspectActive, api, plainText, count: () => inst.length, FONTS, SIZES };
})();
window.Skriv = Skriv;
