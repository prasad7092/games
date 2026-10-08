/* Bubs' World — boot */
(function () {
  const BW = window.BW;
  function boot() {
    BW.Store.load();
    BW.Audio.loadPref();
    BW.Shell.init();
    BW.UI.init();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
