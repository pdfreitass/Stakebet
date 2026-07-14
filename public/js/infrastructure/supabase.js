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
    if (typeof supabase !== 'undefined') {
      I.supabase = supabase.createClient(url || SUPABASE_URL, key || SUPABASE_KEY);
      return I.supabase;
    }
    console.warn('Supabase SDK não carregado. Usando localStorage como fallback.');
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
