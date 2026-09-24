/* Skriv: en enkel tekstbehandler (Word-lite) med formatering:
   skrifttype, størrelse, fet/kursiv/understreket, tekstfarge, stiler (overskrifter), justering og lister.
   .docx-filer lagres som HTML i det virtuelle filsystemet, .txt-filer som ren tekst. */
const Skriv = (() => {
  let count = 0;
  const inst = [];
  const FONTS = ['Calibri', 'Arial', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New', 'Comic Sans MS'];
  const SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36, 48];
  const COLORS = [['#000000', 'Svart'], ['#c00000', 'Rød'], ['#0070c0', 'Blå'], ['#00b050', 'Grønn'], ['#7030a0', 'Lilla'], ['#ff8c00', 'Oransje']];
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
    const st = { nodeId: node0 ? node0.id : null, dirty: false, docName: 'Dokument' + count, plain: node0 ? FS.ext(node0.name) === 'txt' : false };
    const root = el(`<div class="skriv">
      <div class="menubar"><button data-a="new">Ny</button><button data-a="open">Åpne</button><button data-a="save">Lagre</button><button data-a="saveas">Lagre som</button><span class="spacer"></span><span class="hint"><kbd>Ctrl</kbd>+<kbd>S</kbd> lagre · <kbd>Ctrl</kbd>+<kbd>B</kbd> fet · <kbd>Ctrl</kbd>+<kbd>I</kbd> kursiv · <kbd>Ctrl</kbd>+<kbd>U</kbd> understreket</span></div>
      <div class="sk-tools">
        <select class="sk-font" title="Skrifttype">${FONTS.map(f => `<option value="${f}" style="font-family:'${f}'">${f}</option>`).join('')}</select>
        <select class="sk-size" title="Skriftstørrelse (punkt)">${SIZES.map(s => `<option value="${s}">${s}</option>`).join('')}</select>
        <span class="vsep"></span>
        <button class="sk-b" data-cmd="bold" title="Fet (Ctrl+B)"><b>F</b></button>
        <button class="sk-b" data-cmd="italic" title="Kursiv (Ctrl+I)"><i>K</i></button>
        <button class="sk-b" data-cmd="underline" title="Understreket (Ctrl+U)"><u>U</u></button>
        <span class="vsep"></span>
        <select class="sk-color" title="Tekstfarge">${COLORS.map(c => `<option value="${c[0]}" style="color:${c[0]}">${c[1]}</option>`).join('')}</select>
        <span class="vsep"></span>
        <select class="sk-style" title="Stil"><option value="div">Normal</option><option value="h1">Overskrift 1</option><option value="h2">Overskrift 2</option></select>
        <span class="vsep"></span>
        <button class="sk-b" data-cmd="justifyLeft" title="Venstrejuster">${ico.left}</button><button class="sk-b" data-cmd="justifyCenter" title="Midtstill">${ico.center}</button><button class="sk-b" data-cmd="justifyRight" title="Høyrejuster">${ico.right}</button>
        <span class="vsep"></span>
        <button class="sk-b" data-cmd="insertUnorderedList" title="Punktliste">${ico.ul}</button><button class="sk-b" data-cmd="insertOrderedList" title="Nummerert liste">${ico.ol}</button>
      </div>
      <div class="sk-scroll"><div class="sk-page" contenteditable="true" spellcheck="false"></div></div>
      <div class="sk-status"><span class="words">0 ord</span><span class="where"></span><span class="spacer"></span><span class="fmt"></span></div>
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

    function updTitle() {
      WM.setTitle(win, (st.dirty ? '*' : '') + title() + ' - Skriv');
      const t = text().trim();
      const w = t ? t.split(/\s+/).length : 0;
      root.querySelector('.words').textContent = w + ' ord';
      root.querySelector('.where').textContent = st.nodeId && FS.get(st.nodeId) ? 'Lagret i: ' + FS.pathString(FS.get(st.nodeId).parent) : 'Ikke lagret ennå';
    }
    function onInput() { st.dirty = true; updTitle(); Bus.emit('editor-input', { text: text() }); }
    ed.addEventListener('input', onInput);

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
        if (k === 'b' || k === 'i' || k === 'u') { e.preventDefault(); if (!st.plain) exec(k === 'b' ? 'bold' : k === 'i' ? 'italic' : 'underline', null, 'shortcut'); return; }
      }
      if (e.key === 'Tab') { e.preventDefault(); document.execCommand('insertText', false, '\t'); return; }
      if (e.key === 'Escape') { e.stopPropagation(); return; }
      if (e.key.length === 1 && !e.ctrlKey && !e.altKey && text().length >= FS.LIMITS.content && window.getSelection().isCollapsed) { e.preventDefault(); Toast.show('Dokumentet er fullt (maks ' + FS.LIMITS.content + ' tegn).'); }
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
          if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(t => { restore(); document.execCommand('insertText', false, t); }).catch(() => Toast.show('Nettleseren tillater ikke liming fra menyen her. Bruk Ctrl+V.'));
          else Toast.show('Bruk Ctrl+V for å lime inn.');
        }
        else if (cmd === 'selectall') { restore(); document.execCommand('selectAll'); }
        else { restore(); document.execCommand(cmd); onInput(); }
      };
      const items = [
        { label: 'Angre', kbd: 'Ctrl+Z', action: () => act('undo') },
        '-',
        { label: 'Klipp ut', icon: Icons.tools.cut, kbd: 'Ctrl+X', disabled: !hasSel, action: () => act('cut') },
        { label: 'Kopier', icon: Icons.tools.copy, kbd: 'Ctrl+C', disabled: !hasSel, action: () => act('copy') },
        { label: 'Lim inn', icon: Icons.tools.paste, kbd: 'Ctrl+V', action: () => act('paste') },
        { label: 'Slett', kbd: 'Delete', disabled: !hasSel, action: () => act('delete') },
        '-',
        { label: 'Merk alt', kbd: 'Ctrl+A', action: () => act('selectall') }
      ];
      if (!st.plain) items.push('-', { label: 'Formatering', sub: [
        { label: 'Fet', kbd: 'Ctrl+B', action: () => exec('bold', null, 'menu') },
        { label: 'Kursiv', kbd: 'Ctrl+I', action: () => exec('italic', null, 'menu') },
        { label: 'Understreket', kbd: 'Ctrl+U', action: () => exec('underline', null, 'menu') }
      ] });
      Ctx.show(e.clientX, e.clientY, items, 'editor', 'teksten i Skriv');
    });

    /* ---- lagring ---- */
    async function save(via) {
      if (!st.nodeId || !FS.get(st.nodeId)) { st.nodeId = null; return saveAs(via); }
      const n = FS.get(st.nodeId);
      const w = FS.write(n.id, getValue());
      if (w && w.error) { await Dialog.alert('Kunne ikke lagre', w.error); return false; }
      st.dirty = false; updTitle();
      Bus.emit('save', { id: n.id, name: n.name, folderId: n.parent, via, isNew: false });
      Toast.show('Lagret: ' + n.name);
      return true;
    }
    async function saveAs(via) {
      const cur = st.nodeId ? FS.get(st.nodeId) : null;
      const r = await Dialog.fileChooser({
        mode: 'save', title: 'Lagre som',
        name: cur ? FS.base(cur.name) : st.docName,
        types: [{ label: 'Word-dokument (*.docx)', ext: 'docx' }, { label: 'Tekstdokument (*.txt)', ext: 'txt' }],
        start: cur ? cur.parent : FS.roots().documents
      });
      if (!r) return false;
      const plain = FS.ext(r.name) === 'txt';
      const value = plain ? text().replace(/\n$/, '') : getValue();
      let n = FS.children(r.folderId).find(c => c.name.toLowerCase() === r.name.toLowerCase());
      if (n) { const w = FS.write(n.id, value); if (w && w.error) { await Dialog.alert('Kunne ikke lagre', w.error); return false; } }
      else {
        n = FS.createFile(r.folderId, r.name, value, { via: 'skriv' });
        if (n.error) { await Dialog.alert('Kunne ikke lagre', n.error); return false; }
      }
      if (plain !== st.plain) { setPlain(plain); setValue(value); }
      st.nodeId = n.id; st.dirty = false; updTitle();
      Bus.emit('save', { id: n.id, name: n.name, folderId: r.folderId, via, isNew: true });
      Toast.show('Lagret «' + n.name + '» i ' + FS.get(r.folderId).name);
      return true;
    }
    async function openDoc() {
      const r = await Dialog.fileChooser({ mode: 'open', title: 'Åpne', types: [{ label: 'Dokumenter (*.docx, *.txt)', ext: 'docx,txt' }, { label: 'Alle filer (*.*)', ext: '' }], start: FS.roots().documents });
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
    return win;
  }
  function active() { const a = WM.getActive(); let i = inst.find(x => x.win === a); if (!i) i = inst[inst.length - 1]; return i || null; }
  function activeText() { const i = active(); return i ? i.api.text() : ''; }
  function inspectActive() { const i = active(); return i ? i.api.inspect() : { text: '', bold: false, italic: false, underline: false, fonts: [], sizes: [], headings: [], lists: [], aligns: [], colors: [], listItems: 0 }; }
  function api(win) { const i = inst.find(x => x.win === win); return i ? i.api : null; }
  return { open, activeText, inspectActive, api, plainText, count: () => inst.length, FONTS, SIZES };
})();
window.Skriv = Skriv;
