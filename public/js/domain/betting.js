/* ══════════ SB.Domain — Funções puras de domínio (betting) ══════════ */
window.SB = window.SB || {};
window.SB.Domain = window.SB.Domain || {};

(function() {
  var D = SB.Domain;

  /* ── Cálculo de lucro/prejuízo ── */
  D.luc = function(b) {
    if (b.tipo === 'green' || b.tipo === 'cashout') return b.retorno - b.aposta;
    if (b.tipo === 'red') return -b.aposta;
    return 0;
  };

  D.sortLucroBet = function(b) {
    return b.tipo === 'live' ? (b.retorno - b.aposta) : D.luc(b);
  };

  /* ── Status de surebet ── */
  D.sureBadgeStatus = function(op) {
    if (op.tipo === 'red') return 'red';
    if (op.tipo === 'green') return 'green';
    if (op.dataFim && new Date(op.dataFim) <= new Date()) return 'green';
    return 'live';
  };

  /* ── Cálculo de lucro Duplo Green ── */
  D.dgLucro = function(op) {
    var recebidos = op.recebidos || [], comissoes = op.comissoes || [], totalNet = 0;
    for (var i = 0; i < recebidos.length; i++) {
      var r = recebidos[i] || 0, c = comissoes[i] || 0;
      totalNet += r * (1 - c / 100);
    }
    return totalNet - op.investimento;
  };

})();
