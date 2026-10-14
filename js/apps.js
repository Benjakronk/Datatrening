/* Programmer på øvings-PC-en: Skriv, Nettleser, Innleveringer, filvisning og Innstillinger */

const Apps = (() => {
  /* Noen programmer må installeres fra Firmaportalen før de finnes på PC-en */
  const NEEDS = { kode: 'vscode' };
  function available(app) {
    if (!window.Firmaportal) return true;
    const req = NEEDS[app];
    return !req || Firmaportal.isInstalled(req);
  }
  async function notInstalled(app) {
    Bus.emit('app-missing', { app });
    const ok = await Dialog.confirm(T('Programmet er ikke installert'),
      T('{0} er ikke installert på denne PC-en ennå. På en skole-PC henter du programmer fra Firmaportalen, ikke fra nettet. Vil du åpne Firmaportalen nå?', WM.appName(app)),
      T('Åpne Firmaportalen'), T('Ikke nå'));
    if (ok && window.Firmaportal) Firmaportal.open('Visual Studio Code');
    return null;
  }
  function launch(app, args = {}) {
    WM.setLaunchVia(args.via || null);
    if (!available(app)) { WM.setLaunchVia(null); notInstalled(app); return null; }
    switch (app) {
      case 'explorer': return Explorer.open(args.folderId || FS.roots().pc, args);
      case 'papirkurv': return Explorer.open(FS.roots().bin);
      case 'skriv': return Skriv.open(args.nodeId);
      case 'nettleser': return Nettleser.open();
      case 'innlevering': return Innlevering.open();
      case 'innstillinger': return Innstillinger.open();
      case 'taskmgr': return TaskMgr.open();
      case 'intro': if (window.Intro) Intro.show(false); WM.setLaunchVia(null); return null;
      case 'firmaportal': return window.Firmaportal ? Firmaportal.open(args.search) : null;
      case 'notater': return window.Notater ? Notater.open() : null;
      case 'epost': return window.Epost ? Epost.open() : null;
      case 'skrivetrening': return window.Skrivetrening ? Skrivetrening.open() : null;
      case 'kabal': return window.Spill ? Spill.openKabal() : null;
      case 'minesveiper': return window.Spill ? Spill.openMines() : null;
      case 'terminal': return window.Terminal ? Terminal.open(args.folderId) : null;
      case 'kode': return window.Kode ? Kode.open(args) : null;
      case 'bilder': return args.nodeId ? Viewer.open(args.nodeId) : Explorer.open(FS.roots().pictures);
      default: WM.setLaunchVia(null);
    }
  }
  const CODE_EXT = ['py', 'ps1', 'js', 'html', 'css', 'json', 'md', 'csv', 'txt'];
  function openFile(id, opts = {}) {
    const n = FS.get(id); if (!n) return;
    if (n.type === 'folder') return Explorer.open(id);
    const e = FS.ext(n.name);
    Bus.emit('open-file', { id, name: n.name, ext: e, via: opts.via });
    if (e === 'zip' && window.Zip) return Zip.open(id);
    if (window.Kode && available('kode') && CODE_EXT.includes(e)) return Kode.open({ fileId: id, via: opts.via });
    if (['txt', 'docx', 'doc', 'md'].includes(e)) return Skriv.open(id);
    return Viewer.open(id);
  }
  return { launch, openFile, available };
})();
window.Apps = Apps;

