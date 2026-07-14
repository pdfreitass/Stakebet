/* ══════════ SB.Infrastructure — Cliente Supabase ══════════ */
window.SB = window.SB || {};
window.SB.Infrastructure = window.SB.Infrastructure || {};

(function() {
  var I = SB.Infrastructure;

  // Configuração — substitua pelas suas credenciais do Supabase
  var SUPABASE_URL = window.SB_SUPABASE_URL || '';
  var SUPABASE_KEY = window.SB_SUPABASE_KEY || '';

  I.supabase = null;

  I.initSupabase = function(url, key) {
    var finalUrl = url || SUPABASE_URL;
    var finalKey = key || SUPABASE_KEY;
    if (!finalUrl || !finalKey) {
      console.log('StakeBet: offline mode (Supabase nao configurado)');
      return null;
    }
    try {
      if (typeof supabase !== 'undefined') {
        I.supabase = supabase.createClient(finalUrl, finalKey);
        return I.supabase;
      }
    } catch(e) {
      console.warn('Supabase init error:', e.message);
    }
    return null;
  };

  I.getClient = function() {
    if (!I.supabase) {
      I.supabase = I.initSupabase();
    }
    return I.supabase;
  };

  I.isOnline = function() {
    return !!I.supabase && !!I.supabase.auth && !!I.supabase.auth.getSession;
  };

  /* ── Auth helpers ── */
  I.getUserId = async function() {
    if (!I.isOnline()) return null;
    try {
      var _ref = I.supabase, data = _ref.data;
      var _ref2 = await I.supabase.auth.getSession();
      var session = _ref2.data.session;
      return session ? session.user.id : null;
    } catch(e) {
      return null;
    }
  };

})();
