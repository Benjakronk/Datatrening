/* Extra content for the basic course (English):
   - three new courses: Mail and sharing, Notes (OneNote), When something doesn't work
   - a typing task in the keyboard course
   - master test and "do it for real" for every course
   - the task pool for the weekly practice (REPETISJON)
   The file builds on KURS from oppdrag.js, so the course content lives in one place per topic. */

/* ---------- Helpers for the checks ---------- */
const M = {
  /* Is there a folder with this name inside a folder with another name? */
  folderInNamed(child, parent) {
    return FS.findAll(c => c.type === 'folder' && c.name.trim().toLowerCase() === parent.toLowerCase())
      .some(p => FS.children(p.id).some(c => c.type === 'folder' && c.name.trim().toLowerCase() === child.toLowerCase()));
  },
  anyInNamed(parent, pred) {
    return FS.findAll(c => c.type === 'folder' && c.name.trim().toLowerCase() === parent.toLowerCase())
      .some(p => FS.children(p.id).some(c => pred(c)));
  },
  /* Is there a matching file in OneDrive (at any depth)? Every file is checked, not just the first:
     if the student first saved in the wrong place (or opened the attachment, which makes a copy in Downloads),
     the correct copy in OneDrive should still be accepted. */
  fileInOneDrive(pred) { return FS.findAll(c => c.type === 'file' && pred(c)).some(f => FS.isDesc(f.id, FS.roots().onedrive)); },
  inOneDrive(name) { const l = name.toLowerCase(); return M.fileInOneDrive(c => c.name.toLowerCase() === l); },
  /* A file in OneDrive whose text starts like this (the student may have given the file another name) */
  contentInOneDrive(prefix) { return M.fileInOneDrive(c => Skriv.plainText(c.content || '').startsWith(prefix)); },
  /* Every file (also in the Recycle Bin) whose text starts like this */
  byContentAll(prefix, opts) { return FS.findAll(c => c.type === 'file' && Skriv.plainText(c.content || '').startsWith(prefix), opts); },
  /* Silently removes every file with a matching name (used in setups, e.g. "Master-test" and "Master test") */
  removeWhere(re) { [...new Set(FS.findAll(c => c.type === 'file' && re.test(c.name), { includeBin: true }).map(c => c.name))].forEach(n => FS.silentRemoveAll(n)); },
  /* Is a File Explorer window already showing a matching folder? (then no new navigation happens) */
  explorerIn(pred) { return typeof Explorer !== 'undefined' && Explorer.views.some(v => { const n = FS.get(v.cwd); return !!n && pred(n); }); },
  nodeInOneDrive(n) { return !!n && FS.isDesc(n.id, FS.roots().onedrive); },
  /* A subject name we accept as "a subject folder" (English names, plus the Norwegian ones) */
  isFag(name) { return /norwegian|maths?|mathematics|english|science|social|religion|music|\bart\b|food|\bpe\b|physical|spanish|german|french|norsk|matte|engelsk|naturfag|samfunn|krle|musikk|kunst|mat og helse|gym|kroppsøving|spansk|tysk|fransk/i.test(name || ''); },
  fileInFagmappe(pred) {
    return FS.findAll(c => c.type === 'file' && (!pred || pred(c))).some(c => { const p = FS.get(c.parent); return p && M.isFag(p.name) && FS.isDesc(c.id, FS.roots().onedrive); });
  },
  countIn(path) { const f = FS.resolve(path); return f ? FS.children(f.id).length : 0; }
};

/* ============================================================
   NEW COURSE: Mail and sharing
   ============================================================ */
