/* Veileder-panelet: kurs, oppdrag, automatisk sjekking av steg og fremdrift */
const Coach = (() => {
  /* Kurssettet og lagringsnøkkelen avhenger av siden: index.html = grunnkurset, programmering.html = KURS_PROG */
  const KL = window.KURS_ACTIVE || KURS;
  const PKEY = 'dt-progress' + (window.DT_PAGE ? '-' + window.DT_PAGE : '');
  let P = { name: '', done: {}, active: null, tab: 'kurs', openKurs: null, collapsed: false };
  try { Object.assign(P, JSON.parse(localStorage.getItem(PKEY) || '{}')); } catch (e) { /* ignorer */ }
  if (!P.name && window.DT_PAGE) { try { const b = JSON.parse(localStorage.getItem('dt-progress') || '{}'); if (b.name) P.name = b.name; } catch (e) { /* ignorer */ } }
  let stepStart = 0, checking = false, pending = false, hintOpen = false, wrongOpt = null;

  /* Hjelpeobjekt som oppdragene bruker i check(S) */
  const S = {
    ev(type, pred) {
      for (let i = Bus.log.length - 1; i >= stepStart; i--) { const e = Bus.log[i]; if (e.type === type && (!pred || pred(e.data))) return true; }
      return false;
    },
    evCount(type, pred) {
      let n = 0;
      for (let i = stepStart; i < Bus.log.length; i++) { const e = Bus.log[i]; if (e.type === type && (!pred || pred(e.data))) n++; }
      return n;
    },
    folder(path) { const n = FS.resolve(path); return n && n.type === 'folder' ? n : null; },
    file(name) { return FS.findByName(name, 'file'); },
    fileIn(name, path) { const f = FS.resolve(path); return !!f && FS.children(f.id).some(c => c.type === 'file' && c.name.toLowerCase() === name.toLowerCase()); },
    /* Filen ligger i en mappe med dette navnet (f.eks. «Engelsk»), uansett hvor mappen ligger.
       Brukes for fagmapper, så en elev som har laget sin egen fagmappe et annet sted også får godkjent. */
    fileInNamed(name, folderName) {
      const f = FS.findByName(name, 'file'); if (!f) return false;
      const p = FS.get(f.parent); if (!p) return false;
      return p.name.trim().toLowerCase().includes(folderName.toLowerCase());
    },
    folderIn(name, path) { const f = FS.resolve(path); return !!f && FS.children(f.id).some(c => c.type === 'folder' && c.name.toLowerCase() === name.toLowerCase()); },
    inBin(name) { return !!FS.findInBin(name); },
    gone(name) { return !FS.findByName(name) && !FS.findInBin(name); },
    content(name) { const f = FS.findByName(name, 'file'); return f ? Skriv.plainText(f.content || '') : ''; },
    byContent(prefix) { return FS.findAll(c => c.type === 'file' && Skriv.plainText(c.content || '').startsWith(prefix))[0] || null; },
    editorText() { return Skriv.activeText(); },
    skriv() { return Skriv.inspectActive(); },
    kodeText() { return window.Kode ? Kode.activeText() : ''; },
    kodeFile() { return window.Kode ? Kode.activeFile() : ''; },
    lastRun() { return window.Terminal ? Terminal.lastRun : null; },
    termCwd() { const t = window.Terminal && Terminal.active(); return t ? t.cwdPath : ''; },
    wins(app) { return WM.list(app).length; }
  };

  function save() { try { localStorage.setItem(PKEY, JSON.stringify(P)); } catch (e) { /* ignorer */ } }
  function kurs(id) { return KL.find(k => k.id === id); }
  function oppOf(a) { const k = a && kurs(a.kurs); return k ? k.oppdrag.find(o => o.id === a.opp) : null; }
  function kursDone(k) { return k.oppdrag.filter(o => P.done[o.id]).length; }
  function totalOpp() { return KL.reduce((n, k) => n + k.oppdrag.length, 0); }
  function totalDone() { return KL.reduce((n, k) => n + kursDone(k), 0); }
  function nextOppdrag(a) {
    const k = kurs(a.kurs); const i = k.oppdrag.findIndex(o => o.id === a.opp);
    if (i < k.oppdrag.length - 1) return { kurs: k.id, opp: k.oppdrag[i + 1].id };
    const ki = KL.indexOf(k);
    if (ki < KL.length - 1) return { kurs: KL[ki + 1].id, opp: KL[ki + 1].oppdrag[0].id };
    return null;
  }

  function startOppdrag(kid, oid) {
    const k = kurs(kid); const o = k && k.oppdrag.find(x => x.id === oid);
    if (!o) return;
    P.active = { kurs: kid, opp: oid, step: 0 };
    P.openKurs = kid;
    stepStart = Bus.log.length; hintOpen = false; wrongOpt = null;
    if (o.setup) { try { o.setup(FS); } catch (e) { console.error('setup', e); } FS.notify(); }
    P.tab = 'oppdrag';
    save(); render();
    Bus.emit('oppdrag-start', { id: oid });
    check();
  }
  function advance() {
    const a = P.active; const o = oppOf(a);
    a.step++; stepStart = Bus.log.length; hintOpen = false; wrongOpt = null;
    if (a.step >= o.steps.length) {
      P.done[a.opp] = true;
      Toast.show('🎉 Oppdrag fullført: ' + o.title);
      Bus.emit('oppdrag-done', { id: a.opp });
    }
    save();
  }
  function check() {
    if (checking) { pending = true; return; }
    checking = true;
    let changed = false;
    try {
      let guard = 0;
      while (P.active && guard++ < 30) {
        const o = oppOf(P.active); if (!o) break;
        const a = P.active;
        if (a.step >= o.steps.length) break;
        const st = o.steps[a.step];
        if (st.quiz) break;
        let ok = false;
        try { ok = !!st.check(S); } catch (e) { console.error('check', e); }
        if (!ok) break;
        advance(); changed = true;
      }
    } finally { checking = false; }
    if (changed) render();
    if (pending) { pending = false; check(); }
  }
  function answer(j) {
    const o = oppOf(P.active); const st = o.steps[P.active.step];
    if (!st || !st.quiz) return;
    if (j === st.quiz.answer) { Bus.emit('quiz', { correct: true }); advance(); render(); check(); }
    else { wrongOpt = j; Bus.emit('quiz', { correct: false }); render(); }
  }

  /* ---------- Tegning ---------- */
  function render() {
    const body = document.getElementById('coach-body');
    document.querySelectorAll('.ctab').forEach(t => t.classList.toggle('active', t.dataset.tab === P.tab));
    document.getElementById('coach-name').textContent = P.name ? P.name : 'Lær å bruke PC';
    const smn = document.getElementById('sm-name'); if (smn) smn.textContent = P.name || 'Elev';
    document.getElementById('coach').classList.toggle('collapsed', !!P.collapsed);
    body.innerHTML = '';
    if (P.tab === 'oppdrag') renderOppdrag(body);
    else if (P.tab === 'kurs') renderKurs(body);
    else renderFremdrift(body);
  }
  function btn(label, cls, action) { const b = el(`<button class="btn ${cls || ''}">${esc(label)}</button>`); b.addEventListener('click', action); return b; }

  function renderOppdrag(body) {
    const a = P.active;
    if (!a || !oppOf(a)) {
      body.appendChild(el('<p>Du har ikke startet noe oppdrag ennå.</p>'));
      body.appendChild(btn('Gå til kursene', 'primary', () => { P.tab = 'kurs'; save(); render(); }));
      return;
    }
    const k = kurs(a.kurs), o = oppOf(a);
    const ki = KL.indexOf(k) + 1, oi = k.oppdrag.indexOf(o) + 1;
    body.appendChild(el(`<div class="ktag">Kurs ${ki} · ${esc(k.title)}</div><h2>Oppdrag ${ki}.${oi}: ${esc(o.title)}</h2>`));
    const curStep = o.steps[a.step];
    const laerOpen = (curStep && curStep.laer) || (a.step === 0 && oi === 1 && !P.done[o.id]);
    if (k.laer) body.appendChild(el(`<details class="laer"${laerOpen ? ' open' : ''}><summary>📖 Les først: ${esc(k.laerTitle || k.title)}</summary>${k.laer}</details>`));
    const done = a.step >= o.steps.length;
    o.steps.forEach((st, i) => {
      const cls = i < a.step ? 'done' : i === a.step ? 'active' : 'locked';
      const d = el(`<div class="step ${cls}"><div class="num">${i < a.step ? '✓' : i + 1}</div><div class="txt"></div></div>`);
      const txt = d.querySelector('.txt');
      if (st.quiz) {
        txt.innerHTML = `<div><b>${st.laer ? 'Teori' : 'Spørsmål'}:</b> ${esc(st.quiz.q)}</div>`;
        if (i === a.step) {
          st.quiz.options.forEach((optText, j) => {
            const b = el(`<button class="quiz-opt${wrongOpt === j ? ' wrong' : ''}">${esc(optText)}</button>`);
            b.addEventListener('click', () => answer(j));
            txt.appendChild(b);
          });
          if (wrongOpt != null) txt.appendChild(el(`<div class="hintbox">Ikke helt riktig. ${esc(st.hint || (st.laer ? 'Svaret står i «Les først»-boksen øverst.' : 'Prøv igjen!'))}</div>`));
        } else if (i < a.step) {
          txt.appendChild(el(`<div class="muted">Svar: ${esc(st.quiz.options[st.quiz.answer])}</div>`));
        }
      } else {
        txt.innerHTML = st.text;
        if (i === a.step && st.hint) {
          const hb = el(`<div><button class="linkbtn">💡 ${hintOpen ? 'Skjul hint' : 'Vis hint'}</button></div>`);
          hb.querySelector('button').addEventListener('click', () => { hintOpen = !hintOpen; Bus.emit('hint', { open: hintOpen }); render(); });
          txt.appendChild(hb);
          if (hintOpen) txt.appendChild(el(`<div class="hintbox">${st.hint}</div>`));
        }
      }
      body.appendChild(d);
    });
    if (done) {
      body.appendChild(el(`<div class="done-box"><div class="big">🎉</div>Bra jobbet! Du fullførte «${esc(o.title)}».</div>`));
      const nxt = nextOppdrag(a);
      const row = el('<div class="cbtns"></div>');
      if (nxt) row.appendChild(btn('Neste oppdrag →', 'primary', () => startOppdrag(nxt.kurs, nxt.opp)));
      else row.appendChild(btn('Se fremdriften din', 'primary', () => { P.tab = 'fremdrift'; save(); render(); }));
      body.appendChild(row);
    }
    const row = el('<div class="cbtns"></div>');
    row.appendChild(btn('Start oppdraget på nytt', 'small', () => startOppdrag(a.kurs, a.opp)));
    row.appendChild(btn('Kursoversikt', 'small', () => { P.tab = 'kurs'; save(); render(); }));
    body.appendChild(row);
  }

  function renderKurs(body) {
    body.appendChild(el('<p class="muted">Velg et kurs. Det er lurt å ta dem i rekkefølge. Klikk på et oppdrag for å starte det.</p>'));
    KL.forEach((k, i) => {
      const dn = kursDone(k), tot = k.oppdrag.length;
      const open = P.openKurs === k.id;
      const card = el(`<div class="kurs-card${open ? ' open' : ''}"><div class="kt"><span>${i + 1}. ${esc(k.title)}</span><small>${dn}/${tot} ${dn === tot ? '✓' : ''}</small></div><div class="muted">${esc(k.desc || '')}</div><div class="bar"><div style="width:${tot ? (100 * dn / tot) : 0}%"></div></div></div>`);
      card.addEventListener('click', () => { P.openKurs = open ? null : k.id; save(); render(); });
      if (open) {
        const list = el('<div class="opp-list"></div>');
        k.oppdrag.forEach((o, j) => {
          const isActive = P.active && P.active.opp === o.id;
          const r = el(`<div class="opp-row"><span class="${P.done[o.id] ? 'ok' : isActive ? 'play' : 'todo'}">${P.done[o.id] ? '✓' : isActive ? '▶' : '○'}</span><span>${i + 1}.${j + 1} ${esc(o.title)}</span></div>`);
          r.addEventListener('click', e => { e.stopPropagation(); startOppdrag(k.id, o.id); });
          list.appendChild(r);
        });
        card.appendChild(list);
      }
      body.appendChild(card);
    });
    body.appendChild(el(window.DT_PAGE === 'prog'
      ? '<p class="muted" style="margin-top:16px">Dette er kurssettet for programmering. <a href="index.html">← Til grunnkurset</a> (filer, mapper, lagring, innlevering).</p>'
      : '<p class="muted" style="margin-top:16px">For programmeringselever finnes et eget kurssett med terminal (PowerShell), Kode-editor og Python: <a href="programmering.html">Programmeringskurset →</a></p>'));
  }

  function renderFremdrift(body) {
    const nm = el(`<div class="frem-name"><label>Navn:</label><input class="txt" value="${esc(P.name)}" placeholder="Skriv navnet ditt"></div>`);
    nm.querySelector('input').addEventListener('change', e => { P.name = e.target.value.trim(); save(); render(); });
    body.appendChild(nm);
    const tot = totalOpp(), dn = totalDone();
    body.appendChild(el(`<h3>${dn} av ${tot} oppdrag fullført</h3><div class="bar"><div style="width:${100 * dn / tot}%"></div></div>`));
    KL.forEach((k, i) => body.appendChild(el(`<div class="frem-row"><span>${i + 1}. ${esc(k.title)}</span><span>${kursDone(k)}/${k.oppdrag.length} ${kursDone(k) === k.oppdrag.length ? '✓' : ''}</span></div>`)));
    if (dn === tot) body.appendChild(el(`<div class="diplom"><h2>🏆 Diplom</h2><div><b>${esc(P.name || 'Elev')}</b> har fullført alle kursene i Datatrening og kan bruke PC-en til skolearbeid!</div><div class="muted">${fmtDate(Date.now())}</div></div>`));
    const row = el('<div class="cbtns"></div>');
    row.appendChild(btn('Kopier rapport', 'small', async () => {
      const text = `Datatrening – fremdrift for ${P.name || 'Elev'} (${fmtDate(Date.now())})\n${dn} av ${tot} oppdrag fullført\n` + KL.map((k, i) => `${i + 1}. ${k.title}: ${kursDone(k)}/${k.oppdrag.length}` + k.oppdrag.map(o => `\n   ${P.done[o.id] ? '[x]' : '[ ]'} ${o.title}`).join('')).join('\n');
      try { await navigator.clipboard.writeText(text); Toast.show('Rapporten er kopiert. Lim den inn i en melding til læreren.'); }
      catch (e) { Dialog.show({ title: 'Rapport', body: `<textarea style="width:420px;height:260px;font:12px monospace">${esc(text)}</textarea>`, buttons: [{ label: 'Lukk', value: true, primary: true }] }); }
    }));
    row.appendChild(btn('Nullstill fremdrift', 'small', async () => { if (await Dialog.confirm('Nullstill fremdrift', 'Er du sikker? Alle fullførte oppdrag blir slettet.')) resetProgress(); }));
    body.appendChild(row);
    body.appendChild(el(`<h3>Hvis øvings-PC-en henger</h3><p class="muted">Knappen under sletter alle filer og mapper på øvings-PC-en og legger tilbake de opprinnelige. Fremdriften beholdes. Det samme skjer om du åpner siden med <code>?nullstill</code> bak adressen.</p>`));
    const row2 = el('<div class="cbtns"></div>');
    row2.appendChild(btn('Tilbakestill øvings-PC-en', 'small', () => {
      if (!window.confirm('Slette alle filer og mapper på øvings-PC-en og starte den på nytt?')) return;
      try { ['dt-fs', 'dt-innlev', 'dt-pinned', 'dt-bg'].forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignorer */ }
      location.href = location.pathname;
    }));
    body.appendChild(row2);
  }

  function resetProgress() {
    P = { name: P.name, done: {}, active: null, tab: 'kurs', openKurs: KL[0].id, collapsed: false };
    save(); render();
    Toast.show('Fremdriften er nullstilt.');
  }

  function init() {
    document.querySelectorAll('.ctab').forEach(t => t.addEventListener('click', () => { P.tab = t.dataset.tab; save(); render(); }));
    document.getElementById('coach-toggle').addEventListener('click', () => { P.collapsed = !P.collapsed; save(); render(); });
    Bus.on((type, d) => {
      /* Under høyreklikk-oppdraget: fortell hva eleven høyreklikket på, så de ser at menyen avhenger av elementet */
      if (type === 'ctxmenu' && d && d.label && P.active && P.active.opp === 'k1o4') Toast.show('Høyreklikk på ' + d.label + ' ✓', 2200);
      if (type !== 'oppdrag-start' && type !== 'quiz' && type !== 'hint') check();
    });
    render();
    if (!P.name) {
      Dialog.show({
        title: 'Velkommen til Datatrening!',
        body: `<div class="welcome">${window.DT_WELCOME || '<p>Her lærer du å bruke en PC slik vi gjør på skolen: filer og mapper, lagring, nedlastinger og innlevering. Alt skjer på en <b>øvings-PC</b> i nettleseren, så du kan ikke ødelegge noe.</p>'}<p>Panelet til høyre viser oppdragene dine. Stegene blir grønne av seg selv når du gjør dem riktig.</p><label>Hva heter du?</label><input class="txt" id="welcome-name" autofocus placeholder="Fornavn og etternavn"></div>`,
        buttons: [{ label: 'Start', value: 'ok', primary: true }],
        validate: () => { const v = document.getElementById('welcome-name').value.trim(); return v || 'Elev'; },
        escapeValue: 'Elev'
      }).then(v => {
        P.name = v || 'Elev'; save();
        if (!P.active) startOppdrag(KL[0].id, KL[0].oppdrag[0].id); else render();
      });
    }
  }

  return { init, render, check, startOppdrag, resetProgress, progress: () => P, S };
})();
