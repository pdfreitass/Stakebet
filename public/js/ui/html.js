window.SB = window.SB || {};

/* ══════════ SB.Html — Geradores de HTML (cards, gráficos, barras) ══════════ */
window.SB.Html = (function() {
  var U = SB.Util;

  function bkR(label,color,barColor,w,val,valColor){
    return '<div class="bk-row">'+
      '<div class="bk-left"><div class="bk-dot" style="background:'+color+'"></div><span class="bk-key">'+label+'</span></div>'+
      '<div class="bk-bar-wrap"><div class="bk-bar" style="width:'+Math.min(100,w)+'%;background:'+barColor+'"></div></div>'+
      '<span class="bk-val" style="color:'+valColor+'">'+val+'</span></div>';
  }
  function statCard(icon,label,value,valueClass,sub){
    return '<div class="stat"><div class="stat-head"><span class="stat-label">'+label+'</span><span class="stat-icon">'+icon+'</span></div>'+
      '<div class="stat-value '+(valueClass||'vw')+'">'+value+'</div>'+(sub?'<div class="stat-sub">'+sub+'</div>':'')+'</div>';
  }
  function miniStat(value,label,colorClass,icon){
    return '<div class="mini-stat"><span class="mini-ic '+colorClass+'">'+icon+'</span><div class="mini-val '+colorClass+'">'+value+'</div><div class="mini-lbl">'+label+'</div></div>';
  }
  function metaCard(current,target,label){
    var pctv = target>0 ? Math.min(100,Math.max(0,current/target*100)) : 0;
    var falta = target-current;
    var hit = target>0 && current>=target;
    var footRight = target<=0 ? 'defina uma meta em Configurações' : (falta>0 ? 'Faltam R$'+U.R2(falta) : 'Meta batida!');
    return '<div class="panel'+(hit?' goal-hit':'')+'"><div class="meta-head"><span class="meta-title">'+label+(hit?' <span class="goal-badge">'+ICO.check+' Batida</span>':'')+'</span><span class="meta-nums mono">'+U.fmtMoney(current)+' / R$ '+U.R2(target)+'</span></div>'+
      '<div class="meta-track"><div class="meta-fill'+(hit?' hit':'')+'" style="width:'+pctv.toFixed(1)+'%"></div></div>'+
      '<div class="meta-foot"><span>'+pctv.toFixed(1)+'% concluído</span><span'+(hit?' style="color:var(--emerald);font-weight:700;"':'')+'>'+footRight+'</span></div></div>';
  }
  function rankCard(mais,menos){
    return '<div class="panel">'+
     '<div class="rank-row"><span class="rank-ic ok">'+ICO.check+'</span><span class="rank-lbl">Casa mais lucrativa</span><span class="rank-val" style="color:var(--emerald);">'+(mais?mais[0]:'—')+'</span></div>'+
     '<div class="rank-row"><span class="rank-ic bad">'+ICO.xcirc+'</span><span class="rank-lbl">Casa menos lucrativa</span><span class="rank-val" style="color:var(--red);">'+(menos?menos[0]:'—')+'</span></div>'+
    '</div>';
  }
  function emptyState(icon,msg){
    return '<div class="empty">'+icon+'<div>'+msg+'</div></div>';
  }
  function monthlyBuckets(items,dateFn,lucroFn,monthsBack){
    var now=new Date();
    var buckets=[];
    for(var i=monthsBack-1;i>=0;i--){
      var d=new Date(now.getFullYear(), now.getMonth()-i, 1);
      buckets.push({key:d.getFullYear()+'-'+d.getMonth(), label:d.toLocaleDateString('pt-BR',{month:'short',year:'2-digit'}), total:0});
    }
    items.forEach(function(it){
      var d=new Date(dateFn(it));
      if(isNaN(d.getTime())) return;
      var key=d.getFullYear()+'-'+d.getMonth();
      for(var j=0;j<buckets.length;j++){ if(buckets[j].key===key){ buckets[j].total+=lucroFn(it); break; } }
    });
    return buckets;
  }
  function monthlyBarsHtml(buckets){
    var maxV=Math.max.apply(null, buckets.map(function(b){return Math.abs(b.total);}).concat([1]));
    var any = buckets.some(function(b){return b.total!==0;});
    if(!any) return emptyState(ICO.activity,'Sem dados suficientes nos últimos meses ainda.');
    return buckets.map(function(b){
      var color = b.total>=0 ? 'var(--emerald)' : 'var(--red)';
      var barColor = b.total>=0 ? 'var(--emerald-b)' : 'var(--red-b)';
      return bkR(b.label, color, barColor, U.pct(Math.abs(b.total),maxV), U.fmtMoney(b.total), color);
    }).join('');
  }
  function pieChartHtml(segments){
    var totalAbs = segments.reduce(function(s,d){return s+Math.abs(d.value);},0);
    var totalReal = segments.reduce(function(s,d){return s+d.value;},0);
    if(totalAbs<0.01){
      return emptyState(ICO.activity,'Registre e resolva operações pra ver de onde vem seu retorno.');
    }
    var acc=0;
    var stops=segments.map(function(s){
      var pct = totalAbs? Math.abs(s.value)/totalAbs*100 : 0;
      var color = s.value>=0 ? s.color : '#f87171';
      var start=acc; acc+=pct;
      return {color:color, start:start, end:acc, pct:pct};
    });
    var gradient = stops.filter(function(s){return s.pct>0;}).map(function(s){
      return s.color+' '+s.start.toFixed(2)+'% '+s.end.toFixed(2)+'%';
    }).join(', ');
    if(!gradient) gradient='var(--s3) 0% 100%';

    var legendHtml = segments.map(function(s,i){
      var pct = stops[i].pct;
      var color = s.value>=0 ? s.color : '#f87171';
      return '<div class="pie-legend-item">'+
        '<span class="pie-legend-dot" style="background:'+color+';"></span>'+
        '<span class="pie-legend-lbl">'+s.label+'</span>'+
        '<span class="pie-legend-val" style="color:'+color+';">'+U.fmtMoney(s.value)+'</span>'+
        '<span class="pie-legend-pct">'+pct.toFixed(0)+'%</span>'+
      '</div>';
    }).join('');

    return '<div class="pie-wrap">'+
      '<div class="pie-ring" style="background:conic-gradient('+gradient+');">'+
        '<div class="pie-hole"><div class="pie-hole-inner">'+
          '<div class="pie-hole-val" style="color:'+(totalReal>=0?'var(--emerald)':'var(--red)')+';">'+U.fmtMoney(totalReal)+'</div>'+
          '<div class="pie-hole-lbl">retorno total</div>'+
        '</div></div>'+
      '</div>'+
      '<div class="pie-legend">'+legendHtml+'</div>'+
    '</div>';
  }
  function computeEquity(itemsSorted,bancaInicial,lucroFn){
    var running=bancaInicial, peak=bancaInicial, maxDD=0;
    var curve=[bancaInicial];
    itemsSorted.forEach(function(it){
      running+=lucroFn(it);
      curve.push(running);
      if(running>peak) peak=running;
      var dd=peak-running;
      if(dd>maxDD) maxDD=dd;
    });
    return {curve:curve, drawdown:maxDD, final:running};
  }
  function sumCard(label,val,color){
    return '<div style="border:1px solid #e3e3e3;border-radius:10px;padding:12px 16px;min-width:130px;flex:1;background:#fafafa;">'+
      '<div style="font-size:9px;color:#888;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px;font-weight:600;">'+label+'</div>'+
      '<div style="font-size:18px;font-weight:800;color:'+(color||'#111')+';">'+val+'</div></div>';
  }
  function legResultBox(lucro,roiLeg,cenarioLabel){
    var color = lucro>=0 ? 'var(--emerald)' : 'var(--red)';
    return '<div class="leg-result-box">'+
      '<div class="lrb-title">'+(cenarioLabel||'Resultado')+'</div>'+
      '<div class="lrb-row"><span class="lrb-key">'+ICO.trendUp+' Lucro</span><span class="lrb-val" style="color:'+color+';">'+(lucro>=0?'+':'−')+'R$'+Math.abs(lucro).toFixed(2)+'</span></div>'+
      '<div class="lrb-row"><span class="lrb-key">'+ICO.activity+' ROI</span><span class="lrb-val" style="color:var(--indigo2);">'+roiLeg.toFixed(2)+'%</span></div>'+
    '</div>';
  }

  return {
    bkR: bkR, statCard: statCard, miniStat: miniStat,
    metaCard: metaCard, rankCard: rankCard, emptyState: emptyState,
    monthlyBuckets: monthlyBuckets, monthlyBarsHtml: monthlyBarsHtml,
    pieChartHtml: pieChartHtml, computeEquity: computeEquity,
    sumCard: sumCard, legResultBox: legResultBox
  };
})();
