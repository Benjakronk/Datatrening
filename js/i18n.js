/* Språk. Øvings-PC-en er skrevet på norsk; den engelske utgaven (sidene i en/) setter
   window.DT_LANG = 'en' før dette skriptet og laster ordlisten js/en/strings.js, som fyller I18N.en.

   T('Norsk tekst') gir den engelske teksten når siden er engelsk, ellers teksten selv.
   Tekst med variabler skrives med plassholdere: T('Mappen «{0}» er full.', navn).
   Mangler en oversettelse, vises den norske teksten, så ingenting går i stykker. */
window.DT_LANG = window.DT_LANG || 'nb';
const I18N = { en: {} };
function T(s, ...args) {
  let r = s;
  if (window.DT_LANG !== 'nb') { const d = I18N[window.DT_LANG]; if (d && Object.prototype.hasOwnProperty.call(d, s)) r = d[s]; }
  if (args.length) r = String(r).replace(/\{(\d+)\}/g, (m, i) => (args[i] !== undefined ? args[i] : m));
  return r;
}
window.T = T;
window.I18N = I18N;

/* Den engelske utgaven har egne filer og egen fremdrift: et engelsk filsystem har andre mappenavn,
   og sjekkene i de engelske kursene leter etter engelske navn. Alle nøkler som begynner med «dt-»
   får derfor «dt-en-» foran seg på de engelske sidene. */
if (window.DT_LANG !== 'nb') {
  const pre = 'dt-' + window.DT_LANG + '-';
  const ns = k => (typeof k === 'string' && k.startsWith('dt-') && !k.startsWith(pre)) ? pre + k.slice(3) : k;
  ['getItem', 'setItem', 'removeItem'].forEach(m => {
    const orig = Storage.prototype[m];
    Storage.prototype[m] = function (k, ...rest) { return orig.call(this, ns(k), ...rest); };
  });
}

/* Adressen til den samme siden på det andre språket (norsk ↔ engelsk) */
function otherLangUrl() {
  const prog = window.DT_PAGE === 'prog';
  if (window.DT_LANG === 'en') return prog ? '../programmering.html' : '../index.html';
  return prog ? 'en/programming.html' : 'en/index.html';
}
window.otherLangUrl = otherLangUrl;
