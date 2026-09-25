/* Tilleggsinnhold til grunnkurset:
   - tre nye kurs: E-post og deling, Notater (OneNote), Når noe ikke virker
   - et skrivetreningsoppdrag i tastaturkurset
   - mesterprøve og «gjør det på ekte» for alle kurs
   - oppgavebanken til ukens øving (REPETISJON)
   Filen legger seg oppå KURS fra oppdrag.js, så kursinnholdet står ett sted per tema. */

/* ---------- Hjelpere for sjekkene ---------- */
const M = {
  /* Finnes det en mappe med dette navnet inni en mappe med et annet navn? */
  folderInNamed(child, parent) {
    return FS.findAll(c => c.type === 'folder' && c.name.trim().toLowerCase() === parent.toLowerCase())
      .some(p => FS.children(p.id).some(c => c.type === 'folder' && c.name.trim().toLowerCase() === child.toLowerCase()));
  },
  anyInNamed(parent, pred) {
    return FS.findAll(c => c.type === 'folder' && c.name.trim().toLowerCase() === parent.toLowerCase())
      .some(p => FS.children(p.id).some(c => pred(c)));
  },
  /* Ligger filen i OneDrive (uansett hvor dypt)? */
  inOneDrive(name) { const f = FS.findByName(name, 'file'); return !!f && FS.isDesc(f.id, FS.roots().onedrive); },
  nodeInOneDrive(n) { return !!n && FS.isDesc(n.id, FS.roots().onedrive); },
  /* Et fag-navn vi godtar som «en fagmappe» */
  isFag(name) { return /norsk|matte|matematikk|engelsk|naturfag|samfunn|krle|musikk|kunst|mat og helse|gym|kroppsøving|spansk|tysk|fransk/i.test(name || ''); },
  fileInFagmappe(pred) {
    return FS.findAll(c => c.type === 'file' && (!pred || pred(c))).some(c => { const p = FS.get(c.parent); return p && M.isFag(p.name) && FS.isDesc(c.id, FS.roots().onedrive); });
  },
  countIn(path) { const f = FS.resolve(path); return f ? FS.children(f.id).length : 0; }
};

/* ============================================================
   NYTT KURS: E-post og deling
   ============================================================ */
const KURS_EPOST = {
  id: 'ke', title: 'E-post og deling', laerTitle: 'e-post, vedlegg og deling',
  desc: 'Vedlegg i e-post, svar og svar alle, og å dele en fil med lenke i stedet for kopi.',
  laer: `
    <h4>E-post på skolen</h4>
    <p>Du har en skoleadresse, for eksempel <b>elev@skolen.no</b>. En e-postadresse har alltid en krøllalfa <b>@</b> og et punktum. Skriv den nøyaktig, ellers kommer meldingen aldri frem.</p>
    <h4>Vedlegg</h4>
    <p>Et <b>vedlegg</b> er en fil som henger ved meldingen, merket med en binders 📎. <b>Vedlegget ligger ikke på PC-en din.</b> Vil du beholde det, må du velge <b>Lagre som</b> og legge det i en mappe, helst i OneDrive. Åpner du vedlegget uten å lagre det, jobber du i en midlertidig kopi, og arbeidet ditt kan forsvinne.</p>
    <h4>Svar og svar alle</h4>
    <table><tr><th>Knapp</th><th>Hvem får svaret</th></tr>
    <tr><td><b>Svar</b></td><td>Bare den som sendte meldingen</td></tr>
    <tr><td><b>Svar alle</b></td><td>Alle som fikk meldingen, kanskje hele klassen</td></tr></table>
    <p>Bruk <b>Svar alle</b> bare når alle trenger å vite svaret. Ellers får tretti personer en melding de ikke trenger.</p>
    <h4>Lenke eller vedlegg?</h4>
    <p>Når filen ligger i <b>OneDrive</b>, kan du <b>dele en lenke</b> i stedet for å sende en kopi.</p>
    <table><tr><th></th><th>Lenke</th><th>Vedlegg</th></tr>
    <tr><td>Hva de får</td><td>Den samme filen som deg</td><td>En kopi</td></tr>
    <tr><td>Hvis noen endrer noe</td><td>Alle ser endringen</td><td>Bare i kopien deres</td></tr>
    <tr><td>Passer til</td><td>Samarbeid og gruppearbeid</td><td>Noe som er helt ferdig</td></tr></table>
    <p>Når flere skriver i det samme dokumentet samtidig, heter det <b>samskriving</b>. Dere ser hverandres endringer med én gang, og alt lagres automatisk.</p>`,
  oppdrag: [
    {
      id: 'keo1', title: 'Vedlegg i innboksen',
      setup: F => { if (window.Epost) Epost.reset(); F.ensureFolder(['OneDrive', 'Skole', 'Norsk']); F.silentRemoveAll('Bokrapport-mal.docx'); },
      steps: [
        { laer: true, quiz: { q: 'Hva er et vedlegg?', options: ['En fil som henger ved en e-post', 'En lenke til en nettside', 'Et bilde i signaturen'], answer: 0 } },
        { laer: true, quiz: { q: 'Du åpner et vedlegg og skriver i det, uten å lagre det først. Hva er risikoen?', options: ['Ingen, det lagres automatisk', 'Du jobber i en midlertidig kopi, og arbeidet kan forsvinne', 'E-posten blir slettet'], answer: 1 } },
        { laer: true, quiz: { q: 'Når bør du bruke «Svar alle»?', options: ['Alltid, så er du sikker', 'Aldri', 'Bare når alle som fikk meldingen trenger svaret'], answer: 2 } },
        { text: 'Åpne <b>E-post</b> fra oppgavelinjen. Meldinger du ikke har lest, står med fet skrift.', check: S => S.ev('window-open', d => d.app === 'epost') },
        { text: 'Åpne meldingen <b>Mal for bokrapport</b> fra læreren.', check: S => S.ev('mail-open', d => /bokrapport/i.test(d.subject)) },
        { text: 'Meldingen har et vedlegg. Klikk <b>Lagre som …</b> ved vedlegget, og lagre det i <b>OneDrive › Skole › Norsk</b>.', hint: 'I vinduet som kommer opp: klikk deg frem til OneDrive, så Skole, så Norsk, og klikk Lagre.', check: S => M.inOneDrive('Bokrapport-mal.docx') },
        { text: 'Gå til Filutforsker og sjekk at filen ligger i <b>Norsk</b>-mappen.', check: S => S.ev('explorer-nav', d => /norsk/i.test(d.name)) },
        { text: 'Tilbake i E-post: åpne meldingen fra <b>Jonas</b> og klikk <b>Svar</b> (ikke Svar alle, siden bare Jonas spurte).', check: S => S.ev('mail-compose', d => d.reply && !d.all) },
        { text: 'Skriv et kort svar og klikk <b>Send</b>.', check: S => S.ev('mail-send', d => d.reply && (d.body || '').trim().length > 3) }
      ]
    },
    {
      id: 'keo2', title: 'Send en fil, og del en fil',
      setup: F => { const n = F.ensureFileAt(['OneDrive', 'Skole', 'Norsk'], 'Min-del-samfunnsfag.docx', 'Min del av gruppeoppgaven\n\nDemokrati betyr folkestyre.'); if (n) n.shared = false; },
      steps: [
        { text: 'I E-post: klikk <b>Ny melding</b>. Skriv <b>jonas.berg@skolen.no</b> i Til-feltet og et emne.', hint: 'Krøllalfa @ skriver du med AltGr og 2.', check: S => S.ev('mail-compose') },
        { text: 'Klikk <b>📎 Legg ved fil …</b> og velg <b>Min-del-samfunnsfag</b> fra OneDrive › Skole › Norsk.', check: S => S.ev('mail-attach', d => /min-del/i.test(d.name)) },
        { text: 'Send meldingen.', check: S => S.ev('mail-send', d => d.attach.some(a => /min-del/i.test(a))) },
        { text: 'Nå gjør vi det på den andre måten. Gå til Filutforsker, høyreklikk på <b>Min-del-samfunnsfag</b> i OneDrive og velg <b>Del</b>.', hint: 'Del ligger i høyreklikkmenyen, under Kopier som bane.', check: S => S.ev('ctxmenu', d => d.where === 'file') && S.ev('dialog-open', d => /^Del /.test(d.title || '')) },
        { text: 'Velg at <b>gruppa mi</b> skal <b>kunne redigere</b>, og klikk <b>Kopier lenke</b>.', check: S => S.ev('share', d => d.perm === 'edit') },
        { text: 'Åpne filen i Skriv og vent noen sekunder. Nå skriver Kari i dokumentet samtidig som deg. Det kalles samskriving.', hint: 'Dobbeltklikk på filen i Filutforsker. Vent litt, så dukker teksten hennes opp.', check: S => S.ev('coedit') },
        { quiz: { q: 'Du og to andre skal skrive en tekst sammen. Hva er best?', options: ['Sende dokumentet som vedlegg til hverandre', 'Dele en lenke til filen i OneDrive', 'Skrive hver for seg og lime sammen til slutt'], answer: 1 } },
        { quiz: { q: 'Hva er ulempen med å sende et dokument som vedlegg til en gruppe?', options: ['Det tar for lang tid å sende', 'Alle får hver sin kopi, og endringene deres samles aldri', 'Vedlegg kan ikke åpnes på skole-PC'], answer: 1 } }
      ]
    }
  ]
};

