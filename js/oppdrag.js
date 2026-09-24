/* Kurs og oppdrag. Hvert steg har en check(S)-funksjon som sjekkes automatisk,
   eller en quiz. S er hjelpeobjektet fra coach.js (se der for tilgjengelige funksjoner). */

const P_DOC = ['Denne PC-en', 'Dokumenter'];
const P_DESK = ['Denne PC-en', 'Skrivebord'];
const P_DL = ['Denne PC-en', 'Nedlastinger'];
const P_PIC = ['Denne PC-en', 'Bilder'];
const P_SK = ['OneDrive', 'Skole'];
const P_NORSK = ['OneDrive', 'Skole', 'Norsk'];
const P_MATTE = ['OneDrive', 'Skole', 'Matte'];
const P_ENG = ['OneDrive', 'Skole', 'Engelsk'];
const P_NAT = ['OneDrive', 'Skole', 'Naturfag'];

const KURS = [
  /* ============================================================ */
  {
    id: 'k1', title: 'Bli kjent med PC-en', laerTitle: 'skrivebord, mus og vinduer',
    desc: 'Skrivebordet, oppgavelinjen, musen og hvordan vinduer fungerer.',
    laer: `
      <h4>Skrivebordet</h4>
      <p>Det du ser når PC-en starter, heter <b>skrivebordet</b>. Nederst ligger <b>oppgavelinjen</b> med <b>Start-knappen</b> (Windows-logoen) og ikoner for programmer. Programmer som er åpne, får en strek under ikonet.</p>
      <h4>Mus og styreflate</h4>
      <table><tr><th>Handling</th><th>Hva det gjør</th></tr>
      <tr><td><b>Venstreklikk</b> (ett trykk)</td><td>Velger noe, eller trykker på en knapp</td></tr>
      <tr><td><b>Dobbeltklikk</b> (to raske trykk)</td><td>Åpner en fil, mappe eller et program</td></tr>
      <tr><td><b>Høyreklikk</b> (høyre knapp, eller to fingre på styreflaten)</td><td>Åpner en meny med flere valg</td></tr>
      <tr><td><b>Dra og slipp</b></td><td>Hold venstre knapp nede, flytt, slipp</td></tr></table>
      <h4>Høyreklikk på styreflaten (bærbar PC)</h4>
      <p>Uten mus: <b>trykk lett med to fingre samtidig</b> på styreflaten. Det virker også å trykke nede i høyre hjørne av styreflaten.</p>
      <p><b>Menyen er forskjellig etter hva du høyreklikker på.</b> En fil, en mappe, skrivebordet og oppgavelinjen har hver sin meny. Derfor: høyreklikk alltid på <i>tingen</i> du vil gjøre noe med. Trykk <kbd>Esc</kbd> for å lukke menyen uten å velge noe.</p>
      <h4>Vinduer</h4>
      <p>Hvert program åpnes i et <b>vindu</b>. Øverst til høyre i vinduet finner du tre knapper:
      <b>—</b> minimerer (gjemmer vinduet i oppgavelinjen), <b>☐</b> maksimerer (fyller hele skjermen), <b>✕</b> lukker. Du flytter et vindu ved å dra i <b>tittellinjen</b> øverst.</p>
      <h4>Gi nytt navn</h4>
      <p>En ny mappe får standardnavnet «Ny mappe», med navnet markert. Skriv det nye navnet med en gang og trykk <kbd>Enter</kbd>. Klikket du bort først? Klikk <i>én gang</i> på mappen, trykk <kbd>F2</kbd> (eller høyreklikk → Gi nytt navn), skriv navnet og trykk <kbd>Enter</kbd>.</p>`,
    oppdrag: [
      {
        id: 'k1o1', title: 'Åpne, flytt og lukk et vindu',
        steps: [
          { laer: true, quiz: { q: 'Hva er oppgavelinjen?', options: ['Stripen nederst på skjermen med Start-knappen og programmer', 'Menyen som kommer når du høyreklikker', 'Vinduet til Filutforsker'], answer: 0 } },
          { laer: true, quiz: { q: 'Hva gjør knappen — (minimer) øverst i et vindu?', options: ['Lukker programmet', 'Gjemmer vinduet i oppgavelinjen, programmet er fortsatt åpent', 'Gjør vinduet større'], answer: 1 } },
          { laer: true, quiz: { q: 'Hvordan flytter du et vindu?', options: ['Dobbeltklikker på ✕', 'Trykker Enter', 'Drar i tittellinjen øverst i vinduet'], answer: 2 } },
          { text: 'Klikk på det gule mappe-ikonet (<b>Filutforsker</b>) i oppgavelinjen nederst på skjermen.', hint: 'Oppgavelinjen er den lyse stripen helt nederst. Filutforsker er den gule mappen ved siden av Start-knappen.', check: S => S.ev('window-open', d => d.app === 'explorer') },
          { text: 'Maksimer vinduet: klikk på <b>☐</b> øverst til høyre i vinduet.', hint: 'Knappen i midten av de tre knappene øverst til høyre i vinduet. Du kan også dobbeltklikke på tittellinjen.', check: S => S.ev('window-max') },
          { text: 'Gjør vinduet mindre igjen: klikk på den samme knappen (<b>❐</b>).', check: S => S.ev('window-restore') },
          { text: 'Flytt vinduet: hold venstre museknapp nede på <b>tittellinjen</b> (den hvite stripen øverst i vinduet) og dra.', hint: 'Trykk og hold på tittellinjen, flytt musen, og slipp.', check: S => S.ev('window-move') },
          { text: 'Minimer vinduet med <b>—</b>. Vinduet forsvinner, men programmet er fortsatt åpent, se streken under ikonet i oppgavelinjen.', check: S => S.ev('window-min') },
          { text: 'Hent vinduet tilbake ved å klikke på Filutforsker-ikonet i oppgavelinjen.', check: S => S.ev('window-focus', d => d.app === 'explorer') },
          { text: 'Lukk vinduet med <b>✕</b>.', check: S => S.ev('window-close', d => d.app === 'explorer') }
        ]
      },
      {
        id: 'k1o2', title: 'Start-menyen og flere programmer',
        steps: [
          { text: 'Klikk på <b>Start-knappen</b> (Windows-logoen) i oppgavelinjen.', hint: 'Den blå firkanten med fire ruter, helt til venstre blant ikonene i oppgavelinjen.', check: S => S.ev('startmenu-open') },
          { text: 'Åpne programmet <b>Skriv</b> fra Start-menyen.', check: S => S.ev('window-open', d => d.app === 'skriv' && d.via === 'startmenu') },
          { text: 'Åpne også <b>Nettleser</b> fra oppgavelinjen. Nå har du to programmer åpne samtidig.', check: S => S.ev('window-open', d => d.app === 'nettleser') },
          { text: 'Bytt tilbake til Skriv ved å klikke på Skriv-ikonet i <b>oppgavelinjen</b>.', hint: 'Klikk på det blå Skriv-ikonet nederst. Programmer som er åpne har en strek under seg.', check: S => S.ev('window-focus', d => d.app === 'skriv' && d.via === 'taskbar') },
          { text: 'Lukk begge programmene med <b>✕</b>.', check: S => S.wins('skriv') === 0 && S.wins('nettleser') === 0 && S.ev('window-close') },
          { quiz: { q: 'Hva betyr det når et ikon i oppgavelinjen har en strek under seg?', options: ['Programmet er åpent', 'Programmet er slettet', 'Programmet må oppdateres'], answer: 0 }, hint: 'Se på oppgavelinjen når du har et program åpent.' }
        ]
      },
      {
        id: 'k1o3', title: 'Høyreklikk og dobbeltklikk',
        setup: F => { const f = F.resolve([...P_DESK, 'Min mappe']); if (f) F.silentRemoveAll('Min mappe'); },
        steps: [
          { text: 'Høyreklikk på et tomt sted på <b>skrivebordet</b> (bakgrunnen). En meny dukker opp.', hint: 'Bruk høyre museknapp. På styreflaten: trykk med to fingre samtidig.', check: S => S.ev('ctxmenu', d => d.where === 'desktop') },
          { text: 'Velg <b>Ny → Mappe</b> i menyen. En mappe som heter «Ny mappe» dukker opp på skrivebordet.', hint: 'Hold musen over «Ny», så kommer det en undermeny til høyre. Klikk på «Mappe».', check: S => S.ev('fs', d => d.op === 'create' && d.kind === 'folder' && d.parent === FS.roots().desktop) || FS.children(FS.roots().desktop).some(c => c.type === 'folder') },
          { text: 'Gi mappen navnet <b>Min mappe</b>. Rett etter at mappen er laget, kan du bare skrive navnet og trykke <kbd>Enter</kbd>. Rakk du ikke det? Klikk <i>én gang</i> på mappen, trykk <kbd>F2</kbd>, skriv navnet og trykk <kbd>Enter</kbd>.', hint: 'F2 ligger øverst på tastaturet. Du kan også høyreklikke på mappen og velge «Gi nytt navn». Mappen heter «Ny mappe» helt til du har endret navnet.', check: S => S.folderIn('Min mappe', P_DESK) },
          { text: '<b>Dobbeltklikk</b> på mappen «Min mappe» på skrivebordet for å åpne den.', hint: 'To raske trykk med venstre museknapp.', check: S => S.ev('explorer-nav', d => d.name === 'Min mappe') },
          { text: 'Mappen er tom. Lukk vinduet.', check: S => S.ev('window-close', d => d.app === 'explorer') },
          { quiz: { q: 'Du vil se flere valg for en fil. Hva gjør du?', options: ['Holder musen stille over filen', 'Høyreklikker på filen', 'Dobbeltklikker på filen'], answer: 1 }, hint: 'Dobbeltklikk åpner. Hvilken knapp gir en meny?' }
        ]
      },
      {
        id: 'k1o4', title: 'Høyreklikk-jakten',
        intro: 'Menyen som kommer opp når du høyreklikker, er forskjellig etter hva du klikker på. På styreflaten: trykk lett med <b>to fingre samtidig</b>. Du får en liten melding hver gang du åpner en meny.',
        steps: [
          { text: 'Høyreklikk på et tomt sted på <b>skrivebordet</b>. Se på menyen: den handler om skrivebordet (Vis, Sorter, Ny …).', hint: 'Styreflate: trykk lett med to fingre samtidig. Mus: høyre knapp.', check: S => S.ev('ctxmenu', d => d.where === 'desktop') },
          { text: 'Lukk menyen uten å velge noe: trykk <kbd>Esc</kbd>.', hint: 'Esc-tasten ligger øverst til venstre på tastaturet.', check: S => S.ev('ctxmenu-close', d => d.via === 'esc') },
          { text: 'Høyreklikk på <b>Papirkurv</b>-ikonet. Menyen er annerledes: her finner du «Tøm papirkurv».', check: S => S.ev('ctxmenu', d => d.where === 'bin-icon') },
          { text: 'Høyreklikk på <b>Filutforsker-ikonet</b> i oppgavelinjen. Slike menyer bruker du til å feste eller løsne programmer.', check: S => S.ev('ctxmenu', d => d.where === 'taskbar-app') },
          { text: 'Åpne Filutforsker, gå til <b>Dokumenter</b> og høyreklikk på en <b>fil</b>. Legg merke til «Åpne med» og «Gi nytt navn».', check: S => S.ev('ctxmenu', d => d.where === 'file') },
          { text: 'Høyreklikk på en <b>mappe</b>. Se etter «Åpne i nytt vindu», som filer ikke har.', hint: 'Mappen «Gammelt» (eller «7. trinn») ligger i Dokumenter.', check: S => S.ev('ctxmenu', d => d.where === 'folder') },
          { text: 'Høyreklikk på et <b>tomt sted</b> inne i mappen. Denne menyen har «Ny» og «Lim inn».', check: S => S.ev('ctxmenu', d => d.where === 'explorer') },
          { text: 'Høyreklikk på <b>tittellinjen</b> øverst i vinduet, og velg <b>Lukk</b> i menyen.', hint: 'Tittellinjen er den hvite stripen med mappenavnet, helt øverst i vinduet.', check: S => S.ev('window-close', d => d.via === 'menu') },
          { quiz: { q: 'Du høyreklikker på en fil og deretter på et tomt sted i mappen. Får du samme meny?', options: ['Ja, alltid samme meny', 'Nei, menyen avhenger av hva du høyreklikker på', 'Bare hvis filen er valgt'], answer: 1 } },
          { quiz: { q: 'Hvordan høyreklikker du på styreflaten på en bærbar PC?', options: ['Dobbelttrykk med én finger', 'Hold én finger nede lenge', 'Trykk lett med to fingre samtidig'], answer: 2 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k2', title: 'Filer og mapper', laerTitle: 'hva filer og mapper er',
    desc: 'Finn frem i Filutforsker, lag mapper og gi gode navn.',
    laer: `
      <h4>Fil og mappe</h4>
      <p>En <b>fil</b> er et dokument, et bilde, en video, en presentasjon: alt du lagrer er en fil. Hver fil har et navn og en <b>filtype</b> (endelsen etter punktum, for eksempel <b>.docx</b>).</p>
      <p>En <b>mappe</b> er en beholder for filer og andre mapper, som en perm i en hylle. Mapper inni mapper kalles <b>undermapper</b>.</p>
      <h4>Filutforsker</h4>
      <p><b>Filutforsker</b> er programmet du bruker for å se, flytte og rydde i filer. Til venstre ser du de viktigste mappene. <b>Adressefeltet</b> øverst viser hvor du er:
      «Denne PC-en › Dokumenter › Norsk» betyr at mappen Norsk ligger inni Dokumenter.</p>
      <table><tr><th>Mappe</th><th>Brukes til</th></tr>
      <tr><td>Skrivebord</td><td>Det du ser på skjermen. Ikke lagre viktige ting her.</td></tr>
      <tr><td>Dokumenter</td><td>Dokumenter som bare ligger på denne PC-en</td></tr>
      <tr><td>Nedlastinger</td><td>Filer du henter fra internett havner her</td></tr>
      <tr><td>Bilder</td><td>Bilder og skjermbilder</td></tr>
      <tr><td><b>OneDrive</b></td><td>Skylagring: trygt, og tilgjengelig på alle enheter. <b>Skolearbeid lagres her.</b></td></tr></table>
      <p>Knappene <b>←</b> (tilbake) og <b>↑</b> (opp ett nivå) hjelper deg å navigere.</p>`,
    oppdrag: [
      {
        id: 'k2o1', title: 'Finn frem i Filutforsker',
        setup: F => { F.ensureFolder([...P_DOC, 'Gammelt', 'Prosjekter']); },
        steps: [
          { laer: true, quiz: { q: 'Hva er en filtype (filendelse)?', options: ['Mappen filen ligger i', 'Delen av navnet etter punktum, for eksempel .docx, som sier hva slags fil det er', 'Hvor stor filen er'], answer: 1 } },
          { laer: true, quiz: { q: 'Hvor bør skolearbeid lagres?', options: ['I OneDrive: skylagring som følger deg på alle enheter', 'På skrivebordet', 'I Nedlastinger'], answer: 0 } },
          { laer: true, quiz: { q: 'Hva gjør ↑-knappen (Opp) i Filutforsker?', options: ['Ruller opp i listen', 'Går til forrige side', 'Går til mappen som ligger over den du står i'], answer: 2 } },
          { text: 'Åpne <b>Filutforsker</b>.', check: S => S.wins('explorer') > 0 && S.ev('window-open', d => d.app === 'explorer') },
          { text: 'Klikk på <b>Dokumenter</b> i menyen til venstre.', check: S => S.ev('explorer-nav', d => d.name === 'Dokumenter') },
          { text: 'Åpne mappen <b>Gammelt</b> (dobbeltklikk på den).', hint: 'Hvis du ikke ser mappen «Gammelt», heter den kanskje «7. trinn» fordi du har gitt den nytt navn tidligere.', check: S => S.ev('explorer-nav', d => d.name === 'Gammelt' || d.name === '7. trinn') },
          { text: 'Se på <b>adressefeltet</b> øverst. Det viser: Denne PC-en › Dokumenter › Gammelt. Åpne nå mappen <b>Prosjekter</b>.', check: S => S.ev('explorer-nav', d => d.name === 'Prosjekter') },
          { text: 'Gå ett nivå <b>opp</b> med <b>↑</b>-knappen. Da kommer du tilbake til mappen som Prosjekter ligger i.', hint: 'Pil opp-knappen ligger ved siden av adressefeltet.', check: S => S.ev('explorer-up') },
          { text: 'Klikk <b>←</b> (Tilbake) for å gå til forrige sted du var.', check: S => S.ev('explorer-back') },
          { text: 'Klikk på <b>Bilder</b> i menyen til venstre.', check: S => S.ev('explorer-nav', d => d.name === 'Bilder') },
          { quiz: { q: 'Adressefeltet viser: Denne PC-en › Dokumenter › Gammelt › Prosjekter. Hvilken mappe ligger inni Gammelt?', options: ['Dokumenter', 'Denne PC-en', 'Prosjekter'], answer: 2 }, hint: 'Les adressen fra venstre mot høyre. Hver mappe ligger inni den til venstre for seg.' },
          { quiz: { q: 'Hva er forskjellen på en fil og en mappe?', options: ['En mappe kan inneholde filer og andre mapper. En fil er selve dokumentet, bildet eller videoen.', 'En fil kan inneholde mapper.', 'Det er det samme, bare forskjellige ikoner.'], answer: 0 } }
        ]
      },
      {
        id: 'k2o2', title: 'Lag mapper for fagene',
        steps: [
          { text: 'Gå til <b>OneDrive › Skole</b> i Filutforsker.', hint: 'Klikk på ▸ ved OneDrive i menyen til venstre for å vise mappene, eller dobbeltklikk deg frem.', check: S => S.ev('explorer-nav', d => d.name === 'Skole') },
          { text: 'Lag en ny mappe som heter <b>Norsk</b>. Bruk <b>Ny</b>-knappen øverst, eller høyreklikk på et tomt sted → Ny → Mappe. Skriv navnet og trykk <kbd>Enter</kbd>.', hint: 'Den nye mappen heter «Ny mappe» og navnet er markert. Bare skriv «Norsk» og trykk Enter. Klikket du bort før du skrev navnet? Klikk én gang på mappen, trykk F2, skriv navnet og trykk Enter.', check: S => S.folderIn('Norsk', P_SK) },
          { text: 'Lag tre mapper til: <b>Matte</b>, <b>Engelsk</b> og <b>Naturfag</b>.', check: S => S.folderIn('Matte', P_SK) && S.folderIn('Engelsk', P_SK) && S.folderIn('Naturfag', P_SK) },
          { text: 'Åpne mappen <b>Norsk</b> og lag en mappe <i>inni</i> den som heter <b>Dikt</b>.', check: S => S.folderIn('Dikt', P_NORSK) },
          { text: 'Gå inn i mappen <b>Dikt</b>. Adressefeltet skal nå vise OneDrive › Skole › Norsk › Dikt.', check: S => S.ev('explorer-nav', d => d.name === 'Dikt') },
          { quiz: { q: 'Hvor ligger mappen Dikt?', options: ['Direkte i OneDrive', 'Inni Norsk, som ligger inni Skole i OneDrive', 'På skrivebordet'], answer: 1 } }
        ]
      },
      {
        id: 'k2o3', title: 'Gi nytt navn',
        setup: F => {
          const f = F.findByName('Dikt-analyse.docx', 'file'); if (f) F.silentRename(f.id, 'Dokument (3).docx');
          F.ensureFileAt(P_DOC, 'Dokument (3).docx', 'Analyse av diktet «Nordlys»\n\nDiktet handler om lyset som danser over himmelen om vinteren. Dikteren bruker mange bilder ...');
          const g = F.resolve([...P_DOC, '7. trinn']); if (g) F.silentRename(g.id, 'Gammelt');
          F.ensureFolder([...P_DOC, 'Gammelt']);
        },
        steps: [
          { text: 'Gå til <b>Dokumenter</b>. Der ligger en fil som heter «Dokument (3)». Det er et dårlig navn: du kan ikke se hva filen inneholder.', check: S => S.ev('explorer-nav', d => d.name === 'Dokumenter') },
          { text: 'Åpne filen (dobbeltklikk) for å se hva den inneholder. Lukk den etterpå.', check: S => S.ev('open-file', d => d.name === 'Dokument (3).docx') },
          { text: 'Gi filen nytt navn: klikk <i>én gang</i> på filen, trykk <kbd>F2</kbd> (eller høyreklikk → Gi nytt navn). Skriv <b>Dikt-analyse</b> og trykk <kbd>Enter</kbd>.', hint: 'F2 ligger øverst på tastaturet. Etterpå kan du bare skrive det nye navnet rett inn.', check: S => S.file('Dikt-analyse.docx') && !S.file('Dokument (3).docx') },
          { text: 'Gi mappen <b>Gammelt</b> nytt navn: <b>7. trinn</b>.', check: S => S.folderIn('7. trinn', P_DOC) },
          { quiz: { q: 'Hvilket filnavn er best?', options: ['asdfgh.docx', 'Dokument (3).docx', 'Norsk-diktanalyse-Nordlys.docx'], answer: 2 }, hint: 'Et godt navn forteller hva filen inneholder.' }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k3', title: 'Flytte, kopiere og slette', laerTitle: 'flytte, kopiere og slette',
    desc: 'Dra og slipp, klipp ut og lim inn, papirkurven og angre.',
    laer: `
      <h4>Flytte eller kopiere?</h4>
      <p><b>Flytte</b>: filen forsvinner fra der den var og havner i den nye mappen. <b>Kopiere</b>: du får to like filer.</p>
      <table><tr><th>Du vil</th><th>Slik gjør du</th></tr>
      <tr><td>Flytte</td><td>Dra filen til en mappe, <i>eller</i> Klipp ut (<kbd>Ctrl</kbd>+<kbd>X</kbd>) og Lim inn (<kbd>Ctrl</kbd>+<kbd>V</kbd>) i den nye mappen</td></tr>
      <tr><td>Kopiere</td><td>Kopier (<kbd>Ctrl</kbd>+<kbd>C</kbd>) og Lim inn (<kbd>Ctrl</kbd>+<kbd>V</kbd>)</td></tr>
      <tr><td>Slette</td><td>Velg filen og trykk <kbd>Delete</kbd>. Filen havner i <b>Papirkurven</b>.</td></tr>
      <tr><td>Angre</td><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> angrer det siste du gjorde</td></tr></table>
      <p>Filer i papirkurven kan <b>gjenopprettes</b>. Tømmer du papirkurven, er filene borte for alltid.</p>
      <p><b>Ctrl</b>-tasten ligger nederst til venstre på tastaturet. Hold den nede mens du trykker bokstaven.</p>`,
    oppdrag: [
      {
        id: 'k3o1', title: 'Dra og slipp',
        setup: F => { F.ensureFolder(P_NORSK); F.ensureFileAt(P_DOC, 'Dikt-analyse.docx', 'Analyse av diktet «Nordlys»\n\nDiktet handler om lyset som danser over himmelen om vinteren.'); },
        steps: [
          { laer: true, quiz: { q: 'Hva er forskjellen på å flytte og å kopiere en fil?', options: ['Flytte: filen finnes bare på det nye stedet. Kopiere: du får to like filer', 'Det er det samme', 'Kopiere sletter originalen'], answer: 0 } },
          { laer: true, quiz: { q: 'Hvilken snarvei limer inn?', options: ['Ctrl+C', 'Ctrl+X', 'Ctrl+V'], answer: 2 } },
          { laer: true, quiz: { q: 'Hva skjer når du tømmer papirkurven?', options: ['Filene flyttes til Dokumenter', 'Filene er borte for alltid', 'Ingenting'], answer: 1 } },
          { text: 'Åpne Filutforsker og gå til <b>Dokumenter</b>.', check: S => S.ev('explorer-nav', d => d.name === 'Dokumenter') },
          { text: 'Dra filen <b>Dikt-analyse</b> til mappen <b>Norsk</b>: hold venstre museknapp nede på filen, dra den til OneDrive › Skole › Norsk i menyen til venstre, og slipp.', hint: 'Klikk på ▸ ved OneDrive og Skole i menyen til venstre, så ser du Norsk der. Dra filen dit til mappen blir markert, og slipp.', check: S => S.fileInNamed('Dikt-analyse.docx', 'Norsk') },
          { text: 'Gå til mappen <b>Norsk</b> og sjekk at filen er der.', check: S => S.ev('explorer-nav', d => /norsk/i.test(d.name)) },
          { quiz: { q: 'Når du drar en fil til en annen mappe på samme PC, hva skjer?', options: ['Filen flyttes: den ligger bare i den nye mappen', 'Filen kopieres: du får to', 'Filen slettes'], answer: 0 } }
        ]
      },
      {
        id: 'k3o2', title: 'Klipp ut og lim inn',
        setup: F => { F.ensureFolder(P_NAT); F.ensureFileAt(P_DOC, 'Fotosyntese.pptx', 'Fotosyntese\nPlanter lager sukker av lys, vann og CO2.'); },
        steps: [
          { text: 'Gå til <b>Dokumenter</b> og klikk <i>én gang</i> på <b>Fotosyntese</b> for å velge den.', check: S => S.ev('select', d => d.names.includes('Fotosyntese.pptx')) },
          { text: 'Høyreklikk på filen og velg <b>Klipp ut</b> (eller trykk <kbd>Ctrl</kbd>+<kbd>X</kbd>). Filen blir litt gjennomsiktig.', check: S => S.ev('cut', d => d.names.includes('Fotosyntese.pptx')) },
          { text: 'Gå til <b>OneDrive › Skole › Naturfag</b>.', hint: 'Har du laget en egen Naturfag-mappe et annet sted, kan du bruke den.', check: S => S.ev('explorer-nav', d => /naturfag/i.test(d.name)) },
          { text: 'Høyreklikk på et tomt sted og velg <b>Lim inn</b> (eller trykk <kbd>Ctrl</kbd>+<kbd>V</kbd>).', check: S => S.fileInNamed('Fotosyntese.pptx', 'Naturfag') }
        ]
      },
      {
        id: 'k3o3', title: 'Kopier en fil',
        setup: F => { F.ensureFileAt(P_PIC, 'Klassebilde.jpg'); const c = F.resolve([...P_DESK, 'Klassebilde.jpg']); if (c) F.purge(c.id); },
        steps: [
          { text: 'Gå til <b>Bilder</b> og velg <b>Klassebilde</b>.', check: S => S.ev('select', d => d.names.includes('Klassebilde.jpg')) },
          { text: 'Kopier filen: trykk <kbd>Ctrl</kbd>+<kbd>C</kbd> (eller høyreklikk → Kopier).', check: S => S.ev('copy', d => d.names.includes('Klassebilde.jpg')) },
          { text: 'Gå til <b>Skrivebord</b> og lim inn med <kbd>Ctrl</kbd>+<kbd>V</kbd>.', check: S => S.fileIn('Klassebilde.jpg', P_DESK) },
          { text: 'Se på skrivebordet bak vinduet: kopien vises der! Gå tilbake til <b>Bilder</b> og sjekk at originalen fortsatt ligger der.', check: S => S.fileIn('Klassebilde.jpg', P_PIC) && S.ev('explorer-nav', d => d.name === 'Bilder') },
          { quiz: { q: 'Hva er forskjellen på Klipp ut og Kopier?', options: ['Klipp ut sletter filen for alltid', 'Det er det samme', 'Klipp ut flytter filen. Kopier lager en ekstra kopi.'], answer: 2 } }
        ]
      },
      {
        id: 'k3o4', title: 'Tastatursnarveier og angre',
        setup: F => { F.ensureFolder(P_MATTE); F.ensureFileAt(P_DOC, 'Matteprøve.pdf', 'Matteprøve kapittel 1'); },
        steps: [
          { text: 'Gå til <b>Dokumenter</b> og velg <b>Matteprøve</b>.', check: S => S.ev('select', d => d.names.includes('Matteprøve.pdf')) },
          { text: 'Trykk <kbd>Ctrl</kbd>+<kbd>X</kbd> på tastaturet (hold Ctrl nede og trykk X).', hint: 'Ctrl er nederst til venstre på tastaturet. Klikk på filen først, så vinduet «hører» på tastaturet.', check: S => S.ev('shortcut', d => d.key === 'x' && d.app === 'explorer') },
          { text: 'Gå til <b>OneDrive › Skole › Matte</b> og trykk <kbd>Ctrl</kbd>+<kbd>V</kbd>.', hint: 'Klikk på et tomt sted i mappen før du trykker Ctrl+V.', check: S => S.fileInNamed('Matteprøve.pdf', 'Matte') && S.ev('shortcut', d => d.key === 'v') },
          { text: 'Prøv å angre: trykk <kbd>Ctrl</kbd>+<kbd>Z</kbd>. Filen flytter tilbake til Dokumenter!', check: S => S.ev('shortcut', d => d.key === 'z') && S.fileIn('Matteprøve.pdf', P_DOC) },
          { text: 'Flytt den til <b>Matte</b> igjen (<kbd>Ctrl</kbd>+<kbd>X</kbd>, gå til Matte, <kbd>Ctrl</kbd>+<kbd>V</kbd>).', check: S => S.fileInNamed('Matteprøve.pdf', 'Matte') }
        ]
      },
      {
        id: 'k3o5', title: 'Slett og gjenopprett',
        setup: F => { F.ensureFileAt(P_DOC, 'gammel-liste.txt', 'melk\nbrød\nost\nepler'); },
        steps: [
          { text: 'Gå til <b>Dokumenter</b>, velg <b>gammel-liste</b> og trykk <kbd>Delete</kbd> (eller høyreklikk → Slett).', hint: 'Delete-tasten ligger over piltastene, eller øverst til høyre på små tastaturer.', check: S => S.inBin('gammel-liste.txt') },
          { text: 'Åpne <b>Papirkurven</b>: dobbeltklikk på ikonet på skrivebordet, eller klikk Papirkurv nederst i menyen til venstre.', check: S => S.ev('explorer-nav', d => d.name === 'Papirkurv') },
          { text: 'Velg filen og klikk <b>Gjenopprett</b> (eller høyreklikk → Gjenopprett). Filen går tilbake til Dokumenter.', check: S => S.fileIn('gammel-liste.txt', P_DOC) && S.ev('fs', d => d.op === 'restore') },
          { text: 'Slett filen igjen.', check: S => S.inBin('gammel-liste.txt') },
          { text: '<b>Tøm papirkurven</b> (knappen øverst i Papirkurv, eller høyreklikk på et tomt sted). Nå er filen borte for alltid.', check: S => S.gone('gammel-liste.txt') && S.ev('fs', d => d.op === 'empty-bin') },
          { quiz: { q: 'Du slettet feil fil ved et uhell. Hva gjør du?', options: ['Ingenting, den er borte for alltid', 'Åpner papirkurven og gjenoppretter filen', 'Lager filen på nytt'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k4', title: 'Lagre og åpne dokumenter', laerTitle: 'lagring, filnavn og filtyper',
    desc: 'Lagre, Lagre som, Ctrl+S, filtyper og filendelser.',
    laer: `
      <h4>Lagre og Lagre som</h4>
      <p>Første gang du lagrer et dokument, må du velge <b>hvor</b> det skal ligge og <b>hva</b> det skal hete. Det heter <b>Lagre som</b>. Etterpå lagrer <kbd>Ctrl</kbd>+<kbd>S</kbd> i den samme filen uten å spørre.</p>
      <p>Lagre alltid skolearbeid i <b>OneDrive › Skole › riktig fag</b>. En stjerne <b>*</b> i tittellinjen betyr at du har endringer som ikke er lagret.</p>
      <h4>Filtyper</h4>
      <p>Endelsen etter punktum forteller hva slags fil det er og hvilket program som åpner den. Windows skjuler endelsene som standard. Slå på <b>Vis filendelser</b> i Vis-menyen for å se dem.</p>
      <table><tr><th>Endelse</th><th>Type</th><th>Program</th></tr>
      <tr><td>.docx</td><td>Tekstdokument</td><td>Word</td></tr>
      <tr><td>.pptx</td><td>Presentasjon</td><td>PowerPoint</td></tr>
      <tr><td>.xlsx</td><td>Regneark</td><td>Excel</td></tr>
      <tr><td>.pdf</td><td>Ferdig dokument, ser likt ut overalt</td><td>Edge / PDF-leser</td></tr>
      <tr><td>.jpg / .png</td><td>Bilde</td><td>Bilder</td></tr>
      <tr><td>.mp4</td><td>Video</td><td>Filmer og TV</td></tr>
      <tr><td>.txt</td><td>Ren tekst</td><td>Notisblokk</td></tr>
      <tr><td>.zip</td><td>Pakket mappe med flere filer</td><td>Filutforsker (pakk ut)</td></tr></table>`,
    oppdrag: [
      {
        id: 'k4o1', title: 'Skriv og lagre et dokument',
        setup: F => { F.ensureFolder(P_NORSK); F.silentRemoveAll('Mitt første dokument.docx'); F.silentRemoveAll('Mitt første dokument.txt'); },
        steps: [
          { laer: true, quiz: { q: 'Hva er forskjellen på Lagre og Lagre som?', options: ['De er like', 'Lagre som lar deg velge sted og navn. Lagre lagrer i samme fil som før', 'Lagre som lager en snarvei'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva betyr en stjerne * i tittellinjen til et program?', options: ['Filen er stor', 'Filen er delt med andre', 'Det finnes endringer som ikke er lagret'], answer: 2 } },
          { laer: true, quiz: { q: 'Hvilken filtype hører til PowerPoint?', options: ['.docx', '.xlsx', '.pptx'], answer: 2 } },
          { text: 'Åpne programmet <b>Skriv</b> (oppgavelinjen eller Start-menyen).', check: S => S.ev('window-open', d => d.app === 'skriv') },
          { text: 'Skriv minst én setning om hva du liker å gjøre på fritiden.', check: S => S.editorText().trim().length >= 20 },
          { text: 'Klikk <b>Lagre</b> (eller trykk <kbd>Ctrl</kbd>+<kbd>S</kbd>). I vinduet som kommer opp: velg <b>OneDrive › Skole › Norsk</b> til venstre, skriv filnavnet <b>Mitt første dokument</b> og klikk Lagre.', hint: 'Klikk på ▸ ved OneDrive i menyen til venstre i vinduet, så Skole, så Norsk. Sjekk at adressefeltet øverst viser OneDrive › Skole › Norsk før du klikker Lagre.', check: S => S.fileInNamed('Mitt første dokument.docx', 'Norsk') },
          { text: 'Se på tittellinjen i Skriv: nå står filnavnet der. Skriv litt mer tekst.', check: S => S.ev('editor-input') },
          { text: 'Trykk <kbd>Ctrl</kbd>+<kbd>S</kbd> for å lagre endringene. Denne gangen spør ikke PC-en hvor, den lagrer i samme fil.', check: S => S.ev('save', d => d.via === 'shortcut' && !d.isNew) },
          { text: 'Lukk Skriv.', check: S => S.ev('window-close', d => d.app === 'skriv') }
        ]
      },
      {
        id: 'k4o2', title: 'Åpne dokumentet igjen',
        setup: F => { F.ensureFile(P_NORSK, 'Mitt første dokument.docx', 'På fritiden liker jeg å ...'); },
        steps: [
          { text: 'Åpne Filutforsker og gå til mappen <b>Norsk</b> (i OneDrive › Skole, eller der du lagret dokumentet).', check: S => S.ev('explorer-nav', d => /norsk/i.test(d.name)) },
          { text: 'Dobbeltklikk på <b>Mitt første dokument</b> for å åpne det i Skriv.', check: S => S.ev('open-file', d => d.name === 'Mitt første dokument.docx') },
          { text: 'Skriv en ny linje, og lagre med <kbd>Ctrl</kbd>+<kbd>S</kbd>.', check: S => S.ev('save', d => d.via === 'shortcut') },
          { text: 'Lukk Skriv. Legg merke til at den ikke spør om lagring, fordi alt allerede er lagret.', check: S => S.ev('window-close', d => d.app === 'skriv') }
        ]
      },
      {
        id: 'k4o3', title: 'Filtyper og filendelser',
        setup: F => { F.silentRemoveAll('Huskeliste.txt'); },
        steps: [
          { text: 'Åpne Filutforsker, klikk på <b>Vis</b>-menyen og slå på <b>Vis filendelser</b>. Nå ser du .docx, .pdf osv. bak filnavnene.', hint: 'Vis-knappen ligger helt til høyre i verktøylinjen øverst i Filutforsker.', check: S => S.ev('show-ext', d => d.on) },
          { text: 'Gå til <b>Dokumenter</b> og se på filendelsene til filene der.', check: S => S.ev('explorer-nav', d => d.name === 'Dokumenter') },
          { quiz: { q: 'En fil heter «Rapport.docx». Hvilket program åpner den?', options: ['Word', 'PowerPoint', 'Excel'], answer: 0 } },
          { quiz: { q: '«Fremføring.pptx» er ...', options: ['et regneark', 'en presentasjon (PowerPoint)', 'et bilde'], answer: 1 } },
          { quiz: { q: '«Budsjett.xlsx» åpnes i ...', options: ['Bilder', 'Word', 'Excel'], answer: 2 } },
          { quiz: { q: '«IMG_2031.jpg» er ...', options: ['et bilde', 'et videoklipp', 'et tekstdokument'], answer: 0 } },
          { quiz: { q: 'Hva er spesielt med en PDF-fil?', options: ['Den kan bare åpnes på iPad', 'Den er alltid et bilde', 'Den ser lik ut på alle enheter og kan vanligvis ikke redigeres'], answer: 2 } },
          { text: 'Høyreklikk på et tomt sted på <b>skrivebordet</b> og velg <b>Ny → Tekstdokument</b>. Kall det <b>Huskeliste</b>.', hint: 'Endelsen .txt kommer automatisk, du skriver bare «Huskeliste».', check: S => S.fileIn('Huskeliste.txt', P_DESK) },
          { text: 'Åpne <b>Huskeliste</b> (dobbeltklikk), skriv tre ting du må huske, og lagre med <kbd>Ctrl</kbd>+<kbd>S</kbd>.', check: S => S.content('Huskeliste.txt').trim().length > 5 && S.ev('save', d => d.name === 'Huskeliste.txt') }
        ]
      },
      {
        id: 'k4o4', title: 'Ulagrede endringer',
        setup: F => { F.silentRemoveAll('Notat.docx'); },
        steps: [
          { text: 'Åpne <b>Skriv</b> og skriv noen ord.', check: S => S.wins('skriv') > 0 && S.ev('editor-input') },
          { text: 'Prøv å lukke Skriv med <b>✕</b> uten å lagre. Skriv spør: «Vil du lagre endringene?» Velg <b>Lagre</b>.', check: S => S.ev('save-dialog', d => d.choice === 'save') },
          { text: 'Lagre filen i <b>Dokumenter</b> med navnet <b>Notat</b>.', check: S => S.fileIn('Notat.docx', P_DOC) },
          { quiz: { q: 'Tittellinjen viser «*Rapport.docx - Skriv». Hva betyr stjernen?', options: ['Filen er viktig', 'Det er endringer som ikke er lagret', 'Filen er skrivebeskyttet'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k5', title: 'Nedlastinger og internett', laerTitle: 'nedlastinger',
    desc: 'Hvor havner filer du laster ned, og hva gjør du med dem?',
    laer: `
      <h4>Mappen Nedlastinger</h4>
      <p>Når du laster ned noe fra internett, havner filen i mappen <b>Nedlastinger</b> (hvis du ikke velger noe annet). Nettleseren viser en liten melding oppe til høyre med knappene <b>Åpne fil</b> og <b>Vis i mappe</b>.</p>
      <p><b>Nedlastinger er ikke et lagringssted.</b> Flytt filer du skal bruke til riktig mappe i OneDrive, og slett resten. Da finner du dem igjen senere.</p>
      <p>Hvis du åpner en nedlastet fil og skriver i den, husk å <b>lagre som</b> i riktig mappe. Ellers ligger arbeidet ditt i Nedlastinger.</p>`,
    oppdrag: [
      {
        id: 'k5o1', title: 'Last ned og flytt',
        setup: F => { F.ensureFolder(P_MATTE); F.silentRemoveAll('Oppgaveark-brøk.pdf'); },
        steps: [
          { laer: true, quiz: { q: 'Hvor havner filer du laster ned fra internett, hvis du ikke velger noe annet?', options: ['I Papirkurven', 'I Nedlastinger', 'I OneDrive'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva gjør «Vis i mappe» i nedlastingsmeldingen?', options: ['Åpner Nedlastinger i Filutforsker med filen markert', 'Sletter filen', 'Laster ned filen på nytt'], answer: 0 } },
          { laer: true, quiz: { q: 'Du åpner en nedlastet mal og skriver i den. Hva bør du gjøre?', options: ['Trykke Lagre og la den ligge i Nedlastinger', 'Ingenting, det lagres automatisk', 'Lagre som i riktig mappe i OneDrive, så malen i Nedlastinger er urørt'], answer: 2 } },
          { text: 'Åpne <b>Nettleser</b> fra oppgavelinjen.', check: S => S.ev('window-open', d => d.app === 'nettleser') },
          { text: 'Klikk <b>Last ned</b> ved «Oppgaveark om brøk».', check: S => S.ev('download', d => d.base === 'Oppgaveark-brøk.pdf') },
          { text: 'Klikk <b>Vis i mappe</b> i nedlastingsmeldingen (eller åpne Nedlastinger i Filutforsker).', check: S => S.ev('explorer-nav', d => d.name === 'Nedlastinger') },
          { text: 'Flytt <b>Oppgaveark-brøk</b> til <b>OneDrive › Skole › Matte</b> (dra den, eller bruk <kbd>Ctrl</kbd>+<kbd>X</kbd> og <kbd>Ctrl</kbd>+<kbd>V</kbd>).', check: S => S.fileInNamed('Oppgaveark-brøk.pdf', 'Matte') }
        ]
      },
      {
        id: 'k5o2', title: 'Last ned en mal og lagre den riktig',
        setup: F => { F.ensureFolder(P_NAT); F.silentRemoveAll('Rapport-fotosyntese.docx'); F.silentRemoveAll('Mal-rapport.docx'); },
        steps: [
          { text: 'I Nettleser: last ned <b>Mal for rapport</b>.', check: S => S.ev('download', d => d.base === 'Mal-rapport.docx') },
          { text: 'Klikk <b>Åpne fil</b> i nedlastingsmeldingen. Malen åpnes i Skriv.', check: S => S.ev('open-file', d => d.name === 'Mal-rapport.docx') },
          { text: 'Skriv inn en tittel etter «Tittel:» i malen.', check: S => S.ev('editor-input') },
          { text: 'Velg <b>Lagre som</b> og lagre i <b>OneDrive › Skole › Naturfag</b> med navnet <b>Rapport-fotosyntese</b>. Nå har du en egen kopi, og malen i Nedlastinger er urørt.', hint: 'Bruk «Lagre som»-knappen, ikke «Lagre». Lagre ville skrevet over malen i Nedlastinger.', check: S => S.fileInNamed('Rapport-fotosyntese.docx', 'Naturfag') },
          { text: 'Slett <b>Mal-rapport</b> fra Nedlastinger. Du trenger den ikke lenger.', check: S => !S.file('Mal-rapport.docx') },
          { quiz: { q: 'Hvor havner filer du laster ned fra internett?', options: ['I mappen Nedlastinger', 'I OneDrive', 'På skrivebordet'], answer: 0 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k6', title: 'Levere inn arbeid', laerTitle: 'innlevering i Teams',
    desc: 'Legg ved en fil fra OneDrive og lever inn, slik det gjøres i Teams.',
    laer: `
      <h4>Slik leverer du i Teams</h4>
      <p>I Teams ligger oppgavene under <b>Oppgaver</b>. Du leverer ved å:</p>
      <ul><li>åpne oppgaven</li><li>klikke <b>Legg til arbeid</b> og velge filen din</li><li>klikke <b>Lever inn</b></li></ul>
      <p>Vinduet der du velger fil, ser ut som Filutforsker. Derfor må du <b>vite hvor filen ligger</b>! Sjekk at det står «Levert» etterpå.</p>
      <p>Programmet <b>Innleveringer</b> på øvings-PC-en fungerer på samme måte som Oppgaver i Teams.</p>`,
    oppdrag: [
      {
        id: 'k6o1', title: 'Lever inn dikt-analysen',
        setup: F => { F.ensureFileAt(P_NORSK, 'Dikt-analyse.docx', 'Analyse av diktet «Nordlys»'); Innlevering.reset('norsk-dikt'); },
        steps: [
          { laer: true, quiz: { q: 'I hvilken rekkefølge leverer du i Teams?', options: ['Lever inn → Legg til arbeid → åpne oppgaven', 'Åpne oppgaven → Legg til arbeid → velg filen → Lever inn', 'Velg filen → slett den → Lever inn'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva ligner vinduet der du velger filen på, og hva betyr det for deg?', options: ['Nettleseren, så du må ha internett', 'Papirkurven, så filen må være slettet', 'Filutforsker, så du må vite hvor filen ligger'], answer: 2 } },
          { text: 'Åpne <b>Innleveringer</b> fra oppgavelinjen.', check: S => S.ev('window-open', d => d.app === 'innlevering') },
          { text: 'Klikk på oppgaven <b>Norsk: Dikt-analyse</b>.', check: S => S.ev('assignment-open', d => d.id === 'norsk-dikt') },
          { text: 'Klikk <b>Legg til arbeid</b>. Finn filen <b>Dikt-analyse</b> i OneDrive › Skole › Norsk, velg den og klikk Åpne.', hint: 'Klikk på ▸ ved OneDrive til venstre i vinduet, så Skole, så Norsk. Klikk på filen og så på Åpne (eller dobbeltklikk filen).', check: S => S.ev('attach', d => d.assignment === 'norsk-dikt' && d.name === 'Dikt-analyse.docx') },
          { text: 'Klikk <b>Lever inn</b>.', check: S => S.ev('submit', d => d.assignment === 'norsk-dikt') }
        ]
      },
      {
        id: 'k6o2', title: 'Lever inn brøk-oppgavene',
        setup: F => { F.ensureFileAt(P_MATTE, 'Oppgaveark-brøk.pdf', 'Oppgaveark: Brøk'); Innlevering.reset('matte-brok'); },
        steps: [
          { text: 'Åpne oppgaven <b>Matte: Brøk-oppgaver</b> i Innleveringer.', check: S => S.ev('assignment-open', d => d.id === 'matte-brok') },
          { text: 'Legg til filen <b>Oppgaveark-brøk</b> fra OneDrive › Skole › Matte.', check: S => S.ev('attach', d => d.assignment === 'matte-brok' && d.name === 'Oppgaveark-brøk.pdf') },
          { text: 'Lever inn.', check: S => S.ev('submit', d => d.assignment === 'matte-brok') },
          { quiz: { q: 'Du finner ikke filen din i «Legg til arbeid»-vinduet. Hva er mest sannsynlig?', options: ['Teams er ødelagt', 'Filen ligger i en annen mappe. Sjekk Nedlastinger, Skrivebord eller Dokumenter.', 'Filen finnes ikke lenger'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k7', title: 'Rydd og finn', laerTitle: 'orden, søk og sortering',
    desc: 'Rydd opp i filene, søk etter filer og sorter.',
    laer: `
      <h4>God orden</h4>
      <p>Ha én mappe per fag i OneDrive › Skole, og gi filene navn som forteller hva de inneholder, for eksempel <b>Naturfag-labrapport-fotosyntese.docx</b>. Da finner du dem igjen, og læreren skjønner hva du leverer.</p>
      <h4>Søk</h4>
      <p>Skriv i <b>søkefeltet</b> øverst til høyre i Filutforsker. Det søker i mappen du står i og i alle undermappene. Kolonnen <b>Plassering</b> viser hvor filen ligger.</p>
      <h4>Sorter og vis</h4>
      <p><b>Detaljer</b>-visning viser dato, type og størrelse i kolonner. Klikk på en kolonne, eller bruk <b>Sorter</b>-menyen, for å sortere. Sorter etter <b>endringsdato</b> for å finne det du jobbet med sist.</p>`,
    oppdrag: [
      {
        id: 'k7o1', title: 'Rydd opp i Dokumenter',
        setup: F => {
          [P_NORSK, P_MATTE, P_ENG, P_NAT].forEach(p => F.ensureFolder(p));
          F.ensureFileAt(P_DOC, 'Engelsk-gloser-uke-3.docx', 'Gloser uke 3');
          F.ensureFileAt(P_DOC, 'Naturfag-labrapport.docx', 'Labrapport');
          F.ensureFileAt(P_DOC, 'Matte-oppgaver-kap2.pdf', 'Oppgaver kapittel 2');
          F.ensureFileAt(P_DOC, 'Norsk-fortelling.docx', 'Fortellingen om skogen');
        },
        steps: [
          { laer: true, quiz: { q: 'Hva er et godt filnavn for en naturfagrapport om fotosyntese?', options: ['Dokument (7).docx', 'rapport.docx', 'Naturfag-rapport-fotosyntese.docx'], answer: 2 } },
          { laer: true, quiz: { q: 'Hvor leter søkefeltet i Filutforsker?', options: ['I mappen du står i og alle undermappene', 'På hele internett', 'Bare på skrivebordet'], answer: 0 } },
          { laer: true, quiz: { q: 'Hvilken visning viser dato, type og størrelse i kolonner?', options: ['Store ikoner', 'Detaljer', 'Forhåndsvisning'], answer: 1 } },
          { text: 'Gå til <b>Dokumenter</b>. Der ligger fire filer som hører hjemme i fagmappene <b>OneDrive › Skole › Engelsk / Naturfag / Matte / Norsk</b>. Mappene finnes allerede.', check: S => S.ev('explorer-nav', d => d.name === 'Dokumenter') },
          { text: 'Flytt <b>Engelsk-gloser-uke-3</b> til mappen <b>Engelsk</b> i OneDrive › Skole.', hint: 'Dra filen til Engelsk i menyen til venstre (klikk på ▸ ved OneDrive og Skole først), eller bruk Ctrl+X og Ctrl+V. Har du laget en egen Engelsk-mappe et annet sted, godtas den også.', check: S => S.fileInNamed('Engelsk-gloser-uke-3.docx', 'Engelsk') },
          { text: 'Flytt <b>Naturfag-labrapport</b> til <b>Naturfag</b>.', check: S => S.fileInNamed('Naturfag-labrapport.docx', 'Naturfag') },
          { text: 'Flytt <b>Matte-oppgaver-kap2</b> til <b>Matte</b>.', check: S => S.fileInNamed('Matte-oppgaver-kap2.pdf', 'Matte') },
          { text: 'Flytt <b>Norsk-fortelling</b> til <b>Norsk</b>.', check: S => S.fileInNamed('Norsk-fortelling.docx', 'Norsk') }
        ]
      },
      {
        id: 'k7o2', title: 'Søk etter en fil',
        setup: F => { F.ensureFile([...P_DOC, '7. trinn', 'Prosjekter', 'Klassetur'], 'Klassetur-budsjett.xlsx', ''); },
        steps: [
          { text: 'Åpne Filutforsker og gå til <b>Dokumenter</b>.', check: S => S.ev('explorer-nav', d => d.name === 'Dokumenter') },
          { text: 'Et sted dypt inne i mappene ligger et budsjett. Skriv <b>budsjett</b> i <b>søkefeltet</b> øverst til høyre og trykk <kbd>Enter</kbd>.', check: S => S.ev('search', d => d.query.toLowerCase().includes('budsjett')) },
          { text: 'Se på kolonnen <b>Plassering</b>: den viser hvor filen ligger. Dobbeltklikk på <b>Klassetur-budsjett</b> for å åpne den.', check: S => S.ev('open-file', d => d.name === 'Klassetur-budsjett.xlsx') },
          { text: 'Lukk vinduet med regnearket.', check: S => S.ev('window-close', d => d.app === 'viewer') },
          { quiz: { q: 'Kolonnen «Plassering» i søkeresultatet viser ...', options: ['hvor stor filen er', 'hvem som laget filen', 'hvilken mappe filen ligger i'], answer: 2 } }
        ]
      },
      {
        id: 'k7o3', title: 'Sorter og vis detaljer',
        steps: [
          { text: 'Gå til <b>Dokumenter</b> i Filutforsker.', check: S => S.ev('explorer-nav', d => d.name === 'Dokumenter') },
          { text: 'Bytt til <b>Detaljer</b>-visning (Vis → Detaljer). Nå ser du kolonner med dato, type og størrelse.', check: S => S.ev('view', d => d.view === 'details') },
          { text: 'Sorter etter <b>Type</b> (Sorter → Type, eller klikk på kolonneoverskriften «Type»).', check: S => S.ev('sort', d => d.by === 'type') },
          { text: 'Sorter etter <b>Endringsdato</b>.', check: S => S.ev('sort', d => d.by === 'modified') },
          { text: 'Bytt tilbake til <b>Store ikoner</b> hvis du liker det bedre (Vis → Store ikoner), eller behold Detaljer. Klikk på <b>Bilder</b> for å gå videre.', check: S => S.ev('explorer-nav', d => d.name === 'Bilder') },
          { quiz: { q: 'Du vil finne filen du jobbet med sist. Hvordan sorterer du?', options: ['Etter navn', 'Etter endringsdato', 'Etter størrelse'], answer: 1 } }
        ]
      },
      {
        id: 'k7o4', title: 'Gode filnavn',
        setup: F => { F.ensureFolder(P_NORSK); const f = F.findAll(c => c.type === 'file' && (c.content || '').startsWith('Bokrapport:'))[0]; if (f) F.purge(f.id); F.ensureFileAt(P_DOC, 'Dokument1.docx', 'Bokrapport: «Sofies verden»\n\nBoken handler om Sofie som får mystiske brev med spørsmål om filosofi ...'); },
        steps: [
          { text: 'Gå til <b>Dokumenter</b> og åpne <b>Dokument1</b> for å se hva den inneholder.', check: S => S.ev('open-file', d => d.name === 'Dokument1.docx') },
          { text: 'Lukk Skriv, og gi filen et navn som forteller hva den inneholder, for eksempel <b>Norsk-bokrapport-Sofies-verden</b>.', hint: 'Klikk én gang på filen og trykk F2. Navnet må inneholde ordet «bok» eller «rapport» for å bli godkjent.', check: S => { const f = S.byContent('Bokrapport:'); return f && !/^dokument/i.test(f.name) && /bok|rapport/i.test(f.name); } },
          { text: 'Flytt filen til <b>OneDrive › Skole › Norsk</b>.', check: S => { const f = S.byContent('Bokrapport:'); const p = f && FS.get(f.parent); return !!p && /norsk/i.test(p.name); } },
          { quiz: { q: 'Hvilket filnavn er best for en engelsk-innlevering om London?', options: ['Dokument12.docx', 'ny.docx', 'Engelsk-London-tekst.docx'], answer: 2 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k8', title: 'Tastaturet', laerTitle: 'tastaturet og snarveier',
    desc: 'Viktige taster, @ på norsk tastatur og de vanligste snarveiene.',
    laer: `
      <h4>Viktige taster</h4>
      <table><tr><th>Tast</th><th>Hva den gjør</th></tr>
      <tr><td><kbd>Shift</kbd> ⇧</td><td>Stor bokstav, eller tegnet <i>øverst</i> på tasten (! " # osv.)</td></tr>
      <tr><td><kbd>Ctrl</kbd></td><td>Brukes sammen med andre taster til snarveier</td></tr>
      <tr><td><kbd>AltGr</kbd></td><td>Til høyre for mellomrom. Gir tegnet <i>nederst til høyre</i> på tasten: <b>@</b> = AltGr+2, <b>$</b> = AltGr+4, <b>{ }</b> = AltGr+7/0</td></tr>
      <tr><td><kbd>Tab</kbd> ⇥</td><td>Hopp til neste felt, eller lag innrykk</td></tr>
      <tr><td><kbd>Esc</kbd></td><td>Avbryt, lukk en meny</td></tr>
      <tr><td><kbd>Enter</kbd> ↵</td><td>Bekreft, eller ny linje</td></tr>
      <tr><td><kbd>Backspace</kbd> ⌫</td><td>Slett bakover</td></tr>
      <tr><td><kbd>Delete</kbd></td><td>Slett fremover, eller slett en valgt fil</td></tr>
      <tr><td><kbd>Caps Lock</kbd></td><td>STORE BOKSTAVER. Slå den av hvis alt blir stort!</td></tr>
      <tr><td><kbd>⊞</kbd> Windows</td><td>Åpner Start-menyen</td></tr></table>
      <h4>Snarveier du bør kunne</h4>
      <table><tr><td><kbd>Ctrl</kbd>+<kbd>C</kbd> kopier</td><td><kbd>Ctrl</kbd>+<kbd>V</kbd> lim inn</td><td><kbd>Ctrl</kbd>+<kbd>X</kbd> klipp ut</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> angre</td><td><kbd>Ctrl</kbd>+<kbd>S</kbd> lagre</td><td><kbd>Ctrl</kbd>+<kbd>A</kbd> marker alt</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>F</kbd> søk</td><td><kbd>Alt</kbd>+<kbd>Tab</kbd> bytt program</td><td><kbd>⊞</kbd>+<kbd>E</kbd> Filutforsker</td></tr>
      <tr><td><kbd>⊞</kbd>+<kbd>D</kbd> vis skrivebordet</td><td><kbd>⊞</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> skjermbilde</td><td><kbd>Ctrl</kbd>+<kbd>P</kbd> skriv ut</td></tr></table>
      <p>Noen snarveier (Alt+Tab, Windows-tasten) styres av den ekte PC-en og kan ikke øves her, men prøv dem gjerne!</p>`,
    oppdrag: [
      {
        id: 'k8o1', title: 'Skriv med tastaturet',
        setup: F => { F.ensureFolder(P_NORSK); F.silentRemoveAll('Tastatur-øving.docx'); },
        steps: [
          { laer: true, quiz: { q: 'Hvilken tast gir stor bokstav, eller tegnet øverst på en tast?', options: ['Shift', 'Ctrl', 'Tab'], answer: 0 } },
          { laer: true, quiz: { q: 'Hva gjør Caps Lock?', options: ['Sletter et tegn', 'Slår på STORE BOKSTAVER til du slår den av igjen', 'Lagrer dokumentet'], answer: 1 } },
          { laer: true, quiz: { q: 'Hva gjør Tab-tasten i et skjema?', options: ['Lager stor bokstav', 'Sletter feltet', 'Hopper til neste felt'], answer: 2 } },
          { text: 'Åpne <b>Skriv</b>.', check: S => S.ev('window-open', d => d.app === 'skriv') },
          { text: 'Skriv setningen: <b>Jeg lærer å bruke PC!</b> (med stor J, stor PC og utropstegn). <kbd>Shift</kbd> gir stor bokstav og tegnet øverst på tasten.', hint: 'Utropstegnet ligger på 1-tasten: hold Shift og trykk 1.', check: S => S.editorText().includes('Jeg lærer å bruke PC!') },
          { text: 'Trykk <kbd>Enter</kbd> for ny linje, og skriv en e-postadresse, for eksempel <b>test@skole.no</b>. Krøllalfa (@) skriver du med <kbd>AltGr</kbd>+<kbd>2</kbd>.', hint: 'AltGr er tasten til høyre for mellomromstasten. Hold den nede og trykk 2. (På noen tastaturer: Ctrl+Alt+2.)', check: S => S.editorText().includes('@') && S.editorText().includes('\n') },
          { text: 'Marker all tekst med <kbd>Ctrl</kbd>+<kbd>A</kbd>.', check: S => S.ev('shortcut', d => d.key === 'a' && d.app === 'skriv') },
          { text: 'Kopier med <kbd>Ctrl</kbd>+<kbd>C</kbd>, klikk nederst i teksten, og lim inn to ganger med <kbd>Ctrl</kbd>+<kbd>V</kbd>.', check: S => S.ev('shortcut', d => d.key === 'c' && d.app === 'skriv') && S.evCount('shortcut', d => d.key === 'v' && d.app === 'skriv') >= 2 },
          { text: 'Angre det siste med <kbd>Ctrl</kbd>+<kbd>Z</kbd>.', check: S => S.ev('shortcut', d => d.key === 'z' && d.app === 'skriv') },
          { text: 'Lagre som <b>Tastatur-øving</b> i <b>OneDrive › Skole › Norsk</b>.', check: S => S.fileInNamed('Tastatur-øving.docx', 'Norsk') },
          { text: 'Lukk Skriv.', check: S => S.ev('window-close', d => d.app === 'skriv') },
          { quiz: { q: 'Hvordan skriver du @ på et norsk tastatur?', options: ['Shift + 2', 'AltGr + 2', 'Ctrl + 2'], answer: 1 } },
          { quiz: { q: 'Hva gjør Ctrl+Z?', options: ['Angrer det siste du gjorde', 'Lagrer', 'Zoomer inn'], answer: 0 } },
          { quiz: { q: 'Hvilken snarvei lagrer dokumentet?', options: ['Ctrl + L', 'Ctrl + P', 'Ctrl + S'], answer: 2 } }
        ]
      }
    ]
  }
];
