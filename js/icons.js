/* SVG-ikoner for filer, mapper og programmer */
const Icons = (() => {
  const fileMap = {
    docx: ['#2b579a', 'W'], doc: ['#2b579a', 'W'], pptx: ['#c43e1c', 'P'], xlsx: ['#217346', 'X'],
    pdf: ['#d93025', 'PDF'], txt: ['#6b7280', 'TXT'], mp4: ['#0f766e', 'MP4'], mp3: ['#7c3aed', 'MP3'],
    zip: ['#b45309', 'ZIP'], jpg: ['#0e7490', 'JPG'], jpeg: ['#0e7490', 'JPG'], png: ['#0e7490', 'PNG'], exe: ['#374151', 'EXE']
  };
  const typeNames = {
    docx: 'Microsoft Word-dokument', doc: 'Microsoft Word-dokument', pptx: 'Microsoft PowerPoint-presentasjon',
    xlsx: 'Microsoft Excel-regneark', pdf: 'PDF-dokument', txt: 'Tekstdokument', mp4: 'MP4-videofil', mp3: 'MP3-lydfil',
    zip: 'ZIP-komprimert mappe', jpg: 'JPG-bilde', jpeg: 'JPG-bilde', png: 'PNG-bilde', exe: 'Program'
  };
  const programs = {
    docx: 'Word', doc: 'Word', pptx: 'PowerPoint', xlsx: 'Excel', pdf: 'Microsoft Edge (PDF-leser)', txt: 'Notisblokk',
    mp4: 'Filmer og TV', mp3: 'Mediespiller', zip: 'Filutforsker (pakk ut først)', jpg: 'Bilder', jpeg: 'Bilder', png: 'Bilder'
  };

  const svg = (inner, size, vb = 48) => `<svg viewBox="0 0 ${vb} ${vb}" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

  function folder(size = 48) {
    return svg(`<path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#dda43a"/><path d="M4 17h40v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#ffd166"/><path d="M4 21h40v15a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#ffc94a"/>`, size);
  }
  function file(ext, size = 48) {
    const e = (ext || '').toLowerCase();
    const [c, l] = fileMap[e] || ['#6b7280', e ? e.toUpperCase().slice(0, 4) : ''];
    const isImg = ['jpg', 'jpeg', 'png'].includes(e);
    const band = isImg
      ? `<rect x="8" y="22" width="32" height="18" fill="#bfe3f5"/><path d="M8 40l10-11 7 7 5-5 10 9z" fill="#2e8b57"/><circle cx="33" cy="27" r="3" fill="#f4c542"/>`
      : `<rect x="8" y="26" width="32" height="13" fill="${c}"/><text x="24" y="36" text-anchor="middle" font-size="${l.length > 2 ? 8 : 10}" font-weight="700" fill="#fff" font-family="Segoe UI, Arial, sans-serif">${l}</text>`;
    return svg(`<path d="M10 3h20l10 10v30a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" fill="#fff" stroke="#b9bec7"/><path d="M30 3v10h10z" fill="#e2e5ea" stroke="#b9bec7"/>${band}`, size);
  }
  function node(n, size = 48) {
    return n.type === 'folder' ? folder(size) : file(FS.ext(n.name), size);
  }
  function typeName(n) {
    if (n.type === 'folder') return 'Filmappe';
    const e = FS.ext(n.name);
    return typeNames[e] || (e ? e.toUpperCase() + '-fil' : 'Fil');
  }
  function program(n) {
    const e = FS.ext(n.name);
    return programs[e] || 'et passende program';
  }

  const apps = {
    explorer: s => folder(s),
    skriv: s => svg(`<rect x="6" y="4" width="36" height="40" rx="5" fill="#2b579a"/><rect x="13" y="13" width="22" height="3" rx="1" fill="#fff"/><rect x="13" y="20" width="22" height="3" rx="1" fill="#fff"/><rect x="13" y="27" width="16" height="3" rx="1" fill="#fff"/><rect x="13" y="34" width="10" height="3" rx="1" fill="#fff"/>`, s),
    nettleser: s => svg(`<circle cx="24" cy="24" r="20" fill="#1a73e8"/><ellipse cx="24" cy="24" rx="8" ry="20" fill="none" stroke="#fff" stroke-width="2"/><path d="M4 24h40M7 14h34M7 34h34" stroke="#fff" stroke-width="2" fill="none"/><circle cx="24" cy="24" r="20" fill="none" stroke="#fff" stroke-width="2"/>`, s),
    innlevering: s => svg(`<rect x="4" y="4" width="40" height="40" rx="8" fill="#5b5fc7"/><rect x="12" y="13" width="6" height="6" rx="1" fill="#fff"/><rect x="21" y="14" width="15" height="4" rx="1" fill="#fff"/><rect x="12" y="23" width="6" height="6" rx="1" fill="#fff"/><rect x="21" y="24" width="15" height="4" rx="1" fill="#fff"/><path d="M13 36l3 3 5-6" stroke="#fff" stroke-width="2.5" fill="none"/><rect x="24" y="34" width="12" height="4" rx="1" fill="#fff"/>`, s),
    papirkurv: s => svg(`<path d="M12 14h24l-2 28H14z" fill="#8a9bb0"/><path d="M16 14h16l-1.5 26h-13z" fill="#a9b8ca"/><rect x="9" y="9" width="30" height="5" rx="2" fill="#6b7d94"/><rect x="19" y="5" width="10" height="4" rx="1" fill="#6b7d94"/><path d="M19 19v18M24 19v18M29 19v18" stroke="#6b7d94" stroke-width="2"/>`, s),
    pc: s => svg(`<rect x="4" y="8" width="40" height="26" rx="3" fill="#1f4e8c"/><rect x="7" y="11" width="34" height="20" fill="#6fb1ff"/><rect x="18" y="36" width="12" height="4" fill="#7a8794"/><rect x="12" y="40" width="24" height="3" rx="1" fill="#7a8794"/>`, s),
    bilder: s => svg(`<rect x="5" y="9" width="38" height="30" rx="3" fill="#fff" stroke="#b9bec7"/><rect x="8" y="12" width="32" height="24" fill="#bfe3f5"/><path d="M8 36l10-12 7 8 5-5 10 9z" fill="#2e8b57"/><circle cx="32" cy="18" r="3" fill="#f4c542"/>`, s),
    viewer: s => svg(`<rect x="8" y="4" width="32" height="40" rx="3" fill="#fff" stroke="#b9bec7"/><rect x="14" y="12" width="20" height="3" fill="#9aa4b2"/><rect x="14" y="19" width="20" height="3" fill="#9aa4b2"/><rect x="14" y="26" width="14" height="3" fill="#9aa4b2"/>`, s),
    taskmgr: s => svg(`<rect x="5" y="5" width="38" height="38" rx="4" fill="#fff" stroke="#6b7280" stroke-width="2"/><rect x="11" y="26" width="6" height="11" fill="#0a64c8"/><rect x="21" y="18" width="6" height="19" fill="#0a64c8"/><rect x="31" y="11" width="6" height="26" fill="#0a64c8"/>`, s),
    innstillinger: s => svg(`<circle cx="24" cy="24" r="18" fill="#6b7280"/><circle cx="24" cy="24" r="7" fill="#fff"/><g stroke="#fff" stroke-width="4"><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4"/></g>`, s),
    onedrive: s => svg(`<path d="M14 34a7 7 0 0 1-1-13.9A10 10 0 0 1 32 17a8 8 0 0 1 4 17z" fill="#0a64c8"/>`, s),
    start: s => svg(`<rect x="6" y="6" width="17" height="17" fill="#0a64c8"/><rect x="25" y="6" width="17" height="17" fill="#0a64c8"/><rect x="6" y="25" width="17" height="17" fill="#0a64c8"/><rect x="25" y="25" width="17" height="17" fill="#0a64c8"/>`, s),
    desktop: s => svg(`<rect x="4" y="8" width="40" height="26" rx="3" fill="#3b7dd8"/><rect x="18" y="36" width="12" height="4" fill="#7a8794"/><rect x="12" y="40" width="24" height="3" rx="1" fill="#7a8794"/>`, s),
    downloads: s => svg(`<path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#dda43a"/><path d="M4 17h40v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#ffd166"/><path d="M24 20v12M18 27l6 6 6-6" stroke="#1f4e8c" stroke-width="3" fill="none"/>`, s),
    documents: s => svg(`<path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#dda43a"/><path d="M4 17h40v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#ffd166"/><rect x="18" y="21" width="12" height="15" fill="#fff" stroke="#9aa4b2"/><path d="M21 26h6M21 30h6" stroke="#9aa4b2" stroke-width="1.5"/>`, s),
    pictures: s => svg(`<path d="M4 11a3 3 0 0 1 3-3h11l4 4h19a3 3 0 0 1 3 3v3H4z" fill="#dda43a"/><path d="M4 17h40v19a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3z" fill="#ffd166"/><rect x="16" y="22" width="16" height="13" fill="#bfe3f5" stroke="#9aa4b2"/><path d="M16 35l5-6 4 4 2-2 5 4z" fill="#2e8b57"/>`, s)
  };
  function app(name, size = 24) { return (apps[name] || apps.viewer)(size); }

  function navIcon(n) {
    const R = FS.roots();
    if (n.id === R.desktop) return app('desktop', 18);
    if (n.id === R.downloads) return app('downloads', 18);
    if (n.id === R.documents) return app('documents', 18);
    if (n.id === R.pictures) return app('pictures', 18);
    if (n.id === R.onedrive) return app('onedrive', 18);
    if (n.id === R.pc) return app('pc', 18);
    if (n.id === R.bin) return app('papirkurv', 18);
    return folder(18);
  }
  function bigIcon(n, size = 48) {
    const R = FS.roots();
    if (n.id === R.pc) return app('pc', size);
    if (n.id === R.bin) return app('papirkurv', size);
    if (n.id === R.onedrive) return app('onedrive', size);
    return node(n, size);
  }

  /* Små verktøylinje-ikoner */
  const tools = {
    cut: `<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="4.5" cy="12" r="2.2" fill="none" stroke="#333" stroke-width="1.4"/><circle cx="11.5" cy="12" r="2.2" fill="none" stroke="#333" stroke-width="1.4"/><path d="M6 10.5L12 2M10 10.5L4 2" stroke="#333" stroke-width="1.4" fill="none"/></svg>`,
    copy: `<svg viewBox="0 0 16 16" width="16" height="16"><rect x="5" y="5" width="9" height="10" rx="1.5" fill="none" stroke="#333" stroke-width="1.4"/><path d="M3 11V3a1.5 1.5 0 0 1 1.5-1.5H11" fill="none" stroke="#333" stroke-width="1.4"/></svg>`,
    paste: `<svg viewBox="0 0 16 16" width="16" height="16"><rect x="3" y="3" width="10" height="12" rx="1.5" fill="none" stroke="#333" stroke-width="1.4"/><rect x="6" y="1.5" width="4" height="3" rx="1" fill="#333"/><path d="M5.5 8h5M5.5 11h5" stroke="#333" stroke-width="1.2"/></svg>`,
    rename: `<svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 12.5V14h1.5L12 5.5 10.5 4z" fill="none" stroke="#333" stroke-width="1.3"/><path d="M9.5 5l1.5 1.5" stroke="#333" stroke-width="1.3"/><path d="M2 3h6" stroke="#333" stroke-width="1.2"/></svg>`,
    del: `<svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 4h10M6 4V2.5h4V4M4.5 4l.8 10h5.4l.8-10" fill="none" stroke="#333" stroke-width="1.3"/></svg>`,
    newf: `<svg viewBox="0 0 16 16" width="16" height="16"><path d="M8 3v10M3 8h10" stroke="#333" stroke-width="1.8"/></svg>`,
    sort: `<svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 4h10M3 8h7M3 12h4" stroke="#333" stroke-width="1.5"/></svg>`,
    view: `<svg viewBox="0 0 16 16" width="16" height="16"><rect x="2" y="2" width="5" height="5" fill="#333"/><rect x="9" y="2" width="5" height="5" fill="#333"/><rect x="2" y="9" width="5" height="5" fill="#333"/><rect x="9" y="9" width="5" height="5" fill="#333"/></svg>`,
    restore: `<svg viewBox="0 0 16 16" width="16" height="16"><path d="M4 8a4 4 0 1 1 1.2 2.9" fill="none" stroke="#333" stroke-width="1.4"/><path d="M4 4v4h4" fill="none" stroke="#333" stroke-width="1.4"/></svg>`,
    props: `<svg viewBox="0 0 16 16" width="16" height="16"><circle cx="8" cy="8" r="6" fill="none" stroke="#333" stroke-width="1.3"/><path d="M8 7v4M8 5v.5" stroke="#333" stroke-width="1.5"/></svg>`,
    open: `<svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 3h5l1.5 1.5H13v8H3z" fill="none" stroke="#333" stroke-width="1.3"/></svg>`
  };

  return { folder, file, node, typeName, program, app, navIcon, bigIcon, tools, fileMap };
})();