/* ============================================================
   NYTT KURS: Notater (OneNote)
   ============================================================ */
const KURS_NOTATER = {
  id: 'kn', title: 'Notater (OneNote)', laerTitle: 'notatblokk, inndeling og side',
  desc: 'Struktur i notatblokken: inndelinger per fag, sider per tema, og å finne igjen notatene.',
  laer: `
    <h4>Tre nivåer</h4>
    <p>OneNote er en digital ringperm. Den har tre nivåer, og det er hele hemmeligheten:</p>
    <table><tr><th>Nivå</th><th>Tilsvarer</th><th>Eksempel</th></tr>
    <tr><td><b>Notatblokk</b></td><td>Selve permen</td><td>«Skolen min»</td></tr>
    <tr><td><b>Inndeling</b></td><td>Skilleark, ett per fag</td><td>Norsk, Matte, Naturfag</td></tr>
    <tr><td><b>Side</b></td><td>Et ark</td><td>«Brøk», «Fotosyntese»</td></tr></table>
    <p>Inndelingene står til <b>venstre</b>, hver med sin farge. Sidene i den valgte inndelingen står i <b>midten</b>. Selve notatet er til <b>høyre</b>.</p>
    <h4>Det ser forskjellig ut, men fungerer likt</h4>
    <p>OneNote finnes i flere versjoner, og knappene kan stå litt ulikt. <b>Strukturen er alltid den samme:</b> notatblokk, inndeling, side. Finner du de tre, finner du frem i alle versjoner.</p>
    <h4>Du trenger ikke lagre</h4>
    <p>OneNote lagrer <b>automatisk</b> mens du skriver. Det finnes ingen lagre-knapp, og du trenger den ikke. Notatblokken ligger i OneDrive, så du finner den igjen på alle enheter.</p>
    <h4>Finn igjen</h4>
    <p>Gi sidene <b>tydelige titler</b>, så finner du dem igjen. Søkefeltet øverst leter i hele notatblokken, både i titler og i teksten på sidene.</p>`,
  oppdrag: [
    {
      id: 'kno1', title: 'Bli kjent med notatblokken',
      setup: F => { if (window.Notater) Notater.reset(); },
      steps: [
        { laer: true, quiz: { q: 'Hva er de tre nivåene i OneNote, fra størst til minst?', options: ['Side, inndeling, notatblokk', 'Notatblokk, inndeling, side', 'Mappe, fil, tekst'], answer: 1 } },
        { laer: true, quiz: { q: 'Hvordan lagrer du i OneNote?', options: ['Ctrl+S etter hver setning', 'Du trenger ikke lagre, det skjer automatisk', 'Via Fil og Lagre som'], answer: 1 } },
        { laer: true, quiz: { q: 'OneNote ser litt annerledes ut på PC-en til en medelev. Hva er likt?', options: ['Strukturen: notatblokk, inndeling og side', 'Fargene på inndelingene', 'Ingenting'], answer: 0 } },
        { text: 'Åpne <b>Notater</b> fra oppgavelinjen. Til venstre ser du inndelingene <b>Norsk</b> og <b>Matte</b>.', check: S => S.ev('notes-app-open') },
        { text: 'Klikk på inndelingen <b>Matte</b> og les siden som ligger der.', check: S => S.ev('notes-open-section', d => /matte/i.test(d.name)) },
        { text: 'Lag en ny inndeling for et fag du har: klikk <b>+ Ny inndeling</b> og gi den navnet <b>Naturfag</b>.', check: S => S.notes().sections.some(s => /naturfag/i.test(s)) },
        { text: 'Lag en <b>Ny side</b> i Naturfag og kall den <b>Fotosyntese</b>.', hint: 'Sørg for at Naturfag er valgt til venstre først. Klikk så «+ Ny side» i midten.', check: S => S.notes().pages.some(p => /fotosyntese/i.test(p.title) && /naturfag/i.test(p.section)) },
        { text: 'Skriv minst en setning om fotosyntese på siden. Legg merke til at det ikke finnes noen lagre-knapp.', check: S => S.notes().pages.some(p => /fotosyntese/i.test(p.title) && p.text.trim().length > 15) },
        { text: 'Lag en <b>punktliste</b> på siden med minst to punkter (klikk «• liste»).', check: S => S.notes().pages.some(p => /fotosyntese/i.test(p.title) && (p.html.match(/<li/gi) || []).length >= 2) }
      ]
    },
    {
      id: 'kno2', title: 'Rydd og finn igjen',
      setup: F => { if (window.Notater) Notater.reset(); },
      steps: [
        { text: 'Lag en inndeling som heter <b>Engelsk</b>.', check: S => S.notes().sections.some(s => /engelsk/i.test(s)) },
        { text: 'Lag en side i <b>Norsk</b> som heter <b>Gloser</b>. Den hører egentlig hjemme i Engelsk, men lag den i Norsk først.', check: S => S.notes().pages.some(p => /gloser/i.test(p.title) && /norsk/i.test(p.section)) },
        { text: 'Flytt siden til riktig inndeling: høyreklikk på <b>Gloser</b> i sidelisten og velg <b>Flytt til inndeling → Engelsk</b>.', hint: 'Høyreklikk på selve sidenavnet i den midterste listen.', check: S => S.notes().pages.some(p => /gloser/i.test(p.title) && /engelsk/i.test(p.section)) },
        { text: 'Skriv minst tre gloser på siden, for eksempel «house = hus».', check: S => S.notes().pages.some(p => /gloser/i.test(p.title) && p.text.trim().length > 15) },
        { text: 'Bruk <b>søkefeltet</b> øverst til høyre og søk etter et ord du skrev på gloser-siden.', hint: 'Søket leter både i titlene og i teksten på sidene.', check: S => S.ev('notes-search', d => (d.query || '').length >= 3) },
        { text: 'Klikk på treffet for å hoppe til siden.', check: S => S.ev('notes-open-page', d => d.via === 'search') },
        { text: 'Gi inndelingen <b>Norsk</b> en ny farge: høyreklikk på den og velg <b>Endre farge</b>.', check: S => S.ev('ctxmenu', d => d.where === 'notater-sec') },
        { quiz: { q: 'Du husker ikke hvilken inndeling et notat ligger i. Hva gjør du?', options: ['Lager notatet på nytt', 'Leter i alle inndelingene én etter én', 'Bruker søkefeltet øverst'], answer: 2 } },
        { quiz: { q: 'Hvorfor er det lurt å gi sidene tydelige titler?', options: ['Det ser penere ut', 'Fordi du og søket finner dem igjen senere', 'Fordi OneNote krever det'], answer: 1 } }
      ]
    }
  ]
};

