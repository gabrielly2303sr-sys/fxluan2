/* Minigame por fases: descobrir a, b, c de f(x) = ax² + bx + c. Matemática em math.js. */
(function () {
  'use strict';
  const { $, el, Prefs, Sound } = AL;
  const T = window.ARCANA_TEXT;
  const fmt = AM.fmt, N = AM.PHASES;
  const ease = (t) => 1 - Math.pow(1 - t, 3);

  /* ---------- gráfico (Canvas 2D; só desenha quando algo muda) ---------- */
  const Graph = {
    draw(cv, o) {
      const css = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--s')) || 1;
      const W = parseInt(cv.style.width) || cv.width, H = parseInt(cv.style.height) || cv.height, r = Math.min(2, Math.max(1, (devicePixelRatio || 1) * css));
      if (cv.width !== Math.round(W * r)) { cv.width = Math.round(W * r); cv.height = Math.round(H * r); }
      const g = cv.getContext('2d'); g.setTransform(r, 0, 0, r, 0, 0); g.clearRect(0, 0, W, H);
      const [x0, x1] = o.xr || [-8, 8], [y0, y1] = o.yr || [-12, 12], rv = o.reveal == null ? 1 : o.reveal;
      const X = (x) => (x - x0) / (x1 - x0) * W, Y = (y) => H - (y - y0) / (y1 - y0) * H;
      if (o.grid) { g.lineWidth = 1; g.strokeStyle = '#ffffff1c'; g.beginPath(); for (let x = Math.ceil(x0); x <= x1; x++) { g.moveTo(X(x), 0); g.lineTo(X(x), H); } for (let y = Math.ceil(y0); y <= y1; y++) { g.moveTo(0, Y(y)); g.lineTo(W, Y(y)); } g.stroke(); }
      g.strokeStyle = '#ffffffcc'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(0), 0); g.lineTo(X(0), H); g.moveTo(0, Y(0)); g.lineTo(W, Y(0)); g.stroke();
      g.fillStyle = '#ffffff99'; g.font = '16px Bebas'; g.textAlign = 'center';
      for (let x = Math.ceil(x0); x <= x1; x++) if (x && x % 2 === 0) g.fillText(x, X(x), Y(0) + 16);
      g.textAlign = 'right'; for (let y = Math.ceil(y0); y <= y1; y++) if (y && y % 4 === 0) g.fillText(y, X(0) - 6, Y(y) + 5);
      if (o.a !== undefined) {
        const xe = x0 + (x1 - x0) * rv, N2 = 200; let pen = false;
        g.lineCap = 'round'; g.lineJoin = 'round';
        [['#ffffff', 9, 0.18], ['#4a8fff', 5, 1]].forEach(([col, lw, al]) => {
          g.strokeStyle = col; g.globalAlpha = al; g.lineWidth = lw; g.beginPath(); pen = false;
          for (let i = 0; i <= N2; i++) { const x = x0 + (x1 - x0) * i / N2; if (x > xe) break; const y = o.a * x * x + o.b * x + o.c; if (y < y0 - 40 || y > y1 + 40) { pen = false; continue; } pen ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y)); pen = true; }
          g.stroke();
        }); g.globalAlpha = 1;
      }
      (o.pts || []).forEach((p) => {
        const k = rv >= 1 ? (o.pop == null ? 1 : o.pop) : 0; if (k <= 0) return;
        const rad = 9 * (k < 1 ? 1 + Math.sin(k * Math.PI) * 0.8 : 1) * Math.min(1, k * 1.6);
        g.fillStyle = '#c4001a'; g.strokeStyle = '#fff'; g.lineWidth = 3; g.beginPath(); g.arc(X(p.x), Y(p.y), rad, 0, 7); g.fill(); g.stroke();
        g.globalAlpha = Math.min(1, k * 1.5); g.fillStyle = '#fff'; g.font = '24px Bebas'; g.textAlign = 'left'; g.fillText(`(${p.x}, ${p.y})`, X(p.x) + 14, Y(p.y) - 12); g.globalAlpha = 1;
      });
    }
  };
  AL.Graph = Graph;

  /* ---------- partículas (loop só enquanto houver partículas) ---------- */
  let fx = null, parts = [], fxOn = false;
  function burst(x, y, n, cols) {
    if (!Prefs.get('anim') || !fx) return;
    for (let i = 0; i < n; i++) { const a = Math.random() * 6.283, v = 4 + Math.random() * 14; parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 4, w: 8 + Math.random() * 22, h: 3 + Math.random() * 5, r: Math.random() * 6, vr: (Math.random() - .5) * .4, life: 1, d: 0.014 + Math.random() * .016, c: cols[i % cols.length] }); }
    if (!fxOn) { fxOn = true; requestAnimationFrame(fxLoop); }
  }
  function fxLoop() {
    const g = fx.getContext('2d'); g.clearRect(0, 0, 1920, 1080);
    parts = parts.filter((p) => p.life > 0);
    parts.forEach((p) => { p.x += p.vx; p.y += p.vy; p.vy += .5; p.vx *= .97; p.r += p.vr; p.life -= p.d; g.save(); g.globalAlpha = Math.max(0, p.life); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore(); });
    if (parts.length) requestAnimationFrame(fxLoop); else { fxOn = false; g.clearRect(0, 0, 1920, 1080); }
  }
  function tween(from, to, ms, cb) { if (!Prefs.get('anim')) { cb(to); return; } const t0 = performance.now(); (function f(now) { const k = Math.min(1, (now - t0) / ms); cb(Math.round(from + (to - from) * ease(k))); if (k < 1) requestAnimationFrame(f); })(t0); }

  /* ---------- estado ---------- */
  const G = { phase: 1, score: 0, streak: 0, ch: null, hints: 0, wrongs: 0, solved: false, elapsed: 0, running: false, last: 0, gained: 0, over: false, shown: 0 };
  let timerId = null, built = false, revealId = 0;
  const gs = () => $('#gameStage');
  const offs = () => ({ easy: 0, medium: 6, hard: 12 }[Prefs.get('difficulty')] || 0);

  function build() {
    gs().innerHTML = `
      <div class="band"></div>
      <div class="slant pin" style="left:40px;top:40px;width:560px;height:96px"><div style="padding:6px 34px"><div style="font:64px/1 Bebas;letter-spacing:3px">${T.appName}</div><div style="font:20px Bebas;letter-spacing:4px;color:var(--cy)" id="gTier"></div></div></div>
      <div style="position:absolute;left:70px;top:150px"><div id="gProgT" style="font:italic 800 34px Mont;margin-bottom:6px"></div><div class="prog" id="gProg"></div></div>
      <div class="slant hud pin" style="left:1060px;top:40px;width:260px;height:100px"><div style="padding:8px 30px"><div class="k">${T.game.score}</div><div class="v" id="gScore">0</div></div></div>
      <div class="slant hud pin" style="left:1360px;top:40px;width:240px;height:100px"><div style="padding:8px 30px"><div class="k">${T.game.streak}</div><div class="v" id="gStreak">0</div></div></div>
      <div class="slant hud pin" style="left:1640px;top:40px;width:240px;height:100px"><div style="padding:8px 30px"><div class="k">${T.game.time}</div><div class="v" id="gTime">0:00</div></div></div>
      <div class="gpanel pin" id="gGraph" style="left:60px;top:200px;width:1000px;height:730px;padding:18px 20px"><h3 style="font:italic 800 28px Mont">${T.game.graph}</h3><canvas id="gCv" style="width:960px;height:640px"></canvas></div>
      <div class="gpanel" style="left:60px;top:945px;width:1000px;height:115px;padding:12px 24px"><div class="hintbox" id="gHint"></div></div>
      <div class="gpanel pin" style="left:1100px;top:200px;width:780px;height:215px;padding:16px 28px"><h3>${T.game.knownPoints}</h3><div id="gPts" style="font:46px/1.25 Bebas;letter-spacing:2px"></div></div>
      <div class="gpanel pin" style="left:1100px;top:435px;width:780px;height:385px;padding:10px 28px;background:linear-gradient(#0f1c69f5,#081044f7);border-top:8px solid var(--red)"><h3 style="margin-top:6px">${T.game.answer}</h3>
        <div class="coef"><label>${T.game.coefficients[0]}</label><input id="ia" inputmode="decimal" autocomplete="off" placeholder="${T.common.question}"></div>
        <div class="coef"><label>${T.game.coefficients[1]}</label><input id="ib" inputmode="decimal" autocomplete="off" placeholder="${T.common.question}"></div>
        <div class="coef"><label>${T.game.coefficients[2]}</label><input id="ic" inputmode="decimal" autocomplete="off" placeholder="${T.common.question}"><div id="gMsg" style="font:300 18px/1.3 Mont;flex:1;color:#ffd;padding-left:14px"></div></div></div>
      <div style="position:absolute;left:1100px;top:845px;display:flex;gap:22px">
        <button class="pbtn" id="bCheck"><span>${T.game.verify}</span></button><button class="pbtn blue" id="bHint"><span>${T.game.hint}</span></button><button class="pbtn" id="bSolve"><span>${T.game.solve}</span></button><button class="pbtn blue" id="bNext"><span>${T.game.swap}</span></button></div>
      <div style="position:absolute;left:1100px;top:965px;display:flex;gap:22px;align-items:center"><button class="pbtn" id="bPause"><span>${T.game.pause}</span></button><span style="font:16px Bebas;color:#ffffff66;letter-spacing:2px">${T.game.pauseHint}</span></div>
      <div class="banner" id="gBan"></div><div class="flash" id="gFlash"></div><canvas id="fx" width="1920" height="1080"></canvas><div class="over hidden" id="gOver"></div>`;
    fx = $('#fx');
    $('#bCheck').onclick = check; $('#bHint').onclick = hint; $('#bSolve').onclick = solveShow; $('#bNext').onclick = swap; $('#bPause').onclick = () => Game.pause();
    gs().addEventListener('mouseover', (e) => { const b = e.target.closest('.pbtn'); if (b && b !== gs._last) { gs._last = b; Sound.hover(); } else if (!b) gs._last = null; });
    ['ia', 'ib', 'ic'].forEach((id) => { const i = $('#' + id); i.addEventListener('input', () => Sound.tick()); i.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.stopPropagation(); check(); } if (e.key === 'Escape') { e.stopPropagation(); e.target.blur(); Game.pause(); } }); });
    built = true;
  }
  const ins = () => ['ia', 'ib', 'ic'].map((i) => $('#' + i));
  const base = () => ({ a: G.ch.a, b: G.ch.b, c: G.ch.c, pts: G.ch.pts, grid: Prefs.get('grid') });
  function redraw() { if (G.ch && !revealId) Graph.draw($('#gCv'), base()); }
  function animateReveal() {
    cancelAnimationFrame(revealId); revealId = 0; if (!Prefs.get('anim')) { Graph.draw($('#gCv'), base()); return; }
    const t0 = performance.now(), D = 750, P = 350;
    (function f(now) { const k = Math.min(1, (now - t0) / D), pk = Math.max(0, (now - t0 - D) / P);
      Graph.draw($('#gCv'), Object.assign(base(), { reveal: ease(k), pop: Math.min(1, pk) }));
      if (pk < 1) revealId = requestAnimationFrame(f); else revealId = 0; })(t0);
  }
  function hud() {
    $('#gStreak').textContent = G.streak;
    $('#gTime').textContent = Prefs.get('timer') ? Math.floor(G.elapsed / 60) + ':' + String(Math.floor(G.elapsed % 60)).padStart(2, '0') : T.common.off;
    $('#gProgT').textContent = `${T.game.phase} ${G.phase} / ${N}`;
    $('#gProg').innerHTML = Array.from({ length: N }, (_, i) => `<i style="width:24px" class="${AL.Progress.done(i + 1) ? 'd' : i + 1 === G.phase ? 'c' : ''}"></i>`).join('');
    $('#gTier').textContent = T.settings.difficulty[AM.tierOf(Math.min(N, G.phase + offs()))] + ' · ' + T.game.tierSuffix;
  }
  const setScore = (to) => { const from = G.shown; G.shown = to; tween(from, to, 700, (v) => { $('#gScore').textContent = v; }); };
  function banner(txt, good) { const b = $('#gBan'); b.className = 'banner ' + (good ? 'good' : 'badb'); b.textContent = txt; void b.offsetWidth; b.classList.add('show'); }
  const msg = (t) => { $('#gMsg').textContent = t || ''; };
  const shake = () => { if (!Prefs.get('anim')) return; const s = gs(); s.classList.remove('shake'); void s.offsetWidth; s.classList.add('shake'); };
  const flash = (col) => { const f = $('#gFlash'); f.style.background = `radial-gradient(circle,transparent 40%,${col} 130%)`; f.classList.remove('go'); void f.offsetWidth; f.classList.add('go'); };

  function newChallenge() {
    G.ch = AM.generateLevel(G.phase, offs()); resetAttempt();
    $('#gPts').innerHTML = G.ch.pts.map((p, i) => `<div><span style="color:var(--cy)">${T.game.point}${i + 1}</span> &nbsp; ${T.game.xLabel} = ${p.x} &nbsp; ${T.game.yLabel} = ${p.y}</div>`).join('');
    hud(); animateReveal();
  }
  function resetAttempt() {
    G.hints = 0; G.wrongs = 0; G.solved = false; G.elapsed = 0; G.last = performance.now(); G.over = false;
    ins().forEach((i) => { i.value = ''; i.className = ''; i.disabled = false; }); msg('');
    $('#gHint').textContent = T.game.defaultHint;
    $('#bCheck').disabled = false; $('#bNext').disabled = false; hud();
  }
  function check() {
    if (G.solved || G.over || !AL.visible('game') || AL.visible('menu') || AL.busy) return;
    const v = ins().map((i) => AM.parseNum(i.value));
    if (v.some(isNaN)) { msg(T.game.invalid); Sound.bad(); shake(); return; }
    const r = AM.check(G.ch, v[0], v[1], v[2]);
    ins().forEach((i, k) => { i.className = r.ok['abc'[k]] ? 'ok' : 'bad'; });
    if (r.all) {
      G.solved = true; G.streak++; G.gained = AM.score(G.ch.diff, G.hints, G.wrongs, G.elapsed, Prefs.get('timer'), G.streak);
      G.score += G.gained; setScore(G.score); AL.Progress.clear(G.phase, G.gained);
      banner(T.game.correct, true); Sound.good(); flash('#4a8fff'); burst(500, 520, 70, ['#fff', '#4a8fff', '#c4001a', '#7dd4fc']);
      $('#bCheck').disabled = true; $('#bNext').disabled = true; ins().forEach((i) => (i.disabled = true));
      msg(`+${G.gained} pontos · f(x) = ${fmt(G.ch.a)}x² + ${fmt(G.ch.b)}x + ${fmt(G.ch.c)}`); hud();
      setTimeout(() => { if (G.solved && !AL.visible('menu')) phaseClear(); }, Prefs.get('anim') ? 1300 : 300);
    } else { G.wrongs++; G.streak = 0; banner(T.game.incorrect, false); Sound.bad(); shake(); flash('#c4001a'); msg(T.game.wrong); hud(); }
  }
  function hint() {
    if (G.solved || G.over) return; G.hints = Math.min(G.hints + 1, 4); Sound.hint();
    $('#gHint').textContent = T.game.hints.hintPrefix.replace('{level}', Math.min(G.hints, 3)) + AM.hint(G.ch, G.hints);
  }
  function solveShow() {
    if (G.over || G.solved && !G.revealed) return; const o = $('#gOver'), st = AM.steps(G.ch.pts);
    if (!G.solved) { G.solved = true; G.revealed = true; G.streak = 0; $('#bCheck').disabled = true; const s = AM.solve(G.ch.pts); ins().forEach((i, k) => { i.value = fmt([s.a, s.b, s.c][k]); i.disabled = true; i.className = ''; }); msg(T.game.revealed); hud(); }
    Sound.open(); o.classList.remove('hidden'); G.over = true;
    o.innerHTML = `<div class="gpanel pin" style="position:relative;width:1300px;padding:30px 40px;background:#06133bf2;border-top:8px solid var(--red)"><h3 style="font-size:48px">${T.game.solutionTitle}</h3><div style="font:300 22px/1.7 Mont;margin:14px 0 24px">${st.map((t) => '• ' + t).join('<br>')}</div><div style="display:flex;gap:22px"><button class="pbtn blue" id="bRetry"><span>${T.game.retry}</span></button><button class="pbtn" id="bCloseSol"><span>${T.game.close}</span></button></div></div>`;
    $('#bCloseSol').onclick = () => { Sound.back(); o.classList.add('hidden'); G.over = false; };
    $('#bRetry').onclick = () => { Sound.click(); o.classList.add('hidden'); G.revealed = false; swap(true); };
  }
  function swap(free) { if (G.over || G.solved && !G.revealed && free !== true) return; Sound.click(); if (free !== true) G.streak = 0; G.revealed = false; newChallenge(); }
  function phaseClear() {
    G.over = true; const o = $('#gOver'); o.classList.remove('hidden'); burst(960, 540, 90, ['#fff', '#4a8fff', '#ffe700']);
    const last = G.phase >= N;
    Sound.unlock();
    o.innerHTML = `<div class="gpanel pin" style="position:relative;width:960px;padding:36px 50px;background:#06133bf2;border-top:8px solid var(--red);text-align:center"><div style="font:24px Bebas;letter-spacing:6px;color:var(--cy)">${T.game.phase} ${G.phase} / ${N}</div><h3 style="font:italic 800 78px Mont;margin:6px 0 14px">${last ? T.game.allDone : T.game.complete}</h3><div style="font:56px/1.3 Bebas;letter-spacing:2px">+${G.gained} ${T.game.gained} &nbsp; · &nbsp; ${T.game.total} ${G.score}<br>${T.game.streakLabel} ${G.streak} &nbsp; · &nbsp; ${AL.Progress.count()} / ${N} ${T.game.phasesLabel}</div><div style="display:flex;gap:24px;justify-content:center;margin-top:30px">${last ? '' : `<button class="pbtn blue" id="bNextPh"><span>${T.game.nextPhase}</span></button>`}<button class="pbtn" id="bPhases"><span>${T.game.phases}</span></button></div></div>`;
    if (!last) $('#bNextPh').onclick = () => { Sound.click(); AL.busy = true; AL.transition(() => { $('#gOver').classList.add('hidden'); Game.start(G.phase + 1, true); }).then(() => { AL.busy = false; }); };
    $('#bPhases').onclick = () => { Sound.click(); Game.toCalendar(); };
  }
  function tick() {
    const now = performance.now(), dt = (now - G.last) / 1000; G.last = now;
    if (G.running && !G.solved && !G.over && Prefs.get('timer') && !document.hidden) { G.elapsed += dt; hud(); }
  }
  function gkey(e) {
    if (AL.busy || AL.visible('menu')) return false;
    if (e.key === 'Escape') { if (G.over && $('#bCloseSol')) { $('#bCloseSol').click(); return true; } if (!G.over) { Game.pause(); return true; } }
    if (e.key === 'Enter' && G.over && $('#bNextPh')) { $('#bNextPh').click(); return true; }
    return false;
  }

  const Game = {
    start(phase, keepScore) {
      if (!built) build(); AL.show('game', true); G.phase = phase; Sound.intoGame(); Sound.phase(); if (!keepScore) { G.score = 0; G.streak = 0; G.shown = 0; $('#gScore').textContent = 0; }
      $('#gOver').classList.add('hidden'); G.revealed = false; newChallenge(); G.running = true; G.last = performance.now(); AL.keys.current = gkey;
      Sound.duck = true; Sound.syncMusic(); clearInterval(timerId); timerId = setInterval(tick, 250);
      // reanima a entrada dos painéis
      gs().querySelectorAll('.pin').forEach((e) => { e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; });
      setTimeout(() => { const a = $('#ia'); a && a.focus(); }, 80);
    },
    pause() {
      if (!G.running || AL.busy) return;
      G.running = false; document.activeElement && document.activeElement.blur();
      Game.openPauseMenu();
    },
    openPauseMenu() {
      Sound.open();
      AL.Menu.open({ dismissible: true, items: [
        { label: T.menu.pause.continue, action: () => AL.Menu.close() },
        { label: T.menu.pause.explain, action: () => AL.Explain.open() },
        { label: T.menu.pause.restart, action: () => { AL.Menu.hide(); G.streak = 0; newChallenge(); Game.resume(); } },
        { label: T.menu.pause.phases, action: () => Game.toCalendar() },
        { label: T.menu.pause.menu, action: () => Game.toMenu() }], onClose: () => Game.resume() });
    },
    resume() { G.running = true; G.last = performance.now(); AL.keys.current = gkey; clearInterval(timerId); timerId = setInterval(tick, 250); Sound.duck = true; Sound.syncMusic(); redraw(); hud(); },
    toCalendar() { clearInterval(timerId); G.running = false; Sound.duck = false; Sound.syncMusic(); AL.Calendar.open('game'); },
    toMenu() { AL.busy = true; clearInterval(timerId); G.running = false; Sound.duck = false; Sound.syncMusic(); AL.transition(() => { AL.show('game', false); AL.mainMenu(); }).then(() => { AL.busy = false; }); }
  };
  AL.Game = Game;
  AL.on('resize', redraw); AL.on('prefs', () => { if (built && G.ch) { redraw(); hud(); } });
})();
