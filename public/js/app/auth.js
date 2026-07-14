/* ══════════ SB.App.Auth — Autenticação Supabase ══════════ */
window.SB = window.SB || {};
window.SB.App = window.SB.App || {};

(function() {
  var A = SB.App;
  A.Auth = {};

  var I = SB.Infrastructure;

  /* ── Estado da sessão ── */
  A.Auth.user = null;
  A.Auth.session = null;

  /* ── Inicializar listener de auth ── */
  A.Auth.init = function() {
    var client = I.getClient();
    if (!client) return;

    // Listener de mudança de sessão
    client.auth.onAuthStateChange(function(event, session) {
      A.Auth.session = session;
      A.Auth.user = session ? session.user : null;
      if (event === 'SIGNED_IN') {
        SB.UI.Navigation.showTab('home');
      }
      if (event === 'SIGNED_OUT') {
        window.location.href = '/login.html';
      }
    });
  };

  /* ── Cadastro ── */
  A.Auth.signUp = async function(email, password) {
    var client = I.getClient();
    if (!client) return { error: 'Supabase não configurado' };
    var result = await client.auth.signUp({ email: email, password: password });
    if (result.error) return result;
    // Criar config inicial para o usuário
    return result;
  };

  /* ── Login ── */
  A.Auth.signIn = async function(email, password) {
    var client = I.getClient();
    if (!client) return { error: 'Supabase não configurado' };
    return await client.auth.signInWithPassword({ email: email, password: password });
  };

  /* ── Logout ── */
  A.Auth.signOut = async function() {
    var client = I.getClient();
    if (!client) return;
    await client.auth.signOut();
  };

  /* ── Verificar sessão ao carregar ── */
  A.Auth.checkSession = async function() {
    var client = I.getClient();
    if (!client) return false;
    var _ref = await client.auth.getSession();
    var session = _ref.data.session;
    if (session) {
      A.Auth.session = session;
      A.Auth.user = session.user;
      return true;
    }
    return false;
  };

})();
