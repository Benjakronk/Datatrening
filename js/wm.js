/* Vindusbehandler: vinduer, oppgavelinje og Start-meny */
const WM = (() => {
  const wins = [];
  let zTop = 100, active = null, counter = 0;
  let launchVia = null;
  const PIN_KEY = 'dt-pinned' + (window.DT_PAGE ? '-' + window.DT_PAGE : '');
  let PINNED = (() => { try { return JSON.parse(localStorage.getItem(PIN_KEY) || 'null') || null; } catch (e) { return null; } })() || (window.DT_PINNED || ['explorer', 'skriv', 'nettleser', 'innlevering']).slice();
  function savePinned() { try { localStorage.setItem(PIN_KEY, JSON.stringify(PINNED)); } catch (e) { /* ignorer */ } }
  const APPNAMES = { explorer: 'Filutforsker', skriv: 'Skriv', nettleser: 'Nettleser', innlevering: 'Innleveringer', papirkurv: 'Papirkurv', bilder: 'Bilder', viewer: 'Filvisning', innstillinger: 'Innstillinger', taskmgr: 'Oppgavebehandling', terminal: 'Terminal', kode: 'Kode', notater: 'Notater', epost: 'E-post', skrivetrening: 'Skrivetrening', firmaportal: 'Firmaportalen' };
  const FS_ICON = '<svg viewBox="0 0 16 16" width="18" height="18"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="#333" stroke-width="1.6"/></svg>';

  const layer = () => document.getElementById('windows');
  const MAX_WINDOWS = 12;
  /* Sjekk før et program åpner et vindu: for mange vinduer gjør siden treg */
  function full() {
    if (wins.length < MAX_WINDOWS) return false;
    Toast.show('Du har for mange vinduer åpne (maks ' + MAX_WINDOWS + '). Lukk noen vinduer først.');
    Bus.emit('window-limit', {});
    return true;
  }

  function create(o) {
    if (wins.length >= MAX_WINDOWS + 1) throw new Error('For mange vinduer');
    const id = ++counter;
    const elm = document.createElement('div');
    elm.className = 'win';
    elm.tabIndex = -1;
    const area = layer().getBoundingClientRect();
    const w = Math.min(o.width || 900, area.width - 20), h = Math.min(o.height || 560, area.height - 20);
    const off = (wins.length % 6) * 28;
    const x = o.x != null ? o.x : Math.max(8, Math.min(area.width - w - 8, 70 + off));
    const y = o.y != null ? o.y : Math.max(8, Math.min(area.height - h - 8, 30 + off));
    elm.style.left = x + 'px'; elm.style.top = y + 'px'; elm.style.width = w + 'px'; elm.style.height = h + 'px';
    elm.innerHTML = `<div class="win-title"><span class="win-icon">${Icons.app(o.app, 18)}</span><span class="win-name"></span><div class="win-ctrl"><button class="wc min" title="Minimer">&#8212;</button><button class="wc max" title="Maksimer">&#9744;</button><button class="wc close" title="Lukk">&#10005;</button></div></div><div class="win-body"></div>`;
    const win = { id, app: o.app, el: elm, title: o.title || '', maximized: false, minimized: false, onClose: o.onClose, onKey: null, data: {} };
    elm.querySelector('.win-name').textContent = win.title;
    if (o.body) elm.querySelector('.win-body').appendChild(o.body);
    layer().appendChild(elm);
    wins.push(win);

    elm.addEventListener('pointerdown', () => focus(win, 'click'), true);
    const tb = elm.querySelector('.win-title');
    tb.addEventListener('dblclick', e => { if (e.target.closest('.wc')) return; toggleMax(win); });
    tb.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation();
      Ctx.show(e.clientX, e.clientY, [
        { label: 'Gjenopprett', disabled: !win.maximized, action: () => toggleMax(win) },
        { label: 'Minimer', action: () => minimize(win) },
        { label: 'Maksimer', disabled: win.maximized, action: () => toggleMax(win) },
        '-',
        { label: 'Lukk', kbd: 'Alt+F4', action: () => close(win, 'menu') }
      ], 'window', 'tittellinjen til vinduet «' + win.title + '»');
    });
    elm.querySelector('.wc.min').addEventListener('click', e => { e.stopPropagation(); minimize(win); });
    elm.querySelector('.wc.max').addEventListener('click', e => { e.stopPropagation(); toggleMax(win); });
    elm.querySelector('.wc.close').addEventListener('click', e => { e.stopPropagation(); close(win); });
    tb.addEventListener('pointerdown', e => {
      if (e.target.closest('.wc') || win.maximized || e.button !== 0) return;
      const sx = e.clientX, sy = e.clientY, ox = elm.offsetLeft, oy = elm.offsetTop;
      let moved = false;
      /* Vindussnapping: dra vinduet mot en kant, så legger det seg halvt eller helt, som i Windows */
      let snap = null;
      const ghost = el('<div class="snap-ghost hidden"></div>');
      layer().appendChild(ghost);
      const mv = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
        elm.style.left = Math.max(-elm.offsetWidth + 120, Math.min(area.width - 60, ox + dx)) + 'px';
        elm.style.top = Math.max(0, Math.min(area.height - 40, oy + dy)) + 'px';
        const r = layer().getBoundingClientRect();
        const px = ev.clientX - r.left, py = ev.clientY - r.top;
        snap = py <= 4 ? 'max' : px <= 4 ? 'left' : px >= r.width - 4 ? 'right' : null;
        ghost.classList.toggle('hidden', !snap);
        if (snap === 'max') { ghost.style.cssText = 'left:0;top:0;width:100%;height:100%'; }
        else if (snap === 'left') { ghost.style.cssText = 'left:0;top:0;width:50%;height:100%'; }
        else if (snap === 'right') { ghost.style.cssText = 'left:50%;top:0;width:50%;height:100%'; }
      };
      const up = () => {
        document.removeEventListener('pointermove', mv);
        document.removeEventListener('pointerup', up);
        ghost.remove();
        if (snap) {
          if (snap === 'max') { if (!win.maximized) toggleMax(win); }
          else {
            if (win.maximized) toggleMax(win);
            elm.style.left = (snap === 'left' ? 0 : area.width / 2) + 'px';
            elm.style.top = '0px'; elm.style.width = (area.width / 2) + 'px'; elm.style.height = area.height + 'px';
          }
          Bus.emit('window-snap', { app: win.app, side: snap });
        }
        if (moved) Bus.emit('window-move', { app: win.app });
      };
      document.addEventListener('pointermove', mv);
      document.addEventListener('pointerup', up);
    });

    const via = launchVia; launchVia = null;
    focus(win, 'open');
    Bus.emit('window-open', { app: o.app, title: win.title, id, via });
    return win;
  }

  function setTitle(win, t) { win.title = t; win.el.querySelector('.win-name').textContent = t; }
  function focus(win, via) {
    if (win.minimized) { win.minimized = false; win.el.classList.remove('minimized'); }
    win.el.style.zIndex = ++zTop;
    const changed = active !== win;
    wins.forEach(x => x.el.classList.toggle('inactive', x !== win));
    active = win;
    if (changed) {
      if (!win.el.contains(document.activeElement)) win.el.focus({ preventScroll: true });
      Bus.emit('window-focus', { app: win.app, via: via || 'click' });
    }
    renderTaskbar();
  }
  function minimize(win) {
    win.minimized = true; win.el.classList.add('minimized');
    if (active === win) { active = null; win.el.classList.add('inactive'); }
    Bus.emit('window-min', { app: win.app });
    renderTaskbar();
  }
  function toggleMax(win) {
    win.maximized = !win.maximized;
    win.el.classList.toggle('maximized', win.maximized);
    const b = win.el.querySelector('.wc.max');
    b.innerHTML = win.maximized ? '&#10697;' : '&#9744;';
    b.title = win.maximized ? 'Gjenopprett ned' : 'Maksimer';
    Bus.emit(win.maximized ? 'window-max' : 'window-restore', { app: win.app });
  }
  async function close(win, via) {
    if (win.closing) return;
    win.closing = true;
    try {
      if (win.onClose) { const ok = await win.onClose(); if (ok === false) return; }
    } finally { win.closing = false; }
    win.el.remove();
    const i = wins.indexOf(win); if (i >= 0) wins.splice(i, 1);
    if (active === win) active = null;
    if (win.onClosed) win.onClosed();
    Bus.emit('window-close', { app: win.app, title: win.title, via: via || 'button' });
    renderTaskbar();
  }
  function showDesktop() { wins.forEach(w => { if (!w.minimized) minimize(w); }); Bus.emit('show-desktop', {}); }
  function list(app) { return app ? wins.filter(w => w.app === app) : wins.slice(); }
  function getActive() { return active; }
  function deactivate() { if (active) { active.el.classList.add('inactive'); active = null; renderTaskbar(); } }

  /* ---------- Oppgavelinje ---------- */
  function renderTaskbar() {
    const c = document.getElementById('taskbar-center');
    if (!c) return;
    c.innerHTML = '';
    const start = el(`<button class="tb-app" id="start-btn" title="Start">${Icons.app('start', 22)}</button>`);
    start.addEventListener('click', e => { e.stopPropagation(); toggleStart(); });
    start.addEventListener('contextmenu', e => {
      e.preventDefault(); e.stopPropagation(); hideStart();
      Ctx.show(e.clientX, e.clientY - 8, [
        { label: 'Programmer og funksjoner', action: () => Apps.launch('innstillinger') },
        { label: 'Oppgavebehandling', icon: Icons.app('taskmgr', 16), action: () => Apps.launch('taskmgr') },
        { label: 'Innstillinger', icon: Icons.app('innstillinger', 16), action: () => Apps.launch('innstillinger') },
        { label: 'Filutforsker', icon: Icons.app('explorer', 16), action: () => Apps.launch('explorer') },
        '-',
        { label: 'Slå av eller logg av', sub: [
          { label: 'Logg av', action: () => Toast.show('På en ekte PC logger dette deg av. Øvings-PC-en fortsetter.') },
          { label: 'Slå av', action: () => Toast.show('På en ekte PC slår dette av maskinen. Husk å lagre først!') },
          { label: 'Start på nytt', action: () => Toast.show('På en ekte PC starter maskinen på nytt nå.') }
        ] },
        { label: 'Skrivebord', action: showDesktop }
      ], 'start', 'Start-knappen');
    });
    c.appendChild(start);
    const apps = PINNED.filter(a => !window.Apps || Apps.available(a));
    wins.forEach(w => { if (!apps.includes(w.app)) apps.push(w.app); });
    apps.forEach(app => {
      const ws = list(app);
      const b = el(`<button class="tb-app${ws.length ? ' open' : ''}${active && active.app === app ? ' active' : ''}" title="${esc(APPNAMES[app] || app)}">${Icons.app(app, 24)}</button>`);
      b.addEventListener('click', e => {
        e.stopPropagation();
        hideStart();
        Bus.emit('taskbar-click', { app });
        if (!ws.length) { Apps.launch(app, { via: 'taskbar' }); return; }
        if (active && ws.includes(active) && !active.minimized) minimize(active);
        else focus(ws[ws.length - 1], 'taskbar');
      });
      b.addEventListener('contextmenu', e => {
        e.preventDefault(); e.stopPropagation(); hideStart();
        const pinned = PINNED.includes(app);
        const items = [{ label: appName(app), icon: Icons.app(app, 16), action: () => Apps.launch(app, { via: 'taskbar-menu' }) }, '-'];
        items.push({ label: pinned ? 'Løsne fra oppgavelinjen' : 'Fest til oppgavelinjen', action: () => { if (pinned) PINNED = PINNED.filter(a => a !== app); else PINNED.push(app); savePinned(); Bus.emit('pin', { app, pinned: !pinned }); renderTaskbar(); } });
        if (ws.length) items.push('-', { label: ws.length > 1 ? 'Lukk alle vinduer' : 'Lukk vindu', action: () => ws.forEach(w => close(w, 'taskbar-menu')) });
        Ctx.show(e.clientX, e.clientY - 8, items, 'taskbar-app', appName(app) + '-ikonet i oppgavelinjen');
      });
      c.appendChild(b);
    });
    const bar = document.getElementById('taskbar');
    if (!bar._bound) {
      bar._bound = true;
      bar.addEventListener('contextmenu', e => {
        if (e.target.closest('.tb-app')) return;
        e.preventDefault();
        Ctx.show(e.clientX, e.clientY - 8, [
          { label: 'Oppgavebehandling', icon: Icons.app('taskmgr', 16), action: () => Apps.launch('taskmgr') },
          '-',
          { label: 'Innstillinger for oppgavelinjen', icon: Icons.app('innstillinger', 16), action: () => Apps.launch('innstillinger') },
          '-',
          { label: 'Vis skrivebordet', action: showDesktop }
        ], 'taskbar', 'oppgavelinjen');
      });
      const right = document.getElementById('taskbar-right');
      const fsb = el(`<button class="tb-app fs-btn" title="Fullskjerm av/på (F11)">${FS_ICON}</button>`);
      fsb.addEventListener('click', e => { e.stopPropagation(); if (window.Fullscreen) Fullscreen.toggle(); });
      right.insertBefore(fsb, right.firstChild);
    }
  }

  /* ---------- Start-meny ---------- */
  function toggleStart() { const m = document.getElementById('startmenu'); if (m.classList.contains('hidden')) showStart(); else hideStart(); }
  function showStart() {
    const m = document.getElementById('startmenu');
    const g = m.querySelector('.sm-grid');
    g.innerHTML = '';
    const apps = [['explorer', 'Filutforsker'], ['skriv', 'Skriv'], ['nettleser', 'Nettleser'], ['innlevering', 'Innleveringer'], ['bilder', 'Bilder'], ['papirkurv', 'Papirkurv'], ['innstillinger', 'Innstillinger']];
    if (window.Notater) apps.splice(2, 0, ['notater', 'Notater']);
    if (window.Epost) apps.splice(3, 0, ['epost', 'E-post']);
    if (window.Skrivetrening) apps.push(['skrivetrening', 'Skrivetrening']);
    if (window.Kode) apps.splice(1, 0, ['kode', 'Kode']);
    if (window.Terminal) apps.splice(2, 0, ['terminal', 'Terminal']);
    if (window.Firmaportal) apps.push(['firmaportal', 'Firmaportalen']);
    apps.filter(([app]) => !window.Apps || Apps.available(app)).forEach(([app, name]) => {
      const a = el(`<div class="sm-app">${Icons.app(app, 36)}<span>${esc(name)}</span></div>`);
      a.addEventListener('click', () => { hideStart(); Apps.launch(app, { via: 'startmenu' }); });
      g.appendChild(a);
    });
    m.classList.remove('hidden');
    Bus.emit('startmenu-open', {});
  }
  function hideStart() { document.getElementById('startmenu').classList.add('hidden'); }

  function appName(app) { return APPNAMES[app] || app; }
  function setLaunchVia(v) { launchVia = v; }

  return { create, setTitle, focus, minimize, toggleMax, close, list, getActive, deactivate, renderTaskbar, toggleStart, showStart, hideStart, showDesktop, appName, setLaunchVia, full, MAX_WINDOWS, pinned: () => PINNED.slice() };
})();
