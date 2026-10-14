(async () => {
  const { ok, tick, play, master, log, clickCtx, dlgPrimary, btnText } = W;
  const R = p => FS.resolve(p);
  const id = p => R(p).id;
  const view = () => Explorer.views[Explorer.views.length - 1];
  function nav(path) { const v = view(); if (!v) Explorer.open(id(path)); else { WM.focus(v.win, 'test'); v.navigate(id(path)); } }
  const itemEl = (v, name) => { const n = FS.children(v.cwd).find(c => c.name === name); return n && v.root.querySelector(`.ex-content [data-id="${n.id}"]`); };
  const click = (el, o = {}) => el.dispatchEvent(new MouseEvent('click', Object.assign({ bubbles: true, cancelable: true }, o)));
  const key = (k, o = {}) => document.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o)));
  const ctx = (el, x, y) => el.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, button: 2, clientX: x || 200, clientY: y || 200 }));
  /* Ekte vindussnapping: dra tittellinjen mot kanten */
  async function snap(win, side) {
    const tb = win.el.querySelector('.win-title'), r = tb.getBoundingClientRect(), L = document.getElementById('windows').getBoundingClientRect();
    const pe = (t, type, x, y) => t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1, isPrimary: true }));
    pe(tb, 'pointerdown', r.left + 60, r.top + 10);
    const x = side === 'left' ? L.left + 1 : L.right - 1;
    pe(document, 'pointermove', r.left + 80, r.top + 30); pe(document, 'pointermove', x, L.top + 200); pe(document, 'pointerup', x, L.top + 200);
    await tick(30);
  }
  /* Ekte slipp med DnD-koden (dra og slipp mellom vinduer) */
  async function dropOn(targetView, ids, ctrl) {
    DnD.ids = ids.slice();
    const c = targetView.root.querySelector('.ex-content');
    c.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, ctrlKey: !!ctrl, dataTransfer: new DataTransfer() }));
    await tick(30);
  }
  function skriv(id) { if (id) Apps.openFile(id, { via: 'test' }); else Skriv.open(); const w = WM.list('skriv').slice(-1)[0]; return w; }
  const edOf = w => w.el.querySelector('.sk-page');
  function type(w, html) { const ed = edOf(w); ed.focus(); ed.innerHTML = html; ed.dispatchEvent(new Event('input', { bubbles: true })); }
  function saveAs(w, folderPath, name) { const ed = edOf(w); const f = FS.ensureFolder(folderPath); const ex = FS.children(f.id).find(c => c.name === name); const n = ex ? (FS.write(ex.id, ed.innerHTML), ex) : FS.createFile(f.id, name, ed.innerHTML); Bus.emit('save', { id: n.id, name: n.name, folderId: f.id, via: 'test', isNew: true }); return n; }
  const PARA = () => Nettleser.ARTICLE.paras[0];

  try {
    await tick(600);
    document.querySelectorAll('.dlg .btn.primary').forEach(b => b.click());
    W.teoriAlle();

    /* ---------- V1 ---------- */
    const MOB = ['This PC', 'Documents', 'From phone'];
    await play('v1', 'v1o1', [
      ['From phone', async () => { Explorer.open(FS.roots().pc); await tick(); nav(MOB); view().setSort('name', 1); await tick(); }],
      ['IMG_2001', async () => { const v = view(); click(itemEl(v, 'IMG_2001.jpg')); click(itemEl(v, 'IMG_2004.jpg'), { shiftKey: true }); ok(v.sel.size === 4, 'Shift+klikk velger fire'); }],
      ['Maths-week41', async () => { const v = view(); click(itemEl(v, 'Maths-week41.pdf')); click(itemEl(v, 'Maths-week42.pdf'), { ctrlKey: true }); click(itemEl(v, 'Maths-week43.pdf'), { ctrlKey: true }); }],
      ['Move all three', async () => { const v = view(); WM.focus(v.win, 'test'); key('x', { ctrlKey: true }); await tick(); nav(['OneDrive', 'School', 'Maths']); await tick(); key('v', { ctrlKey: true }); await tick(); }],
      ['Ctrl</kbd>+<kbd>A'.replace(/<[^>]+>/g, ''), async () => { nav(MOB); await tick(); key('a', { ctrlKey: true }); await tick(); }],
      ['IMG_2008', async () => { click(itemEl(view(), 'IMG_2008.jpg'), { ctrlKey: true }); }],
      ['Copy</b> the seven'.replace(/<[^>]+>/g, ''), async () => { key('c', { ctrlKey: true }); await tick(); nav(['This PC', 'Pictures']); await tick(); key('v', { ctrlKey: true }); await tick(); }]
    ]);
    const SKJ = ['This PC', 'Documents', 'Screenshots'];
    await play('v1', 'v1o2', [
      ['Screenshots', async () => { Explorer.open(id(SKJ)); await tick(); }],
      ['empty spot', async () => {
        const v = view(), c = v.root.querySelector('.ex-content'), r = c.getBoundingClientRect();
        const pe = (t, type, x, y) => t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1 }));
        pe(c, 'pointerdown', r.right - 6, r.bottom - 6); pe(document, 'pointermove', r.right - 30, r.bottom - 30); pe(document, 'pointermove', r.left + 2, r.top + 2); pe(document, 'pointerup', r.left + 2, r.top + 2);
        await tick(); ok(v.sel.size === 7, 'dra-markering valgte alle sju: ' + v.sel.size);
        click(c); ok(v.sel.size === 7, 'klikket etter dra-markeringen fjerner ikke utvalget');
      }],
      ['all six', async () => { click(itemEl(view(), 'Important-note.txt'), { ctrlKey: true }); }],
      ['Delete', async () => { WM.focus(view().win, 'test'); key('Delete'); await tick(); }],
      ['Recycle Bin', async () => { nav(['Recycle Bin']); await tick(); const v = view(); const ids = FS.children(v.cwd).filter(c => /^screenshot/i.test(c.name)).map(c => c.id); v.select(ids, 'ctrl'); const el = v.root.querySelector(`.ex-content [data-id="${ids[0]}"]`); ctx(el); await clickCtx(/Restore/); }]
    ]);
    await master('v1', [
      async () => { Explorer.open(id(['This PC', 'Documents', 'Messy'])); await tick(); const v = view(); const ids = FS.children(v.cwd).filter(c => /^english/i.test(c.name)).map(c => c.id); v.select(ids, 'ctrl'); key('x', { ctrlKey: true }); await tick(); nav(['OneDrive', 'School', 'English']); await tick(); key('v', { ctrlKey: true }); await tick(); },
      async () => { nav(['This PC', 'Documents', 'Messy']); await tick(); const v = view(); const ids = FS.children(v.cwd).filter(c => /^science/i.test(c.name)).map(c => c.id); await dropOn(v, [], false); DnD.ids = ids; nav(['OneDrive', 'School', 'Science']); await tick(); await dropOn(view(), ids); },
      async () => { nav(['This PC', 'Documents', 'Messy']); await tick(); const v = view(); v.select(FS.children(v.cwd).filter(c => /\.tmp$/.test(c.name)).map(c => c.id), 'ctrl'); key('Delete'); await tick(); }
    ]);

    /* ---------- V2 ---------- */
    await play('v2', 'v2o1', [
      ['go to <b>Documents'.replace(/<[^>]+>/g, ''), async () => { Explorer.open(id(['This PC', 'Documents'])); await tick(); }],
      ['title bar', async () => { await snap(view().win, 'left'); ok(view().win.el.style.width === '50%' || view().win.el.offsetWidth < window.innerWidth * 0.6, 'vinduet ble halvt'); }],
      ['another window', async () => { Explorer.open(id(['OneDrive', 'School', 'English'])); await tick(); }],
      ['right</b> half'.replace(/<[^>]+>/g, ''), async () => snap(view().win, 'right')],
      ['Vocabulary-week-41', async () => { const left = Explorer.views.find(v => FS.get(v.cwd).name === 'Documents'); const right = Explorer.views.find(v => FS.get(v.cwd).name === 'English'); const ids = FS.children(left.cwd).filter(c => /^vocabulary-week-4[12]/i.test(c.name)).map(c => c.id); await dropOn(right, ids); }]
    ]);
    await play('v2', 'v2o2', [
      ['Notes-from-class', async () => { skriv(id(['OneDrive', 'School', 'Norwegian', 'Notes-from-class.docx'])); await tick(); }],
      ['left</b> half'.replace(/<[^>]+>/g, ''), async () => snap(WM.list('skriv')[0], 'left')],
      ['new, empty', async () => { Apps.launch('skriv', { via: 'startmenu' }); await tick(); await snap(WM.list('skriv').slice(-1)[0], 'right'); }],
      ['select the sentence', async () => { const ed = edOf(WM.list('skriv')[0]); ed.focus(); ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true })); }],
      ['paste with', async () => { const w = WM.list('skriv').slice(-1)[0], ed = edOf(w); ed.focus(); const dt = new DataTransfer(); dt.setData('text/plain', 'A short story is a brief narrative with few characters.'); ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); await tick(); }],
      ['Summary', async () => { const w = WM.list('skriv').slice(-1)[0]; ok(/short story/i.test(edOf(w).textContent), 'limt tekst havnet i Skriv'); saveAs(w, ['OneDrive', 'School', 'Norwegian'], 'Summary.docx'); }]
    ]);
    await master('v2', [
      async () => { Explorer.open(id(['This PC', 'Documents'])); await tick(); await snap(view().win, 'left'); },
      async () => { Explorer.open(id(['This PC', 'Desktop'])); await tick(); await snap(view().win, 'right'); },
      async () => { const right = view(); await dropOn(right, [id(['This PC', 'Documents', 'To-the-desktop.txt'])]); }
    ]);
    /* Ctrl + slipp kopierer */
    { FS.silentRemoveAll('ctrl-copy.txt'); FS.ensureFileAt(['This PC', 'Documents'], 'ctrl-copy.txt', 'x'); Explorer.open(FS.roots().desktop); await tick(); await dropOn(view(), [id(['This PC', 'Documents', 'ctrl-copy.txt'])], true); ok(!!R(['This PC', 'Documents', 'ctrl-copy.txt']) && !!R(['This PC', 'Desktop', 'ctrl-copy.txt']), 'Ctrl + slipp kopierer'); }

    /* ---------- V3 ---------- */
    await play('v3', 'v3o1', [
      ['Book-review</b> from'.replace(/<[^>]+>/g, ''), async () => { skriv(id(['OneDrive', 'School', 'Norwegian', 'Book-review.docx'])); await tick(); }],
      ['Ctrl</kbd>+<kbd>P'.replace(/<[^>]+>/g, ''), async () => { const ed = edOf(WM.list('skriv')[0]); ed.focus(); ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true })); await tick(); }],
      ['Microsoft Print to PDF', async () => { const d = document.querySelector('#modal-layer .dlg'); d.querySelector('.pd-target').value = 'pdf'; await dlgPrimary(); await tick(60); await dlgPrimary(); await tick(60); }],
      ['PDF file', async () => { Apps.openFile(id(['OneDrive', 'School', 'Norwegian', 'Book-review.pdf']), { via: 'explorer' }); }]
    ]);
    let zipId = null;
    await play('v3', 'v3o2', [
      ['download', async () => { Nettleser.open(); await tick(); const card = [...document.querySelectorAll('.browser .card')].find(c => /Project files/.test(c.textContent)); card.querySelector('button').click(); await tick(); }],
      ['Downloads', async () => { zipId = FS.children(FS.roots().downloads).find(c => /^Project-files-photosynthesis.*\.zip$/.test(c.name)).id; Apps.openFile(zipId, { via: 'explorer' }); await tick(); }],
      ['inside the ZIP file', async () => { const w = WM.list('explorer').slice(-1)[0]; const it = [...w.el.querySelectorAll('.item')].find(x => /Task-photosynthesis/.test(x.textContent)); it.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); await tick(); ok(!!document.querySelector('#modal-layer .dlg'), 'advarsel om fil i ZIP'); btnText(document.querySelector('#modal-layer .dlg'), /Cancel/).click(); await tick(); }],
      ['Extract all', async () => { Zip.extract(zipId, id(['OneDrive', 'School', 'Science'])); await tick(); }],
      ['extracted', async () => { Apps.openFile(id(['OneDrive', 'School', 'Science', 'Project-files-photosynthesis', 'Task-photosynthesis.docx']), { via: 'explorer' }); await tick(); }],
      ['Delete the ZIP file', async () => { FS.remove(zipId, { via: 'test' }); }]
    ]);
    ok(!!R(['OneDrive', 'School', 'Science', 'Project-files-photosynthesis', 'Pictures', 'leaf.jpg']), 'undermapper i ZIP blir pakket ut');
    await play('v3', 'v3o3', [
      ['Science</b>. There'.replace(/<[^>]+>/g, ''), async () => { Explorer.open(id(['OneDrive', 'School', 'Science'])); await tick(); }],
      ['Compress to', async () => { const v = view(); const el = itemEl(v, 'Lab-report'); click(el); ctx(el); await clickCtx(/^\s*Compress to/); const sub = [...document.querySelectorAll('#ctxmenu .submenu .cm-item')].find(x => /ZIP file/.test(x.textContent)); sub.click(); await tick(60); }],
      ['Enter', async () => { const inp = view().root.querySelector('.name input'); if (inp) inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await tick(); }],
      ['attachment', async () => { Bus.emit('mail-send', { to: 'kari.hansen@skolen.no', subject: 'Lab-report', attach: ['Lab-report.zip'], reply: false, all: false, body: 'Her' }); }]
    ]);
    { const z = R(['OneDrive', 'School', 'Science', 'Lab-report.zip']); ok(!!z && (Zip.entries(z) || []).some(e => e.p === 'Lab-report/Report.docx'), 'ZIP-filen inneholder mappen med filene'); }
    /* Pakk ut-dialogen: standardmålet er mappen ZIP-filen ligger i */
    { const z = R(['OneDrive', 'School', 'Science', 'Lab-report.zip']); const lab = R(['OneDrive', 'School', 'Science', 'Lab-report']); FS.purge(lab.id); Zip.extractDialog(z.id); await tick(); await dlgPrimary(); await tick(60); ok(!!R(['OneDrive', 'School', 'Science', 'Lab-report', 'Lab-report', 'Report.docx']), 'Pakk ut-dialogen pakker ut i en mappe ved siden av'); }
    { const n = FS.createFile(FS.roots().documents, 'fake.zip', 'bare tekst'); Apps.openFile(n.id); await tick(); ok(/invalid/i.test((document.querySelector('#modal-layer .dlg') || {}).textContent || ''), 'ugyldig ZIP gir Windows-melding'); await dlgPrimary(); }
    await master('v3', [
      async () => { Zip.extract(id(['This PC', 'Downloads', 'Weekly-tasks.zip']), id(['OneDrive', 'School'])); },
      async () => { FS.createFile(id(['OneDrive', 'School', 'Norwegian']), 'Answers-week-41.pdf', 'x'); Bus.emit('print', { target: 'pdf', name: 'Answers-week-41.pdf' }); },
      async () => { Zip.compress([id(['OneDrive', 'School', 'Weekly-tasks'])], id(['OneDrive', 'School']), null); }
    ]);

    /* ---------- V4 ---------- */
    let sw = null;
    await play('v4', 'v4o1', [
      ['Browser</b> and click'.replace(/<[^>]+>/g, ''), async () => { Nettleser.open(); await tick(); document.querySelector('.br-link[data-page="artikkel"]').click(); await tick(); }],
      ['Select one sentence', async () => { const p = document.querySelector('.art p'); const r = document.createRange(); r.selectNodeContents(p); const s = getSelection(); s.removeAllRanges(); s.addRange(r); p.dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true })); }],
      ['Write</b>. Type'.replace(/<[^>]+>/g, ''), async () => { sw = skriv(); await tick(); type(sw, '<div>«' + PARA() + '»</div>'); }],
      ['address bar', async () => { const u = document.querySelector('.browser .url'); ctx(u); await clickCtx(/Copy address/); }],
      ['Source:', async () => { type(sw, '<div>«' + PARA() + '»</div><div>Source: ' + Nettleser.ARTICLE.url + ', Ingrid Solberg, 14.10.2026</div>'); }],
      ['Photosynthesis-quote', async () => saveAs(sw, ['OneDrive', 'School', 'Science'], 'Photosynthesis-quote.docx')]
    ]);
    await play('v4', 'v4o2', [
      ['BELIEVE WHAT PLANTS', async () => { Nettleser.open(); await tick(); document.querySelector('.br-link[data-page="blogg"]').click(); await tick(); }],
      ['Go back with', async () => { document.querySelector('.browser .br-back').click(); await tick(); document.querySelector('.br-link[data-page="artikkel"]').click(); await tick(); }]
    ]);
    await master('v4', [
      async () => { sw = skriv(); await tick(); type(sw, '<div>"' + PARA() + '"</div><div>Source: ' + Nettleser.ARTICLE.url + ' (Ingrid Solberg)</div>'); },
      async () => saveAs(sw, ['OneDrive', 'School'], 'Source-use.docx')
    ]);

    /* ---------- V5 ---------- */
    const mailRoot = () => WM.list('epost')[0].el;
    const openMail = async idm => { mailRoot().querySelector(`.mail-item[data-id="${idm}"]`).click(); await tick(); };
    const report = async () => { btnText(mailRoot(), /Report phishing/).click(); await tick(); };
    await play('v5', 'v5o1', [
      ['Open <b>Mail'.replace(/<[^>]+>/g, ''), async () => { Apps.launch('epost'); await tick(); ok(mailRoot().querySelectorAll('.mail-item').length === 7, 'inbox has seven messages'); }],
      ['Action required', async () => openMail('m4')],
      ['Hover the mouse', async () => { const a = mailRoot().querySelector('.mr-link'); a.dispatchEvent(new MouseEvent('mouseenter')); await tick(); ok(/micros0ft-support\.com/.test(mailRoot().querySelector('.mr-status').textContent), 'statuslinjen viser den egentlige adressen'); }],
      ['Report phishing', async () => report()],
      ['other three', async () => {
        await openMail('m5'); await report();
        mailRoot().querySelector('.mf:nth-child(3)').click(); await tick();
        await openMail('m5'); btnText(mailRoot(), /Not junk/).click(); await tick();
        await openMail('m6'); await report(); await openMail('m7'); await report();
      }]
    ]);
    await play('v5', 'v5o2', [
      ['Settings', async () => { Apps.launch('innstillinger'); await tick(); WM.list('innstillinger')[0].el.querySelector('.pw').click(); await tick(); }],
      ['bad</b> password'.replace(/<[^>]+>/g, ''), async () => { const i = document.querySelector('.pw-in'); i.value = 'football123'; i.dispatchEvent(new Event('input')); ok(/weak/i.test(document.querySelector('.pw-label').textContent), 'fotball123 er svakt'); await dlgPrimary(); }],
      ['passphrase', async () => { WM.list('innstillinger')[0].el.querySelector('.pw').click(); await tick(); const i = document.querySelector('.pw-in'); i.value = 'bicycle cheese raincoat moon'; i.dispatchEvent(new Event('input')); await dlgPrimary(); }]
    ]);
    const shareDlg = async (path, who, perm) => { Explorer.share(R(path)); await tick(); const d = document.querySelector('#modal-layer .dlg'); d.querySelector('.sh-who').value = who; d.querySelector('.sh-perm').value = perm; await dlgPrimary(); };
    const SAMF = ['OneDrive', 'School', 'Social studies'];
    await play('v5', 'v5o3', [
      ['Right-click <b>Class-rules'.replace(/<[^>]+>/g, ''), async () => { Explorer.share(R([...SAMF, 'Class-rules.docx'])); await tick(); }],
      ['Can view only', async () => { const d = document.querySelector('#modal-layer .dlg'); d.querySelector('.sh-who').value = 'klassen'; d.querySelector('.sh-perm').value = 'read'; await dlgPrimary(); }],
      ['Group-project-election', async () => shareDlg([...SAMF, 'Group-project-election.docx'], 'gruppe', 'edit')]
    ]);
    await master('v5', [
      async () => { Apps.launch('epost'); await tick(); for (const m of ['m4', 'm6', 'm7']) { await openMail(m); await report(); } },
      async () => { Apps.launch('innstillinger'); await tick(); WM.list('innstillinger')[0].el.querySelector('.pw').click(); await tick(); const i = document.querySelector('.pw-in'); i.value = 'blue tractor sings loudly today'; await dlgPrimary(); },
      async () => shareDlg([...SAMF, 'Weekly-plan-8A.docx'], 'klassen', 'read')
    ]);

    /* ---------- V6 ---------- */
    const NAT = ['OneDrive', 'School', 'Science'];
    let pw = null;
    await play('v6', 'v6o1', [
      ['Make the folder', async () => FS.createFolder(id(NAT), 'Project-photosynthesis')],
      ['Download', async () => { Nettleser.open(); await tick(); [...document.querySelectorAll('.browser .card')].find(c => /Project files/.test(c.textContent)).querySelector('button').click(); await tick(); const z = FS.children(FS.roots().downloads).filter(c => /^Project-files-photosynthesis.*\.zip$/.test(c.name)).pop(); Zip.extract(z.id, id([...NAT, 'Project-photosynthesis'])); }],
      ['Read <b>Task'.replace(/<[^>]+>/g, ''), async () => { const f = FS.findAll(c => c.name === 'Task-photosynthesis.docx' && FS.path(c.id).some(p => p.name === 'Project-photosynthesis'))[0]; Apps.openFile(f.id, { via: 'explorer' }); await tick(); }],
      ['Write your answer', async () => { pw = skriv(); await tick(); type(pw, '<h1>Photosynthesis</h1><div>Planter lager sin egen mat ved hjelp av lys fra sola. De tar opp vann og karbondioksid og gir fra seg oksygen som vi trenger.</div><div>«' + PARA() + '»</div><div>Source: Ingrid Solberg, ' + Nettleser.ARTICLE.url + '</div>'); }],
      ['Save the document', async () => saveAs(pw, [...NAT, 'Project-photosynthesis'], 'Project-photosynthesis.docx')],
      ['Make a <b>PDF'.replace(/<[^>]+>/g, ''), async () => { FS.createFile(id([...NAT, 'Project-photosynthesis']), 'Project-photosynthesis.pdf', 'x'); Bus.emit('print', { target: 'pdf', name: 'Project-photosynthesis.pdf' }); }],
      ['Share</b> the Word'.replace(/<[^>]+>/g, ''), async () => shareDlg([...NAT, 'Project-photosynthesis', 'Project-photosynthesis.docx'], 'gruppe', 'edit')],
      ['Hand in', async () => Bus.emit('submit', { assignment: 'naturfag-prosjekt', files: ['Project-photosynthesis.pdf'] })]
    ]);
    await master('v6', [
      async () => FS.createFolder(id(NAT), 'Master-project'),
      async () => { pw = skriv(); await tick(); type(pw, '<h1>Photosynthesis</h1><div>«' + PARA() + '»</div><div>Source: ' + Nettleser.ARTICLE.url + '</div>'); saveAs(pw, [...NAT, 'Master-project'], 'Answer.docx'); },
      async () => FS.createFile(id([...NAT, 'Master-project']), 'Answer.pdf', 'x'),
      async () => Bus.emit('submit', { assignment: 'naturfag-prosjekt', files: ['Answer.pdf'] })
    ]);

    Coach.render(); W.P().tab = 'kurs'; Coach.render(); await tick(30);
    ok(document.querySelectorAll('#coach-body .kurs-del').length === 1 && /Advanced/.test(document.querySelector('#coach-body .kurs-del').textContent), 'deloverskrift Viderekommen i kurslisten');
  } catch (e) { log('EXCEPTION ' + (e && e.stack)); }
  W.done();
})();
