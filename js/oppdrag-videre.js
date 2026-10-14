/* Viderekommen-kursene i grunnkurset: mange filer på en gang, to vinduer, PDF og ZIP,
   kilder og kildekritikk, trygg på nett og et helt prosjekt fra start til innlevering.
   Filen legger seg etter oppdrag-mer.js (bruker M, addMaster og REPETISJON derfra).
   Alt ligger inni en funksjon, så hjelpenavnene ikke kolliderer med de andre kursfilene. */
(function () {
  const DEL = 'Viderekommen';
  const DEL_DESC = 'For deg som kan det grunnleggende: raskere arbeid, sikkerhet og et helt prosjekt.';
  const P_MOB = ['Denne PC-en', 'Dokumenter', 'Fra mobilen'];
  const P_SKJERM = ['Denne PC-en', 'Dokumenter', 'Skjermbilder'];
  const P_ROT = ['Denne PC-en', 'Dokumenter', 'Rot'];
  const P_SAMF = ['OneDrive', 'Skole', 'Samfunnsfag'];
  const IMG = n => 'IMG_' + (2000 + n) + '.jpg';
  const low = s => (s || '').toLowerCase();
  const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

  /* Navnene på det som er valgt i Filutforsker akkurat nå (alle vinduer) */
  const selNow = () => Explorer.views.flatMap(v => [...v.sel].map(id => FS.get(id)).filter(Boolean).map(n => n.name));
  /* Filen ligger (uansett hvor dypt) inni en mappe med dette navnet */
  const under = (file, folder) => FS.findAll(c => c.type === 'file' && low(c.name) === low(file)).some(f => FS.path(f.id).some(p => p.type === 'folder' && low(p.name) === low(folder)));
  const fileUnder = (re, folder) => FS.findAll(c => c.type === 'file' && re.test(c.name)).some(f => FS.path(f.id).some(p => p.type === 'folder' && low(p.name) === low(folder)));
  const removeFolderNamed = name => FS.findAll(c => c.type === 'folder' && low(c.name) === low(name), { includeBin: true }).map(c => c.name).forEach(n => FS.silentRemoveAll(n));
  /* Teksten inneholder et sitat (minst 25 tegn) fra fagartikkelen */
  const hasQuote = text => {
    const t = norm(text);
    return Nettleser.ARTICLE.paras.some(p => { const n = norm(p); for (let i = 0; i + 25 <= n.length; i += 4) if (t.includes(n.slice(i, i + 25))) return true; return false; });
  };
  const quoteMarks = text => /[«»"“”]/.test(text || '');
  /* Adressen uten vertsnavnet (naturfagleksikon/fotosyntese), så nettstedsnavnet «Naturfagleksikonet» alene ikke teller */
  const hasUrl = text => low(text).includes(low(Nettleser.ARTICLE.url).split('/').slice(1).join('/') || 'naturfagleksikon/fotosyntese');
  /* Teksten med setningene fra artikkelen og adressen fjernet, så bare elevens egne ord står igjen */
  const ownText = text => {
    let t = norm(text);
    Nettleser.ARTICLE.paras.forEach(p => { [norm(p), ...norm(p).split(/(?<=[.!?])\s+/)].forEach(s => { if (s.length >= 10) t = t.split(s).join(' '); }); });
    const u = low(Nettleser.ARTICLE.url);
    t = t.split(u).join(' ').split(u.split('/').slice(1).join('/')).join(' ');
    return t.replace(/\s+/g, ' ').trim();
  };
  const mailSt = () => (window.Epost ? Epost.state() : { reported: [], deleted: [] });
  const PHISH = ['m4', 'm6', 'm7'];
  /* Falsk melding er håndtert: rapportert eller slettet */
  const gone = id => { const m = mailSt(); return (m.reported || []).includes(id) || (m.deleted || []).includes(id); };
  /* Den utpakkede mappen kan få « (2)» bak navnet hvis ZIP-filen ble lastet ned to ganger */
  const PF = /^prosjektfiler-fotosyntese( \(\d+\))?$/i;
  const pfIn = parent => FS.findAll(c => c.type === 'folder' && low(c.name.trim()) === low(parent)).some(p => FS.children(p.id).some(c => c.type === 'folder' && PF.test(c.name.trim())));
  const underRe = (file, re) => FS.findAll(c => c.type === 'file' && low(c.name) === low(file)).some(f => FS.path(f.id).some(p => p.type === 'folder' && re.test(p.name.trim())));

  /* ============================================================
     V1: Mange filer på en gang
     ============================================================ */
  const V1 = {
    id: 'v1', title: 'Mange filer på en gang', laerTitle: 'å velge flere filer', del: DEL, delDesc: DEL_DESC,
    desc: 'Ctrl+klikk, Shift+klikk, Ctrl+A og dra-markering: flytt, kopier og slett mange filer samtidig.',
    laer: `
      <h4>Velg flere filer, så gjør du jobben én gang</h4>
      <p>Alt du gjør med valgte filer, gjelder <b>alle</b> som er valgt. Velger du ti filer og drar én av dem, blir alle ti med. Det samme gjelder Ctrl+X, Ctrl+C og Delete.</p>
      <table><tr><th>Slik</th><th>Gjør</th></tr>
      <tr><td><kbd>Ctrl</kbd> + klikk</td><td>Legger til (eller tar bort) én og én fil. Filene trenger ikke ligge ved siden av hverandre.</td></tr>
      <tr><td><kbd>Shift</kbd> + klikk</td><td>Velger alt <b>mellom</b> den første filen du klikket på og den du klikker på nå.</td></tr>
      <tr><td><kbd>Ctrl</kbd> + <kbd>A</kbd></td><td>Velger alt i mappen.</td></tr>
      <tr><td>Dra-markering</td><td>Hold venstre museknapp nede på et <b>tomt sted</b> i mappen og dra et rektangel rundt filene. Starter du på en fil, flytter du filen i stedet.</td></tr></table>
      <p>Nederst i Filutforsker står det hvor mange som er valgt, for eksempel <b>«7 elementer valgt»</b>. Se der før du trykker Delete.</p>
      <p>Shift+klikk virker best når filene er <b>sortert</b>, for eksempel etter navn eller dato.</p>`,
    oppdrag: [
      {
        id: 'v1o1', title: 'Ctrl, Shift og Ctrl+A',
        setup: F => {
          for (let i = 1; i <= 8; i++) FS.silentRemoveAll(IMG(i));
          ['Matte-uke41.pdf', 'Matte-uke42.pdf', 'Matte-uke43.pdf'].forEach(n => FS.silentRemoveAll(n));
          F.ensureFolder(P_MOB); F.ensureFolder(P_MATTE);
          for (let i = 1; i <= 8; i++) F.ensureFileAt(P_MOB, IMG(i), '');
          ['Matte-uke41.pdf', 'Matte-uke42.pdf', 'Matte-uke43.pdf'].forEach(n => F.ensureFileAt(P_MOB, n, 'Ukeoppgaver i matte'));
        },
        steps: [
          { laer: true, quiz: { q: 'Du vil velge tre filer som ligger spredt i mappen. Hva bruker du?', options: ['Ctrl + klikk på hver av dem', 'Shift + klikk på den første og siste', 'Dra-markering rundt alle filene i mappen'], answer: 0 } },
          { laer: true, quiz: { q: 'Du klikker på den første filen og Shift + klikker på den femte. Hva er valgt?', options: ['Bare den første og den femte', 'Alle fem, fra den første til den femte', 'Bare den femte, den første blir valgt bort'], answer: 1 } },
          { laer: true, quiz: { q: 'Sju filer er valgt, og du trykker Delete. Hva skjer?', options: ['Bare den siste du klikket på, slettes', 'Alle sju havner i papirkurven', 'PC-en spør hvilken av dem du mener'], answer: 1 } },
          { text: 'Åpne Filutforsker og gå til <b>Dokumenter › Fra mobilen</b>. Der ligger bilder og noen matteark om hverandre.', check: S => S.ev('explorer-nav', d => /fra mobilen/i.test(d.name)) || exAt('Fra mobilen') },
          { text: 'Klikk på <b>IMG_2001</b>. Hold <kbd>Shift</kbd> nede og klikk på <b>IMG_2004</b>. Nå er fire bilder valgt.', hint: 'Er filene i en annen rekkefølge? Sorter etter navn først (Sorter → Navn). Klikk vanlig på den første, og Shift + klikk på den siste.', check: S => S.ev('select', d => d.how === 'shift' && d.names.filter(n => /^img_200/i.test(n)).length >= 3) },
          { text: 'Klikk vanlig på <b>Matte-uke41</b>. Hold <kbd>Ctrl</kbd> nede og klikk på <b>Matte-uke42</b> og <b>Matte-uke43</b>. Nå er bare de tre matte-filene valgt.', hint: 'Ctrl legger til én og én fil. Kom det med noe feil? Ctrl + klikk på det igjen, så forsvinner det fra utvalget.', check: S => S.ev('select', d => d.how === 'ctrl' && d.names.length === 3 && d.names.every(n => /^matte-uke4[123]\.pdf$/i.test(n))) },
          { text: 'Flytt alle tre på én gang til <b>OneDrive › Skole › Matte</b>: dra én av dem (de andre blir med), eller bruk <kbd>Ctrl</kbd>+<kbd>X</kbd> og <kbd>Ctrl</kbd>+<kbd>V</kbd>.', check: S => ['Matte-uke41.pdf', 'Matte-uke42.pdf', 'Matte-uke43.pdf'].every(n => S.fileInNamed(n, 'Matte')) },
          { text: 'Gå tilbake til <b>Fra mobilen</b>. Merk alle bildene med <kbd>Ctrl</kbd>+<kbd>A</kbd>.', hint: 'Klikk først på et tomt sted i mappen, så tastetrykket havner i Filutforsker.', check: S => S.ev('select', d => d.how === 'all' && d.names.filter(n => /^img_200/i.test(n)).length >= 8) },
          { text: 'Hold <kbd>Ctrl</kbd> og klikk på <b>IMG_2008</b> for å ta den ut av utvalget. Statuslinjen nederst sier nå <b>7 elementer valgt</b>.', check: S => S.ev('select', d => d.how === 'ctrl' && d.names.length === 7 && !d.names.some(n => /^img_2008/i.test(n))) },
          { text: '<b>Kopier</b> de sju bildene til <b>Bilder</b> (<kbd>Ctrl</kbd>+<kbd>C</kbd>, gå til Bilder, <kbd>Ctrl</kbd>+<kbd>V</kbd>).', hint: 'Mistet du utvalget? Gjør Ctrl+A og Ctrl + klikk på IMG_2008 en gang til.', check: S => [1, 2, 3, 4, 5, 6, 7].every(i => S.fileIn(IMG(i), P_PIC)) },
          { quiz: { q: 'Hvorfor er det lurt å se på statuslinjen («7 elementer valgt») før du trykker Delete?', options: ['Den viser hvor mange filer som blir slettet', 'Den viser hvor mye plass som er ledig på disken', 'Den viser om filene er lagret i OneDrive'], answer: 0 } }
        ]
      },
      {
        id: 'v1o2', title: 'Dra-markering',
        setup: F => {
          for (let i = 1; i <= 6; i++) FS.silentRemoveAll('Skjermbilde (' + i + ').png');
          FS.silentRemoveAll('Viktig-notat.txt');
          F.ensureFolder(P_SKJERM);
          for (let i = 1; i <= 6; i++) F.ensureFileAt(P_SKJERM, 'Skjermbilde (' + i + ').png', '');
          F.ensureFileAt(P_SKJERM, 'Viktig-notat.txt', 'Husk: ikke slett meg!');
        },
        steps: [
          { text: 'Gå til <b>Dokumenter › Skjermbilder</b>.', check: S => S.ev('explorer-nav', d => /skjermbilder/i.test(d.name)) || exAt('Skjermbilder') },
          { text: 'Hold venstre museknapp nede på et <b>tomt sted</b> i mappen (ikke på en fil), og dra et rektangel rundt skjermbildene. Slipp.', hint: 'Start nedenfor eller til høyre for filene, der det er hvitt. Starter du oppå en fil, flytter du filen i stedet. Gjør vinduet større hvis det er trangt.', check: S => S.ev('select', d => d.how === 'band' && d.names.filter(n => /^skjermbilde/i.test(n)).length >= 2) },
          { text: 'Sørg for at <b>alle seks</b> skjermbildene er valgt, men ikke <b>Viktig-notat</b>. Kom notatet med, tar du det ut med <kbd>Ctrl</kbd> + klikk.', hint: 'Se på statuslinjen nederst: det skal stå «6 elementer valgt». Du kan også dra et nytt rektangel.', check: S => { const s = selNow(); return s.filter(n => /^skjermbilde/i.test(n)).length === 6 && !s.some(n => /viktig/i.test(n)); } },
          { text: 'Trykk <kbd>Delete</kbd>. Alle seks havner i papirkurven på én gang.', check: S => [1, 2, 3, 4, 5, 6].every(i => S.inBin('Skjermbilde (' + i + ').png')) && !!S.file('Viktig-notat.txt') },
          { text: 'Oi, du trengte dem likevel. Åpne <b>Papirkurven</b>, velg alle skjermbildene (dra-markering eller <kbd>Ctrl</kbd> + klikk) og velg <b>Gjenopprett</b>.', hint: 'Høyreklikk på en av de valgte filene og velg Gjenopprett. Alle som er valgt, blir med. Ikke bruk Ctrl+A her: da gjenoppretter du alt annet i papirkurven også.', check: S => [1, 2, 3, 4, 5, 6].every(i => S.fileIn('Skjermbilde (' + i + ').png', P_SKJERM)) },
          { quiz: { q: 'Hvor må du starte når du skal dra et rektangel rundt filer?', options: ['Oppå den første filen du vil ha med', 'På et tomt sted i mappen', 'På navnet til mappen i menyen til venstre'], answer: 1 } }
        ]
      }
    ]
  };

  /* ============================================================
     V2: To vinduer side om side
     ============================================================ */
  const V2 = {
    id: 'v2', title: 'To vinduer side om side', laerTitle: 'å jobbe i to vinduer', del: DEL, delDesc: DEL_DESC,
    desc: 'Fest vinduer til hver sin halvdel av skjermen, dra filer mellom dem og kopier tekst mellom programmer.',
    laer: `
      <h4>Halv skjerm hver</h4>
      <p>Når du skal flytte filer eller skrive av noe, er det mye enklere å ha to vinduer ved siden av hverandre enn å bytte frem og tilbake.</p>
      <table><tr><th>Slik</th><th>Gjør</th></tr>
      <tr><td>Dra tittellinjen helt inn mot <b>venstre</b> eller <b>høyre</b> kant</td><td>Vinduet fyller halve skjermen. Du ser en gjennomsiktig ramme før du slipper.</td></tr>
      <tr><td>Dra tittellinjen helt opp mot <b>toppen</b></td><td>Vinduet blir maksimert.</td></tr>
      <tr><td><kbd>⊞</kbd> + <kbd>←</kbd> / <kbd>→</kbd></td><td>Det samme med tastaturet på en ekte PC.</td></tr></table>
      <h4>To Filutforsker-vinduer</h4>
      <p>Høyreklikk på en mappe og velg <b>Åpne i nytt vindu</b>. Da kan du ha én mappe til venstre og en annen til høyre, og dra filer rett over.</p>
      <p><b>Dra = flytt.</b> Holder du <kbd>Ctrl</kbd> nede mens du slipper, blir filen <b>kopiert</b> i stedet. (Drar du til en annen disk eller en minnepinne, kopierer Windows av seg selv.)</p>
      <h4>Kopier mellom programmer</h4>
      <p>Utklippstavlen deles av alle programmene. Det du kopierer med <kbd>Ctrl</kbd>+<kbd>C</kbd> i ett program, kan du lime inn med <kbd>Ctrl</kbd>+<kbd>V</kbd> i et annet.</p>`,
    oppdrag: [
      {
        id: 'v2o1', title: 'Dra filer mellom to vinduer', lukk: ['explorer'],
        setup: F => {
          ['Gloser-uke-41.docx', 'Gloser-uke-42.docx'].forEach(n => FS.silentRemoveAll(n));
          F.ensureFolder(P_ENG);
          F.ensureFileAt(P_DOC, 'Gloser-uke-41.docx', 'Gloser uke 41\n\nhouse = hus\ntree = tre');
          F.ensureFileAt(P_DOC, 'Gloser-uke-42.docx', 'Gloser uke 42\n\ncat = katt\ndog = hund');
        },
        steps: [
          { laer: true, quiz: { q: 'Hvordan får du et vindu til å fylle venstre halvdel av skjermen?', options: ['Dra tittellinjen helt inn mot venstre kant', 'Dobbeltklikk på tittellinjen til vinduet', 'Dra hjørnet av vinduet helt inn mot midten av skjermen'], answer: 0 } },
          { laer: true, quiz: { q: 'Du drar en fil fra én mappe til en annen på samme PC. Hva skjer?', options: ['Den blir kopiert, så du får to', 'Den blir flyttet', 'Du får en snarvei til filen'], answer: 1 } },
          { laer: true, quiz: { q: 'Hvordan kopierer du en fil i stedet for å flytte den når du drar?', options: ['Holder Shift nede mens du drar', 'Holder Ctrl nede når du slipper', 'Drar filen to ganger etter hverandre'], answer: 1 } },
          { text: 'Åpne Filutforsker og gå til <b>Dokumenter</b>.', check: S => S.ev('explorer-nav', d => d.name === 'Dokumenter') || exAt('Dokumenter') },
          { text: 'Hold venstre museknapp nede på <b>tittellinjen</b> og dra vinduet helt inn mot <b>venstre kant</b> av skjermen. Når du ser en gjennomsiktig ramme, slipper du.', hint: 'Musepekeren må helt ut i kanten. Rammen viser hvor vinduet havner.', check: S => S.ev('window-snap', d => d.app === 'explorer' && d.side === 'left') },
          { text: 'Åpne et vindu til: høyreklikk på <b>Engelsk</b> (OneDrive › Skole › Engelsk) i menyen til venstre og velg <b>Åpne i nytt vindu</b>.', hint: 'Klikk på pilen ved OneDrive og Skole i menyen til venstre for å se Engelsk. Du kan også høyreklikke på en mappe inne i vinduet.', check: S => S.wins('explorer') >= 2 && exAt('Engelsk') },
          { text: 'Fest det nye vinduet til <b>høyre</b> halvdel på samme måte.', check: S => S.ev('window-snap', d => d.app === 'explorer' && d.side === 'right') },
          { text: 'Dra <b>Gloser-uke-41</b> og <b>Gloser-uke-42</b> fra vinduet til venstre over i Engelsk-vinduet til høyre. Velg begge med <kbd>Ctrl</kbd> + klikk, så kan du dra dem samtidig.', check: S => S.fileInNamed('Gloser-uke-41.docx', 'Engelsk') && S.fileInNamed('Gloser-uke-42.docx', 'Engelsk') },
          { quiz: { q: 'Hvorfor er to vinduer side om side nyttig?', options: ['Du ser begge mappene og kan dra rett mellom dem', 'Filene blir kopiert i stedet for flyttet når du drar', 'Du kan lukke det ene vinduet uten å miste noe'], answer: 0 } }
        ]
      },
      {
        id: 'v2o2', title: 'Kopier tekst mellom to dokumenter', lukk: ['skriv'],
        setup: F => {
          FS.silentRemoveAll('Notater-fra-timen.docx'); M.removeWhere(/^sammendrag\.(docx|txt)$/i);
          F.ensureFileAt(P_NORSK, 'Notater-fra-timen.docx', 'Notater fra norsktimen\n\nEn novelle er en kort fortelling med få personer.\nNovellen starter ofte rett i handlingen.\nSlutten på novellen er ofte åpen, så leseren må tenke selv.');
        },
        steps: [
          { text: 'Åpne <b>Notater-fra-timen</b> fra <b>OneDrive › Skole › Norsk</b> i Skriv.', check: S => S.ev('open-file', d => /notater-fra-timen/i.test(d.name)) || /novelle/i.test(S.editorText()) },
          { text: 'Fest Skriv-vinduet til <b>venstre</b> halvdel av skjermen.', check: S => S.ev('window-snap', d => d.app === 'skriv' && d.side === 'left') },
          { text: 'Åpne et <b>nytt, tomt</b> dokument i Skriv (Start-menyen → Skriv) og fest det til <b>høyre</b>.', hint: 'Start-menyen åpner et nytt Skriv-vindu hver gang. Dra det mot høyre kant.', check: S => S.wins('skriv') >= 2 && S.ev('window-snap', d => d.app === 'skriv' && d.side === 'right') },
          { text: 'I notatene til venstre: marker setningen du synes er viktigst (dra over den med musen) og kopier med <kbd>Ctrl</kbd>+<kbd>C</kbd>.', hint: 'Du kan også høyreklikke på den markerte teksten og velge Kopier.', check: S => S.ev('shortcut', d => d.app === 'skriv' && d.key === 'c' && d.ctrl) || S.ev('editor-menu', d => d.action === 'copy') },
          { text: 'Klikk i dokumentet til høyre og lim inn med <kbd>Ctrl</kbd>+<kbd>V</kbd>.', check: S => S.ev('editor-paste') },
          { text: 'Lagre det nye dokumentet som <b>Sammendrag</b> i <b>OneDrive › Skole › Norsk</b>.', hint: 'Klikk i dokumentet til høyre først, og velg Lagre som.', check: S => FS.findAll(c => c.type === 'file' && /^sammendrag\.(docx|txt)$/i.test(c.name)).some(f => { const p = FS.get(f.parent); return p && /norsk/i.test(p.name) && /novelle/i.test(Skriv.plainText(f.content || '')); }) },
          { quiz: { q: 'Du kopierer tekst i nettleseren. Kan du lime den inn i Skriv?', options: ['Nei, hvert program har sin egen utklippstavle', 'Ja, alle programmene deler utklippstavlen', 'Bare hvis begge vinduene er festet side om side'], answer: 1 } }
        ]
      }
    ]
  };

  /* ============================================================
     V3: PDF og ZIP
     ============================================================ */
  const ZIP_UKE = () => Zip.make([{ p: 'Oppgave1.docx', c: 'Oppgave 1\n\nSkriv fem setninger om høsten.' }, { p: 'Oppgave2.docx', c: 'Oppgave 2\n\nLag en tegneserie med tre ruter.' }]);
  const V3 = {
    id: 'v3', title: 'PDF og ZIP', laerTitle: 'PDF-filer og ZIP-filer', del: DEL, delDesc: DEL_DESC,
    desc: 'Lag PDF av et dokument, pakk ut ZIP-filer riktig, og pakk flere filer i én ZIP-fil.',
    laer: `
      <h4>PDF: ferdig dokument</h4>
      <p>En <b>PDF</b> ser lik ut på alle PC-er, nettbrett og mobiler, og den endres ikke ved et uhell. Derfor vil lærere ofte ha innleveringer som PDF.</p>
      <p>Lag PDF slik: <b>Skriv ut</b> (<kbd>Ctrl</kbd>+<kbd>P</kbd>) og velg skriveren <b>Microsoft Print to PDF</b>. Da lages en fil i stedet for papir. I Word kan du også velge <b>Lagre som → PDF</b>.</p>
      <p>Behold alltid originalen (.docx). Må du rette noe, retter du i den og lager en ny PDF.</p>
      <h4>ZIP: en pakket mappe</h4>
      <p>En <b>ZIP-fil</b> er mange filer og mapper pakket sammen til én fil. Den er lett å sende og laste ned, og ofte mindre.</p>
      <table><tr><th></th><th>Gjør</th></tr>
      <tr><td>Dobbeltklikk på ZIP-filen</td><td>Du <b>ser inni</b> den, men filene er ikke pakket ut. Åpner du en fil herfra, får du en skrivebeskyttet kopi, og det du skriver, blir borte.</td></tr>
      <tr><td><b>Pakk ut alle</b></td><td>Lager en vanlig mappe med filene. Velg hvor den skal havne med <b>Bla gjennom</b>, helst i OneDrive.</td></tr>
      <tr><td>Høyreklikk → <b>Komprimer til → ZIP-fil</b></td><td>Pakker filene eller mappen du har valgt, til én ZIP-fil.</td></tr></table>
      <p><b>Regelen:</b> Pakk ut først, jobb etterpå.</p>`,
    oppdrag: [
      {
        id: 'v3o1', title: 'Lag en PDF', lukk: ['skriv'],
        setup: F => {
          FS.silentRemoveAll('Bokanmeldelse.docx'); FS.silentRemoveAll('Bokanmeldelse.pdf');
          F.ensureFileAt(P_NORSK, 'Bokanmeldelse.docx', 'Bokanmeldelse: Sofies verden\n\nBoken handler om Sofie, som får brev fra en mystisk filosof. Jeg likte den fordi den fikk meg til å tenke.');
        },
        steps: [
          { laer: true, quiz: { q: 'Hvorfor vil lærere ofte ha innleveringer som PDF?', options: ['Den ser lik ut overalt og endres ikke ved et uhell', 'Den blir automatisk rettet for skrivefeil når den lagres', 'Den kan bare åpnes av læreren, så ingen andre ser den'], answer: 0 } },
          { laer: true, quiz: { q: 'Du dobbeltklikker på en ZIP-fil og skriver i et dokument inni den. Hva skjer?', options: ['Endringene lagres rett inn i ZIP-filen', 'Du jobber i en skrivebeskyttet kopi, og alt blir borte', 'Dokumentet lagres automatisk i Dokumenter-mappen i stedet'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva er det første du gjør med en ZIP-fil du har lastet ned?', options: ['Pakker den ut', 'Åpner filene direkte fra ZIP-filen', 'Flytter den til skrivebordet'], answer: 0 } },
          { text: 'Åpne <b>Bokanmeldelse</b> fra <b>OneDrive › Skole › Norsk</b> i Skriv.', check: S => S.ev('open-file', d => /^bokanmeldelse\.docx$/i.test(d.name)) || /sofies verden/i.test(S.editorText()) },
          { text: 'Trykk <kbd>Ctrl</kbd>+<kbd>P</kbd> (Skriv ut).', hint: 'Klikk inne i dokumentet først, så tastetrykket går til Skriv. Du kan også klikke på knappen Skriv ut øverst i Skriv-vinduet.', check: S => S.ev('print-dialog') },
          { text: 'Velg skriveren <b>Microsoft Print to PDF</b> og klikk Skriv ut. Lagre PDF-en i <b>Norsk</b>-mappen med navnet <b>Bokanmeldelse</b>.', hint: 'Skriveren velges i nedtrekkslisten øverst. Lagret du den et annet sted? Gjør det en gang til og velg Norsk.', check: S => S.fileInNamed('Bokanmeldelse.pdf', 'Norsk') },
          { text: 'Gå til Norsk-mappen i Filutforsker og åpne <b>PDF-filen</b>. Den åpnes i et annet program, og du kan ikke skrive i den.', hint: 'Slå på Vis → Vis → Filnavnutvidelser, så ser du hvilken som er .pdf og hvilken som er .docx.', check: S => S.ev('open-file', d => /^bokanmeldelse.*\.pdf$/i.test(d.name)) || S.ev('window-open', d => d.app === 'viewer' && /bokanmeldelse/i.test(d.title || '')) },
          { quiz: { q: 'Du oppdager en skrivefeil etter at PDF-en er laget. Hva gjør du?', options: ['Åpner PDF-en i Skriv og retter der', 'Retter i .docx-filen og lager ny PDF', 'Leverer og skriver rettelsen i en kommentar til læreren'], answer: 1 } }
        ]
      },
      {
        id: 'v3o2', title: 'Pakk ut en ZIP-fil', lukk: ['nettleser', 'explorer', 'viewer'],
        setup: F => {
          FS.findAll(c => c.type === 'file' && /^prosjektfiler-fotosyntese.*\.zip$/i.test(c.name), { includeBin: true }).map(c => c.name).forEach(n => FS.silentRemoveAll(n));
          FS.findAll(c => c.type === 'folder' && PF.test(c.name.trim()), { includeBin: true }).map(c => c.name).forEach(n => FS.silentRemoveAll(n));
          F.ensureFolder(P_NAT);
        },
        steps: [
          { text: 'Åpne <b>Nettleser</b> og last ned <b>Prosjektfiler om fotosyntese</b>.', check: S => S.ev('download', d => /prosjektfiler/i.test(d.base)) },
          { text: 'Åpne ZIP-filen fra <b>Nedlastinger</b> (dobbeltklikk, eller «Åpne fil» i nedlastingsmeldingen). Nå ser du inni den.', check: S => S.ev('zip-open', d => /prosjektfiler/i.test(d.name)) },
          { text: 'Dobbeltklikk på <b>Oppgave-fotosyntese</b> inni ZIP-filen. Les hva som står, og klikk <b>Avbryt</b>.', check: S => S.ev('zip-open-inside') },
          { text: 'Klikk <b>Pakk ut alle</b>. Klikk <b>Bla gjennom …</b>, velg <b>OneDrive › Skole › Naturfag</b> og klikk <b>Pakk ut</b>.', hint: 'Står det Nedlastinger i feltet? Da har du ikke valgt nytt mål. Klikk Bla gjennom, gå til OneDrive › Skole › Naturfag og klikk Velg mappe. Pakket du ut feil sted? Gjør det en gang til.', check: S => pfIn('Naturfag') && underRe('Oppgave-fotosyntese.docx', PF) },
          { text: 'Åpne <b>Oppgave-fotosyntese</b> fra den <b>utpakkede</b> mappen i Naturfag. Nå kan du skrive i den og lagre.', check: S => S.ev('open-file', d => { const n = FS.get(d.id); return !!n && /^oppgave-fotosyntese/i.test(n.name) && FS.path(n.id).some(p => PF.test((p.name || '').trim())); }) },
          { text: 'Slett ZIP-filen fra <b>Nedlastinger</b>. Du trenger den ikke lenger.', check: S => !FS.children(FS.roots().downloads).some(c => /^prosjektfiler-fotosyntese.*\.zip$/i.test(c.name)) },
          { quiz: { q: 'Hvorfor må du pakke ut en ZIP-fil før du jobber med filene i den?', options: ['Inni ZIP-filen er filene bare til visning, så endringer lagres ikke', 'ZIP-filer kan inneholde virus som bare forsvinner når filen pakkes ut', 'Det trenger du ikke, Skriv lagrer endringene tilbake i ZIP-filen'], answer: 0 } }
        ]
      },
      {
        id: 'v3o3', title: 'Pakk flere filer i én ZIP-fil', lukk: ['epost'],
        setup: F => {
          removeFolderNamed('Labrapport');
          FS.findAll(c => c.type === 'file' && /^labrapport.*\.zip$/i.test(c.name), { includeBin: true }).map(c => c.name).forEach(n => FS.silentRemoveAll(n));
          const p = [...P_NAT, 'Labrapport'];
          F.ensureFolder(p);
          F.ensureFileAt(p, 'Rapport.docx', 'Labrapport: Hvor fort fordamper vann?');
          F.ensureFileAt(p, 'Maalinger.xlsx', '');
          F.ensureFileAt(p, 'Bilde-forsok.jpg', '');
        },
        steps: [
          { text: 'Gå til <b>OneDrive › Skole › Naturfag</b>. Der ligger mappen <b>Labrapport</b> med tre filer.', check: S => S.ev('explorer-nav', d => /naturfag/i.test(d.name)) || exAt('Naturfag') },
          { text: 'Høyreklikk på mappen <b>Labrapport</b> og velg <b>Komprimer til → ZIP-fil</b>.', check: S => S.ev('zip-create', d => d.names.some(n => /^labrapport$/i.test(n))) },
          { text: 'Windows lager <b>Labrapport.zip</b> og lar deg gi den nytt navn med en gang. Trykk <kbd>Enter</kbd> for å beholde navnet.', hint: 'Er navnefeltet borte? Da er navnet allerede lagret. Vil du prøve igjen, klikker du én gang på ZIP-filen og trykker F2, og så Enter.', check: S => S.ev('rename-finish', d => { const n = FS.get(d.id); return !!n && FS.ext(n.name) === 'zip'; }) && FS.findAll(c => c.type === 'file' && FS.ext(c.name) === 'zip' && /rapport\.docx/i.test(c.content || '')).some(f => { const p = FS.get(f.parent); return p && /naturfag/i.test(p.name); }) },
          { text: 'Send ZIP-filen som vedlegg i en e-post til <b>kari.hansen@skolen.no</b>.', hint: 'Åpne E-post, klikk Ny melding, og bruk 📎 Legg ved fil … for å finne ZIP-filen i Naturfag.', check: S => S.ev('mail-send', d => /kari/i.test(d.to) && d.attach.some(a => /\.zip$/i.test(a))) },
          { quiz: { q: 'Hvorfor sende én ZIP-fil i stedet for tre løse filer?', options: ['Alle filene og mappene kommer med i én pakke', 'E-posten kan ikke ha mer enn ett vedlegg om gangen', 'ZIP-filer kan ikke åpnes av andre enn mottakeren'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================
     V4: Kilder og kildekritikk
     ============================================================ */
  const V4 = {
    id: 'v4', title: 'Kilder og kildekritikk', laerTitle: 'sitat, kilder og kildekritikk', del: DEL, delDesc: DEL_DESC,
    desc: 'Kopier et sitat fra nettet riktig, skriv kilden, og vurder om en nettside er til å stole på.',
    laer: `
      <h4>Sitat eller egne ord</h4>
      <p>Bruker du andres ord, må det være tydelig. Et <b>sitat</b> står i anførselstegn «slik» og har en kilde. Å kopiere tekst uten anførselstegn og kilde, og la det se ut som om du har skrevet det selv, kalles <b>plagiat</b>, og det er juks.</p>
      <p>Det beste er som regel å skrive med <b>egne ord</b>. Også da skal du skrive hvor du fant opplysningene.</p>
      <h4>Slik skriver du en kilde</h4>
      <p>Forfatter, tittel, nettsted, adresse og datoen du leste den. For eksempel:<br><i>Ingrid Solberg: «Fotosyntese», Naturfagleksikonet, ovings-pc.simulering/naturfagleksikon/fotosyntese (lest 14.10.2026)</i></p>
      <h4>Kopiere fra nettet</h4>
      <p>Marker teksten med musen og trykk <kbd>Ctrl</kbd>+<kbd>C</kbd>. Adressen kopierer du ved å høyreklikke i adressefeltet og velge <b>Kopier adresse</b> (eller klikke i feltet og trykke <kbd>Ctrl</kbd>+<kbd>C</kbd>).</p>
      <h4>Kan du stole på kilden?</h4>
      <table><tr><th>Spør deg selv</th><th>Godt tegn</th><th>Dårlig tegn</th></tr>
      <tr><td>Hvem står bak?</td><td>Navngitt forfatter med fagkunnskap</td><td>Anonym, kallenavn</td></tr>
      <tr><td>Når?</td><td>Dato, nylig oppdatert</td><td>Ingen dato</td></tr>
      <tr><td>Hvorfor finnes siden?</td><td>For å informere</td><td>For å selge, få klikk eller lure</td></tr>
      <tr><td>Stemmer det?</td><td>Det samme står i læreboka og andre kilder</td><td>Utrolige påstander uten kilder</td></tr></table>`,
    oppdrag: [
      {
        id: 'v4o1', title: 'Sitat og kilde', lukk: ['skriv', 'nettleser'],
        setup: F => { M.removeWhere(/^fotosyntese-sitat\.(docx|txt)$/i); F.ensureFolder(P_NAT); },
        steps: [
          { laer: true, quiz: { q: 'Hva er et sitat?', options: ['Andres ord i anførselstegn, med kilde', 'Andres ord skrevet om med dine egne ord', 'En lenke til nettsiden du har lest på'], answer: 0 } },
          { laer: true, quiz: { q: 'Du kopierer et avsnitt fra nettet inn i oppgaven din uten anførselstegn og kilde. Hva kalles det?', options: ['Sitat', 'Plagiat', 'Sammendrag'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva bør være med når du skriver en kilde fra nettet?', options: ['Søkeordet du brukte og at du fant det på Google', 'Forfatter, tittel, nettsted, adresse og lesedato', 'Bare adressen, for den viser hvor du fant det hele'], answer: 1 } },
          { text: 'Åpne <b>Nettleser</b> og klikk på <b>Fotosyntese – Naturfagleksikonet</b> under «Lesestoff til naturfag».', check: S => S.ev('browser-nav', d => d.page === 'artikkel') },
          { quiz: { q: 'Se under tittelen. Hvem har skrevet artikkelen?', options: ['Ingrid Solberg, lektor i naturfag', 'Universitetet i Bergen, som har skrevet den', 'Ingen, den er anonym og uten forfatter'], answer: 0 } },
          { text: 'Marker én setning i artikkelen (dra over den med musen) og kopier den med <kbd>Ctrl</kbd>+<kbd>C</kbd>.', hint: 'Start helt foran første ord, hold venstre museknapp nede, og dra til punktumet. Høyreklikk og Kopier virker også.', check: S => S.ev('browser-copy', d => d.page === 'artikkel' && d.text.length >= 20) },
          { text: 'Åpne <b>Skriv</b>. Skriv et anførselstegn <b>«</b>, lim inn setningen med <kbd>Ctrl</kbd>+<kbd>V</kbd>, og avslutt med <b>»</b>.', hint: '« og » finner du ikke på tastaturet. Bruk vanlige anførselstegn " (Shift+2) i stedet, det er også riktig.', check: S => hasQuote(S.editorText()) && quoteMarks(S.editorText()) },
          { text: 'Gå tilbake til nettleseren, høyreklikk i <b>adressefeltet</b> og velg <b>Kopier adresse</b>.', check: S => S.ev('browser-copy-url', d => d.page === 'artikkel') },
          { text: 'I Skriv: skriv <b>Kilde:</b> på en ny linje, lim inn adressen, og skriv forfatterens navn og datoen i dag.', check: S => /kilde/i.test(S.editorText()) && hasUrl(S.editorText()) && /solberg/i.test(S.editorText()) },
          { text: 'Lagre dokumentet som <b>Fotosyntese-sitat</b> i <b>OneDrive › Skole › Naturfag</b>.', check: S => FS.findAll(c => c.type === 'file' && /^fotosyntese-sitat\.(docx|txt)$/i.test(c.name)).some(f => { const p = FS.get(f.parent); return p && /naturfag/i.test(p.name) && hasQuote(Skriv.plainText(f.content || '')); }) }
        ]
      },
      {
        id: 'v4o2', title: 'Kan du stole på det?', lukk: ['nettleser'],
        steps: [
          { text: 'I Nettleser: åpne lesestoffet <b>«DU VIL IKKE TRO HVA PLANTER GJØR!!!»</b>.', check: S => S.ev('browser-nav', d => d.page === 'blogg') },
          { quiz: { q: 'Hvem står bak denne siden?', options: ['En anonym person med kallenavn', 'Forskere ved Universitetet i Bergen', 'En navngitt lærer med fagkunnskap'], answer: 0 } },
          { quiz: { q: 'Hva er det tydeligste tegnet på at siden ikke er til å stole på?', options: ['Påstandene strider mot det du har lært, uten kilder', 'Siden har mange bilder og sterke farger i overskriften', 'Siden er skrevet på norsk og ikke på engelsk som forskning'], answer: 0 } },
          { text: 'Gå tilbake med <b>←</b> og åpne artikkelen fra <b>Naturfagleksikonet</b>. Sammenlign de to sidene.', check: S => S.ev('browser-nav', d => d.page === 'artikkel') && (S.ev('browser-nav', d => d.page === 'portal')) },
          { quiz: { q: 'Bloggen sier at planter ikke trenger lys. Hva gjør du?', options: ['Skriver det i oppgaven, siden det står på nettet', 'Sjekker det i leksikonet eller læreboka', 'Spør klassen om noen andre har lest det samme'], answer: 1 } },
          { quiz: { q: 'Du har skrevet med egne ord, men brukt fakta fra leksikonet. Må du oppgi kilden?', options: ['Ja, du skriver alltid hvor du fant det', 'Nei, kilde trengs bare når du siterer ordrett', 'Nei, egne ord er dine, så da trenger du ingen kilde'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================
     V5: Trygg på nett
     ============================================================ */
  const V5 = {
    id: 'v5', title: 'Trygg på nett', laerTitle: 'phishing, passord og deling', del: DEL, delDesc: DEL_DESC,
    desc: 'Kjenn igjen falske e-poster, lag sterke passord og del filer med riktig tilgang.',
    laer: `
      <h4>Phishing: e-post som vil lure deg</h4>
      <p><b>Phishing</b> er falske meldinger som prøver å få deg til å klikke på en lenke, skrive inn passordet ditt eller betale noe. De ser ofte ekte ut. Se etter disse tegnene:</p>
      <ul><li><b>Hastverk og trusler:</b> «Kontoen stenges i dag!»</li>
      <li><b>Rar avsenderadresse:</b> navnet sier «Microsoft», men adressen bak er <i>micros0ft-support.com</i>. Et kjent navn kan være falskt, se alltid på selve adressen.</li>
      <li><b>Lenker som går et annet sted enn de sier.</b> Hold musepekeren over lenken <i>uten å klikke</i>, så ser du hvor den egentlig går.</li>
      <li><b>De ber om passord, kortnummer eller penger.</b> Skolen, Microsoft og banken spør aldri om passordet ditt på e-post.</li></ul>
      <p><b>Hva gjør du?</b> Ikke klikk. Bruk <b>Rapporter phishing</b>, eller slett meldingen. Har du klikket og skrevet inn passordet: <b>bytt passord med en gang</b> og si fra til læreren eller IT.</p>
      <h4>Sterke passord</h4>
      <p>Lengde er viktigst. En <b>passordfrase</b> av fire tilfeldige ord (<i>sykkel ost regnjakke måne</i>) er både sterkere og lettere å huske enn <i>Fotb@ll1</i>. Bruk forskjellige passord på forskjellige steder, og del aldri passordet ditt, heller ikke med bestevennen.</p>
      <p><b>Totrinnsbekreftelse</b> betyr at du også må godkjenne innloggingen på mobilen. Da er ikke passordet nok for den som har stjålet det.</p>
      <h4>Del med riktig tilgang</h4>
      <p>Når du deler en fil, velger du hvem og hva de får lov til: <b>Kan redigere</b> til gruppa du jobber med, <b>Kan bare lese</b> til resten. Del bare med dem som trenger det.</p>`,
    oppdrag: [
      {
        id: 'v5o1', title: 'Lur eller ekte?', lukk: ['epost'],
        setup: () => { if (window.Epost) { Epost.reset(); Epost.deliver(['m4', 'm5', 'm6', 'm7']); } },
        steps: [
          { laer: true, quiz: { q: 'Hva er phishing?', options: ['Falske meldinger som vil lure ut passord eller penger', 'Reklame-e-post som sendes til veldig mange samtidig', 'Et virus som sprer seg når du åpner en melding i innboksen'], answer: 0 } },
          { laer: true, quiz: { q: 'Hvordan ser du hvor en lenke egentlig går, uten å klikke?', options: ['Holder musepekeren over den', 'Høyreklikker og velger Åpne i ny fane', 'Leser teksten som står på selve knappen'], answer: 0 } },
          { laer: true, quiz: { q: 'En e-post fra «Microsoft» ber deg bekrefte passordet ditt. Hva gjør du?', options: ['Klikker på lenken, men skriver ikke inn noe', 'Svarer og spør om meldingen er ekte', 'Klikker ikke, og rapporterer den'], answer: 2 } },
          { text: 'Åpne <b>E-post</b>. Det har kommet fire nye meldinger.', check: S => S.ev('mail-app-open') || S.wins('epost') > 0 },
          { text: 'Åpne meldingen <b>«Handling kreves: kontoen din stenges i dag»</b>. Se på avsenderadressen bak navnet.', check: S => S.ev('mail-open', d => d.id === 'm4') },
          { text: 'Hold musepekeren over knappen <b>Bekreft kontoen nå</b>, <i>uten å klikke</i>. Nederst i meldingen ser du hvor lenken egentlig går.', check: S => S.ev('mail-link-hover', d => d.id === 'm4') },
          { quiz: { q: 'Hva avslører at meldingen er falsk?', options: ['Avsenderen er micros0ft (med null), og lenken går feil', 'Den har en blå knapp og Microsoft-logo øverst i meldingen', 'Den kom i innboksen og ikke i mappen for søppelpost'], answer: 0 } },
          { text: 'Klikk <b>⚠ Rapporter phishing</b>.', check: S => S.ev('mail-report', d => d.id === 'm4') || gone('m4') },
          { text: 'Gå gjennom de tre andre nye meldingene. <b>Rapporter de falske</b>, men ikke den som er ekte. Se på avsenderadressen og hold over lenkene.', hint: 'Én av dem er fra læreren med en adresse som slutter på @skolen.no, og lenken går til skolen. Det holder også å slette de falske. Rapporterte du den ekte ved en feil? Åpne Søppelpost og klikk «Ikke søppelpost».', check: S => { const m = mailSt(); return gone('m6') && gone('m7') && !(m.reported || []).includes('m5') && !(m.deleted || []).includes('m5'); } },
          { quiz: { q: 'Meldingen fra «Jonas Berg» kom fra en gmail-adresse, ikke skoleadressen hans. Hva kan ha skjedd?', options: ['Noen later som de er Jonas', 'Jonas har glemt passordet til skolekontoen sin', 'Ingenting, elever bruker ofte gmail til skolearbeid'], answer: 0 } },
          { quiz: { q: 'Du klikket på en falsk lenke og skrev inn passordet. Hva gjør du?', options: ['Venter og ser om det skjer noe rart med kontoen', 'Bytter passord og sier fra til læreren eller IT', 'Sletter e-posten, så ingen andre klikker på den samme lenken'], answer: 1 } }
        ]
      },
      {
        id: 'v5o2', title: 'Sterke passord', lukk: ['innstillinger'],
        steps: [
          { text: 'Åpne <b>Innstillinger</b> fra Start-menyen og klikk <b>Endre passord …</b>.', check: S => S.ev('dialog-open', d => d.title === T('Endre passord')) },
          { text: 'Skriv et typisk <b>dårlig</b> passord, for eksempel <b>fotball123</b>, og klikk Lagre. Se hva som skjer.', hint: 'Dette er bare en øving. Ikke skriv passordet du bruker på ekte.', check: S => S.ev('password-test', d => d.score <= 1) },
          { text: 'Åpne <b>Endre passord</b> igjen og lag en <b>passordfrase</b> av fire tilfeldige ord, for eksempel <b>sykkel ost regnjakke måne</b>. Klikk Lagre.', hint: 'Fire ulike ord med mellomrom mellom, og hvert ord må ha minst to bokstaver. Jo mer tilfeldige ordene er, jo bedre. Vanlige ord som «passord» eller navnet ditt teller lite.', check: S => S.ev('password-test', d => d.score >= 3 && d.words >= 4) },
          { quiz: { q: 'Hvorfor er en passordfrase av fire ord bedre enn «Fotb@ll1»?', options: ['Den er lengre og vanskelig å gjette, men lett å huske', 'Den har ingen spesialtegn, så den er lettere å skrive inn', 'Ordene står i ordboka, så datamaskiner kjenner dem ikke igjen'], answer: 0 } },
          { quiz: { q: 'Hva er totrinnsbekreftelse?', options: ['At du også godkjenner innloggingen på mobilen', 'At du må skrive passordet to ganger hver gang du logger inn', 'At passordet ditt må ha både tall og store bokstaver'], answer: 0 } },
          { quiz: { q: 'Bestevennen din vil låne passordet ditt til Teams. Hva gjør du?', options: ['Gir det, men bytter passord etterpå', 'Sier nei, passord deler du ikke', 'Logger inn for vennen og lar vennen bruke kontoen din'], answer: 1 } }
        ]
      },
      {
        id: 'v5o3', title: 'Del med riktig tilgang',
        setup: F => {
          ['Klassens-regler.docx', 'Gruppeoppgave-valg.docx'].forEach(n => FS.silentRemoveAll(n));
          F.ensureFolder(P_SAMF);
          const a = F.ensureFileAt(P_SAMF, 'Klassens-regler.docx', 'Klassens regler\n\n1. Vi hører på hverandre.\n2. Vi rydder etter oss.'); if (a) a.shared = false;
          const b = F.ensureFileAt(P_SAMF, 'Gruppeoppgave-valg.docx', 'Gruppeoppgave: Valget\n\nJonas skriver om partiene. Kari skriver om valgdagen.'); if (b) b.shared = false;
        },
        steps: [
          { text: 'Gå til <b>OneDrive › Skole › Samfunnsfag</b>. Høyreklikk på <b>Klassens-regler</b> og velg <b>Del</b>.', check: S => S.ev('dialog-open', d => /klassens-regler/i.test(d.title || '')) },
          { text: 'Del filen med <b>Alle i klassen 8A</b>, men velg <b>Kan bare lese</b>. Klikk Kopier lenke.', check: S => S.ev('share', d => /klassens-regler/i.test(d.name) && d.who === 'klassen' && d.perm === 'read') },
          { text: 'Del <b>Gruppeoppgave-valg</b> med <b>Jonas og Kari (gruppa mi)</b>, slik at de <b>kan redigere</b>.', check: S => S.ev('share', d => /gruppeoppgave-valg/i.test(d.name) && d.who === 'gruppe' && d.perm === 'edit') },
          { quiz: { q: 'Hvorfor får hele klassen bare lesetilgang til reglene?', options: ['Så ingen endrer eller sletter noe ved et uhell', 'Fordi filer med lesetilgang tar mindre plass i OneDrive', 'Så bare læreren kan se filen og ikke de andre'], answer: 0 } },
          { quiz: { q: 'Hva bør du aldri dele med en lenke til alle?', options: ['Ukeplanen for klassen med lekser og prøvedatoer', 'Personlige opplysninger, bilder av andre eller passord', 'En diktsamling du har skrevet selv og vil vise til familien'], answer: 1 } }
        ]
      }
    ]
  };

  /* ============================================================
     V6: Prosjektuka (alt sammen)
     ============================================================ */
  const projDoc = re => FS.findAll(c => c.type === 'file' && re.test(c.name)).some(f => FS.path(f.id).some(p => /^prosjekt-fotosyntese$/i.test(p.name)));
  const V6 = {
    id: 'v6', title: 'Prosjektuka', laerTitle: 'et prosjekt fra start til innlevering', del: DEL, delDesc: DEL_DESC,
    desc: 'Alt sammen: hent materiale, pakk ut, skriv med kilder, lag PDF, del med gruppa og lever.',
    laer: `
      <h4>Arbeidsflyten i et prosjekt</h4>
      <ol><li><b>Mappe først.</b> Lag en egen mappe for prosjektet i OneDrive, i riktig fagmappe.</li>
      <li><b>Hent materialet</b> og pakk ut ZIP-filer <i>i prosjektmappen</i>, ikke i Nedlastinger.</li>
      <li><b>Les oppgaven</b> og vurderingskriteriene før du begynner.</li>
      <li><b>Skriv</b> med overskrift og egne ord. Ta med sitater i anførselstegn, og skriv kildene <i>mens du jobber</i>, ikke etterpå.</li>
      <li><b>Lagre</b> i prosjektmappen med et tydelig navn.</li>
      <li><b>Del</b> med gruppa med lenke og redigeringstilgang, så dere jobber i samme fil.</li>
      <li><b>Lag PDF</b> når du er ferdig, og <b>lever</b> den.</li></ol>
      <h4>Sjekkliste før du leverer</h4>
      <p>Er det riktig fil? Er det PDF hvis læreren ba om det? Har filen et navn som forteller hva den er? Står kildene med? Etter innlevering: sjekk at det står <b>Levert</b>.</p>`,
    oppdrag: [
      {
        id: 'v6o1', title: 'Hele prosjektet, steg for steg', lukk: ['skriv', 'nettleser', 'innlevering', 'viewer'],
        setup: F => {
          removeFolderNamed('Prosjekt-fotosyntese');
          M.removeWhere(/^prosjekt-fotosyntese\.(docx|txt|pdf)$/i);
          F.ensureFolder(P_NAT);
          if (window.Innlevering) Innlevering.reset('naturfag-prosjekt');
        },
        steps: [
          { laer: true, quiz: { q: 'Hva er det første du gjør i et nytt prosjekt?', options: ['Lager en prosjektmappe i riktig fagmappe', 'Laster ned materialet og jobber rett fra Nedlastinger', 'Begynner å skrive, og finner ut hvor filen skal ligge etterpå'], answer: 0 } },
          { laer: true, quiz: { q: 'Når er det lurest å skrive ned kildene?', options: ['Mens du jobber', 'Helt til slutt, når teksten er ferdig', 'Rett før du lager PDF-en'], answer: 0 } },
          { laer: true, quiz: { q: 'Gruppa skal skrive sammen. Hvordan deler du dokumentet?', options: ['Sender det som vedlegg til alle i gruppa', 'Deler en lenke med redigeringstilgang', 'Deler en lenke der de bare kan lese'], answer: 1 } },
          { text: 'Lag mappen <b>Prosjekt-fotosyntese</b> i <b>OneDrive › Skole › Naturfag</b>.', check: S => M.folderInNamed('Prosjekt-fotosyntese', 'Naturfag') },
          { text: 'Last ned <b>Prosjektfiler om fotosyntese</b> fra Skoleportalen og <b>pakk dem ut i den nye mappen</b>.', hint: 'Pakk ut alle → Bla gjennom … → velg Prosjekt-fotosyntese → Pakk ut.', check: S => under('Oppgave-fotosyntese.docx', 'Prosjekt-fotosyntese') },
          { text: 'Les <b>Oppgave-fotosyntese</b> og <b>Vurdering</b> fra den utpakkede mappen.', check: S => S.ev('open-file', d => /^(oppgave-fotosyntese|vurdering)/i.test(d.name)) },
          { text: 'Skriv svaret i et <b>nytt</b> dokument i Skriv: en overskrift med stilen <b>Overskrift 1</b>, minst to setninger med <b>egne ord</b>, ett <b>sitat</b> fra Naturfagleksikonet i anførselstegn, og en linje med <b>kilden</b> (adressen).', hint: 'Åpne artikkelen i Nettleser, kopier en setning og adressen, og fest Skriv og Nettleser side om side.', check: S => { const t = S.editorText(); return S.skriv().headings.includes('h1') && hasQuote(t) && quoteMarks(t) && hasUrl(t) && ownText(t).length >= 60; } },
          { text: 'Lagre dokumentet som <b>Prosjekt-fotosyntese</b> i mappen <b>Prosjekt-fotosyntese</b>.', check: S => projDoc(/^prosjekt-fotosyntese\.(docx|txt)$/i) },
          { text: 'Lag en <b>PDF</b> av dokumentet i samme mappe (<kbd>Ctrl</kbd>+<kbd>P</kbd> → Microsoft Print to PDF).', check: S => projDoc(/^prosjekt-fotosyntese.*\.pdf$/i) },
          { text: '<b>Del</b> Word-dokumentet med <b>Jonas og Kari (gruppa mi)</b> med redigeringstilgang.', check: S => S.ev('share', d => /^prosjekt-fotosyntese\.(docx|txt)$/i.test(d.name) && d.who === 'gruppe' && d.perm === 'edit') },
          { text: 'Lever <b>PDF-en</b> i Innleveringer under <b>Naturfag: Prosjekt: Fotosyntese</b>.', hint: 'Legg til arbeid → finn PDF-en i Prosjekt-fotosyntese → Lever inn. La du til feil fil? Klikk Angre innlevering, fjern den, og legg til riktig.', check: S => S.ev('submit', d => d.assignment === 'naturfag-prosjekt' && d.files.some(f => /^prosjekt-fotosyntese.*\.pdf$/i.test(f))) },
          { quiz: { q: 'Hva sjekker du etter at du har levert?', options: ['At det står «Levert», og at filen er riktig', 'At læreren har lest og godkjent innleveringen', 'At filen er slettet fra prosjektmappen din'], answer: 0 } }
        ]
      }
    ]
  };

  /* ---------- Legg kursene til etter grunnkurset ---------- */
  KURS.push(V1, V2, V3, V4, V5, V6);

  /* ---------- Mesterprøver ---------- */
  addMaster('v1', {
    lukk: ['explorer'],
    title: 'Rydd mange filer raskt',
    intro: 'I Dokumenter › Rot ligger det mange filer om hverandre. Rydd dem, og gjør det med flere filer om gangen.',
    setup: F => {
      const eng = ['Engelsk-gloser-1.docx', 'Engelsk-gloser-2.docx', 'Engelsk-essay.docx', 'Engelsk-lytting.docx'];
      const nat = ['Naturfag-celler.docx', 'Naturfag-planter.docx', 'Naturfag-lab.docx', 'Naturfag-quiz.docx'];
      const tmp = ['slett-1.tmp', 'slett-2.tmp', 'slett-3.tmp'];
      eng.concat(nat, tmp).forEach(n => FS.silentRemoveAll(n));
      F.ensureFolder(P_ROT); F.ensureFolder(P_ENG); F.ensureFolder(P_NAT);
      eng.concat(nat, tmp).forEach(n => F.ensureFileAt(P_ROT, n, n));
    },
    goals: [
      { text: 'Alle <b>Engelsk</b>-filene ligger i Engelsk-mappen i OneDrive', check: S => ['Engelsk-gloser-1.docx', 'Engelsk-gloser-2.docx', 'Engelsk-essay.docx', 'Engelsk-lytting.docx'].every(n => S.fileInNamed(n, 'Engelsk') && !S.fileIn(n, P_ROT)) },
      { text: 'Alle <b>Naturfag</b>-filene ligger i Naturfag-mappen i OneDrive', check: S => ['Naturfag-celler.docx', 'Naturfag-planter.docx', 'Naturfag-lab.docx', 'Naturfag-quiz.docx'].every(n => S.fileInNamed(n, 'Naturfag') && !S.fileIn(n, P_ROT)) },
      { text: 'De tre <b>.tmp</b>-filene er slettet', check: S => ['slett-1.tmp', 'slett-2.tmp', 'slett-3.tmp'].every(n => !S.fileIn(n, P_ROT)) && ['slett-1.tmp', 'slett-2.tmp', 'slett-3.tmp'].every(n => S.inBin(n) || S.gone(n)) },
      { text: 'Minst én gang har du flyttet eller slettet <b>tre filer samtidig</b>', check: S => S.ev('paste', d => d.mode === 'cut' && d.ids.length >= 3) || S.ev('drop', d => !d.copy && d.ids.length >= 3) || S.ev('delete-action', d => d.ids.length >= 3) }
    ]
  }, [
    'Merk flere filer med Ctrl + klikk på din egen PC, og flytt dem samtidig.',
    'Prøv dra-markering i en mappe med mange bilder.',
    'Se på statuslinjen nederst i Filutforsker før du sletter noe.'
  ]);

  addMaster('v2', {
    lukk: ['explorer'],
    title: 'To vinduer, én bevegelse',
    intro: 'Fest to Filutforsker-vinduer side om side og flytt en fil fra det ene til det andre ved å dra.',
    setup: F => { FS.silentRemoveAll('Til-skrivebordet.txt'); F.ensureFileAt(P_DOC, 'Til-skrivebordet.txt', 'Dra meg over til skrivebordet.'); },
    goals: [
      { text: 'Ha ett Filutforsker-vindu festet til <b>venstre</b>', check: S => S.ev('window-snap', d => d.app === 'explorer' && d.side === 'left') },
      { text: 'Og ett festet til <b>høyre</b>', check: S => S.ev('window-snap', d => d.app === 'explorer' && d.side === 'right') && S.wins('explorer') >= 2 },
      { text: 'Dra <b>Til-skrivebordet</b> fra Dokumenter til <b>Skrivebord</b>', check: S => S.fileIn('Til-skrivebordet.txt', P_DESK) && !S.fileIn('Til-skrivebordet.txt', P_DOC) && S.ev('drop') }
    ]
  }, [
    'Fest to vinduer side om side på din egen PC med Windows-tasten og pil venstre/høyre.',
    'Kopier tekst fra en nettside til et dokument med Ctrl+C og Ctrl+V.'
  ]);

  addMaster('v3', {
    lukk: ['skriv', 'explorer'],
    title: 'Pakk ut, lag PDF, pakk sammen',
    intro: 'Læreren har sendt ukeoppgavene som en ZIP-fil, og du skal levere svaret som PDF.',
    setup: F => {
      FS.silentRemoveAll('Ukeoppgaver.zip'); removeFolderNamed('Ukeoppgaver');
      M.removeWhere(/^svar-uke-41\.(docx|pdf)$/i);
      F.ensureFileAt(P_DL, 'Ukeoppgaver.zip', ZIP_UKE());
      F.ensureFileAt(P_NORSK, 'Svar-uke-41.docx', 'Svar uke 41\n\nOppgave 1: Høsten er fin fordi bladene skifter farge.');
    },
    goals: [
      { text: 'Pakk ut <b>Ukeoppgaver.zip</b> (i Nedlastinger) til en mappe i <b>OneDrive</b>', check: S => FS.findAll(c => c.type === 'folder' && /^ukeoppgaver$/i.test(c.name)).some(f => M.nodeInOneDrive(f) && FS.children(f.id).some(x => /^oppgave1/i.test(x.name))) },
      { text: 'Lag en <b>PDF</b> av <b>Svar-uke-41</b> (ligger i Norsk)', check: S => S.ev('print', d => d.target === 'pdf' && /svar-uke-41/i.test(d.name)) },
      { text: 'Lag en ny <b>ZIP-fil</b> av noe du vil sende', check: S => S.ev('zip-create') }
    ]
  }, [
    'Lag en PDF av et Word-dokument på din egen PC (Fil → Lagre som → PDF, eller Skriv ut → Microsoft Print to PDF).',
    'Pakk ut en ZIP-fil på din egen PC med «Pakk ut alle», og velg selv hvor den skal havne.'
  ]);

  addMaster('v4', {
    lukk: ['skriv', 'nettleser'],
    title: 'Sitat med kilde',
    intro: 'Lag et kort dokument med et riktig sitat og en riktig kilde, uten oppskrift.',
    setup: F => { M.removeWhere(/^kildebruk\.(docx|txt)$/i); F.ensureFolder(P_SK); },
    goals: [
      { text: 'Et <b>sitat</b> fra Naturfagleksikonet i anførselstegn i et dokument i Skriv', check: S => hasQuote(S.editorText()) && quoteMarks(S.editorText()) },
      { text: '<b>Kilden</b> med adressen og forfatteren', check: S => hasUrl(S.editorText()) && /solberg/i.test(S.editorText()) },
      { text: 'Lagret som <b>Kildebruk</b> i OneDrive', check: S => M.fileInOneDrive(c => /^kildebruk\.(docx|txt)$/i.test(c.name) && hasQuote(Skriv.plainText(c.content || ''))) }
    ]
  }, [
    'Neste gang du skriver en oppgave: skriv kildene i en liste nederst mens du jobber.',
    'Sjekk en nettside du bruker: hvem står bak, når ble den skrevet, og hvorfor finnes den?'
  ]);

  addMaster('v5', {
    lukk: ['epost', 'innstillinger'],
    title: 'Ikke la deg lure',
    intro: 'Innboksen har fått fire nye meldinger igjen. Rydd opp, lag et sterkt passord, og del en fil trygt.',
    setup: F => {
      if (window.Epost) { Epost.reset(); Epost.deliver(['m4', 'm5', 'm6', 'm7']); }
      FS.silentRemoveAll('Ukeplan-8A.docx'); F.ensureFolder(P_SAMF);
      const n = F.ensureFileAt(P_SAMF, 'Ukeplan-8A.docx', 'Ukeplan for 8A'); if (n) n.shared = false;
    },
    goals: [
      { text: 'Rapporter (eller slett) <b>alle de tre falske</b> meldingene', check: S => PHISH.every(gone) },
      { text: '…men <b>ikke</b> den ekte meldingen fra læreren', check: S => { const m = mailSt(); return PHISH.every(gone) && !(m.reported || []).includes('m5') && !(m.deleted || []).includes('m5'); } },
      { text: 'Lag et <b>sterkt passord</b> i Innstillinger', check: S => S.ev('password-test', d => d.score >= 3) },
      { text: 'Del <b>Ukeplan-8A</b> med hele klassen med <b>bare lesetilgang</b>', check: S => S.ev('share', d => /ukeplan-8a/i.test(d.name) && d.who === 'klassen' && d.perm === 'read') }
    ]
  }, [
    'Slå på totrinnsbekreftelse på en konto du har, hvis du ikke har gjort det.',
    'Hold musepekeren over en lenke i en ekte e-post før du klikker, og se hvor den går.',
    'Lag en passordfrase av fire tilfeldige ord til neste konto du lager.'
  ]);

  addMaster('v6', {
    lukk: ['skriv', 'nettleser', 'innlevering', 'viewer'],
    title: 'Prosjekt på egen hånd',
    intro: 'Gjør et lite prosjekt helt uten oppskrift. Alt du trenger, har du lært.',
    setup: F => {
      removeFolderNamed('Mesterprosjekt');
      M.removeWhere(/^mesterprosjekt\.(docx|txt|pdf)$/i);
      F.ensureFolder(P_NAT);
      if (window.Innlevering) Innlevering.reset('naturfag-prosjekt');
    },
    goals: [
      { text: 'Lag mappen <b>Mesterprosjekt</b> i en fagmappe i OneDrive', check: S => FS.findAll(c => c.type === 'folder' && /^mesterprosjekt$/i.test(c.name.trim())).some(f => { const p = FS.get(f.parent); return M.nodeInOneDrive(f) && !!p && M.isFag(p.name); }) },
      { text: 'Et dokument i mappen med <b>Overskrift 1</b>, et <b>sitat</b> og <b>kilden</b>', check: S => FS.findAll(c => c.type === 'file' && /\.(docx|txt)$/i.test(c.name)).some(f => { const t = Skriv.plainText(f.content || ''); return FS.path(f.id).some(p => /^mesterprosjekt$/i.test(p.name)) && /<h1/i.test(f.content || '') && hasQuote(t) && quoteMarks(t) && hasUrl(t); }) },
      { text: 'En <b>PDF</b> av dokumentet i samme mappe', check: S => FS.findAll(c => c.type === 'file' && /\.pdf$/i.test(c.name)).some(f => FS.path(f.id).some(p => /^mesterprosjekt$/i.test(p.name))) },
      { text: 'Lever PDF-en fra Mesterprosjekt under <b>Naturfag: Prosjekt: Fotosyntese</b>', check: S => S.ev('submit', d => d.assignment === 'naturfag-prosjekt' && d.files.some(n => /\.pdf$/i.test(n) && FS.findAll(c => c.type === 'file' && low(c.name) === low(n)).some(f => FS.path(f.id).some(p => /^mesterprosjekt$/i.test(p.name))))) }
    ]
  }, [
    'Bruk arbeidsflyten i neste ekte prosjekt: mappe først, kilder underveis, PDF og innlevering til slutt.'
  ]);

  /* ---------- Ukens øving ---------- */
  REPETISJON.push(
    { id: 'rv1', kurs: 'v1', text: 'Merk minst tre filer med <kbd>Ctrl</kbd> + klikk i Filutforsker.', check: S => S.ev('select', d => d.how === 'ctrl' && d.names.length >= 3) },
    { id: 'rv2', kurs: 'v1', text: 'Merk alt i en mappe med <kbd>Ctrl</kbd>+<kbd>A</kbd>.', check: S => S.ev('select', d => d.how === 'all') },
    { id: 'rv3', kurs: 'v2', text: 'Fest et vindu til venstre halvdel av skjermen.', check: S => S.ev('window-snap', d => d.side === 'left') },
    { id: 'rv4', kurs: 'v3', text: 'Lag en PDF av et dokument med Skriv ut → <b>Microsoft Print to PDF</b>.', check: S => S.ev('print', d => d.target === 'pdf') },
    { id: 'rv5', kurs: 'v3', text: 'Pakk ut <b>Ukeoppgaver.zip</b> fra Nedlastinger.', setup: F => { FS.silentRemoveAll('Ukeoppgaver.zip'); removeFolderNamed('Ukeoppgaver'); F.ensureFileAt(P_DL, 'Ukeoppgaver.zip', ZIP_UKE()); }, check: S => S.ev('zip-extract') },
    { id: 'rv6', kurs: 'v4', text: 'Kopier adressen til en nettside fra adressefeltet i Nettleser.', check: S => S.ev('browser-copy-url') },
    { id: 'rv7', kurs: 'v5', text: 'Hold musepekeren over lenken i en e-post og se hvor den egentlig går.', setup: () => { if (window.Epost) Epost.deliver(['m4']); }, check: S => S.ev('mail-link-hover') }
  );
})();
