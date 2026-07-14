window.SB = window.SB || {};

/* ══════════ SB.Relatorios — Relatórios e exportação CSV/PDF ══════════ */
window.SB.Relatorios = (function() {
  var U = SB.Util, H = SB.Html;
  var reportPeriod = 'all', reportType = 'todas';

  function csvCell(v){
    v=String(v==null?'':v);
    if(v.indexOf(',')!==-1 || v.indexOf('"')!==-1 || v.indexOf('\n')!==-1 || v.indexOf(';')!==-1){
      return '"'+v.replace(/"/g,'""')+'"';
    }
    return v;
  }
  function downloadCSV(rows,name){
    var csv = rows.map(function(r){ return r.map(csvCell).join(';'); }).join('\r\n');
    var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
    var url=URL.createObjectURL(blob);
    var a=document.createElement('a');
    a.href=url; a.download='stakebet-'+name+'-'+new Date().toISOString().slice(0,10)+'.csv';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
    U.showToast('Relatório CSV baixado.',ICO.check);
  }
  function setReportPeriod(p){
    reportPeriod=p;
    document.querySelectorAll('#report-period-chips .chip').forEach(function(el,i){
      var vals=['all','today','yesterday','7d','30d','thismonth','lastmonth','custom'];
      el.classList.toggle('on', vals[i]===p);
    });
    document.getElementById('report-custom-dates').style.display = p==='custom' ? 'flex' : 'none';
    updateReportPreview();
  }
  function setReportType(t){
    reportType=t;
    document.querySelectorAll('#report-type-chips .chip').forEach(function(el,i){
      var vals=['todas','simples','sure','dg'];
      el.classList.toggle('on', vals[i]===t);
    });
    updateReportPreview();
  }
  function reportPeriodLabel(p){
    var labels={all:'Todo o período',today:'Hoje',yesterday:'Ontem','7d':'Últimos 7 dias','30d':'Últimos 30 dias',thismonth:'Este mês',lastmonth:'Mês passado',custom:'Período personalizado'};
    return labels[p]||'Todo o período';
  }
  function resolveReportRange(period){
    var now=new Date();
    var from=null, to=null;
    if(period==='today'){
      from=new Date(now.getFullYear(),now.getMonth(),now.getDate(),0,0,0);
      to=new Date(now.getFullYear(),now.getMonth(),now.getDate(),23,59,59);
    } else if(period==='yesterday'){
      var y=new Date(now); y.setDate(y.getDate()-1);
      from=new Date(y.getFullYear(),y.getMonth(),y.getDate(),0,0,0);
      to=new Date(y.getFullYear(),y.getMonth(),y.getDate(),23,59,59);
    } else if(period==='7d'){
      from=new Date(now); from.setDate(from.getDate()-6); from.setHours(0,0,0,0);
      to=now;
    } else if(period==='30d'){
      from=new Date(now); from.setDate(from.getDate()-29); from.setHours(0,0,0,0);
      to=now;
    } else if(period==='thismonth'){
      from=new Date(now.getFullYear(),now.getMonth(),1,0,0,0);
      to=now;
    } else if(period==='lastmonth'){
      from=new Date(now.getFullYear(),now.getMonth()-1,1,0,0,0);
      to=new Date(now.getFullYear(),now.getMonth(),0,23,59,59);
    } else if(period==='custom'){
      var deVal=document.getElementById('report-de').value;
      var ateVal=document.getElementById('report-ate').value;
      from = deVal ? new Date(deVal+'T00:00:00') : null;
      to = ateVal ? new Date(ateVal+'T23:59:59') : null;
    }
    return {from:from, to:to};
  }
  function collectReportRows(period,type){
    var range=resolveReportRange(period);
    function inRange(d){
      if(!range.from && !range.to) return true;
      var dt=new Date(d);
      if(isNaN(dt.getTime())) return false;
      if(range.from && dt<range.from) return false;
      if(range.to && dt>range.to) return false;
      return true;
    }
    var rows=[];
    if(type==='todas' || type==='simples'){
      SB.Simples.bets.forEach(function(b){
        if(!inRange(b.data)) return;
        var status=b.tipo==='green'?'Ganho':b.tipo==='red'?'Perda':b.tipo==='cashout'?'Cashout':'Live';
        rows.push({tipo:'Simples', data:b.data, desc:(b.desc||b.casa), detalhes:b.casa+' @'+Number(b.odd).toFixed(2), investido:b.aposta, retornado:(b.tipo==='red'?0:b.retorno), lucro:SB.Simples.luc(b), status:status});
      });
    }
    if(type==='todas' || type==='sure'){
      SB.Surebets.sure.forEach(function(op){
        var d=U.sureEventDate(op);
        if(!inRange(d)) return;
        var bs=SB.Surebets.sureBadgeStatus(op);
        var status=bs==='green'?'Ganho':bs==='red'?'Perda':'Preso';
        var lucro = op.tipo==='red' ? -op.investimento : op.lucroMin;
        rows.push({tipo:'Surebet', data:d, desc:(op.evento||'Surebet #'+op.id), detalhes:op.pernas.map(function(p){return p.casa;}).join(', '), investido:op.investimento, retornado:op.investimento+lucro, lucro:lucro, status:status});
      });
    }
    if(type==='todas' || type==='dg'){
      SB.DuploGreen.dg.forEach(function(op){
        var d=U.sureEventDate(op);
        if(!inRange(d)) return;
        var status=op.tipo==='green'?'Ganho':op.tipo==='red'?'Perda':'Ao vivo';
        var lucro=SB.DuploGreen.dgLucro(op);
        rows.push({tipo:'Duplo Green', data:d, desc:(op.evento||'Duplo Green #'+op.id), detalhes:op.pernas.map(function(p){return p.casa;}).join(', '), investido:op.investimento, retornado:op.investimento+lucro, lucro:lucro, status:status});
      });
    }
    rows.sort(function(a,b){return new Date(a.data)-new Date(b.data);});
    return rows;
  }
  function updateReportPreview(){
    var el=document.getElementById('report-preview');
    if(!el) return;
    var rows=collectReportRows(reportPeriod,reportType);
    if(!rows.length){ el.textContent='Nenhum registro encontrado nesse período/tipo.'; return; }
    var lucro=rows.reduce(function(s,r){return s+r.lucro;},0);
    el.innerHTML=rows.length+' registro(s) · '+reportPeriodLabel(reportPeriod)+' · Lucro no período: <strong style="color:'+(lucro>=0?'var(--emerald)':'var(--red)')+';">'+U.fmtMoney(lucro)+'</strong>';
  }
  function exportReportCSV(){
    var rows=collectReportRows(reportPeriod,reportType);
    if(!rows.length){ alert('Nenhum registro encontrado nesse período/tipo.'); return; }
    var out=[['Tipo','Data','Descrição','Casas','Investido','Retornado','Lucro','Status']];
    rows.forEach(function(r){
      out.push([r.tipo, U.fmtDataHora(r.data), r.desc, r.detalhes, r.investido.toFixed(2), r.retornado.toFixed(2), r.lucro.toFixed(2), r.status]);
    });
    downloadCSV(out,'relatorio-stakebet-'+reportPeriod);
  }
  function exportReportPDF(){
    var rows=collectReportRows(reportPeriod,reportType);
    if(!rows.length){ alert('Nenhum registro encontrado nesse período/tipo.'); return; }
    var investido=rows.reduce(function(s,r){return s+r.investido;},0);
    var lucro=rows.reduce(function(s,r){return s+r.lucro;},0);
    var roi=investido?lucro/investido*100:0;
    var lucroColor=lucro>=0?'#0a8a3f':'#c62828';
    var summary=H.sumCard('Registros',String(rows.length))+H.sumCard('Investido','R$ '+U.R2(investido))+H.sumCard('Lucro',U.fmtMoney(lucro),lucroColor)+H.sumCard('ROI',(roi>=0?'+':'')+roi.toFixed(2)+'%',lucroColor);
    var headers=['Tipo','Data','Descrição','Casas','Investido','Retornado','Lucro','Status'];
    var tableRows=rows.map(function(r){
      var statusColor=r.status==='Ganho'?'#0a8a3f':r.status==='Perda'?'#c62828':'#b8860b';
      return [r.tipo, U.fmtDataHora(r.data), r.desc, r.detalhes, r.investido.toFixed(2), r.retornado.toFixed(2), r.lucro.toFixed(2), '<span style="color:'+statusColor+';font-weight:700;">'+r.status+'</span>'];
    });
    printReport('Relatório — '+reportPeriodLabel(reportPeriod), summary, headers, tableRows);
  }
  function printReport(title,summaryHtml,headers,rows){
    var area=document.getElementById('print-area');
    if(!area){ alert('Não foi possível preparar o relatório. Recarregue a página e tente novamente.'); return; }
    var theadHtml='<tr>'+headers.map(function(h){return '<th style="border-bottom:2px solid #222;padding:8px 10px;text-align:left;background:#f7f7f7;font-size:9.5px;text-transform:uppercase;letter-spacing:0.03em;color:#555;">'+h+'</th>';}).join('')+'</tr>';
    var tbodyHtml=rows.map(function(r,i){
      var bg = i%2===0 ? '#fff' : '#fafafa';
      return '<tr style="background:'+bg+';">'+r.map(function(c){return '<td style="border-bottom:1px solid #eee;padding:7px 10px;text-align:left;">'+(c==null?'':c)+'</td>';}).join('')+'</tr>';
    }).join('');
    var logoImg='data:image/png;base64,'+U.LOGO_B64;
    area.innerHTML=
      '<div style="position:relative;font-family:Arial,Helvetica,sans-serif;color:#111;background:#fff;padding:30px 34px;overflow:visible;">'+
        '<div style="position:relative;z-index:1;">'+
          '<div style="display:flex;align-items:center;gap:16px;border-bottom:2px solid #eee;padding-bottom:18px;margin-bottom:20px;">'+
            '<img src="'+logoImg+'" style="width:58px;height:58px;border-radius:50%;box-shadow:0 0 0 1px #eee;">'+
            '<div style="flex:1;">'+
              '<div style="font-size:21px;font-weight:800;letter-spacing:-0.3px;">Stake<span style="color:#c99400;">Bet</span></div>'+
              '<div style="font-size:10px;color:#888;">Controle profissional de apostas</div>'+
            '</div>'+
            '<div style="text-align:right;font-size:10px;color:#999;">Gerado em<br><strong style="color:#555;">'+new Date().toLocaleString('pt-BR')+'</strong></div>'+
          '</div>'+
          '<h1 style="font-size:19px;margin:0 0 18px;font-weight:800;">'+title+'</h1>'+
          '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:26px;">'+summaryHtml+'</div>'+
          '<table style="width:100%;border-collapse:collapse;font-size:10.5px;">'+
            '<thead>'+theadHtml+'</thead><tbody>'+tbodyHtml+'</tbody>'+
          '</table>'+
          '<div style="margin-top:36px;padding-top:14px;border-top:1px solid #eee;text-align:center;font-size:9px;color:#aaa;">StakeBet — relatório gerado automaticamente</div>'+
        '</div>'+
      '</div>';
    setTimeout(function(){ window.print(); },150);
  }

  return {
    setReportPeriod: setReportPeriod, setReportType: setReportType,
    updateReportPreview: updateReportPreview,
    exportReportCSV: exportReportCSV, exportReportPDF: exportReportPDF,
    printReport: printReport, downloadCSV: downloadCSV
  };
})();