/* ---------- Nettleser (simulert skoleportal) ---------- */
const Nettleser = (() => {
  const downloads = [];
  /* ZIP-fil med prosjektfiler (formatet er beskrevet i zip.js) */
  const ZIP_PROSJEKT = 'ZIP:' + JSON.stringify([
    { p: T('Oppgave-fotosyntese.docx'), c: T('Prosjektoppgave: Fotosyntese\n\nForklar med egne ord hva fotosyntese er. Bruk minst én kilde, og skriv hvor du fant den.') },
    { p: T('Bilder') + '/', d: 1 },
    { p: T('Bilder') + '/' + T('blad.jpg'), c: '' },
    { p: T('Bilder') + '/' + T('solsikke.jpg'), c: '' },
    { p: T('Vurdering.txt'), c: T('Dette vurderes:\n- Forklaring med egne ord\n- Riktig bruk av kilder\n- Ryddig oppsett') }
  ]);
  const LINKS = [
    { fag: T('Matte'), title: T('Oppgaveark om brøk'), desc: T('Ukens oppgaver, 3 sider'), file: T('Oppgaveark-brøk.pdf'), content: T('Oppgaveark: Brøk\n\n1) Forkort 6/8\n2) Regn ut 1/2 + 1/4\n3) Hva er 3/5 av 40?') },
    { fag: T('Naturfag'), title: T('Mal for rapport'), desc: T('Bruk denne når du skriver labrapport'), file: T('Mal-rapport.docx'), content: T('RAPPORT\n\nTittel:\nHensikt:\nUtstyr:\nFremgangsmåte:\nResultat:\nKonklusjon:') },
    { fag: T('Norsk'), title: T('Bilde til fortellingen'), desc: T('Skogen om høsten'), file: T('Skogen.jpg'), content: '' },
    { fag: T('Samfunnsfag'), title: T('Presentasjon om demokrati'), desc: T('Lysbildene fra timen'), file: T('Demokrati.pptx'), content: T('Demokrati\nFolkestyre – alle over 18 år kan stemme.') },
    { fag: T('Naturfag'), title: T('Prosjektfiler om fotosyntese'), desc: T('Pakket mappe (ZIP) med oppgave og bilder'), file: T('Prosjektfiler-fotosyntese.zip'), content: ZIP_PROSJEKT }
  ];
  /* Lesestoff: en ordentlig fagartikkel og en dårlig kilde, til kildekritikk */
  const ARTICLE = {
    url: T('ovings-pc.simulering/naturfagleksikon/fotosyntese'),
    site: T('Naturfagleksikonet'), title: T('Fotosyntese'),
    by: T('Skrevet av Ingrid Solberg, lektor i naturfag · Faglig kontrollert av Universitetet i Bergen · Sist oppdatert 3. mars 2025'),
    paras: [
      T('Fotosyntese er prosessen der grønne planter, alger og noen bakterier bruker energi fra sollys til å lage sukker av karbondioksid og vann.'),
      T('Prosessen skjer i kloroplastene i bladene. Der finnes det grønne fargestoffet klorofyll, som fanger opp lyset.'),
      T('Som et biprodukt slipper plantene ut oksygen. Nesten alt oksygenet vi puster inn, kommer fra fotosyntese.'),
      T('Sukkeret bruker plantene som energi og byggemateriale, for eksempel til å vokse og lage frø.')
    ]
  };
  const BLOG = {
    url: T('superfakta-blogg.simulering/planter-wow'),
    title: T('DU VIL IKKE TRO HVA PLANTER GJØR!!! 🌱😱'),
    paras: [
      T('Visste du at planter spiser jord? Det er derfor de vokser! Forskere hater dette trikset.'),
      T('Planter trenger ikke lys i det hele tatt, det er bare en myte fra gamle dager.'),
      T('Klikk her for å vinne en gratis iPhone hvis du deler artikkelen med ti venner!')
    ]
  };
  const PORTAL_URL = T('ovings-pc.simulering/skoleportalen/8a/oppgaver');
  function open(start) {
    if (WM.full()) return null;
    const root = el(`<div class="browser">
      <div class="br-tabs"><span class="br-tab">🏫 ${T('Skoleportalen')}</span></div>
      <div class="br-addr"><button class="nav-btn br-back" title="${T('Tilbake')}">←</button><button class="nav-btn br-fwd" title="${T('Frem')}">→</button><button class="nav-btn br-reload">⟳</button><div class="url"></div><button class="nav-btn dlb" title="${T('Nedlastinger')}">⭳</button></div>
      <div class="br-page"><div class="br-content"></div><div class="dl-flyout hidden"></div></div>
    </div>`);
    const win = WM.create({ app: 'nettleser', title: T('Skoleportalen – Nettleser'), body: root, width: 900, height: 600 });
    const fly = root.querySelector('.dl-flyout');
    const content = root.querySelector('.br-content');
    const urlEl = root.querySelector('.url');
    let hist = [], hi = -1, page = 'portal';
    const urlOf = p => p === 'artikkel' ? ARTICLE.url : p === 'blogg' ? BLOG.url : PORTAL_URL;
    const back = () => { if (hi > 0) { hi--; go(hist[hi], false); } };
    const fwd = () => { if (hi < hist.length - 1) { hi++; go(hist[hi], false); } };
    function go(p, push = true) {
      page = p;
      if (push) { hist = hist.slice(0, hi + 1); hist.push(p); hi = hist.length - 1; }
      urlEl.textContent = urlOf(p);
      root.querySelector('.br-tab').textContent = p === 'artikkel' ? '📘 ' + ARTICLE.title + ' – ' + ARTICLE.site : p === 'blogg' ? '😱 ' + T('SuperFakta-bloggen') : '🏫 ' + T('Skoleportalen');
      root.querySelector('.br-back').disabled = hi <= 0;
      root.querySelector('.br-fwd').disabled = hi >= hist.length - 1;
      content.innerHTML = '';
      if (p === 'artikkel') renderArticle(); else if (p === 'blogg') renderBlog(); else renderPortal();
      root.querySelector('.br-page').scrollTop = 0;
      Bus.emit('browser-nav', { page: p, url: urlOf(p) });
    }
    function renderPortal() {
      content.appendChild(el(`<div><div class="site-head">${T('Skoleportalen')} <small>${T('8A · Ukeplan og oppgaver · Dette er en øvingsside i Datatrening, ikke en ekte nettside')}</small></div>
        <div class="site-body"><h2>${T('Filer fra lærerne')}</h2><div class="cards"></div><p class="muted">${T('Klikk «Last ned» for å hente en fil. Filen havner i mappen <b>Nedlastinger</b> på PC-en.')}</p>
        <h2 style="margin-top:22px">${T('Lesestoff til naturfag')}</h2><div class="br-links"></div></div></div>`));
      const cards = content.querySelector('.cards');
      LINKS.forEach(l => {
        const c = el(`<div class="card"><span class="ico">${Icons.file(FS.ext(l.file), 36)}</span><div class="ct"><b>${esc(l.title)}</b><span>${esc(l.desc)} · ${esc(l.file)}</span></div><span class="fag">${esc(l.fag)}</span><button class="btn small primary">${T('Last ned')}</button></div>`);
        c.querySelector('button').addEventListener('click', () => download(l));
        c.addEventListener('contextmenu', e => {
          e.preventDefault(); e.stopPropagation();
          Ctx.show(e.clientX, e.clientY, [
            { label: T('Åpne lenke i ny fane'), action: () => Toast.show(T('På en ekte PC åpnes lenken i en ny fane.')) },
            '-',
            { label: T('Lagre lenke som …'), action: () => saveLinkAs(l) },
            { label: T('Kopier lenke'), action: () => { if (navigator.clipboard) navigator.clipboard.writeText(T('ovings-pc.simulering/skoleportalen/filer/{0}', l.file)).catch(() => {}); Toast.show(T('Lenken er kopiert.')); } }
          ], 'link', T('nedlastingslenken «{0}»', l.title));
        });
        cards.appendChild(c);
      });
      const links = content.querySelector('.br-links');
      [['artikkel', '📘', ARTICLE.title + ' – ' + ARTICLE.site, ARTICLE.url], ['blogg', '😱', BLOG.title, BLOG.url]].forEach(([p, ico, t, u]) => {
        const a = el(`<a class="br-link" href="#" data-page="${p}"><span class="bl-ico">${ico}</span><span><b>${esc(t)}</b><small>${esc(u)}</small></span></a>`);
        a.addEventListener('click', e => { e.preventDefault(); go(p); });
        links.appendChild(a);
      });
    }
    function renderArticle() {
      content.appendChild(el(`<div class="art"><div class="art-site">📘 ${esc(ARTICLE.site)}</div><h1>${esc(ARTICLE.title)}</h1><div class="art-by">${esc(ARTICLE.by)}</div>${ARTICLE.paras.map(p => `<p>${esc(p)}</p>`).join('')}<div class="art-foot">${T('Kilder: Lærebok i naturfag for ungdomstrinnet; Universitetet i Bergen. Dette er en øvingsside i Datatrening.')}</div></div>`));
    }
    function renderBlog() {
      content.appendChild(el(`<div class="art blog"><div class="blog-ad">${T('REKLAME · Tjen 10 000 kr i uka hjemmefra!')}</div><h1>${esc(BLOG.title)}</h1><div class="art-by">${T('Publisert av «PlanteKongen99»')}</div>${BLOG.paras.map(p => `<p>${esc(p)}</p>`).join('')}<div class="blog-ad">${T('REKLAME · Gratis iPhone til de 100 første!')}</div></div>`));
    }
    root.querySelector('.br-back').addEventListener('click', back);
    root.querySelector('.br-fwd').addEventListener('click', fwd);
    root.querySelector('.br-reload').addEventListener('click', () => go(page, false));
    /* Kopiering fra siden registreres, så kildeoppdragene kan se at eleven kopierte noe */
    content.addEventListener('copy', () => {
      const t = String(window.getSelection() || '').trim();
      if (t) Bus.emit('browser-copy', { page, url: urlOf(page), text: t.slice(0, 2000) });
    });
    function copyUrl() {
      if (navigator.clipboard) navigator.clipboard.writeText(urlOf(page)).catch(() => {});
      Toast.show(T('Adressen er kopiert: {0}', urlOf(page)));
      Bus.emit('browser-copy-url', { page, url: urlOf(page) });
    }
    urlEl.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      Ctx.show(e.clientX, e.clientY, [{ label: T('Kopier adresse'), action: copyUrl }], 'browser-url', T('adressefeltet'));
    });
    urlEl.addEventListener('copy', () => Bus.emit('browser-copy-url', { page, url: urlOf(page) }));
    root.querySelector('.br-page').addEventListener('contextmenu', e => {
      if (e.target.closest('.card, .dl-flyout')) return;
      e.preventDefault();
      const sel = String(window.getSelection() || '').trim();
      Ctx.show(e.clientX, e.clientY, [
        sel ? { label: T('Kopier'), kbd: 'Ctrl+C', action: () => { if (navigator.clipboard) navigator.clipboard.writeText(sel).catch(() => {}); Bus.emit('browser-copy', { page, url: urlOf(page), text: sel.slice(0, 2000) }); Toast.show(T('Teksten er kopiert.')); } } : null,
        sel ? '-' : null,
        { label: T('Tilbake'), kbd: 'Alt+←', disabled: hi <= 0, action: back },
        { label: T('Frem'), kbd: 'Alt+→', disabled: hi >= hist.length - 1, action: fwd },
        { label: T('Oppdater'), kbd: 'F5', action: () => { go(page, false); Toast.show(T('Siden ble lastet på nytt.')); } },
        '-',
        { label: T('Kopier adresse'), action: copyUrl },
        { label: T('Lagre som …'), kbd: 'Ctrl+S', action: () => Toast.show(T('Dette lagrer hele nettsiden som en fil. Det trenger du sjelden.')) },
        { label: T('Skriv ut …'), kbd: 'Ctrl+P', action: () => Toast.show(T('Utskrift av nettsiden (simulert).')) },
        '-',
        { label: T('Vis sidekilde'), action: () => Toast.show(T('Sidekilden er koden bak nettsiden (HTML).')) }
      ], 'browser', T('nettsiden'));
    });
    async function saveLinkAs(l) {
      const ext = FS.ext(l.file);
      const r = await Dialog.fileChooser({ mode: 'save', title: T('Lagre som'), name: FS.base(l.file), types: [{ label: Icons.typeName({ type: 'file', name: l.file }) + ' (*.' + ext + ')', ext }], start: FS.roots().downloads });
      if (!r) return;
      let n = FS.children(r.folderId).find(c => c.name.toLowerCase() === r.name.toLowerCase());
      if (n) { const w = FS.write(n.id, l.content); if (w && w.error) { Toast.show(w.error); return; } }
      else { n = FS.createFile(r.folderId, r.name, l.content, { via: 'download' }); if (n.error) { Toast.show(n.error); return; } }
      downloads.unshift({ id: n.id, name: n.name });
      if (downloads.length > 20) downloads.length = 20;
      Bus.emit('download', { id: n.id, name: n.name, base: l.file, via: 'saveas', folderId: r.folderId });
      Toast.show(T('Lagret «{0}» i {1}', n.name, FS.get(r.folderId).name));
      fly.classList.remove('hidden'); renderFly();
    }
    root.querySelector('.dlb').addEventListener('click', () => { fly.classList.toggle('hidden'); renderFly(); });
    root.querySelector('.br-page').addEventListener('click', e => { if (!e.target.closest('.dl-flyout') && !fly.classList.contains('hidden')) fly.classList.add('hidden'); });

    function download(l) {
      const dl = FS.roots().downloads;
      const name = FS.uniqueName(dl, l.file);
      const n = FS.createFile(dl, name, l.content, { via: 'download' });
      if (n.error) { Toast.show(n.error); return; }
      downloads.unshift({ id: n.id, name: n.name });
      if (downloads.length > 20) downloads.length = 20;
      Bus.emit('download', { id: n.id, name: n.name, base: l.file });
      fly.classList.remove('hidden');
      renderFly();
    }
    function renderFly() {
      fly.innerHTML = '<h4>' + T('Nedlastinger') + '</h4>';
      if (!downloads.length) { fly.appendChild(el('<div class="dl-empty">' + T('Ingen nedlastinger ennå.') + '</div>')); return; }
      downloads.forEach(d => {
        const n = FS.get(d.id);
        const row = el(`<div class="dl-row"><span class="ico">${Icons.file(FS.ext(d.name), 28)}</span><div class="ct"><b>${esc(d.name)}</b>${n ? T('Ferdig · lagret i Nedlastinger<br><a class="op">Åpne fil</a><a class="sh">Vis i mappe</a>') : '<span class="muted">' + T('Filen er flyttet eller slettet') + '</span>'}</div></div>`);
        if (n) {
          row.querySelector('.op').addEventListener('click', () => { Bus.emit('download-open', { name: d.name }); Apps.openFile(d.id, { via: 'download' }); });
          row.querySelector('.sh').addEventListener('click', () => { Bus.emit('download-showinfolder', { name: d.name }); Explorer.open(FS.roots().downloads, { select: d.id }); });
        }
        fly.appendChild(row);
      });
    }
    go(start === 'artikkel' || start === 'blogg' ? start : 'portal');
    return win;
  }
  return { open, LINKS, ARTICLE, BLOG };
})();