const KURS_EPOST = {
  id: 'ke', title: 'Mail and sharing', laerTitle: 'mail, attachments and sharing',
  desc: 'Attachments in mail, reply and reply all, and sharing a file with a link instead of a copy.',
  laer: `
    <h4>Mail at school</h4>
    <p>You have a school address, for example <b>elev@skolen.no</b>. An email address always has an at sign <b>@</b> and a full stop. Type it exactly, or the message will never arrive.</p>
    <h4>Attachments</h4>
    <p>An <b>attachment</b> is a file that comes with the message, marked with a paper clip 📎. <b>The attachment is not on your PC.</b> If you want to keep it, you have to choose <b>Save as</b> and put it in a folder, preferably in OneDrive. If you open the attachment without saving it, you are working in a temporary copy, and your work can disappear.</p>
    <h4>Reply and Reply all</h4>
    <table><tr><th>Button</th><th>Who gets the reply</th></tr>
    <tr><td><b>Reply</b></td><td>Only the person who sent the message</td></tr>
    <tr><td><b>Reply all</b></td><td>Everyone who got the message, maybe the whole class</td></tr></table>
    <p>Only use <b>Reply all</b> when everyone needs to know the answer. Otherwise thirty people get a message they don't need.</p>
    <h4>Link or attachment?</h4>
    <p>When the file is in <b>OneDrive</b>, you can <b>share a link</b> instead of sending a copy.</p>
    <table><tr><th></th><th>Link</th><th>Attachment</th></tr>
    <tr><td>What they get</td><td>The same file as you</td><td>A copy</td></tr>
    <tr><td>If someone changes something</td><td>Everyone sees the change</td><td>Only in their copy</td></tr>
    <tr><td>Good for</td><td>Working together and group projects</td><td>Something that is completely finished</td></tr></table>
    <p>When several people write in the same document at the same time, it is called <b>co-authoring</b>. You see each other's changes straight away, and everything is saved automatically.</p>`,
  oppdrag: [
    {
      id: 'keo1', title: 'Attachments in the inbox', lukk: ['epost'],
      setup: F => { if (window.Epost) Epost.reset(); F.ensureFolder(['OneDrive', 'School', 'Norwegian']); F.silentRemoveAll('Book-report-template.docx'); },
      steps: [
        { laer: true, quiz: { q: 'What is an attachment?', options: ['A file that comes with an email', 'A link to a website', 'A picture in the signature'], answer: 0 } },
        { laer: true, quiz: { q: 'You open an attachment and write in it without saving it first. What is the risk?', options: ['None, it saves automatically', 'You are working in a temporary copy, and your work can disappear', 'The email gets deleted'], answer: 1 } },
        { laer: true, quiz: { q: 'When should you use “Reply all”?', options: ['Always, just to be safe', 'Never', 'Only when everyone who got the message needs the reply'], answer: 2 } },
        { text: 'Open <b>Mail</b> from the taskbar. Messages you haven\'t read are shown in bold.', check: S => S.ev('window-open', d => d.app === 'epost') || S.wins('epost') > 0 },
        { text: 'Open the message <b>Book report template</b> from your teacher.', check: S => S.ev('mail-open', d => /book report/i.test(d.subject)) },
        { text: 'The message has an attachment. Click <b>Save as …</b> next to the attachment, and save it in <b>OneDrive › School › Norwegian</b>.', hint: 'In the window that opens: click your way to OneDrive, then School, then Norwegian, and click Save. If it ended up in the wrong place, just click Save as … again.', check: S => M.inOneDrive('Book-report-template.docx') || M.contentInOneDrive('BOOK REPORT') },
        { text: 'Go to File Explorer and check that the file is in the <b>Norwegian</b> folder.', check: S => S.ev('explorer-nav', d => /norwegian/i.test(d.name)) || M.explorerIn(n => /norwegian/i.test(n.name)) },
        { text: 'Back in Mail: open the message from <b>Jonas</b> and click <b>Reply</b> (not Reply all, since only Jonas asked).', check: S => S.ev('mail-compose', d => d.reply && !d.all) },
        { text: 'Write a short reply and click <b>Send</b>.', check: S => S.ev('mail-send', d => d.reply && (d.body || '').trim().length > 3) }
      ]
    },
    {
      id: 'keo2', title: 'Send a file, and share a file',
      setup: F => { const n = F.ensureFileAt(['OneDrive', 'School', 'Norwegian'], 'My-part-social-studies.docx', 'My part of the group project\n\nDemocracy means rule by the people.'); if (n) n.shared = false; },
      steps: [
        { text: 'In Mail: click <b>New mail</b>. Type <b>jonas.berg@skolen.no</b> in the To box, and a subject.', hint: 'On a Norwegian keyboard you type @ with AltGr and 2. On a UK keyboard it is Shift and the \' key.', check: S => S.ev('mail-compose') },
        { text: 'Click <b>📎 Attach file …</b> and choose <b>My-part-social-studies</b> from OneDrive › School › Norwegian.', check: S => S.ev('mail-attach', d => /my-part/i.test(d.name)) },
        { text: 'Send the message.', check: S => S.ev('mail-send', d => d.attach.some(a => /my-part/i.test(a))) },
        { text: 'Now let\'s do it the other way. Go to File Explorer, right-click <b>My-part-social-studies</b> in OneDrive and choose <b>Share</b>.', hint: 'Share is in the right-click menu, below Copy as path.', check: S => S.ev('ctxmenu', d => d.where === 'file') && S.ev('dialog-open', d => /^Share /.test(d.title || '')) },
        { text: 'Choose that <b>my group</b> <b>can edit</b>, and click <b>Copy link</b>.', check: S => S.ev('share', d => d.perm === 'edit') },
        { text: 'Open the file in Write and wait a few seconds. Now Kari is writing in the document at the same time as you. This is called co-authoring.', hint: 'Double-click the file in File Explorer. Wait a little, and her text will appear.', check: S => S.ev('coedit') },
        { quiz: { q: 'You and two others are going to write a text together. What is best?', options: ['Sending the document to each other as an attachment', 'Sharing a link to the file in OneDrive', 'Writing separately and pasting it together at the end'], answer: 1 } },
        { quiz: { q: 'What is the downside of sending a document to a group as an attachment?', options: ['It takes too long to send', 'Everyone gets their own copy, and the changes are never put together', 'Attachments can\'t be opened on a school PC'], answer: 1 } }
      ]
    }
  ]
};

/* ============================================================
   NEW COURSE: Notes (OneNote)
   ============================================================ */
