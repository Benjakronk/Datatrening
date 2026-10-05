/* Kjører veiledertesten mot begge kurssettene i Edge uten vindu.
   Bruk:  node tests/kjor.js
   Lager midlertidige filer i prosjektmappen og rydder dem bort etterpå. */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/microsoft-edge', '/usr/bin/google-chrome'
].find(p => fs.existsSync(p));
if (!EDGE) { console.error('Fant ikke Edge eller Chrome. Rediger stien øverst i tests/kjor.js.'); process.exit(1); }

const HEAD = '<script>'
  + 'localStorage.clear();'
  + 'localStorage.setItem("dt-progress",JSON.stringify({name:"Testelev"}));'
  + 'localStorage.setItem("dt-progress-prog",JSON.stringify({name:"Testelev"}));'
  + 'window.__noFullscreenOverlay=true;window.__log=[];'
  + 'window.onerror=(m,s,l)=>window.__log.push("ERROR: "+m+" @"+String(s).split("/").pop()+":"+l);'
  + 'window.addEventListener("unhandledrejection",e=>window.__log.push("REJECTION: "+(e.reason&&e.reason.stack||e.reason)));'
  + '</script>';

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dt-test-'));
const made = [];
let failed = 0;

for (const [navn, side] of [['grunnkurset', 'index.html'], ['programmering', 'programmering.html']]) {
  const src = fs.readFileSync(path.join(ROOT, side), 'utf8');
  const harness = '_test-' + navn + '.html';
  fs.writeFileSync(path.join(ROOT, harness),
    src.replace('<head>', '<head>' + HEAD)
       .replace('</body>', '<pre id="testlog"></pre><script src="tests/coachtest.js"></script></body>'));
  made.push(harness);

  const dom = execFileSync(EDGE, [
    '--headless=new', '--disable-gpu', '--no-first-run',
    '--user-data-dir=' + path.join(tmp, navn),
    '--window-size=1500,900', '--virtual-time-budget=120000',
    '--dump-dom', 'file:///' + path.join(ROOT, harness).replace(/\\/g, '/')
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });

  const m = dom.match(/<pre id="testlog">([\s\S]*?)<\/pre>/);
  const logg = m ? m[1].replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'") : '';
  const linjer = logg.split(/(?=PASS |FAIL |EXCEPTION|INFO |ERROR|REJECTION)/).map(x => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const feil = linjer.filter(x => /^(FAIL|EXCEPTION|ERROR|REJECTION)/.test(x));
  failed += feil.length;
  console.log(`\n${navn}: ${linjer.filter(x => x.startsWith('PASS')).length} ok, ${feil.length} feil` + (/TESTDONE/.test(dom) ? '' : '  (testen ble ikke ferdig)'));
  linjer.filter(x => !x.startsWith('PASS')).forEach(x => console.log('   ' + x.slice(0, 200)));
}

made.forEach(f => { try { fs.unlinkSync(path.join(ROOT, f)); } catch (e) { /* ignorer */ } });
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (e) { /* ignorer */ }
console.log(failed ? '\nNoe feilet.' : '\nAlt gikk bra.');
process.exit(failed ? 1 : 0);
