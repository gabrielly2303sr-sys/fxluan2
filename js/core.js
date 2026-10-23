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

  /* ---------- áudio: pack pessoal opcional + fallback distribuível ---------- */
  const NAMES = ['hover', 'click', 'back', 'good', 'bad', 'tick', 'hint', 'whoosh', 'open', 'clear', 'phase', 'unlock', 'toggleOn', 'toggleOff', 'misc', 'sliderUp', 'sideMenuIn', 'outOfGame', 'intoGame'];
  const VOL = { hover: .25, click: .45, back: .36, good: .58, bad: .42, tick: .2, hint: .42, whoosh: .34, open: .36, clear: .48, phase: .42, unlock: .58, toggleOn: .35, toggleOff: .32, misc: .26, sliderUp: .25, sideMenuIn: .36, outOfGame: .34, intoGame: .38 };
  const LOCAL_SFX_DIR = 'assets/audio/local-pack/sfx/';
  const BUNDLED_SFX_DIR = 'assets/audio/fxluan2-sfx/';
  const LOCAL_SFX_FILES = Object.fromEntries(NAMES.map((name) => [name, name + '.wav']));
  const BUNDLED_SFX_FILES = {
    hover: 'hover.wav', click: 'click.wav', back: 'back.wav', good: 'good.wav', bad: 'bad.wav',
    tick: 'tick.wav', hint: 'hint.wav', whoosh: 'whoosh.wav', open: 'open.wav', clear: 'clear.wav',
    phase: 'phase.wav', unlock: 'unlock.wav', toggleOn: 'click.wav', toggleOff: 'back.wav',
    misc: 'click.wav', sliderUp: 'tick.wav', sideMenuIn: 'open.wav', outOfGame: 'back.wav', intoGame: 'phase.wav'
  };
  const OGG_FALLBACK_FILES = Object.fromEntries(NAMES.map((name) => [name, BUNDLED_SFX_FILES[name].replace(/\.wav$/i, '.ogg')]));
  const CUSTOM_MUSIC = 'assets/audio/local-pack/music.mp3';
  const MUSIC_FALLBACK = 'assets/audio/music.ogg';
  const DB_NAME = 'arcana-lab-personal-audio-v1';
  const DB_STORE = 'files';
  const customUrls = Object.create(null);
  const zipSfxMap = {
    hover: 'deck_ui_navigation.wav', click: 'deck_ui_default_activation.wav',
    back: 'deck_ui_side_menu_fly_out.wav', good: 'deck_ui_toast.wav',
    bad: 'deck_ui_bumper_end_02.wav', tick: 'deck_ui_slider_down.wav',
    hint: 'deck_ui_volume.wav', whoosh: 'deck_ui_tab_transition_01.wav',
    open: 'deck_ui_show_modal.wav', clear: 'deck_ui_hide_modal.wav',
    phase: 'deck_ui_launch_game.wav', unlock: 'deck_ui_achievement_toast.wav',
    toggleOn: 'deck_ui_switch_toggle_on.wav', toggleOff: 'deck_ui_switch_toggle_off.wav',
    misc: 'deck_ui_misc_10.wav', sliderUp: 'deck_ui_slider_up.wav',
    sideMenuIn: 'deck_ui_side_menu_fly_in.wav', outOfGame: 'deck_ui_out_of_game_detail.wav',
    intoGame: 'deck_ui_into_game_detail.wav'
  };
  const sfxFallbackSrc = (name) => [
    customUrls['sfx:' + name],
    LOCAL_SFX_DIR + LOCAL_SFX_FILES[name],
    BUNDLED_SFX_DIR + BUNDLED_SFX_FILES[name],
    'assets/audio/' + OGG_FALLBACK_FILES[name]
  ].filter(Boolean);
  function openAudioDb() {
    if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB indisponível neste navegador.'));
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => { if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE); };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error('Não foi possível abrir o armazenamento de áudio.'));
    });
  }
  async function putAudio(key, blob) {
    const db = await openAudioDb();
    try { await new Promise((resolve, reject) => { const tx = db.transaction(DB_STORE, 'readwrite'); tx.objectStore(DB_STORE).put(blob, key); tx.oncomplete = resolve; tx.onerror = () => reject(tx.error); }); }
    finally { db.close(); }
  }
  async function loadAudio(key) {
    const db = await openAudioDb();
    try { return await new Promise((resolve, reject) => { const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).get(key); req.onsuccess = () => resolve(req.result || null); req.onerror = () => reject(req.error); }); }
    finally { db.close(); }
  }
  function setCustomUrl(key, blob) {
    if (customUrls[key]) URL.revokeObjectURL(customUrls[key]);
    customUrls[key] = URL.createObjectURL(blob);
  }
  async function preloadSavedAudio() {
    try {
      const db = await openAudioDb();
      let keys;
      try { keys = await new Promise((resolve, reject) => { const req = db.transaction(DB_STORE, 'readonly').objectStore(DB_STORE).getAllKeys(); req.onsuccess = () => resolve(req.result || []); req.onerror = () => reject(req.error); }); }
      finally { db.close(); }
      for (const key of keys) {
        if (key !== 'music' && !String(key).startsWith('sfx:')) continue;
        const blob = await loadAudio(key);
        if (blob) setCustomUrl(key, blob);
      }
      /* If the first click happened before IndexedDB finished, replace the fallback source now. */
      if (customUrls.music && (!Sound.music || !Sound.music.src.startsWith('blob:'))) {
        if (Sound.music) { Sound.music.pause(); if (Sound.music._fadeRaf) cancelAnimationFrame(Sound.music._fadeRaf); }
        Sound.music = makeMusic(customUrls.music, true);
        if (prefs.music && !document.hidden) Sound.syncMusic();
      }
      if (window.AL) window.AL.emit('custom-audio-loaded', Sound.customStatus());
    } catch (e) { /* armazenamento é opcional; o áudio de fallback continua disponível */ }
  }
  function playCandidate(list, index, volume) {
    if (index >= list.length) return;
    const audio = new Audio();
    audio.preload = 'auto'; audio.volume = Math.max(0, Math.min(1, volume));
    audio.defaultPlaybackRate = 1; audio.playbackRate = 1;
    if ('preservesPitch' in audio) audio.preservesPitch = true;
    let advanced = false;
    const next = () => { if (advanced) return; advanced = true; playCandidate(list, index + 1, volume); };
    audio.addEventListener('error', next, { once: true });
    audio.addEventListener('ended', () => { audio.pause(); audio.removeAttribute('src'); audio.load(); }, { once: true });
    audio.src = list[index];
    try { const promise = audio.play(); if (promise && promise.catch) promise.catch(next); } catch (e) { next(); }
  }
  function playSfx(name, volume) { playCandidate(sfxFallbackSrc(name), 0, volume); }
  const Sound = { music: null, loadingMusic: null, duck: false };
  NAMES.forEach((name) => { Sound[name] = () => { if (prefs.sound) playSfx(name, VOL[name]); }; });
  function makeMusic(src, custom = false) {
    const music = new Audio(src);
    music.loop = true; music.preload = 'auto'; music.volume = 0;
    music.defaultPlaybackRate = 1; music.playbackRate = 1; music._arcanaCustom = custom; music._arcanaFallbackTried = false;
    if ('preservesPitch' in music) music.preservesPitch = true;
    if (custom) music.addEventListener('error', () => fallbackMusic(music), { once: true });
    return music;
  }
  function fallbackMusic(failed) {
    if (Sound.music !== failed || failed._arcanaFallbackTried) return;
    failed._arcanaFallbackTried = true; failed.pause();
    Sound.music = makeMusic(MUSIC_FALLBACK, false);
    Sound.syncMusic();
  }
  Sound.startMusic = () => {
    if (!Sound.music) Sound.music = makeMusic(customUrls.music || CUSTOM_MUSIC, true);
    Sound.syncMusic();
  };
  Sound.syncMusic = () => {
    if (!Sound.music) { Sound.music = makeMusic(customUrls.music || CUSTOM_MUSIC, true); }
    const music = Sound.music;
    music.defaultPlaybackRate = 1; music.playbackRate = 1;
    if ('preservesPitch' in music) music.preservesPitch = true;
    if (prefs.music && !document.hidden) {
      try {
        const promise = music.play();
        if (promise && promise.catch) promise.catch(() => { if (Sound.music === music && music._arcanaCustom) fallbackMusic(music); });
      } catch (e) { if (music._arcanaCustom) fallbackMusic(music); }
      fade(music, Sound.duck ? 0.12 : 0.3);
    } else fade(music, 0, () => music.pause());
  };
  Sound.customStatus = () => ({ music: !!customUrls.music, sfx: NAMES.filter((n) => !!customUrls['sfx:' + n]).length });
  Sound.importMusic = async (file) => {
    if (!file || !/\.mp3$/i.test(file.name || '') && !(file.type || '').includes('audio')) throw new Error('Selecione um arquivo MP3 de música.');
    const blob = file.slice(0, file.size, file.type || 'audio/mpeg');
    await putAudio('music', blob); setCustomUrl('music', blob);
    if (Sound.music) { Sound.music.pause(); if (Sound.music._fadeRaf) cancelAnimationFrame(Sound.music._fadeRaf); }
    Sound.music = makeMusic(customUrls.music, true);
    Sound.syncMusic();
    return true;
  };
  async function extractZipWavs(file) {
    const buffer = await file.arrayBuffer(), view = new DataView(buffer), bytes = new Uint8Array(buffer);
    const decoder = new TextDecoder('utf-8');
    const min = Math.max(0, bytes.length - 65557); let end = -1;
    for (let i = bytes.length - 22; i >= min; i--) { if (view.getUint32(i, true) === 0x06054b50) { end = i; break; } }
    if (end < 0) throw new Error('Não encontrei a tabela ZIP. Confira se selecionou o ZIP de SFX.');
    const count = view.getUint16(end + 10, true), dirSize = view.getUint32(end + 12, true); let pos = view.getUint32(end + 16, true);
    const stop = Math.min(bytes.length, pos + dirSize), wanted = new Map();
    const wantedBySource = Object.fromEntries(Object.entries(zipSfxMap).map(([k, v]) => [v.toLowerCase(), k]));
    for (let n = 0; n < count && pos + 46 <= stop; n++) {
      if (view.getUint32(pos, true) !== 0x02014b50) break;
      const method = view.getUint16(pos + 10, true), compressedSize = view.getUint32(pos + 20, true);
      const nameLength = view.getUint16(pos + 28, true), extraLength = view.getUint16(pos + 30, true), commentLength = view.getUint16(pos + 32, true);
      const localOffset = view.getUint32(pos + 42, true);
      const fullName = decoder.decode(bytes.slice(pos + 46, pos + 46 + nameLength));
      const baseName = fullName.split('/').pop().toLowerCase();
      const key = wantedBySource[baseName];
      if (key && !wanted.has(key) && localOffset + 30 <= bytes.length) {
        if (view.getUint32(localOffset, true) !== 0x04034b50) throw new Error('Cabeçalho ZIP inválido em ' + baseName);
        const localNameLen = view.getUint16(localOffset + 26, true), localExtraLen = view.getUint16(localOffset + 28, true);
        const dataStart = localOffset + 30 + localNameLen + localExtraLen;
        if (dataStart + compressedSize > bytes.length) throw new Error('Arquivo ZIP truncado: ' + baseName);
        const compressed = bytes.slice(dataStart, dataStart + compressedSize);
        let decoded;
        if (method === 0) decoded = compressed;
        else if (method === 8 && 'DecompressionStream' in window) {
          const stream = new Blob([compressed]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
          decoded = new Uint8Array(await new Response(stream).arrayBuffer());
        } else throw new Error('Este navegador não consegue descompactar este ZIP. Extraia os WAVs e importe-os em separado.');
        wanted.set(key, new Blob([decoded], { type: 'audio/wav' }));
      }
      pos += 46 + nameLength + extraLength + commentLength;
    }
    return wanted;
  }
  Sound.importSfxZip = async (file) => {
    if (!file || !/\.zip$/i.test(file.name || '')) throw new Error('Selecione o ZIP que contém os WAVs.');
    const extracted = await extractZipWavs(file);
    if (!extracted.size) throw new Error('Não encontrei os WAVs esperados no ZIP selecionado.');
    for (const [name, blob] of extracted) { await putAudio('sfx:' + name, blob); setCustomUrl('sfx:' + name, blob); }
    if (window.AL) window.AL.emit('custom-audio-loaded', Sound.customStatus());
    return extracted.size;
  };
  Sound.importWavFiles = async (files) => {
    const bySource = Object.fromEntries(Object.entries(zipSfxMap).map(([k, v]) => [v.toLowerCase(), k]));
    let count = 0;
    for (const file of Array.from(files || [])) {
      const key = bySource[(file.name || '').toLowerCase()];
      if (!key || !/\.wav$/i.test(file.name)) continue;
      const blob = file.slice(0, file.size, file.type || 'audio/wav');
      await putAudio('sfx:' + key, blob); setCustomUrl('sfx:' + key, blob); count++;
    }
    if (window.AL) window.AL.emit('custom-audio-loaded', Sound.customStatus());
    if (!count) throw new Error('Nenhum dos WAVs reconhecidos foi selecionado.');
    return count;
  };
  function fade(m, to, done) {
    if (!m) return;
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
  preloadSavedAudio();

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