/* ============================================================
   NYTT KURS: Når noe ikke virker
   ============================================================ */
const KURS_HJELP = {
  id: 'kh', title: 'Når noe ikke virker', laerTitle: 'å løse problemer selv',
  desc: 'Finn igjen filer som er «borte», stopp programmer som henger, og angre feil.',
  laer: `
    <h4>Sjekk disse fem tingene først</h4>
    <p>De aller fleste problemer på en PC løses av én av disse. Gå gjennom listen før du rekker opp hånden.</p>
    <table><tr><th>Problem</th><th>Sjekk dette</th></tr>
    <tr><td>«Filen min er borte»</td><td>Søk etter navnet i Filutforsker. Se i <b>Papirkurven</b>. Se i <b>Nedlastinger</b> og på <b>Skrivebordet</b>. Sorter etter <b>endringsdato</b> for å finne det du jobbet med sist.</td></tr>
    <tr><td>«Jeg slettet noe feil»</td><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> angrer det siste. Er filen i papirkurven, kan du <b>gjenopprette</b> den.</td></tr>
    <tr><td>«Programmet henger»</td><td>Vent litt først. Så: <b>Oppgavebehandling</b> (høyreklikk på oppgavelinjen) og <b>Avslutt oppgave</b>. Åpne programmet på nytt.</td></tr>
    <tr><td>«Feil program åpner filen»</td><td>Høyreklikk på filen og velg <b>Åpne med</b>.</td></tr>
    <tr><td>«Arbeidet mitt forsvant»</td><td>Lå filen i <b>OneDrive</b>, er den autolagret. Lå den lokalt, er det bare det du lagret med <kbd>Ctrl</kbd>+<kbd>S</kbd> som finnes.</td></tr></table>
    <h4>Når du ber om hjelp</h4>
    <p>Fortell <b>hva du gjorde</b>, <b>hva som skjedde</b> og <b>hva som står på skjermen</b>. «Det virker ikke» er vanskelig å hjelpe med. «Jeg trykket Lagre, og da kom det en rød melding om at mappen ikke finnes» er lett å hjelpe med.</p>`,
  oppdrag: [
    {
      id: 'kho1', title: 'Filen er borte',
      setup: F => {
        F.ensureFolder(['OneDrive', 'Skole', 'Norsk']);
        F.silentRemoveAll('Viktig-innlevering.docx');
        const n = F.ensureFileAt(['Denne PC-en', 'Dokumenter'], 'Viktig-innlevering.docx', 'Innlevering i norsk\n\nDette er teksten jeg har jobbet med i to uker.');
        if (n) F.remove(n.id, { via: 'setup' });
      },
      steps: [
        { laer: true, quiz: { q: 'Du finner ikke igjen en fil. Hvor er det lurt å lete først?', options: ['Søke etter navnet i Filutforsker og se i papirkurven', 'Lage filen på nytt', 'Starte PC-en på nytt'], answer: 0 } },
        { laer: true, quiz: { q: 'Hva gjør Ctrl+Z?', options: ['Lagrer', 'Angrer det siste du gjorde', 'Lukker programmet'], answer: 1 } },
        { text: 'Filen <b>Viktig-innlevering</b> er forsvunnet. Åpne Filutforsker og <b>søk</b> etter «innlevering» fra Denne PC-en.', hint: 'Klikk på Denne PC-en i menyen til venstre, og skriv i søkefeltet øverst til høyre.', check: S => S.ev('search', d => /innlev/i.test(d.query)) },
        { text: 'Søket finner den ikke, for den ligger i <b>papirkurven</b>. Åpne Papirkurven.', check: S => S.ev('explorer-nav', d => d.name === 'Papirkurv') },
        { text: '<b>Gjenopprett</b> filen. Den går tilbake dit den lå.', check: S => !!S.file('Viktig-innlevering.docx') && !S.inBin('Viktig-innlevering.docx') },
        { text: 'Flytt den til <b>OneDrive › Skole › Norsk</b>, så den er trygg og autolagres.', check: S => M.inOneDrive('Viktig-innlevering.docx') },
        { text: 'Slett den ved et uhell igjen (velg den og trykk <kbd>Delete</kbd>), og angre med <kbd>Ctrl</kbd>+<kbd>Z</kbd>.', check: S => S.ev('shortcut', d => d.key === 'z') && !!S.file('Viktig-innlevering.docx') && !S.inBin('Viktig-innlevering.docx') },
        { quiz: { q: 'Hvor havner en fil du sletter i Filutforsker?', options: ['Den er borte for alltid', 'I papirkurven', 'I Nedlastinger'], answer: 1 } }
      ]
    },
    {
      id: 'kho2', title: 'Programmet henger',
      steps: [
        { text: 'Åpne <b>Skriv</b> og lat som om det har hengt seg.', check: S => S.wins('skriv') > 0 },
        { text: '<b>Høyreklikk på oppgavelinjen</b> nederst og velg <b>Oppgavebehandling</b>.', hint: 'Høyreklikk på et tomt sted i oppgavelinjen, ikke på et ikon.', check: S => S.ev('window-open', d => d.app === 'taskmgr') },
        { text: 'Finn <b>Skriv</b> i listen og klikk <b>Avslutt oppgave</b>. Programmet lukkes med en gang, uten å spørre om lagring.', check: S => S.ev('end-task', d => d.app === 'skriv') },
        { text: 'Åpne Skriv igjen. Slik gjør du det på en ekte PC også.', check: S => S.ev('window-open', d => d.app === 'skriv') },
        { quiz: { q: 'Hva er det første du bør gjøre når et program ser ut til å henge?', options: ['Trykke mange ganger på alt', 'Vente noen sekunder, mange ting løser seg selv', 'Skru av PC-en med av-knappen'], answer: 1 } },
        { quiz: { q: 'Hva mister du hvis du avslutter et program med Oppgavebehandling?', options: ['Ingenting', 'Alt du ikke har lagret', 'Hele filen'], answer: 1 } }
      ]
    },
    {
      id: 'kho3', title: 'Hvor lagret jeg det?',
      setup: F => {
        F.silentRemoveAll('Presentasjon-uke-39.pptx');
        F.ensureFileAt(['Denne PC-en', 'Nedlastinger'], 'Presentasjon-uke-39.pptx', 'Presentasjon');
        const n = F.findByName('Presentasjon-uke-39.pptx'); if (n) n.modified = Date.now();
      },
      steps: [
        { text: 'Du jobbet med en presentasjon i går, men husker ikke hvor du lagret den. Gå til <b>Denne PC-en</b> i Filutforsker.', check: S => S.ev('explorer-nav', d => d.name === 'Denne PC-en') },
        { text: 'Søk etter <b>presentasjon</b>. Kolonnen <b>Plassering</b> viser hvor treffene ligger.', check: S => S.ev('search', d => /presentasjon/i.test(d.query)) },
        { text: 'Den lå i <b>Nedlastinger</b>. Flytt den til en fagmappe i OneDrive, så du finner den igjen neste gang.', hint: 'Dra filen til fagmappen, eller bruk Ctrl+X og Ctrl+V.', check: S => M.inOneDrive('Presentasjon-uke-39.pptx') },
        { text: 'Gå til fagmappen, bytt til <b>Detaljer</b>-visning og sorter etter <b>Endringsdato</b>. Da ligger det du jobbet med sist øverst eller nederst.', check: S => S.ev('sort', d => d.by === 'modified') },
        { quiz: { q: 'Hva er den beste måten å slippe å lete etter filer på?', options: ['Lagre alt på skrivebordet', 'Lagre i riktig fagmappe i OneDrive med et tydelig navn', 'Lagre alt i Nedlastinger'], answer: 1 } },
        { quiz: { q: 'Du skal be om hjelp. Hva er mest nyttig å si?', options: ['«Det virker ikke»', '«PC-en er dum»', '«Jeg trykket Lagre, og da kom det en melding om at mappen ikke finnes»'], answer: 2 } }
      ]
    }
  ]
};

