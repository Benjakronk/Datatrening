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

Rett etter fullskjerm kommer en **introduksjon** på fire korte sider: hva øvings-PC-en er, hvordan
veilederpanelet fungerer, hva eleven gjør når den står fast, og hvordan man kommer i gang. Første side
spør om navnet, og det eleven skriver beholdes selv om den blar frem og tilbake. Introduksjonen vises
bare første gang, men kan åpnes igjen når som helst fra **Start-menyen → Introduksjon**.

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
| **Skriv** | Tekstbehandler (Word-lite) med skrifttype, størrelse, fet/kursiv/understreket, farge, overskriftstiler, lister, justering, Lagre / Lagre som, Ctrl+S og «Vil du lagre endringene?»-dialog. Dokumenter (.docx) lagres med formateringen, .txt som ren tekst |
| **Nettleser** | Simulert skoleportal der elevene laster ned filer som havner i Nedlastinger |
| **Innleveringer** | Teams-lignende oppgaveliste: «Legg til arbeid» → velg fil fra OneDrive → «Lever inn» |
| **Notater** | En forenklet OneNote: notatblokk, inndeling og side, med søk, flytting av sider og automatisk lagring |
| **E-post** | Outlook-lignende innboks med vedlegg, «lagre som», svar og svar alle, og ny melding med vedlegg fra øvings-PC-en |
| **Skrivetrening** | Skriveøvelser som måler ord per minutt og treffsikkerhet, med hjemmerad-veiledning |
| **Papirkurv / Innstillinger** | Gjenopprett, tøm, tilbakestill øvings-PC-en |

I tillegg: utskrift til papir eller PDF fra Skriv, deling av filer i OneDrive med lenke (med simulert samskriving),
autolagring for filer i OneDrive mot manuell lagring lokalt, vindussnapping ved å dra et vindu mot skjermkanten,
og zoom med Ctrl og rullehjulet.

Veileder-panelet til høyre inneholder 12 kurs med til sammen 36 oppdrag. Hvert kurs starter med
to eller tre teorispørsmål som bare kan besvares ved å lese «Les først»-teksten (merket `laer: true`
i koden). «Les først»-boksen holdes åpen så lenge et teorispørsmål er aktivt. Svaralternativene vises i
tilfeldig rekkefølge. Svarer eleven feil på et teorispørsmål, låses spørsmålet: «Les først» åpnes, og eleven
må trykke på knappen nederst i teksten, som først blir aktiv etter en lesetid på 10 til 30 sekunder
(beregnet ut fra tekstlengden). Etter opplåsingen blandes alternativene på nytt. Vanlige spørsmål på slutten
av oppdragene låses ikke. Hvert steg sjekkes automatisk
mot tilstanden på øvings-PC-en, så eleven får umiddelbar tilbakemelding. Kursene:

1. Bli kjent med PC-en (mus, vinduer, Start-meny, høyreklikk)
2. Filer og mapper (navigasjon, adressefelt, lage mapper, gi nytt navn)
3. Flytte, kopiere og slette (dra og slipp, Ctrl+X/C/V/Z, papirkurv)
4. Lagre og åpne dokumenter (Lagre som, Ctrl+S, filtyper og filendelser)
5. Formatering av tekst (skrifttype, størrelse, fet/kursiv/understreket, farge, overskrifter, lister, justering)
6. Nedlastinger og internett
7. E-post og deling (vedlegg, svar og svar alle, lenke mot kopi, samskriving)
8. Levere inn arbeid (Teams-flyten)
9. Notater (OneNote: notatblokk, inndeling, side, søk)
10. Rydd og finn (rydde i Dokumenter, søk, sortering, gode filnavn)
11. Tastaturet (Shift, AltGr for @, snarveier og skrivetrening med måling)
12. Når noe ikke virker (finne tapte filer, papirkurv, angre, Oppgavebehandling)

## Mesterprøver, repetisjon og «gjør det på ekte»

