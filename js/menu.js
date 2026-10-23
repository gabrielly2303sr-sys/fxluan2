/* Menu Persona 3 Reload (P3rpause.qml): PNG seq -> vídeo de transição -> vídeo em loop + itens inclinados.
   O MESMO componente serve para o menu principal e para o menu de pausa. */
(function () {
  'use strict';
  const { $, el, Sound, Prefs } = AL;
  const seq = $('#seq'), vIntro = $('#vIntro'), vLoop = $('#vLoop'), layer = $('#menuLayer'), box = $('#menuItems');
  const frames = Array.from({ length: 12 }, (_, i) => 'assets/frames/f' + String(i).padStart(2, '0') + '.webp');
  const cache = frames.map((s) => { const i = new Image(); i.src = s; return i; });
  const COLORS = [['#5ff0ff', '#0a5f9a'], ['#6cc8ff', '#0b4f95'], ['#1aa3ff', '#093a86'], ['#3d8bff', '#0a2d70'], ['#7fe4ff', '#0b4f95']];
  let timer = null, guard = null, stage = 0, cfg = null, sel = 0, items = [];
  let lastMediaTime = 0, lastMediaProgress = 0, mediaStartedAt = 0, loopRecoveries = 0;

  function clearGuard() { if (guard) clearInterval(guard); guard = null; }
  function safeSeek(v, seconds) {
    try { if (v.readyState >= 1) { v.currentTime = seconds; return; } } catch (e) { }
    v.addEventListener('loadedmetadata', () => { try { v.currentTime = seconds; } catch (e) { } }, { once: true });
  }
  function stopAll() { clearTimeout(timer); clearGuard(); vIntro.pause(); vLoop.pause(); }
  function guardPlayback() {
    clearGuard(); lastMediaTime = stage === 1 ? vIntro.currentTime || 0 : vLoop.currentTime || 0;
    lastMediaProgress = mediaStartedAt = performance.now();
    guard = setInterval(() => {
      if (stage !== 1 && stage !== 2) { clearGuard(); return; }
      if (layer.classList.contains('hidden')) { clearGuard(); return; }
      if (document.hidden) { lastMediaProgress = performance.now(); lastMediaTime = stage === 1 ? vIntro.currentTime || 0 : vLoop.currentTime || 0; return; }
      const v = stage === 1 ? vIntro : vLoop, now = performance.now(), t = Number(v.currentTime) || 0;
      if (!v.paused && t > lastMediaTime + 0.025) { lastMediaTime = t; lastMediaProgress = now; return; }
      if (stage === 1) {
        if ((now - mediaStartedAt > 2400 && t < 0.1) || (t > 0.1 && now - lastMediaProgress > 1750)) toLoop();
      } else if (!v.paused && now - lastMediaProgress > 2200) {
        clearGuard();
        if (loopRecoveries++ === 0) {
          vLoop.pause(); safeSeek(vLoop, 0); try { vLoop.defaultPlaybackRate = 1; vLoop.playbackRate = 1; } catch (e) { }
          lastMediaProgress = performance.now(); lastMediaTime = 0; AL.playVideo(vLoop).then((ok) => { if (!ok) showStaticFallback(); });
          guardPlayback();
        } else showStaticFallback();
      }
    }, 400);
  }
  function showStaticFallback() {
    clearGuard(); vLoop.pause(); vLoop.style.display = 'none'; seq.src = 'assets/img/bg.webp'; seq.style.display = 'block';
  }
  function showStage1() {
    stage = 1; seq.style.display = 'none'; loopRecoveries = 0;
    if (!Prefs.get('anim')) {
      stage = 2; vIntro.pause(); vIntro.style.display = 'none'; vLoop.style.display = 'block';
      safeSeek(vLoop, 1); vLoop.pause();
      reveal(); return;
    }
    vLoop.pause(); vLoop.style.display = 'none'; vIntro.style.display = 'block';
    safeSeek(vIntro, 0); try { vIntro.defaultPlaybackRate = 1; vIntro.playbackRate = 1; } catch (e) { }
    reveal(); guardPlayback();
    AL.playVideo(vIntro).then((ok) => { if (!ok && stage === 1) toLoop(); });
  }
  function toLoop() {
    if (stage >= 2) return;
    clearGuard(); stage = 2; vIntro.pause(); vIntro.style.display = 'none'; vLoop.style.display = 'block';
    safeSeek(vLoop, 0); try { vLoop.defaultPlaybackRate = 1; vLoop.playbackRate = 1; } catch (e) { }
    guardPlayback();
    AL.playVideo(vLoop).then((ok) => { if (!ok && stage === 2) showStaticFallback(); });
  }
  [vIntro, vLoop].forEach((v) => {
    v.defaultPlaybackRate = 1; v.playbackRate = 1;
    v.addEventListener('ratechange', () => { if (Math.abs(v.playbackRate - 1) > 0.001) v.playbackRate = 1; });
    v.addEventListener('stalled', () => { if (stage === 1 && v === vIntro && (v.currentTime > 0.2 || performance.now() - mediaStartedAt > 2200)) toLoop(); });
  });
  vIntro.addEventListener('ended', toLoop);
  vIntro.addEventListener('timeupdate', () => { if (stage === 1 && vIntro.duration && vIntro.currentTime >= vIntro.duration - 0.05) toLoop(); });
  function reveal() { items.forEach((it, i) => setTimeout(() => it.el.classList.add('vis'), Prefs.get('anim') ? i * 60 : 0)); }

  function build() {
    box.innerHTML = ''; items = [];
    const n = cfg.items.length, y0 = -75 - (n - 3) * 80, y1 = 300 + (n > 3 ? (n - 3) * 20 : 0);
    cfg.items.forEach((it, i) => {
      const t = n === 1 ? 0 : i / (n - 1), y = y0 + (y1 - y0) * t, rot = 4 - 16 * t;
      const e = el('div', 'mitem'); e.style.top = y + 'px'; e.style.setProperty('--r', rot + 'deg');
      const w = Math.max(248, it.label.length * 40 + 28); e.style.setProperty('--w', w + 'px');
      const c = COLORS[i % COLORS.length]; e.style.setProperty('--c1', c[0]); e.style.setProperty('--c2', c[1]);
      e.innerHTML = '<div class="flagr"></div><div class="flag"></div><div class="lab"></div><div class="hit"></div>';
      e.querySelector('.lab').textContent = it.label; e.querySelector('.lab').setAttribute('data-label', it.label);
      const hit = e.querySelector('.hit');
      hit.addEventListener('mouseenter', () => select(i, true));
      hit.addEventListener('click', () => activate(i));
      box.appendChild(e); items.push({ el: e, def: it });
    });
  }
  function select(i, snd) { if (i === sel && !snd && items[i] && items[i].el.classList.contains('on')) return; if (i !== sel && snd) Sound.hover(); sel = i; items.forEach((it, k) => it.el.classList.toggle('on', k === i)); }
  function activate(i) { Sound.click(); const it = cfg.items[i]; if (it.action) it.action(); }

  function key(e) {
    if (!AL.visible('menu') || AL.busy) return false;
    if (e.key === 'ArrowDown' || e.key === 's') { select((sel + 1) % items.length, true); return true; }
    if (e.key === 'ArrowUp' || e.key === 'w') { select((sel + items.length - 1) % items.length, true); return true; }
    if (e.key === 'Enter' || e.key === ' ') { activate(sel); return true; }
    if (e.key === 'Escape' && cfg.dismissible) { Menu.close(); return true; }
    return false;
  }

  const Menu = {
    /* open({items:[{label,action}], dismissible, onClose}) */
    open(c) {
      cfg = c; sel = 0; stage = 0; layer.classList.remove('hidden', 'fade'); layer.style.opacity = 1; build();
      seq.style.display = 'block'; vIntro.style.display = 'none'; vLoop.style.display = 'none';
      stopAll(); safeSeek(vIntro, 0); safeSeek(vLoop, 0); select(0);
      AL.keys.current = key;
      if (!Prefs.get('anim')) { showStage1(); return; }
      let f = 0; seq.src = frames[0];
      (function tick() { f++; if (f < 12) { seq.src = frames[f]; timer = setTimeout(tick, 1000 / 60); } else showStage1(); })();
    },
    /* suspende vídeos quando outra tela cobre o menu */
    suspend() { clearTimeout(timer); clearGuard(); vIntro.pause(); vLoop.pause(); },
    resume() {
      AL.keys.current = key;
      if (stage === 1) { guardPlayback(); AL.playVideo(vIntro).then((ok) => { if (!ok && stage === 1) toLoop(); }); }
      else if (stage === 2 && vLoop.style.display !== 'none') { guardPlayback(); AL.playVideo(vLoop).then((ok) => { if (!ok && stage === 2) showStaticFallback(); }); }
    },
    hide() { stopAll(); layer.classList.add('hidden'); },
    close() {   // hideAnimation: fade 300ms
      if (!cfg || AL.busy) return; const c = cfg; AL.busy = true;
      layer.classList.add('fade'); Sound.back();
      setTimeout(() => { AL.busy = false; Menu.hide(); layer.classList.remove('fade'); c.onClose && c.onClose(); }, Prefs.get('anim') ? 300 : 0);
    }
  };
  AL.on('visible', () => { if (AL.visible('menu') && !AL.menuCovered) Menu.resume(); });
  AL.Menu = Menu;
})();