/* ---------- Sett de nye kursene inn i riktig rekkefølge ---------- */
(function insertKurs() {
  const at = id => { const i = KURS.findIndex(k => k.id === id); return i < 0 ? KURS.length : i; };
  KURS.splice(at('k6'), 0, KURS_EPOST);   /* e-post kommer før innlevering */
  KURS.splice(at('k7'), 0, KURS_NOTATER); /* notater før rydde-kurset */
  KURS.push(KURS_HJELP);                  /* feilsøking helt til slutt */
})();

/* ---------- Skrivetrening som eget oppdrag i tastaturkurset ---------- */
(function addTyping() {
  const k8 = KURS.find(k => k.id === 'k8'); if (!k8) return;
  k8.oppdrag.push({
    id: 'k8o2', title: 'Skriv raskere',
    intro: 'Å skrive uten å se på tastaturet er en ferdighet du får bruk for hver eneste dag. Her måler du deg selv og ser fremgangen.',
    setup: F => { /* ingen filer trengs */ },
    steps: [
      { text: 'Åpne <b>Skrivetrening</b> fra Start-menyen eller oppgavelinjen.', check: S => S.ev('typing-app-open') },
      { text: 'Les tipsene nederst, og plasser fingrene på hjemmeraden: <kbd>a</kbd> <kbd>s</kbd> <kbd>d</kbd> <kbd>f</kbd> og <kbd>j</kbd> <kbd>k</kbd> <kbd>l</kbd> <kbd>ø</kbd>. Kjenn etter kulene på <kbd>F</kbd> og <kbd>J</kbd>.', hint: 'Kulene er små opphøyde streker på tastene. De hjelper deg å finne plassen uten å se ned.', check: S => S.ev('typing-start') },
      { text: 'Fullfør øvelsen <b>Hjemmeraden</b> med minst <b>90 % riktig</b>. Skriv heller sakte og riktig enn fort og feil.', check: S => S.ev('typing-done', d => d.acc >= 90) },
      { text: 'Bytt til øvelsen <b>Æ, Ø og Å</b> og fullfør den også.', check: S => S.ev('typing-done', d => d.level === 'aeoa') },
      { text: 'Prøv <b>Store bokstaver og tegn</b>. Her trenger du <kbd>Shift</kbd> og <kbd>AltGr</kbd>.', check: S => S.ev('typing-done', d => d.level === 'tegn') },
      { text: 'Ta én øvelse til og prøv å slå din egen rekord i ord per minutt.', check: S => S.evCount('typing-done') >= 4 },
      { quiz: { q: 'Hva er viktigst når du øver på å skrive?', options: ['Å skrive riktig, farten kommer etterpå', 'Å skrive så fort som mulig', 'Å se på tastaturet hele tiden'], answer: 0 } },
      { quiz: { q: 'Hvorfor har F og J en liten kul på seg?', options: ['For å vise at de er ødelagte', 'Så du finner hjemmeraden uten å se ned', 'Fordi de brukes mest'], answer: 1 } }
    ]
  });
})();