Tre ting sikrer at ferdigheten sitter igjen, ikke bare at oppdraget ble huket av:

- **Mesterprøve** til slutt i hvert kurs. Eleven får bare *mål*, ingen steg og ingen hint, for eksempel
  «flytt denne filen dit den hører hjemme og lever den inn». Målene hukes av etter hvert, i den rekkefølgen
  eleven vil. Tid og antall forsøk lagres.
- **Ukens øving** trekker fem tilfeldige oppgaver fra kurs eleven har fullført, uten hint. Kortet i
  Kurs-fanen minner på det når det har gått en uke. Oppgavebanken ligger i `REPETISJON` i `js/oppdrag-mer.js`.
- **Gjør det på din egen PC**: en avkryssingsliste som dukker opp når kurset er ferdig, med de samme
  handlingene utført på den ekte maskinen.

Fanen **Fremdrift** viser hva eleven har fullført, og knappen «Kopier rapport til læreren» lager en tekst
med en rapportkode eleven kan sende til læreren.

## Klasseoversikt for læreren (laerer.html)

Åpne `laerer.html` og lim inn rapportene fra elevene, gjerne mange meldinger om gangen. Siden plukker ut
kodene selv og viser:

- en tabell over klassen med fullførte oppdrag, beståtte mesterprøver, tid brukt og hvor mye hjelp hver elev
  har trengt, sorterbar på alle kolonner
- hvor stor andel av klassen som er ferdig med hvert kurs
- **«Hva stopper flest?»**: oppdragene rangert etter feilsvar, hint, omstarter og steg som tar lang tid, med
  det tregeste steget sitert
- en seksjon per elev, og eksport til regneark (CSV)

Alt regnes ut lokalt i nettleseren. Ingenting sendes noe sted, og klassen lagres bare i lærerens egen nettleser.

## Programmeringskurset (programmering.html)

`programmering.html` er et eget kurssett for programmeringselever, på samme øvings-PC. Det forutsetter
grunnkurset og legger til to programmer:

- **Terminal**: en PowerShell-simulering med ekte kommandoer mot det virtuelle filsystemet:
  `pwd`, `cd`, `ls`, `mkdir`, `New-Item`, `Remove-Item`, `Move-Item`, `Copy-Item`, `Rename-Item`, `Get-Content`,
  `Set-Content`, `echo … > fil`, `tree`, `Get-Help`, `Get-Alias`, `code .`, `explorer .`, `python fil.py`,
  `.\skript.ps1`, Tab-fullføring, kommandohistorikk og Ctrl+C. Mappene har engelske navn slik ekte Windows
  viser dem i terminalen (Documents, Desktop …), og feilmeldingene er PowerShells egne.
- **Kode**: en VS Code-lignende editor med filtre, faner, linjenumre, syntaksfarger, Tab-innrykk,
  Ctrl+S og en ▶ Kjør-knapp som kjører filen i terminalen.
- **Python**: `js/pyth.js` er en liten Python 3-tolk skrevet i JavaScript, uten avhengigheter. Den kjører
  elevenes programmer med `print`, `input`, variabler, f-strenger, `if/elif/else`, `while`, `for`, `range`,
  lister, dict, funksjoner, `try/except`, `import random/math/time` og `open()` mot filene på øvings-PC-en.
  Feilmeldinger ser ut som ekte Python (traceback med linjenummer), `input()` venter på eleven i terminalen,
  og uendelige løkker må stoppes med Ctrl+C. PowerShell-skript med `Write-Host`, `Read-Host` og variabler
  kjøres også.

- **Firmaportalen**: en simulert Company Portal (Intune) med en katalog over skolens godkjente programmer.
  Installasjonen går gjennom «I kø», «Laster ned» og «Installerer» og tar tid, knappen forsvinner mens det
  står på, og ett av programmene feiler med en feilkode første gang og lykkes ved nytt forsøk.
  **Visual Studio Code er ikke installert på en ny øvings-PC.** Kode mangler da i Start-menyen og
  oppgavelinjen, og `code` i terminalen svarer at kommandoen ikke er gjenkjent, akkurat som på en ekte PC.
  Søk på «kode» gir ingen treff, fordi programmet heter det produsenten kaller det.