const KURS_NOTATER = {
  id: 'kn', title: 'Notes (OneNote)', laerTitle: 'notebook, section and page',
  desc: 'Structure in your notebook: a section per subject, a page per topic, and finding your notes again.',
  laer: `
    <h4>Three levels</h4>
    <p>OneNote is a digital ring binder. It has three levels, and that is the whole secret:</p>
    <table><tr><th>Level</th><th>Is like</th><th>Example</th></tr>
    <tr><td><b>Notebook</b></td><td>The binder itself</td><td>“My School”</td></tr>
    <tr><td><b>Section</b></td><td>A divider, one per subject</td><td>Norwegian, Maths, Science</td></tr>
    <tr><td><b>Page</b></td><td>A sheet of paper</td><td>“Fractions”, “Photosynthesis”</td></tr></table>
    <p>The sections are on the <b>left</b>, each with its own colour. The pages in the selected section are in the <b>middle</b>. The note itself is on the <b>right</b>.</p>
    <h4>It looks different, but works the same</h4>
    <p>There are several versions of OneNote, and the buttons can be in slightly different places. <b>The structure is always the same:</b> notebook, section, page. If you can find those three, you can find your way in every version.</p>
    <h4>You don't need to save</h4>
    <p>OneNote saves <b>automatically</b> while you write. There is no save button, and you don't need one. The notebook is in OneDrive, so you can find it again on any device.</p>
    <h4>Find it again</h4>
    <p>Give your pages <b>clear titles</b>, so you can find them again. The search box at the top searches the whole notebook, both the titles and the text on the pages.</p>`,
  oppdrag: [
    {
      id: 'kno1', title: 'Get to know the notebook', lukk: ['notater'],
      setup: F => { if (window.Notater) Notater.reset(); },
      steps: [
        { laer: true, quiz: { q: 'What are the three levels in OneNote, from biggest to smallest?', options: ['Page, section, notebook', 'Notebook, section, page', 'Folder, file, text'], answer: 1 } },
        { laer: true, quiz: { q: 'How do you save in OneNote?', options: ['Ctrl+S after every sentence', 'You don\'t need to save, it happens automatically', 'With File and Save As'], answer: 1 } },
        { laer: true, quiz: { q: 'OneNote looks a bit different on a classmate\'s PC. What stays the same?', options: ['The structure: notebook, section and page', 'The colours of the sections', 'Nothing'], answer: 0 } },
        { text: 'Open <b>Notes</b> from the taskbar. On the left you can see the sections <b>Norwegian</b> and <b>Maths</b>.', check: S => S.ev('notes-app-open') || S.wins('notater') > 0 },
        { text: 'Click the <b>Maths</b> section and read the page that is there.', check: S => S.ev('notes-open-section', d => /maths/i.test(d.name)) },
        { text: 'Make a new section for a subject you have: click <b>+ Add section</b> and name it <b>Science</b>.', check: S => S.notes().sections.some(s => /science/i.test(s)) },
        { text: 'Make a <b>new page</b> in Science and call it <b>Photosynthesis</b>.', hint: 'Make sure Science is selected on the left first. Then click “+ Add page” in the middle.', check: S => S.notes().pages.some(p => /photosynthesis/i.test(p.title) && /science/i.test(p.section)) },
        { text: 'Write at least one sentence about photosynthesis on the page. Notice that there is no save button.', check: S => S.notes().pages.some(p => /photosynthesis/i.test(p.title) && p.text.trim().length > 15) },
        { text: 'Make a <b>bulleted list</b> on the page with at least two points (click “• list”).', check: S => S.notes().pages.some(p => /photosynthesis/i.test(p.title) && (p.html.match(/<li/gi) || []).length >= 2) }
      ]
    },
    {
      id: 'kno2', title: 'Tidy up and find it again',
      setup: F => { if (window.Notater) Notater.reset(); },
      steps: [
        { text: 'Make a section called <b>English</b>.', check: S => S.notes().sections.some(s => /english/i.test(s)) },
        { text: 'Make a page in <b>Norwegian</b> called <b>Vocabulary</b>. It really belongs in English, but make it in Norwegian first.', hint: 'Click the Norwegian section on the left first, so the new page ends up there. Did it end up in the wrong section? Right-click the page and choose Move to section → Norwegian.', check: S => S.notes().pages.some(p => /vocabulary/i.test(p.title) && /norwegian/i.test(p.section)) },
        { text: 'Move the page to the right section: right-click <b>Vocabulary</b> in the page list and choose <b>Move to section → English</b>.', hint: 'Right-click the page name itself in the middle list.', check: S => S.notes().pages.some(p => /vocabulary/i.test(p.title) && /english/i.test(p.section)) },
        { text: 'Write at least three words on the page, for example “house = hus”.', check: S => S.notes().pages.some(p => /vocabulary/i.test(p.title) && p.text.trim().length > 15) },
        { text: 'Use the <b>search box</b> at the top right and search for a word you wrote on the vocabulary page.', hint: 'The search looks in both the titles and the text on the pages.', check: S => S.ev('notes-search', d => (d.query || '').length >= 3) },
        { text: 'Click the result to jump to the page.', check: S => S.ev('notes-open-page', d => d.via === 'search') },
        { text: 'Give the <b>Norwegian</b> section a new colour: right-click it and choose <b>Section colour</b>.', check: S => S.ev('ctxmenu', d => d.where === 'notater-sec') },
        { quiz: { q: 'You can\'t remember which section a note is in. What do you do?', options: ['Write the note again', 'Look through all the sections one by one', 'Use the search box at the top'], answer: 2 } },
        { quiz: { q: 'Why is it a good idea to give your pages clear titles?', options: ['It looks nicer', 'Because you and the search can find them again later', 'Because OneNote requires it'], answer: 1 } }
      ]
    }
  ]
};

/* ============================================================
   NEW COURSE: When something doesn't work
   ============================================================ */
