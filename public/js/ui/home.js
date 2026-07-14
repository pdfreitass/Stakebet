window.SB = window.SB || {};

/* ══════════ SB.Home — Dashboard principal ══════════ */
window.SB.Home = (function() {
  var U = SB.Util, H = SB.Html;

  function updateHeaderBanca(){
    var stS=SB.Simples.statsSimples(), stU=SB.Surebets.statsSure(), stD=SB.DuploGreen.statsDG();
    document.getElementById('hb-val').textContent='R$ '+U.R2(stS.banca+stU.banca+stD.banca);
  }

  function renderHome(){
    updateHeaderBanca();
    var stS=SB.Simples.statsSimples(), stU=SB.Surebets.statsSure(), stD=SB.DuploGreen.statsDG();
    var total=stS.banca+stU.banca+stD.banca;
    U.animateCountUp(document.getElementById('home-total'), total, 'R$ ');
    document.getElementById('home-pie').innerHTML = H.pieChartHtml([
      {label:'Apostas Simples', value:stS.lucroTotal+stS.pendGain, color:'#818cf8'},
      {label:'Surebets', value:stU.lucroCompleto, color:'#22e88a'},
      {label:'Duplo Green', value:stD.lucroCompleto, color:'#fbbf24'}
    ]);
    document.getElementById('home-mod-simples').innerHTML=
      '<div class="mod-summary ind" onclick="SB.Nav.showTab(\'simples\')">'+
      '<div class="mod-head"><div class="mod-head-left">'+
        '<div class="mod-icon-box ind">'+ICO.list+'</div>'+
        '<div><div class="mod-title">Apostas Simples</div><div class="mod-desc">Gerencie suas apostas simples com precisão.</div></div>'+
      '</div>'+'<span class="mod-arrow">'+ICO.arrowRight+'</span></div>'+
      '<div class="mod-divider"></div>'+
      '<div class="mod-grid">'+
        '<div class="mod-item"><div class="mi-lbl">Banca</div><div class="mi-val">R$'+U.R2(stS.banca)+'</div></div>'+
        '<div class="mod-item"><div class="mi-lbl">Lucro</div><div class="mi-val" style="color:'+(stS.lucroTotal>=0?'var(--emerald)':'var(--red)')+(stS.lucroTotal>=0?';text-shadow:var(--emerald-glow);':'')+'">'+U.fmtMoney(stS.lucroTotal)+'</div></div>'+
        '<div class="mod-item"><div class="mi-lbl">Acerto</div><div class="mi-val" style="color:var(--indigo2);">'+stS.winRate.toFixed(1)+'%</div></div>'+
      '</div></div>';
    document.getElementById('home-mod-sure').innerHTML=
      '<div class="mod-summary em" onclick="SB.Nav.showTab(\'sure\')">'+
      '<div class="mod-head"><div class="mod-head-left">'+
        '<div class="mod-icon-box em">'+ICO.scale+'</div>'+
        '<div><div class="mod-title">Surebets</div><div class="mod-desc">Encontre e gerencie surebets de forma inteligente.</div></div>'+
      '</div>'+'<span class="mod-arrow">'+ICO.arrowRight+'</span></div>'+
      '<div class="mod-divider"></div>'+
      '<div class="mod-grid">'+
        '<div class="mod-item"><div class="mi-lbl">Banca</div><div class="mi-val">R$'+U.R2(stU.banca)+'</div></div>'+
        '<div class="mod-item"><div class="mi-lbl">Lucro</div><div class="mi-val" style="color:'+(stU.lucroGar>=0?'var(--emerald)':'var(--red)')+(stU.lucroGar>=0?';text-shadow:var(--emerald-glow);':'')+'">'+U.fmtMoney(stU.lucroGar)+'</div></div>'+
        '<div class="mod-item"><div class="mi-lbl">Preso</div><div class="mi-val" style="color:var(--amber);">R$'+U.R2(stU.preso)+'</div></div>'+
      '</div></div>';
    document.getElementById('home-mod-dg').innerHTML=
      '<div class="mod-summary gold" onclick="SB.Nav.showTab(\'dg\')">'+
      '<div class="mod-head"><div class="mod-head-left">'+
        '<div class="mod-icon-box gold">'+ICO.zap+'</div>'+
        '<div><div class="mod-title">Duplo Green</div><div class="mod-desc">Surebets com pagamento antecipado multiplicado.</div></div>'+
      '</div>'+'<span class="mod-arrow">'+ICO.arrowRight+'</span></div>'+
      '<div class="mod-divider"></div>'+
      '<div class="mod-grid">'+
        '<div class="mod-item"><div class="mi-lbl">Banca</div><div class="mi-val">R$'+U.R2(stD.banca)+'</div></div>'+
        '<div class="mod-item"><div class="mi-lbl">Lucro</div><div class="mi-val" style="color:'+(stD.lucroGar>=0?'var(--emerald)':'var(--red)')+(stD.lucroGar>=0?';text-shadow:var(--emerald-glow);':'')+'">'+U.fmtMoney(stD.lucroGar)+'</div></div>'+
        '<div class="mod-item"><div class="mi-lbl">Preso</div><div class="mi-val" style="color:var(--amber);">R$'+U.R2(stD.preso)+'</div></div>'+
      '</div></div>';
    var attnItems=[];
    stS.lives.forEach(function(b){
      attnItems.push({tag:'s',id:b.id,ts:b.data,title:(b.desc||b.casa),sub:b.casa+' • @'+Number(b.odd).toFixed(2),val:'R$'+U.R2(b.retorno-b.aposta),overdue:false});
    });
    stU.live.forEach(function(op){
      attnItems.push({tag:'b',id:op.id,ts:op.criada,title:(op.evento||'Surebet #'+op.id),sub:(op.dataFim?U.fmtDataHora(op.dataFim):'sem data')+' • '+op.pernas.length+' casas',val:U.fmtMoney(op.lucroMin),overdue:false});
    });
    stD.live.forEach(function(op){
      var overdue = !!(op.dataFim && new Date(op.dataFim)<=new Date());
      attnItems.push({tag:'d',id:op.id,ts:op.criada,title:(op.evento||'Duplo Green #'+op.id),sub:(op.dataFim?U.fmtDataHora(op.dataFim):'sem data')+' • '+op.pernas.length+' casas',val:U.fmtMoney(SB.DuploGreen.dgLucro(op)),overdue:overdue});
    });
    attnItems.sort(function(a,b){
      if(a.overdue!==b.overdue) return a.overdue?-1:1;
      return new Date(b.ts)-new Date(a.ts);
    });
    document.getElementById('home-attn').innerHTML = attnItems.length ? attnItems.map(function(it){
      var editCall = it.tag==='s' ? 'SB.Simples.editBet('+it.id+')' : it.tag==='b' ? 'SB.Surebets.editSure('+it.id+')' : 'SB.DuploGreen.editDG('+it.id+')';
      var tagLbl = it.tag==='s' ? 'Simples' : it.tag==='b' ? 'Surebet' : 'Duplo Green';
      var itemStyle = it.overdue ? ' style="border-color:var(--red-b);background:var(--red-bg);"' : '';
      var titleHtml = it.overdue ? ('⏰ <span style="color:var(--red);">Já terminou, confira!</span> — '+it.title) : it.title;
      return '<div class="attn-item"'+itemStyle+'><span class="attn-tag '+it.tag+'">'+tagLbl+'</span>'+
        '<div class="attn-body"><div class="attn-title">'+titleHtml+'</div><div class="attn-sub">'+it.sub+'</div></div>'+
        '<span class="attn-val">'+it.val+'</span>'+
        '<button class="xbtn" onclick="'+editCall+'" title="Editar" style="margin-left:2px;">✎</button></div>';
    }).join('') : H.emptyState(ICO.check,'Nada pendente. Tudo resolvido!');
  }

  function renderAll(){
    updateHeaderBanca();
    if(SB.Nav.curTab==='home') renderHome();
    else if(SB.Nav.curTab==='simples') SB.Simples.renderSimples();
    else if(SB.Nav.curTab==='sure') SB.Surebets.renderSure();
    else if(SB.Nav.curTab==='dg') SB.DuploGreen.renderDG();
  }

  return { updateHeaderBanca: updateHeaderBanca, renderHome: renderHome, renderAll: renderAll };
})();
