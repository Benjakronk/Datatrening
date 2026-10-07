/* E-post: en forenklet Outlook med innboks, vedlegg, svar og ny melding.
   Vedlegg kan lagres til øvings-PC-en, og filer derfra kan legges ved. */
const Epost = (() => {
  const KEY = 'dt-mail';
  const ME = 'elev@skolen.no';
  const INBOX = [
    {
      id: 'm1', from: T('Kari Hansen (lærer)'), addr: 'kari.hansen@skolen.no', to: '8A', subject: T('Mal for bokrapport'),
      date: Date.now() - 3600000 * 5,
      body: T('Hei!\n\nHer er malen dere skal bruke til bokrapporten. Last den ned, skriv i den, og lever i Teams innen fredag.\n\nHusk å lagre din egen kopi i OneDrive før du begynner å skrive.\n\nVennlig hilsen\nKari'),
      attach: [{ name: T('Bokrapport-mal.docx'), content: T('BOKRAPPORT\n\nTittel:\nForfatter:\nHandling:\nHva jeg synes:') }]
    },
    {
      id: 'm2', from: T('Skolens administrasjon'), addr: 'post@skolen.no', to: T('Alle elever'), subject: T('Ukeplan uke 39'),
      date: Date.now() - 3600000 * 26,
      body: T('Ukeplanen for uke 39 ligger vedlagt.\n\nHusk gymtøy på tirsdag.'),
      attach: [{ name: T('Ukeplan-uke-39.pdf'), content: T('Ukeplan uke 39\n\nMandag: Norsk, Matte\nTirsdag: Gym, Naturfag\nOnsdag: Engelsk') }]
    },
    {
      id: 'm3', from: 'Jonas Berg', addr: 'jonas.berg@skolen.no', to: ME, subject: T('Gruppeoppgave i samfunnsfag'),
      date: Date.now() - 3600000 * 2,
      body: T('Hei!\n\nKan du sende meg delen din av gruppeoppgaven? Jeg setter alt sammen i kveld.\n\nJonas'),
      attach: []
    }
  ];
  let data = null, win = null;

  function load() {
    if (data) return data;
    try { const s = localStorage.getItem(KEY); if (s) { const d = JSON.parse(s); if (d && d.read) { data = d; return data; } } } catch (e) { /* ignorer */ }
    data = { read: {}, sent: [], savedAttach: [] }; save(); return data;
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* ignorer */ } }
  function unread() { load(); return INBOX.filter(m => !data.read[m.id]).length; }

  function open() {
    if (win) { WM.focus(win, 'open'); return win; }
    if (WM.full()) return null;
    load();
    let folder = 'inn', cur = null;
    const root = el(`<div class="mail">
      <div class="mail-side">
        <button class="mail-new">${T('✉ Ny melding')}</button>
        <div class="mail-folders"></div>
      </div>
      <div class="mail-list"></div>
      <div class="mail-read"></div>
    </div>`);
    win = WM.create({ app: 'epost', title: T('E-post') + ' – ' + ME, body: root, width: 1000, height: 620 });
    win.onClosed = () => { win = null; };
    root.querySelector('.mail-new').addEventListener('click', () => compose());

    function renderFolders() {
      const box = root.querySelector('.mail-folders'); box.innerHTML = '';
      [['inn', T('📥 Innboks'), unread()], ['sendt', T('📤 Sendt'), 0]].forEach(([id, label, n]) => {
        const r = el(`<div class="mf${folder === id ? ' active' : ''}"><span>${label}</span>${n ? `<span class="badge">${n}</span>` : ''}</div>`);
        r.addEventListener('click', () => { folder = id; cur = null; render(); Bus.emit('mail-folder', { folder: id }); });
        box.appendChild(r);
      });
    }
    function list() { return folder === 'inn' ? INBOX.slice().sort((a, b) => b.date - a.date) : data.sent.slice().reverse(); }
    function renderList() {
      const box = root.querySelector('.mail-list'); box.innerHTML = '';
      const items = list();
      if (!items.length) { box.appendChild(el(T('<div class="mail-empty">Ingen meldinger her.</div>'))); return; }
      items.forEach(m => {
        const isUnread = folder === 'inn' && !data.read[m.id];
        const r = el(`<div class="mail-item${cur && cur.id === m.id ? ' active' : ''}${isUnread ? ' unread' : ''}"><div class="mi-top"><span class="who">${esc(folder === 'inn' ? m.from : T('Til: {0}', m.to))}</span><span class="when">${esc(fmtDate(m.date).split(' ')[1] || '')}</span></div><div class="subj">${esc(m.subject || T('(uten emne)'))}</div><div class="prev">${esc((m.body || '').replace(/\n/g, ' ').slice(0, 60))}${(m.attach && m.attach.length) ? ' 📎' : ''}</div></div>`);
        r.addEventListener('click', () => { cur = m; if (folder === 'inn' && !data.read[m.id]) { data.read[m.id] = true; save(); } Bus.emit('mail-open', { subject: m.subject, from: m.from, attach: (m.attach || []).map(a => a.name) }); render(); });
        box.appendChild(r);
      });
    }
    function renderRead() {
      const box = root.querySelector('.mail-read'); box.innerHTML = '';
      if (!cur) { box.appendChild(el(T('<div class="mail-empty">Velg en melding i listen.</div>'))); return; }
      const head = el(`<div class="mr-head"><h2>${esc(cur.subject || T('(uten emne)'))}</h2><div class="muted">${esc(folder === 'inn' ? cur.from + ' <' + cur.addr + '>' : T('Til: {0}', cur.to))} · ${esc(fmtDate(cur.date))}</div></div>`);
      box.appendChild(head);
      if (cur.attach && cur.attach.length) {
        const ab = el(T('<div class="mr-attach"><b>📎 Vedlegg</b></div>'));
        cur.attach.forEach(a => {
          const r = el(`<div class="att"><span class="ico">${Icons.file(FS.ext(a.name), 24)}</span><span class="nm">${esc(a.name)}</span></div>`);
          const bSave = el(T('<button class="btn small">Lagre som …</button>'));
          bSave.addEventListener('click', () => saveAttach(a));
          const bOpen = el(T('<button class="btn small">Åpne</button>'));
          bOpen.addEventListener('click', () => openAttach(a));
          r.appendChild(bOpen); r.appendChild(bSave);
          ab.appendChild(r);
        });
        ab.appendChild(el(T('<div class="muted" style="margin-top:6px">Et vedlegg ligger i meldingen, ikke på PC-en din. Vil du beholde det, må du lagre det i en mappe.</div>')));
        box.appendChild(ab);
      }
      box.appendChild(el(`<div class="mr-body">${esc(cur.body)}</div>`));
      if (folder === 'inn') {
        const row = el('<div class="mr-actions"></div>');
        const b1 = el(T('<button class="btn primary">↩ Svar</button>')); b1.addEventListener('click', () => compose({ to: cur.addr, subject: T('SV: {0}', cur.subject), quote: cur, reply: true }));
        const b2 = el(T('<button class="btn">↩↩ Svar alle</button>')); b2.addEventListener('click', () => compose({ to: cur.addr + ', 8a@skolen.no', subject: T('SV: {0}', cur.subject), quote: cur, reply: true, all: true }));
        row.appendChild(b1); row.appendChild(b2);
        row.appendChild(el(T('<span class="muted" style="margin-left:8px">«Svar alle» går til alle som fikk meldingen. Bruk det bare når alle trenger svaret.</span>')));
        box.appendChild(row);
      }
    }
    async function saveAttach(a) {
      const ext = FS.ext(a.name);
      const r = await Dialog.fileChooser({ mode: 'save', title: T('Lagre vedlegg som'), name: FS.base(a.name), types: [{ label: Icons.typeName({ type: 'file', name: a.name }) + ' (*.' + ext + ')', ext }], start: FS.roots().documents });
      if (!r) return;
      let n = FS.children(r.folderId).find(c => c.name.toLowerCase() === r.name.toLowerCase());
      if (n) { const w = FS.write(n.id, a.content); if (w && w.error) { Toast.show(w.error); return; } }
      else { n = FS.createFile(r.folderId, r.name, a.content, { via: 'epost' }); if (n.error) { Toast.show(n.error); return; } }
      if (!data.savedAttach.includes(n.name)) data.savedAttach.push(n.name);
      save();
      Toast.show(T('Vedlegget ble lagret i {0}.', FS.get(r.folderId).name));
      Bus.emit('mail-save-attach', { name: n.name, folderId: r.folderId, folder: FS.get(r.folderId).name });
    }
    function openAttach(a) {
      const dl = FS.roots().downloads;
      let n = FS.children(dl).find(c => c.name.toLowerCase() === a.name.toLowerCase());
      if (!n) { n = FS.createFile(dl, FS.uniqueName(dl, a.name), a.content, { via: 'epost' }); if (n.error) { Toast.show(n.error); return; } }
      Bus.emit('mail-open-attach', { name: n.name });
      Toast.show(T('Vedlegget ble åpnet fra en midlertidig kopi i Nedlastinger. Skal du beholde det, bruk «Lagre som».'));
      Apps.openFile(n.id, { via: 'epost' });
    }
    async function compose(o = {}) {
      let attach = [];
      const body = el(`<div class="compose">
        <label>${T('Til:')}</label><input class="txt to" value="${esc(o.to || '')}" placeholder="navn@skolen.no">
        <label>${T('Emne:')}</label><input class="txt subj" value="${esc(o.subject || '')}" placeholder="${T('Hva handler meldingen om?')}">
        <label>${T('Melding:')}</label><textarea class="txt msg" rows="8" placeholder="${T('Skriv meldingen her')}">${esc(o.quote ? T('\n\n--- Opprinnelig melding fra {0} ---\n', o.quote.from) + o.quote.body : '')}</textarea>
        <label>${T('Vedlegg:')}</label><div class="att-box"><div class="att-list muted">${T('Ingen vedlegg')}</div><button class="btn small add-att" type="button">${T('📎 Legg ved fil …')}</button></div>
      </div>`);
      const renderAtt = () => {
        const l = body.querySelector('.att-list');
        if (!attach.length) { l.className = 'att-list muted'; l.textContent = T('Ingen vedlegg'); return; }
        l.className = 'att-list'; l.innerHTML = '';
        attach.forEach((a, i) => {
          const r = el(`<div class="att"><span class="ico">${Icons.file(FS.ext(a.name), 20)}</span><span class="nm">${esc(a.name)}</span><button class="btn small rm" type="button">${T('Fjern')}</button></div>`);
          r.querySelector('.rm').addEventListener('click', () => { attach.splice(i, 1); renderAtt(); });
          l.appendChild(r);
        });
      };
      body.querySelector('.add-att').addEventListener('click', async () => {
        const r = await Dialog.fileChooser({ mode: 'open', title: T('Legg ved fil'), types: [{ label: T('Alle filer (*.*)'), ext: '' }], start: FS.roots().onedrive });
        if (!r) return;
        if (attach.some(a => a.name === r.name)) { Toast.show(T('Filen er allerede lagt ved.')); return; }
        if (attach.length >= 5) { Toast.show(T('Maks fem vedlegg.')); return; }
        attach.push({ name: r.name, nodeId: r.nodeId });
        renderAtt();
        Bus.emit('mail-attach', { name: r.name });
      });
      renderAtt();
      Bus.emit('mail-compose', { reply: !!o.reply, all: !!o.all });
      const res = await Dialog.show({
        title: o.reply ? T('Svar') : T('Ny melding'), body,
        buttons: [{ label: T('Send'), value: 'send', primary: true }, { label: T('Avbryt'), value: null }],
        validate: () => {
          const to = body.querySelector('.to').value.trim();
          if (!to) { Toast.show(T('Skriv hvem meldingen skal til.')); return false; }
          if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}/i.test(to)) { Toast.show(T('E-postadressen må inneholde @ og et punktum, for eksempel navn@skolen.no')); return false; }
          return { to, subject: body.querySelector('.subj').value.trim(), body: body.querySelector('.msg').value };
        }
      });
      if (!res) return;
      const msg = { id: 's' + Date.now(), from: T('Meg'), addr: ME, to: res.to, subject: res.subject, body: res.body, date: Date.now(), attach: attach.map(a => ({ name: a.name, content: (FS.get(a.nodeId) || {}).content || '' })) };
      data.sent.push(msg); if (data.sent.length > 50) data.sent.shift();
      save();
      Toast.show(T('Meldingen ble sendt.'));
      Bus.emit('mail-send', { to: res.to, subject: res.subject, attach: msg.attach.map(a => a.name), reply: !!o.reply, all: !!o.all, body: res.body });
      folder = 'sendt'; cur = msg; render();
    }
    function render() { renderFolders(); renderList(); renderRead(); }
    win.render = () => { folder = 'inn'; cur = null; render(); };
    render();
    Bus.emit('mail-app-open', { unread: unread() });
    return win;
  }

  function state() {
    load();
    return {
      read: INBOX.filter(m => data.read[m.id]).map(m => m.subject),
      sent: data.sent.map(m => ({ to: m.to, subject: m.subject, body: m.body, attach: (m.attach || []).map(a => a.name) })),
      savedAttach: data.savedAttach.slice(),
      unread: unread()
    };
  }
  function reset() { data = { read: {}, sent: [], savedAttach: [] }; save(); if (win && win.render) win.render(); }
  return { open, state, reset, INBOX, ME };
})();
window.Epost = Epost;