const KURS_HJELP = {
  id: 'kh', title: 'When something doesn\'t work', laerTitle: 'solving problems yourself',
  desc: 'Find files that have “disappeared”, stop apps that have frozen, and undo mistakes.',
  laer: `
    <h4>Check these five things first</h4>
    <p>Almost every problem on a PC is solved by one of these. Go through the list before you put your hand up.</p>
    <table><tr><th>Problem</th><th>Check this</th></tr>
    <tr><td>“My file has gone”</td><td>Search for the name in File Explorer. Look in the <b>Recycle Bin</b>. Look in <b>Downloads</b> and on the <b>Desktop</b>. Sort by <b>Date modified</b> to find what you worked on last.</td></tr>
    <tr><td>“I deleted the wrong thing”</td><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes the last thing you did. If the file is in the Recycle Bin, you can <b>restore</b> it.</td></tr>
    <tr><td>“The app has frozen”</td><td>Wait a bit first. Then: <b>Task Manager</b> (right-click the taskbar) and <b>End task</b>. Open the app again.</td></tr>
    <tr><td>“The wrong app opens the file”</td><td>Right-click the file and choose <b>Open with</b>.</td></tr>
    <tr><td>“My work has disappeared”</td><td>If the file was in <b>OneDrive</b>, it has been saved automatically. If it was stored locally, only what you saved with <kbd>Ctrl</kbd>+<kbd>S</kbd> is there.</td></tr></table>
    <h4>When you ask for help</h4>
    <p>Say <b>what you did</b>, <b>what happened</b> and <b>what it says on the screen</b>. “It doesn't work” is hard to help with. “I clicked Save, and a red message came up saying the folder doesn't exist” is easy to help with.</p>`,
  oppdrag: [
    {
      id: 'kho1', title: 'The file has gone',
      setup: F => {
        F.ensureFolder(['OneDrive', 'School', 'Norwegian']);
        F.silentRemoveAll('Important-assignment.docx');
        const n = F.ensureFileAt(['This PC', 'Documents'], 'Important-assignment.docx', 'Norwegian assignment\n\nThis is the text I have been working on for two weeks.');
        if (n) F.remove(n.id, { via: 'setup' });
      },
      steps: [
        { laer: true, quiz: { q: 'You can\'t find a file. Where is it a good idea to look first?', options: ['Search for the name in File Explorer and look in the Recycle Bin', 'Make the file again', 'Restart the PC'], answer: 0 } },
        { laer: true, quiz: { q: 'What does Ctrl+Z do?', options: ['Saves', 'Undoes the last thing you did', 'Closes the app'], answer: 1 } },
        { text: 'The file <b>Important-assignment</b> has disappeared. Open File Explorer and <b>search</b> for “assignment” from This PC.', hint: 'Click This PC in the menu on the left, and type in the search box at the top right.', check: S => S.ev('search', d => /assign/i.test(d.query)) },
        { text: 'The search can\'t find it, because it is in the <b>Recycle Bin</b>. Open the Recycle Bin.', check: S => S.ev('explorer-nav', d => d.name === 'Recycle Bin') || M.explorerIn(n => n.id === FS.roots().bin) },
        { text: '<b>Restore</b> the file. It goes back to where it was.', check: S => !!S.file('Important-assignment.docx') && !S.inBin('Important-assignment.docx') },
        { text: 'Move it to <b>OneDrive › School › Norwegian</b>, so it is safe and saved automatically.', check: S => M.inOneDrive('Important-assignment.docx') },
        { text: 'Delete it by accident again (select it and press <kbd>Delete</kbd>), and undo with <kbd>Ctrl</kbd>+<kbd>Z</kbd>.', check: S => (S.ev('shortcut', d => d.key === 'z') || S.ev('fs', d => d.op === 'undo')) && !!S.file('Important-assignment.docx') && !S.inBin('Important-assignment.docx') },
        { quiz: { q: 'Where does a file go when you delete it in File Explorer?', options: ['It is gone for ever', 'To the Recycle Bin', 'To Downloads'], answer: 1 } }
      ]
    },
    {
      id: 'kho2', title: 'The app has frozen', lukk: ['skriv','taskmgr'],
      steps: [
        { text: 'Open <b>Write</b> and pretend it has frozen.', check: S => S.wins('skriv') > 0 },
        { text: '<b>Right-click the taskbar</b> at the bottom and choose <b>Task Manager</b>.', hint: 'Right-click an empty spot on the taskbar, not an icon.', check: S => S.ev('window-open', d => d.app === 'taskmgr') },
        { text: 'Find <b>Write</b> in the list and click <b>End task</b>. The app closes straight away, without asking you to save.', check: S => S.ev('end-task', d => d.app === 'skriv') },
        { text: 'Open Write again. This is how you do it on a real PC too.', check: S => S.ev('window-open', d => d.app === 'skriv') },
        { quiz: { q: 'What is the first thing you should do when an app seems to have frozen?', options: ['Click on everything lots of times', 'Wait a few seconds, many things sort themselves out', 'Turn the PC off with the power button'], answer: 1 } },
        { quiz: { q: 'What do you lose if you close an app with Task Manager?', options: ['Nothing', 'Everything you haven\'t saved', 'The whole file'], answer: 1 } }
      ]
    },
    {
      id: 'kho3', title: 'Where did I save it?',
      setup: F => {
        F.silentRemoveAll('Presentation-week-39.pptx');
        F.ensureFileAt(['This PC', 'Downloads'], 'Presentation-week-39.pptx', 'Presentation');
        const n = F.findByName('Presentation-week-39.pptx'); if (n) n.modified = Date.now();
      },
      steps: [
        { text: 'You worked on a presentation yesterday, but you can\'t remember where you saved it. Go to <b>This PC</b> in File Explorer.', check: S => S.ev('explorer-nav', d => d.name === 'This PC') },
        { text: 'Search for <b>presentation</b>. The <b>Location</b> column shows where the results are.', check: S => S.ev('search', d => /presentation/i.test(d.query)) },
        { text: 'It was in <b>Downloads</b>. Move it to a subject folder in OneDrive, so you can find it next time.', hint: 'Drag the file to the subject folder, or use Ctrl+X and Ctrl+V.', check: S => M.inOneDrive('Presentation-week-39.pptx') },
        { text: 'Go to the subject folder, switch to <b>Details</b> view and sort by <b>Date modified</b>. Then what you worked on last is at the top or the bottom.', check: S => S.ev('sort', d => d.by === 'modified') },
        { quiz: { q: 'What is the best way to avoid having to look for files?', options: ['Save everything on the desktop', 'Save in the right subject folder in OneDrive with a clear name', 'Save everything in Downloads'], answer: 1 } },
        { quiz: { q: 'You are going to ask for help. What is most useful to say?', options: ['“It doesn\'t work”', '“The PC is stupid”', '“I clicked Save, and a message came up saying the folder doesn\'t exist”'], answer: 2 } }
      ]
    }
  ]
};

/* ---------- Put the new courses in the right order ---------- */
(function insertKurs() {
  const at = id => { const i = KURS.findIndex(k => k.id === id); return i < 0 ? KURS.length : i; };
  KURS.splice(at('k6'), 0, KURS_EPOST);   /* mail comes before handing in */
  KURS.splice(at('k7'), 0, KURS_NOTATER); /* notes before the tidying course */
  KURS.push(KURS_HJELP);                  /* troubleshooting at the very end */
})();