/* ============================================================
   MESTERPRØVER og «GJØR DET PÅ EKTE»
   Målene må starte som «ikke oppnådd», derfor krever flere av dem
   en hendelse (S.ev) siden prøven startet.
   ============================================================ */
function addMaster(id, m, ekte) {
  const k = KURS.find(x => x.id === id);
  if (!k) return;
  k.mesterprove = m;
  if (ekte) k.ekte = ekte;
}

addMaster('k1', {
  title: 'Styr PC-en selv',
  intro: 'Vis at du kan åpne programmer, styre vinduer og bruke høyreklikk uten oppskrift.',
  setup: F => { F.silentRemoveAll('Ferdig'); F.silentRemoveAll('Prøve'); },
  goals: [
    { text: 'Ha <b>to programmer åpne samtidig</b>', check: S => S.wins() >= 2 },
    { text: 'Lag en mappe på <b>skrivebordet</b> som heter <b>Prøve</b>', check: S => S.folderIn('Prøve', P_DESK) },
    { text: 'Gi den nytt navn til <b>Ferdig</b>', check: S => S.folderIn('Ferdig', P_DESK) },
    { text: 'Lukk alle vinduene du har åpnet', check: S => S.ev('window-close') && S.wins() === 0 }
  ]
}, [
  'Åpne Filutforsker på din egen PC og maksimer vinduet.',
  'Lag en mappe på skrivebordet og gi den et navn med F2.',
  'Høyreklikk på oppgavelinjen og se hva menyen inneholder.'
]);

addMaster('k2', {
  title: 'Bygg din egen mappestruktur',
  intro: 'Du skal lage en ryddig struktur i OneDrive, helt uten steg-for-steg.',
  setup: F => { F.silentRemoveAll('Prosjekt'); },
  goals: [
    { text: 'Lag en mappe som heter <b>Prosjekt</b> i OneDrive', check: S => { const f = FS.findAll(c => c.type === 'folder' && /^prosjekt$/i.test(c.name))[0]; return !!f && FS.isDesc(f.id, FS.roots().onedrive); } },
    { text: 'Lag mappene <b>Tekst</b> og <b>Bilder</b> <i>inni</i> Prosjekt', check: S => M.folderInNamed('Tekst', 'Prosjekt') && M.folderInNamed('Bilder', 'Prosjekt') },
    { text: 'Åpne mappen Tekst, slik at adressefeltet viser OneDrive › … › Prosjekt › Tekst', check: S => S.ev('explorer-nav', d => /prosjekt/i.test(d.path) && /^tekst$/i.test(d.name)) }
  ]
}, [
  'Lag mappen Skole i OneDrive på din egen PC, med én mappe per fag.',
  'Finn frem til en fagmappe og les adressefeltet høyt for deg selv.'
]);

addMaster('k3', {
  title: 'Rydd uten hjelp',
  intro: 'Tre filer ligger på skrivebordet. De skal håndteres på tre forskjellige måter.',
  setup: F => {
    ['prove-a.txt', 'prove-b.txt', 'prove-c.txt'].forEach(n => F.silentRemoveAll(n));
    F.ensureFileAt(P_DESK, 'prove-a.txt', 'Denne skal flyttes.');
    F.ensureFileAt(P_DESK, 'prove-b.txt', 'Denne skal kopieres.');
    F.ensureFileAt(P_DESK, 'prove-c.txt', 'Denne skal slettes.');
  },
  goals: [
    { text: '<b>Flytt</b> «prove-a» til Dokumenter, så den ikke lenger ligger på skrivebordet', check: S => S.fileIn('prove-a.txt', P_DOC) && !S.fileIn('prove-a.txt', P_DESK) },
    { text: '<b>Kopier</b> «prove-b» til Dokumenter, så den ligger begge steder', check: S => S.fileIn('prove-b.txt', P_DOC) && S.fileIn('prove-b.txt', P_DESK) },
    { text: '<b>Slett</b> «prove-c», så den havner i papirkurven', check: S => S.inBin('prove-c.txt') }
  ]
}, [
  'Flytt en fil på din egen PC ved å dra den, og en annen med Ctrl+X og Ctrl+V.',
  'Slett en fil du ikke trenger, og sjekk at den ligger i papirkurven.'
]);

