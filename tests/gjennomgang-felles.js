/* Felles hjelpere for gjennomgangstestene (tests/gjennomgang-*.js). Kjøres av tests/kjor.js.
   play() spiller gjennom et oppdrag: quiz-steg besvares, og for hvert vanlig steg kjøres handlingen
   som hører til (funnet på en bit av stegteksten). Står et steg fast, er det en feil. */
window.W = (() => {
  const out = document.getElementById('testlog');
  const log = m => { out.textContent += m + '\n'; };
  let fails = 0, passes = 0;
  const ok = (c, m) => { if (c) passes++; else fails++; log((c ? 'PASS ' : 'FAIL ') + m); };
  const tick = ms => new Promise(r => setTimeout(r, ms || 30));
  const P = () => Coach.progress();
  const strip = s => String(s || '').replace(/<[^>]+>/g, '').slice(0, 90);
  const KL = () => window.KURS_ACTIVE || KURS;

  async function answerQuiz(st) {
    const b = document.querySelector(`#coach-body .step.active .quiz-opt[data-idx="${st.quiz.answer}"]`);
    if (!b) return false;
    b.click(); await tick(40); return true;
  }
  /* Spiller gjennom et oppdrag. actions: [[tekstbit, async fn], ...] — kjøres når steget med teksten er aktivt */
  async function play(kid, oid, actions) {
    WM.list().forEach(w => WM.forceClose(w)); document.querySelectorAll('.dlg').forEach(d => d.remove());
    await tick(30);
    Coach.startOppdrag(kid, oid); await tick(80);
    const o = KL().find(k => k.id === kid).oppdrag.find(x => x.id === oid);
    const used = new Set();
    for (let guard = 0; guard < 80; guard++) {
      const a = P().active;
      if (!a || a.opp !== oid || a.step >= o.steps.length) break;
      const i = a.step, st = o.steps[i];
      if (st.quiz) { if (!(await answerQuiz(st))) { ok(false, `${oid} steg ${i + 1}: fant ikke svaret i quizen`); return false; } continue; }
      const txt = strip(st.text);
      const act = actions.find(([k], j) => !used.has(j) && txt.includes(k));
      if (act) { used.add(actions.indexOf(act)); try { await act[1](); } catch (e) { ok(false, `${oid} steg ${i + 1}: unntak ${e && e.stack}`); return false; } }
      await tick(60); Bus.emit('test-tick', {}); await tick(40);
      if (P().active && P().active.step === i && P().active.opp === oid) { ok(false, `${oid} steg ${i + 1} sitter fast${act ? '' : ' (ingen handling)'}: ${txt}`); return false; }
    }
    const done = !!P().done[oid];
    ok(done, `${oid} fullført`);
    return done;
  }
  /* Mesterprøve: kjør handlingene, sjekk at målene ikke er oppfylt ved start, og at prøven bestås */
  async function master(kid, fns) {
    WM.list().forEach(w => WM.forceClose(w)); document.querySelectorAll('.dlg').forEach(d => d.remove());
    await tick(30);
    Coach.startMaster(kid); await tick(80);
    const st0 = (P().active && P().active.state) || [];
    ok(st0.every(x => !x), `${kid} mesterprøve: ingen mål oppfylt ved start (${JSON.stringify(st0)})`);
    for (const f of fns) { try { await f(); } catch (e) { ok(false, `${kid} mesterprøve unntak ${e && e.stack}`); return; } await tick(60); Bus.emit('test-tick', {}); await tick(30); }
    const pass = !!(P().master[kid] && P().master[kid].passed);
    ok(pass, `${kid} mesterprøve bestått` + (pass ? '' : ' – tilstand: ' + JSON.stringify(P().active && P().active.state)));
  }
  function teoriAlle() { KL().forEach(k => { P().teori[k.id] = true; }); }
  const btnText = (root, re) => [...root.querySelectorAll('button')].find(b => re.test(b.textContent));
  async function clickCtx(re) { await tick(20); const it = [...document.querySelectorAll('#ctxmenu .cm-item')].find(x => re.test(x.textContent)); if (!it) throw new Error('fant ikke menyvalg ' + re); it.click(); await tick(30); }
  async function dlgPrimary() { await tick(30); const d = [...document.querySelectorAll('#modal-layer .dlg')].pop(); if (!d) throw new Error('ingen dialog'); d.querySelector('.btn.primary').click(); await tick(40); }
  function done() { log(`INFO ${passes} ok, ${fails} feil`); (window.__log || []).forEach(e => log(e)); log('TESTDONE'); }
  return { log, ok, tick, P, play, master, teoriAlle, btnText, clickCtx, dlgPrimary, done, strip };
})();