/* ---------- Typing practice as a separate task in the keyboard course ---------- */
(function addTyping() {
  const k8 = KURS.find(k => k.id === 'k8'); if (!k8) return;
  k8.oppdrag.push({
    id: 'k8o2', title: 'Type faster', lukk: ['skrivetrening'],
    intro: 'Typing without looking at the keyboard is a skill you will use every single day. Here you test yourself and see your progress.',
    setup: F => { /* no files needed */ },
    steps: [
      { text: 'Open <b>Typing Practice</b> from the Start menu or the taskbar.', check: S => S.ev('typing-app-open') },
      { text: 'Read the tips at the bottom, and put your fingers on the home row: <kbd>a</kbd> <kbd>s</kbd> <kbd>d</kbd> <kbd>f</kbd> and <kbd>j</kbd> <kbd>k</kbd> <kbd>l</kbd> <kbd>;</kbd>. Feel for the bumps on <kbd>F</kbd> and <kbd>J</kbd>.', hint: 'The bumps are small raised lines on the keys. They help you find your place without looking down.', check: S => S.ev('typing-start') },
      { text: 'Finish the <b>Home row</b> exercise with at least <b>90% correct</b>. It is better to type slowly and correctly than fast and wrong.', check: S => S.ev('typing-done', d => d.acc >= 90) },
      { text: 'Switch to the <b>Q, X and Z</b> exercise and finish that one too.', check: S => S.ev('typing-done', d => d.level === 'aeoa') },
      { text: 'Try <b>Capitals and symbols</b>. Here you need <kbd>Shift</kbd>, and for some symbols <kbd>AltGr</kbd>.', check: S => S.ev('typing-done', d => d.level === 'tegn') },
      { text: 'Do one more exercise and try to beat your own record in words per minute.', check: S => S.ev('typing-done') },
      { quiz: { q: 'What matters most when you practise typing?', options: ['Typing correctly, the speed comes afterwards', 'Typing as fast as possible', 'Looking at the keyboard all the time'], answer: 0 } },
      { quiz: { q: 'Why do F and J have a little bump on them?', options: ['To show that they are broken', 'So you can find the home row without looking down', 'Because they are used the most'], answer: 1 } }
    ]
  });
})();

/* ============================================================
   MASTER TESTS and "DO IT FOR REAL"
   The goals must start as "not achieved", so several of them
   require an event (S.ev) since the test started.
   ============================================================ */
function addMaster(id, m, ekte) {
  const k = KURS.find(x => x.id === id);
  if (!k) return;
  k.mesterprove = m;
  if (ekte) k.ekte = ekte;
}

addMaster('k1', {
  lukk: 'alle',
  title: 'Control the PC yourself',
  intro: 'Show that you can open apps, control windows and use right-click without instructions.',
  setup: F => { F.silentRemoveAll('Done'); F.silentRemoveAll('Test'); },
  /* The windows the coach closes when the test starts (via 'oppdrag') must not count: the closing
     is checked while earlier events are still included, and then the goals would be achieved from the start */
  goals: [
    { text: 'Have <b>two apps open at the same time</b>', check: S => S.wins() >= 2 && !S.ev('window-close', d => d.via === 'oppdrag') },
    { text: 'Make a folder on the <b>desktop</b> called <b>Test</b>', check: S => S.folderIn('Test', P_DESK) },
    { text: 'Rename it to <b>Done</b>', check: S => S.folderIn('Done', P_DESK) },
    { text: 'Close all the windows you have opened', check: S => S.ev('window-close', d => d.via !== 'oppdrag') && S.wins() === 0 }
  ]
}, [
  'Open File Explorer on your own PC and maximise the window.',
  'Make a folder on the desktop and name it with F2.',
  'Right-click the taskbar and see what the menu contains.'
]);

addMaster('k2', {
  title: 'Build your own folder structure',
  intro: 'You are going to make a tidy structure in OneDrive, with no step-by-step instructions.',
  setup: F => { F.silentRemoveAll('Project'); },
  goals: [
    { text: 'Make a folder called <b>Project</b> in OneDrive', check: S => FS.findAll(c => c.type === 'folder' && /^project$/i.test(c.name.trim())).some(f => FS.isDesc(f.id, FS.roots().onedrive)) },
    { text: 'Make the folders <b>Text</b> and <b>Images</b> <i>inside</i> Project', check: S => M.folderInNamed('Text', 'Project') && M.folderInNamed('Images', 'Project') },
    { text: 'Open the Text folder, so the address bar shows OneDrive › … › Project › Text', check: S => S.ev('explorer-nav', d => /project/i.test(d.path) && /^text$/i.test(d.name)) }
  ]
}, [
  'Make a School folder in OneDrive on your own PC, with one folder per subject.',
  'Go to a subject folder and read the address bar out loud to yourself.'
]);

addMaster('k3', {
  title: 'Tidy up without help',
  intro: 'Three files are on the desktop. Each one must be dealt with in a different way.',
  setup: F => {
    ['test-a.txt', 'test-b.txt', 'test-c.txt'].forEach(n => F.silentRemoveAll(n));
    F.ensureFileAt(P_DESK, 'test-a.txt', 'This one should be moved.');
    F.ensureFileAt(P_DESK, 'test-b.txt', 'This one should be copied.');
    F.ensureFileAt(P_DESK, 'test-c.txt', 'This one should be deleted.');
  },
  goals: [
    { text: '<b>Move</b> “test-a” to Documents, so it is no longer on the desktop', check: S => S.fileIn('test-a.txt', P_DOC) && !S.fileIn('test-a.txt', P_DESK) },
    { text: '<b>Copy</b> “test-b” to Documents, so it is in both places', check: S => S.fileIn('test-b.txt', P_DOC) && S.fileIn('test-b.txt', P_DESK) },
    { text: '<b>Delete</b> “test-c”, so it ends up in the Recycle Bin', check: S => S.inBin('test-c.txt') }
  ]
}, [
  'Move a file on your own PC by dragging it, and another one with Ctrl+X and Ctrl+V.',
  'Delete a file you don\'t need, and check that it is in the Recycle Bin.'
]);

