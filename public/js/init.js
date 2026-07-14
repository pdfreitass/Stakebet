/* ══════════ StakeBet — Inicialização ══════════ */
(function() {
  'use strict';

  /* ── Configuração Supabase (substitua pelas suas credenciais) ── */
  window.SB_SUPABASE_URL = 'https://nflzagwyqoiquslyfzgr.supabase.co';
  window.SB_SUPABASE_KEY = ''; // ← cole sua anon key aqui

  /* ── Inicializar Supabase ── */
  var infra = SB.Infrastructure;
  infra.initSupabase();

  /* ── Inicializar objetos de camada ── */
  SB.Infrastructure = SB.Infrastructure || {};
  SB.App = SB.App || {};
  SB.UI = SB.UI || {};

  /* ── Layer aliases (retrocompatibilidade) ── */
  SB.Domain = SB.Util;
  SB.Infrastructure.Storage = SB.Store;
  SB.Infrastructure.Sync = SB.Sync;
  SB.App.Config = SB.Config;
  SB.App.Casas = SB.Casas;
  SB.App.Simples = SB.Simples;
  SB.App.Surebets = SB.Surebets;
  SB.App.DuploGreen = SB.DuploGreen;
  SB.App.Lixeira = SB.Lixeira;
  SB.App.Relatorios = SB.Relatorios;
  SB.UI.Html = SB.Html;
  SB.UI.Navigation = SB.Nav;
  SB.UI.Home = SB.Home;

  /* ── Scroll nav (esconde barra inferior ao rolar) ── */
  (function() {
    var nav = document.querySelector('.bottomnav');
    if (!nav) return;
    var lastY = window.scrollY, ticking = false;
    window.addEventListener('scroll', function() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function() {
        var curY = window.scrollY;
        var atBottom = (window.innerHeight + curY) >= (document.documentElement.scrollHeight - 4);
        if (curY <= 8) nav.classList.remove('hide');
        else if (atBottom) nav.classList.add('hide');
        else if (curY > lastY + 4) nav.classList.add('hide');
        else if (curY < lastY - 4) nav.classList.remove('hide');
        lastY = curY;
        ticking = false;
      });
    }, { passive: true });
  })();

  /* ── After-print cleanup ── */
  window.onafterprint = function() {
    var area = document.getElementById('print-area');
    if (area) area.innerHTML = '';
  };

  /* ── Main init ── */
  SB.Casas.renderCasaSelects();
  SB.Surebets.setLegCount('leg', 2);
  SB.Surebets.setLegCount('dg', 2);
  SB.Config.fillCfgForm();
  SB.Casas.renderCasas();
  SB.Lixeira.renderTrash();
  SB.Home.renderHome();
  document.getElementById('fdata-date').value = SB.Util.splitToDateTime(new Date().toISOString()).date;
  document.getElementById('fdata-time').value = SB.Util.splitToDateTime(new Date().toISOString()).time;
  SB.Nav.showTab('home');

  /* ── Init auth (se configurado) ── */
  if (SB.App.Auth && SB.App.Auth.init) {
    SB.App.Auth.init();
  }
})();