/* ---------- Innleveringer (Teams-lignende oppgaveliste) ---------- */
const Innlevering = (() => {
  const ASSIGN = [
    { id: 'norsk-dikt', fag: T('Norsk'), title: T('Dikt-analyse'), due: T('fredag 25. september'), desc: T('Lever dikt-analysen din som et Word-dokument. Husk å gi filen et tydelig navn.') },
    { id: 'matte-brok', fag: T('Matte'), title: T('Brøk-oppgaver'), due: T('mandag 28. september'), desc: T('Lever det utfylte oppgavearket om brøk (PDF).') },
    { id: 'naturfag-rapport', fag: T('Naturfag'), title: T('Rapport: Fotosyntese'), due: T('onsdag 30. september'), desc: T('Lever labrapporten din. Bruk malen fra Skoleportalen.') },
    { id: 'naturfag-prosjekt', fag: T('Naturfag'), title: T('Prosjekt: Fotosyntese'), due: T('fredag 16. oktober'), desc: T('Lever prosjektet som PDF. Husk sitat og kilde.') }
  ];
  let state = {};
  try { state = JSON.parse(localStorage.getItem('dt-innlev') || '{}'); } catch (e) { state = {}; }
  function save() { localStorage.setItem('dt-innlev', JSON.stringify(state)); }
  function reset(id) { if (id) delete state[id]; else state = {}; save(); }
  function st(id) { return state[id] || (state[id] = { files: [], submitted: null }); }

  function open() {
    if (WM.full()) return null;
    let cur = null;
    const root = el(`<div class="teams"><div class="tm-side"><h3>${T('Oppgaver')}</h3><div class="tm-list"></div></div><div class="tm-main"></div></div>`);
    const win = WM.create({ app: 'innlevering', title: T('Innleveringer'), body: root, width: 900, height: 580 });
    function renderList() {
      const l = root.querySelector('.tm-list'); l.innerHTML = '';
      ASSIGN.forEach(a => {
        const s = st(a.id);
        const d = el(`<div class="tm-item${cur === a.id ? ' active' : ''}"><b>${esc(a.fag)}: ${esc(a.title)}</b><span>${T('Frist: {0}', esc(a.due))}</span>${s.submitted ? '<div class="st">' + T('✓ Levert') + '</div>' : ''}</div>`);
        d.addEventListener('click', () => { cur = a.id; Bus.emit('assignment-open', { id: a.id }); render(); });
        l.appendChild(d);
      });
    }
    function render() {
      renderList();
      const m = root.querySelector('.tm-main'); m.innerHTML = '';
      const a = ASSIGN.find(x => x.id === cur);
      if (!a) { m.appendChild(el('<div class="tm-empty">' + T('Velg en oppgave i listen til venstre.') + '</div>')); return; }
      const s = st(a.id);
      m.appendChild(el(`<h2>${esc(a.title)}</h2><div class="tm-meta">${esc(a.fag)} · ${T('Frist: {0}', esc(a.due))}</div><div class="tm-desc">${esc(a.desc)}</div>`));
      const w = el(`<div class="tm-work"><h4>${T('Mitt arbeid')}</h4><div class="files"></div><div class="tm-actions"></div></div>`);
      const files = w.querySelector('.files');
      if (!s.files.length) files.appendChild(el('<div class="muted">' + T('Ingen filer lagt til ennå.') + '</div>'));
      s.files.forEach((f, i) => {
        const row = el(`<div class="tm-file"><span class="ico">${Icons.file(FS.ext(f.name), 24)}</span><span>${esc(f.name)}</span>${s.submitted ? '' : '<button class="rm">' + T('Fjern') + '</button>'}</div>`);
        const rm = row.querySelector('.rm');
        if (rm) rm.addEventListener('click', () => { s.files.splice(i, 1); save(); render(); });
        files.appendChild(row);
      });
      const act = w.querySelector('.tm-actions');
      if (s.submitted) {
        act.appendChild(el(`<span class="tm-submitted">${T('✓ Levert {0}', fmtDate(s.submitted))}</span>`));
        const undo = el('<button class="btn small">' + T('Angre innlevering') + '</button>');
        undo.addEventListener('click', () => { s.submitted = null; save(); render(); });
        act.appendChild(undo);
      } else {
        const add = el('<button class="btn">' + T('+ Legg til arbeid') + '</button>');
        add.addEventListener('click', async () => {
          Bus.emit('attach-start', { assignment: a.id });
          const r = await Dialog.fileChooser({ mode: 'open', title: T('Legg til arbeid – velg en fil'), types: [{ label: T('Alle filer (*.*)'), ext: '' }], start: FS.roots().onedrive });
          if (!r) return;
          if (s.files.some(f => f.nodeId === r.nodeId)) { Toast.show(T('Filen er allerede lagt til.')); return; }
          if (s.files.length >= 10) { Toast.show(T('Du kan legge ved maks 10 filer per oppgave.')); return; }
          s.files.push({ nodeId: r.nodeId, name: r.name }); save();
          Bus.emit('attach', { assignment: a.id, name: r.name, nodeId: r.nodeId });
          render();
        });
        const sub = el(`<button class="btn teams"${s.files.length ? '' : ' disabled'}>${T('Lever inn')}</button>`);
        sub.addEventListener('click', () => {
          if (!s.files.length) return;
          s.submitted = Date.now(); save();
          Bus.emit('submit', { assignment: a.id, files: s.files.map(f => f.name) });
          Toast.show(T('Innlevert! Læreren kan nå se arbeidet ditt.'));
          render();
        });
        act.appendChild(add); act.appendChild(sub);
      }
      m.appendChild(w);
    }
    render();
    return win;
  }
  return { open, reset, ASSIGN, state: () => state };
})();