addMaster('k4', {
  lukk: ['skriv'],
  title: 'From blank page to the right folder',
  intro: 'Write something new, save it in the right place with a good name, and find it again.',
  /* "Master test" with a space (or no hyphen) is accepted too, many students type it that way */
  setup: F => { M.removeWhere(/^master[\s-]?test\.(docx|txt)$/i); F.ensureFolder(P_SK); },
  goals: [
    { text: 'Write at least 40 characters in a new document in Write', check: S => S.editorText().trim().length >= 40 },
    { text: 'Save it as <b>Master-test</b> in a <b>subject folder in OneDrive</b>', check: S => M.fileInFagmappe(c => /^master[\s-]?test\.(docx|txt)$/i.test(c.name)) },
    { text: 'Close Write and open the file again from File Explorer', check: S => S.ev('window-close', d => d.app === 'skriv') && S.ev('open-file', d => /^master[\s-]?test\./i.test(d.name)) }
  ]
}, [
  'Make a document in Word on your own PC and save it in the right subject folder in OneDrive.',
  'Close Word and find the document again in File Explorer.'
]);

addMaster('kf', {
  lukk: ['skriv'],
  title: 'Lay out a document',
  intro: 'Make a document that looks tidy, with a heading, bold text and a list.',
  setup: F => { F.silentRemoveAll('Layout.docx'); F.ensureFolder(P_SK); },
  goals: [
    { text: 'Make a <b>heading</b> with the Heading 1 style', check: S => S.skriv().headings.includes('h1') },
    { text: 'Make at least one word <b>bold</b>', check: S => S.skriv().bold },
    { text: 'Make a <b>bulleted list</b> with at least three points', check: S => S.skriv().lists.includes('ul') && S.skriv().listItems >= 3 },
    { text: 'Save the document as <b>Layout</b> in OneDrive', check: S => M.inOneDrive('Layout.docx') }
  ]
}, [
  'Write a heading in Word on your own PC and give it the Heading 1 style.',
  'Make a bulleted list and make one word bold with Ctrl+B.'
]);

addMaster('k5', {
  title: 'Download and tidy up',
  intro: 'Download a file from the internet and make sure it ends up where it should, not in Downloads.',
  setup: F => { F.silentRemoveAll('Democracy.pptx'); F.ensureFolder(P_SK); },
  goals: [
    { text: 'Download <b>Presentation on democracy</b> from the School Portal', check: S => S.ev('download', d => /democracy/i.test(d.base)) },
    { text: 'Move the file out of Downloads and into <b>OneDrive</b>', check: S => M.inOneDrive('Democracy.pptx') },
    { text: 'Check that it isn\'t left behind in Downloads', check: S => !S.fileIn('Democracy.pptx', P_DL) && M.inOneDrive('Democracy.pptx') }
  ]
}, [
  'Download an attachment or a file on your own PC and move it to the right folder straight away.',
  'Tidy up your Downloads folder: delete what you don\'t need.'
]);

addMaster('ke', {
  lukk: ['epost'],
  title: 'Keep what you get, and share what you make',
  intro: 'Show that you can get an attachment out of your mail, and that you choose correctly between a link and an attachment.',
  setup: F => { if (window.Epost) Epost.reset(); F.silentRemoveAll('Weekly-plan-week-39.pdf'); F.ensureFolder(P_SK); },
  goals: [
    { text: 'Save the attachment <b>Weekly-plan-week-39</b> from the inbox in a folder in <b>OneDrive</b>', check: S => M.inOneDrive('Weekly-plan-week-39.pdf') },
    { text: 'Send an email to <b>jonas.berg@skolen.no</b> with an <b>attachment</b>', check: S => S.ev('mail-send', d => /jonas/i.test(d.to) && d.attach.length > 0) },
    { text: '<b>Share</b> a file in OneDrive with a link', check: S => S.ev('share') }
  ]
}, [
  'Save an attachment from your school mail in the right folder in OneDrive.',
  'Share a document with someone in your class by sending a link instead of an attachment.'
]);

addMaster('k6', {
  lukk: ['innlevering'],
  title: 'Hand in on your own',
  intro: 'The science report has to be handed in. You get no instructions this time.',
  setup: F => { F.ensureFolder(P_NAT); F.ensureFileAt(P_NAT, 'Report-photosynthesis.docx', 'Report on photosynthesis'); if (window.Innlevering) Innlevering.reset('naturfag-rapport'); },
  goals: [
    { text: 'Open the assignment <b>Science: Report: Photosynthesis</b> in Assignments', check: S => S.ev('assignment-open', d => d.id === 'naturfag-rapport') },
    { text: 'Attach <b>Report-photosynthesis</b> from OneDrive', check: S => S.ev('attach', d => d.assignment === 'naturfag-rapport' && /photosynthesis/i.test(d.name)) },
    { text: 'Hand it in', check: S => S.ev('submit', d => d.assignment === 'naturfag-rapport') }
  ]
}, [
  'Hand in an assignment in Teams on your own PC, and check that it says “Handed in” afterwards.',
  'See if your teacher has given feedback on an earlier assignment.'
]);

addMaster('kn', {
  lukk: ['notater'],
  title: 'The notebook is yours',
  intro: 'Set up the notebook the way you want it, and show that you can find what you write again.',
  setup: F => { if (window.Notater) Notater.reset(); },
  goals: [
    { text: 'Make a new <b>section</b> called <b>Social studies</b>', check: S => S.notes().sections.some(s => /social studies/i.test(s)) },
    { text: 'Make a <b>page</b> in it with a clear title', check: S => S.notes().pages.some(p => /social studies/i.test(p.section) && p.title.trim().length >= 3) },
    { text: 'Write at least 30 characters on the page', check: S => S.notes().pages.some(p => /social studies/i.test(p.section) && p.text.trim().length >= 30) },
    { text: 'Find the page again with <b>search</b>', check: S => S.ev('notes-search') && S.ev('notes-open-page', d => d.via === 'search') }
  ]
}, [
  'Open OneNote on your own PC and find the notebook, a section and a page.',
  'Make a section for a subject you are missing, and a page for today\'s lesson.'
]);