addMaster('k4', {
  title: 'Fra blankt ark til riktig mappe',
  intro: 'Skriv noe nytt, lagre det på riktig sted med et godt navn, og finn det igjen.',
  setup: F => { F.silentRemoveAll('Mesterprove.docx'); F.ensureFolder(P_SK); },
  goals: [
    { text: 'Skriv minst 40 tegn i et nytt dokument i Skriv', check: S => S.editorText().trim().length >= 40 },
    { text: 'Lagre det som <b>Mesterprove</b> i en <b>fagmappe i OneDrive</b>', check: S => M.fileInFagmappe(c => /^mesterprove\.(docx|txt)$/i.test(c.name)) },
    { text: 'Lukk Skriv og åpne filen igjen fra Filutforsker', check: S => S.ev('window-close', d => d.app === 'skriv') && S.ev('open-file', d => /^mesterprove/i.test(d.name)) }
  ]
}, [
  'Lag et dokument i Word på din egen PC og lagre det i riktig fagmappe i OneDrive.',
  'Lukk Word og finn dokumentet igjen i Filutforsker.'
]);

addMaster('kf', {
  title: 'Sett opp et dokument',
  intro: 'Lag et dokument som ser ryddig ut, med overskrift, uthevet tekst og en liste.',
  setup: F => { F.silentRemoveAll('Oppsett.docx'); F.ensureFolder(P_SK); },
  goals: [
    { text: 'Lag en <b>overskrift</b> med stilen Overskrift 1', check: S => S.skriv().headings.includes('h1') },
    { text: 'Gjør minst ett ord <b>fett</b>', check: S => S.skriv().bold },
    { text: 'Lag en <b>punktliste</b> med minst tre punkter', check: S => S.skriv().lists.includes('ul') && S.skriv().listItems >= 3 },
    { text: 'Lagre dokumentet som <b>Oppsett</b> i OneDrive', check: S => M.inOneDrive('Oppsett.docx') }
  ]
}, [
  'Skriv en overskrift i Word på din egen PC og gi den stilen Overskrift 1.',
  'Lag en punktliste og gjør ett ord fett med Ctrl+B.'
]);

addMaster('k5', {
  title: 'Hent og rydd',
  intro: 'Hent en fil fra nettet og sørg for at den havner der den skal, ikke i Nedlastinger.',
  setup: F => { F.silentRemoveAll('Demokrati.pptx'); F.ensureFolder(P_SK); },
  goals: [
    { text: 'Last ned <b>Presentasjon om demokrati</b> fra Skoleportalen', check: S => S.ev('download', d => /demokrati/i.test(d.base)) },
    { text: 'Flytt filen ut av Nedlastinger og inn i <b>OneDrive</b>', check: S => M.inOneDrive('Demokrati.pptx') },
    { text: 'Sjekk at den ikke ligger igjen i Nedlastinger', check: S => !S.fileIn('Demokrati.pptx', P_DL) && M.inOneDrive('Demokrati.pptx') }
  ]
}, [
  'Last ned et vedlegg eller en fil på din egen PC og flytt den til riktig mappe med én gang.',
  'Rydd i Nedlastinger-mappen din: slett det du ikke trenger.'
]);

addMaster('ke', {
  title: 'Ta vare på det du får, og del det du lager',
  intro: 'Vis at du kan hente et vedlegg ut av e-posten, og at du velger riktig mellom lenke og vedlegg.',
  setup: F => { if (window.Epost) Epost.reset(); F.silentRemoveAll('Ukeplan-uke-39.pdf'); F.ensureFolder(P_SK); },
  goals: [
    { text: 'Lagre vedlegget <b>Ukeplan-uke-39</b> fra innboksen i en mappe i <b>OneDrive</b>', check: S => M.inOneDrive('Ukeplan-uke-39.pdf') },
    { text: 'Send en e-post til <b>jonas.berg@skolen.no</b> med et <b>vedlegg</b>', check: S => S.ev('mail-send', d => /jonas/i.test(d.to) && d.attach.length > 0) },
    { text: '<b>Del</b> en fil i OneDrive med en lenke', check: S => S.ev('share') }
  ]
}, [
  'Lagre et vedlegg fra skole-e-posten din i riktig mappe i OneDrive.',
  'Del et dokument med en i klassen ved å sende en lenke i stedet for et vedlegg.'
]);

addMaster('k6', {
  title: 'Lever inn på egen hånd',
  intro: 'Naturfag-rapporten skal leveres. Du får ingen oppskrift denne gangen.',
  setup: F => { F.ensureFolder(P_NAT); F.ensureFileAt(P_NAT, 'Rapport-fotosyntese.docx', 'Rapport om fotosyntese'); if (window.Innlevering) Innlevering.reset('naturfag-rapport'); },
  goals: [
    { text: 'Åpne oppgaven <b>Naturfag: Rapport: Fotosyntese</b> i Innleveringer', check: S => S.ev('assignment-open', d => d.id === 'naturfag-rapport') },
    { text: 'Legg ved <b>Rapport-fotosyntese</b> fra OneDrive', check: S => S.ev('attach', d => d.assignment === 'naturfag-rapport' && /fotosyntese/i.test(d.name)) },
    { text: 'Lever inn', check: S => S.ev('submit', d => d.assignment === 'naturfag-rapport') }
  ]
}, [
  'Lever en oppgave i Teams på din egen PC, og sjekk at det står «Levert» etterpå.',
  'Se om læreren har gitt tilbakemelding på en tidligere innlevering.'
]);

