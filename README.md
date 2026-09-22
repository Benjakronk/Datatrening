# Datatrening – lær å bruke PC

En webapplikasjon som lærer elever på ungdomstrinnet grunnleggende PC-bruk, med vekt på filhåndtering.
Alt foregår på en **simulert Windows-PC i nettleseren**: alle elever ser nøyaktig det samme, uavhengig av
hvilken OneNote-versjon de har, om Teams er installert, eller om de har PC hjemme.

Ingenting elevene gjør på øvings-PC-en påvirker den ekte maskinen. Filer, mapper og fremdrift lagres
kun i nettleserens `localStorage` på den enkelte maskinen.

## Kom i gang

Åpne `index.html` i Edge eller Chrome. Det trengs ingen installasjon, server eller innlogging.

Appen starter med et startbilde: ett klikk hvor som helst setter nettleseren i fullskjerm, slik at
øvings-PC-en fyller hele skjermen. (Nettlesere tillater ikke fullskjerm uten et klikk fra brukeren.)
Knappen nederst til høyre i oppgavelinjen, eller F11, slår fullskjerm av og på. Esc avslutter fullskjerm.

## Hvis Edge blokkerer siden (SmartScreen)

En side som viser et Windows-lignende skrivebord i fullskjerm ligner på det svindelsider gjør, og nye
adresser på gratis vertstjenester har lavt omdømme. Derfor er simuleringen tydelig merket («Øvings-PC ·
simulering» i oppgavelinjen, på startbildet og i sidetittelen), og den simulerte nettleseren bruker en
åpenbart fiktiv adresse uten hengelås. Blir siden likevel blokkert:

- Legg den på et domene skolen eller kommunen eier, med HTTPS.
- Rapporter feilklassifiseringen: klikk «Rapporter at dette nettstedet ikke inneholder trusler» på
  blokkeringssiden, eller send inn adressen på Microsofts side for innsending av nettadresser
  (søk etter «Microsoft report unsafe site»). Det tar vanligvis noen dager.
- Sjekk om blokkeringen kommer fra skolens eget filter i stedet: da står organisasjonens navn i meldingen,
  og IT-avdelingen må godkjenne adressen.

## Grenser og nødhjelp (mot elever som stresstester)

Øvings-PC-en har faste grenser, så en elev ikke kan låse siden ved å lage tusenvis av filer:
maks 200 elementer per mappe, 1500 filer og mapper totalt, 12 mappenivåer, 120 tegn i navn,
20 000 tegn per dokument og 12 åpne vinduer. Eleven får en vennlig melding når en grense nås.
Tastetrykk som gjentas når en tast holdes nede (for eksempel Ctrl+V) ignoreres, tegning av vinduer
samles per skjermbilde, og lagring i nettleseren skjer forsinket.

Hvis siden likevel skulle henge, eller lagret tilstand er ødelagt:

- Åpne `index.html?nullstill` (sletter filer og mapper, beholder fremdriften) eller
  `index.html?nullstill=alt` (sletter alt, inkludert fremdrift).
- Fanen **Fremdrift** i veilederpanelet har knappen «Tilbakestill øvings-PC-en».
- Ødelagt eller altfor stor lagret tilstand oppdages ved oppstart og tilbakestilles automatisk.
- Får siden feil under oppstart, vises en rød stripe øverst med en nullstill-knapp.

## Høyreklikkmenyer

Alle elementer på øvings-PC-en har sin egen høyreklikkmeny, slik som i Windows: skrivebordet,
ikonene på skrivebordet, filer, mapper, tomrommet i en mappe, mappetreet til venstre, papirkurven,
oppgavelinjen, programikonene i oppgavelinjen (fest/løsne), Start-knappen, tittellinjen på vinduer,
teksten i Skriv, nettsiden og nedlastingslenkene i Nettleser. Høyreklikk kan også gjøres med
tastaturet (menytasten eller Shift+F10) når en fil er valgt i Filutforsker.

Oppdrag 1.4 «Høyreklikk-jakten» lar elevene høyreklikke på åtte ulike elementer og øver spesielt på
tofinger-trykk på styreflaten. Hver gang en meny åpnes under dette oppdraget, viser appen en liten
melding om hva som ble høyreklikket.

For å dele med elever: legg mappen på et nettsted (GitHub Pages, SharePoint-side med statiske filer,
skolens webserver) eller del mappen via OneDrive/Teams og be elevene åpne `index.html`.

## Hva elevene øver på

Øvings-PC-en har skrivebord, oppgavelinje, Start-meny, vinduer, høyreklikkmenyer og disse programmene:

