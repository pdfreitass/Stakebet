window.SB = window.SB || {};

/* ══════════ SB.DuploGreen — Duplo Green: CRUD + stats + render ══════════ */
window.SB.DuploGreen = (function() {
  var U = SB.Util, H = SB.Html, ST = SB.Store;
  var K = ST.KEYS.DG, TK = ST.KEYS.TRASH_DG;
  var dg = (function(){ var s = ST.load(K); return s || []; })();
  var dgnid = dg.length ? Math.max.apply(null, dg.map(function(o){return o.id;}))+1 : 1;
  var editingDGId = null;

  function saveDG(){ ST.save(K, dg); }
  function dgLucro(op){
    var recebidos=op.recebidos||[];
    var comissoes=op.comissoes||[];
    var totalNet=0;
    for(var i=0;i<recebidos.length;i++){
      var r=recebidos[i]||0;
      var c=comissoes[i]||0;
      totalNet += r*(1-c/100);
    }
    return totalNet-op.investimento;
  }
  function setDGStatus(id,status){
    dg.forEach(function(op){if(op.id===id) op.tipo=status;});
    saveDG(); renderDG(); SB.Home.renderHome();
  }
  function delDG(id){
    if(!confirm('Remover esta operação de Duplo Green? Ela vai pra lixeira, você pode restaurar depois em Configurações.'))return;
    var item=dg.filter(function(op){return op.id===id;})[0];
    dg=dg.filter(function(op){return op.id!==id;});
    saveDG();
    if(item){ item._deletedAt=new Date().toISOString(); SB.Lixeira.trashDG.push(item); SB.Lixeira.saveTrashDG(); }
    renderDG(); SB.Home.renderHome();
  }

  function statsDG(){
    var cicloInicio = SB.Config.cfg.cicloInicioDG;
    var inCycle = function(op){ return !cicloInicio || new Date(U.sureEventDate(op))>=new Date(cicloInicio); };
    var live=dg.filter(function(op){return op.tipo==='live';});
    var greenAll=dg.filter(function(op){return op.tipo==='green';});
    var redAll=dg.filter(function(op){return op.tipo==='red';});
    var green=greenAll.filter(inCycle), red=redAll.filter(inCycle);
    var preso=live.reduce(function(s,op){return s+op.investimento;},0);
    var lucroGar=live.concat(green).reduce(function(s,op){return s+dgLucro(op);},0);
    var perdaProblema=red.reduce(function(s,op){return s+op.investimento;},0);
    var settled=green.concat(red);
    var allSettled=greenAll.concat(redAll);
    var lucroRealizado=settled.reduce(function(s,op){return s+dgLucro(op);},0);
    var investedSettled=settled.reduce(function(s,op){return s+op.investimento;},0);
    var roi=investedSettled?lucroRealizado/investedSettled*100:0;
    var winRate=settled.length?green.length/settled.length*100:0;
    var banca=SB.Config.cfg.bancaDG+lucroRealizado;
    var sortedSettled=settled.slice().sort(function(a,b){return new Date(U.sureEventDate(a))-new Date(U.sureEventDate(b));});
    var eq=H.computeEquity(sortedSettled, SB.Config.cfg.bancaDG, function(op){ return dgLucro(op); });
    var monthProfit=lucroRealizado;
    var lucroCompleto=lucroRealizado+live.reduce(function(s,op){return s+dgLucro(op);},0);
    return {live:live,green:green,red:red,settled:settled,allSettled:allSettled,lucroGar:lucroGar,preso:preso,perdaProblema:perdaProblema,lucroCompleto:lucroCompleto,
      banca:banca,roi:roi,winRate:winRate,eq:eq,monthProfit:monthProfit,settledCount:settled.length};
  }

  function dgCard(op,ctx){
    ctx=ctx||'x';
    var st=op.tipo;
    var pill = st==='green' ? '<span class="pill pg">Ganhos</span>' : st==='red' ? '<span class="pill pr">Perdas</span>' : '<span class="pill pl">Ao vivo</span>';
    var lucro=dgLucro(op);
    var overdue = st==='live' && !!(op.dataFim && new Date(op.dataFim)<=new Date());
    var overdueBanner = overdue ? '<div style="background:var(--red-bg);border:1px solid var(--red-b);border-radius:8px;padding:8px 10px;margin-bottom:10px;font-size:11.5px;color:var(--red);font-weight:600;">⏰ Esse jogo já deveria ter terminado — confira o resultado e preencha o Recebido.</div>' : '';
    var legsHtml = op.pernas.map(function(p,i){
      var rec = (op.recebidos&&op.recebidos[i]!=null)?op.recebidos[i]:'';
      var com = (op.comissoes&&op.comissoes[i]!=null)?op.comissoes[i]:'';
      return '<div class="leg-row"><span class="leg-casa">'+p.casa+'</span><span class="leg-odd">@'+Number(p.odd).toFixed(2)+'</span><span class="leg-val">R$'+U.R2(p.valor)+'</span></div>'+
        '<div class="dg-rec-row">'+
          '<div class="field" style="margin-bottom:0;"><label>⚡ Recebido de '+p.casa+' (R$)</label><input type="number" step="0.01" min="0" value="'+rec+'" id="dgcardrec'+ctx+'_'+op.id+'_'+i+'" placeholder="0.00" inputmode="decimal"></div>'+
          '<div class="field" style="margin-bottom:0;width:76px;flex-shrink:0;"><label>Comissão %</label><input type="number" step="0.01" min="0" max="100" value="'+com+'" id="dgcardcom'+ctx+'_'+op.id+'_'+i+'" placeholder="0" inputmode="decimal"></div>'+
        '</div>';
    }).join('');
    var dataTxt = op.dataFim ? U.fmtDataHora(op.dataFim) : 'sem data definida';
    return '<div class="sure-card">'+
      '<div class="bc-top">'+pill+'<span class="bc-meta">'+(op.evento||('Duplo Green #'+op.id))+'</span>'+
      '<button class="xbtn" onclick="SB.DuploGreen.editDG('+op.id+')" title="Editar casas/odds" style="margin-right:4px;">✎</button>'+
      '<button class="xbtn" onclick="SB.DuploGreen.delDG('+op.id+')" title="Excluir">×</button></div>'+
      overdueBanner+
      (op.descricao?'<div class="bc-desc2">'+op.descricao+'</div>':'')+
      '<div class="sc-legs">'+legsHtml+'</div>'+
      '<button class="abtn ghost" style="margin-top:2px;margin-bottom:12px;padding:9px;font-size:12px;" onclick="SB.DuploGreen.saveDGResults('+op.id+',\''+ctx+'\')">'+ICO.check+' Salvar resultado</button>'+
      '<div class="bc-bottom">'+
        '<div class="bc-nums"><span class="bc-lbl">Investido</span><span class="bc-val">R$'+U.R2(op.investimento)+'</span></div>'+
        '<div class="bc-nums"><span class="bc-lbl">Recebido líquido</span><span class="bc-val bc-blue">R$'+U.R2(op.investimento+lucro)+'</span></div>'+
        '<div class="bc-nums"><span class="bc-lbl">Lucro</span><span class="bc-val" style="color:'+(lucro>=0?'var(--emerald)':'var(--red)')+';">'+(lucro>=0?'+':'−')+'R$'+U.R2(Math.abs(lucro))+'</span></div>'+
      '</div>'+
      (op.nota?'<div class="sc-nota">"'+op.nota+'"</div>':'')+
      '<div class="sc-actions">'+
        (st!=='green'?'<button class="mbtn mg" onclick="SB.DuploGreen.setDGStatus('+op.id+',\'green\')">Ganhos</button>':'')+
        (st!=='red'?'<button class="mbtn mr" onclick="SB.DuploGreen.setDGStatus('+op.id+',\'red\')">Perdas</button>':'')+
        (st!=='live'?'<button class="mbtn mu" onclick="SB.DuploGreen.setDGStatus('+op.id+',\'live\')">↺</button>':'')+
      '</div>'+
      '<div class="sc-stamp">'+dataTxt+' · registrada em '+U.fmtDataHora(op.criada)+'</div>'+
    '</div>';
  }

  function saveDGResults(id,ctx){
    ctx=ctx||'x';
    var op=dg.filter(function(x){return x.id===id;})[0];
    if(!op) return;
    var recebidos=[], comissoes=[];
    op.pernas.forEach(function(p,i){
      var recEl=document.getElementById('dgcardrec'+ctx+'_'+id+'_'+i);
      var comEl=document.getElementById('dgcardcom'+ctx+'_'+id+'_'+i);
      var r=recEl?parseFloat(recEl.value):NaN;
      var c=comEl?parseFloat(comEl.value):NaN;
      recebidos.push(isNaN(r)?0:r);
      comissoes.push(isNaN(c)?0:c);
    });
    op.recebidos=recebidos;
    op.comissoes=comissoes;
    saveDG();
    renderDG(); SB.Home.renderHome();
    U.showToast('Resultado salvo.',ICO.check);
  }

  function renderDG(){
    SB.Home.updateHeaderBanca();
    var st=statsDG();
    document.getElementById('dg-hero').innerHTML=
      '<div class="hero gold-hero">'+
      '<div class="hero-top"><div>'+
      '<div class="hero-label">'+ICO.zap+'Banca atual — duplo green</div>'+
      '<div class="hero-value '+(st.banca>=0?'pos':'neg')+'" id="dg-hero-value">R$ 0,00</div>'+
      '<div class="hero-meta">Lucro garantido (inclui ao vivo) <strong>'+U.fmtMoney(st.lucroGar)+'</strong> · Preso <strong>R$ '+U.R2(st.preso)+'</strong></div>'+
      '</div><div class="hero-icon">'+ICO.zap+'</div></div></div>';
    U.animateCountUp(document.getElementById('dg-hero-value'), st.banca, 'R$ ');
    document.getElementById('dg-stats').innerHTML=
      '<div class="stat-row">'+
      H.statCard(ICO.trendUp,'Lucro garantido',U.fmtMoney(st.lucroGar),st.lucroGar>=0?'vg':'vr','inclui operações ao vivo')+
      H.statCard(ICO.activity,'ROI (resolvidas)',(st.roi>=0?'+':'')+st.roi.toFixed(2)+'%',st.roi>=0?'vg':'vr',st.settledCount+' operação(ões) resolvida(s)')+
      H.statCard(ICO.lock,'Dinheiro preso',U.fmtMoney(st.preso).replace('−R$','R$'),'va',st.live.length+' ao vivo')+
      H.statCard(ICO.xcirc,'Perdas',U.fmtMoney(st.perdaProblema).replace('−R$','R$'),'vr',st.red.length+' operação(ões)')+
      '</div>';
    document.getElementById('dg-mini').innerHTML=
      '<div class="mini-row">'+
      H.miniStat(st.green.length,'Ganhos','g',ICO.check)+
      H.miniStat(st.red.length,'Perdas','r',ICO.xcirc)+
      H.miniStat(st.live.length,'Ao vivo','a',ICO.clock)+
      H.miniStat(st.green.length+st.red.length+st.live.length,'Total','b',ICO.layers)+
      '</div>';
    document.getElementById('dg-meta').innerHTML=H.metaCard(st.monthProfit, SB.Config.cfg.metaDG,'Meta deste ciclo');
    var presoPorCasa={}, ordemCasa=[];
    st.live.forEach(function(op){ op.pernas.forEach(function(p){
      if(ordemCasa.indexOf(p.casa)===-1){ordemCasa.push(p.casa);presoPorCasa[p.casa]=0;}
      presoPorCasa[p.casa]+=p.valor;
    }); });
    var maxCasaDG=Math.max.apply(null, ordemCasa.map(function(c){return presoPorCasa[c];}).concat([1]));
    document.getElementById('dg-breakdown').innerHTML = ordemCasa.length ? ordemCasa.map(function(c){
      return H.bkR(c,'var(--amber)','var(--amber-b)', U.pct(presoPorCasa[c],maxCasaDG), 'R$'+U.R2(presoPorCasa[c]), 'var(--amber)');
    }).join('') : H.emptyState(ICO.lock,'Nenhum valor preso agora.');
    var monthlyDG = H.monthlyBuckets(st.allSettled, function(op){return U.sureEventDate(op);}, function(op){return dgLucro(op);}, 6);
    document.getElementById('dg-monthly').innerHTML = H.monthlyBarsHtml(monthlyDG);
    document.getElementById('dg-live').innerHTML = st.live.length ? st.live.map(function(op){return dgCard(op,'live');}).join('') : H.emptyState(ICO.clock,'Nenhuma operação de Duplo Green ao vivo agora.');
    var filterCasaDG = document.getElementById('dg-filter-casa') ? document.getElementById('dg-filter-casa').value : '';
    var filterStatusDG = document.getElementById('dg-filter-status') ? document.getElementById('dg-filter-status').value : '';
    var searchDG = document.getElementById('dg-filter-search') ? document.getElementById('dg-filter-search').value.trim().toLowerCase() : '';
    var deDG = document.getElementById('dg-filter-de') ? document.getElementById('dg-filter-de').value : '';
    var ateDG = document.getElementById('dg-filter-ate') ? document.getElementById('dg-filter-ate').value : '';
    var sortDG = document.getElementById('dg-filter-sort') ? document.getElementById('dg-filter-sort').value : 'recentes';
    var histDG = dg.slice().filter(function(op){
      if(filterCasaDG && !op.pernas.some(function(p){return p.casa===filterCasaDG;})) return false;
      if(filterStatusDG && op.tipo!==filterStatusDG) return false;
      if(searchDG && (op.evento||'').toLowerCase().indexOf(searchDG)===-1 && (op.nota||'').toLowerCase().indexOf(searchDG)===-1 && (op.descricao||'').toLowerCase().indexOf(searchDG)===-1) return false;
      if(deDG && new Date(U.sureEventDate(op)) < new Date(deDG+'T00:00:00')) return false;
      if(ateDG && new Date(U.sureEventDate(op)) > new Date(ateDG+'T23:59:59')) return false;
      return true;
    }).sort(function(a,b){
      if(sortDG==='lucro_desc') return dgLucro(b)-dgLucro(a);
      if(sortDG==='lucro_asc') return dgLucro(a)-dgLucro(b);
      if(sortDG==='odd_desc') return (b.pernas[0]?b.pernas[0].odd:0)-(a.pernas[0]?a.pernas[0].odd:0);
      return new Date(U.sureEventDate(b))-new Date(U.sureEventDate(a));
    });
    document.getElementById('dg-hist').innerHTML = histDG.length ? histDG.map(function(op){return dgCard(op,'hist');}).join('') : H.emptyState(ICO.zap, dg.length?'Nenhuma operação encontrada com esse filtro.':'Nenhuma operação de Duplo Green registrada ainda.');
  }

  function registerDG(){
    var calc=SB.Surebets.calcSure('dg');
    if(!calc){ alert('Preencha as odds de todas as casas e o valor da Casa 1.'); return; }
    calc.legs.forEach(function(l){ SB.Casas.addCasaIfNew(l.casa); });
    var evento=document.getElementById('dgevento').value.trim();
    var descricao=document.getElementById('dgdescricao').value.trim();
    var dataFim=U.combineDateTime(document.getElementById('dgdata-date').value,document.getElementById('dgdata-time').value,false);
    var nota=document.getElementById('dgnota').value.trim();
    var n=SB.Surebets.legCounts['dg'];
    var recebidos=[], comissoes=[];
    for(var i=0;i<n;i++){
      var v=parseFloat(document.getElementById('dgrec'+i).value);
      recebidos.push(isNaN(v)?0:v);
      var c=parseFloat(document.getElementById('dgcom'+i).value);
      comissoes.push(isNaN(c)?0:c);
    }
    if(editingDGId){
      var op=dg.filter(function(x){return x.id===editingDGId;})[0];
      if(op){
        op.evento=evento; op.descricao=descricao; op.dataFim=dataFim; op.nota=nota;
        op.pernas=calc.legs; op.investimento=calc.investimento; op.recebidos=recebidos; op.comissoes=comissoes;
      }
      saveDG();
      U.showToast('Duplo Green atualizado.',ICO.check);
    } else {
      dg.push({
        id:dgnid++, evento:evento, descricao:descricao, dataFim:dataFim, criada:new Date().toISOString(), nota:nota,
        pernas:calc.legs, investimento:calc.investimento, recebidos:recebidos, comissoes:comissoes, tipo:'live'
      });
      saveDG();
      U.showToast('Duplo Green registrado.',ICO.check);
    }
    resetDGForm();
    SB.Nav.showTab('dg');
  }

  function editDG(id){
    var op=dg.filter(function(x){return x.id===id;})[0];
    if(!op) return;
    editingDGId=id;
    SB.Nav.setNovaTipo('dg');
    var n=op.pernas.length;
    SB.Surebets.setLegCount('dg',n);
    op.pernas.forEach(function(p,i){
      var casaSel=document.getElementById('dgcasa'+i);
      if(SB.Casas.casas.indexOf(p.casa)!==-1){ casaSel.value=p.casa; document.getElementById('dgoutrawrap'+i).style.display='none'; }
      else { casaSel.value='__x__'; document.getElementById('dgoutrawrap'+i).style.display='block'; document.getElementById('dgoutra'+i).value=p.casa; }
      document.getElementById('dgodd'+i).value=p.odd;
      var recEl=document.getElementById('dgrec'+i);
      if(recEl) recEl.value=(op.recebidos&&op.recebidos[i]!=null)?op.recebidos[i]:'';
      var comEl=document.getElementById('dgcom'+i);
      if(comEl) comEl.value=(op.comissoes&&op.comissoes[i]!=null)?op.comissoes[i]:'';
    });
    document.getElementById('dgvalor0').value=op.pernas[0].valor.toFixed(2);
    SB.Surebets.calcSure('dg');
    document.getElementById('dgevento').value=op.evento||'';
    document.getElementById('dgdescricao').value=op.descricao||'';
    var _ddt=U.splitToDateTime(op.dataFim);
    document.getElementById('dgdata-date').value=_ddt.date;
    document.getElementById('dgdata-time').value=_ddt.time;
    document.getElementById('dgnota').value=op.nota||'';
    document.getElementById('nova-submit-dg').innerHTML=ICO.check+' Salvar alterações';
    document.getElementById('edit-banner').style.display='block';
    SB.Nav.showTab('nova');
  }

  function resetDGForm(){
    editingDGId=null;
    document.getElementById('dgevento').value='';
    document.getElementById('dgdescricao').value='';
    document.getElementById('dgdata-date').value='';
    document.getElementById('dgdata-time').value='';
    document.getElementById('dgnota').value='';
    SB.Surebets.setLegCount('dg',2);
    document.getElementById('nova-submit-dg').innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><polyline points="17 6 21 12 17 18"></polyline><polyline points="7 6 3 12 7 18"></polyline></svg> Registrar Duplo Green';
    document.getElementById('edit-banner').style.display='none';
  }

  function exportCSVDG(){
    if(!dg.length){ alert('Ainda não há operações de Duplo Green registradas.'); return; }
    var rows=[['Registrada em','Evento','Descrição','Termina em','Casas (odd/investido/recebido)','Investido','Recebido total','Lucro','Status','Nota']];
    dg.slice().sort(function(a,b){return new Date(a.criada)-new Date(b.criada);}).forEach(function(op){
      var status = op.tipo==='green'?'Ganho':op.tipo==='red'?'Perda':'Ao vivo';
      var casasStr = op.pernas.map(function(p,i){ var r=(op.recebidos&&op.recebidos[i]!=null)?op.recebidos[i]:0; return p.casa+' @'+Number(p.odd).toFixed(2)+' (investido R$'+U.R2(p.valor)+', recebido R$'+U.R2(r)+')'; }).join(' | ');
      var lucro=dgLucro(op);
      rows.push([U.fmtDataHora(op.criada), op.evento||'', op.descricao||'', op.dataFim?U.fmtDataHora(op.dataFim):'', casasStr, op.investimento.toFixed(2), (op.investimento+lucro).toFixed(2), lucro.toFixed(2), status, op.nota||'']);
    });
    SB.Relatorios.downloadCSV(rows,'duplo-green');
  }

  function exportPDFDG(){
    if(!dg.length){ alert('Ainda não há operações de Duplo Green registradas.'); return; }
    var st=statsDG();
    var lucroColor = st.lucroGar>=0 ? '#0a8a3f' : '#c62828';
    var roiColor = st.roi>=0 ? '#0a8a3f' : '#c62828';
    var summary=H.sumCard('Banca atual','R$ '+U.R2(st.banca))+H.sumCard('Lucro garantido',U.fmtMoney(st.lucroGar),lucroColor)+H.sumCard('Dinheiro preso','R$ '+U.R2(st.preso))+H.sumCard('ROI (resolvidas)',(st.roi>=0?'+':'')+st.roi.toFixed(2)+'%',roiColor);
    var headers=['Registrada em','Evento','Casas (odd)','Investido','Recebido','Lucro','Status'];
    var rows=dg.slice().sort(function(a,b){return new Date(a.criada)-new Date(b.criada);}).map(function(op){
      var status=op.tipo==='green'?'Ganho':op.tipo==='red'?'Perda':'Ao vivo';
      var statusColor=op.tipo==='green'?'#0a8a3f':op.tipo==='red'?'#c62828':'#b8860b';
      var casasStr=op.pernas.map(function(p){return p.casa+' @'+Number(p.odd).toFixed(2);}).join(', ');
      var lucro=dgLucro(op);
      return [U.fmtDataHora(op.criada), op.evento||'—', casasStr, op.investimento.toFixed(2), (op.investimento+lucro).toFixed(2), lucro.toFixed(2), '<span style="color:'+statusColor+';font-weight:700;">'+status+'</span>'];
    });
    SB.Relatorios.printReport('Relatório de Duplo Green', summary, headers, rows);
  }

  return {
    dg: dg, dgnid: dgnid, editingDGId: editingDGId,
    saveDG: saveDG, dgLucro: dgLucro,
    setDGStatus: setDGStatus, delDG: delDG,
    statsDG: statsDG, renderDG: renderDG, dgCard: dgCard,
    saveDGResults: saveDGResults,
    registerDG: registerDG, editDG: editDG, resetDGForm: resetDGForm,
    exportCSVDG: exportCSVDG, exportPDFDG: exportPDFDG
  };
})();