/* ---------- Filvisning for bilder, PDF, PowerPoint, Excel osv. ---------- */
const Viewer = (() => {
  function scene(name) {
    const hue = [...name].reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
    return `<svg class="v-img" viewBox="0 0 520 340" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="hsl(${hue},70%,75%)"/><stop offset="1" stop-color="hsl(${hue},60%,92%)"/></linearGradient></defs><rect width="520" height="340" fill="url(#sky)"/><circle cx="420" cy="70" r="36" fill="#ffd166"/><path d="M0 340L120 190l90 90 70-120 120 140 120-90v130z" fill="hsl(${(hue + 120) % 360},40%,40%)"/><path d="M0 340l160-110 110 110z" fill="hsl(${(hue + 120) % 360},45%,30%)"/><text x="16" y="326" font-size="13" fill="#fff" font-family="Segoe UI, sans-serif">${esc(name)}</text></svg>`;
  }
  function open(id) {
    const n = FS.get(id); if (!n) return null;
    if (WM.full()) return null;
    const e = FS.ext(n.name);
    let inner, app = 'viewer';
    if (['jpg', 'jpeg', 'png'].includes(e)) { inner = scene(n.name); app = 'bilder'; }
    else if (e === 'pdf') inner = `<div class="v-paper"><b style="font-size:18px">${esc(FS.base(n.name))}</b>\n\n${esc(n.content || T('Dette er en PDF-fil. En PDF ser lik ut på alle enheter og kan vanligvis ikke redigeres.'))}</div>`;
    else if (e === 'pptx') inner = `<div class="v-slide"><h1>${esc(FS.base(n.name))}</h1><p>${esc((n.content || T('Lysbilde 1 av 12')).split('\n')[0])}</p></div>`;
    else if (e === 'xlsx') inner = `<table class="v-sheet"><tr><th></th><th>A</th><th>B</th><th>C</th></tr><tr><th>1</th><td><b>${T('Post')}</b></td><td><b>${T('Beløp')}</b></td><td></td></tr><tr><th>2</th><td>${T('Buss')}</td><td>4 500</td><td></td></tr><tr><th>3</th><td>${T('Overnatting')}</td><td>12 000</td><td></td></tr><tr><th>4</th><td>${T('Mat')}</td><td>3 200</td><td></td></tr><tr><th>5</th><td><b>${T('Sum')}</b></td><td><b>19 700</b></td><td></td></tr></table>`;
    else inner = `<div class="v-generic"><div class="ico">${Icons.file(e, 96)}</div><b>${esc(n.name)}</b><p>${esc(Icons.typeName(n))}</p></div>`;
    const root = el(`<div class="viewer"><div class="v-head"><span class="ico">${Icons.file(e, 24)}</span><b>${esc(n.name)}</b><span class="muted">${esc(Icons.typeName(n))}</span></div><div class="v-body">${inner}</div><div class="v-info">${T('<b>Plassering:</b> {0} · <b>Størrelse:</b> {1}<br>På en ekte PC åpnes denne filtypen (.{2}) i <b>{3}</b>.', esc(FS.pathString(n.parent)), fmtSize(n.size), esc(e), esc(Icons.program(n)))}</div></div>`);
    return WM.create({ app, title: n.name, body: root, width: 720, height: 540 });
  }
  return { open };
})();

