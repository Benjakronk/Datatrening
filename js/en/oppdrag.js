/* Courses and tasks. Each step has a check(S) function that is checked automatically,
   or a quiz. S is the helper object from coach.js (see there for the available functions). */

const P_DOC = ['This PC', 'Documents'];
const P_DESK = ['This PC', 'Desktop'];
const P_DL = ['This PC', 'Downloads'];
const P_PIC = ['This PC', 'Pictures'];
const P_SK = ['OneDrive', 'School'];
const P_NORSK = ['OneDrive', 'School', 'Norwegian'];
const P_MATTE = ['OneDrive', 'School', 'Maths'];
const P_ENG = ['OneDrive', 'School', 'English'];
const P_NAT = ['OneDrive', 'School', 'Science'];

const KURS = [
  /* ============================================================ */
  {
    id: 'k1', title: 'Getting to know the PC', laerTitle: 'desktop, mouse and windows',
    desc: 'The desktop, the taskbar, the mouse and how windows work.',
    laer: `
      <h4>The desktop</h4>
      <p>What you see when the PC starts is called the <b>desktop</b>. At the bottom is the <b>taskbar</b> with the <b>Start button</b> (the Windows logo) and icons for apps. Apps that are open get a line under their icon.</p>
      <h4>Mouse and touchpad</h4>
      <table><tr><th>Action</th><th>What it does</th></tr>
      <tr><td><b>Left-click</b> (one press)</td><td>Selects something, or presses a button</td></tr>
      <tr><td><b>Double-click</b> (two quick presses)</td><td>Opens a file, folder or app</td></tr>
      <tr><td><b>Right-click</b> (right button, or two fingers on the touchpad)</td><td>Opens a menu with more options</td></tr>
      <tr><td><b>Drag and drop</b></td><td>Hold the left button down, move, let go</td></tr></table>
      <h4>Right-clicking on the touchpad (laptop)</h4>
      <p>Without a mouse: <b>tap lightly with two fingers at the same time</b> on the touchpad. Pressing down in the bottom right corner of the touchpad also works.</p>
      <p><b>The menu is different depending on what you right-click.</b> A file, a folder, the desktop and the taskbar each have their own menu. So: always right-click the <i>thing</i> you want to do something with. Press <kbd>Esc</kbd> to close the menu without choosing anything.</p>
      <h4>Windows</h4>
      <p>Each app opens in a <b>window</b>. In the top right corner of the window you'll find three buttons:
      <b>—</b> minimises (hides the window in the taskbar), <b>☐</b> maximises (fills the whole screen), <b>✕</b> closes. You move a window by dragging the <b>title bar</b> at the top.</p>
      <h4>Renaming</h4>
      <p>A new folder gets the default name “New folder”, with the name highlighted. Type the new name straight away and press <kbd>Enter</kbd>. Did you click somewhere else first? Click the folder <i>once</i>, press <kbd>F2</kbd> (or right-click → Rename), type the name and press <kbd>Enter</kbd>.</p>`,
    oppdrag: [
      {
        id: 'k1o1', title: 'Open, move and close a window', lukk: 'alle',
        steps: [
          { laer: true, quiz: { q: 'What is the taskbar?', options: ['The strip at the bottom of the screen with the Start button and apps', 'The menu that appears when you right-click', 'The File Explorer window'], answer: 0 } },
          { laer: true, quiz: { q: 'What does the — (minimise) button at the top of a window do?', options: ['Closes the app', 'Hides the window in the taskbar, the app is still open', 'Makes the window bigger'], answer: 1 } },
          { laer: true, quiz: { q: 'How do you move a window?', options: ['Double-click ✕', 'Press Enter', 'Drag the title bar at the top of the window'], answer: 2 } },
          { text: 'Click the yellow folder icon (<b>File Explorer</b>) on the taskbar at the bottom of the screen.', hint: 'The taskbar is the light strip right at the bottom. File Explorer is the yellow folder next to the Start button.', check: S => S.ev('window-open', d => d.app === 'explorer') },
          { text: 'Maximise the window: click <b>☐</b> in the top right corner of the window.', hint: 'The middle one of the three buttons in the top right corner of the window. You can also double-click the title bar.', check: S => S.ev('window-max') },
          { text: 'Make the window smaller again: click the same button (<b>❐</b>).', check: S => S.ev('window-restore') },
          { text: 'Move the window: hold the left mouse button down on the <b>title bar</b> (the white strip at the top of the window) and drag.', hint: 'Press and hold on the title bar, move the mouse, and let go.', check: S => S.ev('window-move') },
          { text: 'Minimise the window with <b>—</b>. The window disappears, but the app is still open: look at the line under the icon on the taskbar.', check: S => S.ev('window-min') },
          { text: 'Bring the window back by clicking the File Explorer icon on the taskbar.', check: S => S.ev('window-focus', d => d.app === 'explorer') },
          { text: 'Close the window with <b>✕</b>.', check: S => S.ev('window-close', d => d.app === 'explorer') }
        ]
      },
      {
        id: 'k1o2', title: 'The Start menu and more apps', lukk: 'alle',
        steps: [
          { text: 'Click the <b>Start button</b> (the Windows logo) on the taskbar.', hint: 'The blue square with four panes, furthest to the left among the icons on the taskbar.', check: S => S.ev('startmenu-open') },
          { text: 'Open the <b>Write</b> app from the Start menu.', check: S => S.ev('window-open', d => d.app === 'skriv' && d.via === 'startmenu') },
          { text: 'Also open <b>Browser</b> from the taskbar. Now you have two apps open at the same time.', check: S => S.ev('window-open', d => d.app === 'nettleser') },
          { text: 'Switch back to Write by clicking the Write icon on the <b>taskbar</b>.', hint: 'Click the blue Write icon at the bottom. Apps that are open have a line under them.', check: S => S.ev('window-focus', d => d.app === 'skriv' && d.via === 'taskbar') },
          { text: 'Close both apps with <b>✕</b>.', check: S => S.wins('skriv') === 0 && S.wins('nettleser') === 0 && S.ev('window-close') },
          { quiz: { q: 'What does it mean when an icon on the taskbar has a line under it?', options: ['The app is open', 'The app has been deleted', 'The app needs updating'], answer: 0 }, hint: 'Look at the taskbar when you have an app open.' }
        ]
      },
      {
        id: 'k1o3', title: 'Right-click and double-click', lukk: 'alle',
        setup: F => { const f = F.resolve([...P_DESK, 'My folder']); if (f) F.silentRemoveAll('My folder'); },
        steps: [
          { text: 'Right-click an empty spot on the <b>desktop</b> (the background). A menu pops up.', hint: 'Use the right mouse button. On the touchpad: tap with two fingers at the same time.', check: S => S.ev('ctxmenu', d => d.where === 'desktop') },
          { text: 'Choose <b>New → Folder</b> in the menu. A folder called “New folder” appears on the desktop.', hint: 'Hold the mouse over “New” and a submenu appears to the right. Click “Folder”.', check: S => S.ev('fs', d => d.op === 'create' && d.kind === 'folder' && d.parent === FS.roots().desktop) || FS.children(FS.roots().desktop).some(c => c.type === 'folder') },
          { text: 'Name the folder <b>My folder</b>. Right after the folder has been made, you can just type the name and press <kbd>Enter</kbd>. Too late for that? Click the folder <i>once</i>, press <kbd>F2</kbd>, type the name and press <kbd>Enter</kbd>.', hint: 'F2 is at the top of the keyboard. You can also right-click the folder and choose “Rename”. The folder is called “New folder” until you have changed the name.', check: S => S.folderIn('My folder', P_DESK) },
          { text: '<b>Double-click</b> the folder “My folder” on the desktop to open it.', hint: 'Two quick presses with the left mouse button.', check: S => S.ev('explorer-nav', d => d.name === 'My folder') },
          { text: 'The folder is empty. Close the window.', check: S => S.ev('window-close', d => d.app === 'explorer') },
          { quiz: { q: 'You want to see more options for a file. What do you do?', options: ['Hold the mouse still over the file', 'Right-click the file', 'Double-click the file'], answer: 1 }, hint: 'Double-clicking opens. Which button gives you a menu?' }
        ]
      },
      {
        id: 'k1o4', title: 'The right-click hunt', lukk: 'alle',
        intro: 'The menu that comes up when you right-click is different depending on what you click. On the touchpad: tap lightly with <b>two fingers at the same time</b>. You get a short message every time you open a menu.',
        steps: [
          { text: 'Right-click an empty spot on the <b>desktop</b>. Look at the menu: it is about the desktop (View, Sort by, New …).', hint: 'Touchpad: tap lightly with two fingers at the same time. Mouse: right button.', check: S => S.ev('ctxmenu', d => d.where === 'desktop') },
          { text: 'Close the menu without choosing anything: press <kbd>Esc</kbd>.', hint: 'The Esc key is in the top left corner of the keyboard.', check: S => S.ev('ctxmenu-close', d => d.via === 'esc') },
          { text: 'Right-click the <b>Recycle Bin</b> icon. The menu is different: here you\'ll find “Empty Recycle Bin”.', check: S => S.ev('ctxmenu', d => d.where === 'bin-icon') },
          { text: 'Right-click the <b>File Explorer icon</b> on the taskbar. You use menus like this to pin or unpin apps.', check: S => S.ev('ctxmenu', d => d.where === 'taskbar-app') },
          { text: 'Open File Explorer, go to <b>Documents</b> and right-click a <b>file</b>. Notice “Open with” and “Rename”.', check: S => S.ev('ctxmenu', d => d.where === 'file') },
          { text: 'Right-click a <b>folder</b>. Look for “Open in new window”, which files don\'t have.', hint: 'The folder “Old” (or “Year 7”) is in Documents.', check: S => S.ev('ctxmenu', d => d.where === 'folder') },
          { text: 'Right-click an <b>empty spot</b> inside the folder. This menu has “New” and “Paste”.', check: S => S.ev('ctxmenu', d => d.where === 'explorer') },
          { text: 'Right-click the <b>title bar</b> at the top of the window, and choose <b>Close</b> in the menu.', hint: 'The title bar is the white strip with the folder name, right at the top of the window.', check: S => S.ev('window-close', d => d.via === 'menu') },
          { quiz: { q: 'You right-click a file and then an empty spot in the folder. Do you get the same menu?', options: ['Yes, always the same menu', 'No, the menu depends on what you right-click', 'Only if the file is selected'], answer: 1 } },
          { quiz: { q: 'How do you right-click on the touchpad of a laptop?', options: ['Double-tap with one finger', 'Hold one finger down for a long time', 'Tap lightly with two fingers at the same time'], answer: 2 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k2', title: 'Files and folders', laerTitle: 'what files and folders are',
    desc: 'Find your way around File Explorer, make folders and choose good names.',
    laer: `
      <h4>File and folder</h4>
      <p>A <b>file</b> is a document, a picture, a video, a presentation: everything you save is a file. Every file has a name and a <b>file type</b> (the extension after the full stop, for example <b>.docx</b>).</p>
      <p>A <b>folder</b> is a container for files and other folders, like a ring binder on a shelf. Folders inside folders are called <b>subfolders</b>.</p>
      <h4>File Explorer</h4>
      <p><b>File Explorer</b> is the app you use to see, move and tidy up files. On the left you see the most important folders. The <b>address bar</b> at the top shows where you are:
      “This PC › Documents › Norwegian” means that the folder Norwegian is inside Documents.</p>
      <table><tr><th>Folder</th><th>Used for</th></tr>
      <tr><td>Desktop</td><td>What you see on the screen. Don't save important things here.</td></tr>
      <tr><td>Documents</td><td>Documents that are only on this PC</td></tr>
      <tr><td>Downloads</td><td>Files you get from the internet end up here</td></tr>
      <tr><td>Pictures</td><td>Pictures and screenshots</td></tr>
      <tr><td><b>OneDrive</b></td><td>Cloud storage: safe, and available on all your devices. <b>Save schoolwork here.</b></td></tr></table>
      <p>The <b>←</b> (back) and <b>↑</b> (up one level) buttons help you get around.</p>`,
    oppdrag: [
      {
        id: 'k2o1', title: 'Find your way around File Explorer',
        setup: F => { F.ensureFolder([...P_DOC, 'Old', 'Projects']); },
        steps: [
          { laer: true, quiz: { q: 'What is a file type (file extension)?', options: ['The folder the file is in', 'The part of the name after the full stop, for example .docx, which tells you what kind of file it is', 'How big the file is'], answer: 1 } },
          { laer: true, quiz: { q: 'Where should schoolwork be saved?', options: ['In OneDrive: cloud storage that follows you on all your devices', 'On the desktop', 'In Downloads'], answer: 0 } },
          { laer: true, quiz: { q: 'What does the ↑ (Up) button in File Explorer do?', options: ['Scrolls up the list', 'Goes to the previous page', 'Goes to the folder above the one you are in'], answer: 2 } },
          { text: 'Open <b>File Explorer</b>.', check: S => S.wins('explorer') > 0 && S.ev('window-open', d => d.app === 'explorer') },
          { text: 'Click <b>Documents</b> in the menu on the left.', check: S => S.ev('explorer-nav', d => d.name === 'Documents') },
          { text: 'Open the folder <b>Old</b> (double-click it).', hint: 'If you can\'t see the folder “Old”, it may be called “Year 7” because you renamed it earlier.', check: S => S.ev('explorer-nav', d => d.name === 'Old' || d.name === 'Year 7') },
          { text: 'Look at the <b>address bar</b> at the top. It shows: This PC › Documents › Old. Now open the folder <b>Projects</b>.', check: S => S.ev('explorer-nav', d => d.name === 'Projects') },
          { text: 'Go one level <b>up</b> with the <b>↑</b> button. That takes you back to the folder that Projects is in.', hint: 'The up arrow button is next to the address bar.', check: S => S.ev('explorer-up') },
          { text: 'Click <b>←</b> (Back) to go to the previous place you were.', check: S => S.ev('explorer-back') },
          { text: 'Click <b>Pictures</b> in the menu on the left.', check: S => S.ev('explorer-nav', d => d.name === 'Pictures') },
          { quiz: { q: 'The address bar shows: This PC › Documents › Old › Projects. Which folder is inside Old?', options: ['Documents', 'This PC', 'Projects'], answer: 2 }, hint: 'Read the address from left to right. Each folder is inside the one to its left.' },
          { quiz: { q: 'What is the difference between a file and a folder?', options: ['A folder can contain files and other folders. A file is the document, picture or video itself.', 'A file can contain folders.', 'They are the same thing, just different icons.'], answer: 0 } }
        ]
      },
      {
        id: 'k2o2', title: 'Make folders for your subjects',
        steps: [
          { text: 'Go to <b>OneDrive › School</b> in File Explorer.', hint: 'Click ▸ next to OneDrive in the menu on the left to show its folders, or double-click your way there.', check: S => S.ev('explorer-nav', d => d.name === 'School') },
          { text: 'Make a new folder called <b>Norwegian</b>. Use the <b>New</b> button at the top, or right-click an empty spot → New → Folder. Type the name and press <kbd>Enter</kbd>.', hint: 'The new folder is called “New folder” and the name is highlighted. Just type “Norwegian” and press Enter. Did you click somewhere else before typing the name? Click the folder once, press F2, type the name and press Enter.', check: S => S.folderIn('Norwegian', P_SK) },
          { text: 'Make three more folders: <b>Maths</b>, <b>English</b> and <b>Science</b>.', check: S => S.folderIn('Maths', P_SK) && S.folderIn('English', P_SK) && S.folderIn('Science', P_SK) },
          { text: 'Open the folder <b>Norwegian</b> and make a folder <i>inside</i> it called <b>Poems</b>.', check: S => S.folderIn('Poems', P_NORSK) },
          { text: 'Go into the folder <b>Poems</b>. The address bar should now show OneDrive › School › Norwegian › Poems.', check: S => S.ev('explorer-nav', d => d.name === 'Poems') },
          { quiz: { q: 'Where is the folder Poems?', options: ['Directly in OneDrive', 'Inside Norwegian, which is inside School in OneDrive', 'On the desktop'], answer: 1 } }
        ]
      },
      {
        id: 'k2o3', title: 'Renaming',
        setup: F => {
          const f = F.findByName('Poem-analysis.docx', 'file'); if (f) F.silentRename(f.id, 'Document (3).docx');
          F.ensureFileAt(P_DOC, 'Document (3).docx', 'Analysis of the poem "Northern Lights"\n\nThe poem is about the light that dances across the sky in winter. The poet uses a lot of imagery ...');
          const g = F.resolve([...P_DOC, 'Year 7']); if (g) F.silentRename(g.id, 'Old');
          F.ensureFolder([...P_DOC, 'Old']);
        },
        steps: [
          { text: 'Go to <b>Documents</b>. There is a file there called “Document (3)”. That is a bad name: you can\'t tell what the file contains.', check: S => S.ev('explorer-nav', d => d.name === 'Documents') },
          { text: 'Open the file (double-click) to see what it contains. Close it afterwards.', check: S => S.ev('open-file', d => d.name === 'Document (3).docx') },
          { text: 'Rename the file: click the file <i>once</i>, press <kbd>F2</kbd> (or right-click → Rename). Type <b>Poem-analysis</b> and press <kbd>Enter</kbd>.', hint: 'F2 is at the top of the keyboard. After that you can just type the new name straight in.', check: S => S.file('Poem-analysis.docx') && !S.file('Document (3).docx') },
          { text: 'Rename the folder <b>Old</b> to <b>Year 7</b>.', check: S => S.folderIn('Year 7', P_DOC) },
          { quiz: { q: 'Which file name is best?', options: ['asdfgh.docx', 'Document (3).docx', 'Norwegian-poem-analysis-Northern-Lights.docx'], answer: 2 }, hint: 'A good name tells you what the file contains.' }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k3', title: 'Moving, copying and deleting', laerTitle: 'moving, copying and deleting',
    desc: 'Drag and drop, cut and paste, the Recycle Bin and undo.',
    laer: `
      <h4>Move or copy?</h4>
      <p><b>Move</b>: the file disappears from where it was and ends up in the new folder. <b>Copy</b>: you get two identical files.</p>
      <table><tr><th>You want to</th><th>How to do it</th></tr>
      <tr><td>Move</td><td>Drag the file to a folder, <i>or</i> Cut (<kbd>Ctrl</kbd>+<kbd>X</kbd>) and Paste (<kbd>Ctrl</kbd>+<kbd>V</kbd>) in the new folder</td></tr>
      <tr><td>Copy</td><td>Copy (<kbd>Ctrl</kbd>+<kbd>C</kbd>) and Paste (<kbd>Ctrl</kbd>+<kbd>V</kbd>)</td></tr>
      <tr><td>Delete</td><td>Select the file and press <kbd>Delete</kbd>. The file ends up in the <b>Recycle Bin</b>.</td></tr>
      <tr><td>Undo</td><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> undoes the last thing you did</td></tr></table>
      <p>Files in the Recycle Bin can be <b>restored</b>. If you empty the Recycle Bin, the files are gone for good.</p>
      <p>The <b>Ctrl</b> key is in the bottom left corner of the keyboard. Hold it down while you press the letter.</p>`,
    oppdrag: [
      {
        id: 'k3o1', title: 'Drag and drop',
        setup: F => { F.ensureFolder(P_NORSK); F.ensureFileAt(P_DOC, 'Poem-analysis.docx', 'Analysis of the poem "Northern Lights"\n\nThe poem is about the light that dances across the sky in winter.'); },
        steps: [
          { laer: true, quiz: { q: 'What is the difference between moving and copying a file?', options: ['Move: the file is only in the new place. Copy: you get two identical files', 'They are the same', 'Copying deletes the original'], answer: 0 } },
          { laer: true, quiz: { q: 'Which shortcut pastes?', options: ['Ctrl+C', 'Ctrl+X', 'Ctrl+V'], answer: 2 } },
          { laer: true, quiz: { q: 'What happens when you empty the Recycle Bin?', options: ['The files are moved to Documents', 'The files are gone for good', 'Nothing'], answer: 1 } },
          { text: 'Open File Explorer and go to <b>Documents</b>.', check: S => S.ev('explorer-nav', d => d.name === 'Documents') },
          { text: 'Drag the file <b>Poem-analysis</b> to the folder <b>Norwegian</b>: hold the left mouse button down on the file, drag it to OneDrive › School › Norwegian in the menu on the left, and let go.', hint: 'Click ▸ next to OneDrive and School in the menu on the left, and you\'ll see Norwegian there. Drag the file there until the folder is highlighted, and let go.', check: S => S.fileInNamed('Poem-analysis.docx', 'Norwegian') },
          { text: 'Go to the folder <b>Norwegian</b> and check that the file is there.', check: S => S.ev('explorer-nav', d => /norwegian/i.test(d.name)) },
          { quiz: { q: 'When you drag a file to another folder on the same PC, what happens?', options: ['The file is moved: it is only in the new folder', 'The file is copied: you get two', 'The file is deleted'], answer: 0 } }
        ]
      },
      {
        id: 'k3o2', title: 'Cut and paste',
        setup: F => { F.ensureFolder(P_NAT); F.ensureFileAt(P_DOC, 'Photosynthesis.pptx', 'Photosynthesis\nPlants make sugar from light, water and CO2.'); },
        steps: [
          { text: 'Go to <b>Documents</b> and click <b>Photosynthesis</b> <i>once</i> to select it.', check: S => S.ev('select', d => d.names.includes('Photosynthesis.pptx')) },
          { text: 'Right-click the file and choose <b>Cut</b> (or press <kbd>Ctrl</kbd>+<kbd>X</kbd>). The file becomes a bit see-through.', check: S => S.ev('cut', d => d.names.includes('Photosynthesis.pptx')) },
          { text: 'Go to <b>OneDrive › School › Science</b>.', hint: 'If you have made your own Science folder somewhere else, you can use that.', check: S => S.ev('explorer-nav', d => /science/i.test(d.name)) },
          { text: 'Right-click an empty spot and choose <b>Paste</b> (or press <kbd>Ctrl</kbd>+<kbd>V</kbd>).', check: S => S.fileInNamed('Photosynthesis.pptx', 'Science') }
        ]
      },
      {
        id: 'k3o3', title: 'Copy a file',
        setup: F => { F.ensureFileAt(P_PIC, 'Class-photo.jpg'); const c = F.resolve([...P_DESK, 'Class-photo.jpg']); if (c) F.purge(c.id); },
        steps: [
          { text: 'Go to <b>Pictures</b> and select <b>Class-photo</b>.', check: S => S.ev('select', d => d.names.includes('Class-photo.jpg')) },
          { text: 'Copy the file: press <kbd>Ctrl</kbd>+<kbd>C</kbd> (or right-click → Copy).', check: S => S.ev('copy', d => d.names.includes('Class-photo.jpg')) },
          { text: 'Go to <b>Desktop</b> and paste with <kbd>Ctrl</kbd>+<kbd>V</kbd>.', check: S => S.fileIn('Class-photo.jpg', P_DESK) },
          { text: 'Look at the desktop behind the window: the copy is shown there! Go back to <b>Pictures</b> and check that the original is still there.', check: S => S.fileIn('Class-photo.jpg', P_PIC) && S.ev('explorer-nav', d => d.name === 'Pictures') },
          { quiz: { q: 'What is the difference between Cut and Copy?', options: ['Cut deletes the file for good', 'They are the same', 'Cut moves the file. Copy makes an extra copy.'], answer: 2 } }
        ]
      },
      {
        id: 'k3o4', title: 'Keyboard shortcuts and undo',
        setup: F => { F.ensureFolder(P_MATTE); F.ensureFileAt(P_DOC, 'Maths-test.pdf', 'Maths test chapter 1'); },
        steps: [
          { text: 'Go to <b>Documents</b> and select <b>Maths-test</b>.', check: S => S.ev('select', d => d.names.includes('Maths-test.pdf')) },
          { text: 'Press <kbd>Ctrl</kbd>+<kbd>X</kbd> on the keyboard (hold Ctrl down and press X).', hint: 'Ctrl is in the bottom left corner of the keyboard. Click the file first, so the window is “listening” to the keyboard.', check: S => S.ev('shortcut', d => d.key === 'x' && d.app === 'explorer') },
          { text: 'Go to <b>OneDrive › School › Maths</b> and press <kbd>Ctrl</kbd>+<kbd>V</kbd>.', hint: 'Click an empty spot in the folder before you press Ctrl+V.', check: S => S.fileInNamed('Maths-test.pdf', 'Maths') && S.ev('shortcut', d => d.key === 'v') },
          { text: 'Try undoing: press <kbd>Ctrl</kbd>+<kbd>Z</kbd>. The file moves back to Documents!', check: S => S.ev('shortcut', d => d.key === 'z') && S.fileIn('Maths-test.pdf', P_DOC) },
          { text: 'Move it to <b>Maths</b> again (<kbd>Ctrl</kbd>+<kbd>X</kbd>, go to Maths, <kbd>Ctrl</kbd>+<kbd>V</kbd>).', check: S => S.fileInNamed('Maths-test.pdf', 'Maths') }
        ]
      },
      {
        id: 'k3o5', title: 'Delete and restore',
        setup: F => { F.ensureFileAt(P_DOC, 'old-list.txt', 'milk\nbread\ncheese\napples'); },
        steps: [
          { text: 'Go to <b>Documents</b>, select <b>old-list</b> and press <kbd>Delete</kbd> (or right-click → Delete).', hint: 'The Delete key is above the arrow keys, or in the top right corner on small keyboards.', check: S => S.inBin('old-list.txt') },
          { text: 'Open the <b>Recycle Bin</b>: double-click its icon on the desktop, or click Recycle Bin at the bottom of the menu on the left.', check: S => S.ev('explorer-nav', d => d.name === 'Recycle Bin') },
          { text: 'Select the file and click <b>Restore</b> (or right-click → Restore). The file goes back to Documents.', check: S => S.fileIn('old-list.txt', P_DOC) && S.ev('fs', d => d.op === 'restore') },
          { text: 'Delete the file again.', check: S => S.inBin('old-list.txt') },
          { text: '<b>Empty the Recycle Bin</b> (the button at the top of the Recycle Bin, or right-click an empty spot). Now the file is gone for good.', check: S => S.gone('old-list.txt') && S.ev('fs', d => d.op === 'empty-bin') },
          { quiz: { q: 'You deleted the wrong file by accident. What do you do?', options: ['Nothing, it is gone for good', 'Open the Recycle Bin and restore the file', 'Make the file again'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k4', title: 'Saving and opening documents', laerTitle: 'saving, file names and file types',
    desc: 'Save, Save As, Ctrl+S, file types and file extensions.',
    laer: `
      <h4>Save and Save As</h4>
      <p>The first time you save a document, you have to choose <b>where</b> it goes and <b>what</b> it is called. That is called <b>Save As</b>. After that, <kbd>Ctrl</kbd>+<kbd>S</kbd> saves into the same file without asking.</p>
      <p>Always save schoolwork in <b>OneDrive › School › the right subject</b>. An asterisk <b>*</b> in the title bar means you have changes that haven't been saved.</p>
      <h4>File types</h4>
      <p>The extension after the full stop tells you what kind of file it is and which app opens it. Windows hides the extensions by default. Turn on <b>File name extensions</b> in the View menu to see them.</p>
      <table><tr><th>Extension</th><th>Type</th><th>App</th></tr>
      <tr><td>.docx</td><td>Text document</td><td>Word</td></tr>
      <tr><td>.pptx</td><td>Presentation</td><td>PowerPoint</td></tr>
      <tr><td>.xlsx</td><td>Spreadsheet</td><td>Excel</td></tr>
      <tr><td>.pdf</td><td>Finished document, looks the same everywhere</td><td>Edge / PDF reader</td></tr>
      <tr><td>.jpg / .png</td><td>Picture</td><td>Photos</td></tr>
      <tr><td>.mp4</td><td>Video</td><td>Films &amp; TV</td></tr>
      <tr><td>.txt</td><td>Plain text</td><td>Notepad</td></tr>
      <tr><td>.zip</td><td>Compressed folder with several files</td><td>File Explorer (extract)</td></tr></table>`,
    oppdrag: [
      {
        id: 'k4o1', title: 'Write and save a document', lukk: ['skriv'],
        setup: F => { F.ensureFolder(P_NORSK); F.silentRemoveAll('My first document.docx'); F.silentRemoveAll('My first document.txt'); },
        steps: [
          { laer: true, quiz: { q: 'What is the difference between Save and Save As?', options: ['They are the same', 'Save As lets you choose the place and name. Save saves into the same file as before', 'Save As makes a shortcut'], answer: 1 } },
          { laer: true, quiz: { q: 'What does an asterisk * in an app\'s title bar mean?', options: ['The file is big', 'The file is shared with others', 'There are changes that haven\'t been saved'], answer: 2 } },
          { laer: true, quiz: { q: 'Which file type belongs to PowerPoint?', options: ['.docx', '.xlsx', '.pptx'], answer: 2 } },
          { text: 'Open the <b>Write</b> app (taskbar or Start menu).', check: S => S.ev('window-open', d => d.app === 'skriv') },
          { text: 'Write at least one sentence about what you like doing in your free time.', check: S => S.editorText().trim().length >= 20 },
          { text: 'Click <b>Save</b> (or press <kbd>Ctrl</kbd>+<kbd>S</kbd>). In the window that comes up: choose <b>OneDrive › School › Norwegian</b> on the left, type the file name <b>My first document</b> and click Save.<br><i>Saved in the wrong place or with the wrong name? Click <b>Save As</b> and save again. Plain Save only saves into the same file again.</i>', hint: 'Click ▸ next to OneDrive in the menu on the left of the window, then School, then Norwegian. Check that the address bar at the top shows OneDrive › School › Norwegian before you click Save. Have you already saved somewhere else? Once a document has a name, Save doesn\'t ask where you want to save it. Use <b>Save As</b> in the menu at the top of Write to choose the folder and name again.', check: S => S.fileInNamed('My first document.docx', 'Norwegian') },
          { text: 'Look at the title bar in Write: now the file name is there. Write a bit more text.', check: S => S.ev('editor-input') },
          { text: 'Press <kbd>Ctrl</kbd>+<kbd>S</kbd> to save the changes. This time the PC doesn\'t ask where, it saves into the same file.', check: S => S.ev('save', d => d.via === 'shortcut' && !d.isNew) },
          { text: 'Close Write.', check: S => S.ev('window-close', d => d.app === 'skriv') }
        ]
      },
      {
        id: 'k4o2', title: 'Open the document again', lukk: ['skriv'],
        setup: F => { F.ensureFile(P_NORSK, 'My first document.docx', 'In my free time I like to ...'); },
        steps: [
          { text: 'Open File Explorer and go to the folder <b>Norwegian</b> (in OneDrive › School, or wherever you saved the document).', check: S => S.ev('explorer-nav', d => /norwegian/i.test(d.name)) },
          { text: 'Double-click <b>My first document</b> to open it in Write.', check: S => S.ev('open-file', d => d.name === 'My first document.docx') },
          { text: 'Write a new line, and save with <kbd>Ctrl</kbd>+<kbd>S</kbd>.', check: S => S.ev('save', d => d.via === 'shortcut') },
          { text: 'Close Write. Notice that it doesn\'t ask about saving, because everything is already saved.', check: S => S.ev('window-close', d => d.app === 'skriv') }
        ]
      },
      {
        id: 'k4o3', title: 'File types and file extensions',
        setup: F => { F.silentRemoveAll('Reminders.txt'); },
        steps: [
          { text: 'Open File Explorer, click the <b>View</b> menu and turn on <b>File name extensions</b>. Now you see .docx, .pdf and so on after the file names.', hint: 'The View button is on the far right of the toolbar at the top of File Explorer.', check: S => S.ev('show-ext', d => d.on) },
          { text: 'Go to <b>Documents</b> and look at the file extensions of the files there.', check: S => S.ev('explorer-nav', d => d.name === 'Documents') },
          { quiz: { q: 'A file is called “Report.docx”. Which app opens it?', options: ['Word', 'PowerPoint', 'Excel'], answer: 0 } },
          { quiz: { q: '“Talk.pptx” is ...', options: ['a spreadsheet', 'a presentation (PowerPoint)', 'a picture'], answer: 1 } },
          { quiz: { q: '“Budget.xlsx” opens in ...', options: ['Photos', 'Word', 'Excel'], answer: 2 } },
          { quiz: { q: '“IMG_2031.jpg” is ...', options: ['a picture', 'a video clip', 'a text document'], answer: 0 } },
          { quiz: { q: 'What is special about a PDF file?', options: ['It can only be opened on an iPad', 'It is always a picture', 'It looks the same on every device and usually can\'t be edited'], answer: 2 } },
          { text: 'Right-click an empty spot on the <b>desktop</b> and choose <b>New → Text Document</b>. Call it <b>Reminders</b>.', hint: 'The .txt extension is added automatically, you just type “Reminders”.', check: S => S.fileIn('Reminders.txt', P_DESK) },
          { text: 'Open <b>Reminders</b> (double-click), write three things you need to remember, and save with <kbd>Ctrl</kbd>+<kbd>S</kbd>.', check: S => S.content('Reminders.txt').trim().length > 5 && S.ev('save', d => d.name === 'Reminders.txt') }
        ]
      },
      {
        id: 'k4o4', title: 'Unsaved changes', lukk: ['skriv'],
        setup: F => { F.silentRemoveAll('Note.docx'); },
        steps: [
          { text: 'Open <b>Write</b> and type a few words.', check: S => S.wins('skriv') > 0 && S.ev('editor-input') },
          { text: 'Try closing Write with <b>✕</b> without saving. Write asks: “Do you want to save your changes?” Choose <b>Save</b>.', check: S => S.ev('save-dialog', d => d.choice === 'save') },
          { text: 'Save the file in <b>Documents</b> with the name <b>Note</b>.', check: S => S.fileIn('Note.docx', P_DOC) },
          { quiz: { q: 'The title bar shows “*Report.docx - Write”. What does the asterisk mean?', options: ['The file is important', 'There are changes that haven\'t been saved', 'The file is read-only'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'kf', title: 'Formatting text', laerTitle: 'font, size and bold/italic/underline',
    desc: 'Font, size, bold, italic, underline, headings, lists and alignment in Write.',
    laer: `
      <h4>Select first, format afterwards</h4>
      <p>Formatting works on the text you have <b>selected</b>. Drag over the text with the mouse (or hold <kbd>Shift</kbd> down and use the arrow keys), and then press the button. If you click a button without selecting anything, it applies to what you type next.</p>
      <h4>Font</h4>
      <p>A <b>font</b> is how the letters look. <span style="font-family:Calibri,sans-serif">Calibri</span> and <span style="font-family:Arial,sans-serif">Arial</span> are simple and easy to read. <span style="font-family:'Times New Roman',serif">Times New Roman</span> has little “feet” on the letters and is often used in books. <span style="font-family:'Comic Sans MS',cursive">Comic Sans</span> looks informal and isn't right for schoolwork. Use one font in the whole document.</p>
      <h4>Size</h4>
      <p>Font size is measured in <b>points</b> (pt). Normal text is <b>11 or 12 pt</b>. Headings are bigger, for example 16 to 20 pt. Don't use big text to fill pages.</p>
      <table><tr><th>Button</th><th>Shortcut</th><th>Used for</th></tr>
      <tr><td><b>Bold</b></td><td><kbd>Ctrl</kbd>+<kbd>B</kbd></td><td>Making important words and headings stand out</td></tr>
      <tr><td><i>Italic</i></td><td><kbd>Ctrl</kbd>+<kbd>I</kbd></td><td>Titles of books and films, foreign words, quotes</td></tr>
      <tr><td><u>Underline</u></td><td><kbd>Ctrl</kbd>+<kbd>U</kbd></td><td>Rarely used today, because it looks like a link</td></tr></table>
      <h4>Headings, lists and alignment</h4>
      <p><b>Styles</b> such as “Heading 1” give headings the right size and colour automatically, so the document is tidy and consistent all the way through. <b>Bullets</b> and <b>numbering</b> are used for lists. <b>Alignment</b> decides whether the text sits on the left (normal), in the centre (titles) or on the right.</p>`,
    oppdrag: [
      {
        id: 'kfo1', title: 'Bold, italic and underline', lukk: ['skriv'],
        setup: F => { F.ensureFolder(P_NORSK); F.silentRemoveAll('Formatting.docx'); },
        steps: [
          { laer: true, quiz: { q: 'What is a font?', options: ['How big the text is', 'How the letters look, for example Calibri or Arial', 'The colour of the text'], answer: 1 } },
          { laer: true, quiz: { q: 'Which size is right for normal text in a school assignment?', options: ['11 or 12 pt', '24 pt', '6 pt'], answer: 0 } },
          { laer: true, quiz: { q: 'You want to make a word bold. What do you do first?', options: ['Press Ctrl+B and type the word again', 'Delete the word', 'Select the word'], answer: 2 } },
          { text: 'Open <b>Write</b> and write three short sentences about your favourite book or film. Include the title.', check: S => S.wins('skriv') > 0 && S.editorText().trim().length >= 30 },
          { text: 'Select an important word (drag over it with the mouse) and make it <b>bold</b> with <kbd>Ctrl</kbd>+<kbd>B</kbd> or the <b>B</b> button.', hint: 'Hold the left mouse button down at the start of the word, drag to the end and let go. The word turns blue. Then press Ctrl+B.', check: S => S.skriv().bold },
          { text: 'Select the title of the book or film and make it <i>italic</i> (<kbd>Ctrl</kbd>+<kbd>I</kbd>).', check: S => S.skriv().italic },
          { text: 'Select something else and <u>underline</u> it (<kbd>Ctrl</kbd>+<kbd>U</kbd>). See how it looks like a link. Remove the underline again: select the text and press <kbd>Ctrl</kbd>+<kbd>U</kbd> once more.', hint: 'The same button turns the formatting on and off.', check: S => S.evCount('format', d => d.cmd === 'underline') >= 2 && !S.skriv().underline },
          { text: 'Save the document as <b>Formatting</b> in <b>OneDrive › School › Norwegian</b>.', check: S => S.fileInNamed('Formatting.docx', 'Norwegian') },
          { quiz: { q: 'What do you use italics for?', options: ['Everything that is important', 'Titles of books and films, foreign words and quotes', 'Headings'], answer: 1 } }
        ]
      },
      {
        id: 'kfo2', title: 'Font and size', lukk: ['skriv'],
        setup: F => { F.ensureFolder(P_NORSK); F.ensureFile(P_NORSK, 'Formatting.docx', 'My favourite film\nI like the film because it is exciting.\nIt is about a boy who finds a map.'); },
        steps: [
          { text: 'Open <b>Formatting</b> from OneDrive › School › Norwegian (double-click in File Explorer, or Open in Write). Make sure the first line is a short heading, for example “My favourite film”.', check: S => S.wins('skriv') > 0 && S.editorText().trim().split('\n').length >= 2 },
          { text: 'Select the heading (the first line) and set the size to <b>20</b> in the size menu.', hint: 'Drag over the whole first line with the mouse, or click in the line and press Shift+End. Then choose 20 in the menu next to the font.', check: S => S.skriv().sizes.some(s => s >= 18) },
          { text: 'Select all the text with <kbd>Ctrl</kbd>+<kbd>A</kbd> and choose the font <b>Arial</b>.', check: S => S.skriv().fonts.length > 0 && S.skriv().fonts.every(f => /arial/i.test(f)) },
          { text: 'Try <b>Comic Sans MS</b> on all the text and see what it looks like. Then switch back to Arial. Comic Sans isn\'t right for schoolwork.', check: S => S.ev('format', d => d.cmd === 'fontName' && /comic/i.test(d.value)) && S.skriv().fonts.every(f => /arial|calibri/i.test(f)) },
          { text: 'Select the heading and make the text <b>blue</b> with the font colour menu.', check: S => S.skriv().colors.some(c => /rgb\(0, 112, 192\)/.test(c)) },
          { text: 'Save with <kbd>Ctrl</kbd>+<kbd>S</kbd>.', check: S => S.ev('save', d => d.via === 'shortcut') },
          { quiz: { q: 'Which font is least suitable for a school assignment?', options: ['Calibri', 'Arial', 'Comic Sans MS'], answer: 2 } },
          { quiz: { q: 'The heading is 20 pt and the rest is 11 pt. What does pt mean?', options: ['Points, the unit for font size', 'Per cent', 'Number of letters'], answer: 0 } }
        ]
      },
      {
        id: 'kfo3', title: 'Headings, lists and alignment', lukk: ['skriv'],
        setup: F => { F.ensureFolder(P_NORSK); F.silentRemoveAll('Weekly-plan.docx'); },
        steps: [
          { text: 'Open a new document in Write (<b>New</b>). Type “Weekly plan” on the first line. Click in the line and choose the style <b>Heading 1</b> in the style menu.', hint: 'The style menu is the one that says “Normal”, between the colour and the alignment buttons.', check: S => S.skriv().headings.includes('h1') },
          { text: 'Press <kbd>Enter</kbd>, type “Monday” and give the line the style <b>Heading 2</b>.', check: S => S.skriv().headings.includes('h2') },
          { text: 'Press <kbd>Enter</kbd>, set the style back to <b>Normal</b>, and make a <b>bulleted list</b> with at least three things you are going to do on Monday: click the Bullets button and write one item per line.', hint: 'The Bullets button is the one with three dots and lines. Enter gives you a new bullet.', check: S => S.skriv().lists.includes('ul') && S.skriv().listItems >= 3 },
          { text: 'Write your name on a line of its own at the bottom (press Enter twice to end the list), and <b>centre</b> the line.', check: S => S.skriv().aligns.includes('center') },
          { text: 'Save as <b>Weekly-plan</b> in <b>OneDrive › School › Norwegian</b>.', check: S => S.fileInNamed('Weekly-plan.docx', 'Norwegian') },
          { quiz: { q: 'Why use the Heading 1 style instead of just choosing big text?', options: ['It is the same thing', 'Because it is quicker to type', 'The headings are consistent and tidy, and the app knows it is a heading'], answer: 2 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k5', title: 'Downloads and the internet', laerTitle: 'downloads',
    desc: 'Where do files you download end up, and what do you do with them?',
    laer: `
      <h4>The Downloads folder</h4>
      <p>When you download something from the internet, the file ends up in the <b>Downloads</b> folder (unless you choose something else). The browser shows a small message in the top right with the buttons <b>Open file</b> and <b>Show in folder</b>.</p>
      <p><b>Downloads is not a place to keep things.</b> Move files you are going to use to the right folder in OneDrive, and delete the rest. Then you'll find them again later.</p>
      <p>If you open a downloaded file and write in it, remember to use <b>Save As</b> to save it in the right folder. Otherwise your work stays in Downloads.</p>`,
    oppdrag: [
      {
        id: 'k5o1', title: 'Download and move', lukk: ['nettleser'],
        setup: F => { F.ensureFolder(P_MATTE); F.silentRemoveAll('Worksheet-fractions.pdf'); },
        steps: [
          { laer: true, quiz: { q: 'Where do files you download from the internet end up, unless you choose something else?', options: ['In the Recycle Bin', 'In Downloads', 'In OneDrive'], answer: 1 } },
          { laer: true, quiz: { q: 'What does “Show in folder” in the download message do?', options: ['Opens Downloads in File Explorer with the file selected', 'Deletes the file', 'Downloads the file again'], answer: 0 } },
          { laer: true, quiz: { q: 'You open a downloaded template and write in it. What should you do?', options: ['Press Save and leave it in Downloads', 'Nothing, it saves automatically', 'Use Save As to save it in the right folder in OneDrive, so the template in Downloads is left untouched'], answer: 2 } },
          { text: 'Open <b>Browser</b> from the taskbar.', check: S => S.ev('window-open', d => d.app === 'nettleser') },
          { text: 'Click <b>Download</b> next to “Worksheet on fractions”.', check: S => S.ev('download', d => d.base === 'Worksheet-fractions.pdf') },
          { text: 'Click <b>Show in folder</b> in the download message (or open Downloads in File Explorer).', check: S => S.ev('explorer-nav', d => d.name === 'Downloads') },
          { text: 'Move <b>Worksheet-fractions</b> to <b>OneDrive › School › Maths</b> (drag it, or use <kbd>Ctrl</kbd>+<kbd>X</kbd> and <kbd>Ctrl</kbd>+<kbd>V</kbd>).', check: S => S.fileInNamed('Worksheet-fractions.pdf', 'Maths') }
        ]
      },
      {
        id: 'k5o2', title: 'Download a template and save it properly',
        setup: F => { F.ensureFolder(P_NAT); F.silentRemoveAll('Report-photosynthesis.docx'); F.silentRemoveAll('Report-template.docx'); },
        steps: [
          { text: 'In Browser: download <b>Report template</b>.', check: S => S.ev('download', d => d.base === 'Report-template.docx') },
          { text: 'Click <b>Open file</b> in the download message. The template opens in Write.', check: S => S.ev('open-file', d => d.name === 'Report-template.docx') },
          { text: 'Type a title after “Title:” in the template.', check: S => S.ev('editor-input') },
          { text: 'Choose <b>Save As</b> and save in <b>OneDrive › School › Science</b> with the name <b>Report-photosynthesis</b>. Now you have your own copy, and the template in Downloads is left untouched.', hint: 'Use the “Save As” button, not “Save”. Save would have overwritten the template in Downloads.', check: S => S.fileInNamed('Report-photosynthesis.docx', 'Science') },
          { text: 'Delete <b>Report-template</b> from Downloads. You don\'t need it any more.', check: S => !S.file('Report-template.docx') },
          { quiz: { q: 'Where do files you download from the internet end up?', options: ['In the Downloads folder', 'In OneDrive', 'On the desktop'], answer: 0 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k6', title: 'Handing in work', laerTitle: 'handing in on Teams',
    desc: 'Attach a file from OneDrive and hand it in, the way you do on Teams.',
    laer: `
      <h4>How to hand in on Teams</h4>
      <p>On Teams, assignments are under <b>Assignments</b>. You hand in by:</p>
      <ul><li>opening the assignment</li><li>clicking <b>Add work</b> and choosing your file</li><li>clicking <b>Hand in</b></li></ul>
      <p>The window where you choose the file looks like File Explorer. That's why you need to <b>know where your file is</b>! Check that it says “Handed in” afterwards.</p>
      <p>The <b>Assignments</b> app on the practice PC works the same way as Assignments on Teams.</p>`,
    oppdrag: [
      {
        id: 'k6o1', title: 'Hand in the poem analysis', lukk: ['innlevering'],
        setup: F => { F.ensureFileAt(P_NORSK, 'Poem-analysis.docx', 'Analysis of the poem "Northern Lights"'); Innlevering.reset('norsk-dikt'); },
        steps: [
          { laer: true, quiz: { q: 'In which order do you hand in on Teams?', options: ['Hand in → Add work → open the assignment', 'Open the assignment → Add work → choose the file → Hand in', 'Choose the file → delete it → Hand in'], answer: 1 } },
          { laer: true, quiz: { q: 'What does the window where you choose the file look like, and what does that mean for you?', options: ['The browser, so you need internet', 'The Recycle Bin, so the file must be deleted', 'File Explorer, so you need to know where the file is'], answer: 2 } },
          { text: 'Open <b>Assignments</b> from the taskbar.', check: S => S.ev('window-open', d => d.app === 'innlevering') },
          { text: 'Click the assignment <b>Norwegian: Poem analysis</b>.', check: S => S.ev('assignment-open', d => d.id === 'norsk-dikt') },
          { text: 'Click <b>Add work</b>. Find the file <b>Poem-analysis</b> in OneDrive › School › Norwegian, select it and click Open.', hint: 'Click ▸ next to OneDrive on the left of the window, then School, then Norwegian. Click the file and then Open (or double-click the file).', check: S => S.ev('attach', d => d.assignment === 'norsk-dikt' && d.name === 'Poem-analysis.docx') },
          { text: 'Click <b>Hand in</b>.', check: S => S.ev('submit', d => d.assignment === 'norsk-dikt') }
        ]
      },
      {
        id: 'k6o2', title: 'Hand in the fraction exercises',
        setup: F => { F.ensureFileAt(P_MATTE, 'Worksheet-fractions.pdf', 'Worksheet: Fractions'); Innlevering.reset('matte-brok'); },
        steps: [
          { text: 'Open the assignment <b>Maths: Fraction exercises</b> in Assignments.', check: S => S.ev('assignment-open', d => d.id === 'matte-brok') },
          { text: 'Add the file <b>Worksheet-fractions</b> from OneDrive › School › Maths.', check: S => S.ev('attach', d => d.assignment === 'matte-brok' && d.name === 'Worksheet-fractions.pdf') },
          { text: 'Hand it in.', check: S => S.ev('submit', d => d.assignment === 'matte-brok') },
          { quiz: { q: 'You can\'t find your file in the “Add work” window. What is most likely?', options: ['Teams is broken', 'The file is in a different folder. Check Downloads, Desktop or Documents.', 'The file doesn\'t exist any more'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k7', title: 'Tidy up and find', laerTitle: 'order, search and sorting',
    desc: 'Tidy up your files, search for files and sort them.',
    laer: `
      <h4>Keeping things tidy</h4>
      <p>Have one folder per subject in OneDrive › School, and give files names that tell you what they contain, for example <b>Science-lab-report-photosynthesis.docx</b>. Then you'll find them again, and your teacher understands what you are handing in.</p>
      <h4>Search</h4>
      <p>Type in the <b>search box</b> in the top right of File Explorer. It searches the folder you are in and all its subfolders. The <b>Location</b> column shows where the file is.</p>
      <h4>Sort and view</h4>
      <p>The <b>Details</b> view shows the date, type and size in columns. Click a column, or use the <b>Sort</b> menu, to sort. Sort by <b>Date modified</b> to find what you worked on last.</p>`,
    oppdrag: [
      {
        id: 'k7o1', title: 'Tidy up Documents',
        setup: F => {
          [P_NORSK, P_MATTE, P_ENG, P_NAT].forEach(p => F.ensureFolder(p));
          F.ensureFileAt(P_DOC, 'English-vocabulary-week-3.docx', 'Vocabulary week 3');
          F.ensureFileAt(P_DOC, 'Science-lab-report.docx', 'Lab report');
          F.ensureFileAt(P_DOC, 'Maths-exercises-ch2.pdf', 'Exercises chapter 2');
          F.ensureFileAt(P_DOC, 'Norwegian-story.docx', 'The story of the forest');
        },
        steps: [
          { laer: true, quiz: { q: 'What is a good file name for a science report about photosynthesis?', options: ['Document (7).docx', 'report.docx', 'Science-report-photosynthesis.docx'], answer: 2 } },
          { laer: true, quiz: { q: 'Where does the search box in File Explorer look?', options: ['In the folder you are in and all its subfolders', 'On the whole internet', 'Only on the desktop'], answer: 0 } },
          { laer: true, quiz: { q: 'Which view shows the date, type and size in columns?', options: ['Large icons', 'Details', 'Preview'], answer: 1 } },
          { text: 'Go to <b>Documents</b>. There are four files there that belong in the subject folders <b>OneDrive › School › English / Science / Maths / Norwegian</b>. The folders already exist.', check: S => S.ev('explorer-nav', d => d.name === 'Documents') },
          { text: 'Move <b>English-vocabulary-week-3</b> to the folder <b>English</b> in OneDrive › School.', hint: 'Drag the file to English in the menu on the left (click ▸ next to OneDrive and School first), or use Ctrl+X and Ctrl+V. If you have made your own English folder somewhere else, that is accepted too.', check: S => S.fileInNamed('English-vocabulary-week-3.docx', 'English') },
          { text: 'Move <b>Science-lab-report</b> to <b>Science</b>.', check: S => S.fileInNamed('Science-lab-report.docx', 'Science') },
          { text: 'Move <b>Maths-exercises-ch2</b> to <b>Maths</b>.', check: S => S.fileInNamed('Maths-exercises-ch2.pdf', 'Maths') },
          { text: 'Move <b>Norwegian-story</b> to <b>Norwegian</b>.', check: S => S.fileInNamed('Norwegian-story.docx', 'Norwegian') }
        ]
      },
      {
        id: 'k7o2', title: 'Search for a file',
        setup: F => { F.ensureFile([...P_DOC, 'Year 7', 'Projects', 'Class trip'], 'Class-trip-budget.xlsx', ''); },
        steps: [
          { text: 'Open File Explorer and go to <b>Documents</b>.', check: S => S.ev('explorer-nav', d => d.name === 'Documents') },
          { text: 'Somewhere deep inside the folders there is a budget. Type <b>budget</b> in the <b>search box</b> in the top right and press <kbd>Enter</kbd>.', check: S => S.ev('search', d => d.query.toLowerCase().includes('budget')) },
          { text: 'Look at the <b>Location</b> column: it shows where the file is. Double-click <b>Class-trip-budget</b> to open it.', check: S => S.ev('open-file', d => d.name === 'Class-trip-budget.xlsx') },
          { text: 'Close the window with the spreadsheet.', check: S => S.ev('window-close', d => d.app === 'viewer') },
          { quiz: { q: 'The “Location” column in the search results shows ...', options: ['how big the file is', 'who made the file', 'which folder the file is in'], answer: 2 } }
        ]
      },
      {
        id: 'k7o3', title: 'Sort and view details',
        steps: [
          { text: 'Go to <b>Documents</b> in File Explorer.', check: S => S.ev('explorer-nav', d => d.name === 'Documents') },
          { text: 'Switch to the <b>Details</b> view (View → Details). Now you see columns with date, type and size.', check: S => S.ev('view', d => d.view === 'details') },
          { text: 'Sort by <b>Type</b> (Sort → Type, or click the “Type” column heading).', check: S => S.ev('sort', d => d.by === 'type') },
          { text: 'Sort by <b>Date modified</b>.', check: S => S.ev('sort', d => d.by === 'modified') },
          { text: 'Switch back to <b>Large icons</b> if you like that better (View → Large icons), or keep Details. Click <b>Pictures</b> to carry on.', check: S => S.ev('explorer-nav', d => d.name === 'Pictures') },
          { quiz: { q: 'You want to find the file you worked on last. How do you sort?', options: ['By name', 'By date modified', 'By size'], answer: 1 } }
        ]
      },
      {
        id: 'k7o4', title: 'Good file names', lukk: ['skriv'],
        setup: F => { F.ensureFolder(P_NORSK); const f = F.findAll(c => c.type === 'file' && (c.content || '').startsWith('Book report:'))[0]; if (f) F.purge(f.id); F.ensureFileAt(P_DOC, 'Document1.docx', 'Book report: "Sophie\'s World"\n\nThe book is about Sophie, who gets mysterious letters with questions about philosophy ...'); },
        steps: [
          { text: 'Go to <b>Documents</b> and open <b>Document1</b> to see what it contains.', check: S => S.ev('open-file', d => d.name === 'Document1.docx') },
          { text: 'Close Write, and give the file a name that tells you what it contains, for example <b>Norwegian-book-report-Sophies-World</b>.', hint: 'Click the file once and press F2. The name must contain the word “book” or “report” to be accepted.', check: S => { const f = S.byContent('Book report:'); return f && !/^document/i.test(f.name) && /book|report/i.test(f.name); } },
          { text: 'Move the file to <b>OneDrive › School › Norwegian</b>.', check: S => { const f = S.byContent('Book report:'); const p = f && FS.get(f.parent); return !!p && /norwegian/i.test(p.name); } },
          { quiz: { q: 'Which file name is best for an English assignment about London?', options: ['Document12.docx', 'new.docx', 'English-London-text.docx'], answer: 2 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'k8', title: 'The keyboard', laerTitle: 'the keyboard and shortcuts',
    desc: 'Important keys, @ on a Norwegian keyboard and the most common shortcuts.',
    laer: `
      <h4>Important keys</h4>
      <table><tr><th>Key</th><th>What it does</th></tr>
      <tr><td><kbd>Shift</kbd> ⇧</td><td>Capital letter, or the character at the <i>top</i> of the key (! " # etc.)</td></tr>
      <tr><td><kbd>Ctrl</kbd></td><td>Used together with other keys for shortcuts</td></tr>
      <tr><td><kbd>AltGr</kbd></td><td>To the right of the space bar. Gives the character in the <i>bottom right</i> of the key. On a Norwegian keyboard: <b>@</b> = AltGr+2, <b>$</b> = AltGr+4, <b>{ }</b> = AltGr+7/0</td></tr>
      <tr><td><kbd>Tab</kbd> ⇥</td><td>Jump to the next field, or indent</td></tr>
      <tr><td><kbd>Esc</kbd></td><td>Cancel, close a menu</td></tr>
      <tr><td><kbd>Enter</kbd> ↵</td><td>Confirm, or new line</td></tr>
      <tr><td><kbd>Backspace</kbd> ⌫</td><td>Delete backwards</td></tr>
      <tr><td><kbd>Delete</kbd></td><td>Delete forwards, or delete a selected file</td></tr>
      <tr><td><kbd>Caps Lock</kbd></td><td>CAPITAL LETTERS. Turn it off if everything comes out in capitals!</td></tr>
      <tr><td><kbd>⊞</kbd> Windows</td><td>Opens the Start menu</td></tr></table>
      <h4>Shortcuts you should know</h4>
      <table><tr><td><kbd>Ctrl</kbd>+<kbd>C</kbd> copy</td><td><kbd>Ctrl</kbd>+<kbd>V</kbd> paste</td><td><kbd>Ctrl</kbd>+<kbd>X</kbd> cut</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>Z</kbd> undo</td><td><kbd>Ctrl</kbd>+<kbd>S</kbd> save</td><td><kbd>Ctrl</kbd>+<kbd>A</kbd> select all</td></tr>
      <tr><td><kbd>Ctrl</kbd>+<kbd>F</kbd> find</td><td><kbd>Alt</kbd>+<kbd>Tab</kbd> switch app</td><td><kbd>⊞</kbd>+<kbd>E</kbd> File Explorer</td></tr>
      <tr><td><kbd>⊞</kbd>+<kbd>D</kbd> show the desktop</td><td><kbd>⊞</kbd>+<kbd>Shift</kbd>+<kbd>S</kbd> screenshot</td><td><kbd>Ctrl</kbd>+<kbd>P</kbd> print</td></tr></table>
      <p>Some shortcuts (Alt+Tab, the Windows key) are controlled by the real PC and can't be practised here, but do try them!</p>`,
    oppdrag: [
      {
        id: 'k8o1', title: 'Type with the keyboard', lukk: ['skriv'],
        setup: F => { F.ensureFolder(P_NORSK); F.silentRemoveAll('Keyboard-practice.docx'); },
        steps: [
          { laer: true, quiz: { q: 'Which key gives a capital letter, or the character at the top of a key?', options: ['Shift', 'Ctrl', 'Tab'], answer: 0 } },
          { laer: true, quiz: { q: 'What does Caps Lock do?', options: ['Deletes a character', 'Turns on CAPITAL LETTERS until you turn it off again', 'Saves the document'], answer: 1 } },
          { laer: true, quiz: { q: 'What does the Tab key do in a form?', options: ['Makes a capital letter', 'Clears the field', 'Jumps to the next field'], answer: 2 } },
          { text: 'Open <b>Write</b>.', check: S => S.ev('window-open', d => d.app === 'skriv') },
          { text: 'Type the sentence: <b>I am learning to use a PC!</b> (with a capital I, capital PC and an exclamation mark). <kbd>Shift</kbd> gives a capital letter and the character at the top of the key.', hint: 'The exclamation mark is on the 1 key: hold Shift and press 1.', check: S => S.editorText().includes('I am learning to use a PC!') },
          { text: 'Press <kbd>Enter</kbd> for a new line, and type an email address, for example <b>test@school.no</b>. On a Norwegian keyboard you type the at sign (@) with <kbd>AltGr</kbd>+<kbd>2</kbd>.', hint: 'AltGr is the key to the right of the space bar. Hold it down and press 2. (On some keyboards: Ctrl+Alt+2. On a UK keyboard: Shift+\'.)', check: S => S.editorText().includes('@') && S.editorText().includes('\n') },
          { text: 'Select all the text with <kbd>Ctrl</kbd>+<kbd>A</kbd>.', check: S => S.ev('shortcut', d => d.key === 'a' && d.app === 'skriv') },
          { text: 'Copy with <kbd>Ctrl</kbd>+<kbd>C</kbd>, click at the bottom of the text, and paste twice with <kbd>Ctrl</kbd>+<kbd>V</kbd>.', check: S => S.ev('shortcut', d => d.key === 'c' && d.app === 'skriv') && S.evCount('shortcut', d => d.key === 'v' && d.app === 'skriv') >= 2 },
          { text: 'Undo the last thing with <kbd>Ctrl</kbd>+<kbd>Z</kbd>.', check: S => S.ev('shortcut', d => d.key === 'z' && d.app === 'skriv') },
          { text: 'Save as <b>Keyboard-practice</b> in <b>OneDrive › School › Norwegian</b>.', check: S => S.fileInNamed('Keyboard-practice.docx', 'Norwegian') },
          { text: 'Close Write.', check: S => S.ev('window-close', d => d.app === 'skriv') },
          { quiz: { q: 'How do you type @ on a Norwegian keyboard?', options: ['Shift + 2', 'AltGr + 2', 'Ctrl + 2'], answer: 1 } },
          { quiz: { q: 'What does Ctrl+Z do?', options: ['Undoes the last thing you did', 'Saves', 'Zooms in'], answer: 0 } },
          { quiz: { q: 'Which shortcut saves the document?', options: ['Ctrl + L', 'Ctrl + P', 'Ctrl + S'], answer: 2 } }
        ]
      }
    ]
  }
];