Kursene (8 kurs, 13 oppdrag) ligger i `js/oppdrag-prog.js`: terminalen, filer fra terminalen, stier,
installere programmer fra Firmaportalen, Kode-editoren, feilsøking, prosjektstruktur og PowerShell-skript. Fremdriften lagres separat fra grunnkurset,
og veilederpanelet lenker mellom de to sidene.

## Tilpasse innholdet

Alt kursinnhold ligger i `js/oppdrag.js`. Et oppdrag ser slik ut:

```js
{
  id: 'k2o2', title: 'Lag mapper for fagene',
  lukk: ['skriv'],                                          // valgfritt: lukker disse programmene når oppdraget starter
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

### Rydding mellom oppdrag

`lukk` bestemmer hvilke programmer som lukkes når oppdraget eller mesterprøven starter, slik at eleven ikke
begynner med et halvferdig dokument fra forrige leksjon. Bruk en liste med programnavn, eller `'alle'` for
å lukke alt. Lukkingen skjer uten å spørre om lagring, den skjer før steg-tellingen starter (så den kan ikke
fullføre et steg av seg selv), og eleven får en melding om hva som ble lukket.

Feltet er satt der det første steget er «Åpne \<program\>», og på mesterprøvene. Filutforsker lukkes bare i
kurs 1, siden de andre kursene bruker navigasjonshendelser som fungerer uansett om vinduet står åpent.

Startfilene på øvings-PC-en defineres i `seed()` i `js/fs.js`. Nedlastbare filer i den simulerte
skoleportalen ligger i `LINKS` i `js/apps.js`, og innleveringsoppgavene i `ASSIGN` samme sted.

## Filstruktur

```
index.html        – grunnkurset
programmering.html – programmeringskurset
laerer.html       – klasseoversikt for læreren
css/style.css     – utseende (Windows 11-inspirert)
js/ui.js          – hendelsesbuss, kontekstmeny, dra og slipp, varsler, mappetre
js/icons.js       – SVG-ikoner
js/fs.js          – virtuelt filsystem (lagres i localStorage)
js/wm.js          – vinduer, oppgavelinje, Start-meny
js/dialogs.js     – dialoger, «Lagre som» / «Åpne», Egenskaper
js/explorer.js    – Filutforsker
js/apps.js        – Nettleser, Innleveringer, filvisning, Innstillinger, Oppgavebehandling
js/skriv.js       – tekstbehandleren med formatering, utskrift og autolagring
js/notater.js     – Notater (OneNote)
js/epost.js       – E-post med vedlegg
js/skrivetrening.js – skriveøvelser med måling
js/oppdrag.js     – kurs 1 til 6 og 8, 10 og 11
js/oppdrag-mer.js – nye kurs, mesterprøver, gjør-det-på-ekte og repetisjonsbanken
js/intro.js       – introduksjonen som vises første gang og fra Start-menyen
js/coach.js       – veileder-panelet, mesterprøver, repetisjon og måling
js/main.js        – skrivebordet og oppstart
```

Programmeringssiden laster i tillegg `js/pyth.js` (Python-tolk), `js/terminal.js`, `js/kode.js` og
`js/oppdrag-prog.js`.

## Tips til undervisningen

- Kjør gjerne kurs 1–3 felles på storskjerm første gang, så elevene ser hva som skjer.
- Elevene bør bruke ekte mus eller styreflate og tastatur: appen er laget for PC, ikke for berøringsskjerm.
- Etter øvingene: la elevene gjøre det samme i ekte Filutforsker, OneDrive og Teams. Begrepene og knappene er de samme.
- «Innstillinger → Tilbakestill øvings-PC-en» gir en ren start uten å miste fremdriften.
