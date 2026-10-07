/* Course set for programming students: the terminal (PowerShell), the Code editor and Python.
   Assumes the basic course. Used by en/programming.html (window.KURS_ACTIVE = KURS_PROG). */

const P_KODE = ['This PC', 'Documents', 'Code'];
const HOME_RX = /^C:\\Users\\Student$/i;
const ends = (path, tail) => new RegExp('\\\\' + tail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i').test(path);
const cmd = (S, pred) => S.ev('term-cmd', d => d.ok && (!pred || pred(d)));
const ran = (S, file, pred) => S.ev('py-run', d => d.file.toLowerCase() === file.toLowerCase() && (!pred || pred(d)));
const lines = s => (s || '').split('\n').filter(l => l.trim()).length;

const KURS_PROG = [
  /* ============================================================ */
  {
    id: 'p1', title: 'The terminal', laerTitle: 'what the terminal is',
    desc: 'PowerShell: see where you are, list files and change folder.',
    laer: `
      <h4>What is a terminal?</h4>
      <p>A <b>terminal</b> is a program where you control the PC by typing commands instead of clicking. On Windows the command language is called <b>PowerShell</b>. You type a command, press <kbd>Enter</kbd>, and get an answer as text.</p>
      <p>You will find <b>Terminal</b> on the taskbar at the bottom, the dark icon with <code>&gt;_</code>, and in the Start menu. On a real PC it is called <b>Windows Terminal</b> or <b>PowerShell</b>, and you find it by right-clicking the Start button.</p>
      <p>The line <code>PS C:\\Users\\Student&gt;</code> is called the <b>prompt</b>. It shows which folder you are in right now. Everything you do happens in that folder.</p>
      <h4>The three most important commands</h4>
      <table><tr><th>Command</th><th>Does</th></tr>
      <tr><td><code>pwd</code></td><td>Shows the folder you are in (<i>print working directory</i>)</td></tr>
      <tr><td><code>ls</code></td><td>Lists the files and folders where you are (<i>list</i>)</td></tr>
      <tr><td><code>cd Name</code></td><td>Goes into the folder Name (<i>change directory</i>). <code>cd ..</code> goes up one level, <code>cd ~</code> goes home.</td></tr></table>
      <h4>Folder names</h4>
      <p>The terminal uses the same folder names as File Explorer. Your most important folders are:</p>
      <table><tr><th>File Explorer</th><th>Terminal</th></tr><tr><td>Documents</td><td>Documents</td></tr><tr><td>Desktop</td><td>Desktop</td></tr><tr><td>Downloads</td><td>Downloads</td></tr><tr><td>Pictures</td><td>Pictures</td></tr></table>
      <p>Capital and small letters don't matter in PowerShell. <code>cd documents</code> works just as well.</p>`,
    oppdrag: [
      {
        id: 'p1o1', title: 'First commands', lukk: 'alle',
        steps: [
          { laer: true, quiz: { q: 'What does the prompt PS C:\\Users\\Student> show?', options: ['The name of the PC', 'The folder you are in', 'The time'], answer: 1 } },
          { laer: true, quiz: { q: 'What is the Documents folder called in the terminal?', options: ['My Documents', 'Docs', 'Documents'], answer: 2 } },
          { laer: true, quiz: { q: 'Which command lists the files where you are?', options: ['ls', 'pwd', 'cd'], answer: 0 } },
          { text: 'Open <b>Terminal</b> from the taskbar (the dark icon with <code>&gt;_</code>).', check: S => S.ev('window-open', d => d.app === 'terminal') },
          { text: 'Type <code>pwd</code> and press <kbd>Enter</kbd>. The answer is <code>C:\\Users\\Student</code>: your home folder.', hint: 'Click in the terminal window first, so the keyboard types there.', check: S => cmd(S, d => d.name === 'Get-Location') },
          { text: 'Type <code>ls</code> to list what is there. Notice the folder <b>Documents</b>.', check: S => cmd(S, d => d.name === 'Get-ChildItem') },
          { text: 'Go into Documents: <code>cd Documents</code>. Watch the prompt change.', hint: 'cd, space, Documents.', check: S => S.ev('term-cd', d => ends(d.path, 'Documents')) },
          { text: 'Type <code>ls</code> again. Now you can see what is in Documents.', check: S => cmd(S, d => d.name === 'Get-ChildItem' && ends(d.cwd, 'Documents')) },
          { text: 'Go up one level: <code>cd ..</code> (two dots mean “the folder above”).', check: S => S.ev('term-cd', d => d.arg === '..') },
          { text: 'Go into Pictures with <code>cd Pictures</code>, and then home again with <code>cd ~</code>.', hint: 'The sign ~ (tilde) means the home folder. On a Norwegian keyboard: AltGr + ¨ (the key next to Å), then space.', check: S => S.ev('term-cd', d => ends(d.path, 'Pictures')) && S.ev('term-cd', d => d.arg === '~' && HOME_RX.test(d.path)) },
          { quiz: { q: 'What does the command cd .. do?', options: ['Goes up one level, to the folder above', 'Lists the files', 'Deletes the folder'], answer: 0 } },
          { quiz: { q: 'The prompt shows PS C:\\Users\\Student\\Documents>. Where are you?', options: ['In the home folder', 'In the Documents folder', 'On the desktop'], answer: 1 } }
        ]
      },
      {
        id: 'p1o2', title: 'Faster: Tab, arrow keys and help',
        intro: 'Nobody who uses the terminal types everything themselves. <kbd>Tab</kbd> completes names, and the arrow keys bring back commands you have used before.',
        steps: [
          { text: 'Type <code>cd Doc</code> and press <kbd>Tab</kbd>. The terminal completes it to <code>Documents\\</code>. Press <kbd>Enter</kbd>.', hint: 'Tab is above Caps Lock, on the left of the keyboard.', check: S => S.ev('term-tab', d => /documents/i.test(d.completed)) && S.ev('term-cd', d => ends(d.path, 'Documents')) },
          { text: 'Type <code>ls</code>.', check: S => cmd(S, d => d.name === 'Get-ChildItem') },
          { text: 'Press <kbd>↑</kbd> (up arrow). The last command comes back. Press <kbd>Enter</kbd> to run it again.', check: S => S.ev('term-history') && S.evCount('term-cmd', d => d.name === 'Get-ChildItem') >= 1 && S.ev('term-cmd', d => d.name === 'Get-ChildItem') },
          { text: 'Clear the screen with <code>cls</code> (or <code>clear</code>).', check: S => S.ev('term-clear') },
          { text: 'Get help with a command: <code>help ls</code>.', check: S => S.ev('term-help', d => d.topic === 'Get-ChildItem') },
          { text: '<code>ls</code> is really a short name (alias). Type <code>Get-Alias ls</code> to see what it stands for.', check: S => cmd(S, d => d.name === 'Get-Alias') },
          { quiz: { q: 'You have typed cd Dow and press Tab. What happens?', options: ['The terminal completes it to Downloads\\', 'The terminal deletes what you typed', 'Nothing, Tab doesn\'t work in the terminal'], answer: 0 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p2', title: 'Files and folders from the terminal', laerTitle: 'create, move and delete',
    desc: 'mkdir, New-Item, Get-Content, Copy-Item, Move-Item, Remove-Item.',
    laer: `
      <table><tr><th>Command</th><th>Does</th></tr>
      <tr><td><code>mkdir Name</code></td><td>Creates a folder</td></tr>
      <tr><td><code>New-Item file.py</code></td><td>Creates an empty file (short name: <code>ni</code>)</td></tr>
      <tr><td><code>cat file.py</code></td><td>Shows what is in a file (<code>Get-Content</code>)</td></tr>
      <tr><td><code>Set-Content file.txt 'text'</code></td><td>Writes text to a file (replaces what was there)</td></tr>
      <tr><td><code>echo 'text' &gt; file.txt</code></td><td>The same: the arrow <code>&gt;</code> sends the output to a file. <code>&gt;&gt;</code> adds it at the bottom.</td></tr>
      <tr><td><code>cp from to</code></td><td>Copies (<code>Copy-Item</code>)</td></tr>
      <tr><td><code>mv from to</code></td><td>Moves (<code>Move-Item</code>)</td></tr>
      <tr><td><code>ren old new</code></td><td>Renames (<code>Rename-Item</code>)</td></tr>
      <tr><td><code>rm file</code></td><td>Deletes (<code>Remove-Item</code>). <b>Does not go to the Recycle Bin!</b></td></tr>
      <tr><td><code>tree</code></td><td>Draws the folder structure</td></tr>
      <tr><td><code>explorer .</code></td><td>Opens the folder you are in, in File Explorer</td></tr></table>
      <p>The dot <code>.</code> means “the folder I am in”. Text with spaces or special characters goes inside quotation marks: <code>'print("Hello")'</code>.</p>`,
    oppdrag: [
      {
        id: 'p2o1', title: 'Create a project',
        setup: F => { F.ensureFolder(['This PC', 'Documents']); },
        steps: [
          { laer: true, quiz: { q: 'Which command creates a new folder?', options: ['cat', 'mkdir', 'rm'], answer: 1 } },
          { laer: true, quiz: { q: 'What does > do in  echo \'hello\' > file.txt ?', options: ['Sends the output to the file instead of the screen', 'Compares two numbers', 'Opens the file in Code'], answer: 0 } },
          { laer: true, quiz: { q: 'What is the difference between rm in the terminal and Delete in File Explorer?', options: ['No difference', 'rm moves the file to Downloads', 'rm deletes for good, with no Recycle Bin'], answer: 2 } },
          { text: 'Go to Documents in the terminal: <code>cd ~\\Documents</code>.', check: S => S.ev('term-cd', d => ends(d.path, 'Documents')) },
          { text: 'Create a folder for your code: <code>mkdir Code</code>.', check: S => S.folderIn('Code', ['This PC', 'Documents']) },
          { text: 'Go into it: <code>cd Code</code>.', check: S => S.ev('term-cd', d => ends(d.path, 'Documents\\Code')) },
          { text: 'Create an empty file: <code>New-Item hello.py</code>.', check: S => S.fileIn('hello.py', P_KODE) },
          { text: 'Type <code>ls</code>. The file is there, with 0 under Length (it is empty).', check: S => cmd(S, d => d.name === 'Get-ChildItem' && ends(d.cwd, 'Code')) },
          { text: 'Put code in the file from the terminal: <code>Set-Content hello.py \'print("Hello from the terminal")\'</code>', hint: 'Single quotation marks on the outside, double ones on the inside. That way the double quotation marks end up in the file.', check: S => /print\s*\(/.test(S.content('hello.py')) },
          { text: 'See what is in it: <code>cat hello.py</code>.', check: S => S.ev('term-cat', d => d.name === 'hello.py') },
          { text: 'Run the program: <code>python hello.py</code>.', check: S => ran(S, 'hello.py', d => d.ok) },
          { text: 'Open the folder in File Explorer from the terminal: <code>explorer .</code>. There is the file. Close the window afterwards.', check: S => cmd(S, d => d.name === 'explorer') && S.ev('window-close', d => d.app === 'explorer') },
          { quiz: { q: 'What does the dot mean in “explorer .”?', options: ['The folder I am in', 'The home folder', 'An empty file'], answer: 0 } }
        ]
      },
      {
        id: 'p2o2', title: 'Copy, move and delete',
        setup: F => { F.ensureFile(P_KODE, 'hello.py', 'print("Hello from the terminal")'); F.silentRemoveAll('copy.py'); F.silentRemoveAll('test.py'); },
        steps: [
          { text: 'Stand in the <code>Code</code> folder (<code>cd ~\\Documents\\Code</code>) and make a copy: <code>cp hello.py copy.py</code>.', check: S => S.fileIn('copy.py', P_KODE) },
          { text: 'Rename the copy: <code>ren copy.py test.py</code>.', check: S => S.fileIn('test.py', P_KODE) && !S.fileIn('copy.py', P_KODE) },
          { text: 'Create the folder <code>old</code>: <code>mkdir old</code>.', check: S => S.folderIn('old', P_KODE) },
          { text: 'Move the file into the folder: <code>mv test.py old</code>.', check: S => S.fileIn('test.py', [...P_KODE, 'old']) },
          { text: 'See the structure: <code>tree</code>.', check: S => S.ev('term-tree') },
          { text: 'Delete the file: <code>rm old\\test.py</code>. (A forward slash works too: <code>rm old/test.py</code>.)', check: S => S.gone('test.py') && S.ev('term-rm', d => d.name === 'test.py') },
          { text: 'Delete the empty folder: <code>rm old</code>.', check: S => !S.folderIn('old', P_KODE) },
          { text: 'Open the <b>Recycle Bin</b> in File Explorer and check: the file is <i>not</i> there. The terminal deletes for good.', check: S => S.ev('explorer-nav', d => d.name === 'Recycle Bin') },
          { quiz: { q: 'You delete a file with rm in the terminal. Where does it end up?', options: ['In the Recycle Bin', 'It is gone for good', 'In the folder old'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p3', title: 'Paths', laerTitle: 'absolute and relative paths',
    desc: 'C:\\Users\\Student\\… versus ..\\Code, quotation marks and Tab.',
    laer: `
      <h4>Absolute path</h4>
      <p>An <b>absolute path</b> starts right from the top, with the drive: <code>C:\\Users\\Student\\Documents\\Code</code>. It always points to the same place, wherever you are.</p>
      <h4>Relative path</h4>
      <p>A <b>relative path</b> starts from the folder you are in: <code>Documents\\Code</code> means “Documents in here, and then Code”. <code>..\\Pictures</code> means “up one level, then into Pictures”.</p>
      <table><tr><th>Sign</th><th>Means</th></tr><tr><td><code>.</code></td><td>the folder I am in</td></tr><tr><td><code>..</code></td><td>the folder above</td></tr><tr><td><code>~</code></td><td>the home folder (C:\\Users\\Student)</td></tr><tr><td><code>\\</code></td><td>separates folders (a forward slash / works too)</td></tr></table>
      <h4>Spaces in names</h4>
      <p>If a folder has a space in its name, the path must go inside quotation marks: <code>cd "My projects"</code>. Or use <kbd>Tab</kbd>, and the terminal adds the quotation marks for you. That is why programmers avoid spaces in folder names.</p>`,
    oppdrag: [
      {
        id: 'p3o1', title: 'Absolute and relative path',
        setup: F => { F.ensureFolder(P_KODE); F.ensureFolder(['This PC', 'Documents', 'My projects']); },
        steps: [
          { laer: true, quiz: { q: 'Which of these paths is relative?', options: ['C:\\Users\\Student\\Documents', 'Documents\\Code', 'C:\\'], answer: 1 } },
          { laer: true, quiz: { q: 'What does .. mean in a path?', options: ['The folder I am in', 'The home folder', 'The folder above'], answer: 2 } },
          { laer: true, quiz: { q: 'The folder is called “My projects”. How do you go into it?', options: ['cd "My projects"', 'cd My projects', 'cd My_projects'], answer: 0 } },
          { text: 'Go home: <code>cd ~</code>.', check: S => S.ev('term-cd', d => d.arg === '~') },
          { text: 'Go straight to the Code folder with an <b>absolute</b> path: <code>cd C:\\Users\\Student\\Documents\\Code</code>', check: S => S.ev('term-cd', d => /^c:/i.test(d.arg) && ends(d.path, 'Documents\\Code')) },
          { text: 'Go up two levels at once: <code>cd ..\\..</code>', check: S => S.ev('term-cd', d => /^\.\.[\\/]\.\.$/.test(d.arg) && HOME_RX.test(d.path)) },
          { text: 'Go back in with a <b>relative</b> path: <code>cd Documents\\Code</code>', check: S => S.ev('term-cd', d => /^\.?[\\/]?documents[\\/]code[\\/]?$/i.test(d.arg)) },
          { text: 'The folder “My projects” is next to Code and has a space in its name. Go there: <code>cd "..\\My projects"</code> (or type <code>cd ..\\My</code> and press Tab).', check: S => S.ev('term-cd', d => ends(d.path, 'My projects')) },
          { text: 'List what is in another folder without going there: <code>ls ~\\Documents</code>', check: S => cmd(S, d => d.name === 'Get-ChildItem' && /documents/i.test((d.args[0] || '') + (d.opts.path || ''))) },
          { text: 'Go to Code with a relative path from where you are: <code>cd ..\\Code</code>, and check with <code>pwd</code>.', check: S => S.ev('term-cd', d => ends(d.path, 'Documents\\Code')) && cmd(S, d => d.name === 'Get-Location') },
          { quiz: { q: 'Which of these is an absolute path?', options: ['..\\Code', 'Documents\\Code', 'C:\\Users\\Student\\Documents\\Code'], answer: 2 } },
          { quiz: { q: 'What does ~ mean in the terminal?', options: ['The folder above', 'Your home folder', 'The Recycle Bin'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p4', title: 'The Code editor', laerTitle: 'the editor and the workflow',
    desc: 'code ., write code, save, run. Edit and run again.',
    laer: `
      <h4>Editor + terminal</h4>
      <p>Code is written in an <b>editor</b> (on real PCs often Visual Studio Code) and run in the <b>terminal</b>. The workflow is always the same:</p>
      <ol><li>Open the project folder in the editor: <code>code .</code> from the terminal</li><li>Write or change code</li><li><b>Save</b> (<kbd>Ctrl</kbd>+<kbd>S</kbd>). A dot ● on the tab means unsaved. The program you run is the one that is <i>saved</i>!</li><li>Run: <code>python file.py</code> in the terminal, or the ▶ button</li><li>Read the output, go back to 2</li></ol>
      <h4>In the editor</h4>
      <p>On the left: the files in the folder. At the top: tabs for open files. <kbd>Tab</kbd> gives an indent (4 spaces), which Python needs. The line numbers are used in error messages.</p>`,
    oppdrag: [
      {
        id: 'p4o1', title: 'First program in Code', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('greeting.py'); },
        steps: [
          { laer: true, quiz: { q: 'What does  code .  do in the terminal?', options: ['Runs the program', 'Opens the folder you are in, in the Code editor', 'Deletes the file'], answer: 1 } },
          { laer: true, quiz: { q: 'Which version of the program does  python file.py  run?', options: ['The one saved on the disk', 'The one you see in the editor, even if unsaved', 'Both'], answer: 0 } },
          { laer: true, quiz: { q: 'What does Python use indents (4 spaces) for?', options: ['Decoration', 'Making comments', 'Showing which lines belong to an if, a loop or a function'], answer: 2 } },
          { text: 'In the terminal: go to the Code folder (<code>cd ~\\Documents\\Code</code>) and open it in the editor: <code>code .</code>', check: S => S.ev('kode-open', d => d.name === 'Code') },
          { text: 'Create a new file in Code: click <b>New File</b> and call it <code>greeting.py</code>.', check: S => S.fileIn('greeting.py', P_KODE) },
          { text: 'Write a program with a variable and a print, for example:<br><code>name = "Ola"</code><br><code>print("Hello,", name)</code>', check: S => /=/.test(S.kodeText()) && /print\s*\(/.test(S.kodeText()) },
          { text: 'Save with <kbd>Ctrl</kbd>+<kbd>S</kbd>. The dot on the tab disappears.', check: S => S.ev('kode-save', d => d.name === 'greeting.py' && /print/.test(d.content)) },
          { text: 'Run the program in the terminal: <code>python greeting.py</code>', hint: 'Click in the terminal window. Are you in the Code folder? Check the prompt.', check: S => ran(S, 'greeting.py', d => d.ok) && S.ev('term-cmd', d => d.name === 'python') },
          { text: 'Change the text in the program, and run it again with the <b>▶ Run</b> button in Code. It saves and runs for you.', check: S => S.ev('kode-run', d => d.name === 'greeting.py') && ran(S, 'greeting.py', d => d.ok) },
          { quiz: { q: 'The tab shows “greeting.py ●”. You run python greeting.py. Which version runs?', options: ['The one you see in the editor', 'The one that was last saved', 'None, the program refuses'], answer: 1 } }
        ]
      },
      {
        id: 'p4o2', title: 'Program with input',
        setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('age.py'); },
        steps: [
          { text: 'Create the file <code>age.py</code> in the Code folder (in Code or with <code>New-Item</code>).', check: S => S.fileIn('age.py', P_KODE) },
          { text: 'Write a program that asks for your age with <code>input()</code>, turns the answer into a number with <code>int()</code>, and prints how old you will be next year. Save.', hint: 'age = int(input("How old are you? "))\nprint("Next year you will be", age + 1)', check: S => /input\s*\(/.test(S.content('age.py')) && /int\s*\(/.test(S.content('age.py')) },
          { text: 'Run the program in the terminal and answer the question.', check: S => ran(S, 'age.py', d => d.ok && d.usedInput) },
          { text: 'Run it again, but type a word instead of a number. Read the error message: <b>ValueError</b>.', check: S => ran(S, 'age.py', d => d.error === 'ValueError') },
          { quiz: { q: 'Why do you need int() around input()?', options: ['input() always gives text, int() turns it into a number', 'int() prints the answer', 'You don\'t need it'], answer: 0 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p5', title: 'Debugging', laerTitle: 'reading error messages',
    desc: 'Traceback, line numbers, common errors and Ctrl+C.',
    laer: `
      <h4>Read the error message from the bottom up</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px;overflow:auto">Traceback (most recent call last):
  File "error1.py", line 2, in &lt;module&gt;
NameError: name 'nme' is not defined</pre>
      <ul><li><b>Bottom line</b>: what went wrong (the type of error and an explanation)</li><li><b>The line above</b>: which file and which <b>line number</b>. Go there in the editor!</li></ul>
      <table><tr><th>Error</th><th>Usually means</th></tr>
      <tr><td>NameError</td><td>A name is spelt wrong, or the variable hasn't been made yet</td></tr>
      <tr><td>SyntaxError</td><td>The grammar of the code is wrong: a missing <code>)</code>, <code>:</code> or quotation mark</td></tr>
      <tr><td>IndentationError</td><td>Wrong indent</td></tr>
      <tr><td>TypeError</td><td>Mixing text and numbers, e.g. <code>"5" + 1</code></td></tr>
      <tr><td>ValueError</td><td>Right type, wrong value, e.g. <code>int("abc")</code></td></tr>
      <tr><td>ZeroDivisionError</td><td>Dividing by zero</td></tr>
      <tr><td>IndexError</td><td>Trying to get an item that isn't in the list</td></tr></table>
      <h4>The program doesn't stop</h4>
      <p>A loop that never finishes runs for ever. Press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the terminal to stop the program. Python answers with <b>KeyboardInterrupt</b>.</p>`,
    oppdrag: [
      {
        id: 'p5o1', title: 'Read the error message',
        setup: F => {
          F.ensureFolder(P_KODE);
          F.silentRemoveAll('error1.py'); F.silentRemoveAll('error2.py');
          F.ensureFile(P_KODE, 'error1.py', 'name = "Ola"\nprint("Hello", nme)\n');
          F.ensureFile(P_KODE, 'error2.py', 'number = 7\nif number > 5\n    print("big number")\n');
        },
        steps: [
          { laer: true, quiz: { q: 'Where in a traceback do you find the type of error and the explanation?', options: ['In the bottom line', 'In the top line', 'In the file name'], answer: 0 } },
          { laer: true, quiz: { q: 'The program gives a SyntaxError. What does that usually mean?', options: ['The PC has run out of memory', 'The grammar of the code is wrong, for example a missing ) or :', 'The file doesn\'t exist'], answer: 1 } },
          { laer: true, quiz: { q: 'What does  NameError: name \'nme\' is not defined  mean?', options: ['nme is too short a name', 'The file is missing', 'Python can\'t find anything called nme: a typo, or the variable hasn\'t been made yet'], answer: 2 } },
          { text: 'In the Code folder there is <code>error1.py</code>. Run it: <code>python error1.py</code>. Read the bottom line of the error message.', check: S => ran(S, 'error1.py', d => d.error === 'NameError') },
          { text: 'Open the file in the editor (<code>code error1.py</code>), go to the line the error message gave, and fix the name. Save.', check: S => S.ev('kode-save', d => d.name === 'error1.py' && !/nme/.test(d.content)) },
          { text: 'Run it again. Now it should work.', check: S => ran(S, 'error1.py', d => d.ok) },
          { text: 'Run <code>error2.py</code>. This time it is a <b>SyntaxError</b>: Python shows the line and where it got lost.', check: S => ran(S, 'error2.py', d => d.error === 'SyntaxError') },
          { text: 'Fix the error in the editor (what is missing at the end of the if line?), save and run again.', hint: 'An if statement must end with a colon :', check: S => ran(S, 'error2.py', d => d.ok) },
          { quiz: { q: 'Where in the error message is the line number?', options: ['In the bottom line', 'In the line that starts with File "…", line …', 'It isn\'t there'], answer: 1 } }
        ]
      },
      {
        id: 'p5o2', title: 'Infinite loop',
        setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('forever.py'); F.ensureFile(P_KODE, 'forever.py', 'counter = 1\nwhile counter > 0:\n    print("Round", counter)\n    counter = counter + 1\n'); },
        steps: [
          { text: 'Run <code>python forever.py</code>. The program never stops. Stop it with <kbd>Ctrl</kbd>+<kbd>C</kbd> in the terminal.', hint: 'Hold Ctrl down and press C while the program is running.', check: S => S.ev('term-ctrlc', d => d.running) && ran(S, 'forever.py', d => d.error === 'KeyboardInterrupt') },
          { text: 'Open <code>forever.py</code> in the editor and change the loop so it stops after 10 rounds. Save and run.', hint: 'Change the condition: while counter <= 10:', check: S => ran(S, 'forever.py', d => d.ok && /Round 10/.test(d.output) && !/Round 11/.test(d.output)) },
          { quiz: { q: 'Your program hangs. What do you do?', options: ['Shut down the PC', 'Press Ctrl+C in the terminal', 'Wait until it finishes'], answer: 1 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p6', title: 'Project structure', laerTitle: 'folders in a project and files from code',
    desc: 'Subfolders, reading a file from Python, sending output to a file.',
    laer: `
      <h4>A project is a folder</h4>
      <p>Bigger programs are made of several files. Then you make a <b>project folder</b> with the code at the top and subfolders for data, pictures and so on:</p>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">project\\
├── main.py
└── data\\
    └── name.txt</pre>
      <h4>Files from Python</h4>
      <p>The program can read files with <code>open()</code>. The path is <b>relative to the folder you run the program from</b>, so stand in the project folder when you run it:</p>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">with open("data/name.txt") as f:
    lines = f.readlines()
print("Number of names:", len(lines))</pre>
      <h4>Output to a file</h4>
      <p><code>python main.py &gt; result.txt</code> sends everything the program prints to the file instead of the screen.</p>`,
    oppdrag: [
      {
        id: 'p6o1', title: 'A small project',
        setup: F => { F.ensureFolder(P_KODE); const p = F.resolve([...P_KODE, 'project']); if (p) F.purge(p.id); },
        steps: [
          { laer: true, quiz: { q: 'What is a project folder?', options: ['A folder with the code and subfolders for data and other things that belong to the program', 'A folder for all subjects', 'The Recycle Bin'], answer: 0 } },
          { laer: true, quiz: { q: 'open("data/name.txt") gives FileNotFoundError, but the file exists. What is most likely?', options: ['Python isn\'t installed', 'You are running the program from the wrong folder: the path is relative to where you are', 'The file is too big'], answer: 1 } },
          { text: 'Stand in the Code folder in the terminal and create the project folder: <code>mkdir project</code>', check: S => S.folderIn('project', P_KODE) },
          { text: 'Create a subfolder for data: <code>mkdir project\\data</code>', check: S => S.folderIn('data', [...P_KODE, 'project']) },
          { text: 'Create <code>project\\data\\name.txt</code> with at least three names, one on each line. Use Code, or <code>Add-Content project\\data\\name.txt Ola</code> three times with different names.', check: S => { const f = S.fileIn('name.txt', [...P_KODE, 'project', 'data']); return f && lines(S.content('name.txt')) >= 3; } },
          { text: 'Create <code>project\\main.py</code> that opens <code>data/name.txt</code>, counts the lines and prints the number. See “Read first” for the code.', check: S => { const c = S.content('main.py'); return S.fileIn('main.py', [...P_KODE, 'project']) && /open\s*\(/.test(c) && /print\s*\(/.test(c); } },
          { text: 'Go into the project folder (<code>cd project</code>) and run: <code>python main.py</code>', hint: 'Getting FileNotFoundError? Then you are in the wrong folder: the path data/name.txt is relative to where you run from.', check: S => ran(S, 'main.py', d => d.ok && ends(d.path, 'project\\main.py') && d.output.trim().length > 0) },
          { text: 'Send the output to a file: <code>python main.py &gt; result.txt</code>. Nothing shows on the screen, it went into the file.', check: S => S.ev('term-redirect', d => d.file === 'result.txt') },
          { text: 'See the result: <code>cat result.txt</code>', check: S => S.ev('term-cat', d => d.name === 'result.txt') },
          { text: 'Go up to the Code folder (<code>cd ..</code>) and draw the structure with <code>tree</code>.', check: S => S.ev('term-tree') && cmd(S, d => d.name === 'tree' && ends(d.cwd, 'Code')) },
          { quiz: { q: 'main.py opens "data/name.txt". Which folder must you run the program from?', options: ['From the folder main.py is in (the project folder)', 'From the data folder', 'From the home folder'], answer: 0 } }
        ]
      }
    ]
  },
  /* ============================================================ */
  {
    id: 'p7', title: 'PowerShell scripts', laerTitle: 'scripts in PowerShell',
    desc: '.ps1 files, Write-Host, Read-Host, variables and why you need .\\',
    laer: `
      <h4>Script = commands in a file</h4>
      <p>Everything you can type in the terminal, you can put in a file that ends in <b>.ps1</b> and run all at once. This is called a <b>script</b>.</p>
      <table><tr><th>In the script</th><th>Does</th></tr>
      <tr><td><code>Write-Host "Hello"</code></td><td>Writes text</td></tr>
      <tr><td><code>$name = Read-Host "What is your name"</code></td><td>Asks the user and stores the answer in the variable $name</td></tr>
      <tr><td><code>Write-Host "Hello $name!"</code></td><td>Variables start with $ and are put into text with double quotation marks</td></tr>
      <tr><td><code># comment</code></td><td>Lines with # are not run</td></tr></table>
      <h4>Why .\\ ?</h4>
      <p>If you just type <code>hello.ps1</code>, PowerShell refuses: it won't run scripts from the folder you are in unless you say so clearly. It is a safety rule. You have to type <code>.\\hello.ps1</code>: “hello.ps1 in <i>this</i> folder”. On a real PC scripts must also be allowed (<i>execution policy</i>), so ask IT if it stops you.</p>`,
    oppdrag: [
      {
        id: 'p7o1', title: 'Your first script',
        setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('hello.ps1'); },
        steps: [
          { laer: true, quiz: { q: 'What is a PowerShell script?', options: ['A Python program', 'A .ps1 file with commands that are run all at once', 'A shortcut on the desktop'], answer: 1 } },
          { laer: true, quiz: { q: '$name is Kari. What does  Write-Host "Hello $name"  print?', options: ['Hello $name', 'Hello Kari', 'An error message'], answer: 1 } },
          { text: 'Create <code>hello.ps1</code> in the Code folder with the line <code>Write-Host "Hello from the script"</code>. Save.', check: S => S.fileIn('hello.ps1', P_KODE) && /Write-Host/i.test(S.content('hello.ps1')) },
          { text: 'Try to run it by typing just <code>hello.ps1</code> in the terminal. Read the error message and the suggestion at the bottom.', check: S => S.ev('term-cmd', d => !d.ok && /^hello\.ps1$/i.test(d.alias)) },
          { text: 'Run it the right way: <code>.\\hello.ps1</code>', check: S => S.ev('ps1-run', d => d.file === 'hello.ps1' && d.ok) },
          { text: 'Add two lines to the script:<br><code>$name = Read-Host "What is your name"</code><br><code>Write-Host "Hello $name!"</code><br>Save, run, and answer the question.', check: S => S.ev('ps1-run', d => d.file === 'hello.ps1' && d.ok && /Read-Host/i.test(d.source) && /\$name/.test(d.source)) },
          { text: 'Scripts are made of normal commands. Check another short name: <code>Get-Alias cd</code>', check: S => cmd(S, d => d.name === 'Get-Alias') },
          { quiz: { q: 'Why do you have to type .\\hello.ps1 and not just hello.ps1?', options: ['Because the file is in the Recycle Bin', 'PowerShell won\'t run scripts from the folder you are in unless you say so clearly', 'Because the name is too short'], answer: 1 } },
          { quiz: { q: 'What does Read-Host do?', options: ['Writes text to the screen', 'Reads a file', 'Asks the user something and gives back the answer'], answer: 2 } }
        ]
      }
    ]
  }
];
/* ============================================================
   COURSE: Installing apps (Company Portal)
   Placed before the Code editor, because the editor doesn't
   actually exist on the practice PC until the student has installed it.
   ============================================================ */
const KURS_INSTALL = {
  id: 'pi', title: 'Installing apps', laerTitle: 'the Company Portal',
  desc: 'Get apps from the school\'s own app store, and find them again afterwards.',
  laer: `
    <h4>You can't download just anything</h4>
    <p>On a school PC you are not an <b>administrator</b>. You can't install programs you find on the internet, and that is on purpose: the school avoids viruses and programs nobody has checked. If you try anyway, you are told you don't have permission.</p>
    <h4>The Company Portal</h4>
    <p>The <b>Company Portal</b> is the school's own app store. Everything in it has been approved by IT and is safe to install. This is where you get Teams, OneNote, GeoGebra and the apps you need for programming.</p>
    <table><tr><th>Step</th><th>How to do it</th></tr>
    <tr><td>1</td><td>Open the <b>Company Portal</b> from the Start menu</td></tr>
    <tr><td>2</td><td><b>Search</b> for the app, or browse the categories</td></tr>
    <tr><td>3</td><td>Click <b>Install</b> <i>once</i></td></tr>
    <tr><td>4</td><td><b>Wait.</b> The status goes from “Pending” to “Downloading” to “Installing” to “Installed”</td></tr>
    <tr><td>5</td><td>Find the app in the <b>Start menu</b></td></tr></table>
    <h4>An app is called what its maker calls it</h4>
    <p>The code editor is called <b>Visual Studio Code</b> in the portal, not “Code” or “VS Code”. If you can't find something, try a shorter search word, for example just <b>code</b> or <b>visual</b>.</p>
    <h4>It takes time, and sometimes it fails</h4>
    <p>Big apps can take several minutes. <b>Don't click Install lots of times</b>, it doesn't go any faster. The installation carries on even if you close the portal.</p>
    <p>If it fails, you get an <b>error code</b>. Try once more, that usually fixes it. If it fails several times: write down the error code and the name of the app, and tell your teacher or IT. Then they will be able to help you.</p>`,
  oppdrag: [
    {
      id: 'pio1', title: 'Install the code editor', lukk: ['firmaportal','kode'],
      intro: 'The Code editor isn\'t installed on this PC yet. You are going to fix that yourself, just as you have to on a real school PC.',
      steps: [
        { laer: true, quiz: { q: 'Why can\'t you just download programs from the internet on a school PC?', options: ['Because the internet is too slow', 'Because you are not an administrator, and the school wants to avoid programs nobody has checked', 'Because it costs money'], answer: 1 } },
        { laer: true, quiz: { q: 'What is the Company Portal?', options: ['The school\'s own app store with approved apps', 'A website where you buy programs', 'A place where you hand in assignments'], answer: 0 } },
        { laer: true, quiz: { q: 'You have clicked Install, and it says “Downloading”. What do you do?', options: ['Click Install a few more times', 'Restart the PC', 'Wait'], answer: 2 } },
        { text: 'Open <b>Terminal</b> and type <code>code .</code>. It doesn\'t work, because the app isn\'t on the PC yet. Read what it says.', hint: 'The terminal says that “code” is not recognised as a program. That is how a real PC answers when something isn\'t installed.', check: S => S.ev('term-cmd', d => !d.ok && /^code$/i.test(d.alias)) },
        { text: 'Open the <b>Company Portal</b> from the Start menu or the taskbar.', check: S => S.ev('fp-open') },
        { text: 'Search for the code editor. Remember that it is called <b>Visual Studio Code</b> in the portal.', hint: 'Type “code” or “visual” in the search box at the top right.', check: S => S.ev('fp-search', d => /code|visual|studio/i.test(d.query)) || S.ev('fp-filter', d => d.filter === 'Programming') },
        { text: 'Click <b>Install</b> on Visual Studio Code, and <b>wait</b> until the status says “✓ Installed”. Watch how it changes along the way.', hint: 'It takes a few seconds here. On a real PC it can take several minutes. Don\'t click more than once.', check: S => S.ev('install-done', d => d.id === 'vscode') },
        { text: 'Open the <b>Start menu</b>. <b>Code</b> is there now, together with the other apps. Open it.', hint: 'Click the Windows logo on the taskbar. Installed apps turn up in the Start menu by themselves.', check: S => S.ev('startmenu-open') && S.ev('window-open', d => d.app === 'kode') },
        { text: 'Go back to the terminal and type <code>code .</code> once more. Now the command works.', check: S => S.ev('term-cmd', d => d.ok && /^code$/i.test(d.alias)) },
        { quiz: { q: 'You can\'t find the app in the Company Portal. What is most likely?', options: ['It doesn\'t exist at all', 'It is called something different from what you searched for', 'The PC is too old'], answer: 1 } }
      ]
    },
    {
      id: 'pio2', title: 'When the installation fails',
      intro: 'Sometimes things go wrong. Then it is good to know what is normal, and what you should tell someone about.',
      steps: [
        { text: 'Open the Company Portal and find <b>GeoGebra Classic</b>.', hint: 'It is in the School category, or search for “geogebra”.', check: S => S.ev('fp-open') || S.ev('fp-search', d => /geo/i.test(d.query)) || S.ev('fp-filter') },
        { text: 'Click <b>Install</b> and wait. This time the installation <b>fails</b>. Read the error message and the error code.', check: S => S.ev('install-failed', d => d.id === 'geogebra') },
        { text: 'Click <b>Retry</b>. It usually works the second time.', hint: 'The button is where the Install button was.', check: S => S.ev('install-done', d => d.id === 'geogebra') },
        { text: 'Click the <b>Installed</b> category on the left to see everything that is installed on the PC.', check: S => S.ev('fp-filter', d => d.filter === 'Installed') },
        { quiz: { q: 'The installation fails three times in a row. What do you do?', options: ['Give up and do something else', 'Write down the error code and the name of the app, and tell your teacher or IT', 'Try to download the program from the internet instead'], answer: 1 } },
        { quiz: { q: 'Why is it useful to keep the error code?', options: ['It gives you extra tries', 'It tells IT what went wrong, so they can help you', 'It removes the error'], answer: 1 } }
      ]
    }
  ]
};
KURS_PROG.splice(KURS_PROG.findIndex(k => k.id === 'p4'), 0, KURS_INSTALL);

/* ---------- Master tests and "do it for real" for the programming course ---------- */
function addMasterProg(id, m, ekte) { const k = KURS_PROG.find(x => x.id === id); if (k) { k.mesterprove = m; if (ekte) k.ekte = ekte; } }

addMasterProg('p1', {
  title: 'Find your way in the terminal',
  intro: 'Navigate to a given place without step-by-step instructions, and show where you are.',
  goals: [
    { text: 'Stand in the <b>Pictures</b> folder and list what is in it', check: S => cmd(S, d => d.name === 'Get-ChildItem' && ends(d.cwd, 'Pictures')) },
    { text: 'Go to <b>Documents</b> and show which folder you are in', check: S => cmd(S, d => d.name === 'Get-Location' && ends(d.cwd, 'Documents')) },
    { text: 'Go home again to <b>C:\\Users\\Student</b>', check: S => S.ev('term-cd', d => HOME_RX.test(d.path)) }
  ]
}, ['Open PowerShell on your own PC (right-click the Start button) and type pwd and ls.', 'Navigate to your Documents folder with cd.']);

addMasterProg('p2', {
  title: 'Create, fill and remove',
  intro: 'Build a small folder with contents from the terminal, and tidy up after yourself.',
  setup: F => { const p = F.resolve([...P_KODE, 'test']); if (p) F.purge(p.id); F.ensureFolder(P_KODE); },
  goals: [
    { text: 'Create the folder <b>test</b> in the Code folder', check: S => S.folderIn('test', P_KODE) },
    { text: 'Create the file <b>note.txt</b> inside it, with some text in it', check: S => S.fileIn('note.txt', [...P_KODE, 'test']) && S.content('note.txt').trim().length > 0 },
    { text: 'Show what is in the file with <b>cat</b>', check: S => S.ev('term-cat', d => /note\.txt/i.test(d.name)) },
    { text: 'Copy the file to <b>note-copy.txt</b>', check: S => S.fileIn('note-copy.txt', [...P_KODE, 'test']) }
  ]
}, ['Create a folder and a file from PowerShell on your own PC with mkdir and New-Item.']);

addMasterProg('p3', {
  title: 'Paths without hesitating',
  intro: 'Use both an absolute and a relative path, and a path with a space in it.',
  setup: F => { F.ensureFolder(P_KODE); F.ensureFolder(['This PC', 'Documents', 'My projects']); },
  goals: [
    { text: 'Go to the Code folder with an <b>absolute</b> path (the one that starts with C:\\)', check: S => S.ev('term-cd', d => /^c:/i.test(d.arg) && ends(d.path, 'Code')) },
    { text: 'Go to <b>My projects</b> with a relative path and quotation marks', check: S => S.ev('term-cd', d => ends(d.path, 'My projects') && !/^c:/i.test(d.arg)) },
    { text: 'List what is in <b>another</b> folder without going there', check: S => cmd(S, d => d.name === 'Get-ChildItem' && ((d.args[0] || '') + (d.opts.path || '')).length > 1) }
  ]
}, ['Navigate to a folder with a space in its name on your own PC, with quotation marks and with Tab.']);

addMasterProg('pi', {
  lukk: ['kode','firmaportal'],
  title: 'Get what you need yourself',
  intro: 'Get another app from the portal, and show that you know where installed apps end up.',
  goals: [
    { text: 'Install <b>Notepad++</b> from the Company Portal', check: S => S.ev('install-done', d => d.id === 'notepadpp') },
    { text: 'Show what is installed on the PC with the <b>Installed</b> category', check: S => S.ev('fp-filter', d => d.filter === 'Installed') },
    { text: 'Open <b>Code</b> from the Start menu', check: S => S.ev('window-open', d => d.app === 'kode' && d.via === 'startmenu') }
  ]
}, [
  'Open the Company Portal on your own school PC and see which apps are available.',
  'Install an app you need for a subject, and find it again in the Start menu.',
  'If an installation fails: write down the error code before you ask for help.'
]);

addMasterProg('p4', {
  title: 'Write, save, run',
  intro: 'Make a program from scratch that asks something and answers. No step-by-step instructions.',
  setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('master.py'); },
  goals: [
    { text: 'Create the file <b>master.py</b> in the Code folder', check: S => S.fileIn('master.py', P_KODE) },
    { text: 'The program must use <b>input()</b> and <b>print()</b>', check: S => /input\s*\(/.test(S.content('master.py')) && /print\s*\(/.test(S.content('master.py')) },
    { text: 'Run it without errors, and answer the question it asks', check: S => ran(S, 'master.py', d => d.ok && d.usedInput) }
  ]
}, ['Write a small Python program on your own PC in VS Code and run it in the terminal.']);

addMasterProg('p5', {
  title: 'Find and fix the bug',
  intro: 'A program is broken. Read the error message, find the line, and get it working.',
  setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('master-bug.py'); F.ensureFile(P_KODE, 'master-bug.py', 'numbers = [1, 2, 3]\nsum = 0\nfor n in numbers:\n    sum = sum + n\nprint("The sum is" sum)\n'); },
  goals: [
    { text: 'Run <b>master-bug.py</b> and look at the error message', check: S => ran(S, 'master-bug.py', d => !d.ok) },
    { text: 'Fix the error in the editor and save', check: S => S.ev('kode-save', d => d.name === 'master-bug.py') },
    { text: 'Run it again without errors, and get <b>The sum is 6</b>', check: S => ran(S, 'master-bug.py', d => d.ok && /6/.test(d.output)) }
  ]
}, ['Cause an error on purpose in a Python program on your own PC, and read the whole error message.']);

addMasterProg('p6', {
  title: 'Set up a project',
  intro: 'Build a project folder with data and code, and run it from the right place.',
  setup: F => { F.ensureFolder(P_KODE); const p = F.resolve([...P_KODE, 'masterproject']); if (p) F.purge(p.id); },
  goals: [
    { text: 'Create the folder <b>masterproject</b> with a subfolder <b>data</b>', check: S => S.folderIn('masterproject', P_KODE) && S.folderIn('data', [...P_KODE, 'masterproject']) },
    { text: 'Create a text file in <b>data</b> with at least two lines', check: S => { const f = S.folder([...P_KODE, 'masterproject', 'data']); return !!f && FS.children(f.id).some(c => c.type === 'file' && (c.content || '').split('\n').filter(x => x.trim()).length >= 2); } },
    { text: 'Create a program in the project folder that reads the file with <b>open()</b>, and run it without errors', check: S => S.ev('py-run', d => d.ok && /open\s*\(/.test(d.source) && /masterproject/i.test(d.path)) }
  ]
}, ['Make a project folder on your own PC with code and data in separate subfolders.']);

addMasterProg('p7', {
  title: 'The script that asks',
  intro: 'Make a PowerShell script that asks the user something and answers with their name.',
  setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('master.ps1'); },
  goals: [
    { text: 'Create <b>master.ps1</b> with both <b>Read-Host</b> and <b>Write-Host</b>', check: S => /read-host/i.test(S.content('master.ps1')) && /write-host/i.test(S.content('master.ps1')) },
    { text: 'Run the script the right way, with <b>.\\</b> in front of the name', check: S => S.ev('ps1-run', d => d.file === 'master.ps1' && d.ok) },
    { text: 'The script must use a <b>variable</b> with $ in what it prints', check: S => S.ev('ps1-run', d => d.file === 'master.ps1' && d.ok && /write-host\s+"[^"]*\$\w/i.test(d.source)) }
  ]
}, ['Run a PowerShell script on your own PC. If you get a message about execution policy, ask the person in charge of IT.']);

/* ---------- Weekly practice for the programming course ---------- */
const REPETISJON_PROG = [
  { id: 'pr1', kurs: 'p1', text: 'Show which folder you are in, and list what is in it.', check: S => cmd(S, d => d.name === 'Get-Location') && cmd(S, d => d.name === 'Get-ChildItem') },
  { id: 'pr2', kurs: 'p1', text: 'Go to <b>Documents</b> and then home again with <code>cd ~</code>.', check: S => S.ev('term-cd', d => ends(d.path, 'Documents')) && S.ev('term-cd', d => d.arg === '~') },
  { id: 'pr3', kurs: 'p2', text: 'Create the folder <b>weektest</b> in the Code folder, and delete it again.', setup: F => { F.ensureFolder(P_KODE); const p = F.resolve([...P_KODE, 'weektest']); if (p) F.purge(p.id); }, check: S => S.ev('term-new', d => /weektest/i.test(d.name)) && S.ev('term-rm', d => /weektest/i.test(d.name)) },
  { id: 'pr4', kurs: 'p2', text: 'Create the file <b>week.txt</b> with some text in it, and show what is in it with <code>cat</code>.', setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('week.txt'); }, check: S => S.content('week.txt').trim().length > 0 && S.ev('term-cat', d => /week\.txt/i.test(d.name)) },
  { id: 'pr5', kurs: 'p3', text: 'Use <code>tree</code> to see the structure of the Code folder.', check: S => S.ev('term-tree') },
  { id: 'pr6', kurs: 'p4', text: 'Create <b>week.py</b> that prints your name, and run it.', setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('week.py'); }, check: S => ran(S, 'week.py', d => d.ok && d.output.trim().length > 1) },
  { id: 'pr7', kurs: 'p5', text: 'Run <b>week-bug.py</b>, find the bug, fix it and run it again.', setup: F => { F.ensureFolder(P_KODE); F.silentRemoveAll('week-bug.py'); F.ensureFile(P_KODE, 'week-bug.py', 'name = "Ola"\nprint("Hello " + nme)\n'); }, check: S => ran(S, 'week-bug.py', d => !d.ok) && ran(S, 'week-bug.py', d => d.ok) },
  { id: 'pr8', kurs: 'p6', text: 'Send the output from a Python program to a file with <code>&gt;</code>.', check: S => S.ev('term-redirect') },
  { id: 'pr9', kurs: 'p7', text: 'Run a PowerShell script with <code>.\\</code> in front of the name.', setup: F => { F.ensureFolder(P_KODE); F.ensureFile(P_KODE, 'week.ps1', 'Write-Host "Weekly script"\n'); }, check: S => S.ev('ps1-run', d => d.ok) }
];

window.KURS_ACTIVE = KURS_PROG;
window.REP_ACTIVE = REPETISJON_PROG;
