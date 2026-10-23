/* Lógica matemática pura do Arcana Lab (sem DOM). Funciona no navegador e no Node. */
(function (root) {
  'use strict';
  const rnd = (n) => Math.floor(Math.random() * n);
  const pick = (arr) => arr[rnd(arr.length)];
  const range = (a, b) => { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; };
  const f = (a, b, c, x) => a * x * x + b * x + c;
  const isInt = (v) => Math.abs(v - Math.round(v)) < 1e-9;

  const TEXT = root.ARCANA_TEXT;
  const DIFF = {
    easy: { name: (TEXT && TEXT.settings.difficulty.easy) || 'FÁCIL', base: 100, a: [-2, -1, 1, 2], b: range(-4, 4), c: range(-5, 5), xs: range(-4, 4), forceZero: true },
    medium: { name: (TEXT && TEXT.settings.difficulty.medium) || 'MÉDIO', base: 150, a: [-3, -2, -1, 1, 2, 3], b: range(-6, 6), c: range(-8, 8), xs: range(-5, 5), forceZero: false },
    hard: { name: (TEXT && TEXT.settings.difficulty.hard) || 'DIFÍCIL', base: 200, a: [-3, -2, -1.5, -1, -0.5, 0.5, 1, 1.5, 2, 3], b: range(-8, 8), c: range(-9, 9), xs: range(-7, 7).filter((x) => x !== 0), forceZero: false }
  };

  /* Gera um desafio: 3 pontos com x distintos => (a,b,c) únicos. */
  function generate(diff) {
    const d = DIFF[diff] || DIFF.easy;
    for (let t = 0; t < 500; t++) {
      const a = pick(d.a), b = pick(d.b), c = pick(d.c);
      const cand = d.xs.filter((x) => isInt(f(a, b, c, x)) && Math.abs(f(a, b, c, x)) <= 11);
      let xs;
      if (d.forceZero) {
        if (Math.abs(c) > 11) continue;
        const rest = cand.filter((x) => x !== 0);
        if (rest.length < 2) continue;
        const p = pick(rest); const q = pick(rest.filter((x) => x !== p));
        xs = [0, p, q];
      } else {
        if (cand.length < 3) continue;
        xs = [];
        while (xs.length < 3) { const x = pick(cand); if (!xs.includes(x)) xs.push(x); }
      }
      xs.sort((m, n) => m - n);
      return { a, b, c, diff, pts: xs.map((x) => ({ x, y: Math.round(f(a, b, c, x)) })) };
    }
    return generate('easy');
  }


  /* ---------- fases: dificuldade cresce com o nível (1..MAXL) ---------- */
  const PHASES = 30;
  const tierOf = (L) => (L <= 10 ? 'easy' : L <= 20 ? 'medium' : 'hard');
  function generateLevel(phase, offset) {
    const L = Math.min(PHASES, phase + (offset || 0));
    const amax = L <= 5 ? 2 : 3, frac = L >= 21;
    const aPool = [];
    for (let v = 1; v <= amax; v++) { aPool.push(v, -v); }
    if (frac) aPool.push(0.5, -0.5, 1.5, -1.5);
    const bm = Math.min(9, 2 + Math.floor(L / 4)), cm = Math.min(10, 3 + Math.floor(L / 3)), xm = Math.min(7, 4 + Math.floor(L / 6));
    const bPool = range(-bm, bm), cPool = range(-cm, cm), xPool = range(-xm, xm).filter((x) => !(frac && x === 0));
    const forceZero = L <= 8;
    for (let t = 0; t < 800; t++) {
      const a = pick(aPool), b = pick(bPool), c = pick(cPool);
      const cand = xPool.filter((x) => isInt(f(a, b, c, x)) && Math.abs(f(a, b, c, x)) <= 11);
      let xs;
      if (forceZero) {
        const rest = cand.filter((x) => x !== 0); if (Math.abs(c) > 11 || rest.length < 2) continue;
        const p = pick(rest), q = pick(rest.filter((x) => x !== p)); xs = [0, p, q];
      } else {
        if (cand.length < 3) continue; xs = []; while (xs.length < 3) { const x = pick(cand); if (!xs.includes(x)) xs.push(x); }
      }
      xs.sort((m, n) => m - n);
      return { a, b, c, diff: tierOf(L), level: L, phase, pts: xs.map((x) => ({ x, y: Math.round(f(a, b, c, x)) })) };
    }
    return generateLevel(Math.max(1, phase - 3), 0);
  }

  /* Resolve (a,b,c) a partir de 3 pontos (diferenças divididas). */
  function solve(pts) {
    const [p1, p2, p3] = pts;
    const m12 = (p2.y - p1.y) / (p2.x - p1.x), m23 = (p3.y - p2.y) / (p3.x - p2.x);
    const a = (m23 - m12) / (p3.x - p1.x);
    const b = m12 - a * (p1.x + p2.x);
    const c = p1.y - a * p1.x * p1.x - b * p1.x;
    return { a, b, c, m12, m23 };
  }

  const fmt = (v) => { const r = Math.round(v * 1000) / 1000; return String(Object.is(r, -0) ? 0 : r); };
  const sg = (v) => (v < 0 ? '− ' + fmt(-v) : '+ ' + fmt(v));

  const eqs = (p) => `${fmt(p.x * p.x)}a ${p.x < 0 ? '−' : '+'} ${fmt(Math.abs(p.x))}b + c = ${p.y}`;

  /* Passo a passo da solução; os textos ficam em js/texts.js. */
  function steps(pts) {
    const [p1, p2, p3] = pts, s = solve(pts), out = [];
    const W = root.ARCANA_TEXT && root.ARCANA_TEXT.explain && root.ARCANA_TEXT.explain.steps;
    const fill = (template, vars) => Object.keys(vars).reduce((v, k) => v.replaceAll('{' + k + '}', String(vars[k])), template);
    const text = (key, fallback, vars) => fill((W && W[key]) || fallback, vars);
    pts.forEach((p, i) => out.push(text('point', 'Ponto {i}: f({x}) = {y} → a·({x})² + b·({x}) + c = {y} → {eq}', { i: i + 1, x: p.x, y: p.y, eq: eqs(p) })));
    out.push(text('subtract12', 'Subtraindo as equações 1 e 2 (c some) e dividindo por ({x2} − {x1}): a·({sum}) + b = {m}', { x1: p1.x, x2: p2.x, sum: p2.x + p1.x, m: fmt(s.m12) }));
    out.push(text('subtract23', 'Subtraindo as equações 2 e 3 e dividindo por ({x3} − {x2}): a·({sum}) + b = {m}', { x2: p2.x, x3: p3.x, sum: p3.x + p2.x, m: fmt(s.m23) }));
    out.push(text('eliminate', 'Subtraindo as duas novas equações (b some): a·({difference}) = {m23} − {m12} → a = {a}', { difference: p3.x - p1.x, m23: fmt(s.m23), m12: fmt(s.m12), a: fmt(s.a) }));
    out.push(text('substituteB', 'Voltando: b = {m12} − ({a})·({sum}) = {b}', { m12: fmt(s.m12), a: fmt(s.a), sum: p1.x + p2.x, b: fmt(s.b) }));
    out.push(text('substituteC', 'Por fim, c = y₁ − a·x₁² − b·x₁ = {y} − ({a})·{xsq} − ({b})·({x}) = {c}', { y: p1.y, a: fmt(s.a), xsq: fmt(p1.x * p1.x), b: fmt(s.b), x: p1.x, c: fmt(s.c) }));
    out.push(text('answer', 'Resposta: f(x) = {a}x² {b}x {c}', { a: fmt(s.a), b: sg(s.b), c: sg(s.c) }));
    return out;
  }

  /* Dicas graduais — não entregam a resposta. */
  function hint(ch, level) {
    const { pts } = ch;
    const H = root.ARCANA_TEXT && root.ARCANA_TEXT.game.hints;
    if (!H) {
      if (level === 1) return `Observe a abertura da parábola: ela abre para ${ch.a > 0 ? 'CIMA, então a > 0' : 'BAIXO, então a < 0'}. Se houver um ponto com x = 0, c = f(0) é seu y.`;
      if (level === 2) return 'Substitua cada ponto em f(x) = ax² + bx + c. Você obtém: ' + pts.map(eqs).join('   |   ');
      if (level === 3) { const s = solve(pts); return `Subtraia as equações duas a duas para eliminar c. Restam: a·(${pts[1].x + pts[0].x}) + b = ${fmt(s.m12)} e a·(${pts[2].x + pts[1].x}) + b = ${fmt(s.m23)}. Agora elimine b.`; }
      return 'Sem mais dicas — use RESOLVER para ver o passo a passo (vale 0 pontos).';
    }
    if (level === 1) return H.first.replace('{direction}', ch.a > 0 ? 'CIMA' : 'BAIXO').replace('{sign}', ch.a > 0 ? 'a > 0' : 'a < 0') + H.zeroPoint;
    if (level === 2) return H.second + pts.map(eqs).join('   |   ');
    if (level === 3) { const s = solve(pts); return H.third + `a·(${pts[1].x + pts[0].x}) + b = ${fmt(s.m12)}  e  a·(${pts[2].x + pts[1].x}) + b = ${fmt(s.m23)}` + H.thirdJoin; }
    return H.noMore;
  }

  /* Interpreta "2", "-1,5", "1/2", "-3/4". NaN se inválido. */
  function parseNum(str) {
    const s = String(str).trim().replace(',', '.').replace(/\s+/g, '');
    if (!s) return NaN;
    const m = s.match(/^([+-]?\d*\.?\d+)\/([+-]?\d*\.?\d+)$/);
    if (m) { const d = parseFloat(m[2]); return d === 0 ? NaN : parseFloat(m[1]) / d; }
    return /^[+-]?(\d+\.?\d*|\.\d+)$/.test(s) ? parseFloat(s) : NaN;
  }

  function check(ch, ia, ib, ic) {
    const eq = (u, v) => Math.abs(u - v) < 1e-6;
    const ok = { a: eq(ia, ch.a), b: eq(ib, ch.b), c: eq(ic, ch.c) };
    return { ok, all: ok.a && ok.b && ok.c };
  }

  function score(diff, hints, wrongs, secs, timerOn, streakAfter) {
    const base = DIFF[diff].base;
    let v = Math.max(base * 0.2, base - hints * 20 - wrongs * 15);
    if (timerOn && hints === 0 && wrongs === 0) v += Math.max(0, 40 - secs);
    return Math.round(v * (1 + 0.1 * Math.min(Math.max(streakAfter - 1, 0), 5)));
  }

  const api = { DIFF, PHASES, tierOf, generateLevel, generate, solve, steps, hint, parseNum, check, score, fmt, f };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.AM = api;
})(typeof window !== 'undefined' ? window : globalThis);
