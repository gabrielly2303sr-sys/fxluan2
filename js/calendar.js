/* Calendário de fases (Calendar.qml): dias viram fases. Fase atual grande, passadas menores, 7 visíveis na diagonal. */
(function () {
  'use strict';
  const { $, el, Sound, Prefs, transition } = AL, N = AM.PHASES, KEY = 'arcana-lab-progress-v1';
  const T = window.ARCANA_TEXT;
  let data = { done: {} };
  try { Object.assign(data, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { } };
  const Progress = {
    done: (p) => data.done[p] != null,
    best: (p) => data.done[p] || 0,
    count: () => Object.keys(data.done).length,
    /* primeira fase ainda não vencida = fase atual (limite de desbloqueio) */
    current() { for (let p = 1; p <= N; p++) if (!data.done[p]) return p; return N; },
    clear(p, score) { data.done[p] = Math.max(score, data.done[p] || 0); save(); }
  };
  AL.Progress = Progress;

  const stage = $('#calStage'); let sel = 1, ents = [];
  const NAMES = T.calendar.tiers, TC = { easy: '#fff', medium: '#4488ff', hard: '#ff4444' };
  const difficultyOffset = () => ({ easy: 0, medium: 6, hard: 12 }[Prefs.get('difficulty')] || 0);
  const phaseTier = (p) => AM.tierOf(Math.min(N, p + difficultyOffset()));
  function build() {
    stage.innerHTML = `<div class="band"></div><div class="calyear"><b>${T.calendar.title}</b><span>${T.calendar.phase}</span><i id="calBig"></i><small id="calMeta"></small></div><div class="calinfo">${T.calendar.clear}<br><b id="calCnt"></b></div><div id="calEnts"></div><div id="calFeedback" role="status" aria-live="polite"></div><div class="keyhints" id="calHints"></div>`;
    $('#calHints').innerHTML = T.calendar.hints.map((h) => `<div><span>${h[1]}</span><kbd>${h[0]}</kbd></div>`).join('');
    const box = $('#calEnts'); ents = [];
    for (let p = 1; p <= N; p++) {
      const t = phaseTier(p), e = el('div', 'ent', `<div class="ring"></div><div class="num">${p}</div><div class="tier" style="color:${TC[t]}">${NAMES[t]}<u style="background:${TC[t]};width:${t === 'easy' ? 0 : 100}%"></u></div><div class="moon"></div><div class="sc"></div>`);
      e.addEventListener('click', () => { if (AL.busy) return; if (sel === p) play(); else { go(p); } });
      box.appendChild(e); ents.push(e);
    }
    $('#calEnts').addEventListener('wheel', (ev) => { go(sel + (ev.deltaY > 0 ? 1 : -1)); ev.preventDefault(); }, { passive: false });
  }
  function layout() {
    const cur = Progress.current();
    ents.forEach((e, i) => {
      const p = i + 1, o = p - sel, t = (o + 3) / 6, vis = Math.abs(o) <= 3;
      const X = 1920 * (0.08 + t * 0.82), Y = 1080 * (0.72 - t * 0.55) - 45;
      const sc = o === 0 ? 1.12 : o < 0 ? Math.max(0.5, 0.8 - Math.abs(o) * 0.1) : Math.min(1.1, 0.75 + o * 0.1);
      e.style.transform = `translate(${X}px,${Y}px) scale(${sc})`;
      e.style.opacity = vis ? (o === 0 ? 1 : Math.max(0.35, 1 - Math.abs(o) * 0.15)) : 0; e.style.pointerEvents = vis ? 'auto' : 'none'; e.style.zIndex = 10 - Math.abs(o);
      e.classList.toggle('sel', o === 0); e.classList.toggle('lock', p > cur);
      e.querySelector('.moon').style.setProperty('--m', Progress.done(p) ? '100%' : p === cur ? '50%' : '0%');
      e.querySelector('.sc').textContent = Progress.done(p) ? T.calendar.scorePrefix + Progress.best(p) : p === cur ? T.calendar.current : '';
      const tier = phaseTier(p);
      const tierEl = e.querySelector('.tier');
      if (tierEl.firstChild) tierEl.firstChild.textContent = NAMES[tier];
      tierEl.style.color = TC[tier];
      e.querySelector('.tier u').style.width = tier === 'easy' ? '0%' : '100%';
      e.title = Progress.done(p) ? `${T.calendar.complete} · ${T.calendar.scorePrefix}${Progress.best(p)}` : p > cur ? T.calendar.locked : `${T.calendar.phase} ${p} · ${NAMES[tier]}`;
    });
    $('#calBig').textContent = String(sel).padStart(2, '0');
    $('#calMeta').textContent = `${T.calendar.phase} ${Progress.current()} / ${N}  ·  ${NAMES[phaseTier(Progress.current())]}`;
    $('#calCnt').textContent = Progress.count() + ' / ' + N;
  }
  function go(p) { p = Math.max(1, Math.min(N, p)); if (p === sel) { Sound.bad(); return; } sel = p; Sound.hover(); layout(); }
  function play() {
    if (sel > Progress.current()) { Sound.bad(); const e = ents[sel - 1]; e.animate([{ translate: '0' }, { translate: '-10px' }, { translate: '10px' }, { translate: '0' }], { duration: 200 }); const f = $('#calFeedback'); f.textContent = T.calendar.playLocked; f.classList.remove('show'); void f.offsetWidth; f.classList.add('show'); return; }
    Sound.click(); AL.busy = true; const ph = sel;
    transition(() => { AL.show('cal', false); AL.show('settings', false); $('#vOpt').pause(); AL.Menu.hide(); AL.Game.start(ph); }).then(() => { AL.busy = false; });
  }
  function key(e) {
    if (AL.busy) return false; const k = e.key;
    if (k === 'ArrowRight' || k === 'ArrowUp' || k === 'd') { go(sel + 1); return true; }
    if (k === 'ArrowLeft' || k === 'ArrowDown' || k === 'a') { go(sel - 1); return true; }
    if (k === 'Enter' || k === ' ') { play(); return true; }
    if (k === 'Escape') { Calendar.back(); return true; }
    return false;
  }
  const Calendar = {
    /* from: 'settings' (vem do menu PLAY) ou 'game' (volta da fase) */
    open(from) {
      AL.busy = true; AL.calFrom = from || 'settings';
      transition(() => { if (!ents.length) build(); sel = Progress.current(); layout(); AL.show('cal', true); AL.keys.current = key; if (from === 'game') AL.Menu.hide(); else AL.Menu.suspend(); AL.show('game', false); $('#vOpt').pause(); }).then(() => { AL.busy = false; });
    },
    back() {
      AL.busy = true; Sound.back();
      if (AL.calFrom === 'game') {
        transition(() => {
          AL.show('cal', false);
          AL.show('game', true);
          AL.Game.openPauseMenu();
        }).then(() => { AL.busy = false; });
      } else {
        transition(() => { AL.show('cal', false); AL.show('settings', true); AL.playVideo($('#vOpt')); AL.keys.current = AL.PlayMenu.key; }).then(() => { AL.busy = false; });
      }
    },
    refresh() { if (ents.length) layout(); }
  };
  AL.Calendar = Calendar;
  AL.on('prefs', () => { });
})();
