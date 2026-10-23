/* Telas: Configurações (Options.qml/OptionsList.qml) e Explicação (Resume.qml). */
(function () {
  'use strict';
  const { $, el, Prefs, Sound, transition } = AL;
  const T = window.ARCANA_TEXT;

  /* ---------- CONFIGURAÇÕES ---------- */
  const DIFFN = T.settings.difficulty, ORDER = ['easy', 'medium', 'hard'];
  const BARS = [
    { role: T.settings.categories.playRole, label: T.settings.categories.play, char: 'assets/img/char1.webp', rows: [
      { k: '__play', name: T.settings.play.startName, desc: T.settings.play.startDesc, action: true },
      { k: 'difficulty', name: T.settings.play.difficultyName, desc: T.settings.play.difficultyDesc, val: (v) => '◆ ' + DIFFN[v], next: (v) => ORDER[(ORDER.indexOf(v) + 1) % 3] },
      { k: 'timer', name: T.settings.play.timerName, desc: T.settings.play.timerDesc, bool: true }] },
    { role: T.settings.categories.visualRole, label: T.settings.categories.visual, char: 'assets/img/char2.webp', rows: [
      { k: 'anim', name: T.settings.visual.animationsName, desc: T.settings.visual.animationsDesc, bool: true },
      { k: 'grid', name: T.settings.visual.gridName, desc: T.settings.visual.gridDesc, bool: true },
      { k: 'contrast', name: T.settings.visual.contrastName, desc: T.settings.visual.contrastDesc, bool: true }] },
    { role: T.settings.categories.audioRole, label: T.settings.categories.audio, char: 'assets/img/char3.webp', rows: [
      { k: 'music', name: T.settings.audio.musicName, desc: T.settings.audio.musicDesc, bool: true },
      { k: 'sound', name: T.settings.audio.effectsName, desc: T.settings.audio.effectsDesc, bool: true }] }
  ];
  const S = { act: 0, rev: false, row: 0, back: null, opening: false };
  const bars = $('#optBars'), panel = $('#optPanel'), vOpt = $('#vOpt');
  const hints = T.settings.hints;
  $('#optHints').innerHTML = hints.map((h) => `<div><span>${h[1]}</span><kbd>${h[0]}</kbd></div>`).join('');

  function renderBars() {
    bars.innerHTML = '';
    BARS.forEach((b, i) => {
      const e = el('div', 'obar' + (i === S.act ? ' act' : ''), `<div class="red"></div><div class="main"><div class="wh"></div><div class="shade"></div><img alt="" src="${b.char}"><div class="role">${b.role}</div><div class="lbl">${b.label}</div></div>`);
      e.addEventListener('mouseenter', () => { if (S.act !== i) { S.act = i; S.row = 0; Sound.hover(); syncBars(); if (S.rev) renderPanel(); } });
      e.addEventListener('click', () => { S.act = i; reveal(); });
      bars.appendChild(e);
    });
    requestAnimationFrame(() => requestAnimationFrame(() => bars.querySelectorAll('.obar').forEach((b, i) => setTimeout(() => b.classList.add('mount'), Prefs.get('anim') ? i * 70 : 0))));
  }
  const syncBars = () => bars.querySelectorAll('.obar').forEach((b, i) => b.classList.toggle('act', i === S.act));
  function reveal() { S.rev = true; S.row = 0; S.opening = true; Sound.click(); renderPanel(); }
  function renderPanel() {
    panel.classList.toggle('show', S.rev);
    if (!S.rev) { panel.classList.remove('opening'); panel.innerHTML = ''; return; }
    const B = BARS[S.act], r = B.rows[S.row];
    panel.classList.toggle('opening', S.opening);
    panel.innerHTML = `<div class="tint"></div><img class="portrait" alt="" src="${B.char}"><div class="card"><div class="tabs">${BARS.map((b, i) => `<button class="tabbtn${i === S.act ? ' act' : ''}" data-t="${i}" aria-pressed="${i === S.act}">${b.label}</button>`).join('')}</div><div class="upper"><b style="font-weight:600">${r.name}</b><br>${r.desc}</div>${B.rows.map((x, i) => { const v = x.k === '__play' ? true : Prefs.get(x.k), on = x.bool ? v : true; return `<div class="urow${x.action ? ' big' : ''}${i === S.row ? ' sel' : ''}${on ? ' on' : ''}" data-r="${i}" tabindex="0" role="button"><span>${x.action ? T.settings.playButtonPrefix : ''}${x.name}</span><span>${x.action ? '' : x.bool ? (v ? T.common.enabled : T.common.disabled) : x.val(v)}</span></div>`; }).join('')}</div>`;
    if (S.opening) {
      const card = panel.querySelector('.card');
      card.addEventListener('animationend', () => panel.classList.remove('opening'), { once: true });
      S.opening = false;
    }
    panel.querySelectorAll('.tabbtn').forEach((b) => {
      b.addEventListener('mouseenter', () => { if (+b.dataset.t !== S.act) Sound.hover(); });
      b.addEventListener('click', () => {
        const next = +b.dataset.t;
        if (next === S.act) { Sound.click(); return; }
        S.act = next; S.row = 0; Sound.click(); syncBars(); renderPanel();
      });
    });
    const updateRow = (i, playSound = true) => {
      if (S.row === i) return;
      S.row = i;
      panel.querySelectorAll('.urow').forEach((node, index) => node.classList.toggle('sel', index === i));
      const selected = BARS[S.act].rows[i];
      const upper = panel.querySelector('.upper');
      upper.innerHTML = `<b style="font-weight:600">${selected.name}</b><br>${selected.desc}`;
      if (playSound) Sound.hover();
    };
    panel.querySelectorAll('.urow').forEach((b) => {
      b.addEventListener('mouseenter', () => updateRow(+b.dataset.r));
      b.addEventListener('focus', () => updateRow(+b.dataset.r, false));
      b.addEventListener('click', () => toggle(+b.dataset.r));
      b.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(+b.dataset.r); } });
    });
  }
  function toggle(i) { const x = BARS[S.act].rows[i]; S.row = i; if (x.action) { Sound.click(); AL.Calendar.open(); return; } Prefs.set(x.k, x.bool ? !Prefs.get(x.k) : x.next(Prefs.get(x.k))); Sound.click(); renderPanel(); }
  function key(e) {
    if (AL.busy) return false; const k = e.key, n = BARS.length;
    if (k === 'Escape') { if (S.rev) { S.rev = false; Sound.back(); renderPanel(); } else Settings.close(); return true; }
    if (!S.rev) {
      if (k === 'ArrowDown') { S.act = (S.act + 1) % n; Sound.hover(); syncBars(); return true; }
      if (k === 'ArrowUp') { S.act = (S.act + n - 1) % n; Sound.hover(); syncBars(); return true; }
      if (k === 'Enter' || k === ' ') { reveal(); return true; }
    } else {
      const m = BARS[S.act].rows.length;
      if (k === 'ArrowDown') { S.row = (S.row + 1) % m; Sound.hover(); renderPanel(); return true; }
      if (k === 'ArrowUp') { S.row = (S.row + m - 1) % m; Sound.hover(); renderPanel(); return true; }
      if (k === 'ArrowRight') { S.act = (S.act + 1) % n; S.row = 0; Sound.hover(); syncBars(); renderPanel(); return true; }
      if (k === 'ArrowLeft') { S.act = (S.act + n - 1) % n; S.row = 0; Sound.hover(); syncBars(); renderPanel(); return true; }
      if (k === 'Enter' || k === ' ') { toggle(S.row); return true; }
    }
    return false;
  }
  $('#settingsStage').addEventListener('click', (e) => { if (e.target.id === 'settingsStage' && !AL.busy) Settings.close(); });
  const Settings = {
    open() {
      AL.busy = true;
      transition(() => { AL.Menu.suspend(); S.act = 0; S.rev = true; S.opening = true; S.row = 0; renderBars(); renderPanel(); AL.show('settings', true); AL.seekVideo(vOpt, 0); AL.playVideo(vOpt); AL.keys.current = key; }).then(() => { AL.busy = false; });
    },
    close() {
      AL.busy = true; Sound.back();
      transition(() => { vOpt.pause(); AL.show('settings', false); if (AL.visible('menu')) AL.Menu.resume(); else AL.mainMenu(); }).then(() => { AL.busy = false; });
    }
  };
  Settings.key = key; AL.Settings = Settings; AL.PlayMenu = Settings;

  /* ---------- EXPLICAÇÃO ---------- */
  const stage = $('#explainStage'), vRes = $('#vRes');
  const row = (h, c) => `<div class="erow ${c || ''}">${h}</div>`;
  const fx = (a, b, c) => `<code>f(x) = ${AM.fmt(a)}x² ${b < 0 ? '−' : '+'} ${AM.fmt(Math.abs(b))}x ${c < 0 ? '−' : '+'} ${AM.fmt(Math.abs(c))}</code>`;
  function plot(body, defs, show) {   // gráfico interativo com sliders
    const w = el('div'); const cv = el('canvas'); cv.width = 1100; cv.height = 400; cv.style.cssText = 'width:1100px;height:400px;background:#050a22;border:1px solid #ffffff26';
    const ctl = el('div', 'eplay'); const out = el('div', 'erow'); const v = Object.assign({ a: 1, b: 0, c: 0 }, defs);
    const draw = () => { AL.Graph.draw(cv, { a: v.a, b: v.b, c: v.c, grid: true, xr: [-8, 8], yr: [-6, 6] }); out.innerHTML = fx(v.a, v.b, v.c) + ' &nbsp; ' + T.explain.plotValues.replace('{a}', AM.fmt(v.a)).replace('{b}', AM.fmt(v.b)).replace('{c}', AM.fmt(v.c)) + (v.a > 0 ? T.explain.graphUp : v.a < 0 ? T.explain.graphDown : T.explain.graphNotParabola); };
    show.forEach((k) => { const d = el('div', 'sl', `<div>${T.game.coefficients[['a','b','c'].indexOf(k)]} = <span>${v[k]}</span></div><input type="range" min="${k === 'a' ? -3 : -5}" max="${k === 'a' ? 3 : 5}" step="0.5" value="${v[k]}">`); const inp = d.querySelector('input'), sp = d.querySelector('span'); inp.addEventListener('input', () => { v[k] = +inp.value; sp.textContent = inp.value; draw(); }); ctl.appendChild(d); });
    w.append(cv, ctl, out); body.appendChild(w); body.classList.add('plots'); AL.on('resize', draw); setTimeout(draw, 0);
  }
  function solBlock(pts, title) {
    const id = 'sol' + Math.random().toString(36).slice(2, 7), s = AM.solve(pts);
    return `<div class="erow"><span class="chip">${title}</span>${T.common.points} ${pts.map((p) => `<code>(${p.x}, ${p.y})</code>`).join(' ')} &nbsp; <button class="pbtn blue" style="height:44px;font-size:22px;padding:0 20px" data-sol="${id}"><span>${T.explain.showSolution}</span></button><div id="${id}" class="hidden" style="margin-top:12px">${AM.steps(pts).map((t) => '• ' + t).join('<br>')}</div></div>`;
  }
  const E = T.explain.lessons;
  const L = [
    { t: E[0].title, f: (b) => { b.innerHTML = row(E[0].intro) + row(E[0].detail.replace('{example}', fx(2, -3, 5))) + row(E[0].tip, 'tip'); plot(b, { a: 1, b: 0, c: 0 }, ['a', 'b', 'c']); } },
    { t: E[1].title, f: (b) => { b.innerHTML = row(E[1].intro) + row(E[1].detail); plot(b, { a: 1, b: 1, c: -1 }, ['a']); } },
    { t: E[2].title, f: (b) => { b.innerHTML = row(E[2].intro) + row(E[2].detail, 'tip'); plot(b, { a: 1, b: 0, c: 2 }, ['c']); } },
    { t: E[3].title, f: (b) => { b.innerHTML = row(E[3].intro) + row(E[3].detail) + row(E[3].tip, 'tip'); } },
    { t: E[4].title, f: (b) => { const p = [{ x: -1, y: 2 }, { x: 1, y: 6 }, { x: 2, y: 11 }]; b.innerHTML = row(E[4].intro) + row(AM.steps(p).map((t) => '• ' + t).join('<br>')) + row(E[4].tip, 'tip'); } },
    { t: E[5].title, f: (b) => { b.innerHTML = row(E[5].tip, 'tip') + solBlock([{ x: 0, y: -2 }, { x: 1, y: -1 }, { x: 2, y: 2 }], T.settings.difficulty.easy) + solBlock([{ x: -1, y: 6 }, { x: 1, y: 2 }, { x: 3, y: 6 }], T.settings.difficulty.medium) + solBlock([{ x: -2, y: 0 }, { x: 2, y: 4 }, { x: 4, y: 0 }], T.settings.difficulty.hard + T.explain.fractionLabel); b.querySelectorAll('[data-sol]').forEach((bt) => bt.addEventListener('click', () => { Sound.click(); b.querySelector('#' + bt.dataset.sol).classList.toggle('hidden'); })); } },
    { t: E[6].title, f: (b) => { b.innerHTML = E[6].tips.map(([k, v]) => row(`<span class="chip">${k}</span>${v}`, 'tip')).join(''); } }
  ];
  let cur = 0;
  function renderExplain() {
    stage.innerHTML = `<div class="etitle"><small>${T.appName}</small>${T.explain.title}</div><div class="lessons"></div><div class="edetail"><div class="ehead"></div><div class="ebody"></div></div><button class="pbtn eback"><span>${T.explain.back}</span></button>`;
    const ls = $('.lessons', stage);
    L.forEach((l, i) => { const c = el('div', 'lcard', `<b>${String(i + 1).padStart(2, '0')}</b><span>${l.t}</span>`); c.addEventListener('click', () => { cur = i; Sound.click(); showLesson(); }); c.addEventListener('mouseenter', () => Sound.hover()); ls.appendChild(c); });
    $('.eback', stage).addEventListener('click', () => Explain.close()); showLesson();
  }
  function showLesson() {
    stage.querySelectorAll('.lcard').forEach((c, i) => c.classList.toggle('act', i === cur));
    $('.ehead', stage).innerHTML = `<b>${String(cur + 1).padStart(2, '0')}</b><span>${L[cur].t}</span>`;
    const b = $('.ebody', stage); b.innerHTML = ''; b.scrollTop = 0; L[cur].f(b);
  }
  function ekey(e) {
    if (AL.busy) return false;
    if (e.key === 'Escape') { Explain.close(); return true; }
    if (e.key === 'ArrowDown') { cur = (cur + 1) % L.length; Sound.hover(); showLesson(); return true; }
    if (e.key === 'ArrowUp') { cur = (cur + L.length - 1) % L.length; Sound.hover(); showLesson(); return true; }
    return false;
  }
  const Explain = {
    open() { AL.busy = true; transition(() => { AL.Menu.suspend(); cur = 0; renderExplain(); AL.show('explain', true); AL.seekVideo(vRes, 0); AL.playVideo(vRes); AL.keys.current = ekey; }).then(() => { AL.busy = false; }); },
    close() { AL.busy = true; Sound.back(); transition(() => { vRes.pause(); AL.show('explain', false); AL.Menu.resume(); }).then(() => { AL.busy = false; }); }
  };
  AL.Explain = Explain;
})();
