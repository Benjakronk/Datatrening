/* Programmering videre (valg, løkker, lister, funksjoner, feilsøking, filer) og Ekspert (Git og pip).
   Legger seg etter oppdrag-prog.js og bruker hjelperne derfra (ran, innhold, noenFil, cmd, ends, same, P_KODE).
   Mange sjekker kjører elevens program selv med bestemte svar (pyTest), så vi ser at programmet
   virker, ikke bare at det inneholder riktige ord. */
(function () {
  const DEL = 'Programmering videre';
  const DEL_DESC = 'Valg, løkker, lister, funksjoner, feilsøking og filer. Det dere lærer i timene, øvd på egen hånd.';
  const DEL2 = 'Ekspert';
  const DEL2_DESC = 'Verktøy som programmerere bruker hver dag: versjonskontroll med Git og pakker med pip.';
  const kode = name => innhold(P_KODE, name);
  const P_SPILL = [...P_KODE, 'spill'];
  const P_VITS = [...P_KODE, 'vitser'];

  /* Kjører et Python-program med gitte svar på input(). Filer leses fra mappen (bare lesing, ingen skriving).
     Resultatet huskes, for sjekkene kjøres ofte (ved hver hendelse). */
  const cache = new Map();
  function pyTest(src, inputs = [], folder = P_KODE) {
    const key = folder.join('/') + '\u0000' + inputs.join('\u0001') + '\u0000' + src;
    if (cache.has(key)) return cache.get(key);
    const ins = inputs.slice(); let out = '', steps = 0, res;
    const fsApi = {
      open: (path, mode) => {
        if (/[wa]/.test(mode)) return { content: '' };
        const f = FS.resolve([...folder, ...String(path).split(/[\\/]/).filter(Boolean)]);
        return f && f.type === 'file' ? { content: f.content || '' } : { error: `[Errno 2] No such file or directory: '${path}'`, errorType: 'FileNotFoundError' };
      },
      write: () => ({}),
      hasPkg: n => !!(window.Pip && Pip.has(n))
    };
    try {
      const g = Pyth.run(src || '', 'test.py', fsApi);
      let r = g.next();
      while (!r.done) {
        const y = r.value;
        if (++steps > 400000) { res = { ok: false, out, error: 'timeout' }; break; }
        if (y.type === 'out') { out += y.text; r = g.next(); }
        else if (y.type === 'input') { if (!ins.length) { res = { ok: false, out, error: 'needInput' }; break; } r = g.next(ins.shift()); }
        else r = g.next();
      }
      if (!res) { const v = r.value || {}; res = { ok: !!v.ok, out, error: v.error || null }; }
      res.used = inputs.length - ins.length;
    } catch (e) { res = { ok: false, out, error: 'crash' }; }
    if (cache.size > 200) cache.clear();
    cache.set(key, res);
    return res;
  }
  const num = (out, n) => new RegExp('(^|[^\\d.,])' + String(n).replace('.', '[.,]') + '(?![\\d])').test(out);
  const has = (src, re) => re.test(src || '');
  const lines = s => (s || '').split('\n').filter(l => l.trim());
  /* Kjørte eleven programmet fra Kode-mappen (eller undermappen) uten feil? */
  const ranOk = (S, file, pred) => ran(S, file, d => d.ok && (!pred || pred(d)));
  const gitEv = (S, cmdName, pred) => S.ev('git', d => d.cmd === cmdName && (!pred || pred(d)));
  const pipEv = (S, cmdName, pred) => S.ev('pip', d => d.cmd === cmdName && (!pred || pred(d)));
  const repo = path => { const f = FS.resolve(path); return f && window.Git ? Git.repoAt(f.id) : null; };
  const purge = path => { const f = FS.resolve(path); if (f) FS.purge(f.id); };

  const HILSEN_ROT = 'print("*************")\nprint("Hei, Ada!")\nprint("Velkommen til kodeklubben.")\nprint("*************")\nprint("*************")\nprint("Hei, Linus!")\nprint("Velkommen til kodeklubben.")\nprint("*************")\nprint("*************")\nprint("Hei, Grace!")\nprint("Velkommen til kodeklubben.")\nprint("*************")\n';
  const hilsenOut = () => pyTest(HILSEN_ROT).out;
  const SNITT = 'tall = [4, 8, 6, 2]\nsum = 0\nfor t in tall:\n    sum = sum + t\nsnitt = sum / 2\nprint("Snittet er", snitt)\n';
  const ALDER2 = 'alder = int(input("Hvor gammel er du? "))\nprint("Om ti år er du", alder + 10)\n';
  const STAT = 'karakterer = [5, 3, 6, 4, 4, 5]\n\n# Skriv ut summen, antallet, snittet, den høyeste og den laveste karakteren\n';
  const POENG = 'Ada;12\nLinus;7\nGrace;15\nAlan;9\n';
  const FIKK4 = 'karakterer = [2, 4, 5, 3, 6, 4, 1]\nantall = 0\nfor k in karakterer:\n    if k > 4:\n        antall = antall + 1\nprint("Fikk 4 eller bedre:", antall)\n';
  const TEMP = '3\n-2\n5\n8\n1\n';

  /* ============================================================ */
  const P8 = {
    id: 'p8', title: 'Valg: if, elif og else', laerTitle: 'valg i programmer', del: DEL, delDesc: DEL_DESC,
    desc: 'Programmer som gjør forskjellige ting avhengig av svaret: sammenligninger, if, elif og else.',
    laer: `
      <h4>Programmet velger</h4>
      <p>Med <code>if</code> kjører programmet noen linjer bare når en <b>betingelse</b> er sann. <code>else</code> tar resten. Linjene som hører til, har <b>innrykk</b> (4 mellomrom), og linjen over slutter med <b>kolon</b>.</p>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">svar = input("Hva er 2 + 2? ")
if svar == "4":
    print("Riktig!")
else:
    print("Feil, det er 4.")</pre>
      <h4>Sammenligninger</h4>
      <table><tr><th>Skriv</th><th>Betyr</th></tr>
      <tr><td><code>==</code></td><td>er lik (to likhetstegn! Ett = betyr «lagre i en variabel»)</td></tr>
      <tr><td><code>!=</code></td><td>er ikke lik</td></tr>
      <tr><td><code>&lt;</code> <code>&gt;</code> <code>&lt;=</code> <code>&gt;=</code></td><td>mindre enn, større enn, mindre eller lik, større eller lik</td></tr>
      <tr><td><code>and</code>, <code>or</code>, <code>not</code></td><td>begge må stemme, én må stemme, det motsatte</td></tr></table>
      <h4>Flere valg med elif</h4>
      <p><code>elif</code> betyr «ellers, hvis». Python sjekker fra toppen og kjører <b>bare den første</b> som stemmer:</p>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">if poeng >= 90:
    print("Karakter 6")
elif poeng >= 75:
    print("Karakter 5")
else:
    print("Lavere enn 5")</pre>
      <p><b>Husk:</b> <code>input()</code> gir alltid tekst. Skal du sammenligne med tall, bruk <code>int(input(...))</code>. Store og små bokstaver er forskjellige: <code>"Oslo" == "oslo"</code> er usant. Bruk <code>.lower()</code> for å gjøre om til små bokstaver.</p>`,
    oppdrag: [
      {
        id: 'p8o1', title: 'Riktig eller feil?', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('quiz.py'); },
        steps: [
          { laer: true, quiz: { q: 'Hva er forskjellen på = og == i Python?', options: ['= lagrer en verdi i en variabel, == sammenligner', 'Ingen forskjell', '== lagrer, = sammenligner'], answer: 0 } },
          { laer: true, quiz: { q: 'Hvorfor må linjene under if ha innrykk?', options: ['Det viser hvilke linjer som hører til if-en', 'Det ser penere ut', 'Det trengs ikke'], answer: 0 } },
          { laer: true, quiz: { q: 'poeng er 80. Hva skriver eksempelet med if/elif/else ut?', options: ['Karakter 6', 'Karakter 5', 'Både Karakter 6 og Karakter 5'], answer: 1 } },
          { text: 'Lag filen <code>quiz.py</code> i Kode-mappen og åpne den i Kode.', check: S => S.fileIn('quiz.py', P_KODE) },
          { text: 'Skriv et program som spør <b>«Hva er hovedstaden i Norge?»</b>. Er svaret <b>Oslo</b>, skriver det ut <b>Riktig!</b>, ellers <b>Feil</b>. Lagre.', hint: 'svar = input("Hva er hovedstaden i Norge? ")\nif svar == "Oslo":\n    print("Riktig!")\nelse:\n    print("Feil")', check: S => { const c = kode('quiz.py'); return has(c, /input\s*\(/) && has(c, /^\s*if\b.*:/m) && has(c, /^\s*else\s*:/m); } },
          { text: 'Kjør programmet og svar <b>Oslo</b>.', check: S => ranOk(S, 'quiz.py', d => d.usedInput && /riktig/i.test(d.output)) },
          { text: 'Kjør det igjen og svar noe annet, for eksempel Bergen.', check: S => ranOk(S, 'quiz.py', d => d.usedInput && /feil/i.test(d.output)) },
          { text: 'Svar <b>oslo</b> med liten forbokstav. Programmet sier Feil! Fiks det med <code>.lower()</code>, så både Oslo, oslo og OSLO blir riktig. Lagre.', hint: 'if svar.lower() == "oslo":', check: S => { const c = kode('quiz.py'); return ['oslo', 'OSLO', 'Oslo'].every(a => /riktig/i.test(pyTest(c, [a]).out)) && /feil/i.test(pyTest(c, ['Bergen']).out); } },
          { quiz: { q: 'Hva betyr elif?', options: ['«Ellers, hvis»: en ny betingelse som sjekkes hvis den forrige ikke stemte', 'Slutten på programmet', 'Det samme som else'], answer: 0 } }
        ]
      },
      {
        id: 'p8o2', title: 'Karakterkalkulatoren', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('karakter.py'); },
        steps: [
          { text: 'Lag <code>karakter.py</code>. Programmet spør om <b>poeng</b> (0–100) og skriver ut karakteren: <b>90+</b> gir 6, <b>75+</b> gir 5, <b>60+</b> gir 4, <b>45+</b> gir 3, <b>30+</b> gir 2, ellers 1. Skriv for eksempel <code>Karakter 5</code>.', hint: 'poeng = int(input("Poeng: "))\nif poeng >= 90:\n    print("Karakter 6")\nelif poeng >= 75:\n    print("Karakter 5")\n… og så videre, med else til slutt.', check: S => { const c = kode('karakter.py'); return has(c, /\belif\b/) && (c.match(/\belif\b/g) || []).length >= 2 && has(c, /int\s*\(\s*input/); } },
          { text: 'Kjør programmet og prøv med noen poengsummer.', check: S => ranOk(S, 'karakter.py', d => d.usedInput) },
          { text: 'Veilederen tester nå programmet ditt med <b>95, 80, 62, 50, 35</b> og <b>10</b> poeng. Rett til alle gir riktig karakter (6, 5, 4, 3, 2, 1), og lagre.', hint: 'Står de største grensene øverst? Python kjører bare den første som stemmer, så >= 90 må komme før >= 75.', check: S => { const c = kode('karakter.py'); return [[95, 6], [80, 5], [62, 4], [50, 3], [35, 2], [10, 1]].every(([p, k]) => { const r = pyTest(c, [String(p)]); return r.ok && num(r.out, k) && [1, 2, 3, 4, 5, 6].filter(x => x !== k).every(x => !num(r.out, x)); }); } },
          { quiz: { q: 'En elev har nøyaktig 90 poeng. Hvilken karakter får hun med «if poeng >= 90»?', options: ['5', '6', 'Ingen'], answer: 1 } },
          { quiz: { q: 'Hva skjer hvis du skriver «if poeng >= 30» øverst, før de andre?', options: ['Alle med 30 poeng eller mer får 2, fordi den stemmer først', 'Ingenting endres', 'Programmet krasjer'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P9 = {
    id: 'p9', title: 'Løkker: for og while', laerTitle: 'løkker', del: DEL, delDesc: DEL_DESC,
    desc: 'Gjenta ting med for og range(), og med while til noe er oppfylt.',
    laer: `
      <h4>for: gjør noe et bestemt antall ganger</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">for i in range(1, 6):
    print(i)</pre>
      <p>skriver ut 1, 2, 3, 4, 5. <code>range(1, 6)</code> starter på 1 og stopper <b>før</b> 6. <code>range(5)</code> gir 0 til 4.</p>
      <h4>while: gjør noe så lenge en betingelse stemmer</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">svar = ""
while svar != "ja":
    svar = input("Er du klar? ")</pre>
      <p>Bruk <code>while</code> når du ikke vet hvor mange ganger det skal gjentas, for eksempel til brukeren gjetter riktig. <code>break</code> hopper ut av løkka med en gang.</p>
      <p>Glemmer du å endre det betingelsen sjekker, stopper løkka aldri. Da trykker du <kbd>Ctrl</kbd>+<kbd>C</kbd> i terminalen.</p>
      <table><tr><th>Bruk</th><th>Når</th></tr><tr><td><code>for</code></td><td>Du vet hvor mange ganger, eller går gjennom en liste</td></tr><tr><td><code>while</code></td><td>Det skal gjentas til noe skjer</td></tr></table>`,
    oppdrag: [
      {
        id: 'p9o1', title: 'Gangetabellen', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('gangetabell.py'); },
        steps: [
          { laer: true, quiz: { q: 'Hvilke tall gir range(1, 5)?', options: ['1, 2, 3, 4', '1, 2, 3, 4, 5', '0, 1, 2, 3, 4'], answer: 0 } },
          { laer: true, quiz: { q: 'Når passer while bedre enn for?', options: ['Når du ikke vet på forhånd hvor mange ganger det skal gjentas', 'Når du skal skrive ut 10 linjer', 'Aldri'], answer: 0 } },
          { laer: true, quiz: { q: 'En while-løkke stopper aldri. Hva gjør du?', options: ['Ctrl+C i terminalen', 'Venter', 'Slår av PC-en'], answer: 0 } },
          { text: 'Lag <code>gangetabell.py</code> som spør hvilken gangetabell brukeren vil se, og skriver ut de ti første linjene med en <code>for</code>-løkke, for eksempel <code>3 x 7 = 21</code>.', hint: 'tall = int(input("Hvilken gangetabell? "))\nfor i in range(1, 11):\n    print(i, "x", tall, "=", i * tall)', check: S => { const c = kode('gangetabell.py'); return has(c, /\bfor\b.+\bin\b/) && has(c, /range\s*\(/); } },
          { text: 'Kjør programmet og velg 7-gangen.', check: S => ranOk(S, 'gangetabell.py', d => d.usedInput && lines(d.output).length >= 10) },
          { text: 'Veilederen tester med 7 og 12. Begge må gi ti linjer som slutter på 70 og 120. Rett og lagre.', hint: 'Står det range(1, 10)? Da får du bare ni linjer: range stopper før det siste tallet.', check: S => { const c = kode('gangetabell.py'); return [7, 12].every(t => { const r = pyTest(c, [String(t)]); const L = lines(r.out); return r.ok && L.length === 10 && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((i, k) => num(L[k], i * t)); }); } }
        ]
      },
      {
        id: 'p9o2', title: 'Gjett tallet', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('gjett.py'); },
        steps: [
          { text: 'Lag <code>gjett.py</code>: programmet tenker på et tilfeldig tall fra 1 til 100 (<code>random.randint</code>). Brukeren gjetter med en <code>while</code>-løkke til det er riktig. Si <b>For lavt</b> eller <b>For høyt</b> underveis, og <b>Riktig!</b> til slutt.', hint: 'import random\nhemmelig = random.randint(1, 100)\ngjett = 0\nwhile gjett != hemmelig:\n    gjett = int(input("Gjett: "))\n    if gjett < hemmelig:\n        print("For lavt")\n    elif gjett > hemmelig:\n        print("For høyt")\nprint("Riktig!")', check: S => { const c = kode('gjett.py'); return has(c, /\bwhile\b/) && has(c, /randint/) && has(c, /input\s*\(/); } },
          { text: 'Spill til du har gjettet riktig.', hint: 'Gjett 50 først. Er det for lavt, gjett 75, osv. Da finner du det på maks sju forsøk.', check: S => ranOk(S, 'gjett.py', d => d.usedInput && /riktig|gratulerer/i.test(d.output)) },
          { text: 'Veilederen spiller nå mot programmet ditt og gjetter 1, 2, 3 … til det er riktig. Programmet skal svare For lavt underveis og stoppe når det er riktig.', check: S => { const r = pyTest(kode('gjett.py'), Array.from({ length: 100 }, (_, i) => String(i + 1))); return r.ok && /riktig|gratulerer/i.test(r.out) && (/lav|høy/i.test(r.out) || r.used === 1); } },
          { text: 'Utvid spillet: tell antall forsøk, og skriv ut <b>«Du brukte N forsøk»</b> til slutt.', hint: 'forsok = 0 før løkka, og forsok = forsok + 1 inni løkka. Til slutt: print("Du brukte", forsok, "forsøk")', check: S => { const c = kode('gjett.py'); const r = pyTest(c, Array.from({ length: 100 }, (_, i) => String(i + 1))); if (!r.ok) return false; const m = /(\d+)\s*fors[øo]k/i.exec(r.out); return !!m && +m[1] === r.used; } },
          { quiz: { q: 'Hvorfor passer while til et gjettespill?', options: ['Vi vet ikke hvor mange forsøk som trengs', 'while er raskere enn for', 'for kan ikke bruke input()'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P10 = {
    id: 'p10', title: 'Lister', laerTitle: 'lister', del: DEL, delDesc: DEL_DESC,
    desc: 'Mange verdier i én variabel: lag lister, legg til, gå gjennom med for, og regn på dem.',
    laer: `
      <h4>En liste holder mange verdier</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">frukt = ["eple", "banan", "pære"]
print(frukt[0])        # eple (første er nummer 0!)
print(frukt[-1])       # pære (siste)
frukt.append("kiwi")   # legg til på slutten
print(len(frukt))      # 4
for f in frukt:
    print("Jeg liker", f)</pre>
      <table><tr><th>Skriv</th><th>Gir</th></tr>
      <tr><td><code>len(liste)</code></td><td>antall elementer</td></tr>
      <tr><td><code>sum(liste)</code>, <code>max(liste)</code>, <code>min(liste)</code></td><td>summen, største, minste (for tall)</td></tr>
      <tr><td><code>liste.append(x)</code></td><td>legger x til på slutten</td></tr>
      <tr><td><code>x in liste</code></td><td>True hvis x finnes i lista</td></tr>
      <tr><td><code>sorted(liste)</code></td><td>en sortert kopi</td></tr></table>
      <p>Prøver du å hente et element som ikke finnes, for eksempel <code>frukt[10]</code>, får du <b>IndexError</b>.</p>`,
    oppdrag: [
      {
        id: 'p10o1', title: 'Handlelisten', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('handleliste.py'); },
        steps: [
          { laer: true, quiz: { q: 'frukt = ["eple", "banan", "pære"]. Hva er frukt[1]?', options: ['eple', 'banan', 'pære'], answer: 1 } },
          { laer: true, quiz: { q: 'Hvordan legger du "kiwi" til på slutten av lista?', options: ['frukt.append("kiwi")', 'frukt + kiwi', 'append(frukt)'], answer: 0 } },
          { laer: true, quiz: { q: 'Lista har 3 elementer. Hva skjer med frukt[3]?', options: ['Du får det tredje', 'IndexError, for nummereringen starter på 0', 'Du får None'], answer: 1 } },
          { text: 'Lag <code>handleliste.py</code>: programmet spør om varer én og én og legger dem i en liste med <code>append</code>. Når brukeren trykker Enter uten å skrive noe, stopper det, skriver ut <b>hvor mange</b> varer det er, og så hver vare på en egen linje.', hint: 'liste = []\nwhile True:\n    vare = input("Vare (tom for å avslutte): ")\n    if vare == "":\n        break\n    liste.append(vare)\nprint("Du skal kjøpe", len(liste), "ting:")\nfor v in liste:\n    print("-", v)', check: S => { const c = kode('handleliste.py'); return has(c, /\.append\s*\(/) && has(c, /\bfor\b/); } },
          { text: 'Kjør programmet og skriv inn noen varer.', check: S => ranOk(S, 'handleliste.py', d => d.usedInput) },
          { text: 'Veilederen tester med <b>melk, brød, ost</b> og en tom linje. Utskriften skal ha alle tre og antallet 3.', check: S => { const r = pyTest(kode('handleliste.py'), ['melk', 'brød', 'ost', '']); return r.ok && /melk/.test(r.out) && /brød/.test(r.out) && /ost/.test(r.out) && num(r.out, 3); } }
        ]
      },
      {
        id: 'p10o2', title: 'Karakterstatistikk', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('statistikk.py'); F.ensureFile(P_KODE, 'statistikk.py', STAT); },
        steps: [
          { text: 'Åpne <code>statistikk.py</code> i Kode. Den har en liste med karakterer.', check: S => S.ev('kode-open') || /karakterer/.test(S.kodeText()) },
          { text: 'Skriv ut <b>summen</b>, <b>antallet</b> og <b>snittet</b> (summen delt på antallet). Bruk <code>sum()</code> og <code>len()</code>.', hint: 'print("Sum:", sum(karakterer))\nprint("Antall:", len(karakterer))\nprint("Snitt:", sum(karakterer) / len(karakterer))', check: S => { const r = pyTest(kode('statistikk.py')); return r.ok && num(r.out, 27) && num(r.out, 6) && num(r.out, 4.5); } },
          { text: 'Skriv også ut den <b>høyeste</b> og den <b>laveste</b> karakteren med <code>max()</code> og <code>min()</code>. Kjør programmet.', check: S => ranOk(S, 'statistikk.py', d => /max\s*\(/.test(d.source) && /min\s*\(/.test(d.source) && num(d.output, 6) && num(d.output, 3)) },
          { text: 'Legg til to karakterer til i lista, for eksempel 2 og 6. Programmet skal fortsatt regne riktig uten at du endrer noe annet. Lagre og kjør.', check: S => { const c = kode('statistikk.py'); const m = /karakterer\s*=\s*\[([^\]]*)\]/.exec(c); if (!m) return false; const xs = m[1].split(',').map(x => parseFloat(x)).filter(x => !isNaN(x)); if (xs.length < 8) return false; const r = pyTest(c); const snitt = xs.reduce((a, b) => a + b, 0) / xs.length; return r.ok && (num(r.out, snitt) || new RegExp(String(Math.round(snitt * 100) / 100).replace('.', '[.,]')).test(r.out) || r.out.includes(String(snitt).slice(0, 5))); } },
          { quiz: { q: 'Hvorfor er sum(karakterer) / len(karakterer) bedre enn å skrive 27 / 6?', options: ['Det regner riktig selv om lista endres', 'Det er kortere', 'Det er ikke bedre'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P11 = {
    id: 'p11', title: 'Funksjoner', laerTitle: 'funksjoner', del: DEL, delDesc: DEL_DESC,
    desc: 'Lag dine egne funksjoner med def og return, og rydd i kode som gjentar seg.',
    laer: `
      <h4>En funksjon er en navngitt bit kode</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">def areal(lengde, bredde):
    return lengde * bredde

print(areal(4, 5))   # 20
print(areal(3, 7))   # 21</pre>
      <ul><li><code>def</code> lager funksjonen. Ingenting skjer før du <b>kaller</b> den: <code>areal(4, 5)</code>.</li>
      <li><code>lengde</code> og <code>bredde</code> er <b>parametere</b>: navnene funksjonen bruker på verdiene den får.</li>
      <li><code>return</code> gir svaret tilbake til den som kalte funksjonen. <code>print</code> bare viser noe på skjermen.</li></ul>
      <h4>Hvorfor funksjoner?</h4>
      <p>Skriver du den samme koden flere ganger, er det tid for en funksjon. Da retter du feil ett sted, og koden blir lettere å lese. Gode funksjonsnavn forteller hva funksjonen gjør: <code>regn_snitt</code>, <code>hils</code>.</p>`,
    oppdrag: [
      {
        id: 'p11o1', title: 'Din første funksjon', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('areal.py'); },
        steps: [
          { laer: true, quiz: { q: 'Hva gjør def?', options: ['Lager en funksjon', 'Kjører en funksjon', 'Sletter en variabel'], answer: 0 } },
          { laer: true, quiz: { q: 'Hva er forskjellen på return og print?', options: ['return gir verdien tilbake til koden, print viser den bare på skjermen', 'Ingen', 'print er raskere'], answer: 0 } },
          { laer: true, quiz: { q: 'Du har skrevet en funksjon med def, men ingenting skjer når du kjører. Hvorfor?', options: ['Funksjonen er ikke kalt', 'Python er ødelagt', 'Du mangler import'], answer: 0 } },
          { text: 'Lag <code>areal.py</code> med funksjonen <code>areal(lengde, bredde)</code> som <b>returnerer</b> arealet av et rektangel. Skriv ut arealet av et 4 × 5-rektangel og et 3 × 7-rektangel.', check: S => { const c = kode('areal.py'); return has(c, /def\s+areal\s*\(/) && has(c, /\breturn\b/); } },
          { text: 'Kjør programmet. Du skal få 20 og 21.', check: S => ranOk(S, 'areal.py', d => num(d.output, 20) && num(d.output, 21)) },
          { text: 'Veilederen kaller nå funksjonen din med 6 og 2. Den skal gi 12 tilbake med <code>return</code> (ikke bare skrive ut).', hint: 'Står det print i stedet for return inni funksjonen? Da får koden som kaller den, bare None tilbake.', check: S => { const r = pyTest(kode('areal.py') + '\n__svar = areal(6, 2)\nprint("TEST", __svar)\n'); return r.ok && /TEST 12\b/.test(r.out); } },
          { text: 'Lag en funksjon til: <code>omkrets(lengde, bredde)</code>, som returnerer omkretsen (2 × lengde + 2 × bredde). Skriv ut omkretsen av 4 × 5.', check: S => { const r = pyTest(kode('areal.py') + '\nprint("TEST", omkrets(6, 2))\n'); return r.ok && /TEST 16\b/.test(r.out); } }
        ]
      },
      {
        id: 'p11o2', title: 'Rydd med en funksjon', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('velkommen.py'); F.ensureFile(P_KODE, 'velkommen.py', HILSEN_ROT); },
        steps: [
          { text: 'Åpne og kjør <code>velkommen.py</code>. Se på koden: de samme fire linjene står tre ganger.', check: S => ran(S, 'velkommen.py') },
          { text: 'Lag en funksjon <code>hils(navn)</code> som skriver ut de fire linjene for ett navn. Bytt ut de tolv linjene med tre kall: <code>hils("Ada")</code>, <code>hils("Linus")</code>, <code>hils("Grace")</code>.', hint: 'def hils(navn):\n    print("*************")\n    print("Hei, " + navn + "!")\n    print("Velkommen til kodeklubben.")\n    print("*************")', check: S => { const c = kode('velkommen.py'); return has(c, /def\s+hils\s*\(/) && (c.match(/^\s*hils\s*\(/gm) || []).length >= 3; } },
          { text: 'Kjør programmet. Utskriften skal være <b>nøyaktig lik</b> som før, men koden er mye kortere.', check: S => { const c = kode('velkommen.py'); const r = pyTest(c); return r.ok && r.out.replace(/\s+/g, ' ').trim() === hilsenOut().replace(/\s+/g, ' ').trim() && (c.match(/print\s*\(/g) || []).length <= 5 && ranOk(S, 'velkommen.py'); } },
          { text: 'Nå skal teksten endres til «Velkommen til <b>koding</b>.». Endre det på ett sted, i funksjonen, og kjør.', check: S => { const c = kode('velkommen.py'); const r = pyTest(c); return r.ok && (r.out.match(/velkommen til koding/gi) || []).length >= 3 && (c.match(/velkommen til koding/gi) || []).length === 1; } },
          { quiz: { q: 'Hva var den største fordelen med funksjonen?', options: ['Du endrer teksten på ett sted i stedet for tre', 'Programmet kjører raskere', 'Det trengs ikke print lenger'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P12 = {
    id: 'p12', title: 'Feilsøking 2', laerTitle: 'logiske feil og try/except', del: DEL, delDesc: DEL_DESC,
    desc: 'Finn feil som ikke gir feilmelding, og lag programmer som tåler feil input.',
    laer: `
      <h4>Tre slags feil</h4>
      <table><tr><th>Feil</th><th>Hva skjer</th><th>Eksempel</th></tr>
      <tr><td>Syntaksfeil</td><td>Programmet starter ikke</td><td>Mangler <code>:</code> eller <code>)</code></td></tr>
      <tr><td>Kjørefeil</td><td>Programmet krasjer underveis</td><td><code>int("ti")</code> gir ValueError</td></tr>
      <tr><td><b>Logisk feil</b></td><td>Programmet kjører, men svaret er <b>feil</b></td><td>Deler på 2 i stedet for antallet</td></tr></table>
      <h4>Finn en logisk feil</h4>
      <ol><li>Test med noe du <b>vet</b> svaret på (snittet av 2 og 4 er 3).</li>
      <li>Legg inn <code>print()</code> midt i koden og se hva variablene faktisk inneholder.</li>
      <li>Forklar koden linje for linje høyt, til en venn eller en gummiand. Ofte ser du feilen mens du forklarer.</li></ol>
      <h4>Tål feil input med try/except</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">try:
    alder = int(input("Alder: "))
except ValueError:
    print("Skriv alderen med tall.")</pre>
      <p>Koden i <code>try</code> prøves. Går det galt med akkurat den feilen, kjøres <code>except</code> i stedet for at programmet krasjer. Skriv navnet på feilen (<code>ValueError</code>), så du ikke skjuler andre feil.</p>`,
    oppdrag: [
      {
        id: 'p12o1', title: 'Programmet lyver', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('snitt.py'); F.ensureFile(P_KODE, 'snitt.py', SNITT); },
        steps: [
          { laer: true, quiz: { q: 'Programmet kjører uten feilmelding, men svaret er feil. Hva slags feil er det?', options: ['Syntaksfeil', 'Logisk feil', 'Ingen feil'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva er en god måte å finne en logisk feil på?', options: ['Legge inn print() og se hva variablene inneholder', 'Slette programmet', 'Kjøre det mange ganger til det blir riktig'], answer: 0 } },
          { laer: true, quiz: { q: 'Hvorfor skriver vi except ValueError og ikke bare except?', options: ['Så vi bare fanger den feilen vi venter, og ikke skjuler andre feil', 'Det er kortere', 'except alene virker ikke'], answer: 0 } },
          { text: 'Kjør <code>snitt.py</code>. Den regner ut snittet av 4, 8, 6 og 2.', check: S => ran(S, 'snitt.py') },
          { quiz: { q: 'Snittet av 4, 8, 6 og 2 er 20 / 4. Hva skulle programmet ha svart?', options: ['10.0', '5.0', '20'], answer: 1 } },
          { text: 'Programmet sier 10.0. Legg inn en linje rett over <code>snitt = …</code> som skriver ut <code>sum</code> og <code>len(tall)</code>, og kjør igjen. Hva ser du?', check: S => ranOk(S, 'snitt.py', d => (d.source.match(/print\s*\(/g) || []).length >= 2 && num(d.output, 20)) },
          { text: 'Feilen er at programmet deler på 2 i stedet for antallet tall. Rett det med <code>len(tall)</code>, fjern feilsøkingslinjen, og kjør.', check: S => { const c = kode('snitt.py'); const r = pyTest(c); const r2 = pyTest(c.replace(/tall\s*=\s*\[[^\]]*\]/, 'tall = [1, 2, 3, 6]')); return r.ok && num(r.out, 5) && r2.ok && num(r2.out, 3) && ranOk(S, 'snitt.py', d => num(d.output, 5)); } }
        ]
      },
      {
        id: 'p12o2', title: 'Tål feil input', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('tialar.py'); F.ensureFile(P_KODE, 'tialar.py', ALDER2); },
        steps: [
          { text: 'Kjør <code>tialar.py</code> og svar <b>ti</b> (med bokstaver). Programmet krasjer med <b>ValueError</b>.', check: S => ran(S, 'tialar.py', d => d.error === 'ValueError' || d.usedInput) },
          { text: 'Pakk inn koden med <code>try</code> og <code>except ValueError</code>, slik at programmet skriver en vennlig melding i stedet for å krasje. Lagre.', hint: 'try:\n    alder = int(input("Hvor gammel er du? "))\n    print("Om ti år er du", alder + 10)\nexcept ValueError:\n    print("Skriv alderen med tall, for eksempel 14.")', check: S => { const c = kode('tialar.py'); const a = pyTest(c, ['ti']), b = pyTest(c, ['14']); return has(c, /\btry\s*:/) && has(c, /except\s+ValueError/) && (a.ok || a.error === 'needInput') && a.out.trim().length > 0 && b.ok && num(b.out, 24); } },
          { text: 'Kjør det og svar <b>ti</b> igjen. Nå krasjer det ikke.', check: S => ranOk(S, 'tialar.py', d => d.usedInput && !/Traceback/.test(d.output)) },
          { text: 'Gjør programmet enda bedre: legg det i en <code>while True</code>-løkke, så det spør på nytt helt til svaret er et tall. Bruk <code>break</code> når det gikk bra.', hint: 'while True:\n    try:\n        alder = int(input("Hvor gammel er du? "))\n        break\n    except ValueError:\n        print("Skriv alderen med tall.")\nprint("Om ti år er du", alder + 10)', check: S => { const r = pyTest(kode('tialar.py'), ['ti', 'femten', '14']); return r.ok && num(r.out, 24); } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P13 = {
    id: 'p13', title: 'Data i filer', laerTitle: 'å lese og skrive filer', del: DEL, delDesc: DEL_DESC,
    desc: 'Lagre data fra programmet i en fil, og les en fil og regn på innholdet.',
    laer: `
      <h4>Programmet glemmer alt når det slutter</h4>
      <p>Variabler forsvinner når programmet er ferdig. Skal noe huskes til neste gang, må det lagres i en <b>fil</b>.</p>
      <table><tr><th>Modus</th><th>Betyr</th></tr>
      <tr><td><code>"r"</code></td><td>les (standard)</td></tr>
      <tr><td><code>"w"</code></td><td>skriv: lager filen, eller <b>sletter</b> innholdet og skriver på nytt</td></tr>
      <tr><td><code>"a"</code></td><td>legg til nederst (append)</td></tr></table>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">with open("logg.txt", "a") as f:
    f.write("En ny linje\\n")

with open("poeng.txt") as f:
    for linje in f:
        navn, poeng = linje.strip().split(";")
        print(navn, int(poeng))</pre>
      <ul><li><code>with</code> lukker filen av seg selv når blokken er ferdig.</li>
      <li><code>write</code> lager ikke ny linje selv: husk <code>"\\n"</code>.</li>
      <li>Det du leser, er tekst. <code>.strip()</code> fjerner linjeskiftet, <code>.split(";")</code> deler opp, og <code>int()</code> gjør om til tall.</li>
      <li>Stien er relativ til mappen du kjører programmet fra.</li></ul>`,
    oppdrag: [
      {
        id: 'p13o1', title: 'Dagboka', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('dagbok.py'); FS.silentRemoveAll('dagbok.txt'); },
        steps: [
          { laer: true, quiz: { q: 'Du åpner en fil med "w" og skriver én linje. Hva skjer med det som sto der fra før?', options: ['Det blir borte', 'Det blir stående, og linjen legges til nederst', 'Ingenting skrives'], answer: 0 } },
          { laer: true, quiz: { q: 'Hva gjør "\\n" i f.write("Hei\\n")?', options: ['Lager et linjeskift', 'Sletter linjen', 'Ingenting'], answer: 0 } },
          { laer: true, quiz: { q: 'Du leser "15\\n" fra en fil. Hva må du gjøre før du kan regne med det?', options: ['int(tekst.strip())', 'Ingenting', 'tekst + 1'], answer: 0 } },
          { text: 'Lag <code>dagbok.py</code> som spør <b>«Hva gjorde du i dag?»</b> og legger svaret til nederst i filen <code>dagbok.txt</code> (bruk <code>"a"</code>). Skriv ut <b>Lagret!</b> etterpå.', hint: 'tekst = input("Hva gjorde du i dag? ")\nwith open("dagbok.txt", "a") as f:\n    f.write(tekst + "\\n")\nprint("Lagret!")', check: S => { const c = kode('dagbok.py'); return has(c, /open\s*\(/) && has(c, /["']a["']/) && has(c, /\.write\s*\(/); } },
          { text: 'Kjør programmet to ganger med forskjellige svar.', check: S => S.evCount('py-run', d => same(d.file, 'dagbok.py') && d.ok && d.usedInput) >= 2 && lines(kode('dagbok.txt')).length >= 2 },
          { text: 'Se innholdet i dagboka fra terminalen: <code>cat dagbok.txt</code>. Begge linjene skal være der.', check: S => S.ev('term-cat', d => same(d.name, 'dagbok.txt')) },
          { quiz: { q: 'Hva ville skjedd hvis du hadde brukt "w" i stedet for "a"?', options: ['Bare det siste svaret ville vært igjen', 'Begge svarene ville vært der', 'Programmet ville krasjet'], answer: 0 } }
        ]
      },
      {
        id: 'p13o2', title: 'Regn på data fra en fil', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('poeng.py'); FS.silentRemoveAll('poeng.txt'); F.ensureFile(P_KODE, 'poeng.txt', POENG); },
        steps: [
          { text: 'Se på <code>poeng.txt</code> med <code>cat poeng.txt</code>. Hver linje har et navn og en poengsum, skilt med semikolon.', check: S => S.ev('term-cat', d => same(d.name, 'poeng.txt')) },
          { text: 'Lag <code>poeng.py</code> som leser filen, skriver ut hver person med poengsummen, og til slutt <b>summen av alle poengene</b>.', hint: 'total = 0\nwith open("poeng.txt") as f:\n    for linje in f:\n        navn, p = linje.strip().split(";")\n        total = total + int(p)\n        print(navn, p)\nprint("Totalt:", total)', check: S => { const r = pyTest(kode('poeng.py')); return r.ok && num(r.out, 43) && /ada/i.test(r.out) && /grace/i.test(r.out); } },
          { text: 'Finn også <b>vinneren</b>: skriv ut navnet på den med flest poeng. Kjør programmet fra Kode-mappen.', hint: 'Husk den beste så langt: beste_navn = "" og beste = -1 før løkka. Inni løkka: if int(p) > beste: beste = int(p); beste_navn = navn', check: S => ranOk(S, 'poeng.py', d => d.output.split('\n').some(l => /grace/i.test(l) && /vinn|vant|best|flest|høy|mest|leder/i.test(l))) },
          { quiz: { q: 'Programmet gir FileNotFoundError, men poeng.txt finnes. Hva er mest sannsynlig?', options: ['Du kjører programmet fra en annen mappe enn der filen ligger', 'Filen er for stor', 'Python kan ikke lese .txt'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================
     EKSPERT: Git
     ============================================================ */
  const P14 = {
    id: 'p14', title: 'Git: versjonskontroll', laerTitle: 'versjonskontroll med Git', del: DEL2, delDesc: DEL2_DESC,
    desc: 'Ta vare på alle versjonene av koden: init, status, add, commit, log, diff og restore.',
    laer: `
      <h4>Hva er Git?</h4>
      <p><b>Git</b> husker alle versjonene av koden din. Du kan se hva som er endret, gå tilbake hvis noe går galt, og samarbeide uten å skrive over hverandres arbeid. Nesten alle programmerere bruker Git.</p>
      <table><tr><th>Ord</th><th>Betyr</th></tr>
      <tr><td><b>Repo</b> (repository)</td><td>En prosjektmappe som Git følger med på</td></tr>
      <tr><td><b>Commit</b></td><td>En lagret versjon, med en melding om hva du gjorde</td></tr>
      <tr><td><b>Staging</b> (<code>git add</code>)</td><td>Å velge hvilke endringer som skal være med i neste commit</td></tr></table>
      <p>Tenk på det som å ta et bilde: <code>git add</code> er å stille opp dem som skal være med på bildet, og <code>git commit</code> er å ta bildet.</p>
      <h4>Kommandoene</h4>
      <table><tr><th>Kommando</th><th>Gjør</th></tr>
      <tr><td><code>git config --global user.name "Navn"</code></td><td>Forteller Git hvem du er (én gang per PC). Det samme med <code>user.email</code>.</td></tr>
      <tr><td><code>git init</code></td><td>Gjør mappen du står i, til et repo</td></tr>
      <tr><td><code>git status</code></td><td>Hva er nytt, endret og klart? <b>Bruk den hele tiden.</b></td></tr>
      <tr><td><code>git add fil.py</code> / <code>git add .</code></td><td>Legger én fil / alt klart til commit</td></tr>
      <tr><td><code>git commit -m "Legg til poeng"</code></td><td>Lagrer en versjon. Skriv kort hva du gjorde.</td></tr>
      <tr><td><code>git log</code> / <code>git log --oneline</code></td><td>Viser historikken</td></tr>
      <tr><td><code>git diff</code></td><td>Viser endringer siden sist: <code>+</code> er lagt til, <code>-</code> er fjernet</td></tr>
      <tr><td><code>git restore fil.py</code></td><td>Angrer endringene i filen og henter siste lagrede versjon</td></tr></table>
      <h4>.gitignore og GitHub</h4>
      <p>Filen <b>.gitignore</b> lister filer Git skal overse, for eksempel loggfiler og filer med passord. <b>GitHub</b> er en nettside der repoer lagres i skyen, så du kan dele og samarbeide (<code>git push</code>, <code>git pull</code>, <code>git clone</code>). Det krever internett og en konto, så det øver vi ikke på her.</p>`,
    oppdrag: [
      {
        id: 'p14o1', title: 'Installer Git og lag et repo', lukk: ['firmaportal', 'kode'],
        setup: F => { F.ensureFolder(P_KODE); purge(P_SPILL); },
        steps: [
          { laer: true, quiz: { q: 'Hva er en commit?', options: ['En lagret versjon av prosjektet, med en melding', 'En feilmelding', 'En mappe'], answer: 0 } },
          { laer: true, quiz: { q: 'Hva gjør git add?', options: ['Legger endringer klare til neste commit', 'Lager en ny fil', 'Sletter historikken'], answer: 0 } },
          { laer: true, quiz: { q: 'Hvilken kommando bør du bruke hele tiden for å se hvordan det står til?', options: ['git status', 'git init', 'git config'], answer: 0 } },
          { text: 'Skriv <code>git --version</code> i terminalen. Virker det ikke, er Git ikke installert.', check: S => S.ev('term-cmd', d => /^git$/i.test(d.alias)) },
          { text: 'Installer <b>Git</b> fra <b>Firmaportalen</b>. (Er det allerede installert, går du videre.)', check: S => S.installed('git') },
          { text: 'Skriv <code>git --version</code> igjen. Nå svarer Git.', check: S => gitEv(S, 'version') },
          { text: 'Fortell Git hvem du er. Skriv begge:<br><code>git config --global user.name "Fornavn Etternavn"</code><br><code>git config --global user.email "navn@skolen.no"</code>', hint: 'Husk anførselstegn rundt navnet, siden det har mellomrom.', check: S => { const c = Git.config(); return !!c['user.name'] && !!c['user.email']; } },
          { text: 'Lag prosjektmappen og gå inn i den: <code>cd ~\\Documents\\Kode</code>, så <code>mkdir spill</code>, så <code>cd spill</code>.', check: S => S.ev('term-cd', d => ends(d.path, 'Kode\\spill')) },
          { text: 'Gjør mappen til et repo: <code>git init</code>', check: S => gitEv(S, 'init', d => /\\spill$/i.test(d.path)) },
          { text: 'Lag filen <code>spill.py</code> i mappen, med linjen <code>print("Velkommen til spillet!")</code>. Bruk Kode (<code>code spill.py</code>) eller <code>Set-Content</code>.', check: S => /print/.test(innhold(P_SPILL, 'spill.py')) },
          { text: 'Skriv <code>git status</code>. Filen står under <b>Untracked files</b>: Git ser den, men følger ikke med på den ennå.', check: S => gitEv(S, 'status', d => d.untracked >= 1) },
          { text: 'Skriv <code>git add spill.py</code> og så <code>git status</code> igjen. Nå står den under <b>Changes to be committed</b>.', check: S => gitEv(S, 'add', d => d.ok) && gitEv(S, 'status', d => d.staged >= 1) },
          { text: 'Lagre den første versjonen: <code>git commit -m "Første versjon av spillet"</code>', hint: 'Får du «Author identity unknown»? Da mangler git config fra steget over.', check: S => gitEv(S, 'commit', d => d.ok) },
          { text: 'Se historikken: <code>git log</code>', check: S => gitEv(S, 'log', d => d.count >= 1) }
        ]
      },
      {
        id: 'p14o2', title: 'Endre, se forskjellen, angre', lukk: ['kode'],
        /* Har eleven ikke laget spill-repoet (eller slettet det), lages det her, så oppdraget alltid kan gjøres */
        setup: F => {
          if (window.Firmaportal) Firmaportal.markInstalled('git');
          const f = F.ensureFolder(P_SPILL);
          if (!FS.resolve([...P_SPILL, 'spill.py'])) F.ensureFileAt(P_SPILL, 'spill.py', 'print("Velkommen til spillet!")\n');
          if (!Git.isRepo(f.id)) Git.seed(f.id, 'Første versjon av spillet');
        },
        steps: [
          { text: 'Åpne <code>spill.py</code> i Kode og legg til en linje: <code>print("Du har 3 liv.")</code>. Lagre.', check: S => /liv/.test(innhold(P_SPILL, 'spill.py')) },
          { text: 'Stå i spill-mappen i terminalen og skriv <code>git status</code>. Filen står som <b>modified</b>.', hint: 'cd ~\\Documents\\Kode\\spill', check: S => gitEv(S, 'status', d => d.modified >= 1) },
          { text: 'Skriv <code>git diff</code>. Den viser nøyaktig hva som er endret: <code>+</code> foran nye linjer, <code>-</code> foran fjernede.', check: S => gitEv(S, 'diff', d => d.changed >= 1) },
          { text: 'Lagre en ny versjon: <code>git add spill.py</code> og <code>git commit -m "Legg til liv"</code>.', check: S => gitEv(S, 'commit', d => d.ok) },
          { text: 'Nå ødelegger vi noe med vilje: slett alt i <code>spill.py</code> (eller skriv tull) og lagre.', check: S => { const c = innhold(P_SPILL, 'spill.py'); return !/velkommen/i.test(c); } },
          { text: 'Hent tilbake siste lagrede versjon: <code>git restore spill.py</code>. Se i editoren at koden er tilbake.', hint: 'Kode-editoren viser den nye versjonen når du klikker på filen igjen.', check: S => gitEv(S, 'restore', d => d.ok) && /liv/.test(innhold(P_SPILL, 'spill.py')) },
          { text: 'Skriv <code>git log --oneline</code>. Du ser begge versjonene, nyeste øverst.', check: S => gitEv(S, 'log', d => d.oneline && d.count >= 2) },
          { quiz: { q: 'Hva er en god commit-melding?', options: ['«Legg til liv i spillet»', '«fikset ting»', '«asdf»'], answer: 0 } },
          { quiz: { q: 'Du har ødelagt en fil og ikke laget en commit av ødeleggelsen. Hvordan får du den tilbake?', options: ['git restore fil.py', 'git init', 'Det går ikke'], answer: 0 } }
        ]
      },
      {
        id: 'p14o3', title: 'Filer Git skal overse', lukk: ['kode'],
        setup: F => {
          if (window.Firmaportal) Firmaportal.markInstalled('git');
          const f = F.ensureFolder(P_SPILL);
          if (!FS.resolve([...P_SPILL, 'spill.py'])) F.ensureFileAt(P_SPILL, 'spill.py', 'print("Velkommen til spillet!")\n');
          if (!Git.isRepo(f.id)) Git.seed(f.id, 'Første versjon av spillet');
          FS.silentRemoveAll('logg.txt'); FS.silentRemoveAll('.gitignore');
        },
        steps: [
          { text: 'Lag en loggfil i spill-mappen: <code>Set-Content logg.txt "test"</code>. Slike filer lager programmet selv, og de skal ikke være med i repoet.', check: S => S.fileIn('logg.txt', P_SPILL) },
          { text: 'Skriv <code>git status</code>. <b>logg.txt</b> står som untracked.', check: S => gitEv(S, 'status', d => d.untracked >= 1) },
          { text: 'Lag filen <code>.gitignore</code> med linjen <code>logg.txt</code>: <code>Set-Content .gitignore "logg.txt"</code>', check: S => /logg\.txt/i.test(innhold(P_SPILL, '.gitignore')) },
          { text: 'Skriv <code>git status</code> igjen. Nå er logg.txt borte fra listen, men <b>.gitignore</b> står der. Den skal være med.', check: S => { const r = repo(P_SPILL); return gitEv(S, 'status') && !!r && r.status.untracked >= 1 && /logg\.txt/i.test(innhold(P_SPILL, '.gitignore')); } },
          { text: 'Lagre: <code>git add .gitignore</code> og <code>git commit -m "Overse loggfiler"</code>.', check: S => { const r = repo(P_SPILL); return gitEv(S, 'commit', d => d.ok) && !!r && r.commits.length && '.gitignore' in r.commits[r.commits.length - 1].files && !('logg.txt' in r.commits[r.commits.length - 1].files); } },
          { quiz: { q: 'Hvorfor skal en fil med passord stå i .gitignore?', options: ['Så den aldri blir lagret i repoet og delt med andre, for eksempel på GitHub', 'Så den blir slettet', 'Så den blir kryptert'], answer: 0 } },
          { quiz: { q: 'Hva er GitHub?', options: ['En nettside der repoer lagres i skyen, så du kan dele og samarbeide', 'Et annet navn på Git', 'Et programmeringsspråk'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================
     EKSPERT: pip
     ============================================================ */
  const P15 = {
    id: 'p15', title: 'Pakker med pip', laerTitle: 'Python-pakker og pip', del: DEL2, delDesc: DEL2_DESC,
    desc: 'Installer kode andre har skrevet: pip install, list, show, uninstall og requirements.txt.',
    laer: `
      <h4>Du trenger ikke lage alt selv</h4>
      <p>En <b>pakke</b> er kode andre har skrevet, som du kan bruke i dine programmer med <code>import</code>. Over en halv million pakker ligger på <b>PyPI</b> (pypi.org). <b>pip</b> er programmet som henter og installerer dem.</p>
      <table><tr><th>Kommando</th><th>Gjør</th></tr>
      <tr><td><code>pip install cowsay</code></td><td>Installerer pakken</td></tr>
      <tr><td><code>pip list</code></td><td>Viser hva som er installert</td></tr>
      <tr><td><code>pip show cowsay</code></td><td>Viser versjon, forfatter og hvor den ligger</td></tr>
      <tr><td><code>pip uninstall cowsay</code></td><td>Fjerner pakken</td></tr>
      <tr><td><code>pip freeze</code></td><td>Lister pakkene med versjon, i formatet <code>navn==versjon</code></td></tr>
      <tr><td><code>pip install -r requirements.txt</code></td><td>Installerer alt som står i filen</td></tr></table>
      <p>Mangler en pakke, gir <code>import</code> feilen <b>ModuleNotFoundError</b>.</p>
      <h4>requirements.txt</h4>
      <p>Et prosjekt har ofte en fil <b>requirements.txt</b> med én pakke per linje. Da kan alle (og du på en ny PC) installere det programmet trenger med én kommando.</p>
      <h4>Vær forsiktig</h4>
      <p>Hvem som helst kan legge ut pakker. Noen lager <b>falske pakker med nesten like navn</b> (for eksempel <i>reqeusts</i> i stedet for <i>requests</i>) i håp om at noen skriver feil. Skriv navnet nøyaktig, og installer bare pakker du vet hva er. På en skole-PC kan pip være sperret: spør læreren.</p>
      <p>Store prosjekter bruker et <b>virtuelt miljø</b> (<code>python -m venv</code>), så hvert prosjekt har sine egne pakker. Det er neste steg etter dette kurset.</p>`,
    oppdrag: [
      {
        id: 'p15o1', title: 'Installer en pakke', lukk: ['kode'],
        setup: F => { if (window.Pip) Pip.reset(); F.ensureFolder(P_KODE); FS.silentRemoveAll('ku.py'); },
        steps: [
          { laer: true, quiz: { q: 'Hva er en Python-pakke?', options: ['Kode andre har skrevet, som du kan importere i programmet ditt', 'En ZIP-fil med bilder', 'Et nytt programmeringsspråk'], answer: 0 } },
          { laer: true, quiz: { q: 'Hvilken feil får du hvis du importerer en pakke som ikke er installert?', options: ['ModuleNotFoundError', 'SyntaxError', 'ValueError'], answer: 0 } },
          { laer: true, quiz: { q: 'Hvorfor må du stave pakkenavnet nøyaktig?', options: ['Det finnes falske pakker med nesten like navn', 'pip er treg', 'Det spiller ingen rolle'], answer: 0 } },
          { text: 'Lag <code>ku.py</code> i Kode-mappen:<br><code>import cowsay</code><br><code>cowsay.cow("Hei fra Python!")</code><br>Kjør den. Du får <b>ModuleNotFoundError</b>, for pakken er ikke installert.', check: S => ran(S, 'ku.py', d => d.error === 'ModuleNotFoundError') },
          { text: 'Installer pakken: <code>pip install cowsay</code>', check: S => pipEv(S, 'install', d => d.name === 'cowsay' && d.ok) || (window.Pip && Pip.has('cowsay')) },
          { text: 'Kjør <code>ku.py</code> igjen.', check: S => ranOk(S, 'ku.py', d => /\^__\^/.test(d.output)) },
          { text: 'Se hva som er installert: <code>pip list</code>', check: S => pipEv(S, 'list') },
          { text: 'Se hvem som har laget pakken: <code>pip show cowsay</code>', check: S => pipEv(S, 'show', d => d.ok) },
          { text: 'Skrivefeil er farlige med pip. Prøv <code>pip install cowsey</code> (med feil stavemåte) og les hva som skjer.', check: S => pipEv(S, 'install', d => !d.ok && !d.real) },
          { quiz: { q: 'Her fant ikke pip noen «cowsey». Hva kunne skjedd på en ekte PC?', options: ['Du kunne installert en falsk pakke med skadelig kode', 'Ingenting, pip retter alltid skrivefeil', 'PC-en ville blitt raskere'], answer: 0 } }
        ]
      },
      {
        id: 'p15o2', title: 'requirements.txt', lukk: ['kode'],
        setup: F => {
          if (window.Pip) Pip.reset();
          purge(P_VITS); F.ensureFolder(P_VITS);
          F.ensureFile(P_VITS, 'vits.py', 'import cowsay\nimport pyjokes\n\ncowsay.cow(pyjokes.get_joke())\n');
        },
        steps: [
          { text: 'Gå til mappen <code>vitser</code> (<code>cd ~\\Documents\\Kode\\vitser</code>) og kjør <code>python vits.py</code>. Den trenger to pakker som ikke er installert.', check: S => ran(S, 'vits.py', d => d.error === 'ModuleNotFoundError') },
          { text: 'Lag filen <code>requirements.txt</code> i mappen med de to pakkene programmet importerer, én per linje: <b>cowsay</b> og <b>pyjokes</b>.', hint: 'Lag filen i Kode (code requirements.txt), eller: Set-Content requirements.txt "cowsay", og Add-Content requirements.txt "pyjokes".', check: S => { const c = innhold(P_VITS, 'requirements.txt').toLowerCase(); return /\bcowsay\b/.test(c) && /\bpyjokes\b/.test(c); } },
          { text: 'Installer alt på én gang: <code>pip install -r requirements.txt</code>', check: S => pipEv(S, 'requirements') && window.Pip && Pip.has('cowsay') && Pip.has('pyjokes') },
          { text: 'Kjør <code>vits.py</code> igjen.', check: S => ranOk(S, 'vits.py') },
          { text: 'Skriv <code>pip freeze</code>. Den viser versjonene i et format du kan lime rett inn i requirements.txt.', check: S => pipEv(S, 'freeze') },
          { text: 'Fjern en pakke: <code>pip uninstall pyjokes</code>, og svar <b>Y</b>.', check: S => pipEv(S, 'uninstall', d => d.name === 'pyjokes' && d.ok) },
          { quiz: { q: 'Hvorfor har prosjekter en requirements.txt?', options: ['Så alle kan installere det programmet trenger med én kommando', 'Den gjør programmet raskere', 'pip krever det'], answer: 0 } }
        ]
      }
    ]
  };

  KURS_PROG.push(P8, P9, P10, P11, P12, P13, P14, P15);

  /* ---------- Mesterprøver ---------- */
  addMasterProg('p8', {
    lukk: ['kode'],
    title: 'Programmet som velger',
    intro: 'Lag aldersgrense.py: spør om alder. Under 13 gir «For ung til sosiale medier», ellers «Velkommen!».',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('aldersgrense.py'); },
    goals: [
      { text: 'Lag <b>aldersgrense.py</b> med <b>if</b> og <b>else</b>', check: S => { const c = kode('aldersgrense.py'); return has(c, /^\s*if\b/m) && has(c, /^\s*else\s*:/m); } },
      { text: 'Programmet gir <b>forskjellig</b> svar for 10 og 15 år', check: S => { const c = kode('aldersgrense.py'); const a = pyTest(c, ['10']), b = pyTest(c, ['15']); return a.ok && b.ok && a.out.trim() && b.out.trim() && a.out !== b.out; } },
      { text: 'Grensen er riktig: 12 er for ung, 13 er velkommen', check: S => { const c = kode('aldersgrense.py'); return pyTest(c, ['12']).out === pyTest(c, ['10']).out && pyTest(c, ['13']).out === pyTest(c, ['15']).out && pyTest(c, ['12']).out !== pyTest(c, ['13']).out; } },
      { text: 'Kjør det og svar på spørsmålet', check: S => ranOk(S, 'aldersgrense.py', d => d.usedInput) }
    ]
  }, ['Lag et lite program med if/elif/else om noe du liker, for eksempel en quiz om favorittlaget ditt.']);

  addMasterProg('p9', {
    lukk: ['kode'],
    title: 'Nedtelling',
    intro: 'Lag nedtelling.py som teller ned fra 10 til 1 med en løkke, og skriver «Takeoff!» til slutt.',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('nedtelling.py'); },
    goals: [
      { text: 'Lag <b>nedtelling.py</b> med en <b>løkke</b> (for eller while)', check: S => has(kode('nedtelling.py'), /\b(for|while)\b/) },
      { text: 'Utskriften teller <b>10, 9, 8 … 1</b> i riktig rekkefølge', check: S => { const r = pyTest(kode('nedtelling.py')); const n = lines(r.out).map(l => (l.match(/-?\d+/) || [null])[0]).filter(x => x !== null).map(Number); return r.ok && n.slice(0, 10).join(',') === '10,9,8,7,6,5,4,3,2,1'; } },
      { text: 'Og skriver <b>Takeoff!</b> til slutt', check: S => { const L = lines(pyTest(kode('nedtelling.py')).out); return L.length >= 11 && /takeoff/i.test(L[L.length - 1]); } },
      { text: 'Kjør det', check: S => ranOk(S, 'nedtelling.py') }
    ]
  }, ['Skriv ut 5-gangen med en for-løkke i Python på din egen PC.']);

  addMasterProg('p10', {
    lukk: ['kode'],
    title: 'Favorittene',
    intro: 'Lag favoritter.py med en liste over minst tre favoritter (spill, mat, artister …). Skriv ut hver på en egen linje og hvor mange det er.',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('favoritter.py'); },
    goals: [
      { text: 'Lag <b>favoritter.py</b> med en <b>liste</b> på minst tre elementer', check: S => { const m = /\[([^\]]*)\]/.exec(kode('favoritter.py')); return !!m && m[1].split(',').filter(x => x.trim()).length >= 3; } },
      { text: 'Gå gjennom lista med <b>for</b>', check: S => has(kode('favoritter.py'), /\bfor\b\s+\w+\s+in\b/) },
      { text: 'Skriv ut <b>antallet</b> med <b>len()</b>, og kjør det', check: S => ranOk(S, 'favoritter.py', d => /len\s*\(/.test(d.source) && lines(d.output).length >= 4) }
    ]
  }, ['Lag en liste i Python med navnene i gruppa di, og skriv dem ut i alfabetisk rekkefølge med sorted().']);

  addMasterProg('p11', {
    lukk: ['kode'],
    title: 'Temperaturkonverteren',
    intro: 'Lag konverter.py med funksjonen celsius_til_fahrenheit(c), som returnerer c × 9 / 5 + 32.',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('konverter.py'); },
    goals: [
      { text: 'Lag <b>konverter.py</b> med funksjonen <b>celsius_til_fahrenheit(c)</b> og <b>return</b>', check: S => { const c = kode('konverter.py'); return has(c, /def\s+celsius_til_fahrenheit\s*\(/) && has(c, /\breturn\b/); } },
      { text: 'Funksjonen gir 212 for 100 og 32 for 0', check: S => { const r = pyTest(kode('konverter.py') + '\nprint("T1", celsius_til_fahrenheit(100))\nprint("T2", celsius_til_fahrenheit(0))\n'); return r.ok && /T1 212(\.0)?\b/.test(r.out) && /T2 32(\.0)?\b/.test(r.out); } },
      { text: 'Kjør programmet uten feil', check: S => ranOk(S, 'konverter.py') }
    ]
  }, ['Finn kode du har skrevet før som gjentar seg, og lag en funksjon av den.']);

  addMasterProg('p12', {
    lukk: ['kode'],
    title: 'Finn den skjulte feilen',
    intro: 'fikk4.py skal telle hvor mange som fikk 4 eller bedre. Det gir ingen feilmelding, men svaret er feil.',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('fikk4.py'); F.ensureFile(P_KODE, 'fikk4.py', FIKK4); },
    goals: [
      { text: 'Kjør <b>fikk4.py</b> og se svaret', check: S => ran(S, 'fikk4.py') },
      { text: 'Rett feilen, så programmet svarer <b>4</b>', check: S => { const c = kode('fikk4.py'); const r = pyTest(c); const L = lines(r.out); return r.ok && L.length && num(L[L.length - 1], 4) && c !== FIKK4; } },
      { text: 'Programmet regner riktig også for andre lister (testes med [4, 4, 4, 3])', check: S => { const c = kode('fikk4.py').replace(/karakterer\s*=\s*\[[^\]]*\]/, 'karakterer = [4, 4, 4, 3]'); const L = lines(pyTest(c).out); return L.length && num(L[L.length - 1], 3); } }
    ]
  }, ['Når et program gir feil svar: test med et eksempel du vet svaret på, og bruk print() for å se hva som skjer.']);

  addMasterProg('p13', {
    lukk: ['kode'],
    title: 'Temperaturrapporten',
    intro: 'temperaturer.txt har én temperatur per linje. Lag temperatur.py som leser filen og skriver snittet til filen rapport.txt.',
    setup: F => { F.ensureFolder(P_KODE); ['temperatur.py', 'temperaturer.txt', 'rapport.txt'].forEach(n => FS.silentRemoveAll(n)); F.ensureFile(P_KODE, 'temperaturer.txt', TEMP); },
    goals: [
      { text: 'Lag <b>temperatur.py</b> som leser <b>temperaturer.txt</b> med open()', check: S => has(kode('temperatur.py'), /open\s*\(\s*["']temperaturer\.txt/) },
      { text: 'Kjør programmet fra Kode-mappen uten feil', check: S => ranOk(S, 'temperatur.py') },
      { text: '<b>rapport.txt</b> inneholder snittet (3.0)', check: S => /(^|[^\d])3([.,]0+)?(?!\d)/.test(kode('rapport.txt')) }
    ]
  }, ['Lag et program som lagrer noe i en fil og leser det igjen neste gang det kjøres.']);

  addMasterProg('p14', {
    lukk: ['kode'],
    title: 'Ditt eget repo',
    intro: 'Lag et repo fra bunnen i mappen mesterrepo, med minst to commits og en ren arbeidsmappe.',
    setup: F => {
      if (window.Firmaportal) Firmaportal.markInstalled('git');
      F.ensureFolder(P_KODE); purge([...P_KODE, 'mesterrepo']);
    },
    goals: [
      { text: 'Lag mappen <b>mesterrepo</b> i Kode-mappen og gjør den til et repo', check: S => gitEv(S, 'init', d => /\\mesterrepo$/i.test(d.path)) },
      { text: 'Minst <b>to commits</b> i repoet', check: S => { const r = repo([...P_KODE, 'mesterrepo']); return !!r && r.commits.length >= 2; } },
      { text: '<b>git status</b> viser at alt er lagret (working tree clean)', check: S => { const r = repo([...P_KODE, 'mesterrepo']); return !!r && r.commits.length >= 2 && gitEv(S, 'status', d => d.clean); } }
    ]
  }, ['Installer Git på din egen PC (eller bruk Source Control i VS Code) og lag et repo for et prosjekt du jobber med.', 'Lag en gratis konto på GitHub hvis skolen tillater det, og se hvordan andre prosjekter ser ut.']);

  addMasterProg('p15', {
    lukk: ['kode'],
    title: 'Klart for en ny PC',
    intro: 'Programmet i mappen mesterpakker trenger en pakke. Gjør prosjektet klart, slik at hvem som helst kan installere det som trengs.',
    setup: F => { if (window.Pip) Pip.reset(); const P = [...P_KODE, 'mesterpakker']; purge(P); F.ensureFolder(P); F.ensureFile(P, 'hilsen.py', 'import cowsay\n\ncowsay.tux("Klar for en ny PC!")\n'); },
    goals: [
      { text: 'Lag <b>requirements.txt</b> i mappen mesterpakker med pakken programmet trenger', check: S => /\bcowsay\b/i.test(innhold([...P_KODE, 'mesterpakker'], 'requirements.txt')) },
      { text: 'Installer med <b>pip install -r requirements.txt</b>', check: S => pipEv(S, 'requirements', d => d.names.includes('cowsay')) && window.Pip && Pip.has('cowsay') },
      { text: 'Kjør programmet uten feil', check: S => S.ev('py-run', d => d.ok && /mesterpakker\\hilsen\.py$/i.test(d.path)) }
    ]
  }, ['Se om et Python-prosjekt du finner på nettet har en requirements.txt, og les hvilke pakker det bruker.']);

  /* ---------- Ukens øving ---------- */
  REPETISJON_PROG.push(
    { id: 'pr10', kurs: 'p8', text: 'Lag et program med <code>if</code> og <code>else</code>, og kjør det.', check: S => S.ev('py-run', d => d.ok && /^\s*if\b/m.test(d.source) && /^\s*else\s*:/m.test(d.source)) },
    { id: 'pr11', kurs: 'p9', text: 'Lag og kjør et program med en <code>for</code>-løkke og <code>range()</code>.', check: S => S.ev('py-run', d => d.ok && /\bfor\b.+\bin\s+range\s*\(/.test(d.source)) },
    { id: 'pr12', kurs: 'p10', text: 'Lag og kjør et program som legger noe til i en liste med <code>append</code>.', check: S => S.ev('py-run', d => d.ok && /\.append\s*\(/.test(d.source)) },
    { id: 'pr13', kurs: 'p11', text: 'Lag og kjør et program med en egen funksjon (<code>def</code> og <code>return</code>).', check: S => S.ev('py-run', d => d.ok && /\bdef\s+\w+\s*\(/.test(d.source) && /\breturn\b/.test(d.source)) },
    { id: 'pr14', kurs: 'p12', text: 'Lag og kjør et program med <code>try</code> og <code>except ValueError</code>.', check: S => S.ev('py-run', d => d.ok && /\btry\s*:/.test(d.source) && /except\s+ValueError/.test(d.source)) },
    { id: 'pr15', kurs: 'p13', text: 'Lag og kjør et program som skriver til en fil med <code>open(…, "w")</code> eller <code>"a"</code>.', check: S => S.ev('py-run', d => d.ok && /open\s*\([^)]*["'][wa]["']/.test(d.source)) },
    { id: 'pr16', kurs: 'p14', text: 'Skriv <code>git status</code> i et repo, og <code>git log --oneline</code>.', check: S => S.ev('git', d => d.cmd === 'status') && S.ev('git', d => d.cmd === 'log' && d.oneline) },
    { id: 'pr17', kurs: 'p15', text: 'Vis hvilke pakker som er installert med <code>pip list</code>.', check: S => S.ev('pip', d => d.cmd === 'list') }
  );
})();
