/* Kurssett for programmeringselever: terminal (PowerShell), Kode-editoren og Python.
   Forutsetter grunnkurset. Brukes av programmering.html (window.KURS_ACTIVE = KURS_PROG). */

const P_KODE = ['Denne PC-en', 'Dokumenter', 'Kode'];
const HOME_RX = /^C:\\Users\\Elev$/i;
const ends = (path, tail) => new RegExp('\\\\' + tail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i').test(path);
const cmd = (S, pred) => S.ev('term-cmd', d => d.ok && (!pred || pred(d)));
const ran = (S, file, pred) => S.ev('py-run', d => d.file.toLowerCase() === file.toLowerCase() && (!pred || pred(d)));
const lines = s => (s || '').split('\n').filter(l => l.trim()).length;

const KURS_PROG = [
  /* ============================================================ */
  {
    id: 'p1', title: 'Terminalen', laerTitle: 'hva terminalen er',
    desc: 'PowerShell: se hvor du er, liste filer og bytte mappe.',
    laer: `
      <h4>Hva er en terminal?</h4>
      <p>En <b>terminal</b> er et program der du styrer PC-en ved å skrive kommandoer i stedet for å klikke. På Windows heter kommandospråket <b>PowerShell</b>. Du skriver en kommando, trykker <kbd>Enter</kbd>, og får svar som tekst.</p>
      <p>Linjen <code>PS C:\\Users\\Elev&gt;</code> kalles <b>ledeteksten</b>. Den viser hvilken mappe du står i akkurat nå. Alt du gjør, skjer i den mappen.</p>
      <h4>De tre viktigste kommandoene</h4>
      <table><tr><th>Kommando</th><th>Gjør</th></tr>
      <tr><td><code>pwd</code></td><td>Viser mappen du står i (<i>print working directory</i>)</td></tr>
      <tr><td><code>ls</code></td><td>Lister filene og mappene der du står (<i>list</i>)</td></tr>
      <tr><td><code>cd Navn</code></td><td>Går inn i mappen Navn (<i>change directory</i>). <code>cd ..</code> går ett nivå opp, <code>cd ~</code> går hjem.</td></tr></table>
      <h4>Engelske mappenavn</h4>
      <p>Filutforsker viser norske navn, men på disken heter mappene det engelske. I terminalen må du bruke de engelske:</p>
      <table><tr><th>Filutforsker</th><th>Terminal</th></tr><tr><td>Dokumenter</td><td>Documents</td></tr><tr><td>Skrivebord</td><td>Desktop</td></tr><tr><td>Nedlastinger</td><td>Downloads</td></tr><tr><td>Bilder</td><td>Pictures</td></tr></table>
      <p>Store og små bokstaver spiller ingen rolle i PowerShell. <code>cd documents</code> virker like bra.</p>`,
    oppdrag: [
      {
        id: 'p1o1', title: 'Første kommandoer',
        steps: [
          { laer: true, quiz: { q: 'Hva viser ledeteksten PS C:\\Users\\Elev> ?', options: ['Navnet på PC-en', 'Mappen du står i', 'Klokkeslettet'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva heter mappen Dokumenter i terminalen?', options: ['Dokumenter', 'Docs', 'Documents'], answer: 2 } },
          { laer: true, quiz: { q: 'Hvilken kommando lister filene der du står?', options: ['ls', 'pwd', 'cd'], answer: 0 } },
          { text: 'Åpne <b>Terminal</b> fra oppgavelinjen (det mørke ikonet med <code>&gt;_</code>).', check: S => S.ev('window-open', d => d.app === 'terminal') },
          { text: 'Skriv <code>pwd</code> og trykk <kbd>Enter</kbd>. Svaret er <code>C:\\Users\\Elev</code>: hjemmemappen din.', hint: 'Klikk i terminalvinduet først, så tastaturet skriver dit.', check: S => cmd(S, d => d.name === 'Get-Location') },
          { text: 'Skriv <code>ls</code> for å liste innholdet. Legg merke til de engelske navnene: <b>Documents</b> er Dokumenter.', check: S => cmd(S, d => d.name === 'Get-ChildItem') },
          { text: 'Gå inn i Dokumenter: <code>cd Documents</code>. Se at ledeteksten endrer seg.', hint: 'cd, mellomrom, Documents. Husk engelsk navn.', check: S => S.ev('term-cd', d => ends(d.path, 'Documents')) },
          { text: 'Skriv <code>ls</code> igjen. Nå ser du det som ligger i Dokumenter.', check: S => cmd(S, d => d.name === 'Get-ChildItem' && ends(d.cwd, 'Documents')) },
          { text: 'Gå ett nivå opp: <code>cd ..</code> (to punktum betyr «mappen over»).', check: S => S.ev('term-cd', d => d.arg === '..') },
          { text: 'Gå inn i Bilder med <code>cd Pictures</code>, og så hjem igjen med <code>cd ~</code>.', hint: 'Tegnet ~ (tilde) betyr hjemmemappen. På norsk tastatur: AltGr + ¨ (tasten ved siden av Å), deretter mellomrom.', check: S => S.ev('term-cd', d => ends(d.path, 'Pictures')) && S.ev('term-cd', d => d.arg === '~' && HOME_RX.test(d.path)) },
          { quiz: { q: 'Hva gjør kommandoen cd .. ?', options: ['Går ett nivå opp, til mappen over', 'Lister filene', 'Sletter mappen'], answer: 0 } },
          { quiz: { q: 'Ledeteksten viser PS C:\\Users\\Elev\\Documents>. Hvor står du?', options: ['I hjemmemappen', 'I mappen Documents (Dokumenter)', 'På skrivebordet'], answer: 1 } }
        ]
      },
      {
        id: 'p1o2', title: 'Raskere: Tab, piltaster og hjelp',
        intro: 'Ingen som bruker terminalen skriver alt selv. <kbd>Tab</kbd> fullfører navn, og piltastene henter kommandoer du har brukt før.',
        steps: [
          { text: 'Skriv <code>cd Doc</code> og trykk <kbd>Tab</kbd>. Terminalen fullfører til <code>Documents\\</code>. Trykk <kbd>Enter</kbd>.', hint: 'Tab ligger over Caps Lock, til venstre på tastaturet.', check: S => S.ev('term-tab', d => /documents/i.test(d.completed)) && S.ev('term-cd', d => ends(d.path, 'Documents')) },
          { text: 'Skriv <code>ls</code>.', check: S => cmd(S, d => d.name === 'Get-ChildItem') },
          { text: 'Trykk <kbd>↑</kbd> (pil opp). Forrige kommando kommer tilbake. Trykk <kbd>Enter</kbd> for å kjøre den igjen.', check: S => S.ev('term-history') && S.evCount('term-cmd', d => d.name === 'Get-ChildItem') >= 1 && S.ev('term-cmd', d => d.name === 'Get-ChildItem') },
          { text: 'Tøm skjermen med <code>cls</code> (eller <code>clear</code>).', check: S => S.ev('term-clear') },
          { text: 'Få hjelp om en kommando: <code>help ls</code>.', check: S => S.ev('term-help', d => d.topic === 'Get-ChildItem') },
          { text: '<code>ls</code> er egentlig et kortnavn (alias). Skriv <code>Get-Alias ls</code> for å se hva det står for.', check: S => cmd(S, d => d.name === 'Get-Alias') },
          { quiz: { q: 'Du har skrevet cd Dow og trykker Tab. Hva skjer?', options: ['Terminalen fullfører til Downloads\\', 'Terminalen sletter det du skrev', 'Ingenting, Tab virker ikke i terminalen'], answer: 0 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p2', title: 'Filer og mapper fra terminalen', laerTitle: 'lage, flytte og slette',
    desc: 'mkdir, New-Item, Get-Content, Copy-Item, Move-Item, Remove-Item.',
    laer: `
      <table><tr><th>Kommando</th><th>Gjør</th></tr>
      <tr><td><code>mkdir Navn</code></td><td>Lager en mappe</td></tr>
      <tr><td><code>New-Item fil.py</code></td><td>Lager en tom fil (kortnavn: <code>ni</code>)</td></tr>
      <tr><td><code>cat fil.py</code></td><td>Viser innholdet i en fil (<code>Get-Content</code>)</td></tr>
      <tr><td><code>Set-Content fil.txt 'tekst'</code></td><td>Skriver tekst til en fil (erstatter)</td></tr>
      <tr><td><code>echo 'tekst' &gt; fil.txt</code></td><td>Det samme: pilen <code>&gt;</code> sender utskriften til en fil. <code>&gt;&gt;</code> legger til nederst.</td></tr>
      <tr><td><code>cp fra til</code></td><td>Kopierer (<code>Copy-Item</code>)</td></tr>
      <tr><td><code>mv fra til</code></td><td>Flytter (<code>Move-Item</code>)</td></tr>
      <tr><td><code>ren gammel ny</code></td><td>Gir nytt navn (<code>Rename-Item</code>)</td></tr>
      <tr><td><code>rm fil</code></td><td>Sletter (<code>Remove-Item</code>). <b>Går ikke via papirkurven!</b></td></tr>
      <tr><td><code>tree</code></td><td>Tegner mappestrukturen</td></tr>
      <tr><td><code>explorer .</code></td><td>Åpner mappen du står i, i Filutforsker</td></tr></table>
      <p>Punktumet <code>.</code> betyr «mappen jeg står i». Tekst med mellomrom eller spesialtegn settes i anførselstegn: <code>'print("Hei")'</code>.</p>`,
    oppdrag: [
      {
        id: 'p2o1', title: 'Lag et prosjekt',
        setup: F => { F.ensureFolder(['Denne PC-en', 'Dokumenter']); },
        steps: [
          { laer: true, quiz: { q: 'Hvilken kommando lager en ny mappe?', options: ['cat', 'mkdir', 'rm'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva gjør > i  echo \'hei\' > fil.txt ?', options: ['Sender utskriften til filen i stedet for skjermen', 'Sammenligner to tall', 'Åpner filen i Kode'], answer: 0 } },
          { laer: true, quiz: { q: 'Hva er forskjellen på rm i terminalen og Delete i Filutforsker?', options: ['Ingen forskjell', 'rm flytter filen til Nedlastinger', 'rm sletter for godt, uten papirkurv'], answer: 2 } },
          { text: 'Gå til Dokumenter i terminalen: <code>cd ~\\Documents</code>.', check: S => S.ev('term-cd', d => ends(d.path, 'Documents')) },
          { text: 'Lag en mappe for koden din: <code>mkdir Kode</code>.', check: S => S.folderIn('Kode', ['Denne PC-en', 'Dokumenter']) },
          { text: 'Gå inn i den: <code>cd Kode</code>.', check: S => S.ev('term-cd', d => ends(d.path, 'Documents\\Kode')) },
          { text: 'Lag en tom fil: <code>New-Item hello.py</code>.', check: S => S.fileIn('hello.py', P_KODE) },
          { text: 'Skriv <code>ls</code>. Filen er der, med 0 i Length (den er tom).', check: S => cmd(S, d => d.name === 'Get-ChildItem' && ends(d.cwd, 'Kode')) },
          { text: 'Legg kode i filen fra terminalen: <code>Set-Content hello.py \'print("Hei fra terminalen")\'</code>', hint: 'Enkle anførselstegn ytterst, doble innerst. Da blir dobbelt-anførselstegnene med i filen.', check: S => /print\s*\(/.test(S.content('hello.py')) },
          { text: 'Se innholdet: <code>cat hello.py</code>.', check: S => S.ev('term-cat', d => d.name === 'hello.py') },
          { text: 'Kjør programmet: <code>python hello.py</code>.', check: S => ran(S, 'hello.py', d => d.ok) },
          { text: 'Åpne mappen i Filutforsker fra terminalen: <code>explorer .</code>. Der er filen. Lukk vinduet etterpå.', check: S => cmd(S, d => d.name === 'explorer') && S.ev('window-close', d => d.app === 'explorer') },
          { quiz: { q: 'Hva betyr punktumet i «explorer .»?', options: ['Mappen jeg står i', 'Hjemmemappen', 'En tom fil'], answer: 0 } }
        ]
      },
      {
        id: 'p2o2', title: 'Kopier, flytt og slett',
        setup: F => { F.ensureFile(P_KODE, 'hello.py', 'print("Hei fra terminalen")'); F.silentRemoveAll('kopi.py'); F.silentRemoveAll('test.py'); },
        steps: [
          { text: 'Stå i <code>Kode</code>-mappen (<code>cd ~\\Documents\\Kode</code>) og lag en kopi: <code>cp hello.py kopi.py</code>.', check: S => S.fileIn('kopi.py', P_KODE) },
          { text: 'Gi kopien nytt navn: <code>ren kopi.py test.py</code>.', check: S => S.fileIn('test.py', P_KODE) && !S.fileIn('kopi.py', P_KODE) },
          { text: 'Lag mappen <code>gammelt</code>: <code>mkdir gammelt</code>.', check: S => S.folderIn('gammelt', P_KODE) },
          { text: 'Flytt filen inn i mappen: <code>mv test.py gammelt</code>.', check: S => S.fileIn('test.py', [...P_KODE, 'gammelt']) },
          { text: 'Se strukturen: <code>tree</code>.', check: S => S.ev('term-tree') },
          { text: 'Slett filen: <code>rm gammelt\\test.py</code>. (Skråstreken går også: <code>rm gammelt/test.py</code>.)', check: S => S.gone('test.py') && S.ev('term-rm', d => d.name === 'test.py') },
          { text: 'Slett den tomme mappen: <code>rm gammelt</code>.', check: S => !S.folderIn('gammelt', P_KODE) },
          { text: 'Åpne <b>Papirkurven</b> i Filutforsker og sjekk: filen er <i>ikke</i> der. Terminalen sletter for godt.', check: S => S.ev('explorer-nav', d => d.name === 'Papirkurv') },
          { quiz: { q: 'Du sletter en fil med rm i terminalen. Hvor havner den?', options: ['I papirkurven', 'Den er borte for godt', 'I mappen gammelt'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p3', title: 'Stier', laerTitle: 'absolutte og relative stier',
    desc: 'C:\\Users\\Elev\\… mot ..\\Kode, anførselstegn og Tab.',
    laer: `
      <h4>Absolutt sti</h4>
      <p>En <b>absolutt sti</b> starter helt fra toppen, med stasjonen: <code>C:\\Users\\Elev\\Documents\\Kode</code>. Den peker alltid på samme sted, uansett hvor du står.</p>
      <h4>Relativ sti</h4>
      <p>En <b>relativ sti</b> starter fra mappen du står i: <code>Documents\\Kode</code> betyr «Documents inni her, og så Kode». <code>..\\Bilder</code> betyr «opp ett nivå, så inn i Bilder».</p>
      <table><tr><th>Tegn</th><th>Betyr</th></tr><tr><td><code>.</code></td><td>mappen jeg står i</td></tr><tr><td><code>..</code></td><td>mappen over</td></tr><tr><td><code>~</code></td><td>hjemmemappen (C:\\Users\\Elev)</td></tr><tr><td><code>\\</code></td><td>skille mellom mapper (skråstrek / virker også)</td></tr></table>
      <h4>Mellomrom i navn</h4>
      <p>Har mappen mellomrom i navnet, må stien i anførselstegn: <code>cd "Mine prosjekter"</code>. Eller bruk <kbd>Tab</kbd>, så setter terminalen anførselstegnene for deg. Derfor unngår programmerere mellomrom i mappenavn.</p>`,
    oppdrag: [
      {
        id: 'p3o1', title: 'Absolutt og relativ sti',
        setup: F => { F.ensureFolder(P_KODE); F.ensureFolder(['Denne PC-en', 'Dokumenter', 'Mine prosjekter']); },
        steps: [
          { laer: true, quiz: { q: 'Hvilken av disse stiene er relativ?', options: ['C:\\Users\\Elev\\Documents', 'Documents\\Kode', 'C:\\'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva betyr .. i en sti?', options: ['Mappen jeg står i', 'Hjemmemappen', 'Mappen over'], answer: 2 } },
          { laer: true, quiz: { q: 'Mappen heter «Mine prosjekter». Hvordan går du inn i den?', options: ['cd "Mine prosjekter"', 'cd Mine prosjekter', 'cd Mine_prosjekter'], answer: 0 } },
          { text: 'Gå hjem: <code>cd ~</code>.', check: S => S.ev('term-cd', d => d.arg === '~') },
          { text: 'Gå rett til Kode-mappen med en <b>absolutt</b> sti: <code>cd C:\\Users\\Elev\\Documents\\Kode</code>', check: S => S.ev('term-cd', d => /^c:/i.test(d.arg) && ends(d.path, 'Documents\\Kode')) },
          { text: 'Gå to nivåer opp på én gang: <code>cd ..\\..</code>', check: S => S.ev('term-cd', d => /^\.\.[\\/]\.\.$/.test(d.arg) && HOME_RX.test(d.path)) },
          { text: 'Gå inn igjen med en <b>relativ</b> sti: <code>cd Documents\\Kode</code>', check: S => S.ev('term-cd', d => /^\.?[\\/]?documents[\\/]kode[\\/]?$/i.test(d.arg)) },
          { text: 'Mappen «Mine prosjekter» ligger ved siden av Kode og har mellomrom i navnet. Gå dit: <code>cd "..\\Mine prosjekter"</code> (eller skriv <code>cd ..\\Mi</code> og trykk Tab).', check: S => S.ev('term-cd', d => ends(d.path, 'Mine prosjekter')) },
          { text: 'List innholdet i en annen mappe uten å gå dit: <code>ls ~\\Documents</code>', check: S => cmd(S, d => d.name === 'Get-ChildItem' && /documents/i.test((d.args[0] || '') + (d.opts.path || ''))) },
          { text: 'Gå til Kode med relativ sti fra der du står: <code>cd ..\\Kode</code>, og bekreft med <code>pwd</code>.', check: S => S.ev('term-cd', d => ends(d.path, 'Documents\\Kode')) && cmd(S, d => d.name === 'Get-Location') },
          { quiz: { q: 'Hvilken av disse er en absolutt sti?', options: ['..\\Kode', 'Documents\\Kode', 'C:\\Users\\Elev\\Documents\\Kode'], answer: 2 } },
          { quiz: { q: 'Hva betyr ~ i terminalen?', options: ['Mappen over', 'Hjemmemappen din', 'Papirkurven'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p4', title: 'Kode-editoren', laerTitle: 'editoren og arbeidsflyten',
    desc: 'code ., skriv kode, lagre, kjør. Rediger og kjør igjen.',
    laer: `
      <h4>Editor + terminal</h4>
      <p>Kode skrives i en <b>editor</b> (på ekte PC-er ofte Visual Studio Code) og kjøres i <b>terminalen</b>. Arbeidsflyten er alltid den samme:</p>
      <ol><li>Åpne prosjektmappen i editoren: <code>code .</code> fra terminalen</li><li>Skriv eller endre kode</li><li><b>Lagre</b> (<kbd>Ctrl</kbd>+<kbd>S</kbd>). En prikk ● på fanen betyr ulagret. Programmet du kjører er det som er <i>lagret</i>!</li><li>Kjør: <code>python fil.py</code> i terminalen, eller ▶-knappen</li><li>Les utskriften, gå til 2</li></ol>
      <h4>I editoren</h4>
      <p>Til venstre: filene i mappen. Øverst: faner for åpne filer. <kbd>Tab</kbd> gir innrykk (4 mellomrom), som Python trenger. Linjenumrene brukes i feilmeldinger.</p>`,
    oppdrag: [
      {
        id: 'p4o1', title: 'Første program i Kode',
        setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('hilsen.py'); },
        steps: [
          { laer: true, quiz: { q: 'Hva gjør  code .  i terminalen?', options: ['Kjører programmet', 'Åpner mappen du står i, i Kode-editoren', 'Sletter filen'], answer: 1 } },
          { laer: true, quiz: { q: 'Hvilken versjon av programmet kjører  python fil.py ?', options: ['Den som er lagret på disken', 'Den du ser i editoren, også ulagret', 'Begge'], answer: 0 } },
          { laer: true, quiz: { q: 'Hva bruker Python innrykk (4 mellomrom) til?', options: ['Pynt', 'Å lage kommentarer', 'Å vise hvilke linjer som hører til en if, løkke eller funksjon'], answer: 2 } },
          { text: 'I terminalen: gå til Kode-mappen (<code>cd ~\\Documents\\Kode</code>) og åpne den i editoren: <code>code .</code>', check: S => S.ev('kode-open', d => d.name === 'Kode') },
          { text: 'Lag en ny fil i Kode: klikk <b>Ny fil</b> og kall den <code>hilsen.py</code>.', check: S => S.fileIn('hilsen.py', P_KODE) },
          { text: 'Skriv et program med en variabel og en utskrift, for eksempel:<br><code>navn = "Ola"</code><br><code>print("Hei,", navn)</code>', check: S => /=/.test(S.kodeText()) && /print\s*\(/.test(S.kodeText()) },
          { text: 'Lagre med <kbd>Ctrl</kbd>+<kbd>S</kbd>. Prikken på fanen forsvinner.', check: S => S.ev('kode-save', d => d.name === 'hilsen.py' && /print/.test(d.content)) },
          { text: 'Kjør programmet i terminalen: <code>python hilsen.py</code>', hint: 'Klikk i terminalvinduet. Står du i Kode-mappen? Sjekk ledeteksten.', check: S => ran(S, 'hilsen.py', d => d.ok) && S.ev('term-cmd', d => d.name === 'python') },
          { text: 'Endre teksten i programmet, og kjør på nytt med <b>▶ Kjør</b>-knappen i Kode. Den lagrer og kjører for deg.', check: S => S.ev('kode-run', d => d.name === 'hilsen.py') && ran(S, 'hilsen.py', d => d.ok) },
          { quiz: { q: 'Fanen viser «hilsen.py ●». Du kjører python hilsen.py. Hvilken versjon kjøres?', options: ['Den du ser i editoren', 'Den som sist ble lagret', 'Ingen, programmet nekter'], answer: 1 } }
        ]
      },
      {
        id: 'p4o2', title: 'Program med input',
        setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('alder.py'); },
        steps: [
          { text: 'Lag filen <code>alder.py</code> i Kode-mappen (i Kode eller med <code>New-Item</code>).', check: S => S.fileIn('alder.py', P_KODE) },
          { text: 'Skriv et program som spør om alder med <code>input()</code>, gjør svaret om til tall med <code>int()</code>, og skriver ut hvor gammel du blir neste år. Lagre.', hint: 'alder = int(input("Hvor gammel er du? "))\nprint("Neste år blir du", alder + 1)', check: S => /input\s*\(/.test(S.content('alder.py')) && /int\s*\(/.test(S.content('alder.py')) },
          { text: 'Kjør programmet i terminalen og svar på spørsmålet.', check: S => ran(S, 'alder.py', d => d.ok && d.usedInput) },
          { text: 'Kjør det igjen, men skriv et ord i stedet for et tall. Les feilmeldingen: <b>ValueError</b>.', check: S => ran(S, 'alder.py', d => d.error === 'ValueError') },
          { quiz: { q: 'Hvorfor trengs int() rundt input()?', options: ['input() gir alltid tekst, int() gjør den om til tall', 'int() skriver ut svaret', 'Det trengs ikke'], answer: 0 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p5', title: 'Feilsøking', laerTitle: 'å lese feilmeldinger',
    desc: 'Traceback, linjenummer, vanlige feil og Ctrl+C.',
    laer: `
      <h4>Les feilmeldingen nedenfra</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px;overflow:auto">Traceback (most recent call last):
  File "feil1.py", line 2, in &lt;module&gt;
NameError: name 'nvn' is not defined</pre>
      <ul><li><b>Nederste linje</b>: hva som gikk galt (typen feil og en forklaring)</li><li><b>Linjen over</b>: hvilken fil og hvilket <b>linjenummer</b>. Gå dit i editoren!</li></ul>
      <table><tr><th>Feil</th><th>Betyr som regel</th></tr>
      <tr><td>NameError</td><td>Et navn er skrevet feil, eller variabelen er ikke laget ennå</td></tr>
      <tr><td>SyntaxError</td><td>Kodens grammatikk er feil: mangler <code>)</code>, <code>:</code> eller anførselstegn</td></tr>
      <tr><td>IndentationError</td><td>Feil innrykk</td></tr>
      <tr><td>TypeError</td><td>Blander tekst og tall, f.eks. <code>"5" + 1</code></td></tr>
      <tr><td>ValueError</td><td>Riktig type, feil verdi, f.eks. <code>int("abc")</code></td></tr>
      <tr><td>ZeroDivisionError</td><td>Deling på null</td></tr>
      <tr><td>IndexError</td><td>Prøver å hente et element som ikke finnes i listen</td></tr></table>
      <h4>Programmet stopper ikke</h4>
      <p>En løkke som aldri blir ferdig, kjører evig. Trykk <kbd>Ctrl</kbd>+<kbd>C</kbd> i terminalen for å stoppe programmet. Python svarer med <b>KeyboardInterrupt</b>.</p>`,
    oppdrag: [
      {
        id: 'p5o1', title: 'Les feilmeldingen',
        setup: F => {
          F.ensureFolder(P_KODE);
          F.silentRemoveAll('feil1.py'); F.silentRemoveAll('feil2.py');
          F.ensureFile(P_KODE, 'feil1.py', 'navn = "Ola"\nprint("Hei", nvn)\n');
          F.ensureFile(P_KODE, 'feil2.py', 'tall = 7\nif tall > 5\n    print("stort tall")\n');
        },
        steps: [
          { laer: true, quiz: { q: 'Hvor i en traceback står typen feil og forklaringen?', options: ['I nederste linje', 'I øverste linje', 'I filnavnet'], answer: 0 } },
          { laer: true, quiz: { q: 'Programmet gir SyntaxError. Hva betyr det som regel?', options: ['PC-en er tom for minne', 'Kodens grammatikk er feil, for eksempel manglende ) eller :', 'Filen finnes ikke'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva betyr  NameError: name \'nvn\' is not defined ?', options: ['nvn er et for kort navn', 'Filen mangler', 'Python finner ikke noe som heter nvn: skrivefeil, eller variabelen er ikke laget ennå'], answer: 2 } },
          { text: 'I Kode-mappen ligger <code>feil1.py</code>. Kjør den: <code>python feil1.py</code>. Les nederste linje i feilmeldingen.', check: S => ran(S, 'feil1.py', d => d.error === 'NameError') },
          { text: 'Åpne filen i editoren (<code>code feil1.py</code>), gå til linjen feilmeldingen oppga, og rett navnet. Lagre.', check: S => S.ev('kode-save', d => d.name === 'feil1.py' && !/nvn/.test(d.content)) },
          { text: 'Kjør igjen. Nå skal det virke.', check: S => ran(S, 'feil1.py', d => d.ok) },
          { text: 'Kjør <code>feil2.py</code>. Denne gangen er det en <b>SyntaxError</b>: Python viser linjen og hvor den gikk seg vill.', check: S => ran(S, 'feil2.py', d => d.error === 'SyntaxError') },
          { text: 'Rett feilen i editoren (hva mangler på slutten av if-linjen?), lagre og kjør igjen.', hint: 'En if-setning må slutte med kolon :', check: S => ran(S, 'feil2.py', d => d.ok) },
          { quiz: { q: 'Hvor i feilmeldingen står linjenummeret?', options: ['I nederste linje', 'I linjen som starter med File "…", line …', 'Det står ikke'], answer: 1 } }
        ]
      },
      {
        id: 'p5o2', title: 'Uendelig løkke',
        setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('evig.py'); F.ensureFile(P_KODE, 'evig.py', 'teller = 1\nwhile teller > 0:\n    print("Runde", teller)\n    teller = teller + 1\n'); },
        steps: [
          { text: 'Kjør <code>python evig.py</code>. Programmet stopper aldri. Stopp det med <kbd>Ctrl</kbd>+<kbd>C</kbd> i terminalen.', hint: 'Hold Ctrl nede og trykk C mens programmet kjører.', check: S => S.ev('term-ctrlc', d => d.running) && ran(S, 'evig.py', d => d.error === 'KeyboardInterrupt') },
          { text: 'Åpne <code>evig.py</code> i editoren og endre løkka så den stopper etter 10 runder. Lagre og kjør.', hint: 'Endre betingelsen: while teller <= 10:', check: S => ran(S, 'evig.py', d => d.ok && /Runde 10/.test(d.output) && !/Runde 11/.test(d.output)) },
          { quiz: { q: 'Programmet ditt henger. Hva gjør du?', options: ['Lukker PC-en', 'Trykker Ctrl+C i terminalen', 'Venter til det blir ferdig'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p6', title: 'Prosjektstruktur', laerTitle: 'mapper i et prosjekt og filer fra kode',
    desc: 'Undermapper, lese en fil fra Python, sende utskrift til fil.',
    laer: `
      <h4>Et prosjekt er en mappe</h4>
      <p>Større programmer består av flere filer. Da lager du en <b>prosjektmappe</b> med koden øverst og undermapper for data, bilder osv.:</p>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">prosjekt\\
├── main.py
└── data\\
    └── navn.txt</pre>
      <h4>Filer fra Python</h4>
      <p>Programmet kan lese filer med <code>open()</code>. Stien er <b>relativ til mappen du kjører programmet fra</b>, så stå i prosjektmappen når du kjører:</p>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">with open("data/navn.txt") as f:
    linjer = f.readlines()
print("Antall navn:", len(linjer))</pre>
      <h4>Utskrift til fil</h4>
      <p><code>python main.py &gt; resultat.txt</code> sender alt programmet skriver ut til filen i stedet for skjermen.</p>`,
    oppdrag: [
      {
        id: 'p6o1', title: 'Et lite prosjekt',
        setup: F => { F.ensureFolder(P_KODE); const p = F.resolve([...P_KODE, 'prosjekt']); if (p) F.purge(p.id); },
        steps: [
          { laer: true, quiz: { q: 'Hva er en prosjektmappe?', options: ['En mappe med koden og undermapper for data og annet som hører til programmet', 'En mappe for alle fag', 'Papirkurven'], answer: 0 } },
          { laer: true, quiz: { q: 'open("data/navn.txt") gir FileNotFoundError, men filen finnes. Hva er mest sannsynlig?', options: ['Python er ikke installert', 'Du kjører programmet fra feil mappe: stien er relativ til der du står', 'Filen er for stor'], answer: 1 } },
          { text: 'Stå i Kode-mappen i terminalen og lag prosjektmappen: <code>mkdir prosjekt</code>', check: S => S.folderIn('prosjekt', P_KODE) },
          { text: 'Lag en undermappe for data: <code>mkdir prosjekt\\data</code>', check: S => S.folderIn('data', [...P_KODE, 'prosjekt']) },
          { text: 'Lag <code>prosjekt\\data\\navn.txt</code> med minst tre navn, ett på hver linje. Bruk Kode, eller <code>Add-Content prosjekt\\data\\navn.txt Ola</code> tre ganger med ulike navn.', check: S => { const f = S.fileIn('navn.txt', [...P_KODE, 'prosjekt', 'data']); return f && lines(S.content('navn.txt')) >= 3; } },
          { text: 'Lag <code>prosjekt\\main.py</code> som åpner <code>data/navn.txt</code>, teller linjene og skriver ut antallet. Se «Les først» for kode.', check: S => { const c = S.content('main.py'); return S.fileIn('main.py', [...P_KODE, 'prosjekt']) && /open\s*\(/.test(c) && /print\s*\(/.test(c); } },
          { text: 'Gå inn i prosjektmappen (<code>cd prosjekt</code>) og kjør: <code>python main.py</code>', hint: 'Får du FileNotFoundError? Da står du i feil mappe: stien data/navn.txt er relativ til der du kjører fra.', check: S => ran(S, 'main.py', d => d.ok && ends(d.path, 'prosjekt\\main.py') && d.output.trim().length > 0) },
          { text: 'Send utskriften til en fil: <code>python main.py &gt; resultat.txt</code>. Ingenting vises på skjermen, det havnet i filen.', check: S => S.ev('term-redirect', d => d.file === 'resultat.txt') },
          { text: 'Se resultatet: <code>cat resultat.txt</code>', check: S => S.ev('term-cat', d => d.name === 'resultat.txt') },
          { text: 'Gå opp til Kode-mappen (<code>cd ..</code>) og tegn strukturen med <code>tree</code>.', check: S => S.ev('term-tree') && cmd(S, d => d.name === 'tree' && ends(d.cwd, 'Kode')) },
          { quiz: { q: 'main.py åpner "data/navn.txt". Fra hvilken mappe må du kjøre programmet?', options: ['Fra mappen der main.py ligger (prosjektmappen)', 'Fra data-mappen', 'Fra hjemmemappen'], answer: 0 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p7', title: 'PowerShell-skript', laerTitle: 'skript i PowerShell',
    desc: '.ps1-filer, Write-Host, Read-Host, variabler og hvorfor .\\ trengs.',
    laer: `
      <h4>Skript = kommandoer i en fil</h4>
      <p>Alt du kan skrive i terminalen, kan du legge i en fil som slutter på <b>.ps1</b> og kjøre samlet. Det kalles et <b>skript</b>.</p>
      <table><tr><th>I skriptet</th><th>Gjør</th></tr>
      <tr><td><code>Write-Host "Hei"</code></td><td>Skriver tekst</td></tr>
      <tr><td><code>$navn = Read-Host "Hva heter du"</code></td><td>Spør brukeren og lagrer svaret i variabelen $navn</td></tr>
      <tr><td><code>Write-Host "Hei $navn!"</code></td><td>Variabler starter med $ og settes inn i tekst med doble anførselstegn</td></tr>
      <tr><td><code># kommentar</code></td><td>Linjer med # kjøres ikke</td></tr></table>
      <h4>Hvorfor .\\ ?</h4>
      <p>Skriver du bare <code>hei.ps1</code>, nekter PowerShell: den kjører ikke skript fra mappen du står i uten at du sier det tydelig. Det er en sikkerhetsregel. Du må skrive <code>.\\hei.ps1</code>: «hei.ps1 i <i>denne</i> mappen». På en ekte PC må dessuten skript være tillatt (<i>execution policy</i>), spør IT hvis det stopper.</p>`,
    oppdrag: [
      {
        id: 'p7o1', title: 'Ditt første skript',
        setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('hei.ps1'); },
        steps: [
          { laer: true, quiz: { q: 'Hva er et PowerShell-skript?', options: ['Et Python-program', 'En .ps1-fil med kommandoer som kjøres samlet', 'En snarvei på skrivebordet'], answer: 1 } },
          { laer: true, quiz: { q: '$navn er Kari. Hva skriver  Write-Host "Hei $navn"  ut?', options: ['Hei $navn', 'Hei Kari', 'En feilmelding'], answer: 1 } },
          { text: 'Lag <code>hei.ps1</code> i Kode-mappen med linjen <code>Write-Host "Hei fra skriptet"</code>. Lagre.', check: S => S.fileIn('hei.ps1', P_KODE) && /Write-Host/i.test(S.content('hei.ps1')) },
          { text: 'Prøv å kjøre det ved å skrive bare <code>hei.ps1</code> i terminalen. Les feilmeldingen og forslaget nederst.', check: S => S.ev('term-cmd', d => !d.ok && /^hei\.ps1$/i.test(d.alias)) },
          { text: 'Kjør det riktig: <code>.\\hei.ps1</code>', check: S => S.ev('ps1-run', d => d.file === 'hei.ps1' && d.ok) },
          { text: 'Utvid skriptet med to linjer:<br><code>$navn = Read-Host "Hva heter du"</code><br><code>Write-Host "Hei $navn!"</code><br>Lagre, kjør, og svar på spørsmålet.', check: S => S.ev('ps1-run', d => d.file === 'hei.ps1' && d.ok && /Read-Host/i.test(d.source) && /\$navn/.test(d.source)) },
          { text: 'Skript består av vanlige kommandoer. Sjekk et kortnavn til: <code>Get-Alias cd</code>', check: S => cmd(S, d => d.name === 'Get-Alias') },
          { quiz: { q: 'Hvorfor må du skrive .\\hei.ps1 og ikke bare hei.ps1?', options: ['Fordi filen ligger i papirkurven', 'PowerShell kjører ikke skript fra mappen du står i uten at du sier det tydelig', 'Fordi navnet er for kort'], answer: 1 } },
          { quiz: { q: 'Hva gjør Read-Host?', options: ['Skriver tekst til skjermen', 'Leser en fil', 'Spør brukeren om noe og gir svaret tilbake'], answer: 2 } }
        ]
      }
    ]
  }
];
window.KURS_ACTIVE = KURS_PROG;
