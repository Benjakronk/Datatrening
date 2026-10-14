(async () => {
  const { ok, tick, play, master, log } = W;
  const K = ['This PC', 'Documents', 'Code'];
  let t0 = null;
  const term = () => { if (!t0 || !Terminal.instances.includes(t0) || !WM.list().some(w => w.term === t0)) { t0 = Terminal.open(); } return t0; };
  async function run(cmd, inputs = []) {
    const t = term();
    const p = t.submit(cmd);
    for (const v of inputs) {
      for (let k = 0; k < 200 && !t.reading; k++) await tick(10);
      if (!t.reading) break;
      t.input.value = v; t.input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
      await tick(5);
    }
    await p; await tick(20);
  }
  const out = () => term().root.textContent;
  function write(name, content, folder = K) {
    const f = FS.resolve([...folder, name]);
    if (f) FS.write(f.id, content); else { const pf = FS.ensureFolder(folder); FS.createFile(pf.id, name, content); }
    Bus.emit('kode-save', { name, content });
  }
  const kd = 'cd ~\\Documents\\Code';
  const strip = s => s.replace(/<[^>]+>/g, '');

  try {
    await tick(600);
    document.querySelectorAll('.dlg .btn.primary').forEach(b => b.click());
    W.teoriAlle();
    if (window.Firmaportal) Firmaportal.markInstalled('vscode');

    const QUIZ1 = 'answer = input("What is the capital of Norway? ")\nif answer == "Oslo":\n    print("Correct!")\nelse:\n    print("Wrong")\n';
    await play('p8', 'p8o1', [
      ['Create the file', async () => write('quiz.py', '')],
      ['Write a program', async () => write('quiz.py', QUIZ1)],
      ['answer Oslo', async () => { await run(kd); await run('python quiz.py', ['Oslo']); }],
      ['something else', async () => run('python quiz.py', ['Bergen'])],
      ['lower()', async () => write('quiz.py', QUIZ1.replace('if answer == "Oslo"', 'if answer.lower() == "oslo"'))]
    ]);
    const GR = 'points = int(input("Points: "))\nif points >= 90:\n    print("Grade 6")\nelif points >= 75:\n    print("Grade 5")\nelif points >= 60:\n    print("Grade 4")\nelif points >= 45:\n    print("Grade 3")\nelif points >= 30:\n    print("Grade 2")\nelse:\n    print("Grade 1")\n';
    await play('p8', 'p8o2', [
      [strip('Create <code>grade.py</code>'), async () => write('grade.py', GR.replace('points >= 75', 'points >= 95'))],
      ['Run the program', async () => { await run(kd); await run('python grade.py', ['80']); }],
      ['now tests', async () => write('grade.py', GR)]
    ]);
    await master('p8', [
      async () => write('age-limit.py', 'age = int(input("Age: "))\nif age < 13:\n    print("Too young for social media")\nelse:\n    print("Welcome!")\n'),
      async () => { await run(kd); await run('python age-limit.py', ['15']); }
    ]);

    const TT = 'number = int(input("Which times table? "))\nfor i in range(1, 11):\n    print(i, "x", number, "=", i * number)\n';
    await play('p9', 'p9o1', [
      [strip('Create <code>times-table.py</code>'), async () => write('times-table.py', TT.replace('range(1, 11)', 'range(1, 10)'))],
      ['Run the program and choose', async () => { write('times-table.py', TT); await run(kd); await run('python times-table.py', ['7']); }],
      ['tests with 7 and 12', async () => write('times-table.py', TT)]
    ]);
    const GU = 'import random\nsecret = random.randint(1, 100)\nguess = 0\nguesses = 0\nwhile guess != secret:\n    guess = int(input("Guess: "))\n    guesses = guesses + 1\n    if guess < secret:\n        print("Too low")\n    elif guess > secret:\n        print("Too high")\nprint("Correct!")\nprint("You used", guesses, "guesses")\n';
    await play('p9', 'p9o2', [
      [strip('Create <code>guess.py</code>'), async () => write('guess.py', GU)],
      ['Play until', async () => { await run(kd); const ins = []; for (let i = 1; i <= 100; i++) ins.push(String(i)); await run('python guess.py', ins); }]
    ]);
    await master('p9', [
      async () => write('countdown.py', 'for i in range(10, 0, -1):\n    print(i)\nprint("Takeoff!")\n'),
      async () => { await run(kd); await run('python countdown.py'); }
    ]);

    const SL = 'items = []\nwhile True:\n    item = input("Item: ")\n    if item == "":\n        break\n    items.append(item)\nprint("You need to buy", len(items), "things:")\nfor i in items:\n    print("-", i)\n';
    await play('p10', 'p10o1', [
      [strip('Create <code>shopping-list.py</code>'), async () => write('shopping-list.py', SL)],
      ['Run the program', async () => { await run(kd); await run('python shopping-list.py', ['milk', 'eggs', '']); }]
    ]);
    const ST = 'grades = [5, 3, 6, 4, 4, 5]\nprint("Sum:", sum(grades))\nprint("Number:", len(grades))\nprint("Average:", sum(grades) / len(grades))\nprint("Highest:", max(grades))\nprint("Lowest:", min(grades))\n';
    await play('p10', 'p10o2', [
      [strip('Open <code>stats.py</code>'), async () => { await run(kd); await run('code stats.py'); }],
      ['the <b>sum'.replace(/<[^>]+>/g, ''), async () => write('stats.py', ST)],
      ['highest', async () => run('python stats.py')],
      ['Add two more', async () => write('stats.py', ST.replace('[5, 3, 6, 4, 4, 5]', '[5, 3, 6, 4, 4, 5, 2, 6]'))]
    ]);
    await master('p10', [
      async () => write('favourites.py', 'fav = ["pizza", "tacos", "sushi"]\nfor f in fav:\n    print(f)\nprint("Number:", len(fav))\n'),
      async () => { await run(kd); await run('python favourites.py'); }
    ]);

    const AR = 'def area(length, width):\n    return length * width\n\nprint(area(4, 5))\nprint(area(3, 7))\n';
    await play('p11', 'p11o1', [
      [strip('Create <code>area.py</code>'), async () => write('area.py', AR)],
      ['Run the program', async () => { await run(kd); await run('python area.py'); }],
      ['now calls', async () => write('area.py', AR)],
      ['perimeter', async () => write('area.py', AR + '\ndef perimeter(length, width):\n    return 2 * length + 2 * width\n\nprint(perimeter(4, 5))\n')]
    ]);
    const GREET = 'def greet(name):\n    print("*************")\n    print("Hi, " + name + "!")\n    print("Welcome to the code club.")\n    print("*************")\n\ngreet("Ada")\ngreet("Linus")\ngreet("Grace")\n';
    await play('p11', 'p11o2', [
      ['Open and run', async () => { await run(kd); await run('python welcome.py'); }],
      ['Make a function', async () => write('welcome.py', GREET)],
      ['exactly the same', async () => run('python welcome.py')],
      ['coding', async () => write('welcome.py', GREET.replace('the code club', 'coding'))]
    ]);
    await master('p11', [
      async () => write('converter.py', 'def celsius_to_fahrenheit(c):\n    return c * 9 / 5 + 32\n\nprint(celsius_to_fahrenheit(20))\n'),
      async () => { await run(kd); await run('python converter.py'); }
    ]);

    await play('p12', 'p12o1', [
      [strip('Run <code>average.py</code>'), async () => { await run(kd); await run('python average.py'); }],
      ['Add a line', async () => { write('average.py', 'numbers = [4, 8, 6, 2]\nsum = 0\nfor n in numbers:\n    sum = sum + n\nprint(sum, len(numbers))\naverage = sum / 2\nprint("The average is", average)\n'); await run('python average.py'); }],
      ['Fix it', async () => { write('average.py', 'numbers = [4, 8, 6, 2]\nsum = 0\nfor n in numbers:\n    sum = sum + n\naverage = sum / len(numbers)\nprint("The average is", average)\n'); await run('python average.py'); }]
    ]);
    const TY = 'try:\n    age = int(input("How old are you? "))\n    print("In ten years you will be", age + 10)\nexcept ValueError:\n    print("Type your age as a number, for example 14.")\n';
    await play('p12', 'p12o2', [
      [strip('Run <code>ten-years.py</code>'), async () => { await run(kd); await run('python ten-years.py', ['ten']); }],
      ['Wrap the code', async () => write('ten-years.py', TY)],
      ['Run it and answer', async () => run('python ten-years.py', ['ten'])],
      ['while True', async () => write('ten-years.py', 'while True:\n    try:\n        age = int(input("Age: "))\n        break\n    except ValueError:\n        print("Type your age as a number.")\nprint("In ten years you will be", age + 10)\n')]
    ]);
    await master('p12', [
      async () => { await run(kd); await run('python got4.py'); },
      async () => write('got4.py', 'grades = [2, 4, 5, 3, 6, 4, 1]\ncount = 0\nfor g in grades:\n    if g >= 4:\n        count = count + 1\nprint("Got 4 or better:", count)\n')
    ]);

    await play('p13', 'p13o1', [
      [strip('Create <code>diary.py</code>'), async () => write('diary.py', 'text = input("What did you do today? ")\nwith open("diary.txt", "a") as f:\n    f.write(text + "\\n")\nprint("Saved!")\n')],
      ['twice', async () => { await run(kd); await run('python diary.py', ['Played football']); await run('python diary.py', ['Did homework']); }],
      ['cat diary.txt', async () => run('cat diary.txt')]
    ]);
    await play('p13', 'p13o2', [
      ['cat points.txt', async () => { await run(kd); await run('cat points.txt'); }],
      [strip('Create <code>points.py</code>'), async () => write('points.py', 'total = 0\nwith open("points.txt") as f:\n    for line in f:\n        name, p = line.strip().split(";")\n        total = total + int(p)\n        print(name, p)\nprint("Total:", total)\n')],
      ['winner', async () => { write('points.py', 'total = 0\nbest = -1\nbest_name = ""\nwith open("points.txt") as f:\n    for line in f:\n        name, p = line.strip().split(";")\n        total = total + int(p)\n        if int(p) > best:\n            best = int(p)\n            best_name = name\nprint("Total:", total)\nprint("The winner is", best_name)\n'); await run('python points.py'); }]
    ]);
    await master('p13', [
      async () => write('temperature.py', 'temps = []\nwith open("temperatures.txt") as f:\n    for l in f:\n        temps.append(int(l.strip()))\navg = sum(temps) / len(temps)\nwith open("report.txt", "w") as f:\n    f.write("Average: " + str(avg) + "\\n")\n'),
      async () => { await run(kd); await run('python temperature.py'); }
    ]);

    if (window.Firmaportal) Firmaportal.resetApp('git');
    if (window.Git) Git.resetConfig();
    await play('p14', 'p14o1', [
      ['git --version</code> in the terminal'.replace(/<[^>]+>/g, ''), async () => { await run('git --version'); ok(/not recognized/.test(out()), 'git unknown before install'); }],
      ['Install', async () => { Firmaportal.markInstalled('git'); Bus.emit('install-done', { id: 'git' }); }],
      ['again. Now Git answers', async () => run('git --version')],
      ['Tell Git', async () => { await run('git config --global user.name "Ola Nordmann"'); await run('git config --global user.email "ola@skolen.no"'); }],
      ['Make the project folder', async () => { await run(kd); await run('mkdir game'); await run('cd game'); }],
      ['git init', async () => { await run('git init'); ok(/Initialized empty Git repository in C:\/Users\/Student\/Documents\/Code\/game\/\.git\//.test(out()), 'git init message'); }],
      ['Create the file', async () => run('Set-Content game.py \'print("Welcome to the game!")\'')],
      ['Untracked', async () => run('git status')],
      ['git add game.py', async () => { await run('git add game.py'); await run('git status'); }],
      ['Save the first', async () => run('git commit -m "First version of the game"')],
      ['Look at the history', async () => run('git log')]
    ]);
    const SP = [...K, 'game'];
    const wGame = c => write('game.py', c, SP);
    await play('p14', 'p14o2', [
      [strip('Open <code>game.py</code>'), async () => wGame('print("Welcome to the game!")\nprint("You have 3 lives.")\n')],
      ['Stand in the game folder', async () => { await run('cd ~\\Documents\\Code\\game'); await run('git status'); }],
      ['git diff', async () => run('git diff')],
      ['Save a new', async () => { await run('git add game.py'); await run('git commit -m "Add lives"'); }],
      ['break something', async () => wGame('nonsense\n')],
      ['git restore', async () => run('git restore game.py')],
      ['--oneline', async () => run('git log --oneline')]
    ]);
    await play('p14', 'p14o3', [
      ['log file', async () => { await run('cd ~\\Documents\\Code\\game'); await run('Set-Content log.txt "test"'); }],
      ['is listed as untracked', async () => run('git status')],
      [strip('Create the file <code>.gitignore</code>'), async () => run('Set-Content .gitignore "log.txt"')],
      ['again. Now log.txt', async () => run('git status')],
      ['Ignore log files', async () => { await run('git add .gitignore'); await run('git commit -m "Ignore log files"'); }]
    ]);
    await master('p14', [
      async () => { await run(kd); await run('mkdir master-repo'); await run('cd master-repo'); await run('git init'); },
      async () => { await run('Set-Content a.py "print(1)"'); await run('git add .'); await run('git commit -m "One"'); },
      async () => { await run('Set-Content b.py "print(2)"'); await run('git add .'); await run('git commit -m "Two"'); await run('git status'); }
    ]);

    await play('p15', 'p15o1', [
      [strip('Create <code>cow.py</code>'), async () => { write('cow.py', 'import cowsay\ncowsay.cow("Hello from Python!")\n'); await run(kd); await run('python cow.py'); }],
      ['pip install cowsay', async () => run('pip install cowsay')],
      ['again', async () => run('python cow.py')],
      ['pip list', async () => run('pip list')],
      ['pip show', async () => run('pip show cowsay')],
      ['cowsey', async () => run('pip install cowsey')]
    ]);
    const JK = [...K, 'jokes'];
    await play('p15', 'p15o2', [
      [strip('Go to the <code>jokes</code> folder'), async () => { await run('cd ~\\Documents\\Code\\jokes'); await run('python joke.py'); }],
      [strip('requirements.txt</code> in the folder'), async () => write('requirements.txt', 'cowsay\npyjokes\n', JK)],
      ['pip install -r', async () => run('pip install -r requirements.txt')],
      ['again', async () => run('python joke.py')],
      ['pip freeze', async () => run('pip freeze')],
      ['pip uninstall', async () => run('pip uninstall pyjokes', ['Y'])]
    ]);
    await master('p15', [
      async () => write('requirements.txt', 'cowsay\n', [...K, 'master-packages']),
      async () => { await run('cd ~\\Documents\\Code\\master-packages'); await run('pip install -r requirements.txt'); await run('python hello.py'); }
    ]);
    ok(KURS_PROG.filter(k => k.del === 'Expert').map(k => k.id).join() === 'p14,p15', 'Expert section has git and pip');
    W.P().tab = 'kurs'; Coach.render(); await tick(30);
    ok(document.querySelectorAll('#coach-body .kurs-del').length === 2, 'two section headings in the course list');
  } catch (e) { log('EXCEPTION ' + (e && e.stack)); }
  W.done();
})();
