/* Skrivetrening: måler skrivehastighet (ord per minutt) og treffsikkerhet. */
const Skrivetrening = (() => {
  const KEY = 'dt-typing';
  const TEXTS = [
    { id: 'hjem', name: 'Hjemmeraden', text: 'asdf jklø asdf jklø fjas løkk asdf jklø sal dal fall skal ask lask das' },
    { id: 'ord', name: 'Vanlige ord', text: 'og i det er en til at som på de med han av ikke for var meg seg men da mot' },
    { id: 'setn', name: 'Setninger', text: 'Jeg går på skolen hver dag. Vi lærer matte, norsk og naturfag. I dag skal vi skrive en tekst om høsten.' },
    { id: 'aeoa', name: 'Æ, Ø og Å', text: 'Måken fløy over åsen. Søsteren min spiser rødgrøt. Å være ærlig er viktig. Gården ligger ved sjøen.' },
    { id: 'tegn', name: 'Store bokstaver og tegn', text: 'Hei! Heter du Ola? Send meg en e-post på ola@skolen.no. Prisen er 249,50 kr (inkludert moms).' }
  ];
  let best = null, win = null;
  function load() { if (best) return best; try { best = JSON.parse(localStorage.getItem(KEY) || 'null') || { runs: 0 }; } catch (e) { best = { runs: 0 }; } return best; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(best)); } catch (e) { /* ignorer */ } }

  function open() {
    if (win) { WM.focus(win, 'open'); return win; }
    if (WM.full()) return null;
    load();
    let cur = TEXTS[0], started = 0, done = false, typed = '';
    const root = el(`<div class="type">
      <div class="type-top"><label>Øvelse:</label><select class="txt tsel">${TEXTS.map((t, i) => `<option value="${i}">${esc(t.name)}</option>`).join('')}</select><button class="btn small again">Start på nytt</button><span class="spacer"></span><span class="type-stat"></span></div>
      <div class="type-text"></div>
      <input class="type-in" spellcheck="false" autocomplete="off" placeholder="Klikk her og begynn å skrive …">
      <div class="type-tips">
        <b>Slik skriver du raskere:</b>
        <ul>
          <li>Plasser fingrene på <b>hjemmeraden</b>: venstre hånd på <kbd>a</kbd> <kbd>s</kbd> <kbd>d</kbd> <kbd>f</kbd>, høyre hånd på <kbd>j</kbd> <kbd>k</kbd> <kbd>l</kbd> <kbd>ø</kbd>. Tomlene hviler på mellomromstasten.</li>
          <li><kbd>F</kbd> og <kbd>J</kbd> har en liten kul du kan kjenne. Da finner du plassen uten å se ned.</li>
          <li><b>Ikke se på tastaturet.</b> Det går saktere de første gangene, men mye raskere etterpå.</li>
          <li>Skriv jevnt og riktig framfor fort. Hastigheten kommer av seg selv.</li>
        </ul>
      </div>
      <div class="type-result hidden"></div>
    </div>`);
    win = WM.create({ app: 'skrivetrening', title: 'Skrivetrening', body: root, width: 820, height: 600 });
    win.onClosed = () => { win = null; };
    const textEl = root.querySelector('.type-text'), input = root.querySelector('.type-in'), stat = root.querySelector('.type-stat'), result = root.querySelector('.type-result');

    root.querySelector('.tsel').addEventListener('change', e => { cur = TEXTS[+e.target.value]; reset(); });
    root.querySelector('.again').addEventListener('click', reset);
    input.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); });
    input.addEventListener('input', () => {
      if (done) return;
      if (!started) { started = Date.now(); Bus.emit('typing-start', { level: cur.id }); tick(); }
      typed = input.value;
      draw();
      if (typed.length >= cur.text.length) finish();
    });
    let timer = null;
    function tick() { if (timer) clearInterval(timer); timer = setInterval(() => { if (!done && started) drawStat(); }, 500); }
    function drawStat() {
      const sec = Math.max(1, (Date.now() - started) / 1000);
      const words = typed.length / 5;
      stat.textContent = `${Math.round(words / (sec / 60))} ord/min · ${accuracy()} % riktig · ${Math.round(sec)} s`;
    }
    function accuracy() {
      let ok = 0;
      for (let i = 0; i < typed.length; i++) if (typed[i] === cur.text[i]) ok++;
      return typed.length ? Math.round(100 * ok / typed.length) : 100;
    }
    function draw() {
      let html = '';
      for (let i = 0; i < cur.text.length; i++) {
        const c = cur.text[i] === ' ' ? '&nbsp;' : esc(cur.text[i]);
        if (i < typed.length) html += `<span class="${typed[i] === cur.text[i] ? 'tc' : 'tw'}">${c}</span>`;
        else if (i === typed.length) html += `<span class="tn">${c}</span>`;
        else html += `<span>${c}</span>`;
      }
      textEl.innerHTML = html;
      if (started) drawStat();
    }
    function finish() {
      done = true; if (timer) { clearInterval(timer); timer = null; }
      const sec = Math.max(1, (Date.now() - started) / 1000);
      const wpm = Math.round((cur.text.length / 5) / (sec / 60));
      const acc = accuracy();
      const b = load();
      const prev = b[cur.id];
      if (!prev || wpm > prev.wpm) b[cur.id] = { wpm, acc, date: Date.now() };
      b.runs = (b.runs || 0) + 1; b.last = { wpm, acc, level: cur.id, date: Date.now() };
      save();
      result.classList.remove('hidden');
      result.innerHTML = `<div class="tr-big">${wpm} ord/min</div><div class="tr-sub">${acc} % riktig · ${Math.round(sec)} sekunder</div>
        <div class="muted">${acc < 90 ? 'Prøv å skrive litt saktere og treffe riktig. Treffsikkerhet er viktigere enn fart.' : wpm < 15 ? 'Bra treffsikkerhet! Nå kan du prøve å øke farten litt.' : wpm < 30 ? 'Bra jobbet! Fortsett å øve uten å se på tastaturet.' : 'Veldig bra! Du skriver raskt og riktig.'}</div>
        ${prev ? `<div class="muted">Din beste på denne øvelsen: ${Math.max(wpm, prev.wpm)} ord/min</div>` : ''}`;
      input.disabled = true;
      Bus.emit('typing-done', { wpm, acc, level: cur.id, seconds: Math.round(sec) });
    }
    function reset() {
      started = 0; done = false; typed = ''; input.value = ''; input.disabled = false;
      result.classList.add('hidden'); stat.textContent = '';
      if (timer) { clearInterval(timer); timer = null; }
      draw(); input.focus();
    }
    reset();
    setTimeout(() => input.focus(), 50);
    Bus.emit('typing-app-open', {});
    return win;
  }
  function bestResult() { const b = load(); return b.last || null; }
  function bestFor(level) { const b = load(); return b[level] || null; }
  function reset() { best = { runs: 0 }; save(); }
  return { open, best: bestResult, bestFor, reset, TEXTS };
})();
window.Skrivetrening = Skrivetrening;
