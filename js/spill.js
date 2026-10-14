/* Spill: Kabal og Minesveiper, slik de kom med Windows for å lære folk å bruke musen.
   Begge viser en «Om»-boks når de åpnes, med historien bak spillet og hvilke museteknikker det øver på. */
const Spill = (() => {
  const ABOUT_KEY = 'dt-spill-om-';

  /* «Om»-boksen. Vises hver gang spillet åpnes, til eleven krysser av for «Ikke vis dette igjen». */
  const ABOUT = {
    kabal: () => ({
      title: T('Om Kabal'),
      html: T('<p><b>Kabal</b> (på engelsk <i>Solitaire</i>) kom med Windows 3.0 i 1990. Spillet ble laget av Wes Cherry, en student som var sommervikar hos Microsoft.</p><p>Mange som fikk PC den gangen, hadde aldri holdt i en datamus. Microsoft la inn kabalen for at folk skulle øve på musen uten å tenke på at de øvde. Kabalen lærer deg å <b>dra og slippe</b>: trykk ned venstre museknapp på et kort, hold knappen inne mens du flytter musen, og slipp. Det er akkurat det samme du gjør når du flytter en fil til en mappe i Filutforsker.</p><ul><li><b>Dra</b> med venstre museknapp: flytt et kort eller en hel rekke.</li><li><b>Klikk</b> på bunken øverst til venstre: snu nye kort.</li><li><b>Dobbeltklikk</b> på et kort: send det opp til en av de fire bunkene til høyre, hvis det passer der.</li><li><b>Høyreklikk</b> et sted på bordet: flytt alle kort som kan flyttes, opp til de fire bunkene.</li></ul><p><b>Målet:</b> bygg fire bunker øverst til høyre, én for hver sort, fra ess til konge. Nede på bordet legger du kortene i synkende rekkefølge med annenhver rød og svart farge. På en tom plass kan du bare legge en konge.</p>')
    }),
    minesveiper: () => ({
      title: T('Om Minesveiper'),
      html: T('<p><b>Minesveiper</b> ble laget av Robert Donner og Curt Johnson hos Microsoft. Det kom først i en spillpakke for Windows i 1990, og ble en del av selve Windows fra Windows 3.1 i 1992.</p><p>Spillet skulle lære folk å bruke <b>begge museknappene</b> og å treffe nøyaktig med pekeren. I Minesveiper betyr venstreklikk og høyreklikk helt forskjellige ting, og bruker du feil knapp, kan du sprenge en mine. Det er en god måte å lære forskjellen på.</p><ul><li><b>Venstreklikk</b> åpner en rute. Tallet som dukker opp, forteller hvor mange miner som ligger i de åtte rutene rundt.</li><li><b>Høyreklikk</b> setter et flagg 🚩 på en rute du tror skjuler en mine. Høyreklikk en gang til for å ta bort flagget.</li><li>Har et tall fått like mange flagg rundt seg som tallet sier, kan du <b>venstreklikke på tallet</b> for å åpne resten av rutene rundt det.</li></ul><p>Det samme gjelder i resten av Windows: <b>venstreklikk</b> velger og åpner ting, og <b>høyreklikk</b> viser en meny med valg for det du klikket på. På en styreplate høyreklikker du ved å klikke med <b>to fingre</b>.</p>')
    })
  };
  async function about(app, auto) {
    let skip = false;
    try { skip = localStorage.getItem(ABOUT_KEY + app) === '1'; } catch (e) { /* ignorer */ }
    if (auto && skip) return;
    const a = ABOUT[app]();
    const body = el(`<div class="spill-om"><div class="spill-om-top">${Icons.app(app, 48)}<div>${a.html}</div></div>
      <label class="spill-om-skip"><input type="checkbox"${skip ? ' checked' : ''}> ${T('Ikke vis dette når spillet åpnes')}</label></div>`);
    Bus.emit('spill-om', { app });
    await Dialog.show({ title: a.title, body, cls: 'dlg-spill', buttons: [{ label: T('Spill'), value: true, primary: true }], escapeValue: true });
    try { localStorage.setItem(ABOUT_KEY + app, body.querySelector('input').checked ? '1' : '0'); } catch (e) { /* ignorer */ }
  }
  /* Spillene skal ikke vise Windows-menyen når man høyreklikker, høyreklikket betyr noe i spillet */
  const noMenu = e => { e.preventDefault(); e.stopPropagation(); };
  const fmtTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

  /* ================= Kabal (Klondike) ================= */
  const SUITS = ['♠', '♥', '♦', '♣'];
  const RANKS = ['', 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const red = c => c.s === 1 || c.s === 2;
  let kWin = null;

  function openKabal() {
    if (kWin) { WM.focus(kWin, 'open'); return kWin; }
    if (WM.full()) return null;
    let draw3 = false;
    try { draw3 = localStorage.getItem('dt-kabal-trekk') === '3'; } catch (e) { /* ignorer */ }
    const root = el(`<div class="kab">
      <div class="spill-bar"><button class="btn small k-new">${T('Nytt spill')}</button><button class="btn small k-undo">${T('Angre')}</button>
        <select class="txt k-draw"><option value="1">${T('Trekk 1 kort')}</option><option value="3">${T('Trekk 3 kort')}</option></select>
        <span class="spacer"></span><span class="spill-stat"></span><button class="btn small k-about">${T('Om Kabal')}</button></div>
      <div class="kab-board"></div>
      <div class="spill-tip">${T('Dra kortene med <b>venstre</b> museknapp · <b>dobbeltklikk</b> sender et kort opp · <b>høyreklikk</b> på bordet sender alle kort som passer, opp')}</div>
    </div>`);
    const win = kWin = WM.create({ app: 'kabal', title: T('Kabal'), body: root, width: 760, height: 620 });
    const board = root.querySelector('.kab-board'), stat = root.querySelector('.spill-stat');
    root.querySelector('.k-draw').value = draw3 ? '3' : '1';

    let cards, st, hist, moves, started, timer, won;
    function deal() {
      cards = [];
      for (let s = 0; s < 4; s++) for (let r = 1; r <= 13; r++) cards.push({ id: cards.length, s, r, up: false });
      const order = cards.map(c => c.id);
      for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
      st = { stock: [], waste: [], found: [[], [], [], []], tab: [[], [], [], [], [], [], []] };
      for (let p = 0; p < 7; p++) for (let k = 0; k <= p; k++) { const id = order.pop(); st.tab[p].push(id); cards[id].up = k === p; }
      st.stock = order;
      hist = []; moves = 0; started = 0; won = false;
      if (timer) { clearInterval(timer); timer = null; }
      render();
      Bus.emit('kabal-new', { draw: draw3 ? 3 : 1 });
    }
    function snapshot() {
      hist.push(JSON.stringify({ st, up: cards.map(c => c.up), moves }));
      if (hist.length > 300) hist.shift();
    }
    function undo() {
      if (!hist.length || won) return;
      const h = JSON.parse(hist.pop());
      st = h.st; h.up.forEach((u, i) => { cards[i].up = u; }); moves = h.moves;
      render();
      Bus.emit('kabal-undo', {});
    }
    function startClock() {
      if (started) return;
      started = Date.now();
      timer = setInterval(drawStat, 1000);
    }
    const secs = () => started ? Math.floor((Date.now() - started) / 1000) : 0;
    function drawStat() { stat.textContent = T('Trekk: {0} · Tid: {1}', moves, fmtTime(secs())); }

    /* Hvor ligger kortet? Gir bunken (en tabell i st) og plassen i den */
    function where(id) {
      const look = [['stock', st.stock], ['waste', st.waste]];
      st.found.forEach((f, i) => look.push(['found' + i, f]));
      st.tab.forEach((t, i) => look.push(['tab' + i, t]));
      for (const [name, pile] of look) { const i = pile.indexOf(id); if (i >= 0) return { name, pile, i }; }
      return null;
    }
    const top = pile => pile.length ? cards[pile[pile.length - 1]] : null;
    function fitsFound(c, f) { const t = top(f); return t ? t.s === c.s && c.r === t.r + 1 : c.r === 1; }
    function fitsTab(c, t) { const tc = top(t); return tc ? tc.up && red(tc) !== red(c) && c.r === tc.r - 1 : c.r === 13; }
    function flipTops() { st.tab.forEach(t => { const c = top(t); if (c && !c.up) c.up = true; }); }

    /* Flytter kortene fra og med plass i i bunken «from» til bunken «to» */
    function move(from, i, to) {
      const ids = from.splice(i);
      ids.forEach(id => to.push(id));
      flipTops();
      moves++; startClock();
    }
    function drawStock() {
      if (won) return;
      snapshot();
      if (!st.stock.length) {
        if (!st.waste.length) { hist.pop(); return; }
        st.stock = st.waste.reverse(); st.waste = [];
        st.stock.forEach(id => { cards[id].up = false; });
        Bus.emit('kabal-recycle', {});
      } else {
        for (let k = 0; k < (draw3 ? 3 : 1) && st.stock.length; k++) { const id = st.stock.pop(); cards[id].up = true; st.waste.push(id); }
        Bus.emit('kabal-draw', {});
      }
      moves++; startClock();
      render();
    }
    /* Dobbeltklikk: send kortet opp hvis det er øverst og passer i en av grunnbunkene */
    function toFoundation(id) {
      const w = where(id);
      if (!w || w.name === 'stock' || w.name.startsWith('found') || w.i !== w.pile.length - 1) return false;
      const c = cards[id];
      const f = st.found.find(f => fitsFound(c, f));
      if (!f) return false;
      snapshot(); move(w.pile, w.i, f);
      return true;
    }
    /* Høyreklikk: flytt alt som kan flyttes opp, som i Kabal i Windows 3.0 */
    function autoAll() {
      if (won) return 0;
      let n = 0, again = true;
      while (again) {
        again = false;
        for (const pile of [st.waste, ...st.tab]) {
          const c = top(pile);
          if (c && c.up && toFoundation(c.id)) { n++; again = true; }
        }
      }
      return n;
    }
    function checkWin() {
      if (won || st.found.some(f => f.length < 13)) return;
      won = true;
      if (timer) { clearInterval(timer); timer = null; }
      Bus.emit('kabal-win', { moves, seconds: secs() });
      const box = el(`<div class="spill-win"><div class="sw-big">${T('Gratulerer, du vant! 🎉')}</div><div>${T('{0} trekk · {1}', moves, fmtTime(secs()))}</div><button class="btn primary">${T('Nytt spill')}</button></div>`);
      box.querySelector('button').addEventListener('click', deal);
      board.appendChild(box);
    }

    /* ---------- Tegning ---------- */
    let L = null; // mål: kortbredde, kolonner, rader
    function layout() {
      const w = board.clientWidth, h = board.clientHeight;
      const gap = Math.max(6, Math.round(w * 0.015));
      const cw = Math.max(36, Math.min(96, Math.floor((w - gap * 8) / 7)));
      const ch = Math.round(cw * 1.4);
      const x = p => gap + p * (cw + gap);
      return { w, h, gap, cw, ch, x, ty: gap * 2 + ch };
    }
    function cardHtml(c) {
      if (!c.up) return `<div class="card back" data-id="${c.id}"></div>`;
      const r = RANKS[c.r], s = SUITS[c.s];
      return `<div class="card${red(c) ? ' red' : ''}" data-id="${c.id}"><span class="cr">${r}<br>${s}</span><span class="cs">${s}</span><span class="cr cr2">${r}<br>${s}</span></div>`;
    }
    function render() {
      L = layout();
      const { cw, ch, x, ty, gap, h } = L;
      board.style.setProperty('--cw', cw + 'px'); board.style.setProperty('--ch', ch + 'px');
      let html = `<div class="slot stock-slot" data-pile="stock" style="left:${x(0)}px;top:${gap}px">${st.waste.length ? '↻' : ''}</div>`;
      for (let f = 0; f < 4; f++) html += `<div class="slot" data-pile="found${f}" style="left:${x(3 + f)}px;top:${gap}px">A</div>`;
      for (let t = 0; t < 7; t++) html += `<div class="slot" data-pile="tab${t}" style="left:${x(t)}px;top:${ty}px">K</div>`;
      const put = (id, left, topY, z) => { html += cardHtml(cards[id]).replace('<div ', `<div style="left:${left}px;top:${topY}px;z-index:${z}" `); };
      st.stock.forEach((id, i) => put(id, x(0) + Math.min(i, 8) * 0.3, gap, i + 1));
      const showW = draw3 ? 3 : 1;
      st.waste.forEach((id, i) => {
        const fromTop = st.waste.length - 1 - i;
        const shift = fromTop < showW ? (Math.min(showW, st.waste.length) - 1 - fromTop) * Math.round(cw * 0.28) : 0;
        put(id, x(1) + shift, gap, i + 1);
      });
      st.found.forEach((f, fi) => f.forEach((id, i) => put(id, x(3 + fi), gap, i + 1)));
      st.tab.forEach((t, ti) => {
        /* Lange rekker presses sammen så de får plass i vinduet */
        const down = t.filter(id => !cards[id].up).length, upN = t.length - down;
        let dn = Math.round(ch * 0.12), un = Math.round(ch * 0.27);
        const room = h - ty - ch - gap;
        const need = down * dn + Math.max(0, upN - 1) * un;
        if (need > room && need > 0) { const k = Math.max(0.25, room / need); dn = Math.round(dn * k); un = Math.round(un * k); }
        let yy = ty;
        t.forEach((id, i) => { put(id, x(ti), yy, i + 1); yy += cards[id].up ? un : dn; });
      });
      board.innerHTML = html;
      drawStat();
      checkWin();
    }

    /* ---------- Mus: dra, klikk, dobbeltklikk og høyreklikk ---------- */
    let lastClick = { id: -1, t: 0 };
    board.addEventListener('contextmenu', e => {
      noMenu(e);
      const n = autoAll();
      Bus.emit('kabal-rightclick', { moved: n });
      if (n) render();
      else Toast.show(T('Ingen kort kan flyttes opp akkurat nå.'));
    });
    board.addEventListener('pointerdown', e => {
      if (e.button !== 0 || won) return;
      const cel = e.target.closest('.card'), slot = e.target.closest('.slot');
      if (!cel) { if (slot && slot.dataset.pile === 'stock') drawStock(); return; }
      const id = +cel.dataset.id, w = where(id);
      if (!w) return;
      if (w.name === 'stock') { drawStock(); return; }
      const c = cards[id];
      if (!c.up) return;
      /* Fra kortstokken og grunnbunkene kan bare det øverste kortet flyttes */
      if ((w.name === 'waste' || w.name.startsWith('found')) && w.i !== w.pile.length - 1) return;
      e.preventDefault();
      const group = w.pile.slice(w.i).map(gid => board.querySelector(`.card[data-id="${gid}"]`));
      const sx = e.clientX, sy = e.clientY;
      let dragging = false;
      try { board.setPointerCapture(e.pointerId); } catch (er) { /* ignorer */ }
      const mv = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (!dragging && Math.abs(dx) + Math.abs(dy) > 4) { dragging = true; group.forEach(g => g.classList.add('drag')); }
        if (dragging) group.forEach(g => { g.style.transform = `translate(${dx}px,${dy}px)`; });
      };
      const up = ev => {
        board.removeEventListener('pointermove', mv);
        board.removeEventListener('pointerup', up);
        board.removeEventListener('pointercancel', up);
        if (!dragging) {
          const now = Date.now();
          if (lastClick.id === id && now - lastClick.t < 450) {
            lastClick = { id: -1, t: 0 };
            if (toFoundation(id)) { Bus.emit('kabal-dblclick', { ok: true }); render(); }
            else Bus.emit('kabal-dblclick', { ok: false });
          } else lastClick = { id, t: now };
          return;
        }
        const target = dropTarget(group[0], ev);
        if (target && target !== w.pile) {
          const ok = target.isFound ? (w.pile.length - w.i === 1 && fitsFound(c, target.pile)) : fitsTab(c, target.pile);
          if (ok) { snapshot(); move(w.pile, w.i, target.pile); Bus.emit('kabal-drag', { ok: true, to: target.isFound ? 'found' : 'tab' }); render(); return; }
        }
        Bus.emit('kabal-drag', { ok: false });
        group.forEach(g => { g.classList.remove('drag'); g.style.transform = ''; });
      };
      board.addEventListener('pointermove', mv);
      board.addEventListener('pointerup', up);
      board.addEventListener('pointercancel', up);
    });
    /* Bunken kortet slippes på: den som overlapper kortet mest, eller den under pekeren */
    function dropTarget(cardEl, ev) {
      const br = board.getBoundingClientRect(), cr = cardEl.getBoundingClientRect();
      const piles = [];
      st.found.forEach((f, i) => piles.push({ pile: f, isFound: true, l: L.x(3 + i), t: L.gap, b: L.gap + L.ch }));
      st.tab.forEach((t, i) => {
        const last = t.length ? board.querySelector(`.card[data-id="${t[t.length - 1]}"]`) : null;
        const bottom = last ? last.offsetTop + L.ch : L.ty + L.ch;
        piles.push({ pile: t, isFound: false, l: L.x(i), t: L.ty, b: Math.max(bottom, L.ty + L.ch) });
      });
      let best = null, bestArea = 0;
      const cl = cr.left - br.left, ct = cr.top - br.top;
      piles.forEach(p => {
        const ox = Math.min(cl + L.cw, p.l + L.cw) - Math.max(cl, p.l);
        const oy = Math.min(ct + L.ch, p.b) - Math.max(ct, p.t);
        const a = ox > 0 && oy > 0 ? ox * oy : 0;
        if (a > bestArea) { bestArea = a; best = p; }
      });
      if (best) return best;
      const px = ev.clientX - br.left, py = ev.clientY - br.top;
      return piles.find(p => px >= p.l && px <= p.l + L.cw && py >= p.t && py <= p.b) || null;
    }

    root.querySelector('.k-new').addEventListener('click', deal);
    root.querySelector('.k-undo').addEventListener('click', undo);
    root.querySelector('.k-about').addEventListener('click', () => about('kabal', false));
    root.querySelector('.k-draw').addEventListener('change', e => {
      draw3 = e.target.value === '3';
      try { localStorage.setItem('dt-kabal-trekk', draw3 ? '3' : '1'); } catch (er) { /* ignorer */ }
      deal();
    });
    win.onKey = e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); return true; } if (e.key === 'F2') { e.preventDefault(); deal(); return true; } };
    let ro = null;
    if (window.ResizeObserver) { ro = new ResizeObserver(() => { if (cards) render(); }); ro.observe(board); }
    win.onClosed = () => { kWin = null; if (timer) clearInterval(timer); if (ro) ro.disconnect(); };
    deal();
    Bus.emit('kabal-open', {});
    about('kabal', true);
    return win;
  }

  /* ================= Minesveiper ================= */
  const LEVELS = [
    { id: 'lett', name: T('Nybegynner'), w: 9, h: 9, m: 10 },
    { id: 'middels', name: T('Viderekommen'), w: 16, h: 16, m: 40 },
    { id: 'ekspert', name: T('Ekspert'), w: 30, h: 16, m: 99 }
  ];
  const CELL = 26;
  let mWin = null;

  function openMines() {
    if (mWin) { WM.focus(mWin, 'open'); return mWin; }
    if (WM.full()) return null;
    let lvl = LEVELS[0];
    try { lvl = LEVELS.find(l => l.id === localStorage.getItem('dt-mine-niva')) || LEVELS[0]; } catch (e) { /* ignorer */ }
    const root = el(`<div class="mine">
      <div class="spill-bar"><select class="txt m-lvl">${LEVELS.map(l => `<option value="${l.id}">${esc(l.name)}</option>`).join('')}</select>
        <span class="spacer"></span><button class="btn small m-about">${T('Om Minesveiper')}</button></div>
      <div class="mine-wrap"><div class="mine-box">
        <div class="mine-head"><span class="mine-count"></span><button class="mine-face" title="${T('Nytt spill')}">🙂</button><span class="mine-time"></span></div>
        <div class="mine-grid"></div>
      </div></div>
      <div class="spill-tip m-tip"></div>
    </div>`);
    const win = mWin = WM.create({ app: 'minesveiper', title: T('Minesveiper'), body: root, width: 480, height: 520 });
    const grid = root.querySelector('.mine-grid'), face = root.querySelector('.mine-face');
    const countEl = root.querySelector('.mine-count'), timeEl = root.querySelector('.mine-time'), tip = root.querySelector('.m-tip');
    const TIP = T('<b>Venstreklikk</b> åpner en rute · <b>høyreklikk</b> setter et flagg 🚩 der du tror det er en mine');
    root.querySelector('.m-lvl').value = lvl.id;

    let cells, state, flags, opened, started, timer, rightClicks;
    const idx = (x, y) => y * lvl.w + x;
    function around(i) {
      const x = i % lvl.w, y = Math.floor(i / lvl.w), out = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < lvl.w && ny < lvl.h) out.push(idx(nx, ny));
      }
      return out;
    }
    function newGame() {
      cells = Array.from({ length: lvl.w * lvl.h }, () => ({ mine: false, open: false, flag: false, n: 0 }));
      state = 'ready'; flags = 0; opened = 0; started = 0; rightClicks = 0;
      if (timer) { clearInterval(timer); timer = null; }
      grid.style.gridTemplateColumns = `repeat(${lvl.w}, ${CELL}px)`;
      grid.innerHTML = cells.map((c, i) => `<div class="mc" data-i="${i}"></div>`).join('');
      face.textContent = '🙂';
      tip.innerHTML = TIP;
      fitWindow();
      drawHead();
      Bus.emit('mine-new', { level: lvl.id });
    }
    /* Minene legges ut etter første klikk, så det første klikket aldri treffer en mine */
    function layMines(first) {
      const safe = new Set([first, ...around(first)]);
      const free = cells.map((c, i) => i).filter(i => !safe.has(i));
      for (let k = 0; k < lvl.m && free.length; k++) {
        const j = Math.floor(Math.random() * free.length);
        cells[free[j]].mine = true; free.splice(j, 1);
      }
      cells.forEach((c, i) => { c.n = around(i).filter(a => cells[a].mine).length; });
      state = 'playing'; started = Date.now();
      timer = setInterval(drawHead, 1000);
    }
    const secs = () => started ? Math.min(999, Math.floor((Date.now() - started) / 1000)) : 0;
    function drawHead() {
      countEl.textContent = String(lvl.m - flags).padStart(3, '0');
      timeEl.textContent = String(secs()).padStart(3, '0');
    }
    function cellEl(i) { return grid.children[i]; }
    function paint(i) {
      const c = cells[i], d = cellEl(i);
      d.className = 'mc' + (c.open ? ' open' : '') + (c.open && c.n && !c.mine ? ' n' + c.n : '');
      d.textContent = c.flag && !c.open ? '🚩' : c.open && c.mine ? '💣' : c.open && c.n ? c.n : '';
    }
    function reveal(i) {
      const stack = [i];
      while (stack.length) {
        const j = stack.pop(), c = cells[j];
        if (c.open || c.flag) continue;
        c.open = true; opened++; paint(j);
        if (!c.mine && c.n === 0) around(j).forEach(a => { if (!cells[a].open) stack.push(a); });
      }
    }
    function lose(i) {
      state = 'lost';
      if (timer) { clearInterval(timer); timer = null; }
      cells.forEach((c, j) => {
        if (c.mine && !c.flag) { c.open = true; paint(j); }
        else if (c.flag && !c.mine) { cellEl(j).textContent = '❌'; }
      });
      cellEl(i).classList.add('boom');
      face.textContent = '😵';
      tip.innerHTML = rightClicks ? T('Du traff en mine! Klikk på fjeset for å prøve igjen.')
        : T('Du traff en mine! Tips: <b>høyreklikk</b> på ruter du tror skjuler en mine, så setter du et flagg i stedet for å åpne dem.');
      Bus.emit('mine-lose', { level: lvl.id, seconds: secs(), flags });
    }
    function checkWin() {
      if (state !== 'playing' || opened !== cells.length - lvl.m) return;
      state = 'won';
      if (timer) { clearInterval(timer); timer = null; }
      cells.forEach((c, j) => { if (c.mine && !c.flag) { c.flag = true; flags++; paint(j); } });
      drawHead();
      face.textContent = '😎';
      tip.innerHTML = T('Gratulerer, du ryddet alle minene på {0} sekunder! 🎉', secs());
      Bus.emit('mine-win', { level: lvl.id, seconds: secs() });
    }
    function leftClick(i) {
      if (state === 'won' || state === 'lost') return;
      const c = cells[i];
      if (c.flag) return;
      if (state === 'ready') layMines(i);
      if (c.open) {
        /* Venstreklikk på et tall med riktig antall flagg rundt åpner resten */
        const nb = around(i);
        if (!c.n || nb.filter(a => cells[a].flag).length !== c.n) return;
        Bus.emit('mine-chord', {});
        const hit = nb.find(a => cells[a].mine && !cells[a].flag);
        nb.forEach(a => reveal(a));
        if (hit !== undefined) { lose(hit); return; }
      } else {
        Bus.emit('mine-open', {});
        if (c.mine) { reveal(i); lose(i); return; }
        reveal(i);
      }
      checkWin();
    }
    function rightClick(i) {
      if (state === 'won' || state === 'lost') return;
      const c = cells[i];
      if (c.open) return;
      c.flag = !c.flag; flags += c.flag ? 1 : -1; rightClicks++;
      paint(i); drawHead();
      Bus.emit('mine-flag', { on: c.flag });
    }
    grid.addEventListener('contextmenu', e => {
      noMenu(e);
      const d = e.target.closest('.mc');
      if (d) rightClick(+d.dataset.i);
    });
    grid.addEventListener('click', e => {
      /* Ctrl+klikk på Mac er et høyreklikk og håndteres over */
      if (e.button !== 0 || e.ctrlKey) return;
      const d = e.target.closest('.mc');
      if (d) leftClick(+d.dataset.i);
    });
    grid.addEventListener('pointerdown', e => { if (e.button === 0 && (state === 'ready' || state === 'playing')) face.textContent = '😮'; });
    const unpress = () => { if (state === 'ready' || state === 'playing') face.textContent = '🙂'; };
    grid.addEventListener('pointerup', unpress);
    grid.addEventListener('pointerleave', unpress);
    root.querySelector('.mine-box').addEventListener('contextmenu', noMenu);
    face.addEventListener('click', newGame);
    root.querySelector('.m-about').addEventListener('click', () => about('minesveiper', false));
    root.querySelector('.m-lvl').addEventListener('change', e => {
      lvl = LEVELS.find(l => l.id === e.target.value) || LEVELS[0];
      try { localStorage.setItem('dt-mine-niva', lvl.id); } catch (er) { /* ignorer */ }
      newGame();
    });
    win.onKey = e => { if (e.key === 'F2') { e.preventDefault(); newGame(); return true; } };
    /* Vinduet gjøres større når brettet blir større, men aldri større enn skjermen */
    function fitWindow() {
      if (win.maximized) return;
      const area = document.getElementById('windows').getBoundingClientRect();
      const wrap = root.querySelector('.mine-wrap'), box = root.querySelector('.mine-box');
      const w = Math.min(area.width - 16, Math.max(420, box.offsetWidth + 40));
      const h = Math.min(area.height - 16, win.el.offsetHeight - wrap.clientHeight + box.offsetHeight + 30);
      win.el.style.width = w + 'px'; win.el.style.height = h + 'px';
      if (win.el.offsetLeft + w > area.width) win.el.style.left = Math.max(8, area.width - w - 8) + 'px';
      if (win.el.offsetTop + h > area.height) win.el.style.top = Math.max(8, area.height - h - 8) + 'px';
    }
    win.onClosed = () => { mWin = null; if (timer) clearInterval(timer); };
    newGame();
    Bus.emit('mine-app-open', {});
    about('minesveiper', true);
    return win;
  }

  return { openKabal, openMines, about };
})();
window.Spill = Spill;
