/* ══════════ SB.Domain — Funções puras de domínio (stats) ══════════ */
window.SB = window.SB || {};
window.SB.Domain = window.SB.Domain || {};

(function() {
  var D = SB.Domain;
  var U = SB.Util;

  /* ── Curva de equity e drawdown ── */
  D.computeEquity = function(itemsSorted, bancaInicial, lucroFn) {
    var running = bancaInicial, peak = bancaInicial, maxDD = 0, curve = [bancaInicial];
    itemsSorted.forEach(function(it) {
      running += lucroFn(it);
      curve.push(running);
      if (running > peak) peak = running;
      var dd = peak - running;
      if (dd > maxDD) maxDD = dd;
    });
    return { curve: curve, drawdown: maxDD, final: running };
  };

  /* ── Buckets mensais ── */
  D.monthlyBuckets = function(items, dateFn, lucroFn, monthsBack) {
    var now = new Date(), buckets = [];
    for (var i = monthsBack - 1; i >= 0; i--) {
      var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: d.getFullYear() + '-' + d.getMonth(),
        label: d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
        total: 0
      });
    }
    items.forEach(function(it) {
      var d = new Date(dateFn(it));
      if (isNaN(d.getTime())) return;
      var key = d.getFullYear() + '-' + d.getMonth();
      for (var j = 0; j < buckets.length; j++) {
        if (buckets[j].key === key) { buckets[j].total += lucroFn(it); break; }
      }
    });
    return buckets;
  };

  /* ── Stats Apostas Simples ── */
  D.statsSimples = function(bets, cfgBancaSimples, cicloInicioSimples) {
    var inCycle = function(b) { return !cicloInicioSimples || new Date(b.data) >= new Date(cicloInicioSimples); };
    var allSettled = bets.filter(function(b) { return b.tipo !== 'live'; });
    var settled = allSettled.filter(inCycle);
    var lives = bets.filter(function(b) { return b.tipo === 'live'; });
    var greens = settled.filter(function(b) { return D.luc(b) >= 0; });
    var reds = settled.filter(function(b) { return D.luc(b) < 0; });
    var cashouts = settled.filter(function(b) { return b.tipo === 'cashout'; });
    var invested = settled.reduce(function(s, b) { return s + b.aposta; }, 0);
    var lucroTotal = settled.reduce(function(s, b) { return s + D.luc(b); }, 0);
    var roi = invested ? lucroTotal / invested * 100 : 0;
    var winRate = settled.length ? greens.length / settled.length * 100 : 0;
    var banca = cfgBancaSimples + lucroTotal;
    var pendGain = lives.reduce(function(s, b) { return s + (b.retorno - b.aposta); }, 0);
    var pendStake = lives.reduce(function(s, b) { return s + b.aposta; }, 0);
    var sortedSettled = settled.slice().sort(function(a, b) { return new Date(a.data) - new Date(b.data); });
    var eq = D.computeEquity(sortedSettled, cfgBancaSimples, D.luc);
    var map = {};
    settled.forEach(function(b) { map[b.casa] = (map[b.casa] || 0) + D.luc(b); });
    var entries = Object.keys(map).map(function(k) { return [k, map[k]]; });
    entries.sort(function(a, b) { return b[1] - a[1]; });
    return {
      settled: settled, allSettled: allSettled, lives: lives, greens: greens, reds: reds, cashouts: cashouts,
      invested: invested, lucroTotal: lucroTotal, roi: roi, winRate: winRate,
      banca: banca, pendGain: pendGain, pendStake: pendStake, eq: eq, entries: entries, monthProfit: lucroTotal
    };
  };

  /* ── Stats Surebets ── */
  D.statsSure = function(sure, cfgBancaSure, cicloInicioSure) {
    var inCycle = function(op) { return !cicloInicioSure || new Date(U.sureEventDate(op)) >= new Date(cicloInicioSure); };
    var groups = { live: [], green: [], red: [] };
    sure.forEach(function(op) { groups[D.sureBadgeStatus(op)].push(op); });
    var live = groups.live, greenAll = groups.green, redAll = groups.red;
    var green = greenAll.filter(inCycle), red = redAll.filter(inCycle);
    var lucroGar = live.concat(green).reduce(function(s, op) { return s + op.lucroMin; }, 0);
    var preso = live.reduce(function(s, op) { return s + op.investimento; }, 0);
    var perdaProblema = red.reduce(function(s, op) { return s + op.investimento; }, 0);
    var settled = green.concat(red), allSettled = greenAll.concat(redAll);
    var lucroRealizado = green.reduce(function(s, op) { return s + op.lucroMin; }, 0) - red.reduce(function(s, op) { return s + op.investimento; }, 0);
    var investedSettled = settled.reduce(function(s, op) { return s + op.investimento; }, 0);
    var roi = investedSettled ? lucroRealizado / investedSettled * 100 : 0;
    var winRate = settled.length ? green.length / settled.length * 100 : 0;
    var banca = cfgBancaSure + lucroRealizado;
    var sortedSettled = settled.slice().sort(function(a, b) { return new Date(U.sureEventDate(a)) - new Date(U.sureEventDate(b)); });
    var eq = D.computeEquity(sortedSettled, cfgBancaSure, function(op) { return op.tipo === 'red' ? -op.investimento : op.lucroMin; });
    var lucroCompleto = lucroRealizado + live.reduce(function(s, op) { return s + op.lucroMin; }, 0);
    return {
      live: live, green: green, red: red, settled: settled, allSettled: allSettled,
      lucroGar: lucroGar, preso: preso, perdaProblema: perdaProblema,
      banca: banca, roi: roi, winRate: winRate, eq: eq,
      monthProfit: lucroRealizado, settledCount: settled.length, lucroCompleto: lucroCompleto
    };
  };

  /* ── Stats Duplo Green ── */
  D.statsDG = function(dg, cfgBancaDG, cicloInicioDG) {
    var inCycle = function(op) { return !cicloInicioDG || new Date(U.sureEventDate(op)) >= new Date(cicloInicioDG); };
    var live = dg.filter(function(op) { return op.tipo === 'live'; });
    var greenAll = dg.filter(function(op) { return op.tipo === 'green'; });
    var redAll = dg.filter(function(op) { return op.tipo === 'red'; });
    var green = greenAll.filter(inCycle), red = redAll.filter(inCycle);
    var preso = live.reduce(function(s, op) { return s + op.investimento; }, 0);
    var lucroGar = live.concat(green).reduce(function(s, op) { return s + D.dgLucro(op); }, 0);
    var perdaProblema = red.reduce(function(s, op) { return s + op.investimento; }, 0);
    var settled = green.concat(red), allSettled = greenAll.concat(redAll);
    var lucroRealizado = settled.reduce(function(s, op) { return s + D.dgLucro(op); }, 0);
    var investedSettled = settled.reduce(function(s, op) { return s + op.investimento; }, 0);
    var roi = investedSettled ? lucroRealizado / investedSettled * 100 : 0;
    var winRate = settled.length ? green.length / settled.length * 100 : 0;
    var banca = cfgBancaDG + lucroRealizado;
    var sortedSettled = settled.slice().sort(function(a, b) { return new Date(U.sureEventDate(a)) - new Date(U.sureEventDate(b)); });
    var eq = D.computeEquity(sortedSettled, cfgBancaDG, function(op) { return D.dgLucro(op); });
    var lucroCompleto = lucroRealizado + live.reduce(function(s, op) { return s + D.dgLucro(op); }, 0);
    return {
      live: live, green: green, red: red, settled: settled, allSettled: allSettled,
      lucroGar: lucroGar, preso: preso, perdaProblema: perdaProblema, lucroCompleto: lucroCompleto,
      banca: banca, roi: roi, winRate: winRate, eq: eq, monthProfit: lucroRealizado, settledCount: settled.length
    };
  };

})();