addMaster('k7', {
  title: 'Find, tidy and name',
  intro: 'A file with a bad name is somewhere on the PC. Find it, give it a good name and put it in the right place.',
  setup: F => {
    /* Also remove the file from an earlier attempt, where it may have been renamed (otherwise the goals would be achieved from the start).
       Silent removal: an event in the middle of the setup would check the goals while the old file still existed. */
    [...new Set(M.byContentAll('English essay', { includeBin: true }).map(f => f.name))].forEach(n => F.silentRemoveAll(n));
    F.silentRemoveAll('document44.docx');
    F.ensureFolder(P_ENG);
    F.ensureFile([...P_DOC, 'Old', 'Projects'], 'document44.docx', 'English essay about London\n\nLondon is the capital of England.');
  },
  /* Every file with the text is checked: if the student copied instead of moving, the original is still there with the old name */
  goals: [
    { text: 'Find the file <b>document44</b> with search', check: S => S.ev('search', d => /document44|document/i.test(d.query)) },
    { text: 'Give it a <b>good name</b> that says what it contains', check: S => M.byContentAll('English essay').some(f => !/^document/i.test(f.name) && f.name.length > 8) },
    { text: 'Put it in the right <b>subject folder</b> in OneDrive', check: S => M.byContentAll('English essay').some(f => { const p = FS.get(f.parent); return !!p && /engelsk|english/i.test(p.name) && FS.isDesc(f.id, FS.roots().onedrive); }) }
  ]
}, [
  'Find a file on your own PC with the search box in File Explorer.',
  'Find a file with a bad name and give it a name that says what it is.'
]);

addMaster('k8', {
  lukk: ['skriv','skrivetrening'],
  title: 'The keyboard is in your fingers',
  intro: 'Show that your fingers find their way, both on the letters and on the shortcuts.',
  setup: F => { M.removeWhere(/^keyboard[\s-]?test\.(docx|txt)$/i); },
  goals: [
    { text: 'Finish a typing exercise with at least <b>92% correct</b>', check: S => S.ev('typing-done', d => d.acc >= 92) },
    { text: 'Type an email address with <b>@</b> in a document in Write', check: S => /\S+@\S+\.\w/.test(S.editorText()) },
    { text: 'Use <b>Ctrl</b>+<b>C</b> and <b>Ctrl</b>+<b>V</b> in Write', check: S => S.ev('shortcut', d => d.ctrl && d.key === 'c' && d.app === 'skriv') && S.ev('shortcut', d => d.ctrl && d.key === 'v' && d.app === 'skriv') },
    { text: 'Save the document as <b>Keyboard-test</b>', check: S => FS.findAll(c => c.type === 'file' && /^keyboard[\s-]?test\.(docx|txt)$/i.test(c.name)).length > 0 }
  ]
}, [
  'Do a typing exercise on your own PC without looking at the keyboard.',
  'Use Ctrl+C, Ctrl+V and Ctrl+Z in a real document.',
  'Try Alt+Tab to switch between two open apps.'
]);

addMaster('kh', {
  lukk: ['taskmgr'],
  title: 'Solve the problem yourself',
  intro: 'Three things have gone wrong. Fix them without asking for help.',
  setup: F => {
    F.silentRemoveAll('Group-project.docx');
    const n = F.ensureFileAt(P_DOC, 'Group-project.docx', 'Group project in social studies');
    if (n) F.remove(n.id, { via: 'setup' });
  },
  goals: [
    { text: 'The file <b>Group-project</b> has “gone”. Find it and get it back', check: S => !!S.file('Group-project.docx') && !S.inBin('Group-project.docx') },
    { text: 'Put it somewhere safe, in <b>OneDrive</b>', check: S => M.inOneDrive('Group-project.docx') },
    { text: 'Open <b>Task Manager</b> and end an app you have open', check: S => S.ev('end-task') }
  ]
}, [
  'Open Task Manager on your own PC with Ctrl+Shift+Esc.',
  'Look in your Recycle Bin, and restore something you deleted by accident.',
  'Check that your schoolwork is in OneDrive and not only stored locally.'
]);

/* ============================================================
   WEEKLY PRACTICE: short tasks without hints, taken from completed courses
   The tasks come in random order and without any window setup, so a document or
   a window from an earlier task may already be open. Checks on the content in Write
   and Notes therefore also require an event, so they aren't passed before the student has done anything.
   ============================================================ */
