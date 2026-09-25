/* Veileder-panelet: kurs, oppdrag, mesterprøver, repetisjon, fremdrift og automatisk sjekking */
const Coach = (() => {
  /* Kurssettet og lagringsnøkkelen avhenger av siden: index.html = grunnkurset, programmering.html = KURS_PROG */
  const KL = window.KURS_ACTIVE || KURS;
  const REP = window.REP_ACTIVE || (typeof REPETISJON !== 'undefined' ? REPETISJON : []);
  const PKEY = 'dt-progress' + (window.DT_PAGE ? '-' + window.DT_PAGE : '');
  let P = { name: '', done: {}, active: null, tab: 'kurs', openKurs: null, collapsed: false, master: {}, ekte: {}, stats: {}, rep: null };
  try { Object.assign(P, JSON.parse(localStorage.getItem(PKEY) || '{}')); } catch (e) { /* ignorer */ }
  ['done', 'master', 'ekte', 'stats'].forEach(k => { if (!P[k] || typeof P[k] !== 'object') P[k] = {}; });
  if (!P.name && window.DT_PAGE) { try { const b = JSON.parse(localStorage.getItem('dt-progress') || '{}'); if (b.name) P.name = b.name; } catch (e) { /* ignorer */ } }
  let stepStart = 0, stepTime = 0, checking = false, pending = false, hintOpen = false, wrongOpt = null;
  /* Svaralternativene vises i tilfeldig rekkefølge (quizOrder). Feil svar på et teorispørsmål låser
     spørsmålet (P.lock) til eleven har åpnet «Les først», kommet til bunnen og ventet ut lesetiden. */
  let quizOrder = null, quizKey = '', unlockTimer = null;
  function shuffled(n) { const a = [...Array(n).keys()]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function readSeconds(html) { const words = (html || '').replace(/<[^>]+>/g, ' ').trim().split(/\s+/).length; return Math.max(10, Math.min(30, Math.round(words / 4))); }
  function isLocked() { const a = P.active; return !!(P.lock && a && a.mode !== 'master' && P.lock.opp === a.opp && P.lock.step === a.step); }
  const now = () => Date.now();

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
    /* Som fileInNamed, men for en fil eleven selv har navngitt: finn på innhold eller filtype */
    anyFileInNamed(folderName, pred) {
      return FS.findAll(c => c.type === 'file' && (!pred || pred(c, Skriv.plainText(c.content || '')))).some(c => {
        const p = FS.get(c.parent); return p && p.name.trim().toLowerCase().includes(folderName.toLowerCase());
      });
    },
    folderIn(name, path) { const f = FS.resolve(path); return !!f && FS.children(f.id).some(c => c.type === 'folder' && c.name.toLowerCase() === name.toLowerCase()); },
    folderNamed(name) { return FS.findAll(c => c.type === 'folder' && c.name.trim().toLowerCase() === name.toLowerCase())[0] || null; },
    inBin(name) { return !!FS.findInBin(name); },
    gone(name) { return !FS.findByName(name) && !FS.findInBin(name); },
    content(name) { const f = FS.findByName(name, 'file'); return f ? Skriv.plainText(f.content || '') : ''; },
    byContent(prefix) { return FS.findAll(c => c.type === 'file' && Skriv.plainText(c.content || '').startsWith(prefix))[0] || null; },
    editorText() { return Skriv.activeText(); },
    skriv() { return Skriv.inspectActive(); },
    notes() { return window.Notater ? Notater.state() : { sections: [], pages: [] }; },
    mail() { return window.Epost ? Epost.state() : { sent: [], read: [], saved: [] }; },
    typing() { return window.Skrivetrening ? Skrivetrening.best() : null; },
    installed(id) { return window.Firmaportal ? Firmaportal.isInstalled(id) : true; },
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
  function kursComplete(k) { return kursDone(k) === k.oppdrag.length; }
  function totalOpp() { return KL.reduce((n, k) => n + k.oppdrag.length, 0); }
  function totalDone() { return KL.reduce((n, k) => n + kursDone(k), 0); }
  function masterPassed(k) { return !!(P.master[k.id] && P.master[k.id].passed); }
  function nextOppdrag(a) {
    const k = kurs(a.kurs); const i = k.oppdrag.findIndex(o => o.id === a.opp);
    if (i < k.oppdrag.length - 1) return { kurs: k.id, opp: k.oppdrag[i + 1].id };
    return null;
  }
  function nextKurs(a) { const ki = KL.indexOf(kurs(a.kurs)); return ki >= 0 && ki < KL.length - 1 ? KL[ki + 1] : null; }

  /* ---------- Måling: tid per steg, hint og feilsvar ---------- */
  function stat(id) { return (P.stats[id] = P.stats[id] || { t: [], h: 0, w: 0, n: 0 }); }
  function recordStep(id, i) {
    const s = stat(id);
    const sec = Math.min(3600, Math.round((now() - stepTime) / 1000));
    s.t[i] = (s.t[i] || 0) + sec;
    stepTime = now();
  }

  /* ---------- Start ---------- */
  function resetRun(o) {
    /* Rydd bort programmer fra forrige oppdrag, så eleven starter med blanke ark.
       Skjer før stepStart settes, slik at lukkingen ikke teller som et utført steg. */
    if (o && o.lukk) {
      const closed = WM.closeApps(o.lukk === 'alle' ? null : o.lukk, 'oppdrag');
      if (closed.length) Toast.show('Lukket fra forrige oppdrag: ' + closed.map(a => WM.appName(a)).join(', ') + '. Du starter med blanke ark.', 4500);
    }
    stepStart = Bus.log.length; stepTime = now();
    hintOpen = false; wrongOpt = null; quizOrder = null; P.lock = null;
    if (o && o.setup) { try { o.setup(FS); } catch (e) { console.error('setup', e); } FS.notify(); }
  }
  function startOppdrag(kid, oid) {
    const k = kurs(kid); const o = k && k.oppdrag.find(x => x.id === oid);
    if (!o) return;
    P.active = { mode: 'oppdrag', kurs: kid, opp: oid, step: 0 };
    P.openKurs = kid;
    stat(oid).n++;
    resetRun(o);
    P.tab = 'oppdrag';
    save(); render();
    Bus.emit('oppdrag-start', { id: oid });
    check();
  }
  function startMaster(kid) {
    const k = kurs(kid); if (!k || !k.mesterprove) return;
    P.active = { mode: 'master', kurs: kid, at: now(), state: k.mesterprove.goals.map(() => false) };
    P.openKurs = kid;
    resetRun(k.mesterprove);
    P.tab = 'oppdrag';
    save(); render();
    Bus.emit('master-start', { kurs: kid });
    check();
  }
  function startRep(n = 5) {
    const pool = REP.filter(r => { const k = kurs(r.kurs); return k && kursComplete(k); });
    if (!pool.length) { Toast.show('Fullfør et kurs først, så kan du repetere det du har lært.'); return; }
    const pick = shuffled(pool.length).slice(0, Math.min(n, pool.length)).map(i => pool[i]);
    P.active = { mode: 'rep', tasks: pick.map(r => r.id), i: 0, ok: 0, at: now() };
    resetRun(pick[0]);
    P.tab = 'oppdrag';
    save(); render();
    Bus.emit('rep-start', { count: pick.length });
    check();
  }
  function repTask() { const a = P.active; return a && a.mode === 'rep' ? REP.find(r => r.id === a.tasks[a.i]) : null; }

  function advance() {
    const a = P.active; const o = oppOf(a);
    recordStep(a.opp, a.step);
    a.step++; stepStart = Bus.log.length; hintOpen = false; wrongOpt = null; quizOrder = null; P.lock = null;
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
      const a = P.active;
      if (a && a.mode === 'master') changed = checkMaster();
      else if (a && a.mode === 'rep') changed = checkRep();
      else if (a) changed = checkOppdrag();
    } finally { checking = false; }
    if (changed) render();
    if (pending) { pending = false; check(); }
  }
  function checkOppdrag() {
    let changed = false, guard = 0;
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
    return changed;
  }
  function checkMaster() {
    const a = P.active; const k = kurs(a.kurs); const m = k.mesterprove;
    let changed = false;
    m.goals.forEach((g, i) => {
      if (a.state[i]) return;
      let ok = false;
      try { ok = !!g.check(S); } catch (e) { console.error('master', e); }
      if (ok) { a.state[i] = true; changed = true; Bus.emit('master-goal', { kurs: k.id, goal: i }); }
    });
    if (changed && a.state.every(Boolean) && !a.doneAt) {
      a.doneAt = now();
      const ms = a.doneAt - a.at;
      const prev = P.master[k.id];
      P.master[k.id] = { passed: true, ms: prev && prev.ms ? Math.min(prev.ms, ms) : ms, date: a.doneAt, tries: (prev ? prev.tries || 0 : 0) + 1 };
      Toast.show('🏅 Mesterprøve bestått: ' + k.title);
      Bus.emit('master-done', { kurs: k.id, ms });
    }
    if (changed) save();
    return changed;
  }
  function checkRep() {
    const a = P.active; const t = repTask(); if (!t) return false;
    let ok = false;
    try { ok = !!t.check(S); } catch (e) { console.error('rep', e); }
    if (!ok) return false;
    a.ok++;
    a.i++;
    if (a.i < a.tasks.length) { resetRun(REP.find(r => r.id === a.tasks[a.i])); }
    else {
      P.rep = { last: now(), ok: a.ok, total: a.tasks.length };
      Toast.show('Ukens øving fullført!');
      Bus.emit('rep-done', { ok: a.ok, total: a.tasks.length });
    }
    save();
    return true;
  }
  function skipRep() {
    const a = P.active; if (!a || a.mode !== 'rep') return;
    a.i++;
    if (a.i < a.tasks.length) resetRun(REP.find(r => r.id === a.tasks[a.i]));
    else { P.rep = { last: now(), ok: a.ok, total: a.tasks.length }; Bus.emit('rep-done', { ok: a.ok, total: a.tasks.length }); }
    save(); render(); check();
  }

  function answer(j) {
    const a = P.active; const o = oppOf(a); const st = o && o.steps[a.step];
    if (!st || !st.quiz || isLocked()) return;
    if (j === st.quiz.answer) { Bus.emit('quiz', { correct: true, laer: !!st.laer }); advance(); render(); check(); return; }
    wrongOpt = j;
    stat(a.opp).w++;
    Bus.emit('quiz', { correct: false, laer: !!st.laer });
    if (st.laer) {
      const k = kurs(a.kurs);
      P.lock = { opp: a.opp, step: a.step, until: now() + readSeconds(k.laer) * 1000 };
      save();
      Bus.emit('quiz-lock', { opp: a.opp });
      render();
    } else { save(); render(); }
  }
  /* Eleven velger selv når den vil gå til teksten: åpner «Les først» og ruller dit */
  function goToLaer() {
    const body = document.getElementById('coach-body'); const det = body.querySelector('details.laer');
    if (!det) return;
    det.open = true;
    body.scrollTop = Math.max(0, det.offsetTop - 12);
    Bus.emit('laer-goto', {});
  }
  function unlock() {
    if (!P.lock || now() < P.lock.until) return;
    P.lock = null; wrongOpt = null; quizOrder = null; save();
    Bus.emit('quiz-unlock', {});
    render();
    const body = document.getElementById('coach-body'); const act = body.querySelector('.step.active');
    if (act) body.scrollTop = Math.max(0, act.offsetTop - 12);
  }

  /* ---------- Tegning ---------- */
  function render() {
    const body = document.getElementById('coach-body');
    document.querySelectorAll('.ctab').forEach(t => t.classList.toggle('active', t.dataset.tab === P.tab));
    document.getElementById('coach-name').textContent = P.name ? P.name : 'Lær å bruke PC';
    const smn = document.getElementById('sm-name'); if (smn) smn.textContent = P.name || 'Elev';
    document.getElementById('coach').classList.toggle('collapsed', !!P.collapsed);
    if (unlockTimer) { clearInterval(unlockTimer); unlockTimer = null; }
    body.innerHTML = '';
    if (P.tab === 'oppdrag') renderAktiv(body);
    else if (P.tab === 'kurs') renderKurs(body);
    else renderFremdrift(body);
  }
  function btn(label, cls, action) { const b = el(`<button class="btn ${cls || ''}">${esc(label)}</button>`); b.addEventListener('click', action); return b; }
  function fmtMs(ms) { const s = Math.round(ms / 1000); return s < 60 ? s + ' sekunder' : Math.floor(s / 60) + ' min ' + (s % 60) + ' s'; }

  function renderAktiv(body) {
    const a = P.active;
    if (!a) {
      body.appendChild(el('<p>Du har ikke startet noe oppdrag ennå.</p>'));
      body.appendChild(btn('Gå til kursene', 'primary', () => { P.tab = 'kurs'; save(); render(); }));
      return;
    }
    if (a.mode === 'master') return renderMaster(body);
    if (a.mode === 'rep') return renderRep(body);
    return renderOppdrag(body);
  }

  function renderOppdrag(body) {
    const a = P.active;
    if (!oppOf(a)) { body.appendChild(el('<p>Fant ikke oppdraget.</p>')); body.appendChild(btn('Gå til kursene', 'primary', () => { P.tab = 'kurs'; save(); render(); })); return; }
    const k = kurs(a.kurs), o = oppOf(a);
    const ki = KL.indexOf(k) + 1, oi = k.oppdrag.indexOf(o) + 1;
    body.appendChild(el(`<div class="ktag">Kurs ${ki} · ${esc(k.title)}</div><h2>Oppdrag ${ki}.${oi}: ${esc(o.title)}</h2>`));
    if (o.intro) body.appendChild(el(`<p class="opp-intro">${o.intro}</p>`));
    const curStep = o.steps[a.step];
    const locked = isLocked();
    const laerOpen = (curStep && curStep.laer) || locked || (a.step === 0 && oi === 1 && !P.done[o.id]);
    if (k.laer) body.appendChild(laerBox(k, laerOpen, locked));
    const done = a.step >= o.steps.length;
    o.steps.forEach((st, i) => {
      const cls = i < a.step ? 'done' : i === a.step ? 'active' : 'locked';
      const d = el(`<div class="step ${cls}"><div class="num">${i < a.step ? '✓' : i + 1}</div><div class="txt"></div></div>`);
      const txt = d.querySelector('.txt');
      if (st.quiz) {
        txt.innerHTML = `<div><b>${st.laer ? 'Teori' : 'Spørsmål'}:</b> ${esc(st.quiz.q)}</div>`;
        if (i === a.step) {
          const key = a.opp + ':' + i;
          if (!quizOrder || quizKey !== key || quizOrder.length !== st.quiz.options.length) { quizOrder = shuffled(st.quiz.options.length); quizKey = key; }
          quizOrder.forEach(j => {
            const b = el(`<button class="quiz-opt${wrongOpt === j ? ' wrong' : ''}" data-idx="${j}"${locked ? ' disabled' : ''}>${esc(st.quiz.options[j])}</button>`);
            b.addEventListener('click', () => answer(j));
            txt.appendChild(b);
          });
          if (locked) {
            const hb = el('<div class="hintbox">Ikke riktig. Spørsmålet er låst til du har lest teksten. Trykk på knappen nederst i teksten for å komme tilbake og svare på nytt.<div><button class="btn primary small goto-laer">📖 Gå til «Les først»-teksten</button></div></div>');
            hb.querySelector('.goto-laer').addEventListener('click', goToLaer);
            txt.appendChild(hb);
          }
          else if (wrongOpt != null) txt.appendChild(el(`<div class="hintbox">Ikke helt riktig. ${esc(st.hint || 'Prøv igjen!')}</div>`));
        } else if (i < a.step) {
          txt.appendChild(el(`<div class="muted">Svar: ${esc(st.quiz.options[st.quiz.answer])}</div>`));
        }
      } else {
        txt.innerHTML = st.text;
        if (i === a.step && st.hint) {
          const hb = el(`<div><button class="linkbtn">💡 ${hintOpen ? 'Skjul hint' : 'Vis hint'}</button></div>`);
          hb.querySelector('button').addEventListener('click', () => { hintOpen = !hintOpen; if (!hintOpen) { } else { stat(a.opp).h++; save(); } Bus.emit('hint', { open: hintOpen }); render(); });
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
      else if (k.mesterprove && !masterPassed(k)) row.appendChild(btn('🏅 Ta mesterprøven', 'primary', () => startMaster(k.id)));
      else { const nk = nextKurs(a); if (nk) row.appendChild(btn('Neste kurs →', 'primary', () => startOppdrag(nk.id, nk.oppdrag[0].id))); else row.appendChild(btn('Se fremdriften din', 'primary', () => { P.tab = 'fremdrift'; save(); render(); })); }
      body.appendChild(row);
    }
    const row = el('<div class="cbtns"></div>');
    row.appendChild(btn('Start oppdraget på nytt', 'small', () => startOppdrag(a.kurs, a.opp)));
    row.appendChild(btn('Kursoversikt', 'small', () => { P.tab = 'kurs'; save(); render(); }));
    body.appendChild(row);
  }

  function laerBox(k, open, locked) {
    const det = el(`<details class="laer"${open ? ' open' : ''}><summary>📖 Les først: ${esc(k.laerTitle || k.title)}</summary>${k.laer}</details>`);
    if (locked) {
      const b = el('<button class="btn primary laer-unlock" disabled>Jeg har lest teksten</button>');
      const upd = () => {
        const left = Math.ceil((P.lock.until - now()) / 1000);
        if (left > 0) { b.disabled = true; b.textContent = `Les teksten over … (${left} s)`; }
        else { b.disabled = false; b.textContent = 'Jeg har lest teksten, tilbake til spørsmålet'; if (unlockTimer) { clearInterval(unlockTimer); unlockTimer = null; } }
      };
      upd(); unlockTimer = setInterval(upd, 500);
      b.addEventListener('click', unlock);
      det.appendChild(el('<div class="laer-lockbox">Spørsmålet er låst til du har lest teksten. Knappen under blir aktiv når lesetiden er over.</div>'));
      det.appendChild(b);
    }
    return det;
  }

  /* ---------- Mesterprøve: mål uten stegvis oppskrift ---------- */
  function renderMaster(body) {
    const a = P.active; const k = kurs(a.kurs); const m = k.mesterprove;
    const passed = a.state.every(Boolean);
    body.appendChild(el(`<div class="ktag">Kurs ${KL.indexOf(k) + 1} · ${esc(k.title)}</div><h2>🏅 Mesterprøve: ${esc(m.title)}</h2>`));
    body.appendChild(el(`<div class="master-box"><p>${m.intro}</p><p class="muted">Her får du ingen oppskrift og ingen hint. Du får det til, du har øvd på alt dette. Målene hukes av etter hvert som du klarer dem, i den rekkefølgen du vil.</p></div>`));
    const list = el('<div class="goals"></div>');
    m.goals.forEach((g, i) => list.appendChild(el(`<div class="goal${a.state[i] ? ' done' : ''}"><span class="gm">${a.state[i] ? '✓' : '○'}</span><span class="gt">${g.text}</span></div>`)));
    body.appendChild(list);
    if (passed) {
      const ms = (a.doneAt || now()) - a.at;
      body.appendChild(el(`<div class="done-box"><div class="big">🏅</div>Mesterprøven er bestått!<div class="muted">Tid: ${esc(fmtMs(ms))}</div></div>`));
      if (k.ekte && k.ekte.length) body.appendChild(ekteBox(k));
      const row = el('<div class="cbtns"></div>');
      const nk = nextKurs(a);
      if (nk) row.appendChild(btn('Neste kurs →', 'primary', () => startOppdrag(nk.id, nk.oppdrag[0].id)));
      row.appendChild(btn('Kursoversikt', 'small', () => { P.tab = 'kurs'; save(); render(); }));
      body.appendChild(row);
      return;
    }
    const row = el('<div class="cbtns"></div>');
    row.appendChild(btn('Start prøven på nytt', 'small', () => startMaster(k.id)));
    row.appendChild(btn('Jeg trenger å øve mer', 'small', () => { P.tab = 'kurs'; save(); render(); }));
    body.appendChild(row);
  }

  /* ---------- Gjør det på ekte ---------- */
  function ekteBox(k) {
    const box = el(`<div class="ekte"><h3>💻 Gjør det på din egen PC</h3><p class="muted">Øvings-PC-en er en simulering. Gjør det samme på den ekte maskinen din, så sitter det. Huk av når du har gjort det.</p></div>`);
    const state = (P.ekte[k.id] = P.ekte[k.id] || k.ekte.map(() => false));
    k.ekte.forEach((t, i) => {
      const id = 'ekte-' + k.id + '-' + i;
      const r = el(`<label class="ekte-row" for="${id}"><input type="checkbox" id="${id}"${state[i] ? ' checked' : ''}><span>${t}</span></label>`);
      r.querySelector('input').addEventListener('change', e => { state[i] = e.target.checked; save(); Bus.emit('ekte', { kurs: k.id, i, on: state[i] }); });
      box.appendChild(r);
    });
    return box;
  }

  /* ---------- Ukens øving ---------- */
  function renderRep(body) {
    const a = P.active; const t = repTask();
    body.appendChild(el(`<div class="ktag">Ukens øving</div><h2>Oppgave ${Math.min(a.i + 1, a.tasks.length)} av ${a.tasks.length}</h2>`));
    if (!t) {
      body.appendChild(el(`<div class="done-box"><div class="big">${a.ok === a.tasks.length ? '🎉' : '👍'}</div>Du klarte ${a.ok} av ${a.tasks.length}.</div>`));
      const row = el('<div class="cbtns"></div>');
      row.appendChild(btn('Ny øving', 'primary', () => startRep()));
      row.appendChild(btn('Kursoversikt', 'small', () => { P.tab = 'kurs'; save(); render(); }));
      body.appendChild(row);
      return;
    }
    const k = kurs(t.kurs);
    body.appendChild(el(`<div class="rep-task"><div class="muted">Fra kurset «${esc(k ? k.title : '')}»</div><div class="rt">${t.text}</div></div>`));
    body.appendChild(el('<p class="muted">Ingen hint denne gangen. Klarer du det uten hjelp?</p>'));
    const row = el('<div class="cbtns"></div>');
    row.appendChild(btn('Hopp over', 'small', skipRep));
    row.appendChild(btn('Avslutt øvingen', 'small', () => { P.active = null; P.tab = 'kurs'; save(); render(); }));
    body.appendChild(row);
  }

  function renderKurs(body) {
    const repReady = REP.some(r => { const k = kurs(r.kurs); return k && kursComplete(k); });
    if (repReady) {
      const days = P.rep && P.rep.last ? Math.floor((now() - P.rep.last) / 86400000) : null;
      const due = days === null || days >= 7;
      const card = el(`<div class="rep-card${due ? ' due' : ''}"><div class="kt"><span>🔁 Ukens øving</span><small>${days === null ? 'aldri tatt' : days === 0 ? 'tatt i dag' : days + ' dager siden'}</small></div><div class="muted">Fem tilfeldige oppgaver fra kursene du har fullført, uten hint. Hold ferdighetene ved like.</div></div>`);
      card.appendChild(btn(due ? 'Start ukens øving' : 'Ta en øving til', due ? 'primary small' : 'small', () => startRep()));
      body.appendChild(card);
    }
    body.appendChild(el('<p class="muted">Velg et kurs. Det er lurt å ta dem i rekkefølge. Klikk på et oppdrag for å starte det.</p>'));
    KL.forEach((k, i) => {
      const dn = kursDone(k), tot = k.oppdrag.length, complete = dn === tot, mp = masterPassed(k);
      const open = P.openKurs === k.id;
      const card = el(`<div class="kurs-card${open ? ' open' : ''}"><div class="kt"><span>${i + 1}. ${esc(k.title)}</span><small>${dn}/${tot} ${mp ? '🏅' : complete ? '✓' : ''}</small></div><div class="muted">${esc(k.desc || '')}</div><div class="bar"><div style="width:${tot ? (100 * dn / tot) : 0}%"></div></div></div>`);
      card.addEventListener('click', () => { P.openKurs = open ? null : k.id; save(); render(); });
      if (open) {
        const list = el('<div class="opp-list"></div>');
        k.oppdrag.forEach((o, j) => {
          const isActive = P.active && P.active.opp === o.id;
          const r = el(`<div class="opp-row"><span class="${P.done[o.id] ? 'ok' : isActive ? 'play' : 'todo'}">${P.done[o.id] ? '✓' : isActive ? '▶' : '○'}</span><span>${i + 1}.${j + 1} ${esc(o.title)}</span></div>`);
          r.addEventListener('click', e => { e.stopPropagation(); startOppdrag(k.id, o.id); });
          list.appendChild(r);
        });
        if (k.mesterprove) {
          const r = el(`<div class="opp-row master${complete ? '' : ' locked'}"><span class="${mp ? 'ok' : complete ? 'play' : 'todo'}">${mp ? '🏅' : complete ? '▶' : '🔒'}</span><span>Mesterprøve: ${esc(k.mesterprove.title)}${mp ? '' : complete ? '' : ' (fullfør oppdragene først)'}</span></div>`);
          if (complete) r.addEventListener('click', e => { e.stopPropagation(); startMaster(k.id); });
          list.appendChild(r);
        }
        card.appendChild(list);
        if (complete && k.ekte && k.ekte.length) { const b = ekteBox(k); b.addEventListener('click', e => e.stopPropagation()); card.appendChild(b); }
      }
      body.appendChild(card);
    });
    body.appendChild(el(window.DT_PAGE === 'prog'
      ? '<p class="muted" style="margin-top:16px">Dette er kurssettet for programmering. <a href="index.html">← Til grunnkurset</a> (filer, mapper, lagring, innlevering).</p>'
      : '<p class="muted" style="margin-top:16px">For programmeringselever finnes et eget kurssett med terminal (PowerShell), Kode-editor og Python: <a href="programmering.html">Programmeringskurset →</a></p>'));
  }

  /* ---------- Rapport til læreren ---------- */
  function reportCode() {
    const d = {
      v: 1, n: P.name || 'Elev', p: window.DT_PAGE || 'base', ts: now(),
      d: Object.keys(P.done).filter(k => P.done[k]),
      m: Object.keys(P.master).filter(k => P.master[k] && P.master[k].passed).map(k => [k, Math.round((P.master[k].ms || 0) / 1000), P.master[k].tries || 1]),
      e: Object.keys(P.ekte).map(k => [k, (P.ekte[k] || []).filter(Boolean).length, (P.ekte[k] || []).length]),
      s: Object.keys(P.stats).map(k => [k, P.stats[k].t || [], P.stats[k].h || 0, P.stats[k].w || 0, P.stats[k].n || 0]),
      r: P.rep || null
    };
    const json = JSON.stringify(d);
    return 'DT1:' + btoa(unescape(encodeURIComponent(json)));
  }
  function reportText() {
    const tot = totalOpp(), dn = totalDone();
    let t = `Datatrening – fremdrift for ${P.name || 'Elev'} (${fmtDate(now())})\n${dn} av ${tot} oppdrag fullført\n`;
    t += KL.map((k, i) => `${i + 1}. ${k.title}: ${kursDone(k)}/${k.oppdrag.length}${masterPassed(k) ? ' · mesterprøve bestått' : ''}`).join('\n');
    t += '\n\nKode til læreren (lim inn hele linjen):\n' + reportCode();
    return t;
  }

  function renderFremdrift(body) {
    const nm = el(`<div class="frem-name"><label>Navn:</label><input class="txt" value="${esc(P.name)}" placeholder="Skriv navnet ditt"></div>`);
    nm.querySelector('input').addEventListener('change', e => { P.name = e.target.value.trim(); save(); render(); });
    body.appendChild(nm);
    const tot = totalOpp(), dn = totalDone();
    const mp = KL.filter(masterPassed).length, mtot = KL.filter(k => k.mesterprove).length;
    body.appendChild(el(`<h3>${dn} av ${tot} oppdrag fullført</h3><div class="bar"><div style="width:${100 * dn / tot}%"></div></div>`));
    if (mtot) body.appendChild(el(`<h3>${mp} av ${mtot} mesterprøver bestått</h3><div class="bar"><div style="width:${100 * mp / mtot}%"></div></div>`));
    KL.forEach((k, i) => body.appendChild(el(`<div class="frem-row"><span>${i + 1}. ${esc(k.title)}</span><span>${kursDone(k)}/${k.oppdrag.length} ${masterPassed(k) ? '🏅' : kursComplete(k) ? '✓' : ''}</span></div>`)));
    if (P.rep && P.rep.last) body.appendChild(el(`<div class="frem-row"><span>🔁 Siste ukesøving</span><span>${P.rep.ok}/${P.rep.total} · ${esc(fmtDate(P.rep.last))}</span></div>`));
    if (dn === tot && mp === mtot) body.appendChild(el(`<div class="diplom"><h2>🏆 Diplom</h2><div><b>${esc(P.name || 'Elev')}</b> har fullført alle kursene og mesterprøvene i Datatrening og kan bruke PC-en til skolearbeid!</div><div class="muted">${fmtDate(now())}</div></div>`));
    const row = el('<div class="cbtns"></div>');
    row.appendChild(btn('Kopier rapport til læreren', 'primary small', async () => {
      const text = reportText();
      try { await navigator.clipboard.writeText(text); Toast.show('Rapporten er kopiert. Lim den inn i en melding til læreren.'); }
      catch (e) { Dialog.show({ title: 'Rapport', body: `<p class="muted">Merk alt (Ctrl+A), kopier (Ctrl+C) og lim inn i en melding til læreren.</p><textarea style="width:440px;height:240px;font:12px monospace">${esc(text)}</textarea>`, buttons: [{ label: 'Lukk', value: true, primary: true }] }); }
    }));
    row.appendChild(btn('Nullstill fremdrift', 'small', async () => { if (await Dialog.confirm('Nullstill fremdrift', 'Er du sikker? Alle fullførte oppdrag blir slettet.')) resetProgress(); }));
    body.appendChild(row);
    body.appendChild(el(`<h3>Hvis øvings-PC-en henger</h3><p class="muted">Knappen under sletter alle filer og mapper på øvings-PC-en og legger tilbake de opprinnelige. Fremdriften beholdes. Det samme skjer om du åpner siden med <code>?nullstill</code> bak adressen.</p>`));
    const row2 = el('<div class="cbtns"></div>');
    row2.appendChild(btn('Tilbakestill øvings-PC-en', 'small', () => {
      if (!window.confirm('Slette alle filer og mapper på øvings-PC-en og starte den på nytt?')) return;
      try { ['dt-fs', 'dt-innlev', 'dt-pinned', 'dt-bg', 'dt-notes', 'dt-mail', 'dt-typing'].forEach(k => localStorage.removeItem(k)); } catch (e) { /* ignorer */ }
      location.href = location.pathname;
    }));
    body.appendChild(row2);
  }

  function resetProgress() {
    P = { name: P.name, done: {}, active: null, tab: 'kurs', openKurs: KL[0].id, collapsed: false, master: {}, ekte: {}, stats: {}, rep: null };
    save(); render();
    Toast.show('Fremdriften er nullstilt.');
  }

  function init() {
    document.querySelectorAll('.ctab').forEach(t => t.addEventListener('click', () => { P.tab = t.dataset.tab; save(); render(); }));
    document.getElementById('coach-toggle').addEventListener('click', () => { P.collapsed = !P.collapsed; save(); render(); });
    Bus.on((type, d) => {
      /* Under høyreklikk-oppdraget: fortell hva eleven høyreklikket på, så de ser at menyen avhenger av elementet */
      if (type === 'ctxmenu' && d && d.label && P.active && P.active.opp === 'k1o4') Toast.show('Høyreklikk på ' + d.label + ' ✓', 2200);
      if (type !== 'oppdrag-start' && type !== 'quiz' && type !== 'hint' && type !== 'master-start' && type !== 'rep-start') check();
    });
    render();
  }
  /* Introduksjonen (js/intro.js) spør om navnet og starter første oppdrag */
  function needsName() { return !P.name; }
  function setName(v) { P.name = (v || 'Elev').trim() || 'Elev'; save(); render(); }
  function startFirst() { if (!P.active) startOppdrag(KL[0].id, KL[0].oppdrag[0].id); else render(); }

  return { init, render, check, startOppdrag, startMaster, startRep, skipRep, resetProgress, progress: () => P, reportCode, reportText, needsName, setName, startFirst, S };
})();
window.Coach = Coach;
