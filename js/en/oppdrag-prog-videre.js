/* Programming, continued (choices, loops, lists, functions, debugging, files) and Expert (Git and pip).
   Comes after oppdrag-prog.js and uses the helpers from there (ran, innhold, noenFil, cmd, ends, same, P_KODE).
   Many checks run the student's own program with given answers (pyTest), so we can see that the program
   works, not just that it contains the right words. */
(function () {
  const DEL = 'Programming, continued';
  const DEL_DESC = 'Choices, loops, lists, functions, debugging and files. What you learn in class, practised on your own.';
  const DEL2 = 'Expert';
  const DEL2_DESC = 'Tools programmers use every day: version control with Git and packages with pip.';
  const kode = name => innhold(P_KODE, name);
  const P_SPILL = [...P_KODE, 'game'];
  const P_VITS = [...P_KODE, 'jokes'];

  /* Runs a Python program with given answers to input(). Files are read from the folder (reading only, no writing).
     The result is remembered, because the checks run often (on every event). */
  const cache = new Map();
  function pyTest(src, inputs = [], folder = P_KODE) {
    const key = folder.join('/') + '\u0000' + inputs.join('\u0001') + '\u0000' + src;
    if (cache.has(key)) return cache.get(key);
    const ins = inputs.slice(); let out = '', steps = 0, res;
    const fsApi = {
      open: (path, mode) => {
        if (/[wa]/.test(mode)) return { content: '' };
        const f = FS.resolve([...folder, ...String(path).split(/[\\/]/).filter(Boolean)]);
        return f && f.type === 'file' ? { content: f.content || '' } : { error: `[Errno 2] No such file or directory: '${path}'`, errorType: 'FileNotFoundError' };
      },
      write: () => ({}),
      hasPkg: n => !!(window.Pip && Pip.has(n))
    };
    try {
      const g = Pyth.run(src || '', 'test.py', fsApi);
      let r = g.next();
      while (!r.done) {
        const y = r.value;
        if (++steps > 400000) { res = { ok: false, out, error: 'timeout' }; break; }
        if (y.type === 'out') { out += y.text; r = g.next(); }
        else if (y.type === 'input') { if (!ins.length) { res = { ok: false, out, error: 'needInput' }; break; } r = g.next(ins.shift()); }
        else r = g.next();
      }
      if (!res) { const v = r.value || {}; res = { ok: !!v.ok, out, error: v.error || null }; }
      res.used = inputs.length - ins.length;
    } catch (e) { res = { ok: false, out, error: 'crash' }; }
    if (cache.size > 200) cache.clear();
    cache.set(key, res);
    return res;
  }
  /* The number n is in the output (also with zeros after it, like 4.50 or 3.0, but not as the start of 3.75) */
  const num = (out, n) => new RegExp('(^|[^\\d.,])' + String(n).replace('.', '[.,]') + (String(n).includes('.') ? '0*' : '(?:[.,]0+)?') + '(?![.,]?\\d)').test(out);
  /* A number in the output is value, rounded to as many decimals as the student printed (4.38 and 4.375 for 4.375) */
  const approx = (out, value) => ((out || '').match(/-?\d+(?:[.,]\d+)?/g) || []).some(s => {
    const d = (s.split(/[.,]/)[1] || '').length;
    return Math.abs(parseFloat(s.replace(',', '.')) - value) <= (d ? Math.max(1e-9, 0.51 * Math.pow(10, -d)) : 1e-9);
  });
  const has = (src, re) => re.test(src || '');
  /* Answers to input() when we only test a function at the bottom, so programs that ask for something don't stop */
  const DUMMY = Array(10).fill('0');
  /* "Correct" but not "Incorrect" */
  const correct = s => /\bcorrect\b/i.test(s) && !/incorrect/i.test(s);
  const lines = s => (s || '').split('\n').filter(l => l.trim());
  /* Did the student run the program from the Code folder (or a subfolder) without errors? */
  const ranOk = (S, file, pred) => ran(S, file, d => d.ok && (!pred || pred(d)));
  const gitEv = (S, cmdName, pred) => S.ev('git', d => d.cmd === cmdName && (!pred || pred(d)));
  const pipEv = (S, cmdName, pred) => S.ev('pip', d => d.cmd === cmdName && (!pred || pred(d)));
  const repo = path => { const f = FS.resolve(path); return f && window.Git ? Git.repoAt(f.id) : null; };
  const purge = path => { const f = FS.resolve(path); if (f) FS.purge(f.id); };

  const WELCOME_MESSY = 'print("*************")\nprint("Hi, Ada!")\nprint("Welcome to the code club.")\nprint("*************")\nprint("*************")\nprint("Hi, Linus!")\nprint("Welcome to the code club.")\nprint("*************")\nprint("*************")\nprint("Hi, Grace!")\nprint("Welcome to the code club.")\nprint("*************")\n';
  const welcomeOut = () => pyTest(WELCOME_MESSY).out;
  const AVERAGE = 'numbers = [4, 8, 6, 2]\ntotal = 0\nfor n in numbers:\n    total = total + n\naverage = total / 2\nprint("The average is", average)\n';
  const TENYEARS = 'age = int(input("How old are you? "))\nprint("In ten years you will be", age + 10)\n';
  const STATS = 'grades = [5, 3, 6, 4, 4, 5]\n\n# Print the sum, the number of grades, the average, the highest and the lowest grade\n';
  const POINTS = 'Ada;12\nLinus;7\nGrace;15\nAlan;9\n';
  const GOT4 = 'grades = [2, 4, 5, 3, 6, 4, 1]\ncount = 0\nfor g in grades:\n    if g > 4:\n        count = count + 1\nprint("Got 4 or better:", count)\n';
  const TEMP = '3\n-2\n5\n8\n1\n';

  /* ============================================================ */
  const P8 = {
    id: 'p8', title: 'Choices: if, elif and else', laerTitle: 'choices in programs', del: DEL, delDesc: DEL_DESC,
    desc: 'Programs that do different things depending on the answer: comparisons, if, elif and else.',
    laer: `
      <h4>The program chooses</h4>
      <p>With <code>if</code>, the program runs some lines only when a <b>condition</b> is true. <code>else</code> takes the rest. The lines that belong to it are <b>indented</b> (4 spaces), and the line above ends with a <b>colon</b>.</p>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">answer = input("What is 2 + 2? ")
if answer == "4":
    print("Correct!")
else:
    print("Wrong, it is 4.")</pre>
      <h4>Comparisons</h4>
      <table><tr><th>Write</th><th>Means</th></tr>
      <tr><td><code>==</code></td><td>is equal to (two equals signs! One = means “store in a variable”)</td></tr>
      <tr><td><code>!=</code></td><td>is not equal to</td></tr>
      <tr><td><code>&lt;</code> <code>&gt;</code> <code>&lt;=</code> <code>&gt;=</code></td><td>less than, greater than, less than or equal, greater than or equal</td></tr>
      <tr><td><code>and</code>, <code>or</code>, <code>not</code></td><td>both must be true, one must be true, the opposite</td></tr></table>
      <h4>More choices with elif</h4>
      <p><code>elif</code> means “else, if”. Python checks from the top and runs <b>only the first</b> one that is true:</p>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">if points >= 90:
    print("Grade 6")
elif points >= 75:
    print("Grade 5")
else:
    print("Lower than 5")</pre>
      <p><b>Remember:</b> <code>input()</code> always gives text. To compare with numbers, use <code>int(input(...))</code>. Capital and small letters are different: <code>"Oslo" == "oslo"</code> is false. Use <code>.lower()</code> to turn text into small letters.</p>`,
    oppdrag: [
      {
        id: 'p8o1', title: 'Correct or wrong?', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('quiz.py'); },
        steps: [
          { laer: true, quiz: { q: 'What is the difference between = and == in Python?', options: ['= stores a value, == compares two values', 'No difference, you can use either one', '== stores a value, = compares two values'], answer: 0 } },
          { laer: true, quiz: { q: 'Why do the lines under if have to be indented?', options: ['It shows which lines belong to the if', 'It is only there to make the code look nicer', 'It makes Python run those lines faster'], answer: 0 } },
          { laer: true, quiz: { q: 'points is 80. What does the if/elif/else example print?', options: ['Grade 6', 'Grade 5', 'Both Grade 6 and Grade 5'], answer: 1 } },
          { text: 'Create the file <code>quiz.py</code> in the Code folder and open it in Code.', check: S => S.fileIn('quiz.py', P_KODE) },
          { text: 'Write a program that asks <b>“What is the capital of Norway?”</b>. If the answer is <b>Oslo</b>, it prints <b>Correct!</b>, otherwise <b>Wrong</b>. Save.', hint: 'answer = input("What is the capital of Norway? ")\nif answer == "Oslo":\n    print("Correct!")\nelse:\n    print("Wrong")', check: S => { const c = kode('quiz.py'); return has(c, /input\s*\(/) && has(c, /^\s*if\b.*:/m) && has(c, /^\s*else\s*:/m); } },
          { text: 'Run the program and answer <b>Oslo</b>.', check: S => ranOk(S, 'quiz.py', d => d.usedInput && correct(d.output)) },
          { text: 'Run it again and answer something else, for example Bergen.', check: S => ranOk(S, 'quiz.py', d => d.usedInput && /wrong|incorrect/i.test(d.output)) },
          { text: 'Answer <b>oslo</b> with a small first letter. The program says Wrong! Fix it with <code>.lower()</code>, so that Oslo, oslo and OSLO are all correct. Save.', hint: 'if answer.lower() == "oslo":', check: S => { const c = kode('quiz.py'); const o = a => pyTest(c, [a]).out; return correct(o('Oslo')) && o('oslo') === o('Oslo') && o('OSLO') === o('Oslo') && o('Bergen') !== o('Oslo'); } },
          { quiz: { q: 'What does elif mean?', options: ['“Else, if”: a new condition', 'The same as else, just written shorter', '“End if”: closes the if block'], answer: 0 } }
        ]
      },
      {
        id: 'p8o2', title: 'The grade calculator', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('grade.py'); },
        steps: [
          { text: 'Create <code>grade.py</code>. The program asks for <b>points</b> (0–100) and prints the grade: <b>90+</b> gives 6, <b>75+</b> gives 5, <b>60+</b> gives 4, <b>45+</b> gives 3, <b>30+</b> gives 2, otherwise 1. Print for example <code>Grade 5</code>.', hint: 'points = int(input("Points: "))\nif points >= 90:\n    print("Grade 6")\nelif points >= 75:\n    print("Grade 5")\n… and so on, with else at the end.', check: S => { const c = kode('grade.py'); return (c.match(/\belif\b/g) || []).length >= 2; } },
          { text: 'Run the program and try a few scores.', check: S => ranOk(S, 'grade.py', d => d.usedInput) },
          { text: 'The guide now tests your program with <b>95, 80, 62, 50, 35</b> and <b>10</b> points. Fix it until they all give the right grade (6, 5, 4, 3, 2, 1), and save.', hint: 'Are the biggest limits at the top? Python only runs the first one that is true, so >= 90 has to come before >= 75.', check: S => { const c = kode('grade.py'); return [[95, 6], [80, 5], [62, 4], [50, 3], [35, 2], [10, 1]].every(([p, k]) => { const r = pyTest(c, [String(p)]); return r.ok && num(r.out, k) && [1, 2, 3, 4, 5, 6].filter(x => x !== k).every(x => !num(r.out, x)); }); } },
          { quiz: { q: 'A student has exactly 90 points. Which grade does she get with “if points >= 90”?', options: ['5', '6', 'None'], answer: 1 } },
          { quiz: { q: 'What happens if you write “if points >= 30” at the top, before the others?', options: ['Everyone with 30 or more gets 2', 'Nothing, Python finds the best limit by itself', 'The program crashes because the limits are in the wrong order'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P9 = {
    id: 'p9', title: 'Loops: for and while', laerTitle: 'loops', del: DEL, delDesc: DEL_DESC,
    desc: 'Repeat things with for and range(), and with while until something happens.',
    laer: `
      <h4>for: do something a set number of times</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">for i in range(1, 6):
    print(i)</pre>
      <p>prints 1, 2, 3, 4, 5. <code>range(1, 6)</code> starts at 1 and stops <b>before</b> 6. <code>range(5)</code> gives 0 to 4.</p>
      <h4>while: do something as long as a condition is true</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">answer = ""
while answer != "yes":
    answer = input("Are you ready? ")</pre>
      <p>Use <code>while</code> when you don't know how many times it has to repeat, for example until the user guesses right. <code>break</code> jumps out of the loop straight away.</p>
      <p>If you forget to change what the condition checks, the loop never stops. Then you press <kbd>Ctrl</kbd>+<kbd>C</kbd> in the terminal.</p>
      <table><tr><th>Use</th><th>When</th></tr><tr><td><code>for</code></td><td>You know how many times, or you are going through a list</td></tr><tr><td><code>while</code></td><td>It should repeat until something happens</td></tr></table>`,
    oppdrag: [
      {
        id: 'p9o1', title: 'The times table', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('times-table.py'); },
        steps: [
          { laer: true, quiz: { q: 'Which numbers does range(1, 5) give?', options: ['1, 2, 3, 4', '1, 2, 3, 4, 5', '0, 1, 2, 3, 4'], answer: 0 } },
          { laer: true, quiz: { q: 'When is while a better fit than for?', options: ['When you do not know how many times', 'When you know exactly how many times it has to repeat', 'When you are going through every element in a list'], answer: 0 } },
          { laer: true, quiz: { q: 'A while loop never stops. What do you do?', options: ['Ctrl+C in the terminal', 'Wait until the loop runs out by itself', 'Save the file again, and it stops'], answer: 0 } },
          { text: 'Create <code>times-table.py</code> that asks which times table the user wants to see, and prints the first ten lines with a <code>for</code> loop, for example <code>3 x 7 = 21</code>.', hint: 'number = int(input("Which times table? "))\nfor i in range(1, 11):\n    print(i, "x", number, "=", i * number)', check: S => { const c = kode('times-table.py'); return has(c, /\bfor\b.+\bin\b/) && has(c, /range\s*\(/); } },
          { text: 'Run the program and choose the 7 times table.', check: S => ranOk(S, 'times-table.py', d => d.usedInput && lines(d.output).length >= 10) },
          { text: 'The guide tests with 7 and 12. Both must give ten lines ending in 70 and 120. Fix it and save.', hint: 'Does it say range(1, 10)? Then you only get nine lines: range stops before the last number.', check: S => { const c = kode('times-table.py'); return [7, 12].every(t => { const r = pyTest(c, [String(t)]); const L = lines(r.out); const S10 = L.slice(-10); return r.ok && L.length >= 10 && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].every((i, k) => num(S10[k], i * t)); }); } }
        ]
      },
      {
        id: 'p9o2', title: 'Guess the number', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('guess.py'); },
        steps: [
          { text: 'Create <code>guess.py</code>: the program thinks of a random number from 1 to 100 (<code>random.randint</code>). The user guesses with a <code>while</code> loop until it is right. Say <b>Too low</b> or <b>Too high</b> along the way, and <b>Correct!</b> at the end.', hint: 'import random\nsecret = random.randint(1, 100)\nguess = 0\nwhile guess != secret:\n    guess = int(input("Guess: "))\n    if guess < secret:\n        print("Too low")\n    elif guess > secret:\n        print("Too high")\nprint("Correct!")', check: S => { const c = kode('guess.py'); return has(c, /\bwhile\b/) && has(c, /randint/) && has(c, /input\s*\(/); } },
          { text: 'Play until you have guessed right.', hint: 'Guess 50 first. If it is too low, guess 75, and so on. That way you find it in seven tries at most.', check: S => ranOk(S, 'guess.py', d => d.usedInput && /correct|congratulations|well done/i.test(d.output)) },
          { text: 'The guide now plays against your program and guesses 1, 2, 3 … until it is right. The program should say Too low along the way and stop when it is right.', check: S => { const r = pyTest(kode('guess.py'), Array.from({ length: 100 }, (_, i) => String(i + 1))); return r.ok && /correct|congratulations|well done/i.test(r.out) && (/low|high/i.test(r.out) || r.used === 1); } },
          { text: 'Extend the game: count the number of guesses, and print <b>“You used N guesses”</b> at the end.', hint: 'guesses = 0 before the loop, and guesses = guesses + 1 inside the loop. At the end: print("You used", guesses, "guesses")', check: S => { const c = kode('guess.py'); const r = pyTest(c, Array.from({ length: 100 }, (_, i) => String(i + 1))); if (!r.ok) return false; const all = [...r.out.matchAll(/(\d+)\s*(?:guesses|guess|tries|attempts)|(?:guesses|tries|attempts)\D{0,15}?(\d+)/gi)]; const m = all[all.length - 1]; return !!m && +(m[1] || m[2]) === r.used; } },
          { quiz: { q: 'Why does while suit a guessing game?', options: ['We do not know how many guesses are needed', 'while is always faster than a for loop', 'for loops cannot use input() inside them'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P10 = {
    id: 'p10', title: 'Lists', laerTitle: 'lists', del: DEL, delDesc: DEL_DESC,
    desc: 'Many values in one variable: make lists, add to them, go through them with for, and do maths on them.',
    laer: `
      <h4>A list holds many values</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">fruit = ["apple", "banana", "pear"]
print(fruit[0])        # apple (the first is number 0!)
print(fruit[-1])       # pear (the last)
fruit.append("kiwi")   # add to the end
print(len(fruit))      # 4
for f in fruit:
    print("I like", f)</pre>
      <table><tr><th>Write</th><th>Gives</th></tr>
      <tr><td><code>len(list)</code></td><td>the number of elements</td></tr>
      <tr><td><code>sum(list)</code>, <code>max(list)</code>, <code>min(list)</code></td><td>the sum, the largest, the smallest (for numbers)</td></tr>
      <tr><td><code>list.append(x)</code></td><td>adds x to the end</td></tr>
      <tr><td><code>x in list</code></td><td>True if x is in the list</td></tr>
      <tr><td><code>sorted(list)</code></td><td>a sorted copy</td></tr></table>
      <p>If you try to get an element that doesn't exist, for example <code>fruit[10]</code>, you get an <b>IndexError</b>.</p>`,
    oppdrag: [
      {
        id: 'p10o1', title: 'The shopping list', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('shopping-list.py'); },
        steps: [
          { laer: true, quiz: { q: 'fruit = ["apple", "banana", "pear"]. What is fruit[1]?', options: ['apple', 'banana', 'pear'], answer: 1 } },
          { laer: true, quiz: { q: 'How do you add "kiwi" to the end of the list?', options: ['fruit.append("kiwi")', 'fruit.add("kiwi")', 'append(fruit, "kiwi")'], answer: 0 } },
          { laer: true, quiz: { q: 'The list has 3 elements. What happens with fruit[3]?', options: ['You get the third element, “pear”', 'IndexError: the last is fruit[2]', 'You get None, because the spot is empty'], answer: 1 } },
          { text: 'Create <code>shopping-list.py</code>: the program asks for items one at a time and adds them to a list with <code>append</code>. When the user presses Enter without typing anything, it stops, prints <b>how many</b> items there are, and then each item on its own line.', hint: 'items = []\nwhile True:\n    item = input("Item (empty to finish): ")\n    if item == "":\n        break\n    items.append(item)\nprint("You need to buy", len(items), "things:")\nfor i in items:\n    print("-", i)', check: S => { const c = kode('shopping-list.py'); return has(c, /\.append\s*\(/) && has(c, /\bfor\b/); } },
          { text: 'Run the program and type in a few items.', check: S => ranOk(S, 'shopping-list.py', d => d.usedInput) },
          { text: 'The guide tests with <b>milk, bread, cheese</b> and an empty line. The output should have all three and the number 3.', check: S => { const r = pyTest(kode('shopping-list.py'), ['milk', 'bread', 'cheese', '']); return r.ok && /milk/.test(r.out) && /bread/.test(r.out) && /cheese/.test(r.out) && num(r.out, 3); } }
        ]
      },
      {
        id: 'p10o2', title: 'Grade statistics', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('stats.py'); F.ensureFile(P_KODE, 'stats.py', STATS); },
        steps: [
          { text: 'Open <code>stats.py</code> in Code. It has a list of grades.', check: S => S.ev('kode-open') || /grades/.test(S.kodeText()) },
          { text: 'Print the <b>sum</b>, the <b>number</b> of grades and the <b>average</b> (the sum divided by the number). Use <code>sum()</code> and <code>len()</code>.', hint: 'print("Sum:", sum(grades))\nprint("Number:", len(grades))\nprint("Average:", sum(grades) / len(grades))', check: S => { const r = pyTest(kode('stats.py')); return r.ok && num(r.out, 27) && num(r.out, 6) && approx(r.out, 4.5); } },
          { text: 'Also print the <b>highest</b> and the <b>lowest</b> grade with <code>max()</code> and <code>min()</code>. Run the program.', check: S => ranOk(S, 'stats.py', d => /max\s*\(/.test(d.source) && /min\s*\(/.test(d.source) && num(d.output, 6) && num(d.output, 3)) },
          { text: 'Add two more grades to the list, for example 2 and 6. The program should still work everything out correctly without you changing anything else. Save and run.', check: S => { const c = kode('stats.py'); const m = /grades\s*=\s*\[([^\]]*)\]/.exec(c); if (!m) return false; const xs = m[1].split(',').map(x => parseFloat(x)).filter(x => !isNaN(x)); if (xs.length < 8) return false; const r = pyTest(c); const avg = xs.reduce((a, b) => a + b, 0) / xs.length; return r.ok && approx(r.out, avg); } },
          { quiz: { q: 'Why is sum(grades) / len(grades) better than writing 27 / 6?', options: ['It is still right if the list changes', 'Python calculates faster with sum() than with numbers', 'It is not better, just a different way to write it'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P11 = {
    id: 'p11', title: 'Functions', laerTitle: 'functions', del: DEL, delDesc: DEL_DESC,
    desc: 'Make your own functions with def and return, and tidy up code that repeats itself.',
    laer: `
      <h4>A function is a named piece of code</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">def area(length, width):
    return length * width

print(area(4, 5))   # 20
print(area(3, 7))   # 21</pre>
      <ul><li><code>def</code> makes the function. Nothing happens until you <b>call</b> it: <code>area(4, 5)</code>.</li>
      <li><code>length</code> and <code>width</code> are <b>parameters</b>: the names the function uses for the values it gets.</li>
      <li><code>return</code> gives the answer back to whoever called the function. <code>print</code> only shows something on the screen.</li></ul>
      <h4>Why functions?</h4>
      <p>If you write the same code several times, it is time for a function. Then you fix mistakes in one place, and the code is easier to read. Good function names say what the function does: <code>work_out_average</code>, <code>greet</code>.</p>`,
    oppdrag: [
      {
        id: 'p11o1', title: 'Your first function', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('area.py'); },
        steps: [
          { laer: true, quiz: { q: 'What does def do?', options: ['Makes a function', 'Runs a function', 'Deletes a variable'], answer: 0 } },
          { laer: true, quiz: { q: 'What is the difference between return and print?', options: ['return gives the value back, print only shows it', 'None, both show the value on the screen', 'print gives the value back, return shows it'], answer: 0 } },
          { laer: true, quiz: { q: 'You have written a function with def, but nothing happens when you run it. Why?', options: ['The function has not been called', 'The def line has to be at the bottom', 'You have to import the function first'], answer: 0 } },
          { text: 'Create <code>area.py</code> with the function <code>area(length, width)</code> that <b>returns</b> the area of a rectangle. Print the area of a 4 × 5 rectangle and a 3 × 7 rectangle.', check: S => { const c = kode('area.py'); return has(c, /def\s+area\s*\(/) && has(c, /\breturn\b/); } },
          { text: 'Run the program. You should get 20 and 21.', check: S => ranOk(S, 'area.py', d => num(d.output, 20) && num(d.output, 21)) },
          { text: 'The guide now calls your function with 6 and 2. It should give back 12 with <code>return</code> (not just print it).', hint: 'Does it say print instead of return inside the function? Then the code that calls it only gets None back.', check: S => { const r = pyTest(kode('area.py') + '\n__answer = area(6, 2)\nprint("TEST", __answer)\n', DUMMY); return /TEST 12\b/.test(r.out); } },
          { text: 'Make another function: <code>perimeter(length, width)</code>, which returns the perimeter (2 × length + 2 × width). Print the perimeter of 4 × 5.', check: S => { const r = pyTest(kode('area.py') + '\nprint("TEST", perimeter(6, 2))\n', DUMMY); return /TEST 16\b/.test(r.out); } }
        ]
      },
      {
        id: 'p11o2', title: 'Tidy up with a function', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('welcome.py'); F.ensureFile(P_KODE, 'welcome.py', WELCOME_MESSY); },
        steps: [
          { text: 'Open and run <code>welcome.py</code>. Look at the code: the same four lines are there three times.', check: S => ran(S, 'welcome.py') },
          { text: 'Make a function <code>greet(name)</code> that prints the four lines for one name. Replace the twelve lines with three calls: <code>greet("Ada")</code>, <code>greet("Linus")</code>, <code>greet("Grace")</code>.', hint: 'def greet(name):\n    print("*************")\n    print("Hi, " + name + "!")\n    print("Welcome to the code club.")\n    print("*************")', check: S => { const c = kode('welcome.py'); return has(c, /def\s+greet\s*\(/) && (c.match(/^\s*greet\s*\(/gm) || []).length >= 3; } },
          { text: 'Run the program. The output should be <b>exactly the same</b> as before, but the code is much shorter.', check: S => { const c = kode('welcome.py'); const r = pyTest(c); return r.ok && r.out.replace(/\s+/g, ' ').trim() === welcomeOut().replace(/\s+/g, ' ').trim() && (c.match(/print\s*\(/g) || []).length <= 5 && ranOk(S, 'welcome.py'); } },
          { text: 'Now the text should change to “Welcome to <b>coding</b>.”. Change it in one place, in the function, and run it.', check: S => { const c = kode('welcome.py'); const r = pyTest(c); return r.ok && (r.out.match(/welcome to coding/gi) || []).length >= 3 && (c.match(/welcome to coding/gi) || []).length === 1; } },
          { quiz: { q: 'What was the biggest advantage of the function?', options: ['You change the text in one place', 'The program runs much faster with functions', 'The function prints text without print'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P12 = {
    id: 'p12', title: 'Debugging 2', laerTitle: 'logic errors and try/except', del: DEL, delDesc: DEL_DESC,
    desc: 'Find bugs that give no error message, and make programs that can handle bad input.',
    laer: `
      <h4>Three kinds of error</h4>
      <table><tr><th>Error</th><th>What happens</th><th>Example</th></tr>
      <tr><td>Syntax error</td><td>The program doesn't start</td><td>A missing <code>:</code> or <code>)</code></td></tr>
      <tr><td>Runtime error</td><td>The program crashes part of the way through</td><td><code>int("ten")</code> gives ValueError</td></tr>
      <tr><td><b>Logic error</b></td><td>The program runs, but the answer is <b>wrong</b></td><td>Dividing by 2 instead of by the number of values</td></tr></table>
      <h4>Find a logic error</h4>
      <ol><li>Test with something you <b>know</b> the answer to (the average of 2 and 4 is 3).</li>
      <li>Put a <code>print()</code> in the middle of the code and see what the variables actually contain.</li>
      <li>Explain the code line by line out loud, to a friend or a rubber duck. You often spot the bug while you explain.</li></ol>
      <h4>Handle bad input with try/except</h4>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">try:
    age = int(input("Age: "))
except ValueError:
    print("Type your age as a number.")</pre>
      <p>The code in <code>try</code> is attempted. If it goes wrong with exactly that error, <code>except</code> runs instead of the program crashing. Write the name of the error (<code>ValueError</code>), so you don't hide other errors.</p>`,
    oppdrag: [
      {
        id: 'p12o1', title: 'The program is lying', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('average.py'); F.ensureFile(P_KODE, 'average.py', AVERAGE); },
        steps: [
          { laer: true, quiz: { q: 'The program runs without an error message, but the answer is wrong. What kind of error is it?', options: ['Syntax error', 'Logic error', 'No error'], answer: 1 } },
          { laer: true, quiz: { q: 'What is a good way to find a logic error?', options: ['Put in print() and look at the variables', 'Write the whole program again from scratch', 'Run it lots of times until the answer is right'], answer: 0 } },
          { laer: true, quiz: { q: 'Why do we write except ValueError and not just except?', options: ['So we do not hide other errors', 'Because except on its own gives a SyntaxError', 'So the program prints the name of the error'], answer: 0 } },
          { text: 'Run <code>average.py</code>. It works out the average of 4, 8, 6 and 2.', check: S => ran(S, 'average.py') },
          { quiz: { q: 'The average of 4, 8, 6 and 2 is 20 / 4. What should the program have said?', options: ['10.0', '5.0', '20'], answer: 1 } },
          { text: 'The program says 10.0. Add a line just above <code>average = …</code> that prints <code>total</code> and <code>len(numbers)</code>, and run it again. What do you see?', check: S => ranOk(S, 'average.py', d => (d.source.match(/print\s*\(/g) || []).length >= 2 && num(d.output, 20)) },
          { text: 'The bug is that the program divides by 2 instead of by the number of numbers. Fix it with <code>len(numbers)</code>, remove the debugging line, and run it.', check: S => { const c = kode('average.py'); const r = pyTest(c); const r2 = pyTest(c.replace(/numbers\s*=\s*\[[^\]]*\]/, 'numbers = [1, 2, 3, 4, 5]')); return r.ok && num(r.out, 5) && r2.ok && num(r2.out, 3) && ranOk(S, 'average.py', d => num(d.output, 5)); } }
        ]
      },
      {
        id: 'p12o2', title: 'Handle bad input', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('ten-years.py'); F.ensureFile(P_KODE, 'ten-years.py', TENYEARS); },
        steps: [
          { text: 'Run <code>ten-years.py</code> and answer <b>ten</b> (in letters). The program crashes with a <b>ValueError</b>.', check: S => ran(S, 'ten-years.py', d => d.error === 'ValueError' || d.usedInput) },
          { text: 'Wrap the code in <code>try</code> and <code>except ValueError</code>, so that the program prints a friendly message instead of crashing. Save.', hint: 'try:\n    age = int(input("How old are you? "))\n    print("In ten years you will be", age + 10)\nexcept ValueError:\n    print("Type your age as a number, for example 14.")', check: S => { const c = kode('ten-years.py'); const a = pyTest(c, ['ten']), b = pyTest(c, ['14']); return has(c, /\btry\s*:/) && has(c, /except\s+ValueError/) && (a.ok || a.error === 'needInput') && a.out.trim().length > 0 && b.ok && num(b.out, 24); } },
          { text: 'Run it and answer <b>ten</b> again. Now it does not crash.', check: S => ranOk(S, 'ten-years.py', d => d.usedInput && !/Traceback/.test(d.output)) },
          { text: 'Make the program even better: put it in a <code>while True</code> loop, so it asks again until the answer is a number. Use <code>break</code> when it worked.', hint: 'while True:\n    try:\n        age = int(input("How old are you? "))\n        break\n    except ValueError:\n        print("Type your age as a number.")\nprint("In ten years you will be", age + 10)', check: S => { const r = pyTest(kode('ten-years.py'), ['ten', 'fifteen', '14']); return r.ok && num(r.out, 24); } }
        ]
      }
    ]
  };

  /* ============================================================ */
  const P13 = {
    id: 'p13', title: 'Data in files', laerTitle: 'reading and writing files', del: DEL, delDesc: DEL_DESC,
    desc: 'Save data from the program in a file, and read a file and do maths on what is in it.',
    laer: `
      <h4>The program forgets everything when it ends</h4>
      <p>Variables disappear when the program has finished. If something has to be remembered until next time, it must be saved in a <b>file</b>.</p>
      <table><tr><th>Mode</th><th>Means</th></tr>
      <tr><td><code>"r"</code></td><td>read (the default)</td></tr>
      <tr><td><code>"w"</code></td><td>write: creates the file, or <b>deletes</b> what is in it and writes again</td></tr>
      <tr><td><code>"a"</code></td><td>add to the end (append)</td></tr></table>
      <pre style="background:#fff;border:1px solid #e5e7eb;padding:8px;font-size:12px">with open("log.txt", "a") as f:
    f.write("A new line\\n")

with open("points.txt") as f:
    for line in f:
        name, points = line.strip().split(";")
        print(name, int(points))</pre>
      <ul><li><code>with</code> closes the file by itself when the block has finished.</li>
      <li><code>write</code> doesn't make a new line by itself: remember <code>"\\n"</code>.</li>
      <li>What you read is text. <code>.strip()</code> removes the line break, <code>.split(";")</code> splits it up, and <code>int()</code> turns it into a number.</li>
      <li>The path is relative to the folder you run the program from.</li></ul>`,
    oppdrag: [
      {
        id: 'p13o1', title: 'The diary', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('diary.py'); FS.silentRemoveAll('diary.txt'); },
        steps: [
          { laer: true, quiz: { q: 'You open a file with "w" and write one line. What happens to what was there before?', options: ['It is gone', 'It stays, and the line is added at the end', 'The line is added at the top of the file'], answer: 0 } },
          { laer: true, quiz: { q: 'What does "\\n" do in f.write("Hi\\n")?', options: ['Makes a line break', 'Writes the letter n in the file', 'Saves and closes the file'], answer: 0 } },
          { laer: true, quiz: { q: 'You read "15\\n" from a file. What do you have to do before you can calculate with it?', options: ['int(text.strip())', 'Nothing, it is a number', 'str(text) + 1'], answer: 0 } },
          { text: 'Create <code>diary.py</code> that asks <b>“What did you do today?”</b> and adds the answer to the end of the file <code>diary.txt</code> (use <code>"a"</code>). Print <b>Saved!</b> afterwards.', hint: 'text = input("What did you do today? ")\nwith open("diary.txt", "a") as f:\n    f.write(text + "\\n")\nprint("Saved!")', check: S => { const c = kode('diary.py'); return has(c, /open\s*\(/) && has(c, /["']a["']/) && has(c, /\.write\s*\(/); } },
          { text: 'Run the program twice with different answers.', hint: 'Do both answers end up on the same line in diary.txt? write does not make a line break by itself. Write f.write(text + "\\n").', check: S => S.evCount('py-run', d => same(d.file, 'diary.py') && d.ok && d.usedInput) >= 2 && lines(kode('diary.txt')).length >= 2 },
          { text: 'Look at the diary from the terminal: <code>cat diary.txt</code>. Both lines should be there.', check: S => S.ev('term-cat', d => same(d.name, 'diary.txt')) },
          { quiz: { q: 'What would have happened if you had used "w" instead of "a"?', options: ['Only the last answer would be left', 'Both answers would be there, newest at the top', 'The program would crash because the file exists'], answer: 0 } }
        ]
      },
      {
        id: 'p13o2', title: 'Do maths on data from a file', lukk: ['kode'],
        setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('points.py'); FS.silentRemoveAll('points.txt'); F.ensureFile(P_KODE, 'points.txt', POINTS); },
        steps: [
          { text: 'Look at <code>points.txt</code> with <code>cat points.txt</code>. Each line has a name and a score, separated by a semicolon.', check: S => S.ev('term-cat', d => same(d.name, 'points.txt')) },
          { text: 'Create <code>points.py</code> that reads the file, prints each person with their score, and at the end <b>the total of all the points</b>.', hint: 'total = 0\nwith open("points.txt") as f:\n    for line in f:\n        name, p = line.strip().split(";")\n        total = total + int(p)\n        print(name, p)\nprint("Total:", total)', check: S => { const r = pyTest(kode('points.py')); return r.ok && num(r.out, 43) && /ada/i.test(r.out) && /grace/i.test(r.out); } },
          { text: 'Find the <b>winner</b> too: print the name of the person with the most points. Run the program from the Code folder.', hint: 'Remember the best so far: best_name = "" and best = -1 before the loop. Inside the loop: if int(p) > best: best = int(p); best_name = name', check: S => ranOk(S, 'points.py', d => { const L = lines(d.output), kw = /winn|won|best|most|high|lead|top|first|number 1/i; return L.some((l, i) => /grace/i.test(l) && (kw.test(l) || (i > 0 && kw.test(L[i - 1])))); }) },
          { quiz: { q: 'The program gives FileNotFoundError, but points.txt exists. What is most likely?', options: ['You are running it from a different folder', 'The file is too big for Python to open it', 'Python can only read .py files, not .txt'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================
     EXPERT: Git
     ============================================================ */
  const P14 = {
    id: 'p14', title: 'Git: version control', laerTitle: 'version control with Git', del: DEL2, delDesc: DEL2_DESC,
    desc: 'Keep every version of your code: init, status, add, commit, log, diff and restore.',
    laer: `
      <h4>What is Git?</h4>
      <p><b>Git</b> remembers every version of your code. You can see what has changed, go back if something goes wrong, and work together without overwriting each other's work. Almost all programmers use Git.</p>
      <table><tr><th>Word</th><th>Means</th></tr>
      <tr><td><b>Repo</b> (repository)</td><td>A project folder that Git keeps track of</td></tr>
      <tr><td><b>Commit</b></td><td>A saved version, with a message about what you did</td></tr>
      <tr><td><b>Staging</b> (<code>git add</code>)</td><td>Choosing which changes go into the next commit</td></tr></table>
      <p>Think of it as taking a photo: <code>git add</code> is lining up who will be in the picture, and <code>git commit</code> is taking the picture.</p>
      <h4>The commands</h4>
      <table><tr><th>Command</th><th>What it does</th></tr>
      <tr><td><code>git config --global user.name "Name"</code></td><td>Tells Git who you are (once per PC). The same with <code>user.email</code>.</td></tr>
      <tr><td><code>git init</code></td><td>Makes the folder you are in into a repo</td></tr>
      <tr><td><code>git status</code></td><td>What is new, changed and ready? <b>Use it all the time.</b></td></tr>
      <tr><td><code>git add file.py</code> / <code>git add .</code></td><td>Stages one file / everything for the commit</td></tr>
      <tr><td><code>git commit -m "Add points"</code></td><td>Saves a version. Write briefly what you did.</td></tr>
      <tr><td><code>git log</code> / <code>git log --oneline</code></td><td>Shows the history</td></tr>
      <tr><td><code>git diff</code></td><td>Shows changes you have not added with <code>git add</code> yet: <code>+</code> is added, <code>-</code> is removed. (<code>git diff --staged</code> shows what has been added.)</td></tr>
      <tr><td><code>git restore file.py</code></td><td>Undoes the changes in the file and brings back the version from the last commit (or from <code>git add</code>, if you added it after that)</td></tr></table>
      <h4>.gitignore and GitHub</h4>
      <p>The file <b>.gitignore</b> lists files Git should ignore, for example log files and files with passwords. <b>GitHub</b> is a website where repos are stored in the cloud, so you can share and work together (<code>git push</code>, <code>git pull</code>, <code>git clone</code>). That needs the internet and an account, so we don't practise it here.</p>`,
    oppdrag: [
      {
        id: 'p14o1', title: 'Install Git and make a repo', lukk: ['firmaportal', 'kode'],
        setup: F => { F.ensureFolder(P_KODE); purge(P_SPILL); },
        steps: [
          { laer: true, quiz: { q: 'What is a commit?', options: ['A saved version, with a message', 'A message Git gives when something goes wrong', 'A copy of the repo that is stored on GitHub'], answer: 0 } },
          { laer: true, quiz: { q: 'What does git add do?', options: ['Stages changes for the commit', 'Makes a new file in the repo', 'Saves a new version with a message'], answer: 0 } },
          { laer: true, quiz: { q: 'Which command should you use all the time to see how things stand?', options: ['git status', 'git init', 'git config'], answer: 0 } },
          { text: 'Type <code>git --version</code> in the terminal. If it does not work, Git is not installed.', check: S => S.ev('term-cmd', d => /^git$/i.test(d.alias)) },
          { text: 'Install <b>Git</b> from the <b>Company Portal</b>. (If it is already installed, carry on.)', check: S => S.installed('git') },
          { text: 'Type <code>git --version</code> again. Now Git answers.', check: S => gitEv(S, 'version') },
          { text: 'Tell Git who you are. Type both:<br><code>git config --global user.name "First Last"</code><br><code>git config --global user.email "name@skolen.no"</code>', hint: 'Remember the quotation marks around the name, because it has a space in it.', check: S => { const c = Git.config(); return !!c['user.name'] && !!c['user.email']; } },
          { text: 'Make the project folder and go into it: <code>cd ~\\Documents\\Code</code>, then <code>mkdir game</code>, then <code>cd game</code>.', check: S => S.ev('term-cd', d => ends(d.path, 'Code\\game')) },
          { text: 'Make the folder into a repo: <code>git init</code>', check: S => gitEv(S, 'init', d => /\\game$/i.test(d.path)) },
          { text: 'Create the file <code>game.py</code> in the folder, with the line <code>print("Welcome to the game!")</code>. Use Code (<code>code game.py</code>) or <code>Set-Content</code>.', check: S => /print/.test(innhold(P_SPILL, 'game.py')) },
          { text: 'Type <code>git status</code>. The file is listed under <b>Untracked files</b>: Git can see it, but is not keeping track of it yet.', check: S => gitEv(S, 'status', d => d.untracked >= 1) },
          { text: 'Type <code>git add game.py</code> and then <code>git status</code> again. Now it is under <b>Changes to be committed</b>.', check: S => gitEv(S, 'add', d => d.ok) && gitEv(S, 'status', d => d.staged >= 1) },
          { text: 'Save the first version: <code>git commit -m "First version of the game"</code>', hint: 'Getting “Author identity unknown”? Then the git config from the step above is missing.', check: S => gitEv(S, 'commit', d => d.ok) },
          { text: 'Look at the history: <code>git log</code>', check: S => gitEv(S, 'log', d => d.count >= 1) }
        ]
      },
      {
        id: 'p14o2', title: 'Change, see the difference, undo', lukk: ['kode'],
        /* If the student hasn't made the game repo (or has deleted it), it is made here, so the task can always be done */
        setup: F => {
          if (window.Firmaportal) Firmaportal.markInstalled('git');
          const f = F.ensureFolder(P_SPILL);
          if (!FS.resolve([...P_SPILL, 'game.py'])) F.ensureFileAt(P_SPILL, 'game.py', 'print("Welcome to the game!")\n');
          if (!Git.isRepo(f.id)) Git.seed(f.id, 'First version of the game');
        },
        steps: [
          { text: 'Open <code>game.py</code> in Code and add a line: <code>print("You have 3 lives.")</code>. Save.', check: S => /lives/.test(innhold(P_SPILL, 'game.py')) },
          { text: 'Stand in the game folder in the terminal and type <code>git status</code>. The file is listed as <b>modified</b>.', hint: 'cd ~\\Documents\\Code\\game', check: S => gitEv(S, 'status', d => d.modified >= 1) },
          { text: 'Type <code>git diff</code>. It shows exactly what has changed: <code>+</code> in front of new lines, <code>-</code> in front of removed ones.', check: S => gitEv(S, 'diff', d => d.changed >= 1) },
          { text: 'Save a new version: <code>git add game.py</code> and <code>git commit -m "Add lives"</code>.', hint: 'Getting “Author identity unknown”? Then you have to tell Git who you are: git config --global user.name "First Last" and git config --global user.email "name@skolen.no".', check: S => gitEv(S, 'commit', d => d.ok) },
          { text: 'Now we break something on purpose: delete everything in <code>game.py</code> (or type nonsense) and save.', check: S => { const c = innhold(P_SPILL, 'game.py'); return !/welcome/i.test(c); } },
          { text: 'Bring back the version from the last commit: <code>git restore game.py</code>. Check in the editor that the code is back.', hint: 'The Code editor shows the new version when you click the file again.', check: S => gitEv(S, 'restore', d => d.ok) && /lives/.test(innhold(P_SPILL, 'game.py')) },
          { text: 'Type <code>git log --oneline</code>. You can see both versions, newest at the top.', check: S => gitEv(S, 'log', d => d.oneline && d.count >= 2) },
          { quiz: { q: 'What is a good commit message?', options: ['“Add lives to the game”', '“fixed some stuff here and there”', '“changes”'], answer: 0 } },
          { quiz: { q: 'You have broken a file and not committed the damage. How do you get it back?', options: ['git restore file.py', 'git init file.py', 'git commit -m "undo"'], answer: 0 } }
        ]
      },
      {
        id: 'p14o3', title: 'Files Git should ignore', lukk: ['kode'],
        setup: F => {
          if (window.Firmaportal) Firmaportal.markInstalled('git');
          const f = F.ensureFolder(P_SPILL);
          if (!FS.resolve([...P_SPILL, 'game.py'])) F.ensureFileAt(P_SPILL, 'game.py', 'print("Welcome to the game!")\n');
          FS.silentRemoveAll('log.txt'); FS.silentRemoveAll('.gitignore');
          /* If the student takes the task again, .gitignore is already saved in the repo. Then the repo is made again with the files that are there now. */
          const r = Git.isRepo(f.id) ? Git.repoAt(f.id) : null, last = r && r.commits.length ? r.commits[r.commits.length - 1].files : {};
          if (r && ('.gitignore' in last || '.gitignore' in r.index || 'log.txt' in last)) Git.removeRepo(f.id);
          if (!Git.isRepo(f.id)) Git.seed(f.id, 'First version of the game');
        },
        steps: [
          { text: 'Make a log file in the game folder: <code>Set-Content log.txt "test"</code>. Programs make files like this themselves, and they should not be in the repo.', check: S => S.fileIn('log.txt', P_SPILL) },
          { text: 'Type <code>git status</code>. <b>log.txt</b> is listed as untracked.', check: S => gitEv(S, 'status', d => d.untracked >= 1) },
          { text: 'Create the file <code>.gitignore</code> with the line <code>log.txt</code>: <code>Set-Content .gitignore "log.txt"</code>', check: S => /log\.txt/i.test(innhold(P_SPILL, '.gitignore')) },
          { text: 'Type <code>git status</code> again. Now log.txt is gone from the list, but <b>.gitignore</b> is there. That one should be included.', check: S => gitEv(S, 'status', d => !d.notRepo) && /log\.txt/i.test(innhold(P_SPILL, '.gitignore')) },
          { text: 'Save: <code>git add .gitignore</code> and <code>git commit -m "Ignore log files"</code>.', check: S => { const r = repo(P_SPILL); return gitEv(S, 'commit', d => d.ok) && !!r && r.commits.length && '.gitignore' in r.commits[r.commits.length - 1].files && !('log.txt' in r.commits[r.commits.length - 1].files); } },
          { quiz: { q: 'Why should a file with passwords be in .gitignore?', options: ['So it is not saved in the repo and shared', 'So Git encrypts the file before saving it', 'So the file is deleted at the next commit'], answer: 0 } },
          { quiz: { q: 'What is GitHub?', options: ['A website where repos are stored in the cloud', 'Another name for the Git program on your PC', 'A programming language made for version control'], answer: 0 } }
        ]
      }
    ]
  };

  /* ============================================================
     EXPERT: pip
     ============================================================ */
  const P15 = {
    id: 'p15', title: 'Packages with pip', laerTitle: 'Python packages and pip', del: DEL2, delDesc: DEL2_DESC,
    desc: 'Install code other people have written: pip install, list, show, uninstall and requirements.txt.',
    laer: `
      <h4>You don't have to make everything yourself</h4>
      <p>A <b>package</b> is code other people have written, which you can use in your programs with <code>import</code>. More than half a million packages are on <b>PyPI</b> (pypi.org). <b>pip</b> is the program that fetches and installs them.</p>
      <table><tr><th>Command</th><th>What it does</th></tr>
      <tr><td><code>pip install cowsay</code></td><td>Installs the package</td></tr>
      <tr><td><code>pip list</code></td><td>Shows what is installed</td></tr>
      <tr><td><code>pip show cowsay</code></td><td>Shows the version, the author and where it is</td></tr>
      <tr><td><code>pip uninstall cowsay</code></td><td>Removes the package</td></tr>
      <tr><td><code>pip freeze</code></td><td>Lists the packages with versions, in the format <code>name==version</code></td></tr>
      <tr><td><code>pip install -r requirements.txt</code></td><td>Installs everything in the file</td></tr></table>
      <p>If a package is missing, <code>import</code> gives the error <b>ModuleNotFoundError</b>.</p>
      <h4>requirements.txt</h4>
      <p>A project often has a file <b>requirements.txt</b> with one package per line. Then anyone (and you on a new PC) can install what the program needs with one command.</p>
      <h4>Be careful</h4>
      <p>Anyone can publish packages. Some people make <b>fake packages with almost the same names</b> (for example <i>reqeusts</i> instead of <i>requests</i>), hoping that someone will mistype. Type the name exactly, and only install packages you know about. On a school PC, pip may be blocked: ask your teacher.</p>
      <p>Big projects use a <b>virtual environment</b> (<code>python -m venv</code>), so each project has its own packages. That is the next step after this course.</p>`,
    oppdrag: [
      {
        id: 'p15o1', title: 'Install a package', lukk: ['kode'],
        setup: F => { if (window.Pip) Pip.reset(); F.ensureFolder(P_KODE); FS.silentRemoveAll('cow.py'); },
        steps: [
          { laer: true, quiz: { q: 'What is a Python package?', options: ['Code other people have written, which you can import', 'A ZIP file with pictures and sounds for the program', 'A new programming language that is built on Python'], answer: 0 } },
          { laer: true, quiz: { q: 'Which error do you get if you import a package that is not installed?', options: ['ModuleNotFoundError', 'SyntaxError', 'ValueError'], answer: 0 } },
          { laer: true, quiz: { q: 'Why do you have to spell the package name exactly?', options: ['There are fake packages with similar names', 'pip gets slower when there are typos', 'Otherwise the package is installed twice'], answer: 0 } },
          { text: 'Create <code>cow.py</code> in the Code folder:<br><code>import cowsay</code><br><code>cowsay.cow("Hello from Python!")</code><br>Run it. You get a <b>ModuleNotFoundError</b>, because the package is not installed.', check: S => ran(S, 'cow.py', d => d.error === 'ModuleNotFoundError') },
          { text: 'Install the package: <code>pip install cowsay</code>', check: S => pipEv(S, 'install', d => d.name === 'cowsay' && d.ok) || (window.Pip && Pip.has('cowsay')) },
          { text: 'Run <code>cow.py</code> again.', check: S => ranOk(S, 'cow.py', d => /\^__\^/.test(d.output)) },
          { text: 'See what is installed: <code>pip list</code>', check: S => pipEv(S, 'list') },
          { text: 'See who made the package: <code>pip show cowsay</code>', check: S => pipEv(S, 'show', d => d.ok) },
          { text: 'Typos are dangerous with pip. Try <code>pip install cowsey</code> (spelt wrong) and read what happens.', check: S => pipEv(S, 'install', d => !d.ok && !d.real) },
          { quiz: { q: 'Here pip found no “cowsey”. What could have happened on a real PC?', options: ['You could have got a fake package with harmful code', 'Nothing, pip always corrects typos', 'pip would have installed cowsay instead, automatically'], answer: 0 } }
        ]
      },
      {
        id: 'p15o2', title: 'requirements.txt', lukk: ['kode'],
        setup: F => {
          if (window.Pip) Pip.reset();
          purge(P_VITS); F.ensureFolder(P_VITS);
          F.ensureFile(P_VITS, 'joke.py', 'import cowsay\nimport pyjokes\n\ncowsay.cow(pyjokes.get_joke())\n');
        },
        steps: [
          { text: 'Go to the <code>jokes</code> folder (<code>cd ~\\Documents\\Code\\jokes</code>) and run <code>python joke.py</code>. It needs two packages that are not installed.', check: S => ran(S, 'joke.py', d => d.error === 'ModuleNotFoundError') },
          { text: 'Create the file <code>requirements.txt</code> in the folder with the two packages the program imports, one per line: <b>cowsay</b> and <b>pyjokes</b>.', hint: 'Make the file in Code (code requirements.txt), or: Set-Content requirements.txt "cowsay", and Add-Content requirements.txt "pyjokes".', check: S => { const c = innhold(P_VITS, 'requirements.txt').toLowerCase(); return /\bcowsay\b/.test(c) && /\bpyjokes\b/.test(c); } },
          { text: 'Install everything at once: <code>pip install -r requirements.txt</code>', check: S => pipEv(S, 'requirements') && window.Pip && Pip.has('cowsay') && Pip.has('pyjokes') },
          { text: 'Run <code>joke.py</code> again.', check: S => ranOk(S, 'joke.py') },
          { text: 'Type <code>pip freeze</code>. It shows the versions in a format you can paste straight into requirements.txt.', check: S => pipEv(S, 'freeze') },
          { text: 'Remove a package: <code>pip uninstall pyjokes</code>, and answer <b>Y</b>.', check: S => pipEv(S, 'uninstall', d => d.name === 'pyjokes' && d.ok) },
          { quiz: { q: 'Why do projects have a requirements.txt?', options: ['So anyone can install it all with one command', 'It makes the program start faster', 'pip does not work without one in the folder'], answer: 0 } }
        ]
      }
    ]
  };

  KURS_PROG.push(P8, P9, P10, P11, P12, P13, P14, P15);

  /* ---------- Master tests ---------- */
  addMasterProg('p8', {
    lukk: ['kode'],
    title: 'The program that chooses',
    intro: 'Make age-limit.py: ask for the age. Under 13 gives “Too young for social media”, otherwise “Welcome!”.',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('age-limit.py'); },
    goals: [
      { text: 'Create <b>age-limit.py</b> with <b>if</b> and <b>else</b>', check: S => { const c = kode('age-limit.py'); return has(c, /^\s*if\b/m) && has(c, /^\s*else\s*:/m); } },
      { text: 'The program gives a <b>different</b> answer for 10 and 15 years', check: S => { const c = kode('age-limit.py'); const a = pyTest(c, ['10']), b = pyTest(c, ['15']); return a.ok && b.ok && a.out.trim() && b.out.trim() && a.out !== b.out; } },
      { text: 'The limit is right: 12 is too young, 13 is welcome', check: S => { const c = kode('age-limit.py'); const o = a => pyTest(c, [a]).out.replace(/\d+/g, ''); return o('12') === o('10') && o('13') === o('15') && o('12') !== o('13'); } },
      { text: 'Run it and answer the question', check: S => ranOk(S, 'age-limit.py', d => d.usedInput) }
    ]
  }, ['Make a small program with if/elif/else about something you like, for example a quiz about your favourite team.']);

  addMasterProg('p9', {
    lukk: ['kode'],
    title: 'Countdown',
    intro: 'Make countdown.py that counts down from 10 to 1 with a loop, and prints “Takeoff!” at the end.',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('countdown.py'); },
    goals: [
      { text: 'Create <b>countdown.py</b> with a <b>loop</b> (for or while)', check: S => has(kode('countdown.py'), /\b(for|while)\b/) },
      { text: 'The output counts <b>10, 9, 8 … 1</b> in the right order', check: S => { const r = pyTest(kode('countdown.py')); let want = 10; (r.out.match(/-?\d+/g) || []).forEach(x => { if (want > 0 && +x === want) want--; }); return r.ok && want === 0; } },
      { text: 'And prints <b>Takeoff!</b> at the end', check: S => { const L = lines(pyTest(kode('countdown.py')).out); return L.length > 0 && /takeoff/i.test(L[L.length - 1]); } },
      { text: 'Run it', check: S => ranOk(S, 'countdown.py') }
    ]
  }, ['Print the 5 times table with a for loop in Python on your own PC.']);

  addMasterProg('p10', {
    lukk: ['kode'],
    title: 'Favourites',
    intro: 'Make favourites.py with a list of at least three favourites (games, food, artists …). Print each on its own line and how many there are.',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('favourites.py'); },
    goals: [
      { text: 'Create <b>favourites.py</b> with a <b>list</b> of at least three elements', check: S => { const m = /\[([^\]]*)\]/.exec(kode('favourites.py')); return !!m && m[1].split(',').filter(x => x.trim()).length >= 3; } },
      { text: 'Go through the list with <b>for</b>', check: S => has(kode('favourites.py'), /\bfor\b\s+\w+\s+in\b/) },
      { text: 'Print the <b>number</b> with <b>len()</b>, and run it', check: S => ranOk(S, 'favourites.py', d => /len\s*\(/.test(d.source) && lines(d.output).length >= 4) }
    ]
  }, ['Make a list in Python with the names of the people in your group, and print them in alphabetical order with sorted().']);

  addMasterProg('p11', {
    lukk: ['kode'],
    title: 'The temperature converter',
    intro: 'Make converter.py with the function celsius_to_fahrenheit(c), which returns c × 9 / 5 + 32.',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('converter.py'); },
    goals: [
      { text: 'Create <b>converter.py</b> with the function <b>celsius_to_fahrenheit(c)</b> and <b>return</b>', check: S => { const c = kode('converter.py'); return has(c, /def\s+celsius_to_fahrenheit\s*\(/) && has(c, /\breturn\b/); } },
      { text: 'The function gives 212 for 100 and 32 for 0', check: S => { const r = pyTest(kode('converter.py') + '\nprint("T1", celsius_to_fahrenheit(100))\nprint("T2", celsius_to_fahrenheit(0))\n', DUMMY); return /T1 212(\.0)?\b/.test(r.out) && /T2 32(\.0)?\b/.test(r.out); } },
      { text: 'Run the program without errors', check: S => ranOk(S, 'converter.py') }
    ]
  }, ['Find code you have written before that repeats itself, and make a function out of it.']);

  addMasterProg('p12', {
    lukk: ['kode'],
    title: 'Find the hidden bug',
    intro: 'got4.py should count how many got 4 or better. It gives no error message, but the answer is wrong.',
    setup: F => { F.ensureFolder(P_KODE); FS.silentRemoveAll('got4.py'); F.ensureFile(P_KODE, 'got4.py', GOT4); },
    goals: [
      { text: 'Run <b>got4.py</b> and look at the answer', check: S => ran(S, 'got4.py') },
      { text: 'Fix the bug, so the program answers <b>4</b>', check: S => { const c = kode('got4.py'); const r = pyTest(c); const L = lines(r.out); return r.ok && L.length && num(L[L.length - 1], 4) && c !== GOT4; } },
      { text: 'The program also works for other lists (tested with [4, 4, 4, 3])', check: S => { const c = kode('got4.py').replace(/grades\s*=\s*\[[^\]]*\]/, 'grades = [4, 4, 4, 3]'); const L = lines(pyTest(c).out); return L.length && num(L[L.length - 1], 3); } }
    ]
  }, ['When a program gives the wrong answer: test with an example you know the answer to, and use print() to see what is happening.']);

  addMasterProg('p13', {
    lukk: ['kode'],
    title: 'The temperature report',
    intro: 'temperatures.txt has one temperature per line. Make temperature.py that reads the file and writes the average to the file report.txt.',
    setup: F => { F.ensureFolder(P_KODE); ['temperature.py', 'temperatures.txt', 'report.txt'].forEach(n => FS.silentRemoveAll(n)); F.ensureFile(P_KODE, 'temperatures.txt', TEMP); },
    goals: [
      { text: 'Create <b>temperature.py</b> that reads <b>temperatures.txt</b> with open()', check: S => has(kode('temperature.py'), /open\s*\(\s*["']temperatures\.txt/) },
      { text: 'Run the program from the Code folder without errors', check: S => ranOk(S, 'temperature.py') },
      { text: '<b>report.txt</b> contains the average (3.0)', check: S => (kode('report.txt').match(/-?\d+(?:[.,]\d+)?/g) || []).some(x => Math.abs(parseFloat(x.replace(',', '.')) - 3) < 1e-9) }
    ]
  }, ['Make a program that saves something in a file and reads it again the next time it runs.']);

  addMasterProg('p14', {
    lukk: ['kode'],
    title: 'Your own repo',
    intro: 'Make a repo from scratch in the folder master-repo, with at least two commits and a clean working folder. (If Git says “Author identity unknown”, tell it who you are with git config, as you learnt in the course.)',
    setup: F => { if (window.Firmaportal) Firmaportal.markInstalled('git'); F.ensureFolder(P_KODE); purge([...P_KODE, 'master-repo']); },
    goals: [
      { text: 'Make the folder <b>master-repo</b> in the Code folder and make it into a repo', check: S => gitEv(S, 'init', d => /\\master-repo$/i.test(d.path)) },
      { text: 'At least <b>two commits</b> in the repo', check: S => { const r = repo([...P_KODE, 'master-repo']); return !!r && r.commits.length >= 2; } },
      { text: '<b>git status</b> shows that everything is saved (working tree clean)', check: S => { const r = repo([...P_KODE, 'master-repo']); return !!r && r.commits.length >= 2 && gitEv(S, 'status', d => d.clean); } }
    ]
  }, ['Install Git on your own PC (or use Source Control in VS Code) and make a repo for a project you are working on.', 'Make a free account on GitHub if your school allows it, and see what other projects look like.']);

  addMasterProg('p15', {
    lukk: ['kode'],
    title: 'Ready for a new PC',
    intro: 'The program in the folder master-packages needs a package. Get the project ready, so that anyone can install what is needed.',
    setup: F => { if (window.Pip) Pip.reset(); const P = [...P_KODE, 'master-packages']; purge(P); const folder = F.ensureFolder(P); FS.createFile(folder.id, 'hello.py', 'import cowsay\n\ncowsay.tux("Ready for a new PC!")\n'); },
    goals: [
      { text: 'Create <b>requirements.txt</b> in the master-packages folder with the package the program needs', check: S => /\bcowsay\b/i.test(innhold([...P_KODE, 'master-packages'], 'requirements.txt')) },
      { text: 'Install with <b>pip install -r requirements.txt</b>', check: S => pipEv(S, 'requirements', d => d.names.includes('cowsay')) && window.Pip && Pip.has('cowsay') },
      { text: 'Run the program without errors', check: S => S.ev('py-run', d => d.ok && /master-packages\\hello\.py$/i.test(d.path)) }
    ]
  }, ['See whether a Python project you find online has a requirements.txt, and read which packages it uses.']);

  /* ---------- Weekly practice ---------- */
  REPETISJON_PROG.push(
    { id: 'pr10', kurs: 'p8', text: 'Make a program with <code>if</code> and <code>else</code>, and run it.', check: S => S.ev('py-run', d => d.ok && /^\s*if\b/m.test(d.source) && /^\s*else\s*:/m.test(d.source)) },
    { id: 'pr11', kurs: 'p9', text: 'Make and run a program with a <code>for</code> loop and <code>range()</code>.', check: S => S.ev('py-run', d => d.ok && /\bfor\b.+\bin\s+range\s*\(/.test(d.source)) },
    { id: 'pr12', kurs: 'p10', text: 'Make and run a program that adds something to a list with <code>append</code>.', check: S => S.ev('py-run', d => d.ok && /\.append\s*\(/.test(d.source)) },
    { id: 'pr13', kurs: 'p11', text: 'Make and run a program with your own function (<code>def</code> and <code>return</code>).', check: S => S.ev('py-run', d => d.ok && /\bdef\s+\w+\s*\(/.test(d.source) && /\breturn\b/.test(d.source)) },
    { id: 'pr14', kurs: 'p12', text: 'Make and run a program with <code>try</code> and <code>except ValueError</code>.', check: S => S.ev('py-run', d => d.ok && /\btry\s*:/.test(d.source) && /except\s+ValueError/.test(d.source)) },
    { id: 'pr15', kurs: 'p13', text: 'Make and run a program that writes to a file with <code>open(…, "w")</code> or <code>"a"</code>.', check: S => S.ev('py-run', d => d.ok && /open\s*\([^)]*["'][wa]["']/.test(d.source)) },
    { id: 'pr16', kurs: 'p14', text: 'Type <code>git status</code> in a repo, and <code>git log --oneline</code>.', check: S => S.ev('git', d => d.cmd === 'status' && !d.notRepo) && S.ev('git', d => d.cmd === 'log' && d.oneline) },
    { id: 'pr17', kurs: 'p15', text: 'Show which packages are installed with <code>pip list</code>.', check: S => S.ev('pip', d => d.cmd === 'list') }
  );
})();
