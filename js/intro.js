/* Introduksjonen: vises første gang eleven starter, etter at fullskjerm er satt i gang,
   og kan åpnes igjen når som helst fra Start-menyen. */
const Intro = (() => {
  const prog = () => window.DT_PAGE === 'prog';

  function pages(firstRun) {
    const navn = firstRun
      ? `<label for="intro-name">${T('Hva heter du?')}</label><input class="txt" id="intro-name" autofocus placeholder="${T('Fornavn og etternavn')}" maxlength="60"><div class="wiz-err"></div>${T('<p class="muted">Navnet brukes bare til å vise fremdriften din, og lagres på denne maskinen.</p>')}`
      : '';
    return [
      {
        title: prog() ? T('Velkommen til programmeringskurset') : T('Velkommen til Datatrening'),
        body: `
          <div class="wiz-hero">${prog() ? '⌨️' : '💻'}</div>
          ${prog()
            ? `${T('<p>Her lærer du å bruke <b>terminalen</b>, skrive kode i en <b>editor</b> og kjøre programmene dine, slik det gjøres på en ekte PC.</p>')}
               ${T('<p>Kurset bygger på grunnkurset om filer og mapper. Kan du ikke det ennå, ta det først.</p>')}`
            : T('<p>Her lærer du å bruke en PC slik vi gjør på skolen: <b>filer og mapper</b>, lagring, formatering, e-post, notater og innlevering.</p>')}
          ${T('<p>Alt skjer på en <b>øvings-PC</b> inne i nettleseren. Den ser ut som en vanlig Windows-PC, men den er en simulering.')}
          ${T('<b>Du kan ikke ødelegge noe.</b> Alt du gjør her, skjer bare her.</p>')}
          ${navn}`,
        validate: firstRun ? body => {
          const v = body.querySelector('#intro-name').value.trim();
          if (!v) { body.querySelector('.wiz-err').textContent = T('Skriv navnet ditt, så vet læreren hvem fremdriften tilhører.'); return false; }
          return true;
        } : null
      },
      {
        title: T('Slik lærer du'),
        body: `
          ${T('<p>Panelet til <b>høyre</b> viser ett oppdrag om gangen, delt opp i små steg.</p>')}
          <ul>
            ${T('<li>Stegene blir <b>grønne av seg selv</b> når du gjør dem riktig på øvings-PC-en. Du trenger ikke trykke «ferdig».</li>')}
            ${T('<li>Noen steg er <b>spørsmål</b>. Teorispørsmålene kommer først i hvert kurs, og svaret står i <b>«Les først»</b>-boksen øverst.</li>')}
            ${T('<li>Svarer du feil på et teorispørsmål, må du innom teksten før du kan prøve igjen. Det er med vilje.</li>')}
          </ul>
          ${T('<p>Når du har gjort alle oppdragene i et kurs, får du en <b>mesterprøve</b>. Der får du bare mål, ingen oppskrift og ingen hint.</p>')}`
      },
      {
        title: T('Hvis du står fast'),
        body: `
          <ul>
            ${T('<li>Klikk <b>«Vis hint»</b> på steget du står på. Hintet forteller deg hvor du skal se.</li>')}
            ${T('<li>Åpne <b>«Les først»</b> øverst i oppdraget. Der står teorien du trenger.</li>')}
            ${T('<li>Du kan alltid <b>starte oppdraget på nytt</b> med knappen nederst i panelet.</li>')}
            ${T('<li>Henger øvings-PC-en? Fanen <b>Fremdrift</b> har en knapp som tilbakestiller den uten å slette fremdriften din.</li>')}
          </ul>
          ${T('<p>Og så er det helt greit å spørre læreren. Si <b>hva du gjorde</b>, <b>hva som skjedde</b> og <b>hva som står på skjermen</b>, så er det lett å hjelpe deg.</p>')}`
      },
      {
        title: T('Kom i gang'),
        body: `
          <ul>
            ${T('<li>Programmene ligger nederst i <b>oppgavelinjen</b> og i <b>Start-menyen</b>.</li>')}
            ${T('<li><kbd>F11</kbd> slår fullskjerm av og på. <kbd>Esc</kbd> avslutter fullskjerm.</li>')}
            ${T('<li>Fanen <b>Kurs</b> viser alle kursene. Ta dem gjerne i rekkefølge.</li>')}
            ${T('<li>Når du har fullført et kurs, dukker <b>Ukens øving</b> opp. Den holder ferdighetene ved like.</li>')}
          </ul>
          ${T('<p class="wiz-tip">💡 Du finner denne introduksjonen igjen når som helst under <b>Start-menyen → Introduksjon</b>.</p>')}`
      }
    ];
  }

  /* Én introduksjon om gangen, selv om den blir bedt om flere ganger */
  let open = false;
  async function show(firstRun) {
    if (open) return null;
    open = true;
    const first = !!firstRun;
    Bus.emit('intro-open', { firstRun: first });
    try {
      const res = await Dialog.wizard({
        title: 'Datatrening',
        pages: pages(first),
        skippable: !first,
        escapable: !first,
        doneLabel: first ? T('Start første oppdrag') : T('Lukk'),
        collect: (body, values) => ({ name: (values['intro-name'] || '').trim() })
      });
      Bus.emit('intro-done', { firstRun: first });
      return res;
    } finally { open = false; }
  }

  /* Kalles ved oppstart, etter at fullskjerm er satt i gang */
  async function auto() {
    if (open || !Coach.needsName()) return false;
    const r = await show(true);
    if (!r) return false;
    Coach.setName((r && r.name) || T('Elev'));
    Coach.startFirst();
    return true;
  }
  return { show, auto, pages, isOpen: () => open };
})();
window.Intro = Intro;
