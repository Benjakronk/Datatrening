(async () => {
  const { ok, tick, play, master, log } = W;
  const K = ['Denne PC-en', 'Dokumenter', 'Kode'];
  let t0 = null;
  const term = () => { if (!t0 || !Terminal.instances.includes(t0) || !WM.list().some(w => w.term === t0)) { t0 = Terminal.open(); } return t0; };
  async function run(cmd, inputs = []) {
    const t = term();
    const p = t.submit(cmd);
    for (const v of inputs) {
      for (let k = 0; k < 200 && !t.reading; k++) await tick(10);
      if (!t.reading) break;
      t.input.value = v; t.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await tick(5);
    }
    await p; await tick(20);
  }
  const out = () => term().root.textContent;
  function write(name, content, folder = K) {
    const f = FS.resolve([...folder, name]);
    if (f) FS.write(f.id, content); else { const pf = FS.ensureFolder(folder); FS.createFile(pf.id, name, content); }
    Bus.emit('kode-save', { name, content });
  }
  const kd = 'cd ~\\Documents\\Kode';

  try {
    await tick(600);
    document.querySelectorAll('.dlg .btn.primary').forEach(b => b.click());
    W.teoriAlle();
    if (window.Firmaportal) Firmaportal.markInstalled('vscode');

    /* ---------- p8 ---------- */
    const QUIZ1 = 'svar = input("Hva er hovedstaden i Norge? ")\nif svar == "Oslo":\n    print("Riktig!")\nelse:\n    print("Feil")\n';
    await play('p8', 'p8o1', [
      ['Lag filen', async () => write('quiz.py', '')],
      ['Skriv et program', async () => write('quiz.py', QUIZ1)],
      ['svar Oslo', async () => { await run(kd); await run('python quiz.py', ['Oslo']); }],
      ['noe annet', async () => run('python quiz.py', ['Bergen'])],
      ['lower()', async () => write('quiz.py', QUIZ1.replace('if svar == "Oslo"', 'if svar.lower() == "oslo"'))]
    ]);
    const KAR = 'poeng = int(input("Poeng: "))\nif poeng >= 90:\n    print("Karakter 6")\nelif poeng >= 75:\n    print("Karakter 5")\nelif poeng >= 60:\n    print("Karakter 4")\nelif poeng >= 45:\n    print("Karakter 3")\nelif poeng >= 30:\n    print("Karakter 2")\nelse:\n    print("Karakter 1")\n';
    const KARFEIL = KAR.replace('poeng >= 75', 'poeng >= 95');
    await play('p8', 'p8o2', [
      ['Lag <code>karakter.py</code>'.replace(/<[^>]+>/g, ''), async () => write('karakter.py', KARFEIL)],
      ['Kjør programmet', async () => { await run(kd); await run('python karakter.py', ['80']); }],
      ['tester nå', async () => write('karakter.py', KAR)]
    ]);
    await master('p8', [
      async () => write('aldersgrense.py', 'alder = int(input("Alder: "))\nif alder < 13:\n    print("For ung til sosiale medier")\nelse:\n    print("Velkommen!")\n'),
      async () => { await run(kd); await run('python aldersgrense.py', ['15']); }
    ]);

    /* ---------- p9 ---------- */
    const GT = 'tall = int(input("Hvilken gangetabell? "))\nfor i in range(1, 11):\n    print(i, "x", tall, "=", i * tall)\n';
    await play('p9', 'p9o1', [
      ['Lag gangetabell.py', async () => write('gangetabell.py', GT.replace('range(1, 11)', 'range(1, 10)'))],
      ['Kjør programmet og velg', async () => { write('gangetabell.py', GT); await run(kd); await run('python gangetabell.py', ['7']); }],
      ['tester med 7 og 12', async () => write('gangetabell.py', GT)]
    ]);
    const GJ = 'import random\nhemmelig = random.randint(1, 100)\ngjett = 0\nforsok = 0\nwhile gjett != hemmelig:\n    gjett = int(input("Gjett: "))\n    forsok = forsok + 1\n    if gjett < hemmelig:\n        print("For lavt")\n    elif gjett > hemmelig:\n        print("For høyt")\nprint("Riktig!")\nprint("Du brukte", forsok, "forsøk")\n';
    await play('p9', 'p9o2', [
      ['Lag <code>gjett.py</code>'.replace(/<[^>]+>/g, ''), async () => write('gjett.py', GJ)],
      ['Spill til', async () => { await run(kd); const ins = []; for (let i = 1; i <= 100; i++) ins.push(String(i)); await run('python gjett.py', ins); }]
    ]);
    await master('p9', [
      async () => write('nedtelling.py', 'for i in range(10, 0, -1):\n    print(i)\nprint("Takeoff!")\n'),
      async () => { await run(kd); await run('python nedtelling.py'); }
    ]);

    /* ---------- p10 ---------- */
    const HL = 'liste = []\nwhile True:\n    vare = input("Vare: ")\n    if vare == "":\n        break\n    liste.append(vare)\nprint("Du skal kjøpe", len(liste), "ting:")\nfor v in liste:\n    print("-", v)\n';
    await play('p10', 'p10o1', [
      ['Lag <code>handleliste.py</code>'.replace(/<[^>]+>/g, ''), async () => write('handleliste.py', HL)],
      ['Kjør programmet', async () => { await run(kd); await run('python handleliste.py', ['melk', 'egg', '']); }]
    ]);
    const ST = 'karakterer = [5, 3, 6, 4, 4, 5]\nprint("Sum:", sum(karakterer))\nprint("Antall:", len(karakterer))\nprint("Snitt:", sum(karakterer) / len(karakterer))\nprint("Høyest:", max(karakterer))\nprint("Lavest:", min(karakterer))\n';
    await play('p10', 'p10o2', [
      ['Åpne <code>statistikk.py</code>'.replace(/<[^>]+>/g, ''), async () => { await run(kd); await run('code statistikk.py'); }],
      ['summen', async () => write('statistikk.py', ST)],
      ['høyeste', async () => run('python statistikk.py')],
      ['Legg til to', async () => write('statistikk.py', ST.replace('[5, 3, 6, 4, 4, 5]', '[5, 3, 6, 4, 4, 5, 2, 6]'))]
    ]);
    await master('p10', [
      async () => write('favoritter.py', 'fav = ["pizza", "taco", "sushi"]\nfor f in fav:\n    print(f)\nprint("Antall:", len(fav))\n'),
      async () => { await run(kd); await run('python favoritter.py'); }
    ]);

    /* ---------- p11 ---------- */
    const AR = 'def areal(lengde, bredde):\n    return lengde * bredde\n\nprint(areal(4, 5))\nprint(areal(3, 7))\n';
    await play('p11', 'p11o1', [
      ['Lag <code>areal.py</code>'.replace(/<[^>]+>/g, ''), async () => write('areal.py', AR.replace('return lengde * bredde', 'print(lengde * bredde)\n    return lengde * bredde'))],
      ['Kjør programmet', async () => { await run(kd); await run('python areal.py'); }],
      ['kaller nå', async () => write('areal.py', AR)],
      ['omkrets', async () => write('areal.py', AR + '\ndef omkrets(lengde, bredde):\n    return 2 * lengde + 2 * bredde\n\nprint(omkrets(4, 5))\n')]
    ]);
    const HILS = 'def hils(navn):\n    print("*************")\n    print("Hei, " + navn + "!")\n    print("Velkommen til kodeklubben.")\n    print("*************")\n\nhils("Ada")\nhils("Linus")\nhils("Grace")\n';
    await play('p11', 'p11o2', [
      ['Åpne og kjør', async () => { await run(kd); await run('python velkommen.py'); }],
      ['Lag en funksjon', async () => write('velkommen.py', HILS)],
      ['nøyaktig lik', async () => run('python velkommen.py')],
      ['koding', async () => write('velkommen.py', HILS.replace('kodeklubben', 'koding'))]
    ]);
    await master('p11', [
      async () => write('konverter.py', 'def celsius_til_fahrenheit(c):\n    return c * 9 / 5 + 32\n\nprint(celsius_til_fahrenheit(20))\n'),
      async () => { await run(kd); await run('python konverter.py'); }
    ]);

    /* ---------- p12 ---------- */
    await play('p12', 'p12o1', [
      ['Kjør <code>snitt.py</code>'.replace(/<[^>]+>/g, ''), async () => { await run(kd); await run('python snitt.py'); }],
      ['Legg inn en linje', async () => { write('snitt.py', 'tall = [4, 8, 6, 2]\nsum = 0\nfor t in tall:\n    sum = sum + t\nprint(sum, len(tall))\nsnitt = sum / 2\nprint("Snittet er", snitt)\n'); await run('python snitt.py'); }],
      ['Rett det', async () => { write('snitt.py', 'tall = [4, 8, 6, 2]\nsum = 0\nfor t in tall:\n    sum = sum + t\nsnitt = sum / len(tall)\nprint("Snittet er", snitt)\n'); await run('python snitt.py'); }]
    ]);
    const TA = 'try:\n    alder = int(input("Hvor gammel er du? "))\n    print("Om ti år er du", alder + 10)\nexcept ValueError:\n    print("Skriv alderen med tall, for eksempel 14.")\n';
    await play('p12', 'p12o2', [
      ['svar <b>ti</b>'.replace(/<[^>]+>/g, '').slice(0, 10), async () => { await run(kd); await run('python tialar.py', ['ti']); }],
      ['Pakk inn', async () => write('tialar.py', TA)],
      ['Kjør det og svar', async () => run('python tialar.py', ['ti'])],
      ['while True', async () => write('tialar.py', 'while True:\n    try:\n        alder = int(input("Alder: "))\n        break\n    except ValueError:\n        print("Skriv alderen med tall.")\nprint("Om ti år er du", alder + 10)\n')]
    ]);
    await master('p12', [
      async () => { await run(kd); await run('python fikk4.py'); },
      async () => write('fikk4.py', 'karakterer = [2, 4, 5, 3, 6, 4, 1]\nantall = 0\nfor k in karakterer:\n    if k >= 4:\n        antall = antall + 1\nprint("Fikk 4 eller bedre:", antall)\n')
    ]);

    /* ---------- p13 ---------- */
    await play('p13', 'p13o1', [
      ['Lag <code>dagbok.py</code>'.replace(/<[^>]+>/g, ''), async () => write('dagbok.py', 'tekst = input("Hva gjorde du i dag? ")\nwith open("dagbok.txt", "a") as f:\n    f.write(tekst + "\\n")\nprint("Lagret!")\n')],
      ['to ganger', async () => { await run(kd); await run('python dagbok.py', ['Spilte fotball']); await run('python dagbok.py', ['Gjorde lekser']); }],
      ['cat dagbok.txt', async () => run('cat dagbok.txt')]
    ]);
    ok(/Spilte fotball[\s\S]*Gjorde lekser/.test(FS.resolve([...K, 'dagbok.txt']) ? FS.resolve([...K, 'dagbok.txt']).content : ''), 'dagbok.txt har begge linjene (a-modus virker)');
    await play('p13', 'p13o2', [
      ['cat poeng.txt', async () => { await run(kd); await run('cat poeng.txt'); }],
      ['Lag <code>poeng.py</code>'.replace(/<[^>]+>/g, ''), async () => write('poeng.py', 'total = 0\nwith open("poeng.txt") as f:\n    for linje in f:\n        navn, p = linje.strip().split(";")\n        total = total + int(p)\n        print(navn, p)\nprint("Totalt:", total)\n')],
      ['vinneren', async () => { write('poeng.py', 'total = 0\nbeste = -1\nbeste_navn = ""\nwith open("poeng.txt") as f:\n    for linje in f:\n        navn, p = linje.strip().split(";")\n        total = total + int(p)\n        if int(p) > beste:\n            beste = int(p)\n            beste_navn = navn\nprint("Totalt:", total)\nprint("Vinneren er", beste_navn)\n'); await run('python poeng.py'); }]
    ]);
    await master('p13', [
      async () => write('temperatur.py', 'tall = []\nwith open("temperaturer.txt") as f:\n    for l in f:\n        tall.append(int(l.strip()))\nsnitt = sum(tall) / len(tall)\nwith open("rapport.txt", "w") as f:\n    f.write("Snitt: " + str(snitt) + "\\n")\n'),
      async () => { await run(kd); await run('python temperatur.py'); }
    ]);

    /* ---------- p14 Git ---------- */
    if (window.Firmaportal) Firmaportal.resetApp('git');
    if (window.Git) Git.resetConfig();
    await play('p14', 'p14o1', [
      ['git --version i terminalen', async () => { await run('git --version'); ok(/not recognized/.test(out()), 'git er ukjent før installasjon'); }],
      ['Installer', async () => { Firmaportal.markInstalled('git'); Bus.emit('install-done', { id: 'git' }); }],
      ['igjen. Nå svarer', async () => { await run('git --version'); ok(/git version 2\./.test(out()), 'git --version svarer'); }],
      ['Fortell Git', async () => { await run('git config --global user.name "Ola Nordmann"'); await run('git config --global user.email "ola@skolen.no"'); }],
      ['Lag prosjektmappen', async () => { await run(kd); await run('mkdir spill'); await run('cd spill'); }],
      ['git init', async () => { await run('git init'); ok(/Initialized empty Git repository in C:\/Users\/Elev\/Documents\/Kode\/spill\/\.git\//.test(out()), 'git init skriver ekte melding'); }],
      ['Lag filen', async () => run('Set-Content spill.py \'print("Velkommen til spillet!")\'')],
      ['Untracked', async () => { await run('git status'); ok(/Untracked files:[\s\S]*spill\.py/.test(out()), 'status viser untracked'); }],
      ['git add spill.py', async () => { await run('git add spill.py'); await run('git status'); ok(/Changes to be committed:[\s\S]*new file:\s+spill\.py/.test(out()), 'status viser staged'); }],
      ['Lagre den første', async () => { await run('git commit -m "Første versjon av spillet"'); ok(/\[main \(root-commit\) [0-9a-f]{7}\] Første versjon av spillet/.test(out()), 'commit-melding som ekte git'); }],
      ['Se historikken', async () => run('git log')]
    ]);
    const SP = [...K, 'spill'];
    const wSpill = c => write('spill.py', c, SP);
    await play('p14', 'p14o2', [
      ['Åpne <code>spill.py</code>'.replace(/<[^>]+>/g, ''), async () => wSpill('print("Velkommen til spillet!")\nprint("Du har 3 liv.")\n')],
      ['modified', async () => { await run('cd ~\\Documents\\Kode\\spill'); await run('git status'); ok(/modified:\s+spill\.py/.test(out()), 'status viser modified'); }],
      ['git diff', async () => { await run('git diff'); ok(/\+print\("Du har 3 liv\."\)/.test(out()), 'diff viser + linje'); }],
      ['Lagre en ny', async () => { await run('git add spill.py'); await run('git commit -m "Legg til liv"'); }],
      ['ødelegger', async () => wSpill('tull\n')],
      ['git restore', async () => run('git restore spill.py')],
      ['--oneline', async () => run('git log --oneline')]
    ]);
    await play('p14', 'p14o3', [
      ['loggfil', async () => { await run('cd ~\\Documents\\Kode\\spill'); await run('Set-Content logg.txt "test"'); }],
      ['står som untracked', async () => run('git status')],
      ['.gitignore</code> med'.replace(/<[^>]+>/g, ''), async () => run('Set-Content .gitignore "logg.txt"')],
      ['igjen. Nå er logg', async () => { await run('git status'); const o = out().split('git status').pop(); ok(/\.gitignore/.test(o) && !/logg\.txt/.test(o.split('Untracked files:').pop() || ''), '.gitignore skjuler logg.txt'); }],
      ['Overse loggfiler', async () => { await run('git add .gitignore'); await run('git commit -m "Overse loggfiler"'); }]
    ]);
    await master('p14', [
      async () => { await run(kd); await run('mkdir mesterrepo'); await run('cd mesterrepo'); await run('git init'); },
      async () => { await run('Set-Content a.py "print(1)"'); await run('git add .'); await run('git commit -m "En"'); },
      async () => { await run('Set-Content b.py "print(2)"'); await run('git add .'); await run('git commit -m "To"'); await run('git status'); }
    ]);
    ok(/nothing to commit, working tree clean/.test(out()), 'git status: working tree clean');
    { const cfg = Git.config(); Git.resetConfig(); await run('Set-Content c.py "print(3)"'); await run('git add c.py'); await run('git commit -m "Tre"'); ok(/Author identity unknown/.test(out()), 'commit uten navn gir Author identity unknown'); await run('git config --global user.name "' + cfg['user.name'] + '"'); }

    /* ---------- p15 pip ---------- */
    await play('p15', 'p15o1', [
      ['Lag <code>ku.py</code>'.replace(/<[^>]+>/g, ''), async () => { write('ku.py', 'import cowsay\ncowsay.cow("Hei fra Python!")\n'); await run(kd); await run('python ku.py'); ok(/ModuleNotFoundError: No module named 'cowsay'/.test(out()), 'import uten pakke gir ModuleNotFoundError'); }],
      ['pip install cowsay', async () => { await run('pip install cowsay'); ok(/Successfully installed cowsay-6\.1/.test(out()), 'pip install skriver Successfully installed'); }],
      ['igjen', async () => { await run('python ku.py'); ok(/\(oo\)/.test(out()), 'cowsay tegner kua'); }],
      ['pip list', async () => run('pip list')],
      ['pip show', async () => run('pip show cowsay')],
      ['cowsey', async () => { await run('pip install cowsey'); ok(/No matching distribution found for cowsey/.test(out()), 'feilstavet pakke finnes ikke'); }]
    ]);
    const VS = [...K, 'vitser'];
    await play('p15', 'p15o2', [
      ['Gå til mappen', async () => { await run('cd ~\\Documents\\Kode\\vitser'); await run('python vits.py'); }],
      ['requirements.txt</code> i mappen'.replace(/<[^>]+>/g, ''), async () => write('requirements.txt', 'cowsay\npyjokes\n', VS)],
      ['pip install -r', async () => run('pip install -r requirements.txt')],
      ['igjen', async () => run('python vits.py')],
      ['pip freeze', async () => { await run('pip freeze'); ok(/cowsay==6\.1/.test(out()), 'pip freeze'); }],
      ['pip uninstall', async () => run('pip uninstall pyjokes', ['Y'])]
    ]);
    await master('p15', [
      async () => write('requirements.txt', 'cowsay\n', [...K, 'mesterpakker']),
      async () => { await run('cd ~\\Documents\\Kode\\mesterpakker'); await run('pip install -r requirements.txt'); await run('python hilsen.py'); }
    ]);
    await run('python -m pip --version');
    ok(/pip 24\.0 from/.test(out()), 'python -m pip virker');

    /* ---------- mesterprøver som skal stå urørt ved start ---------- */
    for (const k of ['p8', 'p9', 'p10', 'p11', 'p12', 'p13']) { const kk = KURS_PROG.find(x => x.id === k); ok(!!kk.mesterprove && !!kk.ekte, k + ' har mesterprøve og ekte'); }
    ok(KURS_PROG.filter(k => k.del === 'Ekspert').map(k => k.id).join() === 'p14,p15', 'Ekspert-delen har git og pip');
    Coach.render(); W.P().tab = 'kurs'; Coach.render(); await tick(30);
    ok(document.querySelectorAll('#coach-body .kurs-del').length === 2, 'to deloverskrifter i kurslisten');
  } catch (e) { log('EXCEPTION ' + (e && e.stack)); }
  W.done();
})();
