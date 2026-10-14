/* pip i øvings-terminalen: installer, list, vis og fjern Python-pakker.
   Bare pakkene som Python-tolken kjenner (cowsay og pyjokes) kan installeres. Kjente pakker som finnes
   på ekte, men ikke her (numpy, pygame …), får en forklaring i stedet for en uforståelig feil. */
const Pip = (() => {
  const KEY = 'dt-pip';
  const SITE = 'c:\\users\\' + T('Elev').toLowerCase() + '\\appdata\\local\\programs\\python\\python312\\lib\\site-packages';
  const CATALOG = {
    cowsay: { v: '6.1', size: '25 kB', summary: 'The famous cowsay for GNU/Linux is now available for python', author: 'Ashwini Chaudhary', home: 'https://github.com/VaasuDevanS/cowsay-python' },
    pyjokes: { v: '0.8.3', size: '47 kB', summary: 'One line jokes for programmers (jokes as a service)', author: 'Ben Nuttall', home: 'https://pyjok.es/' }
  };
  const REAL = ['numpy', 'pandas', 'pygame', 'requests', 'matplotlib', 'flask', 'django', 'scipy', 'pillow', 'opencv-python', 'tensorflow', 'torch', 'beautifulsoup4', 'colorama', 'rich', 'turtle', 'discord.py', 'selenium', 'pytest'];
  let st = null;
  function load() { if (st) return st; try { st = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { st = {}; } if (!st.installed) st.installed = {}; return st; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { /* ignorer */ } }
  function has(name) { return !!load().installed[String(name).toLowerCase()]; }
  const norm = n => String(n || '').toLowerCase().replace(/_/g, '-');
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const emit = (cmd, d) => Bus.emit('pip', Object.assign({ cmd }, d || {}));

  async function install(api, names) {
    const p = s => api.term.print(s + '\n');
    let ok = true;
    const todo = [];
    for (const raw of names) {
      const name = norm(raw.split(/[=<>~!]/)[0]);
      if (!name) continue;
      if (has(name)) { p(`Requirement already satisfied: ${name} in ${SITE} (${load().installed[name]})`); emit('install', { name, ok: true, already: true }); continue; }
      const c = CATALOG[name];
      if (!c) {
        p(`ERROR: Could not find a version that satisfies the requirement ${raw} (from versions: none)`);
        p(`ERROR: No matching distribution found for ${raw}`);
        if (REAL.includes(name)) api.term.print(T('[Øvings-PC: «{0}» er en ekte pakke, men den kan ikke lastes ned her. Prøv cowsay eller pyjokes.]', name) + '\n', 'warn');
        else api.term.print(T('[Øvings-PC: fant ingen pakke som heter «{0}». Sjekk stavemåten. På ekte finnes det falske pakker med nesten like navn, så skriv navnet nøyaktig.]', raw) + '\n', 'warn');
        emit('install', { name, ok: false, real: REAL.includes(name) });
        ok = false; continue;
      }
      todo.push(name);
    }
    for (const name of todo) {
      const c = CATALOG[name];
      p(`Collecting ${name}`); await wait(350);
      p(`  Downloading ${name}-${c.v}-py3-none-any.whl (${c.size})`); await wait(450);
    }
    if (todo.length) {
      p(`Installing collected packages: ${todo.join(', ')}`); await wait(300);
      todo.forEach(n => { load().installed[n] = CATALOG[n].v; });
      save();
      p(`Successfully installed ${todo.map(n => n + '-' + CATALOG[n].v).join(' ')}`);
      todo.forEach(n => emit('install', { name: n, ok: true }));
    }
    return ok;
  }

  async function pip(api) {
    const { out, finish, fail, toks } = api;
    const t = toks.slice();
    const sub = (t.shift() || '').toLowerCase();
    if (!sub || sub === 'help' || sub === '--help' || sub === '-h') {
      out('\nUsage:\n  pip <command> [options]\n\nCommands:\n  install                     Install packages.\n  uninstall                   Uninstall packages.\n  freeze                      Output installed packages in requirements format.\n  list                        List installed packages.\n  show                        Show information about installed packages.\n  help                        Show help for commands.\n');
      return finish(true);
    }
    if (sub === '--version' || sub === '-v' || sub === '-V') { out(`pip 24.0 from ${SITE}\\pip (python 3.12)`); emit('version'); return finish(true); }
    if (sub === 'install') {
      const names = [];
      for (let i = 0; i < t.length; i++) {
        if (t[i] === '-r' || t[i] === '--requirement') {
          const f = t[i + 1]; i++;
          const loc = f ? api.resolve(f) : null;
          if (!loc || loc.virt || !api.isFile(loc)) { emit('install', { ok: false, req: f }); return fail(`ERROR: Could not open requirements file: [Errno 2] No such file or directory: '${f || ''}'`); }
          const lines = (FS.get(loc.id).content || '').split('\n').map(l => l.replace(/#.*/, '').trim()).filter(Boolean);
          emit('requirements', { file: FS.get(loc.id).name, names: lines.map(l => norm(l.split(/[=<>~!]/)[0])) });
          names.push(...lines);
        } else if (!/^-/.test(t[i])) names.push(t[i]);
      }
      if (!names.length) { out('ERROR: You must give at least one requirement to install (see "pip help install")'); return finish(false); }
      const ok = await install(api, names);
      return finish(ok);
    }
    if (sub === 'uninstall') {
      const yes = t.includes('-y') || t.includes('--yes');
      const names = t.filter(x => !/^-/.test(x)).map(norm);
      if (!names.length) { out('ERROR: You must give at least one requirement to uninstall (see "pip help uninstall")'); return finish(false); }
      for (const name of names) {
        if (!has(name)) { out(`WARNING: Skipping ${name} as it is not installed.`, 'warn'); continue; }
        const v = load().installed[name];
        api.term.print(`Found existing installation: ${name} ${v}\nUninstalling ${name}-${v}:\n  Would remove:\n    ${SITE}\\${name}\\*\n`);
        if (!yes) {
          let ans = '';
          try { ans = await api.term.readLine('Proceed (Y/n)? '); } catch (e) { return finish(false); }
          if (/^n/i.test(ans.trim())) { emit('uninstall', { name, ok: false }); continue; }
        }
        delete load().installed[name]; save();
        api.term.print(`  Successfully uninstalled ${name}-${v}\n`);
        emit('uninstall', { name, ok: true });
      }
      return finish(true);
    }
    if (sub === 'list') {
      const rows = [['pip', '24.0'], ['setuptools', '69.5.1']].concat(Object.entries(load().installed)).sort((a, b) => a[0].localeCompare(b[0]));
      out('Package    Version\n---------- -------');
      rows.forEach(([n, v]) => out(n.padEnd(10) + ' ' + v));
      emit('list', { names: Object.keys(load().installed) });
      return finish(true);
    }
    if (sub === 'freeze') { Object.entries(load().installed).forEach(([n, v]) => out(`${n}==${v}`)); emit('freeze', { names: Object.keys(load().installed) }); return finish(true); }
    if (sub === 'show') {
      const name = norm(t.find(x => !/^-/.test(x)));
      if (!name || !has(name)) { out(`WARNING: Package(s) not found: ${name || ''}`, 'warn'); emit('show', { name, ok: false }); return finish(false); }
      const c = CATALOG[name];
      out(`Name: ${name}\nVersion: ${load().installed[name]}\nSummary: ${c.summary}\nHome-page: ${c.home}\nAuthor: ${c.author}\nLicense: MIT\nLocation: ${SITE}\nRequires:\nRequired-by:`);
      emit('show', { name, ok: true });
      return finish(true);
    }
    return fail(`ERROR: unknown command "${sub}"`);
  }
  function reset() { st = { installed: {} }; save(); }
  function list() { return Object.assign({}, load().installed); }
  return { pip, has, reset, list, CATALOG };
})();
window.Pip = Pip;
window.TermExt = window.TermExt || {};
TermExt.pip = api => Pip.pip(api);
TermExt.pip3 = api => Pip.pip(api);
