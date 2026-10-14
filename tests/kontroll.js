/* Automatisk kontroll av alle kurs på siden:
   1) alle mesterprøver: ingen mål oppfylt rett etter start (også etter at gjennomgangen har kjørt)
   2) ukens øving: ingen oppgave godkjennes uten at eleven gjør noe
   3) hvert oppdrag: hvilke vanlige steg går av seg selv rett etter oppstart (til informasjon)
   4) quizer: gyldig svarindeks, unike alternativer, og om riktig svar er påfallende lengst */
(async () => {
  const out = document.getElementById('testlog');
  const log = m => { out.textContent += m + '\n'; };
  const tick = ms => new Promise(r => setTimeout(r, ms || 30));
  /* Vent på gjennomgangen hvis den kjører i samme side */
  for (let i = 0; i < 6000 && window.W && !/TESTDONE/.test(out.textContent); i++) await tick(100);
  await tick(800);
  document.querySelectorAll('.dlg .btn.primary').forEach(b => b.click());
  const KL = window.KURS_ACTIVE || KURS;
  const P = () => Coach.progress();
  const strip = s => String(s || '').replace(/<[^>]+>/g, '').slice(0, 80);
  const closeAll = async () => { WM.list().forEach(w => WM.forceClose(w)); document.querySelectorAll('#modal-layer .dlg').forEach(d => d.remove()); document.getElementById('modal-layer').classList.add('hidden'); await tick(30); };
  let problems = 0;
  const bad = m => { problems++; log('FAIL ' + m); };
  try {
    KL.forEach(k => { P().teori[k.id] = true; });
    /* 1: mesterprøver */
    for (const k of KL.filter(k => k.mesterprove)) {
      await closeAll();
      Coach.startMaster(k.id); await tick(150); Bus.emit('audit-tick', {}); await tick(50);
      const st = P().active && P().active.state || [];
      st.forEach((v, i) => { if (v) bad(`mesterprøve ${k.id} mål ${i + 1} er oppfylt ved start: ${strip(k.mesterprove.goals[i].text)}`); });
    }
    /* 2: ukens øving – alle kurs fullført, alle oppgaver i tilfeldig rekkefølge */
    KL.forEach(k => k.oppdrag.forEach(o => { P().done[o.id] = true; }));
    await closeAll();
    Coach.startRep(999); await tick(150);
    const a = P().active;
    if (a && a.mode === 'rep') {
      const n = a.tasks.length; let lastOk = a.ok;
      if (a.ok > 0) a.tasks.slice(0, a.ok).forEach(id => bad('ukens øving ' + id + ' godkjent uten handling'));
      for (let g = 0; g < n + 2 && P().active && P().active.mode === 'rep' && P().active.i < n; g++) {
        Coach.skipRep(); await tick(120); Bus.emit('audit-tick', {}); await tick(30);
        const b = P().active; if (!b || b.mode !== 'rep') break;
        if (b.ok > lastOk) { bad('ukens øving ' + b.tasks[b.i - 1] + ' godkjent uten handling'); lastOk = b.ok; }
      }
      log('INFO ukens øving: ' + n + ' oppgaver kontrollert');
    } else bad('ukens øving startet ikke');
    /* 3: steg som går av seg selv ved oppstart */
    const auto = [];
    for (const k of KL) for (const o of k.oppdrag) {
      await closeAll();
      Coach.startOppdrag(k.id, o.id); await tick(120); Bus.emit('audit-tick', {}); await tick(30);
      const first = o.steps.findIndex(s => !s.quiz);
      const st = P().active && P().active.step;
      if (first >= 0 && st > first) auto.push(`${o.id}: steg ${first + 1}–${st} («${strip(o.steps[first].text)}»)`);
    }
    log('INFO steg som går av seg selv rett etter start (ofte greit, sjekk at de er tilsiktet): ' + (auto.length ? '\n  ' + auto.join('\n  ') : 'ingen'));
    /* 4: quizer */
    for (const k of KL) for (const o of k.oppdrag) o.steps.forEach((s, i) => {
      if (!s.quiz) return;
      const q = s.quiz, L = q.options.map(x => x.length);
      if (!(q.answer >= 0 && q.answer < q.options.length)) bad(`${o.id} steg ${i + 1}: ugyldig svarindeks`);
      if (new Set(q.options.map(x => x.trim().toLowerCase())).size !== q.options.length) bad(`${o.id} steg ${i + 1}: like alternativer`);
      const others = L.filter((_, j) => j !== q.answer);
      if (L[q.answer] > 1.7 * Math.max(...others) && L[q.answer] > 30) bad(`lengdetips ${o.id} steg ${i + 1}: riktig svar er mye lengre enn de andre («${strip(q.q)}»)`);
    });
    for (const k of KL) if (k.mesterprove) { const m = k.mesterprove; m.goals.forEach((g, i) => { if (typeof g.check !== 'function') bad(`${k.id} mål ${i + 1} mangler check`); }); }
    /* svarfordeling: er riktig svar nesten alltid samme plass? (alternativene blandes i appen, så dette er bare info) */
    const pos = [0, 0, 0, 0];
    KL.forEach(k => k.oppdrag.forEach(o => o.steps.forEach(s => { if (s.quiz) pos[s.quiz.answer]++; })));
    log('INFO riktig svar på plass 1/2/3/4 i koden: ' + pos.join('/'));
  } catch (e) { bad('EXCEPTION ' + (e && e.stack)); }
  log('INFO kontroll ferdig, ' + problems + ' problemer');
  if (!window.W) log('TESTDONE');
})();
