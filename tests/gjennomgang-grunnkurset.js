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
    const MOB = ['Denne PC-en', 'Dokumenter', 'Fra mobilen'];
    await play('v1', 'v1o1', [
      ['Fra mobilen', async () => { Explorer.open(FS.roots().pc); await tick(); nav(MOB); view().setSort('name', 1); await tick(); }],
      ['IMG_2001', async () => { const v = view(); click(itemEl(v, 'IMG_2001.jpg')); click(itemEl(v, 'IMG_2004.jpg'), { shiftKey: true }); ok(v.sel.size === 4, 'Shift+klikk velger fire'); }],
      ['Matte-uke41', async () => { const v = view(); click(itemEl(v, 'Matte-uke41.pdf')); click(itemEl(v, 'Matte-uke42.pdf'), { ctrlKey: true }); click(itemEl(v, 'Matte-uke43.pdf'), { ctrlKey: true }); }],
      ['Flytt alle tre', async () => { const v = view(); WM.focus(v.win, 'test'); key('x', { ctrlKey: true }); await tick(); nav(['OneDrive', 'Skole', 'Matte']); await tick(); key('v', { ctrlKey: true }); await tick(); }],
      ['Ctrl</kbd>+<kbd>A'.replace(/<[^>]+>/g, ''), async () => { nav(MOB); await tick(); key('a', { ctrlKey: true }); await tick(); }],
      ['IMG_2008', async () => { click(itemEl(view(), 'IMG_2008.jpg'), { ctrlKey: true }); }],
      ['Kopier</b> de sju'.replace(/<[^>]+>/g, ''), async () => { key('c', { ctrlKey: true }); await tick(); nav(['Denne PC-en', 'Bilder']); await tick(); key('v', { ctrlKey: true }); await tick(); }]
    ]);
    const SKJ = ['Denne PC-en', 'Dokumenter', 'Skjermbilder'];
    await play('v1', 'v1o2', [
      ['Skjermbilder', async () => { Explorer.open(id(SKJ)); await tick(); }],
      ['tomt sted', async () => {
        const v = view(), c = v.root.querySelector('.ex-content'), r = c.getBoundingClientRect();
        const pe = (t, type, x, y) => t.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 0, pointerId: 1 }));
        pe(c, 'pointerdown', r.right - 6, r.bottom - 6); pe(document, 'pointermove', r.right - 30, r.bottom - 30); pe(document, 'pointermove', r.left + 2, r.top + 2); pe(document, 'pointerup', r.left + 2, r.top + 2);
        await tick(); ok(v.sel.size === 7, 'dra-markering valgte alle sju: ' + v.sel.size);
        click(c); ok(v.sel.size === 7, 'klikket etter dra-markeringen fjerner ikke utvalget');
      }],
      ['alle seks', async () => { click(itemEl(view(), 'Viktig-notat.txt'), { ctrlKey: true }); }],
      ['Delete', async () => { WM.focus(view().win, 'test'); key('Delete'); await tick(); }],
      ['Papirkurven', async () => { nav(['Papirkurv']); await tick(); const v = view(); const ids = FS.children(v.cwd).filter(c => /^skjermbilde/i.test(c.name)).map(c => c.id); v.select(ids, 'ctrl'); const el = v.root.querySelector(`.ex-content [data-id="${ids[0]}"]`); ctx(el); await clickCtx(/Gjenopprett/); }]
    ]);
    await master('v1', [
      async () => { Explorer.open(id(['Denne PC-en', 'Dokumenter', 'Rot'])); await tick(); const v = view(); const ids = FS.children(v.cwd).filter(c => /^engelsk/i.test(c.name)).map(c => c.id); v.select(ids, 'ctrl'); key('x', { ctrlKey: true }); await tick(); nav(['OneDrive', 'Skole', 'Engelsk']); await tick(); key('v', { ctrlKey: true }); await tick(); },
      async () => { nav(['Denne PC-en', 'Dokumenter', 'Rot']); await tick(); const v = view(); const ids = FS.children(v.cwd).filter(c => /^naturfag/i.test(c.name)).map(c => c.id); await dropOn(v, [], false); DnD.ids = ids; nav(['OneDrive', 'Skole', 'Naturfag']); await tick(); await dropOn(view(), ids); },
      async () => { nav(['Denne PC-en', 'Dokumenter', 'Rot']); await tick(); const v = view(); v.select(FS.children(v.cwd).filter(c => /\.tmp$/.test(c.name)).map(c => c.id), 'ctrl'); key('Delete'); await tick(); }
    ]);

    /* ---------- V2 ---------- */
    await play('v2', 'v2o1', [
      ['gå til <b>Dokumenter'.replace(/<[^>]+>/g, ''), async () => { Explorer.open(id(['Denne PC-en', 'Dokumenter'])); await tick(); }],
      ['tittellinjen', async () => { await snap(view().win, 'left'); ok(view().win.el.style.width === '50%' || view().win.el.offsetWidth < window.innerWidth * 0.6, 'vinduet ble halvt'); }],
      ['vindu til', async () => { Explorer.open(id(['OneDrive', 'Skole', 'Engelsk'])); await tick(); }],
      ['høyre</b> halvdel'.replace(/<[^>]+>/g, ''), async () => snap(view().win, 'right')],
      ['Gloser-uke-41', async () => { const left = Explorer.views.find(v => FS.get(v.cwd).name === 'Dokumenter'); const right = Explorer.views.find(v => FS.get(v.cwd).name === 'Engelsk'); const ids = FS.children(left.cwd).filter(c => /^gloser-uke-4[12]/i.test(c.name)).map(c => c.id); await dropOn(right, ids); }]
    ]);
    await play('v2', 'v2o2', [
      ['Notater-fra-timen', async () => { skriv(id(['OneDrive', 'Skole', 'Norsk', 'Notater-fra-timen.docx'])); await tick(); }],
      ['venstre</b> halvdel'.replace(/<[^>]+>/g, ''), async () => snap(WM.list('skriv')[0], 'left')],
      ['nytt, tomt', async () => { Apps.launch('skriv', { via: 'startmenu' }); await tick(); await snap(WM.list('skriv').slice(-1)[0], 'right'); }],
      ['marker setningen', async () => { const ed = edOf(WM.list('skriv')[0]); ed.focus(); ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'c', ctrlKey: true, bubbles: true })); }],
      ['lim inn', async () => { const w = WM.list('skriv').slice(-1)[0], ed = edOf(w); ed.focus(); const dt = new DataTransfer(); dt.setData('text/plain', 'En novelle er en kort fortelling med få personer.'); ed.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true })); await tick(); }],
      ['Sammendrag', async () => { const w = WM.list('skriv').slice(-1)[0]; ok(/novelle/i.test(edOf(w).textContent), 'limt tekst havnet i Skriv'); saveAs(w, ['OneDrive', 'Skole', 'Norsk'], 'Sammendrag.docx'); }]
    ]);
    await master('v2', [
      async () => { Explorer.open(id(['Denne PC-en', 'Dokumenter'])); await tick(); await snap(view().win, 'left'); },
      async () => { Explorer.open(id(['Denne PC-en', 'Skrivebord'])); await tick(); await snap(view().win, 'right'); },
      async () => { const right = view(); await dropOn(right, [id(['Denne PC-en', 'Dokumenter', 'Til-skrivebordet.txt'])]); }
    ]);
    /* Ctrl + slipp kopierer */
    { FS.silentRemoveAll('ctrl-kopi.txt'); FS.ensureFileAt(['Denne PC-en', 'Dokumenter'], 'ctrl-kopi.txt', 'x'); Explorer.open(FS.roots().desktop); await tick(); await dropOn(view(), [id(['Denne PC-en', 'Dokumenter', 'ctrl-kopi.txt'])], true); ok(!!R(['Denne PC-en', 'Dokumenter', 'ctrl-kopi.txt']) && !!R(['Denne PC-en', 'Skrivebord', 'ctrl-kopi.txt']), 'Ctrl + slipp kopierer'); }

    /* ---------- V3 ---------- */
    await play('v3', 'v3o1', [
      ['Bokanmeldelse</b> fra'.replace(/<[^>]+>/g, ''), async () => { skriv(id(['OneDrive', 'Skole', 'Norsk', 'Bokanmeldelse.docx'])); await tick(); }],
      ['Ctrl</kbd>+<kbd>P'.replace(/<[^>]+>/g, ''), async () => { const ed = edOf(WM.list('skriv')[0]); ed.focus(); ed.dispatchEvent(new KeyboardEvent('keydown', { key: 'p', ctrlKey: true, bubbles: true })); await tick(); }],
      ['Microsoft Print to PDF', async () => { const d = document.querySelector('#modal-layer .dlg'); d.querySelector('.pd-target').value = 'pdf'; await dlgPrimary(); await tick(60); await dlgPrimary(); await tick(60); }],
      ['PDF-filen', async () => { Apps.openFile(id(['OneDrive', 'Skole', 'Norsk', 'Bokanmeldelse.pdf']), { via: 'explorer' }); }]
    ]);
    let zipId = null;
    await play('v3', 'v3o2', [
      ['last ned', async () => { Nettleser.open(); await tick(); const card = [...document.querySelectorAll('.browser .card')].find(c => /Prosjektfiler/.test(c.textContent)); card.querySelector('button').click(); await tick(); }],
      ['Nedlastinger', async () => { zipId = FS.children(FS.roots().downloads).find(c => /^Prosjektfiler-fotosyntese.*\.zip$/.test(c.name)).id; Apps.openFile(zipId, { via: 'explorer' }); await tick(); }],
      ['inni ZIP-filen', async () => { const w = WM.list('explorer').slice(-1)[0]; const it = [...w.el.querySelectorAll('.item')].find(x => /Oppgave-fotosyntese/.test(x.textContent)); it.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); await tick(); ok(!!document.querySelector('#modal-layer .dlg'), 'advarsel om fil i ZIP'); btnText(document.querySelector('#modal-layer .dlg'), /Avbryt|Cancel/).click(); await tick(); }],
      ['Pakk ut alle', async () => { Zip.extract(zipId, id(['OneDrive', 'Skole', 'Naturfag'])); await tick(); }],
      ['utpakkede', async () => { Apps.openFile(id(['OneDrive', 'Skole', 'Naturfag', 'Prosjektfiler-fotosyntese', 'Oppgave-fotosyntese.docx']), { via: 'explorer' }); await tick(); }],
      ['Slett ZIP-filen', async () => { FS.remove(zipId, { via: 'test' }); }]
    ]);
    ok(!!R(['OneDrive', 'Skole', 'Naturfag', 'Prosjektfiler-fotosyntese', 'Bilder', 'blad.jpg']), 'undermapper i ZIP blir pakket ut');
    await play('v3', 'v3o3', [
      ['Naturfag</b>. Der'.replace(/<[^>]+>/g, ''), async () => { Explorer.open(id(['OneDrive', 'Skole', 'Naturfag'])); await tick(); }],
      ['Komprimer til', async () => { const v = view(); const el = itemEl(v, 'Labrapport'); click(el); ctx(el); await clickCtx(/^\s*Komprimer til/); const sub = [...document.querySelectorAll('#ctxmenu .submenu .cm-item')].find(x => /ZIP-fil/.test(x.textContent)); sub.click(); await tick(60); }],
      ['Enter', async () => { const inp = view().root.querySelector('.name input'); if (inp) inp.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); await tick(); }],
      ['vedlegg', async () => { Bus.emit('mail-send', { to: 'kari.hansen@skolen.no', subject: 'Labrapport', attach: ['Labrapport.zip'], reply: false, all: false, body: 'Her' }); }]
    ]);
    { const z = R(['OneDrive', 'Skole', 'Naturfag', 'Labrapport.zip']); ok(!!z && (Zip.entries(z) || []).some(e => e.p === 'Labrapport/Rapport.docx'), 'ZIP-filen inneholder mappen med filene'); }
    /* Pakk ut-dialogen: standardmålet er mappen ZIP-filen ligger i */
    { const z = R(['OneDrive', 'Skole', 'Naturfag', 'Labrapport.zip']); const lab = R(['OneDrive', 'Skole', 'Naturfag', 'Labrapport']); FS.purge(lab.id); Zip.extractDialog(z.id); await tick(); await dlgPrimary(); await tick(60); ok(!!R(['OneDrive', 'Skole', 'Naturfag', 'Labrapport', 'Labrapport', 'Rapport.docx']), 'Pakk ut-dialogen pakker ut i en mappe ved siden av'); }
    { const n = FS.createFile(FS.roots().documents, 'falsk.zip', 'bare tekst'); Apps.openFile(n.id); await tick(); ok(/ugyldig|invalid/i.test((document.querySelector('#modal-layer .dlg') || {}).textContent || ''), 'ugyldig ZIP gir Windows-melding'); await dlgPrimary(); }
    await master('v3', [
      async () => { Zip.extract(id(['Denne PC-en', 'Nedlastinger', 'Ukeoppgaver.zip']), id(['OneDrive', 'Skole'])); },
      async () => { FS.createFile(id(['OneDrive', 'Skole', 'Norsk']), 'Svar-uke-41.pdf', 'x'); Bus.emit('print', { target: 'pdf', name: 'Svar-uke-41.pdf' }); },
      async () => { Zip.compress([id(['OneDrive', 'Skole', 'Ukeoppgaver'])], id(['OneDrive', 'Skole']), null); }
    ]);

    /* ---------- V4 ---------- */
    let sw = null;
    await play('v4', 'v4o1', [
      ['Nettleser</b> og klikk'.replace(/<[^>]+>/g, ''), async () => { Nettleser.open(); await tick(); document.querySelector('.br-link[data-page="artikkel"]').click(); await tick(); }],
      ['Marker én setning', async () => { const p = document.querySelector('.art p'); const r = document.createRange(); r.selectNodeContents(p); const s = getSelection(); s.removeAllRanges(); s.addRange(r); p.dispatchEvent(new ClipboardEvent('copy', { bubbles: true, cancelable: true })); }],
      ['Skriv</b>. Skriv'.replace(/<[^>]+>/g, ''), async () => { sw = skriv(); await tick(); type(sw, '<div>«' + PARA() + '»</div>'); }],
      ['adressefeltet', async () => { const u = document.querySelector('.browser .url'); ctx(u); await clickCtx(/Kopier adresse/); }],
      ['Kilde:', async () => { type(sw, '<div>«' + PARA() + '»</div><div>Kilde: ' + Nettleser.ARTICLE.url + ', Ingrid Solberg, 14.10.2026</div>'); }],
      ['Fotosyntese-sitat', async () => saveAs(sw, ['OneDrive', 'Skole', 'Naturfag'], 'Fotosyntese-sitat.docx')]
    ]);
    await play('v4', 'v4o2', [
      ['DU VIL IKKE TRO', async () => { Nettleser.open(); await tick(); document.querySelector('.br-link[data-page="blogg"]').click(); await tick(); }],
      ['Gå tilbake', async () => { document.querySelector('.browser .br-back').click(); await tick(); document.querySelector('.br-link[data-page="artikkel"]').click(); await tick(); }]
    ]);
    await master('v4', [
      async () => { sw = skriv(); await tick(); type(sw, '<div>"' + PARA() + '"</div><div>Kilde: ' + Nettleser.ARTICLE.url + ' (Ingrid Solberg)</div>'); },
      async () => saveAs(sw, ['OneDrive', 'Skole'], 'Kildebruk.docx')
    ]);

    /* ---------- V5 ---------- */
    const mailRoot = () => WM.list('epost')[0].el;
    const openMail = async idm => { mailRoot().querySelector(`.mail-item[data-id="${idm}"]`).click(); await tick(); };
    const report = async () => { btnText(mailRoot(), /Rapporter phishing/).click(); await tick(); };
    await play('v5', 'v5o1', [
      ['Åpne <b>E-post'.replace(/<[^>]+>/g, ''), async () => { Apps.launch('epost'); await tick(); ok(mailRoot().querySelectorAll('.mail-item').length === 7, 'innboksen har sju meldinger'); }],
      ['Handling kreves', async () => openMail('m4')],
      ['musepekeren', async () => { const a = mailRoot().querySelector('.mr-link'); a.dispatchEvent(new MouseEvent('mouseenter')); await tick(); ok(/micros0ft-support\.com/.test(mailRoot().querySelector('.mr-status').textContent), 'statuslinjen viser den egentlige adressen'); }],
      ['Rapporter phishing', async () => report()],
      ['tre andre', async () => {
        await openMail('m5'); await report();
        mailRoot().querySelector('.mf:nth-child(3)').click(); await tick();
        await openMail('m5'); btnText(mailRoot(), /Ikke søppelpost/).click(); await tick();
        await openMail('m6'); await report(); await openMail('m7'); await report();
      }]
    ]);
    await play('v5', 'v5o2', [
      ['Innstillinger', async () => { Apps.launch('innstillinger'); await tick(); WM.list('innstillinger')[0].el.querySelector('.pw').click(); await tick(); }],
      ['dårlig', async () => { const i = document.querySelector('.pw-in'); i.value = 'fotball123'; i.dispatchEvent(new Event('input')); ok(/svakt/i.test(document.querySelector('.pw-label').textContent), 'fotball123 er svakt'); await dlgPrimary(); }],
      ['passordfrase', async () => { WM.list('innstillinger')[0].el.querySelector('.pw').click(); await tick(); const i = document.querySelector('.pw-in'); i.value = 'sykkel ost regnjakke måne'; i.dispatchEvent(new Event('input')); await dlgPrimary(); }]
    ]);
    const shareDlg = async (path, who, perm) => { Explorer.share(R(path)); await tick(); const d = document.querySelector('#modal-layer .dlg'); d.querySelector('.sh-who').value = who; d.querySelector('.sh-perm').value = perm; await dlgPrimary(); };
    const SAMF = ['OneDrive', 'Skole', 'Samfunnsfag'];
    await play('v5', 'v5o3', [
      ['Høyreklikk på <b>Klassens'.replace(/<[^>]+>/g, ''), async () => { Explorer.share(R([...SAMF, 'Klassens-regler.docx'])); await tick(); }],
      ['Kan bare lese', async () => { const d = document.querySelector('#modal-layer .dlg'); d.querySelector('.sh-who').value = 'klassen'; d.querySelector('.sh-perm').value = 'read'; await dlgPrimary(); }],
      ['Gruppeoppgave-valg', async () => shareDlg([...SAMF, 'Gruppeoppgave-valg.docx'], 'gruppe', 'edit')]
    ]);
    await master('v5', [
      async () => { Apps.launch('epost'); await tick(); for (const m of ['m4', 'm6', 'm7']) { await openMail(m); await report(); } },
      async () => { Apps.launch('innstillinger'); await tick(); WM.list('innstillinger')[0].el.querySelector('.pw').click(); await tick(); const i = document.querySelector('.pw-in'); i.value = 'blå traktor synger høyt i dag'; await dlgPrimary(); },
      async () => shareDlg([...SAMF, 'Ukeplan-8A.docx'], 'klassen', 'read')
    ]);

    /* ---------- V6 ---------- */
    const NAT = ['OneDrive', 'Skole', 'Naturfag'];
    let pw = null;
    await play('v6', 'v6o1', [
      ['Lag mappen', async () => FS.createFolder(id(NAT), 'Prosjekt-fotosyntese')],
      ['Last ned', async () => { Nettleser.open(); await tick(); [...document.querySelectorAll('.browser .card')].find(c => /Prosjektfiler/.test(c.textContent)).querySelector('button').click(); await tick(); const z = FS.children(FS.roots().downloads).filter(c => /^Prosjektfiler-fotosyntese.*\.zip$/.test(c.name)).pop(); Zip.extract(z.id, id([...NAT, 'Prosjekt-fotosyntese'])); }],
      ['Les <b>Oppgave'.replace(/<[^>]+>/g, ''), async () => { const f = FS.findAll(c => c.name === 'Oppgave-fotosyntese.docx' && FS.path(c.id).some(p => p.name === 'Prosjekt-fotosyntese'))[0]; Apps.openFile(f.id, { via: 'explorer' }); await tick(); }],
      ['Skriv svaret', async () => { pw = skriv(); await tick(); type(pw, '<h1>Fotosyntese</h1><div>Planter lager sin egen mat ved hjelp av lys fra sola. De tar opp vann og karbondioksid og gir fra seg oksygen som vi trenger.</div><div>«' + PARA() + '»</div><div>Kilde: Ingrid Solberg, ' + Nettleser.ARTICLE.url + '</div>'); }],
      ['Lagre dokumentet', async () => saveAs(pw, [...NAT, 'Prosjekt-fotosyntese'], 'Prosjekt-fotosyntese.docx')],
      ['Lag en <b>PDF'.replace(/<[^>]+>/g, ''), async () => { FS.createFile(id([...NAT, 'Prosjekt-fotosyntese']), 'Prosjekt-fotosyntese.pdf', 'x'); Bus.emit('print', { target: 'pdf', name: 'Prosjekt-fotosyntese.pdf' }); }],
      ['Del</b> Word'.replace(/<[^>]+>/g, ''), async () => shareDlg([...NAT, 'Prosjekt-fotosyntese', 'Prosjekt-fotosyntese.docx'], 'gruppe', 'edit')],
      ['Lever', async () => Bus.emit('submit', { assignment: 'naturfag-prosjekt', files: ['Prosjekt-fotosyntese.pdf'] })]
    ]);
    await master('v6', [
      async () => FS.createFolder(id(NAT), 'Mesterprosjekt'),
      async () => { pw = skriv(); await tick(); type(pw, '<h1>Fotosyntese</h1><div>«' + PARA() + '»</div><div>Kilde: ' + Nettleser.ARTICLE.url + '</div>'); saveAs(pw, [...NAT, 'Mesterprosjekt'], 'Svar.docx'); },
      async () => FS.createFile(id([...NAT, 'Mesterprosjekt']), 'Svar.pdf', 'x'),
      async () => Bus.emit('submit', { assignment: 'naturfag-prosjekt', files: ['Svar.pdf'] })
    ]);

    Coach.render(); W.P().tab = 'kurs'; Coach.render(); await tick(30);
    ok(document.querySelectorAll('#coach-body .kurs-del').length === 1 && /Viderekommen/.test(document.querySelector('#coach-body .kurs-del').textContent), 'deloverskrift Viderekommen i kurslisten');
  } catch (e) { log('EXCEPTION ' + (e && e.stack)); }
  W.done();
})();
