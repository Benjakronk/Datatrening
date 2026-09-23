/* Pyth: en liten Python 3-tolk for øvings-PC-en.
   Dekker det elever på ungdomstrinnet bruker: print, input, variabler, tall og tekst, f-strenger,
   if/elif/else, while, for, range, lister, dict, funksjoner, try/except, import random/math/time,
   with open(...) mot det virtuelle filsystemet. Kjører som generator slik at input() kan vente på
   brukeren og Ctrl+C kan avbryte uendelige løkker. */
const Pyth = (() => {
  class PyError extends Error { constructor(type, msg, line) { super(msg); this.type = type; this.pyline = line; } }
  class F { constructor(v) { this.v = v; } }              /* flyttall (for å skille 2 og 2.0) */
  class Tuple { constructor(items) { this.items = items; } }
  class Dict { constructor() { this.map = new Map(); } }
  class Range { constructor(a, b, s) { this.start = a; this.stop = b; this.step = s; } }
  class PyFunc { constructor(name, params, defaults, body, env) { this.name = name; this.params = params; this.defaults = defaults; this.body = body; this.env = env; } }
  class Builtin { constructor(name, fn) { this.name = name; this.fn = fn; } }
  class Module { constructor(name, attrs) { this.name = name; this.attrs = attrs; } }
  class FileObj { constructor(path, mode, content) { this.path = path; this.mode = mode; this.content = content; this.pos = 0; this.closed = false; this.buffer = ''; } }
  class BreakSig {} class ContinueSig {} class ReturnSig { constructor(v) { this.v = v; } }
  const STEP = { type: 'step' };

  /* ---------------- Lexer ---------------- */
  const KEYWORDS = new Set(['if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'break', 'continue', 'pass', 'and', 'or', 'not', 'True', 'False', 'None', 'import', 'from', 'as', 'try', 'except', 'finally', 'with', 'is', 'global', 'del', 'class', 'lambda', 'raise', 'assert']);
  const OPS = ['**=', '//=', '==', '!=', '<=', '>=', '**', '//', '+=', '-=', '*=', '/=', '%=', '+', '-', '*', '/', '%', '<', '>', '=', '(', ')', '[', ']', '{', '}', ',', ':', '.', ';'];

  function tokenize(src) {
    const toks = [];
    const lines = src.replace(/\r\n?/g, '\n').split('\n');
    const indents = [0];
    let depth = 0;
    for (let ln = 0; ln < lines.length; ln++) {
      const line = lines[ln], lineNo = ln + 1;
      let i = 0;
      if (depth === 0) {
        let ind = 0;
        while (i < line.length && (line[i] === ' ' || line[i] === '\t')) { ind += line[i] === '\t' ? 4 : 1; i++; }
        if (i >= line.length || line[i] === '#') continue;
        if (ind > indents[indents.length - 1]) { indents.push(ind); toks.push({ t: 'INDENT', line: lineNo }); }
        else {
          while (ind < indents[indents.length - 1]) { indents.pop(); toks.push({ t: 'DEDENT', line: lineNo }); }
          if (ind !== indents[indents.length - 1]) throw new PyError('IndentationError', 'unindent does not match any outer indentation level', lineNo);
        }
      }
      while (i < line.length) {
        const c = line[i];
        if (c === ' ' || c === '\t') { i++; continue; }
        if (c === '#') break;
        if (c === '\\' && i === line.length - 1) { i++; depth += 0; break; }
        /* strenger */
        let m = /^(f|F|r|R)?(['"])/.exec(line.slice(i));
        if (m) {
          const prefix = (m[1] || '').toLowerCase(), q = m[2];
          let j = i + m[0].length, s = '';
          if (line.slice(j - 1, j + 2) === q + q + q) throw new PyError('SyntaxError', 'triple-quoted strings are not supported on the practice PC', lineNo);
          let closed = false;
          while (j < line.length) {
            const ch = line[j];
            if (ch === '\\' && prefix !== 'r') {
              const nx = line[j + 1];
              const map = { n: '\n', t: '\t', '\\': '\\', "'": "'", '"': '"', r: '\r', '0': '\0' };
              if (nx in map) { s += map[nx]; j += 2; continue; }
              s += '\\'; j++; continue;
            }
            if (ch === q) { closed = true; j++; break; }
            s += ch; j++;
          }
          if (!closed) throw new PyError('SyntaxError', 'unterminated string literal (detected at line ' + lineNo + ')', lineNo);
          toks.push({ t: prefix === 'f' ? 'FSTR' : 'STR', v: s, line: lineNo });
          i = j; continue;
        }
        m = /^\d+(\.\d+)?([eE][+-]?\d+)?|^\.\d+/.exec(line.slice(i));
        if (m) { toks.push({ t: 'NUM', v: m[0], line: lineNo }); i += m[0].length; continue; }
        m = /^[A-Za-z_À-ɏ][\wÀ-ɏ]*/.exec(line.slice(i));
        if (m) { toks.push({ t: KEYWORDS.has(m[0]) ? 'KW' : 'NAME', v: m[0], line: lineNo }); i += m[0].length; continue; }
        const op = OPS.find(o => line.startsWith(o, i));
        if (op) {
          if ('([{'.includes(op)) depth++;
          if (')]}'.includes(op)) depth = Math.max(0, depth - 1);
          toks.push({ t: 'OP', v: op, line: lineNo }); i += op.length; continue;
        }
        throw new PyError('SyntaxError', 'invalid character ' + JSON.stringify(c), lineNo);
      }
      if (depth === 0 && toks.length && toks[toks.length - 1].t !== 'NEWLINE' && toks[toks.length - 1].t !== 'INDENT' && toks[toks.length - 1].t !== 'DEDENT') toks.push({ t: 'NEWLINE', line: lineNo });
    }
    if (depth > 0) throw new PyError('SyntaxError', "'(' was never closed", lines.length);
    if (toks.length && toks[toks.length - 1].t !== 'NEWLINE') toks.push({ t: 'NEWLINE', line: lines.length });
    while (indents.length > 1) { indents.pop(); toks.push({ t: 'DEDENT', line: lines.length }); }
    toks.push({ t: 'EOF', line: lines.length });
    return toks;
  }

  /* ---------------- Parser ---------------- */
  function parse(src) {
    const toks = tokenize(src);
    let p = 0;
    const peek = (o = 0) => toks[p + o];
    const next = () => toks[p++];
    const isOp = (v, o = 0) => peek(o).t === 'OP' && peek(o).v === v;
    const isKw = (v, o = 0) => peek(o).t === 'KW' && peek(o).v === v;
    const err = (msg, tok) => { throw new PyError('SyntaxError', msg, (tok || peek()).line); };
    function expectOp(v) { if (!isOp(v)) err(isOp(')') || peek().t === 'NEWLINE' ? `expected '${v}'` : `invalid syntax (expected '${v}')`); return next(); }
    function expectNewline() { if (peek().t === 'NEWLINE') { next(); return; } if (peek().t === 'EOF') return; err('invalid syntax'); }

    function block() {
      if (peek().t !== 'NEWLINE') { const s = simpleStmts(); return s; }
      next();
      if (peek().t !== 'INDENT') err('expected an indented block', peek());
      next();
      const stmts = [];
      while (peek().t !== 'DEDENT' && peek().t !== 'EOF') stmts.push(...statement());
      if (peek().t === 'DEDENT') next();
      return stmts;
    }
    function statement() {
      const tok = peek();
      if (tok.t === 'KW') {
        switch (tok.v) {
          case 'if': return [ifStmt()];
          case 'while': { next(); const test = expr(); expectOp(':'); const body = block(); return [{ k: 'while', test, body, line: tok.line }]; }
          case 'for': { next(); const target = targetList(); if (!isKw('in')) err("invalid syntax (expected 'in')"); next(); const iter = expr(); expectOp(':'); const body = block(); return [{ k: 'for', target, iter, body, line: tok.line }]; }
          case 'def': {
            next(); if (peek().t !== 'NAME') err('invalid syntax'); const name = next().v; expectOp('(');
            const params = [], defaults = [];
            while (!isOp(')')) { if (peek().t !== 'NAME') err('invalid syntax'); params.push(next().v); if (isOp('=')) { next(); defaults.push(expr()); } else if (defaults.length) err('non-default argument follows default argument'); else defaults.push(undefined); if (isOp(',')) next(); else break; }
            expectOp(')'); expectOp(':'); const body = block();
            return [{ k: 'def', name, params, defaults, body, line: tok.line }];
          }
          case 'try': {
            next(); expectOp(':'); const body = block(); const handlers = []; let finalBody = null;
            while (isKw('except')) { const et = next(); let type = null, name = null; if (peek().t === 'NAME') { type = next().v; if (isKw('as')) { next(); name = next().v; } } expectOp(':'); handlers.push({ type, name, body: block(), line: et.line }); }
            if (isKw('finally')) { next(); expectOp(':'); finalBody = block(); }
            if (!handlers.length && !finalBody) err("expected 'except' or 'finally' block");
            return [{ k: 'try', body, handlers, finalBody, line: tok.line }];
          }
          case 'with': { next(); const ctx = expr(); let name = null; if (isKw('as')) { next(); name = next().v; } expectOp(':'); const body = block(); return [{ k: 'with', ctx, name, body, line: tok.line }]; }
          case 'class': err('classes are not supported on the practice PC', tok); break;
          case 'elif': case 'else': err("invalid syntax ('" + tok.v + "' without 'if')", tok); break;
          case 'except': err("invalid syntax ('except' without 'try')", tok); break;
          default: break;
        }
      }
      return simpleStmts();
    }
    function ifStmt() {
      const tok = next(); const test = expr(); expectOp(':'); const body = block();
      let orelse = [];
      if (isKw('elif')) orelse = [ifStmt()];
      else if (isKw('else')) { next(); expectOp(':'); orelse = block(); }
      return { k: 'if', test, body, orelse, line: tok.line };
    }
    function simpleStmts() {
      const out = [simpleStmt()];
      while (isOp(';')) { next(); if (peek().t === 'NEWLINE') break; out.push(simpleStmt()); }
      expectNewline();
      return out;
    }
    function simpleStmt() {
      const tok = peek();
      if (tok.t === 'KW') {
        if (tok.v === 'return') { next(); const v = (peek().t === 'NEWLINE' || isOp(';')) ? null : exprList(); return { k: 'return', value: v, line: tok.line }; }
        if (tok.v === 'break') { next(); return { k: 'break', line: tok.line }; }
        if (tok.v === 'continue') { next(); return { k: 'continue', line: tok.line }; }
        if (tok.v === 'pass') { next(); return { k: 'pass', line: tok.line }; }
        if (tok.v === 'global') { next(); const names = [next().v]; while (isOp(',')) { next(); names.push(next().v); } return { k: 'global', names, line: tok.line }; }
        if (tok.v === 'del') { next(); const t = postfix(); return { k: 'del', target: t, line: tok.line }; }
        if (tok.v === 'raise') { next(); const e = expr(); return { k: 'raise', value: e, line: tok.line }; }
        if (tok.v === 'assert') { next(); const t = expr(); let msg = null; if (isOp(',')) { next(); msg = expr(); } return { k: 'assert', test: t, msg, line: tok.line }; }
        if (tok.v === 'import') { next(); const names = []; do { if (peek().t !== 'NAME') err('invalid syntax'); const n = next().v; let alias = n; if (isKw('as')) { next(); alias = next().v; } names.push({ name: n, alias }); if (isOp(',')) next(); else break; } while (true); return { k: 'import', names, line: tok.line }; }
        if (tok.v === 'from') { next(); const mod = next().v; if (!isKw('import')) err('invalid syntax'); next(); const names = []; const star = isOp('*'); if (star) next(); else do { const n = next().v; let alias = n; if (isKw('as')) { next(); alias = next().v; } names.push({ name: n, alias }); if (isOp(',')) next(); else break; } while (true); return { k: 'from', mod, names, star, line: tok.line }; }
      }
      if (tok.t === 'NAME' && tok.v === 'print' && peek(1).t !== 'OP') err("Missing parentheses in call to 'print'. Did you mean print(...)?", tok);
      const e = exprList();
      if (isOp('=')) {
        const targets = [e];
        while (isOp('=')) { next(); targets.push(exprList()); }
        const value = targets.pop();
        targets.forEach(checkTarget);
        return { k: 'assign', targets, value, line: tok.line };
      }
      const aug = peek();
      if (aug.t === 'OP' && ['+=', '-=', '*=', '/=', '//=', '%=', '**='].includes(aug.v)) { next(); checkTarget(e); const value = expr(); return { k: 'augassign', target: e, op: aug.v.slice(0, -1), value, line: tok.line }; }
      return { k: 'expr', value: e, line: tok.line };
    }
    function checkTarget(e) { if (e.k === 'name' || e.k === 'index') return; if (e.k === 'tuple' || e.k === 'list') { e.items.forEach(checkTarget); return; } err("cannot assign to " + (e.k === 'call' ? 'function call' : e.k === 'str' || e.k === 'num' ? 'literal' : 'expression') + " here. Maybe you meant '==' instead of '='?", { line: e.line }); }
    function targetList() { const items = [postfix()]; while (isOp(',')) { next(); if (isKw('in')) break; items.push(postfix()); } return items.length === 1 ? items[0] : { k: 'tuple', items, line: items[0].line }; }
    function exprList() { const first = expr(); if (!isOp(',')) return first; const items = [first]; while (isOp(',')) { next(); if (peek().t === 'NEWLINE' || isOp('=') || isOp(')') || isOp(';') || peek().t === 'EOF') break; items.push(expr()); } return { k: 'tuple', items, line: first.line }; }

    function expr() {
      const t = orExpr();
      if (isKw('if')) { next(); const test = orExpr(); if (!isKw('else')) err("expected 'else' after 'if' expression"); next(); const orelse = expr(); return { k: 'ternary', test, body: t, orelse, line: t.line }; }
      return t;
    }
    function orExpr() { let l = andExpr(); while (isKw('or')) { const t = next(); l = { k: 'bool', op: 'or', left: l, right: andExpr(), line: t.line }; } return l; }
    function andExpr() { let l = notExpr(); while (isKw('and')) { const t = next(); l = { k: 'bool', op: 'and', left: l, right: notExpr(), line: t.line }; } return l; }
    function notExpr() { if (isKw('not')) { const t = next(); return { k: 'not', value: notExpr(), line: t.line }; } return comparison(); }
    function comparison() {
      const left = arith(); const ops = [], rights = [];
      while (true) {
        let op = null;
        if (peek().t === 'OP' && ['<', '>', '==', '!=', '<=', '>='].includes(peek().v)) op = next().v;
        else if (isKw('in')) { next(); op = 'in'; }
        else if (isKw('not') && isKw('in', 1)) { next(); next(); op = 'not in'; }
        else if (isKw('is')) { next(); if (isKw('not')) { next(); op = 'is not'; } else op = 'is'; }
        else break;
        ops.push(op); rights.push(arith());
      }
      if (!ops.length) return left;
      return { k: 'compare', left, ops, rights, line: left.line };
    }
    function arith() { let l = term(); while (isOp('+') || isOp('-')) { const t = next(); l = { k: 'binop', op: t.v, left: l, right: term(), line: t.line }; } return l; }
    function term() { let l = factor(); while (peek().t === 'OP' && ['*', '/', '//', '%'].includes(peek().v)) { const t = next(); l = { k: 'binop', op: t.v, left: l, right: factor(), line: t.line }; } return l; }
    function factor() { if (isOp('-') || isOp('+')) { const t = next(); return { k: 'unary', op: t.v, value: factor(), line: t.line }; } return power(); }
    function power() { const b = postfix(); if (isOp('**')) { const t = next(); return { k: 'binop', op: '**', left: b, right: factor(), line: t.line }; } return b; }
    function postfix() {
      let e = atom();
      while (true) {
        if (isOp('(')) {
          const t = next(); const args = [], kwargs = [];
          while (!isOp(')')) {
            if (peek().t === 'NAME' && isOp('=', 1)) { const n = next().v; next(); kwargs.push({ name: n, value: expr() }); }
            else args.push(expr());
            if (isOp(',')) next(); else break;
          }
          expectOp(')');
          e = { k: 'call', func: e, args, kwargs, line: t.line };
        } else if (isOp('[')) {
          const t = next();
          let lo = null, hi = null, step = null, slice = false;
          if (!isOp(':')) lo = expr();
          if (isOp(':')) { slice = true; next(); if (!isOp(']') && !isOp(':')) hi = expr(); if (isOp(':')) { next(); if (!isOp(']')) step = expr(); } }
          expectOp(']');
          e = slice ? { k: 'slice', value: e, lo, hi, step, line: t.line } : { k: 'index', value: e, index: lo, line: t.line };
        } else if (isOp('.')) {
          const t = next(); if (peek().t !== 'NAME') err('invalid syntax'); e = { k: 'attr', value: e, name: next().v, line: t.line };
        } else break;
      }
      return e;
    }
    function atom() {
      const tok = next();
      if (tok.t === 'NUM') return { k: 'num', v: tok.v, line: tok.line };
      if (tok.t === 'STR' || tok.t === 'FSTR') {
        const parts = [{ f: tok.t === 'FSTR', v: tok.v }];
        while (peek().t === 'STR' || peek().t === 'FSTR') { const n = next(); parts.push({ f: n.t === 'FSTR', v: n.v }); }
        if (parts.every(x => !x.f)) return { k: 'str', v: parts.map(x => x.v).join(''), line: tok.line };
        return { k: 'fstr', parts: parts.flatMap(x => x.f ? parseFString(x.v, tok.line) : [{ lit: x.v }]), line: tok.line };
      }
      if (tok.t === 'NAME') return { k: 'name', name: tok.v, line: tok.line };
      if (tok.t === 'KW') {
        if (tok.v === 'True') return { k: 'const', v: true, line: tok.line };
        if (tok.v === 'False') return { k: 'const', v: false, line: tok.line };
        if (tok.v === 'None') return { k: 'const', v: null, line: tok.line };
        if (tok.v === 'lambda') err('lambda is not supported on the practice PC', tok);
        err('invalid syntax', tok);
      }
      if (tok.t === 'OP') {
        if (tok.v === '(') {
          if (isOp(')')) { next(); return { k: 'tuple', items: [], line: tok.line }; }
          const first = expr();
          if (isKw('for')) { const c = comprehension(first, tok.line); expectOp(')'); return { k: 'listcomp', ...c }; }
          if (isOp(',')) { const items = [first]; while (isOp(',')) { next(); if (isOp(')')) break; items.push(expr()); } expectOp(')'); return { k: 'tuple', items, line: tok.line }; }
          expectOp(')'); return first;
        }
        if (tok.v === '[') {
          const items = [];
          if (!isOp(']')) {
            const first = expr();
            if (isKw('for')) { const c = comprehension(first, tok.line); expectOp(']'); return { k: 'listcomp', ...c }; }
            items.push(first);
            while (isOp(',')) { next(); if (isOp(']')) break; items.push(expr()); }
          }
          expectOp(']'); return { k: 'list', items, line: tok.line };
        }
        if (tok.v === '{') {
          const keys = [], values = [];
          while (!isOp('}')) { keys.push(expr()); expectOp(':'); values.push(expr()); if (isOp(',')) next(); else break; }
          expectOp('}'); return { k: 'dict', keys, values, line: tok.line };
        }
      }
      if (tok.t === 'NEWLINE' || tok.t === 'EOF') err('invalid syntax', tok);
      if (tok.t === 'INDENT') err('unexpected indent', tok);
      err('invalid syntax', tok);
    }
    function comprehension(elt, line) { next(); const target = targetList(); if (!isKw('in')) err('invalid syntax'); next(); const iter = orExpr(); let cond = null; if (isKw('if')) { next(); cond = orExpr(); } return { elt, target, iter, cond, line }; }
    function parseFString(s, line) {
      const parts = []; let i = 0, lit = '';
      while (i < s.length) {
        const c = s[i];
        if (c === '{') {
          if (s[i + 1] === '{') { lit += '{'; i += 2; continue; }
          if (lit) { parts.push({ lit }); lit = ''; }
          let j = i + 1, depth = 1;
          while (j < s.length && depth > 0) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; if (depth > 0) j++; }
          if (depth > 0) throw new PyError('SyntaxError', "f-string: expecting '}'", line);
          let inner = s.slice(i + 1, j), spec = null, conv = null;
          const m = /^(.*?)(![rs])?(:[^:]*)?$/.exec(inner);
          if (m && (m[2] || m[3])) { inner = m[1]; conv = m[2] ? m[2][1] : null; spec = m[3] ? m[3].slice(1) : null; }
          if (!inner.trim()) throw new PyError('SyntaxError', 'f-string: empty expression not allowed', line);
          const sub = parse(inner.trim() + '\n');
          if (sub.length !== 1 || sub[0].k !== 'expr') throw new PyError('SyntaxError', 'f-string: invalid expression', line);
          parts.push({ expr: sub[0].value, spec, conv });
          i = j + 1;
        } else if (c === '}') { if (s[i + 1] === '}') { lit += '}'; i += 2; continue; } throw new PyError('SyntaxError', "f-string: single '}' is not allowed", line); }
        else { lit += c; i++; }
      }
      if (lit) parts.push({ lit });
      return parts;
    }

    const stmts = [];
    while (peek().t !== 'EOF') {
      if (peek().t === 'NEWLINE') { next(); continue; }
      if (peek().t === 'INDENT') err('unexpected indent');
      if (peek().t === 'DEDENT') { next(); continue; }
      stmts.push(...statement());
    }
    return stmts;
  }

  /* ---------------- Verdier ---------------- */
  const isF = v => v instanceof F;
  const num = v => isF(v) ? v.v : v;
  const isNum = v => typeof v === 'number' || isF(v) || typeof v === 'boolean';
  function typeName(v) {
    if (v === null) return 'NoneType'; if (typeof v === 'boolean') return 'bool'; if (typeof v === 'number') return 'int'; if (isF(v)) return 'float';
    if (typeof v === 'string') return 'str'; if (Array.isArray(v)) return 'list'; if (v instanceof Tuple) return 'tuple'; if (v instanceof Dict) return 'dict';
    if (v instanceof Range) return 'range'; if (v instanceof PyFunc || v instanceof Builtin) return 'function'; if (v instanceof Module) return 'module'; if (v instanceof FileObj) return '_io.TextIOWrapper';
    return 'object';
  }
  function fmtFloat(x) {
    if (!isFinite(x)) return x > 0 ? 'inf' : x < 0 ? '-inf' : 'nan';
    if (Number.isInteger(x) && Math.abs(x) < 1e16) return x.toFixed(1);
    let s = String(x);
    if (/e/.test(s)) s = s.replace('e+', 'e+').replace(/e(-?)(\d)$/, 'e$10$2');
    return s;
  }
  function str(v) {
    if (v === null) return 'None'; if (v === true) return 'True'; if (v === false) return 'False';
    if (typeof v === 'number') return String(v); if (isF(v)) return fmtFloat(v.v);
    if (typeof v === 'string') return v;
    if (v && v.pyexc) return v.msg;
    return repr(v);
  }
  function repr(v) {
    if (typeof v === 'string') { const q = v.includes("'") && !v.includes('"') ? '"' : "'"; return q + v.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\t/g, '\\t').replace(new RegExp(q, 'g'), '\\' + q) + q; }
    if (v === null || typeof v !== 'object' || v instanceof F) return str(v);
    if (v.pyexc) return v.pyexc + '(' + JSON.stringify(v.msg) + ')';
    if (v.boundMethod) return '<built-in method ' + v.name + '>';
    if (Array.isArray(v)) return '[' + v.map(repr).join(', ') + ']';
    if (v instanceof Tuple) return '(' + v.items.map(repr).join(', ') + (v.items.length === 1 ? ',' : '') + ')';
    if (v instanceof Dict) return '{' + [...v.map.values()].map(([k, val]) => repr(k) + ': ' + repr(val)).join(', ') + '}';
    if (v instanceof Range) return 'range(' + v.start + ', ' + v.stop + (v.step !== 1 ? ', ' + v.step : '') + ')';
    if (v instanceof PyFunc) return '<function ' + v.name + '>'; if (v instanceof Builtin) return '<built-in function ' + v.name + '>';
    if (v instanceof Module) return "<module '" + v.name + "'>"; if (v instanceof FileObj) return "<_io.TextIOWrapper name='" + v.path + "' mode='" + v.mode + "'>";
    return '<object>';
  }
  function truthy(v) {
    if (v === null || v === false) return false; if (v === true) return true;
    if (typeof v === 'number') return v !== 0; if (isF(v)) return v.v !== 0;
    if (typeof v === 'string') return v.length > 0; if (Array.isArray(v)) return v.length > 0;
    if (v instanceof Tuple) return v.items.length > 0; if (v instanceof Dict) return v.map.size > 0; if (v instanceof Range) return rangeLen(v) > 0;
    return true;
  }
  function eq(a, b) {
    if (isNum(a) && isNum(b)) return num(a) === num(b);
    if (typeof a === 'string' || typeof b === 'string') return a === b;
    if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => eq(x, b[i]));
    if (a instanceof Tuple && b instanceof Tuple) return eq(a.items, b.items);
    if (a instanceof Dict && b instanceof Dict) return a.map.size === b.map.size && [...a.map.keys()].every(k => b.map.has(k) && eq(a.map.get(k)[1], b.map.get(k)[1]));
    return a === b;
  }
  function dictKey(k, line) { if (typeof k === 'string') return 's:' + k; if (isNum(k)) return 'n:' + num(k); if (k === null) return 'None'; if (k instanceof Tuple) return 't:' + k.items.map(x => dictKey(x, line)).join(','); throw new PyError('TypeError', "unhashable type: '" + typeName(k) + "'", line); }
  function rangeLen(r) { return Math.max(0, Math.ceil((r.stop - r.start) / r.step)); }
  function compare(op, a, b, line) {
    if (op === 'in' || op === 'not in') {
      let r;
      if (typeof b === 'string') { if (typeof a !== 'string') throw new PyError('TypeError', "'in <string>' requires string as left operand, not " + typeName(a), line); r = b.includes(a); }
      else if (Array.isArray(b)) r = b.some(x => eq(x, a));
      else if (b instanceof Tuple) r = b.items.some(x => eq(x, a));
      else if (b instanceof Dict) r = b.map.has(dictKey(a, line));
      else if (b instanceof Range) r = isNum(a) && num(a) >= b.start && num(a) < b.stop && (num(a) - b.start) % b.step === 0;
      else throw new PyError('TypeError', "argument of type '" + typeName(b) + "' is not iterable", line);
      return op === 'in' ? r : !r;
    }
    if (op === 'is') return a === b || (isNum(a) && isNum(b) && num(a) === num(b)); if (op === 'is not') return !(a === b || (isNum(a) && isNum(b) && num(a) === num(b)));
    if (op === '==') return eq(a, b); if (op === '!=') return !eq(a, b);
    const both = (isNum(a) && isNum(b)) || (typeof a === 'string' && typeof b === 'string') || (Array.isArray(a) && Array.isArray(b));
    if (!both) throw new PyError('TypeError', `'${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`, line);
    let x = a, y = b;
    if (Array.isArray(a)) { for (let i = 0; i < Math.min(a.length, b.length); i++) { if (!eq(a[i], b[i])) { x = a[i]; y = b[i]; break; } } if (x === a) { x = a.length; y = b.length; } }
    x = num(x); y = num(y);
    return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
  }
  function binop(op, a, b, line) {
    if (isNum(a) && isNum(b) && typeof a !== 'boolean' || (isNum(a) && isNum(b))) {
      const x = num(a), y = num(b), fl = isF(a) || isF(b);
      let r;
      switch (op) {
        case '+': r = x + y; break; case '-': r = x - y; break; case '*': r = x * y; break;
        case '/': if (y === 0) throw new PyError('ZeroDivisionError', 'division by zero', line); return new F(x / y);
        case '//': if (y === 0) throw new PyError('ZeroDivisionError', fl ? 'float floor division by zero' : 'integer division or modulo by zero', line); r = Math.floor(x / y); break;
        case '%': if (y === 0) throw new PyError('ZeroDivisionError', fl ? 'float modulo' : 'integer modulo by zero', line); r = ((x % y) + y) % y; break;
        case '**': r = Math.pow(x, y); if (!fl && y < 0) return new F(r); break;
      }
      if (!fl && !Number.isInteger(r) && Number.isFinite(r)) return new F(r);
      return fl ? new F(r) : r;
    }
    if (op === '+') {
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (Array.isArray(a) && Array.isArray(b)) return a.concat(b);
      if (a instanceof Tuple && b instanceof Tuple) return new Tuple(a.items.concat(b.items));
      if (typeof a === 'string' || typeof b === 'string') throw new PyError('TypeError', typeof a === 'string' ? `can only concatenate str (not "${typeName(b)}") to str` : `unsupported operand type(s) for +: '${typeName(a)}' and 'str'`, line);
    }
    if (op === '*') {
      if (typeof a === 'string' && typeof b === 'number') return a.repeat(Math.max(0, b));
      if (typeof b === 'string' && typeof a === 'number') return b.repeat(Math.max(0, a));
      if (Array.isArray(a) && typeof b === 'number') { const o = []; for (let i = 0; i < b; i++) o.push(...a); return o; }
      if (Array.isArray(b) && typeof a === 'number') { const o = []; for (let i = 0; i < a; i++) o.push(...b); return o; }
    }
    if (op === '%' && typeof a === 'string') { const vals = b instanceof Tuple ? b.items : [b]; let i = 0; return a.replace(/%[sd]/g, m => m === '%d' ? String(Math.trunc(num(vals[i++]))) : str(vals[i++])); }
    throw new PyError('TypeError', `unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`, line);
  }
  function* iterate(v, line) {
    if (Array.isArray(v)) { for (let i = 0; i < v.length; i++) yield v[i]; return; }
    if (typeof v === 'string') { for (const ch of v) yield ch; return; }
    if (v instanceof Tuple) { yield* v.items; return; }
    if (v instanceof Range) { for (let i = v.start; v.step > 0 ? i < v.stop : i > v.stop; i += v.step) yield i; return; }
    if (v instanceof Dict) { for (const [k] of v.map.values()) yield k; return; }
    if (v instanceof FileObj) { const lines = v.content.split('\n'); for (let i = 0; i < lines.length; i++) { if (i === lines.length - 1 && lines[i] === '') break; yield lines[i] + (i < lines.length - 1 ? '\n' : ''); } return; }
    throw new PyError('TypeError', "'" + typeName(v) + "' object is not iterable", line);
  }
  function toList(v, line) { return [...iterate(v, line)]; }
  function toInt(v, line) {
    if (typeof v === 'boolean') return v ? 1 : 0;
    if (typeof v === 'number') return v; if (isF(v)) return Math.trunc(v.v);
    if (typeof v === 'string') { const s = v.trim(); if (!/^[+-]?\d+$/.test(s)) throw new PyError('ValueError', "invalid literal for int() with base 10: " + repr(v), line); return parseInt(s, 10); }
    throw new PyError('TypeError', "int() argument must be a string, a bytes-like object or a real number, not '" + typeName(v) + "'", line);
  }
  function toFloat(v, line) {
    if (typeof v === 'boolean') return new F(v ? 1 : 0);
    if (typeof v === 'number') return new F(v); if (isF(v)) return v;
    if (typeof v === 'string') { const s = v.trim().replace(',', '.'); if (!/^[+-]?(\d+(\.\d*)?|\.\d+)([eE][+-]?\d+)?$/.test(s)) throw new PyError('ValueError', 'could not convert string to float: ' + repr(v), line); return new F(parseFloat(s)); }
    throw new PyError('TypeError', "float() argument must be a string or a real number, not '" + typeName(v) + "'", line);
  }
  function formatSpec(v, spec, line) {
    if (!spec) return str(v);
    const m = /^([^{}]?[<>^=])?([+\- ])?(,)?(\d+)?(\.(\d+))?([dfs%e])?$/.exec(spec);
    if (!m) throw new PyError('ValueError', 'Invalid format specifier', line);
    const [, align, sign, comma, width, , prec, type] = m;
    let s;
    if (type === 'f' || type === '%' || (prec != null && isNum(v))) {
      let x = num(v); if (type === '%') x *= 100;
      s = x.toFixed(prec != null ? +prec : 6); if (type === '%') s += '%';
      if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    } else if (type === 'd') { s = String(Math.trunc(num(v))); if (comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); }
    else if (type === 'e') s = num(v).toExponential(prec != null ? +prec : 6);
    else { s = str(v); if (comma && isNum(v)) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ','); if (prec != null && typeof v === 'string') s = s.slice(0, +prec); }
    if (sign === '+' && isNum(v) && num(v) >= 0) s = '+' + s;
    if (width && s.length < +width) {
      const pad = +width - s.length; const fill = align && align.length === 2 ? align[0] : ' '; const a = align ? align[align.length - 1] : (isNum(v) ? '>' : '<');
      if (a === '>') s = fill.repeat(pad) + s; else if (a === '^') s = fill.repeat(Math.floor(pad / 2)) + s + fill.repeat(Math.ceil(pad / 2)); else s = s + fill.repeat(pad);
    }
    return s;
  }

  /* ---------------- Miljø ---------------- */
  class Env {
    constructor(parent, isGlobal) { this.vars = new Map(); this.parent = parent; this.isGlobal = !!isGlobal; this.globals = new Set(); }
    lookup(name, line) {
      let e = this;
      while (e) { if (e.vars.has(name)) return e.vars.get(name); e = e.parent; }
      if (BUILTINS.has(name)) return BUILTINS.get(name);
      throw new PyError('NameError', "name '" + name + "' is not defined", line);
    }
    set(name, v) { if (this.globals.has(name)) { let g = this; while (g.parent) g = g.parent; g.vars.set(name, v); } else this.vars.set(name, v); }
  }

  /* ---------------- Innebygde funksjoner ---------------- */
  const BUILTINS = new Map();
  const B = (name, fn) => BUILTINS.set(name, new Builtin(name, fn));
  /* fn(args, kwargs, ctx, line) kan være generator (yield for input/print) eller vanlig funksjon */
  B('print', function* (args, kw, ctx) {
    const sep = kw.sep !== undefined ? str(kw.sep) : ' ', end = kw.end !== undefined ? str(kw.end) : '\n';
    yield { type: 'out', text: args.map(str).join(sep) + end };
  });
  B('input', function* (args, kw, ctx, line) {
    const line0 = args.length ? str(args[0]) : '';
    const r = yield { type: 'input', prompt: line0 };
    return r == null ? '' : r;
  });
  B('int', (a, k, c, line) => a.length ? toInt(a[0], line) : 0);
  B('float', (a, k, c, line) => a.length ? toFloat(a[0], line) : new F(0));
  B('str', a => a.length ? str(a[0]) : '');
  B('bool', a => a.length ? truthy(a[0]) : false);
  B('len', (a, k, c, line) => {
    const v = a[0];
    if (typeof v === 'string') return [...v].length; if (Array.isArray(v)) return v.length; if (v instanceof Tuple) return v.items.length;
    if (v instanceof Dict) return v.map.size; if (v instanceof Range) return rangeLen(v);
    throw new PyError('TypeError', "object of type '" + typeName(v) + "' has no len()", line);
  });
  B('range', (a, k, c, line) => {
    a.forEach(x => { if (typeof x !== 'number') throw new PyError('TypeError', "'" + typeName(x) + "' object cannot be interpreted as an integer", line); });
    if (a.length === 1) return new Range(0, a[0], 1); if (a.length === 2) return new Range(a[0], a[1], 1);
    if (a[2] === 0) throw new PyError('ValueError', 'range() arg 3 must not be zero', line);
    return new Range(a[0], a[1], a[2]);
  });
  B('list', (a, k, c, line) => { if (!a.length) return []; if (a[0] instanceof Range && rangeLen(a[0]) > 1000000) throw new PyError('MemoryError', 'range too large for the practice PC', line); return toList(a[0], line); });
  B('tuple', (a, k, c, line) => new Tuple(a.length ? toList(a[0], line) : []));
  B('dict', () => new Dict());
  B('set', (a, k, c, line) => { const out = []; if (a.length) for (const x of iterate(a[0], line)) if (!out.some(y => eq(x, y))) out.push(x); return out; });
  B('abs', (a, k, c, line) => isF(a[0]) ? new F(Math.abs(a[0].v)) : Math.abs(num(a[0])));
  B('round', (a, k, c, line) => {
    const x = num(a[0]);
    if (a.length > 1 && a[1] !== null) { const p = a[1]; const m = Math.pow(10, p); return new F(Math.round(x * m) / m); }
    const r = Math.round(x); return (Math.abs(x % 1) === 0.5 && r % 2 !== 0) ? r - 1 : r;
  });
  B('min', (a, k, c, line) => { const xs = a.length === 1 ? toList(a[0], line) : a; if (!xs.length) throw new PyError('ValueError', 'min() arg is an empty sequence', line); return xs.reduce((m, x) => compare('<', x, m, line) ? x : m); });
  B('max', (a, k, c, line) => { const xs = a.length === 1 ? toList(a[0], line) : a; if (!xs.length) throw new PyError('ValueError', 'max() arg is an empty sequence', line); return xs.reduce((m, x) => compare('>', x, m, line) ? x : m); });
  B('sum', (a, k, c, line) => toList(a[0], line).reduce((s, x) => binop('+', s, x, line), a.length > 1 ? a[1] : 0));
  B('sorted', (a, k, c, line) => { const xs = toList(a[0], line).slice(); xs.sort((x, y) => compare('<', x, y, line) ? -1 : compare('>', x, y, line) ? 1 : 0); if (k.reverse && truthy(k.reverse)) xs.reverse(); return xs; });
  B('reversed', (a, k, c, line) => toList(a[0], line).reverse());
  B('enumerate', (a, k, c, line) => toList(a[0], line).map((x, i) => new Tuple([i + (a.length > 1 ? a[1] : 0), x])));
  B('zip', (a, k, c, line) => { const ls = a.map(x => toList(x, line)); const n = Math.min(...ls.map(l => l.length)); const out = []; for (let i = 0; i < n; i++) out.push(new Tuple(ls.map(l => l[i]))); return out; });
  B('type', a => "<class '" + typeName(a[0]) + "'>");
  B('isinstance', (a, k, c, line) => { const t = a[1]; const names = Array.isArray(t) || t instanceof Tuple ? (t.items || t) : [t]; return names.some(n => { const cls = typeof n === 'string' ? n : (n instanceof Builtin ? n.name : ''); return cls === typeName(a[0]) || (cls === 'int' && typeof a[0] === 'boolean'); }); });
  B('chr', a => String.fromCodePoint(num(a[0])));
  B('ord', (a, k, c, line) => { if (typeof a[0] !== 'string' || [...a[0]].length !== 1) throw new PyError('TypeError', 'ord() expected a character', line); return a[0].codePointAt(0); });
  B('exit', () => { throw new PyError('SystemExit', '', 0); });
  B('quit', () => { throw new PyError('SystemExit', '', 0); });
  B('open', (a, k, c, line) => {
    const path = str(a[0]); const mode = a.length > 1 ? str(a[1]) : (k.mode ? str(k.mode) : 'r');
    if (!c.fs) throw new PyError('OSError', 'file system not available', line);
    const r = c.fs.open(path, mode);
    if (r.error) throw new PyError(r.errorType || 'FileNotFoundError', r.error, line);
    return new FileObj(path, mode, r.content);
  });
  B('help', function* () { yield { type: 'out', text: 'Hjelp: se kurset i veilederen til høyre. Innebygde funksjoner: print, input, int, float, str, len, range, list, abs, round, min, max, sum, sorted, open\n' }; });
  const MATH = new Module('math', new Map(Object.entries({ pi: new F(Math.PI), e: new F(Math.E), sqrt: new Builtin('sqrt', a => new F(Math.sqrt(num(a[0])))), floor: new Builtin('floor', a => Math.floor(num(a[0]))), ceil: new Builtin('ceil', a => Math.ceil(num(a[0]))), pow: new Builtin('pow', a => new F(Math.pow(num(a[0]), num(a[1])))), sin: new Builtin('sin', a => new F(Math.sin(num(a[0])))), cos: new Builtin('cos', a => new F(Math.cos(num(a[0])))), tan: new Builtin('tan', a => new F(Math.tan(num(a[0])))), fabs: new Builtin('fabs', a => new F(Math.abs(num(a[0])))), log: new Builtin('log', a => new F(a.length > 1 ? Math.log(num(a[0])) / Math.log(num(a[1])) : Math.log(num(a[0])))) })));
  const RANDOM = new Module('random', new Map(Object.entries({
    randint: new Builtin('randint', (a, k, c, line) => { const lo = num(a[0]), hi = num(a[1]); if (hi < lo) throw new PyError('ValueError', 'empty range for randrange()', line); return lo + Math.floor(Math.random() * (hi - lo + 1)); }),
    random: new Builtin('random', () => new F(Math.random())),
    choice: new Builtin('choice', (a, k, c, line) => { const xs = toList(a[0], line); if (!xs.length) throw new PyError('IndexError', 'Cannot choose from an empty sequence', line); return xs[Math.floor(Math.random() * xs.length)]; }),
    shuffle: new Builtin('shuffle', a => { const xs = a[0]; for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [xs[i], xs[j]] = [xs[j], xs[i]]; } return null; }),
    uniform: new Builtin('uniform', a => new F(num(a[0]) + Math.random() * (num(a[1]) - num(a[0]))))
  })));
  const TIME = new Module('time', new Map(Object.entries({
    sleep: new Builtin('sleep', function* (a) { yield { type: 'sleep', ms: Math.min(5000, num(a[0]) * 1000) }; return null; }),
    time: new Builtin('time', () => new F(Date.now() / 1000))
  })));
  const MODULES = { math: MATH, random: RANDOM, time: TIME };

  function* callMethod(obj, name, args, kw, ctx, line) {
    const bad = () => { throw new PyError('AttributeError', "'" + typeName(obj) + "' object has no attribute '" + name + "'", line); };
    if (typeof obj === 'string') {
      switch (name) {
        case 'upper': return obj.toUpperCase(); case 'lower': return obj.toLowerCase(); case 'strip': return args.length ? obj.replace(new RegExp('^[' + esc(str(args[0])) + ']+|[' + esc(str(args[0])) + ']+$', 'g'), '') : obj.trim();
        case 'lstrip': return obj.replace(/^\s+/, ''); case 'rstrip': return obj.replace(/\s+$/, '');
        case 'split': { if (!args.length || args[0] === null) return obj.trim().split(/\s+/).filter(Boolean); const parts = obj.split(str(args[0])); if (args.length > 1) { const n = num(args[1]); return parts.slice(0, n).concat(parts.length > n ? [parts.slice(n).join(str(args[0]))] : []); } return parts; }
        case 'splitlines': return obj.split(/\r?\n/).filter((l, i, a) => !(i === a.length - 1 && l === ''));
        case 'join': return toList(args[0], line).map(x => { if (typeof x !== 'string') throw new PyError('TypeError', 'sequence item 0: expected str instance, ' + typeName(x) + ' found', line); return x; }).join(obj);
        case 'replace': return obj.split(str(args[0])).join(str(args[1]));
        case 'startswith': return obj.startsWith(str(args[0])); case 'endswith': return obj.endsWith(str(args[0]));
        case 'find': return obj.indexOf(str(args[0])); case 'index': { const i = obj.indexOf(str(args[0])); if (i < 0) throw new PyError('ValueError', 'substring not found', line); return i; }
        case 'count': return obj.split(str(args[0])).length - 1;
        case 'isdigit': return /^\d+$/.test(obj); case 'isalpha': return /^[A-Za-zÀ-ɏ]+$/.test(obj); case 'isnumeric': return /^\d+$/.test(obj); case 'isalnum': return /^[\wÀ-ɏ]+$/.test(obj) && !/_/.test(obj); case 'isspace': return /^\s+$/.test(obj); case 'isupper': return obj === obj.toUpperCase() && obj !== obj.toLowerCase(); case 'islower': return obj === obj.toLowerCase() && obj !== obj.toUpperCase();
        case 'capitalize': return obj.charAt(0).toUpperCase() + obj.slice(1).toLowerCase(); case 'title': return obj.replace(/\b\w/g, c => c.toUpperCase()); case 'swapcase': return [...obj].map(c => c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()).join('');
        case 'center': { const w = num(args[0]); const pad = Math.max(0, w - obj.length); const f = args.length > 1 ? str(args[1]) : ' '; return f.repeat(Math.floor(pad / 2)) + obj + f.repeat(Math.ceil(pad / 2)); }
        case 'ljust': return obj.padEnd(num(args[0]), args.length > 1 ? str(args[1]) : ' '); case 'rjust': return obj.padStart(num(args[0]), args.length > 1 ? str(args[1]) : ' '); case 'zfill': return obj.padStart(num(args[0]), '0');
        case 'format': { let i = 0; return obj.replace(/\{(\d*)(?::([^}]*))?\}/g, (m, idx, spec) => formatSpec(args[idx === '' ? i++ : +idx], spec, line)); }
        case 'encode': case 'decode': return obj;
        default: bad();
      }
    }
    if (Array.isArray(obj)) {
      switch (name) {
        case 'append': obj.push(args[0]); return null; case 'extend': obj.push(...toList(args[0], line)); return null;
        case 'insert': obj.splice(Math.max(0, num(args[0]) < 0 ? obj.length + num(args[0]) : num(args[0])), 0, args[1]); return null;
        case 'pop': { if (!obj.length) throw new PyError('IndexError', 'pop from empty list', line); let i = args.length ? num(args[0]) : obj.length - 1; if (i < 0) i += obj.length; if (i < 0 || i >= obj.length) throw new PyError('IndexError', 'pop index out of range', line); return obj.splice(i, 1)[0]; }
        case 'remove': { const i = obj.findIndex(x => eq(x, args[0])); if (i < 0) throw new PyError('ValueError', 'list.remove(x): x not in list', line); obj.splice(i, 1); return null; }
        case 'index': { const i = obj.findIndex(x => eq(x, args[0])); if (i < 0) throw new PyError('ValueError', repr(args[0]) + ' is not in list', line); return i; }
        case 'count': return obj.filter(x => eq(x, args[0])).length;
        case 'sort': obj.sort((x, y) => compare('<', x, y, line) ? -1 : compare('>', x, y, line) ? 1 : 0); if (kw.reverse && truthy(kw.reverse)) obj.reverse(); return null;
        case 'reverse': obj.reverse(); return null; case 'copy': return obj.slice(); case 'clear': obj.length = 0; return null;
        default: bad();
      }
    }
    if (obj instanceof Dict) {
      switch (name) {
        case 'keys': return [...obj.map.values()].map(e => e[0]); case 'values': return [...obj.map.values()].map(e => e[1]); case 'items': return [...obj.map.values()].map(e => new Tuple([e[0], e[1]]));
        case 'get': { const e = obj.map.get(dictKey(args[0], line)); return e ? e[1] : (args.length > 1 ? args[1] : null); }
        case 'pop': { const k = dictKey(args[0], line); const e = obj.map.get(k); if (!e) { if (args.length > 1) return args[1]; throw new PyError('KeyError', repr(args[0]), line); } obj.map.delete(k); return e[1]; }
        case 'update': { const o = args[0]; if (o instanceof Dict) o.map.forEach((v, k) => obj.map.set(k, v)); return null; }
        case 'clear': obj.map.clear(); return null; case 'copy': { const d = new Dict(); obj.map.forEach((v, k) => d.map.set(k, v)); return d; }
        case 'setdefault': { const k = dictKey(args[0], line); if (!obj.map.has(k)) obj.map.set(k, [args[0], args.length > 1 ? args[1] : null]); return obj.map.get(k)[1]; }
        default: bad();
      }
    }
    if (obj instanceof Tuple) { if (name === 'count') return obj.items.filter(x => eq(x, args[0])).length; if (name === 'index') { const i = obj.items.findIndex(x => eq(x, args[0])); if (i < 0) throw new PyError('ValueError', 'tuple.index(x): x not in tuple', line); return i; } bad(); }
    if (obj instanceof FileObj) {
      if (obj.closed && name !== 'close') throw new PyError('ValueError', 'I/O operation on closed file.', line);
      switch (name) {
        case 'read': { if (obj.mode.includes('w') || obj.mode.includes('a')) throw new PyError('io.UnsupportedOperation', 'not readable', line); const r = obj.content.slice(obj.pos); obj.pos = obj.content.length; return r; }
        case 'readline': { const rest = obj.content.slice(obj.pos); const i = rest.indexOf('\n'); const l = i < 0 ? rest : rest.slice(0, i + 1); obj.pos += l.length; return l; }
        case 'readlines': { const r = [...iterate(obj, line)]; obj.pos = obj.content.length; return r; }
        case 'write': { if (!obj.mode.includes('w') && !obj.mode.includes('a')) throw new PyError('io.UnsupportedOperation', 'not writable', line); if (typeof args[0] !== 'string') throw new PyError('TypeError', 'write() argument must be str, not ' + typeName(args[0]), line); obj.buffer += args[0]; return args[0].length; }
        case 'writelines': { for (const l of iterate(args[0], line)) obj.buffer += str(l); return null; }
        case 'close': { if (!obj.closed) { obj.closed = true; if ((obj.mode.includes('w') || obj.mode.includes('a')) && ctx.fs) { const r = ctx.fs.write(obj.path, (obj.mode.includes('a') ? obj.content : '') + obj.buffer); if (r && r.error) throw new PyError('OSError', r.error, line); } } return null; }
        default: bad();
      }
    }
    if (obj instanceof Module) { const f = obj.attrs.get(name); if (!f) throw new PyError('AttributeError', "module '" + obj.name + "' has no attribute '" + name + "'", line); return yield* callValue(f, args, kw, ctx, line); }
    bad();
  }
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  function* callValue(f, args, kw, ctx, line) {
    if (f instanceof Builtin) {
      const r = f.fn(args, kw, ctx, line);
      if (r && typeof r.next === 'function' && typeof r[Symbol.iterator] === 'function') return yield* r;
      return r === undefined ? null : r;
    }
    if (f instanceof PyFunc) {
      if (ctx.stack.length > 200) throw new PyError('RecursionError', 'maximum recursion depth exceeded', line);
      const env = new Env(f.env, false);
      if (args.length > f.params.length) throw new PyError('TypeError', `${f.name}() takes ${f.params.length} positional argument${f.params.length === 1 ? '' : 's'} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`, line);
      f.params.forEach((p, i) => {
        if (i < args.length) env.vars.set(p, args[i]);
        else if (kw[p] !== undefined) env.vars.set(p, kw[p]);
        else if (f.defaults[i] !== undefined) env.vars.set(p, f.defaults[i]);
        else throw new PyError('TypeError', `${f.name}() missing 1 required positional argument: '${p}'`, line);
      });
      for (const k in kw) if (!f.params.includes(k)) throw new PyError('TypeError', `${f.name}() got an unexpected keyword argument '${k}'`, line);
      ctx.stack.push({ name: f.name, line });
      try {
        yield* execBlock(f.body, env, ctx);
        return null;
      } catch (e) {
        if (e instanceof ReturnSig) return e.v;
        /* Ta vare på kallstakken før den rulles tilbake, så traceback viser funksjonen feilen skjedde i */
        if (e instanceof PyError && !e.stackSnap) { e.stackSnap = ctx.stack.slice(); e.pyline = e.pyline || ctx.line; }
        throw e;
      } finally { ctx.stack.pop(); }
    }
    throw new PyError('TypeError', "'" + typeName(f) + "' object is not callable", line);
  }

  /* ---------------- Evaluering ---------------- */
  function* evalExpr(n, env, ctx) {
    switch (n.k) {
      case 'num': return n.v.includes('.') || /e/i.test(n.v) ? new F(parseFloat(n.v)) : parseInt(n.v, 10);
      case 'str': return n.v;
      case 'const': return n.v;
      case 'name': return env.lookup(n.name, n.line);
      case 'fstr': { let s = ''; for (const p of n.parts) { if (p.lit !== undefined) s += p.lit; else { let v = yield* evalExpr(p.expr, env, ctx); if (p.conv === 'r') v = repr(v); s += formatSpec(v, p.spec, n.line); } } return s; }
      case 'list': { const out = []; for (const it of n.items) out.push(yield* evalExpr(it, env, ctx)); return out; }
      case 'tuple': { const out = []; for (const it of n.items) out.push(yield* evalExpr(it, env, ctx)); return new Tuple(out); }
      case 'dict': { const d = new Dict(); for (let i = 0; i < n.keys.length; i++) { const k = yield* evalExpr(n.keys[i], env, ctx); const v = yield* evalExpr(n.values[i], env, ctx); d.map.set(dictKey(k, n.line), [k, v]); } return d; }
      case 'listcomp': { const out = []; const it = yield* evalExpr(n.iter, env, ctx); for (const x of iterate(it, n.line)) { assign(n.target, x, env, n.line); if (n.cond && !truthy(yield* evalExpr(n.cond, env, ctx))) continue; out.push(yield* evalExpr(n.elt, env, ctx)); } return out; }
      case 'unary': { const v = yield* evalExpr(n.value, env, ctx); if (!isNum(v)) throw new PyError('TypeError', "bad operand type for unary " + n.op + ": '" + typeName(v) + "'", n.line); return n.op === '-' ? (isF(v) ? new F(-v.v) : -num(v)) : v; }
      case 'not': return !truthy(yield* evalExpr(n.value, env, ctx));
      case 'bool': { const l = yield* evalExpr(n.left, env, ctx); if (n.op === 'and') return truthy(l) ? yield* evalExpr(n.right, env, ctx) : l; return truthy(l) ? l : yield* evalExpr(n.right, env, ctx); }
      case 'binop': { const l = yield* evalExpr(n.left, env, ctx); const r = yield* evalExpr(n.right, env, ctx); return binop(n.op, l, r, n.line); }
      case 'compare': { let l = yield* evalExpr(n.left, env, ctx); for (let i = 0; i < n.ops.length; i++) { const r = yield* evalExpr(n.rights[i], env, ctx); if (!compare(n.ops[i], l, r, n.line)) return false; l = r; } return true; }
      case 'ternary': return truthy(yield* evalExpr(n.test, env, ctx)) ? yield* evalExpr(n.body, env, ctx) : yield* evalExpr(n.orelse, env, ctx);
      case 'index': {
        const v = yield* evalExpr(n.value, env, ctx); const i = yield* evalExpr(n.index, env, ctx);
        if (v instanceof Dict) { const e = v.map.get(dictKey(i, n.line)); if (!e) throw new PyError('KeyError', repr(i), n.line); return e[1]; }
        const items = typeof v === 'string' ? [...v] : Array.isArray(v) ? v : v instanceof Tuple ? v.items : null;
        if (!items) throw new PyError('TypeError', "'" + typeName(v) + "' object is not subscriptable", n.line);
        if (typeof i !== 'number' && typeof i !== 'boolean') throw new PyError('TypeError', typeName(v) + ' indices must be integers or slices, not ' + typeName(i), n.line);
        let idx = num(i); if (idx < 0) idx += items.length;
        if (idx < 0 || idx >= items.length) throw new PyError('IndexError', (typeof v === 'string' ? 'string' : typeName(v)) + ' index out of range', n.line);
        return items[idx];
      }
      case 'slice': {
        const v = yield* evalExpr(n.value, env, ctx);
        const items = typeof v === 'string' ? [...v] : Array.isArray(v) ? v : v instanceof Tuple ? v.items : null;
        if (!items) throw new PyError('TypeError', "'" + typeName(v) + "' object is not subscriptable", n.line);
        const step = n.step ? num(yield* evalExpr(n.step, env, ctx)) : 1;
        if (step === 0) throw new PyError('ValueError', 'slice step cannot be zero', n.line);
        const L = items.length;
        let lo = n.lo ? num(yield* evalExpr(n.lo, env, ctx)) : (step > 0 ? 0 : L - 1);
        let hi = n.hi ? num(yield* evalExpr(n.hi, env, ctx)) : (step > 0 ? L : -L - 1);
        if (lo < 0) lo = Math.max(step > 0 ? 0 : -1, lo + L); if (hi < 0) hi = Math.max(step > 0 ? 0 : -1, hi + L);
        lo = Math.min(lo, L); hi = Math.min(hi, L);
        const out = [];
        if (step > 0) for (let i = lo; i < hi; i += step) out.push(items[i]); else for (let i = lo; i > hi; i += step) out.push(items[i]);
        return typeof v === 'string' ? out.join('') : v instanceof Tuple ? new Tuple(out) : out;
      }
      case 'attr': {
        const v = yield* evalExpr(n.value, env, ctx);
        if (v instanceof Module) { const a = v.attrs.get(n.name); if (a === undefined) throw new PyError('AttributeError', "module '" + v.name + "' has no attribute '" + n.name + "'", n.line); return a; }
        return { boundMethod: true, obj: v, name: n.name };
      }
      case 'call': {
        const kw = {};
        for (const k of n.kwargs) kw[k.name] = yield* evalExpr(k.value, env, ctx);
        const args = [];
        for (const a of n.args) args.push(yield* evalExpr(a, env, ctx));
        if (n.func.k === 'attr') {
          const obj = yield* evalExpr(n.func.value, env, ctx);
          return yield* callMethod(obj, n.func.name, args, kw, ctx, n.line);
        }
        const f = yield* evalExpr(n.func, env, ctx);
        ctx.line = n.line;
        return yield* callValue(f, args, kw, ctx, n.line);
      }
      default: throw new PyError('SyntaxError', 'unsupported expression', n.line);
    }
  }
  function assign(target, value, env, line) {
    if (target.k === 'name') { env.set(target.name, value); return; }
    if (target.k === 'tuple' || target.k === 'list') {
      const items = toList(value, line);
      if (items.length !== target.items.length) throw new PyError('ValueError', items.length > target.items.length ? `too many values to unpack (expected ${target.items.length})` : `not enough values to unpack (expected ${target.items.length}, got ${items.length})`, line);
      target.items.forEach((t, i) => assign(t, items[i], env, line));
      return;
    }
    if (target.k === 'index') { target._pending = value; return; }
    throw new PyError('SyntaxError', 'cannot assign to expression', line);
  }
  function* assignTarget(target, value, env, ctx, line) {
    if (target.k === 'index') {
      const obj = yield* evalExpr(target.value, env, ctx); const i = yield* evalExpr(target.index, env, ctx);
      if (obj instanceof Dict) { obj.map.set(dictKey(i, line), [i, value]); return; }
      if (Array.isArray(obj)) { let idx = num(i); if (idx < 0) idx += obj.length; if (idx < 0 || idx >= obj.length) throw new PyError('IndexError', 'list assignment index out of range', line); obj[idx] = value; return; }
      if (typeof obj === 'string') throw new PyError('TypeError', "'str' object does not support item assignment", line);
      if (obj instanceof Tuple) throw new PyError('TypeError', "'tuple' object does not support item assignment", line);
      throw new PyError('TypeError', "'" + typeName(obj) + "' object does not support item assignment", line);
    }
    if (target.k === 'tuple' || target.k === 'list') {
      const items = toList(value, line);
      if (items.length !== target.items.length) throw new PyError('ValueError', items.length > target.items.length ? `too many values to unpack (expected ${target.items.length})` : `not enough values to unpack (expected ${target.items.length}, got ${items.length})`, line);
      for (let i = 0; i < target.items.length; i++) yield* assignTarget(target.items[i], items[i], env, ctx, line);
      return;
    }
    assign(target, value, env, line);
  }
  function* execBlock(stmts, env, ctx) { for (const s of stmts) yield* execStmt(s, env, ctx); }
  function* execStmt(s, env, ctx) {
    ctx.line = s.line;
    yield STEP;
    switch (s.k) {
      case 'expr': { const v = yield* evalExpr(s.value, env, ctx); if (v && v.boundMethod) throw new PyError('AttributeError', "'" + typeName(v.obj) + "' object has no attribute '" + v.name + "'", s.line); return; }
      case 'assign': { const v = yield* evalExpr(s.value, env, ctx); for (const t of s.targets) yield* assignTarget(t, v, env, ctx, s.line); return; }
      case 'augassign': { const cur = yield* evalExpr(s.target, env, ctx); const r = yield* evalExpr(s.value, env, ctx); yield* assignTarget(s.target, binop(s.op, cur, r, s.line), env, ctx, s.line); return; }
      case 'if': { if (truthy(yield* evalExpr(s.test, env, ctx))) yield* execBlock(s.body, env, ctx); else yield* execBlock(s.orelse, env, ctx); return; }
      case 'while': {
        while (truthy(yield* evalExpr(s.test, env, ctx))) {
          try { yield* execBlock(s.body, env, ctx); } catch (e) { if (e instanceof BreakSig) break; if (e instanceof ContinueSig) continue; throw e; }
        }
        return;
      }
      case 'for': {
        const it = yield* evalExpr(s.iter, env, ctx);
        for (const x of iterate(it, s.line)) {
          yield* assignTarget(s.target, x, env, ctx, s.line);
          try { yield* execBlock(s.body, env, ctx); } catch (e) { if (e instanceof BreakSig) break; if (e instanceof ContinueSig) continue; throw e; }
        }
        return;
      }
      case 'def': { const defaults = []; for (const d of s.defaults) defaults.push(d === undefined ? undefined : yield* evalExpr(d, env, ctx)); env.set(s.name, new PyFunc(s.name, s.params, defaults, s.body, env)); return; }
      case 'return': { if (env.isGlobal) throw new PyError('SyntaxError', "'return' outside function", s.line); throw new ReturnSig(s.value ? yield* evalExpr(s.value, env, ctx) : null); }
      case 'break': throw new BreakSig();
      case 'continue': throw new ContinueSig();
      case 'pass': return;
      case 'global': s.names.forEach(n => env.globals.add(n)); return;
      case 'del': { if (s.target.k === 'name') { if (!env.vars.has(s.target.name)) throw new PyError('NameError', "name '" + s.target.name + "' is not defined", s.line); env.vars.delete(s.target.name); return; } if (s.target.k === 'index') { const obj = yield* evalExpr(s.target.value, env, ctx); const i = yield* evalExpr(s.target.index, env, ctx); if (obj instanceof Dict) { if (!obj.map.delete(dictKey(i, s.line))) throw new PyError('KeyError', repr(i), s.line); return; } if (Array.isArray(obj)) { let idx = num(i); if (idx < 0) idx += obj.length; if (idx < 0 || idx >= obj.length) throw new PyError('IndexError', 'list assignment index out of range', s.line); obj.splice(idx, 1); return; } } throw new PyError('SyntaxError', 'cannot delete expression', s.line); }
      case 'raise': { const v = yield* evalExpr(s.value, env, ctx); if (v instanceof Builtin) throw new PyError(v.name, '', s.line); if (v && v.pyexc) throw new PyError(v.pyexc, v.msg, s.line); throw new PyError('Exception', str(v), s.line); }
      case 'assert': { if (!truthy(yield* evalExpr(s.test, env, ctx))) throw new PyError('AssertionError', s.msg ? str(yield* evalExpr(s.msg, env, ctx)) : '', s.line); return; }
      case 'import': { for (const n of s.names) { const m = MODULES[n.name]; if (!m) throw new PyError('ModuleNotFoundError', "No module named '" + n.name + "'", s.line); env.set(n.alias, m); } return; }
      case 'from': { const m = MODULES[s.mod]; if (!m) throw new PyError('ModuleNotFoundError', "No module named '" + s.mod + "'", s.line); if (s.star) { m.attrs.forEach((v, k) => env.set(k, v)); return; } for (const n of s.names) { if (!m.attrs.has(n.name)) throw new PyError('ImportError', "cannot import name '" + n.name + "' from '" + s.mod + "'", s.line); env.set(n.alias, m.attrs.get(n.name)); } return; }
      case 'try': {
        try { yield* execBlock(s.body, env, ctx); }
        catch (e) {
          if (!(e instanceof PyError) || e.type === 'KeyboardInterrupt' || e.type === 'SystemExit') throw e;
          const h = s.handlers.find(h => !h.type || h.type === e.type || h.type === 'Exception' || (h.type === 'ArithmeticError' && e.type === 'ZeroDivisionError') || (h.type === 'LookupError' && (e.type === 'IndexError' || e.type === 'KeyError')) || (h.type === 'OSError' && e.type === 'FileNotFoundError'));
          if (!h) throw e;
          if (h.name) env.set(h.name, { pyexc: e.type, msg: e.message, toString: () => e.message });
          yield* execBlock(h.body, env, ctx);
        } finally { if (s.finalBody) yield* execBlock(s.finalBody, env, ctx); }
        return;
      }
      case 'with': {
        const v = yield* evalExpr(s.ctx, env, ctx);
        if (s.name) env.set(s.name, v);
        try { yield* execBlock(s.body, env, ctx); }
        finally { if (v instanceof FileObj) yield* callMethod(v, 'close', [], {}, ctx, s.line); }
        return;
      }
      default: throw new PyError('SyntaxError', 'unsupported statement', s.line);
    }
  }

  /* ---------------- Kjøring ---------------- */
  /* Returnerer en generator. Yields: {type:'step'} | {type:'out',text} | {type:'input',prompt} | {type:'sleep',ms}.
     ctx.fs: {open(path, mode) -> {content} | {error, errorType}, write(path, content) -> {error}?} */
  function* run(src, filename, fsApi) {
    const ctx = { file: filename, line: 0, stack: [], fs: fsApi };
    let stmts;
    try { stmts = parse(src); }
    catch (e) {
      if (e instanceof PyError) { yield { type: 'out', text: syntaxTrace(e, src, filename), err: true }; return { ok: false, error: e.type, line: e.pyline }; }
      throw e;
    }
    const env = new Env(null, true);
    env.vars.set('__name__', '__main__');
    try {
      yield* execBlock(stmts, env, ctx);
      return { ok: true };
    } catch (e) {
      if (e instanceof BreakSig || e instanceof ContinueSig) { const pe = new PyError('SyntaxError', "'" + (e instanceof BreakSig ? 'break' : 'continue') + "' outside loop", ctx.line); yield { type: 'out', text: syntaxTrace(pe, src, filename), err: true }; return { ok: false, error: 'SyntaxError', line: ctx.line }; }
      if (e instanceof ReturnSig) return { ok: true };
      if (e instanceof PyError) {
        if (e.type === 'SystemExit') return { ok: true, exit: true };
        yield { type: 'out', text: traceback(e, ctx, filename), err: true };
        return { ok: false, error: e.type, line: e.pyline || ctx.line };
      }
      const pe = new PyError('RuntimeError', 'internal error in the practice interpreter: ' + (e && e.message), ctx.line);
      yield { type: 'out', text: traceback(pe, ctx, filename), err: true };
      return { ok: false, error: 'RuntimeError', line: ctx.line };
    }
  }
  function syntaxTrace(e, src, filename) {
    const line = e.pyline || 1;
    const text = (src.split('\n')[line - 1] || '').trim();
    return `  File "${filename}", line ${line}\n    ${text}\n${e.type}: ${e.message}\n`;
  }
  function traceback(e, ctx, filename) {
    let s = 'Traceback (most recent call last):\n';
    const stack = e.stackSnap || ctx.stack;
    const frames = [{ name: '<module>', line: stack.length ? stack[0].line : (e.pyline || ctx.line) }];
    stack.forEach((f, i) => frames.push({ name: f.name, line: i + 1 < stack.length ? stack[i + 1].line : (e.pyline || ctx.line) }));
    frames.forEach(f => { s += `  File "${filename}", line ${f.line}, in ${f.name}\n`; });
    s += e.type + (e.message ? ': ' + e.message : '') + '\n';
    return s;
  }
  function interrupt() { return new PyError('KeyboardInterrupt', '', 0); }

  return { run, parse, tokenize, PyError, interrupt, str, repr };
})();
