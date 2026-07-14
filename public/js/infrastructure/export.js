/* ══════════ SB.Infrastructure — Exportação CSV/PDF ══════════ */
window.SB = window.SB || {};
window.SB.Infrastructure = window.SB.Infrastructure || {};

(function() {
  var I = SB.Infrastructure;
  var U = SB.Util;
  var H = SB.Html;

  I.csvCell = function(v) {
    v = String(v == null ? '' : v);
    if (v.indexOf(',') !== -1 || v.indexOf('"') !== -1 || v.indexOf('\n') !== -1 || v.indexOf(';') !== -1) {
      return '"' + v.replace(/"/g, '""') + '"';
    }
    return v;
  };

  I.downloadCSV = function(rows, name) {
    var csv = rows.map(function(r) { return r.map(I.csvCell).join(';'); }).join('\r\n');
    var blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'stakebet-' + name + '-' + new Date().toISOString().slice(0, 10) + '.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  I.printReport = function(title, summaryHtml, headers, rows) {
    var area = document.getElementById('print-area');
    if (!area) return;
    var theadHtml = '<tr>' + headers.map(function(h) {
      return '<th style="border-bottom:2px solid #222;padding:8px 10px;text-align:left;background:#f7f7f7;font-size:9.5px;text-transform:uppercase;letter-spacing:0.03em;color:#555;">' + h + '</th>';
    }).join('') + '</tr>';
    var tbodyHtml = rows.map(function(r, i) {
      var bg = i % 2 === 0 ? '#fff' : '#fafafa';
      return '<tr style="background:' + bg + ';">' + r.map(function(c) {
        return '<td style="border-bottom:1px solid #eee;padding:7px 10px;text-align:left;">' + (c == null ? '' : c) + '</td>';
      }).join('') + '</tr>';
    }).join('');
    var logoImg = 'data:image/png;base64,' + U.LOGO_B64;
    area.innerHTML =
      '<div style="position:relative;font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;padding:30px 34px;overflow:visible;">' +
        '<div style="position:relative;z-index:1;">' +
          '<div style="display:flex;align-items:center;gap:16px;border-bottom:2px solid #eee;padding-bottom:18px;margin-bottom:20px;">' +
            '<img src="' + logoImg + '" style="width:58px;height:58px;border-radius:50%;box-shadow:0 0 0 1px #eee;">' +
            '<div style="flex:1;"><div style="font-size:21px;font-weight:800;">Stake<span style="color:#c99400;">Bet</span></div>' +
            '<div style="font-size:10px;color:#888;">Controle profissional de apostas</div></div>' +
            '<div style="text-align:right;font-size:10px;color:#999;">Gerado em<br><strong style="color:#555;">' + new Date().toLocaleString('pt-BR') + '</strong></div>' +
          '</div>' +
          '<h1 style="font-size:19px;margin:0 0 18px;font-weight:800;">' + title + '</h1>' +
          '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:26px;">' + summaryHtml + '</div>' +
          '<table style="width:100%;border-collapse:collapse;font-size:10.5px;"><thead>' + theadHtml + '</thead><tbody>' + tbodyHtml + '</tbody></table>' +
          '<div style="margin-top:36px;padding-top:14px;border-top:1px solid #eee;text-align:center;font-size:9px;color:#aaa;">StakeBet — relatório gerado automaticamente</div>' +
        '</div>' +
      '</div>';
    setTimeout(function() { window.print(); }, 150);
  };

})();