addMaster('kn', {
  title: 'Notatblokken er din',
  intro: 'Sett opp notatblokken slik du selv vil ha den, og vis at du finner igjen det du skriver.',
  setup: F => { if (window.Notater) Notater.reset(); },
  goals: [
    { text: 'Lag en ny <b>inndeling</b> som heter <b>Samfunnsfag</b>', check: S => S.notes().sections.some(s => /samfunnsfag/i.test(s)) },
    { text: 'Lag en <b>side</b> i den med en tydelig tittel', check: S => S.notes().pages.some(p => /samfunnsfag/i.test(p.section) && p.title.trim().length >= 3) },
    { text: 'Skriv minst 30 tegn på siden', check: S => S.notes().pages.some(p => /samfunnsfag/i.test(p.section) && p.text.trim().length >= 30) },
    { text: 'Finn siden igjen med <b>søk</b>', check: S => S.ev('notes-search') && S.ev('notes-open-page', d => d.via === 'search') }
  ]
}, [
  'Åpne OneNote på din egen PC og finn notatblokk, inndeling og side.',
  'Lag en inndeling for et fag du mangler, og en side for dagens time.'
]);

addMaster('k7', {
  title: 'Finn, rydd og navngi',
  intro: 'En fil med et dårlig navn ligger et sted på PC-en. Finn den, gi den et godt navn og legg den riktig.',
  setup: F => {
    F.silentRemoveAll('dokument44.docx');
    F.ensureFolder(P_ENG);
    F.ensureFile([...P_DOC, 'Gammelt', 'Prosjekter'], 'dokument44.docx', 'English essay about London\n\nLondon is the capital of England.');
  },
  goals: [
    { text: 'Finn filen <b>dokument44</b> med søk', check: S => S.ev('search', d => /dokument44|dokument/i.test(d.query)) },
    { text: 'Gi den et <b>godt navn</b> som forteller hva den inneholder', check: S => { const f = S.byContent('English essay'); return !!f && !/^dokument/i.test(f.name) && f.name.length > 8; } },
    { text: 'Legg den i riktig <b>fagmappe</b> i OneDrive', check: S => { const f = S.byContent('English essay'); if (!f) return false; const p = FS.get(f.parent); return !!p && /engelsk|english/i.test(p.name) && FS.isDesc(f.id, FS.roots().onedrive); } }
  ]
}, [
  'Søk opp en fil på din egen PC med søkefeltet i Filutforsker.',
  'Finn en fil med et dårlig navn og gi den et navn som forteller hva den er.'
]);

addMaster('k8', {
  title: 'Tastaturet sitter',
  intro: 'Vis at fingrene finner frem, både på bokstavene og på snarveiene.',
  setup: F => { F.silentRemoveAll('Tastaturprove.docx'); },
  goals: [
    { text: 'Fullfør en skriveøvelse med minst <b>92 % riktig</b>', check: S => S.ev('typing-done', d => d.acc >= 92) },
    { text: 'Skriv en e-postadresse med <b>@</b> i et dokument i Skriv', check: S => /\S+@\S+\.\w/.test(S.editorText()) },
    { text: 'Bruk <b>Ctrl</b>+<b>C</b> og <b>Ctrl</b>+<b>V</b> i Skriv', check: S => S.ev('shortcut', d => d.ctrl && d.key === 'c' && d.app === 'skriv') && S.ev('shortcut', d => d.ctrl && d.key === 'v' && d.app === 'skriv') },
    { text: 'Lagre dokumentet som <b>Tastaturprove</b>', check: S => !!S.file('Tastaturprove.docx') }
  ]
}, [
  'Ta en skriveøvelse på din egen PC uten å se på tastaturet.',
  'Bruk Ctrl+C, Ctrl+V og Ctrl+Z i et ekte dokument.',
  'Prøv Alt+Tab for å bytte mellom to åpne programmer.'
]);

addMaster('kh', {
  title: 'Løs problemet selv',
  intro: 'Tre ting har gått galt. Fiks dem uten å spørre om hjelp.',
  setup: F => {
    F.silentRemoveAll('Gruppeoppgave.docx');
    const n = F.ensureFileAt(P_DOC, 'Gruppeoppgave.docx', 'Gruppeoppgave i samfunnsfag');
    if (n) F.remove(n.id, { via: 'setup' });
  },
  goals: [
    { text: 'Filen <b>Gruppeoppgave</b> er «borte». Finn den og få den tilbake', check: S => !!S.file('Gruppeoppgave.docx') && !S.inBin('Gruppeoppgave.docx') },
    { text: 'Legg den et trygt sted, i <b>OneDrive</b>', check: S => M.inOneDrive('Gruppeoppgave.docx') },
    { text: 'Åpne <b>Oppgavebehandling</b> og avslutt et program du har åpent', check: S => S.ev('end-task') }
  ]
}, [
  'Åpne Oppgavebehandling på din egen PC med Ctrl+Shift+Esc.',
  'Se i papirkurven din, og gjenopprett noe du slettet ved et uhell.',
  'Sjekk at skolearbeidet ditt ligger i OneDrive og ikke bare lokalt.'
]);

/* ============================================================
   UKENS ØVING: korte oppgaver uten hint, trukket fra fullførte kurs
   ============================================================ */
