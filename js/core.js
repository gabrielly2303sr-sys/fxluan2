/* Núcleo: preferências, som, escala do palco, transição e gerenciador de telas. */
(function () {
  'use strict';
  const $ = (s, r) => (r || document).querySelector(s);
  const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- preferências (localStorage) ---------- */
  const KEY = 'arcana-lab-prefs-v1';
  const defaults = { difficulty: 'easy', timer: true, anim: !reduce, sound: true, music: true, grid: true, contrast: false };
  let prefs = Object.assign({}, defaults);
  try { Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { /* sem storage */ }
  const Prefs = {
    get: (k) => prefs[k],
    all: () => prefs,
    set(k, v) { prefs[k] = v; try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch (e) { } Prefs.apply(); AL.emit('prefs'); if (k === 'music') Sound.syncMusic(); },
    apply() { document.body.classList.toggle('hc', !!prefs.contrast); document.body.classList.toggle('noanim', !prefs.anim); }
  };

  /* ---------- áudio local empacotado + fallback original ---------- */
  const NAMES = ['hover', 'click', 'back', 'good', 'bad', 'tick', 'hint', 'whoosh', 'open', 'clear', 'phase', 'unlock'];
  const VOL = { hover: .32, click: .52, back: .42, good: .7, bad: .5, tick: .22, hint: .55, whoosh: .42, open: .4, clear: .8, phase: .48, unlock: .72 };
  const SFX_DIR = 'assets/audio/fxluan2-sfx/';
  const SFX_FILES = {
    hover: 'hover.wav', click: 'click.wav', back: 'back.wav', good: 'good.wav', bad: 'bad.wav',
    tick: 'tick.wav', hint: 'hint.wav', whoosh: 'whoosh.wav', open: 'open.wav', clear: 'clear.wav',
    phase: 'phase.wav', unlock: 'unlock.wav'
  };
  function playOne(src, volume) {
    try {
      const a = new Audio(src); a.preload = 'auto'; a.volume = volume; a.defaultPlaybackRate = 1; a.playbackRate = 1;
      if ('preservesPitch' in a) a.preservesPitch = true;
      const p = a.play(); if (p && p.catch) p.catch(() => {});
      a.addEventListener('ended', () => { a.src = ''; }, { once: true });
    } catch (e) { /* som opcional; não interrompe a interface */ }
  }
  function playSfx(name, volume) {
    const fallback = 'assets/audio/' + name + '.ogg';
    const src = SFX_DIR + SFX_FILES[name];
    let fallbackUsed = false;
    const useFallback = () => { if (!fallbackUsed) { fallbackUsed = true; playOne(fallback, volume); } };
    try {
      const a = new Audio(src); a.preload = 'auto'; a.volume = volume; a.defaultPlaybackRate = 1; a.playbackRate = 1;
      if ('preservesPitch' in a) a.preservesPitch = true;
      a.addEventListener('error', useFallback, { once: true });
      a.addEventListener('ended', () => { a.src = ''; }, { once: true });
      const p = a.play(); if (p && p.catch) p.catch(useFallback);
    } catch (e) { useFallback(); }
  }
  const Sound = { music: null, loadingMusic: null };
  NAMES.forEach((n) => {
    Sound[n] = () => { if (prefs.sound) playSfx(n, VOL[n]); };
  });
  const CUSTOM_MUSIC = 'assets/audio/full-moon-full-life.mp3';
  const MUSIC_FALLBACK = 'assets/audio/music.ogg';
  function makeMusic(src) {
    const m = new Audio(src); m.loop = true; m.preload = 'auto'; m.volume = 0; m.defaultPlaybackRate = 1; m.playbackRate = 1;
    if ('preservesPitch' in m) m.preservesPitch = true;
    if (src === CUSTOM_MUSIC) m.addEventListener('error', () => {
      if (Sound.music !== m) return;
      m.pause(); const replacement = makeMusic(MUSIC_FALLBACK); Sound.music = replacement; Sound.syncMusic();
    }, { once: true });
    return m;
  }
  Sound.startMusic = () => {
    if (Sound.music) { Sound.syncMusic(); return; }
    /* Começa o play() sincronamente no gesto do usuário; se o MP3 opcional não existir,
       o evento error troca para a trilha embutida sem bloquear nem travar a interface. */
    Sound.music = makeMusic(CUSTOM_MUSIC);
    Sound.syncMusic();
  };
  Sound.syncMusic = () => {
    const m = Sound.music;
    if (!m) { Sound.startMusic(); return; }
    m.defaultPlaybackRate = 1; m.playbackRate = 1;
    if ('preservesPitch' in m) m.preservesPitch = true;
    if (prefs.music && !document.hidden) {
      const p = m.play();
      if (p && p.catch) p.catch(() => {
        if (Sound.music === m && m.src.indexOf('full-moon-full-life.mp3') !== -1) {
          m.pause(); Sound.music = makeMusic(MUSIC_FALLBACK); Sound.syncMusic();
        }
      });
      fade(m, Sound.duck ? 0.12 : 0.3);
    } else fade(m, 0, () => m.pause());
  };
  function fade(m, to, done) {
    if (m._fadeRaf) cancelAnimationFrame(m._fadeRaf);
    const from = Number.isFinite(m.volume) ? m.volume : 0, start = performance.now(), duration = Math.max(160, Math.abs(to - from) * 850);
    const step = (now) => {
      const p = Math.min(1, (now - start) / duration), e = p * p * (3 - 2 * p);
      m.volume = Math.max(0, Math.min(1, from + (to - from) * e));
      if (p < 1) m._fadeRaf = requestAnimationFrame(step);
      else { m._fadeRaf = 0; m.volume = to; if (done) done(); }
    };
    m._fadeRaf = requestAnimationFrame(step);
  }
  const unlock = () => { Sound.startMusic(); removeEventListener('pointerdown', unlock); removeEventListener('keydown', unlock); };
  addEventListener('pointerdown', unlock); addEventListener('keydown', unlock);
  document.addEventListener('visibilitychange', () => Sound.syncMusic());

  /* ---------- palco 1920x1080 escalado ---------- */
  function fit() { document.documentElement.style.setProperty('--s', Math.min(innerWidth / 1920, innerHeight / 1080)); }
  addEventListener('resize', () => { fit(); AL.emit('resize'); });
  fit();

  /* ---------- eventos simples ---------- */
  const handlers = {};
  /* ---------- transição (P3rTransition2) ---------- */
  const trans = () => $('#trans');
  function seekVideo(v, seconds = 0) {
    if (!v) return;
    const seek = () => { try { v.currentTime = seconds; } catch (e) { } };
    if (v.readyState >= 1) seek(); else v.addEventListener('loadedmetadata', seek, { once: true });
  }
  function transition(mid) {
    if (!prefs.anim) { mid && mid(); return Promise.resolve(); }
    return new Promise((res) => {
      Sound.whoosh(); const t = trans(); t.classList.remove('hidden', 'run'); void t.offsetWidth; t.classList.add('run');
      setTimeout(() => { mid && mid(); }, 350 + 160 + 20);   // pico: tudo coberto
      setTimeout(() => { t.classList.add('hidden'); t.classList.remove('run'); res(); }, 760);
    });
  }

  /* ---------- gerenciador de telas ---------- */
  const layers = ['menu', 'settings', 'explain', 'game', 'exit'];
  const AL = {
    $, el, Prefs, Sound, transition, reduce, seekVideo,
    on(n, f) { (handlers[n] = handlers[n] || []).push(f); },
    emit(n, d) { (handlers[n] || []).forEach((f) => f(d)); },
    show(name, on) { $('#' + name + 'Layer').classList.toggle('hidden', !on); },
    visible: (name) => !$('#' + name + 'Layer').classList.contains('hidden'),
    stack: [],      // histórico de telas para o botão "voltar"
    playVideo(v) {
      if (!v || !prefs.anim) return Promise.resolve(false);
      try { v.defaultPlaybackRate = 1; v.playbackRate = 1; if ('preservesPitch' in v) v.preservesPitch = true; } catch (e) { }
      try { const p = v.play(); return p && p.then ? p.then(() => true).catch(() => false) : Promise.resolve(true); }
      catch (e) { return Promise.resolve(false); }
    },
    keys: {}        // handlers de teclado por tela ativa
  };
  window.AL = AL;
  Prefs.apply();

  /* pausa vídeos quando a aba fica oculta (economia de CPU/GPU) */
  document.addEventListener('visibilitychange', () => {
    document.querySelectorAll('video').forEach((v) => { if (document.hidden) v.pause(); });
    if (!document.hidden) AL.emit('visible');
  });
  addEventListener('keydown', (e) => { const h = AL.keys.current; if (h && h(e)) { e.preventDefault(); } });
})();
