/* The Advanced courses in the basic course: many files at once, two windows, PDF and ZIP,
   sources and source criticism, staying safe online, and a whole project from start to hand-in.
   This file comes after oppdrag-mer.js (it uses M, addMaster and REPETISJON from there).
   Everything is inside a function, so the helper names don't clash with the other course files. */
(function () {
  const DEL = 'Advanced';
  const DEL_DESC = 'For those who know the basics: faster work, safety, and a whole project.';
  const P_MOB = ['This PC', 'Documents', 'From phone'];
  const P_SKJERM = ['This PC', 'Documents', 'Screenshots'];
  const P_ROT = ['This PC', 'Documents', 'Messy'];
  const P_SAMF = ['OneDrive', 'School', 'Social studies'];
  const IMG = n => 'IMG_' + (2000 + n) + '.jpg';
  const SHOT = n => 'Screenshot (' + n + ').png';
  const low = s => (s || '').toLowerCase();
  const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();

  /* The names of what is selected in File Explorer right now (all windows) */
  const selNow = () => Explorer.views.flatMap(v => [...v.sel].map(id => FS.get(id)).filter(Boolean).map(n => n.name));
  /* The file is (however deep) inside a folder with this name */
  const under = (file, folder) => FS.findAll(c => c.type === 'file' && low(c.name) === low(file)).some(f => FS.path(f.id).some(p => p.type === 'folder' && low(p.name) === low(folder)));
  const removeFolderNamed = name => FS.findAll(c => c.type === 'folder' && low(c.name) === low(name), { includeBin: true }).map(c => c.name).forEach(n => FS.silentRemoveAll(n));
  /* The text contains a quote (at least 25 characters) from the article */
  const hasQuote = text => {
    const t = norm(text);
    return Nettleser.ARTICLE.paras.some(p => { const n = norm(p); for (let i = 0; i + 25 <= n.length; i += 4) if (t.includes(n.slice(i, i + 25))) return true; return false; });
  };
  const quoteMarks = text => /[«»"“”]/.test(text || '');
  const hasUrl = text => low(text).includes(low(Nettleser.ARTICLE.url).split('/')[1] || 'science-encyclopedia');
  const mailSt = () => (window.Epost ? Epost.state() : { reported: [] });
  const PHISH = ['m4', 'm6', 'm7'];
  const MATHS3 = ['Maths-week41.pdf', 'Maths-week42.pdf', 'Maths-week43.pdf'];

  /* ============================================================
     V1: Many files at once
     ============================================================ */
  const V1 = {
    id: 'v1', title: 'Many files at once', laerTitle: 'selecting several files', del: DEL, delDesc: DEL_DESC,
    desc: 'Ctrl+click, Shift+click, Ctrl+A and drag-select: move, copy and delete lots of files at once.',
    laer: `
      <h4>Select several files, and do the job once</h4>
      <p>Everything you do with selected files applies to <b>all</b> of them. If you select ten files and drag one of them, all ten come along. The same goes for Ctrl+X, Ctrl+C and Delete.</p>
      <table><tr><th>How</th><th>What it does</th></tr>
      <tr><td><kbd>Ctrl</kbd> + click</td><td>Adds (or removes) one file at a time. The files don't have to be next to each other.</td></tr>
      <tr><td><kbd>Shift</kbd> + click</td><td>Selects everything <b>between</b> the first file you clicked and the one you click now.</td></tr>
      <tr><td><kbd>Ctrl</kbd> + <kbd>A</kbd></td><td>Selects everything in the folder.</td></tr>
      <tr><td>Drag-select</td><td>Hold the left mouse button down on an <b>empty spot</b> in the folder and drag a rectangle around the files. If you start on a file, you move the file instead.</td></tr></table>
      <p>At the bottom of File Explorer it says how many are selected, for example <b>“7 items selected”</b>. Look there before you press Delete.</p>
      <p>Shift+click works best when the files are <b>sorted</b>, for example by name or date.</p>`,
    oppdrag: [
      {
        id: 'v1o1', title: 'Ctrl, Shift and Ctrl+A',
        setup: F => {
          for (let i = 1; i <= 8; i++) FS.silentRemoveAll(IMG(i));
          MATHS3.forEach(n => FS.silentRemoveAll(n));
          F.ensureFolder(P_MOB); F.ensureFolder(P_MATTE);
          for (let i = 1; i <= 8; i++) F.ensureFileAt(P_MOB, IMG(i), '');
          MATHS3.forEach(n => F.ensureFileAt(P_MOB, n, 'Weekly maths exercises'));
        },
        steps: [
          { laer: true, quiz: { q: 'You want to select three files that are spread around the folder. What do you use?', options: ['Ctrl + click on each of them', 'Shift + click', 'Double-click'], answer: 0 } },
          { laer: true, quiz: { q: 'You click the first file and Shift + click the fifth. What is selected?', options: ['Only the first and the fifth', 'All five, from the first to the fifth', 'Nothing'], answer: 1 } },
          { laer: true, quiz: { q: 'Seven files are selected, and you press Delete. What happens?', options: ['Only the last one is deleted', 'All seven go to the Recycle Bin', 'Nothing'], answer: 1 } },
          { text: 'Open File Explorer and go to <b>Documents › From phone</b>. There are photos and some maths sheets mixed together.', check: S => S.ev('explorer-nav', d => /from phone/i.test(d.name)) || exAt('From phone') },
          { text: 'Click <b>IMG_2001</b>. Hold <kbd>Shift</kbd> down and click <b>IMG_2004</b>. Now four photos are selected.', hint: 'Are the files in a different order? Sort by name first (Sort → Name). Click the first one normally, and Shift + click the last one.', check: S => S.ev('select', d => d.how === 'shift' && d.names.filter(n => /^img_200/i.test(n)).length >= 3) },
          { text: 'Click <b>Maths-week41</b> normally. Hold <kbd>Ctrl</kbd> down and click <b>Maths-week42</b> and <b>Maths-week43</b>. Now only the three maths files are selected.', hint: 'Ctrl adds one file at a time. Did something wrong get selected? Ctrl + click it again, and it drops out of the selection.', check: S => S.ev('select', d => d.how === 'ctrl' && d.names.length === 3 && d.names.every(n => /^maths-week4[123]\.pdf$/i.test(n))) },
          { text: 'Move all three at once to <b>OneDrive › School › Maths</b>: drag one of them (the others come along), or use <kbd>Ctrl</kbd>+<kbd>X</kbd> and <kbd>Ctrl</kbd>+<kbd>V</kbd>.', check: S => MATHS3.every(n => S.fileInNamed(n, 'Maths')) },
          { text: 'Go back to <b>From phone</b>. Select all the photos with <kbd>Ctrl</kbd>+<kbd>A</kbd>.', hint: 'Click an empty spot in the folder first, so the key press goes to File Explorer.', check: S => S.ev('select', d => d.how === 'all' && d.names.filter(n => /^img_200/i.test(n)).length >= 8) },
          { text: 'Hold <kbd>Ctrl</kbd> and click <b>IMG_2008</b> to take it out of the selection. The status bar at the bottom now says <b>7 items selected</b>.', check: S => S.ev('select', d => d.how === 'ctrl' && d.names.length === 7 && !d.names.some(n => /^img_2008/i.test(n))) },
          { text: '<b>Copy</b> the seven photos to <b>Pictures</b> (<kbd>Ctrl</kbd>+<kbd>C</kbd>, go to Pictures, <kbd>Ctrl</kbd>+<kbd>V</kbd>).', hint: 'Lost the selection? Do Ctrl+A and Ctrl + click IMG_2008 again.', check: S => [1, 2, 3, 4, 5, 6, 7].every(i => S.fileIn(IMG(i), P_PIC)) },
          { quiz: { q: 'Why is it a good idea to look at the status bar (“7 items selected”) before you press Delete?', options: ['It shows how many files will be deleted', 'It shows how much power the PC is using', 'It isn\'t a good idea'], answer: 0 } }
        ]
      },
      {
        id: 'v1o2', title: 'Drag-select',
        setup: F => {
          for (let i = 1; i <= 6; i++) FS.silentRemoveAll(SHOT(i));
          FS.silentRemoveAll('Important-note.txt');
          F.ensureFolder(P_SKJERM);
          for (let i = 1; i <= 6; i++) F.ensureFileAt(P_SKJERM, SHOT(i), '');
          F.ensureFileAt(P_SKJERM, 'Important-note.txt', 'Remember: don\'t delete me!');
        },
        steps: [
          { text: 'Go to <b>Documents › Screenshots</b>.', check: S => S.ev('explorer-nav', d => /screenshots/i.test(d.name)) || exAt('Screenshots') },
          { text: 'Hold the left mouse button down on an <b>empty spot</b> in the folder (not on a file), and drag a rectangle around the screenshots. Let go.', hint: 'Start below or to the right of the files, where it is white. If you start on top of a file, you move the file instead. Make the window bigger if there isn\'t much room.', check: S => S.ev('select', d => d.how === 'band' && d.names.filter(n => /^screenshot/i.test(n)).length >= 2) },
          { text: 'Make sure <b>all six</b> screenshots are selected, but not <b>Important-note</b>. If the note came along, take it out with <kbd>Ctrl</kbd> + click.', hint: 'Look at the status bar at the bottom: it should say “6 items selected”. You can also drag a new rectangle.', check: S => { const s = selNow(); return s.filter(n => /^screenshot/i.test(n)).length === 6 && !s.some(n => /important/i.test(n)); } },
          { text: 'Press <kbd>Delete</kbd>. All six go to the Recycle Bin at once.', check: S => [1, 2, 3, 4, 5, 6].every(i => S.inBin(SHOT(i))) && !!S.file('Important-note.txt') },
          { text: 'Oops, you needed them after all. Open the <b>Recycle Bin</b>, select all the screenshots (drag-select or <kbd>Ctrl</kbd>+<kbd>A</kbd>) and choose <b>Restore</b>.', hint: 'Right-click one of the selected files and choose Restore. Everything selected comes along.', check: S => [1, 2, 3, 4, 5, 6].every(i => S.fileIn(SHOT(i), P_SKJERM)) },
          { quiz: { q: 'Where do you have to start when you drag a rectangle around files?', options: ['On top of the first file', 'On an empty spot in the folder', 'In the address bar'], answer: 1 } }
        ]
      }
    ]
  };

  /* ============================================================
     V2: Two windows side by side
     ============================================================ */
  const V2 = {
    id: 'v2', title: 'Two windows side by side', laerTitle: 'working in two windows', del: DEL, delDesc: DEL_DESC,
    desc: 'Snap windows to each half of the screen, drag files between them and copy text between programs.',
    laer: `
      <h4>Half the screen each</h4>
      <p>When you move files or copy something out, it is much easier to have two windows next to each other than to keep switching back and forth.</p>
      <table><tr><th>How</th><th>What it does</th></tr>
      <tr><td>Drag the title bar all the way to the <b>left</b> or <b>right</b> edge</td><td>The window fills half the screen. You see a see-through frame before you let go.</td></tr>
      <tr><td>Drag the title bar all the way up to the <b>top</b></td><td>The window is maximised.</td></tr>
      <tr><td><kbd>⊞</kbd> + <kbd>←</kbd> / <kbd>→</kbd></td><td>The same with the keyboard on a real PC.</td></tr></table>
      <h4>Two File Explorer windows</h4>
      <p>Right-click a folder and choose <b>Open in new window</b>. Then you can have one folder on the left and another on the right, and drag files straight across.</p>
      <p><b>Drag = move.</b> If you hold <kbd>Ctrl</kbd> down as you let go, the file is <b>copied</b> instead. (If you drag to a different drive or a memory stick, Windows copies by itself.)</p>
      <h4>Copy between programs</h4>
      <p>The clipboard is shared by all programs. What you copy with <kbd>Ctrl</kbd>+<kbd>C</kbd> in one program, you can paste with <kbd>Ctrl</kbd>+<kbd>V</kbd> in another.</p>`,
    oppdrag: [
      {
        id: 'v2o1', title: 'Drag files between two windows', lukk: ['explorer'],
        setup: F => {
          ['Vocabulary-week-41.docx', 'Vocabulary-week-42.docx'].forEach(n => FS.silentRemoveAll(n));
          F.ensureFolder(P_ENG);
          F.ensureFileAt(P_DOC, 'Vocabulary-week-41.docx', 'Vocabulary week 41\n\nhus = house\ntre = tree');
          F.ensureFileAt(P_DOC, 'Vocabulary-week-42.docx', 'Vocabulary week 42\n\nkatt = cat\nhund = dog');
        },
        steps: [
          { laer: true, quiz: { q: 'How do you make a window fill the left half of the screen?', options: ['Drag the title bar all the way to the left edge and let go', 'Double-click the desktop', 'Press Ctrl+V'], answer: 0 } },
          { laer: true, quiz: { q: 'You drag a file from one folder to another on the same PC. What happens?', options: ['It is copied', 'It is moved', 'It is deleted'], answer: 1 } },
          { laer: true, quiz: { q: 'How do you copy a file instead of moving it when you drag it?', options: ['Hold Shift', 'Hold Ctrl down when you let go', 'Drag really fast'], answer: 1 } },
          { text: 'Open File Explorer and go to <b>Documents</b>.', check: S => S.ev('explorer-nav', d => d.name === 'Documents') || exAt('Documents') },
          { text: 'Hold the left mouse button down on the <b>title bar</b> and drag the window all the way to the <b>left edge</b> of the screen. When you see a see-through frame, let go.', hint: 'The mouse pointer has to go right out to the edge. The frame shows where the window will end up.', check: S => S.ev('window-snap', d => d.app === 'explorer' && d.side === 'left') },
          { text: 'Open another window: right-click <b>English</b> (OneDrive › School › English) in the menu on the left and choose <b>Open in new window</b>.', hint: 'Click the arrow next to OneDrive and School in the menu on the left to see English. You can also right-click a folder inside the window.', check: S => S.wins('explorer') >= 2 && exAt('English') },
          { text: 'Snap the new window to the <b>right</b> half in the same way.', check: S => S.ev('window-snap', d => d.app === 'explorer' && d.side === 'right') },
          { text: 'Drag <b>Vocabulary-week-41</b> and <b>Vocabulary-week-42</b> from the window on the left into the English window on the right. Select both with <kbd>Ctrl</kbd> + click, then you can drag them together.', check: S => S.fileInNamed('Vocabulary-week-41.docx', 'English') && S.fileInNamed('Vocabulary-week-42.docx', 'English') },
          { quiz: { q: 'Why are two windows side by side useful?', options: ['You see both folders and can drag straight between them', 'The PC runs faster', 'It saves power'], answer: 0 } }
        ]
      },
      {
        id: 'v2o2', title: 'Copy text between two documents', lukk: ['skriv'],
        setup: F => {
          FS.silentRemoveAll('Notes-from-class.docx'); M.removeWhere(/^summary\.(docx|txt)$/i);
          F.ensureFileAt(P_NORSK, 'Notes-from-class.docx', 'Notes from the Norwegian lesson\n\nA short story is a brief narrative with few characters.\nA short story often starts in the middle of the action.\nThe ending is often open, so the reader has to think.');
        },
        steps: [
          { text: 'Open <b>Notes-from-class</b> from <b>OneDrive › School › Norwegian</b> in Write.', check: S => S.ev('open-file', d => /notes-from-class/i.test(d.name)) || /short story/i.test(S.editorText()) },
          { text: 'Snap the Write window to the <b>left</b> half of the screen.', check: S => S.ev('window-snap', d => d.app === 'skriv' && d.side === 'left') },
          { text: 'Open a <b>new, empty</b> document in Write (Start menu → Write) and snap it to the <b>right</b>.', hint: 'The Start menu opens a new Write window every time. Drag it to the right edge.', check: S => S.wins('skriv') >= 2 && S.ev('window-snap', d => d.app === 'skriv' && d.side === 'right') },
          { text: 'In the notes on the left: select the sentence you think is most important (drag over it with the mouse) and copy it with <kbd>Ctrl</kbd>+<kbd>C</kbd>.', check: S => S.ev('shortcut', d => d.app === 'skriv' && d.key === 'c' && d.ctrl) },
          { text: 'Click in the document on the right and paste with <kbd>Ctrl</kbd>+<kbd>V</kbd>.', check: S => S.ev('editor-paste') },
          { text: 'Save the new document as <b>Summary</b> in <b>OneDrive › School › Norwegian</b>.', hint: 'Click in the document on the right first, and choose Save As.', check: S => FS.findAll(c => c.type === 'file' && /^summary\.(docx|txt)$/i.test(c.name)).some(f => { const p = FS.get(f.parent); return p && /norwegian/i.test(p.name) && /short story/i.test(Skriv.plainText(f.content || '')); }) },
          { quiz: { q: 'You copy text in the browser. Can you paste it into Write?', options: ['No, only in the browser', 'Yes, the clipboard is shared by all programs', 'Only if you save first'], answer: 1 } }
        ]
      }
    ]
  };

  /* ============================================================
     V3: PDF and ZIP
     ============================================================ */
  const ZIP_UKE = () => Zip.make([{ p: 'Task1.docx', c: 'Task 1\n\nWrite five sentences about autumn.' }, { p: 'Task2.docx', c: 'Task 2\n\nMake a comic strip with three panels.' }]);
  const V3 = {
    id: 'v3', title: 'PDF and ZIP', laerTitle: 'PDF files and ZIP files', del: DEL, delDesc: DEL_DESC,
    desc: 'Make a PDF of a document, extract ZIP files properly, and pack several files into one ZIP file.',
    laer: `
      <h4>PDF: a finished document</h4>
      <p>A <b>PDF</b> looks the same on every PC, tablet and phone, and it doesn't get changed by accident. That's why teachers often want work handed in as a PDF.</p>
      <p>Make a PDF like this: <b>Print</b> (<kbd>Ctrl</kbd>+<kbd>P</kbd>) and choose the printer <b>Microsoft Print to PDF</b>. That makes a file instead of paper. In Word you can also choose <b>Save As → PDF</b>.</p>
      <p>Always keep the original (.docx). If you need to correct something, correct it there and make a new PDF.</p>
      <h4>ZIP: a compressed folder</h4>
      <p>A <b>ZIP file</b> is lots of files and folders packed together into one file. It is easy to send and download, and often smaller.</p>
      <table><tr><th></th><th>What it does</th></tr>
      <tr><td>Double-click the ZIP file</td><td>You <b>look inside</b> it, but the files are not extracted. If you open a file from there, you get a read-only copy, and whatever you write is lost.</td></tr>
      <tr><td><b>Extract all</b></td><td>Makes an ordinary folder with the files. Choose where it goes with <b>Browse</b>, preferably in OneDrive.</td></tr>
      <tr><td>Right-click → <b>Compress to → ZIP file</b></td><td>Packs the files or the folder you have selected into one ZIP file.</td></tr></table>
      <p><b>The rule:</b> extract first, work afterwards.</p>`,
    oppdrag: [
      {
        id: 'v3o1', title: 'Make a PDF', lukk: ['skriv'],
        setup: F => {
          FS.silentRemoveAll('Book-review.docx'); FS.silentRemoveAll('Book-review.pdf');
          F.ensureFileAt(P_NORSK, 'Book-review.docx', 'Book review: Sophie\'s World\n\nThe book is about Sophie, who gets letters from a mysterious philosopher. I liked it because it made me think.');
        },
        steps: [
          { laer: true, quiz: { q: 'Why do teachers often want work handed in as a PDF?', options: ['A PDF looks the same on every device and doesn\'t get changed by accident', 'PDFs are always free', 'Only the teacher can open a PDF'], answer: 0 } },
          { laer: true, quiz: { q: 'You double-click a ZIP file and write in a document inside it. What happens?', options: ['It is saved in the ZIP file', 'You are working in a read-only copy, and the changes are lost', 'The document is deleted'], answer: 1 } },
          { laer: true, quiz: { q: 'What is the first thing you do with a ZIP file you have downloaded?', options: ['Extract it', 'Delete it', 'Rename it'], answer: 0 } },
          { text: 'Open <b>Book-review</b> from <b>OneDrive › School › Norwegian</b> in Write.', check: S => S.ev('open-file', d => /^book-review\.docx$/i.test(d.name)) || /sophie's world/i.test(S.editorText()) },
          { text: 'Press <kbd>Ctrl</kbd>+<kbd>P</kbd> (Print).', hint: 'Click inside the document first, so the key press goes to Write. You will also find Print in the File menu.', check: S => S.ev('print-dialog') },
          { text: 'Choose the printer <b>Microsoft Print to PDF</b> and click Print. Save the PDF in the <b>Norwegian</b> folder with the name <b>Book-review</b>.', hint: 'The printer is chosen in the drop-down list at the top. Saved it somewhere else? Do it again and choose Norwegian.', check: S => S.fileInNamed('Book-review.pdf', 'Norwegian') },
          { text: 'Go to the Norwegian folder in File Explorer and open the <b>PDF file</b>. It opens in a different program, and you can\'t type in it.', hint: 'Turn on View → File name extensions, so you can see which one is .pdf and which is .docx.', check: S => S.ev('open-file', d => /^book-review.*\.pdf$/i.test(d.name)) },
          { quiz: { q: 'You spot a typo after making the PDF. What do you do?', options: ['Correct it in the PDF', 'Correct it in the .docx file and make a new PDF', 'Hand it in anyway'], answer: 1 } }
        ]
      },
      {
        id: 'v3o2', title: 'Extract a ZIP file', lukk: ['nettleser', 'explorer', 'viewer'],
        setup: F => {
          FS.findAll(c => c.type === 'file' && /^project-files-photosynthesis.*\.zip$/i.test(c.name), { includeBin: true }).map(c => c.name).forEach(n => FS.silentRemoveAll(n));
          removeFolderNamed('Project-files-photosynthesis');
          F.ensureFolder(P_NAT);
        },
        steps: [
          { text: 'Open the <b>Browser</b> and download <b>Project files about photosynthesis</b>.', check: S => S.ev('download', d => /project-files/i.test(d.base)) },
          { text: 'Open the ZIP file from <b>Downloads</b> (double-click it, or “Open file” in the download message). Now you can see inside it.', check: S => S.ev('zip-open', d => /project-files/i.test(d.name)) },
          { text: 'Double-click <b>Task-photosynthesis</b> inside the ZIP file. Read what it says, and click <b>Cancel</b>.', check: S => S.ev('zip-open-inside') },
          { text: 'Click <b>Extract all</b>. Click <b>Browse...</b>, choose <b>OneDrive › School › Science</b> and click <b>Extract</b>.', hint: 'Does the box say Downloads? Then you haven\'t chosen a new destination. Click Browse, go to OneDrive › School › Science and click Select folder. Extracted it to the wrong place? Just do it again.', check: S => M.folderInNamed('Project-files-photosynthesis', 'Science') && under('Task-photosynthesis.docx', 'Project-files-photosynthesis') },
          { text: 'Open <b>Task-photosynthesis</b> from the <b>extracted</b> folder in Science. Now you can write in it and save.', check: S => S.ev('open-file', d => { const n = FS.get(d.id); return !!n && /^task-photosynthesis/i.test(n.name) && FS.path(n.id).some(p => /^project-files-photosynthesis$/i.test(p.name)); }) },
          { text: 'Delete the ZIP file from <b>Downloads</b>. You don\'t need it any more.', check: S => !FS.children(FS.roots().downloads).some(c => /^project-files-photosynthesis.*\.zip$/i.test(c.name)) },
          { quiz: { q: 'Why do you have to extract a ZIP file before you work with the files in it?', options: ['The files inside the ZIP file are only a read-only view, so changes aren\'t saved', 'ZIP files are dangerous', 'You don\'t have to'], answer: 0 } }
        ]
      },
      {
        id: 'v3o3', title: 'Pack several files into one ZIP file', lukk: ['epost'],
        setup: F => {
          removeFolderNamed('Lab-report');
          FS.findAll(c => c.type === 'file' && /^lab-report.*\.zip$/i.test(c.name), { includeBin: true }).map(c => c.name).forEach(n => FS.silentRemoveAll(n));
          const p = [...P_NAT, 'Lab-report'];
          F.ensureFolder(p);
          F.ensureFileAt(p, 'Report.docx', 'Lab report: How fast does water evaporate?');
          F.ensureFileAt(p, 'Measurements.xlsx', '');
          F.ensureFileAt(p, 'Experiment-photo.jpg', '');
        },
        steps: [
          { text: 'Go to <b>OneDrive › School › Science</b>. There is a folder there called <b>Lab-report</b> with three files.', check: S => S.ev('explorer-nav', d => /science/i.test(d.name)) || exAt('Science') },
          { text: 'Right-click the <b>Lab-report</b> folder and choose <b>Compress to → ZIP file</b>.', check: S => S.ev('zip-create', d => d.names.some(n => /^lab-report$/i.test(n))) },
          { text: 'Windows makes <b>Lab-report.zip</b> and lets you rename it straight away. Press <kbd>Enter</kbd> to keep the name.', check: S => FS.findAll(c => c.type === 'file' && FS.ext(c.name) === 'zip' && /report\.docx/i.test(c.content || '')).some(f => { const p = FS.get(f.parent); return p && /science/i.test(p.name); }) },
          { text: 'Send the ZIP file as an attachment in an email to <b>kari.hansen@skolen.no</b>.', hint: 'Open Mail, click New message, and use 📎 Attach file ... to find the ZIP file in Science.', check: S => S.ev('mail-send', d => /kari/i.test(d.to) && d.attach.some(a => /\.zip$/i.test(a))) },
          { quiz: { q: 'Why send one ZIP file instead of three separate files?', options: ['All the files and folders come along in one package', 'Other people can\'t open ZIP files', 'Sending several attachments is against the rules'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================
     V4: Sources and source criticism
     ============================================================ */
  const V4 = {
    id: 'v4', title: 'Sources and source criticism', laerTitle: 'quotes, sources and source criticism', del: DEL, delDesc: DEL_DESC,
    desc: 'Copy a quote from the web properly, write the source, and judge whether a website can be trusted.',
    laer: `
      <h4>Quote or your own words</h4>
      <p>If you use someone else's words, it must be clear. A <b>quote</b> goes in quotation marks “like this” and has a source. Copying text without quotation marks and a source, and making it look as if you wrote it yourself, is called <b>plagiarism</b>, and it is cheating.</p>
      <p>It is usually best to write in your <b>own words</b>. Even then, you should write where you found the information.</p>
      <h4>How to write a source</h4>
      <p>Author, title, website, address and the date you read it. For example:<br><i>Ingrid Solberg: “Photosynthesis”, The Science Encyclopedia, practice-pc.simulation/science-encyclopedia/photosynthesis (read 14.10.2026)</i></p>
      <h4>Copying from the web</h4>
      <p>Select the text with the mouse and press <kbd>Ctrl</kbd>+<kbd>C</kbd>. You copy the address by right-clicking the address bar and choosing <b>Copy address</b> (or clicking in the bar and pressing <kbd>Ctrl</kbd>+<kbd>C</kbd>).</p>
      <h4>Can you trust the source?</h4>
      <table><tr><th>Ask yourself</th><th>Good sign</th><th>Bad sign</th></tr>
      <tr><td>Who is behind it?</td><td>A named author with subject knowledge</td><td>Anonymous, a nickname</td></tr>
      <tr><td>When?</td><td>A date, recently updated</td><td>No date</td></tr>
      <tr><td>Why does the page exist?</td><td>To inform</td><td>To sell, get clicks or trick you</td></tr>
      <tr><td>Is it true?</td><td>The textbook and other sources say the same</td><td>Incredible claims with no sources</td></tr></table>`,
    oppdrag: [
      {
        id: 'v4o1', title: 'Quote and source', lukk: ['skriv', 'nettleser'],
        setup: F => { M.removeWhere(/^photosynthesis-quote\.(docx|txt)$/i); F.ensureFolder(P_NAT); },
        steps: [
          { laer: true, quiz: { q: 'What is a quote?', options: ['Someone else\'s words in quotation marks, with a source', 'Text you have written yourself', 'A link'], answer: 0 } },
          { laer: true, quiz: { q: 'You copy a paragraph from the web into your work without quotation marks or a source. What is that called?', options: ['A quote', 'Plagiarism', 'A summary'], answer: 1 } },
          { laer: true, quiz: { q: 'What should you include when you write a source from the web?', options: ['Just “Google”', 'Author, title, website, address and the date you read it', 'Just the date'], answer: 1 } },
          { text: 'Open the <b>Browser</b> and click <b>Photosynthesis – The Science Encyclopedia</b> under “Reading for science”.', check: S => S.ev('browser-nav', d => d.page === 'artikkel') },
          { quiz: { q: 'Look under the title. Who wrote the article?', options: ['Ingrid Solberg, science teacher', 'Nobody, it is anonymous', 'PlantKing99'], answer: 0 } },
          { text: 'Select one sentence in the article (drag over it with the mouse) and copy it with <kbd>Ctrl</kbd>+<kbd>C</kbd>.', hint: 'Start just before the first word, hold the left mouse button down, and drag to the full stop. Right-click and Copy also works.', check: S => S.ev('browser-copy', d => d.page === 'artikkel' && d.text.length >= 20) },
          { text: 'Open <b>Write</b>. Type a quotation mark <b>"</b>, paste the sentence with <kbd>Ctrl</kbd>+<kbd>V</kbd>, and finish with <b>"</b>.', hint: 'On a Norwegian keyboard the quotation mark is Shift+2.', check: S => hasQuote(S.editorText()) && quoteMarks(S.editorText()) },
          { text: 'Go back to the browser, right-click the <b>address bar</b> and choose <b>Copy address</b>.', check: S => S.ev('browser-copy-url', d => d.page === 'artikkel') },
          { text: 'In Write: type <b>Source:</b> on a new line, paste the address, and write the author\'s name and today\'s date.', check: S => /source/i.test(S.editorText()) && hasUrl(S.editorText()) && /solberg/i.test(S.editorText()) },
          { text: 'Save the document as <b>Photosynthesis-quote</b> in <b>OneDrive › School › Science</b>.', check: S => FS.findAll(c => c.type === 'file' && /^photosynthesis-quote\.(docx|txt)$/i.test(c.name)).some(f => { const p = FS.get(f.parent); return p && /science/i.test(p.name) && hasQuote(Skriv.plainText(f.content || '')); }) }
        ]
      },
      {
        id: 'v4o2', title: 'Can you trust it?', lukk: ['nettleser'],
        steps: [
          { text: 'In the Browser: open the reading <b>“YOU WON\'T BELIEVE WHAT PLANTS DO!!!”</b>.', check: S => S.ev('browser-nav', d => d.page === 'blogg') },
          { quiz: { q: 'Who is behind this page?', options: ['An anonymous person with a nickname', 'The University of Bergen', 'A named teacher'], answer: 0 } },
          { quiz: { q: 'What is the clearest sign that the page can\'t be trusted?', options: ['The claims go against what you have learnt, and there are no sources', 'The page has colours', 'The page is in English'], answer: 0 } },
          { text: 'Go back with <b>←</b> and open the article from <b>The Science Encyclopedia</b>. Compare the two pages.', check: S => S.ev('browser-nav', d => d.page === 'artikkel') && (S.ev('browser-nav', d => d.page === 'portal')) },
          { quiz: { q: 'The blog says that plants don\'t need light. What do you do?', options: ['Write it in your work', 'Check a source you can trust, like the encyclopedia or the textbook', 'Share it with the class'], answer: 1 } },
          { quiz: { q: 'You wrote in your own words, but used facts from the encyclopedia. Do you have to give the source?', options: ['Yes, you should always write where you found the information', 'No, only when you quote', 'Only if the teacher asks'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================
     V5: Safe online
     ============================================================ */
  const V5 = {
    id: 'v5', title: 'Safe online', laerTitle: 'phishing, passwords and sharing', del: DEL, delDesc: DEL_DESC,
    desc: 'Spot fake emails, make strong passwords and share files with the right access.',
    laer: `
      <h4>Phishing: email that wants to trick you</h4>
      <p><b>Phishing</b> is fake messages that try to get you to click a link, type in your password or pay for something. They often look real. Look for these signs:</p>
      <ul><li><b>Hurry and threats:</b> “Your account will be closed today!”</li>
      <li><b>A strange sender address:</b> the name says “Microsoft”, but the address behind it is <i>micros0ft-support.com</i>. A familiar name can be fake, so always look at the address itself.</li>
      <li><b>Links that go somewhere other than they say.</b> Hover the mouse pointer over the link <i>without clicking</i>, and you can see where it really goes.</li>
      <li><b>They ask for your password, card number or money.</b> The school, Microsoft and the bank never ask for your password by email.</li></ul>
      <p><b>What do you do?</b> Don't click. Use <b>Report phishing</b>, or delete the message. If you clicked and typed in your password: <b>change your password straight away</b> and tell your teacher or IT.</p>
      <h4>Strong passwords</h4>
      <p>Length matters most. A <b>passphrase</b> of four random words (<i>bicycle cheese raincoat moon</i>) is both stronger and easier to remember than <i>Footb@ll1</i>. Use different passwords in different places, and never share your password, not even with your best friend.</p>
      <p><b>Two-step verification</b> means that you also have to approve the sign-in on your phone. Then the password isn't enough for someone who has stolen it.</p>
      <h4>Share with the right access</h4>
      <p>When you share a file, you choose who and what they are allowed to do: <b>Can edit</b> for the group you work with, <b>Can view only</b> for everyone else. Only share with the people who need it.</p>`,
    oppdrag: [
      {
        id: 'v5o1', title: 'Fake or real?', lukk: ['epost'],
        setup: () => { if (window.Epost) { Epost.reset(); Epost.deliver(['m4', 'm5', 'm6', 'm7']); } },
        steps: [
          { laer: true, quiz: { q: 'What is phishing?', options: ['Fake messages that want to trick you into clicking, giving away your password or paying', 'A kind of virus in the keyboard', 'Junk mail advertising fishing gear'], answer: 0 } },
          { laer: true, quiz: { q: 'How do you see where a link really goes, without clicking?', options: ['Hover the mouse pointer over it', 'Double-click it', 'You can\'t'], answer: 0 } },
          { laer: true, quiz: { q: 'An email from “Microsoft” asks you to confirm your password. What do you do?', options: ['Confirm it straight away', 'Reply with the password', 'Don\'t click, and report the message'], answer: 2 } },
          { text: 'Open <b>Mail</b>. Four new messages have arrived.', check: S => S.ev('mail-app-open') || S.wins('epost') > 0 },
          { text: 'Open the message <b>“Action required: your account will be closed today”</b>. Look at the sender address behind the name.', check: S => S.ev('mail-open', d => d.id === 'm4') },
          { text: 'Hover the mouse pointer over the <b>Confirm your account now</b> button, <i>without clicking</i>. At the bottom of the message you can see where the link really goes.', check: S => S.ev('mail-link-hover', d => d.id === 'm4') },
          { quiz: { q: 'What gives away that the message is fake?', options: ['The address is micros0ft with a zero, and the link doesn\'t go to Microsoft', 'It has a blue button', 'It arrived today'], answer: 0 } },
          { text: 'Click <b>⚠ Report phishing</b>.', check: S => S.ev('mail-report', d => d.id === 'm4') || mailSt().reported.includes('m4') },
          { text: 'Go through the other three new messages. <b>Report the fake ones</b>, but not the one that is real. Look at the sender address and hover over the links.', hint: 'One of them is from the teacher, with an address ending in @skolen.no, and the link goes to the school. Reported it by mistake? Open Junk Email and click “Not junk”.', check: S => { const r = mailSt().reported; return r.includes('m6') && r.includes('m7') && !r.includes('m5'); } },
          { quiz: { q: 'The message from “Jonas Berg” came from a gmail address, not his school address. What might have happened?', options: ['Someone is pretending to be Jonas to trick you', 'Jonas has changed his name', 'Nothing, that\'s completely normal'], answer: 0 } },
          { quiz: { q: 'You clicked a fake link and typed in your password. What do you do?', options: ['Nothing', 'Change your password straight away and tell your teacher or IT', 'Delete the email and hope for the best'], answer: 1 } }
        ]
      },
      {
        id: 'v5o2', title: 'Strong passwords', lukk: ['innstillinger'],
        steps: [
          { text: 'Open <b>Settings</b> from the Start menu and click <b>Change password...</b>.', check: S => S.ev('dialog-open', d => d.title === T('Endre passord')) },
          { text: 'Type a typical <b>bad</b> password, for example <b>football123</b>, and click Save. See what happens.', hint: 'This is just practice. Don\'t type the password you really use.', check: S => S.ev('password-test', d => d.score <= 1) },
          { text: 'Open <b>Change password</b> again and make a <b>passphrase</b> of four random words, for example <b>bicycle cheese raincoat moon</b>. Click Save.', hint: 'Four words with spaces between them. The more random the words, the better.', check: S => S.ev('password-test', d => d.score >= 3 && d.words >= 4) },
          { quiz: { q: 'Why is a passphrase of four words better than “Footb@ll1”?', options: ['It is much longer, and so much harder to guess, but still easy to remember', 'It is shorter', 'It has no numbers'], answer: 0 } },
          { quiz: { q: 'What is two-step verification?', options: ['That you have to approve the sign-in on your phone as well as typing the password', 'That you type the password twice', 'That the teacher approves the password'], answer: 0 } },
          { quiz: { q: 'Your best friend wants to borrow your Teams password. What do you do?', options: ['Give it to them, they\'re your best friend', 'Say no. You don\'t share passwords with anyone', 'Write it on a note'], answer: 1 } }
        ]
      },
      {
        id: 'v5o3', title: 'Share with the right access',
        setup: F => {
          ['Class-rules.docx', 'Group-project-election.docx'].forEach(n => FS.silentRemoveAll(n));
          F.ensureFolder(P_SAMF);
          const a = F.ensureFileAt(P_SAMF, 'Class-rules.docx', 'Class rules\n\n1. We listen to each other.\n2. We tidy up after ourselves.'); if (a) a.shared = false;
          const b = F.ensureFileAt(P_SAMF, 'Group-project-election.docx', 'Group project: The election\n\nJonas writes about the parties. Kari writes about election day.'); if (b) b.shared = false;
        },
        steps: [
          { text: 'Go to <b>OneDrive › School › Social studies</b>. Right-click <b>Class-rules</b> and choose <b>Share</b>.', check: S => S.ev('dialog-open', d => /class-rules/i.test(d.title || '')) },
          { text: 'Share the file with <b>Everyone in class 8A</b>, but choose <b>Can view only</b>. Click Copy link.', check: S => S.ev('share', d => /class-rules/i.test(d.name) && d.who === 'klassen' && d.perm === 'read') },
          { text: 'Share <b>Group-project-election</b> with <b>Jonas and Kari (my group)</b>, so that they <b>can edit</b>.', check: S => S.ev('share', d => /group-project-election/i.test(d.name) && d.who === 'gruppe' && d.perm === 'edit') },
          { quiz: { q: 'Why does the whole class only get view access to the rules?', options: ['So nobody changes or deletes anything by accident', 'Because view access is faster', 'It doesn\'t matter'], answer: 0 } },
          { quiz: { q: 'What should you never share with a link to everyone?', options: ['The weekly plan', 'Anything with personal information, like an address, photos of other people or passwords', 'A collection of poems'], answer: 1 } }
        ]
      }
    ]
  };

  /* ============================================================
     V6: Project week (everything together)
     ============================================================ */
  const projDoc = re => FS.findAll(c => c.type === 'file' && re.test(c.name)).some(f => FS.path(f.id).some(p => /^project-photosynthesis$/i.test(p.name)));
  const V6 = {
    id: 'v6', title: 'Project week', laerTitle: 'a project from start to hand-in', del: DEL, delDesc: DEL_DESC,
    desc: 'Everything together: get the material, extract it, write with sources, make a PDF, share with the group and hand in.',
    laer: `
      <h4>The workflow in a project</h4>
      <ol><li><b>Folder first.</b> Make a folder for the project in OneDrive, in the right subject folder.</li>
      <li><b>Get the material</b> and extract ZIP files <i>into the project folder</i>, not in Downloads.</li>
      <li><b>Read the task</b> and the assessment criteria before you start.</li>
      <li><b>Write</b> with a heading and in your own words. Include quotes in quotation marks, and write the sources <i>while you work</i>, not afterwards.</li>
      <li><b>Save</b> in the project folder with a clear name.</li>
      <li><b>Share</b> with the group with a link and edit access, so you all work in the same file.</li>
      <li><b>Make a PDF</b> when you're finished, and <b>hand it in</b>.</li></ol>
      <h4>Checklist before you hand in</h4>
      <p>Is it the right file? Is it a PDF if the teacher asked for one? Does the file have a name that says what it is? Are the sources included? After handing in: check that it says <b>Handed in</b>.</p>`,
    oppdrag: [
      {
        id: 'v6o1', title: 'The whole project, step by step', lukk: ['skriv', 'nettleser', 'innlevering', 'viewer'],
        setup: F => {
          removeFolderNamed('Project-photosynthesis');
          M.removeWhere(/^project-photosynthesis\.(docx|txt|pdf)$/i);
          F.ensureFolder(P_NAT);
          if (window.Innlevering) Innlevering.reset('naturfag-prosjekt');
        },
        steps: [
          { laer: true, quiz: { q: 'What is the first thing you do in a new project?', options: ['Make a folder for the project in the right subject folder in OneDrive', 'Start writing in any document', 'Hand in'], answer: 0 } },
          { laer: true, quiz: { q: 'When is the best time to write down the sources?', options: ['While you work', 'After you have handed in', 'Never'], answer: 0 } },
          { laer: true, quiz: { q: 'The group is writing together. How do you share the document?', options: ['Send it as an attachment to everyone', 'Share a link with edit access', 'Print it out'], answer: 1 } },
          { text: 'Make the folder <b>Project-photosynthesis</b> in <b>OneDrive › School › Science</b>.', check: S => M.folderInNamed('Project-photosynthesis', 'Science') },
          { text: 'Download <b>Project files about photosynthesis</b> from the School Portal and <b>extract them into the new folder</b>.', hint: 'Extract all → Browse... → choose Project-photosynthesis → Extract.', check: S => under('Task-photosynthesis.docx', 'Project-photosynthesis') },
          { text: 'Read <b>Task-photosynthesis</b> and <b>Assessment</b> from the extracted folder.', check: S => S.ev('open-file', d => /^(task-photosynthesis|assessment)/i.test(d.name)) },
          { text: 'Write your answer in a <b>new</b> document in Write: a heading with the style <b>Heading 1</b>, at least two sentences in your <b>own words</b>, one <b>quote</b> from The Science Encyclopedia in quotation marks, and a line with the <b>source</b> (the address).', hint: 'Open the article in the Browser, copy a sentence and the address, and snap Write and the Browser side by side.', check: S => { const t = S.editorText(); return S.skriv().headings.includes('h1') && hasQuote(t) && quoteMarks(t) && hasUrl(t) && t.replace(/\s+/g, ' ').length >= 150; } },
          { text: 'Save the document as <b>Project-photosynthesis</b> in the <b>Project-photosynthesis</b> folder.', check: S => projDoc(/^project-photosynthesis\.(docx|txt)$/i) },
          { text: 'Make a <b>PDF</b> of the document in the same folder (<kbd>Ctrl</kbd>+<kbd>P</kbd> → Microsoft Print to PDF).', check: S => projDoc(/^project-photosynthesis.*\.pdf$/i) },
          { text: '<b>Share</b> the Word document with <b>Jonas and Kari (my group)</b> with edit access.', check: S => S.ev('share', d => /^project-photosynthesis\.(docx|txt)$/i.test(d.name) && d.who === 'gruppe' && d.perm === 'edit') },
          { text: 'Hand in the <b>PDF</b> in Assignments under <b>Science: Project: Photosynthesis</b>.', hint: 'Add work → find the PDF in Project-photosynthesis → Hand in. Added the wrong file? Click Undo hand-in, remove it, and add the right one.', check: S => S.ev('submit', d => d.assignment === 'naturfag-prosjekt' && d.files.some(f => /\.pdf$/i.test(f))) },
          { quiz: { q: 'What do you check after handing in?', options: ['That it says “Handed in”, and that it was the right file', 'Nothing', 'That the PC is switched off'], answer: 0 } }
        ]
      }
    ]
  };

  /* ---------- Add the courses after the basic course ---------- */
  KURS.push(V1, V2, V3, V4, V5, V6);

  /* ---------- Master tests ---------- */
  addMaster('v1', {
    lukk: ['explorer'],
    title: 'Tidy lots of files quickly',
    intro: 'In Documents › Messy there are lots of files mixed together. Tidy them up, and do it with several files at a time.',
    setup: F => {
      const eng = ['English-vocabulary-1.docx', 'English-vocabulary-2.docx', 'English-essay.docx', 'English-listening.docx'];
      const nat = ['Science-cells.docx', 'Science-plants.docx', 'Science-lab.docx', 'Science-quiz.docx'];
      const tmp = ['delete-1.tmp', 'delete-2.tmp', 'delete-3.tmp'];
      eng.concat(nat, tmp).forEach(n => FS.silentRemoveAll(n));
      F.ensureFolder(P_ROT); F.ensureFolder(P_ENG); F.ensureFolder(P_NAT);
      eng.concat(nat, tmp).forEach(n => F.ensureFileAt(P_ROT, n, n));
    },
    goals: [
      { text: 'All the <b>English</b> files are in the English folder in OneDrive', check: S => ['English-vocabulary-1.docx', 'English-vocabulary-2.docx', 'English-essay.docx', 'English-listening.docx'].every(n => S.fileInNamed(n, 'English') && !S.fileIn(n, P_ROT)) },
      { text: 'All the <b>Science</b> files are in the Science folder in OneDrive', check: S => ['Science-cells.docx', 'Science-plants.docx', 'Science-lab.docx', 'Science-quiz.docx'].every(n => S.fileInNamed(n, 'Science') && !S.fileIn(n, P_ROT)) },
      { text: 'The three <b>.tmp</b> files are deleted', check: S => ['delete-1.tmp', 'delete-2.tmp', 'delete-3.tmp'].every(n => !S.fileIn(n, P_ROT)) && ['delete-1.tmp', 'delete-2.tmp', 'delete-3.tmp'].every(n => S.inBin(n) || S.gone(n)) },
      { text: 'At least once, you have moved or deleted <b>three files at the same time</b>', check: S => S.ev('paste', d => d.ids.length >= 3) || S.ev('drop', d => d.ids.length >= 3) || S.ev('delete-action', d => d.ids.length >= 3) }
    ]
  }, [
    'Select several files with Ctrl + click on your own PC, and move them together.',
    'Try drag-select in a folder with lots of photos.',
    'Look at the status bar at the bottom of File Explorer before you delete anything.'
  ]);

  addMaster('v2', {
    lukk: ['explorer'],
    title: 'Two windows, one move',
    intro: 'Snap two File Explorer windows side by side and move a file from one to the other by dragging.',
    setup: F => { FS.silentRemoveAll('To-the-desktop.txt'); F.ensureFileAt(P_DOC, 'To-the-desktop.txt', 'Drag me over to the desktop.'); },
    goals: [
      { text: 'Have one File Explorer window snapped to the <b>left</b>', check: S => S.ev('window-snap', d => d.app === 'explorer' && d.side === 'left') },
      { text: 'And one snapped to the <b>right</b>', check: S => S.ev('window-snap', d => d.app === 'explorer' && d.side === 'right') && S.wins('explorer') >= 2 },
      { text: 'Drag <b>To-the-desktop</b> from Documents to the <b>Desktop</b>', check: S => S.fileIn('To-the-desktop.txt', P_DESK) && !S.fileIn('To-the-desktop.txt', P_DOC) && S.ev('drop') }
    ]
  }, [
    'Snap two windows side by side on your own PC with the Windows key and the left/right arrow.',
    'Copy text from a website into a document with Ctrl+C and Ctrl+V.'
  ]);

  addMaster('v3', {
    lukk: ['skriv', 'explorer'],
    title: 'Extract, make a PDF, pack up',
    intro: 'The teacher has sent the weekly tasks as a ZIP file, and you have to hand in your answer as a PDF.',
    setup: F => {
      FS.silentRemoveAll('Weekly-tasks.zip'); removeFolderNamed('Weekly-tasks');
      M.removeWhere(/^answers-week-41\.(docx|pdf)$/i);
      F.ensureFileAt(P_DL, 'Weekly-tasks.zip', ZIP_UKE());
      F.ensureFileAt(P_NORSK, 'Answers-week-41.docx', 'Answers week 41\n\nTask 1: Autumn is lovely because the leaves change colour.');
    },
    goals: [
      { text: 'Extract <b>Weekly-tasks.zip</b> (in Downloads) to a folder in <b>OneDrive</b>', check: S => FS.findAll(c => c.type === 'folder' && /^weekly-tasks$/i.test(c.name)).some(f => M.nodeInOneDrive(f) && FS.children(f.id).some(x => /^task1/i.test(x.name))) },
      { text: 'Make a <b>PDF</b> of <b>Answers-week-41</b> (it is in Norwegian)', check: S => S.ev('print', d => d.target === 'pdf' && /answers-week-41/i.test(d.name)) },
      { text: 'Make a new <b>ZIP file</b> of something you want to send', check: S => S.ev('zip-create') }
    ]
  }, [
    'Make a PDF of a Word document on your own PC (File → Save As → PDF, or Print → Microsoft Print to PDF).',
    'Extract a ZIP file on your own PC with “Extract all”, and choose for yourself where it goes.'
  ]);

  addMaster('v4', {
    lukk: ['skriv', 'nettleser'],
    title: 'Quote with a source',
    intro: 'Make a short document with a correct quote and a correct source, without instructions.',
    setup: F => { M.removeWhere(/^source-use\.(docx|txt)$/i); F.ensureFolder(P_SK); },
    goals: [
      { text: 'A <b>quote</b> from The Science Encyclopedia in quotation marks in a document in Write', check: S => hasQuote(S.editorText()) && quoteMarks(S.editorText()) },
      { text: 'The <b>source</b> with the address and the author', check: S => hasUrl(S.editorText()) && /solberg/i.test(S.editorText()) },
      { text: 'Saved as <b>Source-use</b> in OneDrive', check: S => M.fileInOneDrive(c => /^source-use\.(docx|txt)$/i.test(c.name) && hasQuote(Skriv.plainText(c.content || ''))) }
    ]
  }, [
    'Next time you write an assignment: write the sources in a list at the bottom while you work.',
    'Check a website you use: who is behind it, when was it written, and why does it exist?'
  ]);

  addMaster('v5', {
    lukk: ['epost', 'innstillinger'],
    title: 'Don\'t get fooled',
    intro: 'The inbox has four new messages again. Tidy up, make a strong password, and share a file safely.',
    setup: F => {
      if (window.Epost) { Epost.reset(); Epost.deliver(['m4', 'm5', 'm6', 'm7']); }
      FS.silentRemoveAll('Weekly-plan-8A.docx'); F.ensureFolder(P_SAMF);
      const n = F.ensureFileAt(P_SAMF, 'Weekly-plan-8A.docx', 'Weekly plan for 8A'); if (n) n.shared = false;
    },
    goals: [
      { text: 'Report <b>all three fake</b> messages as phishing', check: S => PHISH.every(id => mailSt().reported.includes(id)) },
      { text: '…but <b>not</b> the real message from the teacher', check: S => PHISH.every(id => mailSt().reported.includes(id)) && !mailSt().reported.includes('m5') },
      { text: 'Make a <b>strong password</b> in Settings', check: S => S.ev('password-test', d => d.score >= 3) },
      { text: 'Share <b>Weekly-plan-8A</b> with the whole class with <b>view access only</b>', check: S => S.ev('share', d => /weekly-plan-8a/i.test(d.name) && d.perm === 'read') }
    ]
  }, [
    'Turn on two-step verification for an account you have, if you haven\'t already.',
    'Hover the mouse pointer over a link in a real email before you click, and see where it goes.',
    'Make a passphrase of four random words for the next account you create.'
  ]);

  addMaster('v6', {
    lukk: ['skriv', 'nettleser', 'innlevering', 'viewer'],
    title: 'A project on your own',
    intro: 'Do a small project with no instructions at all. You have learnt everything you need.',
    setup: F => {
      removeFolderNamed('Master-project');
      M.removeWhere(/^master-project\.(docx|txt|pdf)$/i);
      F.ensureFolder(P_NAT);
      if (window.Innlevering) Innlevering.reset('naturfag-prosjekt');
    },
    goals: [
      { text: 'Make the folder <b>Master-project</b> in a subject folder in OneDrive', check: S => FS.findAll(c => c.type === 'folder' && /^master-project$/i.test(c.name)).some(f => M.nodeInOneDrive(f)) },
      { text: 'A document in the folder with <b>Heading 1</b>, a <b>quote</b> and the <b>source</b>', check: S => FS.findAll(c => c.type === 'file' && /\.(docx|txt)$/i.test(c.name)).some(f => FS.path(f.id).some(p => /^master-project$/i.test(p.name)) && /<h1/i.test(f.content || '') && hasQuote(Skriv.plainText(f.content || '')) && hasUrl(Skriv.plainText(f.content || ''))) },
      { text: 'A <b>PDF</b> of the document in the same folder', check: S => FS.findAll(c => c.type === 'file' && /\.pdf$/i.test(c.name)).some(f => FS.path(f.id).some(p => /^master-project$/i.test(p.name))) },
      { text: 'Hand in the PDF under <b>Science: Project: Photosynthesis</b>', check: S => S.ev('submit', d => d.assignment === 'naturfag-prosjekt' && d.files.some(f => /\.pdf$/i.test(f))) }
    ]
  }, [
    'Use the workflow in your next real project: folder first, sources as you go, PDF and hand-in at the end.'
  ]);

  /* ---------- Weekly practice ---------- */
  REPETISJON.push(
    { id: 'rv1', kurs: 'v1', text: 'Select at least three files with <kbd>Ctrl</kbd> + click in File Explorer.', check: S => S.ev('select', d => d.how === 'ctrl' && d.names.length >= 3) },
    { id: 'rv2', kurs: 'v1', text: 'Select everything in a folder with <kbd>Ctrl</kbd>+<kbd>A</kbd>.', check: S => S.ev('select', d => d.how === 'all') },
    { id: 'rv3', kurs: 'v2', text: 'Snap a window to the left half of the screen.', check: S => S.ev('window-snap', d => d.side === 'left') },
    { id: 'rv4', kurs: 'v3', text: 'Make a PDF of a document with Print → <b>Microsoft Print to PDF</b>.', check: S => S.ev('print', d => d.target === 'pdf') },
    { id: 'rv5', kurs: 'v3', text: 'Extract <b>Weekly-tasks.zip</b> from Downloads.', setup: F => { FS.silentRemoveAll('Weekly-tasks.zip'); removeFolderNamed('Weekly-tasks'); F.ensureFileAt(P_DL, 'Weekly-tasks.zip', ZIP_UKE()); }, check: S => S.ev('zip-extract') },
    { id: 'rv6', kurs: 'v4', text: 'Copy the address of a web page from the address bar in the Browser.', check: S => S.ev('browser-copy-url') },
    { id: 'rv7', kurs: 'v5', text: 'Hover the mouse pointer over the link in an email and see where it really goes.', setup: () => { if (window.Epost) Epost.deliver(['m4']); }, check: S => S.ev('mail-link-hover') }
  );
})();