const REPETISJON = [
  { id: 'rp1', kurs: 'k1', text: 'Åpne <b>Filutforsker</b> og maksimer vinduet.', check: S => S.ev('window-max', d => d.app === 'explorer') },
  { id: 'rp2', kurs: 'k1', text: 'Høyreklikk på <b>skrivebordet</b> og lukk menyen igjen med <kbd>Esc</kbd>.', check: S => S.ev('ctxmenu', d => d.where === 'desktop') && S.ev('ctxmenu-close', d => d.via === 'esc') },
  { id: 'rp3', kurs: 'k2', text: 'Lag en mappe som heter <b>Uketest</b> i Dokumenter.', setup: F => F.silentRemoveAll('Uketest'), check: S => S.folderIn('Uketest', P_DOC) },
  { id: 'rp4', kurs: 'k2', text: 'Gå til <b>OneDrive › Skole</b> i Filutforsker.', check: S => S.ev('explorer-nav', d => /^skole$/i.test(d.name)) },
  { id: 'rp5', kurs: 'k3', text: 'Kopier filen <b>uke-fil.txt</b> fra skrivebordet til Dokumenter.', setup: F => { F.silentRemoveAll('uke-fil.txt'); F.ensureFileAt(P_DESK, 'uke-fil.txt', 'Testfil'); }, check: S => S.fileIn('uke-fil.txt', P_DOC) && S.fileIn('uke-fil.txt', P_DESK) },
  { id: 'rp6', kurs: 'k3', text: 'Slett filen <b>slett-meg.txt</b> fra skrivebordet, og tøm papirkurven etterpå.', setup: F => { F.silentRemoveAll('slett-meg.txt'); F.ensureFileAt(P_DESK, 'slett-meg.txt', 'Slett meg'); }, check: S => S.gone('slett-meg.txt') },
  { id: 'rp7', kurs: 'k3', text: 'Flytt <b>flytt-meg.txt</b> fra Nedlastinger til Dokumenter.', setup: F => { F.silentRemoveAll('flytt-meg.txt'); F.ensureFileAt(P_DL, 'flytt-meg.txt', 'Flytt meg'); }, check: S => S.fileIn('flytt-meg.txt', P_DOC) },
  { id: 'rp8', kurs: 'k4', text: 'Lag et dokument i Skriv, skriv navnet ditt, og lagre det som <b>Ukesnotat</b> i OneDrive.', setup: F => F.silentRemoveAll('Ukesnotat.docx'), check: S => M.inOneDrive('Ukesnotat.docx') },
  { id: 'rp9', kurs: 'k4', text: 'Slå på <b>Vis filendelser</b> i Filutforsker.', setup: F => { if (Explorer.settings.showExt) Explorer.setShowExt(false, 'rep'); }, check: S => S.ev('show-ext', d => d.on) },
  { id: 'rp10', kurs: 'kf', text: 'Skriv en setning i Skriv og gjør minst ett ord <b>fett</b>.', check: S => S.skriv().bold },
  { id: 'rp11', kurs: 'kf', text: 'Lag en <b>punktliste</b> med to punkter i Skriv.', check: S => S.skriv().lists.includes('ul') && S.skriv().listItems >= 2 },
  { id: 'rp12', kurs: 'kf', text: 'Sett skrifttypen til <b>Arial</b> på en tekst du har markert i Skriv.', check: S => S.ev('format', d => d.cmd === 'fontName' && /arial/i.test(d.value)) },
  { id: 'rp13', kurs: 'k5', text: 'Last ned <b>Oppgaveark om brøk</b> fra Skoleportalen og flytt filen til OneDrive.', setup: F => F.silentRemoveAll('Oppgaveark-brøk.pdf'), check: S => M.inOneDrive('Oppgaveark-brøk.pdf') },
  { id: 'rp14', kurs: 'ke', text: 'Lagre vedlegget i meldingen <b>Ukeplan uke 39</b> i Dokumenter.', setup: F => { if (window.Epost) Epost.reset(); F.silentRemoveAll('Ukeplan-uke-39.pdf'); }, check: S => !!S.file('Ukeplan-uke-39.pdf') },
  { id: 'rp15', kurs: 'ke', text: 'Send en e-post til <b>kari.hansen@skolen.no</b> med et emne og en melding.', check: S => S.ev('mail-send', d => /kari/i.test(d.to) && (d.subject || '').length > 2) },
  { id: 'rp16', kurs: 'k6', text: 'Lever inn <b>Matte: Brøk-oppgaver</b> i Innleveringer med en fil fra OneDrive.', setup: F => { F.ensureFolder(P_MATTE); F.ensureFileAt(P_MATTE, 'Oppgaveark-brøk.pdf', 'Brøk'); if (window.Innlevering) Innlevering.reset('matte-brok'); }, check: S => S.ev('submit', d => d.assignment === 'matte-brok') },
  { id: 'rp17', kurs: 'kn', text: 'Lag en ny side i Notater som heter <b>Ukens ord</b>, og skriv noe på den.', check: S => S.notes().pages.some(p => /ukens ord/i.test(p.title) && p.text.trim().length > 5) },
  { id: 'rp18', kurs: 'kn', text: 'Søk i notatblokken etter et ord du har skrevet.', check: S => S.ev('notes-search', d => (d.query || '').length >= 3) },
  { id: 'rp19', kurs: 'k7', text: 'Søk etter <b>budsjett</b> i Filutforsker og åpne treffet.', setup: F => F.ensureFile([...P_DOC, '7. trinn', 'Prosjekter', 'Klassetur'], 'Klassetur-budsjett.xlsx', ''), check: S => S.ev('search', d => /budsjett/i.test(d.query)) && S.ev('open-file', d => /budsjett/i.test(d.name)) },
  { id: 'rp20', kurs: 'k7', text: 'Bytt til <b>Detaljer</b>-visning og sorter etter <b>endringsdato</b>.', check: S => S.ev('view', d => d.view === 'details') && S.ev('sort', d => d.by === 'modified') },
  { id: 'rp21', kurs: 'k8', text: 'Fullfør en skriveøvelse i Skrivetrening.', check: S => S.ev('typing-done') },
  { id: 'rp22', kurs: 'k8', text: 'Skriv <b>test@skolen.no</b> i et dokument i Skriv.', check: S => /test@skolen\.no/i.test(S.editorText()) },
  { id: 'rp23', kurs: 'kh', text: 'Slett <b>angre-meg.txt</b> fra skrivebordet, og angre med <kbd>Ctrl</kbd>+<kbd>Z</kbd>.', setup: F => { F.silentRemoveAll('angre-meg.txt'); F.ensureFileAt(P_DESK, 'angre-meg.txt', 'Angre meg'); }, check: S => S.ev('shortcut', d => d.key === 'z') && S.fileIn('angre-meg.txt', P_DESK) },
  { id: 'rp24', kurs: 'kh', text: 'Åpne <b>Oppgavebehandling</b> fra oppgavelinjen.', check: S => S.ev('window-open', d => d.app === 'taskmgr') }
];
