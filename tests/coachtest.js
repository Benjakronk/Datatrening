/* Tester veilederen på den siden den lastes inn i: teorisperren, låsing ved feil svar,
   mesterprøve, rydding mellom oppdrag og rapportkode. Kjører likt på grunnkurset og programmeringskurset. */
(async function () {
  const L = window.__log = window.__log || [];
  const out = () => { const p = document.getElementById('testlog') || (() => { const x = document.createElement('pre'); x.id = 'testlog'; document.body.appendChild(x); return x; })(); p.textContent = L.join('\n'); };
  const ok = (c, m) => { L.push((c ? 'PASS ' : 'FAIL ') + m); out(); };
  const tick = (ms = 20) => new Promise(r => setTimeout(r, ms));
  const P = () => Coach.progress();
  const KL = window.KURS_ACTIVE || KURS;
  const PAGE = window.DT_PAGE === 'prog' ? 'prog' : 'base';
  const KEY = 'dt-progress' + (window.DT_PAGE ? '-' + window.DT_PAGE : '');
  const rows = () => [...document.querySelectorAll('#coach-body .opp-row')].filter(r => !r.classList.contains('master'));
  const answerTheory = async o => {
    const n = Coach.theoryCount(o);
    for (let i = 0; i < n; i++) {
      const b = document.querySelector('#coach-body .step.active .quiz-opt[data-idx="' + o.steps[i].quiz.answer + '"]');
      if (b) b.click();
      await tick(30);
    }
    return n;
  };
  L.push('INFO side=' + PAGE + ' kurs=' + KL.length);
  try {
    /* ---------- struktur: hvert kurs starter med teori ---------- */
    const utenTeori = KL.filter(k => Coach.theoryCount(k.oppdrag[0]) === 0).map(k => k.id);
    ok(utenTeori.length === 0, 'alle kurs starter med teorispørsmål' + (utenTeori.length ? ': mangler i ' + utenTeori.join(', ') : ''));
    ok(KL.every(k => k.laer), 'alle kurs har «Les først»-tekst');
    ok(KL.every(k => k.oppdrag[0].steps.slice(0, Coach.theoryCount(k.oppdrag[0])).every(s => s.quiz)), 'alle teoristeg er spørsmål');

    /* ---------- teorisperren ---------- */
    const flerOppdrag = KL.filter(k => k.oppdrag.length > 1);
    ok(flerOppdrag.length >= 2, 'minst to kurs har flere oppdrag: ' + flerOppdrag.length);
    const k = flerOppdrag[0];
    WM.list().forEach(w => WM.forceClose(w)); await tick(30);
    Coach.resetProgress(); await tick(30);
    P().tab = 'kurs'; P().openKurs = k.id; Coach.render(); await tick();
    ok(!!document.querySelector('.teori-laas'), 'sperremelding vises for ' + k.id);
    ok(rows().length === k.oppdrag.length, 'alle oppdrag listes: ' + rows().length);
    ok(!rows()[0].classList.contains('locked'), 'første oppdrag er åpent');
    ok(rows().slice(1).every(r => r.classList.contains('locked')), 'alle senere oppdrag er låst');
    ok(/🔒/.test(rows()[1].textContent), 'låst rad viser hengelås');
    ok(!Coach.theoryDone(k), 'theoryDone er false før teorien er besvart');
    rows()[1].click(); await tick(30);
    ok(!P().active, 'klikk på låst oppdrag starter det ikke');
    ok([...document.querySelectorAll('#toasts .toast')].some(t => /Teorien først/.test(t.textContent)), 'eleven får beskjed om hvorfor');
    ok(P().openKurs === k.id, 'kurskortet forblir åpent');

    rows()[0].click(); await tick(30);
    ok(P().active && P().active.opp === k.oppdrag[0].id, 'første oppdrag starter normalt');
    const n = await answerTheory(k.oppdrag[0]);
    ok(n >= 2, 'kurset har ' + n + ' teorispørsmål');
    ok(Coach.theoryDone(k) && P().teori[k.id] === true, 'teorien er registrert som bestått');
    P().tab = 'kurs'; Coach.render(); await tick();
    ok(!document.querySelector('.teori-laas'), 'sperremeldingen er borte');
    ok(rows().every(r => !r.classList.contains('locked')), 'alle oppdrag er låst opp');
    rows()[1].click(); await tick(30);
    ok(P().active.opp === k.oppdrag[1].id, 'oppdrag to starter nå');
    ok(JSON.parse(localStorage.getItem(KEY)).teori[k.id] === true, 'opplåsingen overlever omlasting');

    /* sperren gjelder hvert kurs for seg */
    const k2 = flerOppdrag[1];
    P().tab = 'kurs'; P().openKurs = k2.id; Coach.render(); await tick();
    ok(!Coach.theoryDone(k2) && !!document.querySelector('.teori-laas'), 'neste kurs er fortsatt sperret');
    ok(rows()[1].classList.contains('locked'), 'og oppdragene der er låst');

    /* et fullført oppdrag forblir åpent selv uten teori */
    P().done[k2.oppdrag[1].id] = true; Coach.render(); await tick();
    ok(!rows()[1].classList.contains('locked'), 'allerede fullført oppdrag låses ikke');
    delete P().done[k2.oppdrag[1].id];

    /* ---------- feil svar låser spørsmålet til teksten er lest ---------- */
    Coach.resetProgress(); await tick(30);
    Coach.startOppdrag(k.id, k.oppdrag[0].id); await tick(30);
    const first = k.oppdrag[0];
    const wrong = [...document.querySelectorAll('#coach-body .step.active .quiz-opt')].find(b => +b.dataset.idx !== first.steps[0].quiz.answer);
    wrong.click(); await tick(30);
    ok(P().lock && P().active.step === 0, 'feil svar låser spørsmålet og flytter ikke steget');
    ok([...document.querySelectorAll('#coach-body .step.active .quiz-opt')].every(b => b.disabled), 'svarknappene er låst');
    ok(!!document.querySelector('.goto-laer'), 'knappen til teksten vises');
    ok(document.getElementById('coach-body').scrollTop === 0, 'ingen automatisk rulling ved feil svar');
    document.querySelector('.goto-laer').click(); await tick(30);
    ok(document.querySelector('details.laer').open, '«Les først» åpnes når eleven ber om det');
    ok(!!document.querySelector('.laer-unlock') && document.querySelector('.laer-unlock').disabled, 'opplåsingsknappen venter på lesetiden');
    ok(!Coach.theoryDone(k), 'teorien er ikke bestått av et feilsvar');

    /* ---------- mesterprøven er låst til oppdragene er gjort ---------- */
    P().tab = 'kurs'; P().openKurs = k.id; Coach.render(); await tick();
    const mrow = document.querySelector('#coach-body .opp-row.master');
    ok(!!mrow && mrow.classList.contains('locked'), 'mesterprøven er låst før oppdragene er gjort');
    k.oppdrag.forEach(o => { P().done[o.id] = true; });
    P().teori[k.id] = true; Coach.render(); await tick();
    ok(!document.querySelector('#coach-body .opp-row.master').classList.contains('locked'), 'mesterprøven åpnes når kurset er ferdig');
    ok(KL.every(x => x.mesterprove && x.mesterprove.goals.length >= 3), 'alle kurs har mesterprøve med minst tre mål');
    ok(KL.every(x => Array.isArray(x.ekte) && x.ekte.length), 'alle kurs har «gjør det på ekte»');

    /* ---------- teorien er tilgjengelig som oppslag i mesterprøven ---------- */
    Coach.startMaster(k.id); await tick(40);
    ok(P().active.mode === 'master', 'mesterprøven er startet');
    ok(document.querySelectorAll('#coach-body .goal').length === k.mesterprove.goals.length, 'målene vises');
    const slaaOpp = document.querySelector('#coach-body details.laer.oppslag');
    ok(!!slaaOpp, 'teorien er tilgjengelig i mesterprøven');
    ok(!slaaOpp.open, 'oppslaget er lukket som standard, så eleven prøver selv først');
    ok(/Slå opp/.test(slaaOpp.querySelector('summary').textContent), 'merket som oppslag, ikke som «les først»');
    ok(slaaOpp.textContent.length > 300, 'hele teksten ligger der, ikke bare overskriften');
    ok(!document.querySelector('#coach-body .linkbtn'), 'ingen hint-knapp i mesterprøven');
    const forOppslag = Bus.log.length;
    slaaOpp.open = true; slaaOpp.dispatchEvent(new Event('toggle')); await tick(30);
    ok(Bus.log.slice(forOppslag).some(e => e.type === 'laer-oppslag' && e.data.modus === 'master'), 'oppslag registreres');

    /* ---------- og i ukens øving ---------- */
    Coach.startRep(2); await tick(40);
    ok(P().active && P().active.mode === 'rep', 'ukens øving er startet');
    const repOppslag = document.querySelector('#coach-body details.laer.oppslag');
    ok(!!repOppslag && !repOppslag.open, 'teorien er tilgjengelig og lukket i ukens øving');
    ok(!!document.querySelector('.rep-task'), 'oppgaven vises fortsatt');
    P().active = null; P().tab = 'kurs'; Coach.render(); await tick();

    /* ---------- rydding mellom oppdrag ---------- */
    const medLukk = KL.flatMap(x => x.oppdrag).filter(o => o.lukk);
    ok(medLukk.length >= 2, 'flere oppdrag rydder programmer: ' + medLukk.length);
    const lukkOpp = medLukk.find(o => o.lukk !== 'alle') || medLukk[0];
    const app = lukkOpp.lukk === 'alle' ? 'explorer' : lukkOpp.lukk[0];
    Apps.launch(app, {}); await tick(40);
    const kFor = KL.find(x => x.oppdrag.includes(lukkOpp));
    ok(WM.list(app).length >= 1, app + ' er åpent før oppdraget starter');
    Coach.startOppdrag(kFor.id, lukkOpp.id); await tick(40);
    ok(WM.list(app).length === 0, app + ' ble lukket da oppdraget startet');
    ok(!document.querySelector('.dlg'), 'ingen lagringsdialog stopper oppstarten');

    /* ---------- rapportkoden ---------- */
    const code = Coach.reportCode();
    ok(/^DT1:/.test(code), 'rapportkoden har riktig prefiks');
    const d = JSON.parse(decodeURIComponent(escape(atob(code.slice(4)))));
    ok(d.p === PAGE && Array.isArray(d.d), 'rapporten vet hvilket kurssett den gjelder: ' + d.p);
    ok(Coach.reportText().includes('DT1:'), 'rapportteksten inneholder koden');

    WM.list().forEach(w => WM.forceClose(w)); await tick(30);
  } catch (e) { L.push('EXCEPTION: ' + e.stack); out(); }
  out();
  document.title = 'TESTDONE';
})();