const REPETISJON = [
  { id: 'rp1', kurs: 'k1', lukk: ['explorer'], text: 'Open <b>File Explorer</b> and maximise the window.', check: S => S.ev('window-max', d => d.app === 'explorer') },
  { id: 'rp2', kurs: 'k1', text: 'Right-click the <b>desktop</b> and close the menu again with <kbd>Esc</kbd>.', check: S => S.ev('ctxmenu', d => d.where === 'desktop') && S.ev('ctxmenu-close', d => d.via === 'esc') },
  { id: 'rp3', kurs: 'k2', text: 'Make a folder called <b>Weekly test</b> in Documents.', setup: F => F.silentRemoveAll('Weekly test'), check: S => S.folderIn('Weekly test', P_DOC) },
  { id: 'rp4', kurs: 'k2', text: 'Go to <b>OneDrive › School</b> in File Explorer.', check: S => S.ev('explorer-nav', d => /^school$/i.test(d.name)) },
  { id: 'rp5', kurs: 'k3', text: 'Copy the file <b>week-file.txt</b> from the desktop to Documents.', setup: F => { F.silentRemoveAll('week-file.txt'); F.ensureFileAt(P_DESK, 'week-file.txt', 'Test file'); }, check: S => S.fileIn('week-file.txt', P_DOC) && S.fileIn('week-file.txt', P_DESK) },
  { id: 'rp6', kurs: 'k3', text: 'Delete the file <b>delete-me.txt</b> from the desktop, and empty the Recycle Bin afterwards.', setup: F => { F.silentRemoveAll('delete-me.txt'); F.ensureFileAt(P_DESK, 'delete-me.txt', 'Delete me'); }, check: S => S.gone('delete-me.txt') },
  { id: 'rp7', kurs: 'k3', text: 'Move <b>move-me.txt</b> from Downloads to Documents.', setup: F => { F.silentRemoveAll('move-me.txt'); F.ensureFileAt(P_DL, 'move-me.txt', 'Move me'); }, check: S => S.fileIn('move-me.txt', P_DOC) },
  { id: 'rp8', kurs: 'k4', text: 'Make a document in Write, type your name, and save it as <b>Weekly-note</b> in OneDrive.', setup: F => M.removeWhere(/^weekly[\s-]?note\.(docx|txt)$/i), check: S => M.fileInOneDrive(c => /^weekly[\s-]?note\.(docx|txt)$/i.test(c.name)) },
  { id: 'rp9', kurs: 'k4', text: 'Turn on <b>File name extensions</b> in File Explorer.', setup: F => { if (Explorer.settings.showExt) Explorer.setShowExt(false, 'rep'); }, check: S => S.ev('show-ext', d => d.on) },
  { id: 'rp10', kurs: 'kf', text: 'Write a sentence in Write and make at least one word <b>bold</b>.', check: S => S.ev('format', d => d.cmd === 'bold') && S.skriv().bold },
  { id: 'rp11', kurs: 'kf', text: 'Make a <b>bulleted list</b> with two points in Write.', check: S => S.ev('format', d => d.cmd === 'insertUnorderedList') && S.skriv().lists.includes('ul') && S.skriv().listItems >= 2 },
  { id: 'rp12', kurs: 'kf', text: 'Set the font to <b>Arial</b> on some text you have selected in Write.', check: S => S.ev('format', d => d.cmd === 'fontName' && /arial/i.test(d.value)) },
  { id: 'rp13', kurs: 'k5', text: 'Download <b>Worksheet on fractions</b> from the School Portal and move the file to OneDrive.', setup: F => F.silentRemoveAll('Worksheet-fractions.pdf'), check: S => M.inOneDrive('Worksheet-fractions.pdf') },
  { id: 'rp14', kurs: 'ke', text: 'Save the attachment in the message <b>Weekly plan week 39</b> in Documents.', setup: F => { if (window.Epost) Epost.reset(); F.silentRemoveAll('Weekly-plan-week-39.pdf'); }, check: S => !!S.file('Weekly-plan-week-39.pdf') },
  { id: 'rp15', kurs: 'ke', text: 'Send an email to <b>kari.hansen@skolen.no</b> with a subject and a message.', check: S => S.ev('mail-send', d => /kari/i.test(d.to) && (d.subject || '').length > 2) },
  { id: 'rp16', kurs: 'k6', text: 'Hand in <b>Maths: Fraction exercises</b> in Assignments with a file from OneDrive.', setup: F => { F.ensureFolder(P_MATTE); F.ensureFileAt(P_MATTE, 'Worksheet-fractions.pdf', 'Fractions'); if (window.Innlevering) Innlevering.reset('matte-brok'); }, check: S => S.ev('submit', d => d.assignment === 'matte-brok') },
  { id: 'rp17', kurs: 'kn', text: 'Make a new page in Notes called <b>Word of the week</b>, and write something on it.', check: S => S.ev('notes-edit', d => /word of the week/i.test(d.page || '')) && S.notes().pages.some(p => /word of the week/i.test(p.title) && p.text.trim().length > 5) },
  { id: 'rp18', kurs: 'kn', text: 'Search the notebook for a word you have written.', check: S => S.ev('notes-search', d => (d.query || '').length >= 3) },
  { id: 'rp19', kurs: 'k7', text: 'Search for <b>budget</b> in File Explorer and open the result.', setup: F => F.ensureFile([...P_DOC, 'Year 7', 'Projects', 'Class trip'], 'Class-trip-budget.xlsx', ''), check: S => S.ev('search', d => /budget/i.test(d.query)) && S.ev('open-file', d => /budget/i.test(d.name)) },
  { id: 'rp20', kurs: 'k7', text: 'Switch to <b>Details</b> view and sort by <b>Date modified</b>.', check: S => (S.ev('view', d => d.view === 'details') || Explorer.views.some(v => v.view === 'details')) && S.ev('sort', d => d.by === 'modified') },
  { id: 'rp21', kurs: 'k8', text: 'Finish a typing exercise in Typing Practice.', check: S => S.ev('typing-done') },
  { id: 'rp22', kurs: 'k8', text: 'Type <b>test@skolen.no</b> in a document in Write.', check: S => S.ev('editor-input') && /test@skolen\.no/i.test(S.editorText()) },
  { id: 'rp23', kurs: 'kh', text: 'Delete <b>undo-me.txt</b> from the desktop, and undo with <kbd>Ctrl</kbd>+<kbd>Z</kbd>.', setup: F => { F.silentRemoveAll('undo-me.txt'); F.ensureFileAt(P_DESK, 'undo-me.txt', 'Undo me'); }, check: S => (S.ev('shortcut', d => d.key === 'z') || S.ev('fs', d => d.op === 'undo')) && S.fileIn('undo-me.txt', P_DESK) },
  { id: 'rp24', kurs: 'kh', lukk: ['taskmgr'], text: 'Open <b>Task Manager</b> from the taskbar.', check: S => S.ev('window-open', d => d.app === 'taskmgr') }
];
