/* Ligação final: menu principal, saída e inicialização. */
(function () {
  'use strict';
  const { $, Sound } = AL;
  const T = window.ARCANA_TEXT;
  document.title = T.appName + ' — Enhanced 2026.10.22-r6';
  function quit() {
    AL.busy = true; Sound.back();
    try { window.close(); } catch (e) { }
    AL.transition(() => { AL.Menu.hide(); AL.show('exit', true); AL.keys.current = (e) => { if (e.key === 'Enter' || e.key === 'Escape') { back(); return true; } return false; }; }).then(() => { AL.busy = false; });
  }
  function back() { AL.busy = true; AL.transition(() => { AL.show('exit', false); AL.mainMenu(); }).then(() => { AL.busy = false; }); }
  $('#exitTitle').textContent = T.menu.exitTitle;
  $('#exitBody').textContent = T.menu.exitBody;
  $('#exitBackText').textContent = T.menu.exitBack;
  $('#exitBack').addEventListener('click', back);
  AL.mainMenu = function () {
    AL.Menu.open({ dismissible: false, items: [
      { label: T.menu.main.play, action: () => AL.PlayMenu.open() },
      { label: T.menu.main.explain, action: () => AL.Explain.open() },
      { label: T.menu.main.quit, action: quit }] });
  };
  document.fonts.ready.then(() => AL.mainMenu());
})();