/* ---------- Innstillinger ---------- */
const Innstillinger = (() => {
  function open() {
    if (WM.full()) return null;
    const root = el(`<div class="settings">
      <h3>${T('Innstillinger')}</h3>
      <div class="opt"><input type="checkbox" id="set-ext"${Explorer.settings.showExt ? ' checked' : ''}><div class="desc"><label for="set-ext">${T('Vis filendelser i Filutforsker')}</label><small>${T('Viser .docx, .pdf osv. bak filnavnet.')}</small></div></div>
      <div class="opt"><div class="desc">${T('Konto: endre passord')}<small>${T('Øv på å lage et sterkt passord. Passordet lagres ikke, og du skal ikke skrive ditt ekte passord her.')}</small></div><button class="btn small pw">${T('Endre passord …')}</button></div>
      <div class="opt"><div class="desc">${T('Tilbakestill øvings-PC-en')}<small>${T('Sletter alle filer og mapper du har laget, og legger tilbake de opprinnelige filene. Fremdriften din beholdes.')}</small></div><button class="btn small reset-fs">${T('Tilbakestill')}</button></div>
      <div class="opt"><div class="desc">${T('Nullstill fremdrift')}<small>${T('Fjerner alle fullførte oppdrag og starter fra begynnelsen.')}</small></div><button class="btn small reset-p">${T('Nullstill')}</button></div>
    </div>`);
    root.querySelector('#set-ext').addEventListener('change', e => Explorer.setShowExt(e.target.checked, 'settings'));
    root.querySelector('.pw').addEventListener('click', () => passwordDialog());
    root.querySelector('.reset-fs').addEventListener('click', async () => { if (await Dialog.confirm(T('Tilbakestill'), T('Er du sikker? Alle filer og mapper du har laget blir borte.'))) { WM.list('explorer').forEach(w => WM.close(w)); FS.reset(); Toast.show(T('Øvings-PC-en er tilbakestilt.')); } });
    root.querySelector('.reset-p').addEventListener('click', async () => { if (await Dialog.confirm(T('Nullstill fremdrift'), T('Er du sikker? All fremdrift blir slettet.'))) Coach.resetProgress(); });
    return WM.create({ app: 'innstillinger', title: T('Innstillinger'), body: root, width: 620, height: 470 });
  }
  /* Passordstyrke: lengde teller mest. En passordfrase av flere vanlige ord er både sterk og lett å huske.
     Selve passordet lagres aldri og sendes ikke med i hendelsene, bare målene på det. */
  const COMMON = ['passord', 'password', 'hemmelig', 'secret', 'fotball', 'football', 'iloveyou', 'admin', 'letmein', 'welcome', 'velkommen',
    'sommer', 'summer', 'vinter', 'winter', 'skole', 'school', 'qwerty', 'qwertz', 'asdf', 'abc', 'monkey', 'dragon', 'sunshine', 'princess', 'master', 'hello', 'hei', 'test', 'norge', 'norway'];
  /* Passordstyrke: lengde teller mest. Vanlige ord med tall eller tegn bak (Fotball#2024), navn med årstall
     (Benjamin2010!) og gjentakelser (passord passord …) er like svake som de ser sterke ut. */
  function strength(pw) {
    const len = pw.length;
    const parts = pw.toLowerCase().split(/[\s\-_.,]+/).filter(w => w.length >= 2);
    const words = new Set(parts).size;
    const classes = [/[a-zæøå]/, /[A-ZÆØÅ]/, /\d/, /[^\wæøåÆØÅ\s]/].filter(r => r.test(pw)).length;
    const core = pw.toLowerCase().replace(/[^a-zæøå]/g, '');
    const common = !core || COMMON.includes(core) || COMMON.some(c => c.length >= 4 && core.length <= c.length + 3 && core.includes(c)) || /^(0123|1234|abcd)/i.test(pw);
    const repeated = /^(.)\1+$/.test(pw.replace(/\s/g, '')) || (parts.length >= 2 && words < parts.length) || /(.{2,})\1\1/.test(core);
    const nameYear = /^[A-ZÆØÅ][a-zæøå]{2,}\W*(19|20)\d\d\W*$/.test(pw) || /^[a-zæøå]{3,}\W*(19|20)\d\d\W*$/i.test(pw);
    let score = len >= 20 ? 4 : len >= 15 ? 3 : len >= 12 ? 2 : len >= 8 ? 1 : 0;
    if (words >= 4 && len >= 16) score = 4;
    if (classes >= 3 && score < 4 && len >= 10 && !nameYear) score++;
    if (nameYear || repeated) score = Math.min(score, 1);
    if (common) score = 0;
    return { score, len, words, classes, common, nameYear, repeated };
  }
  async function passwordDialog() {
    const LABEL = [T('Veldig svakt'), T('Svakt'), T('Middels'), T('Sterkt'), T('Veldig sterkt')];
    const body = el(`<div class="pwd">
      <p class="muted">${T('Dette er bare en øving. Ikke skriv passordet du bruker på ekte.')}</p>
      <label>${T('Nytt passord')}</label><input class="txt pw-in" type="text" autocomplete="off" spellcheck="false" autofocus>
      <div class="pw-bar"><div></div></div><div class="pw-label"></div>
      <ul class="pw-tips"><li>${T('Lengde er viktigst: minst 12 tegn, gjerne mer.')}</li><li>${T('En passordfrase av fire tilfeldige ord er sterk og lett å huske, for eksempel «sykkel ost regnjakke måne».')}</li><li>${T('Ikke bruk navnet ditt, bursdagen din eller ord som «passord».')}</li><li>${T('Bruk forskjellige passord på forskjellige steder.')}</li></ul>
    </div>`);
    const inp = body.querySelector('.pw-in');
    const upd = () => {
      const s = strength(inp.value);
      const bar = body.querySelector('.pw-bar div');
      bar.style.width = (inp.value ? 10 + s.score * 22.5 : 0) + '%';
      bar.style.background = ['#dc2626', '#f97316', '#eab308', '#22c55e', '#15803d'][s.score];
      body.querySelector('.pw-label').textContent = inp.value ? T('Styrke: {0}', LABEL[s.score]) + (s.common ? ' · ' + T('Dette passordet er blant de vanligste, og blir gjettet med en gang.') : s.nameYear ? ' · ' + T('Et navn eller ord med årstall er noe av det første som blir prøvd.') : s.repeated ? ' · ' + T('Gjentakelser gjør passordet lettere å gjette.') : '') : '';
    };
    inp.addEventListener('input', upd);
    inp.addEventListener('keydown', e => e.stopPropagation());
    const r = await Dialog.show({ title: T('Endre passord'), body, buttons: [{ label: T('Lagre'), value: 'ok', primary: true }, { label: T('Avbryt'), value: null }], selectText: false });
    if (r !== 'ok') return;
    const s = strength(inp.value);
    Bus.emit('password-test', { score: s.score, len: s.len, words: s.words, classes: s.classes, common: s.common });
    if (s.score < 2) Toast.show(T('Passordet er for svakt ({0}). Prøv et lengre passord eller en passordfrase.', LABEL[s.score]), 5000);
    else Toast.show(T('Godt passord! ({0}) På en ekte PC ville det nå vært byttet.', LABEL[s.score]), 5000);
  }
  return { open, strength };
})();

