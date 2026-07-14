window.SB = window.SB || {};

/* ══════════ SB.Store — Abstração de localStorage ══════════ */
window.SB.Store = (function() {
  var KEYS = {
    CFG: 'sb_config_v1',
    CASAS: 'sb_casas_v1',
    SIMPLES: 'sb_simples_v1',
    SURE: 'sb_sure_v1',
    DG: 'sb_dg_v1',
    TRASH_SIMPLES: 'sb_trash_simples_v1',
    TRASH_SURE: 'sb_trash_sure_v1',
    TRASH_DG: 'sb_trash_dg_v1',
    SYNC: 'sb_sync_v1'
  };

  function load(key) {
    try { var s = localStorage.getItem(key); return s ? JSON.parse(s) : null; }
    catch(e) { return null; }
  }
  function save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
    if (window.SB && SB.Sync && SB.Sync.scheduleAutoPush) SB.Sync.scheduleAutoPush();
  }
  function remove(key) {
    try { localStorage.removeItem(key); } catch(e) {}
  }

  return { KEYS: KEYS, load: load, save: save, remove: remove };
})();