| Program | Brukes til |
|---|---|
| **Filutforsker** | Mapper, filer, dra og slipp, klipp ut/kopier/lim inn, gi nytt navn, slette, papirkurv, søk, sortering, filendelser |
| **Skriv** | Enkel tekstbehandler med Lagre / Lagre som, Ctrl+S, «Vil du lagre endringene?»-dialog |
| **Nettleser** | Simulert skoleportal der elevene laster ned filer som havner i Nedlastinger |
| **Innleveringer** | Teams-lignende oppgaveliste: «Legg til arbeid» → velg fil fra OneDrive → «Lever inn» |
| **Papirkurv / Innstillinger** | Gjenopprett, tøm, tilbakestill øvings-PC-en |

Veileder-panelet til høyre inneholder 8 kurs med til sammen 25 oppdrag. Hvert steg sjekkes automatisk
mot tilstanden på øvings-PC-en, så eleven får umiddelbar tilbakemelding. Kursene:

1. Bli kjent med PC-en (mus, vinduer, Start-meny, høyreklikk)
2. Filer og mapper (navigasjon, adressefelt, lage mapper, gi nytt navn)
3. Flytte, kopiere og slette (dra og slipp, Ctrl+X/C/V/Z, papirkurv)
4. Lagre og åpne dokumenter (Lagre som, Ctrl+S, filtyper og filendelser)
5. Nedlastinger og internett
6. Levere inn arbeid (Teams-flyten)
7. Rydd og finn (rydde i Dokumenter, søk, sortering, gode filnavn)
8. Tastaturet (Shift, AltGr for @, snarveier)

Fanen **Fremdrift** viser hva eleven har fullført, og knappen «Kopier rapport» lager en tekst
eleven kan sende til læreren.

## Tilpasse innholdet

Alt kursinnhold ligger i `js/oppdrag.js`. Et oppdrag ser slik ut:

```js
{
  id: 'k2o2', title: 'Lag mapper for fagene',
  setup: F => { F.ensureFolder(['OneDrive', 'Skole']); },   // valgfritt: sørger for at nødvendige filer finnes
  steps: [
    { text: 'Gå til <b>OneDrive › Skole</b>.', hint: '…', check: S => S.ev('explorer-nav', d => d.name === 'Skole') },
    { text: 'Lag en mappe som heter <b>Norsk</b>.', check: S => S.folderIn('Norsk', ['OneDrive', 'Skole']) },
    { quiz: { q: 'Hvor ligger mappen Dikt?', options: ['…', '…'], answer: 1 } }
  ]
}
```

`S` gir tilgang til tilstanden: `S.fileIn(navn, sti)`, `S.folderIn(navn, sti)`, `S.file(navn)`, `S.inBin(navn)`,
`S.gone(navn)`, `S.content(navn)`, `S.editorText()`, `S.wins(app)` og `S.ev(hendelse, filter)` som sjekker om en
hendelse har skjedd siden steget startet (for eksempel `window-open`, `explorer-nav`, `select`, `cut`, `copy`, `paste`,
`drop`, `shortcut`, `search`, `sort`, `view`, `show-ext`, `open-file`, `save`, `download`, `attach`, `submit`).

Startfilene på øvings-PC-en defineres i `seed()` i `js/fs.js`. Nedlastbare filer i den simulerte
skoleportalen ligger i `LINKS` i `js/apps.js`, og innleveringsoppgavene i `ASSIGN` samme sted.

## Filstruktur

```
index.html        – siden
css/style.css     – utseende (Windows 11-inspirert)
js/ui.js          – hendelsesbuss, kontekstmeny, dra og slipp, varsler, mappetre
js/icons.js       – SVG-ikoner
js/fs.js          – virtuelt filsystem (lagres i localStorage)
js/wm.js          – vinduer, oppgavelinje, Start-meny
js/dialogs.js     – dialoger, «Lagre som» / «Åpne», Egenskaper
js/explorer.js    – Filutforsker
js/apps.js        – Skriv, Nettleser, Innleveringer, filvisning, Innstillinger
js/oppdrag.js     – kurs og oppdrag
js/coach.js       – veileder-panelet og automatisk sjekking
js/main.js        – skrivebordet og oppstart
```

## Tips til undervisningen

- Kjør gjerne kurs 1–3 felles på storskjerm første gang, så elevene ser hva som skjer.
- Elevene bør bruke ekte mus eller styreflate og tastatur: appen er laget for PC, ikke for berøringsskjerm.
- Etter øvingene: la elevene gjøre det samme i ekte Filutforsker, OneDrive og Teams. Begrepene og knappene er de samme.
- «Innstillinger → Tilbakestill øvings-PC-en» gir en ren start uten å miste fremdriften.