/* ---------- Oppgavebehandling (liste over åpne programmer) ---------- */
const TaskMgr = (() => {
  function open() {
    if (WM.full()) return null;
    const root = el(`<div class="taskmgr"><h3>${T('Prosesser')}</h3><div class="tk-rows"></div><p class="muted">${T('På en ekte PC åpner du Oppgavebehandling med <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Esc</kbd>, eller ved å høyreklikke på oppgavelinjen. Her kan du avslutte programmer som har hengt seg.')}</p></div>`);
    const win = WM.create({ app: 'taskmgr', title: T('Oppgavebehandling'), body: root, width: 600, height: 440 });
    function render() {
      const r = root.querySelector('.tk-rows'); r.innerHTML = '';
      WM.list().filter(w => w !== win).forEach(w => {
        const row = el(`<div class="tkr"><span class="ico">${Icons.app(w.app, 20)}</span><span class="t">${esc(w.title || WM.appName(w.app))}</span><span class="muted">${esc(WM.appName(w.app))}</span><button class="btn small">${T('Avslutt oppgave')}</button></div>`);
        row.querySelector('button').addEventListener('click', () => { Bus.emit('end-task', { app: w.app }); WM.forceClose(w, 'taskmgr'); });
        r.appendChild(row);
      });
      if (!r.children.length) r.appendChild(el('<div class="muted" style="padding:12px">' + T('Ingen andre programmer kjører.') + '</div>'));
    }
    render();
    const h = t => { if (t.startsWith('window-')) render(); };
    Bus.on(h);
    win.onClosed = () => { const i = Bus.handlers.indexOf(h); if (i >= 0) Bus.handlers.splice(i, 1); };
    return win;
  }
  return { open };
})();
